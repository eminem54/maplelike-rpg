import type { SpawnRule } from '../../systems/MonsterSpawner';
import type { TerrainPoint } from '../../systems/Terrain';
import type { NpcId } from '../../story/npcs';

/** 공중 발판. y는 윗면 좌표. 메이플처럼 아래에서 뚫고 올라갈 수 있다. */
export type Platform = { x: number; y: number; w: number };

/** 밧줄/사다리. x는 중심, top~bottom 구간을 오르내린다. */
export type Climbable = { kind: 'rope' | 'ladder'; x: number; top: number; bottom: number };

/** 빛 기둥. to가 가리키는 맵의 포탈 위로 이동한다. to가 없으면 아직 갈 수 없는 곳이다. */
export type PortalObject = { type: 'portal'; id: string; x: number; to?: { map: string; portal: string } };

/** 맵에 놓이는 것들. 모두 x 위치의 바닥 위에 선다. */
export type MapObject =
  | PortalObject
  | { type: 'npc'; npcId: NpcId; x: number; faceLeft?: boolean }
  | { type: 'sandbag'; x: number };

export type MapData = {
  /** MAPS에 등록하는 이름. 포탈과 저장 데이터가 이 값으로 맵을 찾는다. */
  id: string;
  name: string;
  width: number;
  height: number;
  /** 바닥 꺾은선 [x, y]. 완만한 경사는 걸어서, 가파른 곳은 점프해서 넘는다. 마지막 x는 width와 같아야 한다. */
  terrain: TerrainPoint[];
  platforms: Platform[];
  climbables: Climbable[];
  objects: MapObject[];
  /** 포탈을 타지 않고 들어왔을 때(처음 시작, 불러오기) 서는 위치 */
  playerStartX: number;
  /** 몬스터 출현 규칙. 규칙마다 따로 수를 채우고, spawnArea 구간의 바닥과 모든 발판 위에서 나온다. */
  spawns: SpawnRule[];
  spawnArea: { left: number; right: number };
};
