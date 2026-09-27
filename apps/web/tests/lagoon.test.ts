import { describe, expect, it } from 'vitest';
import {
  advanceScenery,
  boatRadius,
  islandRadius,
  lagoonIslands,
  sailingLoopLength,
  sailingPose,
} from '../src/board/lagoon';
import { boardShape } from '../src/board/layout';

describe('lagoon navigation', () => {
  it('keeps the whole hull clear of every island, other boat and legacy board shoreline for a full loop', () => {
    for (let step = 0; step <= 2000; step++) {
      const time = ((step / 2000) * sailingLoopLength) / 0.38;
      const boats = [sailingPose(time, 0), sailingPose(time, 1)];
      expect(Math.hypot(boats[0]!.x - boats[1]!.x, boats[0]!.z - boats[1]!.z)).toBeGreaterThan(
        2 * boatRadius,
      );
      for (const boat of boats) {
        for (const island of lagoonIslands)
          expect(Math.hypot(boat.x - island.x, boat.z - island.z)).toBeGreaterThan(
            islandRadius + boatRadius,
          );
        for (const count of [26, 28, 30, 32]) {
          const board = boardShape(count);
          expect(Math.abs(boat.x) + boatRadius).toBeLessThan(board.x - board.depth / 2);
          expect(Math.abs(boat.z) + boatRadius).toBeLessThan(board.z - board.depth / 2);
        }
      }
    }
  });
  it('closes its loop with continuous position, heading and speed through every bend', () => {
    const duration = sailingLoopLength / 0.38;
    for (let t = 0; t <= duration; t += 0.05) {
      const a = sailingPose(t, 0),
        b = sailingPose(t + 0.01, 0);
      expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeCloseTo(0.0038, 5);
      expect(Math.cos(a.heading - b.heading)).toBeGreaterThan(0.9999);
    }
    expect(sailingPose(duration, 0).x).toBeCloseTo(sailingPose(0, 0).x);
    expect(sailingPose(duration, 0).z).toBeCloseTo(sailingPose(0, 0).z);
  });
  it('freezes decorations during pause/reduced motion and prevents jumps after backgrounding', () => {
    expect(advanceScenery(12, 1, true)).toBe(12);
    expect(advanceScenery(12, 60, false)).toBe(12.05);
    expect(advanceScenery(12, 0.016, false)).toBe(12.016);
  });
});
