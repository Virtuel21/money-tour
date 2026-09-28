import { expect, it } from 'vitest';
import { config, createGame } from '@money-tour/engine';
import { actionSchema } from '../src/network/schema';
import { execute, needsRandom } from '../src/network/session';
import { presentation } from '../src/game/presentation';
it('replays a buyout bundle without charging existing houses twice and presents only new construction', () => {
  const state = createGame({
    config: { ...config, shuffleStreets: false, adventures: false },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
  });
  state.phase = 'property';
  state.players[0]!.position = 5;
  state.properties[5] = { ownerId: 'b', level: 1, championships: 0 };
  const action = actionSchema.parse({ type: 'buyout', playerId: 'a', level: 3 }),
    command = { type: 'action', action } as const;
  expect(needsRandom(state, command)).toBe(false);
  const result = execute(state, command);
  expect(execute(structuredClone(state), command)).toEqual(result);
  expect(result.state.players.map((p) => p.cash)).toEqual([900, 1950]);
  const frames = presentation(state, result.state, result.events);
  expect(
    frames.filter((f) => f.cue.kind === 'build').map((f) => f.state.properties[5]!.level),
  ).toEqual([2, 3]);
  expect(frames.find((f) => f.cue.sound === 'purchase')!.state.properties[5]!.level).toBe(1);
  for (const level of [-1, 5, 1.2, null])
    expect(actionSchema.safeParse({ type: 'buyout', playerId: 'a', level }).success).toBe(false);
  expect(
    actionSchema.safeParse({ type: 'buyout', playerId: 'a', level: 3, price: 1 }).success,
  ).toBe(false);
});
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

it.each(['resort', 'hotel'])(
  'replays a %s buyout and its festival and insurance identically on peers',
  (kind) => {
    const state = createGame({
      config: { ...config, shuffleStreets: false, adventures: false, festivalCount: 0 },
      players: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    });
    const tile =
      kind === 'resort'
        ? state.config.board.find((t) => t.type === 'resort')!
        : state.config.board[5]!;
    state.players[0]!.cash = 10000;
    state.players[0]!.position = tile.id;
    state.phase = 'property';
    state.properties[tile.id] = { ownerId: 'b', level: kind === 'hotel' ? 4 : 0, championships: 0 };
    let left = state,
      right = structuredClone(state);
    const replay = (input: unknown) => {
      const command = { type: 'action', action: actionSchema.parse(input) } as const;
      const a = execute(left, command),
        b = execute(right, command);
      expect(a).toEqual(b);
      left = a.state;
      right = b.state;
    };
    replay({ type: 'buyout', playerId: 'a' });
    expect(left.properties[tile.id]!.ownerId).toBe('a');
    left.phase = right.phase = 'championship';
    replay({ type: 'place_championship', playerId: 'a', tile: tile.id });
    expect(left.properties[tile.id]!.championships).toBe(1);
    left.players[0]!.insurance = { tile: null };
    right.players[0]!.insurance = { tile: null };
    replay({ type: 'insure', playerId: 'a', tile: tile.id });
    expect(left.players[0]!.insurance).toEqual({ tile: tile.id });
  },
);
