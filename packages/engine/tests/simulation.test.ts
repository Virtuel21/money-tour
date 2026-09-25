import { describe, expect, it } from 'vitest';
import { chooseBotAction, createGame, createRng, reduceGame, validateState } from '../src/index';

describe('1,000 complete reproducible bot games', () => {
  it.each(Array.from({ length: 20 }, (_, index) => index))(
    'completes batch %i with no invalid state',
    (batch) => {
      for (let seed = batch * 50; seed < (batch + 1) * 50; seed += 1) {
        const teams = seed % 4 === 0;
        const count = teams ? 4 : 2 + (seed % 3);
        const rng = createRng(seed);
        let state = createGame(
          {
            players: Array.from({ length: count }, (_, i) => ({
              id: `bot-${i}`,
              name: `Bot ${i}`,
              bot: true,
            })),
            mode: teams ? 'teams' : 'free-for-all',
          },
          rng,
        );
        let actions = 0;
        while (!state.winner && actions < state.config.simulationActionLimit) {
          const result = reduceGame(state, chooseBotAction(state), rng);
          if (result.error) throw new Error(`Seed ${seed}, action ${actions}: ${result.error}`);
          state = result.state;
          if (!state.winner)
            state = reduceGame(state, { type: 'tick', elapsedMs: 2500 }, rng).state;
          const errors = validateState(state);
          if (errors.length)
            throw new Error(`Seed ${seed}, action ${actions}: ${errors.join('; ')}`);
          actions += 1;
        }
        expect(state.winner, `Seed ${seed} must actually terminate`).not.toBeNull();
        expect(state.phase).toBe('finished');
      }
    },
  );
});
