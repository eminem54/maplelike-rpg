import Phaser from 'phaser';

/** 문자 격자로 된 픽셀아트를 텍스처로 만든다. '.'은 투명. */
export function createPixelTexture(
  scene: Phaser.Scene,
  key: string,
  rows: string[],
  palette: Record<string, number>,
  scale: number,
) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (color === undefined) return;
      g.fillStyle(color);
      g.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  g.generateTexture(key, rows[0].length * scale, rows.length * scale);
  g.destroy();
}

/** 각 줄을 가운데 정렬해 width 칸으로 맞춘다 (좌우 반전해도 몸 위치가 그대로 유지되도록). */
export function padRows(rows: string[], width: number) {
  return rows.map((r) => {
    const left = Math.floor((width - r.length) / 2);
    return '.'.repeat(left) + r + '.'.repeat(width - r.length - left);
  });
}
