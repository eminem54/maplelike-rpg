import Phaser from 'phaser';
import type { Climbable, MapData, PortalObject } from '../data/maps';
import type { Hittable } from '../entities/Hittable';
import { Npc } from '../entities/Npc';
import { Portal } from '../entities/Portal';
import { Sandbag } from '../entities/Sandbag';
import { NPCS, type NpcData } from '../story/npcs';
import type { SpawnSurface } from './MonsterSpawner';
import { Terrain } from './Terrain';

const PLATFORM_THICKNESS = 20;
const GRASS_THICKNESS = 14;

export type BuiltMap = {
  terrain: Terrain;
  /** 공중 발판. 아래에서 뚫고 올라갈 수 있다. 바닥은 Terrain이 따로 처리한다. */
  solids: Phaser.Physics.Arcade.StaticGroup;
  portals: { data: PortalObject; entity: Portal }[];
  npcs: { data: NpcData; entity: Npc }[];
  /** 몬스터가 아니면서 때릴 수 있는 것 (샌드백) */
  hittables: Hittable[];
  /** 몬스터가 나올 수 있는 곳 */
  spawnSurfaces: SpawnSurface[];
};

/** 맵 데이터대로 지형을 그리고 포탈, NPC 등을 배치한다 */
export function buildMap(scene: Phaser.Scene, map: MapData): BuiltMap {
  const terrain = new Terrain(map.terrain);
  const groundAt = (x: number) => terrain.heightAt(x);

  scene.physics.world.setBounds(0, 0, map.width, map.height);

  // 밧줄은 발판 뒤에 보이도록 먼저 그린다
  const g = scene.add.graphics();
  for (const c of map.climbables) drawClimbable(g, c);
  drawGround(scene.add.graphics(), map);

  const solids = scene.physics.add.staticGroup();
  for (const p of map.platforms) {
    const rect = scene.add.rectangle(
      p.x + p.w / 2, p.y + PLATFORM_THICKNESS / 2, p.w, PLATFORM_THICKNESS, 0x9b6b3d,
    );
    solids.add(rect);
    const b = rect.body as Phaser.Physics.Arcade.StaticBody;
    b.checkCollision.down = false;
    b.checkCollision.left = false;
    b.checkCollision.right = false;
  }

  const built: BuiltMap = {
    terrain,
    solids,
    portals: [],
    npcs: [],
    hittables: [],
    spawnSurfaces: [
      { left: map.spawnArea.left, right: map.spawnArea.right, yAt: groundAt },
      ...map.platforms.map((p) => ({ left: p.x, right: p.x + p.w, yAt: () => p.y })),
    ],
  };
  for (const o of map.objects) {
    const y = groundAt(o.x);
    switch (o.type) {
      case 'portal':
        built.portals.push({ data: o, entity: new Portal(scene, o.x, y) });
        break;
      case 'npc': {
        const data = NPCS[o.npcId];
        built.npcs.push({ data, entity: new Npc(scene, o.x, y, data.name, data.look, o.faceLeft ?? true) });
        break;
      }
      case 'sandbag':
        built.hittables.push(new Sandbag(scene, o.x, y));
        break;
    }
  }
  return built;
}

/** 흙을 채우고 윗면에 풀을 깐다 */
function drawGround(g: Phaser.GameObjects.Graphics, map: MapData) {
  const top = map.terrain.map(([x, y]) => new Phaser.Math.Vector2(x, y));
  g.fillStyle(0x7a5230);
  g.fillPoints([...top, new Phaser.Math.Vector2(map.width, map.height), new Phaser.Math.Vector2(0, map.height)], true);
  g.lineStyle(GRASS_THICKNESS, 0x4a8c3a);
  g.strokePoints(top.map((p) => new Phaser.Math.Vector2(p.x, p.y + GRASS_THICKNESS / 2)));
}

function drawClimbable(g: Phaser.GameObjects.Graphics, c: Climbable) {
  if (c.kind === 'rope') {
    g.fillStyle(0xc8a165);
    g.fillRect(c.x - 3, c.top, 6, c.bottom - c.top);
    return;
  }
  const half = 14;
  g.fillStyle(0x8a5a2b);
  g.fillRect(c.x - half - 3, c.top, 5, c.bottom - c.top);
  g.fillRect(c.x + half - 2, c.top, 5, c.bottom - c.top);
  for (let y = c.top + 12; y < c.bottom; y += 22) {
    g.fillRect(c.x - half, y, half * 2, 4);
  }
}
