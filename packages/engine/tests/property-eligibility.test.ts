import { describe, expect, it } from 'vitest';
import {
  config,
  createGame,
  getBuyoutQuote,
  getLegalActions,
  getPurchaseQuote,
  getRent,
  reduceGame,
  validateState,
  type GameAction,
  type GameState,
} from '../src/index';

const properties = config.board.filter((t) => t.type === 'city' || t.type === 'resort');
function game() {
  const state = createGame({
    config: { ...config, shuffleStreets: false, adventures: false, festivalCount: 0 },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
    seed: 'eligibility',
  });
  state.players.forEach((p) => (p.cash = 100000));
  return state;
}
function apply(s: GameState, a: GameAction) {
  const r = reduceGame(s, a);
  expect(r.error).toBeUndefined();
  expect(validateState(r.state)).toEqual([]);
  return r;
}
function hold(s: GameState, id: string) {
  s.deck = s.deck.filter((c) => c !== id);
  s.discard = s.discard.filter((c) => c !== id);
  s.players[0]!.heldCards = [id];
}
describe.each(properties)('$name ($type)', (tile) => {
  it('can be bought out, including an existing hotel, with the correct seller payment', () => {
    for (const level of tile.type === 'city' ? [0, 2, 4] : [0]) {
      const s = game();
      s.phase = 'property';
      s.players[0]!.position = tile.id;
      s.properties[tile.id] = { ownerId: 'b', level, championships: 1, championshipTurns: 4 };
      const quote = getBuyoutQuote(s)!;
      expect(quote.canBuy).toBe(true);
      expect(getLegalActions(s)).toContainEqual({ type: 'buyout', playerId: 'a' });
      const r = apply(s, { type: 'buyout', playerId: 'a' });
      expect(r.state.properties[tile.id]).toMatchObject({
        ownerId: 'a',
        level,
        championships: 1,
        championshipTurns: 4,
      });
      expect(r.state.players[0]!.cash).toBe(s.players[0]!.cash - quote.total);
      expect(r.state.players[1]!.cash).toBe(s.players[1]!.cash + quote.land);
    }
  });
  it('can host a festival, receive doubled rent and renew without stacking', () => {
    let s = game();
    s.properties[tile.id]!.ownerId = 'a';
    s.phase = 'championship';
    const rent = getRent(s, tile.id);
    expect(getLegalActions(s)).toContainEqual({
      type: 'place_championship',
      playerId: 'a',
      tile: tile.id,
    });
    s = apply(s, { type: 'place_championship', playerId: 'a', tile: tile.id }).state;
    expect(getRent(s, tile.id)).toBe(rent * 2);
    expect(s.properties[tile.id]!.championshipTurns).toBe(4);
    s.phase = 'championship';
    s.properties[tile.id]!.championshipTurns = 1;
    s = apply(s, { type: 'place_championship', playerId: 'a', tile: tile.id }).state;
    expect(getRent(s, tile.id)).toBe(rent * 2);
    expect(s.properties[tile.id]!.championshipTurns).toBe(4);
    for (let turn = 0; turn < 4; turn++) {
      s.phase = 'end';
      s = apply(s, { type: 'finish', playerId: 'a' }).state;
      s.phase = 'end';
      s = apply(s, { type: 'finish', playerId: 'b' }).state;
    }
    expect(s.properties[tile.id]!.championships).toBe(0);
    expect(getRent(s, tile.id)).toBe(rent);
  });
  it('can be insured and blocks one hostile buyout without debiting the buyer', () => {
    let s = game();
    s.phase = 'end';
    s.properties[tile.id]!.ownerId = 'a';
    s.players[0]!.insurance = { tile: null };
    s = apply(s, { type: 'insure', playerId: 'a', tile: tile.id }).state;
    expect(s.players[0]!.insurance).toEqual({ tile: tile.id });
    s.currentPlayer = 1;
    s.phase = 'property';
    s.players[1]!.position = tile.id;
    const blocked = apply(s, { type: 'buyout', playerId: 'b' }).state;
    expect(blocked.players[1]!.cash).toBe(s.players[1]!.cash);
    expect(blocked.properties[tile.id]!.ownerId).toBe('a');
    expect(blocked.players[0]!.insurance).toBeUndefined();
    blocked.phase = 'property';
    expect(
      apply(blocked, { type: 'buyout', playerId: 'b' }).state.properties[tile.id]!.ownerId,
    ).toBe('b');
  });
  it('supports fraud purchases and expropriation, including insurance protection', () => {
    const s = game();
    s.phase = 'property';
    s.players[0]!.position = tile.id;
    hold(s, 'chance-22');
    expect(getLegalActions(s)).toContainEqual({ type: 'buy_fraud', playerId: 'a' });
    expect(getPurchaseQuote(s, 0, true)!.land).toBe(Math.floor(tile.price! * 0.5));
    expect(apply(s, { type: 'buy_fraud', playerId: 'a' }).state.properties[tile.id]!.ownerId).toBe(
      'a',
    );
    for (const insured of [false, true]) {
      const target = game();
      target.properties[tile.id]!.ownerId = 'b';
      target.phase = 'attack';
      target.pendingAttack = 'chance-20';
      target.deck = target.deck.filter((c) => c !== 'chance-20');
      target.discard.push('chance-20');
      if (insured) target.players[1]!.insurance = { tile: tile.id };
      const r = apply(target, { type: 'attack', playerId: 'a', tile: tile.id });
      expect(r.state.properties[tile.id]!.ownerId).toBe(insured ? 'b' : null);
      expect(r.state.players[1]!.insurance).toBeUndefined();
    }
  });
});
it('applies random festival and crisis multipliers to island rents', () => {
  const s = game(),
    id = properties.find((t) => t.type === 'resort')!.id;
  s.properties[id]!.ownerId = 'a';
  const base = getRent(s, id);
  s.config.festivalCount = 1;
  s.festivals = [id];
  expect(validateState(s)).toEqual([]);
  expect(getRent(s, id)).toBe(base * s.config.festivalMultiplier);
  s.crisis = { remaining: ['a', 'b'] };
  expect(getRent(s, id)).toBe(Math.floor(base * s.config.festivalMultiplier * 0.5));
});
it('still rejects an unaffordable buyout and buying out your own property', () => {
  for (const tile of properties) {
    const s = game();
    s.phase = 'property';
    s.players[0]!.position = tile.id;
    s.properties[tile.id]!.ownerId = 'b';
    s.players[0]!.cash = 0;
    expect(reduceGame(s, { type: 'buyout', playerId: 'a' }).error).toBeTruthy();
    s.players[0]!.cash = 100000;
    s.properties[tile.id]!.ownerId = 'a';
    expect(reduceGame(s, { type: 'buyout', playerId: 'a' }).error).toBeTruthy();
  }
});
