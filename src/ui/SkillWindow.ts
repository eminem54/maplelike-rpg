import Phaser from 'phaser';
import { describeSkill, getSkill, skillTextureKey } from '../data/skills';
import type { SkillBook } from '../systems/SkillBook';
import { TEXT } from '../theme/colors';
import { startIconDrag } from './iconDrag';
import { UIWindow, WINDOW_COLOR, WINDOW_PAD, WINDOW_TITLE_H } from './UIWindow';

export const SKILL_WINDOW_WIDTH = 320;
const HEIGHT = 300;
const ROW_H = 52;
const ICON_BOX = 42;

/** 배운 스킬 목록. 아이콘을 끌어서 하단 단축키 칸에 놓는다. */
export class SkillWindow extends UIWindow {
  private rows: Phaser.GameObjects.GameObject[] = [];
  private shownVersion = -1;

  /** @param onDrop 스킬 아이콘을 화면 (x, y)에 놓았을 때 */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private skills: SkillBook,
    private onDrop: (skillId: string, x: number, y: number) => void,
  ) {
    super(scene, x, y, SKILL_WINDOW_WIDTH, HEIGHT, '스킬');
    this.add(
      scene.add
        .text(SKILL_WINDOW_WIDTH / 2, HEIGHT - WINDOW_PAD, '아이콘을 끌어서 아래 단축키 칸에 놓으세요', {
          fontFamily: 'sans-serif', fontSize: '12px', color: TEXT.dim,
        })
        .setOrigin(0.5, 1),
    );
  }

  /** 배운 스킬이 바뀌었으면 다시 그린다 (열려 있을 때 매 프레임 호출) */
  sync() {
    if (this.visible && this.skills.version !== this.shownVersion) this.refresh();
  }

  refresh() {
    this.shownVersion = this.skills.version;
    this.rows.forEach((o) => o.destroy());
    this.rows = [];

    const ids = this.skills.learnedIds;
    if (ids.length === 0) {
      this.addRow(
        this.scene.add
          .text(SKILL_WINDOW_WIDTH / 2, WINDOW_TITLE_H + 60, '아직 배운 스킬이 없다.', {
            fontFamily: 'sans-serif', fontSize: '14px', color: TEXT.dim,
          })
          .setOrigin(0.5),
      );
      return;
    }
    ids.forEach((id, i) => {
      const skill = getSkill(id)!;
      const y = WINDOW_TITLE_H + WINDOW_PAD + i * ROW_H;
      const box = this.scene.add
        .rectangle(WINDOW_PAD, y, ICON_BOX, ICON_BOX, WINDOW_COLOR.slot)
        .setOrigin(0)
        .setStrokeStyle(1, WINDOW_COLOR.slotBorder);
      const icon = this.scene.add
        .image(WINDOW_PAD + ICON_BOX / 2, y + ICON_BOX / 2, skillTextureKey(id))
        .setInteractive({ cursor: 'grab' });
      icon.on('pointerdown', (p: Phaser.Input.Pointer) => {
        startIconDrag(this.scene, skillTextureKey(id), p, (dropX, dropY) => this.onDrop(id, dropX, dropY));
      });
      const textX = WINDOW_PAD + ICON_BOX + 10;
      const name = this.scene.add.text(textX, y + 2, skill.name, {
        fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: TEXT.main,
      });
      const info = this.scene.add.text(textX, y + 24, describeSkill(skill), {
        fontFamily: 'sans-serif', fontSize: '12px', color: TEXT.bonus,
      });
      this.addRow(box, icon, name, info);
    });
  }

  private addRow(...objects: Phaser.GameObjects.GameObject[]) {
    this.add(objects);
    this.rows.push(...objects);
  }
}
