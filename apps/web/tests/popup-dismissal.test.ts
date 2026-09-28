// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { usePresentation } from '../src/game/usePresentation';
import { useSpectatorDialog } from '../src/game/useSpectatorDialog';
import { tutorialScene } from '../src/game/tutorial';
import type { GameEvent } from '@money-tour/engine';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
it.each([
  { type: 'card', playerId: 'p1', cardId: 'chance-01' },
  { type: 'tax_notice', playerId: 'p1', amount: 50 },
  { type: 'casino_result', playerId: 'p1', game: 'roulette' },
  { type: 'auction_started', playerId: 'p1', message: 'Offer' },
  { type: 'payment', payerId: 'p1', playerId: 'p2', amount: 50, reason: 'rent' },
] as GameEvent[])(
  'dismisses $type only for one online viewer without shortening either clock',
  async (event) => {
    vi.useFakeTimers();
    const state = tutorialScene('card'),
      before = structuredClone(state);
    const viewers: ReturnType<typeof usePresentation>[] = [];
    function Viewer({ index }: { index: number }) {
      const cinema = usePresentation(state, false, true);
      viewers[index] = cinema;
      return !cinema.dismissed && cinema.busy
        ? createElement('button', { onClick: cinema.dismiss }, cinema.frame.cue.kind)
        : null;
    }
    const host = document.createElement('div');
    const root = createRoot(host);
    try {
      await act(() =>
        root.render(
          createElement(
            'div',
            null,
            createElement(Viewer, { index: 0 }),
            createElement(Viewer, { index: 1 }),
          ),
        ),
      );
      await act(() =>
        viewers.forEach((v) =>
          v.present(state, [event, { type: 'auction_result', message: 'Next' }]),
        ),
      );
      const duration = viewers[0]!.frame.cue.duration;
      expect(host.querySelectorAll('button')).toHaveLength(2);
      await act(() => {
        vi.advanceTimersByTime(100);
        host.querySelector('button')!.click();
      });
      expect(host.querySelectorAll('button')).toHaveLength(1);
      expect(viewers[0]!.dismissed).toBe(true);
      expect(viewers[1]!.dismissed).toBe(false);
      expect(viewers[0]!.busy).toBe(true);
      expect(viewers[0]!.frame).toEqual(viewers[1]!.frame);
      await act(() => vi.advanceTimersByTime(duration - 101));
      expect(viewers[0]!.dismissed).toBe(true);
      await act(() => vi.advanceTimersByTime(1));
      expect(viewers.every((v) => !v.dismissed)).toBe(true);
      expect(viewers[0]!.frame).toEqual(viewers[1]!.frame);
      expect(host.querySelectorAll('button')).toHaveLength(2);
      await act(() => vi.runAllTimers());
      expect(viewers.every((v) => !v.busy)).toBe(true);
      expect(state).toEqual(before);
    } finally {
      await act(() => root.unmount());
      vi.useRealTimers();
    }
  },
);
it('still advances local reading popups on dismissal', async () => {
  const state = tutorialScene('card');
  let cinema!: ReturnType<typeof usePresentation>;
  function Viewer() {
    cinema = usePresentation(state, false, false);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  try {
    await act(() => root.render(createElement(Viewer)));
    await act(() => cinema.present(state, [{ type: 'card', playerId: 'p1', cardId: 'chance-01' }]));
    await act(() => cinema.dismiss());
    expect(cinema.frame.cue.kind).toBe('settle');
  } finally {
    await act(() => root.unmount());
  }
});
it('keeps spectator dismissal local through ticks and reopens when that viewer must decide', async () => {
  const viewers: ReturnType<typeof useSpectatorDialog>[] = [];
  function Viewer({
    index,
    spectator,
    keyId,
  }: {
    index: number;
    spectator: boolean;
    keyId: string;
  }) {
    viewers[index] = useSpectatorDialog(keyId, spectator);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  const render = (spectator = true, keyId = 'duel:offer:b') =>
    act(() =>
      root.render(
        createElement(
          'div',
          null,
          createElement(Viewer, { index: 0, spectator, keyId }),
          createElement(Viewer, { index: 1, spectator: false, keyId }),
        ),
      ),
    );
  try {
    await render();
    await act(() => viewers[0]!.onClose!());
    await render();
    expect(viewers[0]!.hidden).toBe(true);
    expect(viewers[1]!.hidden).toBe(false);
    expect(viewers[1]!.onClose).toBeUndefined();
    await render(false);
    expect(viewers[0]!.hidden).toBe(false);
    await render(true, 'duel:accept:a');
    expect(viewers[0]!.hidden).toBe(false);
    await act(() => viewers[0]!.onClose!());
    await act(() => viewers[0]!.reopen());
    expect(viewers[0]!.hidden).toBe(false);
  } finally {
    await act(() => root.unmount());
  }
});
