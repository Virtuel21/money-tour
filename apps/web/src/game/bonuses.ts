import type { GameState, Player } from '@money-tour/engine';
import { money } from './local';

export interface BonusInfo {
  title: string;
  description: string;
}
export function playerBonuses(state: GameState, player: Player): BonusInfo[] {
  const items: BonusInfo[] = [];
  const city = (id: number) => state.config.board[id]!.name;
  if (player.insurance)
    items.push({
      title:
        '🛡 Assurance' +
        (player.insurance.tile === null ? ' disponible' : ` · ${city(player.insurance.tile)}`),
      description:
        player.insurance.tile === null
          ? 'Choisissez une de vos propriétés pour y poser cette assurance. Elle ne protège aucun bien tant qu’elle n’est pas posée.'
          : `Protège uniquement ${city(player.insurance.tile)} contre une expropriation, une destruction ou un rachat hostile. Le jeton est consommé après la première protection. Il ne dispense pas de payer les loyers et ne bloque pas les cafards.`,
    });
  for (const id of [...player.escapeCards, ...(player.heldCards ?? [])]) {
    const card = state.config.cards.find((c) => c.id === id);
    if (card)
      items.push({
        title: `▣ ${card.title}`,
        description: card.description + ' Cette carte est consommée lors de son utilisation.',
      });
  }
  if (player.fraudLiability)
    items.push({
      title: '⚠ Risque fiscal',
      description: `La prochaine case Taxe réclamera ${money(player.fraudLiability)} à la place de la taxe normale. Ce risque disparaît au prochain passage en avant par Départ.`,
    });
  if (
    state.alliance &&
    [state.alliance.targetId, state.alliance.beneficiaryId].includes(player.id)
  ) {
    const a = state.alliance;
    items.push({
      title: '🤝 Alliance temporaire',
      description: `${state.players.find((p) => p.id === a.beneficiaryId)!.name} reçoit 50 % des gains de ${state.players.find((p) => p.id === a.targetId)!.name} jusqu’à la fin du prochain tour de ce dernier.`,
    });
  }
  for (const tile of state.config.board.filter(
    (t) => state.properties[t.id]?.ownerId === player.id,
  )) {
    const p = state.properties[tile.id]!;
    if (p.championships)
      items.push({
        title: `🏆 Mondial · ${tile.name}`,
        description: `Le loyer de ${tile.name} est doublé. Durée restante : ${p.championshipTurns ?? 0} retours de votre tour. Un double aux dés ne réduit pas cette durée.`,
      });
    if (p.roachTurns)
      items.push({
        title: `🪳 Cafards · ${tile.name}`,
        description: `Le loyer de cet hôtel est réduit de moitié pendant encore ${p.roachTurns} retours de votre tour. L’assurance ne bloque pas ce malus.`,
      });
  }
  if (state.crisis)
    items.push({
      title: '📉 Crise économique',
      description: `Tous les loyers sont réduits de moitié. La crise se termine lorsque les ${state.crisis.remaining.length} joueurs restants ont terminé leur tour.`,
    });
  return items;
}
