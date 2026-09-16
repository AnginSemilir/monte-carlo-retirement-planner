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
 * Imports the engine from App.jsx, as simWorker.js does, with the same shim first for the same reason.
 */
import './workerShim.js';
import { buildContext, resolveMpaa, monteCarlo, postTaxInheritanceFor } from './App.jsx';

self.onmessage = (e) => {
  const { key, plan, trials, seed, resolve = true, inheritance = false } = e.data || {};
  try {
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
