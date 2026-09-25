export type Rng = () => number;
export type Phase =
  'roll' | 'island' | 'travel' | 'property' | 'championship' | 'debt' | 'end' | 'finished';
export type TileType =
  'start' | 'city' | 'resort' | 'chance' | 'island' | 'championship' | 'travel' | 'tax';
export interface Tile {
  id: number;
  name: string;
  type: TileType;
  group?: string;
  color?: string;
  line?: number;
  price?: number;
  rents?: number[];
  buildCosts?: number[];
}
export interface ChanceCard {
  id: string;
  title: string;
  description: string;
  effect: 'cash' | 'move_to' | 'move_by' | 'escape' | 'downgrade';
  amount?: number;
  target?: number;
  steps?: number;
  salary?: boolean;
}
export interface GameConfig {
  version: number;
  initialCash: number;
  startBonus: number;
  durationMs: number;
  actionTimeoutMs: number;
  minPlayers: number;
  maxPlayers: number;
  groupsToWin: number;
  diceCount: number;
  diceSides: number;
  doublesToIsland: number;
  maxIslandTurns: number;
  islandFee: number;
  championshipFee: number;
  travelFee: number;
  festivalCount: number;
  festivalMultiplier: number;
  initialMaxLevel: number;
  hotelLevel: number;
  buyoutMultiplier: number;
  resaleRate: number;
  taxRate: number;
  resortRents: number[];
  maxResolutionDepth: number;
  simulationActionLimit: number;
  botReserve: number;
  board: Tile[];
  cards: ChanceCard[];
  network: {
    hostTimeoutMs: number;
    commitTimeoutMs: number;
    revealTimeoutMs: number;
    reconnectTtlMs: number;
    maxRandomRetries: number;
  };
}
export interface PlayerSetup {
  id: string;
  name: string;
  bot?: boolean;
  team?: number;
}
export interface Player extends PlayerSetup {
  bot: boolean;
  cash: number;
  position: number;
  laps: number;
  islandTurns: number | null;
  escapeCards: string[];
  travelPending: boolean;
  eliminated: boolean;
  abandoned: boolean;
}
export interface Property {
  ownerId: string | null;
  level: number;
  championships: number;
}
export type DebtContinuation = 'property' | 'end';
export interface Debt {
  playerId: string;
  creditorId: string | null;
  amount: number;
  reason: string;
  continuation: DebtContinuation;
}
export interface Winner {
  playerIds: string[];
  teamIds: number[];
  reasons: string[];
  netWorth: number;
}
export interface GameState {
  version: number;
  config: GameConfig;
  mode: 'free-for-all' | 'teams';
  players: Player[];
  currentPlayer: number;
  phase: Phase;
  properties: Record<number, Property>;
  festivals: number[];
  deck: string[];
  discard: string[];
  turn: number;
  seq: number;
  elapsedMs: number;
  decisionElapsedMs: number;
  durationMs: number;
  consecutiveDoubles: number;
  extraRoll: boolean;
  dice: number[];
  lastCard: string | null;
  debt: Debt | null;
  winner: Winner | null;
}
export interface GameOptions {
  players: PlayerSetup[];
  mode?: 'free-for-all' | 'teams';
  seed?: string | number;
  durationMs?: number;
  config?: GameConfig;
}
type PlayerActionType =
  | 'roll'
  | 'buy'
  | 'buyout'
  | 'upgrade'
  | 'finish'
  | 'pay_bail'
  | 'use_escape'
  | 'attempt_escape'
  | 'decline_travel'
  | 'quit';
export type GameAction =
  | { type: PlayerActionType; playerId: string }
  | { type: 'sell' | 'place_championship' | 'travel'; playerId: string; tile: number }
  | { type: 'tick'; elapsedMs: number }
  | { type: 'set_control'; playerId: string; bot: boolean };
export interface GameEvent {
  type: string;
  playerId?: string;
  tile?: number;
  amount?: number;
  cardId?: string;
  message?: string;
  dice?: number[];
  [key: string]: unknown;
}
export interface GameResult {
  state: GameState;
  events: GameEvent[];
  error?: string;
}
