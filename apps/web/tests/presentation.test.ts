import { expect, it } from 'vitest';
import { createGame, legacyConfig, type GameConfig } from '@money-tour/engine';
import { presentation, presentationMs } from '../src/game/presentation';

const game = () =>
  createGame({
    config: legacyConfig as GameConfig,
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
    seed: 1,
  });
it('shows the tax notice after arriving, before money leaves the payer account', () => {
  const before = game(),
    after = structuredClone(before);
  before.players[0]!.position = 10;
  after.players[0]!.position = 11;
  after.players[0]!.cash -= 50000;
  const frames = presentation(before, after, [
    { type: 'move', playerId: 'a', tile: 11, steps: 1 },
    { type: 'tax_notice', playerId: 'a', tile: 11, amount: 50000 },
    { type: 'payment', payerId: 'a', amount: 50000, reason: 'tax' },
  ]);
  expect(frames.map((f) => f.cue.kind)).toEqual(['hop', 'tax', 'money', 'settle']);
  expect(frames[1]!.state.players[0]!.cash).toBe(before.players[0]!.cash);
  expect(frames[2]!.state.players[0]!.cash).toBe(after.players[0]!.cash);
  expect(frames[2]!.cue.sound).toBe('coin-out');
});
it('keeps the result hidden until dice settle, hops across start and then reveals the card', () => {
  const before = game();
  before.players[0]!.position = 26;
  const after = structuredClone(before);
  after.players[0]!.position = 2;
  after.dice = [2, 2];
  const frames = presentation(before, after, [
    { type: 'dice', dice: [2, 2] },
    { type: 'move', playerId: 'a', tile: 2, steps: 4 },
    { type: 'card', cardId: 'chance-01' },
  ]);
  expect(frames[0]!.cue.kind).toBe('dice');
  expect(frames[0]!.state.dice).toEqual([]);
  expect(frames.filter((f) => f.cue.kind === 'hop').map((f) => f.cue.to)).toEqual([27, 0, 1, 2]);
  expect(frames.at(-2)!.cue.kind).toBe('card');
  expect(before.players[0]!.position).toBe(26);
  expect(frames.at(-1)!.state).toBe(after);
});
it('animates a backwards Chance move in the right direction and keeps reduced motion bounded', () => {
  const before = game();
  before.players[0]!.position = 1;
  const after = structuredClone(before);
  after.players[0]!.position = 26;
  const frames = presentation(
    before,
    after,
    [{ type: 'move', playerId: 'a', tile: 26, steps: -3 }],
    true,
  );
  expect(frames.filter((f) => f.cue.kind === 'hop').map((f) => f.cue.to)).toEqual([0, 27, 26]);
  expect(frames.reduce((sum, f) => sum + f.cue.duration, 0)).toBeLessThan(200);
});
it('does not animate clock ticks or mutate authoritative building state', () => {
  const before = game(),
    after = structuredClone(before);
  expect(presentation(before, after, [])).toEqual([]);
  after.properties[1]!.level = 1;
  const frames = presentation(before, after, [{ type: 'build', tile: 1 }]);
  expect(frames[0]!.cue.kind).toBe('build');
  expect(frames[0]!.state.properties[1]!.level).toBe(1);
  expect(before.properties[1]!.level).toBe(0);
});

it('shows the payer debit and creditor credit together, with a visible rent cue', () => {
  const before = game(),
    after = structuredClone(before);
  after.players[0]!.cash -= 25000;
  after.players[1]!.cash += 25000;
  const frames = presentation(before, after, [
    { type: 'payment', playerId: 'b', payerId: 'a', amount: 25000, reason: 'rent', tile: 1 },
  ]);
  expect(frames[0]!.cue).toMatchObject({
    kind: 'money',
    playerId: 'b',
    payerId: 'a',
    amount: 25000,
    reason: 'rent',
  });
  expect(frames[0]!.state.players.map((p) => p.cash)).toEqual(after.players.map((p) => p.cash));
  expect(before.players[0]!.cash).toBe(1500000);
});
it('animates income from cards, start and liquidation, but never invents zero-value coins', () => {
  const before = game(),
    after = structuredClone(before);
  const frames = presentation(
    before,
    after,
    [
      { type: 'income', playerId: 'a', amount: 100000 },
      { type: 'start_bonus', playerId: 'a', amount: 300000 },
      { type: 'sale', playerId: 'a', amount: 50000, tile: 1 },
      { type: 'payment', amount: 0 },
    ],
    true,
  );
  expect(frames.filter((f) => f.cue.kind === 'money').map((f) => f.cue.amount)).toEqual([
    100000, 300000, 50000,
  ]);
  expect(frames.filter((f) => f.cue.kind === 'money').every((f) => f.cue.duration <= 350)).toBe(
    true,
  );
});
it('identifies the card reader and announces the next player after resolution', () => {
  const before = game(),
    after = structuredClone(before);
  after.currentPlayer = 1;
  after.turn = 2;
  const frames = presentation(before, after, [
    { type: 'card', playerId: 'a', cardId: 'chance-17' },
    { type: 'turn', playerId: 'b' },
  ]);
  expect(frames[0]!.cue.playerId).toBe('a');
  expect(frames[1]!.cue).toMatchObject({ kind: 'turn', playerId: 'b' });
  expect(frames[1]!.state.currentPlayer).toBe(1);
});

it('credits the departure bonus at the actual forward crossing, not before the hops', () => {
  const before = game(),
    after = structuredClone(before);
  before.players[0]!.position = 26;
  after.players[0]!.position = 2;
  after.players[0]!.cash += 300000;
  const frames = presentation(before, after, [
    { type: 'start_bonus', playerId: 'a', amount: 300000 },
    { type: 'move', playerId: 'a', tile: 2, steps: 4 },
  ]);
  expect(
    frames
      .slice(0, 3)
      .map((f) => [f.cue.kind, f.state.players[0]!.position, f.state.players[0]!.cash]),
  ).toEqual([
    ['hop', 27, 1500000],
    ['hop', 0, 1500000],
    ['money', 0, 1800000],
  ]);
  expect(frames[2]!.cue.sound).toBe('coin-in');
});
it('plays outgoing coins for purchases and taxes without crediting the payer', () => {
  const before = game(),
    after = structuredClone(before);
  const frames = presentation(before, after, [
    { type: 'purchase', playerId: 'a', tile: 1, amount: 100000 },
    { type: 'payment', payerId: 'a', amount: 50000, reason: 'tax' },
  ]);
  const cash = frames.filter((f) => f.cue.kind === 'money');
  expect(cash.map((f) => f.state.players[0]!.cash)).toEqual([1400000, 1350000]);
  expect(cash.every((f) => f.cue.sound === 'coin-out' && !f.cue.playerId)).toBe(true);
});

it('keeps event notices five seconds longer, including reduced-motion mode', () => {
  const s = game();
  for (const reduced of [false, true]) {
    const frames = presentation(s, s, [{ type: 'crisis', message: 'Crise économique' }], reduced);
    expect(frames.find((f) => f.cue.kind === 'notice')!.cue.duration).toBe(
      (reduced ? 800 : 2600) + 5000,
    );
    expect(presentationMs([{ type: 'crisis' }])).toBe(7600);
    expect(presentationMs([{ type: 'auction_started' }])).toBe(7600);
  }
});
