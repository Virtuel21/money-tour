import type { GameConfig } from './types.js';

/** The archipelago is one collection, just like a complete city street. */
export function monopolyGroups(config: GameConfig) {
  const cities = config.board.filter((tile) => tile.type === 'city');
  const groups = [...new Set(cities.map((tile) => tile.group))].map((group) =>
    cities.filter((tile) => tile.group === group),
  );
  const islands = config.board.filter((tile) => tile.type === 'resort');
  if (islands.length > 0) groups.push(islands);
  return groups;
}
