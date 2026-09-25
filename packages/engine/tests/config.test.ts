import { describe, expect, it } from 'vitest';
import { config } from '../src/index';

describe('published board and economic data', () => {
  it('contains exactly the 32 unique positions and original board composition', () => {
    expect(config.board.map((tile) => tile.id)).toEqual(Array.from({ length: 32 }, (_, i) => i));
    const count = (type: string) => config.board.filter((tile) => tile.type === type).length;
    expect(count('city')).toBe(20);
    expect(count('resort')).toBe(4);
    expect(count('chance')).toBe(3);
    expect(count('tax')).toBe(1);
    expect([0, 8, 16, 24].map((i) => config.board[i]!.type)).toEqual([
      'start',
      'island',
      'championship',
      'travel',
    ]);
  });

  it('defines eight complete groups and four five-city victory lines', () => {
    const cities = config.board.filter((tile) => tile.type === 'city');
    const groups = Array.from(
      { length: 8 },
      (_, i) => cities.filter((tile) => tile.group === `g${i + 1}`).length,
    );
    expect(groups).toEqual([2, 3, 2, 3, 2, 3, 2, 3]);
    expect(
      Array.from({ length: 4 }, (_, line) =>
        cities.filter((tile) => tile.line === line).map((tile) => tile.id),
      ),
    ).toEqual([
      [1, 2, 4, 5, 6],
      [9, 10, 12, 13, 14],
      [17, 18, 20, 21, 22],
      [25, 26, 28, 29, 30],
    ]);
  });

  it('carries the five rent levels and four upgrades on every city', () => {
    for (const city of config.board.filter((tile) => tile.type === 'city')) {
      expect(city.rents).toHaveLength(5);
      expect(city.buildCosts).toHaveLength(5);
      expect(city.rents!.every(Number.isSafeInteger)).toBe(true);
      expect(city.buildCosts!.every(Number.isSafeInteger)).toBe(true);
      expect(city.rents).toEqual([1, 2, 4, 7, 12].map((factor) => (city.price! * factor) / 10));
      expect(city.buildCosts).toEqual([0, ...Array(4).fill(city.price! / 2)]);
    }
  });

  it('contains one copy of all fourteen configured chance cards', () => {
    expect(config.cards).toHaveLength(14);
    expect(config.cards.map((card) => card.id)).toEqual(
      Array.from({ length: 14 }, (_, i) => `chance-${String(i + 1).padStart(2, '0')}`),
    );
    expect(new Set(config.cards.map((card) => card.title)).size).toBe(14);
  });
});
