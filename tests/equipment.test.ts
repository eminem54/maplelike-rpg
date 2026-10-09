import { describe, expect, it } from 'vitest';
import { Equipment } from '../src/systems/Equipment';
import { Inventory } from '../src/systems/Inventory';
import { CharacterStats } from '../src/systems/Stats';

const sword = () => ({ itemId: 'starterSword', count: 1 });
const shield = () => ({ itemId: 'starterShield', count: 1 });

function setup(size = 96) {
  const inventory = new Inventory(size);
  const stats = new CharacterStats();
  const equipment = new Equipment(inventory, stats);
  return { inventory, stats, equipment };
}

describe('Equipment', () => {
  it('인벤토리의 검을 무기 칸에 장착하면 인벤토리에서 빠진다', () => {
    const { inventory, equipment } = setup();
    inventory.add(sword());
    expect(equipment.equipFromInventory(0)).toBe(true);
    expect(equipment.get('weapon')?.itemId).toBe('starterSword');
    expect(inventory.get(0)).toBeNull();
  });

  it('이미 무기가 있으면 서로 바꾼다', () => {
    const { inventory, equipment } = setup();
    const first = sword();
    inventory.add(first);
    equipment.equipFromInventory(0);
    const second = sword();
    inventory.add(second);
    equipment.equipFromInventory(0);
    expect(inventory.get(0)).toBe(first); // 원래 끼던 검이 그 칸으로 돌아왔다
    expect(equipment.get('weapon')).toBe(second);
  });

  it('방패는 방어력과 최대 HP를 올리고, 벗으면 HP가 최대치를 넘지 않는다', () => {
    const { inventory, stats, equipment } = setup();
    inventory.add(shield());
    equipment.equipFromInventory(0);
    expect(stats.derived.defense).toBe(stats.baseDerived.defense + 1);
    expect(stats.derived.maxHp).toBe(110);
    stats.hp = 110;
    equipment.unequip('shield');
    expect(stats.derived.maxHp).toBe(100);
    expect(stats.hp).toBe(100);
    expect(inventory.get(0)?.itemId).toBe('starterShield');
  });

  it('무기 공격력은 범위 안에서 무작위로 더해진다', () => {
    const { inventory, stats, equipment } = setup();
    expect(stats.rollAttack(() => 0.99)).toBe(10); // 맨손
    inventory.add(sword());
    equipment.equipFromInventory(0);
    expect(stats.rollAttack(() => 0)).toBe(15); // 10 + 5
    expect(stats.rollAttack(() => 0.999)).toBe(20); // 10 + 10
  });

  it('인벤토리가 가득 차 있으면 벗을 수 없다', () => {
    const { inventory, equipment } = setup(1);
    inventory.add(sword());
    equipment.equipFromInventory(0);
    inventory.add(shield());
    expect(equipment.unequip('weapon')).toBe(false);
    expect(equipment.get('weapon')).not.toBeNull();
  });

  it('전체 초기화하면 장비 보너스도 사라진다', () => {
    const { inventory, stats, equipment } = setup();
    inventory.add(shield());
    equipment.equipFromInventory(0);
    equipment.clear();
    expect(equipment.get('shield')).toBeNull();
    expect(stats.derived.maxHp).toBe(100);
  });
});
