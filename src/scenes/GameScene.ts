import Phaser from 'phaser';
import { heldTextureKey } from '../art/heldItemArt';
import { ALL_KEY_CODES, KEYS, SKILL_HOTKEYS } from '../data/keymap';
import { getItem } from '../data/items';
import { getMap, type PortalObject } from '../data/maps';
import { getSkill, WEAPON_TYPE_LABEL } from '../data/skills';
import { RANGE_UNIT, toPixels } from '../data/units';
import { showGold, showLevelUp, showNotice } from '../effects/damageText';
import { throwWeapon } from '../effects/thrownWeapon';
import { DropItem } from '../entities/DropItem';
import { HeldItems } from '../entities/HeldItems';
import type { Monster } from '../entities/Monster';
import { Player } from '../entities/Player';
import { WornItems } from '../entities/WornItems';
import { Equipment } from '../systems/Equipment';
import { Inventory } from '../systems/Inventory';
import { KeyInput } from '../systems/KeyInput';
import { rollLoot } from '../systems/Loot';
import { buildMap, type BuiltMap } from '../systems/MapBuilder';
import { MonsterSpawner } from '../systems/MonsterSpawner';
import { Progress } from '../systems/Progress';
import { SkillBook } from '../systems/SkillBook';
import { AutoSaver, browserStorage, readSave, restore, type GameState } from '../systems/SaveGame';
import { CharacterStats } from '../systems/Stats';
import { HUD_HEIGHT } from '../ui/Hud';
import type { UIScene, UISceneData } from './UIScene';

const AUTOSAVE_MS = 1000;
const FADE_MS = 250;

/** 포탈을 타고 들어올 때 넘겨받는 값. 없으면 저장된 맵의 시작 위치에서 시작한다. */
export type GameSceneData = { mapId?: string; portalId?: string };

/**
 * 맵 하나를 구성해서 플레이한다. 맵을 옮길 때는 이 장면을 다른 맵 데이터로 다시 시작한다.
 * 캐릭터 상태(능력치, 인벤토리 등)는 장면 필드라서 다시 시작해도 그대로 남는다.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private keys!: KeyInput;
  private built!: BuiltMap;
  private spawners: MonsterSpawner[] = [];
  /** 바닥에 떨어진 아이템 (맵을 옮기면 사라진다) */
  private drops: DropItem[] = [];
  private inventory = new Inventory();
  private stats = new CharacterStats();
  private equipment = new Equipment(this.inventory, this.stats);
  private progress = new Progress();
  private skills = new SkillBook();
  private shownLevel = 1;
  private arrival: GameSceneData = {};
  private loaded = false;
  /** 포탈을 타서 화면이 어두워지는 중 */
  private leaving = false;

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData) {
    this.arrival = data ?? {};
    this.leaving = false;
  }

  create() {
    // 저장된 진행 상황을 불러오고, 바뀔 때마다 자동으로 저장한다
    this.setUpSaving();

    const map = getMap(this.arrival.mapId ?? this.progress.mapId);
    this.progress.mapId = map.id;
    this.built = buildMap(this, map);
    const { terrain, solids } = this.built;
    const groundAt = (x: number) => terrain.heightAt(x);

    // 포탈을 타고 왔으면 도착한 포탈 위에, 아니면 맵의 시작 위치에 선다
    const entry = this.built.portals.find((p) => p.data.id === this.arrival.portalId);
    const startX = entry?.data.x ?? map.playerStartX;
    // 공격 대상: 샌드백과 맵에 있는 몬스터
    this.player = new Player(this, startX, groundAt(startX) - 36, map.climbables, this.stats, (area, damage, dir) => {
      for (const t of [...this.built.hittables, ...this.monsters()]) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(area, t.getHitBounds())) t.takeHit(damage, dir);
      }
    });
    // 밧줄을 타는 동안에는 발판을 통과한다
    this.physics.add.collider(this.player.sprite, solids, undefined, () => !this.player.climbing);
    // 장착한 상의·하의를 입은 모습으로, 무기·방패를 손에 든 모습으로 그린다
    new WornItems(this, this.player, this.equipment);
    new HeldItems(this, this.player, this.equipment);

    this.drops = [];
    this.spawners = map.spawns.map(
      (rule) => new MonsterSpawner(this, rule, this.built.spawnSurfaces, solids, this.player, (m) => this.onMonsterKilled(m)),
    );

    // 게임 화면은 하단 HUD 위쪽까지만 쓴다 (HUD가 캐릭터를 가리지 않도록)
    this.cameras.main
      .setViewport(0, 0, this.scale.width, this.scale.height - HUD_HEIGHT)
      .setBackgroundColor('#8fd3ff');
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.fadeIn(FADE_MS);

    this.keys = new KeyInput(this, ALL_KEY_CODES);
    // UI는 맵을 옮겨도 그대로 둔다 (열어 둔 창 유지)
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene', {
        inventory: this.inventory, equipment: this.equipment, stats: this.stats, progress: this.progress,
        skills: this.skills,
      } satisfies UISceneData);
    }

    this.add
      .text(16, 16, '← → 이동   C 점프   X 공격   Z 줍기   Space 대화   ↑ ↓ 밧줄·빛 기둥   I 인벤토리   K 스킬   P 상태', {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#1b1b1b',
      })
      .setScrollFactor(0);
  }

  private setUpSaving() {
    const state: GameState = {
      stats: this.stats, inventory: this.inventory, equipment: this.equipment, progress: this.progress,
      skills: this.skills,
    };
    const storage = browserStorage();
    // 저장은 처음 한 번만 불러온다. 맵을 옮길 때는 지금 상태를 그대로 가져간다.
    if (!this.loaded) {
      const saved = readSave(storage);
      if (saved) restore(state, saved);
      this.shownLevel = this.stats.level; // 불러온 레벨로 "LEVEL UP!"이 뜨지 않게
      this.loaded = true;
    }

    const saver = new AutoSaver(state, storage);
    this.time.addEvent({ delay: AUTOSAVE_MS, loop: true, callback: () => saver.save() });
    // 새로고침하거나 창을 닫을 때, 맵을 옮길 때도 저장한다
    const saveNow = () => saver.save();
    window.addEventListener('pagehide', saveNow);
    window.addEventListener('beforeunload', saveNow);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      saveNow();
      window.removeEventListener('pagehide', saveNow);
      window.removeEventListener('beforeunload', saveNow);
    });
  }

  /** 경험치와 골드는 바로 얻고, 아이템은 쓰러진 자리에 떨어진다 */
  private onMonsterKilled(m: Monster) {
    this.stats.gainExp(m.stats.exp);
    const { x, y } = m.sprite; // 발밑
    const loot = rollLoot(m.data);
    if (loot.gold > 0) {
      this.inventory.addGold(loot.gold);
      showGold(this, x, y - m.sprite.height - 20, loot.gold);
    }
    // 여러 개가 떨어지면 옆으로 조금씩 벌려 놓는다
    loot.items.forEach((itemId, i) => {
      const offset = (i - (loot.items.length - 1) / 2) * 28;
      this.drops.push(new DropItem(this, itemId, x + offset, y));
    });
  }

  /** 발밑에 있는 아이템을 하나 줍는다 */
  private pickUp(footX: number, footY: number) {
    const drop = this.drops.find((d) => d.canPickUp(footX, footY));
    if (!drop) return;
    const name = getItem(drop.itemId)?.name ?? drop.itemId;
    if (!this.inventory.add({ itemId: drop.itemId, count: 1 })) {
      showNotice(this, footX, this.player.body.top - 10, '인벤토리가 가득 찼다.');
      return;
    }
    drop.pickUp(footX, this.player.body.center.y);
    this.drops.splice(this.drops.indexOf(drop), 1);
    showNotice(this, footX, this.player.body.top - 10, `${name}${objectParticle(name)} 주웠다.`);
  }

  private monsters() {
    return this.spawners.flatMap((s) => s.monsters);
  }

  update(time: number) {
    const dialog = (this.scene.get('UIScene') as UIScene).dialog;
    const talking = dialog?.busy ?? false;
    const busy = talking || this.leaving;

    // 물리 이동이 끝난 몸을 지형 위에 세운다 (경사, 언덕)
    const { terrain } = this.built;
    if (!this.player.climbing) terrain.resolve(this.player.body);
    for (const m of this.monsters()) if (m.alive) terrain.resolve(m.body);

    // 대화 중이거나 맵을 옮기는 중에는 조작하지 않고 서 있는다
    if (busy) this.player.stand(time);
    else {
      this.useHotkeys(time);
      this.player.update(this.keys, time);
    }

    const footX = this.player.sprite.x;
    const footY = this.player.body.bottom;
    let nearNpc: BuiltMap['npcs'][number] | undefined;
    for (const npc of this.built.npcs) {
      const near = !nearNpc && !this.player.climbing && npc.entity.isNear(footX, footY);
      npc.entity.setHintVisible(near && !busy);
      if (near) nearNpc = npc;
    }
    if (!busy && dialog) {
      if (nearNpc && this.keys.justPressed(KEYS.interact)) {
        nearNpc.data.talk({
          dialog, inventory: this.inventory, equipment: this.equipment, progress: this.progress, skills: this.skills,
        });
      }
      if (this.keys.justPressed(KEYS.pickup)) this.pickUp(footX, footY);
      const portal = this.built.portals.find((p) => p.entity.contains(footX, footY));
      if (portal && this.keys.justPressed(KEYS.up)) this.enterPortal(portal.data);
    }

    for (const s of this.spawners) s.update(time);

    // 몬스터를 잡아서든 개발자 메뉴로든 레벨이 오르면 연출을 띄운다
    if (this.stats.level > this.shownLevel) showLevelUp(this, this.player.sprite.x, this.player.body.top - 10);
    this.shownLevel = this.stats.level;
  }

  /** 단축키 칸에 놓인 스킬을 쓴다. 누르고 있으면 대기시간마다 계속 쓴다. */
  private useHotkeys(time: number) {
    for (const { code } of SKILL_HOTKEYS) {
      if (!this.keys.isDown([code])) continue;
      const skill = getSkill(this.skills.skillAt(code) ?? '');
      if (!skill) continue;

      const weaponId = this.equipment.get('weapon')?.itemId;
      if (skill.weapon && getItem(weaponId ?? '')?.weaponType !== skill.weapon) {
        if (this.keys.justPressed([code])) {
          const label = WEAPON_TYPE_LABEL[skill.weapon];
          showNotice(this, this.player.sprite.x, this.player.body.top - 10, `${label}${objectParticle(label)} 들어야 쓸 수 있다.`);
        }
        continue;
      }
      if (!this.player.useSkill(skill, time)) continue;

      // 들고 있는 칼을 앞으로 던진다 (손 위치에서 공격 범위 끝까지)
      if (weaponId) {
        const f = this.player.facingDir;
        const from = { x: this.player.sprite.x + f * (RANGE_UNIT / 2), y: this.player.sprite.y - 6 };
        throwWeapon(this, heldTextureKey(weaponId), from, f, toPixels(skill.range), skill.poseMs);
      }
      return; // 한 번에 스킬 하나만
    }
  }

  /** 화면을 어둡게 한 뒤 포탈이 가리키는 맵의 포탈 위에서 다시 시작한다 */
  private enterPortal(portal: PortalObject) {
    const { to } = portal;
    if (!to) {
      showNotice(this, this.player.sprite.x, this.player.body.top - 10, '빛 기둥 너머는 아직 준비 중이다...');
      return;
    }
    this.leaving = true;
    this.cameras.main.fadeOut(FADE_MS);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ mapId: to.map, portalId: to.portal } satisfies GameSceneData);
    });
  }
}

/** 받침이 있으면 "을", 없으면 "를" (검을, 바지를) */
function objectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code < 11172 && code % 28 !== 0 ? '을' : '를';
}
