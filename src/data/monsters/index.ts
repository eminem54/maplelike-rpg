import { BIRD_MONSTERS } from './bird';
import { MOUSE_MONSTERS } from './mouse';

export * from './types';

/** 모든 몬스터. 새 종족은 종족 이름으로 파일을 만들고 여기에 합친다. */
export const MONSTERS = { ...BIRD_MONSTERS, ...MOUSE_MONSTERS };

export type MonsterId = keyof typeof MONSTERS;
