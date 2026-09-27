import type { GameState } from './types.js';

export interface VictoryThreat {
  key: string;
  playerIds: string[];
  missing: number[];
  message: string;
}
/** Public ownership only: no secret objective or hidden capital is revealed. */
export function victoryThreats(state: GameState): VictoryThreat[] {
  if (state.winner) return [];
  const living = state.players.filter((p) => !p.eliminated);
  const collections =
    state.mode === 'teams'
      ? [...new Set(living.map((p) => p.team))].map((team) => living.filter((p) => p.team === team))
      : living.map((p) => [p]);
  const cities = state.config.board.filter((t) => t.type === 'city');
  const groups = [...new Set(cities.map((t) => t.group))].map((group) =>
    cities.filter((t) => t.group === group),
  );
  return collections.flatMap((players) => {
    const ids = players.map((p) => p.id);
    const owns = (id: number) => ids.includes(state.properties[id]?.ownerId ?? '');
    const missing = new Set<number>();
    const completed = groups.filter((group) => group.every((t) => owns(t.id))).length;
    if (completed === state.config.groupsToWin - 1) {
      for (const group of groups) {
        const remaining = group.filter((t) => !owns(t.id));
        if (remaining.length === 1) missing.add(remaining[0]!.id);
      }
    }
    if (state.config.lineVictory !== false) {
      for (const line of new Set(cities.map((t) => t.line))) {
        const properties = state.config.board.filter(
          (t) =>
            t.line === line &&
            (t.type === 'city' || (state.config.version >= 7 && t.type === 'resort')),
        );
        const remaining = properties.filter((t) => !owns(t.id));
        if (properties.length > 1 && remaining.length === 1) missing.add(remaining[0]!.id);
      }
    }
    if (state.config.resortVictory !== false) {
      const resorts = state.config.board.filter((t) => t.type === 'resort');
      const remaining = resorts.filter((t) => !owns(t.id));
      if (resorts.length > 1 && remaining.length === 1) missing.add(remaining[0]!.id);
    }
    if (!missing.size) return [];
    const tiles = [...missing].sort((a, b) => a - b);
    const name =
      state.mode === 'teams'
        ? `L’équipe de ${players.map((p) => p.name).join(' et ')}`
        : players[0]!.name;
    const destinations = tiles.map((id) => state.config.board[id]!.name).join(' ou ');
    return [
      {
        key: ids.join(',') + ':' + tiles.join(','),
        playerIds: ids,
        missing: tiles,
        message: `${name} est à une propriété de la victoire ! ${destinations} peut compléter son monopole.`,
      },
    ];
  });
}
