import { expect, it } from 'vitest';
import { tileFrame, boardShape } from '../src/board/layout';
it.each([26, 28])(
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
    expect(boardShape(count).corners).toEqual(count === 26 ? [0, 7, 13, 20] : [0, 7, 14, 21]);
    expect(
      tiles
        .filter((t) => !t.corner)
        .every((t) => Math.max(t.width, t.depth) / Math.min(t.width, t.depth) > 1.5),
    ).toBe(true);
  },
);
