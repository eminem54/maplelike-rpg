import Phaser from 'phaser';
import { describeStats, ITEM_KIND_LABEL, type ItemDef } from '../data/items';
import { WINDOW_COLOR } from './UIWindow';

const W = 220;
const PAD = 10;
const GAP = 6;

/** 아이템 칸에 마우스를 올렸을 때 뜨는 설명 (모든 창이 같이 쓴다) */
export class ItemTooltip {
  private readonly root: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene) {
    this.bg = scene.add.rectangle(0, 0, W, 10, 0x0e1220, 0.95).setOrigin(0).setStrokeStyle(1, WINDOW_COLOR.border);
    this.text = scene.add.text(PAD, PAD, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffffff', lineSpacing: 4,
      wordWrap: { width: W - PAD * 2, useAdvancedWrap: true },
    });
    this.root = scene.add.container(0, 0, [this.bg, this.text]).setDepth(800).setVisible(false);
  }

  /** 화면 좌표의 칸(slot) 옆에 띄운다. 오른쪽에 자리가 없으면 왼쪽에 띄운다. */
  show(def: ItemDef, slot: Phaser.Geom.Rectangle, extraLines: string[] = []) {
    this.text.setText([
      def.name,
      def.typeLabel ?? ITEM_KIND_LABEL[def.kind],
      '',
      ...describeStats(def.stats),
      '',
      def.description,
      ...extraLines,
    ]);
    const h = this.text.height + PAD * 2;
    this.bg.setSize(W, h);

    const { width, height } = this.scene.scale;
    let x = slot.right + GAP;
    if (x + W > width) x = slot.left - W - GAP;
    const y = Phaser.Math.Clamp(slot.top, 0, height - h);
    this.root.setPosition(x, y).setVisible(true);
  }

  hide() {
    this.root.setVisible(false);
  }
}
