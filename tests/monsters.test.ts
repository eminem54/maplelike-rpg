import { describe, expect, it } from 'vitest';
import { MONSTERS, statsAtLevel, type MonsterData, type Species } from '../src/data/monsters';
import { BIRD_MONSTERS } from '../src/data/monsters/bird';
import { MOUSE_MONSTERS } from '../src/data/monsters/mouse';

/** 종족 파일과 그 파일에 들어갈 species */
const GROUPS: [Record<string, MonsterData>, Species][] = [
  [BIRD_MONSTERS, 'bird'],
  [MOUSE_MONSTERS, 'mouse'],
];

const monsters = Object.values(MONSTERS) as MonsterData[];

describe('몬스터 데이터', () => {
  it('종족 파일끼리 키가 겹치지 않는다 (겹치면 합칠 때 하나가 사라진다)', () => {
    const total = GROUPS.reduce((n, [group]) => n + Object.keys(group).length, 0);
    expect(Object.keys(MONSTERS)).toHaveLength(total);
  });

  it('파일과 species가 맞다', () => {
    for (const [group, species] of GROUPS) {
      for (const m of Object.values(group)) expect(m.species, m.id).toBe(species);
    }
  });

  it('그림 프레임 이름이 몬스터끼리 겹치지 않는다', () => {
    const names = monsters.flatMap((m) => Object.keys(m.look.frames));
    expect(new Set(names).size).toBe(names.length);
  });

  it('다람쥐는 Lv.3~5, 경험치는 레벨과 같고 HP·데미지도 레벨마다 오른다', () => {
    const sq = MONSTERS.squirrel;
    expect(sq.level).toEqual({ min: 3, max: 5 });
    expect([3, 4, 5].map((lv) => statsAtLevel(sq, lv))).toEqual([
      { maxHp: 70, contactDamage: 7, exp: 3 },
      { maxHp: 80, contactDamage: 8, exp: 4 },
      { maxHp: 90, contactDamage: 9, exp: 5 },
    ]);
  });

  describe.each(monsters.map((m) => [m.id, m] as const))('%s', (id, m) => {
    it('키와 id가 같다', () => {
      expect(MONSTERS).toHaveProperty(id, m);
    });

    it('능력치가 말이 된다', () => {
      expect(m.level.min).toBeGreaterThanOrEqual(1);
      expect(m.level.max).toBeGreaterThanOrEqual(m.level.min);
      // 레벨 범위가 있으면 레벨마다 늘어나는 값이 있어야 한다
      if (m.level.max > m.level.min) expect(m.perLevel).toBeDefined();
      for (let lv = m.level.min; lv <= m.level.max; lv++) {
        const s = statsAtLevel(m, lv);
        expect(s.maxHp).toBeGreaterThan(0);
        expect(s.contactDamage).toBeGreaterThanOrEqual(0);
        expect(s.exp).toBeGreaterThan(0);
      }
      expect(m.chaseSpeed).toBeGreaterThanOrEqual(m.walkSpeed);
    });

    it('프레임 크기가 모두 같고 팔레트에 있는 색만 쓴다', () => {
      const frames = Object.values(m.look.frames);
      const [w, h] = [frames[0][0].length, frames[0].length];
      for (const rows of frames) {
        expect(rows).toHaveLength(h);
        for (const row of rows) {
          expect(row).toHaveLength(w);
          for (const c of row) if (c !== '.') expect(m.look.palette, `'${c}'`).toHaveProperty(c);
        }
      }
    });

    it('걷기 프레임이 실제로 있다', () => {
      for (const f of [...m.look.walk, ...m.look.angryWalk]) expect(m.look.frames).toHaveProperty(f);
    });
  });
});
