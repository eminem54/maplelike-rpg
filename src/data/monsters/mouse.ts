import { SQUIRREL_LOOK } from '../../art/squirrelArt';
import type { MonsterData } from './types';

/** 설치류 (species: 'mouse') */
export const MOUSE_MONSTERS = {
  squirrel: {
    id: 'squirrel',
    name: '다람쥐',
    species: 'mouse',
    // Lv.3 / 4 / 5 → HP 70 / 80 / 90, 데미지 7 / 8 / 9, 경험치 3 / 4 / 5
    level: { min: 3, max: 5 },
    stats: { maxHp: 70, contactDamage: 7, exp: 3 },
    perLevel: { maxHp: 10, contactDamage: 1, exp: 1 },
    gold: { min: 3, max: 6 },
    drops: [
      { itemId: 'starterShirt', chance: 0.1 },
      { itemId: 'starterPants', chance: 0.1 },
    ],
    walkSpeed: 60, // 오리보다 조금 빠르다
    chaseSpeed: 85,
    look: SQUIRREL_LOOK,
  },
} satisfies Record<string, MonsterData>;
