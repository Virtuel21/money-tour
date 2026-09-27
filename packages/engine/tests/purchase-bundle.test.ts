import { expect, it } from 'vitest';
import {
  config,
  createGame,
  getPurchaseQuote,
  reduceGame,
  validateState,
  type GameAction,
} from '../src/index';
const game = () => {
  const s = createGame({
    config: { ...config, shuffleStreets: false, adventures: false, festivalCount: 0 },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
  });
  s.phase = 'property';
  s.players[0]!.position = 5;
  return s;
};
it.each([0, 1, 2, 3, 4])(
  'buys land and level %i with exactly one debit and one state transition',
  (level) => {
    const s = game();
    s.players[0]!.laps = 5;
    const before = JSON.stringify(s);
    const q = getPurchaseQuote(s, level)!;
    expect(q.total).toBe(150 + 75 * level);
    expect(q.rent).toBe(s.config.board[5]!.rents![level]);
    const result = reduceGame(s, { type: 'buy', playerId: 'a', level });
    expect(result.error).toBeUndefined();
    expect(result.state.seq).toBe(s.seq + 1);
    expect(result.state.players[0]!.cash).toBe(s.players[0]!.cash - q.total);
    expect(result.state.properties[5]).toMatchObject({ ownerId: 'a', level });
    expect(JSON.stringify(s)).toBe(before);
    expect(
      result.events
        .filter((e) => ['purchase', 'build'].includes(e.type))
        .reduce((sum, e) => sum + e.amount!, 0),
    ).toBe(q.total);
    expect(validateState(result.state)).toEqual([]);
  },
);
it('sums every construction tier, not only the price of the last one', () => {
  const s = game();
  s.config.board[5]!.buildCosts = [0, 75, 100, 125, 200];
  s.players[0]!.laps = 5;
  expect(getPurchaseQuote(s, 4)!.total).toBe(650);
  expect(reduceGame(s, { type: 'buy', playerId: 'a', level: 4 }).state.players[0]!.cash).toBe(850);
});
it('rejects unaffordable bundles, premature hotels, invalid levels and off-turn orders without partial purchases', () => {
  const s = game();
  s.players[0]!.cash = 200;
  const actions = [
    { type: 'buy', playerId: 'a', level: 1 },
    { type: 'buy', playerId: 'a', level: 4 },
    { type: 'buy', playerId: 'b', level: 0 },
    ...[-1, 1.5, 5, NaN, null].map((level) => ({ type: 'buy', playerId: 'a', level })),
  ] as GameAction[];
  for (const action of actions) {
    const r = reduceGame(s, action);
    expect(r.error).toBeTruthy();
    expect(r.state).toBe(s);
    expect(r.events).toEqual([]);
  }
  s.players[0]!.cash = 1500;
  expect(reduceGame(s, { type: 'buy', playerId: 'a', level: 4 }).error).toBeTruthy();
  s.players[0]!.laps = 5;
  expect(reduceGame(s, { type: 'buy', playerId: 'a', level: 4 }).error).toBeUndefined();
});
it('never builds on an island or on property already owned', () => {
  const s = game();
  s.players[0]!.position = 4;
  expect(reduceGame(s, { type: 'buy', playerId: 'a', level: 1 }).error).toBeTruthy();
  s.players[0]!.position = 5;
  s.properties[5]!.ownerId = 'b';
  expect(reduceGame(s, { type: 'buy', playerId: 'a', level: 1 }).error).toBeTruthy();
});
it('discounts only the land with fraud, consumes one card and retains the full tax liability', () => {
  const s = game();
  const card = s.config.cards.find((c) => c.effect === 'fraud')!;
  s.deck = s.deck.filter((id) => id !== card.id);
  s.players[0]!.heldCards = [card.id];
  const q = getPurchaseQuote(s, 3, true)!;
  expect(q.total).toBe(300);
  const r = reduceGame(s, { type: 'buy_fraud', playerId: 'a', level: 3 });
  expect(r.error).toBeUndefined();
  expect(r.state.properties[5]!.level).toBe(3);
  expect(r.state.players[0]!.cash).toBe(1200);
  expect(r.state.players[0]!.fraudLiability).toBe(300);
  expect(r.state.players[0]!.heldCards).toEqual([]);
  expect(r.state.discard.filter((id) => id === card.id)).toHaveLength(1);
  expect(validateState(r.state)).toEqual([]);
});
it('quotes the effective rent including current festival and crisis modifiers', () => {
  const s = game();
  s.festivals = [5];
  s.crisis = { remaining: ['a', 'b'] };
  expect(getPurchaseQuote(s, 3)!.rent).toBe(105);
  delete s.crisis;
  expect(getPurchaseQuote(s, 3)!.rent).toBe(210);
});
it('keeps bundled purchases disabled in previous rules', () => {
  const s = game();
  delete s.config.bundledPurchase;
  expect(getPurchaseQuote(s, 1)!.available).toBe(false);
  expect(reduceGame(s, { type: 'buy', playerId: 'a', level: 1 }).error).toBeTruthy();
  expect(reduceGame(s, { type: 'buy', playerId: 'a' }).error).toBeUndefined();
});
