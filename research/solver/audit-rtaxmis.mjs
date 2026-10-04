/*
 * RTAX'S MISCLASSIFICATION PRINT (items/RTAX.md, "Before the build"; the deep review of RTAX's design, deep-review-log.md
 * 4 Oct 21:04 UK: "the deciding test is the two-sided off-node misclassification print ... no solve"). A MEASUREMENT with
 * no test. In every step year of PMAP's households (every world's reference 1 at d0 - tol/2 and 0 at d0 - 2 tol), the
 * truth at a state is whether any floor-level move pays the year (F.flow: unmet <= 1 and not pre-access insolvent). Two
 * readers' support (p >= 0.5; in a step year the chance is a 0/1 step at d0 - tol) against it:
 *   TODAY  the reference at the state's own accessible money A = ISA + taxable;
 *   RTAX   the reference at A - I[tau], tau on the 30-point unit's nodes as items/RTAX.md's revised design (prototyped
 *          here, not in the solver): tau_i = max(0, A_i - d0 - L_i), L_i the best over the floor moves of (accessible
 *          money after the flow less unmet); at a node where every floor move fails, the share row's edge tax (the
 *          row's edge found by bisection on a, tau taken at the paying side); read with the grid's corner weights,
 *          the gain and allowance axes bracketed.
 * Positions: on every node (test 3's two directions) and N off-node states a step year (wealth log-uniform between the
 * rows that have an edge, a in [0.5, 1], b, gain in [0.05, 0.55] and the allowance used all uniform: off the nodes and
 * off the gain buckets). Prints false support (p >= 0.5, every floor move fails) and false failure (p < 0.5, a floor
 * move pays) for each reader, and the items/RTAX.md bar (RTAX under a tenth of TODAY's off-node cases and at most 1% of
 * the positions) as met or not. Planted (each must hold or the print stops): with tau forced to 0, RTAX's counts equal
 * TODAY's; a state with no accessible money is false support for neither reader. A second sample of N states a step
 * year sits on the edge band (accessible money 0.97 to 1.06 of d0), where the readers can disagree; the bar is read on it too.
 *   node research/solver/audit-rtaxmis.mjs [N]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { makeGrid, toVec, locateVec } from '../../src/solver/grid.js';
import * as F from '../../src/solver/fast.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const LAMBDA = 0.0223606797749979, W = 0.02, SH = 6, POINTS = 4;

// audit-pmap.mjs l.56-84, copied (its module runs its units on import): PMAP's households and its built variants

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
/* audit-s126.mjs's variant(), copied (l.75-93): S126 with its pension share, bridge length and wealth changed, and optionally a
   one-off cost [years from now, amount] */
function variant(name, { a0 = 0.85, bridge = 2, scale = 1, cost = null } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) };
    return a;
  });
  const nmpa = E.num(p.demographics.privatePensionAge, 58);
  const age = nmpa - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  if (cost) {
    const y = E.buildContext(E.normalizePlan(p)).baseYear + cost[0];
    p.oneOffCosts = [...(p.oneOffCosts || []), { id: 'f1cost', date: `${y}-06-01`, year: y, owner: 'Myself', amount: cost[1], desc: 'One-off cost (test)' }];
  }
  return { id: name, plan: p };
}

export const UNITS = ['S130', 'S370', 'bridge 4', 'S126', 'bridge 0'];
const BUILT = { 'bridge 4': { bridge: 4 }, 'bridge 0': { bridge: 0 } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
const L = 'READER/TS+J/W0.02/PCLSI', TOL = 1, N = Number(process.argv[2] || 3000);
// a fixed generator for the off-node states (mulberry32, seed 7002, the tuning seed: a design measurement)
let seed = 7002; const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
console.log(`RTAX'S MISCLASSIFICATION PRINT: ${L} at ${SH} share points; tau on the 30-point unit's nodes; ${N} off-node states a step year; false support (reader says supported, every floor move fails) and false failure (reader says unsupported, a floor move pays)`);
const tot = { edge: 0, eTodayFS: 0, eTodayFF: 0, eRtaxFS: 0, eRtaxFF: 0, off: 0, todayFS: 0, todayFF: 0, rtaxFS: 0, rtaxFF: 0, nodeFS: 0, nodeFF: 0, nodes: 0 };
for (const id of UNITS) {
  const h = caseOf(id);
  if (!h) { console.error(`audit-rtaxmis: no case ${id}`); process.exit(2); }
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, shares: SH, bridgeRead: 'reader', bequestWeight: W, tierState: true, jointWorlds: true, pclsInterp: true, e3: false });
  const g = r.g, c = r.c, acts = r.actions, K = r.worlds.length, T = r.m.ctx.totalYears;
  if (!c || !acts || !acts.length) { console.error(`audit-rtaxmis: ${id}: the solve returned no compiled year or moves`); process.exit(2); }
  const g30 = makeGrid(r.m, { points: 30, shares: SH, gainInterp: true, pclsInterp: true });
  const lsa = g30.m.P.lsa;
  const lv = acts.map(a => (a.spendLevel !== undefined ? a.spendLevel : 1)), floor = Math.min(...lv), FL = lv.map((x, i) => (x === floor ? i : -1)).filter(i => i >= 0);
  console.log(`${id.padEnd(16)} case | unit ${L} | worlds ${K} | floor moves ${FL.length} | reader ${g.reader ? 'yes' : 'no'} | secs ${Math.round((Date.now() - t0) / 1000)}`);
  if (!g.reader) { console.log(`${''.padEnd(16)} none: no reader year`); console.log(`${''.padEnd(16)} done`); continue; }
  const buf = new Float64Array(7), v = new Float64Array(7);
  // the best floor move at a state: whether any pays, and L = max over floor moves of (accessible after the flow - unmet)
  const best = (t, s) => { let pays = false, Lb = -Infinity; for (const ai of FL) { buf.set(s); const u = F.flow(c, t, ai, buf); if (!(u > 1 || c.last.preNmpaInsolvent)) pays = true; const Lm = buf[1] + buf[2] - u; if (Lm > Lb) Lb = Lm; } return { pays, Lb }; };
  const stateAt = (Wt, a, b, gain, pf) => { const pen = a * Wt, rest = Wt - pen, isa = b * rest; v[0] = pen; v[1] = isa; v[2] = rest - isa; v[3] = gain; v[4] = pf * lsa; v[5] = pf > 0 ? 1 : 0; v[6] = -1; return v; };
  for (let t = 0; t <= T; t++) {
    if (!g.reader.years[t]) continue;
    const fs = Array.from({ length: K }, (_, k) => g.reader.chanceOf(k, t)), d0 = fs[0].schedule.bills[0];
    if (!fs.every(f => f.schedule.bills[0] === d0 && f(d0 - TOL / 2) === 1 && f(d0 - 2 * TOL) === 0)) { console.log(`${''.padEnd(16)} year ${t}: spread (not read)`); continue; }
    const chance = fs[0];
    // tau on the nodes
    const tau = new Float64Array(g30.size), pass = new Uint8Array(g30.size);
    let bisected = 0;
    for (let ic = 0; ic < g30.pcls.length; ic++) for (let ig = 0; ig < g30.gain.length; ig++) for (let it = 0; it < g30.nt; it++) for (let ip = 0; ip < g30.np; ip++) {
      const Wt = g30.axes.W.pts[ip], b = g30.axes.b.pts[it], gain = g30.gain[ig], pf = g30.pcls[ic];
      let tauEdge = null;
      for (let ii = 0; ii < g30.ni; ii++) {
        const i = g30.index(ip, ii, it, ig, ic), a = g30.axes.a.pts[ii];
        const o = best(t, stateAt(Wt, a, b, gain, pf)), A = Wt * (1 - a);
        pass[i] = o.pays ? 1 : 0;
        if (o.pays) { tau[i] = Math.max(0, A - d0 - o.Lb); continue; }
        if (tauEdge === null) {
          // the row's edge: bisection on a between the last paying share (or 0) and this failing one
          let lo = 0, hi = a;
          if (!best(t, stateAt(Wt, 0, b, gain, pf)).pays) tauEdge = Math.max(0, Wt - d0 - best(t, stateAt(Wt, 0, b, gain, pf)).Lb);
          else { for (let q = 0; q < 40; q++) { const mid = (lo + hi) / 2; if (best(t, stateAt(Wt, mid, b, gain, pf)).pays) lo = mid; else hi = mid; } const o2 = best(t, stateAt(Wt, lo, b, gain, pf)); tauEdge = Math.max(0, Wt * (1 - lo) - d0 - o2.Lb); bisected++; }
        }
        tau[i] = tauEdge;
      }
    }
    // the read of tau at a state: the grid's corner weights, gain and allowance bracketed
    const tauAt = (s, zero) => {
      if (zero) return 0;
      const l = locateVec(g30, s); let x = 0;
      for (let dp = 0; dp < 2; dp++) for (let di = 0; di < 2; di++) for (let dt = 0; dt < 2; dt++) for (let dg = 0; dg < 2; dg++) for (let dc = 0; dc < 2; dc++) {
        const w = (dp ? l.p.w : 1 - l.p.w) * (di ? l.i.w : 1 - l.i.w) * (dt ? l.t.w : 1 - l.t.w) * (dg ? l.igw : 1 - l.igw) * (dc ? l.icw : 1 - l.icw);
        if (w === 0) continue;
        x += w * tau[g30.index(l.p.i + dp, l.i.i + di, l.t.i + dt, Math.min(g30.gain.length - 1, l.ig + dg), Math.min(g30.pcls.length - 1, l.ic + dc))];
      }
      return x;
    };
    // on the nodes (test 3's two directions)
    let nFS = 0, nFF = 0, nodes = 0;
    for (let ic = 0; ic < g30.pcls.length; ic++) for (let ig = 0; ig < g30.gain.length; ig++) for (let it = 0; it < g30.nt; it++) for (let ii = 0; ii < g30.ni; ii++) for (let ip = 0; ip < g30.np; ip++) {
      const i = g30.index(ip, ii, it, ig, ic), A = g30.axes.W.pts[ip] * (1 - g30.axes.a.pts[ii]), sup = chance(A - tau[i]) >= 0.5; nodes++;
      if (sup && !pass[i]) nFS++; if (!sup && pass[i]) nFF++;
    }
    // off the nodes
    const rows = []; for (let ip = 0; ip < g30.np; ip++) { const Wt = g30.axes.W.pts[ip]; if (Wt > d0) rows.push(ip); }
    const lgLo = Math.log(g30.axes.W.pts[Math.max(1, rows[0] - 1)]), lgHi = Math.log(g30.axes.W.pts[g30.np - 1]);
    const runOff = (zero) => { seed = 7002 * 1000 + t; let fsT = 0, ffT = 0, fsR = 0, ffR = 0, n = 0; for (let q = 0; q < N; q++) { const Wt = Math.exp(lgLo + (lgHi - lgLo) * rnd()), a = 0.5 + 0.5 * rnd(), b = rnd(), gain = 0.05 + 0.5 * rnd(), pf = rnd(); const s = Float64Array.from(stateAt(Wt, a, b, gain, pf)); const A = s[1] + s[2]; const truth = best(t, s).pays; const supT = chance(A) >= 0.5, supR = chance(A - tauAt(s, zero)) >= 0.5; n++; if (supT && !truth) fsT++; if (!supT && truth) ffT++; if (supR && !truth) fsR++; if (!supR && truth) ffR++; } return { fsT, ffT, fsR, ffR, n }; };
    // the edge band (the first run put 4 of 15000 off-node states in it): accessible money uniform on 0.97 to 1.06 of d0,
    // wealth log-uniform from 1.1 d0 to the top row, b, gain and allowance uniform
    const runEdge = (zero) => { seed = 7002 * 1000 + 500 + t; let fsT = 0, ffT = 0, fsR = 0, ffR = 0, n = 0; const lo = Math.log(1.1 * d0); for (let q = 0; q < N; q++) { const Wt = Math.exp(lo + (lgHi - lo) * rnd()), A0 = d0 * (0.97 + 0.09 * rnd()), a = 1 - A0 / Wt, b = rnd(), gain = 0.05 + 0.5 * rnd(), pf = rnd(); const s = Float64Array.from(stateAt(Wt, a, b, gain, pf)); const A = s[1] + s[2]; const truth = best(t, s).pays; const supT = chance(A) >= 0.5, supR = chance(A - tauAt(s, zero)) >= 0.5; n++; if (supT && !truth) fsT++; if (!supT && truth) ffT++; if (supR && !truth) fsR++; if (!supR && truth) ffR++; } return { fsT, ffT, fsR, ffR, n }; };
    const off = runOff(false), z = runOff(true), edge = runEdge(false), ze = runEdge(true);
    if (ze.fsR !== ze.fsT || ze.ffR !== ze.ffT) { console.log(`AUDIT-RTAXMIS FAILED: ${id} year ${t}: with tau 0 RTAX's edge counts differ from TODAY's`); process.exit(1); }
    tot.edge += edge.n; tot.eTodayFS += edge.fsT; tot.eTodayFF += edge.ffT; tot.eRtaxFS += edge.fsR; tot.eRtaxFF += edge.ffR;
    if (z.fsR !== z.fsT || z.ffR !== z.ffT) { console.log(`AUDIT-RTAXMIS FAILED: ${id} year ${t}: with tau 0 RTAX's counts ${z.fsR}/${z.ffR} differ from TODAY's ${z.fsT}/${z.ffT}`); process.exit(1); }
    const s0 = Float64Array.from(stateAt(g30.axes.W.pts[g30.np - 1], 1, 0.5, 0.25, 0)); if (chance(0) >= 0.5 || chance(0 - tauAt(s0, false)) >= 0.5) { console.log(`AUDIT-RTAXMIS FAILED: ${id} year ${t}: no accessible money read as supported`); process.exit(1); }
    tot.off += off.n; tot.todayFS += off.fsT; tot.todayFF += off.ffT; tot.rtaxFS += off.fsR; tot.rtaxFF += off.ffR; tot.nodeFS += nFS; tot.nodeFF += nFF; tot.nodes += nodes;
    console.log(`${''.padEnd(16)} year ${t}: step | d0 ${d0.toFixed(0)} | rows bisected ${bisected} | nodes ${nodes}: RTAX false support ${nFS} false failure ${nFF} | off-node ${off.n}: TODAY false support ${off.fsT} false failure ${off.ffT} | RTAX false support ${off.fsR} false failure ${off.ffR} | edge band ${edge.n}: TODAY false support ${edge.fsT} false failure ${edge.ffT} | RTAX false support ${edge.fsR} false failure ${edge.ffR}`);
  }
  console.log(`${''.padEnd(16)} done`);
}
if (!tot.off) { console.log('AUDIT-RTAXMIS FAILED: no step-year state was read: a print of nothing is an error'); process.exit(1); }
const today = tot.todayFS + tot.todayFF, rtax = tot.rtaxFS + tot.rtaxFF;
console.log(`TOTAL: nodes ${tot.nodes}: RTAX false support ${tot.nodeFS} false failure ${tot.nodeFF} | off-node ${tot.off}: TODAY ${today} (false support ${tot.todayFS}, false failure ${tot.todayFF}), RTAX ${rtax} (false support ${tot.rtaxFS}, false failure ${tot.rtaxFF})`);
const eT = tot.eTodayFS + tot.eTodayFF, eR = tot.eRtaxFS + tot.eRtaxFF;
console.log(`EDGE BAND: ${tot.edge} states: TODAY ${eT} (false support ${tot.eTodayFS}, false failure ${tot.eTodayFF}), RTAX ${eR} (false support ${tot.eRtaxFS}, false failure ${tot.eRtaxFF}); the bar on the band: ${eR < eT / 10 && eR <= 0.01 * tot.edge ? 'MET' : 'NOT MET'} (RTAX/TODAY ${eT ? (eR / eT).toFixed(4) : '-'}, RTAX share ${(eR / tot.edge).toFixed(4)})`);
console.log(`BAR (items/RTAX.md test 6: RTAX under a tenth of TODAY's off-node cases and at most 1% of the positions): ${rtax < today / 10 && rtax <= 0.01 * tot.off ? 'MET' : 'NOT MET'} (RTAX/TODAY ${today ? (rtax / today).toFixed(4) : '-'}, RTAX share ${(rtax / tot.off).toFixed(4)})`);
