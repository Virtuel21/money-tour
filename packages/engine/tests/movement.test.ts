import { describe, expect, it } from 'vitest';
import { reduceGame } from '../src/index';
import { game, own, roll, sequence, step } from './helpers';

describe('movement, doubles, and the island', () => {
  it.each([
    [29, 0],
    [30, 1],
  ])('grants one Start bonus from %i to %i', (from, to) => {
    const state = game();
    state.players[0]!.position = from;
    const next = roll(state, 1, 2);
    expect(next.players[0]!.position).toBe(to);
    expect(next.players[0]!.cash).toBe(1_800_000);
    expect(next.players[0]!.laps).toBe(1);
  });

  it('sends the third consecutive double to the island before moving or paying Start', () => {
    const state = game();
    state.players[0]!.position = 30;
    state.consecutiveDoubles = 2;
    const next = roll(state, 2, 2);
    expect(next.players[0]!.position).toBe(8);
    expect(next.players[0]!.islandTurns).toBe(0);
    expect(next.players[0]!.cash).toBe(1_500_000);
    expect(next.players[0]!.laps).toBe(0);
    expect(next.consecutiveDoubles).toBe(0);
    expect(next.extraRoll).toBe(false);
  });

  it('imprisons a player landing on the island even with a double', () => {
    const next = roll(game(), 4, 4);
    expect(next.players[0]!.position).toBe(8);
    expect(next.players[0]!.islandTurns).toBe(0);
    expect(next.extraRoll).toBe(false);
  });

  it('resolves a double landing before offering the additional roll', () => {
    let state = roll(game(), 2, 2);
    expect(state.phase).toBe('property');
    expect(state.extraRoll).toBe(true);
    state = step(state, 'finish');
    if (state.phase === 'end') state = step(state, 'finish');
    expect(state.phase).toBe('roll');
    expect(state.currentPlayer).toBe(0);
    expect(state.consecutiveDoubles).toBe(1);
    state = roll(state, 1, 2, 0);
    expect(state.extraRoll).toBe(false);
  });

  it('pays bail and permits a normal roll without moving the pawn prematurely', () => {
    const state = game();
    state.phase = 'island';
    state.players[0]!.position = 8;
    state.players[0]!.islandTurns = 1;
    const next = step(state, 'pay_bail');
    expect(next.players[0]!.cash).toBe(1_300_000);
    expect(next.players[0]!.islandTurns).toBeNull();
    expect(next.players[0]!.position).toBe(8);
    expect(next.phase).toBe('roll');
  });

  it('does not create optional debt when bail is unaffordable', () => {
    const state = game();
    state.phase = 'island';
    state.players[0]!.islandTurns = 0;
    state.players[0]!.cash = 199_999;
    const result = reduceGame(state, { type: 'pay_bail', playerId: 'p1' }, sequence());
    expect(result.error).toBeTruthy();
    expect(result.state).toBe(state);
    expect(result.state.debt).toBeNull();
  });

  it.each([0, 1])('ends failed island attempt number %i without movement', (failures) => {
    const state = game();
    state.phase = 'island';
    state.players[0]!.position = 8;
    state.players[0]!.islandTurns = failures;
    const next = step(state, 'attempt_escape', {}, sequence(0.1, 0.2));
    expect(next.players[0]!.position).toBe(8);
    expect(next.players[0]!.islandTurns).toBe(failures + 1);
    expect(next.players[0]!.cash).toBe(1_500_000);
    expect(next.extraRoll).toBe(false);
  });

  it('releases the third failed attempt for free and resolves its destination', () => {
    const state = game();
    state.phase = 'island';
    state.players[0]!.position = 8;
    state.players[0]!.islandTurns = 2;
    const next = step(state, 'attempt_escape', {}, sequence(0.1, 0.2));
    expect(next.players[0]!.position).toBe(11);
    expect(next.players[0]!.islandTurns).toBeNull();
    expect(next.players[0]!.cash).toBe(1_500_000);
    expect(next.phase).toBe('property');
    expect(next.extraRoll).toBe(false);
  });

  it('moves on a successful island double without gaining another roll', () => {
    const state = game();
    state.phase = 'island';
    state.players[0]!.position = 8;
    state.players[0]!.islandTurns = 0;
    const next = step(state, 'attempt_escape', {}, sequence(0.1, 0.1));
    expect(next.players[0]!.position).toBe(10);
    expect(next.players[0]!.islandTurns).toBeNull();
    expect(next.extraRoll).toBe(false);
    expect(next.consecutiveDoubles).toBe(0);
  });
});

describe('world travel and championship decisions', () => {
  it('grants a travel right on arrival for a later personal turn', () => {
    const state = game();
    state.players[0]!.position = 21;
    const next = roll(state, 1, 2);
    expect(next.players[0]!.travelPending).toBe(true);
    expect(next.phase).toBe('end');
  });

  it('travels forward through Start, charges the fee once, and replaces the dice', () => {
    const state = game();
    state.phase = 'travel';
    state.players[0]!.position = 24;
    state.players[0]!.travelPending = true;
    const next = step(state, 'travel', { tile: 1 });
    expect(next.players[0]!.position).toBe(1);
    expect(next.players[0]!.cash).toBe(1_750_000);
    expect(next.players[0]!.laps).toBe(1);
    expect(next.players[0]!.travelPending).toBe(false);
    expect(next.phase).toBe('property');
    expect(next.extraRoll).toBe(false);
  });

  it.each([24, -1, 32, 1.5])('refuses invalid travel destination %i atomically', (tile) => {
    const state = game();
    state.phase = 'travel';
    state.players[0]!.position = 24;
    state.players[0]!.travelPending = true;
    const result = reduceGame(state, { type: 'travel', playerId: 'p1', tile }, sequence());
    expect(result.error).toBeTruthy();
    expect(result.state).toBe(state);
  });

  it('refuses travel to an enemy property and allows an allied one without rent', () => {
    const state = game(4, true);
    state.phase = 'travel';
    state.players[0]!.position = 24;
    state.players[0]!.travelPending = true;
    own(state, 25, 'p2');
    own(state, 26, 'p3');
    const invalid = reduceGame(state, { type: 'travel', playerId: 'p1', tile: 25 }, sequence());
    expect(invalid.error).toBeTruthy();
    const next = step(state, 'travel', { tile: 26 });
    expect(next.players[0]!.cash).toBe(1_450_000);
    expect(next.players[2]!.cash).toBe(1_500_000);
  });

  it('declines travel and expires the right before a normal roll', () => {
    const state = game();
    state.phase = 'travel';
    state.players[0]!.travelPending = true;
    const next = step(state, 'decline_travel');
    expect(next.phase).toBe('roll');
    expect(next.players[0]!.travelPending).toBe(false);
    expect(next.players[0]!.cash).toBe(1_500_000);
  });

  it('permits one paid championship on an owned hotel', () => {
    const state = own(game(), 1, 'p1', 4, 2);
    state.phase = 'championship';
    state.players[0]!.position = 16;
    const next = step(state, 'place_championship', { tile: 1 });
    expect(next.properties[1]!.championships).toBe(3);
    expect(next.players[0]!.cash).toBe(1_450_000);
    expect(next.phase).toBe('end');
    expect(
      reduceGame(next, { type: 'place_championship', playerId: 'p1', tile: 1 }, sequence()).error,
    ).toBeTruthy();
  });
});
