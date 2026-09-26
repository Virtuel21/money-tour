import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseBotAction } from '@money-tour/engine';
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
      data.set('money-tour.local.v1', value);
      expect(loadLocal()).toBeNull();
    }
  });
  it('migrates only the old cosmetic city palette and preserves the random stream', () => {
    const save = newLocal({
      players: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    });
    const legacy = structuredClone(save);
    legacy.state.config.version = 2;
    legacy.state.config.board[1]!.name = 'Clairport';
    legacy.state.config.board[1]!.color = '#85C7A5';
    persistLocal(legacy);
    expect(loadLocal()).toEqual(save);
    const action = { type: 'roll', playerId: 'a' } as const;
    expect(applyLocal(loadLocal()!, action).result.error).toBeUndefined();
    expect(applyLocal(loadLocal()!, action)).toEqual(applyLocal(save, action));
    legacy.state.config.initialCash += 1;
    persistLocal(legacy);
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
