import { expect, it } from 'vitest';
import {
  config,
  createGame,
  getBuyoutQuote,
  reduceGame,
  validateState,
  type GameAction,
} from '../src/index';
const game = (level = 0) => {
  const s = createGame({
    config: { ...config, shuffleStreets: false, adventures: false, festivalCount: 0 },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
  });
  s.phase = 'property';
  s.players[0]!.position = 5;
  s.players[0]!.laps = 2;
  s.properties[5] = { ownerId: 'b', level, championships: 0 };
  return s;
};
it.each([0, 1, 2, 3, 4])(
  'buys out land with level %i atomically and pays the seller only the existing property',
  (level) => {
    const s = game(),
      before = JSON.stringify(s),
      quote = getBuyoutQuote(s, level)!;
    expect(quote.total).toBe(300 + 75 * level);
    expect(quote.rent).toBe(s.config.board[5]!.rents![level]);
    const r = reduceGame(s, { type: 'buyout', playerId: 'a', level });
    expect(r.error).toBeUndefined();
    expect(JSON.stringify(s)).toBe(before);
    expect(r.state.players.map((p) => p.cash)).toEqual([1500 - quote.total, 1800]);
    expect(r.state.properties[5]).toMatchObject({ ownerId: 'a', level });
    expect(r.state.phase).toBe('end');
    expect(reduceGame(r.state, { type: 'upgrade', playerId: 'a' }).error).toBeTruthy();
    expect(
      r.events
        .filter((e) => ['buyout', 'build'].includes(e.type))
        .reduce((sum, e) => sum + e.amount!, 0),
    ).toBe(quote.total);
    expect(validateState(r.state)).toEqual([]);
  },
);
it('keeps existing houses and charges only missing levels at their individual building costs', () => {
  const s = game(2);
  s.config.board[5]!.buildCosts = [0, 75, 100, 125, 200];
  const q = getBuyoutQuote(s, 4)!;
  expect(q).toMatchObject({ land: 650, buildings: 325, total: 975 });
  const r = reduceGame(s, { type: 'buyout', playerId: 'a', level: 4 });
  expect(r.state.players.map((p) => p.cash)).toEqual([525, 2150]);
  expect(r.events.filter((e) => e.type === 'build').map((e) => e.level)).toEqual([3, 4]);
  expect(reduceGame(s, { type: 'buyout', playerId: 'a', level: 0 }).error).toBeTruthy();
  expect(reduceGame(s, { type: 'buyout', playerId: 'a' }).state.properties[5]!.level).toBe(2);
});
it('rejects invalid, unaffordable, premature hotel and off-turn bundles without a partial transfer', () => {
  const s = game();
  s.players[0]!.laps = 1;
  s.players[0]!.cash = 350;
  const actions = [
    { type: 'buyout', playerId: 'a', level: 1 },
    { type: 'buyout', playerId: 'a', level: 4 },
    { type: 'buyout', playerId: 'b', level: 0 },
    ...[-1, 1.5, 5, NaN, null].map((level) => ({ type: 'buyout', playerId: 'a', level })),
  ] as GameAction[];
  for (const action of actions) {
    const r = reduceGame(s, action);
    expect(r.error).toBeTruthy();
    expect(r.state).toBe(s);
    expect(r.events).toEqual([]);
  }
  s.players[0]!.cash = 1500;
  expect(getBuyoutQuote(s, 4)!.available).toBe(false);
  s.players[0]!.laps = 2;
  expect(getBuyoutQuote(s, 4)!.canBuy).toBe(true);
  s.properties[5]!.level = 4;
  expect(getBuyoutQuote(s, 4)!.available).toBe(true);
});
it('lets insurance block the entire bundle once without debiting either party or building', () => {
  const s = game();
  s.players[1]!.insurance = { tile: 5 };
  const r = reduceGame(s, { type: 'buyout', playerId: 'a', level: 3 });
  expect(r.error).toBeUndefined();
  expect(r.state.players.map((p) => p.cash)).toEqual([1500, 1500]);
  expect(r.state.properties[5]).toMatchObject({ ownerId: 'b', level: 0 });
  expect(r.state.players[1]!.insurance).toBeUndefined();
  expect(r.events.some((e) => e.type === 'build')).toBe(false);
  r.state.phase = 'property';
  expect(
    reduceGame(r.state, { type: 'buyout', playerId: 'a', level: 3 }).state.properties[5],
  ).toMatchObject({ ownerId: 'a', level: 3 });
});
it('keeps historical buyout commands unchanged and does not add bundles to pre-construction saves', () => {
  const s = game(1);
  delete s.config.singlePropertyDecision;
  expect(getBuyoutQuote(s, 2)!.available).toBe(false);
  const r = reduceGame(s, { type: 'buyout', playerId: 'a' });
  expect(r.error).toBeUndefined();
  expect(r.state.phase).toBe('property');
  expect(r.state.properties[5]!.level).toBe(1);
});
