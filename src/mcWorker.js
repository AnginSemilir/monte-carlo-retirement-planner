/*
 * ONE PLAN, SCORED OFF THE MAIN THREAD.
 *
 * The policy search and the tournament both score many plans on the same seed. Done on the main thread
 * in 250-path chunks with a yield between each, an 18-candidate sweep at 4,000 paths takes about 30
 * seconds in the browser against 7 seconds of actual arithmetic; the difference is the yields, the
 * progress re-renders and the fact that one thread does everything. A pool of these workers - one per
 * core, fed one plan at a time - does the arithmetic in parallel and leaves the page free to paint.
 *
 * Each job is self-contained: the plan, the path count, the seed, and whether the context still needs
 * its MPAA resolving (the policy search's candidates do, the tournament's players already are). The
 * seed is what keeps the comparison paired: every plan scored on the same seed sees the same market
 * paths whichever worker happens to run it, so common random numbers survive the split.
 *
 * FOUR KINDS OF QUESTION, NOT ONE.
 *
 * The Projection tab used to do all of its arithmetic on the main thread, and that was the worst thing
 * about the site on a phone: at 4x CPU throttle one run took 30.6 seconds and spent 28,398ms of that in
 * long tasks, so the page was unresponsive for most of half a minute. So this worker now answers the
 * projection's questions too, and `kind` says which:
 *
 *   score    (no kind)  the original pool job - one plan, one number, used by the search and tournament
 *   stats               a full Monte Carlo with progress frames, the fan bands and the sample paths
 *   rate                survival at one spend, which is one step of the safe-spend bisection
 *   safeAge             the retirement-age scan, which is twenty Monte Carlo runs of its own
 *
 * `stats` reports progress every few hundred paths rather than only at the end, because the bar on the
 * page is the only thing telling somebody a five-second run has not hung.
 *
 * A bisection asks twenty questions about the SAME plan and seed, so the resolved plan, the context and
 * the path draw are kept between messages and rebuilt only when one of them actually changes. Without
 * that, every step of the search would pay to rebuild a context and redraw thousands of gaussian paths.
 *
 * Imports the engine from App.jsx, as simWorker.js does, with the same shim first for the same reason.
 */
import './workerShim.js';
import {
  buildContext, resolveMpaa, monteCarlo, postTaxInheritanceFor,
  pathsForSeed, runTrial, summarizeTrials, safeRetirementAge
} from './App.jsx';

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
  const { key, kind = 'score' } = d;
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
    if (kind === 'rate') {
      const { plan, trials, seed, resolve = true, spend } = d;
      const m = prep(plan, resolve, seed, trials);
      let survived = 0;
      for (const zs of m.paths) if (runTrial(m.ctx, zs, spend).survived) survived++;
      self.postMessage({ key, rate: (survived / trials) * 100 });
      return;
    }
    if (kind === 'safeAge') {
      const { plan, targetRate, searchTrials, finalTrials } = d;
      // No seed passed on purpose: the solver's own default is what the main-thread call used, and the
      // answer has to be the same number whichever thread produced it.
      const result = safeRetirementAge(plan, {
        targetRate, searchTrials, finalTrials,
        onProgress: (pr) => self.postMessage({ key, progress: pr.value, label: pr.label })
      });
      self.postMessage({ key, result });
      return;
    }
    // The original pool job, unchanged.
    const { plan, trials, seed, resolve = true, inheritance = false } = d;
    const p = resolve ? resolveMpaa(plan) : plan;
    const ctx = buildContext(p);
    const stats = monteCarlo(ctx, { trials, seed });
    // the bequest priority ranks on this; null when nobody has been named as an heir
    if (inheritance) stats.postTaxInheritance = postTaxInheritanceFor(p, ctx);
    self.postMessage({ key, stats });
  } catch (err) {
    self.postMessage({ key, error: String((err && err.message) || err) });
  }
};
