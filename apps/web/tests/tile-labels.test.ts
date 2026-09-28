import { expect, it } from 'vitest';
import { tileLabelRegions, projectTileLabels, tileDecorationPoint } from '../src/board/tileLabels';
import { OrthographicCamera, Vector3 } from 'three';
import { cameraBounds } from '../src/board/camera';

it.each([26, 28, 30, 32])(
  'puts every ordinary name at the visual top of its %i-case board tile',
  (count) => {
    for (let id = 0; id < count; id++) {
      const r = tileLabelRegions(id, count);
      expect((r.name.x - r.tile.x) * r.down.x + (r.name.z - r.tile.z) * r.down.z).toBeCloseTo(
        -1.24,
      );
      expect(Math.abs(r.name.x - r.tile.x) + r.down.x * 0.31).toBeLessThan(r.tile.width / 2);
      expect(Math.abs(r.name.z - r.tile.z) + r.down.z * 0.31).toBeLessThan(r.tile.depth / 2);
    }
  },
);
it.each([
  [1920, 1080],
  [1280, 612],
  [390, 844],
])('keeps Festival and Start at horizontal at %i × %i', (width, height) => {
  const b = cameraBounds(width, height, width < 1000);
  const camera = new OrthographicCamera(
    -b.halfWidth,
    b.halfWidth,
    b.halfHeight,
    -b.halfHeight,
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
  for (const id of [0, 16]) {
    const a = projectTileLabels(id, 32, true, project).name;
    expect((Math.atan2(a[1]!, a[0]!) * 180) / Math.PI).toBeCloseTo(0);
    expect(a[0]! * a[3]! - a[1]! * a[2]!).toBeGreaterThan(0);
  }
});
it('places rent extensions entirely inward of the original board edge', () => {
  for (const id of [1, 2, 9, 10, 17, 18, 25, 26]) {
    const r = tileLabelRegions(id, 32);
    const offset =
      (r.rent.x - r.tile.x) * r.tile.normal.x + (r.rent.z - r.tile.z) * r.tile.normal.z;
    expect(offset + 0.72).toBeLessThanOrEqual(-1.8);
  }
});

it.each([26, 28, 30, 32])('keeps decorations below city headers on a %i-case board', (count) => {
  for (let id = 0; id < count; id++) {
    const r = tileLabelRegions(id, count);
    for (const inset of [0.65, 0.85]) {
      const p = tileDecorationPoint(id, count, inset);
      expect((p.x - r.tile.x) * r.down.x + (p.z - r.tile.z) * r.down.z).toBeCloseTo(inset);
      expect(Math.abs(p.x - r.tile.x)).toBeLessThan(r.tile.width / 2);
      expect(Math.abs(p.z - r.tile.z)).toBeLessThan(r.tile.depth / 2);
      if (r.tile.side === 1 || r.tile.side === 2) {
        expect(p.x).toBeCloseTo(r.tile.x - r.tile.normal.x * inset);
        expect(p.z).toBeCloseTo(r.tile.z - r.tile.normal.z * inset);
      }
    }
  }
});
it('scales labels with tile pixels at an unchanged aspect ratio', () => {
  const full = (p: { x: number; z: number }) => ({ x: p.x * 20 + 500, y: p.z * 20 + 300 });
  const half = (p: { x: number; z: number }) => {
    const q = full(p);
    return { x: q.x / 2, y: q.y / 2 };
  };
  for (const corner of [false, true]) {
    const a = projectTileLabels(1, 32, corner, full);
    const b = projectTileLabels(1, 32, corner, half);
    for (const kind of ['name', 'rent', 'condition'] as const) {
      expect(b[kind]).toEqual(a[kind].map((v) => v / 2));
    }
  }
});
