// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { config, createGame, reduceGame } from '@money-tour/engine';
import { PurchaseDetails } from '../src/game/PurchaseOffer';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
let root: Root;
afterEach(async () => {
  await act(() => root?.unmount());
  document.body.innerHTML = '';
});
const game = () => {
  const state = createGame({
    config: { ...config, shuffleStreets: false, festivalCount: 0, adventures: false },
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ],
  });
  state.phase = 'property';
  state.players[0]!.position = 5;
  return state;
};
it('shows rent on each tier and buys exactly the chosen three houses with their total price', async () => {
  let state = game();
  const onBuy = vi.fn((level: number) => {
    state = reduceGame(state, { type: 'buy', playerId: 'a', level }).state;
  });
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(() => root.render(createElement(PurchaseDetails, { state, onBuy, onPass: vi.fn() })));
  const cards = [...host.querySelectorAll<HTMLButtonElement>('.purchase-levels button')];
  expect(cards.map((card) => card.querySelector('.level-rent')!.textContent)).toEqual([
    'Loyer 15 💵',
    'Loyer 30 💵',
    'Loyer 60 💵',
    'Loyer 105 💵',
    'Loyer 180 💵',
  ]);
  expect(cards[4]!.disabled).toBe(true);
  await act(() => cards[3]!.click());
  expect(cards[3]!.getAttribute('aria-pressed')).toBe('true');
  expect(cards[3]!.querySelector('.level-check svg')).not.toBeNull();
  expect(host.querySelector('.purchase-wallet')!.textContent).toContain('Après achat 1 125 💵');
  const buy = host.querySelector<HTMLButtonElement>('.purchase-cta')!;
  expect(buy.textContent).toContain('Acheter avec 3 maisons · 375');
  await act(() => buy.click());
  expect(onBuy).toHaveBeenCalledWith(3);
  expect(state.properties[5]).toMatchObject({ ownerId: 'a', level: 3 });
  expect(state.players[0]!.cash).toBe(1125);
});
it('allows an unlocked hotel but prevents a bundle exceeding the balance', async () => {
  const state = game();
  state.players[0]!.laps = 5;
  state.players[0]!.cash = 400;
  const onBuy = vi.fn();
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(() => root.render(createElement(PurchaseDetails, { state, onBuy, onPass: vi.fn() })));
  const hotel = host.querySelectorAll<HTMLButtonElement>('.purchase-levels button')[4]!;
  expect(hotel.disabled).toBe(false);
  await act(() => hotel.click());
  const buy = host.querySelector<HTMLButtonElement>('.purchase-cta')!;
  expect(buy.textContent).toContain('450');
  expect(buy.disabled).toBe(true);
  expect(host.querySelector('[role=status]')!.textContent).toContain('Il manque 50');
  await act(() => buy.click());
  expect(onBuy).not.toHaveBeenCalled();
  await act(() => host.querySelectorAll<HTMLButtonElement>('.purchase-levels button')[2]!.click());
  expect(buy.disabled).toBe(false);
  await act(() => buy.click());
  expect(onBuy).toHaveBeenCalledWith(2);
});
