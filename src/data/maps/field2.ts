import { MONSTERS } from '../monsters';
import type { MapData } from './types';

// 맵 이동을 확인하려고 만든 임시 맵. 지형과 발판을 채워서 쓴다. 조금 빠른 다람쥐가 나온다.
export const FIELD_2: MapData = {
  id: 'field2',
  name: '두 번째 맵 (임시)',
  width: 2400,
  height: 720,
  terrain: [
    [0, 660], [900, 660],
    [980, 620], [1180, 620], [1260, 660], // 완만한 언덕
    [2400, 660],
  ],
  platforms: [{ x: 1500, y: 560, w: 240 }],
  climbables: [],
  objects: [
    { type: 'portal', id: 'west', x: 80, to: { map: 'field1', portal: 'east' } },
    { type: 'portal', id: 'east', x: 2320 }, // 아직 갈 곳이 없다
  ],
  playerStartX: 200,
  spawns: [{ monster: MONSTERS.squirrel, maxCount: 8, intervalMs: 20_000 }],
  spawnArea: { left: 300, right: 2100 },
};
