import Phaser from 'phaser';

const WIDTH = 56;
const HEIGHT = 200;
const STRIPS = 24;
const PARTICLE_TEXTURE = 'portal-spark';

/** 바닥에서 솟아오르는 빛 기둥. 위에서 ↑를 누르면 다음 맵으로 간다. */
export class Portal {
  constructor(scene: Phaser.Scene, readonly x: number, readonly groundY: number) {
    // 아래는 진하고 위로 갈수록 옅어지는 빛
    const g = scene.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 0; i < STRIPS; i++) {
      const t = i / STRIPS;
      const h = HEIGHT / STRIPS;
      g.fillStyle(0xfff0a0, 0.55 * (1 - t));
      g.fillRect(x - WIDTH / 2, groundY - (i + 1) * h, WIDTH, h + 1);
      g.fillStyle(0xffffff, 0.5 * (1 - t));
      g.fillRect(x - WIDTH / 6, groundY - (i + 1) * h, WIDTH / 3, h + 1);
    }
    scene.tweens.add({ targets: g, alpha: 0.6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // 바닥의 빛 웅덩이
    scene.add.ellipse(x, groundY, WIDTH * 1.6, 14, 0xfff6c0, 0.7).setDepth(5).setBlendMode(Phaser.BlendModes.ADD);

    // 위로 떠오르는 빛 알갱이
    if (!scene.textures.exists(PARTICLE_TEXTURE)) {
      scene.make.graphics({}, false).fillStyle(0xffffff).fillCircle(3, 3, 3).generateTexture(PARTICLE_TEXTURE, 6, 6).destroy();
    }
    scene.add
      .particles(x, groundY, PARTICLE_TEXTURE, {
        x: { min: -WIDTH / 2, max: WIDTH / 2 },
        speedY: { min: -90, max: -40 },
        lifespan: 2000,
        frequency: 120,
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xfff6c0, 0xffe070, 0xffffff],
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(6);
  }

  /** 플레이어 발 위치가 빛 기둥 안에 있는가 */
  contains(footX: number, footY: number) {
    return Math.abs(footX - this.x) <= WIDTH / 2 && Math.abs(footY - this.groundY) <= 12;
  }
}
