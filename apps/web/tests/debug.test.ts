// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { config, createGame, createRng, reduceGame, validateState } from '@money-tour/engine';
import { applyLocal, loadLocal, newLocal, persistLocal } from '../src/game/local';
import {
  DEBUG_KEY,
  applyDebug,
  loadDebug,
  newDebug,
  parseDebug,
  persistDebug,
} from '../src/game/debug';
import { actionSchema } from '../src/network/schema';

afterEach(() => localStorage.clear());

it('creates a valid manual sandbox without overwriting the normal save', () => {
  const normal = newLocal({
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
  });
  expect(persistLocal(normal)).toBe(true);
  const sandbox = newDebug(normal);
  const updated = applyDebug(sandbox, {
    type: 'player',
    playerId: 'a',
    cash: 9876,
    laps: 7,
    bot: false,
  });
  expect(validateState(updated.state)).toEqual([]);
  expect(updated.state.players[0]).toMatchObject({ cash: 9876, laps: 7 });
  expect(normal.state.players[0]!.cash).toBe(config.initialCash);
  expect(persistLocal(updated)).toBe(false);
  expect(persistDebug(updated)).toBe(true);
  expect(loadLocal()).toEqual(normal);
  expect(loadDebug()!.state).toEqual(updated.state);
  expect(updated.debug).toEqual({ freezeTime: true, freezeBots: true });
});

it.each([
  'city',
  'resort',
  'tax',
  'chance',
  'duel',
  'casino',
  'travel',
  'championship',
  'insurance',
])('teleports through the real %s resolver with a valid resulting state', (type) => {
  const save = newDebug();
  const tile = save.state.config.board.find((t) => t.type === type)!;
  const next = applyDebug(save, { type: 'move', playerId: 'p2', tile: tile.id, resolve: true });
  expect(next.state.currentPlayer).toBe(1);
  expect(validateState(next.state)).toEqual([]);
  if (type !== 'chance') expect(next.state.players[1]!.position).toBe(tile.id);
  if (type === 'tax') expect(next.state.players[1]!.cash).toBeLessThan(save.state.players[1]!.cash);
  if (['city', 'resort'].includes(type)) expect(next.state.phase).toBe('property');
  if (type === 'duel') expect(next.state.duel!.challengerId).toBe('p2');
});

it('moves without charging rent, changes ownership and builds a hotel without normal locks', () => {
  let save = newDebug();
  save = applyDebug(save, { type: 'property', tile: 5, ownerId: 'p2', level: 4, festival: true });
  save = applyDebug(save, { type: 'move', playerId: 'p1', tile: 5, resolve: false });
  expect(save.state.players[0]!.cash).toBe(1500);
  expect(save.state.phase).toBe('roll');
  expect(save.state.properties[5]).toMatchObject({ ownerId: 'p2', level: 4, championships: 1 });
  const landed = applyDebug(save, { type: 'move', playerId: 'p1', tile: 5, resolve: true });
  expect(landed.state.players[0]!.cash).toBeLessThan(1500);
  expect(landed.state.players[1]!.cash).toBeGreaterThan(1500);
  expect(validateState(landed.state)).toEqual([]);
});

it('refunds escrow and clears pending decisions when taking over a turn', () => {
  let save = newDebug();
  const tile = save.state.config.board.find((t) => t.type === 'duel')!.id;
  save = applyDebug(save, { type: 'move', playerId: 'p1', tile, resolve: true });
  save = applyLocal(save, { type: 'duel_offer', playerId: 'p1', targetId: 'p2', amount: 100 }).save;
  save = applyLocal(save, { type: 'duel_accept', playerId: 'p2' }).save;
  expect(save.state.players[0]!.cash).toBe(1400);
  const next = applyDebug(save, { type: 'turn', playerId: 'p3' });
  expect(next.state.players[0]!.cash).toBe(1500);
  expect(next.state.players[1]!.cash).toBe(1500);
  expect(next.state.duel).toBeUndefined();
  expect(next.state.phase).toBe('roll');
  expect(validateState(next.state)).toEqual([]);
});

it('forces dice through normal movement, salary and double rules with repeatable random effects', () => {
  let save = newDebug();
  save = applyDebug(save, { type: 'move', playerId: 'p1', tile: 30, resolve: false });
  const restored = parseDebug(JSON.stringify(save));
  const command = { type: 'dice', values: [2, 2] } as const;
  const next = applyDebug(save, { ...command, values: [...command.values] });
  expect(next.state.dice).toEqual([2, 2]);
  expect(next.state.players[0]!.position).toBe(2);
  expect(next.state.players[0]!.cash).toBe(1800);
  expect(next.state.extraRoll).toBe(true);
  expect(applyDebug(restored, { ...command, values: [...command.values] })).toEqual(next);
});

it('presents genuine arrival events from the state before their effects', () => {
  const save = newDebug();
  const tile = save.state.config.board.find((t) => t.type === 'tax')!.id;
  let shownCash = 0;
  let types: string[] = [];
  const next = applyDebug(
    save,
    { type: 'move', playerId: 'p1', tile, resolve: true },
    (before, events) => {
      expect(before.players[0]!.position).toBe(tile);
      shownCash = before.players[0]!.cash;
      types = events.map((event) => event.type);
    },
  );
  expect(shownCash).toBe(1500);
  expect(next.state.players[0]!.cash).toBeLessThan(shownCash);
  expect(types).toContain('tax_notice');
  expect(types).toContain('payment');
});

it.each(['dice', 'winner', 'version'] as const)(
  'rejects an unusable imported %s before replacing a scenario',
  (field) => {
    const raw = JSON.parse(JSON.stringify(newDebug()));
    raw.state[field] = field === 'dice' ? [999] : field === 'winner' ? {} : 2;
    expect(() => parseDebug(JSON.stringify(raw))).toThrow();
  },
);

it('prepares held cards without duplication and draws the requested card on Chance', () => {
  let save = newDebug();
  const card = save.state.config.cards.find((c) => c.effect === 'fraud')!;
  save = applyDebug(save, { type: 'card', cardId: card.id });
  const tile = save.state.config.board.find((t) => t.type === 'chance')!.id;
  save = applyDebug(save, { type: 'move', playerId: 'p1', tile, resolve: true });
  expect(save.state.players[0]!.heldCards).toContain(card.id);
  save = applyDebug(save, { type: 'card', cardId: card.id });
  expect(save.state.players[0]!.heldCards).not.toContain(card.id);
  expect(save.state.deck[0]).toBe(card.id);
  expect(validateState(save.state)).toEqual([]);
});

it('applies custom rules, prices and festivals immediately and restores them after reload', () => {
  const save = newDebug();
  const rules = structuredClone(save.state.config);
  rules.startBonus = 777;
  rules.hotelUnlockLaps = 0;
  rules.festivalCount = 0;
  rules.board[5]!.price = 222;
  const next = applyDebug(save, { type: 'rules', config: rules });
  expect(next.state.config.startBonus).toBe(777);
  expect(next.state.config.board[5]!.price).toBe(222);
  expect(next.state.festivals).toEqual([]);
  expect(save.state.config.board[5]!.price).toBe(150);
  persistDebug(next);
  expect(loadDebug()!.state.config).toEqual(rules);
  expect(parseDebug(JSON.stringify(next))).toEqual(next);
});

it('can resume a finished scenario and adjust elapsed time without silently ticking', () => {
  const save = newDebug();
  save.state = reduceGame(
    save.state,
    { type: 'tick', elapsedMs: save.state.durationMs },
    createRng(1),
  ).state;
  expect(save.state.winner).not.toBeNull();
  const next = applyDebug(save, { type: 'turn', playerId: 'p2' });
  expect(next.state.winner).toBeNull();
  expect(next.state.elapsedMs).toBe(0);
  const clock = applyDebug(next, { type: 'clock', elapsedMs: 1234, durationMs: 99999 });
  expect(clock.state.elapsedMs).toBe(1234);
  expect(clock.state.durationMs).toBe(99999);
});

it('rejects malformed edits atomically and cannot send debug actions into the network', () => {
  const save = newDebug();
  const before = structuredClone(save);
  expect(() =>
    applyDebug(save, { type: 'player', playerId: 'p1', cash: -1, laps: 0, bot: false }),
  ).toThrow();
  expect(() =>
    applyDebug(save, { type: 'move', playerId: 'p1', tile: 32, resolve: true }),
  ).toThrow();
  expect(() => applyDebug(save, { type: 'dice', values: [0, 8] })).toThrow();
  expect(() =>
    applyDebug(save, { type: 'rules', config: { ...save.state.config, actionTimeoutMs: 0 } }),
  ).toThrow();
  expect(() =>
    applyDebug(save, { type: 'property', tile: 4, ownerId: 'p1', level: 4, festival: false }),
  ).toThrow();
  expect(save).toEqual(before);
  expect(() =>
    applyDebug(
      {
        version: 1,
        seed: 'normal',
        state: createGame({
          players: [
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
          ],
        }),
      },
      { type: 'turn', playerId: 'a' },
    ),
  ).toThrow();
  expect(
    actionSchema.safeParse({ type: 'move', playerId: 'p1', tile: 5, resolve: true }).success,
  ).toBe(false);
});

it.each(['{}', '{broken', '{"version":1,"debug":true}', 'x'.repeat(1_000_001)])(
  'rejects an invalid import without changing storage',
  (raw) => {
    expect(() => parseDebug(raw)).toThrow();
    localStorage.setItem(DEBUG_KEY, raw);
    expect(loadDebug()).toBeNull();
  },
);
