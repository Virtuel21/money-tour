import type { GameConfig, Rng } from './types.js';

/** Shuffle complete streets, preserving corners, islands and the tax near Start. */
export function shuffleStreets(config: GameConfig, rng: Rng): void {
  const groups = [...new Set(config.board.filter((t) => t.type === 'city').map((t) => t.group!))];
  const streets = groups.map((group) => config.board.filter((t) => t.group === group));
  for (let i = streets.length - 1; i > 0; i--) {
    const value = rng();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Invalid RNG output');
    const j = Math.floor(value * (i + 1));
    [streets[i], streets[j]] = [streets[j]!, streets[i]!];
  }
  let street = 0;
  for (let i = 0; i < config.board.length; i++) {
    if (config.board[i]!.type !== 'city') continue;
    const line = config.board[i]!.line;
    for (const tile of streets[street++]!) config.board[i] = { ...tile, id: i++, line };
    i--;
  }
}

/** Only the allowed street permutation may vary; economic data must match exactly. */
export function sameRules(candidate: GameConfig, reference: GameConfig): boolean {
  if (!candidate || !Array.isArray(candidate.board)) return false;
  const { board: a, ...rulesA } = candidate,
    { board: b, ...rulesB } = reference;
  if (JSON.stringify(rulesA) !== JSON.stringify(rulesB) || a.length !== b.length) return false;
  if (!reference.shuffleStreets) return JSON.stringify(a) === JSON.stringify(b);
  const cityData = (config: GameConfig) =>
    config.board
      .filter((t) => t.type === 'city')
      .map((t) => ({ ...t, id: 0, line: 0 }))
      .sort((x, y) => x.name.localeCompare(y.name));
  if (JSON.stringify(cityData(candidate)) !== JSON.stringify(cityData(reference))) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.id !== i || a[i]!.type !== b[i]!.type || a[i]!.line !== b[i]!.line) return false;
    if (b[i]!.type !== 'city' && JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false;
    if (b[i]!.type === 'city' && b[i - 1]?.type !== 'city' && a[i]!.group !== a[i + 1]?.group)
      return false;
  }
  return true;
}
