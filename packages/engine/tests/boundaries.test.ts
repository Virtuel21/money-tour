import { describe, expect, it } from 'vitest';
import {
  config,
  createGame,
  createRng,
  getLegalActions,
  getNetWorth,
  getPropertyValue,
  getRent,
  reduceGame,
  validateState,
  type GameConfig,
} from '../src/index';
import { randomInt } from '../src/rng';
import { game, offer, own, sequence, step, type State } from './helpers';

describe('bounded randomness', () => {
  it('rejects the incomplete bucket, then returns an unbiased face', () => {
    expect(randomInt(sequence((2 ** 32 - 1) / 2 ** 32, 0.25), 6)).toBe(1);
  });
  it.each([0, -1, 1.5, Infinity, 2 ** 32 + 1])(
    'rejects invalid count %i before reading RNG',
    (count) => expect(() => randomInt(sequence(), count)).toThrow('range'),
  );
  it.each([-0.1, 1, NaN, Infinity])('rejects malformed entropy %i', (value) =>
    expect(() => randomInt(() => value, 6)).toThrow('finite'),
  );
  it('bounds a permanently rejecting injected source', () =>
    expect(() => randomInt(() => (2 ** 32 - 1) / 2 ** 32, 6)).toThrow('repeatedly'));
  it('has a reproducible default seed', () => expect(createRng()()).toBe(createRng()()));
});

describe('configuration validation before any randomness', () => {
  const players = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ];
  const cases: [string, (config: GameConfig) => void][] = [
    [
      'zero rule',
      (c) => {
        c.diceSides = 0;
      },
    ],
    [
      'unordered board',
      (c) => {
        c.board[1]!.id = 7;
      },
    ],
    [
      'missing coin',
      (c) => {
        c.board[8]!.type = 'chance';
      },
    ],
    [
      'missing start',
      (c) => {
        c.board[0]!.type = 'chance';
      },
    ],
    [
      'resale out of range',
      (c) => {
        c.resaleRate = 2;
      },
    ],
    [
      'negative tax',
      (c) => {
        c.taxRate = -1;
      },
    ],
    [
      'too many festivals',
      (c) => {
        c.festivalCount = 100;
      },
    ],
    [
      'fractional festivals',
      (c) => {
        c.festivalCount = 1.5;
      },
    ],
    [
      'invalid building cap',
      (c) => {
        c.initialMaxLevel = 5;
      },
    ],
    [
      'empty cards',
      (c) => {
        c.cards = [];
      },
    ],
    [
      'duplicated cards',
      (c) => {
        c.cards[1]!.id = c.cards[0]!.id;
      },
    ],
    [
      'negative price',
      (c) => {
        c.board[1]!.price = -1;
      },
    ],
    [
      'missing group',
      (c) => {
        delete c.board[1]!.group;
      },
    ],
    [
      'missing line',
      (c) => {
        delete c.board[1]!.line;
      },
    ],
    [
      'missing rents',
      (c) => {
        delete c.board[1]!.rents;
      },
    ],
    [
      'invalid cost',
      (c) => {
        c.board[1]!.buildCosts![1] = -1;
      },
    ],
  ];
  it.each(cases)('refuses %s', (_, mutate) => {
    const custom = structuredClone(config);
    mutate(custom);
    expect(() => createGame({ players, config: custom }, sequence())).toThrow();
  });
  it('refuses duplicate IDs, nameless players, invalid teams, and invalid durations', () => {
    expect(() => createGame({ players: [players[0]!, players[0]!] }, sequence())).toThrow('unique');
    expect(() => createGame({ players: [players[0]!, { id: 'b', name: '' }] }, sequence())).toThrow(
      'unique',
    );
    expect(() => createGame({ players, mode: 'teams' }, sequence())).toThrow('teams');
    expect(() => createGame({ players, durationMs: 0 }, sequence())).toThrow('Duration');
    expect(() => createGame({ players, durationMs: 1.5 }, sequence())).toThrow('Duration');
  });
});

describe('automatic decisions and presence', () => {
  it('rolls exactly once after decision timeout, without advancing a second decision', () => {
    const state = step(game(), 'tick', { elapsedMs: 30000 }, sequence(0.1, 0.2));
    expect(state.players[0]!.position).toBe(3);
    expect(state.phase).toBe('property');
    expect(state.decisionElapsedMs).toBe(0);
    expect(state.elapsedMs).toBe(30000);
  });
  it('declines a timed-out purchase', () =>
    expect(step(offer(game(), 1), 'tick', { elapsedMs: 30000 }).currentPlayer).toBe(1));
  it('tries an unpaid island exit after timeout', () => {
    const state = game();
    state.phase = 'island';
    state.players[0]!.islandTurns = 0;
    state.players[0]!.position = 8;
    const next = step(state, 'tick', { elapsedMs: 30000 }, sequence(0.1, 0.2));
    expect(next.players[0]!.islandTurns).toBe(1);
    expect(next.players[0]!.cash).toBe(config.initialCash);
  });
  it('declines an expired travel offer', () => {
    const state = game();
    state.phase = 'travel';
    state.players[0]!.travelPending = true;
    expect(step(state, 'tick', { elapsedMs: 30000 }).phase).toBe('roll');
  });
  it('automatically sells a property to settle overdue debt', () => {
    const state = own(game(), 30);
    state.phase = 'debt';
    state.players[0]!.cash = 0;
    state.debt = {
      playerId: 'p1',
      creditorId: null,
      amount: 100000,
      reason: 'tax',
      continuation: 'end',
    };
    const next = step(state, 'tick', { elapsedMs: 30000 });
    expect(next.phase).toBe('end');
    expect(next.players[0]!.cash).toBe(140000);
  });
  it('replaces a disconnected player without altering their assets or action deadline', () => {
    const state = own(game(), 1);
    state.decisionElapsedMs = 400;
    const next = step(state, 'set_control', { bot: true });
    expect(next.players[0]!.bot).toBe(true);
    expect(next.properties).toEqual(state.properties);
    expect(next.decisionElapsedMs).toBe(400);
    expect(
      reduceGame(next, { type: 'set_control', playerId: 'unknown', bot: true }).error,
    ).toBeTruthy();
  });
  it('liquidates a quitting debtor before giving up the seat', () => {
    const state = own(game(3), 30);
    state.phase = 'debt';
    state.players[0]!.cash = 0;
    state.debt = {
      playerId: 'p1',
      creditorId: 'p2',
      amount: 100000,
      reason: 'rent',
      continuation: 'property',
    };
    const next = step(state, 'quit');
    expect(next.players[1]!.cash).toBe(1600000);
    expect(next.players[0]!.eliminated).toBe(true);
    expect(next.currentPlayer).toBe(1);
  });
  it('does not reset the current decision when another player leaves', () => {
    const state = game(3);
    state.decisionElapsedMs = 400;
    expect(step(state, 'quit', { playerId: 'p3' }).decisionElapsedMs).toBe(400);
  });
  it('returns zero for non-properties and missing owners', () => {
    expect(getRent(game(), 0)).toBe(0);
    expect(getRent(game(), 1)).toBe(0);
    expect(getPropertyValue(game(), 0)).toBe(0);
    expect(getPropertyValue(game(), 99)).toBe(0);
    expect(getNetWorth(game(), 'absent')).toBe(0);
  });
});

describe('snapshot invariants reject corrupted data', () => {
  const cases: [string, (state: State) => void][] = [
    [
      'active index',
      (s) => {
        s.currentPlayer = 90;
      },
    ],
    [
      'duplicate player',
      (s) => {
        s.players[1]!.id = 'p1';
      },
    ],
    [
      'cash',
      (s) => {
        s.players[0]!.cash = -1;
      },
    ],
    [
      'position',
      (s) => {
        s.players[0]!.position = 32;
      },
    ],
    [
      'laps',
      (s) => {
        s.players[0]!.laps = -1;
      },
    ],
    [
      'island',
      (s) => {
        s.players[0]!.islandTurns = 3;
      },
    ],
    [
      'eliminated assets',
      (s) => {
        own(s, 1);
        s.players[0]!.eliminated = true;
      },
    ],
    [
      'nonproperty record',
      (s) => {
        s.properties[0] = { ownerId: null, level: 0, championships: 0 };
      },
    ],
    [
      'unknown owner',
      (s) => {
        own(s, 1, 'missing');
      },
    ],
    [
      'level',
      (s) => {
        own(s, 1, 'p1', 5);
      },
    ],
    [
      'resort building',
      (s) => {
        own(s, 3, 'p1', 1);
      },
    ],
    [
      'resort championship',
      (s) => {
        own(s, 3, 'p1', 0, 1);
      },
    ],
    [
      'negative championship',
      (s) => {
        own(s, 1, 'p1', 0, -1);
      },
    ],
    [
      'unowned improvement',
      (s) => {
        s.properties[1]!.level = 1;
      },
    ],
    [
      'missing property',
      (s) => {
        delete s.properties[1];
      },
    ],
    [
      'festival inventory',
      (s) => {
        s.festivals = [];
      },
    ],
    [
      'festival type',
      (s) => {
        s.festivals = [0, 1, 2];
      },
    ],
    [
      'deck inventory',
      (s) => {
        s.deck.pop();
      },
    ],
    [
      'held card type',
      (s) => {
        s.players[0]!.escapeCards = [s.deck.shift()!];
      },
    ],
    [
      'debt phase',
      (s) => {
        s.phase = 'debt';
      },
    ],
    [
      'debt debtor',
      (s) => {
        s.phase = 'debt';
        s.debt = { playerId: 'p2', creditorId: null, amount: 1, reason: 'x', continuation: 'end' };
      },
    ],
    [
      'debt creditor',
      (s) => {
        s.phase = 'debt';
        s.debt = {
          playerId: 'p1',
          creditorId: 'absent',
          amount: 1,
          reason: 'x',
          continuation: 'end',
        };
      },
    ],
    [
      'finished no winner',
      (s) => {
        s.phase = 'finished';
      },
    ],
    [
      'counter',
      (s) => {
        s.seq = -1;
      },
    ],
    [
      'duration',
      (s) => {
        s.durationMs = 0;
      },
    ],
    [
      'elapsed',
      (s) => {
        s.elapsedMs = s.durationMs + 1;
      },
    ],
  ];
  it.each(cases)('flags %s', (_, mutate) => {
    const state = game();
    mutate(state);
    expect(validateState(state).length).toBeGreaterThan(0);
  });
  it('offers no action for an eliminated active player', () => {
    const state = game();
    state.players[0]!.eliminated = true;
    expect(getLegalActions(state)).toEqual([]);
  });
});
