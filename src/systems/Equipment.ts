import { EQUIP_SLOTS, type EquipSlotId } from '../data/equipment';
import { getItem } from '../data/items';
import type { Inventory, InventoryItem } from './Inventory';
import { NO_GEAR, type CharacterStats, type GearBonus } from './Stats';

/** 장착한 장비. 바뀔 때마다 캐릭터 능력치(장비 보너스)를 다시 계산한다. */
export class Equipment {
  private readonly slots = new Map<EquipSlotId, InventoryItem>();
  /** 내용이 바뀔 때마다 1씩 늘어난다 (화면이 다시 그릴지 판단할 때 쓴다) */
  version = 0;

  constructor(private inventory: Inventory, private stats: CharacterStats) {}

  get(slot: EquipSlotId) {
    return this.slots.get(slot) ?? null;
  }

  /**
   * 인벤토리 index 칸의 아이템을 장착한다. 같은 종류 칸이 비어 있으면 거기에,
   * 모두 차 있으면 첫 칸의 장비와 바꿔서 원래 장비는 그 인벤토리 칸으로 돌아간다.
   */
  equipFromInventory(index: number) {
    const item = this.inventory.get(index);
    const def = item && getItem(item.itemId);
    if (!item || !def) return false;
    const candidates = EQUIP_SLOTS.filter((s) => s.kind === def.kind);
    if (candidates.length === 0) return false;

    const slot = (candidates.find((s) => !this.slots.has(s.id)) ?? candidates[0]).id;
    this.inventory.set(index, this.get(slot));
    this.slots.set(slot, item);
    this.changed();
    return true;
  }

  /** 장비를 벗어 인벤토리 빈 칸에 넣는다. 인벤토리가 가득 차 있으면 false */
  unequip(slot: EquipSlotId) {
    const item = this.get(slot);
    if (!item || !this.inventory.hasSpace) return false;
    this.slots.delete(slot);
    this.inventory.add(item);
    this.changed();
    return true;
  }

  /** 저장된 장비를 그대로 끼운다 (불러오기). 없는 아이템이나 맞지 않는 칸은 버린다. */
  restore(items: Partial<Record<string, InventoryItem>>) {
    this.slots.clear();
    for (const slot of EQUIP_SLOTS) {
      const item = items[slot.id];
      if (item && getItem(item.itemId)?.kind === slot.kind) this.slots.set(slot.id, item);
    }
    this.changed();
  }

  /** 모든 장비를 없앤다 (인벤토리로 돌려보내지 않는다) */
  clear() {
    this.slots.clear();
    this.changed();
  }

  /** 장착한 장비 능력치의 합 */
  get bonus(): GearBonus {
    const total = { ...NO_GEAR };
    for (const item of this.slots.values()) {
      const stats = getItem(item.itemId)?.stats;
      if (!stats) continue;
      total.attackMin += stats.attackMin ?? 0;
      total.attackMax += stats.attackMax ?? stats.attackMin ?? 0;
      total.defense += stats.defense ?? 0;
      total.maxHp += stats.maxHp ?? 0;
    }
    return total;
  }

  private changed() {
    this.version += 1;
    this.stats.setGear(this.bonus);
  }
}
