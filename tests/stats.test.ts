import { describe, expect, it } from 'vitest';
import {
  CharacterStats, deriveStats, expToNextLevel, MAX_BASE_STAT, MAX_LEVEL, START_PRIMARY, STAT_POINTS_PER_LEVEL,
} from '../src/systems/Stats';

describe('deriveStats', () => {
  it('시작 능력치: HP·MP 100, 공격력 10', () => {
    const d = deriveStats(START_PRIMARY);
    expect(d.maxHp).toBe(100);
    expect(d.maxMp).toBe(100);
    expect(d.attack).toBe(10);
  });

  it('STR은 공격력과 방어력을 올린다', () => {
    const base = deriveStats(START_PRIMARY);
    const d = deriveStats({ ...START_PRIMARY, str: START_PRIMARY.str + 3 });
    expect(d.attack).toBe(base.attack + 3);
    expect(d.defense).toBe(base.defense + 3);
    expect(d.maxHp).toBe(base.maxHp);
  });

  it('CON은 HP, WIS는 MP·주문속도·마법명중률을 올린다', () => {
    const base = deriveStats(START_PRIMARY);
    const d = deriveStats({ ...START_PRIMARY, con: START_PRIMARY.con + 1, wis: START_PRIMARY.wis + 1 });
    expect(d.maxHp).toBeGreaterThan(base.maxHp);
    expect(d.maxMp).toBeGreaterThan(base.maxMp);
    expect(d.castSpeed).toBeGreaterThan(base.castSpeed);
    expect(d.mhit).toBeGreaterThan(base.mhit);
  });

  it('DEX는 공격속도·명중·회피·크리티컬·이동속도를 올린다', () => {
    const base = deriveStats(START_PRIMARY);
    const d = deriveStats({ ...START_PRIMARY, dex: START_PRIMARY.dex + 2 });
    for (const k of ['attackSpeed', 'hit', 'evasion', 'crit', 'moveSpeed'] as const) {
      expect(d[k]).toBeGreaterThan(base[k]);
    }
    expect(d.attack).toBe(base.attack);
  });

  it('INT는 주문력, MEN은 주문 크리티컬만 올린다', () => {
    const base = deriveStats(START_PRIMARY);
    const d = deriveStats({ ...START_PRIMARY, int: START_PRIMARY.int + 1, men: START_PRIMARY.men + 1 });
    expect(d.spell).toBe(base.spell + 1);
    expect(d.spellCrit).toBeGreaterThan(base.spellCrit);
    expect(d.crit).toBe(base.crit);
  });
});

describe('CharacterStats', () => {
  it('HP·MP는 최대치로 시작한다', () => {
    const s = new CharacterStats();
    expect(s.hp).toBe(100);
    expect(s.mp).toBe(100);
  });

  it('기본 능력치는 999까지만 오른다', () => {
    const s = new CharacterStats();
    expect(s.addBasePoints('str', 2000)).toBe(MAX_BASE_STAT - START_PRIMARY.str);
    expect(s.base.str).toBe(999);
    expect(s.addBasePoints('str', 1)).toBe(0);
  });

  it('아이템 보너스는 최대치와 상관없이 더해진다', () => {
    const s = new CharacterStats();
    s.addBasePoints('str', 2000);
    s.bonus.str = 50;
    expect(s.primary.str).toBe(1049);
    expect(s.derived.attack).toBe(deriveStats({ ...START_PRIMARY, str: 1049 }).attack);
  });
});

describe('레벨', () => {
  const DUCK_EXP = 2;

  it('아기 오리 10마리를 잡으면 2레벨, 포인트 10개', () => {
    const s = new CharacterStats();
    for (let i = 0; i < 9; i++) s.gainExp(DUCK_EXP);
    expect(s.level).toBe(1);
    expect(s.gainExp(DUCK_EXP)).toBe(1);
    expect(s.level).toBe(2);
    expect(s.exp).toBe(0);
    expect(s.statPoints).toBe(STAT_POINTS_PER_LEVEL);
  });

  it('한 번에 여러 레벨이 오를 수 있고 남은 경험치는 이어진다', () => {
    const s = new CharacterStats();
    const gained = s.gainExp(expToNextLevel(1) + expToNextLevel(2) + 5);
    expect(gained).toBe(2);
    expect(s.level).toBe(3);
    expect(s.exp).toBe(5);
    expect(s.statPoints).toBe(STAT_POINTS_PER_LEVEL * 2);
  });

  it('레벨업하면 HP가 가득 찬다', () => {
    const s = new CharacterStats();
    s.hp = 10;
    s.gainExp(expToNextLevel(1));
    expect(s.hp).toBe(s.derived.maxHp);
  });

  it('999레벨에서 멈춘다', () => {
    const s = new CharacterStats();
    s.gainExp(Number.MAX_SAFE_INTEGER);
    expect(s.level).toBe(MAX_LEVEL);
    expect(s.exp).toBe(0);
    expect(s.gainExp(100)).toBe(0);
  });

  it('포인트를 찍으면 기본 능력치가 오르고, 최대치면 포인트를 쓰지 않는다', () => {
    const s = new CharacterStats();
    s.statPoints = 2;
    expect(s.spendStatPoint('str')).toBe(true);
    expect(s.base.str).toBe(START_PRIMARY.str + 1);
    expect(s.statPoints).toBe(1);
    s.base.dex = MAX_BASE_STAT;
    expect(s.spendStatPoint('dex')).toBe(false);
    expect(s.statPoints).toBe(1);
  });
});

describe('개발자 메뉴용 레벨 조작', () => {
  it('레벨 업은 일반 레벨업과 같다', () => {
    const s = new CharacterStats();
    s.levelUp();
    expect(s.level).toBe(2);
    expect(s.statPoints).toBe(STAT_POINTS_PER_LEVEL);
  });

  it('레벨을 내렸다 다시 올리면 포인트를 주지 않고, 최고 레벨을 넘으면 다시 준다', () => {
    const s = new CharacterStats();
    for (let i = 0; i < 4; i++) s.levelUp(); // 5레벨, 포인트 40
    s.spendStatPoint('str');
    s.setLevel(3);
    expect(s.level).toBe(3);
    expect(s.base.str).toBe(START_PRIMARY.str + 1); // 능력치는 그대로
    expect(s.statPoints).toBe(39);
    s.levelUp();
    s.levelUp(); // 다시 5레벨
    expect(s.statPoints).toBe(39);
    s.levelUp(); // 처음 도달하는 6레벨
    expect(s.statPoints).toBe(39 + STAT_POINTS_PER_LEVEL);
  });

  it('레벨은 1보다 내려가지 않는다', () => {
    const s = new CharacterStats();
    s.setLevel(0);
    expect(s.level).toBe(1);
  });

  it('전체 초기화', () => {
    const s = new CharacterStats();
    s.levelUp();
    s.spendStatPoint('dex');
    s.bonus.str = 3;
    s.reset();
    expect(s.level).toBe(1);
    expect(s.statPoints).toBe(0);
    expect(s.base).toEqual(START_PRIMARY);
    expect(s.bonus.str).toBe(0);
    s.levelUp();
    expect(s.statPoints).toBe(STAT_POINTS_PER_LEVEL); // 초기화 후에는 다시 포인트를 받는다
  });
});
