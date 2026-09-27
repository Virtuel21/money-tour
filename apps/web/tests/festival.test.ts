import { expect, it } from 'vitest';
import { config, legacyConfigV14 } from '@money-tour/engine';
import { festivalText, tileTitle } from '../src/game/tileTitle';
import { festivalBeat } from '../src/board/specialArt';

it('preserves all prices, probabilities and mechanics when renaming Mondial to Festival', () => {
  const previous = structuredClone(legacyConfigV14);
  previous.version = config.version;
  for (const tile of previous.board) if (tile.type === 'championship') tile.name = 'Festival';
  for (const card of previous.cards) {
    card.title = festivalText(card.title);
    card.description = festivalText(card.description);
  }
  expect(config).toEqual(previous);
});

it('shows Festival names in existing saves and old Chance cards', () => {
  expect(tileTitle({ type: 'championship', name: 'Championnat du monde' })).toBe('Festival');
  expect(tileTitle({ type: 'city', name: 'Paris' })).toBe('Paris');
  expect(festivalText("Invitation sportive : avancez jusqu'au Championnat du monde.")).toBe(
    "Pass festival : avancez jusqu'au Festival.",
  );
});

it('keeps speaker animation bounded and still for pause or reduced motion', () => {
  for (let time = 0; time < 3000; time += 23) {
    expect(festivalBeat(time, false)).toBeGreaterThanOrEqual(0);
    expect(festivalBeat(time, false)).toBeLessThanOrEqual(1);
    expect(festivalBeat(time, true)).toBe(0);
  }
  expect(festivalBeat(162.5, false)).toBeCloseTo(1);
  expect(festivalBeat(487.5, false)).toBeCloseTo(0);
});
