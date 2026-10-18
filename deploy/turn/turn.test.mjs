import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { credentialConfig, credentials, credentialServer } from './server.mjs';
import { turnFiles } from './configure.mjs';

const fixture = {
  TURN_SECRET: 'test-only-'.repeat(8),
  TURN_URLS: 'turn:relay.example:3478',
  ALLOWED_ORIGINS: 'https://virtuel21.github.io',
};
test('issues time-limited Coturn REST credentials with the shared HMAC secret', () => {
  const config = credentialConfig(fixture);
  const a = credentials(config, 1700000000000),
    b = credentials(config, 1700000000000);
  assert.notEqual(a.iceServers[0].username, b.iceServers[0].username);
  const server = a.iceServers[0];
  assert.equal(server.username.split(':')[0], String(1700000000 + 21600));
  assert.equal(
    server.credential,
    createHmac('sha1', config.secret).update(server.username).digest('base64'),
  );
  assert.equal(JSON.stringify(a).includes(config.secret), false);
  assert.throws(() => credentialConfig({ ...fixture, TURN_SECRET: 'weak' }));
});
test('enforces origin, methods, no-store and per-client rate limits over real HTTP', async () => {
  const server = credentialServer(credentialConfig(fixture));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/credentials`;
  const headers = { Origin: fixture.ALLOWED_ORIGINS };
  try {
    assert.equal((await fetch(url)).status, 403);
    assert.equal((await fetch(url, { headers: { Origin: 'https://wrong.example' } })).status, 403);
    assert.equal((await fetch(url, { method: 'POST', headers })).status, 405);
    assert.equal((await fetch(url, { method: 'OPTIONS', headers })).status, 204);
    assert.equal((await fetch(url + '/missing', { headers })).status, 404);
    for (let i = 0; i < 30; i++) {
      const response = await fetch(url, { headers });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('access-control-allow-origin'), fixture.ALLOWED_ORIGINS);
      assert.equal((await response.json()).iceServers.length, 1);
    }
    assert.equal((await fetch(url, { headers })).status, 429);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
test('generates matching server secrets, quotas and TLS URLs only when certificates are supplied', () => {
  const args = {
    host: 'turn.example.com',
    ip: '203.0.113.10',
    origin: 'https://virtuel21.github.io',
    secret: 'a'.repeat(64),
  };
  const files = turnFiles(args);
  assert.ok(files.conf.includes('use-auth-secret\nstatic-auth-secret=' + args.secret));
  assert.ok(files.env.includes('TURN_SECRET=' + args.secret));
  assert.ok(files.conf.includes('denied-peer-ip=127.0.0.0-127.255.255.255'));
  assert.ok(files.conf.includes('total-quota=512'));
  assert.equal(files.env.includes('turns:'), false);
  assert.ok(
    turnFiles({ ...args, tls: true }).env.includes('turns:turn.example.com:5349?transport=tcp'),
  );
  assert.throws(() => turnFiles({ ...args, host: 'host\nuser=bad' }));
});
