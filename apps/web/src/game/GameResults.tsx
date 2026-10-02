import { getNetWorth, type GameState } from '@money-tour/engine';
import { money } from './local';
import type { GameStats } from './gameStats';
import './game-summary.css';
import { publicVictoryProgress } from './strategy';

export function GameResults({
  state,
  stats,
  onRematch,
  rematchDisabled,
  rematchLabel,
}: {
  state: GameState;
  stats?: GameStats;
  onRematch?: () => void;
  rematchDisabled?: boolean;
  rematchLabel?: string;
}) {
  const ranked = [...state.players].sort(
    (a, b) => getNetWorth(state, b.id) - getNetWorth(state, a.id),
  );
  return (
    <section className="game-summary" aria-label="Bilan du voyage">
      <p>Classement par patrimoine · {Math.floor(state.elapsedMs / 60000)} min de jeu</p>
      {ranked.map((player) => {
        const owned = state.config.board.filter(
          (tile) => state.properties[tile.id]?.ownerId === player.id,
        );
        const collections = publicVictoryProgress(state, player.id).completed;
        const best = Object.entries(stats?.rentByTile[player.id] ?? {}).sort(
          (a, b) => b[1] - a[1],
        )[0];
        return (
          <article
            key={player.id}
            className={state.winner?.playerIds.includes(player.id) ? 'summary-winner' : ''}
          >
            <header>
              <strong>{player.name}</strong>
              <b>{money(getNetWorth(state, player.id))}</b>
            </header>
            <dl>
              <div>
                <dt>Argent disponible</dt>
                <dd>{money(player.cash)}</dd>
              </div>
              <div>
                <dt>Propriétés conservées</dt>
                <dd>
                  {owned.length} dont{' '}
                  {
                    owned.filter((t) => state.properties[t.id]?.level === state.config.hotelLevel)
                      .length
                  }{' '}
                  hôtel(s)
                </dd>
              </div>
              <div>
                <dt>Rues complètes{state.mode === 'teams' ? ' de l’équipe' : ''}</dt>
                <dd>{collections}</dd>
              </div>
              <div>
                <dt>Tours complets du plateau</dt>
                <dd>{player.laps}</dd>
              </div>
              {stats && (
                <div>
                  <dt>Loyers encaissés{!stats.complete ? ' depuis la reprise' : ''}</dt>
                  <dd>{money(stats.rent[player.id] ?? 0)}</dd>
                </div>
              )}
            </dl>
            {best && (
              <p className="summary-highlight">
                Plus gros revenu locatif : {state.config.board[Number(best[0])]?.name} ·{' '}
                {money(best[1])}
              </p>
            )}
          </article>
        );
      })}
      {!stats && <p>Les loyers historiques ne sont pas disponibles pour cette sauvegarde.</p>}
      {onRematch ? (
        <button className="primary" disabled={rematchDisabled} onClick={onRematch}>
          {rematchLabel ?? 'Revanche avec les mêmes joueurs'}
        </button>
      ) : (
        rematchLabel && <p role="status">{rematchLabel}</p>
      )}
      <small>
        Mêmes joueurs, équipes et durée. Un nouveau plateau et de nouveaux objectifs sont tirés.
      </small>
    </section>
  );
}
