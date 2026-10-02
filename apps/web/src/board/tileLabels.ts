import { tileFrame } from './layout';

type Point = { x: number; z: number };
type Screen = { x: number; y: number };
export type TileLabelAnchors = {
  name: number[];
  rent: number[];
  condition: number[];
  insurance: number[];
  insuredRent: number[];
};

export function tileLabelRegions(id: number, count: number) {
  const t = tileFrame(id, count);
  const alongX = t.side % 2 === 0;
  const across = alongX ? { x: 1, z: 0 } : { x: 0, z: -1 };
  const down = alongX ? { x: 0, z: 1 } : { x: 1, z: 0 };
  const width = (alongX ? t.width : t.depth) * 0.9;
  const name = { x: t.x - down.x * 1.24, z: t.z - down.z * 1.24 };
  const rent = { x: t.x - t.normal.x * 2.53, z: t.z - t.normal.z * 2.53 };
  return { tile: t, across, down, width, name, rent };
}

function plane(
  center: Point,
  across: Point,
  down: Point,
  width: number,
  depth: number,
  height: number,
  project: (point: Point) => Screen,
) {
  const o = {
    x: center.x - (across.x * width) / 2 - (down.x * depth) / 2,
    z: center.z - (across.z * width) / 2 - (down.z * depth) / 2,
  };
  const a = project(o),
    b = project({ x: o.x + across.x * width, z: o.z + across.z * width }),
    c = project({ x: o.x + down.x * depth, z: o.z + down.z * depth });
  return [
    (b.x - a.x) / 240,
    (b.y - a.y) / 240,
    (c.x - a.x) / height,
    (c.y - a.y) / height,
    a.x,
    a.y,
  ];
}

export function projectTileLabels(
  id: number,
  count: number,
  horizontalCorner: boolean,
  project: (point: Point) => Screen,
): TileLabelAnchors {
  const r = tileLabelRegions(id, count);
  let name = plane(r.name, r.across, r.down, r.width, 0.62, 60, project);
  const rent = plane(r.rent, r.across, r.down, r.width, 1.36, 120, project);
  const condition = plane(
    { x: r.tile.x - r.down.x * 0.73, z: r.tile.z - r.down.z * 0.73 },
    r.across,
    r.down,
    r.width,
    0.3,
    36,
    project,
  );
  if (horizontalCorner) {
    // Place the corners' labels on the front of the tile, clear of the stage.
    const c = project({ x: r.tile.x + 0.25, z: r.tile.z + 0.25 });
    const span = project({ x: r.tile.x + r.tile.width, z: r.tile.z });
    const origin = project(r.tile);
    const s = (Math.hypot(span.x - origin.x, span.y - origin.y) * 0.65) / 240;
    name = [s, 0, 0, s, c.x - s * 120, c.y - s * 30];
  }
  // The rent quay is an unobstructed lane, separate from names, buildings and pawns.
  const center = project({
    x: r.rent.x + r.across.x * r.width * 0.31,
    z: r.rent.z + r.across.z * r.width * 0.31,
  });
  const edge = project({
    x: r.rent.x + r.across.x * r.width * 0.71,
    z: r.rent.z + r.across.z * r.width * 0.71,
  });
  const badgeWidth = Math.hypot(edge.x - center.x, edge.y - center.y);
  // Face the camera, like the pawns: the shield remains recognisable at every angle.
  const insurance = [
    badgeWidth / 240,
    0,
    0,
    (badgeWidth * 1.12) / 180,
    center.x - badgeWidth / 2,
    center.y - badgeWidth * 0.56,
  ];
  const insuredRent = plane(
    { x: r.rent.x - r.across.x * r.width * 0.2, z: r.rent.z - r.across.z * r.width * 0.2 },
    r.across,
    r.down,
    r.width * 0.57,
    1.36,
    120,
    project,
  );
  return { name, rent, condition, insurance, insuredRent };
}

// Keep buildings below the name strip in screen reading order on all four sides.
export function tileDecorationPoint(id: number, count: number, inset: number) {
  const { tile, down } = tileLabelRegions(id, count);
  return { x: tile.x + down.x * inset, z: tile.z + down.z * inset };
}
