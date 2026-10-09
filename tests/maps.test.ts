import { describe, expect, it } from 'vitest';
import { MAPS, START_MAP_ID, type PortalObject } from '../src/data/maps';
import { NPCS } from '../src/story/npcs';

const maps = Object.values(MAPS);

describe('맵 데이터', () => {
  it('시작 맵이 있다', () => {
    expect(MAPS[START_MAP_ID]).toBeDefined();
  });

  describe.each(maps.map((m) => [m.id, m] as const))('%s', (_id, map) => {
    it('바닥이 왼쪽 끝부터 오른쪽 끝까지 이어진다', () => {
      const xs = map.terrain.map(([x]) => x);
      expect(xs[0]).toBe(0);
      expect(xs[xs.length - 1]).toBe(map.width);
      xs.slice(1).forEach((x, i) => expect(x).toBeGreaterThanOrEqual(xs[i]));
    });

    it('시작 위치와 오브젝트가 맵 안에 있다', () => {
      for (const x of [map.playerStartX, ...map.objects.map((o) => o.x)]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(map.width);
      }
    });

    it('포탈 id가 겹치지 않고, 이어진 맵과 포탈이 실제로 있다', () => {
      const portals = map.objects.filter((o): o is PortalObject => o.type === 'portal');
      expect(new Set(portals.map((p) => p.id)).size).toBe(portals.length);
      for (const { to } of portals) {
        if (!to) continue;
        const target = MAPS[to.map];
        expect(target, `${map.id} → ${to.map}`).toBeDefined();
        expect(target.objects.some((o) => o.type === 'portal' && o.id === to.portal), `${to.map}의 ${to.portal}`).toBe(true);
      }
    });

    it('NPC가 등록되어 있다', () => {
      for (const o of map.objects) if (o.type === 'npc') expect(NPCS[o.npcId]).toBeDefined();
    });
  });
});
