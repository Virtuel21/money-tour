import { expect, it } from 'vitest';
import { config, createGame, reduceGame, victoryThreats } from '../src/index';
function game(teams = false) {
  return createGame({
    config: { ...config, shuffleStreets: false },
    mode: teams ? 'teams' : 'free-for-all',
    players: ['a', 'b', 'c', 'd'].map((id, i) => ({
      id,
      name: id.toUpperCase(),
      ...(teams ? { team: i % 2 } : {}),
    })),
    seed: 'warnings',
  });
}
it('warns one purchase before three completed streets, not before an ordinary first street', () => {
  const s = game();
  Object.values(s.properties).forEach((p) => (p.ownerId = null));
  s.properties[1]!.ownerId = 'a';
  expect(victoryThreats(s)).toEqual([]);
  for (const id of [1, 2, 3, 5, 6, 9]) s.properties[id]!.ownerId = 'a';
  expect(victoryThreats(s).find((t) => t.playerIds.includes('a'))?.missing).toEqual([4, 10]);
  expect(victoryThreats(s)[0]!.message).toContain('Venise');
});
it('requires the island for a side victory and ignores disabled island victory', () => {
  const s = game();
  Object.values(s.properties).forEach((p) => (p.ownerId = null));
  s.config.groupsToWin = 8;
  for (const id of [1, 2, 3, 5, 6]) s.properties[id]!.ownerId = 'a';
  expect(victoryThreats(s)[0]!.missing).toEqual([4]);
  s.config.lineVictory = false;
  for (const id of [4, 12, 20]) s.properties[id]!.ownerId = 'a';
  expect(victoryThreats(s)).toEqual([]);
  s.config.resortVictory = true;
  expect(victoryThreats(s)[0]!.missing).toEqual([28]);
});
it('combines teammates and never leaks hidden objectives or a capital', () => {
  const s = game(true);
  Object.values(s.properties).forEach((p) => (p.ownerId = null));
  [1, 2, 3, 5, 6, 9].forEach((id, i) => (s.properties[id]!.ownerId = i % 2 ? 'c' : 'a'));
  const warning = victoryThreats(s)[0]!;
  expect(warning.playerIds).toEqual(['a', 'c']);
  expect(warning.message).toContain('L’équipe de A et C');
  expect(warning.message).not.toMatch(/capitale|objectif/i);
  s.players[2]!.eliminated = true;
  expect(victoryThreats(s)).toEqual([]);
});
it('announces a new risk once, remains silent on ticks, and clears it after a sale', () => {
  let s = game();
  Object.values(s.properties).forEach((p) => (p.ownerId = null));
  for (const id of [1, 2, 3, 5, 6]) s.properties[id]!.ownerId = 'a';
  s.players[0]!.position = 9;
  s.phase = 'property';
  const purchase = reduceGame(s, { type: 'buy', playerId: 'a' });
  expect(purchase.events.filter((e) => e.type === 'victory_warning')).toHaveLength(1);
  s = purchase.state;
  expect(
    reduceGame(s, { type: 'tick', elapsedMs: 1 }).events.some((e) => e.type === 'victory_warning'),
  ).toBe(false);
  s.properties[9]!.ownerId = null;
  s.properties[1]!.ownerId = null;
  expect(victoryThreats(s)).toEqual([]);
});
