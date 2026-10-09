// 캐릭터가 입은 옷 그림. 자세마다 따로 그리지 않고, 캐릭터 그림(24 x 24, 오른쪽을 보는 모습)에서
// 옷이 덮는 피부·팬티 칸을 옷 색으로 바꿔 만든다. 옷이 아닌 칸은 투명('.')이라 캐릭터 위에 겹쳐 그린다.

/** 옷이 덮는 부위. 상의가 하의 위에 그려진다 (상의 밑단이 허리띠를 덮는다). */
export type WornLayer = 'top' | 'bottom';

export type WornArt = {
  layer: WornLayer;
  /** 옷 색: main = 밝은 쪽, shade = 그림자 쪽(먼 쪽 다리·팔), trim = 허리띠 */
  colors: { main: number; shade: number; trim: number };
};

/** 장착하면 몸에 보이는 아이템 (itemId → 그림) */
export const WORN_ITEM_ART: Record<string, WornArt> = {
  starterShirt: { layer: 'top', colors: { main: 0xf2efe6, shade: 0xc9c3b3, trim: 0xf2efe6 } },
  starterPants: { layer: 'bottom', colors: { main: 0x4a6fb5, shade: 0x34508a, trim: 0x7a4a20 } },
};

/** 옷 그림 팔레트. 문자는 캐릭터 팔레트와 겹치지 않게 따로 쓴다. */
export const wornPalette = ({ colors }: WornArt): Record<string, number> => ({
  A: colors.main,
  a: colors.shade,
  T: colors.trim,
});

// 캐릭터 그림의 줄 번호 (머리 0~11, 몸 12~23)
const SLEEVE_TOP = 13; // 어깨
const SHIRT_BOTTOM = 18; // 상의 밑단 (팬티 밴드 줄)
const PANTS_TOP = 18; // 허리띠
const LEG_TOP = 19; // 이 줄부터 다리 피부를 바지로 덮는다
const LEG_BOTTOM = 22;
/** 이 칸부터는 앞으로 뻗은 주먹이라 소매로 덮지 않는다 */
const FIST_COL = 19;

/** 캐릭터 그림 한 장에서 옷 부분만 뽑는다 */
export function wornRows(playerRows: string[], art: WornArt): string[] {
  return playerRows.map((row, y) =>
    [...row].map((ch, x) => (art.layer === 'top' ? shirtPixel(ch, x, y) : pantsPixel(ch, y))).join(''),
  );
}

function shirtPixel(ch: string, x: number, y: number) {
  if (y === SHIRT_BOTTOM && ch === 'u') return 'A'; // 팬티 밴드를 밑단으로 덮는다 (손은 그대로)
  if (y < SLEEVE_TOP || y >= SHIRT_BOTTOM || x >= FIST_COL) return '.';
  if (ch === 'S') return 'A';
  if (ch === 's') return 'a';
  return '.';
}

function pantsPixel(ch: string, y: number) {
  if (y === PANTS_TOP) return ch === 'u' ? 'T' : '.'; // 허리띠 (같은 줄의 손은 그대로)
  if (y < LEG_TOP || y > LEG_BOTTOM) return '.';
  if (ch === 'U' || ch === 'S') return 'A';
  if (ch === 's') return 'a';
  return '.';
}

export const wornTextureKey = (itemId: string, playerTexture: string) => `worn-${itemId}-${playerTexture}`;
