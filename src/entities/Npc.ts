import Phaser from 'phaser';
import { createPixelTexture } from '../art/pixelArt';

const TALK_RANGE_X = 40; // 이만큼 가까이 서 있으면 말을 걸 수 있다
const TALK_RANGE_Y = 24;

export type NpcLook = { texture: string; rows: string[]; palette: Record<string, number>; scale: number };

/** 말을 걸 수 있는 NPC. 이름표가 발밑에 있고, 가까이 가면 "Space" 안내가 뜬다. */
export class Npc {
  readonly sprite: Phaser.GameObjects.Image;
  private readonly hint: Phaser.GameObjects.Text;

  /** groundY: 서 있는 바닥 높이. 그림은 오른쪽을 보고 있으므로 faceLeft면 뒤집는다. */
  constructor(scene: Phaser.Scene, x: number, groundY: number, readonly name: string, look: NpcLook, faceLeft = true) {
    createPixelTexture(scene, look.texture, look.rows, look.palette, look.scale);
    this.sprite = scene.add.image(x, groundY, look.texture).setOrigin(0.5, 1).setFlipX(faceLeft);

    scene.add
      .text(x, groundY + 6, name, {
        fontFamily: 'sans-serif', fontSize: '13px', color: '#fff27a', backgroundColor: '#000000aa',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5, 0)
      .setDepth(30);
    this.hint = scene.add
      .text(x, groundY - this.sprite.height - 8, 'Space', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '13px', color: '#ffffff', backgroundColor: '#2c3a5ecc',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(30)
      .setVisible(false);
    scene.tweens.add({ targets: this.hint, y: this.hint.y - 4, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** 플레이어 발 위치가 NPC와 겹쳐 있는가 */
  isNear(footX: number, footY: number) {
    return Math.abs(footX - this.sprite.x) <= TALK_RANGE_X && Math.abs(footY - this.sprite.y) <= TALK_RANGE_Y;
  }

  /** 말을 걸 수 있을 때 안내를 보여준다 */
  setHintVisible(visible: boolean) {
    this.hint.setVisible(visible);
  }
}
