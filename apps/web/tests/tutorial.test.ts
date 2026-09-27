import { describe, expect, it } from 'vitest';
import {
  createRng,
  getLegalActions,
  reduceGame,
  validateState,
  type GameAction,
} from '@money-tour/engine';
import { lessons, tutorialScene, type LessonId } from '../src/game/tutorial';

describe('guided practice uses real, legal game decisions', () => {
  it.each(lessons)('$id starts from a valid isolated state', ({ id }) => {
    const state = tutorialScene(id);
    expect(validateState(state)).toEqual([]);
    state.players[0]!.cash = 1;
    expect(tutorialScene(id).players[0]!.cash).not.toBe(1);
  });
  const decisions: [LessonId, GameAction['type'], number?][] = [
    ['roll', 'roll'],
    ['buy', 'buy'],
    ['rent', 'roll'],
    ['build', 'upgrade'],
    ['start', 'roll'],
    ['resorts', 'buy'],
    ['card', 'roll'],
    ['casino', 'casino_red'],
    ['slots', 'casino_spin'],
    ['insurance', 'insure', 5],
    ['attack', 'attack', 9],
    ['squatter', 'use_squatter'],
    ['fraud', 'buy_fraud'],
    ['tax', 'roll'],
    ['debt', 'sell', 5],
    ['island', 'pay_bail'],
    ['travel', 'travel', 5],
    ['championship', 'place_championship', 5],
    ['alliance', 'alliance'],
  ];
  it.each(decisions)('%s can complete its advertised action', (id, type, tile) => {
    const state = tutorialScene(id);
    const action = getLegalActions(state).find(
      (a) => a.type === type && (tile === undefined || ('tile' in a && a.tile === tile)),
    );
    expect(action).toBeDefined();
    const result = reduceGame(state, action!, createRng('lesson-roll'));
    expect(result.error).toBeUndefined();
    expect(validateState(result.state)).toEqual([]);
    if (id === 'roll') expect(result.state.players[0]!.position).toBe(5);
    if (id === 'rent')
      expect(result.state.players[0]!.cash).toBeGreaterThan(state.players[0]!.cash);
    if (id === 'start') expect(result.events.some((e) => e.type === 'start_bonus')).toBe(true);
    if (id === 'card') expect(result.events.some((e) => e.type === 'card')).toBe(true);
    if (id === 'tax') expect(result.events.some((e) => e.type === 'tax_notice')).toBe(true);
    if (id === 'debt') expect(result.state.debt).toBeNull();
  });
});
