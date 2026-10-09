import Phaser from 'phaser';
import type { CharacterStats, DerivedStats, PrimaryStats } from '../systems/Stats';
import { INVENTORY_HEIGHT, INVENTORY_WIDTH } from './InventoryWindow';
import { UIWindow, WINDOW_COLOR, WINDOW_PAD, WINDOW_TITLE_H } from './UIWindow';
import { GAUGE, TEXT } from '../theme/colors';

const ROW_H = 22;
const SECTION_GAP = 8;
const COL_GAP = 12;
const COL_W = (INVENTORY_WIDTH - WINDOW_PAD * 2 - COL_GAP) / 2;
const BAR_H = 18;
const PLUS_SIZE = 14; // 능력치 포인트를 찍는 + 버튼

type Entry = {
  name: string;
  code?: string;
  /** d는 장비를 뺀 능력치 (장비 몫은 bonus로 괄호 안에 따로 보여준다) */
  value: (d: DerivedStats, s: CharacterStats) => string;
  /** 아이템·장비로 오른 몫. 값 옆에 (+N)처럼 초록색으로 표시한다. 없으면 빈 문자열 */
  bonus?: (s: CharacterStats) => string;
  /** 능력치 포인트를 찍을 수 있는 기본 능력치 */
  statKey?: keyof PrimaryStats;
};

/** 기본 능력치: 레벨업으로 올린 값 + 아이템 보너스를 괄호로 */
const primary = (name: string, code: string, key: keyof PrimaryStats): Entry => ({
  name, code, value: (_, s) => fmt(s.base[key]), bonus: (s) => plus(s.bonus[key]), statKey: key,
});

/** 0보다 크면 "(+N)" */
const plus = (v: number) => (v > 0 ? `(+${fmt(v)})` : '');

const pct = (v: number) => `${fmt(v)}%`;
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

const SECTIONS: { title: string; entries: Entry[]; showStatPoints?: boolean }[] = [
  {
    title: '전투',
    entries: [
      {
        name: '공격력', code: 'ATTACK', value: (d) => fmt(d.attack),
        bonus: (s) => (s.gearBonus.attackMax > 0 ? `(+${s.gearBonus.attackMin}~${s.gearBonus.attackMax})` : ''),
      },
      { name: '주문력', code: 'SPELL', value: (d) => fmt(d.spell) },
      { name: '명중률', code: 'HIT', value: (d) => fmt(d.hit) },
      { name: '마법명중률', code: 'MHIT', value: (d) => fmt(d.mhit) },
    ],
  },
  {
    title: '기본 능력치',
    showStatPoints: true,
    entries: [
      primary('힘', 'STR', 'str'),
      primary('체질', 'CON', 'con'),
      primary('민첩', 'DEX', 'dex'),
      primary('지능', 'INT', 'int'),
      primary('지혜', 'WIS', 'wis'),
      primary('정신', 'MEN', 'men'),
    ],
  },
  {
    title: '세부 능력치',
    entries: [
      { name: '방어력', value: (d) => fmt(d.defense), bonus: (s) => plus(s.gearBonus.defense) },
      { name: '회피율', value: (d) => pct(d.evasion) },
      { name: '크리티컬', value: (d) => pct(d.crit) },
      { name: '주문 크리티컬', value: (d) => pct(d.spellCrit) },
      { name: '공격속도', value: (d) => pct(d.attackSpeed) },
      { name: '주문속도', value: (d) => pct(d.castSpeed) },
      { name: '이동속도', value: (d) => pct(d.moveSpeed) },
    ],
  },
];

type Bar = { fill: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; width: number };

/** HP·MP와 능력치를 보여주는 창 (인벤토리와 같은 크기) */
export class StatusWindow extends UIWindow {
  private readonly hpBar: Bar;
  private readonly mpBar: Bar;
  private readonly values: {
    entry: Entry;
    text: Phaser.GameObjects.Text;
    bonusText: Phaser.GameObjects.Text;
    codeText: Phaser.GameObjects.Text | null;
    right: number;
  }[] = [];
  private readonly plusButtons: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];
  private readonly levelText: Phaser.GameObjects.Text;
  private statPointsText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, private stats: CharacterStats) {
    super(scene, x, y, INVENTORY_WIDTH, INVENTORY_HEIGHT, '상태');
    this.levelText = scene.add
      .text(56, WINDOW_TITLE_H / 2, '', { fontFamily: 'sans-serif', fontSize: '14px', color: TEXT.accent })
      .setOrigin(0, 0.5);
    this.add(this.levelText);

    let y0 = WINDOW_TITLE_H + WINDOW_PAD;
    this.hpBar = this.addBar('HP', y0, GAUGE.hp);
    y0 += BAR_H + 8;
    this.mpBar = this.addBar('MP', y0, GAUGE.mp);
    y0 += BAR_H + SECTION_GAP;

    for (const section of SECTIONS) {
      this.add(
        scene.add.text(WINDOW_PAD, y0 + 4, section.title, {
          fontFamily: 'sans-serif', fontSize: '12px', color: TEXT.dim,
        }),
      );
      if (section.showStatPoints) {
        this.statPointsText = scene.add
          .text(INVENTORY_WIDTH - WINDOW_PAD, y0 + 4, '', { fontFamily: 'sans-serif', fontSize: '12px', color: TEXT.bonus })
          .setOrigin(1, 0);
        this.add(this.statPointsText);
      }
      y0 += ROW_H;
      section.entries.forEach((entry, i) => {
        const cx = WINDOW_PAD + (i % 2) * (COL_W + COL_GAP);
        const cy = y0 + Math.floor(i / 2) * ROW_H;
        this.addEntry(entry, cx, cy);
      });
      y0 += Math.ceil(section.entries.length / 2) * ROW_H + SECTION_GAP;
    }
  }

  refresh() {
    const d = this.stats.derived; // HP·MP 막대는 장비까지 더한 최대치
    const base = this.stats.baseDerived;
    const points = this.stats.statPoints;
    this.levelText.setText(`Lv. ${this.stats.level}`);
    this.statPointsText.setText(points > 0 ? `남은 포인트 ${points}` : '');
    for (const button of this.plusButtons) button.setVisible(points > 0);
    this.setBar(this.hpBar, this.stats.hp, d.maxHp);
    this.setBar(this.mpBar, this.stats.mp, d.maxMp);
    for (const { entry, text, bonusText, codeText, right } of this.values) {
      text.setText(entry.value(base, this.stats));
      const bonus = entry.bonus?.(this.stats) ?? '';
      bonusText.setText(bonus);
      text.x = bonus ? right - bonusText.width - 3 : right;
      // 값이 길어져 자리가 모자라면 영어 약자(ATTACK 등)를 숨긴다
      codeText?.setVisible(codeText.x + codeText.width + 4 <= text.x - text.width);
    }
  }

  private addBar(label: string, y: number, color: number): Bar {
    const labelW = 30;
    const width = INVENTORY_WIDTH - WINDOW_PAD * 2 - labelW;
    const bx = WINDOW_PAD + labelW;
    const name = this.scene.add
      .text(WINDOW_PAD, y + BAR_H / 2, label, { fontFamily: 'sans-serif', fontSize: '14px', color: TEXT.main })
      .setOrigin(0, 0.5);
    const bg = this.scene.add.rectangle(bx, y, width, BAR_H, WINDOW_COLOR.track).setOrigin(0);
    const fill = this.scene.add.rectangle(bx, y, width, BAR_H, color).setOrigin(0);
    const text = this.scene.add
      .text(bx + width / 2, y + BAR_H / 2, '', { fontFamily: 'sans-serif', fontSize: '12px', color: TEXT.main })
      .setOrigin(0.5);
    this.add([name, bg, fill, text]);
    return { fill, text, width };
  }

  private setBar(bar: Bar, value: number, max: number) {
    bar.fill.setSize(max > 0 ? bar.width * Phaser.Math.Clamp(value / max, 0, 1) : 0, BAR_H);
    bar.text.setText(`${fmt(value)} / ${fmt(max)}`);
  }

  private addEntry(entry: Entry, x: number, y: number) {
    const name = this.scene.add.text(x, y, entry.name, {
      fontFamily: 'sans-serif', fontSize: '13px', color: TEXT.main,
    });
    this.add(name);
    const codeText = entry.code
      ? this.scene.add.text(x + name.width + 4, y + 2, entry.code, {
        fontFamily: 'sans-serif', fontSize: '11px', color: TEXT.dim,
      })
      : null;
    if (codeText) this.add(codeText);
    // 기본 능력치는 오른쪽 끝에 + 버튼 자리를 둔다
    const right = entry.statKey ? x + COL_W - PLUS_SIZE - 4 : x + COL_W;
    if (entry.statKey) this.addPlusButton(entry.statKey, x + COL_W - PLUS_SIZE, y + 1);
    const value = this.scene.add
      .text(right, y, '', { fontFamily: 'sans-serif', fontSize: '13px', color: '#ffd76a' })
      .setOrigin(1, 0);
    const bonusText = this.scene.add
      .text(right, y, '', { fontFamily: 'sans-serif', fontSize: '13px', color: TEXT.bonus })
      .setOrigin(1, 0);
    this.add([value, bonusText]);
    this.values.push({ entry, text: value, bonusText, codeText, right });
  }

  private addPlusButton(key: keyof PrimaryStats, x: number, y: number) {
    const bg = this.scene.add
      .rectangle(x, y, PLUS_SIZE, PLUS_SIZE, 0x3f6fcf)
      .setOrigin(0)
      .setStrokeStyle(1, 0xaecbff)
      .setInteractive({ cursor: 'pointer' });
    const label = this.scene.add
      .text(x + PLUS_SIZE / 2, y + PLUS_SIZE / 2, '+', { fontFamily: 'sans-serif', fontSize: '13px', color: TEXT.main })
      .setOrigin(0.5);
    bg.on('pointerdown', () => {
      this.stats.spendStatPoint(key);
      this.refresh();
    });
    this.add([bg, label]);
    this.plusButtons.push(bg, label);
  }
}
