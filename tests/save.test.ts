import { describe, expect, it } from 'vitest';
import { START_MAP_ID } from '../src/data/maps';
import { Equipment } from '../src/systems/Equipment';
import { Inventory } from '../src/systems/Inventory';
import { Progress } from '../src/systems/Progress';
import { SkillBook } from '../src/systems/SkillBook';
import { AutoSaver, readSave, restore, SAVE_KEY, snapshot, type GameState } from '../src/systems/SaveGame';
import { CharacterStats } from '../src/systems/Stats';

function newState(): GameState {
  const stats = new CharacterStats();
  const inventory = new Inventory();
  return { stats, inventory, equipment: new Equipment(inventory, stats), progress: new Progress(), skills: new SkillBook() };
}

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('저장/불러오기', () => {
  it('레벨, 능력치, 인벤토리, 장비, 진행 상황이 그대로 돌아온다', () => {
    const a = newState();
    a.stats.levelUp();
    a.stats.spendStatPoint('str');
    a.inventory.add({ itemId: 'starterSword', count: 1 });
    a.inventory.add({ itemId: 'starterShield', count: 1 });
    a.equipment.equipFromInventory(1); // 방패 장착
    a.stats.hp = 105;
    a.progress.starterGear = 'refused';
    a.progress.mapId = 'field2';
    a.inventory.addGold(123);
    a.skills.learn('throwSword');
    a.skills.bind('KeyA', 'throwSword');

    const storage = memoryStorage();
    new AutoSaver(a, storage).save();

    const b = newState();
    const data = readSave(storage);
    expect(data).not.toBeNull();
    restore(b, data!);

    expect(b.stats.level).toBe(2);
    expect(b.stats.base.str).toBe(a.stats.base.str);
    expect(b.stats.statPoints).toBe(a.stats.statPoints);
    expect(b.inventory.get(0)?.itemId).toBe('starterSword');
    expect(b.inventory.get(1)).toBeNull();
    expect(b.equipment.get('shield')?.itemId).toBe('starterShield');
    expect(b.stats.derived.maxHp).toBe(110);
    expect(b.stats.hp).toBe(105); // 방패 덕분에 100을 넘는 HP도 유지된다
    expect(b.progress.starterGear).toBe('refused');
    expect(b.progress.mapId).toBe('field2');
    expect(b.inventory.gold).toBe(123);
    expect(b.skills.has('throwSword')).toBe(true);
    expect(b.skills.skillAt('KeyA')).toBe('throwSword');
    expect(snapshot(b)).toEqual(snapshot(a));
  });

  it('깨진 저장이나 다른 버전은 불러오지 않는다', () => {
    const storage = memoryStorage();
    expect(readSave(storage)).toBeNull();
    storage.setItem(SAVE_KEY, '{망가진 json');
    expect(readSave(storage)).toBeNull();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 999 }));
    expect(readSave(storage)).toBeNull();
  });

  it('없어진 아이템은 버리고 불러온다', () => {
    const a = newState();
    const data = snapshot(a);
    data.inventory[0] = { itemId: 'deletedItem', count: 1 };
    data.equipment.weapon = { itemId: 'deletedItem', count: 1 };
    const b = newState();
    restore(b, data);
    expect(b.inventory.get(0)).toBeNull();
    expect(b.equipment.get('weapon')).toBeNull();
  });

  it('맵·골드·스킬이 없던 예전 저장은 시작 맵, 0골드, 스킬 없이 시작한다', () => {
    const data = snapshot(newState());
    delete data.progress.mapId;
    delete data.gold;
    delete data.skills;
    const b = newState();
    b.progress.mapId = 'field2';
    b.inventory.addGold(50);
    b.skills.learn('throwSword');
    restore(b, data);
    expect(b.progress.mapId).toBe(START_MAP_ID);
    expect(b.inventory.gold).toBe(0);
    expect(b.skills.learnedIds).toEqual([]);
  });

  it('바뀐 게 없으면 다시 쓰지 않는다', () => {
    const state = newState();
    let writes = 0;
    const storage = { getItem: () => null, setItem: () => void writes++ };
    const saver = new AutoSaver(state, storage);
    saver.save();
    saver.save();
    expect(writes).toBe(1);
    state.stats.levelUp();
    saver.save();
    expect(writes).toBe(2);
  });
});
