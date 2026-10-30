/*
 * THE SOLVER'S LOCKS (Part C Phase 7c, research/solver/PHASE-7.md): what the solver may not change, `plan.solver.locks`,
 * normalised in normalizePlan and applied as the solver prepares the plan (src/solverSettings.js lockedPlan), so the engine
 * that runs the solved plan holds to them too. Each shrinks what the solver may do, never adds to it:
 *   pensionBefore   no pension drawn before that age (the plan's pension access age raised to it, never lowered);
 *   tierCeiling     per wrapper (pen, isa), no tier riskier than it (the account's tier lowered to it, and no tier above);
 *   lumpSum         'never' no full tax-free lump sum, 'now' the full lump at first access, 'free' the plan's own choice.
 * Checks, on library households at light settings, the engine running each solved plan on 200 paths:
 *   1. normalizePlan: a plan without locks normalises with no `solver` key, as before, on all 420 library households; one with
 *      locks keeps them, clamped and defaulted; locks all free leave every table as without them;
 *   2. each lock holds on every path and every year; and the same check on the solve without the lock finds it broken (the
 *      plant: the lock not applied), so the check can see a breach;
 *   3. the key (src/solverKey.js) differs with each lock.
 *   node research/tests/solver-locks.test.mjs
 */
// e3pcls guard: the solves below go through solveForApp on this code (the app's path); e3pcls's own exactness is solver-e3pcls.test.mjs's, which retakes the pin
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveForApp } from '../../src/solverApp.js';
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
const NP = 200, SEED = 99003, RISK = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
const withLocks = (plan, locks) => ({ ...plan, solver: { locks } });

/* every year of every path the engine runs on the solved plan: age, pension drawn, tiers held, the lump taken */
function rowsOf(r) {
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, out = [];
  for (const zs of E.pathsForSeed(SEED, NP, T)) {
    const st = E.freshState(ctx), zPath = zs.length > T + 1 ? zs[T + 1] : 0, path = [];
    for (let t = 0; t <= T; t++) { const row = E.stepYear(ctx, st, t, { z: zs[t], zPath }); path.push({ age: row.ageSelf, pen: row.drawdownPensions || 0, tp: row.tierPenName, ti: row.tierIsaName, lump: !!st.lumpSumTaken.self, open: row.ageSelf >= ctx.nmpa && !row.workingSelf }); }
    out.push(path);
  }
  return { ctx, out };
}

// 1. normalizePlan
{ const bad = all.filter(s => 'solver' in E.normalizePlan(s.plan));
  ok(bad.length === 0, `1. ${all.length} library plans without locks normalise with no solver key${bad.length ? `: ${bad.slice(0, 3).map(s => s.id)}` : ''}`);
  const p = E.normalizePlan(withLocks(raw('S126'), { pensionBefore: '61.4', tierCeiling: { pen: 'Medium Risk', isa: 'Nonsense' }, lumpSum: 'whenever' }));
  ok(JSON.stringify(p.solver) === JSON.stringify({ locks: { pensionBefore: 61, tierCeiling: { pen: 'Medium Risk', isa: null }, lumpSum: 'free' } }), `1. locks normalised: ${JSON.stringify(p.solver)}`);
  const a = await digestOf(tablesOf(solveForApp(E, M, raw('S126'), OPTS))), b = await digestOf(tablesOf(solveForApp(E, M, withLocks(raw('S126'), { pensionBefore: null, tierCeiling: { pen: null, isa: null }, lumpSum: 'free' }), OPTS)));
  ok(a === b, `1. locks all free leave every table as without them (${a.slice(0, 16)})`); }

// 2. each lock, and the check run on the solve without it
const CASES = [
  ['pensionBefore', 'S126', p => ({ pensionBefore: Math.round(E.num(E.normalizePlan(p).demographics.privatePensionAge, 58)) + 4 }),
    (path, L) => path.every(y => !(y.age < L.pensionBefore && y.pen > 0.5)), 'no pension drawn before the age'],
  ['tierCeiling', 'S126', () => ({ tierCeiling: { pen: 'Medium/Low Risk', isa: 'Medium Risk' } }),
    (path, L) => path.every(y => RISK.indexOf(y.tp) >= RISK.indexOf(L.tierCeiling.pen) && RISK.indexOf(y.ti) >= RISK.indexOf(L.tierCeiling.isa)), 'no tier riskier than the ceiling'],
  // no library household takes the full lump, so 'never' runs on S126 set to take it; 'now' on S126 as it is (phased)
  ['lumpSum never', 'S126', () => ({ lumpSum: 'never' }), path => path.every(y => !y.lump), 'no full lump sum taken', p => ({ ...p, spending: { ...p.spending, drawdownStrategy: 'Full 25% Lump Sum' } })],
  ['lumpSum now', 'S126', () => ({ lumpSum: 'now' }), path => { const i = path.findIndex(y => y.open); return i < 0 || (path.slice(i).every(y => y.lump) && path.slice(0, i).every(y => !y.lump)); }, 'the full lump taken in the first year the pension is open and not before']
];
for (const [name, id, lockOf, holds, what, variant] of CASES) {
  const plan = variant ? variant(raw(id)) : raw(id), L = { pensionBefore: null, tierCeiling: { pen: null, isa: null }, lumpSum: 'free', ...lockOf(plan) };
  const locked = rowsOf(solveForApp(E, M, withLocks(plan, L), OPTS)), free = rowsOf(solveForApp(E, M, plan, OPTS));
  const held = locked.out.filter(p => holds(p, L)).length, broken = free.out.filter(p => !holds(p, L)).length;
  ok(held === NP, `2. ${id} ${name} ${JSON.stringify(lockOf(plan))}: ${what} on ${held} of ${NP} paths`);
  ok(broken > 0, `2. planted, the lock not applied: the check finds it broken on ${broken} of ${NP} paths`);
}

// 3. the key
{ const p = raw('S126'), k0 = await solveKey(E, p, OPTS);
  const ks = await Promise.all([{ pensionBefore: 63 }, { tierCeiling: { pen: 'Medium Risk', isa: null } }, { lumpSum: 'now' }].map(l => solveKey(E, withLocks(p, { pensionBefore: null, tierCeiling: { pen: null, isa: null }, lumpSum: 'free', ...l }), OPTS)));
  ok(ks.every(k => k !== k0) && new Set(ks).size === 3, '3. each lock gives the solve another key'); }
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
