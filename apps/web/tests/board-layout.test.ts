import { expect, it } from 'vitest';
import { tileFrame, boardShape, wealthPoints } from '../src/board/layout';
import { OrthographicCamera, Vector3 } from 'three';
it('projects each cash pile into the same screen quadrant as its player card', () => {
  const camera = new OrthographicCamera(-20, 20, 15, -15, 0.1, 100);
  camera.position.set(18, 22, 18);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  expect(
    wealthPoints.map((p) => {
      const v = new Vector3(p.x, 0, p.z).project(camera);
      return [Math.sign(v.x), Math.sign(v.y)];
    }),
  ).toEqual([
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ]);
});
it.each([26, 28, 30, 32])(
  'keeps all %i interactive rectangles separate, including corner neighbours',
  (count) => {
    const tiles = Array.from({ length: count }, (_, i) => tileFrame(i, count));
    expect(tiles.filter((t) => t.corner)).toHaveLength(4);
    for (let i = 0; i < count; i++)
      for (let j = i + 1; j < count; j++) {
        const a = tiles[i]!,
          b = tiles[j]!;
        const overlapX = (a.width + b.width) / 2 - Math.abs(a.x - b.x);
        const overlapZ = (a.depth + b.depth) / 2 - Math.abs(a.z - b.z);
        expect(overlapX <= 0.001 || overlapZ <= 0.001, `Overlapping tiles ${i},${j}`).toBe(true);
      }
    expect(boardShape(count).corners).toEqual(
      count === 32
        ? [0, 8, 16, 24]
        : count === 30
          ? [0, 9, 15, 24]
          : count === 26
            ? [0, 7, 13, 20]
            : [0, 7, 14, 21],
    );
    expect(
      tiles
        .filter((t) => !t.corner)
        .every((t) => Math.max(t.width, t.depth) / Math.min(t.width, t.depth) > 1.5),
    ).toBe(true);
  },
);
