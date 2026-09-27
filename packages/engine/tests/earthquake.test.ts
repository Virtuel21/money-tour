import { expect, it, vi } from 'vitest';
import {
  config,
  createGame,
  reduceGame,
  validateState,
  legacyConfigV12,
  type GameConfig,
  type GameEvent,
} from '../src/index';
import { maybeEarthquake } from '../src/earthquake';
import { sequence } from './helpers';

function game() {
  const state = createGame({
    config: { ...config, shuffleStreets: false, crisisChance: 0 },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ],
    seed: 'quake',
  });
  state.adventure!.round = 4;
  state.adventure!.tenderDone = true;
  state.properties[1] = { ownerId: 'a', level: 1, championships: 0 };
  state.properties[9] = { ownerId: 'b', level: 4, championships: 0, roachTurns: 2 };
  return state;
}
it('only targets constructed cities and chooses owners before their buildings', () => {
  const state = game();
  state.properties[2] = { ownerId: 'a', level: 3, championships: 0 };
  const cash = state.players.map((p) => p.cash);
  const events: GameEvent[] = [];
  maybeEarthquake(state, sequence(0.02, 0.5, 0), events);
  expect(events[0]).toMatchObject({
    type: 'earthquake',
    playerId: 'b',
    tile: 9,
    fromLevel: 4,
    level: 3,
    blocked: false,
  });
  expect(state.properties[9]!.level).toBe(3);
  expect(state.properties[9]!.roachTurns).toBeUndefined();
  expect(state.properties[1]!.level).toBe(1);
  expect(state.players.map((p) => p.cash)).toEqual(cash);
  expect(validateState(state)).toEqual([]);
});
it('removes only one house and leaves the land in its owner’s hands', () => {
  const state = game();
  maybeEarthquake(state, sequence(0, 0, 0), []);
  expect(state.properties[1]).toMatchObject({ ownerId: 'a', level: 0 });
});
it('consumes insurance once on the targeted property only', () => {
  const state = game();
  state.players[0]!.insurance = { tile: 1 };
  state.players[1]!.insurance = { tile: 9 };
  const events: GameEvent[] = [];
  maybeEarthquake(state, sequence(0, 0, 0), events);
  expect(events[0]).toMatchObject({ blocked: true, level: 1 });
  expect(events[1]!.type).toBe('insured');
  expect(state.players[0]!.insurance).toBeUndefined();
  expect(state.players[1]!.insurance).toEqual({ tile: 9 });
  state.adventure!.round = 10;
  maybeEarthquake(state, sequence(0, 0, 0), []);
  expect(state.properties[1]!.level).toBe(0);
  expect(state.earthquakeHistory).toEqual({ count: 2, lastRound: 10 });
});
it.each(['empty', 'early', 'cooldown', 'limit', 'crisis', 'legacy'] as const)(
  'skips %s rounds without consuming RNG',
  (mode) => {
    const state = game();
    if (mode === 'empty')
      Object.values(state.properties).forEach((p) => {
        p.level = 0;
        delete p.roachTurns;
      });
    if (mode === 'early') state.adventure!.round = 3;
    if (mode === 'cooldown') state.earthquakeHistory = { count: 1, lastRound: 3 };
    if (mode === 'limit') state.earthquakeHistory = { count: 2, lastRound: 0 };
    if (mode === 'crisis') state.crisis = { remaining: ['a'] };
    if (mode === 'legacy') state.config = legacyConfigV12 as GameConfig;
    const rng = vi.fn(() => 0);
    const events: GameEvent[] = [];
    maybeEarthquake(state, rng, events);
    expect(rng).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  },
);
it('uses a strict 3% threshold and no target draw on a miss', () => {
  const state = game();
  maybeEarthquake(state, sequence(0.03), []);
  expect(state.earthquakeHistory).toBeUndefined();
});
it('triggers only at a new table round, is replayable, and does not mutate the input', () => {
  const state = game();
  state.currentPlayer = 2;
  state.phase = 'end';
  const original = structuredClone(state);
  const action = { type: 'finish', playerId: 'c' } as const;
  const result = reduceGame(state, action, () => 0);
  expect(result.error).toBeUndefined();
  expect(result.events.some((e) => e.type === 'earthquake')).toBe(true);
  expect(reduceGame(state, action, () => 0)).toEqual(result);
  expect(state).toEqual(original);
  expect(validateState(result.state)).toEqual([]);
  state.extraRoll = true;
  expect(reduceGame(state, action, sequence()).events.some((e) => e.type === 'earthquake')).toBe(
    false,
  );
  state.extraRoll = false;
  state.currentPlayer = 0;
  expect(
    reduceGame(state, { type: 'finish', playerId: 'a' }, sequence()).events.some(
      (e) => e.type === 'earthquake',
    ),
  ).toBe(false);
});
it('rejects malformed quake pacing and saved history', () => {
  for (const earthquakeChance of [-1, 101, 0.5])
    expect(() =>
      createGame({
        config: { ...config, earthquakeChance },
        players: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ],
      }),
    ).toThrow();
  const state = game();
  state.earthquakeHistory = { count: -1, lastRound: 0 };
  expect(validateState(state)).toContain('Invalid earthquake history.');
});
