import { createGame, createRng, reduceGame } from '@money-tour/engine';
import type { LocalSave } from './local';

/** Deterministic UI acceptance scenes, compiled out of production by Vite. */
export function previewScenario(): LocalSave | null {
  if (!import.meta.env.DEV) return null;
  const name = new URLSearchParams(location.search).get('scenario');
  if (!name || !['travel', 'build', 'card', 'crowded'].includes(name)) return null;
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
  player.position = name === 'travel' ? 24 : name === 'build' ? 1 : 5;
  state.phase = name === 'travel' ? 'travel' : name === 'build' ? 'property' : 'roll';
  player.travelPending = name === 'travel';
  player.laps = 1;
  for (const id of [1, 2]) state.properties[id]!.ownerId = 'p1';
  for (const id of [9, 10]) state.properties[id]!.ownerId = 'p2';
  state.properties[9]!.level = 2;
  state.properties[10]!.level = 4;
  if (name === 'crowded') {
    state.players.forEach((p) => {
      p.position = 1;
    });
    state.properties[1]!.level = 3;
    state.properties[2]!.level = 4;
    state.phase = 'property';
  }
  if (name === 'card') {
    const rolled = reduceGame(
      state,
      { type: 'roll', playerId: 'p1' },
      createRng('visual-review:0'),
    );
    const dice = rolled.events.find((event) => event.type === 'dice')!.dice!;
    player.position = (7 - dice.reduce((sum, value) => sum + value, 0) + 32) % 32;
  }
  return { version: 1, seed: 'visual-review', state };
}
