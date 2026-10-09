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

export type ItemDef = {
  id: string;
  name: string;
  kind: ItemKind;
  /** 툴팁에 보여줄 세부 종류 (없으면 ITEM_KIND_LABEL) */
  typeLabel?: string;
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

export const ITEM_ICON_SCALE = 3;
export const itemTextureKey = (id: string) => `item-${id}`;

export const ITEM_PALETTE: Record<string, number> = {
  K: 0x2a1d10, // 외곽선
  W: 0xf4f7fa, // 칼날 빛
  B: 0xb8c4cf, // 강철
  b: 0x7d8a96, // 어두운 강철
  Y: 0xe0b23a, // 금속 장식
  H: 0x7a4a20, // 손잡이
  O: 0xa0682c, // 나무
  o: 0x7f4f1f, // 어두운 나무
};

export const ITEMS = {
  starterSword: {
    id: 'starterSword',
    name: '초보자용 검',
    kind: 'weapon',
    typeLabel: '한손검',
    stats: { attackMin: 5, attackMax: 10 },
    description: '근위기사단 신참들이 연습용으로 쓰는 검. 날이 무디다.',
    icon: [
      '.........KKK',
      '........KWBK',
      '.......KWBK.',
      '......KWBK..',
      '.....KWBK...',
      '....KWBK....',
      '.K.KWBK.....',
      'KYKKBK......',
      '.KYYK.......',
      '.KHKYK......',
      'KHK.K.......',
      'KK..........',
    ],
  },
  starterShield: {
    id: 'starterShield',
    name: '초보자용 방패',
    kind: 'shield',
    stats: { defense: 1, maxHp: 10 },
    description: '쇠테를 두른 둥근 나무 방패. 오리 부리 정도는 막아 준다.',
    icon: [
      '...KKKKKK...',
      '..KbbbbbbK..',
      '.KbOOoOOObK.',
      'KbOOOoOOOObK',
      'KbOOOKKOOObK',
      'KbOOKBBKOObK',
      'KbOOKBBKOObK',
      'KbOOOKKOOObK',
      'KbOOOoOOOObK',
      '.KbOOoOOObK.',
      '..KbbbbbbK..',
      '...KKKKKK...',
    ],
  },
} satisfies Record<string, ItemDef>;

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
