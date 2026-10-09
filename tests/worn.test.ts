import { describe, expect, it } from 'vitest';
import { padRows } from '../src/art/pixelArt';
import { PLAYER_CANVAS_PIXELS, PLAYER_FRAMES, PLAYER_PUNCH_TEXTURE } from '../src/art/playerArt';
import { WORN_ITEM_ART, wornPalette, wornRows } from '../src/art/wornItemArt';
import { ITEMS } from '../src/data/items';

const frames = Object.entries(PLAYER_FRAMES).map(([key, rows]) => [key, padRows(rows, PLAYER_CANVAS_PIXELS)] as const);
const shirt = WORN_ITEM_ART.starterShirt;
const pants = WORN_ITEM_ART.starterPants;

/** (x, y)가 옷으로 덮였는가 */
const covered = (worn: string[], x: number, y: number) => worn[y][x] !== '.';

describe('입은 옷 그림', () => {
  it('옷 그림이 있는 아이템은 실제로 있고, 상의/하의 종류가 맞다', () => {
    for (const [id, art] of Object.entries(WORN_ITEM_ART)) {
      expect(ITEMS, id).toHaveProperty(id);
      expect(ITEMS[id as keyof typeof ITEMS].kind).toBe(art.layer);
    }
  });

  describe.each(frames)('%s', (_key, rows) => {
    it('캐릭터 그림과 크기가 같고 팔레트에 있는 색만 쓴다', () => {
      for (const art of Object.values(WORN_ITEM_ART)) {
        const worn = wornRows(rows, art);
        expect(worn).toHaveLength(rows.length);
        for (const row of worn) {
          expect(row).toHaveLength(PLAYER_CANVAS_PIXELS);
          for (const c of row) if (c !== '.') expect(wornPalette(art)).toHaveProperty(c);
        }
      }
    });

    it('외곽선은 덮지 않는다', () => {
      for (const art of Object.values(WORN_ITEM_ART)) {
        const worn = wornRows(rows, art);
        rows.forEach((row, y) => [...row].forEach((c, x) => {
          if (c === 'K') expect(covered(worn, x, y)).toBe(false);
        }));
      }
    });

    it('바지를 입으면 팬티와 다리가 보이지 않는다', () => {
      const worn = wornRows(rows, pants);
      rows.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === 'U' || c === 'u' || (y >= 19 && (c === 'S' || c === 's'))) expect(covered(worn, x, y), `${x},${y}`).toBe(true);
      }));
    });
  });

  it('상의는 몸통과 팔을 덮고, 손과 얼굴은 그대로 둔다', () => {
    const idle = frames.find(([k]) => k === 'player-idle')![1];
    const worn = wornRows(idle, shirt);
    for (let y = 13; y <= 17; y++) {
      [...idle[y]].forEach((c, x) => {
        if (c === 'S' || c === 's') expect(covered(worn, x, y), `${x},${y}`).toBe(true);
      });
    }
    // 18줄의 손(S)은 그대로, 팬티 밴드는 밑단으로 덮는다
    [...idle[18]].forEach((c, x) => {
      if (c === 'S') expect(covered(worn, x, 18)).toBe(false);
      if (c === 'u') expect(covered(worn, x, 18)).toBe(true);
    });
    for (let y = 0; y < 13; y++) expect(worn[y]).toBe('.'.repeat(PLAYER_CANVAS_PIXELS));
  });

  it('주먹을 뻗을 때 주먹은 소매로 덮지 않는다', () => {
    const punch = frames.find(([k]) => k === PLAYER_PUNCH_TEXTURE)![1];
    const worn = wornRows(punch, shirt);
    for (const row of worn) expect(row.slice(19)).toBe('.'.repeat(PLAYER_CANVAS_PIXELS - 19));
  });
});
