/**
 * 여러 곳에서 함께 쓰는 색. 한 곳에서만 쓰는 색(도트 팔레트, 지형, 포탈 빛 등)은 그 파일에 둔다.
 * Phaser는 도형 색은 숫자(0xRRGGBB), 글자 색은 문자열('#rrggbb')로 받는다.
 */

/** 창, 대화창, HUD, DEV 메뉴의 바탕 */
export const PANEL = {
  bg: 0x1c2438,
  border: 0x6b7fb0,
  /** 창 제목줄, 대화 선택지, NPC 안내 */
  header: 0x2c3a5e,
};

/** 글자 색 */
export const TEXT = {
  main: '#ffffff',
  /** 이름, 레벨처럼 눈에 띄어야 하는 글자 */
  accent: '#fff27a',
  /** 장비로 오른 능력치 */
  bonus: '#7be08a',
  /** 빈 칸 이름, 안내처럼 흐린 글자 */
  dim: '#8f9bbd',
  /** 골드 */
  gold: '#ffd23f',
  /** 글자 테두리 */
  outline: '#000000',
};

/** HP·MP 막대 (상태창, 몬스터 체력바) */
export const GAUGE = {
  hp: 0xe0484f,
  mp: 0x3f7fe0,
};

/** 숫자 색을 글자 색 문자열로 바꾼다. alpha가 1보다 작으면 '#rrggbbaa' */
export function toCss(color: number, alpha = 1) {
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  const rgb = `#${color.toString(16).padStart(6, '0')}`;
  return alpha < 1 ? rgb + hex(Math.round(alpha * 255)) : rgb;
}
