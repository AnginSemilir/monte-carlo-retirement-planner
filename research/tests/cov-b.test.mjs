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
 * Added before COV-B-STEP's launch (the plan-auditor's BLOCKING 1 of 5 Oct 01:34 UK; the tests items/COV.md lists):
 *   6. nearestIndex (the stored policy's read) at every step-year node state returns a cell holding that state (its own
 *      index, or one of the cells holding the same state at W = 0 or a = 1), and the table there equals readValues' read at
 *      the state. Planted: nearestIndex through the non-step layout misses some node.
 *   7. The per-row read between nodes with both interpolated axes on (gainInterp and pclsInterp: all 32 corners): at 400
 *      random step-year states readValues' bequest equals an independent multilinear read - the wealth axis, each wealth
 *      row's share on that row's own nodes, the ISA share, the gain and allowance brackets. Planted: the same independent
 *      read on the six-node layout differs somewhere.
 *   8. The copy complete under the unit's own settings (tierState, jointWorlds): in every year, world and tier-state layer,
 *      every slot repeating the node below it equals that slot in every table (surv, lsurv, beq, resil, short, pol).
 *      Planted: slot 6 against slot 4 differs somewhere.
 *   9. Only step years carry nodes: every year with nodes passes the step test the build uses (every world's reference
 *      chance 1 at d0 - tol/2, 0 at d0 - 2 tol, one d0), and every reader year without nodes fails it - a spread year
 *      planted as a step year is refused by it. Planted: some reader year is a spread year (the test can refuse).
 *  10. Round trips: at a = 1 and at W = 0 the step-year read equals coverage off's (old nodes); 1e-12 either side of every
 *      node the locate is finite, its weight in [0, 1] and the read within 1e-12 times the steeper adjacent cell's slope
 *      (plus 1e-9) of the node's: continuous, however narrow the cell an edge node makes beside an old one. Planted: a read at a = 1 -
 *      1e-3 differs from the a = 1 node's somewhere.
 *  11. A supported read touches no unsupported node: on every row with an inserted edge node, a share between the node
 *      below and the edge locates to a cell whose upper slot is the edge, never above it. Planted: the six-node layout
 *      puts the upper node above the edge for some row.
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

// 6. nearestIndex at the step-year nodes; through the non-step layout it misses some node (planted)
{
  const g = on.g, t = stepYears(on)[0], v = new Float64Array(7), o4 = new Float64Array(4), w = new Float64Array(7), S = g.stride;
  // the state a flat index holds in year yr
  const stateOf = (idx, yr) => { const ic = Math.floor(idx / S.pcls), r1 = idx % S.pcls, ig = Math.floor(r1 / S.gain), r2 = r1 % S.gain, it = Math.floor(r2 / S.tax), r3 = r2 % S.tax, ii = Math.floor(r3 / S.isa), ip = r3 % S.isa; toVec(g, ip, ii, it, ig, ic, w, yr); return w; };
  const sameState = (idx, yr) => { const x = stateOf(idx, yr); for (let q = 0; q < 6; q++) if (Math.abs(x[q] - v[q]) > 1e-9 * Math.max(1, Math.abs(v[q]))) return false; return true; };
  let own = 0, checked = 0, miss = 0;
  for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ip = 0; ip < g.np; ip++) for (let ii = 0; ii < g.ni; ii++) {
    if (ii > 0 && shareNode(g, ip, ii, t) === shareNode(g, ip, ii - 1, t)) continue;
    toVec(g, ip, ii, it, ig, ic, v, t); checked++;
    const got = nearestIndex(g, v, t);
    if (sameState(got, t)) own++;
    const rd = readValues(g, on.lsurv[t], on.beq[t], v, o4, null, null, t)[1];
    assert.ok(Math.abs(on.beq[t][got] - rd) <= 1e-9 * Math.max(1, Math.abs(rd)), `nearestIndex's cell and readValues disagree at row ${ip} slot ${ii}`);
    if (!sameState(nearestIndex(g, v, t + 1), t)) miss++;
  }
  assert.equal(own, checked, `nearestIndex returns a cell holding the node's state at ${own} of ${checked}`);
  assert.ok(miss > 0, 'planted: the non-step layout must miss some node');
  ok(`6. nearestIndex returns a cell holding every step-year node's state (${checked}) and agrees with readValues; the non-step layout misses ${miss}`);
}

// 7. the per-row read with both interpolated axes (32 corners) against an independent multilinear read
{
  const r = solve(s130, { coverage: true, gainInterp: true }), g = r.g, t = stepYears(r)[0], v = new Float64Array(7), o4 = new Float64Array(4);
  assert.ok(g.gainInterp && g.pclsInterp, 'both interpolated axes are on');
  const W = g.axes.W, br = (arr, x) => { for (let i = 0; i < arr.length - 1; i++) if (x >= arr[i] && x <= arr[i + 1]) return { i, w: (x - arr[i]) / (arr[i + 1] - arr[i]) }; throw new Error('outside'); };
  const locW = x => { if (!(x > 0)) return { i: 0, w: 0 }; if (x <= W.pts[1]) return { i: 0, w: x / W.pts[1] }; if (x >= W.hi) return { i: W.n - 2, w: 1 }; const f = 1 + (Math.log(x) - W.lg) / W.step, i = Math.min(W.n - 2, Math.max(1, Math.floor(f))); return { i, w: f - i }; };
  // a row's share read on its own nodes (yr) or on the six-node layout (yr -1)
  const rowRead = (yr, ip, a, it, ig, ic) => {
    const nodes = []; for (let j = 0; j < g.ni; j++) nodes.push(yr >= 0 ? shareNode(g, ip, j, yr) : (j < g.axes.a.n ? g.axes.a.pts[j] : 1));
    let c = -1; for (let j = 0; j < g.ni - 1; j++) if (nodes[j + 1] > nodes[j] && (c < 0 || nodes[j] <= a)) c = j;
    const w = Math.min(1, Math.max(0, (a - nodes[c]) / (nodes[c + 1] - nodes[c])));
    return (1 - w) * r.beq[t][g.index(ip, c, it, ig, ic)] + w * r.beq[t][g.index(ip, c + 1, it, ig, ic)];
  };
  const indep = (yr, Wx, a, b, gx, pf) => {
    const lw = locW(Wx), fb = b * (g.nt - 1), ib = Math.min(g.nt - 2, Math.floor(fb)), wb = fb - ib, gb = br(g.gain, gx), cb = br(g.pcls, pf);
    let sum = 0;
    for (const dp of [0, 1]) for (const dt of [0, 1]) for (const dg of [0, 1]) for (const dc of [0, 1]) {
      const w = (dp ? lw.w : 1 - lw.w) * (dt ? wb : 1 - wb) * (dg ? gb.w : 1 - gb.w) * (dc ? cb.w : 1 - cb.w);
      if (w) sum += w * rowRead(yr, lw.i + dp, a, ib + dt, gb.i + dg, cb.i + dc);
    }
    return sum;
  };
  let rnd = 12345; const U = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
  let worst = 0, layoutDiff = 0, n32 = 0;
  for (let q = 0; q < 400; q++) {
    const Wx = W.pts[1] * 0.5 + U() * (W.pts[W.n - 2] - W.pts[1] * 0.5), a = U(), b = U() * 0.999, gx = g.gain[0] + U() * (g.gain[g.gain.length - 1] - g.gain[0]), pf = g.pcls[0] + U() * (g.pcls[g.pcls.length - 1] - g.pcls[0]);
    const pen = a * Wx, rest = Wx - pen, isa = b * rest; v[0] = pen; v[1] = isa; v[2] = rest - isa; v[3] = gx; v[4] = pf * r.m.P.lsa; v[5] = pf > 0 ? 1 : 0; v[6] = -1;
    const rd = readValues(g, r.lsurv[t], r.beq[t], v, o4, null, null, t)[1], want = indep(t, Wx, a, b, gx, pf);
    worst = Math.max(worst, Math.abs(rd - want) / Math.max(1, Math.abs(want)));
    if (Math.abs(indep(-1, Wx, a, b, gx, pf) - rd) > 1e-6 * Math.max(1, Math.abs(rd))) layoutDiff++;
    n32++;
  }
  assert.ok(worst <= 1e-9, `readValues against the independent per-row read: worst relative gap ${worst}`);
  assert.ok(layoutDiff > 0, 'planted: the six-node layout must read differently somewhere');
  ok(`7. readValues with both interpolated axes equals the independent per-row multilinear read at ${n32} step-year states (worst ${worst.toExponential(1)}); the six-node layout differs at ${layoutDiff}`);
}

// 8. the copy complete in every year, world and tier-state layer under the unit's settings
{
  const r = solve(s130, { coverage: true, tierState: true, jointWorlds: true }), g = r.g, T = r.m.ctx.totalYears, TW = r.tablesW;
  assert.ok(r.meta.tierState && r.meta.jointWorlds && TW.layW, 'the unit\'s settings took');
  const NAMES = ['surv', 'lsurv', 'beq', 'resil', 'short', 'pol'];
  let copies = 0, planted = 0;
  for (let k = 0; k < TW.layW.length; k++) for (const Ly of TW.layW[k]) for (let t = 0; t <= T; t++) for (const nm of NAMES) {
    const A = Ly[nm] && Ly[nm][t]; if (!A) continue;
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ip = 0; ip < g.np; ip++) {
      for (let ii = 1; ii < g.ni; ii++) if (shareNode(g, ip, ii, t) === shareNode(g, ip, ii - 1, t)) { assert.equal(A[g.index(ip, ii, it, ig, ic)], A[g.index(ip, ii - 1, it, ig, ic)], `world ${k} ${nm} year ${t} row ${ip} slot ${ii}: not a copy`); copies++; }
      if (A[g.index(ip, 6, it, ig, ic)] !== A[g.index(ip, 4, it, ig, ic)]) planted++;
    }
  }
  assert.ok(copies > 0, 'some copied slot was checked');
  assert.ok(planted > 0, 'planted: slot 6 against slot 4 must differ somewhere');
  ok(`8. every repeated slot is a copy in every year, world and tier-state layer (${copies} cells across ${TW.layW.length} worlds); slot 6 against slot 4 differs at ${planted}`);
}

// 9. only step years carry nodes; some reader year is a spread year (the step test can refuse)
{
  const g = on.g, T = on.m.ctx.totalYears, K = on.mix ? on.mix.tables.length : 1;
  const isStep = t => { const fs = Array.from({ length: K }, (_, k) => g.reader.chanceOf(k, t)), d0 = fs[0].schedule.bills[0]; return fs.every(f => f.schedule.bills[0] === d0 && f(d0 - 0.5) === 1 && f(d0 - 2) === 0); };
  let withNodes = 0, spread = 0;
  for (let t = 0; t <= T; t++) {
    if (!g.reader.years[t]) { assert.ok(!g.cov.years[t], `year ${t} has nodes but no reader`); continue; }
    if (g.cov.years[t]) { assert.ok(isStep(t), `year ${t} carries nodes but is not a step year`); withNodes++; }
    else { assert.ok(!isStep(t), `year ${t} is a step year without nodes`); spread++; }
  }
  assert.ok(withNodes > 0, 'some step year carries nodes');
  assert.ok(spread > 0, 'planted: some reader year must be a spread year, refused by the step test');
  ok(`9. the ${withNodes} year(s) with nodes are step years; the ${spread} spread reader year(s) fail the step test and carry none`);
}

// 10. round trips at a = 1, at W = 0 and 1e-12 either side of every node; a = 1 - 1e-3 differs (planted)
{
  const g = on.g, go = off.g, t = stepYears(on)[0], v = new Float64Array(7), o1 = new Float64Array(4), o2 = new Float64Array(4);
  const at = (Wx, a, it, ig, ic) => { const pen = a * Wx, rest = Wx - pen, isa = g.axes.b.pts[it] * rest; v[0] = pen; v[1] = isa; v[2] = rest - isa; v[3] = g.gain[ig]; v[4] = g.pcls[ic] * on.m.P.lsa; v[5] = g.pcls[ic] > 0 ? 1 : 0; v[6] = -1; return v; };
  let eq = 0, near = 0, differs = 0, narrow = Infinity;
  for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) {
    for (let ip = 0; ip < g.np; ip++) {
      const Wx = g.axes.W.pts[ip];
      for (const a of [1]) {
        const x = readValues(g, on.lsurv[t], on.beq[t], at(Wx, a, it, ig, ic), o1, null, null, t), y = readValues(go, off.lsurv[t], off.beq[t], v, o2, null, null, t);
        assert.equal(x[1], y[1], `a = 1 row ${ip}: the bequest read differs from coverage off`); eq++;
        const z = readValues(g, on.lsurv[t], on.beq[t], at(Wx, 1 - 1e-3, it, ig, ic), o2, null, null, t);
        if (z[1] !== x[1]) differs++;
      }
      for (let ii = 0; ii < g.ni; ii++) {
        const a0 = shareNode(g, ip, ii, t), base = readValues(g, on.lsurv[t], on.beq[t], at(Wx, a0, it, ig, ic), o1, null, null, t)[1];
        // the steeper slope of the cells either side of the node on this row (a zero-width cell has none)
        let slope = 0;
        for (const j of [ii - 1, ii + 1]) { if (j < 0 || j >= g.ni) continue; const dw = Math.abs(shareNode(g, ip, j, t) - a0); if (dw > 0) slope = Math.max(slope, Math.abs(on.beq[t][g.index(ip, j, it, ig, ic)] - on.beq[t][g.index(ip, ii, it, ig, ic)]) / dw); if (dw > 0) narrow = Math.min(narrow, dw); }
        for (const e of [-1e-12, 1e-12]) {
          const a = Math.min(1, Math.max(0, a0 + e)), l = shareLocOf(g, ip, a, t);
          assert.ok(Number.isFinite(l.w) && l.w >= 0 && l.w <= 1, `row ${ip} slot ${ii}: the locate's weight ${l.w}`);
          const rd = readValues(g, on.lsurv[t], on.beq[t], at(Wx, a, it, ig, ic), o2, null, null, t)[1];
          assert.ok(Number.isFinite(rd) && Math.abs(rd - base) <= 2e-12 * slope + 1e-9 * Math.max(1, Math.abs(base)), `row ${ip} slot ${ii}: the read ${rd} 1e-12 off the node, ${base} at it (slope ${slope})`); near++;
        }
      }
    }
    const x = readValues(g, on.lsurv[t], on.beq[t], at(0, 0, it, ig, ic), o1, null, null, t), y = readValues(go, off.lsurv[t], off.beq[t], v, o2, null, null, t);
    assert.ok(Number.isFinite(x[0]) && Number.isFinite(x[1]) && x[1] === y[1] && x[0] === y[0], 'W = 0: the read differs from coverage off or is not finite'); eq++;
  }
  assert.ok(differs > 0, 'planted: a read at a = 1 - 1e-3 must differ from the a = 1 node\'s somewhere');
  ok(`10. at a = 1 and W = 0 the reads equal coverage off's (${eq}); 1e-12 either side of every node finite and within the slope's bound (${near}; the narrowest cell ${narrow.toExponential(2)}); a = 1 - 1e-3 differs at ${differs}`);
}

// 11. a supported read touches no unsupported node; the six-node layout does (planted)
{
  const g = on.g, t = stepYears(on)[0];
  let rows = 0, reads = 0, above = 0;
  for (let ip = 0; ip < g.np; ip++) {
    let e = -1; for (let ii = 1; ii < g.ni - 1; ii++) { const x = shareNode(g, ip, ii, t); if (!g.axes.a.pts.includes(x)) e = ii; }
    if (e < 0) continue; rows++;
    const lo = shareNode(g, ip, e - 1, t), edge = shareNode(g, ip, e, t);
    for (let q = 1; q <= 20; q++) {
      const a = lo + (edge - lo) * q / 20, l = shareLocOf(g, ip, a, t); reads++;
      assert.ok(l.i + 1 <= e || (l.i + 1 === e + 1 && l.w === 0), `row ${ip}: a ${a} reads slot ${l.i + 1} above the edge slot ${e}`);
      const f = a * (g.axes.a.n - 1), i6 = Math.min(g.axes.a.n - 2, Math.floor(f));
      if (g.axes.a.pts[i6 + 1] > edge) above++;
    }
  }
  assert.ok(rows > 0, 'some row carries an edge node');
  assert.ok(above > 0, 'planted: the six-node layout must read a node above the edge for some row');
  ok(`11. on ${rows} rows a share between the node below and the edge never reads above the edge (${reads}); the six-node layout does at ${above}`);
}
console.log(`cov-b: ${n} checks passed`);
