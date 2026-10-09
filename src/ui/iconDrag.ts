import Phaser from 'phaser';

/**
 * 아이콘을 마우스로 끌기 시작한다. 반투명한 아이콘이 마우스를 따라다니다가,
 * 버튼을 놓으면 사라지고 놓은 화면 좌표로 onDrop을 부른다.
 */
export function startIconDrag(
  scene: Phaser.Scene,
  texture: string,
  pointer: Phaser.Input.Pointer,
  onDrop: (x: number, y: number) => void,
) {
  const ghost = scene.add.image(pointer.x, pointer.y, texture).setAlpha(0.75).setDepth(2000);
  const move = (p: Phaser.Input.Pointer) => ghost.setPosition(p.x, p.y);
  const drop = (p: Phaser.Input.Pointer) => {
    scene.input.off('pointermove', move);
    scene.input.off('pointerup', drop);
    scene.input.off('pointerupoutside', drop);
    ghost.destroy();
    onDrop(p.x, p.y);
  };
  scene.input.on('pointermove', move);
  scene.input.on('pointerup', drop);
  scene.input.on('pointerupoutside', drop);
}
