import {
  config,
  createGame,
  createRng,
  reduceGame,
  resolveDebugLanding,
  validateState,
  type GameConfig,
  type GameEvent,
  type GameState,
} from '@money-tour/engine';
import { type LocalSave, newLocal } from './local';
import { eventText } from './journal';

export const DEBUG_KEY = 'money-tour.debug.v1';
const LIMIT = 1_000_000_000;
export type DebugCommand =
  | { type: 'player'; playerId: string; cash: number; laps: number; bot: boolean }
  | { type: 'move'; playerId: string; tile: number; resolve: boolean }
  | { type: 'turn'; playerId: string }
  | { type: 'property'; tile: number; ownerId: string | null; level: number; festival: boolean }
  | { type: 'rules'; config: GameConfig }
  | { type: 'dice'; values: number[] }
  | { type: 'card'; cardId: string }
  | { type: 'clock'; elapsedMs: number; durationMs: number }
  | { type: 'options'; freezeTime: boolean; freezeBots: boolean };

export function newDebug(source?: LocalSave): LocalSave {
  const save = structuredClone(
    source ??
      newLocal({
        players: [
          { id: 'p1', name: 'Vous' },
          { id: 'p2', name: 'Sacha' },
          { id: 'p3', name: 'Lou' },
          { id: 'p4', name: 'Noa' },
        ],
        config: { ...config, shuffleStreets: false, adventures: false },
      }),
  );
  save.debug = { freezeTime: true, freezeBots: true };
  validateDebugState(save.state);
  return save;
}

function integer(value: number, min = 0, max = LIMIT) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new Error(`Saisissez un entier entre ${min} et ${max}.`);
}

/** Validate imported rule structure before passing it to the engine. */
function sameShape(value: unknown, reference: unknown): boolean {
  if (reference === null) return value === null;
  if (typeof reference === 'number')
    return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= LIMIT;
  if (Array.isArray(reference))
    return (
      Array.isArray(value) &&
      value.length === reference.length &&
      reference.every((item, i) => sameShape(value[i], item))
    );
  if (typeof reference === 'object')
    return (
      !!value &&
      typeof value === 'object' &&
      Object.entries(reference).every(([key, item]) =>
        sameShape((value as Record<string, unknown>)[key], item),
      )
    );
  return typeof value === typeof reference;
}

export function validateDebugState(state: GameState): void {
  if (!state || !sameShape(state.config, config))
    throw new Error('La structure des règles est invalide.');
  if (
    state.config.version !== config.version ||
    state.version !== config.version ||
    !['free-for-all', 'teams'].includes(state.mode) ||
    typeof state.extraRoll !== 'boolean' ||
    !Array.isArray(state.dice) ||
    state.dice.length > 2 ||
    state.dice.some((die) => !Number.isInteger(die) || die < 1 || die > 6) ||
    (state.lastCard !== null && !state.config.cards.some((card) => card.id === state.lastCard))
  )
    throw new Error('Le format de la partie ou des dés est invalide.');
  integer(state.config.maxResolutionDepth, 1, 64);
  for (const card of state.config.cards) {
    if (card.target !== undefined) integer(card.target, 0, state.config.board.length - 1);
    if (card.steps !== undefined) integer(card.steps, -128, 128);
  }
  if (
    state.winner &&
    (!Array.isArray(state.winner.playerIds) ||
      state.winner.playerIds.some((id) => !state.players.some((player) => player.id === id)) ||
      !Array.isArray(state.winner.teamIds) ||
      !Array.isArray(state.winner.reasons) ||
      state.winner.reasons.some((reason) => typeof reason !== 'string') ||
      !Number.isFinite(state.winner.netWorth))
  )
    throw new Error('Le résultat de partie est invalide.');
  // The board artwork and purchase selector require this topology; economic rules remain editable.
  if (
    state.config.diceCount !== 2 ||
    state.config.diceSides !== 6 ||
    state.config.hotelLevel !== 4 ||
    state.config.minPlayers !== 2 ||
    state.config.maxPlayers !== 4 ||
    state.config.board.some(
      (tile, i) => tile.id !== config.board[i]!.id || tile.type !== config.board[i]!.type,
    ) ||
    state.config.cards.some(
      (card, i) => card.id !== config.cards[i]!.id || card.effect !== config.cards[i]!.effect,
    )
  )
    throw new Error(
      'Conservez le plateau, les types de cartes, les 2 dés à 6 faces et les 4 niveaux de bâtiment.',
    );
  if (!Array.isArray(state.players) || state.players.length < 2 || state.players.length > 4)
    throw new Error('Il faut entre 2 et 4 joueurs.');
  if (
    ![
      'roll',
      'island',
      'travel',
      'property',
      'championship',
      'debt',
      'end',
      'finished',
      'casino',
      'attack',
      'rent',
      'alliance',
      'auction',
      'duel',
    ].includes(state.phase)
  )
    throw new Error('Phase de jeu inconnue.');
  for (const player of state.players) {
    if (
      typeof player.name !== 'string' ||
      !player.name.trim() ||
      typeof player.id !== 'string' ||
      typeof player.bot !== 'boolean' ||
      typeof player.eliminated !== 'boolean' ||
      typeof player.abandoned !== 'boolean' ||
      typeof player.travelPending !== 'boolean'
    )
      throw new Error('Joueur invalide.');
    integer(player.cash);
  }
  // Also runs the engine's full configuration validation without changing this scenario.
  createGame({
    config: state.config,
    players: state.players,
    mode: state.mode,
    seed: 'debug-validation',
  });
  const errors = validateState(state);
  if (errors.length) throw new Error(`Situation incohérente : ${errors.join(' ')}`);
}

/** Interrupt pending decisions explicitly before moving or handing over the turn. */
function prepareTurn(state: GameState, playerId: string) {
  const index = state.players.findIndex((p) => p.id === playerId);
  if (index < 0) throw new Error('Joueur introuvable.');
  if (state.duel?.escrow) {
    for (const id of [state.duel.challengerId, state.duel.targetId])
      state.players.find((p) => p.id === id)!.cash += state.duel.amount;
  }
  delete state.duel;
  delete state.auction;
  delete state.pendingRent;
  delete state.pendingAttack;
  delete state.casino;
  state.debt = null;
  state.winner = null;
  state.currentPlayer = index;
  const player = state.players[index]!;
  player.eliminated = false;
  player.abandoned = false;
  player.islandTurns = null;
  player.travelPending = false;
  state.extraRoll = false;
  state.consecutiveDoubles = 0;
  state.dice = [];
  state.lastCard = null;
  state.phase = 'roll';
  state.decisionElapsedMs = 0;
  if (state.elapsedMs >= state.durationMs) state.elapsedMs = 0;
}

export function applyDebug(
  save: LocalSave,
  command: DebugCommand,
  present?: (before: GameState, events: GameEvent[]) => void,
): LocalSave {
  if (!save.debug) throw new Error('Activez le bac à sable pour modifier cette partie.');
  const next = structuredClone(save);
  const state = next.state;
  let before = save.state;
  let events: GameEvent[] = [];
  switch (command.type) {
    case 'options':
      next.debug = { freezeTime: command.freezeTime, freezeBots: command.freezeBots };
      break;
    case 'player': {
      integer(command.cash);
      integer(command.laps);
      const player = state.players.find((p) => p.id === command.playerId);
      if (!player) throw new Error('Joueur introuvable.');
      Object.assign(player, { cash: command.cash, laps: command.laps, bot: command.bot });
      break;
    }
    case 'move':
      integer(command.tile, 0, state.config.board.length - 1);
      prepareTurn(state, command.playerId);
      state.players[state.currentPlayer]!.position = command.tile;
      if (command.resolve) {
        before = structuredClone(state);
        const result = resolveDebugLanding(state, createRng(`${save.seed}:${state.seq}`));
        next.state = result.state;
        events = result.events;
      }
      break;
    case 'turn':
      prepareTurn(state, command.playerId);
      break;
    case 'property': {
      const property = state.properties[command.tile];
      if (!property) throw new Error('Choisissez une ville ou une île privée.');
      if (command.ownerId && !state.players.some((p) => p.id === command.ownerId && !p.eliminated))
        throw new Error('Le propriétaire doit être un joueur actif.');
      integer(command.level, 0, state.config.board[command.tile]!.type === 'resort' ? 0 : 4);
      for (const player of state.players)
        if (player.insurance?.tile === command.tile && player.id !== command.ownerId)
          delete player.insurance;
      state.properties[command.tile] = {
        ownerId: command.ownerId,
        level: command.ownerId ? command.level : 0,
        championships: command.ownerId && command.festival ? 1 : 0,
        ...(command.ownerId && command.festival && state.config.championshipDuration
          ? { championshipTurns: state.config.championshipDuration }
          : {}),
      };
      break;
    }
    case 'rules': {
      state.config = structuredClone(command.config);
      if (state.config.durationMs !== save.state.config.durationMs)
        state.durationMs = state.config.durationMs;
      state.elapsedMs = Math.min(state.elapsedMs, state.durationMs);
      state.decisionElapsedMs = 0;
      const count =
        state.adventure && state.adventure.twist !== 'festivals' ? 0 : state.config.festivalCount;
      integer(count, 0, Object.keys(state.properties).length);
      state.festivals = [
        ...new Set([...state.festivals, ...Object.keys(state.properties).map(Number)]),
      ].slice(0, count);
      for (const property of Object.values(state.properties)) {
        if (property.championships && state.config.championshipDuration)
          property.championshipTurns = Math.min(
            property.championshipTurns ?? state.config.championshipDuration,
            state.config.championshipDuration,
          );
        else delete property.championshipTurns;
      }
      break;
    }
    case 'dice': {
      if (command.values.length !== state.config.diceCount)
        throw new Error('Choisissez les deux dés.');
      command.values.forEach((value) => integer(value, 1, state.config.diceSides));
      if (!['roll', 'island'].includes(state.phase))
        throw new Error('Reprenez le tour du joueur avant de lancer les dés.');
      let index = 0;
      const random = createRng(`${save.seed}:${state.seq}`);
      const result = reduceGame(
        state,
        {
          type: state.phase === 'island' ? 'attempt_escape' : 'roll',
          playerId: state.players[state.currentPlayer]!.id,
        },
        () =>
          index < command.values.length
            ? (command.values[index++]! - 0.5) / state.config.diceSides
            : random(),
      );
      if (result.error) throw new Error(result.error);
      next.state = result.state;
      events = result.events;
      break;
    }
    case 'card': {
      if (!state.config.cards.some((card) => card.id === command.cardId))
        throw new Error('Carte inconnue.');
      for (const player of state.players) {
        player.escapeCards = player.escapeCards.filter((id) => id !== command.cardId);
        player.heldCards = player.heldCards?.filter((id) => id !== command.cardId);
      }
      // The engine draws a random deck index, so keep only the requested card in the draw pile.
      state.discard = [
        ...state.discard.filter((id) => id !== command.cardId),
        ...state.deck.filter((id) => id !== command.cardId),
      ];
      state.deck = [command.cardId];
      break;
    }
    case 'clock':
      integer(command.durationMs, 1);
      integer(command.elapsedMs, 0, command.durationMs);
      state.durationMs = command.durationMs;
      state.elapsedMs = command.elapsedMs;
      state.decisionElapsedMs = 0;
      break;
  }
  next.state.seq = save.state.seq + 1;
  validateDebugState(next.state);
  delete next.stats;
  next.history = [
    `[DEBUG] ${command.type} · tour ${next.state.turn}`,
    ...events
      .map((event) => eventText(event, next.state))
      .filter(Boolean)
      .reverse(),
    ...(save.history ?? []),
  ].slice(0, 200);
  present?.(before, events);
  return next;
}

export function parseDebug(raw: string): LocalSave {
  if (raw.length > 1_000_000) throw new Error('Ce scénario dépasse la limite de 1 Mo.');
  const save = JSON.parse(raw) as LocalSave;
  if (
    save?.version !== 1 ||
    typeof save.seed !== 'string' ||
    !save.debug ||
    typeof save.debug.freezeTime !== 'boolean' ||
    typeof save.debug.freezeBots !== 'boolean' ||
    (save.history !== undefined &&
      (!Array.isArray(save.history) || save.history.some((item) => typeof item !== 'string')))
  )
    throw new Error('Choisissez un export du mode debug Money Tour.');
  validateDebugState(save.state);
  delete save.stats;
  return save;
}
export function loadDebug(): LocalSave | null {
  try {
    const raw = localStorage.getItem(DEBUG_KEY);
    return raw ? parseDebug(raw) : null;
  } catch {
    return null;
  }
}
export function persistDebug(save: LocalSave): boolean {
  try {
    if (!save.debug) return false;
    localStorage.setItem(DEBUG_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
