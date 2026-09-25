import { describe, expect, it } from 'vitest';
import { getLegalActions, getNetWorth, reduceGame } from '../src/index';
import { game, offer, own, roll, sequence, step } from './helpers';

describe('purchases and construction', () => {
  it('buys a city at its configured price and builds one level at a time', () => {
    let state = offer(game(), 1);
    state = step(state, 'buy');
    expect(state.properties[1]!.ownerId).toBe('p1');
    expect(state.players[0]!.cash).toBe(1_400_000);
    state = step(state, 'upgrade');
    expect(state.properties[1]!.level).toBe(1);
    expect(state.players[0]!.cash).toBe(1_350_000);
    state = step(state, 'upgrade');
    expect(state.properties[1]!.level).toBe(2);
    expect(state.players[0]!.cash).toBe(1_300_000);
    const denied = reduceGame(state, { type: 'upgrade', playerId: 'p1' }, sequence());
    expect(denied.error).toBeTruthy();
    expect(denied.state).toBe(state);
  });

  it('allows the third house and hotel after a complete lap without owning the group', () => {
    let state = offer(own(game(), 1, 'p1', 2), 1);
    state.players[0]!.laps = 1;
    state = step(state, 'upgrade');
    expect(state.properties[1]!.level).toBe(3);
    state = step(state, 'upgrade');
    expect(state.properties[1]!.level).toBe(4);
    expect(state.players[0]!.cash).toBe(1_400_000);
    expect(state.properties[2]!.ownerId).toBeNull();
    expect(reduceGame(state, { type: 'upgrade', playerId: 'p1' }, sequence()).error).toBeTruthy();
  });

  it('cannot buy without enough cash or build on a resort', () => {
    const poor = offer(game(), 1);
    poor.players[0]!.cash = 99_999;
    expect(reduceGame(poor, { type: 'buy', playerId: 'p1' }, sequence()).error).toBeTruthy();
    expect(poor.debt).toBeNull();
    const resort = offer(own(game(), 3), 3);
    expect(reduceGame(resort, { type: 'upgrade', playerId: 'p1' }, sequence()).error).toBeTruthy();
  });

  it('rejects building on an ally city despite a shared victory collection', () => {
    const state = offer(own(game(4, true), 1, 'p3'), 1);
    expect(reduceGame(state, { type: 'upgrade', playerId: 'p1' }, sequence()).error).toBeTruthy();
    expect(reduceGame(state, { type: 'buyout', playerId: 'p1' }, sequence()).error).toBeTruthy();
  });
});

describe('rent, acquisition premiums, and wealth', () => {
  it.each([14_000, 28_000, 56_000, 98_000, 168_000])('charges configured city rent %i', (rent) => {
    const level = [14_000, 28_000, 56_000, 98_000, 168_000].indexOf(rent);
    const state = own(game(), 4, 'p2', level);
    state.festivals = [];
    const next = roll(state, 1, 3);
    expect(next.players[0]!.cash).toBe(1_500_000 - rent);
    expect(next.players[1]!.cash).toBe(1_500_000 + rent);
  });

  it('multiplies a festival by additive championships, without group rent doubling', () => {
    const state = own(own(game(), 4, 'p2', 2, 2), 5, 'p2');
    own(state, 6, 'p2');
    state.festivals = [4];
    const next = roll(state, 1, 3);
    expect(next.players[0]!.cash).toBe(1_500_000 - 56_000 * 2 * 3);
    expect(next.players[1]!.cash).toBe(1_500_000 + 56_000 * 2 * 3);
  });

  it.each([1, 2, 3, 4])('charges the %i-resort ownership tier', (count) => {
    const state = game();
    for (const tile of [3, 11, 19, 27].slice(0, count)) own(state, tile, 'p2');
    const next = roll(state, 1, 2);
    const rent = [50_000, 100_000, 200_000, 400_000][count - 1]!;
    expect(next.players[0]!.cash).toBe(1_500_000 - rent);
    expect(next.players[1]!.cash).toBe(1_500_000 + rent);
  });

  it('counts resorts per owner, while teammates share collection victories', () => {
    const state = own(own(game(4, true), 3, 'p2'), 11, 'p4');
    const next = roll(state, 1, 2);
    expect(next.players[0]!.cash).toBe(1_450_000);
    expect(next.players[1]!.cash).toBe(1_550_000);
    expect(next.players[3]!.cash).toBe(1_500_000);
  });

  it('does not pay rent to an allied owner', () => {
    const state = own(game(4, true), 4, 'p3', 4, 5);
    state.festivals = [4];
    const next = roll(state, 1, 3);
    expect(next.players[0]!.cash).toBe(1_500_000);
    expect(next.players[2]!.cash).toBe(1_500_000);
  });

  it('pays rent before an optional buyout and preserves improvements and markers', () => {
    let state = own(game(), 4, 'p2', 2, 1);
    state.festivals = [4];
    state = roll(state, 1, 3);
    expect(state.players[0]!.cash).toBe(1_276_000);
    state = step(state, 'buyout');
    expect(state.properties[4]).toEqual({ ownerId: 'p1', level: 2, championships: 1 });
    expect(state.players[0]!.cash).toBe(716_000);
    expect(state.players[1]!.cash).toBe(2_284_000);
    expect(getNetWorth(state, 'p1')).toBe(996_000);
    expect(state.festivals).toContain(4);
  });

  it.each([
    [4, 4],
    [3, 0],
  ])('protects hotel/resort tile %i from a buyout', (tile, level) => {
    const state = offer(own(game(), tile!, 'p2', level!), tile!);
    expect(reduceGame(state, { type: 'buyout', playerId: 'p1' }, sequence()).error).toBeTruthy();
  });

  it('taxes real estate and current buildings, excluding cash and every marker', () => {
    const state = own(own(game(), 1, 'p1', 2, 8), 3, 'p1');
    state.festivals = [1];
    state.players[0]!.position = 28;
    state.players[0]!.escapeCards = ['chance-13'];
    state.deck = state.deck.filter((id) => id !== 'chance-13');
    const next = roll(state, 1, 2);
    expect(next.players[0]!.cash).toBe(1_460_000);
    expect(getNetWorth(next, 'p1')).toBe(1_860_000);
  });

  it('charges no wealth tax to a player without property', () => {
    const state = game();
    state.players[0]!.position = 28;
    expect(roll(state, 1, 2).players[0]!.cash).toBe(1_500_000);
  });
});

describe('mandatory debt, sales, and bankruptcy', () => {
  it('holds an unaffordable rent in explicit debt until a sale finances settlement', () => {
    const state = own(own(game(), 4, 'p2', 4), 30, 'p1', 0, 2);
    state.festivals = [30];
    state.players[0]!.cash = 10_000;
    let next = roll(state, 1, 3);
    expect(next.phase).toBe('debt');
    expect(next.debt).toMatchObject({ playerId: 'p1', creditorId: 'p2', amount: 168_000 });
    expect(next.players[0]!.cash).toBe(10_000);
    expect(next.players[1]!.cash).toBe(1_500_000);
    for (const type of ['buy', 'buyout', 'upgrade', 'finish'] as const) {
      expect(reduceGame(next, { type, playerId: 'p1' }, sequence()).error).toBeTruthy();
    }
    next = step(next, 'sell', { tile: 30 });
    expect(next.debt).toBeNull();
    expect(next.players[0]!.cash).toBe(82_000);
    expect(next.players[1]!.cash).toBe(1_668_000);
    expect(next.properties[30]).toEqual({ ownerId: null, level: 0, championships: 0 });
    expect(next.festivals).toContain(30);
    expect(next.phase).toBe('property');
  });

  it('liquidates an insolvent estate, pays only available funds, and eliminates the debtor', () => {
    const state = own(own(game(), 4, 'p2', 4), 1, 'p1', 1, 2);
    state.festivals = [1];
    state.players[0]!.cash = 10_000;
    const next = roll(state, 1, 3);
    expect(next.players[0]!.cash).toBe(0);
    expect(next.players[0]!.eliminated).toBe(true);
    expect(next.players[1]!.cash).toBe(1_585_000);
    expect(next.properties[1]).toEqual({ ownerId: null, level: 0, championships: 0 });
    expect(next.festivals).toContain(1);
    expect(next.phase).toBe('finished');
  });

  it('terminates bankruptcy for a cashless player with no properties', () => {
    const state = own(game(), 4, 'p2', 1);
    state.festivals = [];
    state.players[0]!.cash = 0;
    const next = roll(state, 1, 3);
    expect(next.players[0]!.eliminated).toBe(true);
    expect(next.players[1]!.cash).toBe(1_500_000);
    expect(next.phase).toBe('finished');
  });

  it('never offers a sale of someone else’s property', () => {
    const state = own(own(game(), 4, 'p2', 4), 30, 'p1');
    state.players[0]!.cash = 0;
    state.festivals = [];
    const next = roll(state, 1, 3);
    expect(
      getLegalActions(next)
        .filter((action) => action.type === 'sell')
        .every((action) => 'tile' in action && action.tile === 30),
    ).toBe(true);
    expect(
      reduceGame(next, { type: 'sell', playerId: 'p1', tile: 4 }, sequence()).error,
    ).toBeTruthy();
  });
});
