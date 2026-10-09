// 키 배치 (KeyboardEvent.code 기준)
export const KEYS = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  jump: ['KeyC'],
  attack: ['KeyX'],
  interact: ['Space'], // NPC 대화, 대화 넘기기
  inventory: ['KeyI'],
  status: ['KeyS'],
  close: ['Escape'],
};

export const ALL_KEY_CODES = Object.values(KEYS).flat();
