import Phaser from 'phaser';
import { HELD_ITEM_ART, HELD_ITEM_SCALE, heldTextureKey } from '../art/heldItemArt';
import { createPixelTexture } from '../art/pixelArt';
import { PLAYER_CANVAS_PIXELS, PLAYER_PIXEL_SCALE, PLAYER_PUNCH_TEXTURE } from '../art/playerArt';
import { ITEM_PALETTE } from '../data/items';
import type { Equipment } from '../systems/Equipment';
import type { Player } from './Player';

type Point = readonly [x: number, y: number];
type Hands = { front: Point; back: Point };

/**
 * 자세(텍스처)별 손 위치. 캐릭터 그림(24 x 24 픽셀)의 픽셀 좌표이고, 오른쪽을 볼 때 기준이다.
 * front = 앞쪽 손(무기), back = 뒤쪽 손(방패)
 */
const DEFAULT_HANDS: Hands = { front: [17, 18], back: [8, 18] };
const HANDS_BY_POSE: Record<string, Hands> = {
  [PLAYER_PUNCH_TEXTURE]: { front: [21.5, 15], back: [8, 18] }, // 팔을 앞으로 뻗었다
};
const CANVAS_CENTER = PLAYER_CANVAS_PIXELS / 2;

const IDLE_SWORD_ANGLE = 25; // 평소: 칼끝이 위로, 살짝 앞을 향한다 (0 = 똑바로 위)
const SWING_FROM = -110; // 휘두르기 시작: 뒤쪽 위
const SWING_TO = 100; // 휘두르기 끝: 앞쪽 아래
const SLASH_RADIUS = 36;
const SLASH_FADE_MS = 160;

/** 장착한 무기·방패를 캐릭터 손에 그리고, 공격할 때 무기를 휘두른다 */
export class HeldItems {
  private readonly weapon: Phaser.GameObjects.Image;
  private readonly shield: Phaser.GameObjects.Image;
  private slashedAt = -Infinity;

  constructor(private scene: Phaser.Scene, private player: Player, private equipment: Equipment) {
    for (const [id, art] of Object.entries(HELD_ITEM_ART)) {
      createPixelTexture(scene, heldTextureKey(id), art.rows, ITEM_PALETTE, HELD_ITEM_SCALE);
    }
    const depth = player.sprite.depth;
    this.shield = scene.add.image(0, 0, '__DEFAULT').setVisible(false).setDepth(depth + 1);
    this.weapon = scene.add.image(0, 0, '__DEFAULT').setVisible(false).setDepth(depth + 2);

    // 물리 이동이 캐릭터 위치에 반영된 뒤에 따라가야 한 프레임씩 밀리지 않는다
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.sync, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.sync, this);
    });
  }

  private sync(time: number) {
    const hands = HANDS_BY_POSE[this.player.sprite.texture.key] ?? DEFAULT_HANDS;
    // 밧줄을 탈 때는 뒷모습이라 들고 있는 장비를 감춘다
    const hidden = this.player.climbing;
    const swing = this.player.attackProgress(time);

    this.place(this.shield, this.equipment.get('shield')?.itemId, hands.back, 0, hidden);
    const angle = swing === null
      ? IDLE_SWORD_ANGLE
      : Phaser.Math.Linear(SWING_FROM, SWING_TO, Phaser.Math.Easing.Cubic.Out(swing));
    const holding = this.place(this.weapon, this.equipment.get('weapon')?.itemId, hands.front, angle, hidden);

    // 무기를 들고 공격하면 칼끝을 따라 베기 자국을 남긴다
    if (holding && swing !== null && this.player.lastAttackAt !== this.slashedAt) {
      this.slashedAt = this.player.lastAttackAt;
      this.drawSlash();
    }
  }

  /** 아이템을 손 위치에 놓는다. 들고 있으면 true */
  private place(img: Phaser.GameObjects.Image, itemId: string | undefined, hand: Point, angle: number, hidden: boolean) {
    const art = itemId ? HELD_ITEM_ART[itemId] : undefined;
    if (!itemId || !art || hidden) {
      img.setVisible(false);
      return false;
    }
    const key = heldTextureKey(itemId);
    if (img.texture.key !== key) {
      img.setTexture(key).setOrigin(art.grip.x / art.rows[0].length, art.grip.y / art.rows.length);
    }
    const sprite = this.player.sprite;
    const f = this.player.facingDir;
    img
      .setPosition(
        sprite.x + f * (hand[0] - CANVAS_CENTER) * PLAYER_PIXEL_SCALE,
        sprite.y + (hand[1] - CANVAS_CENTER) * PLAYER_PIXEL_SCALE,
      )
      .setFlipX(f < 0)
      .setAngle(f * angle)
      .setAlpha(sprite.alpha) // 무적 깜빡임도 같이
      .setVisible(true);
    return true;
  }

  /** 휘두르는 궤적을 따라 하얀 반달 모양을 그렸다가 지운다 */
  private drawSlash() {
    const f = this.player.facingDir;
    // 칼 각도(0 = 위)를 화면 각도(0 = 오른쪽, 시계 방향)로 바꾼다
    const toScreen = (swordAngle: number) => Phaser.Math.DegToRad(f * swordAngle - 90);
    const { x, y } = this.weapon;
    const g = this.scene.add.graphics().setDepth(this.weapon.depth + 1);
    g.lineStyle(10, 0xffffff, 0.35);
    g.beginPath();
    g.arc(x, y, SLASH_RADIUS, toScreen(SWING_FROM), toScreen(SWING_TO), f < 0);
    g.strokePath();
    g.lineStyle(3, 0xffffff, 0.9);
    g.beginPath();
    g.arc(x, y, SLASH_RADIUS + 3, toScreen(SWING_FROM), toScreen(SWING_TO), f < 0);
    g.strokePath();
    this.scene.tweens.add({ targets: g, alpha: 0, duration: SLASH_FADE_MS, onComplete: () => g.destroy() });
  }
}
