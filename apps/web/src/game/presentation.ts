import type { GameEvent, GameState } from '@money-tour/engine';

export interface Cue {
  kind: 'dice' | 'hop' | 'card' | 'build' | 'settle';
  duration: number;
  playerId?: string;
  from?: number;
  to?: number;
  dice?: number[];
  cardId?: string;
  tile?: number;
  sound?: string;
}
export interface SceneFrame {
  state: GameState;
  cue: Cue;
}
/** Presentation only: never changes the authoritative state or consumes game randomness. */
export function presentation(
  previous: GameState,
  next: GameState,
  events: GameEvent[],
  reduced = false,
): SceneFrame[] {
  const visual = structuredClone(previous);
  const frames: SceneFrame[] = [];
  const add = (cue: Cue) => frames.push({ state: structuredClone(visual), cue });
  for (const event of events) {
    if (event.type === 'dice') {
      add({ kind: 'dice', dice: event.dice, duration: reduced ? 150 : 1600 });
      visual.dice = event.dice ?? [];
      add({ kind: 'settle', duration: reduced ? 100 : 400 });
    }
    if (event.type === 'move' || event.type === 'island') {
      const player = visual.players.find((p) => p.id === event.playerId);
      if (!player) continue;
      const destination =
        event.type === 'island'
          ? next.players.find((p) => p.id === event.playerId)!.position
          : event.tile!;
      const steps =
        event.type === 'island'
          ? (destination - player.position + 32) % 32
          : Number(event.steps ?? 0);
      for (let i = 0; i < Math.abs(steps); i++) {
        const from = player.position;
        player.position = (from + Math.sign(steps) + 32) % 32;
        add({
          kind: 'hop',
          playerId: player.id,
          from,
          to: player.position,
          duration: reduced ? 35 : 270,
        });
      }
    }
    if (event.type === 'card') add({ kind: 'card', cardId: event.cardId, duration: 5500 });
    if (['purchase', 'buyout', 'sale', 'build'].includes(event.type) && event.tile !== undefined) {
      visual.properties[event.tile] = { ...next.properties[event.tile]! };
      add({
        kind: event.type === 'build' ? 'build' : 'settle',
        sound: event.type === 'buyout' ? 'purchase' : event.type,
        tile: event.tile,
        duration: reduced ? 100 : 700,
      });
    }
    if (['payment', 'victory', 'bankruptcy'].includes(event.type))
      add({ kind: 'settle', sound: event.type, duration: 150 });
  }
  if (frames.length) frames.push({ state: next, cue: { kind: 'settle', duration: 50 } });
  return frames;
}

export function presentationMs(events: GameEvent[]): number {
  return events.reduce(
    (ms, e) =>
      ms +
      (e.type === 'dice'
        ? 2000
        : e.type === 'move'
          ? Math.abs(Number(e.steps ?? 0)) * 270
          : e.type === 'card'
            ? 5500
            : ['build', 'purchase', 'buyout'].includes(e.type)
              ? 700
              : e.type === 'island'
                ? 8640
                : 0),
    0,
  );
}
