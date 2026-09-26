import { config as defaultConfig } from './config.js';
import { createRng, randomInt } from './rng.js';
import type {
  ChanceCard,
  DebtContinuation,
  GameAction,
  GameConfig,
  GameEvent,
  GameOptions,
  GameResult,
  GameState,
  Player,
  Property,
  Rng,
  Tile,
  Winner,
} from './types.js';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const activePlayer = (state: GameState): Player => state.players[state.currentPlayer]!;
const tileAt = (state: GameState, id: number): Tile => state.config.board[id]!;
const owner = (state: GameState, id: string): Player | undefined =>
  state.players.find((player) => player.id === id);
const propertyTiles = (state: GameState, playerId: string): Tile[] =>
  state.config.board.filter((tile) => state.properties[tile.id]?.ownerId === playerId);
const allies = (state: GameState, first: string, second: string): boolean =>
  first === second ||
  (state.mode === 'teams' && owner(state, first)?.team === owner(state, second)?.team);

export function getPropertyValue(state: GameState, tileId: number): number {
  const tile = tileAt(state, tileId);
  if (!tile || (tile.type !== 'city' && tile.type !== 'resort')) return 0;
  const level = state.properties[tileId]?.level ?? 0;
  return (
    (tile.price ?? 0) +
    (tile.buildCosts ?? []).slice(1, level + 1).reduce((sum, value) => sum + value, 0)
  );
}

export function getNetWorth(state: GameState, playerId: string): number {
  const player = owner(state, playerId);
  return player
    ? player.cash +
        propertyTiles(state, playerId).reduce(
          (sum, tile) => sum + getPropertyValue(state, tile.id),
          0,
        )
    : 0;
}

export function getRent(state: GameState, tileId: number): number {
  const tile = tileAt(state, tileId);
  const property = state.properties[tileId];
  if (!tile || !property?.ownerId) return 0;
  if (tile.type === 'resort') {
    const count = propertyTiles(state, property.ownerId).filter(
      (item) => item.type === 'resort',
    ).length;
    return state.config.resortRents[count - 1] ?? 0;
  }
  return Math.floor(
    (tile.rents?.[property.level] ?? 0) *
      (state.festivals.includes(tileId) ? state.config.festivalMultiplier : 1) *
      (1 + property.championships),
  );
}

function validateConfig(config: GameConfig): void {
  const positive = [
    'initialCash',
    'startBonus',
    'durationMs',
    'actionTimeoutMs',
    'diceCount',
    'diceSides',
    'doublesToIsland',
    'maxIslandTurns',
    'islandFee',
    'championshipFee',
    'travelFee',
    'festivalMultiplier',
    'hotelLevel',
    'buyoutMultiplier',
    'maxResolutionDepth',
    'groupsToWin',
  ] as const;
  if (positive.some((key) => !Number.isSafeInteger(config[key]) || config[key] <= 0))
    throw new Error('Invalid positive integer configuration.');
  if (
    !Array.isArray(config.board) ||
    config.board.length < 1 ||
    config.board.some((tile, index) => tile.id !== index)
  )
    throw new Error('Board indices must be contiguous and ordered.');
  for (const kind of ['start', 'island', 'championship', 'travel'])
    if (config.board.filter((tile) => tile.type === kind).length !== 1)
      throw new Error(`Board must have one ${kind} tile.`);
  if (config.board[0]?.type !== 'start') throw new Error('Start must be board index zero.');
  if (config.resaleRate <= 0 || config.resaleRate > 1 || config.taxRate < 0 || config.taxRate > 1)
    throw new Error('Invalid economic rates.');
  if (
    !Number.isInteger(config.festivalCount) ||
    config.festivalCount < 0 ||
    config.festivalCount > config.board.filter((tile) => tile.type === 'city').length
  )
    throw new Error('Invalid festival count.');
  if (config.initialMaxLevel < 0 || config.initialMaxLevel > config.hotelLevel)
    throw new Error('Invalid building limits.');
  if (
    !config.cards.length ||
    new Set(config.cards.map((card) => card.id)).size !== config.cards.length
  )
    throw new Error('Chance cards must have unique identifiers.');
  for (const tile of config.board) {
    if (tile.type === 'city' || tile.type === 'resort') {
      if (!Number.isSafeInteger(tile.price) || (tile.price ?? 0) <= 0)
        throw new Error('Property prices must be positive integers.');
    }
    if (
      tile.type === 'city' &&
      (!tile.group ||
        tile.line === undefined ||
        tile.rents?.length !== config.hotelLevel + 1 ||
        tile.buildCosts?.length !== config.hotelLevel + 1 ||
        [...tile.rents, ...tile.buildCosts].some(
          (value) => !Number.isSafeInteger(value) || value < 0,
        ))
    )
      throw new Error('City levels, groups and lines must be configured.');
  }
}

export function createGame(
  options: GameOptions,
  rng: Rng = createRng(options.seed ?? 1),
): GameState {
  const config = clone(options.config ?? defaultConfig);
  validateConfig(config);
  if (options.players.length < config.minPlayers || options.players.length > config.maxPlayers)
    throw new Error('A game needs two to four players.');
  if (
    options.players.some((player) => !player.id || !player.name) ||
    new Set(options.players.map((player) => player.id)).size !== options.players.length
  )
    throw new Error('Players require unique IDs and names.');
  const mode = options.mode ?? 'free-for-all';
  if (mode !== 'free-for-all' && mode !== 'teams') throw new Error('Unknown game mode.');
  const players: Player[] = options.players.map((player, index) => ({
    ...player,
    ...(mode === 'teams' ? { team: player.team ?? index % 2 } : {}),
    bot: player.bot ?? false,
    cash: config.initialCash,
    position: 0,
    laps: 0,
    islandTurns: null,
    escapeCards: [],
    travelPending: false,
    eliminated: false,
    abandoned: false,
  }));
  if (mode === 'teams') {
    const teams = new Set(players.map((player) => player.team));
    if (
      players.length !== config.maxPlayers ||
      teams.size !== 2 ||
      [...teams].some(
        (team) =>
          !Number.isSafeInteger(team) ||
          players.filter((player) => player.team === team).length !== 2,
      )
    )
      throw new Error('Team games require two teams of two players.');
  }
  const durationMs = options.durationMs ?? config.durationMs;
  if (!Number.isSafeInteger(durationMs) || durationMs <= 0)
    throw new Error('Duration must be a positive integer.');
  const candidates = config.board.filter((tile) => tile.type === 'city').map((tile) => tile.id);
  const festivals: number[] = [];
  for (let index = 0; index < config.festivalCount; index += 1)
    festivals.push(candidates.splice(randomInt(rng, candidates.length), 1)[0]!);
  const properties: Record<number, Property> = {};
  for (const tile of config.board)
    if (tile.type === 'city' || tile.type === 'resort')
      properties[tile.id] = { ownerId: null, level: 0, championships: 0 };
  return {
    version: config.version,
    config,
    mode,
    players,
    currentPlayer: 0,
    phase: 'roll',
    properties,
    festivals: festivals.sort((a, b) => a - b),
    deck: config.cards.map((card) => card.id),
    discard: [],
    turn: 1,
    seq: 0,
    elapsedMs: 0,
    decisionElapsedMs: 0,
    durationMs,
    consecutiveDoubles: 0,
    extraRoll: false,
    dice: [],
    lastCard: null,
    debt: null,
    winner: null,
  };
}

function canUpgrade(state: GameState, player: Player, tile: Tile): boolean {
  const property = state.properties[tile.id];
  if (tile.type !== 'city' || property?.ownerId !== player.id) return false;
  if (
    state.config.board.some(
      (other) =>
        other.type === 'city' &&
        other.group === tile.group &&
        state.properties[other.id]?.ownerId !== player.id,
    )
  )
    return false;
  const cap = player.laps > 0 ? state.config.hotelLevel : state.config.initialMaxLevel;
  return property.level < cap && player.cash >= (tile.buildCosts?.[property.level + 1] ?? Infinity);
}

export function getLegalActions(state: GameState): GameAction[] {
  if (state.phase === 'finished' || state.winner) return [];
  const player = activePlayer(state);
  if (!player || player.eliminated) return [];
  const action = (
    type:
      | 'roll'
      | 'buy'
      | 'buyout'
      | 'upgrade'
      | 'finish'
      | 'pay_bail'
      | 'use_escape'
      | 'attempt_escape'
      | 'decline_travel'
      | 'quit',
  ): GameAction => ({ type, playerId: player.id });
  const result: GameAction[] = [];
  if (state.phase === 'roll') result.push(action('roll'));
  if (state.phase === 'island') {
    result.push(action('attempt_escape'));
    if (player.cash >= state.config.islandFee) result.push(action('pay_bail'));
    if (player.escapeCards.length) result.push(action('use_escape'));
  }
  if (state.phase === 'travel') {
    result.push(action('decline_travel'));
    if (player.cash >= state.config.travelFee)
      for (const tile of state.config.board) {
        const destinationOwner = state.properties[tile.id]?.ownerId;
        if (
          tile.id !== player.position &&
          (!destinationOwner || allies(state, player.id, destinationOwner))
        )
          result.push({ type: 'travel', playerId: player.id, tile: tile.id });
      }
  }
  if (state.phase === 'property') {
    const tile = tileAt(state, player.position);
    const property = state.properties[tile.id];
    if (property && !property.ownerId && player.cash >= (tile.price ?? Infinity))
      result.push(action('buy'));
    if (canUpgrade(state, player, tile)) result.push(action('upgrade'));
    if (
      property?.ownerId &&
      !allies(state, player.id, property.ownerId) &&
      tile.type === 'city' &&
      property.level < state.config.hotelLevel &&
      player.cash >= Math.floor(getPropertyValue(state, tile.id) * state.config.buyoutMultiplier)
    )
      result.push(action('buyout'));
    result.push(action('finish'));
  }
  if (state.phase === 'championship') {
    if (player.cash >= state.config.championshipFee)
      for (const tile of propertyTiles(state, player.id))
        if (tile.type === 'city')
          result.push({ type: 'place_championship', playerId: player.id, tile: tile.id });
    result.push(action('finish'));
  }
  if (state.phase === 'debt')
    for (const tile of propertyTiles(state, player.id))
      result.push({ type: 'sell', playerId: player.id, tile: tile.id });
  if (state.phase === 'end') result.push(action('finish'));
  result.push(action('quit'));
  return result;
}

function credit(
  state: GameState,
  playerId: string | null,
  amount: number,
  events: GameEvent[],
  reason: string,
): void {
  if (playerId) {
    const player = owner(state, playerId);
    if (player && !player.eliminated) player.cash += amount;
  }
  events.push({
    type: 'payment',
    playerId: playerId ?? undefined,
    payerId: activePlayer(state).id,
    tile: activePlayer(state).position,
    amount,
    reason,
  });
}

function releaseAssets(state: GameState, player: Player): void {
  for (const tile of propertyTiles(state, player.id))
    state.properties[tile.id] = { ownerId: null, level: 0, championships: 0 };
  state.discard.push(...player.escapeCards);
  player.escapeCards = [];
  player.travelPending = false;
  player.islandTurns = null;
}

function bankrupt(state: GameState, player: Player, events: GameEvent[]): void {
  const debt = state.debt;
  const liquidation = propertyTiles(state, player.id).reduce(
    (sum, tile) => sum + Math.floor(getPropertyValue(state, tile.id) * state.config.resaleRate),
    0,
  );
  const available = player.cash + liquidation;
  credit(
    state,
    debt?.creditorId ?? null,
    Math.min(available, debt?.amount ?? 0),
    events,
    'bankruptcy',
  );
  player.cash = 0;
  releaseAssets(state, player);
  player.eliminated = true;
  state.debt = null;
  state.extraRoll = false;
  state.consecutiveDoubles = 0;
  state.phase = 'end';
  events.push({ type: 'bankruptcy', playerId: player.id, amount: available });
}

function settleDebt(state: GameState, events: GameEvent[]): void {
  const debt = state.debt;
  if (!debt) return;
  const player = owner(state, debt.playerId)!;
  if (player.cash >= debt.amount) {
    player.cash -= debt.amount;
    credit(state, debt.creditorId, debt.amount, events, debt.reason);
    state.phase = debt.continuation;
    state.debt = null;
    events.push({ type: 'debt_settled', playerId: player.id, amount: debt.amount });
  } else {
    const available =
      player.cash +
      propertyTiles(state, player.id).reduce(
        (sum, tile) => sum + Math.floor(getPropertyValue(state, tile.id) * state.config.resaleRate),
        0,
      );
    if (available < debt.amount) bankrupt(state, player, events);
    else state.phase = 'debt';
  }
}

function charge(
  state: GameState,
  amount: number,
  creditorId: string | null,
  reason: string,
  continuation: DebtContinuation,
  events: GameEvent[],
): void {
  const player = activePlayer(state);
  state.debt = { playerId: player.id, creditorId, amount, reason, continuation };
  settleDebt(state, events);
}

function enterIsland(state: GameState, events: GameEvent[]): void {
  const player = activePlayer(state);
  player.position = state.config.board.find((tile) => tile.type === 'island')!.id;
  player.islandTurns = 0;
  player.travelPending = false;
  state.extraRoll = false;
  state.consecutiveDoubles = 0;
  state.phase = 'end';
  events.push({ type: 'island', playerId: player.id });
}

function move(state: GameState, steps: number, salary: boolean, events: GameEvent[]): void {
  const player = activePlayer(state);
  const size = state.config.board.length;
  const raw = player.position + steps;
  const laps = steps > 0 && salary ? Math.floor(raw / size) : 0;
  player.position = ((raw % size) + size) % size;
  if (laps > 0) {
    player.laps += laps;
    const bonus = state.config.startBonus * laps;
    player.cash += bonus;
    events.push({ type: 'start_bonus', playerId: player.id, amount: bonus });
  }
  events.push({ type: 'move', playerId: player.id, tile: player.position, steps });
}

function drawCard(state: GameState, rng: Rng, events: GameEvent[], depth: number): void {
  if (!state.deck.length) {
    state.deck = [...state.discard];
    state.discard = [];
  }
  if (!state.deck.length) {
    state.phase = 'end';
    return;
  }
  const cardId = state.deck.splice(randomInt(rng, state.deck.length), 1)[0]!;
  const card = state.config.cards.find((item) => item.id === cardId)!;
  state.lastCard = card.id;
  events.push({
    type: 'card',
    playerId: activePlayer(state).id,
    cardId,
    message: card.description,
  });
  if (card.effect === 'escape') {
    activePlayer(state).escapeCards.push(card.id);
    state.phase = 'end';
  } else {
    state.discard.push(card.id);
    applyCard(state, card, rng, events, depth);
  }
}

function applyCard(
  state: GameState,
  card: ChanceCard,
  rng: Rng,
  events: GameEvent[],
  depth: number,
): void {
  const player = activePlayer(state);
  state.phase = 'end';
  if (card.effect === 'cash') {
    if ((card.amount ?? 0) >= 0) {
      player.cash += card.amount ?? 0;
      events.push({ type: 'income', playerId: player.id, amount: card.amount });
    } else charge(state, -(card.amount ?? 0), null, card.title, 'end', events);
  }
  if (card.effect === 'move_to') {
    const target = card.target!;
    if (tileAt(state, target).type === 'island' && card.salary === false)
      enterIsland(state, events);
    else {
      const distance =
        (target - player.position + state.config.board.length) % state.config.board.length;
      move(state, distance, card.salary ?? true, events);
      resolveTile(state, rng, events, depth + 1);
    }
  }
  if (card.effect === 'move_by') {
    move(state, card.steps ?? 0, card.salary ?? true, events);
    resolveTile(state, rng, events, depth + 1);
  }
  if (card.effect === 'steal' || card.effect === 'levy') {
    const rivals = state.players
      .filter((p) => !p.eliminated && !allies(state, player.id, p.id))
      .sort((a, b) => b.cash - a.cash || a.id.localeCompare(b.id));
    const targets = card.effect === 'steal' ? rivals.slice(0, 1) : rivals;
    for (const rival of targets) {
      const amount = Math.min(rival.cash, card.amount ?? 0);
      rival.cash -= amount;
      player.cash += amount;
      events.push({
        type: 'payment',
        playerId: player.id,
        payerId: rival.id,
        amount,
        reason: 'attack',
      });
    }
  }
  if (card.effect === 'downgrade') {
    const candidates = state.config.board
      .filter((tile) => {
        const property = state.properties[tile.id];
        return (
          tile.type === 'city' &&
          property?.ownerId &&
          !allies(state, player.id, property.ownerId) &&
          property.level > 0 &&
          property.level < state.config.hotelLevel
        );
      })
      .sort(
        (a, b) =>
          state.properties[b.id]!.level - state.properties[a.id]!.level ||
          getPropertyValue(state, b.id) - getPropertyValue(state, a.id) ||
          a.id - b.id,
      );
    const target = candidates[0];
    if (target) {
      state.properties[target.id]!.level -= 1;
      events.push({ type: 'downgrade', playerId: player.id, tile: target.id });
    } else events.push({ type: 'card_no_effect', playerId: player.id, cardId: card.id });
  }
}

function resolveTile(state: GameState, rng: Rng, events: GameEvent[], depth = 0): void {
  if (depth > state.config.maxResolutionDepth)
    throw new Error('Configured card movement cycle exceeds resolution limit.');
  const player = activePlayer(state);
  const tile = tileAt(state, player.position);
  state.phase = 'end';
  switch (tile.type) {
    case 'city':
    case 'resort': {
      const property = state.properties[tile.id]!;
      state.phase = 'property';
      if (property.ownerId && !allies(state, player.id, property.ownerId))
        charge(state, getRent(state, tile.id), property.ownerId, 'rent', 'property', events);
      break;
    }
    case 'island':
      enterIsland(state, events);
      break;
    case 'championship':
      state.phase = 'championship';
      break;
    case 'travel':
      player.travelPending = true;
      break;
    case 'tax':
      charge(
        state,
        (state.config.taxBase ?? 0) +
          Math.floor(
            propertyTiles(state, player.id).reduce(
              (sum, item) => sum + getPropertyValue(state, item.id),
              0,
            ) * state.config.taxRate,
          ),
        null,
        'tax',
        'end',
        events,
      );
      break;
    case 'chance':
      drawCard(state, rng, events, depth);
      break;
    case 'start':
      break;
  }
}

function beginTurn(state: GameState): void {
  const player = activePlayer(state);
  state.phase = player.islandTurns !== null ? 'island' : player.travelPending ? 'travel' : 'roll';
  state.decisionElapsedMs = 0;
  state.lastCard = null;
  state.dice = [];
}

function nextTurn(state: GameState, events: GameEvent[]): void {
  if (state.extraRoll && !activePlayer(state).eliminated) {
    state.extraRoll = false;
    state.phase = 'roll';
    events.push({ type: 'extra_roll', playerId: activePlayer(state).id });
    return;
  }
  state.consecutiveDoubles = 0;
  state.extraRoll = false;
  const current = state.currentPlayer;
  for (let offset = 1; offset <= state.players.length; offset += 1) {
    const candidate = (current + offset) % state.players.length;
    if (!state.players[candidate]!.eliminated) {
      state.currentPlayer = candidate;
      break;
    }
  }
  state.turn += 1;
  beginTurn(state);
  events.push({ type: 'turn', playerId: activePlayer(state).id, turn: state.turn });
}

function roll(state: GameState, rng: Rng, events: GameEvent[], fromIsland: boolean): void {
  const player = activePlayer(state);
  state.dice = Array.from(
    { length: state.config.diceCount },
    () => randomInt(rng, state.config.diceSides) + 1,
  );
  const total = state.dice.reduce((sum, value) => sum + value, 0);
  const double = state.dice.every((value) => value === state.dice[0]);
  events.push({ type: 'dice', playerId: player.id, dice: [...state.dice] });
  if (fromIsland) {
    player.islandTurns = (player.islandTurns ?? 0) + 1;
    state.extraRoll = false;
    state.consecutiveDoubles = 0;
    if (!double && player.islandTurns < state.config.maxIslandTurns) {
      state.phase = 'end';
      return;
    }
    player.islandTurns = null;
    events.push({ type: 'island_exit', playerId: player.id });
  } else {
    state.consecutiveDoubles = double ? state.consecutiveDoubles + 1 : 0;
    state.extraRoll = double;
    if (state.consecutiveDoubles >= state.config.doublesToIsland) {
      enterIsland(state, events);
      return;
    }
  }
  move(state, total, true, events);
  resolveTile(state, rng, events);
}

function checkVictory(state: GameState, events: GameEvent[]): void {
  if (state.winner) return;
  const living = state.players.filter((player) => !player.eliminated);
  const collections =
    state.mode === 'teams'
      ? [...new Set(living.map((player) => player.team!))].map((team) => ({
          members: living.filter((player) => player.team === team),
          team,
          ids: state.players.filter((player) => player.team === team).map((player) => player.id),
        }))
      : living.map((player) => ({ members: [player], team: undefined, ids: [player.id] }));
  const winners: { ids: string[]; team?: number; reasons: string[]; value: number }[] = [];
  for (const collection of collections) {
    const ids = new Set(collection.members.map((player) => player.id));
    const owns = (tile: Tile): boolean => ids.has(state.properties[tile.id]?.ownerId ?? '');
    const cities = state.config.board.filter((tile) => tile.type === 'city');
    const lines = [...new Set(cities.map((tile) => tile.line))];
    const groups = [...new Set(cities.map((tile) => tile.group))];
    const resorts = state.config.board.filter((tile) => tile.type === 'resort');
    const reasons: string[] = [];
    if (
      state.config.lineVictory !== false &&
      lines.some((line) => cities.filter((tile) => tile.line === line).every(owns))
    )
      reasons.push('line');
    if (
      groups.filter((group) => cities.filter((tile) => tile.group === group).every(owns)).length >=
      state.config.groupsToWin
    )
      reasons.push('triple_monopoly');
    if (state.config.resortVictory !== false && resorts.length > 0 && resorts.every(owns))
      reasons.push('resort_monopoly');
    if (collections.length === 1) reasons.push('bankruptcy');
    if (reasons.length)
      winners.push({
        ids: collection.ids,
        team: collection.team,
        reasons,
        value: collection.members.reduce((sum, player) => sum + getNetWorth(state, player.id), 0),
      });
  }
  let result: Winner | null = null;
  if (winners.length)
    result = {
      playerIds: winners.flatMap((winner) => winner.ids),
      teamIds: winners.flatMap((winner) => (winner.team === undefined ? [] : [winner.team])),
      reasons: [...new Set(winners.flatMap((winner) => winner.reasons))],
      netWorth: Math.max(...winners.map((winner) => winner.value)),
    };
  else if (state.elapsedMs >= state.durationMs || !living.length) {
    const scores = collections.map((collection) => ({
      ...collection,
      value: collection.members.reduce((sum, player) => sum + getNetWorth(state, player.id), 0),
    }));
    const best = Math.max(0, ...scores.map((score) => score.value));
    const tied = scores.filter((score) => score.value === best);
    result = {
      playerIds: tied.flatMap((score) => score.ids),
      teamIds: tied.flatMap((score) => (score.team === undefined ? [] : [score.team])),
      reasons: [living.length ? 'timeout' : 'abandoned'],
      netWorth: best,
    };
  }
  if (result) {
    state.winner = result;
    state.phase = 'finished';
    state.debt = null;
    state.extraRoll = false;
    events.push({ type: 'victory', winner: result });
  }
}

function liquidationOrder(state: GameState): Tile[] {
  const player = activePlayer(state);
  const importance = (tile: Tile): number =>
    tile.group
      ? propertyTiles(state, player.id).filter((item) => item.group === tile.group).length
      : 0;
  return propertyTiles(state, player.id).sort(
    (a, b) =>
      importance(a) - importance(b) ||
      getPropertyValue(state, a.id) - getPropertyValue(state, b.id) ||
      a.id - b.id,
  );
}

function timeoutAction(state: GameState): GameAction {
  const playerId = activePlayer(state).id;
  if (state.phase === 'debt')
    return { type: 'sell', playerId, tile: liquidationOrder(state)[0]!.id };
  if (state.phase === 'island') return { type: 'attempt_escape', playerId };
  if (state.phase === 'travel') return { type: 'decline_travel', playerId };
  if (state.phase === 'roll') return { type: 'roll', playerId };
  return { type: 'finish', playerId };
}

function applyAction(state: GameState, action: GameAction, rng: Rng, events: GameEvent[]): void {
  const player = activePlayer(state);
  switch (action.type) {
    case 'roll':
      roll(state, rng, events, false);
      break;
    case 'attempt_escape':
      roll(state, rng, events, true);
      break;
    case 'pay_bail':
      player.cash -= state.config.islandFee;
      player.islandTurns = null;
      state.phase = 'roll';
      events.push({ type: 'island_exit', playerId: player.id, amount: state.config.islandFee });
      break;
    case 'use_escape':
      state.discard.push(player.escapeCards.shift()!);
      player.islandTurns = null;
      state.phase = 'roll';
      events.push({ type: 'island_exit', playerId: player.id });
      break;
    case 'decline_travel':
      player.travelPending = false;
      state.phase = 'roll';
      break;
    case 'travel': {
      player.cash -= state.config.travelFee;
      player.travelPending = false;
      state.extraRoll = false;
      const distance =
        (action.tile - player.position + state.config.board.length) % state.config.board.length;
      events.push({
        type: 'travel',
        playerId: player.id,
        tile: action.tile,
        amount: state.config.travelFee,
      });
      move(state, distance, true, events);
      resolveTile(state, rng, events);
      break;
    }
    case 'buy': {
      const tile = tileAt(state, player.position);
      player.cash -= tile.price!;
      state.properties[tile.id]!.ownerId = player.id;
      events.push({ type: 'purchase', playerId: player.id, tile: tile.id, amount: tile.price });
      break;
    }
    case 'buyout': {
      const property = state.properties[player.position]!;
      const price = Math.floor(
        getPropertyValue(state, player.position) * state.config.buyoutMultiplier,
      );
      player.cash -= price;
      credit(state, property.ownerId, price, events, 'buyout');
      property.ownerId = player.id;
      events.push({ type: 'buyout', playerId: player.id, tile: player.position, amount: price });
      break;
    }
    case 'upgrade': {
      const property = state.properties[player.position]!;
      property.level += 1;
      const price = tileAt(state, player.position).buildCosts![property.level]!;
      player.cash -= price;
      events.push({
        type: 'build',
        playerId: player.id,
        tile: player.position,
        amount: price,
        level: property.level,
      });
      break;
    }
    case 'place_championship':
      state.properties[action.tile]!.championships += 1;
      player.cash -= state.config.championshipFee;
      state.phase = 'end';
      events.push({
        type: 'championship',
        playerId: player.id,
        tile: action.tile,
        amount: state.config.championshipFee,
      });
      break;
    case 'sell': {
      const value = Math.floor(getPropertyValue(state, action.tile) * state.config.resaleRate);
      player.cash += value;
      state.properties[action.tile] = { ownerId: null, level: 0, championships: 0 };
      events.push({ type: 'sale', playerId: player.id, tile: action.tile, amount: value });
      settleDebt(state, events);
      break;
    }
    case 'finish':
      nextTurn(state, events);
      break;
    case 'quit': {
      const leaving = owner(state, action.playerId)!;
      if (state.debt?.playerId === leaving.id) bankrupt(state, leaving, events);
      else {
        releaseAssets(state, leaving);
        leaving.cash = 0;
        leaving.eliminated = true;
      }
      leaving.abandoned = true;
      if (leaving.id === player.id) {
        state.extraRoll = false;
        state.consecutiveDoubles = 0;
        state.phase = 'end';
      }
      events.push({ type: 'quit', playerId: leaving.id });
      break;
    }
    case 'set_control':
      owner(state, action.playerId)!.bot = action.bot;
      events.push({ type: 'control', playerId: action.playerId, bot: action.bot });
      break;
    case 'tick':
      break;
  }
}

export function reduceGame(
  state: GameState,
  action: GameAction,
  rng: Rng = createRng(`${state.seq}:${state.turn}`),
): GameResult {
  if (!action || typeof action !== 'object' || state.phase === 'finished' || state.winner)
    return { state, events: [], error: 'Game is finished or action is invalid.' };
  let valid: boolean;
  if (action.type === 'tick')
    valid = Number.isSafeInteger(action.elapsedMs) && action.elapsedMs >= 0;
  else if (action.type === 'set_control')
    valid =
      typeof action.bot === 'boolean' &&
      Boolean(owner(state, action.playerId) && !owner(state, action.playerId)!.eliminated);
  else if (action.type === 'quit')
    valid = Boolean(owner(state, action.playerId) && !owner(state, action.playerId)!.eliminated);
  else
    valid = getLegalActions(state).some(
      (candidate) =>
        candidate.type === action.type &&
        'playerId' in candidate &&
        'playerId' in action &&
        candidate.playerId === action.playerId &&
        (!('tile' in candidate) || ('tile' in action && candidate.tile === action.tile)),
    );
  if (!valid) return { state, events: [], error: 'Action is not legal in the current phase.' };
  // Configuration is immutable during a game. Copy only mutable game data per action.
  const next: GameState = {
    ...state,
    players: state.players.map((player) => ({ ...player, escapeCards: [...player.escapeCards] })),
    properties: Object.fromEntries(
      Object.entries(state.properties).map(([id, property]) => [id, { ...property }]),
    ),
    festivals: [...state.festivals],
    deck: [...state.deck],
    discard: [...state.discard],
    dice: [...state.dice],
    debt: state.debt ? { ...state.debt } : null,
  };
  const events: GameEvent[] = [];
  next.seq += 1;
  if (action.type === 'tick') {
    next.elapsedMs = Math.min(next.durationMs, next.elapsedMs + action.elapsedMs);
    next.decisionElapsedMs += action.elapsedMs;
    checkVictory(next, events);
    if (!next.winner && next.decisionElapsedMs >= next.config.actionTimeoutMs) {
      events.push({ type: 'timeout', playerId: activePlayer(next).id });
      applyAction(next, timeoutAction(next), rng, events);
      next.decisionElapsedMs = 0;
    }
  } else {
    applyAction(next, action, rng, events);
    if (
      action.type !== 'set_control' &&
      !(action.type === 'quit' && action.playerId !== activePlayer(state).id)
    )
      next.decisionElapsedMs = 0;
  }
  checkVictory(next, events);
  if (!next.winner && activePlayer(next).eliminated) nextTurn(next, events);
  return { state: next, events };
}

export function chooseBotAction(state: GameState): GameAction {
  const player = activePlayer(state);
  const legal = getLegalActions(state).filter((action) => action.type !== 'quit');
  if (!legal.length) throw new Error('No bot action is available in a finished game.');
  const find = (type: GameAction['type']): GameAction | undefined =>
    legal.find((action) => action.type === type);
  if (state.phase === 'debt')
    return { type: 'sell', playerId: player.id, tile: liquidationOrder(state)[0]!.id };
  if (state.phase === 'island')
    return (
      find('use_escape') ??
      (player.cash > state.config.botReserve + state.config.islandFee
        ? find('pay_bail')
        : undefined) ??
      find('attempt_escape')!
    );
  if (state.phase === 'travel') {
    const choices = legal.filter(
      (action): action is Extract<GameAction, { type: 'sell' | 'place_championship' | 'travel' }> =>
        action.type === 'travel',
    );
    choices.sort(
      (a, b) => opportunity(state, b.tile) - opportunity(state, a.tile) || a.tile - b.tile,
    );
    const best = choices[0];
    if (
      best &&
      opportunity(state, best.tile) > 0 &&
      player.cash > state.config.travelFee + state.config.botReserve
    )
      return best;
    return find('decline_travel')!;
  }
  if (state.phase === 'championship') {
    const choices = legal.filter(
      (action): action is Extract<GameAction, { type: 'sell' | 'place_championship' | 'travel' }> =>
        action.type === 'place_championship',
    );
    choices.sort((a, b) => getRent(state, b.tile) - getRent(state, a.tile) || a.tile - b.tile);
    if (choices[0] && player.cash >= state.config.botReserve + state.config.championshipFee)
      return choices[0];
    return find('finish')!;
  }
  if (state.phase === 'property') {
    const tile = tileAt(state, player.position);
    const property = state.properties[tile.id]!;
    const value = opportunity(state, tile.id);
    const purchase = find('buy') ?? find('buyout');
    if (purchase) {
      const cost =
        purchase.type === 'buy'
          ? tile.price!
          : Math.floor(getPropertyValue(state, tile.id) * state.config.buyoutMultiplier);
      if (
        player.cash - cost >= (value >= 100 ? 0 : state.config.botReserve) &&
        (purchase.type === 'buy' || value >= 20)
      )
        return purchase;
    }
    const upgrade = find('upgrade');
    if (upgrade && player.cash - tile.buildCosts![property.level + 1]! >= state.config.botReserve)
      return upgrade;
    return find('finish')!;
  }
  return find('roll') ?? find('finish') ?? legal[0]!;
}

function opportunity(state: GameState, tileId: number): number {
  const tile = tileAt(state, tileId);
  const player = activePlayer(state);
  const property = state.properties[tileId];
  if (!property) return 0;
  if (property.ownerId && allies(state, player.id, property.ownerId))
    return property.ownerId === player.id && canUpgrade(state, player, tile) ? 8 : 0;
  if (tile.type === 'resort')
    return (
      25 + propertyTiles(state, player.id).filter((item) => item.type === 'resort').length * 25
    );
  const group = state.config.board.filter((item) => item.group && item.group === tile.group);
  const ownCount = group.filter((item) => {
    const id = state.properties[item.id]?.ownerId;
    return id && allies(state, player.id, id);
  }).length;
  const opponentDanger = state.players
    .filter((opponent) => !opponent.eliminated && !allies(state, player.id, opponent.id))
    .some(
      (opponent) =>
        group.filter((item) => {
          const id = state.properties[item.id]?.ownerId;
          return id && allies(state, opponent.id, id);
        }).length ===
        group.length - 1,
    );
  return (
    10 +
    ownCount * 25 +
    (ownCount === group.length - 1 ? 100 : 0) +
    (opponentDanger ? 60 : 0) +
    (state.festivals.includes(tileId) ? 25 : 0)
  );
}

export function validateState(state: GameState): string[] {
  const errors: string[] = [];
  const safe = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;
  if (!state.players[state.currentPlayer]) errors.push('Invalid active player index.');
  if (new Set(state.players.map((player) => player.id)).size !== state.players.length)
    errors.push('Duplicate player IDs.');
  for (const player of state.players) {
    if (!safe(player.cash)) errors.push(`Invalid cash for ${player.id}.`);
    if (!safe(player.position) || player.position >= state.config.board.length)
      errors.push(`Invalid position for ${player.id}.`);
    if (!safe(player.laps)) errors.push(`Invalid lap count for ${player.id}.`);
    if (
      player.islandTurns !== null &&
      (!safe(player.islandTurns) || player.islandTurns >= state.config.maxIslandTurns)
    )
      errors.push(`Invalid island count for ${player.id}.`);
    if (player.eliminated && propertyTiles(state, player.id).length)
      errors.push(`Eliminated player ${player.id} owns assets.`);
  }
  for (const [key, property] of Object.entries(state.properties)) {
    const tile = tileAt(state, Number(key));
    if (!tile || (tile.type !== 'city' && tile.type !== 'resort')) {
      errors.push('Property entry for a non-property tile.');
      continue;
    }
    if (
      property.ownerId &&
      (!owner(state, property.ownerId) || owner(state, property.ownerId)!.eliminated)
    )
      errors.push(`Invalid owner on ${key}.`);
    if (
      !safe(property.level) ||
      property.level > state.config.hotelLevel ||
      (tile.type === 'resort' && property.level !== 0)
    )
      errors.push(`Invalid level on ${key}.`);
    if (!safe(property.championships) || (tile.type === 'resort' && property.championships !== 0))
      errors.push(`Invalid championship count on ${key}.`);
    if (!property.ownerId && (property.level !== 0 || property.championships !== 0))
      errors.push(`Unowned improved property ${key}.`);
  }
  if (
    state.config.board.some(
      (tile) => (tile.type === 'city' || tile.type === 'resort') && !state.properties[tile.id],
    )
  )
    errors.push('Missing property entry.');
  if (
    state.festivals.length !== state.config.festivalCount ||
    new Set(state.festivals).size !== state.festivals.length ||
    state.festivals.some((id) => tileAt(state, id)?.type !== 'city')
  )
    errors.push('Invalid festivals.');
  const cards = [
    ...state.deck,
    ...state.discard,
    ...state.players.flatMap((player) => player.escapeCards),
  ];
  if (
    cards.length !== state.config.cards.length ||
    new Set(cards).size !== cards.length ||
    cards.some((id) => !state.config.cards.some((card) => card.id === id))
  )
    errors.push('Card inventory is not conserved.');
  if (
    state.players.some((player) =>
      player.escapeCards.some(
        (id) => state.config.cards.find((card) => card.id === id)?.effect !== 'escape',
      ),
    )
  )
    errors.push('A player holds a non-retainable card.');
  if ((state.phase === 'debt') !== Boolean(state.debt))
    errors.push('Debt phase and debt data disagree.');
  if (
    state.debt &&
    (!safe(state.debt.amount) ||
      state.debt.playerId !== activePlayer(state)?.id ||
      (state.debt.creditorId !== null && !owner(state, state.debt.creditorId)))
  )
    errors.push('Invalid debt.');
  if ((state.phase === 'finished') !== Boolean(state.winner))
    errors.push('Winner and terminal phase disagree.');
  if (state.phase !== 'finished' && activePlayer(state)?.eliminated)
    errors.push('Eliminated player is active.');
  if (
    ![
      state.turn,
      state.seq,
      state.elapsedMs,
      state.decisionElapsedMs,
      state.consecutiveDoubles,
    ].every(safe)
  )
    errors.push('Invalid counters.');
  if (!safe(state.durationMs) || state.durationMs === 0 || state.elapsedMs > state.durationMs)
    errors.push('Invalid game duration.');
  return errors;
}
