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
 *   C. THE CHOOSER AT THE TRUE STATE: at the opening state and year 0's grid positions (every wealth and pension share,
 *      the accessible money all in the ISA or all taxable), in every world: where Q acts (the step within z in [-9, 9]),
 *      each move's score is within 0.003 of the same score over 4,000 equal-probability returns read from the move's own
 *      layer; where it hands back, the score is the five points' to the bit; planted: where Q acts, the five points miss
 *      the 4,000-point score by more than 0.003 on some move (else C is vacuous)
 *   H. planted, the layer read: every move made to read the default layer instead of its own misses the 4,000-point
 *      score by more than 0.003 on some move (else C cannot tell the layers apart, and the layer read is untested)
 *   D. the chooser uses it: the moves' scores at the opening state differ on and off
 *   node research/tests/solver-q-tsj.test.mjs [points=6]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, scoreMoves } from '../../src/solver/solve.js';
import { vecOf, toVec } from '../../src/solver/grid.js';
import * as F from '../../src/solver/fast.js';
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
const scores = (w, s = s0) => { const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n); scoreMoves({ ...w, ...fresh_ }, s, 0, SC, TX, BQ, null); return SC; };
const TOL = 0.003;
// the states read: the opening, and year 0's grid positions at every wealth and pension share, the accessible money all
// in the ISA or all in the taxable account, with no gain and no lump sum taken (the first run read the opening alone, and
// there the layers' next-year tables are within 0.0004 of each other: H's plant was not caught, so C could not tell the
// layers apart; the wider set is where a wrong layer shows)
const states = [['the opening', s0]];
for (let ip = 0; ip < on.g.np; ip++) for (let ii = 0; ii < on.g.ni; ii++) for (const it of [0, on.g.nt - 1]) states.push([`node ${ip}/${ii}/${it}`, toVec(on.g, ip, ii, it, 0, 0, new Float64Array(7), 0)]);
const J0 = on.worlds[0].tsLayers.findIndex(L => L.lsurv === on.worlds[0].lsurv);
// where Q acts: stepExpect's own bracket - the move's accessible money after its flow, grown at z = -9 and z = 9 at the
// move's rates (realAt, no path shift in year 0), straddles the reader's step; outside it Q hands back to the five points.
// The second widened run's one C miss (node 4/4/5, world 1, 'taxable before ISA, spend 110%', 0.00411) was such a move:
// the step at 23,199 of accessible money, the move's accessible money 43,570 even at z = -9, so Q never acted and the miss
// is the five points' own error on a smooth integrand (no jump over 0.02 between returns 0.002 apart; 40,000 returns agree
// with 4,000 to 2e-6; scratch diagnosis, the 7 Oct session). So C reads Q against the reference where it acts, and checks
// it is the five points to the bit where it does not.
const accAt = (w, ai, s, z) => { const post = Float64Array.from(s); F.flow(w.c, 0, ai, post); const act = w.c.acts[ai], x = new Float64Array(4); for (let i = 0; i < 4; i++) x[i] = Math.exp(Math.log(1 + act.real[i]) + act.volEffAt[0][i] * z) - 1; F.grow(w.c, 0, post, x); return post[1] + post[2]; };
let worstOn = 0, worstOff = 0, worstWrong = 0, cOk = true, idOk = true, where = '', whereId = '', whereWrong = '', layersRead = new Set(), moved = 0, cells = 0, acts = 0, idle = 0;
const t1 = Date.now();
for (const [name, s] of states) for (let k = 0; k < K; k++) {
  const wOn = on.worlds[k], sOn = scores(wOn, s), sOff = scores(off.worlds[k], s), sD = scores(denseView(wOn), s), sWrong = scores(defaultLayerView(wOn), s);
  const stepAt = stepOf(wOn.lsurv[1]);
  for (let ai = 0; ai < n; ai++) {
    if (!Number.isFinite(sD[ai])) { if (Number.isFinite(sOn[ai])) cOk = false; continue; }
    layersRead.add(on.tsLayerOf[ai]); cells++;
    const eOn = Math.abs(sOn[ai] - sD[ai]), eOff = Math.abs(sOff[ai] - sD[ai]), eWrong = Math.abs(sWrong[ai] - sD[ai]);
    const qActs = stepAt !== null && accAt(wOn, ai, s, -9) < stepAt && accAt(wOn, ai, s, 9) >= stepAt;
    if (qActs) {
      acts++;
      if (eOn > worstOn) { worstOn = eOn; where = `${name}, world ${k}, ${on.actions[ai].label}`; }
      worstOff = Math.max(worstOff, eOff);
      if (eOn > TOL) cOk = false;
    } else {
      idle++;
      if (!Object.is(sOn[ai], sOff[ai])) { idOk = false; whereId = `${name}, world ${k}, ${on.actions[ai].label}: ${sOn[ai]} against ${sOff[ai]}`; }
    }
    // H counts only the moves the plant moves: those whose own layer is not the default one (the second widened run's
    // H 'passed' on a default-layer move, which the plant cannot touch)
    if (on.tsLayerOf[ai] !== J0 && eWrong > worstWrong) { worstWrong = eWrong; whereWrong = `${name}, world ${k}, ${on.actions[ai].label}`; }
    if (s === s0 && Number.isFinite(sOff[ai]) && Math.abs(sOff[ai] - sOn[ai]) > 1e-9) moved++;
  }
}
console.log(`${states.length} states x ${K} worlds, ${cells} finite move scores (Q acts on ${acts}, hands back on ${idle}), in ${((Date.now() - t1) / 1000).toFixed(0)} s`);
ok('C  where Q acts, every move\'s score is within 0.003 of the 4,000-point score on its own layer, in every world', cOk && acts > 0 && layersRead.size > 1, `worst ${worstOn.toFixed(5)} (${where}); ${acts} move scores; ${layersRead.size} layers read by the finite moves`);
ok('C  where Q hands back (the step out of reach), every score is the five points\' to the bit', idOk && idle > 0, whereId || `${idle} move scores`);
ok('C  planted: where Q acts, the five points miss the 4,000-point score by more than 0.003 on some move', worstOff > TOL, `worst ${worstOff.toFixed(5)}`);
console.log('=========== H. THE LAYER READ ===========');
ok('H  planted: every move reading the default layer misses the 4,000-point score by more than 0.003 on some move made to another layer', worstWrong > TOL, `worst ${worstWrong.toFixed(5)} (${whereWrong})`);
console.log('=========== D. THE CHOOSER USES IT ===========');
ok('D  the moves\' scores at the opening state differ on and off', moved > 0, `${moved} move-worlds moved`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
