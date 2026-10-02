// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { config, createGame } from '@money-tour/engine';
import { StrategyProgress } from '../src/game/StrategyProgress';
import { PropertyInsight } from '../src/game/PropertyInsight';
import { publicVictoryProgress } from '../src/game/strategy';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
let root: Root;
afterEach(async () => {
  await act(() => root?.unmount());
  document.body.innerHTML = '';
});

it('locates the whole collection or inspects the exact missing property without sending game actions', async () => {
  const state = createGame({
    config,
    players: [
      { id: 'a', name: 'Léa' },
      { id: 'b', name: 'Max' },
    ],
    seed: 'strategy-ui',
  });
  const group = publicVictoryProgress(state, 'a').groups[0]!;
  for (const tile of group.tiles.slice(1)) state.properties[tile.id]!.ownerId = 'a';
  state.properties[group.tiles[0]!.id]!.ownerId = 'b';
  const onHighlight = vi.fn(),
    onTile = vi.fn();
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(() =>
    root.render(
      createElement(StrategyProgress, {
        state,
        playerId: 'a',
        onHighlight,
        onTile,
        expanded: true,
      }),
    ),
  );
  expect(container.textContent).toContain('Argent disponible');
  expect(container.textContent).toContain('Patrimoine');
  const locate = container.querySelector<HTMLButtonElement>(
    `button[aria-label="Repérer ${group.label} sur le plateau"]`,
  )!;
  await act(() => locate.click());
  expect(onHighlight).toHaveBeenCalledWith(group.tiles.map((t) => t.id));
  const missing = [...container.querySelectorAll<HTMLButtonElement>('.strategy-destination')].find(
    (b) => b.textContent?.includes(group.tiles[0]!.name),
  )!;
  expect(missing.textContent).toContain('Max');
  await act(() => missing.click());
  expect(onTile).toHaveBeenCalledWith(group.tiles[0]!.id);
});

it('makes the last missing property strategic value visible alongside the real rent', async () => {
  const state = createGame({
    config,
    players: [
      { id: 'a', name: 'Léa' },
      { id: 'b', name: 'Max' },
    ],
    seed: 'property-ui',
  });
  const group = publicVictoryProgress(state, 'a').groups[0]!;
  for (const tile of group.tiles.slice(1)) state.properties[tile.id]!.ownerId = 'a';
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(() =>
    root.render(
      createElement(PropertyInsight, { state, tileId: group.tiles[0]!.id, playerId: 'a' }),
    ),
  );
  expect(container.textContent).toContain(group.label);
  expect(container.textContent).toContain('Disponible à l’achat');
  expect(container.textContent).toContain('Cette propriété compléterait votre collection.');
  expect(container.textContent).toContain('Loyer de base');
});
