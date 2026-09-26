import { ActionClock } from './ActionClock';
import { getLegalActions, type GameState } from '@money-tour/engine';
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
  return (
    <div className="purchase-offer">
      <div className="purchase-cover" style={{ borderColor: tile.color ?? '#edc866' }}>
        <span
          className={tile.type === 'city' ? 'property-art' : 'island-offer-icon'}
          aria-hidden="true"
        >
          {tile.type === 'resort' ? '🏝' : ''}
        </span>
        <div>
          <p className="eyebrow">UNE NOUVELLE ESCALE POUR {player.name}</p>
          <h3>{tile.name}</h3>
          <p>Ajoutez cette propriété à votre collection.</p>
        </div>
      </div>
      <div className="property-stats">
        <div>
          <small>Prix d’achat</small>
          <strong>{money(tile.price!)}</strong>
        </div>
        <div>
          <small>Votre compte</small>
          <strong>{money(player.cash)}</strong>
        </div>
      </div>
      {tile.type === 'city' ? (
        <>
          <table className="purchase-table">
            <thead>
              <tr>
                <th>Niveau</th>
                <th>Construction</th>
                <th>Loyer de base</th>
              </tr>
            </thead>
            <tbody>
              {tile.rents!.map((rent, level) => (
                <tr key={level}>
                  <th>{['Terrain', 'Maison 1', 'Maison 2', 'Maison 3', 'Hôtel'][level]}</th>
                  <td>{level ? money(tile.buildCosts![level]!, true) : '—'}</td>
                  <td>{money(rent, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="setup-note">
            Construction niveau par niveau après acquisition de toute la rue :{' '}
            {state.config.board
              .filter((t) => t.group === tile.group)
              .map((t) => t.name)
              .join(' · ')}
            . Festivals ×2 ; Mondial ×2 pendant 4 tours du propriétaire, sans cumul.
          </p>
        </>
      ) : (
        <>
          <h3>Plus d’îles, plus de loyers</h3>
          <div className="island-rents">
            {state.config.resortRents.map((rent, i) => (
              <span key={i}>
                {i + 1} île{i ? 's' : ''}
                <strong>{money(rent, true)}</strong>
              </span>
            ))}
          </div>
          <p>Les îles ne reçoivent pas de bâtiments.</p>
        </>
      )}
      {!canBuy && (
        <p role="status">
          Il vous manque {money(Math.max(0, tile.price! - player.cash), true)} pour acheter.
        </p>
      )}
      <button className="primary purchase-cta" disabled={!canBuy} onClick={onBuy}>
        <span>
          Acheter {tile.name} · {money(tile.price!, true)}
        </span>
        <ActionClock />
      </button>
      <button className="secondary purchase-pass" onClick={onPass}>
        <span>Non merci, je passe</span>
        <ActionClock />
      </button>
      {onFraud && getLegalActions(state).some((a) => a.type === 'buy_fraud') && (
        <>
          <button className="secondary purchase-cta" onClick={onFraud}>
            <span>
              Utiliser Fraude fiscale ·{' '}
              {money(Math.floor(tile.price! * (state.config.fraudDiscount ?? 0.5)), true)}
            </span>
            <ActionClock />
          </button>
          <p className="fraud-risk">
            Risque jusqu’au prochain passage par Départ : {money(tile.price! * 2, true)} si vous
            tombez sur Taxe.
          </p>
        </>
      )}
    </div>
  );
}
