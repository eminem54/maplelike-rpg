/** 아이템 아이콘(12 x 12)을 키우는 배율 */
export const ITEM_ICON_SCALE = 3;
export const itemTextureKey = (id: string) => `item-${id}`;

/** 모든 아이템 아이콘과 손에 든 장비 그림이 함께 쓰는 팔레트 */
export const ITEM_PALETTE: Record<string, number> = {
  K: 0x2a1d10, // 외곽선
  W: 0xf4f7fa, // 칼날 빛
  B: 0xb8c4cf, // 강철
  b: 0x7d8a96, // 어두운 강철
  Y: 0xe0b23a, // 금속 장식
  H: 0x7a4a20, // 손잡이
  O: 0xa0682c, // 나무
  o: 0x7f4f1f, // 어두운 나무
  C: 0x4a6fb5, // 천
  c: 0x34508a, // 천 주름
  D: 0xf2efe6, // 흰 천
  d: 0xc9c3b3, // 흰 천 그림자
};
