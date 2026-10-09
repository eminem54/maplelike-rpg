// 키 배치 (KeyboardEvent.code 기준)
export const KEYS = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  jump: ['KeyC'],
  attack: ['KeyX'],
  interact: ['Space'], // NPC 대화, 대화 넘기기
  pickup: ['KeyZ'], // 바닥에 떨어진 아이템 줍기
  inventory: ['KeyI'],
  skills: ['KeyK'],
  status: ['KeyP'],
  close: ['Escape'],
};

/** 하단 스킬 단축키 칸. 위 줄 QWERT, 아래 줄 ASDFG */
export const SKILL_HOTKEYS = [
  ['KeyQ', 'Q'], ['KeyW', 'W'], ['KeyE', 'E'], ['KeyR', 'R'], ['KeyT', 'T'],
  ['KeyA', 'A'], ['KeyS', 'S'], ['KeyD', 'D'], ['KeyF', 'F'], ['KeyG', 'G'],
].map(([code, label]) => ({ code, label }));

export const ALL_KEY_CODES = [...Object.values(KEYS).flat(), ...SKILL_HOTKEYS.map((h) => h.code)];
