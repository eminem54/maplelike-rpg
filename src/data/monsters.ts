export type MonsterData = {
  name: string;
  maxHp: number;
  /** 플레이어와 닿았을 때 주는 데미지 (플레이어 방어력만큼 줄어든다) */
  contactDamage: number;
  /** 평소 돌아다니는 속도 (px/s) */
  walkSpeed: number;
  /** 화나서 쫓아올 때 속도 (px/s) */
  chaseSpeed: number;
  /** 쓰러뜨리면 주는 경험치 */
  exp: number;
};

export const BABY_DUCK: MonsterData = {
  name: '아기 오리',
  maxHp: 50,
  contactDamage: 5,
  walkSpeed: 40, // 뒤뚱뒤뚱 느리게 (플레이어 260)
  chaseSpeed: 55, // 화나면 아주 약간 빨라진다
  exp: 2,
};
