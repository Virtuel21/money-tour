import { expect, it } from 'vitest';
import { config, createGame } from '@money-tour/engine';
import { actionSchema } from '../src/network/schema';
import { execute, needsRandom } from '../src/network/session';
import { presentation } from '../src/game/presentation';
it('replays one selected building purchase identically on both peers and presents all its levels', () => {
  const state = createGame({
    config: { ...config, shuffleStreets: false, adventures: false },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
  });
  state.phase = 'property';
  state.players[0]!.position = 5;
  const action = actionSchema.parse({ type: 'buy', playerId: 'a', level: 3 }),
    command = { type: 'action', action } as const;
  expect(needsRandom(state, command)).toBe(false);
  const r = execute(state, command);
  expect(execute(JSON.parse(JSON.stringify(state)), command)).toEqual(r);
  expect(r.state.properties[5]!.level).toBe(3);
  expect(r.state.players[0]!.cash).toBe(1125);
  const frames = presentation(state, r.state, r.events);
  expect(
    frames.filter((f) => f.cue.kind === 'build').map((f) => f.state.properties[5]!.level),
  ).toEqual([1, 2, 3]);
  expect(frames[0]!.state.properties[5]!.level).toBe(0);
  expect(frames.at(-1)!.state).toEqual(r.state);
  for (const level of [-1, 5, 1.2, null])
    expect(actionSchema.safeParse({ type: 'buy', playerId: 'a', level }).success).toBe(false);
  expect(actionSchema.safeParse({ type: 'buy', playerId: 'a', level: 3, price: 1 }).success).toBe(
    false,
  );
});
