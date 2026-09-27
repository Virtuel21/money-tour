// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AuctionView } from '../src/game/AuctionView';
import { tutorialScene } from '../src/game/tutorial';

let root: Root;
afterEach(async () => {
  await act(() => root?.unmount());
  document.body.innerHTML = '';
  sessionStorage.clear();
});
it('keeps the typed offer and keyboard focus through repeated network busy/tick updates', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const state = tutorialScene('auction');
  const submit = vi.fn();
  const render = (disabled: boolean) =>
    act(() =>
      root.render(
        createElement(AuctionView, {
          state: structuredClone(state),
          self: 'p1',
          act: submit,
          disabled,
        }),
      ),
    );
  await render(false);
  const input = container.querySelector('input')!;
  input.focus();
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '73000');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  for (let i = 0; i < 5; i++) {
    await render(true);
    expect(container.querySelector('input')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('73000');
    await render(false);
  }
  const seal = [...container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Sceller'),
  )!;
  await act(() => seal.click());
  await act(() => seal.click());
  expect(submit.mock.calls[0]![0]).toEqual(submit.mock.calls[1]![0]);
  expect(submit.mock.calls[0]![0].type).toBe('auction_commit');
});
it('keeps local handover private and resets the form for the next player', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const state = tutorialScene('auction');
  await act(() =>
    root.render(createElement(AuctionView, { state, act: vi.fn(), disabled: false })),
  );
  expect(container.querySelector('input')).toBeNull();
  await act(() => container.querySelector('button')!.click());
  expect(container.querySelector('input')).not.toBeNull();
  state.auction!.passed.push('p1');
  await act(() =>
    root.render(
      createElement(AuctionView, { state: structuredClone(state), act: vi.fn(), disabled: false }),
    ),
  );
  expect(container.querySelector('input')).toBeNull();
  expect(container.textContent).toContain('Je suis Sacha');
});
