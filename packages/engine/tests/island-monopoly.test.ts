import { expect, it } from 'vitest';
import { config, createGame, reduceGame, victoryThreats } from '../src/index';

function game(teams = false) {
  const state = createGame({
    config: { ...config, shuffleStreets: false, lineVictory: false, adventures: false },
    mode: teams ? 'teams' : 'free-for-all',
    players: ['a', 'b', 'c', 'd'].map((id, i) => ({ id, name: id, team: i % 2 })),
  });
  state.phase = 'end';
  return state;
}
it.each([false, true])('counts the archipelago as a third street, teams=%s', (teams) => {
  const state = game(teams);
  // Two streets on different sides, so a line victory cannot mask this regression.
  [1, 2, 3, 9, 10, 4, 12, 20, 28].forEach((id, i) => {
    state.properties[id]!.ownerId = teams && i % 2 ? 'c' : 'a';
  });
  const result = reduceGame(state, { type: 'finish', playerId: 'a' });
  expect(result.error).toBeUndefined();
  expect(result.state.winner?.reasons).toEqual(['triple_monopoly']);
  expect(result.state.winner?.playerIds).toEqual(teams ? ['a', 'c'] : ['a']);
});
it('does not count three islands, and warns about the fourth before a winning purchase', () => {
  const state = game();
  for (const id of [1, 2, 3, 9, 10, 4, 12, 20]) state.properties[id]!.ownerId = 'a';
  expect(victoryThreats(state)[0]!.missing).toEqual([28]);
  expect(reduceGame(state, { type: 'finish', playerId: 'a' }).state.winner).toBeNull();
  state.phase = 'property';
  state.players[0]!.position = 28;
  expect(reduceGame(state, { type: 'buy', playerId: 'a' }).state.winner?.reasons).toContain(
    'triple_monopoly',
  );
});
it('counts islands once and clears the threat after an island is lost', () => {
  const state = game();
  for (const id of [1, 2, 3, 9, 4, 12, 20, 28]) state.properties[id]!.ownerId = 'a';
  expect(victoryThreats(state)[0]!.missing).toEqual([10]);
  expect(reduceGame(state, { type: 'finish', playerId: 'a' }).state.winner).toBeNull();
  state.properties[4]!.ownerId = 'b';
  expect(victoryThreats(state)).toEqual([]);
});
