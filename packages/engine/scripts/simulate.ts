import { chooseBotAction, createGame, createRng, reduceGame, validateState } from '../src/index.js';

const count = Number(process.argv[2] ?? 1);
if (!Number.isSafeInteger(count) || count < 1)
  throw new Error('Provide a positive integer game count.');
const reasons: Record<string, number> = {};
let actions = 0;
for (let seed = 1; seed <= count; seed += 1) {
  const rng = createRng(seed);
  let state = createGame(
    {
      players: Array.from({ length: 4 }, (_, index) => ({
        id: `bot-${index}`,
        name: `Bot ${index + 1}`,
        bot: true,
      })),
      mode: seed % 2 ? 'free-for-all' : 'teams',
      seed,
    },
    rng,
  );
  for (let index = 0; !state.winner && index < state.config.simulationActionLimit; index += 1) {
    const result = reduceGame(state, chooseBotAction(state), rng);
    if (result.error) throw new Error(`Seed ${seed}: ${result.error}`);
    state = result.state;
    if (!state.winner) state = reduceGame(state, { type: 'tick', elapsedMs: 2500 }, rng).state;
    const violations = validateState(state);
    if (violations.length) throw new Error(`Seed ${seed}: ${violations.join(' ')}`);
    actions += 1;
  }
  if (!state.winner) throw new Error(`Seed ${seed}: action limit exceeded.`);
  for (const reason of state.winner.reasons) reasons[reason] = (reasons[reason] ?? 0) + 1;
  if (count === 1)
    console.log(
      JSON.stringify(
        { seed, turns: state.turn, elapsedMs: state.elapsedMs, winner: state.winner },
        null,
        2,
      ),
    );
}
console.log(JSON.stringify({ games: count, actions, reasons, invariantFailures: 0 }, null, 2));
