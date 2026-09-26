import { describe, expect, it } from 'vitest';
import { config } from '../src/index';

describe('published board and economic data', () => {
  it('contains exactly the 28 unique positions and requested board composition', () => {
    expect(config.board.map((tile) => tile.id)).toEqual(Array.from({ length: 28 }, (_, i) => i));
    const count = (type: string) => config.board.filter((tile) => tile.type === type).length;
    expect(count('city')).toBe(14);
    expect(count('resort')).toBe(4);
    expect(count('chance')).toBe(4);
    expect(count('tax')).toBe(2);
    expect([0, 7, 14, 21].map((i) => config.board[i]!.type)).toEqual([
      'start',
      'island',
      'championship',
      'travel',
    ]);
  });

  it('defines seven complete pairs of cities', () => {
    const cities = config.board.filter((tile) => tile.type === 'city');
    const groups = Array.from(
      { length: 7 },
      (_, i) => cities.filter((tile) => tile.group === `g${i + 1}`).length,
    );
    expect(groups).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(
      Array.from({ length: 4 }, (_, line) =>
        cities.filter((tile) => tile.line === line).map((tile) => tile.id),
      ),
    ).toEqual([
      [1, 2, 5, 6],
      [8, 9, 12, 13],
      [15, 16, 19, 20],
      [22, 23],
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

  it('contains one copy of all eighteen configured chance cards', () => {
    expect(config.cards).toHaveLength(18);
    expect(config.cards.map((card) => card.id)).toEqual(
      Array.from({ length: 18 }, (_, i) => `chance-${String(i + 1).padStart(2, '0')}`),
    );
    expect(new Set(config.cards.map((card) => card.title)).size).toBe(18);
  });
});
