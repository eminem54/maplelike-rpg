import Phaser from 'phaser';
import { TEXT } from '../theme/colors';

const STYLES = {
  /** 플레이어가 준 데미지 */
  dealt: { color: '#ffb238', stroke: '#5a2a00' },
  /** 플레이어가 받은 데미지 */
  taken: { color: '#c48bff', stroke: '#2b0a4a' },
};

/** 메이플처럼 맞은 자리 위로 데미지 숫자를 띄운다. */
export function showDamage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  amount: number,
  kind: keyof typeof STYLES = 'dealt',
) {
  const style = STYLES[kind];
  const text = scene.add
    .text(x, y, String(amount), {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '30px',
      color: style.color,
      stroke: style.stroke,
      strokeThickness: 5,
    })
    .setOrigin(0.5, 1)
    .setDepth(100);
  scene.tweens.add({
    targets: text,
    y: y - 50,
    alpha: { from: 1, to: 0, delay: 300 },
    duration: 700,
    ease: 'Cubic.easeOut',
    onComplete: () => text.destroy(),
  });
}

/** 레벨업했을 때 머리 위로 떠오르는 글자 */
export function showLevelUp(scene: Phaser.Scene, x: number, y: number) {
  const text = scene.add
    .text(x, y, 'LEVEL UP!', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '32px',
      color: TEXT.accent,
      stroke: '#7a4a00',
      strokeThickness: 6,
    })
    .setOrigin(0.5, 1)
    .setDepth(110)
    .setScale(0.5);
  scene.tweens.add({ targets: text, scale: 1, duration: 250, ease: 'Back.easeOut' });
  scene.tweens.add({
    targets: text,
    y: y - 60,
    alpha: 0,
    delay: 900,
    duration: 700,
    ease: 'Cubic.easeIn',
    onComplete: () => text.destroy(),
  });
}

/** 머리 위에 잠깐 떠오르는 안내 문구 */
export function showNotice(scene: Phaser.Scene, x: number, y: number, message: string) {
  const text = scene.add
    .text(x, y, message, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: TEXT.main,
      stroke: TEXT.outline,
      strokeThickness: 4,
    })
    .setOrigin(0.5, 1)
    .setDepth(110);
  // 화면 가장자리에서도 잘리지 않게 화면 안으로 당긴다
  const view = scene.cameras.main.worldView;
  const margin = text.width / 2 + 8;
  text.x = Phaser.Math.Clamp(x, view.left + margin, view.right - margin);
  scene.tweens.add({
    targets: text,
    y: y - 30,
    alpha: 0,
    delay: 1200,
    duration: 600,
    onComplete: () => text.destroy(),
  });
}

/** 골드를 얻었을 때 그 자리에서 떠오르는 글자 */
export function showGold(scene: Phaser.Scene, x: number, y: number, amount: number) {
  const text = scene.add
    .text(x, y, `+${amount.toLocaleString()} 골드`, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: TEXT.gold,
      stroke: TEXT.outline,
      strokeThickness: 3,
    })
    .setOrigin(0.5, 1)
    .setDepth(100);
  scene.tweens.add({
    targets: text,
    y: y - 36,
    alpha: { from: 1, to: 0, delay: 500 },
    duration: 1000,
    ease: 'Cubic.easeOut',
    onComplete: () => text.destroy(),
  });
}
