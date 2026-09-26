export { config } from './config.js';
export { createRng } from './rng.js';
export {
  createGame,
  reduceGame,
  chooseBotAction,
  getLegalActions,
  isLegalPlayerAction,
  getNetWorth,
  getPropertyValue,
  getRent,
  validateState,
} from './engine.js';
export type * from './types.js';

export { sameRules } from './layout.js';
export { default as legacyConfig } from './legacy-v5.config.json';

export { default as legacyConfigV6 } from './legacy-v6.config.json';

export { duelCommitment, duelChoices, getDecisionPlayerId } from './duel.js';
