import Phaser from 'phaser';
import { PANEL, TEXT } from '../theme/colors';

export type DevAction = { label: string; run: () => void };

const MARGIN = 12;
const BUTTON_W = 64;
const BUTTON_H = 28;
const ITEM_W = 200;
const ITEM_H = 30;

const COLOR = {
  button: 0x7a2fb0,
  buttonBorder: 0xd6a8ff,
  itemHover: 0x3a4a78,
};

/** 개발자용 메뉴. 오른쪽 위 DEV 버튼에 마우스를 올리면 기능 목록이 열린다. */
export class DevMenu {
  private readonly menu: Phaser.GameObjects.Container;
  private readonly hoverArea: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, actions: DevAction[]) {
    const right = scene.scale.width - MARGIN;
    const buttonX = right - BUTTON_W;

    const button = scene.add
      .rectangle(buttonX, MARGIN, BUTTON_W, BUTTON_H, COLOR.button)
      .setOrigin(0)
      .setStrokeStyle(1, COLOR.buttonBorder)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(1000);
    scene.add
      .text(buttonX + BUTTON_W / 2, MARGIN + BUTTON_H / 2, 'DEV', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '13px', color: TEXT.main,
      })
      .setOrigin(0.5)
      .setDepth(1000);

    // 버튼 바로 아래에 오른쪽 끝을 맞춰 펼친다
    const menuX = right - ITEM_W;
    const menuY = MARGIN + BUTTON_H + 2;
    this.menu = scene.add.container(menuX, menuY).setDepth(1000).setVisible(false);
    this.menu.add(
      scene.add.rectangle(0, 0, ITEM_W, ITEM_H * actions.length, PANEL.bg).setOrigin(0).setStrokeStyle(1, PANEL.border),
    );
    actions.forEach((action, i) => {
      const bg = scene.add
        .rectangle(0, i * ITEM_H, ITEM_W, ITEM_H, PANEL.bg)
        .setOrigin(0)
        .setInteractive({ cursor: 'pointer' });
      const label = scene.add
        .text(12, i * ITEM_H + ITEM_H / 2, action.label, { fontFamily: 'sans-serif', fontSize: '14px', color: TEXT.main })
        .setOrigin(0, 0.5);
      bg.on('pointerover', () => bg.setFillStyle(COLOR.itemHover));
      bg.on('pointerout', () => bg.setFillStyle(PANEL.bg));
      bg.on('pointerdown', () => action.run());
      this.menu.add([bg, label]);
    });

    // 버튼과 메뉴를 합친 영역. 마우스가 이 밖으로 나가면 닫는다.
    this.hoverArea = new Phaser.Geom.Rectangle(menuX, MARGIN, ITEM_W, menuY - MARGIN + ITEM_H * actions.length);

    button.on('pointerover', () => this.menu.setVisible(true));
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.menu.visible && !this.hoverArea.contains(p.x, p.y)) this.menu.setVisible(false);
    });
  }
}
