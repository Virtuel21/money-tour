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
      'casino',
      'slots',
      'insurance',
      'squatter',
      'fraud',
      'expropriate',
      'roaches',
      'debt',
      'duel',
      'alliance',
      'crisis',
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
  player.position = name === 'travel' ? 24 : name === 'build' ? 1 : 4;
  state.phase = name === 'travel' ? 'travel' : name === 'build' ? 'property' : 'roll';
  player.travelPending = name === 'travel';
  player.laps = 1;
  for (const id of [1, 2]) state.properties[id]!.ownerId = 'p1';
  for (const id of [9, 10]) state.properties[id]!.ownerId = 'p2';
  state.properties[9]!.level = 2;
  state.properties[10]!.level = 4;
  if (name === 'celebration') {
    state.properties[1] = { ownerId: 'p1', level: 2, championships: 1, championshipTurns: 4 };
  }
  if (name === 'showcase') {
    for (const tile of state.config.board.filter((t) => t.type === 'resort'))
      state.properties[tile.id]!.ownerId = 'p3';
    state.players.forEach((p, i) => {
      p.position = [4, 13, 19, 25][i]!;
    });
    [
      [1, 2],
      [9, 10],
      [17, 18],
      [25, 26],
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
    player.position = 16;
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
    const target = name === 'rent' ? 5 : name === 'tax' ? 31 : 3;
    if (name === 'attack') state.deck = ['chance-15'];
    player.position = (target - dice.reduce((sum, value) => sum + value, 0) + 32) % 32;
  }

  const hold = (id: string) => {
    state.deck = state.deck.filter((c) => c !== id);
    player.heldCards = [...(player.heldCards ?? []), id];
  };
  if (name === 'casino' || name === 'slots') {
    player.position = 7;
    state.phase = 'casino';
    state.casino = { tile: 7, game: name === 'slots' ? 'slots' : 'roulette', chance: 50 };
    state.casinoVisits = { 7: 25 };
  }
  if (name === 'insurance') {
    player.position = 11;
    player.insurance = { tile: null };
    state.phase = 'end';
  }
  if (name === 'fraud') {
    hold('chance-22');
    player.position = 5;
    state.phase = 'property';
  }
  if (name === 'squatter') {
    hold('chance-19');
    player.position = 9;
    state.pendingRent = { tile: 9, amount: 80000, creditorId: 'p2' };
    state.phase = 'rent';
  }
  if (name === 'expropriate' || name === 'roaches') {
    const id = name === 'roaches' ? 'chance-21' : 'chance-20';
    state.deck = state.deck.filter((c) => c !== id);
    state.discard.push(id);
    state.pendingAttack = id;
    state.phase = 'attack';
    state.players[1]!.insurance = { tile: 10 };
  }
  if (name === 'debt') {
    player.cash = 5000;
    state.phase = 'debt';
    state.debt = {
      playerId: 'p1',
      creditorId: 'p2',
      amount: 100000,
      reason: 'rent',
      continuation: 'property',
    };
  }
  if (name === 'duel') {
    state.phase = 'duel';
    state.duel = {
      id: 'visual-duel',
      challengerId: 'p1',
      amount: 0,
      stage: 'offer',
      commitments: {},
      reveals: {},
      escrow: false,
    };
  }
  if (name === 'alliance') state.phase = 'alliance';
  if (name === 'crisis') state.crisis = { remaining: state.players.map((p) => p.id) };
  return { version: 1, seed: 'visual-review', state };
}
