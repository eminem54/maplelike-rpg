import { PLAYER_BODY_PIXELS, PLAYER_PIXEL_SCALE } from '../art/playerArt';

/** 범위 1 = 플레이어 너비(px). 공격 범위, 효과 범위 등은 모두 이 단위로 정한다. */
export const RANGE_UNIT = PLAYER_BODY_PIXELS * PLAYER_PIXEL_SCALE;

export const toPixels = (range: number) => range * RANGE_UNIT;
