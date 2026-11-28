/*
 * THE PLAN UNDER THE APP'S OWN RULES, OFF THE MAIN THREAD: the new planner's failure view (src/App.jsx runStageTest through
 * runMonteCarloAsync), a full Monte Carlo of the plan as entered with its fan bands and sample paths, its progress posted every
 * few hundred paths. The classic planner's other jobs (the pool's scoring for the policy search and the tournament, the
 * safe-spend bisection, the retirement-age scan and the age-against-spend grid) retired with it (D155).
 *
 * The resolved plan, its context and its path draw are kept between messages and rebuilt only when one of them changes.
 *
 * Imports the engine from App.jsx with the shim first (src/workerShim.js says why).
 */
import './workerShim.js';
import { buildContext, resolveMpaa, postTaxInheritanceFor, pathsForSeed, runTrial, summarizeTrials } from './App.jsx';

let memo = null;
/*
 * The resolved plan, its context and its path draw, reused while the question is about the same three
 * things. The signature includes the trial count because the paths are drawn to a length: a 500-path
 * search and a 5,000-path confirmation are different draws, even though the first is a prefix of the
 * second under the same seed.
 */
const prep = (plan, resolve, seed, trials) => {
  const sig = JSON.stringify([plan, !!resolve, seed, trials]);
  if (memo && memo.sig === sig) return memo;
  const p = resolve ? resolveMpaa(plan) : plan;
  const ctx = buildContext(p);
  memo = { sig, p, ctx, paths: pathsForSeed(seed, trials, ctx.totalYears) };
  return memo;
};

self.onmessage = (e) => {
  const d = e.data || {};
  const { key, kind = 'stats' } = d;
  try {
    if (kind === 'stats') {
      const { plan, trials, seed, resolve = true, spendOverride = null,
        collectPaths = false, inheritance = false, progressEvery = 250 } = d;
      const m = prep(plan, resolve, seed, trials);
      const results = [];
      for (let i = 0; i < trials; i++) {
        results.push(runTrial(m.ctx, m.paths[i], spendOverride, collectPaths));
        if (progressEvery && (i + 1) % progressEvery === 0 && i + 1 < trials) {
          self.postMessage({ key, progress: (i + 1) / trials });
        }
      }
      const stats = { ...summarizeTrials(results), spend: spendOverride !== null ? spendOverride : m.ctx.targetSpend };
      if (inheritance) stats.postTaxInheritance = postTaxInheritanceFor(m.p, m.ctx);
      self.postMessage({ key, stats });
      return;
    }
    throw new Error(`mcWorker: no job '${kind}' (only 'stats', since D155)`);
  } catch (err) {
    self.postMessage({ key, error: String((err && err.message) || err) });
  }
};
