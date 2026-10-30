/*
 * THE AGE-WEIGHTED CUTS' OWN TEST (EXPLORATORY; AGE-WEIGHT.md; the patch dial/solve-ageweight.patch, on the agent's code at
 * 1b39400, in a local worktree only). On S090 at light settings (4 wealth points, a small reference lattice), the candidate at
 * ten times the dislike of cuts, with `ageWeight` { mode 90, disp 9 } and without:
 *   1. the weights are the Gompertz chance of being alive from the plan's age, year by year, computed here independently;
 *   2. each menu level's cost is the weight times the cost without it (lambda (1 - l)^2 for a cut, minus the raise credit);
 *   3. the price of running out is each remaining spending year's floor cost, weighted alike;
 *   4. off, the cost is the function it was (the same at every year) and nothing is recorded;
 *   5. the effect: on, the first retired year's move differs somewhere on the grid (the weights reach the table).
 * Planted, each must fail its check: (a) the weights at mode 91; (b) the costs unweighted.
 *   node ageweight-test.mjs        (from the root of the patched code)
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs');
const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA } = await imp('research/solver/audit-phase4.mjs');
const AW = { mode: 90, disp: 9 }, TIMES = 10;
const h = readPanel().find(x => x.id === 'S090');
const pk = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy;
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: pk }));
const light = { lambda: LAMBDA * TIMES, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const on = C.solveCandidate(E, M, plan, { ...light, ageWeight: AW }), off = C.solveCandidate(E, M, plan, light);
let failed = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) failed++; };
const T = on.m.ctx.totalYears, a0 = on.m.ctx.ageSelf0;
const gomp = (mode, disp) => Array.from({ length: T + 2 }, (_, t) => Math.exp(-Math.exp((a0 - mode) / disp) * (Math.exp(t / disp) - 1)));
const maxGap = (x, y) => x.reduce((m, v, i) => Math.max(m, Math.abs(v - y[i])), 0);
const w = Array.from(on.ageWeight.w), want = gomp(AW.mode, AW.disp);
const g1 = maxGap(w, want), g1p = maxGap(w, gomp(91, AW.disp));
ok(g1 < 1e-15, `1. the weights are the Gompertz chance of being alive from age ${a0}: the largest gap ${g1.toExponential(2)} over ${T + 2} years (at 75 ${want[75 - a0].toFixed(3)}, at 85 ${want[85 - a0].toFixed(3)})`);
ok(!(g1p < 1e-15), `   planted (a): against the weights at mode 91 the gap is ${g1p.toExponential(2)}, caught`);
const lam = on.lambda, mu = on.meta.raiseWeight, levels = [...new Set(on.levelOf)];
const base = l => (l < 1 ? lam * Math.pow(1 - l, 2) : l > 1 ? -mu * Math.sqrt(Math.min(0.2, l - 1)) : 0);
let g2 = 0, g2p = 0;
for (let t = 0; t <= T; t++) for (const l of levels) { g2 = Math.max(g2, Math.abs(on.costOf(l, t) - want[t] * base(l))); g2p = Math.max(g2p, Math.abs(on.costOf(l, t) - base(l))); }
ok(g2 < 1e-15, `2. each level's cost is the weight times its cost without it (levels ${levels.join(', ')}; lambda ${lam.toPrecision(6)}, the raise weight ${mu}): the largest gap ${g2.toExponential(2)}`);
ok(!(g2p < 1e-15), `   planted (b): against the costs unweighted the gap is ${g2p.toExponential(2)}, caught`);
const failLevel = Math.min(...on.levelOf), spend = on.c.yr.spend, fc = on.ageWeight.failCost;
let g3 = 0;
for (let t = 0; t <= T; t++) { let s = 0; for (let u = t; u <= T; u++) if (spend[u] > 0) s += want[u] * lam * Math.pow(1 - Math.min(1, failLevel), 2); g3 = Math.max(g3, Math.abs(fc[t] - s) / Math.max(1e-12, s)); }
ok(g3 < 1e-12, `3. the price of running out is the remaining spending years' floor cost, each weighted (relative gap ${g3.toExponential(2)}; at year 0 ${fc[0].toPrecision(6)})`);
let g4 = 0; for (let t = 0; t <= T; t++) for (const l of levels) g4 = Math.max(g4, Math.abs(off.costOf(l, t) - base(l)));
ok(g4 === 0 && off.ageWeight === null && off.meta.ageWeight === undefined && on.meta.ageWeight && on.meta.ageWeight.mode === 90, `4. off, every level's cost is its unweighted cost at every year (the largest gap ${g4}), nothing is recorded; on, the meta records ${JSON.stringify(on.meta.ageWeight)}`);
// 5. the weights reach the table: the plan's opening score, on and off
const vOn = on.value(M.initialState(on.m), 0).score, vOff = off.value(M.initialState(off.m), 0).score;
ok(Number.isFinite(vOn) && vOn !== vOff, `5. the weights reach the table: the opening score ${vOn.toPrecision(8)} on against ${vOff.toPrecision(8)} off`);
console.log(failed ? `FAILED: ${failed} checks` : 'ALL PASS: 7 checks (two of them plants)');
process.exit(failed ? 1 : 0);
