import type { ItemKind } from './items';

/** 장비창 13칸. col/row는 장비창 안의 자리 (3열, 몸 위치에 맞춘 배치) */
export const EQUIP_SLOTS = [
  { id: 'earring1', label: '귀걸이', kind: 'earring', col: 0, row: 0 },
  { id: 'helmet', label: '투구', kind: 'helmet', col: 1, row: 0 },
  { id: 'earring2', label: '귀걸이', kind: 'earring', col: 2, row: 0 },
  { id: 'weapon', label: '무기', kind: 'weapon', col: 0, row: 1 },
  { id: 'top', label: '상의', kind: 'top', col: 1, row: 1 },
  { id: 'shield', label: '방패', kind: 'shield', col: 2, row: 1 },
  { id: 'ring1', label: '반지', kind: 'ring', col: 0, row: 2 },
  { id: 'bottom', label: '하의', kind: 'bottom', col: 1, row: 2 },
  { id: 'ring2', label: '반지', kind: 'ring', col: 2, row: 2 },
  { id: 'gloves', label: '장갑', kind: 'gloves', col: 0, row: 3 },
  { id: 'belt', label: '벨트', kind: 'belt', col: 1, row: 3 },
  { id: 'boots', label: '장화', kind: 'boots', col: 2, row: 3 },
  { id: 'special', label: '특수장비', kind: 'special', col: 1, row: 4 },
] as const satisfies readonly { id: string; label: string; kind: ItemKind; col: number; row: number }[];

export type EquipSlotId = (typeof EQUIP_SLOTS)[number]['id'];
