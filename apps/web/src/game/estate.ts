import type { GameState, Tile } from '@money-tour/engine';
export function estateGroups(state: GameState, owner: string) {
  const groups = new Map<string, Tile[]>();
  for (const tile of state.config.board) {
    if (state.properties[tile.id]?.ownerId !== owner) continue;
    const key = tile.type === 'city' ? `Rue ${tile.group?.replace(/^g/, '')}` : 'Îles privées';
    groups.set(key, [...(groups.get(key) ?? []), tile]);
  }
  return [...groups].sort(([a], [b]) =>
    a === 'Îles privées'
      ? 1
      : b === 'Îles privées'
        ? -1
        : a.localeCompare(b, 'fr', { numeric: true }),
  );
}
