/*
 * WHAT THE SOLVER AIMS FOR (Part C Phase 8, research/solver/PHASE-8.md): `plan.solver.aims`, normalised in normalizePlan (App.jsx
 * normalizeSolverAims) and mapped to the solve's options by src/solverSettings.js aimsOptions, which solveForApp and solveKey
 * read from the plan. The defaults are the candidate's, so a plan without aims solves as today.
 * Checks, on S126 at light settings (the engine running each solved plan on 200 paths where a check reads paths):
 *   1. the defaults: aimsOptions of a plan without aims, and of one with every aim at its default, is { lambda: APP_LAMBDA }
 *      and both solve to the same tables as the plan without aims; the 420 library households normalise with no solver key;
 *      App.jsx's dial positions are APP_DIAL's (every value from 0 to 12 by halves kept only where the dial has it);
 *   2. each lever is the option it names, to the bit: the plan with the aim solves to the tables of the plan without it and
 *      that option given explicitly, and to other tables than the default's; raises blocked, no year above target on 200
 *      paths where the default has some; consent withdrawn, the plan's own tiers every year where the default moves them.
 *      Planted, the aim lost on its way (set off its positions, so it reads as the default): the check fails;
 *   3. normalisation: values off the positions read as the defaults; locks without aims are kept as before (no aims key);
 *   4. the key: each lever another key; the same plan, its fields in another order, the same key.
 *   node research/tests/solver-aims.test.mjs
 */
// e3pcls guard: the solves below go through solveForApp on this code (the app's path); e3pcls's own exactness is solver-e3pcls.test.mjs's, which retakes the pin
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveForApp, aimsOptions, APP_LAMBDA, APP_DIAL } from '../../src/solverApp.js';
import { solveKey } from '../../src/solverKey.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { CANDIDATE_OPTS } from '../solver/candidate.mjs';
import { checkE3pclsPin } from '../solver/e3pcls-pin.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
checkE3pclsPin({ ...CANDIDATE_OPTS });
const all = buildScenarios(), raw = id => all.find(s => s.id === id).plan;
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const OPTS = { points: 4, research: LIGHT };
const NP = 200, SEED = 99003, ID = 'S126';
const DEFAULTS = { cuts: 1, estate: 'standard', raises: 'capped', riskConsent: true };
const withAims = (plan, aims) => ({ ...plan, solver: { aims: { ...DEFAULTS, ...aims } } });
const solve = (plan, extra = {}) => solveForApp(E, M, plan, { ...OPTS, ...extra, research: { ...LIGHT, ...(extra.research || {}) } });
const digest = async r => digestOf(tablesOf(r));

/* every year of every path the engine runs on the solved plan: the spend level and the tiers held */
function rowsOf(r) {
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, out = [];
  for (const zs of E.pathsForSeed(SEED, NP, T)) {
    const st = E.freshState(ctx), zPath = zs.length > T + 1 ? zs[T + 1] : 0, path = [];
    for (let t = 0; t <= T; t++) { const row = E.stepYear(ctx, st, t, { z: zs[t], zPath }); path.push({ level: row.spendLevel, tp: row.tierPenName, ti: row.tierIsaName }); }
    out.push(path);
  }
  return out;
}

const plan = raw(ID);
// 1. the defaults
const base = solve(plan), d0 = await digest(base);
{ ok(JSON.stringify(aimsOptions(E.normalizePlan(plan))) === JSON.stringify({ lambda: APP_LAMBDA }) && JSON.stringify(aimsOptions(E.normalizePlan(withAims(plan, {})))) === JSON.stringify({ lambda: APP_LAMBDA }),
    `1. a plan without aims, and one with every aim at its default: ${JSON.stringify(aimsOptions(E.normalizePlan(withAims(plan, {}))))}`);
  const dDef = await digest(solve(withAims(plan, {})));
  ok(dDef === d0, `1. ${ID} with every aim at its default solves to the tables without aims (${d0.slice(0, 16)})`);
  const bad = all.filter(s => 'solver' in E.normalizePlan(s.plan));
  ok(bad.length === 0, `1. ${all.length} library plans normalise with no solver key${bad.length ? `: ${bad.slice(0, 3).map(s => s.id)}` : ''}`);
  const vals = Array.from({ length: 25 }, (_, i) => i / 2), miss = vals.filter(x => E.normalizePlan(withAims(plan, { cuts: x })).solver.aims.cuts !== (APP_DIAL.includes(x) ? x : 1));
  ok(miss.length === 0, `1. App.jsx keeps the dial's positions, ${APP_DIAL.join(', ')}, and reads every other value from 0 to 12 by halves as 1${miss.length ? `: wrong at ${miss}` : ''}`); }

// 2. each lever is its option, and the solve sees it
const LEVERS = [
  ['cuts 3', { cuts: 3 }, { lambda: 3 * APP_LAMBDA }, { cuts: 4 }],
  ['estate lower', { estate: 'lower' }, { research: { bequestWeight: 0.01 } }, { estate: 'less' }],
  ['raises blocked', { raises: 'blocked' }, { research: { raiseCap: 1 } }, { raises: 'never' }],
  ['consent withdrawn', { riskConsent: false }, { research: { riskConsent: false } }, { riskConsent: 'no' }]
];
const solved = {};
for (const [name, aims, explicit, lost] of LEVERS) {
  const r = solve(withAims(plan, aims)), dA = await digest(r), dX = await digest(solve(plan, explicit)), dL = await digest(solve(withAims(plan, lost)));
  solved[name] = r;
  ok(dA === dX && dA !== d0, `2. ${name}: the tables of ${JSON.stringify(explicit)} given explicitly (${dA.slice(0, 16)}), not the default's`);
  ok(!(dL === dX && dL !== d0), `2. planted, the aim lost on its way (${JSON.stringify(lost)}, read as the default): the check fails`);
}
{ const above = paths => paths.reduce((s, p) => s + p.filter(y => y.level > 1 + 1e-9).length, 0);
  const blocked = above(rowsOf(solved['raises blocked'])), dflt = above(rowsOf(base));
  ok(blocked === 0, `2. raises blocked: no year above target on ${NP} paths`);
  ok(dflt > 0, `2. planted, the default's solve run through the same check: ${dflt} years above target, so the check can see a raise`); }
{ const np = E.normalizePlan(plan), tier = pre => { const a = (np.accounts || []).find(x => x.id && x.id.startsWith(pre)); return a ? a.risk : null; };
  const own = { tp: tier('pen_'), ti: tier('isa_') };
  const moved = paths => paths.reduce((s, p) => s + p.filter(y => (own.tp && y.tp && y.tp !== own.tp) || (own.ti && y.ti && y.ti !== own.ti)).length, 0);
  const r = solved['consent withdrawn'], nc = moved(rowsOf(r)), dflt = moved(rowsOf(base));
  ok(nc === 0 && /no consent/.test(String(r.meta.riskAbove && r.meta.riskAbove.decision)), `2. consent withdrawn: the plan's own tiers (${own.tp} / ${own.ti}) every year of ${NP} paths; the run record: ${r.meta.riskAbove && r.meta.riskAbove.decision}`);
  ok(dflt > 0, `2. planted, the default's solve run through the same check: ${dflt} path-years off the plan's own tiers, so the check can see a move`); }

// 3. normalisation
{ const p = E.normalizePlan({ ...plan, solver: { aims: { cuts: 7, estate: 'more', raises: 'sometimes', riskConsent: 'no' } } });
  ok(JSON.stringify(p.solver.aims) === JSON.stringify(DEFAULTS), `3. values off the positions read as the defaults: ${JSON.stringify(p.solver.aims)}`);
  const q = E.normalizePlan({ ...plan, solver: { aims: { cuts: 6, estate: 'lower', raises: 'blocked', riskConsent: false } } });
  ok(JSON.stringify(q.solver.aims) === JSON.stringify({ cuts: 6, estate: 'lower', raises: 'blocked', riskConsent: false }) && q.solver.locks && q.solver.locks.lumpSum === 'free',
    `3. aims on their positions kept, the locks beside them free: ${JSON.stringify(q.solver)}`);
  const l = E.normalizePlan({ ...plan, solver: { locks: { lumpSum: 'now' } } });
  ok(!('aims' in l.solver), `3. locks without aims normalise as before, with no aims: ${JSON.stringify(l.solver)}`); }

// 4. the key
{ const ks = await Promise.all(LEVERS.map(([, aims]) => solveKey(E, withAims(plan, aims), OPTS))), k0 = await solveKey(E, withAims(plan, {}), OPTS);
  ok(ks.every(k => k !== k0) && new Set(ks).size === LEVERS.length, '4. each lever gives the solve another key');
  const shuffled = { solver: { aims: { riskConsent: true, raises: 'capped', estate: 'standard', cuts: 1 } }, ...plan };
  ok(await solveKey(E, shuffled, OPTS) === k0, `4. the same plan, its fields in another order: the same key (${k0.slice(0, 16)})`); }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
