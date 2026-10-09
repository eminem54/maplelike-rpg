/** 기본 능력치 (레벨업·장비로 올리는 값) */
export type PrimaryStats = {
  str: number; // 힘: 공격력, 방어력
  con: number; // 체질: 최대 HP
  dex: number; // 민첩: 공격속도, 명중률, 회피율, 크리티컬, 이동속도
  int: number; // 지능: 주문력
  wis: number; // 지혜: 최대 MP, 주문속도, 마법명중률
  men: number; // 정신: 주문 크리티컬
};

/** 기본 능력치로부터 계산되는 전투 능력치 */
export type DerivedStats = {
  maxHp: number;
  maxMp: number;
  attack: number; // 공격 스킬 데미지의 기본값
  spell: number; // 주문 스킬 데미지의 기본값
  hit: number; // 공격 명중률
  mhit: number; // 마법 명중률
  defense: number;
  evasion: number; // 회피율 (%)
  crit: number; // 공격 크리티컬 확률 (%)
  spellCrit: number; // 주문 크리티컬 확률 (%)
  attackSpeed: number; // 공격속도 (%, 100 = 기본)
  castSpeed: number; // 주문속도 (%, 100 = 기본)
  moveSpeed: number; // 이동속도 (%, 100 = 기본)
};

/** 시작 기본 능력치. 이 값일 때 전투 능력치가 아래 BASE와 같다. */
export const START_PRIMARY: PrimaryStats = { str: 5, con: 5, dex: 5, int: 5, wis: 5, men: 5 };

/** 시작 능력치일 때의 전투 능력치 */
const BASE: DerivedStats = {
  maxHp: 100,
  maxMp: 100,
  attack: 10,
  spell: 10,
  hit: 10,
  mhit: 10,
  defense: 0,
  evasion: 5,
  crit: 5,
  spellCrit: 5,
  attackSpeed: 100,
  castSpeed: 100,
  moveSpeed: 100,
};

/** 기본 능력치 1포인트당 전투 능력치 증가량 */
const PER_POINT: { [K in keyof PrimaryStats]: Partial<DerivedStats> } = {
  str: { attack: 1, defense: 1 },
  con: { maxHp: 10 },
  dex: { attackSpeed: 1, hit: 1, evasion: 0.5, crit: 0.5, moveSpeed: 0.5 },
  int: { spell: 1 },
  wis: { maxMp: 10, castSpeed: 1, mhit: 1 },
  men: { spellCrit: 0.5 },
};

/** 전투 능력치 = 시작값 + (기본 능력치 - 시작 기본 능력치) x 1포인트당 증가량 */
export function deriveStats(primary: PrimaryStats): DerivedStats {
  const result = { ...BASE };
  for (const key of Object.keys(PER_POINT) as (keyof PrimaryStats)[]) {
    const points = primary[key] - START_PRIMARY[key];
    for (const [stat, amount] of Object.entries(PER_POINT[key]) as [keyof DerivedStats, number][]) {
      result[stat] += points * amount;
    }
  }
  return result;
}

/** 레벨업으로 올릴 수 있는 기본 능력치의 최대치. 아이템 보너스는 제한 없음. */
export const MAX_BASE_STAT = 999;

const ZERO_PRIMARY: PrimaryStats = { str: 0, con: 0, dex: 0, int: 0, wis: 0, men: 0 };

/** 장착한 장비가 더해 주는 능력치 */
export type GearBonus = {
  /** 무기 공격력 범위. 공격할 때마다 이 범위에서 무작위로 공격력에 더한다. */
  attackMin: number;
  attackMax: number;
  defense: number;
  maxHp: number;
};

export const NO_GEAR: GearBonus = { attackMin: 0, attackMax: 0, defense: 0, maxHp: 0 };

export const MAX_LEVEL = 999;
/** 레벨업마다 받는 능력치 포인트 */
export const STAT_POINTS_PER_LEVEL = 10;

/** level에서 다음 레벨로 가는 데 필요한 경험치. 1→2는 20 (아기 오리 10마리). */
export function expToNextLevel(level: number) {
  return Math.round(20 * Math.pow(level, 1.5));
}

/** 캐릭터의 현재 능력치 상태 (게임 화면과 UI가 같이 본다) */
export class CharacterStats {
  /** 레벨업으로 올린 기본 능력치 (최대 MAX_BASE_STAT) */
  readonly base: PrimaryStats;
  /** 아이템으로 올라간 능력치 (제한 없음) */
  readonly bonus: PrimaryStats = { ...ZERO_PRIMARY };
  /** 장착한 장비 보너스 (Equipment가 바꾼다) */
  private gear: GearBonus = { ...NO_GEAR };
  hp: number;
  mp: number;
  level = 1;
  /** 현재 레벨에서 모은 경험치 */
  exp = 0;
  /** 아직 찍지 않은 능력치 포인트 */
  statPoints = 0;
  /** 지금까지 도달한 최고 레벨. 이 레벨을 넘어설 때만 능력치 포인트를 준다. */
  highestLevel = 1;

  constructor(base: PrimaryStats = START_PRIMARY) {
    this.base = { ...base };
    const d = this.derived;
    this.hp = d.maxHp;
    this.mp = d.maxMp;
  }

  /** 기본 + 아이템 보너스 */
  get primary(): PrimaryStats {
    const total = { ...this.base };
    for (const key of Object.keys(total) as (keyof PrimaryStats)[]) total[key] += this.bonus[key];
    return total;
  }

  /** 장비를 뺀 능력치 (상태창에서 기본값으로 보여준다) */
  get baseDerived() {
    return deriveStats(this.primary);
  }

  /** 장비까지 더한 실제 능력치 */
  get derived() {
    const d = this.baseDerived;
    d.defense += this.gear.defense;
    d.maxHp += this.gear.maxHp;
    return d;
  }

  get gearBonus(): Readonly<GearBonus> {
    return this.gear;
  }

  /** 장비가 바뀌었을 때. 최대 HP가 줄면 현재 HP도 그만큼 깎는다. */
  setGear(gear: GearBonus) {
    this.gear = { ...gear };
    this.hp = Math.min(this.hp, this.derived.maxHp);
  }

  /** 이번 공격의 공격력: 기본 공격력 + 무기 공격력 범위에서 무작위 */
  rollAttack(random: () => number = Math.random) {
    const { attackMin, attackMax } = this.gear;
    return this.baseDerived.attack + attackMin + Math.floor(random() * (attackMax - attackMin + 1));
  }

  /** 다음 레벨까지 필요한 경험치 (최대 레벨이면 0) */
  get expToNext() {
    return this.level >= MAX_LEVEL ? 0 : expToNextLevel(this.level);
  }

  /** 경험치를 얻는다. 올라간 레벨 수를 돌려준다. 레벨업하면 HP·MP가 가득 찬다. */
  gainExp(amount: number) {
    if (this.level >= MAX_LEVEL) return 0;
    this.exp += amount;
    let gained = 0;
    while (this.level < MAX_LEVEL && this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level += 1;
      // 레벨을 내렸다가 다시 올리는 경우에는 포인트를 또 주지 않는다
      if (this.level > this.highestLevel) {
        this.highestLevel = this.level;
        this.statPoints += STAT_POINTS_PER_LEVEL;
      }
      gained += 1;
    }
    if (this.level >= MAX_LEVEL) this.exp = 0;
    if (gained > 0) {
      const d = this.derived;
      this.hp = d.maxHp;
      this.mp = d.maxMp;
    }
    return gained;
  }

  /** 다음 레벨까지 필요한 경험치를 채워 한 레벨 올린다 (개발자용) */
  levelUp() {
    return this.gainExp(this.expToNext - this.exp);
  }

  /** 레벨을 내린다 (개발자용). 찍은 능력치와 남은 포인트는 그대로 둔다. */
  setLevel(level: number) {
    this.level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
    this.exp = 0;
  }

  /** 레벨, 경험치, 능력치, 포인트를 처음 상태로 되돌린다 */
  reset() {
    Object.assign(this.base, START_PRIMARY);
    Object.assign(this.bonus, ZERO_PRIMARY);
    this.gear = { ...NO_GEAR };
    this.level = 1;
    this.exp = 0;
    this.statPoints = 0;
    this.highestLevel = 1;
    const d = this.derived;
    this.hp = d.maxHp;
    this.mp = d.maxMp;
  }

  /** 능력치 포인트 1개를 찍는다. 포인트가 없거나 최대치면 false */
  spendStatPoint(key: keyof PrimaryStats) {
    if (this.statPoints <= 0 || this.addBasePoints(key, 1) === 0) return false;
    this.statPoints -= 1;
    return true;
  }

  /** 레벨업 포인트로 기본 능력치를 올린다. 최대치를 넘지 않는다. 실제로 올라간 양을 돌려준다. */
  addBasePoints(key: keyof PrimaryStats, points: number) {
    const before = this.base[key];
    this.base[key] = Math.min(MAX_BASE_STAT, before + points);
    return this.base[key] - before;
  }
}
