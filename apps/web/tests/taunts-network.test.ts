import { expect, it } from 'vitest';
import { MemoryNetwork, MemoryTransport } from '../src/network/transport';
import { Session } from '../src/network/session';
import { identity } from '../src/network/crypto';
import { bodySchema } from '../src/network/schema';
it('shares authenticated out-of-turn taunts, deduplicates, rate limits, and preserves game state', async () => {
  let now = 100000;
  const network = new MemoryNetwork();
  const host = new Session(
    new MemoryTransport('host', network),
    await identity(),
    'Host',
    true,
    () => now,
  );
  const guest = new Session(
    new MemoryTransport('guest', network),
    await identity(),
    'Guest',
    false,
    () => now,
  );
  const flush = async () => {
    for (let i = 0; i < 8; i++) {
      await network.flush();
      await host.idle();
      await guest.idle();
    }
  };
  try {
    await host.join('taunt-room', undefined, false);
    await guest.join('taunt-room', undefined, false);
    await network.flush();
    await host.idle();
    await guest.idle();
    await host.start(2, false, 1200000);
    await host.idle();
    await network.flush();
    await guest.idle();
    await flush();
    expect(host.state).not.toBeNull();
    expect(guest.state).toEqual(host.state);
    const before = JSON.stringify(host.state),
      hash = host.head;
    await guest.taunt('cash', host.user.id);
    await network.flush(false, true);
    await host.idle();
    expect(host.taunts).toHaveLength(1);
    expect(host.taunts[0]).toMatchObject({
      playerId: guest.user.id,
      kind: 'cash',
      targetId: host.user.id,
    });
    expect(guest.taunts).toHaveLength(1);
    expect(JSON.stringify(host.state)).toBe(before);
    expect(host.head).toBe(hash);
    await guest.taunt('cry');
    await network.flush();
    expect(host.taunts[0]!.kind).toBe('cash');
    now += 8000;
    await guest.taunt('crown');
    await network.flush();
    expect(host.taunts[0]!.kind).toBe('crown');
    now += 8000;
    await guest.taunt('kiss', 'unknown-player');
    await network.flush();
    expect(host.taunts[0]!.kind).toBe('crown');
    expect(bodySchema.safeParse({ type: 'taunt', kind: 'arbitrary text' }).success).toBe(false);
    expect(
      bodySchema.safeParse({ type: 'taunt', kind: 'cash', playerId: host.user.id }).success,
    ).toBe(false);
  } finally {
    host.close();
    guest.close();
  }
});
