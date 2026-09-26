import { expect, it } from 'vitest';
import { createGame } from '@money-tour/engine';
import { purchaseOffer } from '../src/game/PurchaseOffer';
const game = () =>
  createGame({
    players: [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ],
    seed: 1,
  });
it('offers an unowned city only to the human whose turn it is', () => {
  const s = game();
  s.phase = 'property';
  s.players[0]!.position = 5;
  expect(purchaseOffer(s, 'a')?.canBuy).toBe(true);
  expect(purchaseOffer(s, 'b')).toBeNull();
  s.players[0]!.cash = 1;
  expect(purchaseOffer(s, 'a')?.canBuy).toBe(false);
  s.players[0]!.bot = true;
  expect(purchaseOffer(s)).toBeNull();
  s.players[0]!.bot = false;
  s.properties[5]!.ownerId = 'b';
  expect(purchaseOffer(s)).toBeNull();
});
