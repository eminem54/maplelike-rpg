import type { MonsterLook } from '../entities/Monster';

// 다람쥐 (14 x 15 픽셀). 오른쪽을 보고 있고, 뒤로 큰 꼬리가 말려 올라간다.
const SQUIRREL_PIXEL_SCALE = 3;

const SQUIRREL_PALETTE: Record<string, number> = {
  K: 0x3a2414, // 외곽선
  B: 0xc87838, // 털
  b: 0xf4dcb0, // 배
  T: 0xb8642a, // 꼬리
  t: 0xe8a868, // 꼬리 결
  E: 0x1a1a1a, // 눈
  N: 0x4a2a14, // 코
  P: 0xffa0a0, // 볼
  R: 0xff3b3b, // 화난 볼
  o: 0x7a3e18, // 발
};

const HEAD = [
  '..KK..........',
  '.KttK....K.K..',
  'KTtTTK..KBKBK.',
  'KTTtTK.KBBBBK.',
  '.KTTTK.KBBBEBK',
  '..KTTK.KBBBPNK',
];

// 화난 얼굴: 눈썹이 코 쪽으로 내려오고 볼이 빨개진다
const ANGRY_HEAD = [
  '..KK..........',
  '.KttK....K.K..',
  'KTtTTK..KBKBK.',
  'KTTtTK.KBKBBK.',
  '.KTTTK.KBBKEBK',
  '..KTTK.KBBBRNK',
];

const BODY = [
  '...KTTKKBBBBK.',
  '...KTKBBBbbBK.',
  '...KTKBBbbbBK.',
  '..KTTKBBbbbBK.',
  '..KTKBBBbbBK..',
  '...KKBBBBBBK..',
  '....KKKKKKK...',
];

// 발: 앞뒤로 벌린 발 / 모은 발을 빠르게 번갈아 보여준다
const FEET_A = [
  '....oo...oo...',
  '...oo.....oo..',
];
const FEET_B = [
  '.....oo.oo....',
  '.....oo.oo....',
];

export const SQUIRREL_LOOK: MonsterLook = {
  frames: {
    'squirrel-a': [...HEAD, ...BODY, ...FEET_A],
    'squirrel-b': [...HEAD, ...BODY, ...FEET_B],
    'squirrel-angry-a': [...ANGRY_HEAD, ...BODY, ...FEET_A],
    'squirrel-angry-b': [...ANGRY_HEAD, ...BODY, ...FEET_B],
  },
  palette: SQUIRREL_PALETTE,
  scale: SQUIRREL_PIXEL_SCALE,
  walk: ['squirrel-a', 'squirrel-b'],
  angryWalk: ['squirrel-angry-a', 'squirrel-angry-b'],
  fps: 8, // 종종걸음
  waddle: 0, // 오리처럼 뒤뚱거리지 않는다
};
