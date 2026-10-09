import type Phaser from 'phaser';

/** 공격에 맞을 수 있는 대상 (샌드백, 이후 몬스터) */
export interface Hittable {
  getHitBounds(): Phaser.Geom.Rectangle;
  /** dir: 공격이 날아온 방향 (1 = 오른쪽으로 밀림, -1 = 왼쪽으로 밀림) */
  takeHit(damage: number, dir: 1 | -1): void;
}
