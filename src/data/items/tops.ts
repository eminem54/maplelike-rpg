import type { ItemDef } from './types';

/** 상의 (kind: 'top') */
export const TOPS = {
  starterShirt: {
    id: 'starterShirt',
    name: '초보자용 상의',
    kind: 'top',
    stats: { defense: 3, maxHp: 50 },
    description: '두툼한 무명 티셔츠. 다람쥐 발톱 정도는 막아 준다.',
    icon: [
      '............',
      '..KKK..KKK..',
      '.KDDDKKDDDK.',
      'KDDDDDDDDDDK',
      'KDDDDDDDDDDK',
      'KdKDDDDDDKdK',
      '.KKDDDDDDKK.',
      '..KDDDDDDK..',
      '..KDDDDDDK..',
      '..KDDDDDDK..',
      '..KddddddK..',
      '..KKKKKKKK..',
    ],
  },
} satisfies Record<string, ItemDef>;
