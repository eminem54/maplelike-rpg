/** 인벤토리 한 칸에 든 아이템. 아이템 정보는 data/items.ts에서 itemId로 찾는다. */
export type InventoryItem = { itemId: string; count: number };

export const INVENTORY_SIZE = 96;

export class Inventory {
  private slots: (InventoryItem | null)[];
  /** 내용이 바뀔 때마다 1씩 늘어난다 (화면이 다시 그릴지 판단할 때 쓴다) */
  version = 0;

  constructor(size = INVENTORY_SIZE) {
    this.slots = Array.from({ length: size }, () => null);
  }

  get size() {
    return this.slots.length;
  }

  get(index: number) {
    return this.slots[index] ?? null;
  }

  /** index 칸에 아이템을 넣는다 (원래 있던 것은 덮어쓴다, null이면 비운다) */
  set(index: number, item: InventoryItem | null) {
    this.slots[index] = item;
    this.version += 1;
  }

  /** 빈 칸이 있는가 */
  get hasSpace() {
    return this.slots.includes(null);
  }

  /** 모든 칸을 비운다 */
  clear() {
    this.slots.fill(null);
    this.version += 1;
  }

  /** 앞에서부터 첫 빈 칸에 넣는다. 가득 차 있으면 false */
  add(item: InventoryItem) {
    const index = this.slots.indexOf(null);
    if (index === -1) return false;
    this.slots[index] = item;
    this.version += 1;
    return true;
  }
}
