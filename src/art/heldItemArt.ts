// 캐릭터가 손에 들고 있는 장비 그림 (캐릭터와 같은 3배 픽셀, 색은 ITEM_PALETTE).
// 검은 칼끝이 위를 향하게 그리고 손잡이를 축으로 돌려서 들고 휘두른다.
export const HELD_ITEM_SCALE = 3;

export type HeldArt = {
  rows: string[];
  /** 손에 쥐는 점 (픽셀 좌표). 이 점을 손 위치에 맞추고, 이 점을 축으로 돌린다. */
  grip: { x: number; y: number };
};

export const HELD_ITEM_ART: Record<string, HeldArt> = {
  starterSword: {
    rows: [
      '..KK.',
      '.KWBK',
      '.KWBK',
      '.KWBK',
      '.KWBK',
      '.KWBK',
      '.KWBK',
      '.KWBK',
      'KYYYK',
      '.KHK.',
      '.KHK.',
      '.KYK.',
      '..K..',
    ],
    grip: { x: 2.5, y: 10 },
  },
  starterShield: {
    rows: [
      '..KKKK..',
      '.KbbbbK.',
      'KbOOOObK',
      'KbOBBObK',
      'KbOBBObK',
      'KbOOOObK',
      '.KbbbbK.',
      '..KKKK..',
    ],
    grip: { x: 4, y: 4 },
  },
};

export const heldTextureKey = (itemId: string) => `held-${itemId}`;
