import { expect, it } from 'vitest';
import { reduceGame, type GameAction } from '@money-tour/engine';
import { tutorialScene } from '../src/game/tutorial';
import { presentation, presentationMs } from '../src/game/presentation';

it.each(['buy', 'upgrade', 'buyout'] as const)(
  'groups construction payment before the houses for %s, preserving balances and shared timing',
  (type) => {
    const before = tutorialScene('build');
    before.players[0]!.cash = 10000;
    before.properties[5]!.ownerId = type === 'buy' ? null : type === 'buyout' ? 'p2' : 'p1';
    before.properties[5]!.level = type === 'buy' ? 0 : 1;
    const original = structuredClone(before);
    const result = reduceGame(before, { type, playerId: 'p1', level: 3 } as GameAction);
    expect(result.error).toBeUndefined();
    for (const pace of ['normal', 'fast'] as const) {
      for (const reduced of [false, true]) {
        const frames = presentation(before, result.state, result.events, reduced, pace);
        const payments = frames.filter(
          (f) => f.cue.kind === 'money' && ['purchase', 'build'].includes(f.cue.reason ?? ''),
        );
        expect(payments).toHaveLength(1);
        const charged = result.events
          .filter((e) => ['purchase', 'build'].includes(e.type))
          .reduce((sum, e) => sum + (e.amount ?? 0), 0);
        expect(payments[0]!.cue.amount).toBe(charged);
        const builds = frames.filter((f) => f.cue.kind === 'build');
        expect(builds.map((f) => f.state.properties[5]!.level)).toEqual(
          type === 'buy' ? [1, 2, 3] : [2, 3],
        );
        expect(frames.indexOf(payments[0]!)).toBeLessThan(frames.indexOf(builds[0]!));
        expect(builds.every((f) => f.cue.duration <= 350)).toBe(true);
        if (type !== 'buyout')
          expect(payments[0]!.state.players[0]!.cash).toBe(before.players[0]!.cash - charged);
        expect(frames.at(-1)!.state).toEqual(result.state);
        expect(presentationMs(result.events, pace) + 100).toBeGreaterThanOrEqual(
          frames.reduce((sum, f) => sum + f.cue.duration, 0),
        );
      }
    }
    expect(before).toEqual(original);
  },
);
