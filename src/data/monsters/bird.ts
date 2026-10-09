import { DUCK_LOOK } from '../../art/duckArt';
import type { MonsterData } from './types';

/** 조류 (species: 'bird') */
export const BIRD_MONSTERS = {
  babyDuck: {
    id: 'babyDuck',
    name: '아기 오리',
    species: 'bird',
    level: { min: 1, max: 1 },
    stats: { maxHp: 50, contactDamage: 5, exp: 2 },
    gold: { min: 1, max: 3 },
    drops: [{ itemId: 'starterShield', chance: 0.1 }],
    walkSpeed: 40, // 뒤뚱뒤뚱 느리게 (플레이어 260)
    chaseSpeed: 55, // 화나면 아주 약간 빨라진다
    look: DUCK_LOOK,
  },
} satisfies Record<string, MonsterData>;
