import { useEffect, useRef, useState } from 'react';
import { config } from '@money-tour/engine';
import { identity, secret, type Identity } from './crypto';
import { Session, type SavedSession, type SessionView } from './session';
import { TrysteroTransport } from './trystero';

export default function OnlineLobby({
  open,
  onClose,
  onSession,
  onView,
  onLeave,
}: {
  open: boolean;
  onClose: () => void;
  onSession: (session: Session) => void;
  onView: (view: SessionView) => void;
  onLeave: () => void;
}) {
  const [code, setCode] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get('room') ?? '',
  );
  const [name, setName] = useState('Voyageur');
  const [view, setView] = useState<SessionView | null>(null);
  const [error, setError] = useState(''),
    [working, setWorking] = useState(false),
    [copied, setCopied] = useState(false);
  const [count, setCount] = useState(4),
    [teams, setTeams] = useState(false),
    [minutes, setMinutes] = useState(20);
  const [turnUrl, setTurnUrl] = useState(''),
    [turnUser, setTurnUser] = useState(''),
    [turnPassword, setTurnPassword] = useState('');
  const session = useRef<Session | null>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const callbacks = useRef({ onSession, onView, onLeave });
  callbacks.current = { onSession, onView, onLeave };
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => () => session.current?.close(), []);
  async function connect(create: boolean) {
    if (working) return;
    setWorking(true);
    setError('');
    const roomCode = create ? secret().slice(0, 32) : code.toLowerCase().replace(/[\s-]/g, '');
    if (!/^[a-f0-9]{32}$/.test(roomCode)) {
      setError('Le code doit contenir 32 caractères. Copiez le code complet de votre ami.');
      setWorking(false);
      return;
    }
    try {
      let user: Identity | undefined;
      try {
        const stored = JSON.parse(
          localStorage.getItem(`money-tour.identity.${roomCode}`) ?? 'null',
        ) as { at: number; identity: Identity } | null;
        if (stored && Date.now() - stored.at < config.network.reconnectTtlMs)
          user = stored.identity;
      } catch {
        /* Storage may be disabled. */
      }
      user ??= await identity();
      try {
        localStorage.setItem(
          `money-tour.identity.${roomCode}`,
          JSON.stringify({ at: Date.now(), identity: user }),
        );
      } catch {
        setError('Stockage désactivé : votre siège ne pourra pas être repris après fermeture.');
      }
      let saved: SavedSession | undefined;
      try {
        saved =
          JSON.parse(sessionStorage.getItem(`money-tour.session.${roomCode}`) ?? 'null') ??
          undefined;
      } catch {
        /* Ignore malformed cache. */
      }
      const transport = new TrysteroTransport(
        turnUrl ? [{ urls: turnUrl, username: turnUser, credential: turnPassword }] : [],
      );
      const next = new Session(transport, user, name.trim().slice(0, 20) || 'Voyageur', create);
      next.onChange = (value) => {
        setView(value);
        callbacks.current.onView(value);
      };
      next.onPersist = (value) => {
        try {
          sessionStorage.setItem(`money-tour.session.${roomCode}`, JSON.stringify(value));
        } catch {
          /* An active session remains playable without persistence. */
        }
      };
      await next.join(roomCode, saved);
      session.current = next;
      setCode(roomCode);
      history.replaceState(null, '', `${location.pathname}${location.search}#room=${roomCode}`);
      callbacks.current.onSession(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible.');
    } finally {
      setWorking(false);
    }
  }
  function leave() {
    session.current?.close();
    session.current = null;
    setView(null);
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    callbacks.current.onLeave();
    onClose();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#room=${code}`);
      setCopied(true);
    } catch {
      setError('Copiez le lien affiché ci-dessous.');
    }
  }
  return (
    <dialog ref={dialog} className="modal online-modal" onCancel={onClose}>
      <div className="modal-heading">
        <h2>Le voyage entre amis</h2>
        <button className="icon-button" aria-label="Fermer le salon" onClick={onClose}>
          ×
        </button>
      </div>
      {!view ? (
        <>
          <p>
            Créez un salon privé ou rejoignez vos amis avec leur code. Jusqu’à quatre voyageurs,
            chacun sur son écran.
          </p>
          <label className="field">
            Votre nom
            <input maxLength={20} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button className="primary" disabled={working} onClick={() => void connect(true)}>
            Créer un salon
          </button>
          <div className="divider">OU REJOINDRE</div>
          <label className="field">
            Code du salon
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code de 32 caractères"
              spellCheck={false}
            />
          </label>
          <button className="secondary" disabled={working} onClick={() => void connect(false)}>
            {working ? 'Connexion…' : 'Rejoindre le salon'}
          </button>
          <details className="advanced">
            <summary>Options avancées · serveur TURN</summary>
            <p>
              Facultatif, pour les réseaux qui bloquent la connexion directe. Ces paramètres restent
              dans cet onglet.
            </p>
            <label className="field">
              Adresse TURN
              <input
                value={turnUrl}
                onChange={(e) => setTurnUrl(e.target.value)}
                placeholder="turn:serveur:3478"
              />
            </label>
            <label className="field">
              Identifiant
              <input value={turnUser} onChange={(e) => setTurnUser(e.target.value)} />
            </label>
            <label className="field">
              Mot de passe TURN
              <input
                type="password"
                value={turnPassword}
                onChange={(e) => setTurnPassword(e.target.value)}
              />
            </label>
          </details>
        </>
      ) : (
        <>
          <p className="eyebrow">SALON PRIVÉ · {view.members.length}/4 VOYAGEURS</p>
          <div className="invite-code">
            <small>CODE D’INVITATION</small>
            <code>{code.match(/.{1,8}/g)?.join(' ')}</code>
            <button className="secondary" onClick={() => void copy()}>
              {copied ? 'Lien copié ✓' : 'Copier le lien d’invitation'}
            </button>
            <input
              aria-label="Lien d’invitation"
              readOnly
              value={`${location.origin}${location.pathname}#room=${code}`}
            />
          </div>
          <ul className="lobby-members">
            {view.members.map((member, i) => (
              <li key={member.id}>
                <span className="seat-number">{i + 1}</span>
                <strong>
                  {member.name}
                  {member.id === view.self ? ' (vous)' : ''}
                </strong>
                <small>
                  {member.id === view.host
                    ? 'HÔTE'
                    : view.connected.includes(member.id)
                      ? 'CONNECTÉ'
                      : 'ABSENT'}
                </small>
              </li>
            ))}
          </ul>
          <p role="status" className="network-status">
            {view.status}
          </p>
          {!view.state && view.host === view.self && (
            <>
              <div className="setup-options">
                <label>
                  Sièges
                  <select
                    value={count}
                    disabled={teams}
                    onChange={(e) => setCount(Number(e.target.value))}
                  >
                    {[2, 3, 4].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Durée
                  <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                    {[1, 5, 10, 20, 30].map((n) => (
                      <option value={n} key={n}>
                        {n} min
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={teams}
                  onChange={(e) => {
                    setTeams(e.target.checked);
                    if (e.target.checked) setCount(4);
                  }}
                />{' '}
                Équipes 2v2 · sièges 1 et 3 contre 2 et 4
              </label>
              <p>Les sièges libres seront occupés par des bots.</p>
              <button
                className="primary"
                disabled={view.busy || view.blocked}
                onClick={() => void session.current?.start(count, teams, minutes * 60000)}
              >
                {view.busy ? 'Préparation du plateau…' : 'Lancer la partie'}
              </button>
            </>
          )}
          {view.state && (
            <button
              className="primary"
              onClick={() => {
                callbacks.current.onView(view);
                onClose();
              }}
            >
              Retour au plateau
            </button>
          )}
          <details className="advanced">
            <summary>État de la connexion</summary>
            <p>
              Époque {view.epoch} · état {view.hash.slice(0, 12)}
            </p>
            <ul>
              {view.incidents.map((incident, i) => (
                <li key={i}>{incident}</li>
              ))}
            </ul>
          </details>
          <button className="text-button" onClick={leave}>
            Quitter ce salon
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="network-error">
          {error}
        </p>
      )}
      <p className="setup-note">
        Gardez l’onglet ouvert. Une coupure de l’hôte déclenche une relève après 15 secondes.
        Certains réseaux nécessitent un TURN. Partagez le lien uniquement avec vos invités.
      </p>
    </dialog>
  );
}
