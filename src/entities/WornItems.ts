import Phaser from 'phaser';
import { createPixelTexture, padRows } from '../art/pixelArt';
import { PLAYER_CANVAS_PIXELS, PLAYER_FRAMES, PLAYER_PIXEL_SCALE } from '../art/playerArt';
import { WORN_ITEM_ART, wornPalette, wornRows, wornTextureKey, type WornLayer } from '../art/wornItemArt';
import type { Equipment } from '../systems/Equipment';
import type { Player } from './Player';

/** 그리는 순서: 하의 위에 상의 */
const LAYERS: { layer: WornLayer; slot: 'bottom' | 'top' }[] = [
  { layer: 'bottom', slot: 'bottom' },
  { layer: 'top', slot: 'top' },
];

/** 장착한 상의·하의를 캐릭터 몸 위에 겹쳐 그린다. 캐릭터 자세가 바뀌면 같은 자세의 옷 그림으로 바꾼다. */
export class WornItems {
  private readonly images: Phaser.GameObjects.Image[];

  constructor(scene: Phaser.Scene, private player: Player, private equipment: Equipment) {
    // 모든 옷 x 모든 자세의 그림을 미리 만든다
    for (const [itemId, art] of Object.entries(WORN_ITEM_ART)) {
      for (const [frame, rows] of Object.entries(PLAYER_FRAMES)) {
        const worn = wornRows(padRows(rows, PLAYER_CANVAS_PIXELS), art);
        createPixelTexture(scene, wornTextureKey(itemId, frame), worn, wornPalette(art), PLAYER_PIXEL_SCALE);
      }
    }
    // 캐릭터 바로 위, 손에 든 방패·무기보다는 아래
    const depth = player.sprite.depth + 0.5;
    this.images = LAYERS.map((_, i) => scene.add.image(0, 0, '__DEFAULT').setVisible(false).setDepth(depth + i * 0.1));

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.sync, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.sync, this);
    });
  }

  private sync() {
    const sprite = this.player.sprite;
    LAYERS.forEach(({ layer, slot }, i) => {
      const img = this.images[i];
      const itemId = this.equipment.get(slot)?.itemId;
      if (!itemId || WORN_ITEM_ART[itemId]?.layer !== layer) {
        img.setVisible(false);
        return;
      }
      img
        .setTexture(wornTextureKey(itemId, sprite.texture.key))
        .setPosition(sprite.x, sprite.y)
        .setOrigin(sprite.originX, sprite.originY)
        .setFlipX(sprite.flipX)
        .setAlpha(sprite.alpha) // 무적 깜빡임도 같이
        .setVisible(true);
    });
  }
}
