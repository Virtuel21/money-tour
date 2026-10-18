import { createServer } from 'node:http';
import { createHmac, randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function credentialConfig(env = process.env) {
  const secret = env.TURN_SECRET ?? '';
  const urls = (env.TURN_URLS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origins = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    secret.length < 32 ||
    !urls.length ||
    urls.some((s) => !/^turns?:[^\s]+$/.test(s)) ||
    !origins.length ||
    origins.some((s) => new URL(s).origin !== s)
  )
    throw new Error('Invalid TURN_SECRET, TURN_URLS or ALLOWED_ORIGINS.');
  return { secret, urls, origins, ttl: 21600 };
}

export function credentials(config, now = Date.now()) {
  const username = `${Math.floor(now / 1000) + config.ttl}:${randomBytes(12).toString('hex')}`;
  return {
    iceServers: [
      {
        urls: config.urls,
        username,
        credential: createHmac('sha1', config.secret).update(username).digest('base64'),
      },
    ],
    ttl: config.ttl,
  };
}

export function credentialServer(config) {
  const clients = new Map();
  let windowStart = Date.now(),
    total = 0;
  return createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Vary', 'Origin');
    // Bound to loopback, behind the supplied Caddy proxy, which overwrites this header.
    const origin = req.headers.origin;
    if (!origin || !config.origins.includes(origin)) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.url !== '/credentials') {
      res.writeHead(404).end();
      return;
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    if (req.method !== 'GET') {
      res.writeHead(405, { Allow: 'GET, OPTIONS' }).end();
      return;
    }
    const now = Date.now();
    if (now - windowStart >= 60000) {
      windowStart = now;
      total = 0;
      clients.clear();
    }
    const client = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress;
    const used = clients.get(client) ?? 0;
    if (used >= 30 || total >= 300) {
      res.writeHead(429, { 'Retry-After': '60' }).end();
      return;
    }
    clients.set(client, used + 1);
    total++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(credentials(config, now)));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = credentialServer(credentialConfig());
  server.listen(8787, '127.0.0.1', () =>
    console.log('TURN credential service listening on loopback:8787'),
  );
}
