import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/items';
import { MONSTERS, type MonsterData } from '../src/data/monsters';
import { Inventory } from '../src/systems/Inventory';
import { rollLoot } from '../src/systems/Loot';

/** 정해진 값을 차례로 돌려주는 가짜 난수 */
const sequence = (...values: number[]) => () => values.shift() ?? 0;

describe('전리품', () => {
  it('골드는 범위 안에서 정해진다', () => {
    const sq = MONSTERS.squirrel;
    expect(rollLoot(sq, sequence(0, 1)).gold).toBe(sq.gold.min);
    expect(rollLoot(sq, sequence(0.9999, 1)).gold).toBe(sq.gold.max);
  });

  it('다람쥐는 확률에 따라 초보자용 상의·바지를 떨어뜨린다 (각각 따로 정한다)', () => {
    const [shirt, pants] = MONSTERS.squirrel.drops;
    expect(rollLoot(MONSTERS.squirrel, sequence(0, shirt.chance - 0.001, pants.chance - 0.001)).items)
      .toEqual(['starterShirt', 'starterPants']);
    expect(rollLoot(MONSTERS.squirrel, sequence(0, shirt.chance - 0.001, pants.chance)).items).toEqual(['starterShirt']);
    expect(rollLoot(MONSTERS.squirrel, sequence(0, shirt.chance, pants.chance)).items).toEqual([]);
  });

  it('오리는 확률에 따라 초보자용 방패를 떨어뜨린다', () => {
    const chance = MONSTERS.babyDuck.drops[0].chance;
    expect(rollLoot(MONSTERS.babyDuck, sequence(0, chance - 0.001)).items).toEqual(['starterShield']);
    expect(rollLoot(MONSTERS.babyDuck, sequence(0, chance)).items).toEqual([]);
  });

  it('모든 몬스터가 골드를 주고, 드랍 아이템은 실제로 있다', () => {
    for (const m of Object.values(MONSTERS) as MonsterData[]) {
      expect(m.gold.min, m.id).toBeGreaterThan(0);
      expect(m.gold.max, m.id).toBeGreaterThanOrEqual(m.gold.min);
      for (const d of m.drops ?? []) {
        expect(ITEMS, m.id).toHaveProperty(d.itemId);
        expect(d.chance).toBeGreaterThan(0);
        expect(d.chance).toBeLessThanOrEqual(1);
      }
    }
  });

  it('초보자용 바지는 방어력 2, 체력 30 / 상의는 방어력 3, 체력 50', () => {
    expect(ITEMS.starterPants).toMatchObject({ kind: 'bottom', stats: { defense: 2, maxHp: 30 } });
    expect(ITEMS.starterShirt).toMatchObject({ kind: 'top', stats: { defense: 3, maxHp: 50 } });
  });
});

describe('골드', () => {
  it('칸을 차지하지 않고 쌓이며, 초기화하면 0이 된다', () => {
    const inv = new Inventory(2);
    const v = inv.version;
    inv.addGold(3);
    inv.addGold(4);
    expect(inv.gold).toBe(7);
    expect(inv.version).toBeGreaterThan(v); // 인벤토리 창이 다시 그린다
    expect(inv.hasSpace).toBe(true);
    inv.clear();
    expect(inv.gold).toBe(0);
  });
});
