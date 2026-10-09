import Phaser from 'phaser';
import { createPixelTexture } from '../art/pixelArt';
import { ITEM_ICON_SCALE, ITEM_PALETTE, ITEMS, itemTextureKey } from '../data/items';
import { KEYS } from '../data/keymap';
import type { Equipment } from '../systems/Equipment';
import type { Inventory } from '../systems/Inventory';
import { KeyInput } from '../systems/KeyInput';
import type { Progress } from '../systems/Progress';
import type { CharacterStats } from '../systems/Stats';
import { DevMenu } from '../ui/DevMenu';
import { DialogBox } from '../ui/DialogBox';
import { EQUIPMENT_WIDTH, EquipmentWindow } from '../ui/EquipmentWindow';
import { Hud } from '../ui/Hud';
import { INVENTORY_WIDTH, InventoryWindow } from '../ui/InventoryWindow';
import { ItemTooltip } from '../ui/ItemTooltip';
import { StatusWindow } from '../ui/StatusWindow';
import type { UIWindow } from '../ui/UIWindow';

export type UISceneData = { inventory: Inventory; equipment: Equipment; stats: CharacterStats; progress: Progress };

const WINDOW_TOP = 100;
const SCREEN_MARGIN = 16;

/** 게임 화면 위에 겹쳐 그리는 UI (카메라를 따라 움직이지 않는다) */
export class UIScene extends Phaser.Scene {
  /** NPC 대화창. GameScene이 대화를 열 때 쓴다. */
  dialog!: DialogBox;
  private keys!: KeyInput;
  private inventoryWindow!: InventoryWindow;
  private equipmentWindow!: EquipmentWindow;
  private statusWindow!: StatusWindow;
  private windows: UIWindow[] = [];
  private hud!: Hud;

  constructor() {
    super('UIScene');
  }

  create(data: UISceneData) {
    const { stats, inventory, equipment, progress } = data;
    for (const item of Object.values(ITEMS)) {
      createPixelTexture(this, itemTextureKey(item.id), item.icon, ITEM_PALETTE, ITEM_ICON_SCALE);
    }

    this.keys = new KeyInput(this, [
      ...KEYS.inventory, ...KEYS.status, ...KEYS.close, ...KEYS.interact, ...KEYS.left, ...KEYS.right,
    ]);
    // 창보다 먼저 만들어서 창이 HUD 위에 그려지게 한다
    this.hud = new Hud(this, stats);
    this.dialog = new DialogBox(this);
    const tooltip = new ItemTooltip(this);

    // 인벤토리 왼쪽에 장비창을 붙여서 함께 열고 닫고 움직인다
    this.inventoryWindow = new InventoryWindow(
      this, this.scale.width - INVENTORY_WIDTH - SCREEN_MARGIN, WINDOW_TOP, inventory, tooltip,
      (index) => equipment.equipFromInventory(index),
    );
    this.equipmentWindow = new EquipmentWindow(this, 0, 0, equipment, tooltip);
    this.inventoryWindow.dock(this.equipmentWindow, -EQUIPMENT_WIDTH, 0);

    this.statusWindow = new StatusWindow(this, SCREEN_MARGIN, WINDOW_TOP, stats);
    this.windows = [this.inventoryWindow, this.equipmentWindow, this.statusWindow];

    new DevMenu(this, [
      { label: '레벨 업', run: () => stats.levelUp() },
      { label: '레벨 다운', run: () => stats.setLevel(stats.level - 1) },
      { label: '레벨 1로 초기화', run: () => stats.setLevel(1) },
      {
        label: '모든 데이터 초기화',
        run: () => {
          equipment.clear();
          stats.reset();
          inventory.clear();
          progress.reset();
          this.dialog.close();
          this.windows.forEach((w) => w.refresh());
        },
      },
    ]);
  }

  update(_time: number, delta: number) {
    this.hud.update(delta);
    this.dialog.update(this.keys);
    if (this.keys.justPressed(KEYS.inventory)) this.inventoryWindow.toggle();
    if (this.keys.justPressed(KEYS.status)) this.statusWindow.toggle();
    if (this.keys.justPressed(KEYS.close)) this.windows.forEach((w) => w.close());
    // 열려 있는 창은 바뀐 내용을 바로 보여준다 (HP·MP, 새로 받은 아이템, 장착)
    if (this.statusWindow.visible) this.statusWindow.refresh();
    this.inventoryWindow.sync();
    this.equipmentWindow.sync();
  }
}
