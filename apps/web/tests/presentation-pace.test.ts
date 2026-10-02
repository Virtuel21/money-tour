// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { createGame, type GameEvent } from '@money-tour/engine';
import { presentation, presentationMs } from '../src/game/presentation';
import { usePresentation } from '../src/game/usePresentation';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
const game = () =>
  createGame({
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
    seed: 1,
  });

it('speeds up presentation independently from reduced motion, preserving reading and state', () => {
  const state = game();
  const original = structuredClone(state);
  const events: GameEvent[] = [
    { type: 'dice', dice: [2, 3] },
    { type: 'move', playerId: 'a', tile: 5, steps: 5 },
    { type: 'card', playerId: 'a', cardId: 'chance-01' },
    { type: 'tax_notice', playerId: 'a', amount: 20000 },
    { type: 'crisis', message: 'Crise' },
  ];
  const normal = presentation(state, state, events);
  const fast = presentation(state, state, events, false, 'fast');
  expect(fast.map((frame) => frame.state)).toEqual(normal.map((frame) => frame.state));
  expect(fast.find((frame) => frame.cue.kind === 'dice')!.cue.duration).toBe(600);
  expect(fast.find((frame) => frame.cue.kind === 'notice')!.cue.duration).toBe(2200);
  expect(normal.find((frame) => frame.cue.kind === 'notice')!.cue.duration).toBe(7600);
  for (const kind of ['card', 'tax'])
    expect(fast.find((frame) => frame.cue.kind === kind)!.cue.duration).toBe(
      normal.find((frame) => frame.cue.kind === kind)!.cue.duration,
    );
  expect(presentation(state, state, events, true, 'fast')[0]!.cue.duration).toBe(150);
  expect(state).toEqual(original);
});

it.each<GameEvent[]>([
  [
    { type: 'dice', dice: [2, 3] },
    { type: 'move', playerId: 'a', tile: 5, steps: 5 },
  ],
  [
    { type: 'purchase', playerId: 'a', tile: 1, amount: 1000 },
    { type: 'build', playerId: 'a', tile: 1, level: 1, amount: 2000 },
  ],
  [{ type: 'earthquake', tile: 1, message: 'Séisme' }],
  [{ type: 'insured', tile: 1, playerId: 'a' }],
  [{ type: 'sale', tile: 1, playerId: 'a', amount: 1000 }],
  [{ type: 'victory' }],
  [
    { type: 'card', cardId: 'chance-01' },
    { type: 'auction_started' },
    { type: 'auction_result', message: 'Résultat' },
  ],
])('keeps shared fast timing long enough for its visible frames: %j', (...events) => {
  const state = game();
  const frames = presentation(state, state, events, false, 'fast');
  // Session adds 100 ms between batches; final settle is 50 ms.
  expect(presentationMs(events, 'fast') + 100).toBeGreaterThanOrEqual(
    frames.reduce((ms, frame) => ms + frame.cue.duration, 0),
  );
});

it('freezes and resumes a local presentation with its remaining time', async () => {
  vi.useFakeTimers();
  const state = game();
  let cinema!: ReturnType<typeof usePresentation>;
  function Harness({ paused }: { paused: boolean }) {
    cinema = usePresentation(state, false, false, 'fast', paused);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  try {
    await act(() => root.render(createElement(Harness, { paused: false })));
    await act(() => cinema.present(state, [{ type: 'dice', dice: [1, 2] }]));
    await act(() => vi.advanceTimersByTime(200));
    await act(() => root.render(createElement(Harness, { paused: true })));
    await act(() => vi.advanceTimersByTime(10000));
    expect(cinema.frame.cue.kind).toBe('dice');
    await act(() => root.render(createElement(Harness, { paused: false })));
    await act(() => vi.advanceTimersByTime(399));
    expect(cinema.frame.cue.kind).toBe('dice');
    await act(() => vi.advanceTimersByTime(1));
    expect(cinema.frame.cue.kind).toBe('settle');
  } finally {
    await act(() => root.unmount());
    vi.useRealTimers();
  }
});

it('keeps local human card reading explicit even in fast mode', async () => {
  vi.useFakeTimers();
  const state = game();
  let cinema!: ReturnType<typeof usePresentation>;
  function Harness() {
    cinema = usePresentation(state, false, false, 'fast');
    return null;
  }
  const root = createRoot(document.createElement('div'));
  try {
    await act(() => root.render(createElement(Harness)));
    await act(() => cinema.present(state, [{ type: 'card', playerId: 'a', cardId: 'chance-01' }]));
    await act(() => vi.advanceTimersByTime(60000));
    expect(cinema.frame.cue.kind).toBe('card');
    await act(() => cinema.dismiss());
    await act(() => vi.runAllTimers());
    expect(cinema.busy).toBe(false);
  } finally {
    await act(() => root.unmount());
    vi.useRealTimers();
  }
});
