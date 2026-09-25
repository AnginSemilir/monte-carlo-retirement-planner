/*
 * THE BRIDGE READER IN THE SOLVER (`bridgeRead: 'reader'`; src/solver/reader.js, grid.js readValues; drafts/reader-design.md
 * checks 2 to 4). Written 25 Sep before 7e's prediction, which cites it.
 *   1. Node reproduction: at every node of every reader table (each bridge year, each world), the read at the node's own
 *      position gives back the survival the table holds, within 1e-9. Planted, each through readValues: the residual
 *      dropped, and p taken as 1 (the position's own reference ignored), must each miss somewhere by more than the check's
 *      own 1e-9. (On S126 at 4 points the residual is at most the clamp, 1.0e-6, so the first run's version of the
 *      dropped-residual fault, judged at 1e-3, looked like nothing to catch; at the check's own tolerance it is caught -
 *      the forty-sixth review.) A synthetic row where the residual carries value (S above p) checks buildReaderTable's
 *      split by hand, not the read.
 *   2. The trap (the outside reviewer's counterexample): two nodes on a share row holding 0.4 (can pay) and 0 (cannot), a
 *      query three quarters of the way to the second that can pay reads 0.40, not 0.85. Planted: the unit template (c = 1
 *      where supported, so the residual carries S - p) must read 0.85 there and fail.
 *   3. Outside bridge years bit for bit: on S126, every world's survival and bequest tables from the last bridge year on
 *      equal the same solve without the reader; on S000 (retired at 68, no bridge) the reader builds no table and every
 *      table is equal. Planted: the bridge years' tables must differ (the check is not comparing a solve with itself).
 *   5. The reference's growth convention, against the solver's own growth rule (added 25 Sep evening; below).
 *   node research/tests/reader-solve.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { readValues, toVec } from '../../src/solver/grid.js';
import { buildReaderTable } from '../../src/solver/reader.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const all = buildScenarios();
const prep = id => { const sc = all.find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } })); };
const OPTS = { lambda: 0.0223606797749979, points: 4, riskAbove: true };

// 2. the trap, on a two-node share row (no solve needed)
{
  const g = { mode: 'total', np: 1, ni: 2, nt: 1, gain: [0], pcls: [0], size: 2, m: { P: { lsa: 268275 } },
    axes: { W: { pts: [100000] }, a: { pts: [0.8, 1.0] }, b: { pts: [0.5] } }, index: (i1, i2) => i1 + i2 };
  const chance = A => (A >= 10000 ? 1 : 0);                 // node 0 (A = 20,000) can pay; node 1 (A = 0) cannot
  const S = Float64Array.from([0.4, 0]);
  const tb = buildReaderTable(g, S, chance);
  const w1 = 0.75, read = (c, R) => 1 * ((1 - w1) * c[0] + w1 * c[1]) + ((1 - w1) * R[0] + w1 * R[1]);
  ok(Math.abs(read(tb.c, tb.R) - 0.4) < 1e-12, `the trap: a query that can pay, three quarters toward the dead node, reads ${read(tb.c, tb.R).toFixed(2)} (c ${Array.from(tb.c).join('/')}, R ${Array.from(tb.R).join('/')})`);
  const cu = Float64Array.from([1, 1]), Ru = Float64Array.from([S[0] - 1, S[1] - 0]);
  ok(Math.abs(read(cu, Ru) - 0.85) < 1e-12 && Math.abs(read(cu, Ru) - 0.4) > 0.1, `planted: the unit template reads ${read(cu, Ru).toFixed(2)} there and fails the 0.40 check`);
  const v = new Float64Array(7); toVec(g, 0, 1, 0, 0, 0, v);
  ok(v[1] + v[2] === 0 && tb.p[1] === 0 && tb.p[0] === 1, 'the fake row is what it says: the second node has no accessible money');
  // the residual's role: survival above the reference (0.9 where p is 0.6; 0.3 where nothing can pay) sits in R
  const chance2 = A => (A >= 10000 ? 0.6 : 0), S2 = Float64Array.from([0.9, 0.3]), t2 = buildReaderTable(g, S2, chance2);
  const at = (i, dropR) => t2.p[i] * t2.c[i] + (dropR ? 0 : t2.R[i]);
  ok(Math.abs(at(0, false) - 0.9) < 1e-12 && Math.abs(at(1, false) - 0.3) < 1e-12, `buildReaderTable's split, by hand: a row with survival above the reference reproduces both nodes (c ${Array.from(t2.c).join('/')}, R ${Array.from(t2.R).map(x => x.toFixed(2)).join('/')})`);
  ok(Math.abs(at(0, true) - 0.9) > 1e-3 && Math.abs(at(1, true) - 0.3) > 1e-3, `planted: with the residual dropped the same nodes read ${at(0, true).toFixed(2)} and ${at(1, true).toFixed(2)}, and fail`);
}

// 1 and 3 on S126 (a bridge before pension access)
const plan = prep('S126');
const off = solvePlan(E, M, plan, { ...OPTS, bridgeRead: false });
const rdr = solvePlan(E, M, plan, { ...OPTS, bridgeRead: 'reader' });
ok(rdr.meta.bridgeRead === 'reader' && rdr.meta.reader && rdr.meta.reader.tables > 0, `S126 solves with the reader (meta.bridgeRead ${rdr.meta.bridgeRead}, ${rdr.meta.reader && rdr.meta.reader.tables} tables, ${rdr.meta.reader && rdr.meta.reader.unsupported} unsupported nodes)`);
const g = rdr.g, rd = new Float64Array(4), v = new Float64Array(7);
let worst = 0, worstPlanted = 0, worstDropped = 0, nodes = 0, maxR = 0, withR = 0;
for (const [ls, T] of g.reader.of) {
  for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
    const i = g.index(ip, ii, it, ig, ic);
    toVec(g, ip, ii, it, ig, ic, v);
    readValues(g, ls, ls, v, rd, null, null, T.t);
    const held = 1 / (1 + Math.exp(-ls[i]));
    worst = Math.max(worst, Math.abs(rd[0] - held));
    const ch = T.chance; T.chance = () => 1; readValues(g, ls, ls, v, rd, null, null, T.t); T.chance = ch;
    worstPlanted = Math.max(worstPlanted, Math.abs(rd[0] - held));
    const Rk = T.R; T.R = new Float64Array(Rk.length); readValues(g, ls, ls, v, rd, null, null, T.t); T.R = Rk;
    worstDropped = Math.max(worstDropped, Math.abs(rd[0] - held));
    maxR = Math.max(maxR, Math.abs(T.R[i])); if (Math.abs(T.R[i]) > 1e-9) withR++;
    nodes++;
  }
}
ok(nodes > 0 && worst <= 1e-9, `node reproduction: ${nodes} nodes over ${g.reader.of.size} tables, largest miss ${worst.toExponential(1)}`);
ok(worstPlanted > 1e-9, `planted: with p taken as 1 the largest miss is ${worstPlanted.toFixed(3)}, and the check fails`);
ok(worstDropped > 1e-9, `planted: with the residual dropped the largest miss is ${worstDropped.toExponential(1)}, above the check's 1e-9, and the check fails`);
console.log(`      (diagnostic: the residual's largest size on S126 is ${maxR.toExponential(1)}, above 1e-9 at ${withR} of ${nodes} nodes)`);

// 5. The reference's growth convention (added 25 Sep evening, after the outside review's Finding 3): the solver grows each
// pot by exp(ln(1 + R) + V z) with one shared z (solve.js nodeRealOf), so R is the median. Each reference year's mean
// gross, e^{rho + v^2/2}, must equal the balance-weighted mean of that rule, integrated over z numerically (a 20,001-point
// trapezoid on [-10, 10]), within 1e-9. Planted: the old formula, ln(sum w (1 + R)) - v^2/2, must miss by more than 1e-4.
{
  const W = g.reader.weights, ai0 = rdr.actions.findIndex(a => !(a.tierPen > 0) && !(a.tierIsa > 0));
  let worst = 0, worstOld = 0, years = 0;
  for (const [, T] of g.reader.of) {
    const sc = T.chance.schedule, act = rdr.worlds[T.k].c.acts[ai0];
    for (let j = 0; j < sc.rho.length; j++) {
      const yr = sc.t + j, R = act.real, V = act.volEffAt[yr];
      let m = 0; const n = 20000, a = -10, h = 20 / n;
      for (let i = 0; i <= n; i++) {
        const z = a + i * h, phi = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI), wt = (i === 0 || i === n) ? 0.5 : 1;
        m += wt * h * phi * (W.isa * Math.exp(Math.log(1 + R[1]) + V[1] * z) + W.gia * Math.exp(Math.log(1 + R[2]) + V[2] * z) + W.cash * Math.exp(Math.log(1 + R[3]) + (V[3] || 0) * z));
      }
      const mine = Math.exp(sc.rho[j] + sc.vol[j] ** 2 / 2);
      const old = W.isa * (1 + R[1]) + W.gia * (1 + R[2]) + W.cash * (1 + R[3]);   // the old rho + v^2/2 gave back exactly this
      worst = Math.max(worst, Math.abs(mine - m)); worstOld = Math.max(worstOld, Math.abs(old - m)); years++;
    }
  }
  ok(years > 0 && worst <= 1e-9, `the reference's mean yearly growth matches the solver's rule on ${years} reference years (largest miss ${worst.toExponential(1)})`);
  ok(worstOld > 1e-4, `planted: the old formula (R taken as the mean) misses by up to ${worstOld.toFixed(4)} a year, and fails`);
}

const years = g.reader.years; let last = -1; for (let t = 0; t < years.length; t++) if (years[t]) last = t;
const same = (a, b) => a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
let equalAfter = true, differBefore = false;
for (let k = 0; k < rdr.worlds.length; k++) {
  const A = off.worlds[k], B = rdr.worlds[k];
  for (let t = 0; t < A.lsurv.length; t++) {
    const eq = same(A.lsurv[t], B.lsurv[t]) && same(A.beq[t], B.beq[t]);
    if (t >= last && !eq) equalAfter = false;
    if (t < last && !eq) differBefore = true;
  }
}
ok(last >= 0 && equalAfter, `S126: every world's survival and bequest tables from the last bridge year (${last}) on are bit for bit the solve without the reader`);
ok(differBefore, 'planted: the earlier bridge years\' tables differ, so the comparison is not a solve against itself');

// 3 on S000 (retired at 68: no bridge)
const p0 = prep('S000');
const off0 = solvePlan(E, M, p0, { ...OPTS, bridgeRead: false }), rdr0 = solvePlan(E, M, p0, { ...OPTS, bridgeRead: 'reader' });
let all0 = true;
for (let k = 0; k < rdr0.worlds.length; k++) for (let t = 0; t < off0.worlds[k].lsurv.length; t++) if (!same(off0.worlds[k].lsurv[t], rdr0.worlds[k].lsurv[t]) || !same(off0.worlds[k].beq[t], rdr0.worlds[k].beq[t]) || !same(off0.worlds[k].pol[t], rdr0.worlds[k].pol[t])) all0 = false;
ok(rdr0.meta.reader.tables === 0 && all0, `S000 (no bridge): the reader builds ${rdr0.meta.reader.tables} tables and every table and move is bit for bit the solve without it`);
console.log(`\nreader-solve: ${n} passed`);
