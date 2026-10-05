/*
 * COV-B, THE STEP-YEAR EDGE NODE (`coverage`; grid.js shareNode, shareLoc, readValues; solve.js; research/solver/items/COV.md
 * and items/RTAX.md). Each check with the planted fault it must catch:
 *   1. Refusals: coverage without the bridge reader, with e3 on, with holdTier; under coverage locateVec, interp,
 *      readValues and nearestIndex without the year. Planted: none (each refusal is the check).
 *   2. No reader year (S000): every table's slots 0-5 equal the solve without coverage slot for slot, and slot 6 equals
 *      slot 5 (the copy), in every year. Planted: on S130 some step-year slot must differ from its neighbours (the node
 *      carries a value of its own).
 *   3. The old nodes kept: on S130 (readerTax on both), every table at every old share node in every year from the step
 *      year on equals the solve without coverage, bit for bit (the node changes reads of the step year, not the year's own
 *      cells or later years). Planted: the year before the step year must differ somewhere (it reads the step year).
 *   4. Round trip: at every node of the step year, the row's share locate returns the node (weight 0 on the next slot, or
 *      weight 1 on the cell below), and a read at the node's own state gives back the node's survival. Planted: the read
 *      at a node through the non-step layout (the year after) must miss some node.
 *   5. The edge node is paid: with readerTax, at every inserted node every ISA share, gain and allowance bucket has a floor
 *      move that pays the year (an independent flow). Planted: the same states 2 below d0 - tol (the reference's own edge
 *      less the tolerance) must fail some.
 *   node research/tests/cov-b.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solvePlan, nearestIndex } from '../../src/solver/solve.js';
import { toVec, readValues, locateVec, interp, shareNode, shareLocOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const find = id => { const h = all.find(s => s.id === id); if (!h) throw new Error(`no case ${id}`); return h; };
const prep = h => E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const BASE = { lambda: 0.0223606797749979, points: 4, shares: 6, bridgeRead: 'reader', bequestWeight: 0.02, pclsInterp: true, e3: false, riskAbove: false, readerTax: true };
const solve = (plan, extra = {}) => solvePlan(E, M, plan, { ...BASE, ...extra });
let n = 0; const ok = (msg) => { n++; console.log(`  ok  ${msg}`); };
const TABS = r => [['surv', r.surv], ['beq', r.beq], ['resil', r.resil], ['pol', r.pol], ['short', r.short]];
// the slot on the coverage grid holding old share node ii (0-5) on row ip in year t
const slotOf = (g, ip, ii, t) => { for (let j = 0; j < g.ni; j++) if (shareNode(g, ip, j, t) === g.axes.a.pts[ii]) return j; throw new Error('old node missing'); };

// 1. refusals
const s130 = prep(find('S130'));
{
  assert.throws(() => solvePlan(E, M, s130, { ...BASE, bridgeRead: false, readerTax: false, coverage: true }), /coverage needs the bridge reader/);
  assert.throws(() => solve(s130, { coverage: true, e3: true }), /coverage needs the bridge reader, e3: false/);
  ok('1. coverage refuses no reader and e3 on');
}
const off = solve(s130), on = solve(s130, { coverage: true });
{
  const v = new Float64Array(7); toVec(on.g, 1, 1, 1, 0, 0, v, 0);
  assert.throws(() => locateVec(on.g, v), /locateVec has no year/);
  assert.throws(() => interp(on.g, on.surv[0], { p: { i: 0, w: 0 }, i: { i: 0, w: 0 }, t: { i: 0, w: 0 }, ig: 0, ic: 0 }, true), /interp has no year/);
  assert.throws(() => readValues(on.g, on.lsurv[0], on.beq[0], v, new Float64Array(4)), /readValues needs the year/);
  assert.throws(() => nearestIndex(on.g, v), /nearestIndex needs the year/);
  assert.throws(() => toVec(on.g, 1, 1, 1, 0, 0, v), /needs the year/);
  ok('1b. under coverage locateVec, interp, readValues, nearestIndex and toVec refuse without the year');
}
const stepYears = r => r.g.cov.years.map((x, t) => (x ? t : -1)).filter(t => t >= 0);

// 2. no reader year: identical slot for slot, slot 6 the copy; on S130 the node carries its own value (planted)
{
  const s000 = prep(find('S000')), a = solve(s000), b = solve(s000, { coverage: true });
  const g = b.g, T = b.m.ctx.totalYears;
  for (let t = 0; t <= T; t++) for (const [nm, arr] of TABS(b)) {
    const A = TABS(a).find(x => x[0] === nm)[1];
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ip = 0; ip < g.np; ip++) {
      for (let ii = 0; ii < 6; ii++) assert.equal(arr[t][g.index(ip, ii, it, ig, ic)], A[t][a.g.index(ip, ii, it, ig, ic)], `S000 ${nm} year ${t} slot ${ii}`);
      assert.equal(arr[t][g.index(ip, 6, it, ig, ic)], arr[t][g.index(ip, 5, it, ig, ic)], `S000 ${nm} year ${t}: slot 6 is not slot 5's copy`);
    }
  }
  const t = stepYears(on)[0], go = on.g;
  let own = false;
  for (let ip = 0; ip < go.np && !own; ip++) for (let ii = 1; ii < go.ni - 1 && !own; ii++) {
    const x = shareNode(go, ip, ii, t); if (go.axes.a.pts.includes(x)) continue;
    const v = on.surv[t][go.index(ip, ii, 0, 0, 0)], lo = on.surv[t][go.index(ip, ii - 1, 0, 0, 0)], hi = on.surv[t][go.index(ip, ii + 1, 0, 0, 0)];
    if (v !== lo && v !== hi) own = true;
  }
  assert.ok(own, 'planted: on S130 an inserted node must carry a value of its own');
  ok(`2. S000 identical slot for slot with slot 6 the copy (${T + 1} years); S130's node carries its own value (meta ${JSON.stringify(on.meta.coverage)})`);
}

// 3. the old nodes kept from the step year on; the year before differs (planted)
{
  const g = on.g, go = off.g, ts = stepYears(on), t0 = Math.min(...ts), T = on.m.ctx.totalYears;
  for (let t = t0; t <= T; t++) for (const [nm, arr] of TABS(on)) {
    const A = TABS(off).find(x => x[0] === nm)[1];
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ip = 0; ip < g.np; ip++) for (let ii = 0; ii < 6; ii++)
      assert.equal(arr[t][g.index(ip, slotOf(g, ip, ii, t), it, ig, ic)], A[t][go.index(ip, ii, it, ig, ic)], `S130 ${nm} year ${t} old node ${ii} row ${ip}`);
  }
  let differs = false;
  if (t0 > 0) for (let i = 0; i < off.surv[t0 - 1].length && !differs; i++) {
    const ip = i % g.np, ii = Math.floor(i / g.np) % 6, it = Math.floor(i / (g.np * 6)) % g.nt, rest = Math.floor(i / (g.np * 6 * g.nt));
    const ig = rest % g.gain.length, ic = Math.floor(rest / g.gain.length);
    if (on.beq[t0 - 1][g.index(ip, ii, it, ig, ic)] !== off.beq[t0 - 1][go.index(ip, ii, it, ig, ic)]) differs = true;
  }
  assert.ok(t0 === 0 || differs, 'planted: the year before the step year must differ somewhere');
  ok(`3. every table at every old node equal from step year ${t0} on; the year before differs`);
}

// 4. round trip at the step year's nodes; the non-step layout misses some node (planted)
{
  const g = on.g, t = stepYears(on)[0], v = new Float64Array(7);
  let back = 0, miss = 0, checked = 0;
  for (let ip = 0; ip < g.np; ip++) for (let ii = 0; ii < g.ni; ii++) {
    if (ii > 0 && shareNode(g, ip, ii, t) === shareNode(g, ip, ii - 1, t)) continue;
    const a = shareNode(g, ip, ii, t), l = shareLocOf(g, ip, a, t);
    const atNode = (l.i === ii && l.w === 0) || (l.i === ii - 1 && l.w === 1);
    assert.ok(atNode, `row ${ip} slot ${ii}: the locate returns slot ${l.i} weight ${l.w}`);
    toVec(g, ip, ii, 2, 0, 0, v, t);
    const read = readValues(g, on.lsurv[t], on.beq[t], v, new Float64Array(4), null, null, t);
    checked++;
    if (Math.abs(read[1] - on.beq[t][g.index(ip, ii, 2, 0, 0)]) <= 1e-9 * Math.max(1, Math.abs(on.beq[t][g.index(ip, ii, 2, 0, 0)]))) back++;
    const wrong = readValues(g, on.lsurv[t], on.beq[t], v, new Float64Array(4), null, null, t + 1);
    if (Math.abs(wrong[1] - on.beq[t][g.index(ip, ii, 2, 0, 0)]) > 1e-9 * Math.max(1, Math.abs(on.beq[t][g.index(ip, ii, 2, 0, 0)]))) miss++;
  }
  assert.equal(back, checked, `the read at a node gives back the node's bequest at ${back} of ${checked}`);
  assert.ok(miss > 0, 'planted: the non-step layout must miss some node');
  ok(`4. every step-year node locates to itself and reads back (${checked}); the non-step layout misses ${miss}`);
}

// 5. the edge node is paid at every share, gain and allowance bucket; 2 below the reference's edge fails some (planted)
{
  const g = on.g, cJ = F.compile(on.m, on.actions), lv = on.actions.map(a => (a.spendLevel !== undefined ? a.spendLevel : 1)), lo = Math.min(...lv);
  const floor = on.actions.map((a, i) => i).filter(i => lv[i] === lo), b = new Float64Array(7), v = new Float64Array(7);
  const pays = (t, s) => { for (const ai of floor) { for (let q = 0; q < 7; q++) b[q] = s[q]; const u = F.flow(cJ, t, ai, b); if (!(u > 1 || cJ.last.preNmpaInsolvent)) return true; } return false; };
  let paid = 0, nodes = 0, below = 0;
  for (const t of stepYears(on)) {
    const d0 = on.g.reader.chanceOf(0, t).schedule.bills[0];
    for (let ip = 0; ip < g.np; ip++) for (let ii = 0; ii < g.ni; ii++) {
      const a = shareNode(g, ip, ii, t); if (g.axes.a.pts.includes(a)) continue;
      const Wj = g.axes.W.pts[ip];
      for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) {
        toVec(g, ip, ii, it, ig, ic, v, t); nodes++; if (pays(t, v)) paid++;
        const A = d0 - 1 - 2, pen = Wj - A, isa = g.axes.b.pts[it] * A; v[0] = pen; v[1] = isa; v[2] = A - isa;
        if (!pays(t, v)) below++;
      }
    }
  }
  assert.ok(nodes > 0, 'some node was inserted');
  assert.equal(paid, nodes, `the edge node is paid at ${paid} of ${nodes} states`);
  assert.ok(below > 0, 'planted: 2 below the reference\'s edge must fail some state');
  ok(`5. every inserted node is paid at every share, gain and allowance bucket (${nodes}); 2 below the edge fails ${below}`);
}
console.log(`cov-b: ${n} checks passed`);
