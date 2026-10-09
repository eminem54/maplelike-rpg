import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { HUD_BACKGROUND } from './ui/Hud';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: HUD_BACKGROUND, // 하늘색은 GameScene 카메라가 칠한다
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // 키보드는 systems/KeyInput.ts에서 직접 처리한다
  input: { keyboard: false },
  disableContextMenu: true, // 아이템 우클릭(장착·해제)
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 1400 }, debug: false },
  },
  scene: [GameScene, UIScene], // UIScene은 GameScene이 띄운다
});
