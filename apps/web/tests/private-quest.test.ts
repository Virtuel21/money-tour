import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { config, createGame, questRules } from '@money-tour/engine';
import { PrivateQuest } from '../src/game/AdventureHUD';

it('keeps the online objective collapsed, even after completion, and never renders another seat’s objective', () => {
  const state = createGame({
    config,
    players: [
      { id: 'a', name: 'Léa' },
      { id: 'b', name: 'Max' },
    ],
    seed: 'private-mobile',
  });
  const player = state.players[0]!;
  const title = questRules[state.quests![player.id]!.kind].title;
  const render = (self: string) =>
    renderToStaticMarkup(createElement(PrivateQuest, { state, player, self }));
  expect(render('a')).toContain('aria-expanded="false"');
  expect(render('a')).not.toContain(title);
  state.quests![player.id]!.completed = true;
  expect(render('a')).not.toContain(title);
  expect(render('b')).toBe('');
});
