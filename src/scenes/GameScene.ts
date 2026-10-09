import Phaser from 'phaser';
import { KNIGHT_PIXEL_SCALE, KNIGHT_PALETTE, KNIGHT_ROWS, KNIGHT_TEXTURE } from '../art/knightArt';
import { ALL_KEY_CODES, KEYS } from '../data/keymap';
import { FIELD_1, type Climbable, type MapData } from '../data/maps';
import { showLevelUp, showNotice } from '../effects/damageText';
import { HeldItems } from '../entities/HeldItems';
import { Npc } from '../entities/Npc';
import { Player } from '../entities/Player';
import { Portal } from '../entities/Portal';
import { Sandbag } from '../entities/Sandbag';
import { KNIGHT_NAME, talkToKnight } from '../story/knight';
import { Equipment } from '../systems/Equipment';
import { Inventory } from '../systems/Inventory';
import { KeyInput } from '../systems/KeyInput';
import { MonsterSpawner } from '../systems/MonsterSpawner';
import { Progress } from '../systems/Progress';
import { AutoSaver, browserStorage, readSave, restore, type GameState } from '../systems/SaveGame';
import { CharacterStats } from '../systems/Stats';
import { Terrain } from '../systems/Terrain';
import { HUD_HEIGHT } from '../ui/Hud';
import type { UIScene, UISceneData } from './UIScene';

const PLATFORM_THICKNESS = 20;
const GRASS_THICKNESS = 14;
const AUTOSAVE_MS = 1000;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private keys!: KeyInput;
  private terrain!: Terrain;
  private sandbag!: Sandbag;
  private spawner!: MonsterSpawner;
  private knight!: Npc;
  private portal!: Portal;
  private inventory = new Inventory();
  private stats = new CharacterStats();
  private equipment = new Equipment(this.inventory, this.stats);
  private progress = new Progress();
  private shownLevel = 1;

  constructor() {
    super('GameScene');
  }

  create() {
    // 저장된 진행 상황을 불러오고, 바뀔 때마다 자동으로 저장한다
    this.setUpSaving();

    const map: MapData = FIELD_1;
    this.terrain = new Terrain(map.terrain);
    const groundAt = (x: number) => this.terrain.heightAt(x);

    this.physics.world.setBounds(0, 0, map.width, map.height);

    // 밧줄은 발판 뒤에 보이도록 먼저 그린다
    const g = this.add.graphics();
    for (const c of map.climbables) drawClimbable(g, c);
    drawGround(this.add.graphics(), map);

    // 공중 발판 (아래에서 뚫고 올라갈 수 있다). 바닥은 Terrain이 따로 처리한다.
    const solids = this.physics.add.staticGroup();
    for (const p of map.platforms) {
      const rect = this.add.rectangle(
        p.x + p.w / 2, p.y + PLATFORM_THICKNESS / 2, p.w, PLATFORM_THICKNESS, 0x9b6b3d,
      );
      solids.add(rect);
      const b = rect.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.down = false;
      b.checkCollision.left = false;
      b.checkCollision.right = false;
    }

    // 연습용 샌드백
    this.sandbag = new Sandbag(this, map.sandbagX, groundAt(map.sandbagX));

    // 오른쪽 끝: 황금기사와 다음 맵으로 가는 빛 기둥
    this.portal = new Portal(this, map.portalX, groundAt(map.portalX));
    this.knight = new Npc(this, map.knightX, groundAt(map.knightX), KNIGHT_NAME, {
      texture: KNIGHT_TEXTURE, rows: KNIGHT_ROWS, palette: KNIGHT_PALETTE, scale: KNIGHT_PIXEL_SCALE,
    });

    // 공격 대상: 샌드백과 맵에 있는 몬스터
    const startX = map.playerStartX;
    this.player = new Player(this, startX, groundAt(startX) - 36, map.climbables, this.stats, (area, damage, dir) => {
      for (const t of [this.sandbag, ...this.spawner.monsters]) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(area, t.getHitBounds())) t.takeHit(damage, dir);
      }
    });
    // 밧줄을 타는 동안에는 발판을 통과한다
    this.physics.add.collider(this.player.sprite, solids, undefined, () => !this.player.climbing);
    // 장착한 무기·방패를 손에 든 모습으로 그린다
    new HeldItems(this, this.player, this.equipment);

    // 몬스터는 정해진 구간의 바닥과 모든 발판 위에서 나온다
    const surfaces = [
      { left: map.spawnArea.left, right: map.spawnArea.right, yAt: groundAt },
      ...map.platforms.map((p) => ({ left: p.x, right: p.x + p.w, yAt: () => p.y })),
    ];
    this.spawner = new MonsterSpawner(this, map.spawn, surfaces, solids, this.player, (m) => this.stats.gainExp(m.data.exp));

    // 게임 화면은 하단 HUD 위쪽까지만 쓴다 (HUD가 캐릭터를 가리지 않도록)
    this.cameras.main
      .setViewport(0, 0, this.scale.width, this.scale.height - HUD_HEIGHT)
      .setBackgroundColor('#8fd3ff');
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

    this.keys = new KeyInput(this, ALL_KEY_CODES);
    this.scene.launch('UIScene', {
      inventory: this.inventory, equipment: this.equipment, stats: this.stats, progress: this.progress,
    } satisfies UISceneData);

    this.add
      .text(16, 16, '← → 이동   C 점프   X 공격   Space 대화   ↑ ↓ 밧줄·사다리·빛 기둥   I 인벤토리   S 상태', {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#1b1b1b',
      })
      .setScrollFactor(0);
  }

  private setUpSaving() {
    const state: GameState = {
      stats: this.stats, inventory: this.inventory, equipment: this.equipment, progress: this.progress,
    };
    const storage = browserStorage();
    const saved = readSave(storage);
    if (saved) restore(state, saved);
    this.shownLevel = this.stats.level; // 불러온 레벨로 "LEVEL UP!"이 뜨지 않게

    const saver = new AutoSaver(state, storage);
    this.time.addEvent({ delay: AUTOSAVE_MS, loop: true, callback: () => saver.save() });
    // 새로고침하거나 창을 닫을 때도 저장한다
    const saveNow = () => saver.save();
    window.addEventListener('pagehide', saveNow);
    window.addEventListener('beforeunload', saveNow);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('pagehide', saveNow);
      window.removeEventListener('beforeunload', saveNow);
    });
  }

  update(time: number) {
    const dialog = (this.scene.get('UIScene') as UIScene).dialog;
    const talking = dialog?.busy ?? false;

    // 물리 이동이 끝난 몸을 지형 위에 세운다 (경사, 언덕)
    if (!this.player.climbing) this.terrain.resolve(this.player.body);
    for (const m of this.spawner.monsters) if (m.alive) this.terrain.resolve(m.body);

    // 대화 중에는 조작하지 않고 서 있는다
    if (talking) this.player.stand(time);
    else this.player.update(this.keys, time);

    const footX = this.player.sprite.x;
    const footY = this.player.body.bottom;
    const nearKnight = !this.player.climbing && this.knight.isNear(footX, footY);
    this.knight.setHintVisible(nearKnight && !talking);
    if (!talking && dialog) {
      if (nearKnight && this.keys.justPressed(KEYS.interact)) {
        talkToKnight({ dialog, inventory: this.inventory, progress: this.progress });
      }
      // 다음 맵은 아직 없어서 이동하지 않는다
      if (this.portal.contains(footX, footY) && this.keys.justPressed(KEYS.up)) {
        showNotice(this, footX, this.player.body.top - 10, '빛 기둥 너머는 아직 준비 중이다...');
      }
    }

    this.spawner.update(time);

    // 몬스터를 잡아서든 개발자 메뉴로든 레벨이 오르면 연출을 띄운다
    if (this.stats.level > this.shownLevel) showLevelUp(this, this.player.sprite.x, this.player.body.top - 10);
    this.shownLevel = this.stats.level;
  }
}

/** 흙을 채우고 윗면에 풀을 깐다 */
function drawGround(g: Phaser.GameObjects.Graphics, map: MapData) {
  const top = map.terrain.map(([x, y]) => new Phaser.Math.Vector2(x, y));
  g.fillStyle(0x7a5230);
  g.fillPoints([...top, new Phaser.Math.Vector2(map.width, map.height), new Phaser.Math.Vector2(0, map.height)], true);
  g.lineStyle(GRASS_THICKNESS, 0x4a8c3a);
  g.strokePoints(top.map((p) => new Phaser.Math.Vector2(p.x, p.y + GRASS_THICKNESS / 2)));
}

function drawClimbable(g: Phaser.GameObjects.Graphics, c: Climbable) {
  if (c.kind === 'rope') {
    g.fillStyle(0xc8a165);
    g.fillRect(c.x - 3, c.top, 6, c.bottom - c.top);
    return;
  }
  const half = 14;
  g.fillStyle(0x8a5a2b);
  g.fillRect(c.x - half - 3, c.top, 5, c.bottom - c.top);
  g.fillRect(c.x + half - 2, c.top, 5, c.bottom - c.top);
  for (let y = c.top + 12; y < c.bottom; y += 22) {
    g.fillRect(c.x - half, y, half * 2, 4);
  }
}
