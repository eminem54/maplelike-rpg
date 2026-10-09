import type { ItemDef } from './types';

/** 하의 (kind: 'bottom') */
export const BOTTOMS = {
  starterPants: {
    id: 'starterPants',
    name: '초보자용 바지',
    kind: 'bottom',
    stats: { defense: 2, maxHp: 30 },
    description: '질긴 천으로 만든 파란 바지. 이제 팬티 바람으로 다니지 않아도 된다.',
    icon: [
      '............',
      '.KKKKKKKKKK.',
      '.KHHHYYHHHK.',
      '.KKKKKKKKKK.',
      '.KCCCCCCCCK.',
      '.KCCCCCCCCK.',
      '.KCCCKKCCCK.',
      '.KCcCKKCcCK.',
      '.KCcCKKCcCK.',
      '.KCcCKKCcCK.',
      '.KCCCKKCCCK.',
      '.KKKKKKKKKK.',
    ],
  },
} satisfies Record<string, ItemDef>;
