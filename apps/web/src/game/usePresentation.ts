import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameEvent, GameState } from '@money-tour/engine';
import { presentation, type SceneFrame } from './presentation';

export function usePresentation(initial: GameState, reduced: boolean, online = false) {
  const onlineRef = useRef(online);
  onlineRef.current = online;
  const [frame, setFrame] = useState<SceneFrame>({
    state: initial,
    cue: { kind: 'settle', duration: 0 },
  });
  const [busy, setBusy] = useState(false);
  const authoritative = useRef(initial),
    latest = useRef(initial);
  const queue = useRef<SceneFrame[]>([]),
    running = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceRef = useRef<() => void>(() => {});
  const advance = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const next = queue.current.shift();
    if (!next) {
      running.current = false;
      setBusy(false);
      setFrame({ state: latest.current, cue: { kind: 'settle', duration: 0 } });
      return;
    }
    running.current = true;
    setBusy(true);
    setFrame(next);
    const reading =
      next.cue.kind === 'card' &&
      !onlineRef.current &&
      !next.state.players[next.state.currentPlayer]?.bot;
    timer.current = reading ? null : setTimeout(() => advanceRef.current(), next.cue.duration);
  }, []);
  advanceRef.current = advance;
  const reset = useCallback((state: GameState) => {
    if (timer.current) clearTimeout(timer.current);
    queue.current = [];
    running.current = false;
    authoritative.current = latest.current = state;
    setFrame({ state, cue: { kind: 'settle', duration: 0 } });
    setBusy(false);
  }, []);
  const present = useCallback(
    (state: GameState, events: GameEvent[]) => {
      const frames = presentation(authoritative.current, state, events, reduced);
      authoritative.current = latest.current = state;
      if (frames.length) queue.current.push(...frames);
      if (!running.current) advance();
    },
    [reduced, advance],
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return { frame, busy, present, reset, advance };
}
