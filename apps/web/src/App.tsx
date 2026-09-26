import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  chooseBotAction,
  config,
  createGame,
  getLegalActions,
  getNetWorth,
  getPropertyValue,
  getRent,
  type GameAction,
  type GameEvent,
  type GameState,
} from '@money-tour/engine';
const Board = lazy(() => import('./board/Board3D'));
import { usePresentation } from './game/usePresentation';
import { previewScenario } from './game/preview';
import { Soundscape, loadAudio } from './audio/synth';
const OnlineLobby = lazy(() => import('./network/OnlineLobby'));
import type { Session, SessionView } from './network/session';
import {
  applyLocal,
  colors,
  duration,
  loadLocal,
  money,
  newLocal,
  pawnNames,
  persistLocal,
  phaseText,
  victoryText,
  type LocalSave,
} from './game/local';
import credits from '../../../CREDITS.md?raw';

function Logo() {
  return (
    <span className="brand">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="18" fill="#142d3d" />
        <path d="M31 10v31H12z" fill="#fff6df" />
        <path d="M36 17v24h17z" fill="#e8725b" />
        <path d="M10 45h45l-10 9H20z" fill="#e6b94a" />
      </svg>
      <span>
        MONEY <b>TOUR</b>
      </span>
    </span>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} className="modal">
      <div className="modal-heading">
        <h2>{title}</h2>
        <button aria-label="Fermer" className="icon-button" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
function eventText(event: GameEvent, state: GameState): string {
  const name = state.players.find((p) => p.id === event.playerId)?.name ?? 'La banque';
  const tile = event.tile !== undefined ? state.config.board[event.tile]?.name : '';
  switch (event.type) {
    case 'dice':
      return `${name} lance ${event.dice?.join(' + ')}.`;
    case 'purchase':
      return `${name} achète ${tile} pour ${money(event.amount ?? 0, true)}.`;
    case 'buyout':
      return `${name} rachète ${tile}.`;
    case 'build':
      return `${name} construit à ${tile}.`;
    case 'card':
      return `${name} : ${event.message}`;
    case 'payment':
      return `${event.reason === 'rent' ? 'Loyer' : 'Versement'} : ${money(event.amount ?? 0, true)} ${event.playerId ? `pour ${name}` : 'à la banque'}.`;
    case 'start_bonus':
      return `${name} passe Départ : +${money(event.amount ?? 0, true)}.`;
    case 'bankruptcy':
      return `${name} fait faillite.`;
    case 'sale':
      return `${name} vend ${tile}.`;
    case 'island':
      return `${name} fait escale sur l’île perdue.`;
    case 'island_exit':
      return `${name} quitte l’île.`;
    case 'championship':
      return `${name} organise un championnat à ${tile}.`;
    case 'travel':
      return `${name} s’envole vers ${tile}.`;
    case 'timeout':
      return `${name} : décision automatique après 30 secondes.`;
    case 'quit':
      return `${name} quitte la partie.`;
    case 'victory':
      return 'La partie est terminée !';
    default:
      return '';
  }
}
const demo = createGame({
  players: [
    { id: 'p1', name: 'Vous' },
    { id: 'p2', name: 'Sacha' },
    { id: 'p3', name: 'Lou' },
    { id: 'p4', name: 'Noa' },
  ],
  seed: 'menu',
});
demo.players.forEach((player, i) => {
  player.position = [6, 12, 22, 29][i]!;
});
for (const [id, ownerId, level] of [
  [1, 'p1', 2],
  [5, 'p1', 1],
  [9, 'p2', 3],
  [14, 'p2', 1],
  [18, 'p3', 2],
  [26, 'p4', 4],
] as const)
  demo.properties[id] = { ownerId, level, championships: 0 };

export default function App() {
  const [save, setSave] = useState<LocalSave | null>(() => previewScenario() ?? loadLocal());
  const [screen, setScreen] = useState<'menu' | 'game'>(() =>
    previewScenario() ? 'game' : 'menu',
  );
  const [modal, setModal] = useState<
    'rules' | 'credits' | 'settings' | 'tiles' | 'leave' | 'online' | null
  >(location.hash.includes('room=') ? 'online' : null);
  const [createSalon, setCreateSalon] = useState(false);
  const [online, setOnline] = useState<SessionView | null>(null);
  const onlineSession = useRef<Session | null>(null);
  const onlineSeq = useRef(-1);
  const [audioPrefs, setAudioPrefs] = useState(loadAudio);
  const sound = useRef<Soundscape | null>(null);
  useEffect(() => {
    sound.current = new Soundscape();
    return () => sound.current?.close();
  }, []);
  useEffect(() => {
    sound.current?.configure(audioPrefs);
  }, [audioPrefs]);
  const [selected, setSelected] = useState<number | null>(null);
  const [count, setCount] = useState(4),
    [mode, setMode] = useState<'solo' | 'local' | 'teams'>('solo');
  const [minutes, setMinutes] = useState(20),
    [names, setNames] = useState(['Vous', 'Sacha', 'Lou', 'Noa']);
  const [bots, setBots] = useState([false, true, true, true]);
  const [paused, setPaused] = useState(false),
    [zoom, setZoom] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [history, setHistory] = useState<string[]>([]),
    [notice, setNotice] = useState('');
  const dispatchRef = useRef<(action: GameAction) => void>(() => {});
  const cinema = usePresentation(save?.state ?? demo, reduced, !!online);
  const rolling = cinema.busy;
  const display = cinema.frame.state;
  useEffect(() => {
    sound.current?.setScene(screen);
  }, [screen]);
  useEffect(() => {
    const kind = cinema.frame.cue.kind;
    if (cinema.frame.cue.sound) sound.current?.effect(cinema.frame.cue.sound);
    else if (kind !== 'settle') sound.current?.effect(kind === 'hop' ? 'move' : kind);
  }, [cinema.frame]);
  const current =
    screen === 'game' ? (rolling ? display : (online?.state ?? save?.state ?? demo)) : demo;
  const active = current.players[current.currentPlayer]!;
  const legal = screen === 'game' ? getLegalActions(current) : [];
  const act = (action: GameAction) => {
    if (onlineSession.current) {
      void onlineSession.current.intent(action);
      return;
    }
    if (!save) return;
    const { save: next, result } = applyLocal(save, action);
    if (result.error) {
      setNotice('Cette action n’est plus disponible.');
      return;
    }
    cinema.present(next.state, result.events);
    setSave(next);
    const messages = result.events.map((e) => eventText(e, next.state)).filter(Boolean);
    if (messages.length) setHistory((old) => [...messages.reverse(), ...old].slice(0, 60));
  };
  dispatchRef.current = act;
  useEffect(() => {
    if (save && !previewScenario() && !persistLocal(save))
      setNotice('Le navigateur ne permet pas la sauvegarde locale. Gardez cet onglet ouvert.');
  }, [save]);
  useEffect(() => {
    if (previewScenario() || online || screen !== 'game' || paused || rolling || current.winner)
      return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const elapsedMs = Math.max(0, Math.round(now - last));
      last = now;
      dispatchRef.current({ type: 'tick', elapsedMs });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, paused, rolling, Boolean(current.winner), Boolean(online)]);
  useEffect(() => {
    if (online || screen !== 'game' || paused || rolling || current.winner || !active.bot) return;
    const timer = setTimeout(() => dispatchRef.current(chooseBotAction(current)), 650);
    return () => clearTimeout(timer);
  }, [save, screen, paused, rolling, Boolean(online)]);
  const start = () => {
    const next = newLocal({
      players: Array.from({ length: count }, (_, i) => ({
        id: `p${i + 1}`,
        name: names[i]!.trim() || `Joueur ${i + 1}`,
        bot: bots[i],
        ...(mode === 'teams' ? { team: i % 2 } : {}),
      })),
      mode: mode === 'teams' ? 'teams' : 'free-for-all',
      durationMs: minutes * 60000,
    });
    cinema.reset(next.state);
    setSave(next);
    setHistory(['Bon voyage ! Trois villes accueillent un festival : leurs loyers sont doublés.']);
    setNotice('');
    setPaused(false);
    setScreen('game');
    setSelected(null);
  };
  const chooseMode = (value: 'solo' | 'local' | 'teams') => {
    setMode(value);
    if (value === 'teams') setCount(4);
    setBots(value === 'local' ? [false, false, false, false] : [false, true, true, true]);
  };
  const actionLabel = (action: GameAction): string => {
    const tile = current.config.board[active.position]!;
    switch (action.type) {
      case 'roll':
        return 'Lancer les dés';
      case 'attempt_escape':
        return 'Tenter un double';
      case 'pay_bail':
        return `Quitter l’île · ${money(config.islandFee, true)}`;
      case 'use_escape':
        return 'Utiliser mon billet de sortie';
      case 'buy':
        return `Acheter · ${money(tile.price ?? 0, true)}`;
      case 'buyout':
        return `Racheter · ${money(getPropertyValue(current, tile.id) * config.buyoutMultiplier, true)}`;
      case 'upgrade':
        return `Construire · ${money(tile.buildCosts?.[(current.properties[tile.id]?.level ?? 0) + 1] ?? 0, true)}`;
      case 'finish':
        return current.extraRoll
          ? 'Continuer · double !'
          : current.phase === 'property'
            ? 'Passer / terminer'
            : 'Fin du tour';
      case 'decline_travel':
        return 'Rester et lancer les dés';
      case 'sell':
        return `Vendre ${current.config.board[action.tile]?.name} · ${money(getPropertyValue(current, action.tile) * config.resaleRate, true)}`;
      case 'travel':
        return `Voyager à ${current.config.board[action.tile]?.name}`;
      case 'place_championship':
        return `Choisir ${current.config.board[action.tile]?.name}`;
      default:
        return action.type;
    }
  };
  const tile = selected === null ? null : current.config.board[selected]!;
  const property = selected === null ? undefined : current.properties[selected];
  const interactionDisabled =
    paused ||
    rolling ||
    active.bot ||
    Boolean(current.winner) ||
    Boolean(online && (online.self !== active.id || online.busy || online.blocked));
  const available = legal.filter((a) => !['quit', 'travel', 'place_championship'].includes(a.type));
  const options = legal.filter(
    (a): a is Extract<GameAction, { type: 'sell' | 'travel' | 'place_championship' }> =>
      a.type === 'travel' || a.type === 'place_championship',
  );
  const actionDescription =
    current.phase === 'debt'
      ? `Il vous manque ${money(Math.max(0, (current.debt?.amount ?? 0) - active.cash))}. Vendez un bien pour régler votre dette.`
      : current.phase === 'island'
        ? 'Payez le voyage de retour, utilisez un billet ou tentez un double. Vous sortirez au plus tard à la troisième tentative.'
        : current.phase === 'travel'
          ? `Choisissez une case libre ou alliée. Le voyage coûte ${money(config.travelFee, true)} et remplace les dés.`
          : current.phase === 'championship'
            ? `Un championnat coûte ${money(config.championshipFee, true)} et augmente le loyer d’une de vos villes.`
            : current.phase === 'property'
              ? `${current.config.board[active.position]!.name} vous accueille. Achetez, construisez ou poursuivez votre voyage.`
              : 'Deux dés. Une destination. Une nouvelle opportunité.';

  return (
    <div
      className="app"
      onPointerDownCapture={() => void sound.current?.unlock()}
      onKeyDownCapture={() => void sound.current?.unlock()}
    >
      <header className="topbar">
        <button
          className="brand-button"
          aria-label="Money Tour, accueil"
          onClick={() => {
            setScreen('menu');
            setPaused(false);
          }}
        >
          <Logo />
        </button>
        <nav>
          <button
            onClick={() => {
              setCreateSalon(false);
              setModal('online');
            }}
          >
            Rejoindre un salon
          </button>
          <button onClick={() => setModal('rules')}>
            Comment jouer <span>↗</span>
          </button>
          <button
            className="icon-button"
            aria-label="Réglages"
            onClick={() => setModal('settings')}
          >
            ⚙
          </button>
        </nav>
      </header>
      {screen === 'menu' ? (
        <main className="landing">
          <section className="intro">
            <div className="eyebrow">
              <i /> LE GRAND TOUR DES BONNES AFFAIRES
            </div>
            <h1>
              Un archipel.
              <br />
              Mille <em>fortunes.</em>
            </h1>
            <p className="intro-copy">
              Des villes à conquérir, des amis à défier.
              <br />
              Prenez les dés, votre prochaine aventure commence ici.
            </p>
            <div className="setup">
              <div className="setup-heading">
                <h2>Votre billet pour l’aventure</h2>
                <span>01 / DÉPART</span>
              </div>
              <div className="mode-tabs" role="group" aria-label="Mode de jeu">
                {(
                  [
                    ['solo', 'Solo & bots'],
                    ['local', 'Entre amis'],
                    ['teams', 'Équipes 2v2'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={mode === value}
                    onClick={() => chooseMode(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="setup-options">
                <label>
                  Voyageurs
                  <select
                    value={count}
                    disabled={mode === 'teams'}
                    onChange={(e) => setCount(Number(e.target.value))}
                  >
                    {[2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} joueurs
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Durée
                  <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                    {[1, 5, 10, 20, 30].map((n) => (
                      <option key={n} value={n}>
                        {n} min{n === 20 ? ' · classique' : n === 1 ? ' · express' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="seat-list">
                {Array.from({ length: count }, (_, i) => (
                  <div className="seat" key={i}>
                    <span className="seat-number" style={{ background: colors[i] }}>
                      {i + 1}
                    </span>
                    <input
                      aria-label={`Nom du joueur ${i + 1}`}
                      maxLength={20}
                      value={names[i]}
                      onChange={(e) =>
                        setNames((old) => old.map((n, j) => (j === i ? e.target.value : n)))
                      }
                    />
                    <select
                      aria-label={`Type du joueur ${i + 1}`}
                      value={bots[i] ? 'bot' : 'human'}
                      onChange={(e) =>
                        setBots((old) =>
                          old.map((b, j) => (j === i ? e.target.value === 'bot' : b)),
                        )
                      }
                    >
                      <option value="human">Humain</option>
                      <option value="bot">Bot</option>
                    </select>
                    {mode === 'teams' && <span className="team-tag">{i % 2 ? 'B' : 'A'}</span>}
                  </div>
                ))}
              </div>
              <button
                className="primary launch"
                onClick={() => {
                  setCreateSalon(true);
                  setModal('online');
                }}
                disabled={!!online}
              >
                Embarquer <span>→</span>
              </button>
              <button className="secondary local-launch" onClick={start} disabled={!!online}>
                Jouer sur cet appareil · solo / local
              </button>
              {save && (
                <button
                  className="resume"
                  disabled={!!online}
                  onClick={() => {
                    cinema.reset(save.state);
                    setScreen('game');
                    setPaused(false);
                  }}
                >
                  ↻ {save.state.winner ? 'Revoir le dernier résultat' : 'Reprendre ma partie'}
                </button>
              )}
              <p className="setup-note">
                {mode === 'local'
                  ? 'Passez l’écran au joueur suivant.'
                  : 'Changez les sièges en bots pour observer une partie.'}{' '}
                Sauvegarde sur cet appareil.
              </p>
            </div>
          </section>
          <section className="hero-map" aria-label="Aperçu du plateau">
            <span className="map-stamp">
              32 ESCALES
              <br />
              <b>∞ POSSIBILITÉS</b>
            </span>
            <Suspense fallback={<div className="board-shell">Préparation de l’archipel…</div>}>
              <Board state={demo} onTile={setSelected} reducedMotion demo />
            </Suspense>
            <div className="map-caption">
              <span>✦ Créé pour les bons moments</span>
              <span>2–4 voyageurs · dès maintenant</span>
            </div>
          </section>
          <div className="features">
            <div>
              <b>01</b>
              <span>
                <strong>Tracez votre route</strong>Achetez des villes et des stations.
              </span>
            </div>
            <div>
              <b>02</b>
              <span>
                <strong>Voyez plus grand</strong>Maisons, hôtels et championnats.
              </span>
            </div>
            <div>
              <b>03</b>
              <span>
                <strong>Changez la donne</strong>Une collection complète peut tout gagner.
              </span>
            </div>
          </div>
        </main>
      ) : (
        <main className="game-layout">
          <div className="game-top">
            <div>
              <span className="eyebrow">
                {current.mode === 'teams'
                  ? 'EXPÉDITION EN ÉQUIPE'
                  : online
                    ? 'SALON EN LIGNE'
                    : 'PARTIE LOCALE'}{' '}
                · TOUR {current.turn}
              </span>
              <h1>Le tour de la fortune</h1>
            </div>
            <div className="game-tools">
              <span className="clock" aria-label="Temps restant">
                ◷ {duration(current.durationMs - current.elapsedMs)}
              </span>
              <button
                className="subtle"
                onClick={() => setPaused(!paused)}
                disabled={!!current.winner || !!online}
              >
                {paused ? 'Reprendre' : 'Pause'}
              </button>
              <button
                className="icon-button"
                aria-label="Quitter la partie"
                onClick={() => setModal('leave')}
              >
                ↪
              </button>
            </div>
          </div>
          <div className="players">
            {current.players.map((p, i) => (
              <article
                key={p.id}
                className={`player-card ${current.currentPlayer === i ? 'active' : ''} ${p.eliminated ? 'eliminated' : ''}`}
                style={{ '--player-color': colors[i] } as React.CSSProperties}
              >
                <span className="avatar">
                  {i === 0 ? '◭' : i === 1 ? '◉' : i === 2 ? '♜' : '◇'}
                </span>
                <div>
                  <span className="player-name">
                    {p.name}{' '}
                    <small>
                      {p.bot
                        ? 'BOT'
                        : current.mode === 'teams'
                          ? `ÉQ. ${p.team === 0 ? 'A' : 'B'}`
                          : pawnNames[i]}
                    </small>
                  </span>
                  <strong>{p.eliminated ? 'Faillite' : money(p.cash, true)}</strong>
                </div>
                <span className="property-count" title="Propriétés">
                  ⌂ {Object.values(current.properties).filter((v) => v.ownerId === p.id).length}
                </span>
              </article>
            ))}
          </div>
          <section className={`board-area ${zoom ? 'zoomed' : ''}`}>
            <div className="board-viewport">
              <Suspense fallback={<div className="board-shell">Préparation du plateau…</div>}>
                <Board
                  state={display}
                  cue={cinema.frame.cue}
                  choices={interactionDisabled ? [] : options.map((a) => a.tile)}
                  onTile={(id) => {
                    const action = options.find((a) => a.tile === id);
                    if (action && !interactionDisabled) act(action);
                    else if (!rolling) setSelected(id);
                  }}
                  reducedMotion={reduced}
                />
              </Suspense>
            </div>
            <div className="roll-status" role="status">
              {cinema.frame.cue.kind === 'dice'
                ? 'Les dés roulent…'
                : rolling
                  ? cinema.frame.cue.kind === 'hop'
                    ? 'En route…'
                    : 'Votre aventure continue…'
                  : display.dice.length
                    ? 'Dés : ' +
                      display.dice.join(' + ') +
                      ' · ' +
                      display.dice.reduce((a, b) => a + b, 0) +
                      ' cases'
                    : 'À vous de lancer les dés'}
            </div>
            <div className="board-controls">
              <button onClick={() => setModal('tiles')}>Explorer les cases</button>
              <button onClick={() => setZoom(!zoom)}>{zoom ? 'Réduire' : 'Agrandir'}</button>
            </div>
          </section>
          <aside className="game-sidebar">
            <section className="action-card">
              <span className="eyebrow">
                {paused
                  ? 'PARTIE EN PAUSE'
                  : active.bot
                    ? 'UN BOT RÉFLÉCHIT…'
                    : online && online.self !== active.id
                      ? `TOUR DE ${active.name.toUpperCase()}`
                      : `À VOUS, ${active.name.toUpperCase()}`}
              </span>
              <h2>{paused ? 'Une petite escale ?' : phaseText[current.phase]}</h2>
              <p>{paused ? 'Le chrono et les bots vous attendent.' : actionDescription}</p>
              <div className="decision-time">
                <span
                  style={{
                    width: `${Math.max(0, 100 - (current.decisionElapsedMs / config.actionTimeoutMs) * 100)}%`,
                  }}
                />
              </div>
              {current.lastCard && !rolling && (
                <div className="chance-card">
                  <small>✦ LA BONNE ÉTOILE</small>
                  <strong>
                    {current.config.cards.find((c) => c.id === current.lastCard)?.title}
                  </strong>
                  <p>{current.config.cards.find((c) => c.id === current.lastCard)?.description}</p>
                </div>
              )}
              {options.length > 0 && (
                <p className="board-choice-hint">
                  Cliquez directement sur une case dorée du plateau pour{' '}
                  {current.phase === 'travel' ? 'vous y déplacer' : 'y placer le championnat'}.
                </p>
              )}
              <div className="actions">
                {available.map((a, i) => (
                  <button
                    key={`${a.type}-${'tile' in a ? a.tile : ''}`}
                    className={i === 0 && a.type !== 'finish' ? 'primary' : 'secondary'}
                    disabled={interactionDisabled}
                    onClick={() => act(a)}
                  >
                    {actionLabel(a)}
                    {a.type === 'roll' && <span>⚄</span>}
                  </button>
                ))}
              </div>
              {online && (
                <>
                  <p className="network-status" role="status">
                    {online.status}
                  </p>
                  {online.state?.players.find((p) => p.id === online.self)?.bot &&
                    !current.winner && (
                      <button
                        className="secondary"
                        onClick={() =>
                          act({ type: 'set_control', playerId: online.self, bot: false })
                        }
                      >
                        Reprendre mon siège
                      </button>
                    )}
                </>
              )}
              {active.bot && !current.winner && !online && (
                <button
                  className="text-button"
                  onClick={() => act({ type: 'set_control', playerId: active.id, bot: false })}
                >
                  Prendre la main sur ce bot
                </button>
              )}
              <small className="action-help">
                Les villes avec fanions ont un festival : loyer ×2.
              </small>
            </section>
            <section className="journal">
              <h3>
                Carnet de voyage <span>EN DIRECT</span>
              </h3>
              <ol aria-live="polite">
                {(rolling ? [] : history.slice(0, 7)).map((entry, i) => (
                  <li key={`${current.seq}-${i}`}>{entry}</li>
                ))}
              </ol>
            </section>
            <div className="tip">
              <b>Le saviez-vous ?</b>
              <p>Posséder les cinq villes d’un côté du plateau suffit à gagner la partie.</p>
            </div>
          </aside>
        </main>
      )}
      <footer>
        <span>© Money Tour · Un jeu original, de bonnes histoires.</span>
        <div>
          <button onClick={() => setModal('credits')}>Crédits</button>
          <a href="https://github.com/Virtuel21/money-tour" target="_blank" rel="noreferrer">
            Le projet ↗
          </a>
        </div>
      </footer>
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button aria-label="Fermer le message" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}
      {modal === 'rules' && (
        <Modal title="Votre première escale" onClose={() => setModal(null)}>
          <div className="rules">
            <p className="lead">Un tour de plateau, beaucoup de possibilités.</p>
            <h3>1. Lancez, voyagez, investissez</h3>
            <p>
              Lancez deux dés. Achetez une ville libre, améliorez une de vos villes ou payez le
              loyer à votre arrivée chez un adversaire. Un double permet de rejouer ; trois doubles
              vous envoient sur l’île.
            </p>
            <h3>2. Construisez votre fortune</h3>
            <p>
              Possédez d’abord toutes les villes du groupe de couleur, puis construisez sur votre
              ville. Terrain, une à trois maisons, puis hôtel. Vous êtes limité à deux maisons avant
              le premier passage Départ. Chaque passage rapporte 300 k. Après le loyer, une ville
              adverse sans hôtel peut être rachetée au double de sa valeur foncière.
            </p>
            <h3>3. Plusieurs façons de gagner</h3>
            <p>
              Possédez les cinq villes d’un côté, trois groupes complets ou les quatre stations.
              Vous gagnez aussi si tous vos adversaires font faillite. À la fin du chrono, le plus
              grand patrimoine gagne ; une égalité se partage.
            </p>
            <h3>4. Des escales qui changent tout</h3>
            <p>
              Trois festivals doublent les loyers. Le championnat augmente encore le multiplicateur.
              L’île vous retient jusqu’à trois tours. Le Tour du monde ouvre un voyage payant au
              prochain tour. Si votre cash manque, vendez des biens à la banque à moitié de leur
              valeur.
            </p>
            <h3>À quatre, jouez en équipe</h3>
            <p>
              Les sièges 1 et 3 affrontent les sièges 2 et 4. Pas de loyer entre alliés ; les
              collections se partagent pour la victoire. Le cash reste individuel.
            </p>
          </div>
          <button className="primary" onClick={() => setModal(null)}>
            C’est parti !
          </button>
        </Modal>
      )}
      {modal === 'credits' && (
        <Modal title="Le carnet des créateurs" onClose={() => setModal(null)}>
          <pre className="credits-text">{credits}</pre>
        </Modal>
      )}
      {modal === 'settings' && (
        <Modal title="Votre confort de voyage" onClose={() => setModal(null)}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={audioPrefs.effects}
              onChange={(e) => setAudioPrefs((old) => ({ ...old, effects: e.target.checked }))}
            />{' '}
            Effets sonores
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={audioPrefs.music}
              onChange={(e) => setAudioPrefs((old) => ({ ...old, music: e.target.checked }))}
            />{' '}
            Musique de l’archipel
          </label>
          <label className="field">
            Volume
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioPrefs.volume}
              onChange={(e) => setAudioPrefs((old) => ({ ...old, volume: Number(e.target.value) }))}
            />
          </label>
          <button
            className="secondary"
            onClick={() => {
              void sound.current?.unlock().then(() => sound.current?.effect('victory'));
            }}
          >
            Écouter un aperçu
          </button>
          <label className="toggle">
            <input
              type="checkbox"
              checked={reduced}
              onChange={(e) => setReduced(e.target.checked)}
            />{' '}
            Réduire les animations
          </label>
          <p>
            La partie locale se sauvegarde dans ce navigateur. Revenir à l’accueil la met en pause.
          </p>
          <button className="primary" onClick={() => setModal(null)}>
            Enregistrer
          </button>
        </Modal>
      )}
      {modal === 'tiles' && (
        <Modal title="Les 32 escales" onClose={() => setModal(null)}>
          <div className="tile-list">
            {current.config.board.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelected(t.id);
                  setModal(null);
                }}
              >
                <i style={{ background: t.color ?? '#e6b94a' }} />
                {t.name}
                <small>{t.price ? money(t.price, true) : 'Escale spéciale'}</small>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {modal === 'leave' && (
        <Modal title="Faire une pause ou quitter ?" onClose={() => setModal(null)}>
          <p>
            {online
              ? 'La partie en ligne continue lorsque vous revenez à l’accueil. Abandonner élimine votre joueur.'
              : 'Revenir à l’accueil conserve votre partie. Abandonner élimine le joueur actif de cette partie.'}
          </p>
          <button
            className="primary"
            onClick={() => {
              setScreen('menu');
              setModal(null);
            }}
          >
            Accueil et sauvegarde
          </button>
          <button
            className="secondary"
            onClick={() => {
              act({ type: 'quit', playerId: online?.self ?? active.id });
              setModal(null);
            }}
          >
            {online ? 'Abandonner ma partie' : `Abandonner pour ${active.name}`}
          </button>
        </Modal>
      )}
      {tile && (
        <Modal title={tile.name} onClose={() => setSelected(null)}>
          <div className="property-hero" style={{ background: tile.color ?? '#e6b94a' }}>
            <span>{tile.type === 'city' ? '⌂' : tile.type === 'resort' ? '☀' : '✦'}</span>
            <p>
              {property?.ownerId
                ? `Propriété de ${current.players.find((p) => p.id === property.ownerId)?.name}`
                : tile.price
                  ? 'Cette escale attend son propriétaire.'
                  : 'Une escale spéciale de votre voyage.'}
            </p>
          </div>
          {tile.price ? (
            <>
              <div className="property-stats">
                <div>
                  <small>Terrain</small>
                  <strong>{money(tile.price)}</strong>
                </div>
                <div>
                  <small>Loyer actuel</small>
                  <strong>
                    {money(getRent(current, tile.id) || tile.rents?.[0] || config.resortRents[0]!)}
                  </strong>
                </div>
              </div>
              {tile.rents && (
                <div className="rent-table">
                  {tile.rents.map((rent, level) => (
                    <div
                      key={level}
                      className={property?.ownerId && property.level === level ? 'selected' : ''}
                    >
                      <span>{['Terrain', 'Maison 1', 'Maison 2', 'Maison 3', 'Hôtel'][level]}</span>
                      <b>{money(rent, true)}</b>
                    </div>
                  ))}
                </div>
              )}
              <p>
                {current.festivals.includes(tile.id) ? '✦ Festival permanent : loyers ×2. ' : ''}
                {property?.championships
                  ? `Championnat : ×${property.championships + 1} supplémentaire.`
                  : ''}
              </p>
            </>
          ) : (
            <p>
              {tile.type === 'start'
                ? 'Chaque passage en avant rapporte 300 k.'
                : tile.type === 'island'
                  ? 'Jusqu’à trois tours sur l’île. Sortez par un double, un billet ou 200 k.'
                  : tile.type === 'championship'
                    ? 'Pour 50 k, placez un championnat sur une de vos villes.'
                    : tile.type === 'travel'
                      ? 'Au prochain tour, voyagez pour 50 k vers une case libre ou alliée.'
                      : tile.type === 'tax'
                        ? 'Vous payez 10 % de la valeur foncière de vos propriétés.'
                        : 'Une des quatorze cartes peut transformer votre voyage.'}
            </p>
          )}
          <button className="secondary" onClick={() => setSelected(null)}>
            Retour au plateau
          </button>
        </Modal>
      )}
      {screen === 'game' && cinema.frame.cue.kind === 'card' && (
        <Modal title="La bonne étoile" onClose={cinema.advance}>
          <div className="chance-reveal">
            <img
              src={import.meta.env.BASE_URL + 'textures/chance.webp'}
              alt="Une enveloppe pleine de surprises"
            />
            <h2>{current.config.cards.find((c) => c.id === cinema.frame.cue.cardId)?.title}</h2>
            <p>{current.config.cards.find((c) => c.id === cinema.frame.cue.cardId)?.description}</p>
            <button className="primary" onClick={cinema.advance}>
              C’est parti !
            </button>
          </div>
        </Modal>
      )}
      <Suspense fallback={<div className="notice">Ouverture du salon…</div>}>
        {(modal === 'online' || online) && (
          <OnlineLobby
            open={modal === 'online'}
            autoCreate={createSalon}
            defaults={{ name: names[0]!, count, teams: mode === 'teams', minutes }}
            onClose={() => {
              setModal(null);
              if (online?.state) setScreen('game');
            }}
            onSession={(session) => {
              onlineSession.current = session;
            }}
            onLeave={() => {
              onlineSession.current = null;
              setOnline(null);
              onlineSeq.current = -1;
              setScreen('menu');
              setHistory([]);
            }}
            onView={(view) => {
              setOnline(view);
              if (view.state && view.state.seq !== onlineSeq.current) {
                if (onlineSeq.current < 0) {
                  cinema.reset(view.state);
                  setScreen('game');
                  setModal(null);
                  setPaused(false);
                }
                onlineSeq.current = view.state.seq;
                cinema.present(view.state, view.events);
                const messages = view.events
                  .map((event) => eventText(event, view.state!))
                  .filter(Boolean);
                if (messages.length)
                  setHistory((old) => [...messages.reverse(), ...old].slice(0, 60));
              }
            }}
          />
        )}
      </Suspense>
      {screen === 'game' && current.winner && !rolling && (
        <Modal title="Une fortune à célébrer !" onClose={() => setScreen('menu')}>
          <div className="victory-art">
            ✦<span>♜</span>✦
          </div>
          <p className="winner-name">
            {current.winner.playerIds
              .map((id) => current.players.find((p) => p.id === id)?.name)
              .join(' & ')}
          </p>
          <p className="winner-reason">
            {current.winner.reasons.map((r) => victoryText[r] ?? r).join(' · ')}
          </p>
          <div className="results">
            {[...current.players]
              .sort((a, b) => getNetWorth(current, b.id) - getNetWorth(current, a.id))
              .map((p, i) => (
                <div key={p.id}>
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <b>{money(getNetWorth(current, p.id))}</b>
                </div>
              ))}
          </div>
          <button className="primary" onClick={() => setScreen('menu')}>
            Un nouveau voyage →
          </button>
        </Modal>
      )}
    </div>
  );
}
