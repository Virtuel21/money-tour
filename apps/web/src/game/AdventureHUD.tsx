import { useState } from 'react';
import {
  adventureText,
  questRules,
  getRent,
  type GameState,
  type Player,
} from '@money-tour/engine';
import { money } from './local';
export function AdventureBanner({ state }: { state: GameState }) {
  return (
    <section className="adventure-banner" aria-label="Règle spéciale de cette partie">
      <span>✦ CETTE PARTIE</span>
      <strong>{adventureText(state)}</strong>
      {state.adventure && (
        <small>
          Tour de table {state.adventure.round} ·{' '}
          {state.adventure.tenderDone
            ? 'Appel d’offres proposé'
            : 'Un appel d’offres secret aura lieu pendant la partie'}
        </small>
      )}
    </section>
  );
}
export function PrivateQuest({
  state,
  player,
  self,
}: {
  state: GameState;
  player: Player;
  self?: string;
}) {
  const [opened, setOpened] = useState(false),
    q = state.quests?.[player.id];
  if (!q || player.bot || (self && self !== player.id)) return null;
  const rule = questRules[q.kind];
  return (
    <section className="private-quest" aria-label="Mon objectif secret">
      {q.completed ? (
        <p>✦ Objectif accompli · {rule.title} · 100 k reçus</p>
      ) : self || opened ? (
        <>
          <strong>🔒 {rule.title}</strong>
          <span>
            {Math.min(q.progress, rule.goal)} / {rule.goal} · Récompense 100 k
          </span>
          {!self && <button onClick={() => setOpened(false)}>Masquer mon objectif</button>}
        </>
      ) : (
        <button onClick={() => setOpened(true)}>🔒 {player.name} · voir mon objectif secret</button>
      )}
    </section>
  );
}
export function PlayerInventory({
  state,
  player,
  onTile,
}: {
  state: GameState;
  player: Player;
  onTile: (id: number) => void;
}) {
  const cities = state.config.board.filter((t) => state.properties[t.id]?.ownerId === player.id);
  return (
    <div className="player-inventory">
      <div className="mini-properties" aria-label={`Propriétés de ${player.name}`}>
        {cities.map((t) => (
          <button
            key={t.id}
            className="mini-property"
            style={{ borderTopColor: t.color ?? '#f1d17b' }}
            onClick={() => onTile(t.id)}
            title={`${t.name} · loyer ${money(getRent(state, t.id))}`}
          >
            <span>
              {t.type === 'resort' ? '🏝' : state.properties[t.id]!.level === 4 ? '▥' : '⌂'}
            </span>
            <b>{t.name}</b>
            <small>{new Intl.NumberFormat('fr-FR').format(getRent(state, t.id) / 1000)} k</small>
          </button>
        ))}
        {!cities.length && <small className="empty-estate">Aucune propriété pour le moment</small>}
      </div>
      <div className="bonus-tokens" aria-label={`Bonus de ${player.name}`}>
        {player.insurance && (
          <span title="Bloque une expropriation, une destruction ou un rachat hostile">
            🛡{' '}
            {player.insurance.tile === null
              ? 'Assurance disponible'
              : state.config.board[player.insurance.tile]!.name}
          </span>
        )}
        {player.escapeCards.map((id, i) => (
          <span key={id + i}>🎫 Sortie de l’île</span>
        ))}
        {player.heldCards?.map((id, i) => {
          const c = state.config.cards.find((c) => c.id === id);
          return (
            <span key={id + i} title={c?.description}>
              ▣ {c?.title}
            </span>
          );
        })}
        {state.alliance?.beneficiaryId === player.id && <span>🤝 Alliance · 50 % des gains</span>}
        {cities
          .filter((t) => state.properties[t.id]!.championships)
          .map((t) => (
            <span key={t.id}>
              🏆 {t.name} · {state.properties[t.id]!.championshipTurns} tours
            </span>
          ))}
      </div>
    </div>
  );
}
