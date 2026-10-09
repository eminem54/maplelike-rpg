import Phaser from 'phaser';

export const WINDOW_PAD = 12;
export const WINDOW_TITLE_H = 32;

export const WINDOW_COLOR = {
  panel: 0x1c2438,
  border: 0x6b7fb0,
  title: 0x2c3a5e,
  slot: 0x2a3554,
  slotBorder: 0x46557e,
  track: 0x141a2a,
  thumb: 0x8193c4,
  dimText: '#8f9bbd',
};

/**
 * 제목줄(끌어서 이동), 닫기 버튼이 있는 창. 클릭하면 맨 앞으로 온다.
 * dock()으로 다른 창을 붙이면 함께 열리고, 닫히고, 움직인다 (인벤토리 + 장비창).
 */
export class UIWindow extends Phaser.GameObjects.Container {
  private dragOffset: { x: number; y: number } | null = null;
  private readonly docked: { win: UIWindow; dx: number; dy: number }[] = [];
  private dockedTo: UIWindow | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly windowWidth: number,
    readonly windowHeight: number,
    title: string,
  ) {
    super(scene, x, y);

    const panel = scene.add
      .rectangle(0, 0, windowWidth, windowHeight, WINDOW_COLOR.panel)
      .setOrigin(0)
      .setStrokeStyle(2, WINDOW_COLOR.border)
      .setInteractive(); // 창 위 클릭이 뒤로 새지 않도록
    const titleBar = scene.add
      .rectangle(0, 0, windowWidth, WINDOW_TITLE_H, WINDOW_COLOR.title)
      .setOrigin(0)
      .setInteractive({ cursor: 'move' });
    const titleText = scene.add
      .text(WINDOW_PAD, WINDOW_TITLE_H / 2, title, { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffff' })
      .setOrigin(0, 0.5);
    const close = scene.add
      .text(windowWidth - WINDOW_PAD, WINDOW_TITLE_H / 2, '✕', {
        fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffff',
      })
      .setOrigin(1, 0.5)
      .setInteractive({ cursor: 'pointer' });
    this.add([panel, titleBar, titleText, close]);

    panel.on('pointerdown', () => this.root.raiseGroup());
    titleBar.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const root = this.root;
      root.raiseGroup();
      this.dragOffset = { x: p.x - root.x, y: p.y - root.y };
    });
    close.on('pointerdown', () => this.close());
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onWindowDrag(p));
    scene.input.on('pointerup', () => (this.dragOffset = null));

    this.setVisible(false);
    scene.add.existing(this);
  }

  /** child를 이 창 기준 (dx, dy) 위치에 붙인다 */
  dock(child: UIWindow, dx: number, dy: number) {
    this.docked.push({ win: child, dx, dy });
    child.dockedTo = this;
    this.moveGroupTo(this.x, this.y);
  }

  toggle() {
    if (this.visible) this.close();
    else this.open();
  }

  /** 붙어 있는 창까지 함께 연다 */
  open() {
    for (const win of this.root.group) {
      win.refresh();
      win.setVisible(true);
    }
    this.root.raiseGroup();
  }

  /** 붙어 있는 창까지 함께 닫는다 */
  close() {
    for (const win of this.root.group) win.onClose();
  }

  /** 창이 닫힐 때 (하위 창은 여기서 정리한다) */
  protected onClose() {
    this.dragOffset = null;
    this.setVisible(false);
  }

  /** 표시 내용을 다시 그린다 */
  refresh() {}

  contains(px: number, py: number) {
    return px >= this.x && px <= this.x + this.windowWidth && py >= this.y && py <= this.y + this.windowHeight;
  }

  /** 붙어 있는 창 묶음의 기준 창 */
  private get root(): UIWindow {
    return this.dockedTo ?? this;
  }

  private get group(): UIWindow[] {
    return [this, ...this.docked.map((d) => d.win)];
  }

  private raiseGroup() {
    for (const win of this.group) this.scene.children.bringToTop(win);
    // bringToTop은 순서만 바꾸므로, 깊이가 높은 툴팁·대화창·메뉴가 창 뒤로 가지 않게 다시 정렬한다
    this.scene.children.queueDepthSort();
  }

  /** 묶음 전체가 화면 밖으로 나가지 않게 옮긴다 */
  private moveGroupTo(x: number, y: number) {
    const { width, height } = this.scene.scale;
    const left = Math.min(0, ...this.docked.map((d) => d.dx));
    const top = Math.min(0, ...this.docked.map((d) => d.dy));
    const right = Math.max(this.windowWidth, ...this.docked.map((d) => d.dx + d.win.windowWidth));
    const bottom = Math.max(this.windowHeight, ...this.docked.map((d) => d.dy + d.win.windowHeight));
    const nx = Phaser.Math.Clamp(x, -left, width - right);
    const ny = Phaser.Math.Clamp(y, -top, height - bottom);
    this.setPosition(nx, ny);
    for (const d of this.docked) d.win.setPosition(nx + d.dx, ny + d.dy);
  }

  private onWindowDrag(p: Phaser.Input.Pointer) {
    if (!this.dragOffset || !p.isDown) return;
    this.root.moveGroupTo(p.x - this.dragOffset.x, p.y - this.dragOffset.y);
  }
}
