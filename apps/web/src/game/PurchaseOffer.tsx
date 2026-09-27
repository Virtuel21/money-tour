import { useState } from 'react';
import { reservedCity, getLegalActions, type GameState } from '@money-tour/engine';
import { ActionClock } from './ActionClock';
import { money } from './local';

export function purchaseOffer(state: GameState, self?: string) {
  const player = state.players[state.currentPlayer]!;
  const tile = state.config.board[player.position]!;
  if (
    state.winner ||
    state.phase !== 'property' ||
    player.bot ||
    (self !== undefined && self !== player.id) ||
    !tile.price ||
    reservedCity(state, tile.id) ||
    state.properties[tile.id]?.ownerId
  )
    return null;
  return { player, tile, canBuy: getLegalActions(state).some((a) => a.type === 'buy') };
}
export function PurchaseDetails({
  state,
  onBuy,
  onFraud,
  onPass,
}: {
  state: GameState;
  onBuy: () => void;
  onFraud?: () => void;
  onPass: () => void;
}) {
  const { player, tile, canBuy } = purchaseOffer(state)!;
  const [level, setLevel] = useState(0);
  const hotelLocked = player.laps < (state.config.hotelUnlockLaps ?? 1);
  const labels = ['Terrain', '1 maison', '2 maisons', '3 maisons', 'Hôtel'];
  const modern = state.config.buildingRequiresGroup === false;
  return (
    <div
      className="purchase-offer purchase-simple"
      style={{ '--property-color': tile.color ?? '#348d91' } as React.CSSProperties}
    >
      <header className="purchase-title">
        <div>
          <small>{tile.type === 'resort' ? 'ÎLE PRIVÉE' : 'VILLE DISPONIBLE'}</small>
          <h3>{tile.name}</h3>
        </div>
        <span>{money(tile.price!, true)}</span>
      </header>
      {tile.type === 'city' ? (
        <>
          <div className="purchase-levels" aria-label="Aperçu des bâtiments et loyers">
            {tile.rents!.map((rent, index) => (
              <button
                key={index}
                aria-pressed={level === index}
                className={index === 4 && hotelLocked ? 'level-locked' : ''}
                aria-label={`${labels[index]} : loyer ${money(rent, true)}${index === 4 && hotelLocked ? ', hôtel verrouillé' : ''}`}
                onClick={() => setLevel(index)}
              >
                <span className={`building-preview level-${index}`} aria-hidden="true">
                  {index === 0 ? '◇' : index === 4 ? '▥' : '⌂'.repeat(index)}
                </span>
                <strong>{labels[index]}</strong>
                <small>{money(rent, true)}</small>
                {index === 4 && hotelLocked && (
                  <span className="level-lock">🔒 Tour {state.config.hotelUnlockLaps ?? 1}</span>
                )}
              </button>
            ))}
          </div>
          <div className="purchase-preview" aria-live="polite">
            <span>
              Loyer de base <strong>{money(tile.rents![level]!, true)}</strong>
            </span>
            {level > 0 && (
              <span>
                Ce niveau <strong>+{money(tile.buildCosts![level]!, true)}</strong>
              </span>
            )}
          </div>
          <p className="purchase-rule">
            {modern
              ? 'Maisons sans rue complète. Hôtel après 5 tours du plateau.'
              : 'Rue complète requise. Deux maisons maximum avant le premier passage Départ.'}{' '}
            {level > 0 && 'Aperçu : l’achat ci-dessous concerne le terrain.'}
          </p>
        </>
      ) : (
        <div className="island-rents">
          {state.config.resortRents.map((rent, i) => (
            <span key={i}>
              {i + 1} île{i ? 's' : ''}
              <strong>{money(rent, true)}</strong>
            </span>
          ))}
        </div>
      )}
      <p className="purchase-wallet">
        Votre compte <strong>{money(player.cash, true)}</strong>
        {canBuy && <span> · Après achat {money(player.cash - tile.price!, true)}</span>}
      </p>
      {!canBuy && (
        <p role="status">Il manque {money(Math.max(0, tile.price! - player.cash), true)}.</p>
      )}
      <div className="purchase-buttons">
        <button className="primary purchase-cta" disabled={!canBuy} onClick={onBuy}>
          <span>Acheter · {money(tile.price!, true)}</span>
          <ActionClock />
        </button>
        <button className="secondary purchase-pass" onClick={onPass}>
          <span>Passer</span>
          <ActionClock />
        </button>
      </div>
      {onFraud && getLegalActions(state).some((a) => a.type === 'buy_fraud') && (
        <>
          <button className="secondary purchase-fraud" onClick={onFraud}>
            Fraude fiscale ·{' '}
            {money(Math.floor(tile.price! * (state.config.fraudDiscount ?? 0.5)), true)}
            <ActionClock />
          </button>
          <p className="fraud-risk">
            Risque : {money(tile.price! * 2, true)} sur Taxe, jusqu’au prochain Départ.
          </p>
        </>
      )}
    </div>
  );
}
