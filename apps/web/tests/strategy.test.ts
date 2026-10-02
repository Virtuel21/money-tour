import { describe, expect, it } from 'vitest';
import { config, createGame, getRent, type GameState } from '@money-tour/engine';
import { propertyRentInsight, publicVictoryProgress } from '../src/game/strategy';

const makeGame = (teams = false) => {
  const state = createGame({
    config: { ...config, shuffleStreets: false },
    players: [
      { id: 'a', name: 'Léa', team: 0 },
      { id: 'b', name: 'Max', team: 1 },
      { id: 'c', name: 'Mila', team: 0 },
      { id: 'd', name: 'Noé', team: 1 },
    ],
    mode: teams ? 'teams' : 'free-for-all',
    seed: 'strategy-public',
  });
  for (const property of Object.values(state.properties)) property.ownerId = null;
  return state;
};
const assign = (state: GameState, ids: number[], owner = 'a') => {
  for (const id of ids) state.properties[id]!.ownerId = owner;
};

describe('public victory progress', () => {
  it('counts a complete archipelago once and identifies the owner of a missing island', () => {
    const state = makeGame();
    const islands = state.config.board.filter((t) => t.type === 'resort');
    assign(
      state,
      islands.slice(0, 3).map((t) => t.id),
    );
    assign(state, [islands[3]!.id], 'b');
    let progress = publicVictoryProgress(state, 'a');
    expect(progress.completed).toBe(0);
    expect(progress.islands!.owned).toBe(3);
    expect(progress.islands!.missing).toEqual([{ tile: islands[3], owner: 'Max' }]);
    assign(state, [islands[3]!.id]);
    progress = publicVictoryProgress(state, 'a');
    expect(progress.completed).toBe(1);
    expect(progress.groups.filter((g) => g.complete)).toHaveLength(1);
  });

  it('combines active team holdings and wealth but excludes eliminated teammates', () => {
    const state = makeGame(true);
    const group = publicVictoryProgress(state, 'a').groups.find(
      (g) => g.tiles[0]!.type === 'city',
    )!;
    assign(state, [group.tiles[0]!.id], 'a');
    assign(
      state,
      group.tiles.slice(1).map((t) => t.id),
      'c',
    );
    state.players[0]!.cash = 120;
    state.players[2]!.cash = 240;
    let progress = publicVictoryProgress(state, 'a');
    expect(progress.completed).toBe(1);
    expect(progress.cash).toBe(360);
    expect(progress.netWorth).toBe(
      360 +
        group.tiles.reduce(
          (sum, t) =>
            sum +
            t.price! +
            (t.buildCosts ?? [])
              .slice(1, state.properties[t.id]!.level + 1)
              .reduce((total, cost) => total + cost, 0),
          0,
        ),
    );
    expect(progress.opposingSides).toBe(1);
    state.players[2]!.eliminated = true;
    progress = publicVictoryProgress(state, 'a');
    expect(progress.completed).toBe(0);
    expect(progress.cash).toBe(120);
    expect(publicVictoryProgress(state, 'c').eliminated).toBe(false);
    state.players[0]!.eliminated = true;
    expect(publicVictoryProgress(state, 'c').eliminated).toBe(true);
  });

  it('matches legacy side rules, optional victories and the saved group target', () => {
    const state = makeGame();
    state.config.lineVictory = true;
    state.config.resortVictory = true;
    state.config.groupsToWin = 4;
    const modern = publicVictoryProgress(state, 'a');
    expect(modern.lines.flatMap((line) => line.tiles).some((t) => t.type === 'resort')).toBe(true);
    state.config.version = 6;
    const legacy = publicVictoryProgress(state, 'a');
    expect(legacy.lines.flatMap((line) => line.tiles).every((t) => t.type === 'city')).toBe(true);
    expect(legacy.target).toBe(4);
    state.config.lineVictory = false;
    state.config.resortVictory = false;
    expect(publicVictoryProgress(state, 'a').lines).toEqual([]);
    expect(publicVictoryProgress(state, 'a').islandVictory).toBe(false);
    expect(publicVictoryProgress(state, 'a').islands).toBeDefined();
  });

  it('never consults hidden objectives or capital reward progress', () => {
    const state = makeGame();
    Object.defineProperty(state, 'quests', {
      get() {
        throw new Error('Private objectives accessed');
      },
    });
    Object.defineProperty(state, 'adventure', {
      get() {
        throw new Error('Capital bonus accessed');
      },
    });
    expect(() => publicVictoryProgress(state, 'a')).not.toThrow();
  });
});

describe('property rent insight', () => {
  it('explains stacked multipliers while using the engine rent as the authoritative total', () => {
    const state = makeGame();
    const cities = state.config.board.filter((t) => t.type === 'city').slice(0, 2);
    const id = cities[0]!.id;
    assign(
      state,
      cities.map((t) => t.id),
    );
    state.properties[id]!.level = 4;
    state.properties[id]!.championships = 1;
    state.properties[id]!.championshipTurns = 3;
    state.properties[id]!.roachTurns = 2;
    state.festivals = [id];
    state.crisis = { remaining: ['a', 'b'] };
    state.adventure!.twinTiles = cities.map((t) => t.id);
    const insight = propertyRentInsight(state, id)!;
    expect(insight.modifiers.map((m) => m.factor)).toEqual([
      state.config.festivalMultiplier,
      2,
      2,
      0.5,
      0.5,
    ]);
    expect(insight.rent).toBe(getRent(state, id));
    expect(Math.floor(insight.modifiers.reduce((rent, m) => rent * m.factor, insight.base))).toBe(
      insight.rent,
    );
  });

  it('shows configured island rents and does not combine teammate islands for rent', () => {
    const state = makeGame(true);
    const islands = state.config.board.filter((t) => t.type === 'resort');
    assign(state, [islands[0]!.id]);
    assign(state, [islands[1]!.id], 'c');
    expect(propertyRentInsight(state, islands[0]!.id)!.islandCount).toBe(1);
    expect(propertyRentInsight(state, islands[0]!.id)!.base).toBe(state.config.resortRents[0]);
    expect(propertyRentInsight(state, islands[2]!.id)!.owner).toBeUndefined();
    expect(propertyRentInsight(state, 0)).toBeNull();
  });
});
