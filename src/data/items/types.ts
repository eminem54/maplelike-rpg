/** 장착하면 더해지는 능력치 */
export type ItemStats = {
  /** 무기 공격력 범위 */
  attackMin?: number;
  attackMax?: number;
  defense?: number;
  maxHp?: number;
};

/** 장비 종류. 장비창의 어느 칸에 끼울 수 있는지 정한다 (data/equipment.ts). */
export type ItemKind =
  | 'helmet' | 'top' | 'bottom' | 'weapon' | 'shield' | 'boots'
  | 'gloves' | 'belt' | 'ring' | 'earring' | 'special';

/** 무기 종류. 스킬마다 쓸 수 있는 무기가 정해져 있다. */
export type WeaponType = 'oneHandSword';

export type ItemDef = {
  id: string;
  name: string;
  kind: ItemKind;
  /** 툴팁에 보여줄 세부 종류 (없으면 ITEM_KIND_LABEL) */
  typeLabel?: string;
  /** 무기일 때 무기 종류 */
  weaponType?: WeaponType;
  stats: ItemStats;
  description: string;
  /** 12 x 12 픽셀 아이콘 (ITEM_PALETTE 사용) */
  icon: string[];
};

export const ITEM_KIND_LABEL: Record<ItemKind, string> = {
  helmet: '투구',
  top: '상의',
  bottom: '하의',
  weapon: '무기',
  shield: '방패',
  boots: '장화',
  gloves: '장갑',
  belt: '벨트',
  ring: '반지',
  earring: '귀걸이',
  special: '특수장비',
};
