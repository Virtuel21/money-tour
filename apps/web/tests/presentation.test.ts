import { expect, it } from 'vitest';
import { createGame } from '@money-tour/engine';
import { presentation } from '../src/game/presentation';

const game = () =>
  createGame({
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
    seed: 1,
  });
it('keeps the result hidden until dice settle, hops across start and then reveals the card', () => {
  const before = game();
  before.players[0]!.position = 30;
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
  expect(frames.filter((f) => f.cue.kind === 'hop').map((f) => f.cue.to)).toEqual([31, 0, 1, 2]);
  expect(frames.at(-2)!.cue.kind).toBe('card');
  expect(before.players[0]!.position).toBe(30);
  expect(frames.at(-1)!.state).toBe(after);
});
it('animates a backwards Chance move in the right direction and keeps reduced motion bounded', () => {
  const before = game();
  before.players[0]!.position = 1;
  const after = structuredClone(before);
  after.players[0]!.position = 30;
  const frames = presentation(
    before,
    after,
    [{ type: 'move', playerId: 'a', tile: 30, steps: -3 }],
    true,
  );
  expect(frames.filter((f) => f.cue.kind === 'hop').map((f) => f.cue.to)).toEqual([0, 31, 30]);
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
