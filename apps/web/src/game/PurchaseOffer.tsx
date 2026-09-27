import { useState } from 'react';
import {
  reservedCity,
  getLegalActions,
  getPurchaseQuote,
  type GameState,
} from '@money-tour/engine';
import { ActionClock } from './ActionClock';
import { money } from './local';
import { BuildingIllustration } from './BuildingIllustration';

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
  onBuy: (level: number) => void;
  onFraud?: (level: number) => void;
  onPass: () => void;
}) {
  const { player, tile } = purchaseOffer(state)!;
  const [level, setLevel] = useState(0);
  const quote = getPurchaseQuote(state, level)!;
  const fraudQuote = getPurchaseQuote(state, level, true)!;
  const canBuy = quote.canBuy;
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
        <span>{money(quote.total, true)}</span>
      </header>
      {tile.type === 'city' ? (
        <>
          <div className="purchase-levels" aria-label="Choisir les bâtiments à acheter">
            {tile.rents!.map((_, index) => (
              <button
                key={index}
                aria-pressed={level === index}
                disabled={!getPurchaseQuote(state, index)?.available}
                className={index === 4 && hotelLocked ? 'level-locked' : ''}
                aria-label={`${labels[index]} : loyer ${money(getPurchaseQuote(state, index)!.rent, true)}${index === 4 && hotelLocked ? ', hôtel verrouillé' : ''}`}
                onClick={() => setLevel(index)}
              >
                <BuildingIllustration level={index} />
                <strong>{labels[index]}</strong>
                <span className="level-rent">
                  Loyer <b>{money(getPurchaseQuote(state, index)!.rent, true)}</b>
                </span>
                <span className="level-check" aria-hidden="true">
                  {level === index && (
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path
                        d="m5 12 4 4L19 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {index === 4 && hotelLocked && (
                  <span className="level-lock">
                    Après {state.config.hotelUnlockLaps ?? 1} tours
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="purchase-preview" aria-live="polite">
            <span>
              Loyer actuel <strong>{money(quote.rent, true)}</strong>
            </span>
            {level > 0 && (
              <span>
                Bâtiments inclus <strong>+{money(quote.buildings, true)}</strong>
              </span>
            )}
          </div>
          <p className="purchase-rule">
            {modern
              ? 'Maisons sans rue complète. Hôtel après 5 tours du plateau.'
              : 'Rue complète requise. Deux maisons maximum avant le premier passage Départ.'}{' '}
            {level > 0 && 'Le prix comprend le terrain et tous les bâtiments sélectionnés.'}
            {!state.config.bundledPurchase && 'Cette sauvegarde conserve l’achat du terrain seul.'}
          </p>
        </>
      ) : (
        <div className="island-rents">
          <BuildingIllustration level={0} island />
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
        {canBuy && <span> · Après achat {money(player.cash - quote.total, true)}</span>}
      </p>
      {!canBuy && (
        <p role="status">Il manque {money(Math.max(0, quote.total - player.cash), true)}.</p>
      )}
      <div className="purchase-buttons">
        <button className="primary purchase-cta" disabled={!canBuy} onClick={() => onBuy(level)}>
          <span>
            Acheter{' '}
            {tile.type === 'resort'
              ? 'l’île'
              : level === 0
                ? 'le terrain'
                : `avec ${level === 4 ? 'hôtel' : labels[level]}`}{' '}
            · {money(quote.total, true)}
          </span>
          <ActionClock />
        </button>
        <button className="secondary purchase-pass" onClick={onPass}>
          <span>Passer</span>
          <ActionClock />
        </button>
      </div>
      {tile.type === 'city' && (
        <p className="purchase-buyout">
          {level === state.config.hotelLevel ? (
            'Un hôtel ne peut pas être racheté par un adversaire.'
          ) : (
            <>
              Rachat par un adversaire :{' '}
              <strong>
                {money(
                  Math.floor((tile.price! + quote.buildings) * state.config.buyoutMultiplier),
                  true,
                )}
              </strong>
            </>
          )}
        </p>
      )}
      {onFraud && getLegalActions(state).some((a) => a.type === 'buy_fraud') && (
        <>
          <button
            className="secondary purchase-fraud"
            disabled={!fraudQuote.canBuy}
            onClick={() => onFraud(level)}
          >
            Fraude fiscale · {money(fraudQuote.total, true)}
            <ActionClock />
          </button>
          <p className="fraud-risk">
            Réduction sur le terrain uniquement. Risque : {money(tile.price! * 2, true)} sur Taxe,
            jusqu’au prochain Départ.
          </p>
        </>
      )}
    </div>
  );
}
