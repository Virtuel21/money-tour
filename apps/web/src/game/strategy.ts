import {
  getNetWorth,
  getRent,
  monopolyGroups,
  type GameState,
  type Tile,
} from '@money-tour/engine';

export function collectionLabel(tile: Tile) {
  return tile.type === 'resort' ? 'Îles privées' : `Rue ${tile.group?.replace(/^g/, '') ?? '—'}`;
}

export interface CollectionProgress {
  key: string;
  label: string;
  tiles: Tile[];
  owned: number;
  missing: { tile: Tile; owner: string }[];
  complete: boolean;
}

/** Public holdings only. Secret quests and capital rewards are deliberately never read. */
export function publicVictoryProgress(state: GameState, playerId: string) {
  const player = state.players.find((p) => p.id === playerId);
  const members = player
    ? state.players.filter(
        (p) =>
          !p.eliminated && (state.mode === 'teams' ? p.team === player.team : p.id === playerId),
      )
    : [];
  const ids = new Set(members.map((p) => p.id));
  const owns = (tile: Tile) => ids.has(state.properties[tile.id]?.ownerId ?? '');
  const describe = (tiles: Tile[], key: string, label: string): CollectionProgress => {
    const missing = tiles
      .filter((t) => !owns(t))
      .map((tile) => ({
        tile,
        owner:
          state.players.find((p) => p.id === state.properties[tile.id]?.ownerId)?.name ??
          'Disponible',
      }));
    return {
      key,
      label,
      tiles,
      missing,
      owned: tiles.length - missing.length,
      complete: tiles.length > 0 && !missing.length,
    };
  };
  const groups = monopolyGroups(state.config).map((tiles, index) =>
    describe(tiles, `group-${index}`, collectionLabel(tiles[0]!)),
  );
  const cities = state.config.board.filter((t) => t.type === 'city');
  const lines =
    state.config.lineVictory === false
      ? []
      : [...new Set(cities.map((t) => t.line))].map((line, index) =>
          describe(
            state.config.board.filter(
              (t) =>
                t.line === line &&
                (t.type === 'city' || (state.config.version >= 7 && t.type === 'resort')),
            ),
            `line-${index}`,
            `Côté ${index + 1}`,
          ),
        );
  const islands = groups.find((group) => group.tiles[0]?.type === 'resort');
  const opposingSides = new Set(
    state.players
      .filter((p) => !p.eliminated && !ids.has(p.id))
      .map((p) => (state.mode === 'teams' ? p.team : p.id)),
  ).size;
  return {
    members,
    eliminated: !members.length,
    groups,
    lines,
    islands,
    islandVictory: state.config.resortVictory !== false,
    completed: groups.filter((g) => g.complete).length,
    target: state.config.groupsToWin,
    cash: members.reduce((sum, p) => sum + p.cash, 0),
    netWorth: members.reduce((sum, p) => sum + getNetWorth(state, p.id), 0),
    opposingSides,
  };
}

export function propertyRentInsight(state: GameState, tileId: number) {
  const tile = state.config.board.find((t) => t.id === tileId);
  if (!tile || (tile.type !== 'city' && tile.type !== 'resort')) return null;
  const property = state.properties[tileId];
  const owner = state.players.find((p) => p.id === property?.ownerId);
  const islandCount = owner
    ? state.config.board.filter(
        (t) => t.type === 'resort' && state.properties[t.id]?.ownerId === owner.id,
      ).length
    : 1;
  const base =
    tile.type === 'resort'
      ? (state.config.resortRents[islandCount - 1] ?? 0)
      : (tile.rents?.[property?.level ?? 0] ?? 0);
  const modifiers: { label: string; factor: number }[] = [];
  if (state.festivals.includes(tileId))
    modifiers.push({ label: 'Festival permanent', factor: state.config.festivalMultiplier });
  if (property?.championships)
    modifiers.push({
      label: `Festival temporaire${property.championshipTurns ? ` · ${property.championshipTurns} tours du propriétaire` : ''}`,
      factor: 1 + property.championships,
    });
  const twins = state.adventure?.twinTiles;
  if (
    owner &&
    twins?.length === 2 &&
    twins.includes(tileId) &&
    twins.every((id) => state.properties[id]?.ownerId === owner.id)
  )
    modifiers.push({ label: 'Villes jumelles', factor: 2 });
  if (property?.roachTurns)
    modifiers.push({
      label: `Cafards · ${property.roachTurns} tours du propriétaire`,
      factor: 0.5,
    });
  if (state.crisis) modifiers.push({ label: 'Crise économique', factor: 0.5 });
  return {
    owner,
    base,
    modifiers,
    rent: owner
      ? getRent(state, tileId)
      : Math.floor(modifiers.reduce((amount, m) => amount * m.factor, base)),
    islandCount,
  };
}
