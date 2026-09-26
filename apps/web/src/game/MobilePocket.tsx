import { useState } from 'react';
import { adventureText, getRent, type GameState } from '@money-tour/engine';
import { PrivateQuest } from './AdventureHUD';
import { money } from './local';

/** A small paginated collection: the board never becomes a scrolling inventory. */
export function MobilePocket({
  state,
  self,
  onTile,
}: {
  state: GameState;
  self?: string;
  onTile: (id: number) => void;
}) {
  const viewer =
    state.players.find((p) => p.id === self) ??
    (state.players.filter((p) => !p.bot).length === 1
      ? state.players.find((p) => !p.bot)
      : undefined) ??
    state.players[state.currentPlayer]!;
  const [tab, setTab] = useState<'cities' | 'bonus' | 'quest' | 'rules'>('cities');
  const [owner, setOwner] = useState(viewer.id);
  const [page, setPage] = useState(0);
  const player = state.players.find((p) => p.id === owner) ?? state.players[0]!;
  const cities = state.config.board.filter((t) => state.properties[t.id]?.ownerId === owner);
  const bonuses = [
    ...(player.insurance
      ? [
          '🛡 Assurance · ' +
            (player.insurance.tile === null
              ? 'À placer sur une propriété'
              : state.config.board[player.insurance.tile]!.name),
        ]
      : []),
    ...player.escapeCards.map(() => '🎫 Sortie de l’île · Vous libère sans payer'),
    ...(player.heldCards ?? []).map((id) => {
      const card = state.config.cards.find((c) => c.id === id);
      return `${card?.title} · ${card?.description}`;
    }),
    ...(player.fraudLiability
      ? ['⚠ Risque fiscal · ' + money(player.fraudLiability) + ' jusqu’au prochain passage Départ']
      : []),
    ...(state.alliance?.beneficiaryId === owner
      ? ['🤝 Alliance · Vous recevez 50 % des gains du joueur allié']
      : []),
    ...cities
      .filter((t) => state.properties[t.id]!.championships)
      .map(
        (t) => `🏆 ${t.name} · Mondial pendant ${state.properties[t.id]!.championshipTurns} tours`,
      ),
  ];
  const pages = Math.max(
    1,
    Math.ceil((tab === 'cities' ? cities.length : bonuses.length) / (tab === 'cities' ? 4 : 2)),
  );
  const index = Math.min(page, pages - 1);
  return (
    <div className="mobile-pocket">
      <nav aria-label="Votre carnet">
        {(['cities', 'bonus', 'quest', 'rules'] as const).map((item, i) => (
          <button
            key={item}
            aria-pressed={tab === item}
            onClick={() => {
              setTab(item);
              setPage(0);
            }}
          >
            {['Villes', 'Bonus', 'Objectif', 'Partie'][i]}
          </button>
        ))}
      </nav>
      {(tab === 'cities' || tab === 'bonus') && (
        <>
          <div className="pocket-owners" aria-label="Joueur consulté">
            {state.players.map((p) => (
              <button
                key={p.id}
                aria-pressed={owner === p.id}
                onClick={() => {
                  setOwner(p.id);
                  setPage(0);
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
          {tab === 'cities' ? (
            <div className="pocket-cities">
              {cities.slice(index * 4, index * 4 + 4).map((t) => (
                <button key={t.id} style={{ borderTopColor: t.color }} onClick={() => onTile(t.id)}>
                  <b>{t.name}</b>
                  <span>Loyer {money(getRent(state, t.id), true)}</span>
                </button>
              ))}
              {!cities.length && <p>Aucune propriété pour le moment.</p>}
            </div>
          ) : (
            <div className="pocket-bonuses">
              {bonuses.slice(index * 2, index * 2 + 2).map((b, i) => (
                <p key={i}>{b}</p>
              ))}
              {!bonuses.length && <p>Les cartes conservées et les jetons apparaîtront ici.</p>}
            </div>
          )}
          {pages > 1 && (
            <div className="pocket-pages">
              <button
                aria-label="Page précédente"
                disabled={!index}
                onClick={() => setPage(index - 1)}
              >
                ←
              </button>
              <span>
                {index + 1} / {pages}
              </span>
              <button
                aria-label="Page suivante"
                disabled={index === pages - 1}
                onClick={() => setPage(index + 1)}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
      {tab === 'quest' && (
        <PrivateQuest key={viewer.id} state={state} player={viewer} self={self} />
      )}
      {tab === 'rules' && (
        <div className="pocket-rule">
          <p>{adventureText(state)}</p>
          <p>
            Tour de table {state.adventure?.round ?? 1} ·{' '}
            {state.adventure?.tenderDone
              ? 'Appel d’offres proposé'
              : 'Un appel d’offres secret aura lieu pendant cette partie.'}
          </p>
          {state.crisis && (
            <p>
              📉 Crise : loyers −50 % · {state.crisis.remaining.length} joueur(s) doivent encore
              jouer.
            </p>
          )}
          {state.alliance && (
            <p>
              🤝 {state.players.find((p) => p.id === state.alliance!.beneficiaryId)?.name} reçoit 50
              % des gains de {state.players.find((p) => p.id === state.alliance!.targetId)?.name}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
