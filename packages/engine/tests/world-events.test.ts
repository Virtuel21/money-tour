import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  config,
  createGame,
  reduceGame,
  validateState,
  getRent,
  getLegalActions,
  duelCommitment,
  duelChoices,
  getDecisionPlayerId,
  type GameState,
  type GameAction,
  type DuelChoice,
} from '../src/index';
import { sequence } from './helpers';
function game() {
  return createGame({
    config: { ...config, shuffleStreets: false },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ],
    seed: 'world',
  });
}
function step(s: GameState, a: GameAction, rng = () => 0.99) {
  const old = JSON.stringify(s);
  const r = reduceGame(s, a, rng);
  expect(r.error).toBeUndefined();
  expect(JSON.stringify(s)).toBe(old);
  expect(validateState(r.state)).toEqual([]);
  return r.state;
}
function duel(s = game()) {
  s.phase = 'duel';
  s.duel = {
    id: 'one-duel',
    challengerId: 'a',
    amount: 0,
    stage: 'offer',
    commitments: {},
    reveals: {},
    escrow: false,
  };
  return s;
}
function accepted(s = duel()) {
  s = step(s, { type: 'duel_offer', playerId: 'a', targetId: 'b', amount: 50000 });
  return step(s, { type: 'duel_accept', playerId: 'b' });
}
const saltA = 'a'.repeat(32),
  saltB = 'b'.repeat(32);
function commits(s: GameState, a: DuelChoice, b: DuelChoice) {
  s = step(s, {
    type: 'duel_commit',
    playerId: 'a',
    hash: duelCommitment(s.duel!.id, 'a', a, saltA),
  });
  return step(s, {
    type: 'duel_commit',
    playerId: 'b',
    hash: duelCommitment(s.duel!.id, 'b', b, saltB),
  });
}
it('balances every square side and separates Chance, Karma and casinos after every shuffle', () => {
  for (let seed = 0; seed < 20; seed++) {
    const s = createGame({
      players: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
      seed,
    });
    for (let side = 0; side < 4; side++) {
      const b = s.config.board.slice(side * 8, side * 8 + 8);
      expect(b.filter((t) => t.type === 'city')).toHaveLength(4);
      expect(b.filter((t) => t.type === 'resort')).toHaveLength(1);
      expect(
        b.filter((t) => ['chance', 'tax', 'casino', 'insurance', 'karma'].includes(t.type)),
      ).toHaveLength(2);
    }
    s.config.board.forEach((t, i) => {
      if (['chance', 'karma', 'casino'].includes(t.type))
        expect(['chance', 'karma', 'casino']).not.toContain(s.config.board[(i + 1) % 32]!.type);
    });
  }
});
it('requires every city AND the island on a side for a line monopoly', () => {
  for (let side = 0; side < 4; side++) {
    let s = game();
    const tiles = s.config.board.filter(
      (t) => t.line === side && (t.type === 'city' || t.type === 'resort'),
    );
    tiles.filter((t) => t.type === 'city').forEach((t) => (s.properties[t.id]!.ownerId = 'a'));
    s = step(s, { type: 'tick', elapsedMs: 0 });
    expect(s.winner).toBeNull();
    s.properties[tiles.find((t) => t.type === 'resort')!.id]!.ownerId = 'a';
    s = step(s, { type: 'tick', elapsedMs: 0 });
    expect(s.winner?.reasons).toContain('line');
  }
});
it('shares rent and Start income without creating money, excludes sale capital and expires after the target turn including doubles', () => {
  let s = game();
  s.phase = 'alliance';
  s = step(s, { type: 'alliance', playerId: 'a', targetId: 'b' });
  s = step(s, { type: 'finish', playerId: 'a' });
  s.players[1]!.position = 30;
  s = step(s, { type: 'roll', playerId: 'b' }, sequence(0, 0));
  expect(s.players[0]!.cash).toBe(1650000);
  expect(s.players[1]!.cash).toBe(1650000);
  s = step(s, { type: 'finish', playerId: 'b' });
  expect(s.alliance).toBeDefined();
  s.phase = 'end';
  s.extraRoll = false;
  s = step(s, { type: 'finish', playerId: 'b' });
  expect(s.alliance).toBeUndefined();
  const rent = game();
  rent.alliance = { beneficiaryId: 'c', targetId: 'b' };
  rent.properties[1]!.ownerId = 'b';
  rent.festivals = [];
  rent.config.festivalCount = 0;
  rent.players[0]!.position = 30;
  const paid = step(rent, { type: 'roll', playerId: 'a' }, sequence(0, 0.2));
  expect(paid.players.map((p) => p.cash)).toEqual([1790000, 1505000, 1505000]);
  const sale = game();
  sale.alliance = { beneficiaryId: 'b', targetId: 'a' };
  sale.properties[1]!.ownerId = 'a';
  sale.phase = 'debt';
  sale.debt = {
    playerId: 'a',
    creditorId: null,
    amount: 1550000,
    reason: 'tax',
    continuation: 'end',
  };
  const sold = step(sale, { type: 'sell', playerId: 'a', tile: 1 });
  expect(sold.players[1]!.cash).toBe(1500000);
});
it('runs an economic crisis for every living player and all doubles, then restores city and island rents', () => {
  let s = game();
  s.config.crisisChance = 100;
  s.currentPlayer = 2;
  s.phase = 'end';
  s.properties[1]!.ownerId = 'b';
  s.properties[4]!.ownerId = 'b';
  s.festivals = [];
  s.config.festivalCount = 0;
  s = step(s, { type: 'finish', playerId: 'c' }, () => 0);
  expect(s.crisis?.remaining).toEqual(['a', 'b', 'c']);
  expect(getRent(s, 1)).toBe(5000);
  expect(getRent(s, 4)).toBe(25000);
  s.config.crisisChance = 0;
  s.extraRoll = true;
  s.phase = 'end';
  s = step(s, { type: 'finish', playerId: 'a' });
  expect(s.crisis?.remaining).toHaveLength(3);
  for (const playerId of ['a', 'b', 'c']) {
    s.phase = 'end';
    s = step(s, { type: 'finish', playerId });
  }
  expect(s.crisis).toBeUndefined();
  expect(getRent(s, 1)).toBe(10000);
  expect(getRent(s, 4)).toBe(50000);
});
it('binds hidden choices to the duel and player with SHA-256', () => {
  expect(duelCommitment('d', 'a', 'rock', saltA)).toBe(
    createHash('sha256')
      .update(JSON.stringify(['d', 'a', 'rock', saltA]))
      .digest('hex'),
  );
  expect(duelCommitment('d', 'b', 'rock', saltA)).not.toBe(duelCommitment('d', 'a', 'rock', saltA));
});
it.each(duelChoices.flatMap((a) => duelChoices.map((b) => [a, b] as const)))(
  'settles %s versus %s with conserved stakes and draw refunds',
  (a, b) => {
    let s = commits(accepted(), a, b);
    expect(s.players.slice(0, 2).map((p) => p.cash)).toEqual([1450000, 1450000]);
    s = step(s, { type: 'duel_reveal', playerId: 'a', choice: a, salt: saltA });
    s = step(s, { type: 'duel_reveal', playerId: 'b', choice: b, salt: saltB });
    expect(s.duel).toBeUndefined();
    const winner = (duelChoices.indexOf(a) - duelChoices.indexOf(b) + 3) % 3;
    expect(s.players.slice(0, 2).map((p) => p.cash)).toEqual(
      winner === 0 ? [1500000, 1500000] : winner === 1 ? [1550000, 1450000] : [1450000, 1550000],
    );
  },
);
it('rejects unaffordable, forged, premature and off-seat duel actions', () => {
  let s = duel();
  expect(
    reduceGame(s, { type: 'duel_offer', playerId: 'a', targetId: 'b', amount: 1500001 }).error,
  ).toBeDefined();
  s = accepted(s);
  expect(getDecisionPlayerId(s)).toBe('a');
  expect(
    reduceGame(s, { type: 'duel_reveal', playerId: 'a', choice: 'rock', salt: saltA }).error,
  ).toBeDefined();
  expect(
    reduceGame(s, { type: 'duel_commit', playerId: 'c', hash: 'a'.repeat(64) }).error,
  ).toBeDefined();
  s = commits(s, 'rock', 'paper');
  expect(
    reduceGame(s, { type: 'duel_reveal', playerId: 'a', choice: 'scissors', salt: saltA }).error,
  ).toBeDefined();
});
it('forfeits the missing player stake on abandonment but refunds at global clock expiry', () => {
  for (const a of [
    { type: 'tick', elapsedMs: 30000 },
    { type: 'quit', playerId: 'b' },
    { type: 'set_control', playerId: 'b', bot: true },
  ] as GameAction[]) {
    let s = accepted();
    s = step(s, a);
    expect(s.duel).toBeUndefined();
    expect(s.players[0]!.cash).toBe(a.type === 'tick' ? 1450000 : 1550000);
    if (a.type === 'tick') expect(s.players[1]!.cash).toBe(1550000);
  }
  let s = accepted();
  s.elapsedMs = s.durationMs - 1;
  s = step(s, { type: 'tick', elapsedMs: 1 });
  expect(s.duel).toBeUndefined();
  expect(s.players.every((p) => p.cash === 1500000)).toBe(true);
});
it('waits for human commitment before using shared randomness against a bot', () => {
  let s = duel();
  s.players[1]!.bot = true;
  s = accepted(s);
  s = step(s, {
    type: 'duel_commit',
    playerId: 'a',
    hash: duelCommitment(s.duel!.id, 'a', 'rock', saltA),
  });
  expect(s.duel!.stage).toBe('reveal');
  expect(() =>
    reduceGame(s, { type: 'duel_reveal', playerId: 'a', choice: 'rock', salt: saltA }, () => {
      throw Error('shared randomness required');
    }),
  ).toThrow('shared randomness required');
  s = step(s, { type: 'duel_reveal', playerId: 'a', choice: 'rock', salt: saltA }, () => 0.9);
  expect(s.players[0]!.cash).toBe(1550000);
});
it('offers both added cards when they are drawn and preserves the deck', () => {
  for (const [id, phase] of [
    ['chance-23', 'alliance'],
    ['chance-24', 'duel'],
  ] as const) {
    const s = game();
    s.players[0]!.position = 0;
    const index = s.deck.indexOf(id);
    const r = step(
      s,
      { type: 'roll', playerId: 'a' },
      sequence(0, 0.2, (index + 0.1) / s.deck.length),
    );
    expect(r.phase).toBe(phase);
    expect(getLegalActions(r).length).toBeGreaterThan(0);
  }
});
