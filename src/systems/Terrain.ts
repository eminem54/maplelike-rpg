import type Phaser from 'phaser';

/** 지형 꺾은선의 한 점 [x, 바닥 높이 y] */
export type TerrainPoint = readonly [x: number, y: number];

/** 이보다 가파른 오르막(높이/거리)은 걸어서 못 오르고 점프해야 한다 */
export const MAX_WALK_SLOPE = 1.5;
/** 내리막을 걸을 때 이만큼 떠도 바닥에 붙여서 통통 튀지 않게 한다 */
const SNAP_DOWN = 10;

/** 몸이 바닥에 닿았는지 판정할 수 있는 최소한의 물리 몸체 */
type GroundBody = Pick<
  Phaser.Physics.Arcade.Body,
  'position' | 'prevFrame' | 'velocity' | 'width' | 'height' | 'blocked' | 'updateCenter'
>;

/**
 * 꺾은선으로 된 바닥. 경사를 걸어서 오르내리고, 가파른 곳은 벽처럼 막는다.
 * Phaser 물리는 경사를 지원하지 않아서 직접 처리한다.
 */
export class Terrain {
  private readonly grounded = new WeakMap<object, boolean>();

  constructor(readonly points: readonly TerrainPoint[]) {}

  /** x 위치의 바닥 높이 */
  heightAt(x: number) {
    const pts = this.points;
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      if (x <= x1) {
        const [x0, y0] = pts[i - 1];
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    }
    return pts[pts.length - 1][1];
  }

  /**
   * from에서 to로 가는 길에 걸어서 오를 수 없는 가파른 오르막 구간이 있는가.
   * 평균 기울기로 보면 한 프레임에 많이 움직였을 때(화면이 버벅일 때) 벽을 뚫을 수 있어서 구간마다 본다.
   */
  isWall(fromX: number, toX: number) {
    if (fromX === toX) return false;
    const dir = Math.sign(toX - fromX);
    const lo = Math.min(fromX, toX);
    const hi = Math.max(fromX, toX);
    const pts = this.points;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      if (x1 <= lo || x0 >= hi) continue;
      // 진행 방향으로 올라가는 정도 (화면 좌표라 위로 갈수록 y가 작다)
      const uphill = ((y0 - y1) / (x1 - x0)) * dir;
      if (uphill > MAX_WALK_SLOPE) return true;
    }
    return false;
  }

  /**
   * 물리 계산이 끝난 몸을 바닥 위에 세운다. 바닥에 서 있으면 body.blocked.down이 켜지고,
   * 가파른 벽에 막히면 body.blocked.left/right가 켜진다.
   */
  resolve(body: GroundBody) {
    const half = body.width / 2;
    const footX = body.position.x + half;
    const prevFootX = body.prevFrame.x + half;
    const bottom = body.position.y + body.height;
    const ground = this.heightAt(footX);
    const wasGrounded = this.grounded.get(body) ?? false;

    if (bottom < ground) {
      // 내리막을 걷는 중이면 바닥에 붙인다 (점프 중이거나 낭떠러지·가파른 내리막이면 그대로 떨어진다)
      const onGround =
        wasGrounded && body.velocity.y >= 0 && ground - bottom <= SNAP_DOWN && this.steepSegmentAt(footX) === null;
      if (onGround) this.standOn(body, footX);
      this.grounded.set(body, onGround);
      return;
    }

    // 위에서 내려온 게 아니라 옆으로 파고든 경우: 가파르면 벽으로 막는다
    const cameFromAbove = body.prevFrame.y + body.height <= ground + 0.5;
    if (!cameFromAbove && this.isWall(prevFootX, footX)) {
      body.position.x = body.prevFrame.x;
      if (footX > prevFootX) body.blocked.right = true;
      else body.blocked.left = true;
      const standing = bottom >= this.heightAt(prevFootX);
      if (standing) this.standOn(body, prevFootX);
      this.grounded.set(body, standing);
      return;
    }

    this.standOn(body, footX);
    this.grounded.set(body, true);
  }

  /** x가 가파른 면(벽) 위에 있으면 그 구간 [x0, y0, x1, y1], 아니면 null */
  private steepSegmentAt(x: number) {
    const pts = this.points;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      if (x > x0 && x < x1) {
        return Math.abs((y1 - y0) / (x1 - x0)) > MAX_WALK_SLOPE ? ([x0, y0, x1, y1] as const) : null;
      }
    }
    return null;
  }

  /** footX 위치의 바닥에 세운다. 가파른 면 위라면 서 있을 수 없으니 벽 아래 평지로 미끄러뜨린다. */
  private standOn(body: GroundBody, footX: number) {
    let x = footX;
    const steep = this.steepSegmentAt(footX);
    if (steep) {
      const [x0, y0, x1, y1] = steep;
      x = y0 > y1 ? x0 - 0.5 : x1 + 0.5; // 낮은 쪽 끝의 바깥
      body.position.x += x - footX;
    }
    body.position.y = this.heightAt(x) - body.height;
    if (body.velocity.y > 0) body.velocity.y = 0;
    body.blocked.down = true;
    body.updateCenter();
  }
}
