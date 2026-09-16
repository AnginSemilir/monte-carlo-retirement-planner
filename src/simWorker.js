/*
 * THE ENGINE, OFF THE MAIN THREAD.
 *
 * Every answer on the simple page is eighteen Monte Carlo runs plus two solvers - about six seconds of
 * straight-line arithmetic. Run on the main thread that is six seconds during which the browser cannot
 * paint or accept a keystroke, which is exactly what "it catches at 100, then 1000, then 10000" is: the
 * debounce fires between digits and the tab freezes until it finishes. No debounce length fixes that,
 * because the problem is not how often the work starts, it is that the work owns the thread.
 *
 * So it runs here instead. Typing stays smooth however long a job takes, a superseded job can be
 * abandoned mid-flight, and - because the thread is otherwise idle - the neighbouring answers a stepper
 * is about to ask for can be computed before they are asked for.
 *
 * It imports the engine from App.jsx, which is where the engine still lives. That pulls React into the
 * worker bundle, which is waste rather than breakage; the fix is the same extraction to src/engine.js
 * that splitting the two apps will need. Noted at the export site in App.jsx.
 */
import './workerShim.js';   // must be first: gives dev's injected HMR client a window to find
import {
  buildContext, resolveMpaa, monteCarlo, optimizeSpend, safeRetirementAge,
  buildPolicyCandidates, explainPick, simulateDeterministic, averageStats
} from './App.jsx';
import { toFullPlan } from './simplePlan.js';

const PRIORITIES = ['survive', 'downside', 'bequest', 'bridge', 'pot', 'tax'];

/*
 * One job, reported in three parts. The parts are posted as they land rather than at the end, so the
 * chart and the survival rate appear while the two solvers are still running - the same progressive
 * arrival the page had before, now without blocking anything.
 *
 * `seq` is the caller's cancellation token: the page ignores anything that is not its latest request,
 * and the worker checks it between stages so a superseded job stops rather than finishing into a void.
 */
function run({ seq, simple, trials, target, quiet }) {
  const post = (msg) => self.postMessage({ seq, quiet, ...msg });
  const full = toFullPlan(simple);
  const cands = buildPolicyCandidates(full).map((c) => ({ ...c, ctx: buildContext(resolveMpaa(c.planState)) }));
  /*
   * Two seeds at half the paths each, ranked on the mean - the same total, so the same precision as one
   * run, plus a second opinion: ranked on either run alone, do the two seeds choose the same way of
   * drawing? Where they do not it is a close call the simulation cannot settle at this budget, and the
   * page says so rather than presenting one of two equal answers as the answer. The full app does the
   * same, at a larger budget; the tolerance in explainPick is what keeps this from being a coin toss on
   * every plan.
   */
  const seeds = [12345, 12346];
  const per = Math.max(1, Math.round(trials / seeds.length));
  const runs = seeds.map(seed => cands.map(c => monteCarlo(c.ctx, { trials: per, seed })));
  const scored = cands.map((c, i) => ({ ...c, stats: averageStats(runs.map(r => r[i])) }));
  const won = explainPick(scored, { priorities: PRIORITIES }).winner;
  const perSeed = runs.map(r => explainPick(cands.map((c, i) => ({ ...c, stats: r[i] })), { priorities: PRIORITIES }).winner);
  const closeCall = new Set(perSeed.map(w => w.id)).size > 1
    ? perSeed.map(w => ({ decumulationPolicy: w.decumulationPolicy, drawdownStrategy: w.drawdownStrategy, harvestPersonalAllowance: w.harvestPersonalAllowance }))
    : null;
  const wonPlan = resolveMpaa(won.planState);
  const wonCtx = won.ctx;
  const rates = scored.map(c => c.stats.successRate);
  const bestRate = Math.max(...rates);
  // how many are within a point of the best, which is the engine's own survival tolerance
  const tied = rates.filter(r => bestRate - r <= 1).length;
  // the chart's band and sample paths come from one full-budget run of the winner: a percentile curve
  // averaged across two half-runs would be a curve of nothing, and half a run's paths are too few
  const drawn = monteCarlo(wonCtx, { trials, seed: seeds[0], collectPaths: true });

  post({ stage: 'mc', mc: { ...won.stats, bands: drawn.bands, samplePaths: drawn.samplePaths }, plan: wonPlan,
    policy: { decumulationPolicy: won.decumulationPolicy, drawdownStrategy: won.drawdownStrategy,
      candidates: cands.length, tied, bestRate, worstRate: Math.min(...rates), closeCall },
    timeline: simulateDeterministic(wonCtx, 'expected') });

  post({ stage: 'safeSpend', safeSpend: optimizeSpend(wonCtx, { targetRate: target, searchTrials: 300, finalTrials: 1200 }) });
  post({ stage: 'safeAge', safeAge: safeRetirementAge(wonPlan, { targetRate: target, searchTrials: 300, finalTrials: 1200 }) });
  post({ stage: 'done' });
}

self.onmessage = (e) => {
  const job = e.data;
  try { run(job); }
  catch (err) { self.postMessage({ seq: job.seq, quiet: job.quiet, stage: 'error', error: String(err && err.message ? err.message : err) }); }
};
