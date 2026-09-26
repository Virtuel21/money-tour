import { useEffect, useState, type CSSProperties } from 'react';
import { getLegalActions, type GameAction, type GameState } from '@money-tour/engine';
import type { Cue } from './presentation';
import { ActionClock } from './ActionClock';
import { money } from './local';

export function CasinoView({
  state,
  cue,
  act,
}: {
  state: GameState;
  cue?: Cue;
  act: (a: GameAction) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!cue) return;
    const timer = setTimeout(() => setRevealed(true), Math.min(1900, cue.duration * 0.55));
    return () => clearTimeout(timer);
  }, [cue]);
  const game = cue?.casinoGame ?? state.casino?.game ?? 'roulette';
  const player = state.players[state.currentPlayer]!;
  const symbols = ['🍒', '🔔', '7', '★'];
  return (
    <div
      className={`casino-view ${cue ? 'casino-playing' : ''} ${revealed ? 'casino-revealed' : ''}`}
    >
      {game === 'roulette' ? (
        <div className="roulette-stage" aria-hidden="true">
          <div
            className="roulette-wheel"
            style={
              {
                '--roulette-stop': cue?.casinoColor === 'red' ? '2148.75deg' : '2126.25deg',
              } as CSSProperties
            }
          />
          <span className="roulette-pointer">▼</span>
        </div>
      ) : (
        <div className="slot-reels" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="reel-window">
              {cue && !revealed ? (
                <span className="reel-strip">
                  {[...symbols, symbols[0]].map((symbol, index) => (
                    <b key={index}>{symbol}</b>
                  ))}
                </span>
              ) : (
                <b>{symbols[revealed ? (cue?.casinoReels?.[i] ?? 0) : i]}</b>
              )}
            </span>
          ))}
        </div>
      )}
      {cue ? (
        <div className="casino-result" role="status">
          <h3>
            {revealed
              ? cue.jackpot
                ? 'JACKPOT !'
                : (cue.amount ?? 0) > 0
                  ? 'Bien joué !'
                  : 'La chance prend une pause…'
              : 'La chance est en mouvement…'}
          </h3>
          {revealed && (
            <>
              <p>
                {game === 'roulette'
                  ? `La bille s’arrête sur ${cue.casinoColor === 'red' ? 'rouge' : 'noir'}.`
                  : 'Les rouleaux ont parlé !'}
              </p>
              <strong>
                {(cue.amount ?? 0) > 0 ? '+' + money(cue.amount!) : 'Aucun gain, aucune perte'}
              </strong>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="eyebrow">
            ENTRÉE OFFERTE · {game === 'roulette' ? 'ROULETTE ROUGE / NOIR' : 'MACHINE À SOUS'}
          </p>
          <h3>Jackpot potentiel : {money(Math.floor(player.cash * 0.1), true)}</h3>
          <p>
            {state.casino?.chance} % de chances de jackpot. La probabilité monte de{' '}
            {state.config.casinoChanceStep} points à chaque visite de ce casino, jusqu’à{' '}
            {state.config.casinoMaxChance} %, puis repart à {state.config.casinoBaseChance} % après
            un jackpot.
          </p>
          <p className="setup-note">
            {game === 'roulette'
              ? 'Bonne couleur : +2 % de votre compte.'
              : 'Deux symboles identiques : +2 % ; trois : +5 %.'}{' '}
            Jackpot : +10 % de votre compte, sans cumul. Pas de mise ni de perte.
          </p>
          <div className="casino-actions">
            {getLegalActions(state)
              .filter((a) => a.type.startsWith('casino_'))
              .map((a) => (
                <button key={a.type} className={'primary ' + a.type} onClick={() => act(a)}>
                  <span>
                    {a.type === 'casino_red'
                      ? 'Choisir rouge'
                      : a.type === 'casino_black'
                        ? 'Choisir noir'
                        : 'Lancer les rouleaux'}
                  </span>
                  <ActionClock />
                </button>
              ))}
          </div>
          <button
            className="secondary"
            onClick={() => act({ type: 'finish', playerId: player.id })}
          >
            Passer mon tour au casino <ActionClock />
          </button>
        </>
      )}
    </div>
  );
}
