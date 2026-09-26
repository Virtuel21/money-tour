import { auctionActor } from './adventure.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomInt } from './rng.js';
import { shareGain } from './world-events.js';
import type { DuelChoice, GameAction, GameEvent, GameState, Rng } from './types.js';

export const duelChoices: DuelChoice[] = ['rock', 'paper', 'scissors'];
const player = (state: GameState, id: string) => state.players.find((p) => p.id === id)!;
export function duelCommitment(
  id: string,
  playerId: string,
  choice: DuelChoice,
  salt: string,
): string {
  return Array.from(
    sha256(new TextEncoder().encode(JSON.stringify([id, playerId, choice, salt]))),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
export function duelParticipants(state: GameState): string[] {
  return state.duel?.targetId ? [state.duel.challengerId, state.duel.targetId] : [];
}
export function getDecisionPlayerId(state: GameState): string {
  if (state.auction) return auctionActor(state) ?? state.players[state.currentPlayer]!.id;
  const d = state.duel;
  if (!d) return state.players[state.currentPlayer]!.id;
  if (d.stage === 'accept') return d.targetId!;
  if (d.stage === 'offer') return d.challengerId;
  const humans = duelParticipants(state).filter((id) => !player(state, id).bot);
  return (
    humans.find((id) => (d.stage === 'commit' ? !d.commitments[id] : !d.reveals[id])) ??
    d.challengerId
  );
}
export function duelTargets(state: GameState): string[] {
  const me = state.players[state.currentPlayer]!;
  return state.players
    .filter(
      (p) =>
        !p.eliminated &&
        p.id !== me.id &&
        p.cash > 0 &&
        (state.mode !== 'teams' || p.team !== me.team),
    )
    .map((p) => p.id);
}
export function duelActions(state: GameState): GameAction[] {
  const d = state.duel;
  if (!d || state.phase !== 'duel') return [];
  const playerId = getDecisionPlayerId(state);
  if (d.stage === 'offer')
    return [
      ...duelTargets(state)
        .map((targetId): GameAction => ({
          type: 'duel_offer',
          playerId,
          targetId,
          amount: Math.min(10000, player(state, playerId).cash, player(state, targetId).cash),
        }))
        .filter((a) => 'amount' in a && a.amount > 0),
      { type: 'duel_cancel', playerId },
    ];
  if (d.stage === 'accept')
    return [
      { type: 'duel_accept', playerId },
      { type: 'duel_decline', playerId },
    ];
  if (duelParticipants(state).every((id) => player(state, id).bot))
    return [{ type: 'duel_bot', playerId }];
  if (d.stage === 'commit') return [{ type: 'duel_commit', playerId, hash: '0'.repeat(64) }];
  return [{ type: 'duel_reveal', playerId, choice: 'rock', salt: '0'.repeat(32) }];
}
export function isLegalDuelAction(state: GameState, action: GameAction): boolean {
  const d = state.duel;
  if (!d || state.phase !== 'duel' || !('playerId' in action)) return false;
  if (action.type === 'duel_cancel') return [d.challengerId, d.targetId].includes(action.playerId);
  if (action.playerId !== getDecisionPlayerId(state)) return false;
  if (action.type === 'duel_offer')
    return (
      d.stage === 'offer' &&
      duelTargets(state).includes(action.targetId) &&
      Number.isSafeInteger(action.amount) &&
      action.amount > 0 &&
      action.amount <=
        Math.min(player(state, action.playerId).cash, player(state, action.targetId).cash)
    );
  if (action.type === 'duel_accept')
    return (
      d.stage === 'accept' &&
      duelParticipants(state).every((id) => player(state, id).cash >= d.amount)
    );
  if (action.type === 'duel_decline') return d.stage === 'accept';
  if (action.type === 'duel_bot')
    return d.stage === 'commit' && duelParticipants(state).every((id) => player(state, id).bot);
  if (action.type === 'duel_commit')
    return (
      d.stage === 'commit' &&
      !player(state, action.playerId).bot &&
      !d.commitments[action.playerId] &&
      /^[a-f0-9]{64}$/.test(action.hash)
    );
  if (action.type === 'duel_reveal')
    return (
      d.stage === 'reveal' &&
      !d.reveals[action.playerId] &&
      duelChoices.includes(action.choice) &&
      /^[a-f0-9]{32,64}$/.test(action.salt) &&
      duelCommitment(d.id, action.playerId, action.choice, action.salt) ===
        d.commitments[action.playerId]
    );
  return false;
}
export function cancelDuel(state: GameState, events: GameEvent[], forfeitId?: string): void {
  const d = state.duel;
  if (!d) return;
  if (d.escrow && forfeitId && duelParticipants(state).includes(forfeitId)) {
    const winnerId = duelParticipants(state).find((id) => id !== forfeitId)!;
    player(state, winnerId).cash += d.amount * 2;
    events.push({
      type: 'duel_forfeit',
      playerId: winnerId,
      message: `${player(state, forfeitId).name} abandonne le duel. ${player(state, winnerId).name} remporte le pot.`,
    });
    events.push({ type: 'income', playerId: winnerId, amount: d.amount * 2, reason: 'duel_prize' });
    shareGain(state, winnerId, d.amount, events);
    delete state.duel;
    state.phase = 'end';
    return;
  }
  if (d.escrow)
    for (const id of duelParticipants(state)) {
      player(state, id).cash += d.amount;
      events.push({ type: 'income', playerId: id, amount: d.amount, reason: 'duel_refund' });
    }
  delete state.duel;
  state.phase = 'end';
  events.push({
    type: 'duel_cancelled',
    message: 'Duel annulé. Les mises éventuelles sont remboursées.',
  });
}
function finishDuel(state: GameState, rng: Rng, events: GameEvent[]): void {
  const d = state.duel!;
  const ids = duelParticipants(state);
  const choices = ids.map((id) =>
    player(state, id).bot ? duelChoices[randomInt(rng, 3)]! : d.reveals[id]!.choice,
  );
  const [a, b] = choices.map((c) => duelChoices.indexOf(c));
  const winnerId = a === b ? null : ids[(a! - b! + 3) % 3 === 1 ? 0 : 1]!;
  events.push({
    type: 'duel_result',
    playerId: winnerId ?? undefined,
    challengerId: ids[0],
    targetId: ids[1],
    choices,
    amount: d.amount * 2,
    message: winnerId
      ? `${player(state, winnerId).name} remporte le duel !`
      : 'Égalité ! Chacun récupère sa mise.',
  });
  if (winnerId) {
    player(state, winnerId).cash += d.amount * 2;
    events.push({ type: 'income', playerId: winnerId, amount: d.amount * 2, reason: 'duel_prize' });
    shareGain(state, winnerId, d.amount, events);
  } else
    for (const id of ids) {
      player(state, id).cash += d.amount;
      events.push({ type: 'income', playerId: id, amount: d.amount, reason: 'duel_refund' });
    }
  delete state.duel;
  state.phase = 'end';
}
export function applyDuelAction(
  state: GameState,
  action: GameAction,
  rng: Rng,
  events: GameEvent[],
): void {
  const d = state.duel!;
  if (action.type === 'duel_offer') {
    d.targetId = action.targetId;
    d.amount = action.amount;
    d.stage = 'accept';
    events.push({
      type: 'duel_offer',
      playerId: action.playerId,
      targetId: action.targetId,
      amount: action.amount,
    });
  } else if (action.type === 'duel_accept') {
    for (const id of duelParticipants(state)) {
      player(state, id).cash -= d.amount;
      events.push({ type: 'payment', payerId: id, amount: d.amount, reason: 'duel_stake' });
    }
    d.escrow = true;
    d.stage = 'commit';
  } else if (action.type === 'duel_decline' || action.type === 'duel_cancel')
    cancelDuel(state, events, action.playerId);
  else if (action.type === 'duel_commit') {
    d.commitments[action.playerId] = action.hash;
    if (
      duelParticipants(state)
        .filter((id) => !player(state, id).bot)
        .every((id) => d.commitments[id])
    )
      d.stage = 'reveal';
  } else if (action.type === 'duel_reveal') {
    d.reveals[action.playerId] = { choice: action.choice, salt: action.salt };
    if (
      duelParticipants(state)
        .filter((id) => !player(state, id).bot)
        .every((id) => d.reveals[id])
    )
      finishDuel(state, rng, events);
  } else if (action.type === 'duel_bot') finishDuel(state, rng, events);
}
export function validateDuel(state: GameState): string[] {
  const d = state.duel;
  if (!d) return state.phase === 'duel' ? ['Missing duel.'] : [];
  const ids = duelParticipants(state);
  if (
    state.phase !== 'duel' ||
    d.challengerId !== state.players[state.currentPlayer]?.id ||
    !['offer', 'accept', 'commit', 'reveal'].includes(d.stage) ||
    typeof d.id !== 'string' ||
    !Number.isSafeInteger(d.amount) ||
    d.amount < 0 ||
    (d.stage !== 'offer' &&
      (ids.length !== 2 ||
        ids[0] === ids[1] ||
        ids.some((id) => !state.players.some((p) => p.id === id && !p.eliminated)) ||
        d.amount <= 0)) ||
    d.escrow !== ['commit', 'reveal'].includes(d.stage)
  )
    return ['Invalid duel.'];
  if (
    Object.entries(d.commitments).some(
      ([id, hash]) => !ids.includes(id) || !/^[a-f0-9]{64}$/.test(hash),
    ) ||
    Object.entries(d.reveals).some(
      ([id, r]) =>
        !ids.includes(id) ||
        !duelChoices.includes(r.choice) ||
        duelCommitment(d.id, id, r.choice, r.salt) !== d.commitments[id],
    )
  )
    return ['Invalid duel commitment.'];
  return [];
}
