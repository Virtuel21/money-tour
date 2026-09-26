import { sha256 } from '@noble/hashes/sha2.js';
import { randomInt } from './rng.js';
import { awardGain } from './world-events.js';
import type { GameAction, GameEvent, GameState, Quest, Rng, Twist } from './types.js';

export const twists: Twist[] = ['twins', 'festivals', 'inheritance', 'market', 'capital'];
export const questRules: Record<Quest['kind'], { title: string; goal: number }> = {
  islands: { title: 'Posséder trois îles', goal: 3 },
  doubles: { title: 'Obtenir trois doubles (cumulés)', goal: 3 },
  builds: { title: 'Réaliser trois constructions', goal: 3 },
  laps: { title: 'Passer deux fois par Départ', goal: 2 },
  cities: { title: 'Posséder quatre villes', goal: 4 },
};
export function initAdventure(s: GameState, rng: Rng): void {
  if (!s.config.adventures) return;
  const cities = s.config.board.filter((t) => t.type === 'city');
  const twist = twists[randomInt(rng, twists.length)]!;
  s.adventure = { twist, round: 1, tenderRound: 3 + randomInt(rng, 5), tenderDone: false };
  s.quests = {};
  for (const p of s.players)
    s.quests[p.id] = {
      kind: (Object.keys(questRules) as Quest['kind'][])[randomInt(rng, 5)]!,
      progress: 0,
      completed: false,
    };
  if (twist === 'twins')
    s.adventure.twinTiles = ['Paris', 'Tokyo']
      .map((n) => cities.find((t) => t.name === n)?.id)
      .filter((n): n is number => n !== undefined);
  if (twist !== 'festivals') s.festivals = [];
  if (twist === 'inheritance') {
    // Deal different inexpensive cities to limit the initial wealth gap.
    const pool = [...cities].sort((a, b) => a.price! - b.price!).slice(0, s.players.length);
    for (const p of s.players) {
      const tile = pool.splice(randomInt(rng, pool.length), 1)[0]!;
      s.properties[tile.id]!.ownerId = p.id;
    }
  }
  if (twist === 'market') {
    s.adventure.marketTile = cities[randomInt(rng, cities.length)]!.id;
    s.adventure.marketDone = false;
  }
  if (twist === 'capital') s.adventure.capitalTile = cities[randomInt(rng, cities.length)]!.id;
  trackQuests(s, []);
}
export function adventureText(s: GameState): string {
  const a = s.adventure,
    name = (id: number) => s.config.board[id]!.name;
  if (!a)
    return s.festivals.length ? `Festivals : ${s.festivals.map(name).join(', ')} · loyers ×2` : '';
  switch (a.twist) {
    case 'twins':
      return `Villes jumelles · ${(a.twinTiles ?? []).map(name).join(' + ')} : loyers ×2 si vous possédez les deux.`;
    case 'festivals':
      return `Festivals · ${s.festivals.map(name).join(', ')} : loyers ×2 pendant la partie.`;
    case 'inheritance':
      return 'Héritage familial · chacun a reçu une ville gratuite différente au départ.';
    case 'market':
      return `Marché flottant · ${name(a.marketTile!)} ${a.marketDone ? 'a été proposée aux enchères' : 'sera mise aux enchères au tour de table 10'}.`;
    case 'capital':
      return a.capitalPaid
        ? `Capitale mystère · ${name(a.capitalTile!)} a été révélée.`
        : 'Capitale mystère · une ville cachée rapportera 200 k à son propriétaire en fin de partie.';
  }
}
export function twinMultiplier(s: GameState, tile: number): number {
  const twins = s.adventure?.twinTiles;
  const id = s.properties[tile]?.ownerId;
  return id &&
    twins?.length === 2 &&
    twins.includes(tile) &&
    twins.every((t) => s.properties[t]?.ownerId === id)
    ? 2
    : 1;
}
export function reservedCity(s: GameState, tile: number): boolean {
  return (
    s.adventure?.twist === 'market' && !s.adventure.marketDone && s.adventure.marketTile === tile
  );
}
export function trackQuests(s: GameState, events: GameEvent[]): void {
  if (!s.quests) return;
  for (const p of s.players) {
    const q = s.quests[p.id];
    if (!q || q.completed || p.eliminated) continue;
    if (q.kind === 'doubles')
      q.progress += events.filter(
        (e) =>
          e.type === 'dice' &&
          e.playerId === p.id &&
          e.dice?.length &&
          e.dice.every((d) => d === e.dice![0]),
      ).length;
    if (q.kind === 'builds')
      q.progress += events.filter((e) => e.type === 'build' && e.playerId === p.id).length;
    if (q.kind === 'laps') q.progress = p.laps;
    if (q.kind === 'islands' || q.kind === 'cities')
      q.progress = s.config.board.filter(
        (t) =>
          t.type === (q.kind === 'islands' ? 'resort' : 'city') &&
          s.properties[t.id]?.ownerId === p.id,
      ).length;
    const rule = questRules[q.kind];
    if (q.progress >= rule.goal) {
      q.completed = true;
      events.push({
        type: 'quest_completed',
        playerId: p.id,
        message: `${p.name} a accompli « ${rule.title} » et remporte 100 k !`,
      });
      awardGain(s, p.id, 100000, events, 'quest');
    }
  }
}
export function payCapital(s: GameState, events: GameEvent[]): void {
  const a = s.adventure;
  if (a?.twist !== 'capital' || a.capitalPaid) return;
  a.capitalPaid = true;
  const id = s.properties[a.capitalTile!]?.ownerId;
  const p = s.players.find((p) => p.id === id && !p.eliminated);
  events.push({
    type: 'capital_revealed',
    tile: a.capitalTile,
    message: `La Capitale mystère était ${s.config.board[a.capitalTile!]!.name} ! ${p ? p.name + ' remporte 200 k.' : 'Sans propriétaire : aucun bonus versé.'}`,
  });
  if (p) awardGain(s, p.id, 200000, events, 'capital');
}
export function maybeAuction(s: GameState, rng: Rng, events: GameEvent[]): void {
  const a = s.adventure;
  if (!a || s.auction || s.winner) return;
  let kind: 'tender' | 'market' | undefined;
  let tile: number | undefined;
  if (a.twist === 'market' && !a.marketDone && a.round >= 10) {
    a.marketDone = true;
    kind = 'market';
    tile = a.marketTile;
  } else if (!a.tenderDone && a.round >= a.tenderRound) {
    a.tenderDone = true;
    kind = 'tender';
    const candidates = s.config.board.filter(
      (t) => t.type === 'city' && !s.properties[t.id]?.ownerId && !reservedCity(s, t.id),
    );
    if (candidates.length) tile = candidates[randomInt(rng, candidates.length)]!.id;
  }
  if (!kind) return;
  if (tile === undefined || s.properties[tile]?.ownerId) {
    events.push({
      type: 'auction_result',
      message: 'Aucune ville neutre disponible : l’appel d’offres est annulé.',
    });
    return;
  }
  s.auction = {
    id: `${s.seq}:${s.turn}:${tile}`,
    tile,
    kind,
    resume: s.phase,
    participants: s.players.filter((p) => !p.eliminated).map((p) => p.id),
    stage: 'commit',
    commitments: {},
    bids: {},
    passed: [],
  };
  s.phase = 'auction';
  events.push({
    type: 'auction_started',
    tile,
    message: `${kind === 'market' ? 'Marché flottant' : 'Appel d’offres'} : ${s.config.board[tile]!.name} est proposée à tous. Préparez votre offre secrète !`,
  });
}
export function auctionCommitment(
  id: string,
  playerId: string,
  amount: number,
  salt: string,
): string {
  return Array.from(
    sha256(new TextEncoder().encode(JSON.stringify([id, playerId, amount, salt]))),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
export function auctionActor(s: GameState): string | undefined {
  const a = s.auction;
  return a?.participants.find(
    (id) =>
      !a.passed.includes(id) &&
      (a.stage === 'commit' ? !a.commitments[id] : a.bids[id] === undefined),
  );
}
export function auctionActions(s: GameState): GameAction[] {
  const a = s.auction,
    playerId = auctionActor(s);
  if (!a || !playerId) return [];
  return [
    { type: 'auction_pass', playerId },
    a.stage === 'commit'
      ? { type: 'auction_commit', playerId, hash: '0'.repeat(64) }
      : { type: 'auction_reveal', playerId, amount: 0, salt: '0'.repeat(32) },
  ];
}
export function legalAuction(s: GameState, action: GameAction): boolean {
  const a = s.auction;
  if (!a || s.phase !== 'auction' || !('playerId' in action) || action.playerId !== auctionActor(s))
    return false;
  if (action.type === 'auction_pass') return true;
  if (action.type === 'auction_commit')
    return a.stage === 'commit' && /^[a-f0-9]{64}$/.test(action.hash);
  if (action.type !== 'auction_reveal' || a.stage !== 'reveal') return false;
  const p = s.players.find((p) => p.id === action.playerId)!;
  return (
    Number.isSafeInteger(action.amount) &&
    action.amount >= 0 &&
    action.amount <= p.cash &&
    /^[a-f0-9]{32,64}$/.test(action.salt) &&
    auctionCommitment(a.id, p.id, action.amount, action.salt) === a.commitments[p.id]
  );
}
export function advanceAuction(s: GameState, rng: Rng, events: GameEvent[]): void {
  const a = s.auction;
  if (!a) return;
  for (const id of a.participants)
    if (s.players.find((p) => p.id === id)?.eliminated && !a.passed.includes(id)) a.passed.push(id);
  if (auctionActor(s)) return;
  if (a.stage === 'commit') {
    a.stage = 'reveal';
    if (auctionActor(s)) return;
  }
  const offers = a.participants.filter(
    (id) =>
      !a.passed.includes(id) &&
      (a.bids[id] ?? 0) > 0 &&
      (a.bids[id] ?? Infinity) <= s.players.find((p) => p.id === id)!.cash,
  );
  const max = Math.max(0, ...offers.map((id) => a.bids[id]!));
  const tied = offers.filter((id) => a.bids[id] === max);
  const winner = tied.length
    ? s.players.find((p) => p.id === tied[randomInt(rng, tied.length)])
    : undefined;
  if (winner) {
    winner.cash -= max;
    s.properties[a.tile]!.ownerId = winner.id;
    // Deliberately no bid amount in public notices or history.
    events.push({
      type: 'auction_result',
      tile: a.tile,
      playerId: winner.id,
      message: `${winner.name} remporte ${s.config.board[a.tile]!.name}${tied.length > 1 ? ' après tirage au sort entre offres égales' : ''} ! Les montants des offres ne sont pas affichés.`,
    });
  } else
    events.push({
      type: 'auction_result',
      tile: a.tile,
      message: 'Aucune offre retenue : la ville reste disponible.',
    });
  s.phase = a.resume;
  delete s.auction;
}
export function applyAuction(
  s: GameState,
  action: GameAction,
  rng: Rng,
  events: GameEvent[],
): void {
  const a = s.auction!;
  if (action.type === 'auction_commit') a.commitments[action.playerId] = action.hash;
  if (action.type === 'auction_reveal') a.bids[action.playerId] = action.amount;
  if (action.type === 'auction_pass') a.passed.push(action.playerId);
  advanceAuction(s, rng, events);
}
export function botAuction(s: GameState): GameAction {
  const a = s.auction!,
    playerId = auctionActor(s)!,
    p = s.players.find((p) => p.id === playerId)!;
  const amount = Math.min(
    Math.max(0, p.cash - s.config.botReserve),
    Math.floor(s.config.board[a.tile]!.price! * (0.65 + s.players.indexOf(p) * 0.08)),
  );
  // Stable across reconnects; bot strategy never reads competitors' sealed/revealed bids.
  const salt = auctionCommitment(a.id, playerId, 0, 'bot-auction');
  if (
    a.stage === 'reveal' &&
    auctionCommitment(a.id, playerId, amount, salt) !== a.commitments[playerId]
  )
    return { type: 'auction_pass', playerId };
  return a.stage === 'commit'
    ? { type: 'auction_commit', playerId, hash: auctionCommitment(a.id, playerId, amount, salt) }
    : { type: 'auction_reveal', playerId, amount, salt };
}
export function validateAdventure(s: GameState): string[] {
  const a = s.adventure;
  if (!a) return s.auction || s.quests ? ['Missing adventure.'] : [];
  const city = (id: number | undefined) => id !== undefined && s.config.board[id]?.type === 'city';
  if (
    !twists.includes(a.twist) ||
    !Number.isSafeInteger(a.round) ||
    a.round < 1 ||
    !Number.isSafeInteger(a.tenderRound) ||
    a.tenderRound < 3 ||
    a.tenderRound > 7 ||
    typeof a.tenderDone !== 'boolean' ||
    (a.twist === 'capital' && !city(a.capitalTile)) ||
    (a.twist === 'market' && !city(a.marketTile)) ||
    (a.twist === 'twins' && (a.twinTiles?.length !== 2 || !a.twinTiles.every(city)))
  )
    return ['Invalid adventure.'];
  if (
    !s.quests ||
    s.players.some((p) => {
      const q = s.quests?.[p.id];
      return (
        !q ||
        !questRules[q.kind] ||
        !Number.isSafeInteger(q.progress) ||
        q.progress < 0 ||
        typeof q.completed !== 'boolean'
      );
    })
  )
    return ['Invalid quests.'];
  const auction = s.auction;
  if (Boolean(auction) !== (s.phase === 'auction')) return ['Missing auction.'];
  if (
    auction &&
    (!city(auction.tile) ||
      s.properties[auction.tile]?.ownerId ||
      !['commit', 'reveal'].includes(auction.stage) ||
      !['roll', 'island', 'travel'].includes(auction.resume) ||
      !auction.participants.length ||
      new Set(auction.participants).size !== auction.participants.length ||
      auction.participants.some((id) => !s.players.some((p) => p.id === id)) ||
      Object.values(auction.commitments).some((h) => !/^[a-f0-9]{64}$/.test(h)) ||
      Object.values(auction.bids).some((b) => !Number.isSafeInteger(b) || b < 0) ||
      !auctionActor(s))
  )
    return ['Invalid auction.'];
  return [];
}
