/*
 * PR31, THE CHOOSER'S SPLIT UNDER THE ADAPTIVE REFERENCE'S EXACT STEPS (PLAN.md PR31; the deep review after REF-STEP,
 * deep-review-log.md 20 Oct 10:31 UK: the split should be the reference's own threshold at the grown state, as adaptive.js's
 * expectSplit finds it, with a unit test planted on an ISA-less household holding gains, the chooser's one-step value
 * against the fine rule within tolerance). Under the package (the adaptive reference, its fix, the RS split, `stepAll`)
 * next year's read is 0 below the reference's own threshold A*_{t+1}(b, gf), which moves with the gain fraction where the
 * money sits in the taxable account; stepAtOf now hands stepExpect that threshold at the grown state (solve.js stepThrOf).
 * On S370 with its ISAs moved into the taxable account (no ISA: the share b 0), at `points`, under the package with e3pcls
 * off (as adaptive-step.test.mjs: its tables are bit for bit those with it on), at every year before a bridge year with a
 * step, at the grid's states with b at its first node and every gain node, holding the plan's tiers, in every world:
 *   S  setup: the package built with stepAll; b's first node is 0; some year's A*_{t+1} at b 0 is not the untaxed bill
 *      less 1 (the old split) at some gain node
 *   C  at two slices of states: GRID, the grid's (every wealth and pension-share node, b's first node, every gain node), and
 *      NEAR, states built around the threshold (a GRID state's pension and gain node, no ISA, accessible money the year's
 *      bill plus A*_{t+1} x e^x, x from -0.3 to 0.3 in 25 steps, every gain node above 0): the grid's states almost never
 *      put the grown money between the old split and A*_{t+1} (the first run: the plant's worst miss was the fix's, at a
 *      gain node where the two agree; the deep review after REF-STEP found no visited state there either), so the plant is
 *      judged on NEAR. Where the split acts (the grown money clears A*_{t+1} at z = 9 and not at z = -9), each move's score
 *      within TOL = 0.001 of the same score over 4,000 equal-probability returns (solver-q-tsj.test.mjs's dense view);
 *      where it does not act, the moves' scores equal the points' scores to the bit
 *   P  planted, on NEAR: the old split (a view whose stepAll is off for stepAtOf alone, so the split falls back to the
 *      untaxed bill less 1 while the reference's reads are unchanged) misses the dense score by more than 2 TOL on some move
 *      where the split acts
 *   M  the margins, printed: TOL over the fix's worst miss, and the plant's worst miss over TOL
 *   node research/tests/pr31-split.test.mjs [points=4]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solvePlan, scoreMoves } from '../../src/solver/solve.js';
import { toVec } from '../../src/solver/grid.js';
import { CANDIDATE_OPTS, candidatePlan } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const PTS = Number(process.argv[2] || 4), LAMBDA = 0.0223606797749979, TOL = 0.001;
const PACKAGE = { readerRef: 'adaptive', adaptiveLattice: { na: 160, nb: 41, nz: 128, foot: true, stepAll: true }, readerSplit: 'rs' };
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
// S370 with no ISA: each owner's ISA balances moved into that owner's taxable account (Other Investments)
const household = () => {
  const p = JSON.parse(JSON.stringify(buildScenarios().find(s => s.id === 'S370').plan));
  for (const who of new Set(p.accounts.map(a => a.owner))) {
    const mine = p.accounts.filter(a => a.owner === who), isa = mine.filter(a => /ISA/.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
    if (!(isa > 0)) continue;
    const gia = mine.find(a => /^Other Investments/.test(a.category));
    gia.balance = E.num(gia.balance, 0) + isa;
    for (const a of mine) if (/ISA/.test(a.category)) a.balance = 0;
  }
  return p;
};
const hh = household();
const plan = candidatePlan(E, prep(hh));
const isaLeft = hh.accounts.filter(a => /ISA/.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
const o = { ...CANDIDATE_OPTS, e3pcls: false, ...PACKAGE, lambda: LAMBDA, points: PTS };
const t0 = Date.now();
const on = solvePlan(E, M, plan, o);
const g = on.g, K = on.worlds.length, n = on.actions.length, T = on.m.ctx.totalYears, ad = g.reader && g.reader.adaptive;
console.log(`S370 without its ISAs (ISA left ${isaLeft}) under the package at ${PTS} points: solved in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
const readerYears = Array.from(g.reader.years).map((v, i) => (v ? i : -1)).filter(i => i >= 0);
const oldSplit = (L) => { const RD = g.reader.of.get(L), sch = RD && RD.chance && RD.chance.schedule; return sch && sch.bills.length ? sch.bills[0] - 1 : null; };
const stepYears = readerYears.filter(y => y >= 1 && y - 1 < T && ad && ad.ref.astarAt(y, 0, g.gain[g.gain.length - 1]) > 0).map(y => y - 1);
let differ = 0, differNote = '';
for (const t of stepYears) for (const gf of g.gain) { const a = ad.ref.astarAt(t + 1, 0, gf), b = oldSplit(on.worlds[0].lsurv[t + 1]); if (b !== null && Math.abs(a - b) > 1) { differ++; if (!differNote) differNote = `year ${t + 1} gain ${gf.toFixed(3)}: A* ${a.toFixed(0)} against the old split ${b.toFixed(0)}`; } }
ok('S  the package built with stepAll, b\'s first node 0, step years present, and A* at b 0 not the old split somewhere',
  !!(ad && ad.lattice && ad.lattice.stepAll) && on.stepExact === true && isaLeft === 0 && g.axes.b && g.axes.b.pts[0] === 0 && stepYears.length > 0 && differ > 0,
  `stepAll ${!!(ad && ad.lattice && ad.lattice.stepAll)}, reader years ${readerYears.join(', ')}, step years ${stepYears.join(', ')}, gain nodes ${g.gain.length}, ${differ} year-gain cells differ (${differNote})`);

// the dense reference and the views (solver-q-tsj.test.mjs's): each view gets its own scratch
const PhiInv = q => { const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572], c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]; const pl = 0.02425; if (q < pl) { const r = Math.sqrt(-2 * Math.log(q)); return (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } if (q > 1 - pl) { const r = Math.sqrt(-2 * Math.log(1 - q)); return -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } const r = q - 0.5, r2 = r * r; return (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * r / (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1); };
const DN = 4000, DZ = Array.from({ length: DN }, (_, i) => PhiInv((i + 0.5) / DN)), DW = new Array(DN).fill(1 / DN);
const fresh_ = { _post: null, _grown: null, _rd: null, _sx: null, _sxR: null, _fx: null, _fxR: null, _sc: null, _tx: null, _bq: null, _scm: null, _txm: null, _bqm: null, _sc2: null };
const rateAt = (act, t, z) => { const x = new Float64Array(4); for (let i = 0; i < 4; i++) x[i] = Math.exp(Math.log(1 + act.real[i]) + act.volEffAt[t][i] * z) - 1; return x; };
const denseView = (w, t) => { const nro = w.nodeRealOfAt.slice(); nro[t] = w.actions.map((_, ai) => DZ.map(z => rateAt(w.c.acts[ai], t, z))); return { ...w, nodeRealOfAt: nro, quadWeights: DW, stepExact: false, ...fresh_ }; };
// planted: stepAtOf sees stepAll off and falls back to the old split; the reference's reads (built with stepAll) are unchanged
const gOld = { ...g, reader: { ...g.reader, adaptive: { ...ad, lattice: { ...ad.lattice, stepAll: false } } } };
const oldView = (w) => ({ ...w, g: gOld, ...fresh_ });
const scores = (w, s, t, held) => { const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n); scoreMoves({ ...w, ...fresh_ }, Float64Array.from(s), t, SC, TX, BQ, held); return SC; };
const HELD0 = { pen: 0, isa: 0, gia: 0 };
// where the split acts: the move's flow and switch charge, grown at z = -9 and 9 (realAt, no path shift), against A*_{t+1}
const clears = (w, ai, s, t, z) => { const post = Float64Array.from(s); F.flow(w.c, t, ai, post); F.chargeSwitch(w.c, post, HELD0, w.c.acts[ai], t); F.grow(w.c, t, post, rateAt(w.c.acts[ai], t, z)); const A2 = post[1] + post[2]; return A2 >= ad.ref.astarAt(t + 1, A2 > 0 ? post[1] / A2 : 0, post[3]); };

console.log('=========== C, P, M. THE CHOOSER AT THE GRID\'S ISA-LESS STATES, HOLDING THE PLAN\'S TIERS ===========');
const S0 = { worstFix: 0, worstPlant: 0, worstIdle: 0, acts: 0, idle: 0, flowed: 0, where: '', wherePlant: '' }, R = { GRID: { ...S0 }, NEAR: { ...S0 } };
const XS = Array.from({ length: 25 }, (_, i) => -0.3 + 0.025 * i);
const t1 = Date.now();
for (const t of stepYears) {
  const it = 0, states = [], bill = oldSplit(on.worlds[0].lsurv[t]) + 1, ipM = Math.floor(g.np / 2), iiM = Math.floor(g.ni / 2);
  for (let ip = 0; ip < g.np; ip++) for (let ii = 0; ii < g.ni; ii++) for (let ig = 0; ig < g.gain.length; ig++) states.push(['GRID', `year ${t} node ${ip}/${ii} gain ${ig}`, toVec(g, ip, ii, it, ig, 0, new Float64Array(7), t)]);
  for (let ig = 1; ig < g.gain.length; ig++) for (const x of XS) {
    const s = toVec(g, ipM, iiM, it, ig, 0, new Float64Array(7), t), a = ad.ref.astarAt(t + 1, 0, g.gain[ig]);
    if (!(a > 0) || !Number.isFinite(bill)) continue;
    s[1] = 0; s[2] = bill + a * Math.exp(x);
    states.push(['NEAR', `year ${t} gain ${ig} x ${x.toFixed(3)}`, s]);
  }
  for (const [sl, name, s] of states) for (let k = 0; k < K; k++) {
    const Rs = R[sl];
    const w = on.worlds[k], sFix = scores(w, s, t, HELD0), sD = scores(denseView(w, t), s, t, HELD0), sOld = scores(oldView(w), s, t, HELD0), sFive = scores({ ...w, stepExact: false }, s, t, HELD0);
    for (let ai = 0; ai < n; ai++) {
      if (!Number.isFinite(sD[ai])) continue;
      Rs.flowed++;
      if (!clears(w, ai, s, t, -9) && clears(w, ai, s, t, 9)) {
        Rs.acts++;
        const e = Math.abs(sFix[ai] - sD[ai]), ep = Math.abs(sOld[ai] - sD[ai]);
        if (e > Rs.worstFix) { Rs.worstFix = e; Rs.where = `${name}, world ${k}, ${on.actions[ai].label}`; }
        if (ep > Rs.worstPlant) { Rs.worstPlant = ep; Rs.wherePlant = `${name}, world ${k}, ${on.actions[ai].label}`; }
      } else { Rs.idle++; if (!(sFix[ai] === sFive[ai])) Rs.worstIdle = Math.max(Rs.worstIdle, Math.abs(sFix[ai] - sFive[ai]) || Infinity); }
    }
  }
}
for (const [sl, Rs] of Object.entries(R)) {
  console.log(`  ${sl}: ${Rs.flowed} move-states read: the split acts on ${Rs.acts}, hands back on ${Rs.idle}`);
  ok(`C  ${sl}: where the split acts, every move's score within TOL of the 4,000-return score`, Rs.acts > 0 && Rs.worstFix <= TOL, `${Rs.acts} move-states, the worst ${Rs.worstFix.toExponential(3)} (${Rs.where})`);
  ok(`C  ${sl}: where it does not act, the scores are the points' to the bit`, Rs.idle > 0 && Rs.worstIdle === 0, `${Rs.idle} move-states, the largest difference ${Rs.worstIdle}`);
}
console.log(`  read in ${((Date.now() - t1) / 1000).toFixed(0)} s`);
ok('P  planted, on NEAR: the old split misses the 4,000-return score by more than 2 TOL where the split acts', R.NEAR.worstPlant > 2 * TOL, `the worst ${R.NEAR.worstPlant.toExponential(3)} (${R.NEAR.wherePlant}); on GRID ${R.GRID.worstPlant.toExponential(3)}`);
console.log(`M  the margins (printed): TOL over the fix's worst miss, GRID ${(TOL / Math.max(R.GRID.worstFix, 1e-12)).toFixed(1)}, NEAR ${(TOL / Math.max(R.NEAR.worstFix, 1e-12)).toFixed(1)}; the plant's worst on NEAR over TOL ${(R.NEAR.worstPlant / TOL).toFixed(1)}`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
