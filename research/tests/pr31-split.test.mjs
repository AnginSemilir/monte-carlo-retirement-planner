/*
 * PR31, THE CHOOSER'S SPLIT UNDER THE ADAPTIVE REFERENCE'S EXACT STEPS (PLAN.md PR31; the deep review after REF-STEP,
 * deep-review-log.md 20 Oct 10:31 UK: the split should be the reference's own threshold at the grown state, as adaptive.js's
 * expectSplit finds it, with a unit test planted on an ISA-less household holding gains, the chooser's one-step value
 * against the fine rule within tolerance). Under the package (the adaptive reference, its fix, the RS split, `stepAll`)
 * next year's read is 0 below the reference's own threshold A*_{t+1}(b, gf), which moves with the gain fraction where the
 * money sits in the taxable account; stepAtOf hands stepExpect that threshold at the grown state (solve.js stepThrOf).
 * Revised after the design review of 20 Oct 13:40 UK (deep-review-log.md; not gate-ready at blob 8692a02e316f), its steps
 * 1 to 4 and 6.
 *
 * SCOPE: S370 with its ISAs moved into the taxable account (no ISA: the share b 0, so faults in b itself are out of
 * reach), at `points` (4 by default; a 30-point run is advised), e3pcls off (as adaptive-step.test.mjs: its tables are bit
 * for bit those with it on), the forward chooser (scoreMoves) holding the plan's tiers, in every world. The backward pass
 * calls the same stepAtOf and stepExpect (solve.js l.920, l.996-1206) and is not read here.
 * THE STATES, at every year t whose next year is a reader year:
 *   GRID  the grid's: every wealth and pension-share node, b's first node (0), every gain node
 *   NEAR  built around the threshold: a GRID state's pension and gain node (above the first), no ISA, accessible money the
 *         year's bill plus A*_{t+1} x e^x, x from -0.3 to 0.3 in 25 steps; only in years whose own bill is positive (in an
 *         inflow year the money after the flow is past the inflow, far above any threshold: no reachable state) and whose
 *         next year has a step. The grid's states almost never put the grown money between two candidate thresholds (the
 *         first run), so the plants are judged on NEAR as well as GRID.
 * THE TOLERANCE: TOL = 0.002, by the rule stated here before the plants were re-read (the design review, Q3): twice the
 * clean maximum, rounded up to one significant figure. The clean maximum is 9.120e-4 (results-pr31-split.txt, NEAR, year
 * 2, gain node 2, x 0.225, world 0; a finer x grid there, 0.0025 apart from 0.15 to 0.30, found none larger, and the
 * 4,000- and 20,000-return references agree within 2.6e-5 there: the miss is stepExpect's own 12-point Gauss-Legendre on
 * a kinked integrand, not the reference; the grid's gain snap ruled out, gainInterp moving it by under 2e-6). The first
 * runs used TOL 0.001 (blob 8692a02e316f).
 * THE CHECKS:
 *   S  setup: the package built with stepAll; b's first node 0; some year's A*_{t+1} at b 0 is not the old split
 *   C  where the split acts (the grown money clears A*_{t+1} at its own grown state at z = 9 and not at z = -9), each move's
 *      score within TOL of the same score over 4,000 equal-probability returns (solver-q-tsj.test.mjs's dense view), on
 *      GRID and on NEAR; where it does not act, the scores equal the points' to the bit (in a year whose next year has no
 *      step, year 3 here, the fix keeps its points)
 *   X  THE PLACEMENT, exactly (no clean error): where the split acts, the move scored alone with every reader read logged
 *      (grid.js READER_PROBE): its 24 reads of next year, the first 12 (the lower segment) below A*_{t+1} at each read's own
 *      grown state and the last 12 at or above it
 *   P  four planted placement faults, each caught by X (a read on the wrong side), by a miss over 2 TOL where the split
 *      acts, or, where the fix keeps its points, by a score that is not the points' (each prints its counts):
 *        OLD   the untaxed bill less 1 (a view whose stepAll is off for stepAtOf alone)
 *        YEAR  year t's threshold for year t + 1 (astarAt wrapped on a copy of the reference; the reads are its own)
 *        SWAP  b and the gain fraction swapped
 *        PRE   the threshold at the post-flow state before growth (scored one move at a time, with that move's post-flow
 *              share and gain fraction)
 *   M  the margins, a check: TOL over the fix's worst miss at least 2 on GRID and on NEAR
 *   node research/tests/pr31-split.test.mjs [points=4]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solvePlan, scoreMoves } from '../../src/solver/solve.js';
import { toVec, READER_PROBE } from '../../src/solver/grid.js';
import { CANDIDATE_OPTS, candidatePlan } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const PTS = Number(process.argv[2] || 4), LAMBDA = 0.0223606797749979, TOL = 0.002;
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
const years = readerYears.filter(y => y >= 1 && y - 1 < T).map(y => y - 1);
const hasStep = t => g.gain.some(gf => ad.ref.astarAt(t + 1, 0, gf) > 0);
let differ = 0, differNote = '';
for (const t of years) for (const gf of g.gain) { const a = ad.ref.astarAt(t + 1, 0, gf), b = oldSplit(on.worlds[0].lsurv[t + 1]); if (a > 0 && b !== null && Math.abs(a - b) > 1) { differ++; if (!differNote) differNote = `year ${t + 1} gain ${gf.toFixed(3)}: A* ${a.toFixed(0)} against the old split ${b.toFixed(0)}`; } }
ok('S  the package built with stepAll, b\'s first node 0, and A* at b 0 not the old split somewhere',
  !!(ad && ad.lattice && ad.lattice.stepAll) && on.stepExact === true && isaLeft === 0 && g.axes.b && g.axes.b.pts[0] === 0 && years.length > 0 && differ > 0,
  `stepAll ${!!(ad && ad.lattice && ad.lattice.stepAll)}, reader years ${readerYears.join(', ')}, years scored ${years.join(', ')} (with a step next year: ${years.filter(hasStep).join(', ')}), gain nodes ${g.gain.length}, ${differ} year-gain cells differ (${differNote})`);

// the dense reference and the views (solver-q-tsj.test.mjs's): each view gets its own scratch
const PhiInv = q => { const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572], c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]; const pl = 0.02425; if (q < pl) { const r = Math.sqrt(-2 * Math.log(q)); return (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } if (q > 1 - pl) { const r = Math.sqrt(-2 * Math.log(1 - q)); return -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } const r = q - 0.5, r2 = r * r; return (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * r / (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1); };
const DN = 4000, DZ = Array.from({ length: DN }, (_, i) => PhiInv((i + 0.5) / DN)), DW = new Array(DN).fill(1 / DN);
const fresh_ = { _post: null, _grown: null, _rd: null, _sx: null, _sxR: null, _fx: null, _fxR: null, _sc: null, _tx: null, _bq: null, _scm: null, _txm: null, _bqm: null, _sc2: null };
const rateAt = (act, t, z) => { const x = new Float64Array(4); for (let i = 0; i < 4; i++) x[i] = Math.exp(Math.log(1 + act.real[i]) + act.volEffAt[t][i] * z) - 1; return x; };
const denseView = (w, t) => { const nro = w.nodeRealOfAt.slice(); nro[t] = w.actions.map((_, ai) => DZ.map(z => rateAt(w.c.acts[ai], t, z))); return { ...w, nodeRealOfAt: nro, quadWeights: DW, stepExact: false, ...fresh_ }; };
// the plants: OLD a view whose stepAll is off for stepAtOf alone; YEAR, SWAP and PRE the reference's astarAt wrapped on a copy
// (stepThrOf reads g.reader.adaptive.ref when called; the reads use the reference's own closure, unchanged)
const gOf = (ref, lattice = ad.lattice) => ({ ...g, reader: { ...g.reader, adaptive: { ...ad, ref, lattice } } });
const astar = ad.ref.astarAt;
const G = {
  OLD: gOf(ad.ref, { ...ad.lattice, stepAll: false }),
  YEAR: gOf({ ...ad.ref, astarAt: (tn, b, gf) => astar(tn - 1, b, gf) }),
  SWAP: gOf({ ...ad.ref, astarAt: (tn, b, gf) => astar(tn, gf, b) }),
};
const gPre = (bPre, gfPre) => gOf({ ...ad.ref, astarAt: (tn) => astar(tn, bPre, gfPre) });
const view = (w, gg) => ({ ...w, g: gg, ...fresh_ });
const scores = (w, s, t, held) => { const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n); scoreMoves({ ...w, ...fresh_ }, Float64Array.from(s), t, SC, TX, BQ, held); return SC; };
const HELD0 = { pen: 0, isa: 0, gia: 0 };
// one move scored alone (scoreMoves' variant), every reader read of year t + 1 logged
const one = (w, ai, s, t) => {
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), reads = [];
  READER_PROBE.fn = (W, IDX, NC, RD, pr, yr, acc, st) => { if (yr === t + 1) reads.push({ acc, b: acc > 0 ? st[1] / acc : 0, gf: st[3] }); };
  try { scoreMoves({ ...w, ...fresh_ }, Float64Array.from(s), t, SC, TX, BQ, HELD0, { ai, act: w.c.acts[ai], nr: w.nodeRealOfAt[t][ai] }); } finally { READER_PROBE.fn = null; }
  return { sc: SC[ai], reads };
};
// X: 24 reads, the lower 12 below the reference's own threshold at each read's grown state, the upper 12 at or above it
const placed = reads => { if (reads.length !== 24) return { n: reads.length, wrong: -1 }; let wrong = 0; reads.forEach((r, i) => { const below = r.acc < astar(1 + Tread, r.b, r.gf); if (i < 12 ? !below : below) wrong++; }); return { n: 24, wrong }; };
let Tread = 0;
const postOf = (w, ai, s, t) => { const post = Float64Array.from(s); F.flow(w.c, t, ai, post); F.chargeSwitch(w.c, post, HELD0, w.c.acts[ai], t); return post; };
const clears = (w, ai, s, t, z) => { const post = postOf(w, ai, s, t); F.grow(w.c, t, post, rateAt(w.c.acts[ai], t, z)); const A2 = post[1] + post[2]; return A2 >= astar(t + 1, A2 > 0 ? post[1] / A2 : 0, post[3]); };

console.log('=========== C, X, P, M. THE CHOOSER AT THE ISA-LESS STATES, HOLDING THE PLAN\'S TIERS ===========');
const XS = Array.from({ length: 25 }, (_, i) => -0.3 + 0.025 * i), PL = ['OLD', 'YEAR', 'SWAP', 'PRE'];
const R = {}, P = {}, nearBy = {};
for (const sl of ['GRID', 'NEAR']) R[sl] = { acts: 0, idle: 0, worst: 0, where: '', idleOff: 0, xRead: 0, xWrong: 0, xShort: 0 };
for (const p of PL) P[p] = { acts: 0, differ: 0, worst: 0, where: '', wrong: 0, idleDiffer: 0 };
const t1 = Date.now();
for (const t of years) {
  Tread = t;
  const states = [], bill = oldSplit(on.worlds[0].lsurv[t]) + 1, ipM = Math.floor(g.np / 2), iiM = Math.floor(g.ni / 2);
  for (let ip = 0; ip < g.np; ip++) for (let ii = 0; ii < g.ni; ii++) for (let ig = 0; ig < g.gain.length; ig++) states.push(['GRID', `year ${t} node ${ip}/${ii} gain ${ig}`, toVec(g, ip, ii, 0, ig, 0, new Float64Array(7), t)]);
  if (bill > 0 && hasStep(t)) for (let ig = 1; ig < g.gain.length; ig++) for (const x of XS) {
    const s = toVec(g, ipM, iiM, 0, ig, 0, new Float64Array(7), t), a = astar(t + 1, 0, g.gain[ig]);
    if (!(a > 0)) continue;
    s[1] = 0; s[2] = bill + a * Math.exp(x);
    states.push(['NEAR', `year ${t} gain ${ig} x ${x.toFixed(3)}`, s]); nearBy[t] = (nearBy[t] || 0) + 1;
  }
  for (const [sl, name, s] of states) for (let k = 0; k < K; k++) {
    const w = on.worlds[k], Rs = R[sl];
    const sFix = scores(w, s, t, HELD0), sD = scores(denseView(w, t), s, t, HELD0), sFive = scores({ ...w, stepExact: false }, s, t, HELD0);
    const sP = { OLD: scores(view(w, G.OLD), s, t, HELD0), YEAR: scores(view(w, G.YEAR), s, t, HELD0), SWAP: scores(view(w, G.SWAP), s, t, HELD0) };
    for (let ai = 0; ai < n; ai++) {
      if (!Number.isFinite(sD[ai])) continue;
      const here = `${name}, world ${k}, ${on.actions[ai].label}`, post = postOf(w, ai, s, t), A1 = post[1] + post[2];
      const sPre = one(view(w, gPre(A1 > 0 ? post[1] / A1 : 0, post[3])), ai, s, t);
      const all = { ...Object.fromEntries(Object.entries(sP).map(([p, v]) => [p, v[ai]])), PRE: sPre.sc };
      if (!clears(w, ai, s, t, -9) && clears(w, ai, s, t, 9)) {
        Rs.acts++;
        const e = Math.abs(sFix[ai] - sD[ai]);
        if (e > Rs.worst) { Rs.worst = e; Rs.where = here; }
        const fx = placed(one(w, ai, s, t).reads); Rs.xRead++; if (fx.wrong < 0) Rs.xShort++; else Rs.xWrong += fx.wrong;
        for (const p of PL) {
          const Pp = P[p]; Pp.acts++;
          if (all[p] !== sFix[ai]) Pp.differ++;
          const ep = Math.abs(all[p] - sD[ai]); if (ep > Pp.worst) { Pp.worst = ep; Pp.where = here; }
          const gp = p === 'PRE' ? gPre(A1 > 0 ? post[1] / A1 : 0, post[3]) : G[p], px = placed(one(view(w, gp), ai, s, t).reads);
          if (px.wrong > 0) Pp.wrong += px.wrong;
        }
      } else {
        Rs.idle++; if (!(sFix[ai] === sFive[ai])) Rs.idleOff++;
        for (const p of PL) if (!(all[p] === sFive[ai])) P[p].idleDiffer++;
      }
    }
  }
}
console.log(`  read in ${((Date.now() - t1) / 1000).toFixed(0)} s; NEAR states by year: ${Object.entries(nearBy).map(([t, c]) => `year ${t} ${c}`).join(', ')}`);
for (const [sl, Rs] of Object.entries(R)) {
  console.log(`  ${sl}: the split acts on ${Rs.acts} move-states, hands back on ${Rs.idle}`);
  ok(`C  ${sl}: where the split acts, every move's score within TOL of the 4,000-return score`, Rs.acts > 0 && Rs.worst <= TOL, `${Rs.acts} move-states, the worst ${Rs.worst.toExponential(3)} (${Rs.where})`);
  ok(`C  ${sl}: where it does not act, the scores are the points' to the bit`, Rs.idle > 0 && Rs.idleOff === 0, `${Rs.idle} move-states, ${Rs.idleOff} differ`);
  ok(`X  ${sl}: where the split acts, every one of its 24 reads on its side of the reference's threshold at its own grown state`, Rs.xRead > 0 && Rs.xShort === 0 && Rs.xWrong === 0, `${Rs.xRead} move-states read, ${Rs.xWrong} reads on the wrong side, ${Rs.xShort} without 24 reads`);
  ok(`M  ${sl}: TOL over the fix's worst miss at least 2`, Rs.worst > 0 && TOL / Rs.worst >= 2, `${(TOL / Math.max(Rs.worst, 1e-12)).toFixed(2)}`);
}
for (const p of PL) {
  const Pp = P[p], caught = Pp.wrong > 0 || Pp.worst > 2 * TOL || Pp.idleDiffer > 0;
  ok(`P  planted ${p}: caught`, caught, `where the split acts: ${Pp.acts} move-states, the plant's score differs from the fix's on ${Pp.differ}, ${Pp.wrong} reads on the wrong side (X), the worst miss ${Pp.worst.toExponential(3)} = ${(Pp.worst / TOL).toFixed(2)} TOL (${Pp.where}); where the fix keeps its points, ${Pp.idleDiffer} plant scores not the points'`);
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
