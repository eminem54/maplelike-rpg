import Phaser from 'phaser';
import { EQUIP_SLOTS, type EquipSlotId } from '../data/equipment';
import { getItem, itemTextureKey } from '../data/items';
import type { Equipment } from '../systems/Equipment';
import { INVENTORY_HEIGHT } from './InventoryWindow';
import type { ItemTooltip } from './ItemTooltip';
import { onSlotActivate } from './slotInput';
import { UIWindow, WINDOW_COLOR, WINDOW_TITLE_H } from './UIWindow';

const COLS = 3;
const ROWS = 5;
const SLOT = 50;
const GAP = 10;
const PAD = 15;
const GRID_TOP = WINDOW_TITLE_H + PAD;
const GRID_H = ROWS * SLOT + (ROWS - 1) * GAP;

export const EQUIPMENT_WIDTH = PAD * 2 + COLS * SLOT + (COLS - 1) * GAP;

type SlotView = { id: EquipSlotId; bg: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };

/** 장비 13칸. 인벤토리 창 왼쪽에 붙어서 함께 열린다. */
export class EquipmentWindow extends UIWindow {
  private readonly slots: SlotView[] = [];
  private readonly summary: Phaser.GameObjects.Text;
  private shownVersion = -1;

  constructor(scene: Phaser.Scene, x: number, y: number, private equipment: Equipment, private tooltip: ItemTooltip) {
    super(scene, x, y, EQUIPMENT_WIDTH, INVENTORY_HEIGHT, '장비');

    for (const s of EQUIP_SLOTS) {
      const sx = PAD + s.col * (SLOT + GAP);
      const sy = GRID_TOP + s.row * (SLOT + GAP);
      const bg = scene.add
        .rectangle(sx, sy, SLOT, SLOT, WINDOW_COLOR.slot)
        .setOrigin(0)
        .setStrokeStyle(1, WINDOW_COLOR.slotBorder)
        .setInteractive();
      // 빈 칸에는 어떤 장비 자리인지 흐리게 적어 둔다
      const label = scene.add
        .text(sx + SLOT / 2, sy + SLOT / 2, s.label, {
          fontFamily: 'sans-serif', fontSize: '11px', color: WINDOW_COLOR.dimText, align: 'center',
        })
        .setOrigin(0.5);
      const icon = scene.add.image(sx + SLOT / 2, sy + SLOT / 2, '__DEFAULT').setVisible(false);
      this.add([bg, label, icon]);
      this.slots.push({ id: s.id, bg, icon, label });

      bg.on('pointerover', () => this.showTooltip(s.id, bg));
      bg.on('pointerout', () => this.tooltip.hide());
      onSlotActivate(bg, () => {
        this.tooltip.hide();
        equipment.unequip(s.id);
      });
    }

    // 장비로 오른 능력치 합계
    this.summary = scene.add.text(PAD, GRID_TOP + GRID_H + 14, '', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#7be08a', lineSpacing: 4,
    });
    this.add(this.summary);
  }

  /** 장비가 바뀌었으면 다시 그린다 (열려 있을 때 매 프레임 호출) */
  sync() {
    if (this.visible && this.equipment.version !== this.shownVersion) this.refresh();
  }

  refresh() {
    this.shownVersion = this.equipment.version;
    for (const { id, icon, label } of this.slots) {
      const def = getItem(this.equipment.get(id)?.itemId ?? '');
      if (def) icon.setTexture(itemTextureKey(def.id));
      icon.setVisible(!!def);
      label.setVisible(!def);
    }

    const b = this.equipment.bonus;
    const lines = [];
    if (b.attackMax > 0) lines.push(`공격력 +${b.attackMin}~${b.attackMax}`);
    if (b.defense > 0) lines.push(`방어력 +${b.defense}`);
    if (b.maxHp > 0) lines.push(`체력 +${b.maxHp}`);
    this.summary.setText(lines.length > 0 ? lines : ['장착한 장비 없음']);
    this.summary.setColor(lines.length > 0 ? '#7be08a' : WINDOW_COLOR.dimText);
    this.tooltip.hide();
  }

  protected onClose() {
    this.tooltip.hide();
    super.onClose();
  }

  private showTooltip(id: EquipSlotId, bg: Phaser.GameObjects.Rectangle) {
    const def = getItem(this.equipment.get(id)?.itemId ?? '');
    if (def) this.tooltip.show(def, bg.getBounds(), ['', '더블클릭: 해제']);
  }
}
