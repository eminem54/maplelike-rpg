import type { ItemDef } from './types';

/** 무기 (kind: 'weapon') */
export const WEAPONS = {
  starterSword: {
    id: 'starterSword',
    name: '초보자용 검',
    kind: 'weapon',
    typeLabel: '한손검',
    weaponType: 'oneHandSword',
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
} satisfies Record<string, ItemDef>;
