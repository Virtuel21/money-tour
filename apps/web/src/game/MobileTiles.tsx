import { useState } from 'react';
import { getPropertyValue, type GameState } from '@money-tour/engine';
import { ActionClock } from './ActionClock';
import { money } from './local';

export function MobileTiles({
  state,
  choices,
  onTile,
}: {
  state: GameState;
  choices: number[];
  onTile: (id: number) => void;
}) {
  const [page, setPage] = useState(0);
  const tiles = choices.length
    ? state.config.board.filter((t) => choices.includes(t.id))
    : state.config.board;
  const selling = state.phase === 'debt';
  const size = selling ? 4 : 6;
  const pages = Math.max(1, Math.ceil(tiles.length / size));
  const index = Math.min(page, pages - 1);
  return (
    <>
      {choices.length > 0 && !selling && <p>Choisissez une des cases disponibles.</p>}
      <div className="tile-list mobile-tile-list">
        {tiles.slice(index * size, index * size + size).map((t) => (
          <button key={t.id} onClick={() => onTile(t.id)}>
            <i style={{ background: t.color ?? '#e6b94a' }} />
            {t.name}
            <small>
              {selling
                ? 'Vendre · ' +
                  money(Math.floor(getPropertyValue(state, t.id) * state.config.resaleRate), true)
                : t.price
                  ? money(t.price, true)
                  : 'Escale spéciale'}
            </small>
            {selling && <ActionClock />}
          </button>
        ))}
      </div>
      {pages > 1 && (
        <div className="pocket-pages">
          <button
            disabled={!index}
            aria-label="Cases précédentes"
            onClick={() => setPage(index - 1)}
          >
            ←
          </button>
          <span>
            {index + 1} / {pages}
          </span>
          <button
            disabled={index === pages - 1}
            aria-label="Cases suivantes"
            onClick={() => setPage(index + 1)}
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
