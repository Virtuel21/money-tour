import {
  config,
  legacyConfig,
  legacyConfigV6,
  legacyConfigV7,
  sameRules,
  type GameConfig,
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
const key = 'money-tour.local.v8'; // Keep the original 32-cell save untouched.
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
    const raw =
      localStorage.getItem(key) ??
      localStorage.getItem('money-tour.local.v7') ??
      localStorage.getItem('money-tour.local.v6') ??
      localStorage.getItem('money-tour.local.v5') ??
      localStorage.getItem('money-tour.local.v4');
    if (!raw) return null;
    const save = JSON.parse(raw) as LocalSave;
    if (save?.version === 1 && save.state?.config?.version === 4) {
      const oldConfig: GameConfig = { ...legacyConfig, version: 4 } as GameConfig;
      delete oldConfig.championshipDuration;
      if (
        JSON.stringify(save.state.config) === JSON.stringify(oldConfig) &&
        validateState(save.state).length === 0
      ) {
        save.state.config = structuredClone(legacyConfig) as GameConfig;
        for (const property of Object.values(save.state.properties))
          if (property.championships) {
            property.championships = 1;
            property.championshipTurns = config.championshipDuration;
          }
      }
    }
    if (
      save.version !== 1 ||
      typeof save.seed !== 'string' ||
      !(
        sameRules(save.state.config, config) ||
        sameRules(save.state.config, legacyConfigV7 as GameConfig) ||
        sameRules(save.state.config, legacyConfigV6 as GameConfig) ||
        sameRules(save.state.config, legacyConfig as GameConfig)
      ) ||
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
  auction: 'Une ville aux enchères !',
  duel: 'Pierre, feuille, ciseaux !',
  alliance: 'Une alliance à conclure',
  casino: 'La chance vous sourit ?',
  attack: 'Choisissez votre cible',
  rent: 'Un loyer vous attend',
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
