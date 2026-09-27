import type { GameState } from '@money-tour/engine';

export const taunts = [
  { id: 'laugh', label: 'Même pas peur !' },
  { id: 'cash', label: 'Merci pour le loyer !' },
  { id: 'cry', label: 'Oh non… quelle tragédie !' },
  { id: 'kiss', label: 'Sans rancune !' },
  { id: 'crown', label: 'Place au propriétaire !' },
] as const;
export type TauntKind = (typeof taunts)[number]['id'];
export interface Taunt {
  id: string;
  playerId: string;
  kind: TauntKind;
  targetId?: string;
  at: number;
}
export const TAUNT_COOLDOWN = 8000;
export const TAUNT_DURATION = 5000;
/** Online identity and the sole human stay independent of the active turn.
 * On a shared device, clicking a human pawn selects that person's reactions. */
export function tauntPlayer(state: GameState, self?: string, clicked?: string) {
  if (state.winner) return undefined;
  const humans = state.players.filter((p) => !p.bot && !p.eliminated);
  if (self !== undefined) return humans.find((p) => p.id === self)?.id;
  if (humans.length === 1) return humans[0]!.id;
  return (
    humans.find((p) => p.id === clicked)?.id ??
    humans.find((p) => p.id === state.players[state.currentPlayer]?.id)?.id
  );
}
export function tauntAsset(seat: number, kind: TauntKind) {
  return `${import.meta.env.BASE_URL}taunts/${seat}-${kind}.webp`;
}
