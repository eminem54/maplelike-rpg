// 황금기사 NPC (16 x 28 픽셀). 황금 갑옷, 붉은 깃털이 달린 황금 투구, 붉은 망토. 오른쪽을 보고 있다.
export const KNIGHT_TEXTURE = 'npc-knight';
export const KNIGHT_PIXEL_SCALE = 3;

export const KNIGHT_PALETTE: Record<string, number> = {
  K: 0x3a2a10, // 외곽선
  G: 0xf2c230, // 금
  g: 0xb8860b, // 어두운 금
  W: 0xfff2a8, // 금 반사광
  R: 0xe0303c, // 깃털
  r: 0x9e1f2a, // 깃털 그림자
  C: 0xb02030, // 망토
  S: 0xf5c9a0, // 피부
  E: 0x1e1e2a, // 눈
};

export const KNIGHT_ROWS = [
  // 깃털 (뒤쪽으로 흩날린다)
  '........RRRR....',
  '.....RRRRRRRR...',
  '..RRRRRrrRRRR...',
  'RRRrr...RRRR....',
  // 투구
  '....KKKKKKKK....',
  '..KKGGGWWGGGKK..',
  '.KGGGWWGGGGGGGK.',
  '.KGGWGGGGGGGGGK.',
  'KGGGGGGGGGGGGGGK',
  'KgggggggggggggGK',
  'KGGKKKKKKKKKKKGK',
  'KGGKSSSESSSESKGK',
  'KGGKSSSSSSSSSKGK',
  'KGGGKKKKKKKKKGGK',
  '.KGGGGGGGGGGGGK.',
  '..KKgGGGGGGGgKK.',
  // 갑옷
  '.C..KKgGGGgKK...',
  '.CCKGGWGGGGGGK..',
  '.CKGGKGWGGGKGGK.',
  '.CKGGKGGGGGKGGK.',
  '.CKggKGGWGGKggK.',
  '.CKGGKgGGGgKGGK.',
  '.CKWWKgggggKWWK.',
  '.CCKKKGGGGGKKK..',
  '..CC.KGGKGGK....',
  '.....KGGKGGK....',
  '.....KggKggK....',
  '....KKKK.KKKK...',
];
