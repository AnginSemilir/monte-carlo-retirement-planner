/*
 * ARE THE BEST POLICY AND THE BEST PORTFOLIO INDEPENDENT?
 *
 * The app searches them separately: the tournament finds the best way to save with the household's
 * chosen drawdown policy held fixed, and the policy search finds the best way to draw with the saved
 * portfolio held fixed. That is coordinate descent, and it is only right if the two answers do not
 * depend on each other. This measures whether they do.
 *
 * For each still-accumulating household in the library: resolve every tournament player to the plan
 * it produces, then score all 18 policy combinations against EVERY player's plan on the same seed.
 * Three things fall out:
 *
 *   1. how often the best policy differs between players (does where the money sits change how it
 *      should be drawn)
 *   2. how often the best player differs between policies (does how it is drawn change how it should
 *      be saved)
 *   3. what the separate searches lose: the survival of "best policy at the current portfolio, then
 *      best player under that policy" against the best cell of the whole grid
 *
 * Usage: node coupling.mjs [households] [trials]
 */
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';

const N = Number(process.argv[2] || 40), TRIALS = Number(process.argv[3] || 300), SEED = 4242;
const all = buildScenarios().filter(s => s.plan.demographics.currentAgeSelf <= s.plan.demographics.retireAgeSelf - 5);
// spread across the library rather than the first N, which would all share a stage
const pick = [];
for (let i = 0; i < N; i++) pick.push(all[Math.floor(i * all.length / N)]);
console.log(`${all.length} accumulating households in the library, testing ${pick.length} at ${TRIALS} paths\n`);

const score = (planState) => {
  const cands = E.buildPolicyCandidates(planState);
  return cands.map(c => {
    const stats = E.monteCarlo(E.buildContext(E.resolveMpaa(c.planState)), { trials: TRIALS, seed: SEED });
    return { id: c.id, rate: stats.successRate, p10: stats.p10TerminalNet };
  });
};
// best by survival, ties (within the engine's own tolerance) to the larger unlucky pot
const best = (rows) => rows.slice().sort((a, b) => (Math.abs(b.rate - a.rate) > E.RATE_EPSILON_PTS ? b.rate - a.rate : b.p10 - a.p10))[0];

let policyDiffers = 0, playerDiffers = 0, tested = 0;
const losses = [];
const t0 = Date.now();
for (const sc of pick) {
  let t;
  try { t = E.buildTournament(sc.plan); } catch (e) { continue; }
  const players = t.strategies.filter(s => !s.isEntrant).map(s => s.candidates ? E.resolveSearchPlayer(s, { trials: TRIALS, seed: SEED }) : s).filter(s => s.planState);
  if (players.length < 2) continue;
  // the grid: player x policy
  const grid = players.map(p => ({ player: p.id, rows: score(p.planState) }));
  const bestPolicyPer = grid.map(g => best(g.rows).id);
  const policySet = new Set(bestPolicyPer);
  // best player under each policy
  const policyIds = grid[0].rows.map(r => r.id);
  const bestPlayerPer = policyIds.map(pid => {
    const cells = grid.map(g => ({ player: g.player, ...g.rows.find(r => r.id === pid) }));
    return best(cells).player;
  });
  const playerSet = new Set(bestPlayerPer);
  // the separate searches: policy at the baseline portfolio, then the player under that policy
  const baseline = grid.find(g => g.player === 'baseline') || grid[0];
  const stagedPolicy = best(baseline.rows).id;
  const stagedCells = grid.map(g => ({ player: g.player, ...g.rows.find(r => r.id === stagedPolicy) }));
  const staged = best(stagedCells);
  // the joint best over the whole grid
  const joint = best(grid.flatMap(g => g.rows.map(r => ({ player: g.player, ...r }))));
  const loss = joint.rate - staged.rate;
  losses.push(loss);
  tested++;
  if (policySet.size > 1) policyDiffers++;
  if (playerSet.size > 1) playerDiffers++;
  const flag = loss > E.RATE_EPSILON_PTS ? '  <-- separate searches lose' : '';
  console.log(`${sc.id.padEnd(6)} ${sc.name.slice(0, 44).padEnd(45)} best policy per player: ${policySet.size} distinct | best player per policy: ${playerSet.size} distinct | joint ${joint.rate.toFixed(1)}% vs staged ${staged.rate.toFixed(1)}% (${loss >= 0 ? '+' : ''}${loss.toFixed(1)})${flag}`);
}
losses.sort((a, b) => a - b);
const q = (p) => losses[Math.min(losses.length - 1, Math.floor(losses.length * p))];
console.log(`\n${tested} households in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(`best POLICY changes with the portfolio in ${policyDiffers} of ${tested} (${(100 * policyDiffers / tested).toFixed(0)}%)`);
console.log(`best PORTFOLIO changes with the policy in ${playerDiffers} of ${tested} (${(100 * playerDiffers / tested).toFixed(0)}%)`);
console.log(`separate searches lose against the joint best: median ${q(0.5).toFixed(1)} pts, 75th ${q(0.75).toFixed(1)}, 90th ${q(0.9).toFixed(1)}, max ${losses[losses.length - 1].toFixed(1)}; beyond the engine's ${E.RATE_EPSILON_PTS}-pt tolerance in ${losses.filter(l => l > E.RATE_EPSILON_PTS).length} of ${tested}`);
