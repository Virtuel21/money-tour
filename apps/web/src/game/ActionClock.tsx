import { createContext, useContext } from 'react';
import type { GameState } from '@money-tour/engine';
import { duration } from './local';

export const GameClockContext = createContext<{ state: GameState | null; held: boolean }>({
  state: null,
  held: false,
});
export function ActionClock({ full = false }: { full?: boolean }) {
  const { state, held } = useContext(GameClockContext);
  if (!state || state.winner) return null;
  const seconds = Math.max(
    0,
    Math.ceil((state.config.actionTimeoutMs - state.decisionElapsedMs) / 1000),
  );
  return (
    <span
      className={`cta-clock ${!held && seconds <= 10 ? 'clock-urgent' : ''}`}
      title={
        held
          ? 'Décompte suspendu pendant la pause ou l’animation'
          : 'Temps restant pour cette décision'
      }
    >
      {held ? '⏸' : '⏱'} {seconds} s
      {full && (
        <>
          {' '}
          · Partie {duration(Math.max(0, state.durationMs - state.elapsedMs))}
          {held ? ' · décompte suspendu' : ''}
        </>
      )}
    </span>
  );
}
