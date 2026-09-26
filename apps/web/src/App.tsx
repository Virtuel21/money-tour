import { ActionClock, GameClockContext } from './game/ActionClock';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  chooseBotAction,
  config,
  createGame,
  getLegalActions,
  getDecisionPlayerId,
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
import { MoneyFlight, TurnBanner } from './game/GameFeedback';
import { purchaseOffer, PurchaseDetails } from './game/PurchaseOffer';
import { DuelView } from './game/DuelView';
import { CasinoView } from './game/CasinoView';
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
  inline = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  inline?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!inline) ref.current?.showModal();
  }, []);
  if (inline) {
    const target = document.getElementById('property-inspector');
    return target
      ? createPortal(
          <section className="property-inspector">
            <div className="modal-heading">
              <h2>{title}</h2>
              <button className="icon-button" aria-label="Fermer la propriété" onClick={onClose}>
                ×
              </button>
            </div>
            {children}
          </section>,
          target,
        )
      : null;
  }
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
      className="modal"
    >
      <div className="modal-countdown">
        <ActionClock full />
      </div>
      <div className="modal-heading">
        <h2>{title}</h2>
        {onClose && (
          <button aria-label="Fermer" className="icon-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}
function eventText(event: GameEvent, state: GameState): string {
  const name = state.players.find((p) => p.id === event.playerId)?.name ?? 'La banque';
  const tile = event.tile !== undefined ? state.config.board[event.tile]?.name : '';
  switch (event.type) {
    case 'alliance':
    case 'alliance_expired':
    case 'crisis':
    case 'crisis_expired':
    case 'duel_result':
    case 'duel_forfeit':
    case 'duel_cancelled':
      return String(event.message);
    case 'casino_result':
      return `${name} au casino : ${event.jackpot ? 'jackpot ! ' : ''}+${money(event.amount ?? 0, true)}.`;
    case 'insurance':
    case 'insured':
    case 'squatter':
    case 'karma':
      return `${name} : ${event.message}`;
    case 'expropriate':
      return `${tile} a été expropriée et redevient libre.`;
    case 'roaches':
      return `${tile} : loyer divisé par deux pendant deux tours.`;
    case 'insured_tile':
      return `${name} assure ${tile}.`;
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
      return `${event.reason === 'rent' ? 'Loyer payé' : event.reason === 'attack' ? 'Attaque' : 'Versement'} : ${state.players.find((p) => p.id === event.payerId)?.name ?? 'Banque'} → ${event.playerId ? name : 'Banque'} · ${money(event.amount ?? 0, true)}.`;
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
    case 'championship_expired':
      return `Le Mondial de ${tile} est terminé.`;
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
  config: { ...config, shuffleStreets: false },
  players: [
    { id: 'p1', name: 'Vous' },
    { id: 'p2', name: 'Sacha' },
    { id: 'p3', name: 'Lou' },
    { id: 'p4', name: 'Noa' },
  ],
  seed: 'menu',
});
demo.players.forEach((player, i) => {
  player.position = [5, 12, 19, 23][i]!;
});
for (const [id, ownerId, level] of [
  [1, 'p1', 2],
  [2, 'p1', 1],
  [9, 'p2', 3],
  [10, 'p2', 1],
  [17, 'p3', 2],
  [25, 'p4', 4],
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
  const [dismissedOffer, setDismissedOffer] = useState('');
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
    if (screen !== 'game' || paused) return;
    const kind = cinema.frame.cue.kind;
    if (cinema.frame.cue.sound) sound.current?.effect(cinema.frame.cue.sound);
    else if (kind !== 'settle' && kind !== 'money' && kind !== 'turn')
      sound.current?.effect(kind === 'hop' ? 'move' : kind);
  }, [cinema.frame, screen, paused]);
  const goHome = () => {
    sound.current?.stopEffects();
    cinema.reset(online?.state ?? save?.state ?? demo);
    setScreen('menu');
    setPaused(true);
    setSelected(null);
  };
  const togglePause = () => {
    if (online) return;
    sound.current?.stopEffects();
    cinema.reset(save?.state ?? demo);
    setPaused((value) => !value);
  };
  const current =
    screen === 'game' ? (rolling ? display : (online?.state ?? save?.state ?? demo)) : demo;
  const active = current.players[current.currentPlayer]!;
  const decisionPlayer = current.players.find((p) => p.id === getDecisionPlayerId(current))!;
  const legal = screen === 'game' ? getLegalActions(current) : [];
  const act = (action: GameAction) => {
    if (screen !== 'game' || (paused && action.type !== 'quit')) return;
    if (onlineSession.current) {
      if (!('playerId' in action) || action.playerId !== online?.self) return;
      if (rolling && !['quit', 'set_control'].includes(action.type)) return;
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
    if (
      (previewScenario() && new URLSearchParams(location.search).get('clock') !== '1') ||
      online ||
      screen !== 'game' ||
      paused ||
      rolling ||
      current.winner
    )
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
    if (online || screen !== 'game' || paused || rolling || current.winner || !decisionPlayer.bot)
      return;
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
      case 'buy_fraud':
        return `Fraude fiscale · ${money(Math.floor(tile.price! * (current.config.fraudDiscount ?? 0.5)), true)}`;
      case 'use_squatter':
        return 'Utiliser Squatteur · aucun loyer';
      case 'pay_rent':
        return `Payer le loyer · ${money(current.pendingRent?.amount ?? 0, true)}`;
      case 'casino_red':
        return 'Jouer rouge';
      case 'casino_black':
        return 'Jouer noir';
      case 'casino_spin':
        return 'Lancer les rouleaux';
      case 'insure':
        return `Assurer ${current.config.board[action.tile]?.name}`;
      case 'attack':
        return `Viser ${current.config.board[action.tile]?.name}`;
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
        return `Vendre ${current.config.board[action.tile]?.name} · ${money(getPropertyValue(current, action.tile) * current.config.resaleRate)}`;
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
    decisionPlayer.bot ||
    Boolean(current.winner) ||
    Boolean(online && (online.self !== decisionPlayer.id || online.busy || online.blocked));
  const eligibleOffer =
    screen === 'game' && !interactionDisabled && !modal
      ? purchaseOffer(current, online?.self)
      : null;
  const offerKey = [save?.seed, active.id, current.turn, active.position].join(':');
  const offer = eligibleOffer && dismissedOffer !== offerKey ? eligibleOffer : null;
  const chooseTile = (id: number) => {
    const action = options.find((a) => a.tile === id);
    if (action && !interactionDisabled) act(action);
    else if (eligibleOffer?.tile.id === id) {
      setSelected(null);
      setDismissedOffer('');
    } else if (!rolling) setSelected(id);
  };
  const available = legal.filter(
    (a) =>
      !a.type.startsWith('duel_') &&
      !['alliance', 'quit', 'travel', 'place_championship', 'insure', 'attack'].includes(a.type),
  );
  const options = legal.filter((a): a is Extract<GameAction, { tile: number }> =>
    ['travel', 'place_championship', 'insure', 'attack', 'sell'].includes(a.type),
  );
  const actionDescription =
    current.phase === 'duel'
      ? 'La fenêtre de duel indique qui doit miser, choisir ou révéler sa main.'
      : current.phase === 'alliance'
        ? 'Choisissez le joueur avec qui partager les prochains gains.'
        : current.phase === 'casino'
          ? 'Roulette ou machine à sous : tentez le jackpot dans la fenêtre du casino.'
          : current.phase === 'attack'
            ? 'Choisissez une ville adverse en surbrillance sur le plateau. Une assurance bloque l’expropriation, mais pas les cafards.'
            : active.insurance?.tile === null
              ? 'Votre jeton assurance est disponible : cliquez sur une de vos propriétés en surbrillance pour la protéger.'
              : current.phase === 'debt'
                ? `Il vous manque ${money(Math.max(0, (current.debt?.amount ?? 0) - active.cash))}. Vendez un bien pour régler votre dette.`
                : current.phase === 'island'
                  ? 'Payez le voyage de retour, utilisez un billet ou tentez un double. Vous sortirez au plus tard à la troisième tentative.'
                  : current.phase === 'travel'
                    ? `Choisissez une case libre ou alliée. Le voyage coûte ${money(config.travelFee, true)} et remplace les dés.`
                    : current.phase === 'championship'
                      ? `Choisissez une de vos villes sur le plateau pour y organiser le Mondial : ${money(current.config.championshipFee, true)}. Loyer ×2 pendant quatre de vos tours, sans cumul. Cliquez sur une de vos villes en surbrillance.`
                      : current.phase === 'property'
                        ? current.properties[active.position]?.ownerId &&
                          current.properties[active.position]?.ownerId !== active.id
                          ? `${current.config.board[active.position]!.name} · le loyer adverse est prélevé automatiquement. Vous pouvez poursuivre ou proposer un rachat.`
                          : `${current.config.board[active.position]!.name} vous accueille. Achetez, construisez ou poursuivez votre voyage.`
                        : 'Deux dés. Une destination. Une nouvelle opportunité.';

  return (
    <GameClockContext.Provider
      value={{ state: screen === 'game' ? current : null, held: paused || rolling }}
    >
      <div
        className="app"
        onPointerDownCapture={() => void sound.current?.unlock()}
        onKeyDownCapture={() => void sound.current?.unlock()}
      >
        <header className="topbar">
          <button className="brand-button" aria-label="Money Tour, accueil" onClick={goHome}>
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
                  <>
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
                    <p className="saved-progress">
                      Partie conservée · tour {save.state.turn} ·{' '}
                      {duration(save.state.durationMs - save.state.elapsedMs)} restantes
                    </p>
                  </>
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
                  <strong>Tracez votre route</strong>Achetez des villes et des îles privées.
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
            {!paused && (
              <TurnBanner
                key={`${current.turn}-${active.id}`}
                player={active}
                self={online?.self}
                local={!online}
                color={colors[current.currentPlayer]!}
              />
            )}
            {!paused && cinema.frame.cue.kind === 'money' && (
              <MoneyFlight cue={cinema.frame.cue} state={current} reduced={reduced} />
            )}
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
                <button
                  className="icon-button"
                  aria-label="Réglages de la partie"
                  onClick={() => setModal('settings')}
                >
                  ⚙
                </button>
                <span className="clock" aria-label="Temps restant">
                  ◷ {duration(current.durationMs - current.elapsedMs)}
                </span>
                <button
                  className="subtle"
                  onClick={togglePause}
                  aria-pressed={paused}
                  title={
                    online
                      ? 'La pause est réservée au solo et au jeu local'
                      : 'Suspendre le chrono et les bots'
                  }
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
                  data-bank={p.id}
                  className={`player-card ${current.currentPlayer === i ? 'active' : ''} ${p.eliminated ? 'eliminated' : ''}`}
                  style={{ '--player-color': colors[i] } as React.CSSProperties}
                >
                  <span className={`avatar portrait portrait-${i}`} aria-label={pawnNames[i]} />
                  <div>
                    <span className="player-name">
                      {p.name === 'Vous' && online ? `Joueur ${i + 1}` : p.name}{' '}
                      {p.insurance && (
                        <span
                          className="inventory-token"
                          title={
                            p.insurance.tile === null
                              ? 'Assurance disponible'
                              : `Assurance : ${current.config.board[p.insurance.tile]?.name}`
                          }
                        >
                          🛡
                        </span>
                      )}
                      <small>
                        {online?.self === p.id
                          ? 'VOUS'
                          : p.bot
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
                  {!!p.heldCards?.length && (
                    <span className="held-cards">
                      {p.heldCards.map((id) => (
                        <span
                          key={id}
                          title={current.config.cards.find((c) => c.id === id)?.description}
                        >
                          {current.config.cards.find((c) => c.id === id)?.title}
                        </span>
                      ))}
                    </span>
                  )}
                  {!!p.fraudLiability && (
                    <small className="fraud-risk" title="Jusqu’au prochain passage par Départ">
                      ⚠ Taxe : {money(p.fraudLiability, true)}
                    </small>
                  )}
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
                    onTile={chooseTile}
                    reducedMotion={reduced || paused}
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
                      : `Au tour de ${active.name}`}
              </div>
              <div className="board-controls">
                <button onClick={() => setModal('tiles')}>Explorer les cases</button>
                <button onClick={() => setZoom(!zoom)}>{zoom ? 'Réduire' : 'Agrandir'}</button>
              </div>
            </section>
            <aside className="game-sidebar">
              <div id="property-inspector" />
              <section className="action-card">
                <span className="eyebrow">
                  {paused
                    ? 'PARTIE EN PAUSE'
                    : decisionPlayer.bot
                      ? 'UN BOT RÉFLÉCHIT…'
                      : online && online.self !== decisionPlayer.id
                        ? `TOUR DE ${decisionPlayer.name.toUpperCase()}`
                        : `À VOUS, ${decisionPlayer.name.toUpperCase()}`}
                </span>
                <h2>
                  {paused
                    ? 'Une petite escale ?'
                    : decisionPlayer.bot || (online && online.self !== decisionPlayer.id)
                      ? `${decisionPlayer.name} joue`
                      : phaseText[current.phase]}
                </h2>
                <p>
                  {paused
                    ? 'Le chrono et les bots vous attendent.'
                    : decisionPlayer.bot || (online && online.self !== decisionPlayer.id)
                      ? 'Suivez son déplacement. Vos commandes seront disponibles à votre tour.'
                      : actionDescription}
                </p>
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
                    <p>
                      {current.config.cards.find((c) => c.id === current.lastCard)?.description}
                    </p>
                  </div>
                )}
                {options.length > 0 && !interactionDisabled && (
                  <p className="board-choice-hint">
                    Cliquez directement sur une case dorée du plateau pour{' '}
                    {current.phase === 'travel'
                      ? 'vous y déplacer'
                      : current.phase === 'attack'
                        ? 'choisir votre cible'
                        : current.phase === 'debt'
                          ? 'la vendre et régler votre dette'
                          : current.phase === 'championship'
                            ? 'y placer le championnat'
                            : 'l’assurer'}
                    .
                  </p>
                )}
                <div className="actions">
                  {!active.bot &&
                    (!online || online.self === active.id) &&
                    available.map((a, i) => (
                      <button
                        key={`${a.type}-${'tile' in a ? a.tile : ''}`}
                        className={i === 0 && a.type !== 'finish' ? 'primary' : 'secondary'}
                        disabled={interactionDisabled}
                        onClick={() => {
                          if (!interactionDisabled) {
                            if (a.type === 'buy' && eligibleOffer) setDismissedOffer('');
                            else act(a);
                          }
                        }}
                      >
                        <span>{actionLabel(a)}</span>
                        <ActionClock />
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
                          className="secondary reclaim-seat"
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
                {current.crisis && (
                  <p className="world-event-status">
                    📉 Crise économique · loyers −50 % · {current.crisis.remaining.length} joueur(s)
                    doivent encore terminer leur tour
                  </p>
                )}
                {current.alliance && (
                  <p className="world-event-status">
                    🤝 {current.players.find((p) => p.id === current.alliance!.beneficiaryId)!.name}{' '}
                    reçoit 50 % des gains de{' '}
                    {current.players.find((p) => p.id === current.alliance!.targetId)!.name}
                  </p>
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
                <p>Les quatre îles réunies rapportent 500 k de loyer à chaque visite adverse.</p>
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
                loyer à votre arrivée chez un adversaire. Un double permet de rejouer ; trois
                doubles vous envoient sur l’île.
              </p>
              <h3>2. Construisez votre fortune</h3>
              <p>
                Possédez d’abord toutes les villes du groupe de couleur, puis construisez sur votre
                ville. Terrain, une à trois maisons, puis hôtel. Vous êtes limité à deux maisons
                avant le premier passage Départ. Chaque passage rapporte 300 k. Après le loyer, une
                ville adverse sans hôtel peut être rachetée au double de sa valeur foncière.
              </p>
              <h3>3. Plusieurs façons de gagner</h3>
              <p>
                Possédez toutes les propriétés achetables d’un côté, île comprise, ou complétez
                trois rues pour gagner. Les quatre îles réunies donnent un loyer de 500 k, sans
                terminer la partie. Vous gagnez aussi si tous vos adversaires font faillite. À la
                fin du chrono, le plus grand patrimoine gagne ; une égalité se partage.
              </p>
              <h3>4. Des escales qui changent tout</h3>
              <p>
                32 cases : 8 rues de deux villes, 4 îles privées, 3 cases cartes, 1 taxe, 2 casinos,
                1 assurance, 1 karma et 4 coins spéciaux. Les loyers sont payés automatiquement par
                le visiteur. Les cartes se résolvent pour leur destinataire uniquement.
              </p>
              <p>
                Trois festivals doublent les loyers. Le championnat augmente encore le
                multiplicateur. L’île vous retient jusqu’à trois tours. Le Tour du monde ouvre un
                voyage payant au prochain tour. Si votre cash manque, vendez des biens à la banque à
                moitié de leur valeur.
              </p>
              <h3>5. Tentez votre chance, protégez vos biens</h3>
              <p>
                Les casinos proposent une roulette ou une machine à sous, sans mise. Le jackpot
                rapporte 10 % de votre solde ; ses chances augmentent à chaque visite du casino. Le
                Karma offre 50 k au dernier patrimoine ou prélève 50 k au premier.
              </p>
              <p>
                L’assurance donne un jeton unique à placer sur un bien : il bloque une destruction
                ou une expropriation, puis disparaît. Squatteur se garde pour éviter un loyer.
                Expropriation remet une ville adverse à la banque ; les cafards divisent le loyer
                d’un hôtel par deux pendant deux tours de son propriétaire.
              </p>
              <p>
                Fraude fiscale permet un achat à moitié prix. Jusqu’au prochain passage Départ,
                tomber sur Taxe coûte deux fois le prix normal de cet achat. Une dette impose de
                choisir les biens à vendre ; la faillite survient seulement si leur valeur totale de
                revente et votre compte ne suffisent pas.
              </p>
              <p>
                Alliance temporaire prélève la moitié des gains d’un joueur jusqu’à la fin de son
                prochain tour. Une crise économique aléatoire divise tous les loyers par deux
                pendant un tour complet de tous les joueurs. Le duel propose une mise identique
                acceptée par les deux adversaires : pierre, feuille, ciseaux avec choix secrets ; le
                gagnant remporte le pot, une égalité rembourse les mises.
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
                onChange={(e) =>
                  setAudioPrefs((old) => ({ ...old, volume: Number(e.target.value) }))
                }
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
              La partie locale se sauvegarde dans ce navigateur. Revenir à l’accueil la met en
              pause.
            </p>
            <button className="primary" onClick={() => setModal(null)}>
              Enregistrer
            </button>
          </Modal>
        )}
        {modal === 'tiles' && (
          <Modal
            title={`Les ${current.config.board.length} escales`}
            onClose={() => setModal(null)}
          >
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
                goHome();
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
        {offer && (
          <Modal
            title={'Bienvenue à ' + offer.tile.name}
            onClose={() => setDismissedOffer(offerKey)}
          >
            <PurchaseDetails
              state={current}
              onBuy={() => act({ type: 'buy', playerId: active.id })}
              onFraud={() => act({ type: 'buy_fraud', playerId: active.id })}
              onPass={() => act({ type: 'finish', playerId: active.id })}
            />
          </Modal>
        )}
        {screen === 'game' &&
          !rolling &&
          !modal &&
          !paused &&
          current.phase === 'duel' &&
          current.duel && (
            <Modal title="Le grand duel">
              <DuelView
                key={current.duel.id}
                state={current}
                self={online?.self}
                act={act}
                disabled={Boolean(online?.busy || online?.blocked)}
              />
            </Modal>
          )}
        {screen === 'game' && !interactionDisabled && !modal && current.phase === 'alliance' && (
          <Modal title="Choisissez votre alliance">
            <p>
              Recevez 50 % des gains du joueur choisi jusqu’à la fin de son prochain tour. Cette
              part est prélevée sur ses gains.
            </p>
            <div className="decision-actions">
              {legal
                .filter((a) => a.type === 'alliance')
                .map(
                  (a) =>
                    a.type === 'alliance' && (
                      <button className="primary" key={a.targetId} onClick={() => act(a)}>
                        Choisir {current.players.find((p) => p.id === a.targetId)!.name}
                        <ActionClock />
                      </button>
                    ),
                )}
            </div>
            <button
              className="secondary"
              onClick={() => act({ type: 'finish', playerId: active.id })}
            >
              Passer <ActionClock />
            </button>
          </Modal>
        )}
        {screen === 'game' && !interactionDisabled && !modal && current.phase === 'casino' && (
          <Modal title="Bienvenue au casino">
            <CasinoView state={current} act={act} />
          </Modal>
        )}
        {screen === 'game' && !paused && cinema.frame.cue.kind === 'casino' && (
          <Modal title="Le casino joue pour vous">
            <CasinoView
              key={current.seq + '-casino'}
              state={current}
              cue={cinema.frame.cue}
              act={act}
            />
          </Modal>
        )}
        {screen === 'game' && !paused && cinema.frame.cue.kind === 'notice' && (
          <Modal
            title={
              cinema.frame.cue.reason === 'duel_result'
                ? 'Le duel est joué !'
                : cinema.frame.cue.reason === 'crisis'
                  ? 'Crise économique'
                  : cinema.frame.cue.reason === 'alliance'
                    ? 'Une alliance est née'
                    : 'Votre aventure continue'
            }
          >
            <p className="event-notice">{cinema.frame.cue.message}</p>
          </Modal>
        )}
        {screen === 'game' && !interactionDisabled && !modal && current.phase === 'rent' && (
          <Modal title="Un loyer… ou votre carte Squatteur ?">
            <p>
              Vous arrivez à {current.config.board[active.position]?.name}. Le loyer est de{' '}
              {money(current.pendingRent?.amount ?? 0)}.
            </p>
            <p>La carte Squatteur annule ce paiement et sera défaussée.</p>
            <div className="decision-actions">
              {available
                .filter((a) => ['use_squatter', 'pay_rent'].includes(a.type))
                .map((a) => (
                  <button
                    className={a.type === 'use_squatter' ? 'primary' : 'secondary'}
                    key={a.type}
                    onClick={() => act(a)}
                  >
                    {actionLabel(a)}
                    <ActionClock />
                  </button>
                ))}
            </div>
          </Modal>
        )}
        {screen === 'game' && !interactionDisabled && !modal && current.phase === 'debt' && (
          <Modal title="Réglons cette dette ensemble">
            <p>
              À payer : <strong>{money(current.debt!.amount)}</strong> · En banque :{' '}
              {money(active.cash)}.
            </p>
            <p>
              Il manque <strong>{money(current.debt!.amount - active.cash)}</strong>. Choisissez les
              biens à vendre. Le paiement se règle dès que le total suffit.
            </p>
            <p>
              Valeur vendable totale :{' '}
              <strong>
                {money(
                  legal
                    .filter((a) => a.type === 'sell')
                    .reduce(
                      (sum, a) =>
                        sum +
                        Math.floor(
                          getPropertyValue(current, 'tile' in a ? a.tile : 0) *
                            current.config.resaleRate,
                        ),
                      0,
                    ),
                )}
              </strong>
              .
            </p>
            <div className="decision-actions">
              {available
                .filter((a) => a.type === 'sell')
                .map((a) => (
                  <button
                    className="secondary"
                    key={'tile' in a ? a.tile : a.type}
                    onClick={() => act(a)}
                  >
                    {actionLabel(a)}
                    <ActionClock />
                  </button>
                ))}
            </div>
          </Modal>
        )}
        {tile && !offer && (
          <Modal title={tile.name} inline={screen === 'game'} onClose={() => setSelected(null)}>
            <div className="property-hero" style={{ background: tile.color ?? '#e6b94a' }}>
              {tile.type === 'city' ? (
                <span
                  className={`property-art ${property?.level === 4 ? 'hotel-art' : ''}`}
                  aria-hidden="true"
                />
              ) : (
                <span>{tile.type === 'resort' ? '☀' : '✦'}</span>
              )}
              <p>
                {property?.ownerId
                  ? `Propriété de ${current.players.find((p) => p.id === property.ownerId)?.name}`
                  : tile.price
                    ? 'Cette escale attend son propriétaire.'
                    : 'Une escale spéciale de votre voyage.'}
              </p>
            </div>
            {tile.group && (
              <p className="group-detail">
                Groupe {tile.group.slice(1)} ·{' '}
                {current.config.board
                  .filter((t) => t.group === tile.group)
                  .map((t) => t.name)
                  .join(' · ')}
              </p>
            )}
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
                      {money(
                        getRent(current, tile.id) || tile.rents?.[0] || config.resortRents[0]!,
                      )}
                    </strong>
                  </div>
                </div>
                {tile.type === 'resort' && (
                  <p>Collection d’îles : 1 → 50 k · 2 → 100 k · 3 → 200 k · 4 → 500 k de loyer.</p>
                )}
                {tile.rents && (
                  <div className="rent-table">
                    {tile.rents.map((rent, level) => (
                      <div
                        key={level}
                        className={property?.ownerId && property.level === level ? 'selected' : ''}
                      >
                        <span>
                          {['Terrain', 'Maison 1', 'Maison 2', 'Maison 3', 'Hôtel'][level]}
                        </span>
                        <b>{money(rent, true)}</b>
                      </div>
                    ))}
                  </div>
                )}
                <p>
                  {current.festivals.includes(tile.id) ? '✦ Festival permanent : loyers ×2. ' : ''}
                  {property?.championships
                    ? `Mondial : loyer ×2 · ${property.championshipTurns ?? 4} tours du propriétaire restants.`
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
                      ? 'Pour 50 k, doublez le loyer d’une de vos villes pendant 4 de vos tours. Un nouveau Mondial renouvelle la durée, sans cumuler le bonus.'
                      : tile.type === 'travel'
                        ? 'Au prochain tour, voyagez pour 50 k vers une case libre ou alliée.'
                        : tile.type === 'tax'
                          ? 'Vous payez 50 k plus 10 % de la valeur foncière de vos propriétés.'
                          : 'Une des dix-huit cartes peut transformer votre voyage, y compris des attaques contre vos adversaires.'}
              </p>
            )}
            <button className="secondary" onClick={() => setSelected(null)}>
              Retour au plateau
            </button>
          </Modal>
        )}
        {screen === 'game' && cinema.frame.cue.kind === 'tax' && (
          <Modal
            title="Aïe… passage à la caisse !"
            onClose={!online && !active.bot ? cinema.advance : undefined}
          >
            <div className="tax-reveal">
              <div className="tax-illustration" aria-hidden="true" />
              <small>LES ACTUALITÉS DÉCALÉES DE L’ARCHIPEL</small>
              <h3>
                {
                  [
                    'Le président augmente encore le prix de l’essence. Même votre pion fait le plein !',
                    'Oups, dissolution de l’assemblée ! L’inflation explose… votre portefeuille demande des vacances.',
                    'Le président américain augmente les droits de douane. Vos souvenirs passent à la caisse !',
                  ][(current.turn + (cinema.frame.cue.tile ?? 0)) % 3]
                }
              </h3>
              <p>
                {current.players.find((p) => p.id === cinema.frame.cue.playerId)?.name} · somme à
                régler
              </p>
              <strong className="tax-amount">{money(cinema.frame.cue.amount ?? 0)}</strong>
              <p>
                {cinema.frame.cue.reason === 'fraud' ? (
                  'Contrôle fiscal ! Votre achat à prix réduit entraîne une taxe égale à deux fois le prix normal de la ville. Le contrôle clôt ce risque.'
                ) : (
                  <>
                    Taxe : {money(current.config.taxBase ?? 0, true)} +{' '}
                    {current.config.taxRate * 100} % de votre patrimoine immobilier.
                  </>
                )}
              </p>
              {!online && !active.bot ? (
                <button className="primary" onClick={cinema.advance}>
                  Aïe, j’ai compris ! <ActionClock />
                </button>
              ) : (
                <p>Le trésor public s’en occupe… la partie reprend dans un instant.</p>
              )}
            </div>
          </Modal>
        )}
        {screen === 'game' && cinema.frame.cue.kind === 'card' && (
          <Modal
            title={
              'Carte de ' +
              (current.players.find((p) => p.id === cinema.frame.cue.playerId)?.name ?? active.name)
            }
            onClose={!online && !active.bot ? cinema.advance : undefined}
          >
            <div className="chance-reveal">
              <img
                src={import.meta.env.BASE_URL + 'textures/chance.webp'}
                alt="Une enveloppe pleine de surprises"
              />
              <h2>{current.config.cards.find((c) => c.id === cinema.frame.cue.cardId)?.title}</h2>
              <p>
                {current.config.cards.find((c) => c.id === cinema.frame.cue.cardId)?.description}
              </p>
              {!online && !active.bot ? (
                <button className="primary" onClick={cinema.advance}>
                  J’ai lu · continuer <ActionClock />
                </button>
              ) : (
                <p className="card-readonly">
                  Une surprise pour{' '}
                  {current.players.find((p) => p.id === cinema.frame.cue.playerId)?.name ??
                    active.name}{' '}
                  · la partie reprend dans un instant
                </p>
              )}
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
                goHome();
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
                  if (screen === 'game' || onlineSeq.current < 0)
                    cinema.present(view.state, view.events);
                  else cinema.reset(view.state);
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
          <Modal title="Une fortune à célébrer !" onClose={goHome}>
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
            <button className="primary" onClick={goHome}>
              Un nouveau voyage →
            </button>
          </Modal>
        )}
      </div>
    </GameClockContext.Provider>
  );
}
