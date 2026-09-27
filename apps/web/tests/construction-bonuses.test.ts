// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { tutorialScene } from '../src/game/tutorial';
import { PurchaseDetails, purchaseOffer } from '../src/game/PurchaseOffer';
import { PlayerInventory } from '../src/game/AdventureHUD';
import { playerBonuses } from '../src/game/bonuses';
import { eventText } from '../src/game/journal';
import { reduceGame } from '@money-tour/engine';
import { actionSchema } from '../src/network/schema';
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
let root: Root;
afterEach(async () => {
  await act(() => root?.unmount());
  document.body.innerHTML = '';
});
it('reopens the purchase selector on an owned city and buys only missing houses', async () => {
  let state = tutorialScene('build');
  state.properties[5]!.level = 1;
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  const buy = vi.fn((level: number) => {
    const action = actionSchema.parse({ type: 'upgrade', playerId: 'p1', level });
    state = reduceGame(state, action).state;
  });
  await act(() =>
    root.render(createElement(PurchaseDetails, { state, onBuy: buy, onPass: vi.fn() })),
  );
  const tiers = host.querySelectorAll<HTMLButtonElement>('.purchase-levels button');
  expect(tiers[0]!.disabled).toBe(true);
  expect(tiers[1]!.disabled).toBe(true);
  await act(() => tiers[3]!.click());
  expect(host.querySelector('.purchase-cta')!.textContent).toContain('150 💵');
  const before = state.players[0]!.cash;
  await act(() => host.querySelector<HTMLButtonElement>('.purchase-cta')!.click());
  expect(buy).toHaveBeenCalledWith(3);
  expect(state.players[0]!.cash).toBe(before - 150);
  expect(state.phase).toBe('end');
  expect(purchaseOffer(state)).toBeNull();
});
it('offers readable bonus and malus instructions next to properties, and drops consumed tokens', async () => {
  const state = tutorialScene('build'),
    p = state.players[0]!;
  p.insurance = { tile: 5 };
  p.fraudLiability = 300;
  const held = state.config.cards.find((c) => c.effect === 'squatter')!;
  p.heldCards = [held.id];
  state.properties[5]!.roachTurns = 2;
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  const open = vi.fn();
  await act(() =>
    root.render(
      createElement(PlayerInventory, { state, player: p, onTile: vi.fn(), onBonus: open }),
    ),
  );
  const buttons = host.querySelectorAll<HTMLButtonElement>('.bonus-tokens button');
  expect(buttons.length).toBe(4);
  await act(() => buttons[0]!.click());
  expect(open.mock.calls[0]![0].description).toContain('uniquement Madrid');
  expect(open.mock.calls[0]![0].description).toContain('consommé');
  expect(playerBonuses(state, p).find((b) => b.title.includes('Cafards'))!.description).toContain(
    '2 retours',
  );
  delete p.insurance;
  expect(playerBonuses(state, p).some((b) => b.title.includes('Assurance'))).toBe(false);
});
it('announces secret participation without exposing amounts, hashes, salts or gestures', () => {
  const s = tutorialScene('auction');
  for (const actionType of ['auction_commit', 'auction_reveal', 'duel_commit', 'duel_reveal']) {
    const text = eventText(
      {
        type: 'player_action',
        playerId: 'p1',
        actionType,
        amount: 731,
        hash: 'private-hash',
        salt: 'private-salt',
        choice: 'scissors',
      },
      s,
    );
    expect(text).toContain('Vous');
    for (const secret of ['731', 'private-hash', 'private-salt', 'scissors'])
      expect(text).not.toContain(secret);
  }
});
