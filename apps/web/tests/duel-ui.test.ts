// @vitest-environment happy-dom
import { act, createElement, StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { createGame, duelCommitment, reduceGame, type GameAction } from '@money-tour/engine';
import { DuelView } from '../src/game/DuelView';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
afterEach(() => sessionStorage.clear());
const game = () => {
  const state = createGame({
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
  });
  state.phase = 'duel';
  state.duel = {
    id: 'test-duel',
    challengerId: 'a',
    targetId: 'b',
    amount: 50,
    stage: 'commit',
    escrow: true,
    commitments: {},
    reveals: {},
  };
  return state;
};

it('resolves a shared-screen duel after one choice per player without a reveal click', async () => {
  let latest = game();
  const actions: GameAction[] = [];
  function Harness() {
    const [state, setState] = useState(latest);
    return state.duel
      ? createElement(DuelView, {
          state,
          act: (action: GameAction) => {
            actions.push(action);
            const result = reduceGame(state, action);
            expect(result.error).toBeUndefined();
            latest = result.state;
            setState(latest);
          },
        })
      : null;
  }
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    await act(() => root.render(createElement(Harness)));
    await act(() => host.querySelectorAll<HTMLButtonElement>('.duel-choices button')[0]!.click());
    expect(latest.duel!.stage).toBe('commit');
    expect(latest.duel!.reveals).toEqual({});
    await act(() => host.querySelectorAll<HTMLButtonElement>('.duel-choices button')[2]!.click());
    expect(actions.map((a) => a.type)).toEqual([
      'duel_commit',
      'duel_commit',
      'duel_reveal',
      'duel_reveal',
    ]);
    expect(latest.phase).toBe('end');
    expect(latest.duel).toBeUndefined();
  } finally {
    await act(() => root.unmount());
  }
});

it('restores the secret, waits for network readiness and reveals only once on its own turn', async () => {
  const state = game();
  const salt = 'a'.repeat(32);
  state.duel!.stage = 'reveal';
  state.duel!.commitments.a = duelCommitment(state.duel!.id, 'a', 'rock', salt);
  sessionStorage.setItem('money-tour.duel.test-duel.a', JSON.stringify({ choice: 'rock', salt }));
  const send = vi.fn();
  const host = document.createElement('div');
  const root = createRoot(host);
  const render = (self: string, disabled = false) =>
    act(() =>
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(DuelView, { state: structuredClone(state), self, disabled, act: send }),
        ),
      ),
    );
  try {
    await render('b');
    expect(send).not.toHaveBeenCalled();
    await render('a', true);
    expect(send).not.toHaveBeenCalled();
    await render('a');
    await render('a');
    expect(send).toHaveBeenCalledExactlyOnceWith({
      type: 'duel_reveal',
      playerId: 'a',
      choice: 'rock',
      salt,
    });
    expect(host.textContent).not.toContain('Révéler mon choix');
  } finally {
    await act(() => root.unmount());
  }
});

it.each([null, '{bad json', JSON.stringify({ choice: 'paper', salt: 'b'.repeat(32) })])(
  'keeps a visible recovery action if the saved secret is missing or invalid: %s',
  async (saved) => {
    const state = game();
    state.duel!.stage = 'reveal';
    state.duel!.commitments.a = duelCommitment(state.duel!.id, 'a', 'rock', 'a'.repeat(32));
    if (saved) sessionStorage.setItem('money-tour.duel.test-duel.a', saved);
    const send = vi.fn();
    const host = document.createElement('div');
    const root = createRoot(host);
    try {
      await act(() => root.render(createElement(DuelView, { state, self: 'a', act: send })));
      expect(send).not.toHaveBeenCalled();
      expect(host.querySelector('[role=alert]')!.textContent).toContain('plus disponible');
      await act(() => host.querySelector<HTMLButtonElement>('button')!.click());
      expect(send).toHaveBeenCalledWith({ type: 'duel_cancel', playerId: 'a' });
    } finally {
      await act(() => root.unmount());
    }
  },
);
