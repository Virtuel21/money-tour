import { createGame, createRng, reduceGame } from '@money-tour/engine';
import type { LocalSave } from './local';

/** Deterministic UI acceptance scenes, compiled out of production by Vite. */
export function previewScenario(): LocalSave | null {
  if (!import.meta.env.DEV) return null;
  const name = new URLSearchParams(location.search).get('scenario');
  if (
    !name ||
    ![
      'travel',
      'build',
      'card',
      'crowded',
      'showcase',
      'rent',
      'attack',
      'purchase',
      'mondial',
      'tax',
      'celebration',
    ].includes(name)
  )
    return null;
  const state = createGame({
    players: [
      { id: 'p1', name: 'Léa' },
      { id: 'p2', name: 'Max' },
      { id: 'p3', name: 'Lou' },
      { id: 'p4', name: 'Noa' },
    ],
    seed: 'visual-review',
  });
  const player = state.players[0]!;
  player.position = name === 'travel' ? 21 : name === 'build' ? 1 : 5;
  state.phase = name === 'travel' ? 'travel' : name === 'build' ? 'property' : 'roll';
  player.travelPending = name === 'travel';
  player.laps = 1;
  for (const id of [1, 2]) state.properties[id]!.ownerId = 'p1';
  for (const id of [8, 9]) state.properties[id]!.ownerId = 'p2';
  state.properties[8]!.level = 2;
  state.properties[9]!.level = 4;
  if (name === 'celebration') {
    state.properties[1] = { ownerId: 'p1', level: 2, championships: 1, championshipTurns: 4 };
  }
  if (name === 'showcase') {
    for (const tile of state.config.board.filter((t) => t.type === 'resort'))
      state.properties[tile.id]!.ownerId = 'p3';
    state.players.forEach((p, i) => {
      p.position = [5, 12, 19, 22][i]!;
    });
    [
      [1, 2],
      [8, 9],
      [15, 16],
      [22, 23],
    ].forEach((pair, i) => {
      pair.forEach((id, j) => {
        state.properties[id] = {
          ownerId: state.players[i]!.id,
          level: j ? 4 : (i % 3) + 1,
          championships: 0,
        };
      });
    });
  }
  if (name === 'crowded') {
    state.players.forEach((p) => {
      p.position = 1;
    });
    state.properties[1]!.level = 3;
    state.properties[2]!.level = 4;
    state.phase = 'property';
  }
  if (name === 'purchase') {
    player.position = 5;
    state.phase = 'property';
  }
  if (name === 'mondial') {
    player.position = 14;
    state.phase = 'championship';
  }
  if (name === 'rent') {
    state.properties[5] = { ownerId: 'p2', level: 2, championships: 0 };
  }
  if (name === 'card' || name === 'attack' || name === 'rent' || name === 'tax') {
    const rolled = reduceGame(
      state,
      { type: 'roll', playerId: 'p1' },
      createRng('visual-review:0'),
    );
    const dice = rolled.events.find((event) => event.type === 'dice')!.dice!;
    const target = name === 'rent' ? 5 : name === 'tax' ? 11 : 4;
    if (name === 'attack') state.deck = ['chance-15'];
    player.position = (target - dice.reduce((sum, value) => sum + value, 0) + 28) % 28;
  }
  return { version: 1, seed: 'visual-review', state };
}
