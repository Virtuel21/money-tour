import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseBotAction, legacyConfig, legacyConfigV6, type GameConfig } from '@money-tour/engine';
import { applyLocal, loadLocal, newLocal, persistLocal } from '../src/game/local';

describe('local session', () => {
  const data = new Map<string, string>();
  beforeEach(() => {
    data.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('preserves the shuffled 26-cell edition and resumes it unchanged', () => {
    const save = newLocal({
      config: legacyConfigV6 as GameConfig,
      players: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    });
    data.set('money-tour.local.v6', JSON.stringify(save));
    expect(loadLocal()).toEqual(save);
    expect(loadLocal()!.state.config.board).toHaveLength(26);
  });
  it('migrates the previous edition without losing money, positions or the random stream', () => {
    const old = newLocal({
      config: legacyConfig as GameConfig,
      players: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    });
    old.state.config.version = 4;
    delete old.state.config.championshipDuration;
    old.state.players[0]!.cash = 876543;
    old.state.players[0]!.position = 12;
    old.state.seq = 23;
    old.state.properties[1] = { ownerId: 'a', level: 2, championships: 3 };
    const raw = JSON.stringify(old);
    data.set('money-tour.local.v4', raw);
    const resumed = loadLocal()!;
    expect(resumed.state.config.version).toBe(5);
    expect(resumed.seed).toBe(old.seed);
    expect(resumed.state.seq).toBe(23);
    expect(resumed.state.players).toEqual(old.state.players);
    expect(resumed.state.properties[1]).toEqual({
      ownerId: 'a',
      level: 2,
      championships: 1,
      championshipTurns: 4,
    });
    expect(data.get('money-tour.local.v4')).toBe(raw);
    old.state.properties[1]!.championships = -1;
    data.set('money-tour.local.v4', JSON.stringify(old));
    expect(loadLocal()).toBeNull();
  });
  it('resumes the exact same random stream after serialization', () => {
    let save = newLocal({
      players: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    });
    for (let i = 0; i < 80 && !save.state.winner; i++) {
      expect(persistLocal(save)).toBe(true);
      const action = chooseBotAction(save.state);
      const resumed = applyLocal(loadLocal()!, action);
      const uninterrupted = applyLocal(save, action);
      expect(resumed).toEqual(uninterrupted);
      save = uninterrupted.save;
    }
  });
  it('rejects corrupted or incompatible saves', () => {
    for (const value of [
      'bad',
      'null',
      '{}',
      '{"version":2}',
      '{"version":1,"seed":"x","state":{}}',
    ]) {
      data.set('money-tour.local.v7', value);
      expect(loadLocal()).toBeNull();
    }
  });
  it('preserves the previous board save and rejects old topology in the new slot', () => {
    const save = newLocal({
      players: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    });
    data.set('money-tour.local.v1', 'old game preserved');
    persistLocal(save);
    expect(data.get('money-tour.local.v1')).toBe('old game preserved');
    expect(loadLocal()).toEqual(save);
    save.state.config.version = 3;
    persistLocal(save);
    expect(loadLocal()).toBeNull();
  });
  it('handles denied storage without crashing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    });
    expect(loadLocal()).toBeNull();
    expect(
      persistLocal(
        newLocal({
          players: [
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
          ],
        }),
      ),
    ).toBe(false);
  });
});
