/** 기본 공격 (무기 없음: 주먹질). 능력치는 systems/Stats.ts */
export const BASIC_ATTACK = {
  range: 0.5, // 범위 단위 (data/units.ts). 0.5처럼 소수도 된다
  power: 1, // 공격력 계수: 데미지 = 공격력 x power
  cooldownMs: 450, // 공격속도 100%일 때 다음 공격까지
  poseMs: 180, // 주먹을 뻗고 있는 시간
};
