// @vitest-environment happy-dom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { auctionCommitment, reduceGame, type GameAction } from '@money-tour/engine';
import { useAuctionReveal } from '../src/game/useAuctionReveal';
import { useAuctionDialog } from '../src/game/useAuctionDialog';
import { saveAuctionOffer } from '../src/game/auctionOffers';
import { tutorialScene } from '../src/game/tutorial';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
afterEach(() => {
  vi.useRealTimers();
  sessionStorage.clear();
});
it('waits for the rendered board, allows closing/reopening, and ignores network ticks', async () => {
  vi.useFakeTimers();
  let ui!: ReturnType<typeof useAuctionDialog>;
  function View({ ready, decision = 'commit:p1' }: { ready: boolean; decision?: string }) {
    ui = useAuctionDialog('auction', decision, ready);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  try {
    await act(() => root.render(createElement(View, { ready: false })));
    await act(() => vi.advanceTimersByTime(5000));
    expect(ui.hidden).toBe(true);
    await act(() => root.render(createElement(View, { ready: true })));
    await act(() => vi.advanceTimersByTime(1799));
    expect(ui.hidden).toBe(true);
    await act(() => vi.advanceTimersByTime(1));
    expect(ui.hidden).toBe(false);
    await act(() => ui.close());
    await act(() => root.render(createElement(View, { ready: true })));
    expect(ui.hidden).toBe(true);
    await act(() => ui.reopen());
    expect(ui.hidden).toBe(false);
    await act(() => ui.close());
    await act(() => root.render(createElement(View, { ready: true, decision: 'commit:p2' })));
    expect(ui.hidden).toBe(false);
  } finally {
    await act(() => root.unmount());
  }
});
it.each([undefined, 'p1'])(
  'reveals automatically without an auction popup, self=%s',
  async (self) => {
    vi.useFakeTimers();
    let state = tutorialScene('auction');
    const id = state.auction!.id;
    const offer = { amount: 73, salt: 'a'.repeat(32) };
    saveAuctionOffer(id, 'p1', offer, 'auto-test');
    state = reduceGame(state, {
      type: 'auction_commit',
      playerId: 'p1',
      hash: auctionCommitment(id, 'p1', offer.amount, offer.salt),
    }).state;
    const submit = vi.fn();
    function View({ disabled = false }: { disabled?: boolean }) {
      useAuctionReveal(state, self, submit, disabled, 'auto-test');
      return null;
    }
    const root = createRoot(document.createElement('div'));
    try {
      await act(() => root.render(createElement(View)));
      expect(submit).not.toHaveBeenCalled(); // Other player has not committed yet.
      state = reduceGame(state, { type: 'auction_pass', playerId: 'p2' }).state;
      expect(state.auction!.stage).toBe('reveal');
      await act(() => root.render(createElement(View, { disabled: true })));
      expect(submit).not.toHaveBeenCalled();
      await act(() => root.render(createElement(View)));
      expect(submit).toHaveBeenCalledExactlyOnceWith({
        type: 'auction_reveal',
        playerId: 'p1',
        ...offer,
      });
      await act(() => vi.advanceTimersByTime(2000));
      expect(submit.mock.calls[1]![0]).toEqual(submit.mock.calls[0]![0]);
      state = reduceGame(state, submit.mock.calls[0]![0] as GameAction).state;
      await act(() => root.render(createElement(View)));
      await act(() => vi.advanceTimersByTime(4000));
      expect(submit).toHaveBeenCalledTimes(2);
      expect(state.auction).toBeUndefined();
      expect(state.properties[5]!.ownerId).toBe('p1');
    } finally {
      await act(() => root.unmount());
    }
  },
);
it('never reveals an opponent’s envelope or an envelope with the wrong commitment', async () => {
  let state = tutorialScene('auction');
  const offer = { amount: 73, salt: 'c'.repeat(32) };
  const id = state.auction!.id;
  state = reduceGame(state, {
    type: 'auction_commit',
    playerId: 'p1',
    hash: auctionCommitment(id, 'p1', offer.amount, offer.salt),
  }).state;
  state = reduceGame(state, { type: 'auction_pass', playerId: 'p2' }).state;
  saveAuctionOffer(id, 'p1', offer, 'private-test');
  const submit = vi.fn();
  function View({ self }: { self: string }) {
    useAuctionReveal(state, self, submit, false, 'private-test');
    return null;
  }
  const root = createRoot(document.createElement('div'));
  try {
    await act(() => root.render(createElement(View, { self: 'p2' })));
    expect(submit).not.toHaveBeenCalled();
    saveAuctionOffer(id, 'p1', { ...offer, amount: 99 }, 'private-test');
    await act(() => root.render(createElement(View, { self: 'p1' })));
    expect(submit).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
  }
});
