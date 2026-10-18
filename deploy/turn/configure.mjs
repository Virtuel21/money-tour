import { randomBytes } from 'node:crypto';
import { mkdir, writeFile, access, copyFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export function turnFiles({
  host,
  ip,
  origin,
  tls = false,
  secret = randomBytes(32).toString('hex'),
}) {
  if (
    !/^(?=.{1,253}$)[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/i.test(host ?? '') ||
    isIP(ip ?? '') !== 4 ||
    new URL(origin).origin !== origin ||
    !origin.startsWith('https://') ||
    !/^[a-f0-9]{64}$/.test(secret)
  )
    throw new Error(
      'Provide --host turn.example.com --ip PUBLIC_IPV4 --origin https://virtuel21.github.io',
    );
  const urls = [`turn:${host}:3478?transport=udp`, `turn:${host}:3478?transport=tcp`];
  if (tls) urls.push(`turns:${host}:5349?transport=tcp`);
  const conf =
    [
      'listening-port=3478',
      'listening-ip=0.0.0.0',
      `external-ip=${ip}`,
      'min-port=49160',
      'max-port=49671',
      `realm=${host}`,
      'fingerprint',
      'use-auth-secret',
      `static-auth-secret=${secret}`,
      'stale-nonce=600',
      'user-quota=96',
      'total-quota=512',
      'max-bps=131072',
      'bps-capacity=15728640',
      'no-multicast-peers',
      'no-cli',
      'no-tcp-relay',
      // Private destinations are blocked. Public relay-to-relay connections remain possible.
      'denied-peer-ip=0.0.0.0-0.255.255.255',
      'denied-peer-ip=10.0.0.0-10.255.255.255',
      'denied-peer-ip=100.64.0.0-100.127.255.255',
      'denied-peer-ip=127.0.0.0-127.255.255.255',
      'denied-peer-ip=169.254.0.0-169.254.255.255',
      'denied-peer-ip=172.16.0.0-172.31.255.255',
      'denied-peer-ip=192.168.0.0-192.168.255.255',
      'denied-peer-ip=::',
      'denied-peer-ip=::1',
      'denied-peer-ip=fc00::-fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      'denied-peer-ip=fe80::-febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      'log-file=stdout',
      'simple-log',
      'pidfile=/tmp/turnserver.pid',
      ...(tls
        ? ['tls-listening-port=5349', 'cert=/etc/coturn/cert.pem', 'pkey=/etc/coturn/key.pem']
        : ['no-tls']),
    ].join('\n') + '\n';
  const env = `TURN_HOST=${host}\nTURN_SECRET=${secret}\nTURN_URLS=${urls.join(',')}\nALLOWED_ORIGINS=${origin}\n`;
  return { conf, env };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = Object.fromEntries(
    Array.from({ length: (process.argv.length - 2) / 2 }, (_, i) =>
      process.argv.slice(2 + i * 2, 4 + i * 2),
    ),
  );
  if (!!args['--cert'] !== !!args['--key'])
    throw new Error('Both --cert and --key are required for TLS.');
  const files = turnFiles({
    host: args['--host'],
    ip: args['--ip'],
    origin: args['--origin'],
    tls: !!args['--cert'],
  });
  const root = fileURLToPath(new URL('./', import.meta.url));
  // Do not silently rotate a live installation's secret or overwrite its settings.
  try {
    await access(path.join(root, '.env'));
    throw new Error('Existing .env: keep it, or move it before generating a new installation.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(path.join(root, 'generated'), { recursive: true, mode: 0o700 });
  if (args['--cert']) {
    await copyFile(args['--cert'], path.join(root, 'generated/cert.pem'));
    await copyFile(args['--key'], path.join(root, 'generated/key.pem'));
  }
  await writeFile(path.join(root, 'generated/turnserver.conf'), files.conf, { mode: 0o600 });
  const owner = `TURN_UID=${process.getuid?.() ?? 1000}\nTURN_GID=${process.getgid?.() ?? 1000}\n`;
  await writeFile(path.join(root, '.env'), files.env + owner, { mode: 0o600, flag: 'wx' });
  console.log(
    `Configuration created. Run: docker compose -f deploy/turn/compose.yml up -d --build\nPublic endpoint: https://${args['--host']}/credentials\nSecrets are saved locally and were not printed.`,
  );
}
