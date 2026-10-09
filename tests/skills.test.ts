import { describe, expect, it } from 'vitest';
import { KEYS, SKILL_HOTKEYS } from '../src/data/keymap';
import { SKILL_PALETTE, SKILLS } from '../src/data/skills';
import { talkToKnight } from '../src/story/knight';
import type { TalkContext } from '../src/story/npcs';
import { Equipment } from '../src/systems/Equipment';
import { Inventory } from '../src/systems/Inventory';
import { Progress } from '../src/systems/Progress';
import { SkillBook } from '../src/systems/SkillBook';
import { CharacterStats } from '../src/systems/Stats';

describe('칼 던지기', () => {
  it('한손검 전용, 범위 1, 계수 1.3', () => {
    expect(SKILLS.throwSword).toMatchObject({ weapon: 'oneHandSword', range: 1, power: 1.3 });
  });

  it('아이콘이 12 x 12이고 팔레트에 있는 색만 쓴다', () => {
    for (const skill of Object.values(SKILLS)) {
      expect(skill.icon).toHaveLength(12);
      for (const row of skill.icon) {
        expect(row).toHaveLength(12);
        for (const c of row) if (c !== '.') expect(SKILL_PALETTE).toHaveProperty(c);
      }
    }
  });
});

describe('단축키', () => {
  it('QWERT, ASDFG 10칸이고 다른 조작키와 겹치지 않는다 (상태창은 P)', () => {
    expect(SKILL_HOTKEYS.map((h) => h.label).join('')).toBe('QWERTASDFG');
    const others = Object.values(KEYS).flat();
    for (const { code } of SKILL_HOTKEYS) expect(others).not.toContain(code);
    expect(KEYS.status).toEqual(['KeyP']);
    expect(KEYS.skills).toEqual(['KeyK']);
  });
});

describe('SkillBook', () => {
  it('배운 스킬만 칸에 놓을 수 있고, 같은 스킬은 한 칸에만 있다', () => {
    const book = new SkillBook();
    expect(book.bind('KeyQ', 'throwSword')).toBe(false);
    book.learn('throwSword');
    expect(book.bind('KeyQ', 'throwSword')).toBe(true);
    book.bind('KeyA', 'throwSword');
    expect(book.skillAt('KeyQ')).toBeNull();
    expect(book.skillAt('KeyA')).toBe('throwSword');
    expect(book.bind('KeyZ', 'throwSword')).toBe(false); // 단축키 칸이 아니다
  });

  it('칸끼리 옮기고, 밖으로 빼면 비운다', () => {
    const book = new SkillBook();
    book.learn('throwSword');
    book.bind('KeyQ', 'throwSword');
    book.move('KeyQ', 'KeyG');
    expect(book.skillAt('KeyQ')).toBeNull();
    expect(book.skillAt('KeyG')).toBe('throwSword');
    book.unbind('KeyG');
    expect(book.skillAt('KeyG')).toBeNull();
    expect(book.has('throwSword')).toBe(true); // 칸에서 빼도 배운 건 그대로
  });

  it('저장했다 불러오면 그대로이고, 없어진 스킬은 버린다', () => {
    const a = new SkillBook();
    a.learn('throwSword');
    a.bind('KeyE', 'throwSword');
    const b = new SkillBook();
    b.load(JSON.parse(JSON.stringify(a.toJSON())));
    expect(b.learnedIds).toEqual(['throwSword']);
    expect(b.skillAt('KeyE')).toBe('throwSword');
    b.load({ learned: ['deletedSkill'], hotkeys: { KeyQ: 'deletedSkill' } });
    expect(b.learnedIds).toEqual([]);
    expect(b.skillAt('KeyQ')).toBeNull();
  });
});

describe('레온하르트에게 칼 던지기 배우기', () => {
  /** 대사를 바로 넘기는 가짜 대화창 */
  const fakeDialog = () => {
    const lines: string[] = [];
    const dialog = {
      say: (_name: string, l: string[], then?: () => void) => { lines.push(...l); then?.(); },
      ask: () => {},
    };
    return { dialog, lines };
  };

  function setup(itemIds: string[]) {
    const stats = new CharacterStats();
    const inventory = new Inventory();
    const equipment = new Equipment(inventory, stats);
    const progress = new Progress();
    progress.starterGear = 'refused';
    itemIds.forEach((itemId) => {
      inventory.add({ itemId, count: 1 });
      equipment.equipFromInventory(0);
    });
    const skills = new SkillBook();
    const { dialog, lines } = fakeDialog();
    const ctx = { dialog, inventory, equipment, progress, skills } as unknown as TalkContext;
    return { ctx, skills, lines };
  }

  it('검·방패·상의·하의를 모두 입고 말을 걸면 배운다', () => {
    const { ctx, skills, lines } = setup(['starterSword', 'starterShield', 'starterShirt', 'starterPants']);
    talkToKnight(ctx);
    expect(skills.has('throwSword')).toBe(true);
    expect(lines.join(' ')).toContain('이제 좀 볼만하군');
  });

  it('하나라도 빠지면 배우지 못한다', () => {
    const { ctx, skills } = setup(['starterSword', 'starterShield', 'starterPants']);
    talkToKnight(ctx);
    expect(skills.has('throwSword')).toBe(false);
  });
});
