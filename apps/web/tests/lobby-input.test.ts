// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import OnlineLobby from '../src/network/OnlineLobby';
import type { SessionView } from '../src/network/session';

const mocked = vi.hoisted(() => ({
  joins: vi.fn(),
  closes: vi.fn(),
  instances: [] as { onChange: (view: SessionView) => void }[],
}));
vi.mock('../src/network/trystero', () => ({ TrysteroTransport: class {} }));
vi.mock('../src/network/crypto', () => ({
  identity: async () => ({ id: 'guest-id' }),
  secret: () => 'f'.repeat(32),
}));
vi.mock('../src/network/session', () => ({
  Session: class {
    onChange = (_view: SessionView) => {};
    onPersist = () => {};
    constructor(
      _transport: unknown,
      _user: unknown,
      public name: string,
      public creator: boolean,
    ) {
      mocked.instances.push(this);
    }
    async join(code: string) {
      await mocked.joins(code, this.name, this.creator);
    }
    close() {
      mocked.closes();
    }
  },
}));
let root: Root;
afterEach(async () => {
  await act(() => root?.unmount());
  document.body.innerHTML = '';
  localStorage.clear();
  sessionStorage.clear();
  mocked.joins.mockClear();
  mocked.closes.mockClear();
  mocked.instances.length = 0;
});
it('can reconnect after opening connection help while a join is still pending', async () => {
  history.replaceState(null, '', `/#room=${'b'.repeat(32)}`);
  const element = document.createElement('div');
  document.body.append(element);
  root = createRoot(element);
  let finishJoin!: () => void;
  mocked.joins.mockImplementationOnce(() => new Promise<void>((resolve) => (finishJoin = resolve)));
  const onSession = vi.fn();
  await act(() =>
    root.render(
      createElement(OnlineLobby, {
        open: true,
        defaults: { name: 'Camille', count: 2, teams: false, minutes: 20 },
        onClose: vi.fn(),
        onView: vi.fn(),
        onLeave: vi.fn(),
        onSession,
      }),
    ),
  );
  const submit = () =>
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await act(submit);
  await act(() =>
    mocked.instances[0]!.onChange({
      state: null,
      members: [],
      host: '',
      self: 'guest-id',
      connected: [],
      busy: false,
      status: 'Recherche de l’hôte…',
      incidents: [],
      hash: '',
      epoch: 0,
      events: [],
      blocked: false,
    }),
  );
  await act(() =>
    [...element.querySelectorAll('button')]
      .find((button) => button.textContent === 'Aide à la connexion')!
      .click(),
  );
  expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
  await act(() => finishJoin());
  expect(onSession).not.toHaveBeenCalled();
  await act(submit);
  expect(mocked.joins).toHaveBeenCalledTimes(2);
  expect(onSession).toHaveBeenCalledTimes(1);
});
it('asks an invited player only for their name, joins the invitation, and can retry the same room', async () => {
  const code = 'a'.repeat(32);
  history.replaceState(null, '', `/#room=${code}`);
  const element = document.createElement('div');
  document.body.append(element);
  root = createRoot(element);
  await act(() =>
    root.render(
      createElement(OnlineLobby, {
        open: true,
        onClose: vi.fn(),
        onView: vi.fn(),
        onLeave: vi.fn(),
        onSession: vi.fn(),
      }),
    ),
  );
  expect(element.querySelectorAll('input')).toHaveLength(1);
  expect(element.textContent).not.toContain('Créer un salon');
  const input = element.querySelector('input')!;
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
      input,
      'Camille',
    );
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(() =>
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  );
  expect(mocked.joins).toHaveBeenCalledWith(code, 'Camille', false);
  const waiting = {
    state: null,
    members: [],
    host: '',
    self: 'guest-id',
    connected: [],
    busy: false,
    status: 'Recherche de l’hôte…',
    incidents: [],
    hash: '',
    epoch: 0,
    events: [],
    blocked: false,
  };
  await act(() => mocked.instances[0]!.onChange(waiting));
  expect(element.textContent).not.toContain('CODE D’INVITATION');
  await act(() =>
    [...element.querySelectorAll('button')]
      .find((b) => b.textContent === 'Réessayer la connexion')!
      .click(),
  );
  expect(mocked.closes).toHaveBeenCalledTimes(1);
  expect(mocked.joins).toHaveBeenCalledTimes(2);
  await act(() =>
    mocked.instances[1]!.onChange({
      ...waiting,
      host: 'host-id',
      members: [{ id: 'guest-id', name: 'Camille', key: {}, order: 1 }],
    }),
  );
  expect(element.textContent).toContain('Camille');
  expect(element.textContent).toContain('CODE D’INVITATION');
});
