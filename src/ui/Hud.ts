import Phaser from 'phaser';
import { SKILL_HOTKEYS } from '../data/keymap';
import { skillTextureKey } from '../data/skills';
import type { SkillBook } from '../systems/SkillBook';
import type { CharacterStats } from '../systems/Stats';
import { PANEL, TEXT } from '../theme/colors';
import { startIconDrag } from './iconDrag';

const HUD_W = 1024;
const BAR_H = 88;
// 스킬 단축키 칸: 위 줄 QWERT, 아래 줄 ASDFG (바 오른쪽 끝에 붙인다)
const HOTKEY_COLS = 5;
const HOTKEY_SLOT = 38;
const HOTKEY_GAP = 4;
const HOTKEY_PAD = 6;
const ORB_R = 40;
const ORB_RIM = 3;
const HUD_PAD = 4;
const EXP_H = 14;
const ORB_AREA_H = (ORB_R + ORB_RIM + HUD_PAD) * 2;

/** 화면 하단 HUD 높이 (구슬 줄 + 경험치바). 게임 화면은 이 위쪽에만 그린다. */
export const HUD_HEIGHT = ORB_AREA_H + EXP_H;
/** HUD 띠의 배경 (화면 바깥 여백과 같은 색) */
export const HUD_BACKGROUND = '#111111';
/** 표시되는 양이 실제 값을 따라가는 속도 (초당 비율) */
const DRAIN_SPEED = 1.5;

const COLOR = {
  orbEmpty: 0x0e0f16,
  rim: 0x9a7b45,
  expEmpty: 0x2a2a1a,
  exp: 0xe8c33a,
  hotkey: 0x141a2a,
};

type OrbStyle = { label: string; liquid: number; surface: number };

/** 구슬 하나: 동그란 유리 안에 남은 양만큼 액체가 차 있다 */
class Orb {
  private readonly liquid: Phaser.GameObjects.Rectangle;
  private readonly surface: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private shown = 1;

  constructor(scene: Phaser.Scene, x: number, private y: number, style: OrbStyle) {
    scene.add.circle(x, y, ORB_R, COLOR.orbEmpty);

    // 액체는 사각형을 구슬 모양으로 잘라서 그린다
    const shape = scene.make.graphics({}, false).fillCircle(x, y, ORB_R);
    const mask = shape.createGeometryMask();
    this.liquid = scene.add.rectangle(x, y + ORB_R, ORB_R * 2, ORB_R * 2, style.liquid).setOrigin(0.5, 1).setMask(mask);
    this.surface = scene.add.rectangle(x, y, ORB_R * 2, 3, style.surface).setOrigin(0.5, 0).setMask(mask);

    // 유리 반사광과 테두리
    scene.add.ellipse(x - ORB_R * 0.3, y - ORB_R * 0.45, ORB_R * 0.8, ORB_R * 0.45, 0xffffff, 0.18);
    scene.add.circle(x, y, ORB_R).setStrokeStyle(ORB_RIM, COLOR.rim);

    scene.add
      .text(x, y - 10, style.label, {
        fontFamily: 'Arial Black, sans-serif', fontSize: '12px', color: TEXT.main, stroke: TEXT.outline, strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.text = scene.add
      .text(x, y + 6, '', {
        fontFamily: 'sans-serif', fontSize: '12px', color: TEXT.main, stroke: TEXT.outline, strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  update(value: number, max: number, deltaSec: number) {
    const ratio = max > 0 ? Phaser.Math.Clamp(value / max, 0, 1) : 0;
    // 줄어들거나 찰 때 부드럽게 따라간다
    const step = DRAIN_SPEED * deltaSec;
    this.shown = ratio > this.shown ? Math.min(ratio, this.shown + step) : Math.max(ratio, this.shown - step);

    const height = ORB_R * 2 * this.shown;
    this.liquid.setSize(ORB_R * 2, height);
    this.surface.y = this.y + ORB_R - height;
    this.surface.setVisible(this.shown > 0 && this.shown < 1);
    this.text.setText(`${Math.round(value)} / ${Math.round(max)}`);
  }
}

type HotkeySlot = { code: string; bg: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image };

/** 화면 하단 HUD: 왼쪽 HP 구슬, 오른쪽 MP 구슬, 그 사이 바(레벨, 스킬 단축키 칸). */
export class Hud {
  private readonly hotkeys: HotkeySlot[] = [];
  private shownSkillsVersion = -1;
  private readonly hpOrb: Orb;
  private readonly mpOrb: Orb;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly expFill: Phaser.GameObjects.Rectangle;
  private readonly expText: Phaser.GameObjects.Text;
  private readonly expWidth = HUD_W;

  constructor(private scene: Phaser.Scene, private stats: CharacterStats, private skills: SkillBook) {
    const { width, height } = scene.scale;
    const orbY = height - EXP_H - ORB_AREA_H / 2;
    const orbOffset = ORB_R + ORB_RIM;
    const hpX = (width - HUD_W) / 2 + orbOffset;
    const mpX = (width + HUD_W) / 2 - orbOffset;

    // 바는 두 구슬 사이에만 있다
    const barLeft = hpX + orbOffset;
    const barRight = mpX - orbOffset;
    scene.add
      .rectangle((barLeft + barRight) / 2, orbY, barRight - barLeft, BAR_H, PANEL.bg)
      .setStrokeStyle(2, PANEL.border);

    this.levelText = scene.add
      .text(barLeft + 14, orbY, '', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '18px', color: TEXT.accent, stroke: TEXT.outline, strokeThickness: 3,
      })
      .setOrigin(0, 0.5);

    this.createHotkeys(barRight - HOTKEY_PAD, orbY);

    this.hpOrb = new Orb(scene, hpX, orbY, { label: 'HP', liquid: 0xb3202a, surface: 0xff6a6a });
    this.mpOrb = new Orb(scene, mpX, orbY, { label: 'MP', liquid: 0x1f4fb8, surface: 0x6aa8ff });

    // 맨 아래 경험치바 (HUD 너비)
    const expLeft = (width - HUD_W) / 2;
    const expY = height - EXP_H;
    scene.add.rectangle(expLeft, expY, HUD_W, EXP_H, COLOR.expEmpty).setOrigin(0).setStrokeStyle(1, 0x000000);
    this.expFill = scene.add.rectangle(expLeft, expY, 0, EXP_H, COLOR.exp).setOrigin(0);
    this.expText = scene.add
      .text(width / 2, expY + EXP_H / 2, '', {
        fontFamily: 'sans-serif', fontSize: '11px', color: TEXT.main, stroke: TEXT.outline, strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  /** 바 오른쪽 끝(right)에 붙여 10칸을 2줄로 놓는다. 스킬창에서 끌어다 놓거나, 칸끼리 옮기거나, 밖으로 끌어내 뺀다. */
  private createHotkeys(right: number, centerY: number) {
    const gridW = HOTKEY_COLS * HOTKEY_SLOT + (HOTKEY_COLS - 1) * HOTKEY_GAP;
    const left = right - gridW;
    const top = centerY - HOTKEY_SLOT - HOTKEY_GAP / 2;
    SKILL_HOTKEYS.forEach(({ code, label }, i) => {
      const x = left + (i % HOTKEY_COLS) * (HOTKEY_SLOT + HOTKEY_GAP);
      const y = top + Math.floor(i / HOTKEY_COLS) * (HOTKEY_SLOT + HOTKEY_GAP);
      const bg = this.scene.add
        .rectangle(x, y, HOTKEY_SLOT, HOTKEY_SLOT, COLOR.hotkey)
        .setOrigin(0)
        .setStrokeStyle(1, PANEL.border)
        .setInteractive();
      const icon = this.scene.add.image(x + HOTKEY_SLOT / 2, y + HOTKEY_SLOT / 2, '__DEFAULT').setVisible(false);
      this.scene.add.text(x + 3, y + 1, label, {
        fontFamily: 'Arial Black, sans-serif', fontSize: '10px', color: TEXT.main, stroke: TEXT.outline, strokeThickness: 2,
      });
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => {
        const skillId = this.skills.skillAt(code);
        if (!skillId) return;
        startIconDrag(this.scene, skillTextureKey(skillId), p, (dropX, dropY) => {
          const to = this.hotkeyAt(dropX, dropY);
          if (to) this.skills.move(code, to);
          else this.skills.unbind(code);
        });
      });
      this.hotkeys.push({ code, bg, icon });
    });
  }

  /** 화면 좌표 (x, y)에 있는 단축키 칸 */
  hotkeyAt(x: number, y: number) {
    return this.hotkeys.find((h) => h.bg.getBounds().contains(x, y))?.code ?? null;
  }

  private refreshHotkeys() {
    this.shownSkillsVersion = this.skills.version;
    for (const { code, icon } of this.hotkeys) {
      const skillId = this.skills.skillAt(code);
      if (skillId) icon.setTexture(skillTextureKey(skillId)).setVisible(true);
      else icon.setVisible(false);
    }
  }

  update(deltaMs: number) {
    if (this.skills.version !== this.shownSkillsVersion) this.refreshHotkeys();
    const d = this.stats.derived;
    this.hpOrb.update(this.stats.hp, d.maxHp, deltaMs / 1000);
    this.mpOrb.update(this.stats.mp, d.maxMp, deltaMs / 1000);

    const { level, exp, expToNext } = this.stats;
    this.levelText.setText(`Lv. ${level}`);
    const ratio = expToNext > 0 ? exp / expToNext : 0;
    this.expFill.setSize(this.expWidth * ratio, EXP_H);
    this.expText.setText(expToNext > 0 ? `EXP ${exp} / ${expToNext} (${(ratio * 100).toFixed(2)}%)` : 'EXP MAX');
  }
}
