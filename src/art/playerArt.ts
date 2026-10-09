// 기본 캐릭터: 팬티만 입은 남자, 서 있는 모습. 오른쪽을 보고 있다.
// 16 x 24 픽셀, 머리 12줄 : 몸 12줄 (2등신)
export const PLAYER_IDLE_TEXTURE = 'player-idle';
export const PLAYER_WALK_ANIM = 'player-walk';
export const PLAYER_PUNCH_TEXTURE = 'player-punch';
export const PLAYER_PIXEL_SCALE = 3;
/** 캐릭터 몸 너비(픽셀). 이 너비가 범위 1의 기준이 된다. */
export const PLAYER_BODY_PIXELS = 16;
/** 텍스처 너비(픽셀). 주먹이 몸 밖으로 나갈 수 있도록 좌우에 4칸씩 여유를 둔다. */
export const PLAYER_CANVAS_PIXELS = 24;

export const PLAYER_PALETTE: Record<string, number> = {
  K: 0x2b1d14, // 외곽선
  H: 0x5a3825, // 머리카락
  h: 0x7a5235, // 머리카락 하이라이트
  S: 0xf5c9a0, // 피부
  s: 0xd9a27c, // 피부 그림자
  E: 0x1e1e2a, // 눈
  M: 0xb5615a, // 입
  U: 0x3d6fd1, // 팬티
  u: 0xffffff, // 팬티 밴드
};

export const PLAYER_IDLE = [
  // 머리
  '....KKKKKKKK....',
  '..KKHHHHHHHHKK..',
  '.KHHHhhHHHHHHHK.',
  '.KHHhhHHHHHHHHK.',
  'KHHHHHHHHHHHHHHK',
  'KHHHHSSSHHSSSHHK',
  'KHHSSSSSSSSSSSHK',
  'KHSSSSSESSSESSSK',
  'KHSSSSSESSSESSSK',
  'KSSSSSSSSSSSSSSK',
  '.KSSSSSSSMMSSSK.',
  '..KKsSSSSSSSsKK.',
  // 몸
  '....KKsSSSsKK...',
  '...KSSSSSSSSSK..',
  '..KSSKSSSSSKSSK.',
  '..KSSKSSSSSKSSK.',
  '..KSSKSSSSSKSSK.',
  '..KsSKSSSSSKSsK.',
  '..KSSKuuuuuKSSK.',
  '...KKKUUUUUKKK..',
  '.....KUUKUUK....',
  '.....KSSKSSK....',
  '.....KssKssK....',
  '....KKKK.KKKK...',
];

// 걷기: 서 있는 그림에서 다리(마지막 3줄)만 바꾼다.
// 다리 모양이 같아서, 화면에서 먼 쪽 다리를 어둡게(s) 칠해 왼발/오른발이 앞인 그림을 구분한다.
const withLegs = (legs: string[]) => [...PLAYER_IDLE.slice(0, -legs.length), ...legs];

// 먼 쪽 다리가 뒤, 가까운 쪽 다리가 앞
const PLAYER_WALK_1 = withLegs([
  '....KssK.KSSK...',
  '...KssK...KSSK..',
  '..KKKK....KKKK..',
]);

// 가까운 쪽 다리가 뒤, 먼 쪽 다리가 앞
const PLAYER_WALK_2 = withLegs([
  '....KSSK.KssK...',
  '...KSSK...KssK..',
  '..KKKK....KKKK..',
]);

export const PLAYER_FRAMES: Record<string, string[]> = {
  [PLAYER_IDLE_TEXTURE]: PLAYER_IDLE,
  'player-walk-1': PLAYER_WALK_1,
  'player-walk-2': PLAYER_WALK_2,
};

/** 걷기 순서: 한 발 앞 → 서기 → 다른 발 앞 → 서기 */
export const PLAYER_WALK_SEQUENCE = ['player-walk-1', PLAYER_IDLE_TEXTURE, 'player-walk-2', PLAYER_IDLE_TEXTURE];

// 밧줄/사다리: 뒷모습. 한쪽 팔과 반대쪽 다리를 올린 그림과, 몸만 좌우 반전한 그림을 번갈아 보여준다.
const PLAYER_CLIMB_1 = [
  // 뒤통수
  '....KKKKKKKK....',
  '..KKHHHHHHHHKK..',
  '.KHHHhhHHHHHHHK.',
  '.KHHhhHHHHHHHHK.',
  'KHHHHHHHHHHHHHHK',
  'KHHHHHHHHHHHHHHK',
  'KHHHHHHHHHHHHHHK',
  'KSHHHHHHHHHHHHSK',
  'KSHHHHHHHHHHHHSK',
  'KHHHHHHHHHHHHHHK',
  '.KHHHHHHHHHHHHK.',
  '..KKsHHHHHHsKK..',
  // 등: 왼팔 올리고 오른다리 올림
  '..KSKKsSSSsKK...',
  '..KSKSSSSSSSSK..',
  '..KSSKSSSSSKSSK.',
  '..KKKKSSSSSKSSK.',
  '.....KSSSSSKSSK.',
  '.....KSSSSSKSsK.',
  '.....KuuuuuKSSK.',
  '.....KUUUUUKKK..',
  '.....KUUKUUK....',
  '.....KSSKSSK....',
  '.....KssKKKK....',
  '....KKKK........',
];

// 머리 12줄은 그대로 두고 몸만 뒤집는다 (머리 하이라이트가 깜빡이지 않도록)
const mirrorBody = (rows: string[]) => [
  ...rows.slice(0, 12),
  ...rows.slice(12).map((r) => [...r].reverse().join('')),
];

export const PLAYER_CLIMB_ANIM = 'player-climb';
export const PLAYER_CLIMB_SEQUENCE = ['player-climb-1', 'player-climb-2'];
PLAYER_FRAMES['player-climb-1'] = PLAYER_CLIMB_1;
PLAYER_FRAMES['player-climb-2'] = mirrorBody(PLAYER_CLIMB_1);

// 주먹질: 오른팔을 앞으로 뻗는다. 팔 부분만 24칸 폭으로 그렸다.
PLAYER_FRAMES[PLAYER_PUNCH_TEXTURE] = [
  ...PLAYER_IDLE.slice(0, 13),
  '.......KSSSSSSSSSKKKKKK.',
  '......KSSKSSSSSSSSSSSsK.',
  '......KSSKSSSSSSSSSSSsK.',
  '......KSSKSSSSSKKKKKKKK.',
  '......KsSKSSSSSK........',
  '......KSSKuuuuuK........',
  '.......KKKUUUUUK........',
  ...PLAYER_IDLE.slice(20),
];
