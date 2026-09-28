import { expect, it } from 'vitest';
import { OrthographicCamera, Vector3 } from 'three';
import { tileFrame } from '../src/board/layout';
import { cameraBounds } from '../src/board/camera';
import { labelSize, projectTileLabel, tileLabelPlane } from '../src/board/tileLabels';

it.each([26, 28, 30, 32])('keeps every label inside its tile on a %i-case board', (count) => {
  for (let id = 0; id < count; id++) {
    const tile = tileFrame(id, count);
    const { origin, u, v } = tileLabelPlane(id, count);
    for (const [a, b] of [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ]) {
      const x = origin.x + a! * u.x + b! * v.x;
      const z = origin.z + a! * u.z + b! * v.z;
      expect(Math.abs(x - tile.x), `tile ${id}, x`).toBeLessThan(tile.width / 2);
      expect(Math.abs(z - tile.z), `tile ${id}, z`).toBeLessThan(tile.depth / 2);
    }
  }
});

it.each([
  [1920, 1080],
  [1280, 612],
  [390, 844],
  [320, 568],
  [844, 390],
])(
  'projects label corners into the same ground plane at %i × %i, including zoom',
  (width, height) => {
    const bounds = cameraBounds(width, height, width < 1000);
    const camera = new OrthographicCamera(
      -bounds.halfWidth,
      bounds.halfWidth,
      bounds.halfHeight,
      -bounds.halfHeight,
      0.1,
      80,
    );
    camera.position.set(18, 22, 18);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const project = (p: { x: number; z: number }) => {
      const v = new Vector3(p.x, 0.29, p.z).project(camera);
      return { x: ((v.x + 1) * width) / 2, y: ((1 - v.y) * height) / 2 };
    };
    for (const zoom of [1, 1.8, 2.4]) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      for (let id = 0; id < 32; id++) {
        const matrix = projectTileLabel(id, 32, project);
        const { origin, u, v } = tileLabelPlane(id, 32);
        const expected = project({ x: origin.x + u.x + v.x, z: origin.z + u.z + v.z });
        expect(
          matrix[0]! * labelSize.width + matrix[2]! * labelSize.height + matrix[4]!,
        ).toBeCloseTo(expected.x);
        expect(
          matrix[1]! * labelSize.width + matrix[3]! * labelSize.height + matrix[5]!,
        ).toBeCloseTo(expected.y);
        // Positive determinant and rightward text: no mirrored or upside-down labels.
        expect(matrix[0]! * matrix[3]! - matrix[1]! * matrix[2]!).toBeGreaterThan(0);
        expect(matrix[0]).toBeGreaterThan(0);
      }
    }
  },
);

it('scales text with tile pixels when a viewport shrinks at the same aspect ratio', () => {
  const full = (p: { x: number; z: number }) => ({ x: p.x * 20 + 500, y: p.z * 20 + 300 });
  const half = (p: { x: number; z: number }) => {
    const q = full(p);
    return { x: q.x / 2, y: q.y / 2 };
  };
  const matrix = projectTileLabel(1, 32, full);
  expect(projectTileLabel(1, 32, half)).toEqual(matrix.map((value) => value / 2));
});
