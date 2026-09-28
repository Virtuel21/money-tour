import { tileFrame } from './layout';

export const labelSize = { width: 240, height: 160 };
type Point = { x: number; y: number };

/** A fixed strip on the outer half of every tile, clear of the building lane. */
export function tileLabelPlane(id: number, count: number) {
  const tile = tileFrame(id, count);
  const alongX = tile.side % 2 === 0;
  const width = (alongX ? tile.width : tile.depth) * 0.88;
  const depth = (alongX ? tile.depth : tile.width) * 0.4;
  const center = {
    x: tile.x + tile.normal.x * 0.77,
    z: tile.z + tile.normal.z * 0.77,
  };
  // Both text axes stay readable from the fixed camera, on all four sides.
  const u = alongX ? { x: width, z: 0 } : { x: 0, z: -width };
  const v = alongX ? { x: 0, z: depth } : { x: depth, z: 0 };
  const origin = { x: center.x - (u.x + v.x) / 2, z: center.z - (u.z + v.z) / 2 };
  return { origin, u, v };
}

/** Affine projection of a tile's text plane, in CSS pixels, without screen-size clamps. */
export function projectTileLabel(
  id: number,
  count: number,
  project: (point: { x: number; z: number }) => Point,
) {
  const { origin, u, v } = tileLabelPlane(id, count);
  const a = project(origin);
  const b = project({ x: origin.x + u.x, z: origin.z + u.z });
  const c = project({ x: origin.x + v.x, z: origin.z + v.z });
  return [
    (b.x - a.x) / labelSize.width,
    (b.y - a.y) / labelSize.width,
    (c.x - a.x) / labelSize.height,
    (c.y - a.y) / labelSize.height,
    a.x,
    a.y,
  ];
}
