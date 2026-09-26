import {
  config,
  createGame,
  createRng,
  reduceGame,
  validateState,
  type GameAction,
  type GameOptions,
  type GameResult,
  type GameState,
} from '@money-tour/engine';

export interface LocalSave {
  version: 1;
  seed: string;
  state: GameState;
}
const key = 'money-tour.local.v1';
export function newLocal(options: GameOptions): LocalSave {
  const seed = crypto.randomUUID();
  return { version: 1, seed, state: createGame({ ...options, seed }, createRng(seed)) };
}
export function applyLocal(
  save: LocalSave,
  action: GameAction,
): { save: LocalSave; result: GameResult } {
  const result = reduceGame(save.state, action, createRng(`${save.seed}:${save.state.seq}`));
  return { save: { ...save, state: result.state }, result };
}
export function loadLocal(): LocalSave | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const save = JSON.parse(raw) as LocalSave;
    // Cosmetic atlas update: retain positions, money, ownership and the RNG sequence.
    if (save.state?.config?.version === 2) {
      const gameplay = (value: typeof config) =>
        JSON.stringify({
          ...value,
          version: 0,
          board: value.board.map(({ name: _name, color: _color, ...tile }) => tile),
        });
      if (gameplay(save.state.config) === gameplay(config))
        save.state.config = structuredClone(config);
    }
    if (
      save.version !== 1 ||
      typeof save.seed !== 'string' ||
      JSON.stringify(save.state.config) !== JSON.stringify(config) ||
      validateState(save.state).length
    )
      return null;
    return save;
  } catch {
    return null;
  }
}
export function persistLocal(save: LocalSave): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export const money = (value: number, compact = false): string =>
  compact ? `${Math.round(value / 1000)} k` : `${new Intl.NumberFormat('fr-FR').format(value)} ¤`;
export const duration = (ms: number): string =>
  `${Math.floor(ms / 60000)
    .toString()
    .padStart(2, '0')}:${Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, '0')}`;
export const colors = ['#087BEE', '#EE2758', '#7E36DF', '#F3B600'];
export const pawnNames = ['Léa', 'Max', 'Lou', 'Noa'];
export const phaseText: Record<GameState['phase'], string> = {
  roll: 'À vous de lancer !',
  island: 'Une escale sur l’île',
  travel: 'Le monde vous attend',
  property: 'À vous de décider',
  championship: 'Accueillez le championnat',
  debt: 'Un paiement à régler',
  end: 'Une nouvelle escale ?',
  finished: 'La fortune a choisi',
};
export const victoryText: Record<string, string> = {
  line: 'Monopole de ligne',
  triple_monopoly: 'Triple monopole',
  resort_monopoly: 'Monopole balnéaire',
  bankruptcy: 'Dernier empire debout',
  timeout: 'Le plus beau patrimoine',
  abandoned: 'Partie terminée',
};
