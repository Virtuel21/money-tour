// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import {
  invitationLink,
  invitationTurn,
  rememberTurn,
  savedTurn,
  turnEndpoint,
} from '../src/network/turnSettings';
import { manualTurnServers, probeTurn } from '../src/network/ice';

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const code = 'a'.repeat(32);
it('shares the public endpoint and relay policy without adding credentials to the static request', () => {
  const settings = { endpoint: 'https://relay.example/credentials', relayOnly: true };
  const link = invitationLink('https://example.test/game/?v=1#old', code, settings);
  expect(new URL(link).search).toBe('?v=1');
  expect(invitationTurn(link)).toEqual(settings);
  expect(new URL(link).hash).toContain('room=' + code);
});
it('marks manual invitations so guests cannot silently join without the required TURN configuration', () => {
  const settings = { endpoint: '', relayOnly: true, manual: true };
  expect(invitationTurn(invitationLink('https://example.test', code, settings))).toEqual(settings);
  expect(invitationTurn('#room=' + code)).toBeNull();
});
it.each([
  'http://relay.example/credentials',
  'https://user:secret@relay.example',
  'https://relay.example/?key=secret',
  'https://relay.example/#secret',
  'javascript:alert(1)',
])('rejects unsafe or secret-bearing endpoint %s', (endpoint) => {
  expect(() => turnEndpoint(endpoint)).toThrow('HTTPS');
  expect(() => invitationTurn('#turn=' + encodeURIComponent(endpoint))).toThrow();
});
it('allows loopback HTTP for local testing and expires room settings after 24 hours', () => {
  const settings = { endpoint: turnEndpoint('http://127.0.0.1:8787/credentials'), relayOnly: true };
  rememberTurn(settings, code);
  expect(savedTurn(code)).toMatchObject(settings);
  expect(savedTurn('b'.repeat(32))).toBeNull();
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 86400001);
  expect(savedTurn(code)).toBeNull();
});
it('validates all manual URLs and requires both credential fields', () => {
  expect(
    manualTurnServers(
      'turn:relay.example:3478, turns:relay.example:5349?transport=tcp',
      ' user ',
      'pass',
    )[0],
  ).toEqual({
    urls: ['turn:relay.example:3478', 'turns:relay.example:5349?transport=tcp'],
    username: 'user',
    credential: 'pass',
  });
  expect(() => manualTurnServers('https://relay.example', 'user', 'pass')).toThrow('adresse');
  expect(() => manualTurnServers('turn:relay.example', '', 'pass')).toThrow('identifiant');
  expect(() => manualTurnServers('turn:relay.example', 'user', '')).toThrow('identifiant');
});
it('does not leave a peer connection open after success, timeout or cancellation', async () => {
  vi.useFakeTimers();
  const close = vi.fn();
  let peer: { onicecandidate: ((event: unknown) => void) | null };
  vi.stubGlobal(
    'RTCPeerConnection',
    class {
      onicecandidate = null;
      onicegatheringstatechange = null;
      constructor() {
        // Capture the browser mock so the test can deliver ICE events.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        peer = this;
      }
      close = close;
      createDataChannel() {}
      createOffer = async () => ({});
      setLocalDescription = async () => {};
    },
  );
  const servers = manualTurnServers('turn:relay.example', 'user', 'pass');
  const success = probeTurn(servers, new AbortController().signal);
  peer!.onicecandidate!({ candidate: { type: 'relay' } });
  await success;
  const controller = new AbortController();
  const cancelled = expect(probeTurn(servers, controller.signal)).rejects.toThrow('annulé');
  controller.abort();
  await cancelled;
  const timedOut = expect(probeTurn(servers, new AbortController().signal)).rejects.toThrow(
    'joignable',
  );
  await vi.advanceTimersByTimeAsync(12000);
  await timedOut;
  expect(close).toHaveBeenCalledTimes(3);
});

it('never persists unexpected credential properties', () => {
  rememberTurn(
    Object.assign(
      { endpoint: 'https://relay.example/credentials', relayOnly: true },
      { credential: 'must-not-save', username: 'must-not-save' },
    ),
    code,
  );
  expect(localStorage.getItem('money-tour.turn.v1' + code)).not.toContain('must-not-save');
});
