import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { qaServer } from './qa-server.mjs';
import { credentialConfig, credentialServer, credentials } from '../deploy/turn/server.mjs';

const out = path.resolve(process.env.TURN_QA_OUT ?? 'artifacts/turn-qa');
await fs.mkdir(out, { recursive: true });
const app = await qaServer(process.env.TURN_QA_URL, 4183);
const real = process.env.TURN_QA_REAL === '1';
const result = { checks: [], errors: [], realRelay: real };
const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
  ],
});
let api;
// Local in-memory Nostr signaling avoids public relay availability in this test.
// The game's real WebRTC transport and real Coturn data path are preserved.
const sockets = new Set(),
  events = new Map();
async function context(language = 'fr', viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript((language) => {
    localStorage.setItem('money-tour.language.v1', language);
    window.turnQaPeers = [];
    const Original = window.RTCPeerConnection;
    window.RTCPeerConnection = class extends Original {
      constructor(...args) {
        super(...args);
        window.turnQaPeers.push(this);
      }
    };
  }, language);
  await ctx.routeWebSocket(/^wss:\/\//, (socket) => {
    const client = { socket, subs: new Map() };
    sockets.add(client);
    const matches = (event, filters) =>
      filters.some(
        (f) =>
          (!f.kinds || f.kinds.includes(event.kind)) &&
          (!f['#x'] || event.tags.some(([tag, value]) => tag === 'x' && f['#x'].includes(value))),
      );
    socket.onClose(() => sockets.delete(client));
    socket.onMessage((data) => {
      const [type, ...args] = JSON.parse(String(data));
      if (type === 'REQ') {
        const [id, ...filters] = args;
        client.subs.set(id, filters);
        for (const event of events.values())
          if (matches(event, filters)) socket.send(JSON.stringify(['EVENT', id, event]));
        socket.send(JSON.stringify(['EOSE', id]));
      } else if (type === 'CLOSE') client.subs.delete(args[0]);
      else if (type === 'EVENT') {
        const event = args[0];
        events.set(event.id, event);
        socket.send(JSON.stringify(['OK', event.id, true, '']));
        for (const other of sockets)
          for (const [id, filters] of other.subs)
            if (matches(event, filters)) other.socket.send(JSON.stringify(['EVENT', id, event]));
      }
    });
  });
  return ctx;
}
async function screenshot(page, name) {
  await page.screenshot({ path: path.join(out, name + '.png'), fullPage: false });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > innerWidth + 2 ||
      [...document.querySelectorAll('dialog[open], dialog[open] .modal-body')].some(
        (e) => e.scrollWidth > e.clientWidth + 2,
      ),
  );
  assert.equal(overflow, false, `${name}: horizontal overflow`);
  result.checks.push(name);
}
async function fillManual(page, server) {
  await page
    .getByLabel('Adresse TURN', { exact: true })
    .fill(Array.isArray(server.urls) ? server.urls.join(', ') : server.urls);
  await page.getByLabel('Identifiant TURN', { exact: true }).fill(server.username);
  await page.getByLabel('Mot de passe TURN', { exact: true }).fill(server.credential);
}
try {
  for (const [language, width, height] of [
    ['fr', 1280, 900],
    ['fr', 390, 844],
    ['en', 320, 740],
    ['en', 844, 390],
  ]) {
    const ctx = await context(language, { width, height });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => result.errors.push(e.message));
    await page.goto(app.url);
    const button = page.getByRole('button', {
      name: language === 'fr' ? 'Créer un serveur TURN' : 'Create a TURN server',
      exact: true,
    });
    await button.click();
    await page
      .getByLabel(language === 'fr' ? 'Votre nom' : 'Your name', { exact: true })
      .fill('Camille');
    await screenshot(page, `${language}-${width}x${height}-manual`);
    if (language === 'fr') {
      await page.getByRole('button', { name: 'Créer le salon avec TURN', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Configurez un serveur TURN' }).waitFor();
      result.checks.push('missing TURN blocks room creation');
    }
    await page
      .getByLabel(language === 'fr' ? 'Méthode de configuration' : 'Configuration method')
      .selectOption('service');
    await screenshot(page, `${language}-${width}x${height}-service`);
    await ctx.close();
  }
  if (real) {
    const config = credentialConfig({
      TURN_SECRET: process.env.TURN_SECRET,
      TURN_URLS: 'turn:127.0.0.1:3478?transport=udp,turn:127.0.0.1:3478?transport=tcp',
      ALLOWED_ORIGINS: new URL(app.url).origin,
    });
    api = credentialServer(config);
    await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve));
    const endpoint = `http://127.0.0.1:${api.address().port}/credentials`;
    for (const mode of ['manual', 'service']) {
      const ctx = await context();
      const host = await ctx.newPage();
      await host.goto(app.url);
      await host.getByRole('button', { name: 'Créer un serveur TURN', exact: true }).click();
      await host.getByLabel('Votre nom', { exact: true }).fill('Camille');
      await fillManual(host, credentials(config).iceServers[0]);
      await host.getByRole('button', { name: 'Tester le serveur TURN', exact: true }).click();
      await host
        .getByRole('status')
        .filter({ hasText: 'Allocation réussie' })
        .waitFor({ timeout: 20000 });
      result.checks.push('real TURN allocation through manual UI');
      if (mode === 'service') {
        await host.getByLabel('Méthode de configuration').selectOption('service');
        await host.getByLabel('URL du service TURN').fill(endpoint);
      }
      await host.getByRole('button', { name: 'Créer le salon avec TURN', exact: true }).click();
      const invite = host.getByRole('textbox', { name: 'Lien d’invitation', exact: true });
      await invite.waitFor();
      const link = await invite.inputValue();
      assert.ok(link.includes('relay=1'));
      assert.equal(link.includes(config.secret), false);
      const guestContext = await context();
      const guest = await guestContext.newPage();
      await guest.goto(link);
      if (mode === 'service')
        assert.equal(await guest.getByLabel('URL du service TURN').inputValue(), endpoint);
      else await fillManual(guest, credentials(config).iceServers[0]);
      await guest.getByLabel('Votre nom', { exact: true }).fill('Alex');
      await guest.getByRole('button', { name: 'Rejoindre le salon', exact: true }).click();
      await host
        .locator('.lobby-members li')
        .filter({ hasText: 'Alex' })
        .waitFor({ timeout: 45000 });
      await guest
        .locator('.lobby-members li')
        .filter({ hasText: 'Camille' })
        .waitFor({ timeout: 45000 });
      const pairs = await host.evaluate(async () => {
        const result = [];
        for (const peer of window.turnQaPeers) {
          const stats = await peer.getStats();
          for (const stat of stats.values())
            if (stat.type === 'transport' && stat.selectedCandidatePairId) {
              const pair = stats.get(stat.selectedCandidatePairId);
              result.push({
                local: stats.get(pair.localCandidateId)?.candidateType,
                remote: stats.get(pair.remoteCandidateId)?.candidateType,
              });
            }
        }
        return result;
      });
      assert.ok(
        pairs.some((pair) => pair.local === 'relay' && pair.remote === 'relay'),
        JSON.stringify(pairs),
      );
      result.checks.push('two real Trystero peers connected through relay/relay candidate pair');
      await screenshot(host, 'connected-turn-room-' + mode);
      await host.getByRole('button', { name: 'Lancer la partie', exact: true }).click();
      await host.locator('.board-canvas canvas').first().waitFor({ timeout: 45000 });
      await guest.locator('.board-canvas canvas').first().waitFor({ timeout: 45000 });
      result.checks.push('both peers start the game through TURN');
      await guestContext.close();
      await ctx.close();
    }
  }
  assert.deepEqual(result.errors, []);
  console.log(JSON.stringify(result));
} finally {
  await fs.writeFile(path.join(out, 'results.json'), JSON.stringify(result, null, 2));
  await browser.close();
  if (api) await new Promise((resolve) => api.close(resolve));
  app.close();
}
