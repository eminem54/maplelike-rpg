import type { MonsterLook } from '../../entities/Monster';
import type { ItemId } from '../items';

/** 종족. 몬스터 데이터는 종족마다 파일 하나(종족 이름과 같은 파일)에 둔다. */
export type Species = 'bird' | 'mouse';

/** 레벨마다 달라지는 능력치 */
export type MonsterStats = {
  maxHp: number;
  /** 플레이어와 닿았을 때 주는 데미지 (플레이어 방어력만큼 줄어든다) */
  contactDamage: number;
  /** 쓰러뜨리면 주는 경험치 */
  exp: number;
};

export type MonsterData = {
  /** MONSTERS에 등록하는 이름. 키와 같아야 한다. */
  id: string;
  name: string;
  species: Species;
  /** 나올 때 이 범위에서 레벨이 무작위로 정해진다 */
  level: { min: number; max: number };
  /** min 레벨일 때 능력치 */
  stats: MonsterStats;
  /** 레벨이 1 오를 때마다 더하는 능력치 (min과 max가 같으면 없어도 된다) */
  perLevel?: MonsterStats;
  /** 쓰러뜨리면 바로 들어오는 골드 (이 범위에서 무작위) */
  gold: { min: number; max: number };
  /** 쓰러진 자리에 떨어뜨리는 아이템. chance는 0~1 확률 */
  drops?: { itemId: ItemId; chance: number }[];
  /** 평소 돌아다니는 속도 (px/s) */
  walkSpeed: number;
  /** 화나서 쫓아올 때 속도 (px/s) */
  chaseSpeed: number;
  look: MonsterLook;
};

/** level일 때의 능력치 */
export function statsAtLevel(data: MonsterData, level: number): MonsterStats {
  const n = level - data.level.min;
  const add = data.perLevel ?? { maxHp: 0, contactDamage: 0, exp: 0 };
  return {
    maxHp: data.stats.maxHp + add.maxHp * n,
    contactDamage: data.stats.contactDamage + add.contactDamage * n,
    exp: data.stats.exp + add.exp * n,
  };
}
