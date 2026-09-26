/** Portrait properties with square corners, supporting both current and saved boards. */
export function boardShape(count: number) {
  const short = Math.floor(count / 4),
    long = count / 2 - short;
  const step = 2.12,
    depth = 3.3;
  return {
    short,
    long,
    step,
    depth,
    x: ((long - 1) * step + depth) / 2,
    z: ((short - 1) * step + depth) / 2,
    corners: [0, long, long + short, long * 2 + short],
  };
}
export function tileFrame(id: number, count = 26) {
  const s = boardShape(count);
  const side = id < s.long ? 0 : id < s.long + s.short ? 1 : id < s.long * 2 + s.short ? 2 : 3;
  const start = s.corners[side]!,
    offset = id - start;
  const corner = offset === 0;
  const distance = corner ? 0 : s.depth / 2 + s.step / 2 + (offset - 1) * s.step;
  const x = side === 0 ? s.x - distance : side === 1 ? -s.x : side === 2 ? -s.x + distance : s.x;
  const z = side === 0 ? s.z : side === 1 ? s.z - distance : side === 2 ? -s.z : -s.z + distance;
  const normal = [
    { x: 0, z: 1 },
    { x: -1, z: 0 },
    { x: 0, z: -1 },
    { x: 1, z: 0 },
  ][side]!;
  const width = corner ? s.depth : side % 2 ? s.depth : s.step - 0.06;
  const depth = corner ? s.depth : side % 2 ? s.step - 0.06 : s.depth;
  return { x, z, side, corner, normal, width, depth, angle: side % 2 ? Math.PI / 2 : 0 };
}
export function tilePoint(id: number, count = 26) {
  const { x, z } = tileFrame(id, count);
  return { x, z };
}
export const wealthPoints = [
  { x: -4.4, z: 10.8 },
  { x: -11, z: -2.5 },
  { x: 4.4, z: -10.8 },
  { x: 11, z: 2.5 },
];
