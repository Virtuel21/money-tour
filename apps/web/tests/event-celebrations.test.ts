// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { createGame, monopolyGroups, reduceGame, type GameAction } from '@money-tour/engine';
import { eventCelebrations } from '../src/game/celebrations';
import { EventCelebration } from '../src/game/EventCelebration';
import { presentation, type Cue } from '../src/game/presentation';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
const game = () =>
  createGame({
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
    seed: 1,
  });

it('celebrates the actual hotel build once, never an intermediate house or a hotel buyout', () => {
  const before = game(),
    after = structuredClone(before);
  after.properties[1]!.ownerId = 'a';
  after.properties[1]!.level = after.config.hotelLevel;
  const events = [1, 2, 3, 4].map((level) => ({ type: 'build', playerId: 'a', tile: 1, level }));
  const items = eventCelebrations(before, after, events);
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ kind: 'hotel', eventIndex: 3, tile: 1 });
  expect(eventCelebrations(after, after, [{ type: 'buyout', tile: 1, playerId: 'b' }])).toEqual([]);
  expect(eventCelebrations(before, after, [])).toEqual([]);
});

it.each([
  { type: 'buy', initialLevel: 0, ownerId: null, expectedDelay: 8800 },
  { type: 'buyout', initialLevel: 2, ownerId: 'b', expectedDelay: 4400 },
  { type: 'upgrade', initialLevel: 3, ownerId: 'a', expectedDelay: 0 },
] as const)(
  'celebrates the real $type reducer result once its hotel build is presented',
  ({ type, initialLevel, ownerId, expectedDelay }) => {
    const before = game();
    const tile = before.config.board.find((item) => item.type === 'city')!.id;
    before.phase = 'property';
    before.players[0]!.position = tile;
    before.players[0]!.laps = before.config.hotelUnlockLaps ?? 2;
    before.players[0]!.cash = 10000000;
    before.properties[tile] = { ownerId, level: initialLevel, championships: 0 };
    const action: GameAction = { type, playerId: 'a', level: before.config.hotelLevel };
    const result = reduceGame(before, action);
    expect(result.error).toBeUndefined();
    expect(result.state.properties[tile]!.level).toBe(before.config.hotelLevel);
    const hotels = eventCelebrations(before, result.state, result.events).filter(
      (item) => item.kind === 'hotel',
    );
    expect(hotels).toHaveLength(1);
    expect(result.events[hotels[0]!.eventIndex]).toMatchObject({
      type: 'build',
      level: before.config.hotelLevel,
    });
    const frames = presentation(before, result.state, result.events);
    const frameIndex = frames.findIndex((frame) =>
      frame.cue.celebrations?.some((item) => item.kind === 'hotel'),
    );
    expect(frameIndex).toBeGreaterThanOrEqual(0);
    expect(frames[frameIndex]!.state.properties[tile]!.level).toBe(before.config.hotelLevel);
    expect(frames.slice(0, frameIndex).reduce((ms, frame) => ms + frame.cue.duration, 0)).toBe(
      expectedDelay,
    );
    if (type === 'buy') {
      const fast = presentation(before, result.state, result.events, false, 'fast');
      const fastIndex = fast.findIndex((frame) =>
        frame.cue.celebrations?.some((item) => item.kind === 'hotel'),
      );
      expect(fast.slice(0, fastIndex).reduce((ms, frame) => ms + frame.cue.duration, 0)).toBe(3800);
    }
  },
);

it('never inaugurates an existing hotel when the real reducer transfers its ownership', () => {
  const before = game();
  const tile = before.config.board.find((item) => item.type === 'city')!.id;
  before.phase = 'property';
  before.players[0]!.position = tile;
  before.players[0]!.laps = before.config.hotelUnlockLaps ?? 2;
  before.players[0]!.cash = 10000000;
  before.properties[tile] = { ownerId: 'b', level: before.config.hotelLevel, championships: 0 };
  const result = reduceGame(before, {
    type: 'buyout',
    playerId: 'a',
    level: before.config.hotelLevel,
  });
  expect(result.error).toBeUndefined();
  expect(result.state.properties[tile]!.ownerId).toBe('a');
  expect(
    eventCelebrations(before, result.state, result.events).filter((item) => item.kind === 'hotel'),
  ).toEqual([]);
});

it.each(['city', 'resort'])(
  'celebrates a completed %s collection only on its final ownership change',
  (type) => {
    const before = game();
    const group = monopolyGroups(before.config).find((items) => items[0]!.type === type)!;
    for (const tile of group.slice(0, -1)) before.properties[tile.id]!.ownerId = 'a';
    const after = structuredClone(before);
    const tile = group.at(-1)!.id;
    after.properties[tile]!.ownerId = 'a';
    const events = [{ type: 'auction_result', tile, playerId: 'a', message: 'Adjugé' }];
    expect(eventCelebrations(before, after, events)).toMatchObject([{ kind: 'collection' }]);
    expect(eventCelebrations(after, after, events)).toEqual([]);
    expect(eventCelebrations(before, after, [])).toEqual([]);
  },
);

it('combines teammates without inventing a second celebration for an internal transfer', () => {
  const before = game();
  before.mode = 'teams';
  before.players.forEach((player) => (player.team = 1));
  const group = monopolyGroups(before.config)[0]!;
  group.forEach((tile, i) => (before.properties[tile.id]!.ownerId = i % 2 ? 'b' : 'a'));
  const after = structuredClone(before);
  const tile = group[0]!.id;
  after.properties[tile]!.ownerId = 'b';
  expect(eventCelebrations(before, after, [{ type: 'buyout', playerId: 'b', tile }])).toEqual([]);
});

it('shows insurance consumption as nonmodal feedback instead of a long notice', () => {
  const before = game();
  const frames = presentation(before, before, [{ type: 'insured', tile: 1, playerId: 'a' }]);
  expect(frames.some((frame) => frame.cue.kind === 'notice')).toBe(false);
  expect(frames[0]!.cue.celebrations).toMatchObject([{ kind: 'insurance', tile: 1 }]);
  expect(frames.reduce((sum, frame) => sum + frame.cue.duration, 0)).toBeLessThan(1000);
});

it('pauses feedback lifetime, keeps reduced-motion text, and never replays the same cue', async () => {
  vi.useFakeTimers();
  const state = game();
  const cue: Cue = {
    kind: 'settle',
    duration: 700,
    celebrations: eventCelebrations(state, state, [{ type: 'insured', tile: 1, playerId: 'a' }]),
  };
  const container = document.createElement('div');
  const root = createRoot(container);
  const render = (paused: boolean, nextCue = cue) =>
    root.render(createElement(EventCelebration, { cue: nextCue, state, reduced: true, paused }));
  try {
    await act(() => render(false));
    expect(container.textContent).toContain('assurance consommée');
    expect(container.querySelector('.motion-reduced')).not.toBeNull();
    expect(container.querySelector('button')).toBeNull();
    await act(() => vi.advanceTimersByTime(1000));
    await act(() => render(true));
    await act(() => vi.advanceTimersByTime(10000));
    expect(container.textContent).toContain('Propriété protégée');
    await act(() => render(false));
    await act(() => vi.advanceTimersByTime(1800));
    expect(container.textContent).toBe('');
    await act(() => render(false, { ...cue }));
    expect(container.textContent).toBe('');
  } finally {
    await act(() => root.unmount());
    vi.useRealTimers();
  }
});
