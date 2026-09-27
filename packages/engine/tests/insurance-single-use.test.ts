import { expect, it } from 'vitest';
import { config, createGame, getLegalActions, reduceGame, validateState } from '../src/index';
const game = () => {
  const s = createGame({
    config: { ...config, shuffleStreets: false },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
  });
  s.properties[1]!.ownerId = 'a';
  s.properties[2]!.ownerId = 'a';
  s.properties[5]!.ownerId = 'b';
  s.players[0]!.insurance = { tile: null };
  return s;
};
it('binds one token once, to a property of its owner only', () => {
  const s = game();
  for (const tile of [5, 9])
    expect(reduceGame(s, { type: 'insure', playerId: 'a', tile }).error).toBeTruthy();
  expect(reduceGame(s, { type: 'insure', playerId: 'b', tile: 5 }).error).toBeTruthy();
  const placed = reduceGame(s, { type: 'insure', playerId: 'a', tile: 1 });
  expect(placed.error).toBeUndefined();
  expect(getLegalActions(placed.state).some((a) => a.type === 'insure')).toBe(false);
  expect(reduceGame(placed.state, { type: 'insure', playerId: 'a', tile: 2 }).error).toBeTruthy();
  expect(placed.state.players[0]!.insurance).toEqual({ tile: 1 });
  expect(validateState(placed.state)).toEqual([]);
});
it('blocks only the insured property and only the first hostile purchase', () => {
  const s = reduceGame(game(), { type: 'insure', playerId: 'a', tile: 1 }).state;
  s.currentPlayer = 1;
  s.players[1]!.position = 2;
  s.phase = 'property';
  const other = reduceGame(s, { type: 'buyout', playerId: 'b' });
  expect(other.error).toBeUndefined();
  expect(other.state.properties[2]!.ownerId).toBe('b');
  expect(other.state.players[0]!.insurance).toEqual({ tile: 1 });
  other.state.phase = 'property'; // A later visit.
  other.state.players[1]!.position = 1;
  const blocked = reduceGame(other.state, { type: 'buyout', playerId: 'b' });
  expect(blocked.error).toBeUndefined();
  expect(blocked.state.properties[1]!.ownerId).toBe('a');
  expect(blocked.state.players[0]!.insurance).toBeUndefined();
  expect(blocked.events.filter((e) => e.type === 'insured')).toHaveLength(1);
  blocked.state.phase = 'property';
  const again = reduceGame(blocked.state, { type: 'buyout', playerId: 'b' });
  expect(again.error).toBeUndefined();
  expect(again.state.properties[1]!.ownerId).toBe('b');
  expect(validateState(again.state)).toEqual([]);
});
it('does not recycle a placed token when selling its protected property', () => {
  const s = reduceGame(game(), { type: 'insure', playerId: 'a', tile: 1 }).state;
  s.phase = 'debt';
  s.players[0]!.cash = 0;
  s.debt = { playerId: 'a', creditorId: null, amount: 40, reason: 'tax', continuation: 'end' };
  const sold = reduceGame(s, { type: 'sell', playerId: 'a', tile: 1 });
  expect(sold.error).toBeUndefined();
  expect(sold.state.players[0]!.insurance).toBeUndefined();
  expect(getLegalActions(sold.state).some((a) => a.type === 'insure')).toBe(false);
});
