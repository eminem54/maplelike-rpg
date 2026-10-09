// 아기 오리 (12 x 16 픽셀, 샌드백과 같은 크기). 오른쪽을 보고 있다.
export const DUCK_PIXEL_SCALE = 3;

export const DUCK_PALETTE: Record<string, number> = {
  K: 0x3a2a10, // 외곽선
  Y: 0xffd84a, // 털
  y: 0xe8b92c, // 날개 그림자
  O: 0xff8a1f, // 부리·발
  o: 0xd96a10, // 다리
  E: 0x1a1a1a, // 눈
  P: 0xffa0a0, // 볼
  R: 0xff3b3b, // 화난 볼
};

const HEAD = [
  '...KKKK.....',
  '..KYYYYK....',
  '.KYYYYYYK...',
  '.KYYYYEYK...',
  '.KYYYYYYOOK.',
  '.KYYYYPYKK..',
];

// 화난 얼굴: 눈썹이 부리 쪽으로 내려오고 볼이 빨개진다
const ANGRY_HEAD = [
  '...KKKK.....',
  '..KYYYYK....',
  '.KYYYKYYK...',
  '.KYYYYKYK...',
  '.KYYYYEYOOK.',
  '.KYYYYRYKK..',
];

const BODY = [
  '..KYYYYYK...',
  '.KYYYYYYYK..',
  'KYYYYYYYYYK.',
  'KYyyYYYYYYYK',
  'KYyyyYYYYYYK',
  'KYYyyYYYYYYK',
  '.KYYYYYYYYK.',
  '..KKKKKKKK..',
];

// 발: 두 발을 벌린 걸음 / 모은 걸음을 번갈아 보여준다
const FEET_A = [
  '...oo..oo...',
  '...OOO.OOO..',
];
const FEET_B = [
  '....oooo....',
  '....OOOOO...',
];

export const DUCK_FRAMES: Record<string, string[]> = {
  'duck-a': [...HEAD, ...BODY, ...FEET_A],
  'duck-b': [...HEAD, ...BODY, ...FEET_B],
  'duck-angry-a': [...ANGRY_HEAD, ...BODY, ...FEET_A],
  'duck-angry-b': [...ANGRY_HEAD, ...BODY, ...FEET_B],
};

export const DUCK_ANIMS = {
  walk: { key: 'duck-walk', frames: ['duck-a', 'duck-b'] },
  angryWalk: { key: 'duck-angry-walk', frames: ['duck-angry-a', 'duck-angry-b'] },
};
