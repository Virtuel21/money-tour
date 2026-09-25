import type { Rng } from './types.js';

/** Deterministic Mulberry32 stream. Never used as cryptographic entropy. */
export function createRng(seed: string | number = 1): Rng {
  let value = typeof seed === 'number' ? seed >>> 0 : 2166136261;
  if (typeof seed === 'string') {
    for (let index = 0; index < seed.length; index += 1)
      value = Math.imul(value ^ seed.charCodeAt(index), 16777619) >>> 0;
  }
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: Rng, count: number): number {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error('RNG must return a finite value in [0, 1).');
  if (!Number.isSafeInteger(count) || count < 1)
    throw new Error('Random range must be a positive integer.');
  return Math.floor(value * count);
}
