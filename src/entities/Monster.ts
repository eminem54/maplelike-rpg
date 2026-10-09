import Phaser from 'phaser';
import { createPixelTexture } from '../art/pixelArt';
import { statsAtLevel, type MonsterData, type MonsterStats } from '../data/monsters';
import { showDamage } from '../effects/damageText';
import { GAUGE, TEXT } from '../theme/colors';
import type { Hittable } from './Hittable';

const WADDLE_PERIOD = 500; // 한 번 왼쪽→오른쪽으로 기우는 데 걸리는 시간 (ms)
const HIT_STUN_MS = 250; // 맞고 밀려나는 시간
const HIT_KNOCKBACK = 120;
const HP_BAR_W = 36;
const HP_BAR_H = 4;
const LEVEL_TEXT_H = 14; // 머리 위 레벨 글자 높이 (체력바는 그 위에 그린다)
const FADE_MS = 400; // 나타나고 사라지는 시간

export type MonsterCallbacks = {
  /** 플레이어에게 쓰러졌을 때 (경험치 지급 등) */
  onKilled: (monster: Monster) => void;
  /** 사라지는 연출이 끝나고 맵에서 완전히 없어졌을 때 */
  onRemoved: (monster: Monster) => void;
};

/** 몬스터 생김새. 그림은 오른쪽을 보고 있어야 한다. */
export type MonsterLook = {
  /** 텍스처 이름 → 픽셀 행. 이름은 모든 몬스터 사이에서 겹치지 않아야 한다. */
  frames: Record<string, string[]>;
  palette: Record<string, number>;
  scale: number;
  /** 걷기 / 화나서 쫓아올 때 번갈아 보여줄 프레임. 첫 프레임이 서 있는 모습이다. */
  walk: string[];
  angryWalk: string[];
  /** 걷기 애니메이션 속도 (초당 프레임) */
  fps: number;
  /** 걸을 때 좌우로 기우는 각도 (뒤뚱거림). 0이면 기울지 않는다. */
  waddle: number;
};

type Wander = { dir: -1 | 0 | 1; until: number };

/** 선공하지 않는 몬스터. 맞으면 화가 나서 플레이어를 쫓아온다. 생김새와 능력치는 data로 정한다. */
export class Monster implements Hittable {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly body: Phaser.Physics.Arcade.Body;
  private hp: number;
  private angry = false;
  private dead = false;
  private wander: Wander = { dir: 0, until: 0 };
  private stunUntil = 0;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private readonly levelText: Phaser.GameObjects.Text;
  /** 이 몬스터의 레벨에 맞춘 능력치 */
  readonly stats: MonsterStats;

  /**
   * @param level data.level 범위 안의 레벨
   * @param x 나타나는 위치 (가운데)
   * @param groundY 서 있는 바닥 높이
   * @param range 돌아다닐 수 있는 x 범위 (자기 발판을 벗어나지 않는다)
   */
  constructor(
    private scene: Phaser.Scene,
    readonly data: MonsterData,
    readonly level: number,
    x: number,
    groundY: number,
    private range: { minX: number; maxX: number },
    private callbacks: MonsterCallbacks,
  ) {
    const { look } = data;
    for (const [key, rows] of Object.entries(look.frames)) {
      createPixelTexture(scene, key, rows, look.palette, look.scale);
    }
    for (const [key, frames] of [[this.walkKey, look.walk], [this.angryWalkKey, look.angryWalk]] as const) {
      if (!scene.anims.exists(key)) {
        scene.anims.create({ key, frames: frames.map((f) => ({ key: f })), frameRate: look.fps, repeat: -1 });
      }
    }

    // 발밑을 기준으로 기울어야 뒤뚱거리는 느낌이 난다
    this.sprite = scene.physics.add.sprite(x, groundY, look.walk[0]).setOrigin(0.5, 1).setAlpha(0);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.stats = statsAtLevel(data, level);
    this.hp = this.stats.maxHp;
    this.hpBar = scene.add.graphics().setDepth(40);
    this.levelText = scene.add
      .text(0, 0, `Lv.${level}`, {
        fontFamily: 'sans-serif', fontSize: '11px', color: TEXT.main, stroke: TEXT.outline, strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(40)
      .setAlpha(0);
    this.placeLevelText();
    scene.tweens.add({ targets: [this.sprite, this.levelText], alpha: 1, duration: FADE_MS });
  }

  private get walkKey() {
    return `${this.data.id}-walk`;
  }

  private get angryWalkKey() {
    return `${this.data.id}-angry-walk`;
  }

  get alive() {
    return !this.dead;
  }

  getHitBounds() {
    return this.sprite.getBounds();
  }

  takeHit(damage: number, dir: 1 | -1) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - damage);
    showDamage(this.scene, this.sprite.x, this.sprite.y - this.sprite.height, damage);

    if (this.hp === 0) {
      this.die();
      this.callbacks.onKilled(this);
      return;
    }
    this.angry = true;
    this.stunUntil = this.scene.time.now + HIT_STUN_MS;
    this.body.setVelocityX(dir * HIT_KNOCKBACK);
  }

  update(time: number, targetX: number) {
    if (this.dead) return;

    let dir: -1 | 0 | 1 = 0;
    if (time < this.stunUntil) {
      dir = 0; // 밀려나는 중에는 속도를 그대로 둔다 (단, 발판 밖으로 떨어지지 않게 끝에서 멈춘다)
      const vx = this.body.velocity.x;
      if ((vx < 0 && this.sprite.x <= this.range.minX) || (vx > 0 && this.sprite.x >= this.range.maxX)) {
        this.body.setVelocityX(0);
      }
    } else {
      dir = this.angry ? this.chaseDir(targetX) : this.wanderDir(time);
      // 자기 구역 끝이나 가파른 언덕에 막히면 더 가지 않는다 (돌아다닐 때는 방향을 바꾼다)
      const blockedLeft = this.sprite.x <= this.range.minX || this.body.blocked.left;
      const blockedRight = this.sprite.x >= this.range.maxX || this.body.blocked.right;
      if ((dir < 0 && blockedLeft) || (dir > 0 && blockedRight)) {
        if (!this.angry) this.wander = { dir: (-dir) as -1 | 1, until: this.wander.until };
        dir = this.angry ? 0 : this.wander.dir;
      }
      this.body.setVelocityX(dir * (this.angry ? this.data.chaseSpeed : this.data.walkSpeed));
    }

    this.animate(time, dir);
    this.placeLevelText();
    this.drawHpBar();
  }

  private chaseDir(targetX: number): -1 | 0 | 1 {
    const dx = targetX - this.sprite.x;
    if (Math.abs(dx) < 6) return 0;
    return dx < 0 ? -1 : 1;
  }

  /** 걷다가 멈췄다가를 무작위로 반복한다 */
  private wanderDir(time: number) {
    if (time >= this.wander.until) {
      const walk = this.wander.dir === 0 || Math.random() < 0.3;
      this.wander = walk
        ? { dir: Math.random() < 0.5 ? -1 : 1, until: time + Phaser.Math.Between(1500, 3500) }
        : { dir: 0, until: time + Phaser.Math.Between(1000, 2500) };
    }
    return this.wander.dir;
  }

  private animate(time: number, dir: number) {
    const moving = dir !== 0;
    if (moving) this.sprite.setFlipX(dir < 0); // 그림은 오른쪽을 보고 있다

    const { look } = this.data;
    if (moving) {
      this.sprite.anims.play(this.angry ? this.angryWalkKey : this.walkKey, true);
      this.sprite.setAngle(Math.sin((time / WADDLE_PERIOD) * Math.PI * 2) * look.waddle);
    } else {
      this.sprite.anims.stop();
      this.sprite.setTexture((this.angry ? look.angryWalk : look.walk)[0]);
      this.sprite.setAngle(0);
    }
  }

  /** 머리 위에 레벨을 띄운다 */
  private placeLevelText() {
    this.levelText.setPosition(this.sprite.x, this.sprite.y - this.sprite.height - 2);
  }

  /** 맞은 적이 있으면 레벨 위에 체력바를 보여준다 */
  private drawHpBar() {
    this.hpBar.clear();
    if (this.hp === this.stats.maxHp) return;
    const x = this.sprite.x - HP_BAR_W / 2;
    const y = this.sprite.y - this.sprite.height - LEVEL_TEXT_H - 8;
    this.hpBar.fillStyle(0x1a1a1a).fillRect(x - 1, y - 1, HP_BAR_W + 2, HP_BAR_H + 2);
    this.hpBar.fillStyle(GAUGE.hp).fillRect(x, y, HP_BAR_W * (this.hp / this.stats.maxHp), HP_BAR_H);
  }

  private die() {
    this.dead = true;
    this.hpBar.clear();
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    this.sprite.anims.stop();
    this.scene.tweens.killTweensOf([this.sprite, this.levelText]);
    this.scene.tweens.add({
      targets: [this.sprite, this.levelText],
      alpha: 0,
      duration: FADE_MS,
      onComplete: () => {
        this.callbacks.onRemoved(this);
        this.sprite.destroy();
        this.hpBar.destroy();
        this.levelText.destroy();
      },
    });
  }
}
