import { BOTTOMS } from './bottoms';
import { SHIELDS } from './shields';
import { TOPS } from './tops';
import type { ItemDef, ItemStats } from './types';
import { WEAPONS } from './weapons';

export * from './icon';
export * from './types';

/** 모든 아이템. 새 종류는 파일을 만들고 여기에 합친다. 키는 저장 데이터에 쓰이므로 바꾸지 않는다. */
export const ITEMS = { ...WEAPONS, ...SHIELDS, ...TOPS, ...BOTTOMS };

export type ItemId = keyof typeof ITEMS;

export function getItem(id: string): ItemDef | undefined {
  return (ITEMS as Record<string, ItemDef>)[id];
}

/** 툴팁에 보여줄 능력치 줄 */
export function describeStats(stats: ItemStats): string[] {
  const lines: string[] = [];
  if (stats.attackMin !== undefined) lines.push(`공격력 ${stats.attackMin} ~ ${stats.attackMax ?? stats.attackMin}`);
  if (stats.defense) lines.push(`방어력 +${stats.defense}`);
  if (stats.maxHp) lines.push(`체력 +${stats.maxHp}`);
  return lines;
}
