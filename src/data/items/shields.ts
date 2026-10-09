import type { ItemDef } from './types';

/** 방패 (kind: 'shield') */
export const SHIELDS = {
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
