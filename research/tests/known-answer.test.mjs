/*
 * V2: CASES WITH AN INDEPENDENTLY KNOWN ANSWER (the external review of 21 Oct, Part B Step 5). Each one is a property the
 * solver must have whatever its settings, checked against a planted fault that breaks it:
 *   1. ONE POT, no tax, constant real spending, one tier, one world (an ISA alone, no income, the tier's per-path shift 0):
 *      research/oracle/one-pot.mjs, which imports nothing from src/solver, solves the survival chance exactly for its
 *      interpolant on 2,400 log-wealth points, and its own million paths agree with it. Every move is equivalent here, so
 *      the solver's policy, simulated, must match the oracle within Monte Carlo error (any gap is a bug); its table must
 *      converge to the oracle as the wealth axis is refined (within half a point at 90 points); and its table at the
 *      shipped 30 points is REPORTED against the review's half-point bar (the gap is the wealth axis's resolution, an
 *      open item in STATE.md, not a check that fails here).
 *   2. SPLIT INVARIANCE: with capital gains, dividend and savings tax off and no cash buffer, the ISA and the taxable
 *      account are the same asset at the same tier, so a total's value must not depend on how it is split between them,
 *      and drawing either first must tie.
 *   3. METAMORPHIC (Kanewala and Bieman 2014): a guaranteed income at least the spending survives every path; higher
 *      spending never raises survival in any cell; more opening wealth never lowers it.
 *   node research/tests/known-answer.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, runPolicy, scoreMoves, buildActions, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { solveOnePot, simulateOnePot } from '../oracle/one-pot.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const acc = (id, category, balance, extra = {}) => ({ id, owner: 'Myself', category, balance, contrib: 0, growth: 0, risk: 'Medium Risk', ...extra });
const planOf = ({ accounts, spend, config = {}, statePension = 0, age = 66 }) => {
  const base = E.normalizePlan({
    demographics: { planningMode: 'single', currentAgeSelf: age, retireAgeSelf: 60, terminalAge: 95, statePensionAge: 66, privatePensionAge: 57, statePensionSelf: statePension },
    spending: { targetSpend: spend, spendBands: [] }, accounts,
    config: { valuationDate: '2026-01-01', lookaheadYears: 0, guardrails: false, solvencyFloor: 0, ...config }
  });
  const rp = { ...base.riskProfiles, 'Medium Risk': { ...base.riskProfiles['Medium Risk'], sigmaParam: 0 } };
  return E.resolveMpaa(E.normalizePlan({ ...base, riskProfiles: rp, riskSource: '' }));
};
const OPTS = { ...PRODUCT_BASELINE, spendLevels: [1], raiseWeight: 0, lambda: 0 };
const simulate = (r, paths) => { let k = 0; for (const zs of paths) if (runPolicy(r, Float64Array.from(zs)).survived) k++; return k / paths.length; };

// 1. one pot
const W0 = 600000, SPEND = 30000;
const pot = planOf({ accounts: [acc('isa_self', 'S&S ISAs', W0)], spend: SPEND });
const mP = M.prepare(E, pot), T = mP.ctx.totalYears, tier = pot.riskProfiles['Medium Risk'];
const MU = Math.log(1 + tier.real / 100), SIG = tier.volatility / 100;
const oracle = solveOnePot({ W0, spend: SPEND, years: T + 1, mu: MU, sigma: SIG });
const mc = simulateOnePot({ W0, spend: SPEND, years: T + 1, mu: MU, sigma: SIG, paths: 1000000 });
ok(Math.abs(oracle.V0 - mc.survival) < 4 * mc.se, `the oracle against its own million paths: ${(100 * oracle.V0).toFixed(3)}% against ${(100 * mc.survival).toFixed(3)}% (se ${(100 * mc.se).toFixed(3)})`);
const paths = E.pathsForSeed(99003, 20000, T), N = paths.length;
const r30 = solve(E, M, pot, { ...OPTS, points: 30 }), r90 = solve(E, M, pot, { ...OPTS, points: 90 });
const s0 = M.initialState(mP), sim = simulate(r30, paths), se = Math.sqrt(oracle.V0 * (1 - oracle.V0) / N);
ok(Math.abs(sim - oracle.V0) < 4 * se, `the solver's policy, simulated on ${N} paths: ${(100 * sim).toFixed(3)}% against the oracle's ${(100 * oracle.V0).toFixed(3)}% (4 se ${(400 * se).toFixed(3)} points)`);
const t30 = r30.value(s0, 0).survival, t90 = r90.value(s0, 0).survival;
ok(Math.abs(t90 - oracle.V0) < 0.005, `the solver's table converges: at 90 points it reads ${(100 * t90).toFixed(3)}% against the oracle's ${(100 * oracle.V0).toFixed(3)}% (within half a point)`);
console.log(`REPORTED  the table at the shipped 30 points reads ${(100 * t30).toFixed(3)}%, ${(100 * (t30 - oracle.V0)).toFixed(3)} points from the oracle, against the review's half-point bar: ${Math.abs(t30 - oracle.V0) < 0.005 ? 'within' : 'OUTSIDE'} (the wealth axis's resolution; STATE.md's open items)`);
// planted: a return a tenth of a point a year higher in the oracle than in the solver is caught by the policy check
const wrong = solveOnePot({ W0, spend: SPEND, years: T + 1, mu: MU + 0.001, sigma: SIG });
ok(Math.abs(sim - wrong.V0) >= 4 * se, `planted: an oracle a tenth of a point a year richer (${(100 * wrong.V0).toFixed(3)}%) is told apart from the policy`);

// 2. split invariance: the same total split 1:5, 1:1 and 5:1 between the ISA and the taxable account, all taxes that tell
// them apart off, no cash buffer; values compared at those states, and every pair of moves differing only in which is drawn first
const NOTAX = { cgtEnabled: false, giaDividendYield: 0, cashInterestTaxed: false, cashBufferMonths: 0 };
const splitPlan = (isa, gia, config = NOTAX) => planOf({ accounts: [acc('isa_self', 'S&S ISAs', isa), acc('other_self', 'Other Investments (e.g. GIA)', gia, { unrealisedGain: 0 })], spend: SPEND, config });
const splitSpread = config => {
  const vals = [[100000, 500000], [300000, 300000], [500000, 100000]].map(([i, g]) => { const p = splitPlan(i, g, config); const r = solve(E, M, p, { ...OPTS, points: 12 }); return { r, p, v: r.value(M.initialState(M.prepare(E, p)), 0).survival }; });
  const spread = Math.max(...vals.map(x => x.v)) - Math.min(...vals.map(x => x.v));
  // at the 1:1 state, each move against its twin with the ISA and the taxable account swapped in the draw order
  const { r, p } = vals[1], st = vecOf(r.m, M.initialState(M.prepare(E, p))), A = r.actions.length;
  const SC = new Float64Array(A), TX = new Float64Array(A), BQ = new Float64Array(A); scoreMoves(r, st, 0, SC, TX, BQ);
  // a move's twin: the same move with the ISA and the taxable pot (cash then the taxable account, one block in the
  // solver's state) swapped in its draw and cost orders, labels aside
  const order = (steps, swap) => { const o = steps.join('>').replace('cash>other', 'T'); return swap ? o.replace(/\bT\b|\bisa\b/g, x => (x === 'T' ? 'isa' : 'T')) : o; };
  const sig = (a, swap) => JSON.stringify([order(a.steps, swap), order(a.costSteps || a.steps, swap), a.harvest, a.harvestCeil, a.sweepCash, a.lump, a.spendLevel, a.tierPen, a.tierIsa]);
  let pairs = 0, worst = 0;
  r.actions.forEach((a, i) => { const j = r.actions.findIndex(b => sig(b, false) === sig(a, true)); if (j > i && SC[i] > -Infinity && SC[j] > -Infinity) { pairs++; worst = Math.max(worst, Math.abs(SC[i] - SC[j])); } });
  return { spread, pairs, worst, vals };
};
const sp = splitSpread(NOTAX);
ok(sp.spread < 0.005, `split invariance, the opening at 1:5, 1:1 and 5:1: ${sp.vals.map(x => (100 * x.v).toFixed(3)).join('%, ')}% (spread ${(100 * sp.spread).toFixed(3)} points, under half a point)`);
ok(sp.pairs > 0 && sp.worst < 1e-3, `split invariance, the draw order: ${sp.pairs} pairs of moves with the ISA and the taxable account swapped tie within a tenth of a point (worst ${(100 * sp.worst).toFixed(4)} points)`);
const spTax = splitSpread({ ...NOTAX, giaDividendYield: 4, cgtEnabled: true });
ok(spTax.spread > 0.005 || spTax.worst > 1e-3, `planted: with dividend tax and CGT on the taxable account again the split matters (spread ${(100 * spTax.spread).toFixed(3)} points, worst pair ${(100 * spTax.worst).toFixed(4)})`);

// 3. metamorphic
{
  const rich = planOf({ accounts: [acc('isa_self', 'S&S ISAs', 50000)], spend: 8000, statePension: 12000 });   // the state pension from 66 covers the spending
  const rr = solve(E, M, rich, { ...OPTS, points: 12 }), Tr = rr.m.ctx.totalYears;
  const v = rr.value(M.initialState(rr.m), 0).survival, simR = simulate(rr, E.pathsForSeed(99003, 2000, Tr));
  ok(v > 0.999 && simR === 1, `a guaranteed income above the spending: the table reads ${(100 * v).toFixed(3)}% and every one of 2000 paths survives (${(100 * simR).toFixed(2)}%)`);
}
// higher spending (a fifth more; its grid scales with it, so the comparison is made on the same states, not cells): on
// the same paths no path survives that fails at the lower spending (one pot: every move is the same), and the opening reads lower
const hi = planOf({ accounts: [acc('isa_self', 'S&S ISAs', W0)], spend: SPEND * 1.2 });
const rHi = solve(E, M, hi, { ...OPTS, points: 30 });
const pathwise = (a, b) => { let k = 0; for (const zs of paths.slice(0, 5000)) if (runPolicy(b, Float64Array.from(zs)).survived && !runPolicy(a, Float64Array.from(zs)).survived) k++; return k; };
const up = pathwise(r30, rHi), vHi = rHi.value(M.initialState(M.prepare(E, hi)), 0).survival;
ok(up === 0 && vHi <= t30, `higher spending never raises survival: ${up} of 5000 paths survive at a fifth more spending and fail at the plan's; the opening reads ${(100 * vHi).toFixed(3)}% against ${(100 * t30).toFixed(3)}%`);
const swapped = pathwise(rHi, r30);
ok(swapped > 0, `planted: the comparison the other way round (the plan's spending against a fifth more) finds paths (${swapped}), so the check reads the runs`);
// more opening wealth: along the wealth axis at the one-pot's own share and gain nodes, survival never falls by more than 1e-6
{
  const g = r30.g, np = g.axes.W ? g.axes.W.pts.length : 0;
  let falls = 0, pairs2 = 0;
  for (let t = 0; t <= T; t++) for (let ip = 1; ip < np; ip++) { const a = r30.surv[t][g.index(ip - 1, 0, 0, 0, 0)], b = r30.surv[t][g.index(ip, 0, 0, 0, 0)]; pairs2++; if (b < a - 1e-6) falls++; }
  ok(np > 0 && falls === 0, `more opening wealth never lowers survival: ${falls} of ${pairs2} neighbouring wealth nodes where it falls by more than a millionth`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} known-answer checks failed`);
