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
export function tauntAsset(seat: number, kind: TauntKind) {
  return `${import.meta.env.BASE_URL}taunts/${seat}-${kind}.webp`;
}
