import { describe, expect, it } from 'vitest';
import { createGame, createRng, reduceGame, validateState } from '../src/index';
import { game, roll, sequence, type Action } from './helpers';

describe('determinism and state boundaries', () => {
  it('creates identical states from the same seed and players', () => {
    expect(game()).toEqual(game());
    expect(validateState(game())).toEqual([]);
  });

  it('keeps seeded randomness reproducible and in the unit interval', () => {
    const a = createRng('replay-2026');
    const b = createRng('replay-2026');
    const draws = Array.from({ length: 10_000 }, () => a());
    expect(draws).toEqual(Array.from({ length: draws.length }, () => b()));
    expect(draws.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(draws).size).toBeGreaterThan(9_900);
    expect(createRng('different')()).not.toBe(createRng('replay-2026')());
  });

  it('resolves the same action and RNG identically without mutating the input', () => {
    const state = game();
    const original = structuredClone(state);
    const action = { type: 'roll', playerId: 'p1' } as Action;
    const first = reduceGame(state, action, sequence(0.1, 0.2));
    const second = reduceGame(state, action, sequence(0.1, 0.2));
    expect(first).toEqual(second);
    expect(state).toEqual(original);
    expect(first.state).not.toBe(state);
  });

  it.each([
    { type: 'roll', playerId: 'p2' },
    { type: 'roll', playerId: 'missing' },
    { type: 'buy', playerId: 'p1' },
    { type: 'upgrade', playerId: 'p1' },
    { type: 'buyout', playerId: 'p1' },
    { type: 'pay_bail', playerId: 'p1' },
    { type: 'use_escape', playerId: 'p1' },
    { type: 'attempt_escape', playerId: 'p1' },
    { type: 'travel', playerId: 'p1', tile: 99 },
    { type: 'place_championship', playerId: 'p1', tile: 1 },
    { type: 'sell', playerId: 'p1', tile: 1 },
    { type: 'tick', elapsedMs: -1 },
    { type: 'tick', elapsedMs: Number.NaN },
    { type: 'made_up', playerId: 'p1' },
  ])('rejects invalid intentions atomically: %j', (action) => {
    const state = game();
    const original = structuredClone(state);
    const result = reduceGame(state, action as Action, sequence());
    expect(result.error).toBeTruthy();
    expect(result.state).toBe(state);
    expect(state).toEqual(original);
  });

  it('rejects another roll while an acquisition decision is pending', () => {
    const state = roll(game(), 1, 3);
    expect(state.phase).toBe('property');
    const result = reduceGame(state, { type: 'roll', playerId: 'p1' }, sequence());
    expect(result.error).toBeTruthy();
    expect(result.state).toBe(state);
  });

  it('starts on Start without granting an initial lap bonus', () => {
    const state = game(4);
    expect(state.players.map((player) => player.cash)).toEqual(Array(4).fill(1_500_000));
    expect(state.players.map((player) => player.position)).toEqual([0, 0, 0, 0]);
    expect(state.festivals).toHaveLength(3);
    expect(new Set(state.festivals).size).toBe(3);
    expect(state.phase).toBe('roll');
    expect(state.winner).toBeNull();
  });

  it('rejects player counts outside the supported range', () => {
    for (const count of [0, 1, 5]) {
      expect(() =>
        createGame({
          players: Array.from({ length: count }, (_, i) => ({ id: `${i}`, name: `${i}` })),
        }),
      ).toThrow();
    }
  });
});
