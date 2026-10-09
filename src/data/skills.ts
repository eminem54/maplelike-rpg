import type { WeaponType } from './items';

export type SkillDef = {
  id: string;
  name: string;
  description: string;
  /** 이 무기를 들고 있어야 쓸 수 있다 (없으면 아무 무기나, 맨손도 된다) */
  weapon?: WeaponType;
  /** 공격 범위 (범위 단위, data/units.ts). 몸 앞에서부터 잰다. */
  range: number;
  /** 스킬 계수: 데미지 = 캐릭터 공격력 x power */
  power: number;
  /** 공격속도 100%일 때 다음 공격까지 (ms) */
  cooldownMs: number;
  /** 동작을 취하고 있는 시간 (ms). 이동하지 않는다. */
  poseMs: number;
  /** 12 x 12 픽셀 아이콘 (SKILL_PALETTE) */
  icon: string[];
};

export const WEAPON_TYPE_LABEL: Record<WeaponType, string> = {
  oneHandSword: '한손검',
};

export const SKILL_ICON_SCALE = 3;
export const skillTextureKey = (id: string) => `skill-${id}`;

export const SKILL_PALETTE: Record<string, number> = {
  G: 0x2c4a7a, // 바탕
  L: 0x9fd3ff, // 바람 자국
  K: 0x2a1d10, // 외곽선
  W: 0xf4f7fa, // 칼날 빛
  B: 0xb8c4cf, // 강철
  Y: 0xe0b23a, // 코등이
  H: 0x7a4a20, // 손잡이
};

export const SKILLS = {
  throwSword: {
    id: 'throwSword',
    name: '칼 던지기',
    description: '들고 있는 검을 앞으로 힘껏 던진다.',
    weapon: 'oneHandSword',
    range: 1,
    power: 1.3,
    cooldownMs: 600,
    poseMs: 260,
    icon: [
      'GGGGGGGGGGGG',
      'GGGGGGGGGGGG',
      'GLLLGGGGGGGG',
      'GGGGGKGGGGGG',
      'GGKKKYKKKKKG',
      'LKHHKYWWWWWK',
      'LKHHKYBBBBKG',
      'GGKKKYKKKKGG',
      'GGGGGKGGGGGG',
      'GLLLGGGGGGGG',
      'GGGGGGGGGGGG',
      'GGGGGGGGGGGG',
    ],
  },
} satisfies Record<string, SkillDef>;

export type SkillId = keyof typeof SKILLS;

export function getSkill(id: string): SkillDef | undefined {
  return (SKILLS as Record<string, SkillDef>)[id];
}

/** 스킬창에 보여줄 한 줄 요약 */
export function describeSkill(skill: SkillDef) {
  const parts = [skill.weapon ? WEAPON_TYPE_LABEL[skill.weapon] : '모든 무기', `범위 ${skill.range}`, `공격력 x${skill.power}`];
  return parts.join(' · ');
}
