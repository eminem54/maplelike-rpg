import { describe, expect, it } from 'vitest';
import { Terrain } from '../src/systems/Terrain';

// 평지 → 완만한 언덕 → 평지 → 가파른 언덕
const terrain = new Terrain([
  [0, 600],
  [100, 600],
  [200, 560], // 완만한 오르막 (기울기 0.4)
  [300, 600],
  [400, 600],
  [410, 520], // 가파른 벽 (기울기 8)
  [500, 520],
]);

/** 너비 30, 높이 72인 몸. x는 발 가운데, bottom은 발바닥 */
function makeBody(x: number, bottom: number, prevX = x, prevBottom = bottom, vy = 0) {
  return {
    position: { x: x - 15, y: bottom - 72 },
    prevFrame: { x: prevX - 15, y: prevBottom - 72 },
    velocity: { x: 0, y: vy },
    width: 30,
    height: 72,
    blocked: { none: true, up: false, down: false, left: false, right: false },
    updateCenter() {},
  } as unknown as Parameters<Terrain['resolve']>[0];
}

describe('Terrain', () => {
  it('꺾은선 사이 높이를 보간한다', () => {
    expect(terrain.heightAt(50)).toBe(600);
    expect(terrain.heightAt(150)).toBe(580);
    expect(terrain.heightAt(-10)).toBe(600);
    expect(terrain.heightAt(9999)).toBe(520);
  });

  it('완만한 오르막은 걸어서 오르고, 가파른 곳은 벽이다', () => {
    expect(terrain.isWall(140, 145)).toBe(false);
    expect(terrain.isWall(402, 406)).toBe(true);
    expect(terrain.isWall(406, 402)).toBe(false); // 내리막은 벽이 아니다
  });

  it('가파른 벽면에 내려앉으면 벽 아래 평지로 미끄러진다', () => {
    // 벽면(400~410) 중간에 위에서 떨어진다
    const body = makeBody(405, 565, 404, 550, 300);
    terrain.resolve(body);
    expect(body.position.x + 15).toBe(399.5);
    expect(body.position.y + body.height).toBe(600);
    expect(body.blocked.down).toBe(true);
  });

  it('가파른 내리막에서는 바닥에 붙지 않고 떨어진다', () => {
    const walkOff = new Terrain([[0, 500], [100, 500], [110, 580], [200, 580]]);
    const body = makeBody(100, 500);
    walkOff.resolve(body); // 꼭대기에 선다
    const next = makeBody(104, 500, 100, 500);
    Object.assign(body, { position: next.position, prevFrame: next.prevFrame });
    walkOff.resolve(body);
    expect(body.position.y + body.height).toBe(500); // 벽면에 붙지 않았다
  });

  it('한 번에 많이 움직여도 중간의 가파른 벽을 놓치지 않는다', () => {
    // 평균 기울기는 (600-520)/100 = 0.8로 완만하지만, 중간에 벽이 있다
    expect(terrain.isWall(350, 450)).toBe(true);
    const body = makeBody(450, 600, 350, 600);
    terrain.resolve(body);
    expect(body.position.x + 15).toBe(350);
    expect(body.blocked.right).toBe(true);
  });

  it('바닥에 파고들면 바닥 위로 올려 세운다', () => {
    const body = makeBody(150, 590, 146, 582, 300);
    terrain.resolve(body);
    expect(body.position.y + body.height).toBe(580);
    expect(body.blocked.down).toBe(true);
    expect(body.velocity.y).toBe(0);
  });

  it('공중에 떠 있으면 건드리지 않는다', () => {
    const body = makeBody(50, 500, 50, 490, 200);
    terrain.resolve(body);
    expect(body.position.y + body.height).toBe(500);
    expect(body.blocked.down).toBe(false);
  });

  it('가파른 벽으로 걸어 들어가면 막힌다', () => {
    const body = makeBody(405, 600, 400, 600);
    terrain.resolve(body);
    expect(body.position.x + 15).toBe(400);
    expect(body.blocked.right).toBe(true);
    expect(body.position.y + body.height).toBe(600);
  });

  it('위에서 떨어지면 가파른 곳에도 내려선다', () => {
    const body = makeBody(450, 530, 448, 510, 300);
    terrain.resolve(body);
    expect(body.position.y + body.height).toBe(520);
    expect(body.blocked.down).toBe(true);
  });
});
