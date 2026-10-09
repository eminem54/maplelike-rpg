import Phaser from 'phaser';
import { getItem, itemTextureKey } from '../data/items';
import type { Inventory } from '../systems/Inventory';
import type { ItemTooltip } from './ItemTooltip';
import { onSlotActivate } from './slotInput';
import { UIWindow, WINDOW_COLOR, WINDOW_PAD, WINDOW_TITLE_H } from './UIWindow';
import { TEXT } from '../theme/colors';

const COLS = 6;
const VISIBLE_ROWS = 8;
const SLOT = 42;
const GAP = 4;
const SCROLLBAR_W = 10;
const SCROLLBAR_GAP = 8;
/** 휠 이동량 이만큼마다 한 줄 넘긴다 (마우스 휠 한 칸 ≈ 100) */
const WHEEL_DELTA_PER_ROW = 100;

const GRID_W = COLS * SLOT + (COLS - 1) * GAP;
const GRID_H = VISIBLE_ROWS * SLOT + (VISIBLE_ROWS - 1) * GAP;
const GRID_TOP = WINDOW_TITLE_H + WINDOW_PAD;
const TRACK_X = WINDOW_PAD + GRID_W + SCROLLBAR_GAP;

// 화면 너비(1280)의 약 1/4. 왼쪽에 장비창이 붙는다.
export const INVENTORY_WIDTH = TRACK_X + SCROLLBAR_W + WINDOW_PAD;
export const INVENTORY_HEIGHT = GRID_TOP + GRID_H + WINDOW_PAD;

/** 6열 x 8줄이 보이고, 휠/스크롤바로 한 줄씩 넘기는 인벤토리 창 */
export class InventoryWindow extends UIWindow {
  private scrollRow = 0;
  private readonly maxScrollRow: number;
  private readonly slotIcons: Phaser.GameObjects.Image[] = [];
  private readonly slotCounts: Phaser.GameObjects.Text[] = [];
  private readonly thumb: Phaser.GameObjects.Rectangle;
  private readonly thumbTravel: number;
  private thumbDragOffset: number | null = null;
  private wheelDelta = 0;
  private shownVersion = -1;
  private readonly goldText: Phaser.GameObjects.Text;

  /**
   * @param onUse 아이템 칸을 더블클릭·우클릭했을 때 (장착 등). 인벤토리 칸 번호를 받는다.
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private inventory: Inventory,
    private tooltip: ItemTooltip,
    onUse: (index: number) => void,
  ) {
    super(scene, x, y, INVENTORY_WIDTH, INVENTORY_HEIGHT, '인벤토리');

    // 제목 옆에 가진 골드를 보여준다
    this.goldText = scene.add
      .text(this.titleText.x + this.titleText.width + 12, WINDOW_TITLE_H / 2, '', {
        fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: TEXT.gold,
      })
      .setOrigin(0, 0.5);
    this.add(this.goldText);

    const totalRows = Math.ceil(inventory.size / COLS);
    this.maxScrollRow = Math.max(0, totalRows - VISIBLE_ROWS);

    // 보이는 48칸만 만들고, 스크롤하면 그 칸에 표시할 아이템만 바꾼다
    for (let r = 0; r < VISIBLE_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const sx = WINDOW_PAD + c * (SLOT + GAP);
        const sy = GRID_TOP + r * (SLOT + GAP);
        const slot = scene.add
          .rectangle(sx, sy, SLOT, SLOT, WINDOW_COLOR.slot)
          .setOrigin(0)
          .setStrokeStyle(1, WINDOW_COLOR.slotBorder);
        const icon = scene.add.image(sx + SLOT / 2, sy + SLOT / 2, '__DEFAULT').setVisible(false);
        const count = scene.add
          .text(sx + SLOT - 3, sy + SLOT - 2, '', {
            fontFamily: 'sans-serif', fontSize: '11px', color: TEXT.main, stroke: TEXT.outline, strokeThickness: 3,
          })
          .setOrigin(1, 1);
        this.add([slot, icon, count]);
        this.slotIcons.push(icon);
        this.slotCounts.push(count);

        const visibleIndex = this.slotIcons.length - 1;
        slot.setInteractive();
        slot.on('pointerover', () => this.showTooltip(visibleIndex, slot));
        slot.on('pointerout', () => this.tooltip.hide());
        onSlotActivate(slot, () => {
          this.tooltip.hide();
          onUse(this.scrollRow * COLS + visibleIndex);
        });
      }
    }

    const track = scene.add
      .rectangle(TRACK_X, GRID_TOP, SCROLLBAR_W, GRID_H, WINDOW_COLOR.track)
      .setOrigin(0)
      .setInteractive({ cursor: 'pointer' });
    const thumbH = Math.max(24, (GRID_H * VISIBLE_ROWS) / totalRows);
    this.thumbTravel = GRID_H - thumbH;
    this.thumb = scene.add
      .rectangle(TRACK_X, GRID_TOP, SCROLLBAR_W, thumbH, WINDOW_COLOR.thumb)
      .setOrigin(0)
      .setInteractive({ cursor: 'grab' });
    this.add([track, this.thumb]);

    this.thumb.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.thumbDragOffset = p.y - (this.y + this.thumb.y);
    });
    // 트랙 빈 곳을 누르면 그쪽으로 한 화면(8줄)씩 넘긴다
    track.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.scrollBy(p.y < this.y + this.thumb.y ? -VISIBLE_ROWS : VISIBLE_ROWS);
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onThumbDrag(p));
    scene.input.on('pointerup', () => (this.thumbDragOffset = null));
    scene.input.on('wheel', (p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (this.visible && this.contains(p.x, p.y)) this.onWheel(p, dy);
    });
  }

  protected onClose() {
    this.thumbDragOffset = null;
    this.tooltip.hide();
    super.onClose();
  }

  scrollBy(rows: number) {
    this.setScrollRow(this.scrollRow + rows);
  }

  /** 인벤토리 내용이 바뀌었으면 다시 그린다 (열려 있을 때 매 프레임 호출) */
  sync() {
    if (this.visible && this.inventory.version !== this.shownVersion) this.refresh();
  }

  refresh() {
    this.shownVersion = this.inventory.version;
    this.goldText.setText(`${this.inventory.gold.toLocaleString()} 골드`);
    this.slotIcons.forEach((icon, i) => {
      const item = this.inventory.get(this.scrollRow * COLS + i);
      const def = item && getItem(item.itemId);
      if (def) icon.setTexture(itemTextureKey(def.id)).setVisible(true);
      else icon.setVisible(false);
      this.slotCounts[i].setText(item && item.count > 1 ? String(item.count) : '');
    });
    this.tooltip.hide();
    const ratio = this.maxScrollRow === 0 ? 0 : this.scrollRow / this.maxScrollRow;
    this.thumb.y = GRID_TOP + ratio * this.thumbTravel;
  }

  /** 칸에 마우스를 올리면 이름·종류·능력치·설명을 보여준다 */
  private showTooltip(visibleIndex: number, slot: Phaser.GameObjects.Rectangle) {
    const item = this.inventory.get(this.scrollRow * COLS + visibleIndex);
    const def = item && getItem(item.itemId);
    if (def) this.tooltip.show(def, slot.getBounds(), ['', '더블클릭: 장착']);
  }

  private setScrollRow(row: number) {
    const next = Phaser.Math.Clamp(Math.round(row), 0, this.maxScrollRow);
    if (next === this.scrollRow) return;
    this.scrollRow = next;
    this.refresh();
  }

  // 터치패드는 작은 휠 이벤트를 연달아 보내므로, 이동량을 모아서 한 줄씩 넘긴다
  private onWheel(p: Phaser.Input.Pointer, dy: number) {
    const lineMode = (p.event as WheelEvent | undefined)?.deltaMode === 1; // 파이어폭스: 줄 단위
    this.wheelDelta += lineMode ? dy * (WHEEL_DELTA_PER_ROW / 3) : dy;
    const rows = Math.trunc(this.wheelDelta / WHEEL_DELTA_PER_ROW);
    if (rows === 0) return;
    this.wheelDelta -= rows * WHEEL_DELTA_PER_ROW;
    this.scrollBy(rows);
  }

  private onThumbDrag(p: Phaser.Input.Pointer) {
    if (this.thumbDragOffset === null || !p.isDown || this.thumbTravel <= 0) return;
    const thumbTop = p.y - this.thumbDragOffset - this.y - GRID_TOP;
    this.setScrollRow((thumbTop / this.thumbTravel) * this.maxScrollRow);
  }
}
