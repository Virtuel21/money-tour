// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { config, createGame, type GameState } from '@money-tour/engine';
import type { Taunt } from '../src/game/taunts';
import App from '../src/App';
const scene = vi.hoisted(() => ({ state: null as GameState | null, busy: false }));
vi.mock('../src/game/preview', () => ({
  previewScenario: () => ({ version: 1, seed: 'app-test', state: scene.state }),
}));
vi.mock('../src/game/usePresentation', () => ({
  usePresentation: () => ({
    frame: { state: scene.state, cue: { kind: 'hop', duration: 0 } },
    busy: scene.busy,
    present: vi.fn(),
    reset: vi.fn(),
    advance: vi.fn(),
  }),
}));
vi.mock('../src/board/Board3D', () => ({
  default: ({ onPlayer, taunt }: { onPlayer?: (id: string) => void; taunt?: Taunt }) =>
    createElement(
      'div',
      {},
      createElement('button', {
        'aria-label': 'Test pawn',
        disabled: !onPlayer,
        onClick: () => onPlayer?.('a'),
      }),
      taunt
        ? createElement('img', {
            className: 'pawn-taunt',
            alt: 'Taunt',
            src: taunt.playerId + '-' + taunt.kind,
          })
        : null,
    ),
}));
vi.mock('../src/audio/synth', () => ({
  loadAudio: () => ({ music: false, effects: false, volume: 0 }),
  Soundscape: class {
    configure() {}
    setScene() {}
    effect() {}
    close() {}
    stopEffects() {}
    async unlock() {}
  },
}));
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
let root: Root;
afterEach(async () => {
  await act(() => root?.unmount());
  document.body.innerHTML = '';
  vi.useRealTimers();
});
async function mount() {
  vi.useFakeTimers();
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root.render(createElement(App));
    await vi.dynamicImportSettled();
  });
  return host;
}
const game = () =>
  createGame({
    config: { ...config, shuffleStreets: false, adventures: false },
    players: [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ],
  });
it('opens the buyout picker from the game CTA without transferring the property first', async () => {
  scene.state = game();
  scene.busy = false;
  scene.state.phase = 'property';
  scene.state.players[0]!.position = 5;
  scene.state.properties[5] = { ownerId: 'b', level: 0, championships: 0 };
  const host = await mount();
  await act(() =>
    [...host.querySelectorAll('button')]
      .find((b) => b.textContent?.startsWith('Racheter'))!
      .click(),
  );
  expect(host.querySelector('.purchase-title')?.textContent).toContain('RACHETER CETTE VILLE');
  expect(scene.state.properties[5]!.ownerId).toBe('b');
  expect(host.querySelectorAll('.purchase-levels button')).toHaveLength(5);
});
it('opens while a bot animates, keeps the sender across turn changes and displays only the pawn image', async () => {
  scene.state = game();
  scene.state.players[1]!.bot = true;
  scene.state.currentPlayer = 1;
  scene.busy = true;
  const host = await mount();
  await act(() => host.querySelector<HTMLButtonElement>('[aria-label="Test pawn"]')!.click());
  expect(host.querySelector('.taunt-picker')!.textContent).toContain('Alice');
  scene.state = { ...scene.state, turn: scene.state.turn + 1 };
  await act(() => root.render(createElement(App)));
  expect(host.querySelector('.taunt-picker')!.textContent).toContain('Alice');
  await act(() =>
    host.querySelector<HTMLButtonElement>('[aria-label="Merci pour le loyer !"]')!.click(),
  );
  expect(host.querySelector('.taunt-picker')).toBeNull();
  expect(host.querySelectorAll('.pawn-taunt')).toHaveLength(1);
  expect(host.querySelector('.taunt-toast')).toBeNull();
  expect(host.textContent).not.toContain('Merci pour le loyer !');
  expect(host.querySelector('.pawn-taunt')!.getAttribute('src')).toBe('a-cash');
});
