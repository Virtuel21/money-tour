import type { GameEvent, GameState } from '@money-tour/engine';
import { money } from './local';
import { tileTitle, festivalText } from './tileTitle';
export function eventText(event: GameEvent, state: GameState): string {
  const name = state.players.find((p) => p.id === event.playerId)?.name ?? 'La banque';
  const location = event.tile !== undefined ? state.config.board[event.tile] : undefined;
  const tile = location ? tileTitle(location) : '';
  switch (event.type) {
    case 'move':
      return `${name} arrive sur ${tile}.`;
    case 'downgrade':
      return `${name} fait retirer une maison à ${tile}.`;
    case 'card_no_effect':
      return `${name} : aucune cible disponible pour cette carte.`;
    case 'roaches_expired':
      return `${tile} est débarrassée des cafards : son loyer est rétabli.`;
    case 'extra_roll':
      return `${name} rejoue grâce à son double.`;
    case 'turn':
      return `Au tour de ${name}.`;
    case 'debt_settled':
      return `${name} a réglé sa dette de ${money(event.amount ?? 0)}.`;
    case 'tax_notice':
      return `${name} doit régler ${money(event.amount ?? 0)} de ${event.reason === 'fraud' ? 'redressement fiscal' : 'taxe'}.`;
    case 'control':
      return `${name} ${event.bot ? 'est remplacé par un bot' : 'reprend la main'}.`;
    case 'player_action': {
      const labels: Record<string, string> = {
        roll: 'lance les dés',
        finish: 'termine sa visite',
        buy: 'valide son achat',
        buy_fraud: 'utilise sa carte Fraude fiscale',
        upgrade: 'valide son chantier',
        buyout: 'demande un rachat',
        sell: 'vend une propriété',
        pay_rent: 'paie son loyer',
        use_squatter: 'utilise sa carte Squatteur',
        casino_red: 'choisit rouge au casino',
        casino_black: 'choisit noir au casino',
        casino_spin: 'lance la machine à sous',
        duel_offer: 'propose une mise pour le duel',
        duel_accept: 'accepte la mise du duel',
        duel_decline: 'refuse le duel',
        duel_cancel: 'renonce au duel',
        duel_commit: 'a choisi son geste en secret',
        duel_reveal: 'confirme son geste secret',
        duel_bot: 'joue sa manche de duel',
        auction_commit: 'a déposé son offre secrète',
        auction_reveal: 'confirme son offre scellée',
        auction_pass: 'passe son tour aux enchères',
        pay_bail: 'paie pour quitter l’île',
        use_escape: 'utilise son billet de sortie',
        attempt_escape: 'tente un double pour quitter l’île',
        decline_travel: 'renonce au voyage et choisit les dés',
        travel: 'choisit sa destination',
        insure: 'pose son assurance',
        attack: 'choisit la cible de sa carte',
        alliance: 'choisit son partenaire d’alliance',
        place_championship: 'organise un Festival',
        quit: 'abandonne la partie',
      };
      return labels[String(event.actionType)] ? `${name} ${labels[String(event.actionType)]}.` : '';
    }
    case 'income':
      return `${name} reçoit ${money(event.amount ?? 0)}.`;
    case 'alliance':
    case 'alliance_expired':
    case 'earthquake':
    case 'victory_warning':
    case 'crisis':
    case 'crisis_expired':
    case 'auction_started':
    case 'auction_result':
    case 'quest_completed':
    case 'capital_revealed':
    case 'duel_result':
    case 'duel_started':
    case 'duel_forfeit':
    case 'duel_cancelled':
      return festivalText(String(event.message));
    case 'casino_result':
      return `${name} au casino : ${event.jackpot ? 'jackpot ! ' : ''}+${money(event.amount ?? 0, true)}.`;
    case 'insurance':
    case 'insured':
    case 'squatter':
    case 'karma':
      return `${name} : ${festivalText(event.message)}`;
    case 'expropriate':
      return `${tile} a été expropriée et redevient libre.`;
    case 'roaches':
      return `${tile} : loyer divisé par deux pendant deux tours.`;
    case 'insured_tile':
      return `${name} assure ${tile}.`;
    case 'dice':
      return `${name} lance ${event.dice?.join(' + ')}.`;
    case 'purchase':
      return `${name} achète ${tile} pour ${money(event.amount ?? 0, true)}.`;
    case 'buyout':
      return `${name} rachète ${tile} pour ${money(event.amount ?? 0)}.`;
    case 'build':
      return `${name} construit à ${tile} : ${event.level === 4 ? 'hôtel' : event.level + ' maison(s)'} · ${money(event.amount ?? 0)}.`;
    case 'card':
      return `${name} : ${festivalText(event.message)}`;
    case 'payment':
      return `${event.reason === 'rent' ? 'Loyer payé' : event.reason === 'attack' ? 'Attaque' : 'Versement'} : ${state.players.find((p) => p.id === event.payerId)?.name ?? 'Banque'} → ${event.playerId ? name : 'Banque'} · ${money(event.amount ?? 0, true)}.`;
    case 'start_bonus':
      return `${name} passe Départ : +${money(event.amount ?? 0, true)}.`;
    case 'bankruptcy':
      return `${name} fait faillite.`;
    case 'sale':
      return `${name} vend ${tile}.`;
    case 'island':
      return `${name} fait escale sur l’île perdue.`;
    case 'island_exit':
      return `${name} quitte l’île.`;
    case 'championship_expired':
      return `Le Festival de ${tile} est terminé.`;
    case 'championship':
      return `${name} organise un festival à ${tile}.`;
    case 'travel':
      return `${name} s’envole vers ${tile}.`;
    case 'timeout':
      return `${name} : décision automatique après 30 secondes.`;
    case 'quit':
      return `${name} quitte la partie.`;
    case 'victory':
      return 'La partie est terminée !';
    default:
      return '';
  }
}
