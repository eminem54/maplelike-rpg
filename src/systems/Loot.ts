import type { ItemId } from '../data/items';
import type { MonsterData } from '../data/monsters';

export type Loot = { gold: number; items: ItemId[] };

/** 몬스터를 쓰러뜨렸을 때 얻는 골드와 떨어지는 아이템을 정한다. random은 0 이상 1 미만. */
export function rollLoot(data: MonsterData, random: () => number = Math.random): Loot {
  const { min, max } = data.gold;
  const gold = min + Math.floor(random() * (max - min + 1));
  const items = (data.drops ?? []).filter((d) => random() < d.chance).map((d) => d.itemId);
  return { gold, items };
}
