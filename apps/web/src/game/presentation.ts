import type { GameEvent, GameState } from '@money-tour/engine';

export interface Cue {
  kind:
    'dice' | 'hop' | 'card' | 'tax' | 'build' | 'money' | 'turn' | 'settle' | 'casino' | 'notice';
  casinoGame?: 'roulette' | 'slots';
  casinoColor?: string;
  casinoReels?: number[];
  jackpot?: boolean;
  message?: string;
  duration: number;
  amount?: number;
  payerId?: string;
  reason?: string;
  playerId?: string;
  from?: number;
  to?: number;
  dice?: number[];
  cardId?: string;
  tile?: number;
  sound?: string;
}
export interface SceneFrame {
  state: GameState;
  cue: Cue;
}
/** Presentation only: never changes the authoritative state or consumes game randomness. */
export function presentation(
  previous: GameState,
  next: GameState,
  events: GameEvent[],
  reduced = false,
): SceneFrame[] {
  const visual = structuredClone(previous);
  const frames: SceneFrame[] = [];
  const size = previous.config.board.length;
  const add = (cue: Cue) => frames.push({ state: structuredClone(visual), cue });
  const money = (event: GameEvent) => {
    if ((event.amount ?? 0) <= 0) return;
    const recipient = visual.players.find((p) => p.id === event.playerId);
    const payerId = typeof event.payerId === 'string' ? event.payerId : undefined;
    const payer = visual.players.find((p) => p.id === payerId);
    if (payer) payer.cash = Math.max(0, payer.cash - event.amount!);
    if (recipient) recipient.cash += event.amount!;
    add({
      kind: 'money',
      playerId: event.playerId,
      payerId,
      amount: event.amount,
      reason: String(event.reason ?? event.type),
      tile: event.tile,
      sound: recipient ? 'coin-in' : 'coin-out',
      duration: reduced ? 350 : 1500,
    });
  };
  let departure: GameEvent | undefined;
  for (const [index, event] of events.entries()) {
    if (event.type === 'casino_result')
      add({
        kind: 'casino',
        duration: reduced ? 1200 : 3600,
        playerId: event.playerId,
        amount: event.amount,
        casinoGame: event.game as 'roulette' | 'slots',
        casinoColor: String(event.color),
        casinoReels: event.reels as number[],
        jackpot: Boolean(event.jackpot),
        sound: 'dice',
      });
    const notice: Record<string, string> = {
      auction_started: String(event.message),
      auction_result: String(event.message),
      quest_completed: String(event.message),
      capital_revealed: String(event.message),
      alliance: String(event.message),
      alliance_expired: String(event.message),
      crisis: String(event.message),
      crisis_expired: String(event.message),
      duel_forfeit: String(event.message),
      duel_cancelled: String(event.message),
      duel_result:
        event.type === 'duel_result'
          ? ((event.choices as string[]) ?? [])
              .map(
                (c, i) =>
                  (next.players.find((p) => p.id === (i ? event.targetId : event.challengerId))
                    ?.name ?? '') +
                  ' : ' +
                  ({ rock: '✊ Pierre', paper: '✋ Feuille', scissors: '✌️ Ciseaux' }[c] ?? c),
              )
              .join(' · ') +
            '. ' +
            event.message
          : '',
      insurance: 'Un jeton assurance vous attend. Choisissez une propriété à protéger.',
      insured: 'Votre assurance a bloqué l’attaque ! Le jeton est consommé.',
      insured_tile: 'Cette propriété est maintenant assurée.',
      squatter: 'Vous passez sans payer de loyer !',
      expropriate: 'Expropriation : cette ville est à nouveau disponible.',
      roaches:
        'Invasion de cafards : le loyer de cet hôtel est divisé par deux pendant deux tours.',
      roaches_expired: 'La désinsectisation est terminée : le loyer revient à la normale.',
      karma: String(event.message ?? 'Le Karma a tranché.'),
    };
    if (notice[event.type])
      add({
        kind: 'notice',
        reason: event.type,
        duration: (reduced ? 800 : 2600) + 5000,
        playerId: event.playerId,
        tile: event.tile,
        message: notice[event.type],
        sound: 'card',
      });
    if (
      event.type === 'start_bonus' &&
      events[index + 1]?.type === 'move' &&
      events[index + 1]?.playerId === event.playerId
    ) {
      departure = { ...event };
      continue;
    }
    if (event.type === 'dice') {
      add({ kind: 'dice', dice: event.dice, duration: reduced ? 150 : 1600 });
      visual.dice = event.dice ?? [];
      add({ kind: 'settle', duration: reduced ? 100 : 400 });
    }
    if (event.type === 'move' || event.type === 'island') {
      const player = visual.players.find((p) => p.id === event.playerId);
      if (!player) continue;
      const destination =
        event.type === 'island'
          ? next.players.find((p) => p.id === event.playerId)!.position
          : event.tile!;
      const steps =
        event.type === 'island'
          ? (destination - player.position + size) % size
          : Number(event.steps ?? 0);
      for (let i = 0; i < Math.abs(steps); i++) {
        const from = player.position;
        player.position = (from + Math.sign(steps) + size) % size;
        add({
          kind: 'hop',
          playerId: player.id,
          from,
          to: player.position,
          duration: reduced ? 35 : 270,
        });
        if (player.position === 0 && steps > 0 && departure?.playerId === player.id) {
          const amount = Math.min(departure.amount ?? 0, visual.config.startBonus);
          money({ ...departure, amount });
          departure.amount = (departure.amount ?? 0) - amount;
          if (!departure.amount) departure = undefined;
        }
      }
    }
    if (event.type === 'tax_notice')
      add({
        kind: 'tax',
        reason: typeof event.reason === 'string' ? event.reason : undefined,
        playerId: event.playerId,
        tile: event.tile,
        amount: event.amount,
        sound: 'card',
        duration: 5000,
      });
    if (event.type === 'card')
      add({ kind: 'card', playerId: event.playerId, cardId: event.cardId, duration: 5500 });
    if (['payment', 'income', 'start_bonus', 'sale'].includes(event.type)) money(event);
    if (event.type === 'turn' || event.type === 'extra_roll') {
      Object.assign(visual, structuredClone(next));
      add({ kind: 'turn', playerId: event.playerId, duration: reduced ? 450 : 1400 });
    }
    if (['purchase', 'buyout', 'sale', 'build'].includes(event.type) && event.tile !== undefined) {
      visual.properties[event.tile] = { ...next.properties[event.tile]! };
      add({
        kind: event.type === 'build' ? 'build' : 'settle',
        sound: event.type === 'buyout' ? 'purchase' : event.type,
        tile: event.tile,
        duration: reduced ? 100 : 700,
      });
    }
    if (['purchase', 'build', 'championship'].includes(event.type))
      money({
        ...event,
        type: 'payment',
        playerId: undefined,
        payerId: event.playerId,
        reason: event.type,
      });
    if (['victory', 'bankruptcy'].includes(event.type))
      add({ kind: 'settle', sound: event.type, duration: 150 });
  }
  if (frames.length) frames.push({ state: next, cue: { kind: 'settle', duration: 50 } });
  return frames;
}

export function presentationMs(events: GameEvent[]): number {
  return events.reduce(
    (ms, e) =>
      ms +
      (e.type === 'dice'
        ? 2000
        : e.type === 'casino_result'
          ? 3600
          : [
                'auction_started',
                'auction_result',
                'quest_completed',
                'capital_revealed',
                'alliance',
                'alliance_expired',
                'crisis',
                'crisis_expired',
                'duel_result',
                'duel_cancelled',
                'duel_forfeit',
                'insurance',
                'insured',
                'insured_tile',
                'squatter',
                'expropriate',
                'roaches',
                'roaches_expired',
                'karma',
              ].includes(e.type)
            ? 7600
            : ['payment', 'income', 'start_bonus', 'sale'].includes(e.type) && (e.amount ?? 0) > 0
              ? 1500
              : ['turn', 'extra_roll'].includes(e.type)
                ? 1400
                : e.type === 'move'
                  ? Math.abs(Number(e.steps ?? 0)) * 270
                  : e.type === 'tax_notice'
                    ? 5000
                    : e.type === 'card'
                      ? 5500
                      : ['build', 'purchase', 'buyout'].includes(e.type)
                        ? 2200
                        : e.type === 'championship'
                          ? 1500
                          : e.type === 'island'
                            ? 8640
                            : 0),
    0,
  );
}
