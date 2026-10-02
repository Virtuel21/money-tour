import { useEffect, useRef } from 'react';
import { getDecisionPlayerId, type GameAction, type GameState } from '@money-tour/engine';
import { readAuctionOffer } from './auctionOffers';

/** Mounted by the game, so closing the auction window cannot block settlement. */
export function useAuctionReveal(
  state: GameState,
  self: string | undefined,
  act: (action: GameAction) => void,
  disabled: boolean,
  gameKey?: string,
) {
  const latest = useRef({ state, act });
  latest.current = { state, act };
  const auction = state.auction;
  const actorId = getDecisionPlayerId(state);
  const actor = state.players.find((p) => p.id === actorId);
  const eligible =
    !disabled &&
    !actor?.bot &&
    (!self || self === actorId) &&
    state.phase === 'auction' &&
    auction?.stage === 'reveal';
  const commitment = auction?.commitments[actorId];
  useEffect(() => {
    if (!eligible) return;
    const reveal = () => {
      const offer = readAuctionOffer(latest.current.state, actorId, gameKey);
      if (offer) latest.current.act({ type: 'auction_reveal', playerId: actorId, ...offer });
    };
    reveal();
    // Retry the same signed envelope if the host missed the first intent.
    const retry = window.setInterval(reveal, 2000);
    return () => window.clearInterval(retry);
  }, [auction?.id, actorId, commitment, eligible, gameKey]);
}
