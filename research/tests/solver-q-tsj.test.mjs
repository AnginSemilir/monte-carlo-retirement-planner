/*
 * Q WITH THE TIER STATE AND JOINT WORLDS (PLAN.md O55; the maintainer, 30 Sep 18:50 UK: Q joins the bundle for 7u without
 * its own test, and a unit test of Q with the tier state and joint worlds comes before 7u registers; candidate.mjs's
 * header: the smoke solve "is the first run of Q with TS+J ... not that test"). solver-step.test.mjs proves Q
 * (`bridgeStep: 'exact'`) on the plain mixture; under the tier state each move reads NEXT year's table of the tier pair it
 * moves to (solve.js: the backward pass's `Ln = layW[k][tsLayerOf[ai]]`, scoreMoves' `r.tsLayers[r.tsLayerOf[ai]]`) while
 * the step's place is taken from the default layer's table (`stepAtW` from lsurvW[k]; scoreMoves' stepAtOf(g, t,
 * lsurv[t + 1])). That is right only if every layer's reader puts the step at the same place - each layer's reader is
 * built from its own table with the world's one reference (chanceOf(k, t): the plan's tiers, never the move's) - and if
 * the integral is then taken over the move's own layer. This checks both, under the research candidate's settings
 * (candidate.mjs: the reader, tierState, jointWorlds, the charge, e3, the smooth allowance axis; O60's blend medians),
 * on share 0.95 (solver-step.test.mjs's household: S126 with 95% of its wealth in the pension, two years before access):
 *   B. from the last bridge year on, every layer's tables in every world are the same to the bit on and off; before it,
 *      something differs (Q acts at the nodes under the tier state too)
 *   G. in every world, every reader year and every tier layer, the layer's own reader puts the step where the default
 *      layer's does (so the default layer's place is the move's); planted: a layer table the reader never saw has no
 *      step (the check reads the layer's own entry, not a fallback)
 *   F. the 4,000-point reference integrates 1 and z^2
 *   C. THE CHOOSER AT THE TRUE STATE: at the opening state, in every world, each move's score with Q is within 0.003 of
 *      the same score over 4,000 equal-probability returns read from the move's own layer; planted: the five points
 *      miss that by more than 0.003 on some move (else C is vacuous)
 *   H. planted, the layer read: every move made to read the default layer instead of its own misses the 4,000-point
 *      score by more than 0.003 on some move (else C cannot tell the layers apart, and the layer read is untested)
 *   D. the chooser uses it: the moves' scores at the opening state differ on and off
 *   node research/tests/solver-q-tsj.test.mjs [points=6]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, scoreMoves } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { CANDIDATE_OPTS, candidatePlan } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const PTS = Number(process.argv[2] || 6), LAMBDA = 0.0223606797749979;
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
// share 0.95, built as solver-step.test.mjs builds it
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
const p = JSON.parse(JSON.stringify(singles.find(x => x.id === 'S126').plan));
const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(0.95 * W) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * 0.05 * W) }; return a; });
{ const nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - 2; p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) }; }
const plan = candidatePlan(E, prep(p));
const o = { ...CANDIDATE_OPTS, lambda: LAMBDA, points: PTS };
const t0 = Date.now();
const on = solvePlan(E, M, plan, o), off = solvePlan(E, M, plan, { ...o, bridgeStep: undefined });
console.log(`share 0.95 under the candidate at ${PTS} points: two solves in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
const T = on.m.ctx.totalYears, s0 = vecOf(on.m, M.initialState(on.m)), K = on.worlds.length;
const layers = (r, k) => r.tablesW.layW[k], J = on.tablesW.layW[0].length;
const readerYears = Array.from(on.g.reader.years).map((v, i) => (v ? i : -1)).filter(i => i >= 0);
ok('setup  the candidate solves with the tier state, joint worlds and Q, and the household has reader years',
  on.meta.stepExact !== false && on.tsLayerOf && J > 1 && K === 3 && readerYears.length > 0 && on.stepExact === true && off.stepExact === false,
  `${K} worlds, ${J} tier layers, reader years ${readerYears.join(', ')}; opening accessible ${Math.round(s0[1] + s0[2])}`);

console.log('=========== B. ONLY THE YEARS BEFORE A READER YEAR, IN EVERY LAYER ===========');
const last = Math.max(...readerYears);
const layEq = (t) => { for (let k = 0; k < K; k++) for (let j = 0; j < J; j++) { const a = layers(on, k)[j], b = layers(off, k)[j]; for (const kk of ['surv', 'lsurv', 'beq', 'pol', 'short']) { const x = a[kk][t], y = b[kk][t]; if (x.length !== y.length) return false; for (let i = 0; i < x.length; i++) if (!Object.is(x[i], y[i])) return false; } } return true; };
let sameAfter = true; for (let t = last; t <= T; t++) if (!layEq(t)) sameAfter = false;
ok('B  from the last bridge year on, every layer of every world is the same to the bit on and off', sameAfter, `years ${last} to ${T}, ${K} x ${J} layers`);
let diffBefore = false; for (let t = 0; t < last; t++) if (!layEq(t)) diffBefore = true;
ok('B  before it, something differs (Q acts at the nodes under the tier state)', diffBefore);

console.log('=========== G. THE STEP\'S PLACE IN EVERY LAYER ===========');
const stepOf = (L) => { const RD = on.g.reader.of.get(L), sch = RD && RD.chance && RD.chance.schedule; return sch && sch.bills.length ? sch.bills[0] - 1 : null; };
let gOk = true, gN = 0, gNote = '';
for (let k = 0; k < K; k++) for (const t of readerYears) {
  const ref = stepOf(on.worlds[k].lsurv[t]);
  for (let j = 0; j < J; j++) { const s = stepOf(layers(on, k)[j].lsurv[t]); gN++; if (ref === null || s === null || s !== ref) { gOk = false; gNote = `world ${k}, year ${t}, layer ${j}: ${s} against ${ref}`; } }
}
ok('G  every layer\'s own reader puts the step where the default layer\'s does, in every world and reader year', gOk && gN === K * J * readerYears.length, gNote || `${gN} layer-years`);
const fresh = Float64Array.from(layers(on, 0)[J - 1].lsurv[readerYears[0]]);
ok('G  planted: a layer table the reader never saw has no step (the check reads each layer\'s own entry)', stepOf(fresh) === null);

console.log('=========== F. THE REFERENCE ===========');
const PhiInv = q => { const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572], c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]; const pl = 0.02425; if (q < pl) { const r = Math.sqrt(-2 * Math.log(q)); return (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } if (q > 1 - pl) { const r = Math.sqrt(-2 * Math.log(1 - q)); return -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } const r = q - 0.5, r2 = r * r; return (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * r / (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1); };
const DN = 4000, DZ = Array.from({ length: DN }, (_, i) => PhiInv((i + 0.5) / DN)), DW = new Array(DN).fill(1 / DN);
const m0 = DW.reduce((t, w) => t + w, 0), m2 = DZ.reduce((t, z, i) => t + DW[i] * z * z, 0);
ok('F  the reference integrates 1 and z^2', Math.abs(m0 - 1) < 1e-9 && Math.abs(m2 - 1) < 2e-3, `${m0.toFixed(9)}, ${m2.toFixed(5)}`);

console.log('=========== C. THE CHOOSER AT THE TRUE STATE, EACH MOVE ON ITS OWN LAYER ===========');
const fresh_ = { _post: null, _grown: null, _rd: null, _sx: null, _sxR: null, _fx: null, _fxR: null };
// the same tables read over the 4,000 returns: the year-0 node rates and weights replaced, Q off; tsLayers kept, so each
// move still reads its own layer (scoreMoves)
const denseView = (w) => {
  const nro = w.nodeRealOfAt.slice();
  nro[0] = w.actions.map((_, ai) => { const act = w.c.acts[ai], R = act.real, V = act.volEffAt[0]; return DZ.map(z => { const x = new Float64Array(4); for (let i = 0; i < 4; i++) x[i] = Math.exp(Math.log(1 + R[i]) + V[i] * z) - 1; return x; }); });
  return { ...w, nodeRealOfAt: nro, quadWeights: DW, stepExact: false, ...fresh_ };
};
// planted (H): every move reads the default layer's tables, Q still on
const defaultLayerView = (w) => { const j0 = w.tsLayers.findIndex(L => L.lsurv === w.lsurv); return { ...w, tsLayers: w.tsLayers.map(() => w.tsLayers[j0]), ...fresh_ }; };
const n = on.actions.length;
const scores = (w) => { const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n); scoreMoves({ ...w, ...fresh_ }, s0, 0, SC, TX, BQ, null); return SC; };
const TOL = 0.003;
let worstOn = 0, worstOff = 0, worstWrong = 0, cOk = true, where = '', layersRead = new Set(), moved = 0;
for (let k = 0; k < K; k++) {
  const wOn = on.worlds[k], sOn = scores(wOn), sOff = scores(off.worlds[k]), sD = scores(denseView(wOn)), sWrong = scores(defaultLayerView(wOn));
  for (let ai = 0; ai < n; ai++) {
    if (!Number.isFinite(sD[ai])) { if (Number.isFinite(sOn[ai])) cOk = false; continue; }
    layersRead.add(on.tsLayerOf[ai]);
    const eOn = Math.abs(sOn[ai] - sD[ai]), eOff = Math.abs(sOff[ai] - sD[ai]), eWrong = Math.abs(sWrong[ai] - sD[ai]);
    if (eOn > worstOn) { worstOn = eOn; where = `world ${k}, ${on.actions[ai].label}`; }
    worstOff = Math.max(worstOff, eOff); worstWrong = Math.max(worstWrong, eWrong);
    if (eOn > TOL) cOk = false;
    if (Number.isFinite(sOff[ai]) && Math.abs(sOff[ai] - sOn[ai]) > 1e-9) moved++;
  }
}
ok('C  with Q, every move\'s score at the opening state is within 0.003 of the 4,000-point score on its own layer, in every world', cOk && layersRead.size > 1, `worst ${worstOn.toFixed(5)} (${where}); ${layersRead.size} layers read by the finite moves`);
ok('C  planted: the five points miss the 4,000-point score by more than 0.003 on some move', worstOff > TOL, `worst ${worstOff.toFixed(5)}`);
console.log('=========== H. THE LAYER READ ===========');
ok('H  planted: every move reading the default layer misses the 4,000-point score by more than 0.003 on some move', worstWrong > TOL, `worst ${worstWrong.toFixed(5)}`);
console.log('=========== D. THE CHOOSER USES IT ===========');
ok('D  the moves\' scores at the opening state differ on and off', moved > 0, `${moved} move-worlds moved`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
