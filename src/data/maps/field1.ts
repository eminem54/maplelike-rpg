import { MONSTERS } from '../monsters';
import type { MapData } from './types';

// 플레이어 점프 높이는 약 120px. 점프로 넘는 언덕은 그보다 낮게(70~80) 만든다.
export const FIELD_1: MapData = {
  id: 'field1',
  name: '아기 오리 들판',
  width: 3200,
  height: 720,
  terrain: [
    [0, 590], [520, 590], // 시작 언덕 (조금 높다)
    [660, 660], // 내리막
    [880, 660], [960, 630], [1040, 630], [1120, 660], // 오리도 넘는 완만한 언덕
    [1280, 660], [1300, 580], [1440, 580], [1460, 660], // 점프로 넘는 언덕 (높이 80)
    [1640, 660], [1720, 620], [1800, 620], [1880, 660], // 완만한 언덕
    [2060, 660], [2080, 590], [2220, 590], [2240, 660], // 점프로 넘는 언덕 (높이 70)
    [2380, 660], [2460, 635], [2540, 635], [2620, 660], // 완만한 언덕
    [3200, 660], // 기사와 빛 기둥이 있는 평지
  ],
  platforms: [
    { x: 700, y: 560, w: 240 }, // A: 바닥에서 100 → 점프
    { x: 1120, y: 430, w: 260 }, // B: 밧줄
    { x: 1450, y: 340, w: 240 }, // C: B에서 90 → 점프
    { x: 1940, y: 470, w: 320 }, // D: 사다리
    { x: 2200, y: 260, w: 300 }, // E: D에서 밧줄
  ],
  climbables: [
    { kind: 'rope', x: 1200, top: 430, bottom: 660 },
    { kind: 'ladder', x: 1990, top: 470, bottom: 660 },
    { kind: 'rope', x: 2230, top: 260, bottom: 470 }, // D(~2260)와 E(2200~)가 겹치는 자리
  ],
  objects: [
    { type: 'sandbag', x: 330 },
    { type: 'npc', npcId: 'knight', x: 2900 },
    { type: 'portal', id: 'east', x: 3120, to: { map: 'field2', portal: 'west' } },
  ],
  playerStartX: 60, // 왼쪽 끝에서 약간 띄워서 시작
  spawns: [{ monster: MONSTERS.babyDuck, maxCount: 10, intervalMs: 20_000 }],
  spawnArea: { left: 680, right: 2720 },
};
