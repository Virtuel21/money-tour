import type { GameEvent, GameState, Rng } from './types.js';
import { randomInt } from './rng.js';
import { protectProperty } from './expansion.js';

/** One check per new table round. First choose a player, then one of their buildings. */
export function maybeEarthquake(state: GameState, rng: Rng, events: GameEvent[]): void {
  const config = state.config;
  if (!config.earthquakeChance || state.crisis) return;
  const round = state.adventure?.round ?? Math.floor((state.turn - 1) / state.players.length) + 1;
  if (
    round < (config.earthquakeMinRound ?? 4) ||
    (state.earthquakeHistory?.count ?? 0) >= (config.earthquakeMaxCount ?? 2) ||
    (state.earthquakeHistory &&
      round - state.earthquakeHistory.lastRound < (config.earthquakeCooldownRounds ?? 6))
  )
    return;
  const owners = state.players.filter(
    (p) =>
      !p.eliminated &&
      Object.values(state.properties).some(
        (property) => property.ownerId === p.id && property.level > 0,
      ),
  );
  // Empty boards and legacy games must not consume any additional random numbers.
  if (!owners.length || randomInt(rng, 100) >= config.earthquakeChance) return;
  const owner = owners[randomInt(rng, owners.length)]!;
  const tiles = config.board.filter(
    (tile) =>
      tile.type === 'city' &&
      state.properties[tile.id]?.ownerId === owner.id &&
      state.properties[tile.id]!.level > 0,
  );
  const tile = tiles[randomInt(rng, tiles.length)]!;
  const property = state.properties[tile.id]!;
  const fromLevel = property.level;
  const blocked = owner.insurance?.tile === tile.id;
  events.push({
    type: 'earthquake',
    playerId: owner.id,
    tile: tile.id,
    fromLevel,
    level: blocked ? fromLevel : fromLevel - 1,
    blocked,
    message: `Tremblement de terre à ${tile.name} ! ${owner.name} : ${blocked ? 'l’assurance protège le bâtiment et est consommée.' : fromLevel === 4 ? 'l’hôtel redevient trois maisons.' : 'une maison est détruite.'}`,
  });
  if (!protectProperty(state, tile.id, events)) {
    property.level--;
    delete property.roachTurns;
  }
  state.earthquakeHistory = { count: (state.earthquakeHistory?.count ?? 0) + 1, lastRound: round };
}
