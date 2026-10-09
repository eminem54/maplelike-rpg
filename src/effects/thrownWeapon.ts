import Phaser from 'phaser';

const SPIN_DEG_PER_MS = 2; // 날아가며 도는 속도
const FLY_RATIO = 0.65; // 동작 시간 중 날아가는 비율 (나머지는 사라지며 손으로 돌아온다)

/**
 * 손에 든 무기를 앞으로 빙글빙글 돌며 날려 보낸다.
 * @param from 날아가기 시작하는 곳 (손 위치)
 * @param distance 날아가는 거리 (px)
 * @param durationMs 날아갔다 사라질 때까지
 */
export function throwWeapon(
  scene: Phaser.Scene,
  texture: string,
  from: { x: number; y: number },
  dir: 1 | -1,
  distance: number,
  durationMs: number,
) {
  const img = scene.add.image(from.x, from.y, texture).setDepth(15).setFlipX(dir < 0);
  const flyMs = durationMs * FLY_RATIO;
  scene.tweens.add({ targets: img, x: from.x + dir * distance, duration: flyMs, ease: 'Quad.easeOut' });
  scene.tweens.add({ targets: img, angle: dir * SPIN_DEG_PER_MS * durationMs, duration: durationMs });
  scene.tweens.add({
    targets: img,
    alpha: 0,
    delay: flyMs,
    duration: durationMs - flyMs,
    onComplete: () => img.destroy(),
  });
}
