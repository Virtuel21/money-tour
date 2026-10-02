import type { GameState } from '@money-tour/engine';
import { publicVictoryProgress, type CollectionProgress } from './strategy';
import { money } from './local';
import { GameIcon } from './GameIcon';
import './strategy.css';

export function StrategyProgress({
  state,
  playerId,
  onHighlight,
  onTile,
  expanded = false,
}: {
  state: GameState;
  playerId: string;
  onHighlight?: (ids: number[]) => void;
  onTile: (id: number) => void;
  expanded?: boolean;
}) {
  const progress = publicVictoryProgress(state, playerId);
  const name = state.players.find((p) => p.id === playerId)?.name ?? 'Joueur';
  const collections = [...progress.groups].sort(
    (a, b) =>
      Number(a.complete) - Number(b.complete) ||
      b.owned / b.tiles.length - a.owned / a.tiles.length,
  );
  const renderCollection = (group: CollectionProgress) => (
    <li key={group.key}>
      <div className="strategy-collection-title">
        <strong>{group.label}</strong>
        <span>{group.complete ? 'Complète' : `${group.owned} / ${group.tiles.length}`}</span>
        {onHighlight && (
          <button
            type="button"
            aria-label={`Repérer ${group.label} sur le plateau`}
            onClick={() => onHighlight(group.tiles.map((t) => t.id))}
          >
            <GameIcon name="map" /> Repérer
          </button>
        )}
      </div>
      {!!group.missing.length && (
        <p>
          Il manque{' '}
          {group.missing.map(({ tile, owner }, i) => (
            <span key={tile.id}>
              {i > 0 && ', '}
              <button
                type="button"
                className="strategy-destination"
                onClick={() => onTile(tile.id)}
              >
                {tile.name} <small>({owner})</small>
              </button>
            </span>
          ))}
          .
        </p>
      )}
    </li>
  );
  return (
    <section className="strategy-progress" aria-label={`Progression vers la victoire de ${name}`}>
      <header>
        <span>
          <GameIcon name="trophy" /> {state.mode === 'teams' ? `Équipe de ${name}` : name} · Cap sur
          la victoire
        </span>
        <strong>
          {progress.completed} / {progress.target} rues complètes
        </strong>
      </header>
      <div
        className="strategy-meter"
        role="progressbar"
        aria-label="Rues complètes"
        aria-valuemin={0}
        aria-valuemax={progress.target}
        aria-valuenow={Math.min(progress.completed, progress.target)}
      >
        <i
          style={{
            width: `${Math.min(100, (progress.completed / Math.max(1, progress.target)) * 100)}%`,
          }}
        />
      </div>
      <dl className="strategy-money">
        <div>
          <dt>Argent disponible</dt>
          <dd>{money(progress.cash, true)}</dd>
        </div>
        <div>
          <dt>Patrimoine</dt>
          <dd>{money(progress.netWorth, true)}</dd>
        </div>
      </dl>
      <p className="strategy-note">
        Au chrono, le patrimoine départage : argent + valeur des propriétés et bâtiments.
      </p>
      {progress.eliminated ? (
        <p>Éliminé : aucune collection active.</p>
      ) : (
        <details open={expanded || undefined}>
          <summary>Voir les propriétés à obtenir</summary>
          <p className="strategy-note">
            {state.mode === 'teams'
              ? 'Les possessions des équipiers encore en jeu sont réunies. '
              : ''}
            {progress.islands
              ? `Les ${progress.islands.tiles.length} îles réunies comptent pour une rue complète.`
              : ''}
          </p>
          <ul className="strategy-collections">{collections.map(renderCollection)}</ul>
          {(progress.lines.length > 0 || (progress.islandVictory && progress.islands)) && (
            <details className="strategy-alternatives">
              <summary>Autres victoires par les propriétés</summary>
              {progress.lines.length > 0 && (
                <>
                  <p>Posséder toutes les propriétés d’un même côté du plateau.</p>
                  <ul className="strategy-collections">{progress.lines.map(renderCollection)}</ul>
                </>
              )}
              {progress.islandVictory && progress.islands && (
                <p>
                  Réunir les {progress.islands.tiles.length} îles donne aussi une victoire
                  immédiate.
                </p>
              )}
            </details>
          )}
          <p className="strategy-note">
            Faillites : {progress.opposingSides}{' '}
            {state.mode === 'teams' ? 'équipe(s) adverse(s)' : 'adversaire(s)'} encore en jeu.
          </p>
        </details>
      )}
    </section>
  );
}
