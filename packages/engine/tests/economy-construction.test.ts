import { expect, it } from 'vitest';
import {
  config,
  createGame,
  getConstructionQuote,
  getLegalActions,
  reduceGame,
  scaledAmount,
  legacyConfigV11,
  type GameConfig,
} from '../src/index';
const game = () => {
  const s = createGame({
    config: { ...config, adventures: false, shuffleStreets: false, festivalCount: 0 },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
  });
  s.players[0]!.position = 5;
  s.phase = 'property';
  return s;
};
it('uses small integer money while preserving historical rewards', () => {
  expect(config.initialCash).toBe(1500);
  expect(config.startBonus).toBe(300);
  expect(config.casinoMinWin).toBe(50);
  expect(scaledAmount(config, 100000)).toBe(100);
  expect(scaledAmount(legacyConfigV11 as GameConfig, 100000)).toBe(100000);
  for (const t of config.board.filter((t) => t.type === 'city')) {
    expect(t.price).toBeLessThan(500);
    expect([...t.rents!, ...t.buildCosts!].every(Number.isSafeInteger)).toBe(true);
  }
});
it('closes the visit after a land purchase and only bills missing levels on a later visit', () => {
  const s = reduceGame(game(), { type: 'buy', playerId: 'a', level: 1 }).state;
  expect(s.phase).toBe('end');
  expect(s.players[0]!.cash).toBe(1275);
  expect(getLegalActions(s).some((a) => a.type === 'upgrade')).toBe(false);
  expect(reduceGame(s, { type: 'upgrade', playerId: 'a', level: 3 }).state).toBe(s);
  // Simulate the next landing on this city, not another click in the same visit.
  s.phase = 'property';
  expect(getConstructionQuote(s, 3)).toMatchObject({
    land: 0,
    total: 150,
    rent: 105,
    canBuy: true,
  });
  const r = reduceGame(s, { type: 'upgrade', playerId: 'a', level: 3 });
  expect(r.error).toBeUndefined();
  expect(r.state.players[0]!.cash).toBe(1125);
  expect(r.state.properties[5]!.level).toBe(3);
  expect(r.state.phase).toBe('end');
  expect(r.events.filter((e) => e.type === 'build').map((e) => e.level)).toEqual([2, 3]);
});
it('rejects unavailable, unaffordable, backward and off-seat construction without a partial debit', () => {
  const s = game();
  s.properties[5]!.ownerId = 'a';
  s.properties[5]!.level = 1;
  for (const level of [-1, 0, 1, 1.5, 4, 5, NaN, Infinity]) {
    expect(reduceGame(s, { type: 'upgrade', playerId: 'a', level }).state).toBe(s);
  }
  expect(reduceGame(s, { type: 'upgrade', playerId: 'b', level: 3 }).state).toBe(s);
  s.players[0]!.cash = 149;
  expect(reduceGame(s, { type: 'upgrade', playerId: 'a', level: 3 }).state).toBe(s);
  s.players[0]!.cash = 1000;
  s.players[0]!.laps = 5;
  const r = reduceGame(s, { type: 'upgrade', playerId: 'a', level: 4 });
  expect(r.state.players[0]!.cash).toBe(775);
  expect(r.state.properties[5]!.level).toBe(4);
  expect(r.state.phase).toBe('end');
});
it('keeps the former per-click construction flow for saved old games', () => {
  const s = game();
  s.config.singlePropertyDecision = false;
  const bought = reduceGame(s, { type: 'buy', playerId: 'a' }).state;
  expect(bought.phase).toBe('property');
  expect(reduceGame(bought, { type: 'upgrade', playerId: 'a', level: 3 }).error).toBeTruthy();
  expect(reduceGame(bought, { type: 'upgrade', playerId: 'a' }).state.properties[5]!.level).toBe(1);
});
