import { EQUIP_SLOTS } from '../data/equipment';
import { getItem } from '../data/items';
import { START_MAP_ID } from '../data/maps';
import type { Equipment } from './Equipment';
import type { Inventory, InventoryItem } from './Inventory';
import type { Progress } from './Progress';
import type { SkillBook } from './SkillBook';
import type { CharacterStats, PrimaryStats } from './Stats';

/** 저장 데이터 형식이 바뀌면 올린다 (다른 버전의 저장은 불러오지 않는다) */
const SAVE_VERSION = 1;
export const SAVE_KEY = 'maplelike-rpg.save';

export type GameState = {
  stats: CharacterStats;
  inventory: Inventory;
  equipment: Equipment;
  progress: Progress;
  skills: SkillBook;
};

export type SaveData = {
  version: typeof SAVE_VERSION;
  stats: {
    base: PrimaryStats;
    bonus: PrimaryStats;
    hp: number;
    mp: number;
    level: number;
    exp: number;
    statPoints: number;
    highestLevel: number;
  };
  inventory: (InventoryItem | null)[];
  /** 나중에 추가해서 예전 저장에는 없다 */
  gold?: number;
  equipment: Record<string, InventoryItem>;
  /** mapId는 나중에 추가해서 예전 저장에는 없다 */
  progress: { starterGear: Progress['starterGear']; mapId?: string };
  /** 나중에 추가해서 예전 저장에는 없다 */
  skills?: { learned: string[]; hotkeys: Record<string, string> };
};

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

/** 브라우저 저장소. 막혀 있으면(일부 시크릿 모드 등) 아무것도 저장하지 않는 저장소를 돌려준다. */
export function browserStorage(): Storage {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}

/** 지금 상태를 저장 데이터로 만든다 (캐릭터 위치와 맵의 몬스터는 저장하지 않는다) */
export function snapshot({ stats, inventory, equipment, progress, skills }: GameState): SaveData {
  const equipped: Record<string, InventoryItem> = {};
  for (const slot of EQUIP_SLOTS) {
    const item = equipment.get(slot.id);
    if (item) equipped[slot.id] = { ...item };
  }
  return {
    version: SAVE_VERSION,
    stats: {
      base: { ...stats.base },
      bonus: { ...stats.bonus },
      hp: stats.hp,
      mp: stats.mp,
      level: stats.level,
      exp: stats.exp,
      statPoints: stats.statPoints,
      highestLevel: stats.highestLevel,
    },
    inventory: Array.from({ length: inventory.size }, (_, i) => {
      const item = inventory.get(i);
      return item ? { ...item } : null;
    }),
    gold: inventory.gold,
    equipment: equipped,
    progress: { starterGear: progress.starterGear, mapId: progress.mapId },
    skills: skills.toJSON(),
  };
}

/** 저장 데이터를 지금 상태에 덮어쓴다. 없어진 아이템은 버린다. */
export function restore({ stats, inventory, equipment, progress, skills }: GameState, data: SaveData) {
  const s = data.stats;
  Object.assign(stats.base, s.base);
  Object.assign(stats.bonus, s.bonus);
  stats.level = s.level;
  stats.exp = s.exp;
  stats.statPoints = s.statPoints;
  stats.highestLevel = s.highestLevel;

  inventory.clear();
  data.inventory.slice(0, inventory.size).forEach((item, i) => {
    if (item && getItem(item.itemId)) inventory.set(i, { ...item });
  });
  inventory.gold = data.gold ?? 0;
  // 장비를 먼저 끼워야 최대 HP(방패 등)가 맞게 계산된다
  equipment.restore(data.equipment);
  const d = stats.derived;
  stats.hp = Math.min(s.hp, d.maxHp);
  stats.mp = Math.min(s.mp, d.maxMp);

  progress.starterGear = data.progress.starterGear;
  progress.mapId = data.progress.mapId ?? START_MAP_ID;
  skills.load(data.skills ?? { learned: [], hotkeys: {} });
}

/** 저장된 데이터를 읽는다. 없거나 깨져 있거나 버전이 다르면 null */
export function readSave(storage: Storage): SaveData | null {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    return data?.version === SAVE_VERSION ? data : null;
  } catch {
    return null;
  }
}

/**
 * 바뀐 게 있을 때만 저장한다. 마지막으로 쓴 내용을 기억해서 같은 내용은 다시 쓰지 않는다.
 */
export class AutoSaver {
  private lastWritten: string | null = null;

  constructor(private state: GameState, private storage: Storage) {}

  save() {
    const json = JSON.stringify(snapshot(this.state));
    if (json === this.lastWritten) return;
    try {
      this.storage.setItem(SAVE_KEY, json);
      this.lastWritten = json;
    } catch {
      // 저장 공간이 없거나 막혀 있으면(시크릿 모드 등) 저장 없이 계속한다
    }
  }
}
