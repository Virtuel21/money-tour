import { expect, it } from 'vitest';
import {
  type GameConfig,
  createGame,
  createRng,
  getLegalActions,
  getRent,
  reduceGame,
  validateState,
  type GameAction,
  type GameState,
} from '../src/index';
import fixture from './fixtures/fortune-30.json';
const config = fixture as GameConfig;
import { sequence } from './helpers';
function game() {
  return createGame({
    config: { ...config, shuffleStreets: false },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ],
    seed: 'fortune',
  });
}
it('rejects invalid jackpot chances and economic settings before creating a game', () => {
  for (const invalid of [
    { casinoBaseChance: 51 },
    { casinoChanceStep: -1 },
    { casinoMaxChance: 101 },
    { karmaAmount: 0 },
    { fraudDiscount: NaN },
    { fraudDiscount: 1.1 },
  ]) {
    expect(() =>
      createGame({
        config: { ...config, ...invalid },
        players: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ],
      }),
    ).toThrow();
  }
});
function step(s: GameState, a: GameAction, rng = () => 0.75) {
  const result = reduceGame(s, a, rng);
  expect(result.error).toBeUndefined();
  expect(validateState(result.state)).toEqual([]);
  return result;
}
function hold(s: GameState, id: string) {
  s.deck = s.deck.filter((c) => c !== id);
  s.players[0]!.heldCards = [id];
}
function card(s: GameState, id: string) {
  s.pendingAttack = id;
  s.deck = s.deck.filter((c) => c !== id);
  s.discard.push(id);
  s.phase = 'attack';
}
function visit(s: GameState, tile: number, random = 0.75) {
  s.players[0]!.position = tile - 3;
  s.phase = 'roll';
  return step(s, { type: 'roll', playerId: 'a' }, sequence(0, 0.2, random));
}

it('uses ten spaces on each long side, two casinos, insurance and Karma without adding taxes', () => {
  expect(config.board).toHaveLength(30);
  expect(config.board[29]!.type).toBe('tax');
  expect(config.board.filter((t) => t.type === 'casino').map((t) => t.id)).toEqual([7, 22]);
  expect(config.board[8]!.type).toBe('insurance');
  expect(config.board[23]!.type).toBe('karma');
});
it('increases casino chances on successive visits, caps them and resets only the winning casino', () => {
  let s = game();
  s = visit(s, 7, 0).state;
  expect(s.casino).toEqual({ tile: 7, game: 'roulette', chance: 2 });
  s = step(s, { type: 'casino_red', playerId: 'a' }, sequence(0.99, 0, 0, 0.3, 0.6)).state;
  expect(s.players[0]!.cash).toBe(1500000);
  s = visit(s, 7, 0.9).state;
  expect(s.casino!.chance).toBe(4);
  expect(s.casino!.game).toBe('slots');
  s.casinoVisits![7] = 100;
  s = step(s, { type: 'finish', playerId: 'a' }).state;
  s.currentPlayer = 0;
  s = visit(s, 7, 0).state;
  expect(s.casino!.chance).toBe(50);
  s.casinoVisits![22] = 9;
  const before = structuredClone(s);
  const r = step(s, { type: 'casino_black', playerId: 'a' }, sequence(0, 0, 0, 0, 0));
  expect(s).toEqual(before);
  expect(r.state.players[0]!.cash).toBe(1650000);
  expect(r.state.casinoVisits).toEqual({ 7: 0, 22: 9 });
  expect(r.events.find((e) => e.type === 'casino_result')).toMatchObject({
    jackpot: true,
    amount: 150000,
  });
});
it('computes regular roulette and slot wins without charging a stake or stacking jackpot payouts', () => {
  for (const [kind, choice, random, expected] of [
    ['roulette', 'casino_red', [0.99, 0.99, 0, 0.3, 0.6], 1530000],
    ['slots', 'casino_spin', [0.99, 0, 0.1, 0.1, 0.1], 1575000],
    ['slots', 'casino_spin', [0.99, 0, 0.1, 0.1, 0.6], 1530000],
  ] as const) {
    const s = game();
    s.phase = 'casino';
    s.casino = { tile: 7, game: kind, chance: 2 };
    s.casinoVisits = { 7: 1 };
    expect(
      step(s, { type: choice, playerId: 'a' }, sequence(...random)).state.players[0]!.cash,
    ).toBe(expected);
  }
});
it('rejects off-turn casino choices and the wrong minigame action', () => {
  const s = visit(game(), 7, 0).state;
  expect(reduceGame(s, { type: 'casino_red', playerId: 'b' }).error).toBeTruthy();
  expect(reduceGame(s, { type: 'casino_spin', playerId: 'a' }).error).toBeTruthy();
});
it('keeps one insurance token and blocks a hostile purchase without spending buyer cash', () => {
  let s = visit(game(), 8).state;
  s.properties[1]!.ownerId = 'a';
  s = step(s, { type: 'insure', playerId: 'a', tile: 1 }).state;
  s = visit(s, 8).state;
  expect(s.players[0]!.insurance).toEqual({ tile: 1 });
  s.currentPlayer = 1;
  s.players[1]!.position = 1;
  s.phase = 'property';
  const r = step(s, { type: 'buyout', playerId: 'b' });
  expect(r.state.properties[1]!.ownerId).toBe('a');
  expect(r.state.players[1]!.cash).toBe(1500000);
  expect(r.state.players[0]!.insurance).toBeUndefined();
  expect(r.state.phase).toBe('end');
});
it('expropriates only a rival city, or consumes its insurance once', () => {
  for (const insured of [false, true]) {
    const s = game();
    s.properties[10] = { ownerId: 'b', level: 2, championships: 0 };
    card(s, 'chance-20');
    if (insured) s.players[1]!.insurance = { tile: 10 };
    expect(reduceGame(s, { type: 'attack', playerId: 'a', tile: 1 }).error).toBeTruthy();
    const r = step(s, { type: 'attack', playerId: 'a', tile: 10 });
    expect(r.state.properties[10]!.ownerId).toBe(insured ? 'b' : null);
    expect(r.state.properties[10]!.level).toBe(insured ? 2 : 0);
    expect(r.state.players[1]!.insurance).toBeUndefined();
  }
});
it('halves an enemy hotel rent for two owner returns, excluding doubles', () => {
  let s = game();
  s.properties[10] = { ownerId: 'b', level: 4, championships: 0 };
  s.festivals = [];
  s.config = { ...s.config, festivalCount: 0 };
  const normal = getRent(s, 10);
  card(s, 'chance-21');
  s = step(s, { type: 'attack', playerId: 'a', tile: 10 }).state;
  expect(getRent(s, 10)).toBe(Math.floor(normal / 2));
  s = step(s, { type: 'finish', playerId: 'a' }).state;
  expect(s.properties[10]!.roachTurns).toBe(1);
  s.phase = 'end';
  s.extraRoll = true;
  s = step(s, { type: 'finish', playerId: 'b' }).state;
  expect(s.properties[10]!.roachTurns).toBe(1);
  s.phase = 'end';
  s = step(s, { type: 'finish', playerId: 'b' }).state;
  s.phase = 'end';
  s = step(s, { type: 'finish', playerId: 'c' }).state;
  s.phase = 'end';
  s = step(s, { type: 'finish', playerId: 'a' }).state;
  expect(s.properties[10]!.roachTurns).toBeUndefined();
  expect(getRent(s, 10)).toBe(normal);
});
it('retains Squatteur, offers an explicit rent decision and consumes it without paying', () => {
  const s = game();
  hold(s, 'chance-19');
  s.properties[4] = { ownerId: 'b', level: 2, championships: 0 };
  const landed = visit(s, 4).state;
  expect(landed.phase).toBe('rent');
  expect(landed.players[0]!.cash).toBe(1500000);
  expect(reduceGame(landed, { type: 'use_squatter', playerId: 'b' }).error).toBeTruthy();
  const next = step(landed, { type: 'use_squatter', playerId: 'a' }).state;
  expect(next.players[0]!.cash).toBe(1500000);
  expect(next.players[0]!.heldCards).toEqual([]);
  expect(next.discard).toContain('chance-19');
  const paid = step(landed, { type: 'pay_rent', playerId: 'a' }).state;
  expect(paid.players[0]!.cash).toBeLessThan(1500000);
  expect(paid.players[0]!.heldCards).toEqual(['chance-19']);
});
it('buys with fraud at half price, doubles full-price tax and clears the risk at Start', () => {
  const s = game();
  hold(s, 'chance-22');
  s.players[0]!.position = 4;
  s.phase = 'property';
  const bought = step(s, { type: 'buy_fraud', playerId: 'a' }).state;
  expect(bought.players[0]!.cash).toBe(1425000);
  expect(bought.players[0]!.fraudLiability).toBe(300000);
  const taxed = visit(bought, 29).state;
  expect(taxed.players[0]!.cash).toBe(1125000);
  expect(taxed.players[0]!.fraudLiability).toBeUndefined();
  bought.players[0]!.position = 28;
  bought.phase = 'roll';
  const crossed = step(bought, { type: 'roll', playerId: 'a' }, sequence(0, 0.2)).state;
  expect(crossed.players[0]!.fraudLiability).toBeUndefined();
  expect(crossed.players[0]!.cash).toBe(1725000);
});
it('makes Karma reward the last, penalize the leader and ignore ties', () => {
  for (const [cash, want] of [
    [1000000, 1050000],
    [2000000, 1950000],
    [1500000, 1500000],
  ]) {
    const s = game();
    s.players[0]!.cash = cash!;
    expect(visit(s, 23).state.players[0]!.cash).toBe(want);
  }
});
it('lets the debtor select sales until the payable total suffices, otherwise liquidates', () => {
  const s = game();
  s.players[0]!.cash = 10000;
  s.properties[1]!.ownerId = 'a';
  s.properties[2]!.ownerId = 'a';
  s.properties[4] = { ownerId: 'b', level: 3, championships: 0 };
  s.festivals = [];
  s.config = { ...s.config, festivalCount: 0 };
  const landed = visit(s, 4).state;
  expect(landed.phase).toBe('debt');
  expect(getLegalActions(landed).filter((a) => a.type === 'sell')).toHaveLength(2);
  let sold = step(landed, { type: 'sell', playerId: 'a', tile: 1 }).state;
  expect(sold.phase).toBe('debt');
  sold = step(sold, { type: 'sell', playerId: 'a', tile: 2 }).state;
  expect(sold.debt).toBeNull();
  expect(sold.players[0]!.cash).toBe(17500);
  const poor = game();
  poor.players[0]!.cash = 0;
  poor.properties[4] = { ownerId: 'b', level: 4, championships: 0 };
  expect(visit(poor, 4).state.players[0]!.eliminated).toBe(true);
});
it('replays casino randomness consistently from the same seed', () => {
  const s = visit(game(), 7, 0).state;
  const a = { type: 'casino_red', playerId: 'a' } as const;
  expect(reduceGame(s, a, createRng('shared'))).toEqual(reduceGame(s, a, createRng('shared')));
});
