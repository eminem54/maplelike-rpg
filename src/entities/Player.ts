import Phaser from 'phaser';
import { KEYS } from '../data/keymap';
import type { Climbable } from '../data/maps';
import { BASIC_ATTACK } from '../data/player';
import { RANGE_UNIT, toPixels } from '../data/units';
import type { KeyInput } from '../systems/KeyInput';
import type { CharacterStats } from '../systems/Stats';
import { showDamage } from '../effects/damageText';
import { createPixelTexture, padRows } from '../art/pixelArt';
import {
  PLAYER_CANVAS_PIXELS, PLAYER_CLIMB_ANIM, PLAYER_CLIMB_SEQUENCE, PLAYER_FRAMES, PLAYER_IDLE_TEXTURE,
  PLAYER_PALETTE, PLAYER_PIXEL_SCALE, PLAYER_PUNCH_TEXTURE, PLAYER_WALK_ANIM, PLAYER_WALK_SEQUENCE,
} from '../art/playerArt';

// 충돌 박스. 그림(48x72)보다 좁게 잡아 팔 끝이 벽에 걸리지 않게 한다.
const WIDTH = 30;
const HEIGHT = 72;

const MOVE_SPEED = 260; // 이동속도 100%일 때
const JUMP_VELOCITY = -580; // 점프 높이 ≈ 580² / (2 × 중력 1400) ≈ 120px
const CLIMB_SPEED = 160;
const ROPE_JUMP_VELOCITY = -360; // 밧줄에서 옆으로 뛰어내릴 때
const GRAB_RANGE = 18; // 밧줄 중심에서 이 거리 안이면 잡을 수 있다
const REGRAB_DELAY = 300; // 뛰어내린 직후 같은 밧줄을 다시 잡지 않도록 (ms)
const WALK_FPS = 10;
const CLIMB_FPS = 6;
const HURT_KNOCKBACK_X = 180; // 맞으면 맞은 반대쪽으로 튕겨 나간다
const HURT_KNOCKBACK_Y = -260;
const HURT_STUN_MS = 300; // 튕겨 나가는 동안은 조작할 수 없다
const INVINCIBLE_MS = 1000; // 맞은 뒤 깜빡이며 무적

/** 공격 판정. area 안에 있는 대상에게 damage를 준다. */
export type AttackHandler = (area: Phaser.Geom.Rectangle, damage: number, dir: 1 | -1) => void;

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly body: Phaser.Physics.Arcade.Body;
  private rope: Climbable | null = null;
  private regrabBlockedUntil = 0;
  private facing: 1 | -1 = 1;
  private attackReadyAt = 0;
  private attackPoseUntil = 0;
  private attackStartedAt = -Infinity;
  private hurtUntil = 0;
  private invincibleUntil = 0;
  private readonly spawn: { x: number; y: number };

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    private climbables: Climbable[],
    private stats: CharacterStats,
    private onAttack: AttackHandler,
  ) {
    for (const [key, rows] of Object.entries(PLAYER_FRAMES)) {
      createPixelTexture(scene, key, padRows(rows, PLAYER_CANVAS_PIXELS), PLAYER_PALETTE, PLAYER_PIXEL_SCALE);
    }
    createLoopAnim(scene, PLAYER_WALK_ANIM, PLAYER_WALK_SEQUENCE, WALK_FPS);
    createLoopAnim(scene, PLAYER_CLIMB_ANIM, PLAYER_CLIMB_SEQUENCE, CLIMB_FPS);
    this.sprite = scene.physics.add.sprite(x, y, PLAYER_IDLE_TEXTURE);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(WIDTH, HEIGHT, true);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocityY(1200);
    this.sprite.setDepth(10); // 손에 든 장비(HeldItems)가 이 위에 그려진다
    this.spawn = { x, y };
  }

  get climbing() {
    return this.rope !== null;
  }

  /** 보고 있는 방향 (1 = 오른쪽) */
  get facingDir() {
    return this.facing;
  }

  /** 마지막으로 공격을 시작한 시각 */
  get lastAttackAt() {
    return this.attackStartedAt;
  }

  /** 공격 동작 진행도 0~1 (공격 중이 아니면 null). 무기를 휘두르는 각도에 쓴다. */
  attackProgress(time: number) {
    if (time >= this.attackPoseUntil) return null;
    return Phaser.Math.Clamp((time - this.attackStartedAt) / BASIC_ATTACK.poseMs, 0, 1);
  }

  update(keys: KeyInput, time: number) {
    const h = (keys.isDown(KEYS.right) ? 1 : 0) - (keys.isDown(KEYS.left) ? 1 : 0);
    const v = (keys.isDown(KEYS.down) ? 1 : 0) - (keys.isDown(KEYS.up) ? 1 : 0);

    // 무적 시간 동안 깜빡인다
    this.sprite.setAlpha(time < this.invincibleUntil && Math.floor(time / 80) % 2 === 0 ? 0.35 : 1);
    if (time < this.hurtUntil) return; // 튕겨 나가는 중

    if (this.rope) {
      this.updateClimb(this.rope, keys, h, v, time);
      return;
    }

    const onGround = this.body.blocked.down || this.body.touching.down;

    // X를 누르고 있으면 쿨다운마다 계속 때린다
    if (keys.isDown(KEYS.attack) && time >= this.attackReadyAt) {
      this.attack(time);
    }
    const attacking = time < this.attackPoseUntil;

    if (!attacking && time >= this.regrabBlockedUntil) {
      // ↑: 몸이 밧줄 구간에 걸쳐 있으면 잡는다 (공중에서도 가능)
      if (v < 0) {
        const r = this.findClimbable((c) => this.body.top < c.bottom && this.body.bottom > c.top + 4);
        if (r) return this.grab(r, this.sprite.y);
      }
      // ↓: 발판 위 밧줄 꼭대기에 서 있으면 타고 내려간다
      if (v > 0 && onGround) {
        const r = this.findClimbable((c) => Math.abs(this.body.bottom - c.top) <= 4);
        if (r) return this.grab(r, r.top - HEIGHT / 2 + 8);
      }
    }

    if (attacking) {
      // 땅에서 때리는 동안은 멈춰 선다 (공중에서는 날아가던 대로)
      if (onGround) this.body.setVelocityX(0);
      return;
    }

    this.body.setVelocityX(h * this.moveSpeed);
    if (h !== 0) this.face(h);
    if (onGround && keys.justPressed(KEYS.jump)) {
      this.body.setVelocityY(JUMP_VELOCITY);
    }
    // 땅 위에서 움직일 때만 걷는 모션
    this.setWalking(onGround && h !== 0);
  }

  /** 대화 중일 때처럼 조작 없이 제자리에 서 있는다 */
  stand(time: number) {
    this.sprite.setAlpha(time < this.invincibleUntil && Math.floor(time / 80) % 2 === 0 ? 0.35 : 1);
    if (time < this.hurtUntil || this.rope) return;
    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) this.body.setVelocityX(0);
    if (time >= this.attackPoseUntil) this.setWalking(false);
  }

  /**
   * 몬스터와 닿았을 때. 방어력만큼 줄어든 데미지(최소 1)를 받고 튕겨 나간다.
   * @param fromDir 맞은 쪽에서 플레이어를 미는 방향 (1 = 오른쪽으로)
   */
  takeHit(damage: number, fromDir: 1 | -1) {
    const time = this.scene.time.now;
    if (time < this.invincibleUntil) return;

    const taken = Math.max(1, Math.round(damage - this.stats.derived.defense));
    this.stats.hp = Math.max(0, this.stats.hp - taken);
    showDamage(this.scene, this.sprite.x, this.body.top, taken, 'taken');

    if (this.rope) this.release();
    this.attackPoseUntil = 0;
    this.setWalking(false);
    this.face(-fromDir); // 맞은 쪽을 바라본다
    this.body.setVelocity(fromDir * HURT_KNOCKBACK_X, HURT_KNOCKBACK_Y);
    this.hurtUntil = time + HURT_STUN_MS;
    this.invincibleUntil = time + INVINCIBLE_MS;

    if (this.stats.hp === 0) this.revive();
  }

  /** HP가 0이 되면 시작 위치에서 HP를 가득 채워 다시 시작한다 (임시) */
  private revive() {
    this.stats.hp = this.stats.derived.maxHp;
    this.body.reset(this.spawn.x, this.spawn.y);
    this.hurtUntil = 0;
  }

  /** 이동속도(%)가 반영된 걷기 속도 */
  private get moveSpeed() {
    return (MOVE_SPEED * this.stats.derived.moveSpeed) / 100;
  }

  private attack(time: number) {
    const stats = this.stats.derived;
    // 공격속도가 높을수록 다음 공격까지의 간격이 짧아진다
    this.attackReadyAt = time + (BASIC_ATTACK.cooldownMs * 100) / stats.attackSpeed;
    this.attackPoseUntil = time + BASIC_ATTACK.poseMs;
    this.attackStartedAt = time;

    if (this.sprite.anims.isPlaying) this.sprite.anims.stop();
    this.sprite.setTexture(PLAYER_PUNCH_TEXTURE);

    // 판정: 몸 앞면(가운데 + 범위 0.5)에서 앞으로 range만큼, 높이는 몸 전체
    const reach = toPixels(BASIC_ATTACK.range);
    const front = this.sprite.x + this.facing * (RANGE_UNIT / 2);
    const left = this.facing === 1 ? front : front - reach;
    const area = new Phaser.Geom.Rectangle(left, this.body.top, reach, HEIGHT);
    this.onAttack(area, Math.round(this.stats.rollAttack() * BASIC_ATTACK.power), this.facing);
  }

  private face(dir: number) {
    this.facing = dir < 0 ? -1 : 1;
    this.sprite.setFlipX(this.facing < 0); // 그림은 오른쪽을 보고 있다
  }

  private setWalking(walking: boolean) {
    if (walking) this.sprite.anims.play(PLAYER_WALK_ANIM, true);
    else this.showIdle();
  }

  private showIdle() {
    if (this.sprite.anims.isPlaying || this.sprite.anims.isPaused) this.sprite.anims.stop();
    if (this.sprite.texture.key !== PLAYER_IDLE_TEXTURE) this.sprite.setTexture(PLAYER_IDLE_TEXTURE);
  }

  private updateClimb(r: Climbable, keys: KeyInput, h: number, v: number, time: number) {
    // 방향키 + 점프로 옆으로 뛰어내린다
    if (h !== 0 && keys.justPressed(KEYS.jump)) {
      this.release();
      this.body.setVelocity(h * this.moveSpeed, ROPE_JUMP_VELOCITY);
      this.face(h);
      this.regrabBlockedUntil = time + REGRAB_DELAY;
      return;
    }

    this.body.setVelocity(0, v * CLIMB_SPEED);

    // 오르내리는 동안만 팔다리를 움직이고, 멈추면 그 자세 그대로 매달려 있는다
    const anims = this.sprite.anims;
    if (v !== 0 && anims.isPaused) anims.resume();
    else if (v === 0 && !anims.isPaused) anims.pause();

    if (v < 0 && this.body.bottom <= r.top) {
      this.release();
      this.body.reset(r.x, r.top - HEIGHT / 2); // 꼭대기 발판 위에 선다
    } else if (v > 0 && this.body.bottom >= r.bottom) {
      this.release();
      this.body.reset(r.x, r.bottom - HEIGHT / 2); // 아래 바닥/발판에 선다
    }
  }

  private findClimbable(fits: (c: Climbable) => boolean) {
    return this.climbables.find((c) => Math.abs(this.sprite.x - c.x) <= GRAB_RANGE && fits(c));
  }

  private grab(r: Climbable, y: number) {
    this.rope = r;
    this.body.setAllowGravity(false);
    this.body.reset(r.x, y);
    // 뒷모습으로 바꾸고, 움직이기 전까지는 첫 자세로 멈춰 있는다
    this.sprite.anims.play(PLAYER_CLIMB_ANIM);
    this.sprite.anims.pause();
  }

  private release() {
    this.rope = null;
    this.body.setAllowGravity(true);
    this.showIdle();
  }
}

function createLoopAnim(scene: Phaser.Scene, key: string, textures: string[], frameRate: number) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({ key, frames: textures.map((t) => ({ key: t })), frameRate, repeat: -1 });
}
