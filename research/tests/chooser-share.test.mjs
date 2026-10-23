/*
 * S2, THE CHOOSER'S SHARED YEAR, CHANGES NO NUMBER (the speed review of 23 Oct, S2 and its instruction 4; STATE.md D24).
 * chooseAction's mixture scores every move from flows computed once a decision and expectations shared within a world
 * (solve.js scoreMovesShared). Each solve's table is run by the engine:
 *   1. with CHOOSER.check on, every move's score, tax and estate at every decision of 20 paths is recomputed by scoreMoves,
 *      the reference, and a difference of one bit throws;
 *   2. the engine's outcomes on 200 paths (survived, fail age, end pots, minimum pot, lifetime tax, unmet, spend, cuts and
 *      raises) are the same with the sharing off and on;
 * on S224, S362 (its reader years) and S370 (a bridge, an emptied taxable account refilled), under SHIP (6 points) and the
 * light candidate (4 points, a small lattice: its tiers and their switch charge); seed 99001. Planted (CHOOSER.plant): a
 * tier variant's switch charge skipped (S224, the candidate) and the growth class left out of the key (S224, SHIP: with the
 * tier state the layer read already parts a move's tier variants); each throws under the check.
 * The quick form, in the fast suite: S224 under both arms and S370 under the candidate, and both plants. --full: all three
 * households under both arms (chooser-share-full.test.mjs, the nightly full suite).
 *   node research/tests/chooser-share.test.mjs [--full]
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, CHOOSER, SHARE_CHECKED } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, candidatePlan } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const FULL = process.argv.includes('--full');
const LAMBDA = 0.0223606797749979, SEED = 99001, NCHECK = 20, NRUN = 200;
const all = buildScenarios();
const planOf = id => { const h = all.find(s => s.id === id).plan; return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } })); };
const ARMS = {
  SHIP: plan => solvePlan(E, M, candidatePlan(E, plan), { lambda: LAMBDA, points: 6, bequestWeight: 0.02 }),
  CAND: plan => solveCandidate(E, M, plan, { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } })
};
const thrown = f => { try { f(); return null; } catch (e) { return e.message; } };
// the engine over the paths; each outcome hashed (the speed review's runHash)
const runAll = (ctx, paths) => {
  const h = createHash('sha256'); let alive = 0;
  for (const zs of paths) { const x = E.runTrial(ctx, Float64Array.from(zs)); if (x.survived) alive++; h.update([x.survived, x.failAge, x.terminalPot, x.terminalPotNet, x.minPot, x.lifetimeTax, x.unmetTotal, x.realisedSpend, x.cutYears, x.raiseYears].join(':') + ';'); }
  return { hash: h.digest('hex').slice(0, 16), alive };
};
const set = (share, check, plant = '') => { CHOOSER.share = share; CHOOSER.check = check; CHOOSER.plant = plant; };
const zero = () => Object.assign(SHARE_CHECKED, { n: 0, hits: 0, miss: 0, fails: 0, decisions: 0 });

const CASES = FULL ? ['S224', 'S362', 'S370'].flatMap(id => ['SHIP', 'CAND'].map(arm => [id, arm])) : [['S224', 'SHIP'], ['S224', 'CAND'], ['S370', 'CAND']];
const solved = {};
for (const [id, arm] of CASES) {
  const r = ARMS[arm](planOf(id)), T = r.m.ctx.totalYears;
  solved[`${id} ${arm}`] = r;
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r));
  // 1. every score against scoreMoves at every decision of NCHECK paths
  set(true, true); zero();
  const e1 = thrown(() => runAll(ctx, E.pathsForSeed(SEED, NCHECK, T)));
  const checked = SHARE_CHECKED.n, shared = SHARE_CHECKED.hits, computed = SHARE_CHECKED.miss;
  ok(!e1 && checked > 0 && shared > 0, `${id} ${arm}: every move's score, tax and estate at every decision of ${NCHECK} paths the same bit for bit as scoreMoves's (${e1 || `${checked} scores checked; expectations shared ${shared}, computed ${computed}`})`);
  // 2. the engine's outcomes with the sharing off and on
  const paths = E.pathsForSeed(SEED, NRUN, T);
  set(false, false); const t0 = Date.now(), off = runAll(ctx, paths), t1 = Date.now();
  set(true, false); const on = runAll(ctx, paths), t2 = Date.now();
  ok(off.hash === on.hash, `${id} ${arm}: the engine's outcomes on ${NRUN} paths with the sharing off and on, ${off.hash} / ${on.hash} (survives ${on.alive}); ${((t1 - t0) / NRUN).toFixed(1)} ms a path off, ${((t2 - t1) / NRUN).toFixed(1)} on`);
}
// the plants, under the check: the charge skipped on S224's candidate (its tier variants pay it), the class left out on
// S224's SHIP (no tier state, so a move's tier variants share a position and a layer, and only the class tells them apart)
for (const [plant, arm, what] of [['nocharge', 'CAND', "a tier variant's switch charge skipped"], ['nocls', 'SHIP', 'the growth class left out of the key']]) {
  const r = solved[`S224 ${arm}`], T = r.m.ctx.totalYears, ctx = E.buildContext(withTable(r.m.ctx.plan, r));
  set(true, true, plant);
  const e = thrown(() => runAll(ctx, E.pathsForSeed(SEED, NCHECK, T)));
  ok(/share check: year \d+/.test(e || ''), `planted, S224 ${arm}: ${what}: the check throws (${e ? e.slice(0, 60) : 'no throw'})`);
}
set(true, false);

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
