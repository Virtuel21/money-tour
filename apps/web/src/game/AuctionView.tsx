import { useEffect, useRef, useState } from 'react';
import {
  auctionCommitment,
  getDecisionPlayerId,
  type GameAction,
  type GameState,
} from '@money-tour/engine';
import { ActionClock } from './ActionClock';
import { money } from './local';
export function AuctionView({
  state,
  self,
  act,
  disabled,
}: {
  state: GameState;
  self?: string;
  act: (a: GameAction) => void;
  disabled: boolean;
}) {
  const a = state.auction!,
    actor = state.players.find((p) => p.id === getDecisionPlayerId(state))!;
  const canPlay = !disabled && !actor.bot && (!self || self === actor.id);
  const [amount, setAmount] = useState('50000');
  const [opened, setOpened] = useState(false);
  const secrets = useRef<Record<string, { amount: number; salt: string }>>({});
  const key = (id: string) => `money-tour.auction.${a.id}.${id}`;
  useEffect(() => {
    setAmount('50000');
    setOpened(false);
  }, [actor.id]);
  const secret = () => {
    try {
      return (
        secrets.current[actor.id] ??
        (JSON.parse(sessionStorage.getItem(key(actor.id)) ?? 'null') as {
          amount: number;
          salt: string;
        } | null)
      );
    } catch {
      return null;
    }
  };
  const bid = () => {
    const entry = {
      amount: Number(amount),
      salt: Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join(''),
    };
    secrets.current[actor.id] = entry;
    try {
      sessionStorage.setItem(key(actor.id), JSON.stringify(entry));
    } catch {
      /* Kept in memory. */
    }
    setOpened(false);
    setAmount('');
    act({
      type: 'auction_commit',
      playerId: actor.id,
      hash: auctionCommitment(a.id, actor.id, entry.amount, entry.salt),
    });
  };
  const tile = state.config.board[a.tile]!;
  return (
    <div className="auction-view">
      <div className="auction-property" style={{ borderTopColor: tile.color }}>
        <span>⌂</span>
        <h3>{tile.name}</h3>
        <p>
          Prix habituel {money(tile.price!, true)} · Loyer {money(tile.rents![0]!, true)}
        </p>
      </div>
      <p>
        Une seule offre par joueur. Seul le gagnant paie. En cas d’égalité, tirage au sort entre les
        meilleurs enchérisseurs.
      </p>
      <div className="auction-seals" aria-label="Offres déposées">
        {a.participants.map((id) => (
          <span key={id}>
            {state.players.find((p) => p.id === id)!.name}{' '}
            {a.passed.includes(id) ? '—' : a.commitments[id] ? '✉ Scellée' : '…'}
          </span>
        ))}
      </div>
      {!canPlay ? (
        <p role="status">{actor.name} prépare son enveloppe. Les montants restent cachés.</p>
      ) : a.stage === 'commit' ? (
        <>
          {!self && !opened ? (
            <button className="primary" onClick={() => setOpened(true)}>
              Je suis {actor.name} · préparer mon offre <ActionClock />
            </button>
          ) : (
            <>
              <label>
                Votre offre secrète (maximum {money(actor.cash, true)})
                <input
                  aria-label="Votre offre secrète"
                  type="number"
                  min="1"
                  max={actor.cash}
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <button
                className="primary"
                disabled={
                  !Number.isSafeInteger(Number(amount)) ||
                  Number(amount) < 1 ||
                  Number(amount) > actor.cash
                }
                onClick={bid}
              >
                Sceller mon offre <ActionClock />
              </button>
            </>
          )}
          <button onClick={() => act({ type: 'auction_pass', playerId: actor.id })}>
            Ne pas participer <ActionClock />
          </button>
        </>
      ) : (
        <>
          <p>
            Toutes les offres sont verrouillées. {actor.name}, transmettez votre enveloppe pour le
            dépouillement.
          </p>
          {secret() && (
            <button
              className="primary"
              onClick={() => {
                const entry = secret();
                if (entry) act({ type: 'auction_reveal', playerId: actor.id, ...entry });
              }}
            >
              Transmettre mon enveloppe <ActionClock />
            </button>
          )}
          {!secret() && <p>Cette enveloppe n’est plus disponible sur cet appareil.</p>}
          <button onClick={() => act({ type: 'auction_pass', playerId: actor.id })}>
            Retirer mon offre <ActionClock />
          </button>
        </>
      )}
    </div>
  );
}
