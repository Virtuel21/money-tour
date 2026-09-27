import type { GameConfig } from './types.js';
/** Convert edition-independent rewards, preserving the economy of older saves. */
export const scaledAmount = (config: GameConfig, amount: number): number =>
  Math.round(amount / (config.moneyDivisor ?? 1));
