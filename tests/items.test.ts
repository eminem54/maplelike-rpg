import { describe, expect, it } from 'vitest';
import { HELD_ITEM_ART } from '../src/art/heldItemArt';
import { ITEM_PALETTE, ITEMS, type ItemDef, type ItemKind } from '../src/data/items';
import { BOTTOMS } from '../src/data/items/bottoms';
import { SHIELDS } from '../src/data/items/shields';
import { TOPS } from '../src/data/items/tops';
import { WEAPONS } from '../src/data/items/weapons';

/** 종류별 파일과 그 파일에 들어갈 kind */
const GROUPS: [Record<string, ItemDef>, ItemKind][] = [
  [WEAPONS, 'weapon'],
  [SHIELDS, 'shield'],
  [TOPS, 'top'],
  [BOTTOMS, 'bottom'],
];

describe('아이템 데이터', () => {
  it('종류별 파일끼리 키가 겹치지 않는다 (겹치면 합칠 때 하나가 사라진다)', () => {
    const total = GROUPS.reduce((n, [group]) => n + Object.keys(group).length, 0);
    expect(Object.keys(ITEMS)).toHaveLength(total);
  });

  it('파일과 kind가 맞다', () => {
    for (const [group, kind] of GROUPS) {
      for (const def of Object.values(group)) expect(def.kind, def.id).toBe(kind);
    }
  });

  describe.each(Object.entries(ITEMS))('%s', (key, def: ItemDef) => {
    it('키와 id가 같다', () => {
      expect(def.id).toBe(key);
    });

    it('아이콘이 12 x 12이고 팔레트에 있는 색만 쓴다', () => {
      expect(def.icon).toHaveLength(12);
      for (const row of def.icon) {
        expect(row).toHaveLength(12);
        for (const c of row) if (c !== '.') expect(ITEM_PALETTE, `'${c}'`).toHaveProperty(c);
      }
    });
  });

  it('손에 든 그림은 있는 아이템에만 있다', () => {
    for (const id of Object.keys(HELD_ITEM_ART)) expect(ITEMS).toHaveProperty(id);
  });
});
