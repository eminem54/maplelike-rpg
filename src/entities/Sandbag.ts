import Phaser from 'phaser';
import { createPixelTexture } from '../art/pixelArt';
import { showDamage } from '../effects/damageText';
import type { Hittable } from './Hittable';

const TEXTURE = 'sandbag';
const PIXEL_SCALE = 3;

// 연습용 샌드백 (12 x 16 픽셀). 체력이 없어 계속 때릴 수 있다.
const ROWS = [
  '....KKKK....',
  '...KccccK...',
  '....KccK....',
  '...KbbbbK...',
  '..KbbbbbbK..',
  '.KbbbbbbbbK.',
  'KbbbbbbbbbbK',
  'KbbBBbbbbbbK',
  'KbbBBbbbbbbK',
  'KbbbbbbbbbbK',
  'KbbbbbbbBbbK',
  'KbbbbbbbbbbK',
  'KbbbbbbbbbbK',
  '.KbbbbbbbbK.',
  '.KbbbbbbbbK.',
  '..KKKKKKKK..',
];
const PALETTE = {
  K: 0x3b2614, // 외곽선
  b: 0xc9a46b, // 자루
  B: 0xa8834f, // 덧댄 천
  c: 0x8a5a2b, // 끈
};

export class Sandbag implements Hittable {
  private sprite: Phaser.GameObjects.Image;

  /** x: 가운데, groundY: 바닥 높이 */
  constructor(private scene: Phaser.Scene, x: number, groundY: number) {
    createPixelTexture(scene, TEXTURE, ROWS, PALETTE, PIXEL_SCALE);
    this.sprite = scene.add.image(x, groundY, TEXTURE).setOrigin(0.5, 1);
  }

  getHitBounds() {
    return this.sprite.getBounds();
  }

  takeHit(damage: number, dir: 1 | -1) {
    showDamage(this.scene, this.sprite.x, this.sprite.y - this.sprite.height, damage);

    // 맞으면 밀린 방향으로 살짝 기울었다 돌아온다
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setAngle(0);
    this.scene.tweens.add({ targets: this.sprite, angle: 8 * dir, duration: 70, yoyo: true, ease: 'Sine.easeOut' });
  }
}
