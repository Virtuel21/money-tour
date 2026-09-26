import { awardGain } from './world-events.js';
import type { GameState, GameEvent, Player, Rng } from './types.js';
import { randomInt } from './rng.js';

export function heldCard(state: GameState, player: Player, effect: string): string | undefined {
  return player.heldCards?.find(
    (id) => state.config.cards.find((c) => c.id === id)?.effect === effect,
  );
}
export function consumeCard(state: GameState, player: Player, effect: string): void {
  const id = heldCard(state, player, effect);
  if (!id) return;
  player.heldCards = player.heldCards!.filter((c) => c !== id);
  state.discard.push(id);
}
export function protectProperty(state: GameState, tile: number, events: GameEvent[]): boolean {
  const player = state.players.find((p) => p.id === state.properties[tile]?.ownerId);
  if (player?.insurance?.tile !== tile) return false;
  delete player.insurance;
  events.push({
    type: 'insured',
    playerId: player.id,
    tile,
    message: 'Votre assurance bloque cette attaque. Le jeton est consommé.',
  });
  return true;
}
export function clearProtection(state: GameState, tile: number): void {
  for (const player of state.players)
    if (player.insurance?.tile === tile) player.insurance.tile = null;
}
export function casinoPlay(state: GameState, choice: string, rng: Rng, events: GameEvent[]): void {
  const player = state.players[state.currentPlayer]!;
  const casino = state.casino!;
  const jackpot = randomInt(rng, 10000) < casino.chance * 100;
  const color = randomInt(rng, 2) ? 'red' : 'black';
  const reels = Array.from({ length: 3 }, () => randomInt(rng, 4));
  const win = casino.game === 'roulette' ? choice === 'casino_' + color : new Set(reels).size < 3;
  const rate = jackpot
    ? 0.1
    : win
      ? casino.game === 'slots' && new Set(reels).size === 1
        ? 0.05
        : 0.02
      : 0;
  const amount = Math.floor(player.cash * rate);
  if (jackpot) state.casinoVisits![casino.tile] = 0;
  events.push({
    type: 'casino_result',
    playerId: player.id,
    tile: casino.tile,
    game: casino.game,
    jackpot,
    color,
    reels,
    amount,
    chance: casino.chance,
  });
  if (amount) awardGain(state, player.id, amount, events, jackpot ? 'jackpot' : 'casino');
  delete state.casino;
  state.phase = 'end';
}
