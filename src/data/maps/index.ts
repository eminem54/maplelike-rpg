import { FIELD_1 } from './field1';
import { FIELD_2 } from './field2';
import type { MapData } from './types';

export type * from './types';

/** 모든 맵. 새 맵은 파일을 만들고 여기에 추가한다. */
export const MAPS: Record<string, MapData> = Object.fromEntries([FIELD_1, FIELD_2].map((m) => [m.id, m]));

/** 처음 시작하는 맵 */
export const START_MAP_ID = FIELD_1.id;

/** 없는 맵이면(저장 후 맵이 지워졌거나 이름이 바뀜) 시작 맵을 준다 */
export function getMap(id: string): MapData {
  return MAPS[id] ?? MAPS[START_MAP_ID];
}
