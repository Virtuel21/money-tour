import { expect } from 'vitest';
import { createGame, reduceGame } from '../src/index';

export type State = ReturnType<typeof createGame>;
export type Action = Parameters<typeof reduceGame>[1];

export function game(count = 2, teams = false): State {
  return createGame({
    players: Array.from({ length: count }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Joueur ${i + 1}`,
      bot: false,
      ...(teams ? { team: i % 2 } : {}),
    })),
    mode: teams ? 'teams' : 'free-for-all',
    seed: 'fixture',
  });
}

/** A finite source catches unexpected random consumption instead of silently repeating. */
export function sequence(...values: number[]): () => number {
  let cursor = 0;
  return () => {
    if (cursor >= values.length) throw new Error(`Unexpected RNG request ${cursor + 1}`);
    return values[cursor++]!;
  };
}

export function step(
  state: State,
  type: Action['type'],
  extra: Record<string, unknown> = {},
  rng: () => number = sequence(),
): State {
  const action = {
    type,
    playerId: state.players[state.currentPlayer]!.id,
    ...extra,
  } as Action;
  const result = reduceGame(state, action, rng);
  expect(result.error, `Rejected ${JSON.stringify(action)}`).toBeUndefined();
  return result.state;
}

export function roll(state: State, a: number, b: number, ...random: number[]): State {
  return step(state, 'roll', {}, sequence((a - 0.5) / 6, (b - 0.5) / 6, ...random));
}

export function own(
  state: State,
  tile: number,
  ownerId = 'p1',
  level = 0,
  championships = 0,
): State {
  state.properties[tile] = { ownerId, level, championships };
  return state;
}

export function offer(state: State, tile: number): State {
  state.phase = 'property';
  state.players[state.currentPlayer]!.position = tile;
  return state;
}
