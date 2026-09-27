// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { tutorialScene } from '../src/game/tutorial';
import { PlayerInventory } from '../src/game/AdventureHUD';
import { MobilePocket } from '../src/game/MobilePocket';
import { TauntMenu } from '../src/game/TauntMenu';
import { estateGroups } from '../src/game/estate';
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
let root: Root;
afterEach(async () => {
  await act(() => root?.unmount());
  document.body.innerHTML = '';
});
const mount = () => {
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  return host;
};
it('keeps streets together on desktop and paginates whole streets on mobile with the targeted malus', async () => {
  const state = tutorialScene('build');
  Object.values(state.properties).forEach((p) => (p.ownerId = null));
  for (const id of [1, 2, 3, 4, 5, 6]) state.properties[id]!.ownerId = 'p1';
  state.properties[5]!.level = 4;
  state.properties[5]!.roachTurns = 2;
  expect(estateGroups(state, 'p1').map(([name]) => name)).toEqual([
    'Rue 1',
    'Rue 2',
    'Îles privées',
  ]);
  const host = mount(),
    open = vi.fn();
  await act(() =>
    root.render(createElement(PlayerInventory, { state, player: state.players[0]!, onTile: open })),
  );
  expect([...host.querySelectorAll('.estate-street h4')].map((e) => e.textContent)).toEqual([
    'Rue 1',
    'Rue 2',
    'Îles privées',
  ]);
  expect(host.querySelector('.roach-badge')!.closest('button')!.textContent).toContain('Madrid');
  expect(host.querySelector('.roach-badge')!.textContent).toContain('2 tours');
  await act(() => root.render(createElement(MobilePocket, { state, self: 'p1', onTile: open })));
  expect(host.querySelectorAll('.pocket-cities button')).toHaveLength(3);
  await act(() => host.querySelector<HTMLButtonElement>('[aria-label="Page suivante"]')!.click());
  expect(host.querySelector('.pocket-cities h3')!.textContent).toBe('Rue 2');
  expect(host.querySelector('.roach-badge')!.textContent).toContain('2 tours');
  await act(() => host.querySelector<HTMLButtonElement>('.pocket-cities button')!.click());
  expect(open).toHaveBeenCalledWith(5);
});
it.each([0, 1, 2, 3])(
  'uses the sender face for seat %i and disables all choices during cooldown',
  async (seat) => {
    const state = tutorialScene('build'),
      host = mount(),
      send = vi.fn();
    state.players = Array.from({ length: 4 }, (_, i) => ({
      ...state.players[0]!,
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
    }));
    const props = {
      state,
      playerId: state.players[seat]!.id,
      targetId: state.players[(seat + 1) % 4]!.id,
      cooling: false,
      onSend: send,
    };
    await act(() => root.render(createElement(TauntMenu, props)));
    expect(host.querySelectorAll('.taunt-options img')).toHaveLength(5);
    for (const img of host.querySelectorAll('img'))
      expect(img.getAttribute('src')).toContain(`/taunts/${seat}-`);
    await act(() =>
      host.querySelector<HTMLButtonElement>('[aria-label="Merci pour le loyer !"]')!.click(),
    );
    expect(send).toHaveBeenCalledWith('cash');
    await act(() => root.render(createElement(TauntMenu, { ...props, cooling: true })));
    expect([...host.querySelectorAll('button')].every((b) => b.disabled)).toBe(true);
  },
);
