import Phaser from 'phaser';
import type { MonsterData } from '../data/monsters';
import { Duck } from '../entities/Duck';
import type { Player } from '../entities/Player';

/** 맵의 몬스터 출현 규칙 */
export type SpawnRule = {
  monster: MonsterData;
  /** 맵에 동시에 있을 수 있는 최대 수 */
  maxCount: number;
  /** 이 간격마다 모자란 수만큼 채운다 (ms) */
  intervalMs: number;
};

/** 몬스터가 서 있을 수 있는 곳 (바닥 또는 발판 윗면). yAt은 x 위치의 높이. */
export type SpawnSurface = { left: number; right: number; yAt: (x: number) => number };

const EDGE_MARGIN = 24; // 발판 끝에 걸치지 않도록
const MIN_PLAYER_DISTANCE = 160; // 플레이어 바로 옆에는 나오지 않는다
const PICK_TRIES = 10;

/** 정해진 간격마다 맵의 몬스터 수를 최대치까지 채운다 */
export class MonsterSpawner {
  readonly monsters: Duck[] = [];
  private readonly colliders = new Map<Duck, Phaser.Physics.Arcade.Collider[]>();
  private nextCheckAt = 0;

  constructor(
    private scene: Phaser.Scene,
    private rule: SpawnRule,
    private surfaces: SpawnSurface[],
    private solids: Phaser.Physics.Arcade.StaticGroup,
    private player: Player,
    private onKilled: (monster: Duck) => void,
  ) {}

  update(time: number) {
    if (time >= this.nextCheckAt) {
      this.fill();
      this.nextCheckAt = time + this.rule.intervalMs;
    }
    for (const m of this.monsters) m.update(time, this.player.sprite.x);
  }

  private fill() {
    const alive = this.monsters.filter((m) => m.alive).length;
    for (let i = alive; i < this.rule.maxCount; i++) this.spawnOne();
  }

  private spawnOne() {
    const spot = this.pickSpot();
    if (!spot) return;
    const { surface, x } = spot;
    const duck = new Duck(
      this.scene,
      this.rule.monster,
      x,
      surface.yAt(x),
      { minX: surface.left + EDGE_MARGIN, maxX: surface.right - EDGE_MARGIN },
      { onKilled: this.onKilled, onRemoved: (m) => this.remove(m) },
    );

    this.colliders.set(duck, [
      this.scene.physics.add.collider(duck.sprite, this.solids),
      // 닿으면 데미지를 받고 몬스터 반대쪽으로 튕겨 나간다
      this.scene.physics.add.overlap(this.player.sprite, duck.sprite, () => {
        if (duck.alive) {
          this.player.takeHit(duck.data.contactDamage, this.player.sprite.x < duck.sprite.x ? -1 : 1);
        }
      }),
    ]);
    this.monsters.push(duck);
  }

  /** 넓은 곳일수록 자주 고르고, 플레이어와 가까운 자리는 피한다 */
  private pickSpot() {
    const usable = this.surfaces.filter((s) => s.right - s.left > EDGE_MARGIN * 2);
    const total = usable.reduce((sum, s) => sum + (s.right - s.left - EDGE_MARGIN * 2), 0);
    for (let i = 0; i < PICK_TRIES; i++) {
      let roll = Math.random() * total;
      const surface = usable.find((s) => (roll -= s.right - s.left - EDGE_MARGIN * 2) < 0) ?? usable[0];
      const x = Phaser.Math.Between(surface.left + EDGE_MARGIN, surface.right - EDGE_MARGIN);
      const { x: px, y: py } = this.player.sprite;
      if (Math.hypot(x - px, surface.yAt(x) - py) >= MIN_PLAYER_DISTANCE) return { surface, x };
    }
    return null;
  }

  private remove(duck: Duck) {
    this.colliders.get(duck)?.forEach((c) => c.destroy());
    this.colliders.delete(duck);
    const index = this.monsters.indexOf(duck);
    if (index !== -1) this.monsters.splice(index, 1);
  }
}
