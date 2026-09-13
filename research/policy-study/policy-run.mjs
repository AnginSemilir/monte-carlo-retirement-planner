/*
 * Run the app's own policy tournament over the whole scenario library and record who won, by how much.
 *
 * The ranking is deliberately the app's, not a cleaner one invented for the study: `pickBest` as the
 * Projection tab calls it. A policy that never wins THIS ranking is a policy the app will never
 * recommend, which is the question being asked.
 *
 * Every candidate for a given scenario runs on the same seed, so they see the same market paths. That
 * makes the comparison paired: the difference between two policies is far less noisy than either rate
 * on its own, which is what lets a 1,500-path run resolve gaps a 1,500-path absolute estimate could not.
 *
 * Usage: node policy-run.mjs <sliceIndex> <sliceCount> [trials]
 */
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';
import { installChallengers } from './challengers.mjs';
import { installChallengers2 } from './challengers2.mjs';
installChallengers(E);
installChallengers2(E);
import fs from 'fs';

const DIR = process.env.POLICY_RESULTS || new URL('./results/', import.meta.url).pathname;
fs.mkdirSync(DIR, { recursive: true });

const slice = Number(process.argv[2] ?? 0);
const slices = Number(process.argv[3] ?? 1);
const TRIALS = Number(process.argv[4] ?? 3000);
const SEED = 12345;

const scenarios = buildScenarios().filter((_, i) => i % slices === slice);
const out = [];
const t0 = Date.now();

scenarios.forEach((sc, n) => {
  const cands = E.buildPolicyCandidates(sc.plan).map(c => {
    // MPAA is resolved per candidate: the policies differ in when taxable pension income starts,
    // and that is exactly what triggers the money-purchase annual allowance
    const ctx = E.buildContext(E.resolveMpaa(c.planState));
    const stats = E.monteCarlo(ctx, { trials: TRIALS, seed: SEED });
    /*
     * pickBest reads `stats.p10TerminalNet ?? stats.p10Terminal` by those exact names. Handing it a
     * renamed copy makes both undefined, the comparator returns NaN, and every tie silently resolves to
     * whichever candidate was generated first - which looked like pickBest preferring a WORSE p10.
     * So the stats object keeps the engine's own key names.
     */
    return {
      id: c.id, policy: c.decumulationPolicy, drawdown: c.drawdownStrategy, harvest: c.harvestPersonalAllowance,
      successRate: stats.successRate, preNmpaFailRate: stats.preNmpaFailRate,
      p10: stats.p10TerminalNet ?? stats.p10Terminal, median: stats.medianTerminalNet ?? stats.medianTerminal,
      stats: {
        successRate: stats.successRate, preNmpaFailRate: stats.preNmpaFailRate,
        p10Terminal: stats.p10Terminal, p10TerminalNet: stats.p10TerminalNet,
        medianTerminal: stats.medianTerminal, medianTerminalNet: stats.medianTerminalNet
      }
    };
  });
  const best = E.pickBest(cands);
  const rates = cands.map(c => c.successRate);
  const byPolicy = {};
  cands.forEach(c => { byPolicy[c.policy] = Math.max(byPolicy[c.policy] ?? -1, c.successRate); });
  // the runner-up is the best candidate whose POLICY differs from the winner's: the margin that matters
  // is between policies, not between two harvest variants of the same one
  const rival = cands.filter(c => c.policy !== best.policy).sort((a, b) => (b.successRate - a.successRate) || (b.p10 - a.p10))[0];
  cands.forEach(c => { delete c.stats; });
  out.push({
    id: sc.id, name: sc.name, tags: sc.tags, targetSpend: sc.targetSpend, potAtRetire: sc.potAtRetire,
    winner: { policy: best.policy, drawdown: best.drawdown, harvest: best.harvest, successRate: best.successRate, p10: best.p10 },
    rival: rival ? { policy: rival.policy, successRate: rival.successRate, p10: rival.p10 } : null,
    spreadPts: Math.max(...rates) - Math.min(...rates),
    marginPts: rival ? best.successRate - rival.successRate : null,
    marginP10: rival ? best.p10 - rival.p10 : null,
    policyBestRate: byPolicy,
    cands
  });
  if (n % 10 === 0) {
    process.stderr.write(`slice ${slice}: ${n}/${scenarios.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
    // checkpoint, so a long run can be read while it is still going and a crash costs ten scenarios
    fs.writeFileSync(`${DIR}/policy-run3-${slice}.partial.json`, JSON.stringify(out));
  }
});

fs.writeFileSync(`${DIR}/policy-run3-${slice}.json`, JSON.stringify(out));
process.stderr.write(`slice ${slice}: done ${out.length} scenarios in ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
