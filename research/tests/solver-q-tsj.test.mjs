/*
 * Q WITH THE TIER STATE AND JOINT WORLDS (PLAN.md O55; the maintainer, 30 Sep 18:50 UK: Q joins the bundle for 7u without
 * its own test, and a unit test of Q with the tier state and joint worlds comes before 7u registers; candidate.mjs's
 * header: the smoke solve "is the first run of Q with TS+J ... not that test"). solver-step.test.mjs proves Q
 * (`bridgeStep: 'exact'`) on the plain mixture at the opening. Under the tier state each move reads NEXT year's table of
 * the tier pair it moves to (solve.js: the backward pass's `Ln = layW[k][tsLayerOf[ai]]`; scoreMoves'
 * `r.tsLayers[r.tsLayerOf[ai]]`), the step's place is taken from the default layer's table (stepAtW from lsurvW[k];
 * scoreMoves' stepAtOf(g, t, lsurv[t + 1])), and under joint worlds the backward pass stores one move for every world.
 *
 * Its second design follows the deep review of 7 Oct 09:37 UK (deep-review-log.md; RULES.md section 4 row 14), which found
 * the first design not decisive: H's one catch was the five points' own error on a move where Q hands back, and on the
 * moves where Q acts the wrong-layer plant moved scores by at most 0.00202, under C's 0.003; C scored with no tier held,
 * which the chooser never does; and nothing compared the backward pass's Q to anything. So, at every step year (a year
 * whose next year is a reader year) of the household, under the research candidate (candidate.mjs; O60's blend medians):
 *   B. from the last bridge year on, every layer's tables in every world are the same to the bit with Q on and off;
 *      before it, something differs
 *   G. (a guard, not evidence: chanceOf(k, t) takes no layer, so it cannot fail on today's code) every layer's own reader
 *      puts the step where the default layer's does; planted: a table the reader never saw has no step
 *   F. the 4,000-point reference integrates 1 and z^2
 *   C. THE CHOOSER AT THE TRUE STATE, holding the plan's tiers (0/0, as the forward run's opening does, every move leaving
 *      it charged): at the opening and the step year's grid positions, in every world, where Q acts (stepExpect's own
 *      bracket) each move's score is within TOL = 0.001 of the same score over 4,000 equal-probability returns on the
 *      move's own layer; where it hands back, the five points' score on the same tables to the bit; planted: where Q acts, the five points
 *      miss by more than TOL
 *   H. THE LAYER READ, planted, inside C's slice: on the moves where Q acts that go to another layer, every move made to
 *      read the default layer instead moves its score by more than TOL on some move
 *   M. the margins, printed, not asserted (the maintainer, 7 Oct 13:22 UK, option (a): row 14 asks each to be at least 2, but
 *      the wrong-layer plant moves scores only about 3-3.5 times Q's clean error, so no tolerance gives both 2; the gate is
 *      judged by a design review with the margins on record): TOL over C's worst clean error, and H's plant over TOL
 *   E. THE BACKWARD PASS: at every step year's grid nodes, holding each tier pair, the forward chooser (chooseAction, the
 *      joint mixture) picks the move the table stored, and each world's stored score is the forward score of the stored
 *      move (less the switch charge, as the backward pass stores it); planted: the forward chooser without Q disagrees
 *      somewhere
 *   D. the chooser uses it: the moves' scores at the opening differ on and off
 *   node research/tests/solver-q-tsj.test.mjs [points=6] [household=share0.95|S360]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, scoreMoves, chooseAction } from '../../src/solver/solve.js';
import { vecOf, toVec } from '../../src/solver/grid.js';
import * as F from '../../src/solver/fast.js';
import { CANDIDATE_OPTS, candidatePlan } from '../solver/candidate.mjs';
import { checkE3pclsPin } from '../solver/e3pcls-pin.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const PTS = Number(process.argv[2] || 6), HH = process.argv[3] || 'share0.95', LAMBDA = 0.0223606797749979, TOL = 0.001;
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const household = () => {
  if (HH !== 'share0.95') return JSON.parse(JSON.stringify(singles.find(x => x.id === HH).plan));
  // share 0.95, built as solver-step.test.mjs builds it: S126 with 95% of its wealth in the pension, two years before access
  const LIQ = /^S&S ISA|^Other Investments|^Cash/;
  const p = JSON.parse(JSON.stringify(singles.find(x => x.id === 'S126').plan));
  const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(0.95 * W) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * 0.05 * W) }; return a; });
  const nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - 2; p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return p;
};
const plan = candidatePlan(E, prep(household()));
const o = { ...CANDIDATE_OPTS, lambda: LAMBDA, points: PTS };
checkE3pclsPin(o);   // the candidate carries e3pcls (8 Oct): solved directly here, so checked here
const t0 = Date.now();
const on = solvePlan(E, M, plan, o), off = solvePlan(E, M, plan, { ...o, bridgeStep: undefined });
console.log(`${HH} under the candidate at ${PTS} points: two solves in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
const T = on.m.ctx.totalYears, s0 = vecOf(on.m, M.initialState(on.m)), K = on.worlds.length, g = on.g, n = on.actions.length;
const layers = (r, k) => r.tablesW.layW[k], J = on.tablesW.layW[0].length;
const readerYears = Array.from(g.reader.years).map((v, i) => (v ? i : -1)).filter(i => i >= 0);
const stepYears = readerYears.filter(y => y >= 1 && y - 1 < T).map(y => y - 1);
const prs = on.meta.tierState.split(',').map(x => x.split('/').map(Number));
const J0 = on.worlds[0].tsLayers.findIndex(L => L.lsurv === on.worlds[0].lsurv);
const HELD0 = { pen: 0, isa: 0, gia: 0 };
ok('setup  the candidate solves with the tier state, joint worlds and Q, and the household has step years',
  on.tsLayerOf && J > 1 && J === prs.length && K === 3 && stepYears.length > 0 && on.stepExact === true && off.stepExact === false && prs[J0][0] === 0 && prs[J0][1] === 0,
  `${K} worlds, ${J} tier layers (${on.meta.tierState}; default ${J0}), reader years ${readerYears.join(', ')}, step years ${stepYears.join(', ')}; opening accessible ${Math.round(s0[1] + s0[2])}`);

console.log('=========== B. ONLY THE YEARS BEFORE A READER YEAR, IN EVERY LAYER ===========');
const last = Math.max(...readerYears);
const layEq = (t) => { for (let k = 0; k < K; k++) for (let j = 0; j < J; j++) { const a = layers(on, k)[j], b = layers(off, k)[j]; for (const kk of ['surv', 'lsurv', 'beq', 'pol', 'short']) { const x = a[kk][t], y = b[kk][t]; if (x.length !== y.length) return false; for (let i = 0; i < x.length; i++) if (!Object.is(x[i], y[i])) return false; } } return true; };
let sameAfter = true; for (let t = last; t <= T; t++) if (!layEq(t)) sameAfter = false;
ok('B  from the last bridge year on, every layer of every world is the same to the bit on and off', sameAfter, `years ${last} to ${T}, ${K} x ${J} layers`);
let diffBefore = false; for (let t = 0; t < last; t++) if (!layEq(t)) diffBefore = true;
ok('B  before it, something differs (Q acts at the nodes under the tier state)', diffBefore);

console.log('=========== G. THE STEP\'S PLACE IN EVERY LAYER (a guard) ===========');
const stepOf = (L) => { const RD = g.reader.of.get(L), sch = RD && RD.chance && RD.chance.schedule; return sch && sch.bills.length ? sch.bills[0] - 1 : null; };
let gOk = true, gN = 0, gNote = '';
for (let k = 0; k < K; k++) for (const t of readerYears) {
  const ref = stepOf(on.worlds[k].lsurv[t]);
  for (let j = 0; j < J; j++) { const s = stepOf(layers(on, k)[j].lsurv[t]); gN++; if (ref === null || s === null || s !== ref) { gOk = false; gNote = `world ${k}, year ${t}, layer ${j}: ${s} against ${ref}`; } }
}
ok('G  every layer\'s own reader puts the step where the default layer\'s does, in every world and reader year', gOk && gN === K * J * readerYears.length, gNote || `${gN} layer-years`);
ok('G  planted: a layer table the reader never saw has no step', stepOf(Float64Array.from(layers(on, 0)[J - 1].lsurv[readerYears[0]])) === null);

console.log('=========== F. THE REFERENCE ===========');
const PhiInv = q => { const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572], c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]; const pl = 0.02425; if (q < pl) { const r = Math.sqrt(-2 * Math.log(q)); return (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } if (q > 1 - pl) { const r = Math.sqrt(-2 * Math.log(1 - q)); return -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } const r = q - 0.5, r2 = r * r; return (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * r / (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1); };
const DN = 4000, DZ = Array.from({ length: DN }, (_, i) => PhiInv((i + 0.5) / DN)), DW = new Array(DN).fill(1 / DN);
const m0 = DW.reduce((t, w) => t + w, 0), m2 = DZ.reduce((t, z, i) => t + DW[i] * z * z, 0);
ok('F  the reference integrates 1 and z^2', Math.abs(m0 - 1) < 1e-9 && Math.abs(m2 - 1) < 2e-3, `${m0.toFixed(9)}, ${m2.toFixed(5)}`);

// a view gets its own scratch (scoreMoves' and chooseAction's buffers live on the result)
const fresh_ = { _post: null, _grown: null, _rd: null, _sx: null, _sxR: null, _fx: null, _fxR: null, _sc: null, _tx: null, _bq: null, _scm: null, _txm: null, _bqm: null, _sc2: null };
const rateAt = (act, t, z) => { const x = new Float64Array(4); for (let i = 0; i < 4; i++) x[i] = Math.exp(Math.log(1 + act.real[i]) + act.volEffAt[t][i] * z) - 1; return x; };
// the same tables read over the 4,000 returns: year t's node rates and weights replaced, Q off; tsLayers kept, so each move
// still reads its own layer (scoreMoves)
const denseView = (w, t) => { const nro = w.nodeRealOfAt.slice(); nro[t] = w.actions.map((_, ai) => DZ.map(z => rateAt(w.c.acts[ai], t, z))); return { ...w, nodeRealOfAt: nro, quadWeights: DW, stepExact: false, ...fresh_ }; };
// planted (H): every move reads the default layer's tables, Q still on
const defaultLayerView = (w) => ({ ...w, tsLayers: w.tsLayers.map(() => w.tsLayers[J0]), ...fresh_ });
const scores = (w, s, t, held) => { const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n); scoreMoves({ ...w, ...fresh_ }, Float64Array.from(s), t, SC, TX, BQ, held); return SC; };
// where Q acts: stepExpect's bracket on the post it is given - the move's flow, then the switch charge as scoreMoves takes
// it when a tier is held, grown at z = -9 and 9 at the move's rates (realAt, no path shift)
const accAt = (w, ai, s, t, z, held) => { const post = Float64Array.from(s); F.flow(w.c, t, ai, post); if (held) F.chargeSwitch(w.c, post, held, w.c.acts[ai], t); F.grow(w.c, t, post, rateAt(w.c.acts[ai], t, z)); return post[1] + post[2]; };

console.log('=========== C, H, M. THE CHOOSER AT THE TRUE STATE, HOLDING THE PLAN\'S TIERS ===========');
let worstOn = 0, worstOff = 0, worstPlant = 0, cOk = true, idOk = true, where = '', whereId = '', wherePlant = '', moved = 0, acts = 0, idle = 0, actsOther = 0;
const layersRead = new Set();
const t1 = Date.now();
for (const t of stepYears) {
  const states = t === 0 ? [['the opening', s0]] : [];
  for (let ip = 0; ip < g.np; ip++) for (let ii = 0; ii < g.ni; ii++) for (const it of [0, g.nt - 1]) states.push([`year ${t} node ${ip}/${ii}/${it}`, toVec(g, ip, ii, it, 0, 0, new Float64Array(7), t)]);
  for (const [name, s] of states) for (let k = 0; k < K; k++) {
    const wOn = on.worlds[k], sOn = scores(wOn, s, t, HELD0), sOff = scores(off.worlds[k], s, t, HELD0), sFive = scores({ ...wOn, stepExact: false }, s, t, HELD0), sD = scores(denseView(wOn, t), s, t, HELD0), sWrong = scores(defaultLayerView(wOn), s, t, HELD0);
    const stepAt = stepOf(wOn.lsurv[t + 1]);
    for (let ai = 0; ai < n; ai++) {
      if (!Number.isFinite(sD[ai])) { if (Number.isFinite(sOn[ai])) cOk = false; continue; }
      const qActs = stepAt !== null && accAt(wOn, ai, s, t, -9, HELD0) < stepAt && accAt(wOn, ai, s, t, 9, HELD0) >= stepAt;
      if (qActs) {
        acts++; layersRead.add(on.tsLayerOf[ai]);
        const eOn = Math.abs(sOn[ai] - sD[ai]);
        if (eOn > worstOn) { worstOn = eOn; where = `${name}, world ${k}, ${on.actions[ai].label}`; }
        worstOff = Math.max(worstOff, Math.abs(sOff[ai] - sD[ai]));
        if (eOn > TOL) cOk = false;
        if (on.tsLayerOf[ai] !== J0) { actsOther++; const eP = Math.abs(sWrong[ai] - sOn[ai]); if (eP > worstPlant) { worstPlant = eP; wherePlant = `${name}, world ${k}, ${on.actions[ai].label}`; } }
      } else {
        idle++;
        // against the same tables with Q skipped at this state, not the Q-off solve: before the last reader year Q has also
        // changed next year's tables (S360's first run compared with the Q-off solve and differed by 7.6e-6 at year 5)
        if (!Object.is(sOn[ai], sFive[ai])) { idOk = false; whereId = `${name}, world ${k}, ${on.actions[ai].label}: ${sOn[ai]} against ${sFive[ai]}`; }
      }
      if (s === s0 && Number.isFinite(sOff[ai]) && Math.abs(sOff[ai] - sOn[ai]) > 1e-9) moved++;
    }
  }
}
console.log(`step years ${stepYears.join(', ')}: ${acts + idle} finite move scores (Q acts on ${acts}, ${actsOther} of them to another layer; hands back on ${idle}), in ${((Date.now() - t1) / 1000).toFixed(0)} s`);
ok('C  where Q acts, every move\'s score is within 0.001 of the 4,000-point score on its own layer, in every world and step year', cOk && acts > 0 && layersRead.size > 1, `worst ${worstOn.toFixed(5)} (${where}); ${layersRead.size} layers read`);
ok('C  where Q hands back, every score is the five points\' to the bit', idOk && idle > 0, whereId || `${idle} move scores`);
ok('C  planted: where Q acts, the five points miss the 4,000-point score by more than 0.001 on some move', worstOff > TOL, `worst ${worstOff.toFixed(5)}`);
ok('H  planted: where Q acts, reading the default layer moves some move to another layer by more than 0.001', worstPlant > TOL && actsOther > 0, `worst ${worstPlant.toFixed(5)} (${wherePlant}), over ${actsOther} moves`);
const mClean = worstOn > 0 ? TOL / worstOn : Infinity, mPlant = worstPlant / TOL;
console.log(`M  margins (reported, not asserted; row 14 asks 2 each): the tolerance over C's worst clean error ${mClean.toFixed(2)}x, H's plant over the tolerance ${mPlant.toFixed(2)}x${mClean >= 2 && mPlant >= 2 ? '' : ' -- BELOW 2, on record'}`);

console.log('=========== E. THE BACKWARD PASS AGAINST THE FORWARD CHOOSER ===========');
const offFwd = { ...on, mix: { ...on.mix, tables: on.mix.tables.map(tb => ({ ...tb, stepExact: false, ...fresh_ })) }, stepExact: false, ...fresh_ };
const v = new Float64Array(7);
let eAgree = 0, eN = 0, eFirst = '', plantDis = 0, worstV = 0, wv = '', nV = 0;
const t2 = Date.now();
for (const t of stepYears) for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
  const idx = g.index(ip, ii, it, ig, ic);
  toVec(g, ip, ii, it, ig, ic, v, t);
  for (let j = 0; j < J; j++) {
    const held = { pen: prs[j][0], isa: prs[j][1], gia: 0 };
    const stored = on.worlds[0].tsLayers[j].pol[t][idx];
    const SC0 = scores(on.worlds[0], v, t, held);
    if (!SC0.some(x => x > -Infinity)) continue;
    const a = chooseAction(on, Float64Array.from(v), t, held), aOff = chooseAction(offFwd, Float64Array.from(v), t, held);
    eN++; if (a === stored) eAgree++; else if (!eFirst) eFirst = `year ${t} node ${ip}/${ii}/${it}/${ig}/${ic} layer ${j}: chooser ${on.actions[a].label}, table ${on.actions[stored].label}`;
    if (aOff !== stored) plantDis++;
    for (let k = 0; k < K; k++) {
      const w = on.worlds[k], L = w.tsLayers[j], SC = k === 0 ? SC0 : scores(w, v, t, held);
      if (!Number.isFinite(SC[stored])) continue;
      const chg = on.tsLayerOf[stored] !== j ? (w.switchCharge || 0) : 0;
      const st = L.surv[t][idx] + w.wR * L.resil[t][idx] + w.wB * L.beq[t][idx] - L.short[t][idx];
      const d = Math.abs(st - (SC[stored] - chg)); nV++;
      if (d > worstV) { worstV = d; wv = `year ${t}, world ${k}, node ${ip}/${ii}/${it}/${ig}/${ic}, layer ${j}, ${on.actions[stored].label}`; }
    }
  }
}
console.log(`${eN} node-layers at step years ${stepYears.join(', ')}, ${nV} node-layer-worlds, in ${((Date.now() - t2) / 1000).toFixed(0)} s`);
ok('E  the forward chooser picks the stored move at every step year\'s nodes, holding each tier pair', eN > 0 && eAgree === eN, eFirst || `${eAgree} of ${eN}`);
ok('E  each world\'s stored score is the forward score of the stored move (less the switch charge)', nV > 0 && worstV < 1e-9, `worst ${worstV.toExponential(2)} (${wv})`);
ok('E  planted: the forward chooser without Q disagrees with the table somewhere', plantDis > 0, `${plantDis} node-layers`);

console.log('=========== D. THE CHOOSER USES IT ===========');
ok('D  the moves\' scores at the opening differ on and off', moved > 0 || !stepYears.includes(0), stepYears.includes(0) ? `${moved} move-worlds moved` : 'year 0 is not a step year: read in C at the step years');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
