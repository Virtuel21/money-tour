// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { usePresentation } from '../src/game/usePresentation';
import { tutorialScene } from '../src/game/tutorial';

it('can dismiss an online card early without its old timer advancing the following cue', async () => {
  vi.useFakeTimers();
  const state = tutorialScene('card');
  let cinema!: ReturnType<typeof usePresentation>;
  function Harness() {
    cinema = usePresentation(state, false, true);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  try {
    await act(() => root.render(createElement(Harness)));
    await act(() =>
      cinema.present(state, [
        { type: 'card', playerId: 'p1', cardId: 'chance-01' },
        { type: 'auction_started', playerId: 'p1', message: 'Offer' },
      ]),
    );
    expect(cinema.frame.cue.kind).toBe('card');
    await act(() => {
      vi.advanceTimersByTime(1000);
      cinema.advance();
    });
    expect(cinema.frame.cue.kind).toBe('notice');
    await act(() => vi.advanceTimersByTime(4600));
    expect(cinema.frame.cue.kind).toBe('notice');
    await act(() => vi.runAllTimers());
    expect(cinema.busy).toBe(false);
    expect(cinema.frame.state).toEqual(state);
  } finally {
    await act(() => root.unmount());
    vi.useRealTimers();
  }
});
