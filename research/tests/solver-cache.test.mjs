/*
 * THE SOLVE'S KEY AND ITS RESTORE (Part C Phase 7b, research/solver/PHASE-7.md).
 *   1. the restore: the tables a solve keeps (src/solverCache.js cacheOf), through a structured clone as IndexedDB stores
 *      them, restored by solve.js `opts.restore`, give the solve back bit for bit: every table and the adaptive reference's
 *      arrays, every path runPolicy runs on it, and the engine's simulation of the solved plan; on S126 under the candidate
 *      (the tier state, the reference) and with consent to change risk withdrawn (no tier state); planted, one stored value
 *      changed shows in the tables and the paths;
 *   2. the key (src/solverKey.js): the same plan with its fields in another order gives the same key; one pound more of
 *      spending target, or in an account, another; the code's name another;
 *   3. why a balance edit re-solves: the tables solved with one account one percent larger differ (the objective weighs the
 *      estate against the opening wealth, solve.js `scale`).
 *   node research/tests/solver-cache.test.mjs
 */
// e3pcls guard: the solves below compare tables on this code (a solve against its restore); e3pcls's own exactness is solver-e3pcls.test.mjs's, which retakes the pin
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveForApp } from '../../src/solverApp.js';
import { cacheOf } from '../../src/solverCache.js';
import { solveKey } from '../../src/solverKey.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { CANDIDATE_OPTS } from '../solver/candidate.mjs';
import { checkE3pclsPin } from '../solver/e3pcls-pin.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
checkE3pclsPin({ ...CANDIDATE_OPTS });
const all = buildScenarios(), raw = id => all.find(s => s.id === id).plan;
const OPTS = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const NP = 200, SEED = 99002;

const pathsOf = r => E.pathsForSeed(SEED, NP, r.m.ctx.totalYears);
const runs = (r, P) => JSON.stringify(P.map(zs => runPolicy(r, zs)));
const sim = r => JSON.stringify(E.monteCarlo(E.buildContext(withTable(r.m.ctx.plan, r)), { trials: NP, seed: SEED }));

for (const [label, research] of [['the candidate', OPTS.research], ['consent withdrawn', { ...OPTS.research, riskConsent: false }]]) {
  const opts = { ...OPTS, research }, plan = raw('S126');
  const t0 = Date.now(), r = solveForApp(E, M, plan, opts), t1 = Date.now();
  const rec = structuredClone(cacheOf(r));
  const r2 = solveForApp(E, M, plan, { ...opts, restore: rec }), t2 = Date.now();
  const A = tablesOf(r), B = tablesOf(r2), [da, db] = [await digestOf(A), await digestOf(B)];
  const ts = r.meta.tierState ? `the tier state's ${rec.layers[0].length} layers a world` : (r.meta.tierStateOff ? 'no tier state' : 'plain tables');
  ok(da === db && r2.meta.restored === true && A.length === B.length, `1. S126, ${label} (${ts}${rec.ref ? ', the reference' : ''}): the restored ${B.length} arrays the solve's bit for bit (${da.slice(0, 16)}); solved in ${(t1 - t0) / 1000} s, restored in ${(t2 - t1) / 1000} s`);
  const P = pathsOf(r);
  ok(runs(r, P) === runs(r2, P), `1. S126, ${label}: every one of ${NP} paths runPolicy runs the same on the restore`);
  ok(sim(r) === sim(r2), `1. S126, ${label}: the engine's simulation of the solved plan the same on the restore`);
  if (label === 'the candidate') {
    const bad = structuredClone(rec), L = bad.layers[0][0], t = 1, i = L.pol[t].findIndex((v, j) => j > 0 && v !== L.pol[t][0]);
    L.pol[t][0] = L.pol[t][i];   // one cell of year 1 told to take another cell's move
    const r3 = solveForApp(E, M, plan, { ...opts, restore: bad });
    ok(await digestOf(tablesOf(r3)) !== da, '1. planted: one stored move changed shows in the restored tables');
  }
}

// 2. the key
{ const plan = raw('S126'), k0 = await solveKey(E, plan, OPTS, 'code-a');
  // every object's keys in reverse order, at every depth (arrays keep theirs: an account list's order is the plan's)
  const rev = v => (Array.isArray(v) ? v.map(rev) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).reverse().map(([k, x]) => [k, rev(x)])) : v);
  const shuffled = rev(plan);
  const reordered = Object.fromEntries(Object.entries(plan).reverse());
  const spend = { ...plan, spending: { ...plan.spending, targetSpend: E.num(plan.spending.targetSpend, 0) + 1 } };
  const held = plan.accounts.filter(a => E.num(a.balance, 0) > 0), isaAcc = held.find(a => /isa/i.test(a.category)) || held[0];
  const bal = { ...plan, accounts: plan.accounts.map(a => (a === isaAcc ? { ...a, balance: E.num(a.balance, 0) + 1 } : a)) };
  ok(await solveKey(E, reordered, OPTS, 'code-a') === k0 && await solveKey(E, shuffled, OPTS, 'code-a') === k0, `2. the same plan with its fields in another order: the same key (${k0.slice(0, 16)})`);
  ok(await solveKey(E, spend, OPTS, 'code-a') !== k0, '2. one pound more of spending target: another key');
  ok(await solveKey(E, bal, OPTS, 'code-a') !== k0, `2. one pound more in an account (${isaAcc.id}): another key`);
  ok(await solveKey(E, plan, OPTS, 'code-b') !== k0 && await solveKey(E, plan, { ...OPTS, lambda: 0.05 }, 'code-a') !== k0, '2. another code, or another lambda: another key');

  // 3. why a balance edit re-solves
  const big = { ...plan, accounts: plan.accounts.map(a => (a === isaAcc ? { ...a, balance: E.num(a.balance, 0) * 1.01 } : a)) };
  const a = tablesOf(solveForApp(E, M, plan, OPTS)), b = tablesOf(solveForApp(E, M, big, OPTS));
  let diff = 0, vals = 0; for (let i = 0; i < Math.min(a.length, b.length); i++) { vals += a[i].length; for (let j = 0; j < a[i].length; j++) if (!Object.is(a[i][j], b[i][j])) diff++; }
  ok(diff > 0 || a.length !== b.length, `3. ${isaAcc.id} one percent larger: ${diff} of ${vals} table values differ, so a balance edit re-solves`);
}
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
