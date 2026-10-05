/*
 * RTAX v2, THE READER'S SUPPORT WITH THIS YEAR'S TAX (`readerTax`; solve.js, grid.js readValues, reader.js buildReaderTable;
 * research/solver/items/RTAX.md, PLAN.md RTAX and O92). Each check with the planted fault it must catch:
 *   1. Throws: readerTax without the bridge reader, with bridgeStep 'exact', and with readerAcc at a read. Planted: none
 *      (each throw is the check).
 *   2. Off unchanged: S130 with readerTax off carries no tax entry. On S000 (no bridge) readerTax on equals off table for
 *      table. Planted: on S130 a read in the band where every floor move fails must differ from off (the comparison is not
 *      a solve against itself). No node falls in the band at this grid, so the difference shows at reads.
 *   3. Support by the flow at COV-B's edge positions (accessible money d0 - tol/2 on every wealth row, ISA share, gain and
 *      allowance node of S130's step year): readerTax's support agrees with the floor flows on a freshly compiled context.
 *      Planted: today's support must call some failing position supported (O92; results-covflow.txt found 240 such edge
 *      cells on S130's step year at 30 points).
 *   4. The band's bound: on 2,000 states a step year drawn around the edge (accessible money 0.95 to 1.10 of d0, every ISA
 *      share, gain and allowance used), a read's support (readValues' own branch, through tx.inBand and tx.payable or the
 *      reference) agrees with the flow at the state. Planted: tauBar set to 0 must misread some state.
 *   5. An all-ISA household (S126 with its taxable and cash pots moved into the ISA): readerTax on equals off at every
 *      node's support. Planted: a payable() that asks 1,000 more than the bill must differ.
 * Added before COV-B-STEP's launch (the plan-auditor's BLOCKING 1 of 5 Oct 03:33 UK). items/RTAX.md's seven tests and
 * where each stands under v2: 1 (off bit-identical) is check 2 and the golden and reader tests; 2 (tau against a
 * hand-worked case) is superseded - v2 uses the tax only for the band's width, tauBar, and check 4 shows the band wide
 * enough (no misread outside it, a band of width 0 planted); 3 (support against the floor flows on the four households
 * and on one with taxable guaranteed income) is checks 3, 4 and 6; 4 (node reproduction) is check 7; 5 (all-ISA) is check
 * 5; 6 (the two-sided misclassification bar) is superseded - inside the band v2's support is the flow's by construction,
 * so the bar is read outside it, by check 4 here and results-rtaxmis.txt's third run; 7 (e3 and the level search) is
 * check 8.
 *   Checks 3 and 4 read the support through readValues itself (the solve's value(), its inBand and payable observed),
 *   not a copy of its branch.
 *   6. Checks 3 and 4 on S370, bridge 4 (S126 built with a four-year bridge), S126, and S130 with 20,000 a year of taxed
 *      earnings until pension access (no panel household has taxable guaranteed income in the bridge): no edge position
 *      or edge-band state misread through readValues. Planted: today's support calls some failing position supported on
 *      one of them, and a band of width 0 misreads some state.
 *   7. Node reproduction with readerTax and coverage on (COV-B's edge nodes sit inside the band, so in-band nodes exist):
 *      at every node of every reader table the read gives back the node's survival, p c + R = S, to 1e-9; some nodes are
 *      in the band. Planted: with p taken as 1 at the read the largest miss exceeds 1e-9.
 *   8. The tax table does not depend on e3 or the level search: with e3 on, and separately with the ternary level search,
 *      each step year's d0 and tauBar equal readerTax's alone and payable agrees at 500 band states. Planted: S126's table
 *      against S130's differs.
 *   node research/tests/reader-tax.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solvePlan } from '../../src/solver/solve.js';
import { toVec, readValues } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const find = id => { const h = all.find(s => s.id === id); if (!h) throw new Error(`no case ${id}`); return h; };
const prep = h => E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const BASE = { lambda: 0.0223606797749979, points: 4, shares: 6, bridgeRead: 'reader', bequestWeight: 0.02, pclsInterp: true, e3: false, riskAbove: false };
const solve = (plan, extra = {}) => solvePlan(E, M, plan, { ...BASE, ...extra });
let n = 0; const ok = (msg) => { n++; console.log(`  ok  ${msg}`); };

// an independent judge: every floor move flowed from a state on a context compiled here
function judge(r) {
  const cJ = F.compile(r.m, r.actions), lv = r.actions.map(a => (a.spendLevel !== undefined ? a.spendLevel : 1)), lo = Math.min(...lv);
  const floor = r.actions.map((a, i) => i).filter(i => lv[i] === lo), b = new Float64Array(7);
  return (t, s) => { for (const ai of floor) { for (let q = 0; q < 7; q++) b[q] = s[q]; const u = F.flow(cJ, t, ai, b); if (!(u > 1 || cJ.last.preNmpaInsolvent)) return true; } return false; };
}
const stepYears = r => (r.g.reader.tax || []).map((x, t) => (x ? t : -1)).filter(t => t >= 0);
const tablesOf = r => [...r.g.reader.of.values()];
// the support readValues itself uses at a state: its inBand and payable observed through the solve's value(), the reference
// chance where it does not ask payable (the read's own branch, grid.js readValues)
function readSupport(r, t, s) {
  const tx = r.g.reader.tax[t], RD = tablesOf(r).find(x => x.t === t), ib = tx.inBand, pb = tx.payable;
  let band = null, pay = null;
  tx.inBand = A => { band = ib(A); return band; }; tx.payable = x => { pay = pb(x); return pay; };
  try { r.value(s, t); } finally { tx.inBand = ib; tx.payable = pb; }
  if (band === null) throw new Error('readValues did not ask inBand at a step-year read');
  return band ? pay : RD.chance(s[1] + s[2]) >= 0.5;
}

// 1. throws
{
  const p = prep(find('S130'));
  assert.throws(() => solvePlan(E, M, p, { ...BASE, bridgeRead: false, readerTax: true }), /readerTax needs the bridge reader/);
  assert.throws(() => solve(p, { readerTax: true, bridgeStep: 'exact' }), /readerTax cannot run with bridgeStep 'exact'/);
  ok('1. readerTax refuses no reader and bridgeStep exact');
}

const s130 = prep(find('S130'));
const off = solve(s130), on = solve(s130, { readerTax: true });
// 1b. readerAcc and readerTax together refuse at a read
{
  const t = stepYears(on)[0], tb = tablesOf(on).find(x => x.t === t), v = new Float64Array(7);
  toVec(on.g, on.g.np - 1, 0, 0, 0, 0, v);
  on.g.readerAcc = s => s[1] + s[2];
  assert.throws(() => on.value(v, t), /readerTax and readerAcc/);
  delete on.g.readerAcc;
  assert.ok(tb, 'a step-year table');
  ok('1b. readerTax with readerAcc refuses at a read');
}

// 2. off unchanged; on S000 identical; on S130 a read in the band where every floor move fails differs from off (planted)
{
  assert.equal(off.g.reader.tax, undefined, 'off carries no tax entry');
  assert.ok(stepYears(on).length >= 1, 'S130 has a step year under readerTax');
  const s000 = prep(find('S000')), a = solve(s000), b = solve(s000, { readerTax: true });
  assert.equal(a.g.reader ? a.g.reader.built : 0, 0, 'S000 builds no reader table');
  for (let t = 0; t <= a.m.ctx.totalYears; t++) assert.deepEqual(Array.from(b.surv[t]), Array.from(a.surv[t]), `S000 year ${t}`);
  // the band's nodes: none at the test's grid (results-rtaxmis.txt's prints and this grid: the band is about 4% of d0 wide),
  // so the node tables match off, and the difference shows at reads between the nodes
  const pays = judge(on), t = stepYears(on)[0], tx = on.g.reader.tax[t], lsa = on.g.m.P.lsa;
  let diff = 0, tried = 0;
  for (const b0 of [0, 0.1, 0.2]) for (const gain of [0.25, 0.55]) for (const W of [1.2, 1.6, 2.4, 3.6]) for (const up of [50, 300, 1000]) {
    const A0 = tx.d0 + up, Wt = W * A0, a = 1 - A0 / Wt, pen = a * Wt, rest = Wt - pen, isa = b0 * rest;
    const s = Float64Array.from([pen, isa, rest - isa, gain, 0, 0, -1]);
    if (pays(t, s) || !tx.inBand(A0)) continue;
    tried++; if (on.value(s, t).survival !== off.value(s, t).survival) diff++;
  }
  assert.ok(tried > 0, 'some band state fails every floor move');
  assert.ok(diff > 0, 'planted: a band read where every floor move fails must differ from off');
  ok(`2. off carries no tax; S000 identical on and off; S130 reads differ at ${diff} of ${tried} failing band states (meta ${on.meta.readerTax})`);
}

// 3. at COV-B's edge positions (accessible money d0 - tol/2 on every wealth row, every ISA share, gain and allowance node):
// readerTax's support is the flow's; today's support calls some failing position supported (planted: O92's error)
{
  const pays = judge(on), g = on.g, v = new Float64Array(7);
  let falseSup = 0, falseFail = 0, todayFalseSup = 0, checked = 0;
  for (const t of stepYears(on)) {
    const tx = g.reader.tax[t], RD = tablesOf(on).find(x => x.t === t), A0 = tx.d0 - tx.tol / 2;
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ip = 0; ip < g.np; ip++) {
      toVec(g, ip, 0, it, ig, ic, v);
      const Wt = g.axes.W.pts[ip]; if (!(Wt > A0)) continue;
      const a = 1 - A0 / Wt, pen = a * Wt, rest = Wt - pen, isa = g.axes.b.pts[it] * rest; v[0] = pen; v[1] = isa; v[2] = rest - isa;
      const truth = pays(t, v), A = v[1] + v[2], sup = readSupport(on, t, v), today = RD.chance(A) >= 0.5;
      checked++; if (sup && !truth) falseSup++; if (!sup && truth) falseFail++; if (today && !truth) todayFalseSup++;
    }
  }
  assert.ok(checked > 0, 'edge positions were checked');
  assert.equal(falseSup, 0, `readerTax: ${falseSup} edge positions called supported fail every floor move`);
  assert.equal(falseFail, 0, `readerTax: ${falseFail} edge positions called unsupported pay`);
  assert.ok(todayFalseSup > 0, 'planted: today\'s support must call some failing edge position supported');
  ok(`3. every edge position's support is the flow's (${checked}); today's support calls ${todayFalseSup} failing positions supported`);
}

// 4. the band's bound: a read's support agrees with the flow around the edge; tauBar 0 misreads (planted)
{
  const pays = judge(on), g = on.g, lsa = g.m.P.lsa;
  let seed = 4242; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  let mis = 0, misZero = 0, n4 = 0;
  for (const t of stepYears(on)) {
    const tx = g.reader.tax[t], RD = tablesOf(on).find(x => x.t === t), d0 = tx.d0;
    const zero = { ...tx, inBand: A => A >= d0 - tx.tol && A <= d0 };
    for (let q = 0; q < 2000; q++) {
      const A0 = d0 * (0.95 + 0.15 * rnd()), Wt = A0 / (1 - 0.5 * rnd()), a = 1 - A0 / Wt, b = rnd(), gain = 0.05 + 0.5 * rnd(), pf = rnd();
      const pen = a * Wt, rest = Wt - pen, isa = b * rest, s = Float64Array.from([pen, isa, rest - isa, gain, pf * lsa, pf > 0 ? 1 : 0, -1]);
      const A = s[1] + s[2], truth = pays(t, s);
      const supZ = zero.inBand(A) ? tx.payable(s) : RD.chance(A) >= 0.5;
      n4++; if (readSupport(on, t, s) !== truth) mis++; if (supZ !== truth) misZero++;
    }
  }
  assert.equal(mis, 0, `readerTax: ${mis} of ${n4} edge states misread`);
  assert.ok(misZero > 0, 'planted: tauBar 0 must misread some state');
  ok(`4. no edge state misread (${n4}); with tauBar 0, ${misZero} misread`);
}

// 5. an all-ISA household: on equals off at every node's support; a payable() asking 1,000 more must differ (planted)
{
  const h = JSON.parse(JSON.stringify(find('S126').plan));
  const LIQ = /^S&S ISA|^Other Investments|^Cash/, liq = h.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  let put = false;
  h.accounts = h.accounts.map(a => { if (!LIQ.test(a.category)) return a; if (/^S&S ISA/.test(a.category) && !put) { put = true; return { ...a, balance: liq }; } return { ...a, balance: 0 }; });
  assert.ok(put, 'S126 has an ISA account to hold the liquid money');
  const p = prep({ plan: h }), a = solve(p), b = solve(p, { readerTax: true });
  assert.ok(stepYears(b).length >= 1, 'the all-ISA household has a step year');
  const pa = tablesOf(a), pb = tablesOf(b);
  for (let i = 0; i < pa.length; i++) assert.deepEqual(Array.from(pb[i].p), Array.from(pa[i].p), `table ${i}: support differs on an all-ISA household`);
  // reads in the band agree too; a payable() asking 1,000 more than the bill must differ at some band state (planted)
  const t = stepYears(b)[0], tx = b.g.reader.tax[t];
  let readDiff = 0, plantDiff = 0, nb = 0;
  for (let q = 0; q <= 40; q++) {
    const A0 = tx.d0 - tx.tol + (tx.tauBar + tx.tol + 1500) * q / 40, Wt = 1.5 * A0, pen = Wt - A0, s = Float64Array.from([pen, A0, 0, 0.25, 0, 0, -1]);
    nb++; if (b.value(s, t).survival !== a.value(s, t).survival) readDiff++;
    const A = s[1] + s[2], planted = A - 1000 >= tx.d0 - tx.tol;
    if (tx.inBand(A) && planted !== tx.payable(s)) plantDiff++;
  }
  assert.equal(readDiff, 0, `all-ISA: ${readDiff} of ${nb} band reads differ`);
  assert.ok(plantDiff > 0, 'planted: a payable() asking 1,000 more must differ somewhere in the band');
  ok(`5. all-ISA: readerTax on equals off at every node (${pa.length} tables) and at ${nb} band reads (tauBar ${Math.round(tx.tauBar)}); the planted payable differs at ${plantDiff}`);
}

// the households for checks 6 and 8
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function bridgeVariant(years) {
  const p = JSON.parse(JSON.stringify(find('S126').plan)), nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - years;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return prep({ plan: p });
}
function earningsVariant() {
  const p = JSON.parse(JSON.stringify(find('S130').plan)), age = E.num(p.demographics.currentAgeSelf, 56), nmpa = E.num(p.demographics.privatePensionAge, 58);
  p.otherIncomes = [...(p.otherIncomes || []), { id: 'rtax-earn', incomeType: 'earnings', amount: 20000, owner: 'Myself', startAge: age, endAge: nmpa - 1 }];
  return prep({ plan: p });
}

// 6. checks 3 and 4 through readValues on S370, bridge 4, S126 and S130 with taxed earnings in the bridge
{
  const rows = [];
  let anyToday = 0, anyZero = 0;
  for (const [id, plan] of [['S370', prep(find('S370'))], ['bridge 4', bridgeVariant(4)], ['S126', prep(find('S126'))], ['S130 + earnings', earningsVariant()]]) {
    const r = solve(plan, { readerTax: true }), pays = judge(r), g = r.g, v = new Float64Array(7), lsa = g.m.P.lsa;
    const ts = stepYears(r); assert.ok(ts.length >= 1, `${id} has a step year under readerTax`);
    let checked = 0, bad = 0, today = 0, n6 = 0, mis = 0, misZero = 0;
    let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (const t of ts) {
      const tx = g.reader.tax[t], RD = tablesOf(r).find(x => x.t === t), A0 = tx.d0 - tx.tol / 2, d0 = tx.d0;
      for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ip = 0; ip < g.np; ip++) {
        toVec(g, ip, 0, it, ig, ic, v);
        const Wt = g.axes.W.pts[ip]; if (!(Wt > A0)) continue;
        const pen = (1 - A0 / Wt) * Wt, rest = Wt - pen, isa = g.axes.b.pts[it] * rest; v[0] = pen; v[1] = isa; v[2] = rest - isa;
        const truth = pays(t, v); checked++;
        if (readSupport(r, t, v) !== truth) bad++;
        if (RD.chance(v[1] + v[2]) >= 0.5 && !truth) today++;
      }
      for (let q = 0; q < 1000; q++) {
        const Aq = d0 * (0.95 + 0.15 * rnd()), Wt = Aq / (1 - 0.5 * rnd()), a = 1 - Aq / Wt, b = rnd(), gain = 0.05 + 0.5 * rnd(), pf = rnd();
        const pen = a * Wt, rest = Wt - pen, isa = b * rest, s2 = Float64Array.from([pen, isa, rest - isa, gain, pf * lsa, pf > 0 ? 1 : 0, -1]);
        const A = s2[1] + s2[2], truth = pays(t, s2); n6++;
        if (readSupport(r, t, s2) !== truth) mis++;
        const supZ = A >= d0 - tx.tol && A <= d0 ? tx.payable(s2) : RD.chance(A) >= 0.5; if (supZ !== truth) misZero++;
      }
    }
    assert.ok(checked > 0, `${id}: edge positions were checked`);
    assert.equal(bad, 0, `${id}: ${bad} of ${checked} edge positions misread through readValues`);
    assert.equal(mis, 0, `${id}: ${mis} of ${n6} edge-band states misread through readValues`);
    anyToday += today; anyZero += misZero;
    rows.push(`${id} (steps ${ts.join(',')}, tauBar ${ts.map(t => Math.round(g.reader.tax[t].tauBar)).join(',')}): edge ${checked}, band ${n6}, today false support ${today}, width-0 misreads ${misZero}`);
  }
  assert.ok(anyToday > 0, 'planted: today\'s support must call some failing edge position supported on one of the four');
  assert.ok(anyZero > 0, 'planted: a band of width 0 must misread some state on one of the four');
  ok(`6. through readValues, no edge position or edge-band state misread on ${rows.length} more households: ${rows.join('; ')}`);
}

// 7. node reproduction with readerTax and coverage on (in-band nodes exist); p taken as 1 misses (planted)
{
  const r = solve(s130, { readerTax: true, coverage: true }), g = r.g, rd = new Float64Array(4), v = new Float64Array(7);
  let worst = 0, worstPlanted = 0, nodes = 0, inBand = 0;
  for (const [ls, T] of g.reader.of) {
    const tx = g.reader.tax ? g.reader.tax[T.t] : null;
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
      const i = g.index(ip, ii, it, ig, ic);
      toVec(g, ip, ii, it, ig, ic, v, T.t);
      readValues(g, ls, ls, v, rd, null, null, T.t);
      const held = 1 / (1 + Math.exp(-ls[i]));
      worst = Math.max(worst, Math.abs(rd[0] - held)); nodes++;
      if (tx && tx.inBand(v[1] + v[2])) inBand++;
      const ch = T.chance; T.chance = () => 1; readValues(g, ls, ls, v, rd, null, null, T.t); T.chance = ch;
      worstPlanted = Math.max(worstPlanted, Math.abs(rd[0] - held));
    }
  }
  assert.ok(nodes > 0 && inBand > 0, `node reproduction needs in-band nodes (${inBand} of ${nodes})`);
  assert.ok(worst <= 1e-9, `node reproduction with readerTax and coverage: largest miss ${worst}`);
  assert.ok(worstPlanted > 1e-9, 'planted: with p taken as 1 the read must miss some node');
  ok(`7. node reproduction with readerTax and coverage: ${nodes} nodes over ${g.reader.of.size} tables (${inBand} in the band), largest miss ${worst.toExponential(1)}; with p taken as 1, ${worstPlanted.toFixed(3)}`);
}

// 8. the tax table with e3 on and with the ternary level search equals readerTax's alone; S126's against S130's differs (planted)
{
  const ref = on, lsa = ref.g.m.P.lsa;
  const same = (a, b) => {
    const ta = stepYears(a), tb = stepYears(b); if (ta.join() !== tb.join()) return false;
    let seed = 99; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (const t of ta) {
      const x = a.g.reader.tax[t], y = b.g.reader.tax[t];
      if (x.d0 !== y.d0 || x.tauBar !== y.tauBar) return false;
      for (let q = 0; q < 500; q++) {
        const A = x.d0 - x.tol + (x.tauBar + x.tol) * rnd(), Wt = A / (1 - 0.5 * rnd()), pen = Wt - A, isa = rnd() * A, pf = rnd();
        const s2 = Float64Array.from([pen, isa, A - isa, 0.05 + 0.5 * rnd(), pf * lsa, pf > 0 ? 1 : 0, -1]);
        if (x.payable(s2) !== y.payable(s2)) return false;
      }
    }
    return true;
  };
  const withE3 = solve(s130, { readerTax: true, e3: true }), withTern = solvePlan(E, M, s130, { ...BASE, readerTax: true, levelSearch: 'ternary' });
  assert.ok(withE3.meta.e3 && withTern.meta.levelSearch === 'ternary', 'e3 and the ternary level search took');
  assert.ok(same(ref, withE3), 'the tax table with e3 on differs from readerTax\'s alone');
  assert.ok(same(ref, withTern), 'the tax table with the ternary level search differs from readerTax\'s alone');
  const other = solve(prep(find('S126')), { readerTax: true });
  assert.ok(!same(ref, other), 'planted: S126\'s tax table must differ from S130\'s');
  ok(`8. the tax table with e3 on and with the ternary level search equals readerTax's alone (d0, tauBar, payable at 500 band states a step year); S126's differs`);
}
console.log(`reader-tax: ${n} checks passed`);
