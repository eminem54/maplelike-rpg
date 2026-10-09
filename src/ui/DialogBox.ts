import Phaser from 'phaser';
import { KEYS } from '../data/keymap';
import type { KeyInput } from '../systems/KeyInput';
import { PANEL, TEXT } from '../theme/colors';

export type DialogChoice = { label: string; run: () => void };

const TOP = 72; // 화면 위쪽 (캐릭터와 NPC를 가리지 않도록)
const W = 720;
const H = 150;
const PAD = 18;
const NAME_H = 28;
const CHOICE_W = 120;
const CHOICE_H = 32;

/** 고른 선택지 */
const CHOICE_SELECTED = 0x4a6ac0;

/**
 * 화면 위쪽 대화창. say()로 대사를 한 줄씩 넘기고, ask()로 선택지를 고른다.
 * Space(또는 클릭)로 넘기고, 선택지는 ← → 로 고른 뒤 Space(또는 클릭)로 정한다.
 */
export class DialogBox {
  private readonly root: Phaser.GameObjects.Container;
  private readonly nameBg: Phaser.GameObjects.Rectangle;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly choiceButtons: { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];

  private lines: string[] = [];
  private lineIndex = 0;
  private onLinesDone: (() => void) | null = null;
  private choices: DialogChoice[] = [];
  private selected = 0;
  /** 대화를 연 Space 입력이 곧바로 대사를 넘기지 않도록 한 프레임 쉰다 */
  private skipInput = false;
  private closedFrame = -1;

  constructor(private scene: Phaser.Scene) {
    const x = (scene.scale.width - W) / 2;
    const y = TOP;

    const box = scene.add
      .rectangle(0, 0, W, H, PANEL.bg, 0.96)
      .setOrigin(0)
      .setStrokeStyle(2, PANEL.border)
      .setInteractive({ cursor: 'pointer' });
    this.nameBg = scene.add
      .rectangle(PAD, -NAME_H + 4, 10, NAME_H, PANEL.header)
      .setOrigin(0)
      .setStrokeStyle(2, PANEL.border);
    this.nameText = scene.add
      .text(PAD + 12, -NAME_H / 2 + 4, '', { fontFamily: 'sans-serif', fontSize: '15px', color: TEXT.accent })
      .setOrigin(0, 0.5);
    this.bodyText = scene.add.text(PAD, PAD, '', {
      fontFamily: 'sans-serif', fontSize: '17px', color: TEXT.main, lineSpacing: 6,
      wordWrap: { width: W - PAD * 2, useAdvancedWrap: true },
    });
    this.hint = scene.add
      .text(W - PAD, H - 12, 'Space ▶', { fontFamily: 'sans-serif', fontSize: '13px', color: TEXT.dim })
      .setOrigin(1, 1);
    this.root = scene.add.container(x, y, [box, this.nameBg, this.nameText, this.bodyText, this.hint]).setDepth(900);

    // 선택지 버튼 (최대 2개, 오른쪽 아래)
    for (let i = 0; i < 2; i++) {
      const bx = W - PAD - (2 - i) * (CHOICE_W + 10) + 10;
      const by = H - PAD - CHOICE_H;
      const bg = scene.add
        .rectangle(bx, by, CHOICE_W, CHOICE_H, PANEL.header)
        .setOrigin(0)
        .setStrokeStyle(1, PANEL.border)
        .setInteractive({ cursor: 'pointer' });
      const label = scene.add
        .text(bx + CHOICE_W / 2, by + CHOICE_H / 2, '', { fontFamily: 'sans-serif', fontSize: '15px', color: TEXT.main })
        .setOrigin(0.5);
      bg.on('pointerover', () => this.select(i));
      bg.on('pointerdown', () => this.choose(i));
      this.root.add([bg, label]);
      this.choiceButtons.push({ bg, label });
    }

    box.on('pointerdown', () => {
      if (this.choices.length === 0) this.advance();
    });
    scene.tweens.add({ targets: this.hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    this.root.setVisible(false);
  }

  get isOpen() {
    return this.root.visible;
  }

  /**
   * 대화 중이거나 이번 프레임에 막 닫혔는가.
   * Phaser는 위에 있는 장면(UI)을 먼저 갱신하므로, 대화를 닫은 Space가
   * 같은 프레임에 게임 장면에서 다시 말을 거는 데 쓰이지 않게 막는다.
   */
  get busy() {
    return this.isOpen || this.closedFrame === this.scene.game.loop.frame;
  }

  /** 대사를 한 줄씩 보여준다. 마지막 줄을 넘기면 onDone, 없으면 대화를 닫는다. */
  say(speaker: string, lines: string[], onDone?: () => void) {
    this.open(speaker);
    this.lines = lines;
    this.lineIndex = 0;
    this.onLinesDone = onDone ?? null;
    this.choices = [];
    this.render();
  }

  /** 질문과 선택지를 보여준다 */
  ask(speaker: string, text: string, choices: DialogChoice[]) {
    this.open(speaker);
    this.lines = [text];
    this.lineIndex = 0;
    this.onLinesDone = null;
    this.choices = choices.slice(0, this.choiceButtons.length);
    this.selected = 0;
    this.render();
  }

  close() {
    if (this.isOpen) this.closedFrame = this.scene.game.loop.frame;
    this.root.setVisible(false);
    this.choices = [];
  }

  update(keys: KeyInput) {
    if (!this.isOpen) return;
    if (this.skipInput) {
      this.skipInput = false;
      return;
    }
    if (this.choices.length > 0) {
      if (keys.justPressed(KEYS.left)) this.select(this.selected - 1);
      if (keys.justPressed(KEYS.right)) this.select(this.selected + 1);
      if (keys.justPressed(KEYS.interact)) this.choose(this.selected);
    } else if (keys.justPressed(KEYS.interact)) {
      this.advance();
    }
  }

  private open(speaker: string) {
    if (!this.isOpen) this.skipInput = true;
    this.nameText.setText(speaker);
    this.nameBg.setSize(this.nameText.width + 24, NAME_H);
    this.root.setVisible(true);
  }

  private advance() {
    if (this.lineIndex < this.lines.length - 1) {
      this.lineIndex += 1;
      this.render();
      return;
    }
    const done = this.onLinesDone;
    this.onLinesDone = null;
    if (done) done();
    else this.close();
  }

  private select(index: number) {
    if (this.choices.length === 0) return;
    this.selected = Phaser.Math.Wrap(index, 0, this.choices.length);
    this.render();
  }

  private choose(index: number) {
    const choice = this.choices[index];
    if (!choice) return;
    this.choices = [];
    choice.run();
  }

  private render() {
    this.bodyText.setText(this.lines[this.lineIndex] ?? '');
    const asking = this.choices.length > 0;
    this.hint.setVisible(!asking);
    this.choiceButtons.forEach(({ bg, label }, i) => {
      const choice = this.choices[i];
      bg.setVisible(!!choice);
      label.setVisible(!!choice);
      if (!choice) return;
      label.setText(choice.label);
      bg.setFillStyle(i === this.selected ? CHOICE_SELECTED : PANEL.header);
    });
  }
}
