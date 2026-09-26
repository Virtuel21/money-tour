import { describe, expect, it } from 'vitest';
import { createGame, getLegalActions, getRent, reduceGame, validateState } from '../src/index';
import { sequence } from './helpers';

const game = (teams = false) =>
  createGame({
    players: Array.from({ length: 4 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      team: i % 2,
    })),
    mode: teams ? 'teams' : 'free-for-all',
    seed: 7,
  });
const draw = (id: string, teams = false) => {
  const s = game(teams);
  s.deck = [id];
  s.discard = s.config.cards.map((c) => c.id).filter((c) => c !== id);
  return s;
};
describe('28-space island edition', () => {
  it.each([0, 1, 4])('automatically transfers rent on an enemy city at level %i', (level) => {
    const s = game();
    s.festivals = [1, 8, 15];
    s.properties[5] = { ownerId: 'p2', level, championships: 0 };
    const rent = getRent(s, 5),
      before = structuredClone(s);
    const result = reduceGame(s, { type: 'roll', playerId: 'p1' }, sequence(0.2, 0.4));
    expect(result.error).toBeUndefined();
    expect(result.state.players[0]!.position).toBe(5);
    expect(result.state.players[0]!.cash).toBe(1500000 - rent);
    expect(result.state.players[1]!.cash).toBe(1500000 + rent);
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: 'payment',
        reason: 'rent',
        payerId: 'p1',
        playerId: 'p2',
        tile: 5,
        amount: rent,
      }),
    );
    expect(s).toEqual(before);
    expect(validateState(result.state)).toEqual([]);
  });
  it('includes festivals and championships, but never charges a teammate', () => {
    const s = game(true);
    s.festivals = [5];
    s.properties[5] = { ownerId: 'p3', level: 2, championships: 2 };
    expect(getRent(s, 5)).toBe(s.config.board[5]!.rents![2]! * 6);
    const result = reduceGame(s, { type: 'roll', playerId: 'p1' }, sequence(0.2, 0.4));
    expect(result.state.players.map((p) => p.cash)).toEqual([1500000, 1500000, 1500000, 1500000]);
  });
  it('collecting all four islands boosts rent and keeps the game running', () => {
    const s = game();
    for (const t of s.config.board.filter((t) => t.type === 'resort'))
      s.properties[t.id]!.ownerId = 'p2';
    expect(getRent(s, 3)).toBe(500000);
    const result = reduceGame(s, { type: 'roll', playerId: 'p1' }, sequence(0, 0.2));
    expect(result.state.players[0]!.cash).toBe(1000000);
    expect(result.state.players[1]!.cash).toBe(2000000);
    expect(result.state.winner).toBeNull();
  });
  it('requires both cities before construction and three complete streets to win', () => {
    const s = game();
    s.players[0]!.position = 1;
    s.phase = 'property';
    s.properties[1]!.ownerId = 'p1';
    expect(getLegalActions(s).some((a) => a.type === 'upgrade')).toBe(false);
    s.properties[2]!.ownerId = 'p1';
    expect(getLegalActions(s).some((a) => a.type === 'upgrade')).toBe(true);
    for (const id of [5, 6, 8, 9]) s.properties[id]!.ownerId = 'p1';
    expect(reduceGame(s, { type: 'finish', playerId: 'p1' }).state.winner?.reasons).toContain(
      'triple_monopoly',
    );
  });
  it('charges a real minimum tax even when no property is owned', () => {
    const s = game();
    s.players[0]!.position = 6;
    const r = reduceGame(s, { type: 'roll', playerId: 'p1' }, sequence(0.2, 0.4));
    expect(r.state.players[0]!.position).toBe(11);
    expect(r.state.players[0]!.cash).toBe(1450000);
  });
  it('steals from the richest opponent, caps at available cash and preserves allies', () => {
    const s = draw('chance-15', true);
    s.players[2]!.cash = 5000000;
    s.players[1]!.cash = 30000;
    s.players[3]!.cash = 20000;
    const r = reduceGame(s, { type: 'roll', playerId: 'p1' }, sequence(0, 0.4, 0));
    expect(r.state.players.map((p) => p.cash)).toEqual([1530000, 0, 5000000, 20000]);
    expect(validateState(r.state)).toEqual([]);
  });
  it('collects a capped levy from each enemy, never from the drawing player or teammate', () => {
    const s = draw('chance-16', true);
    s.players[3]!.cash = 7000;
    const r = reduceGame(s, { type: 'roll', playerId: 'p1' }, sequence(0, 0.4, 0));
    expect(r.state.players.map((p) => p.cash)).toEqual([1557000, 1450000, 1500000, 0]);
    expect(validateState(r.state)).toEqual([]);
  });
  it('rejects an opponent acting during a negative card or debt resolution', () => {
    const s = draw('chance-17');
    s.players[0]!.cash = 1000;
    s.properties[23]!.ownerId = 'p1';
    const r = reduceGame(s, { type: 'roll', playerId: 'p1' }, sequence(0, 0.4, 0));
    expect(r.state.phase).toBe('debt');
    expect(r.state.debt?.playerId).toBe('p1');
    for (const a of [
      { type: 'sell', playerId: 'p2', tile: 23 },
      { type: 'finish', playerId: 'p2' },
      { type: 'buy', playerId: 'p2' },
    ] as const) {
      const illegal = reduceGame(r.state, a);
      expect(illegal.error).toBeTruthy();
      expect(illegal.state).toBe(r.state);
    }
    const paid = reduceGame(r.state, { type: 'sell', playerId: 'p1', tile: 23 });
    expect(paid.error).toBeUndefined();
    expect(paid.state.debt).toBeNull();
    expect(paid.state.players[1]!.cash).toBe(1500000);
  });
});

it('pays exactly one 300k salary on forward arrival at departure and allows only owned cities for Mondial', () => {
  const s = game();
  s.players[0]!.position = 23;
  const arrived = reduceGame(s, { type: 'roll', playerId: 'p1' }, sequence(0.2, 0.4));
  expect(arrived.state.players[0]!.position).toBe(0);
  expect(arrived.state.players[0]!.cash).toBe(1800000);
  expect(arrived.events.filter((e) => e.type === 'start_bonus')).toHaveLength(1);
  const m = game();
  m.phase = 'championship';
  m.players[0]!.position = 14;
  m.properties[1]!.ownerId = 'p1';
  m.properties[3]!.ownerId = 'p1';
  m.properties[5]!.ownerId = 'p2';
  expect(getLegalActions(m).filter((a) => a.type === 'place_championship')).toEqual([
    { type: 'place_championship', playerId: 'p1', tile: 1 },
  ]);
  const rent = getRent(m, 1);
  const boosted = reduceGame(
    m,
    { type: 'place_championship', playerId: 'p1', tile: 1 },
    sequence(0),
  );
  expect(boosted.state.players[0]!.cash).toBe(1500000 - m.config.championshipFee);
  expect(getRent(boosted.state, 1)).toBe(rent * 2);
});
