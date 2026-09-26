import type { GameEvent, GameState, Rng } from './types.js';
import { randomInt } from './rng.js';

/** A share is a transfer, never newly minted money and never recursively shared. */
export function shareGain(
  state: GameState,
  playerId: string,
  amount: number,
  events: GameEvent[],
): void {
  const deal = state.alliance;
  if (!deal || deal.targetId !== playerId) return;
  const payer = state.players.find((p) => p.id === playerId)!;
  const recipient = state.players.find((p) => p.id === deal.beneficiaryId);
  if (!recipient || recipient.eliminated) return;
  const share = Math.floor(amount / 2);
  if (!share) return;
  payer.cash -= share;
  recipient.cash += share;
  events.push({
    type: 'payment',
    playerId: recipient.id,
    payerId: playerId,
    amount: share,
    reason: 'alliance',
  });
}
export function awardGain(
  state: GameState,
  playerId: string,
  amount: number,
  events: GameEvent[],
  reason?: string,
): void {
  const player = state.players.find((p) => p.id === playerId)!;
  player.cash += amount;
  events.push({ type: 'income', playerId, amount, reason });
  shareGain(state, playerId, amount, events);
}
export function endWorldTurn(state: GameState, leavingId: string, events: GameEvent[]): void {
  if (state.alliance?.targetId === leavingId) {
    delete state.alliance;
    events.push({
      type: 'alliance_expired',
      message: 'L’alliance temporaire est terminée. Chacun retrouve tous ses gains.',
    });
  }
  if (state.crisis) {
    state.crisis.remaining = state.crisis.remaining.filter(
      (id) => id !== leavingId && !state.players.find((p) => p.id === id)?.eliminated,
    );
    if (!state.crisis.remaining.length) {
      delete state.crisis;
      events.push({
        type: 'crisis_expired',
        message: 'La reprise est là ! Tous les loyers retrouvent leur montant habituel.',
      });
    }
  }
}
export function maybeCrisis(state: GameState, rng: Rng, events: GameEvent[]): void {
  if (state.crisis || !state.config.crisisChance) return;
  if (randomInt(rng, 100) >= state.config.crisisChance) return;
  state.crisis = { remaining: state.players.filter((p) => !p.eliminated).map((p) => p.id) };
  events.push({
    type: 'crisis',
    message:
      'Crise économique ! Tous les loyers sont divisés par deux jusqu’à ce que chaque joueur ait terminé son tour.',
  });
}
