import legacyConfig from '../src/legacy-v5.config.json';
import type { GameConfig } from '../src/index';
import { expect, it } from 'vitest';
import { createGame, getRent, reduceGame, validateState } from '../src/index';
import { sequence } from './helpers';

const host = () => {
  const state = createGame({
    config: legacyConfig as GameConfig,
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
    seed: 42,
  });
  state.festivals = [5, 8, 15];
  state.properties[1]!.ownerId = 'a';
  state.players[0]!.position = 14;
  state.phase = 'championship';
  return reduceGame(state, { type: 'place_championship', playerId: 'a', tile: 1 }).state;
};
it('expires after four owner turns, with normal rent restored and a single expiry event', () => {
  let state = host();
  const base = state.config.board[1]!.rents![0]!;
  expect(getRent(state, 1)).toBe(base * 2);
  for (let round = 0; round < 4; round++) {
    state.phase = 'end';
    state.extraRoll = false;
    state = reduceGame(state, { type: 'finish', playerId: 'a' }).state;
    expect(state.properties[1]!.championshipTurns).toBe(4 - round);
    state.phase = 'end';
    const result = reduceGame(state, { type: 'finish', playerId: 'b' });
    state = result.state;
    expect(result.events.filter((e) => e.type === 'championship_expired')).toHaveLength(
      round === 3 ? 1 : 0,
    );
    expect(state.properties[1]!.championshipTurns).toBe(round === 3 ? undefined : 3 - round);
    expect(validateState(state)).toEqual([]);
  }
  expect(getRent(state, 1)).toBe(base);
  expect(state.properties[1]!.championships).toBe(0);
});
it('extra rolls and clock ticks do not consume championship turns, and hosting again only refreshes', () => {
  let state = host();
  state = reduceGame(state, { type: 'tick', elapsedMs: 1000 }).state;
  expect(state.properties[1]!.championshipTurns).toBe(4);
  state.extraRoll = true;
  state.phase = 'end';
  const extra = reduceGame(state, { type: 'finish', playerId: 'a' });
  expect(extra.events.some((e) => e.type === 'extra_roll')).toBe(true);
  state = extra.state;
  expect(state.properties[1]!.championshipTurns).toBe(4);
  state.phase = 'championship';
  state.properties[1]!.championshipTurns = 2;
  const rent = getRent(state, 1);
  state = reduceGame(state, { type: 'place_championship', playerId: 'a', tile: 1 }).state;
  expect(state.properties[1]!.championshipTurns).toBe(4);
  expect(getRent(state, 1)).toBe(rent);
  expect(validateState(JSON.parse(JSON.stringify(state)))).toEqual([]);
});
it('rejects missing, excessive or stray remaining-turn data', () => {
  for (const duration of [undefined, 0, 5, -1, 1.5]) {
    const state = host();
    state.properties[1]!.championshipTurns = duration;
    expect(validateState(state).length).toBeGreaterThan(0);
  }
  const state = host();
  state.properties[1]!.championships = 0;
  expect(validateState(state).length).toBeGreaterThan(0);
});
it('announces tax before the money transfer, including an insolvent payer', () => {
  for (const cash of [1500000, 1000]) {
    const state = createGame({
      config: legacyConfig as GameConfig,
      players: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
      seed: 42,
    });
    state.players[0]!.position = 6;
    state.players[0]!.cash = cash;
    const result = reduceGame(state, { type: 'roll', playerId: 'a' }, sequence(0.2, 0.4));
    expect(result.events.find((e) => e.type === 'tax_notice')).toMatchObject({
      playerId: 'a',
      tile: 11,
      amount: 50000,
    });
    const notice = result.events.findIndex((e) => e.type === 'tax_notice');
    expect(notice).toBeGreaterThan(result.events.findIndex((e) => e.type === 'move'));
    expect(result.events.slice(0, notice).some((e) => e.type === 'payment')).toBe(false);
    expect(validateState(result.state)).toEqual([]);
  }
});
