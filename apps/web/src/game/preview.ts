import { config, createGame, createRng, reduceGame } from '@money-tour/engine';
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
    config: { ...config, shuffleStreets: false },
    players: [
      { id: 'p1', name: 'Léa' },
      { id: 'p2', name: 'Max' },
      { id: 'p3', name: 'Lou' },
      { id: 'p4', name: 'Noa' },
    ],
    seed: 'visual-review',
  });
  const player = state.players[0]!;
  player.position = name === 'travel' ? 20 : name === 'build' ? 1 : 4;
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
      p.position = [4, 11, 17, 21][i]!;
    });
    [
      [1, 2],
      [8, 9],
      [14, 15],
      [21, 22],
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
    player.position = 4;
    state.phase = 'property';
  }
  if (name === 'mondial') {
    player.position = 13;
    state.phase = 'championship';
  }
  if (name === 'rent') {
    state.properties[4] = { ownerId: 'p2', level: 2, championships: 0 };
  }
  if (name === 'card' || name === 'attack' || name === 'rent' || name === 'tax') {
    const rolled = reduceGame(
      state,
      { type: 'roll', playerId: 'p1' },
      createRng('visual-review:0'),
    );
    const dice = rolled.events.find((event) => event.type === 'dice')!.dice!;
    const target = name === 'rent' ? 4 : name === 'tax' ? 25 : 6;
    if (name === 'attack') state.deck = ['chance-15'];
    player.position = (target - dice.reduce((sum, value) => sum + value, 0) + 26) % 26;
  }
  return { version: 1, seed: 'visual-review', state };
}
