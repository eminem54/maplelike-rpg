import { describe, expect, it } from 'vitest';
import { Inventory, INVENTORY_SIZE } from '../src/systems/Inventory';

const item = (n: number) => ({ itemId: `item-${n}`, count: 1 });

describe('Inventory', () => {
  it('기본 96칸', () => {
    expect(new Inventory().size).toBe(INVENTORY_SIZE);
    expect(INVENTORY_SIZE).toBe(96);
  });

  it('앞에서부터 빈 칸에 넣는다', () => {
    const inv = new Inventory(3);
    inv.add(item(1));
    inv.add(item(2));
    expect(inv.get(0)?.itemId).toBe('item-1');
    expect(inv.get(1)?.itemId).toBe('item-2');
    expect(inv.get(2)).toBeNull();
  });

  it('가득 차면 false', () => {
    const inv = new Inventory(1);
    expect(inv.add(item(1))).toBe(true);
    expect(inv.add(item(2))).toBe(false);
  });

  it('clear는 모든 칸을 비운다', () => {
    const inv = new Inventory(2);
    inv.add(item(1));
    inv.clear();
    expect(inv.get(0)).toBeNull();
    expect(inv.add(item(2))).toBe(true);
  });
});
