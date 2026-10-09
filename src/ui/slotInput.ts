import type Phaser from 'phaser';

/**
 * 아이템 칸을 더블클릭하거나 우클릭하면 onActivate를 부른다 (장착·해제).
 * 더블클릭은 브라우저가 세는 클릭 횟수(event.detail)로 판정해 OS 더블클릭 속도 설정을 따른다.
 */
export function onSlotActivate(slot: Phaser.GameObjects.GameObject, onActivate: () => void) {
  slot.on('pointerdown', (p: Phaser.Input.Pointer) => {
    const clicks = (p.event as MouseEvent | undefined)?.detail ?? 1;
    if (p.rightButtonDown() || clicks === 2) onActivate();
  });
}
