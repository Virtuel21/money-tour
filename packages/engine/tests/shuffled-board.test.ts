import { expect, it } from 'vitest';
import { config, createGame, reduceGame, sameRules, validateState } from '../src/index';
import { sequence } from './helpers';
const options = {
  players: [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ],
};

it('reproduces each layout from the seed and varies complete streets across games', () => {
  const layouts = new Set<string>();
  for (let seed = 0; seed < 40; seed++) {
    const state = createGame({ ...options, seed });
    expect(createGame({ ...options, seed })).toEqual(state);
    expect(sameRules(state.config, config)).toBe(true);
    expect(validateState(state)).toEqual([]);
    const board = state.config.board;
    const cities = board.filter((t) => t.type === 'city');
    const reference = config.board.filter((t) => t.type === 'city');
    expect(cities.map((t) => t.price)).toEqual(
      [...cities.map((t) => t.price!)].sort((a, b) => a - b),
    );
    expect(cities.map((t) => [t.price, t.rents, t.buildCosts])).toEqual(
      reference.map((t) => [t.price, t.rents, t.buildCosts]),
    );
    expect(board.filter((t) => t.type === 'chance')).toHaveLength(2);
    expect(board.filter((t) => t.type === 'tax').map((t) => t.id)).toEqual([31]);
    expect([0, 8, 16, 24].map((i) => board[i]!.type)).toEqual([
      'start',
      'island',
      'championship',
      'travel',
    ]);
    for (const start of [1, 5, 9, 13, 17, 21, 25, 29])
      expect(board[start]!.group).toBe(board[start + 1]!.group);
    layouts.add(board.map((t) => t.name).join('|'));
  }
  expect(layouts.size).toBeGreaterThan(35);
});
it('rejects corrupted shuffled saves without allowing economic changes or split streets', () => {
  const state = createGame({ ...options, seed: 11 });
  const changed = structuredClone(state.config);
  changed.board[1]!.price! += 100;
  expect(sameRules(changed, config)).toBe(false);
  const misplaced = structuredClone(state.config);
  [misplaced.board[1]!.rents, misplaced.board[5]!.rents] = [
    misplaced.board[5]!.rents,
    misplaced.board[1]!.rents,
  ];
  expect(sameRules(misplaced, config)).toBe(false);
  const split = structuredClone(state.config);
  [split.board[1], split.board[4]] = [
    { ...split.board[4]!, id: 1 },
    { ...split.board[1]!, id: 4 },
  ];
  expect(sameRules(split, config)).toBe(false);
  const altered = structuredClone(state.config);
  altered.startBonus++;
  expect(sameRules(altered, config)).toBe(false);
});
it('pays salary once across the new 32-space boundary and charges the fixed tax', () => {
  const state = createGame({ ...options, config: { ...config, adventures: false }, seed: 42 });
  state.players[0]!.position = 30;
  const salary = reduceGame(state, { type: 'roll', playerId: 'a' }, sequence(0, 0.2));
  expect(salary.state.players[0]!.position).toBe(1);
  expect(salary.state.players[0]!.cash).toBe(1800);
  expect(salary.events.filter((e) => e.type === 'start_bonus')).toHaveLength(1);
  state.players[0]!.position = 29;
  const tax = reduceGame(state, { type: 'roll', playerId: 'a' }, sequence(0, 0));
  expect(tax.state.players[0]!.position).toBe(31);
  expect(tax.state.players[0]!.cash).toBe(1450);
});
