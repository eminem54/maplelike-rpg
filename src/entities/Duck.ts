import Phaser from 'phaser';
import { createPixelTexture } from '../art/pixelArt';
import { DUCK_ANIMS, DUCK_FRAMES, DUCK_PALETTE, DUCK_PIXEL_SCALE } from '../art/duckArt';
import type { MonsterData } from '../data/monsters';
import { showDamage } from '../effects/damageText';
import type { Hittable } from './Hittable';

const WALK_FPS = 4;
const WADDLE_ANGLE = 7; // 걸을 때 좌우로 기우는 각도
const WADDLE_PERIOD = 500; // 한 번 왼쪽→오른쪽으로 기우는 데 걸리는 시간 (ms)
const HIT_STUN_MS = 250; // 맞고 밀려나는 시간
const HIT_KNOCKBACK = 120;
const HP_BAR_W = 36;
const HP_BAR_H = 4;
const FADE_MS = 400; // 나타나고 사라지는 시간

export type MonsterCallbacks = {
  /** 플레이어에게 쓰러졌을 때 (경험치 지급 등) */
  onKilled: (monster: Duck) => void;
  /** 사라지는 연출이 끝나고 맵에서 완전히 없어졌을 때 */
  onRemoved: (monster: Duck) => void;
};

type Wander = { dir: -1 | 0 | 1; until: number };

/** 선공하지 않는 아기 오리. 맞으면 화가 나서 플레이어를 쫓아온다. */
export class Duck implements Hittable {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly body: Phaser.Physics.Arcade.Body;
  private hp: number;
  private angry = false;
  private dead = false;
  private wander: Wander = { dir: 0, until: 0 };
  private stunUntil = 0;
  private readonly hpBar: Phaser.GameObjects.Graphics;

  /**
   * @param x 나타나는 위치 (가운데)
   * @param groundY 서 있는 바닥 높이
   * @param range 돌아다닐 수 있는 x 범위 (자기 발판을 벗어나지 않는다)
   */
  constructor(
    private scene: Phaser.Scene,
    readonly data: MonsterData,
    x: number,
    groundY: number,
    private range: { minX: number; maxX: number },
    private callbacks: MonsterCallbacks,
  ) {
    for (const [key, rows] of Object.entries(DUCK_FRAMES)) {
      createPixelTexture(scene, key, rows, DUCK_PALETTE, DUCK_PIXEL_SCALE);
    }
    for (const anim of Object.values(DUCK_ANIMS)) {
      if (!scene.anims.exists(anim.key)) {
        scene.anims.create({
          key: anim.key, frames: anim.frames.map((key) => ({ key })), frameRate: WALK_FPS, repeat: -1,
        });
      }
    }

    // 발밑을 기준으로 기울어야 뒤뚱거리는 느낌이 난다
    this.sprite = scene.physics.add.sprite(x, groundY, 'duck-a').setOrigin(0.5, 1).setAlpha(0);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.hp = data.maxHp;
    this.hpBar = scene.add.graphics().setDepth(40);
    scene.tweens.add({ targets: this.sprite, alpha: 1, duration: FADE_MS });
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

    const anim = this.angry ? DUCK_ANIMS.angryWalk : DUCK_ANIMS.walk;
    if (moving) {
      this.sprite.anims.play(anim.key, true);
      this.sprite.setAngle(Math.sin((time / WADDLE_PERIOD) * Math.PI * 2) * WADDLE_ANGLE);
    } else {
      this.sprite.anims.stop();
      this.sprite.setTexture(anim.frames[0]);
      this.sprite.setAngle(0);
    }
  }

  /** 맞은 적이 있으면 머리 위에 체력바를 보여준다 */
  private drawHpBar() {
    this.hpBar.clear();
    if (this.hp === this.data.maxHp) return;
    const x = this.sprite.x - HP_BAR_W / 2;
    const y = this.sprite.y - this.sprite.height - 10;
    this.hpBar.fillStyle(0x1a1a1a).fillRect(x - 1, y - 1, HP_BAR_W + 2, HP_BAR_H + 2);
    this.hpBar.fillStyle(0xe0484f).fillRect(x, y, HP_BAR_W * (this.hp / this.data.maxHp), HP_BAR_H);
  }

  private die() {
    this.dead = true;
    this.hpBar.clear();
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    this.sprite.anims.stop();
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: FADE_MS,
      onComplete: () => {
        this.callbacks.onRemoved(this);
        this.sprite.destroy();
        this.hpBar.destroy();
      },
    });
  }
}
