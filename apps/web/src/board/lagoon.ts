import { boardShape } from './layout';

/** Keep navigation and scenery on the same map, including legacy boards. */
export const lagoonIslands = [
  { x: -2.5, z: -1.6 },
  { x: 2.5, z: -1.6 },
  { x: -2.5, z: 2.2 },
  { x: 2.5, z: 2.2 },
];
export const islandRadius = 1.65;
export const boatRadius = 0.75;
const width = 5.4,
  depth = 4.65,
  radius = 0.95;

/** Leave room for the rent quays, even when loading a smaller legacy board. */
export function lagoonScale(count: number) {
  const board = boardShape(count);
  const quayReach = 2.53 + 0.75 + 0.1;
  return Math.min(
    1,
    (board.x - quayReach) / (width + boatRadius),
    (board.z - quayReach) / (depth + boatRadius),
  );
}
const horizontal = 2 * (width - radius),
  vertical = 2 * (depth - radius);
const arc = (Math.PI * radius) / 2;
export const sailingLoopLength = 2 * (horizontal + vertical) + 4 * arc;

/** Constant speed, tangent-continuous closed circuit. Both boats keep half a lap apart. */
export function sailingPose(seconds: number, boat: number) {
  let distance =
    (((seconds * 0.38 + (boat * sailingLoopLength) / 2) % sailingLoopLength) + sailingLoopLength) %
    sailingLoopLength;
  const corners = [
    { x: width - radius, z: -depth + radius, angle: -Math.PI / 2 },
    { x: width - radius, z: depth - radius, angle: 0 },
    { x: -width + radius, z: depth - radius, angle: Math.PI / 2 },
    { x: -width + radius, z: -depth + radius, angle: Math.PI },
  ];
  for (let side = 0; side < 4; side++) {
    const length = side % 2 ? vertical : horizontal;
    if (distance <= length) {
      const x =
        side === 0
          ? -width + radius + distance
          : side === 1
            ? width
            : side === 2
              ? width - radius - distance
              : -width;
      const z =
        side === 0
          ? -depth
          : side === 1
            ? -depth + radius + distance
            : side === 2
              ? depth
              : depth - radius - distance;
      return { x, z, heading: Math.PI / 2 - (side * Math.PI) / 2 };
    }
    distance -= length;
    const corner = corners[side]!;
    if (distance <= arc) {
      const angle = corner.angle + distance / radius;
      return {
        x: corner.x + radius * Math.cos(angle),
        z: corner.z + radius * Math.sin(angle),
        heading: -angle,
      };
    }
    distance -= arc;
  }
  return { x: -width + radius, z: -depth, heading: Math.PI / 2 };
}

/** Advance only while decorative motion is allowed, without jumping after a pause. */
export function advanceScenery(time: number, delta: number, still: boolean) {
  return time + (still ? 0 : Math.min(Math.max(delta, 0), 0.05));
}
