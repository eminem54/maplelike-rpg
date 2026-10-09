import Phaser from 'phaser';
import { createPixelTexture } from '../art/pixelArt';
import { getItem, ITEM_ICON_SCALE, ITEM_PALETTE, itemTextureKey, type ItemId } from '../data/items';

const POP_HEIGHT = 50; // 떨어질 때 튀어 오르는 높이
const POP_MS = 450;
const FLOAT = 3; // 바닥에서 둥실거리는 폭
const FLOAT_MS = 900;
const PICK_RANGE_X = 36; // 이만큼 가까이 서 있으면 주울 수 있다
const PICK_RANGE_Y = 30;
const PICK_MS = 220;

/** 몬스터가 쓰러진 자리에 떨어진 아이템. Z를 눌러 줍는다. */
export class DropItem {
  private readonly sprite: Phaser.GameObjects.Image;
  private picked = false;

  /** groundY: 떨어진 바닥 높이 (몬스터가 서 있던 곳) */
  constructor(private scene: Phaser.Scene, readonly itemId: ItemId, readonly x: number, private groundY: number) {
    const def = getItem(itemId)!;
    createPixelTexture(scene, itemTextureKey(itemId), def.icon, ITEM_PALETTE, ITEM_ICON_SCALE);
    this.sprite = scene.add.image(x, groundY, itemTextureKey(itemId)).setOrigin(0.5, 1).setDepth(20);

    // 위로 톡 튀었다가 바닥에 내려앉고, 그 뒤로는 둥실거린다
    const restY = groundY - 2;
    scene.tweens.chain({
      targets: this.sprite,
      tweens: [
        { y: restY - POP_HEIGHT, duration: POP_MS / 2, ease: 'Quad.easeOut' },
        { y: restY, duration: POP_MS / 2, ease: 'Quad.easeIn' },
        { y: restY - FLOAT, duration: FLOAT_MS, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 },
      ],
    });
  }

  /** 플레이어 발 위치에서 주울 수 있는가 */
  canPickUp(footX: number, footY: number) {
    return !this.picked && Math.abs(footX - this.x) <= PICK_RANGE_X && Math.abs(footY - this.groundY) <= PICK_RANGE_Y;
  }

  /** 플레이어 쪽으로 빨려 들어가며 사라진다 */
  pickUp(toX: number, toY: number) {
    this.picked = true;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      x: toX,
      y: toY,
      alpha: 0,
      scale: 0.5,
      duration: PICK_MS,
      ease: 'Quad.easeIn',
      onComplete: () => this.sprite.destroy(),
    });
  }
}
