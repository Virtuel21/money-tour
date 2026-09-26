import { useRef, useState } from 'react';
import {
  duelCommitment,
  duelChoices,
  getDecisionPlayerId,
  getLegalActions,
  type DuelChoice,
  type GameAction,
  type GameState,
} from '@money-tour/engine';
import { ActionClock } from './ActionClock';
import { money } from './local';

const hands = { rock: '✊', paper: '✋', scissors: '✌️' };
const labels = { rock: 'Pierre', paper: 'Feuille', scissors: 'Ciseaux' };
export function DuelView({
  state,
  self,
  act,
  disabled = false,
}: {
  state: GameState;
  self?: string;
  act: (a: GameAction) => void;
  disabled?: boolean;
}) {
  const d = state.duel!;
  const actor = state.players.find((p) => p.id === getDecisionPlayerId(state))!;
  const canPlay = !disabled && !actor.bot && (!self || self === actor.id);
  const [amount, setAmount] = useState('50000');
  const [error, setError] = useState('');
  const secrets = useRef<Record<string, { choice: DuelChoice; salt: string }>>({});
  const key = (id: string) => `money-tour.duel.${d.id}.${id}`;
  const choose = (choice: DuelChoice) => {
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    const secret = { choice, salt };
    secrets.current[actor.id] = secret;
    try {
      sessionStorage.setItem(key(actor.id), JSON.stringify(secret));
    } catch {
      /* The in-memory secret still supports this duel. */
    }
    act({
      type: 'duel_commit',
      playerId: actor.id,
      hash: duelCommitment(d.id, actor.id, choice, salt),
    });
  };
  const reveal = () => {
    let secret = secrets.current[actor.id];
    try {
      secret ??= JSON.parse(sessionStorage.getItem(key(actor.id)) ?? 'null');
    } catch {
      /* Offer cancellation if the local secret was lost. */
    }
    if (
      !secret ||
      !duelChoices.includes(secret.choice) ||
      duelCommitment(d.id, actor.id, secret.choice, secret.salt) !== d.commitments[actor.id]
    ) {
      setError(
        'Votre choix n’est plus disponible sur cet appareil. Abandonner le duel donne le pot à votre adversaire.',
      );
      return;
    }
    act({ type: 'duel_reveal', playerId: actor.id, ...secret });
  };
  return (
    <div className="duel-view">
      <div className="duel-hands" aria-hidden="true">
        ✊ <span>✋</span> ✌️
      </div>
      <p className="eyebrow">
        {canPlay ? `À vous, ${actor.name}` : `${actor.name} prépare son duel`}
      </p>
      {d.stage === 'offer' ? (
        <>
          <p>
            Choisissez votre adversaire et une mise identique pour chacun. Il pourra accepter ou
            refuser.
          </p>
          {canPlay && (
            <>
              <label>
                Mise par joueur
                <input
                  aria-label="Mise par joueur"
                  type="number"
                  min="1"
                  max={actor.cash}
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <div className="decision-actions">
                {getLegalActions(state)
                  .filter((a) => a.type === 'duel_offer')
                  .map(
                    (a) =>
                      a.type === 'duel_offer' && (
                        <button
                          className="primary"
                          key={a.targetId}
                          disabled={
                            !Number.isSafeInteger(Number(amount)) ||
                            Number(amount) <= 0 ||
                            Number(amount) >
                              Math.min(
                                actor.cash,
                                state.players.find((p) => p.id === a.targetId)!.cash,
                              )
                          }
                          onClick={() => act({ ...a, amount: Number(amount) })}
                        >
                          Défier {state.players.find((p) => p.id === a.targetId)!.name}
                          <ActionClock />
                        </button>
                      ),
                  )}
              </div>
              <button
                className="secondary"
                onClick={() => act({ type: 'duel_cancel', playerId: actor.id })}
              >
                Passer ce duel <ActionClock />
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <p>
            <strong>{state.players.find((p) => p.id === d.challengerId)!.name}</strong> contre{' '}
            <strong>{state.players.find((p) => p.id === d.targetId)!.name}</strong>
          </p>
          <p>
            Mise : <strong>{money(d.amount)}</strong> chacun · Pot :{' '}
            <strong>{money(d.amount * 2)}</strong>
          </p>
          {d.stage === 'accept' && (
            <>
              <p>Le gagnant remporte le pot. En cas d’égalité, chacun récupère sa mise.</p>
              {canPlay && (
                <div className="decision-actions">
                  <button
                    className="primary"
                    onClick={() => act({ type: 'duel_accept', playerId: actor.id })}
                  >
                    Accepter et miser {money(d.amount)} <ActionClock />
                  </button>
                  <button
                    className="secondary"
                    onClick={() => act({ type: 'duel_decline', playerId: actor.id })}
                  >
                    Refuser le duel <ActionClock />
                  </button>
                </div>
              )}
            </>
          )}
          {d.stage === 'commit' && (
            <>
              <p>
                Votre choix reste secret jusqu’à ce que les deux joueurs soient prêts.
                {!self && ' Passez l’écran au joueur indiqué avant de choisir.'}
              </p>
              {canPlay && (
                <div className="duel-choices">
                  {duelChoices.map((choice) => (
                    <button className="primary" key={choice} onClick={() => choose(choice)}>
                      <span aria-hidden="true">{hands[choice]}</span>
                      {labels[choice]}
                      <ActionClock />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {d.stage === 'reveal' && (
            <>
              <p>Les choix sont verrouillés. Place à la révélation !</p>
              {canPlay && (
                <button className="primary" onClick={reveal}>
                  Révéler mon choix <ActionClock />
                </button>
              )}
            </>
          )}
          {d.escrow && (
            <p className="setup-note">
              Une fois la mise acceptée, abandonner ou laisser expirer son délai donne le pot à
              l’adversaire.
            </p>
          )}
          {error && (
            <>
              <p role="alert">{error}</p>
              <button
                className="secondary"
                onClick={() => act({ type: 'duel_cancel', playerId: actor.id })}
              >
                Abandonner ce duel
              </button>
            </>
          )}
        </>
      )}
      {!canPlay && <p role="status">Votre adversaire joue. Le résultat apparaîtra ici.</p>}
    </div>
  );
}
