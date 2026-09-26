import { describe, expect, it } from 'vitest';
import {
  createGame,
  config,
  createRng,
  getLegalActions,
  getRent,
  reduceGame,
  validateState,
  chooseBotAction,
  getDecisionPlayerId,
  type GameState,
  type GameAction,
  type Twist,
} from '../src/index';
import {
  initAdventure,
  twists,
  adventureText,
  questRules,
  trackQuests,
  payCapital,
  maybeAuction,
  auctionCommitment,
  legalAuction,
  validateAdventure,
  reservedCity,
} from '../src/adventure';
function game(twist: Twist = 'twins') {
  const s = createGame({
    config: { ...config, adventures: false, shuffleStreets: false, crisisChance: 0 },
    players: [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ],
    seed: 1,
  });
  s.config = { ...s.config, adventures: true };
  let first = true;
  initAdventure(s, () => {
    if (first) {
      first = false;
      return (twists.indexOf(twist) + 0.1) / 5;
    }
    return 0.3;
  });
  return s;
}
function step(s: GameState, a: GameAction, rng = () => 0.1) {
  const before = JSON.stringify(s),
    r = reduceGame(s, a, rng);
  expect(r.error).toBeUndefined();
  expect(JSON.stringify(s)).toBe(before);
  expect(validateState(r.state)).toEqual([]);
  return r;
}
function auction() {
  const s = game();
  s.adventure!.round = s.adventure!.tenderRound;
  maybeAuction(s, () => 0, []);
  return s;
}
const salts = { a: 'a'.repeat(32), b: 'b'.repeat(32) };
function commit(s: GameState, id: 'a' | 'b', amount: number) {
  return step(s, {
    type: 'auction_commit',
    playerId: id,
    hash: auctionCommitment(s.auction!.id, id, amount, salts[id]),
  }).state;
}
function reveal(s: GameState, id: 'a' | 'b', amount: number) {
  return step(s, { type: 'auction_reveal', playerId: id, amount, salt: salts[id] });
}
describe('party rules and private milestones', () => {
  it.each(twists)(
    'initializes exactly one %s rule and private quests deterministically',
    (twist) => {
      const s = game(twist);
      expect(s.adventure!.twist).toBe(twist);
      expect(adventureText(s)).toBeTruthy();
      expect(validateState(s)).toEqual([]);
      expect(s).toEqual(game(twist));
      expect(s.festivals).toHaveLength(twist === 'festivals' ? 3 : 0);
    },
  );
  it('deals distinct inexpensive inherited cities without changing board balance', () => {
    const s = game('inheritance');
    const owned = Object.entries(s.properties).filter(([, p]) => p.ownerId);
    expect(owned).toHaveLength(2);
    expect(new Set(owned.map(([, p]) => p.ownerId)).size).toBe(2);
    expect(Math.max(...owned.map(([id]) => s.config.board[Number(id)]!.price!))).toBe(125000);
  });
  it('doubles twin rents only while one player owns both', () => {
    const s = game();
    const [a, b] = s.adventure!.twinTiles!;
    s.properties[a!]!.ownerId = 'a';
    const base = getRent(s, a!);
    s.properties[b!]!.ownerId = 'b';
    expect(getRent(s, a!)).toBe(base);
    s.properties[b!]!.ownerId = 'a';
    expect(getRent(s, a!)).toBe(base * 2);
    s.crisis = { remaining: ['a', 'b'] };
    expect(getRent(s, a!)).toBe(base);
  });
  it.each(Object.keys(questRules) as (keyof typeof questRules)[])(
    'awards %s once and publicly announces only its completion',
    (kind) => {
      const s = game();
      s.quests!.a = { kind, progress: 0, completed: false };
      s.quests!.b.completed = true;
      const events = [] as Parameters<typeof trackQuests>[1];
      if (kind === 'doubles')
        for (let i = 0; i < 3; i++) events.push({ type: 'dice', playerId: 'a', dice: [2, 2] });
      if (kind === 'builds')
        for (let i = 0; i < 3; i++) events.push({ type: 'build', playerId: 'a' });
      if (kind === 'laps') s.players[0]!.laps = 2;
      if (kind === 'islands' || kind === 'cities')
        s.config.board
          .filter((t) => t.type === (kind === 'islands' ? 'resort' : 'city'))
          .slice(0, questRules[kind].goal)
          .forEach((t) => (s.properties[t.id]!.ownerId = 'a'));
      trackQuests(s, events);
      expect(s.quests!.a.completed).toBe(true);
      expect(s.players[0]!.cash).toBe(1600000);
      expect(events.some((e) => e.type === 'quest_completed' && e.message?.includes('Alice'))).toBe(
        true,
      );
      trackQuests(s, []);
      expect(s.players[0]!.cash).toBe(1600000);
    },
  );
  it('does not reward partial or eliminated objectives and transfers an alliance share', () => {
    const s = game();
    s.quests!.a = { kind: 'doubles', progress: 1, completed: false };
    s.players[1]!.eliminated = true;
    trackQuests(s, []);
    expect(s.players[0]!.cash).toBe(1500000);
    s.players[1]!.eliminated = false;
    s.alliance = { targetId: 'a', beneficiaryId: 'b' };
    s.quests!.a.progress = 3;
    trackQuests(s, []);
    expect(s.players.map((p) => p.cash)).toEqual([1550000, 1550000]);
  });
  it('reveals and credits the capital before the timeout ranking', () => {
    const s = game('capital');
    s.properties[s.adventure!.capitalTile!]!.ownerId = 'a';
    s.players[1]!.cash = 1500000 + s.config.board[s.adventure!.capitalTile!]!.price! + 100000;
    s.elapsedMs = s.durationMs - 1;
    const r = step(s, { type: 'tick', elapsedMs: 1 });
    expect(r.state.winner!.playerIds).toEqual(['a']);
    expect(r.events.some((e) => e.type === 'capital_revealed')).toBe(true);
    expect(r.state.players[0]!.cash).toBe(1700000);
    payCapital(r.state, []);
    expect(r.state.players[0]!.cash).toBe(1700000);
    expect(adventureText(r.state)).toContain('révélée');
  });
  it('announces an unowned capital without minting money', () => {
    const s = game('capital'),
      events = [] as Parameters<typeof payCapital>[1];
    payCapital(s, events);
    expect(events[0]!.message).toContain('aucun bonus');
    expect(s.players[0]!.cash).toBe(1500000);
  });
  it('reserves the market city and opens exactly at full round 10', () => {
    const s = game('market'),
      tile = s.adventure!.marketTile!;
    s.adventure!.tenderDone = true;
    s.players[0]!.position = tile;
    s.phase = 'property';
    expect(reservedCity(s, tile)).toBe(true);
    expect(getLegalActions(s).some((a) => a.type === 'buy')).toBe(false);
    s.phase = 'roll';
    s.adventure!.round = 9;
    maybeAuction(s, () => 0, []);
    expect(s.auction).toBeUndefined();
    s.adventure!.round = 10;
    maybeAuction(s, () => 0, []);
    expect(s.auction!.tile).toBe(tile);
    expect(s.auction!.kind).toBe('market');
    expect(reservedCity(s, tile)).toBe(false);
    expect(adventureText(s)).toContain('a été proposée');
  });
  it('advances full rounds only after the last player, not on doubles', () => {
    let s = game();
    s.phase = 'end';
    s.extraRoll = true;
    s = step(s, { type: 'finish', playerId: 'a' }).state;
    expect(s.adventure!.round).toBe(1);
    s.phase = 'end';
    s = step(s, { type: 'finish', playerId: 'a' }).state;
    expect(s.adventure!.round).toBe(1);
    s.phase = 'end';
    s = step(s, { type: 'finish', playerId: 'b' }).state;
    expect(s.adventure!.round).toBe(2);
  });
});
describe('sealed one-off tenders', () => {
  it('accepts sealed bids, rejects early/wrong/oversized reveals, and charges only the highest', () => {
    let s = auction();
    expect(getDecisionPlayerId(s)).toBe('a');
    s = commit(s, 'a', 123456);
    expect(s.auction!.bids).toEqual({});
    expect(
      legalAuction(s, { type: 'auction_reveal', playerId: 'a', amount: 123456, salt: salts.a }),
    ).toBe(false);
    s = commit(s, 'b', 76543);
    expect(
      legalAuction(s, { type: 'auction_reveal', playerId: 'a', amount: 123457, salt: salts.a }),
    ).toBe(false);
    expect(
      legalAuction(s, { type: 'auction_reveal', playerId: 'a', amount: 2000000, salt: salts.a }),
    ).toBe(false);
    s = reveal(s, 'a', 123456).state;
    const tile = s.auction!.tile;
    const r = reveal(s, 'b', 76543);
    expect(r.state.players.map((p) => p.cash)).toEqual([1376544, 1500000]);
    expect(r.state.properties[tile]!.ownerId).toBe('a');
    expect(r.state.phase).toBe('roll');
    expect(r.events[0]!.message).not.toContain('123456');
    expect(r.state.auction).toBeUndefined();
    maybeAuction(r.state, () => 0, []);
    expect(r.state.auction).toBeUndefined();
  });
  it('randomly breaks equal highest bids and zero bids do not purchase', () => {
    let s = auction();
    s = commit(s, 'a', 10000);
    s = commit(s, 'b', 10000);
    s = reveal(s, 'a', 10000).state;
    const r = reveal(s, 'b', 10000);
    expect(r.events[0]!.message).toContain('tirage au sort');
    s = auction();
    s = commit(s, 'a', 0);
    s = step(s, { type: 'auction_pass', playerId: 'b' }).state;
    expect(reveal(s, 'a', 0).events[0]!.message).toContain('Aucune offre');
  });
  it('passes timed out bidders, permits all to decline and cancels without debit at game expiry', () => {
    let s = auction();
    s = step(s, { type: 'tick', elapsedMs: 30000 }).state;
    expect(getDecisionPlayerId(s)).toBe('b');
    s = step(s, { type: 'auction_pass', playerId: 'b' }).state;
    expect(s.auction).toBeUndefined();
    s = auction();
    s = commit(s, 'a', 9000);
    s = commit(s, 'b', 8000);
    const r = step(s, { type: 'tick', elapsedMs: s.durationMs });
    expect(r.state.auction).toBeUndefined();
    expect(r.state.players.map((p) => p.cash)).toEqual([1500000, 1500000]);
    expect(r.events.some((e) => e.message?.includes('annulée'))).toBe(true);
  });
  it('bots complete both phases without inspecting competitors offers', () => {
    let s = auction();
    s.players.forEach((p) => (p.bot = true));
    let steps = 0;
    while (s.auction && steps++ < 8) s = step(s, chooseBotAction(s)).state;
    expect(s.auction).toBeUndefined();
    expect(steps).toBe(4);
  });
  it('handles disconnected players and a quitting current player without breaking the auction', () => {
    let s = auction();
    s = step(s, { type: 'set_control', playerId: 'a', bot: true }).state;
    s = step(s, chooseBotAction(s)).state;
    s = step(s, { type: 'auction_pass', playerId: 'b' }).state;
    expect(s.auction).toBeDefined();
    s = step(s, { type: 'tick', elapsedMs: 30000 }).state;
    expect(s.auction).toBeUndefined();
    s = auction();
    s = step(s, { type: 'quit', playerId: 'a' }).state;
    expect(s.phase).toBe('finished');
    expect(s.auction).toBeUndefined();
  });
  it('skips a tender if no eligible neutral city remains', () => {
    const s = game();
    s.config.board
      .filter((t) => t.type === 'city')
      .forEach((t) => (s.properties[t.id]!.ownerId = 'a'));
    s.adventure!.round = 7;
    const events = [] as Parameters<typeof maybeAuction>[2];
    maybeAuction(s, () => 0, events);
    expect(s.adventure!.tenderDone).toBe(true);
    expect(s.auction).toBeUndefined();
    expect(events[0]!.message).toContain('Aucune ville');
  });
  it('rejects forged auction actions and malformed adventures', () => {
    const s = auction();
    expect(
      reduceGame(s, { type: 'auction_commit', playerId: 'b', hash: '0'.repeat(64) }).error,
    ).toBeTruthy();
    expect(legalAuction(s, { type: 'auction_commit', playerId: 'a', hash: 'bad' })).toBe(false);
    expect(legalAuction(s, { type: 'roll', playerId: 'a' })).toBe(false);
    const bad = structuredClone(s);
    bad.adventure!.round = 0;
    expect(validateAdventure(bad)).not.toEqual([]);
    bad.adventure = s.adventure;
    bad.quests!.a.progress = -1;
    expect(validateAdventure(bad)).not.toEqual([]);
    bad.quests = s.quests;
    bad.auction!.bids.a = -1;
    expect(validateAdventure(bad)).not.toEqual([]);
  });
});
it('offers only owned cities on Mondial and applies 4-turn rent bonus', () => {
  let s = game();
  s.players[0]!.position = 14;
  s.properties[1]!.ownerId = 'a';
  s.properties[4]!.ownerId = 'a';
  s.properties[2]!.ownerId = 'b';
  s = step(s, { type: 'roll', playerId: 'a' }, () => 0).state;
  expect(s.phase).toBe('championship');
  const choices = getLegalActions(s).filter((a) => a.type === 'place_championship');
  expect(choices).toEqual([{ type: 'place_championship', playerId: 'a', tile: 1 }]);
  const base = getRent(s, 1);
  s = step(s, choices[0]!).state;
  expect(getRent(s, 1)).toBe(base * 2);
  expect(s.properties[1]!.championshipTurns).toBe(4);
});
it('runs each variant through deterministic bot play without corrupting saves', () => {
  for (const twist of twists) {
    let s = game(twist);
    s.players.forEach((p) => (p.bot = true));
    const rng = createRng(twist);
    for (let i = 0; i < 350 && !s.winner; i++) {
      s = step(s, chooseBotAction(s), rng).state;
      if (!s.winner) s = step(s, { type: 'tick', elapsedMs: 1000 }, rng).state;
    }
    expect(validateState(s)).toEqual([]);
  }
});

it('withdraws a human envelope safely when a bot takes over after commitment', () => {
  let s = auction();
  s = commit(s, 'a', 12345);
  s = commit(s, 'b', 54321);
  s = step(s, { type: 'set_control', playerId: 'a', bot: true }).state;
  expect(chooseBotAction(s)).toEqual({ type: 'auction_pass', playerId: 'a' });
  s = step(s, chooseBotAction(s)).state;
  expect(getDecisionPlayerId(s)).toBe('b');
});
