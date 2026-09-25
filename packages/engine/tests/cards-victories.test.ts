import { describe, expect, it } from 'vitest';
import { getLegalActions, getRent, reduceGame, validateState } from '../src/index';
import { game, offer, own, roll, sequence, step, type State } from './helpers';

function card(state: State, id: number): State {
  const name = `chance-${String(id).padStart(2, '0')}`;
  state.deck = [name];
  state.discard = state.config.cards.map((item) => item.id).filter((item) => item !== name);
  return roll(state, 1, 6, 0.5);
}

describe('every Chance card and the deck lifecycle', () => {
  it.each([
    [1, 200000],
    [2, 100000],
    [3, 150000],
    [4, -100000],
    [5, -150000],
    [6, -200000],
  ])('resolves cash card %i', (id, delta) => {
    const state = card(game(), id!);
    expect(state.players[0]!.cash).toBe(1500000 + delta!);
    expect(state.phase).toBe('end');
    expect(validateState(state)).toEqual([]);
  });
  it.each([
    [7, 0, 'end'],
    [8, 8, 'end'],
    [9, 10, 'property'],
    [10, 4, 'property'],
    [11, 16, 'championship'],
    [12, 24, 'end'],
  ] as const)('resolves movement card %i', (id, position, phase) => {
    const state = card(game(), id);
    expect(state.players[0]!.position).toBe(position);
    expect(state.phase).toBe(phase);
    expect(state.players[0]!.cash).toBe(id === 7 ? 1800000 : 1500000);
    expect(state.players[0]!.travelPending).toBe(id === 12);
    expect(state.players[0]!.islandTurns).toBe(id === 8 ? 0 : null);
  });
  it('keeps the exit card out of circulation until used', () => {
    let state = card(game(), 13);
    expect(state.players[0]!.escapeCards).toEqual(['chance-13']);
    expect(state.deck).not.toContain('chance-13');
    expect(state.discard).not.toContain('chance-13');
    state.phase = 'island';
    state.players[0]!.islandTurns = 1;
    state = step(state, 'use_escape');
    expect(state.players[0]!.escapeCards).toEqual([]);
    expect(state.discard).toContain('chance-13');
    expect(state.phase).toBe('roll');
    expect(validateState(state)).toEqual([]);
  });
  it('reshuffles discards without duplicating or losing cards', () => {
    const state = game();
    state.discard = [...state.deck];
    state.deck = [];
    const next = roll(state, 1, 6, 0);
    expect(next.lastCard).toBe('chance-01');
    expect(next.deck).toHaveLength(13);
    expect(next.discard).toEqual(['chance-01']);
    expect(validateState(next)).toEqual([]);
  });
  it('downgrades the strongest enemy building, excludes hotels and allies', () => {
    const state = own(
      own(own(own(game(4, true), 1, 'p2', 4), 2, 'p3', 3), 9, 'p2', 2),
      10,
      'p4',
      2,
    );
    const next = card(state, 14);
    expect(next.properties[1]!.level).toBe(4);
    expect(next.properties[2]!.level).toBe(3);
    expect(next.properties[9]!.level).toBe(2);
    expect(next.properties[10]!.level).toBe(1);
  });
  it('keeps a downgrade with no eligible city harmless', () => {
    expect(card(game(), 14).phase).toBe('end');
  });
  it('lets a Chance loss create debt and settles it through a sale', () => {
    const state = own(game(), 30);
    state.players[0]!.cash = 0;
    let next = card(state, 4);
    expect(next.phase).toBe('debt');
    next = step(next, 'sell', { tile: 30 });
    expect(next.phase).toBe('end');
    expect(next.players[0]!.cash).toBe(140000);
  });
  it('resolves property rent after a movement card', () => {
    const state = own(game(), 10, 'p2');
    state.festivals = [];
    expect(card(state, 9).players[0]!.cash).toBe(1478000);
  });
});

describe('every victory condition', () => {
  it.each([
    { tiles: [1, 2, 4, 5], last: 6, reason: 'line' },
    { tiles: [1, 2, 9, 10, 17], last: 18, reason: 'triple_monopoly' },
    { tiles: [3, 11, 19], last: 27, reason: 'resort_monopoly' },
  ])('ends immediately on $reason and refuses all later actions', ({ tiles, last, reason }) => {
    const state = game();
    for (const tile of tiles) own(state, tile);
    let next = offer(state, last);
    expect(step(next, 'tick', { elapsedMs: 0 }).winner).toBeNull();
    next = step(next, 'buy');
    expect(next.winner?.playerIds).toEqual(['p1']);
    expect(next.winner?.reasons).toContain(reason);
    expect(next.phase).toBe('finished');
    expect(getLegalActions(next)).toEqual([]);
    expect(reduceGame(next, { type: 'roll', playerId: 'p1' }, sequence()).state).toBe(next);
  });
  it('aggregates team ownership, including an eliminated teammate in the winning team', () => {
    const state = game(4, true);
    for (const tile of [1, 2, 4, 5]) own(state, tile, tile % 2 ? 'p1' : 'p3');
    const next = step(offer(state, 6), 'buy');
    expect(next.winner?.playerIds).toEqual(['p1', 'p3']);
    expect(next.winner?.teamIds).toEqual([0]);
    expect(next.winner?.reasons).toContain('line');
  });
  it('awards bankruptcy victory only after both opposing teammates are eliminated', () => {
    let state = step(game(4, true), 'quit', { playerId: 'p2' });
    expect(state.winner).toBeNull();
    state = step(state, 'quit', { playerId: 'p4' });
    expect(state.winner?.playerIds).toEqual(['p1', 'p3']);
    expect(state.winner?.reasons).toContain('bankruptcy');
  });
  it('uses property value plus cash at the time limit', () => {
    const state = own(game(), 1, 'p2', 4, 7);
    const next = step(state, 'tick', { elapsedMs: state.durationMs });
    expect(next.winner?.playerIds).toEqual(['p2']);
    expect(next.winner?.netWorth).toBe(1800000);
    expect(next.winner?.reasons).toEqual(['timeout']);
  });
  it('shares a perfect timeout tie rather than picking the first seat', () => {
    const state = game(4, true);
    const next = step(state, 'tick', { elapsedMs: state.durationMs });
    expect(next.winner?.teamIds).toEqual([0, 1]);
    expect(next.winner?.playerIds).toHaveLength(4);
  });
  it('releases an abandoned estate and retained cards without granting them to an opponent', () => {
    let state = own(card(game(3), 13), 1);
    state = step(state, 'quit');
    expect(state.players[0]!.eliminated).toBe(true);
    expect(state.players[0]!.abandoned).toBe(true);
    expect(state.properties[1]!.ownerId).toBeNull();
    expect(state.discard).toContain('chance-13');
    expect(state.currentPlayer).toBe(1);
    expect(state.winner).toBeNull();
    expect(validateState(state)).toEqual([]);
  });
  it('places exactly one paid championship, with an additive rent multiplier', () => {
    let state = own(game(), 1, 'p1', 0, 1);
    state.phase = 'championship';
    state.festivals = [];
    state = step(state, 'place_championship', { tile: 1 });
    expect(getRent(state, 1)).toBe(30000);
    expect(state.players[0]!.cash).toBe(1450000);
    expect(state.phase).toBe('end');
    expect(
      reduceGame(state, { type: 'place_championship', playerId: 'p1', tile: 1 }).error,
    ).toBeTruthy();
  });
});
