/*
 * COV'S FLOW-AT-EDGE PRINT (the deep review of COV-B's implementation, deep-review-log.md 4 Oct 20:19 UK, BLOCKING 1: "a
 * no-solve print: F.flow at the edge-node states, every ISA share and gain bucket, on the floor moves, for the four
 * households; count unmet > 1"). A MEASUREMENT with no test. The reference chance carries no tax (reader.js l.56-61, the
 * bills needY - inY), while the flow's year pays savings, dividend and capital gains tax; a node at the reference's edge
 * can then fail every move, its survival the clamp and its c 0, copied to every node above it.
 * PMAP's unit (READER/TS+J/W0.02/PCLSI, 6 share points) on PMAP's five households, solved at 4 wealth points only to get the
 * compiled year (r.c: the cell loop's flow is the centre world's, solve.js l.778), the moves and the reader's references;
 * the edge states are placed on the 30-point unit's own wealth rows (makeGrid at 30 points, 6 shares, as solvePlan builds
 * it). In every step year t (every world's reference 1 at d0 - tol/2 and 0 at d0 - 2 tol) and every wealth row j with
 * 0 < a*_j < 1, a*_j = 1 - (d0 - tol/2) / W_j, at every ISA share b node, gain bucket and allowance bucket it flows every
 * move from the edge state and prints: the cells where the floor moves all fail, where every move fails (a dead node),
 * and the largest unmet among the dead, with the cash tax paid on the best move.
 * Planted (each must hold or the print stops): the state at a = 1 (no accessible money) fails every move in a step year;
 * the state at a = 0 on the richest row passes at least one move.
 *   node research/solver/audit-covflow.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { makeGrid, toVec } from '../../src/solver/grid.js';
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
const L = 'READER/TS+J/W0.02/PCLSI', TOL = 1;
console.log(`COV'S FLOW-AT-EDGE PRINT: ${L} at ${SH} share points; edge states on the 30-point unit's wealth rows; per household and step year: rows with an edge, cells, cells where the floor moves all fail, cells where every move fails (dead)`);
let total = 0, totalDead = 0, planted = 0;
for (const id of UNITS) {
  const h = caseOf(id);
  if (!h) { console.error(`audit-covflow: no case ${id}`); process.exit(2); }
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, shares: SH, bridgeRead: 'reader', bequestWeight: W, tierState: true, jointWorlds: true, pclsInterp: true, e3: false });
  const g = r.g, c = r.c, acts = r.actions, K = r.worlds.length, T = r.m.ctx.totalYears;
  if (!c || !acts || !acts.length) { console.error(`audit-covflow: ${id}: the solve returned no compiled year or moves`); process.exit(2); }
  const g30 = makeGrid(r.m, { points: 30, shares: SH });
  const lv = acts.map(a => (a.spendLevel !== undefined ? a.spendLevel : 1)), floor = Math.min(...lv);
  console.log(`${id.padEnd(16)} case | unit ${L} | worlds ${K} | moves ${acts.length} (floor level ${floor}: ${lv.filter(x => x === floor).length}) | rows ${g30.np} | reader ${g.reader ? 'yes' : 'no'} | secs ${Math.round((Date.now() - t0) / 1000)}`);
  if (!g.reader) { console.log(`${''.padEnd(16)} none: no reader year`); console.log(`${''.padEnd(16)} done`); continue; }
  const v = new Float64Array(7), buf = new Float64Array(7);
  const runAll = (t, s) => { let any = false, anyFloor = false, worst = Infinity, tax = 0; for (let ai = 0; ai < acts.length; ai++) { buf.set(s); const u = F.flow(c, t, ai, buf); const fail = u > 1 || c.last.preNmpaInsolvent; if (!fail) { any = true; if (lv[ai] === floor) anyFloor = true; } if (u < worst) { worst = u; tax = (c.last.taxPaid || 0) + (c.last.cgtPaid || 0); } } return { any, anyFloor, worst, tax }; };
  for (let t = 0; t <= T; t++) {
    if (!g.reader.years[t]) continue;
    const fs = Array.from({ length: K }, (_, k) => g.reader.chanceOf(k, t)), d0 = fs[0].schedule.bills[0];
    const step = fs.every(f => f.schedule.bills[0] === d0 && f(d0 - TOL / 2) === 1 && f(d0 - 2 * TOL) === 0);
    if (!step) { console.log(`${''.padEnd(16)} year ${t}: spread (no node)`); continue; }
    // the planted checks: a = 1 fails every move; a = 0 on the richest row passes one
    toVec(g30, g30.np - 1, SH - 1, 0, 0, 0, v); if (runAll(t, v).any) { console.log(`AUDIT-COVFLOW FAILED: ${id} year ${t}: the a = 1 state passes a move (the counter cannot see a failure)`); process.exit(1); }
    toVec(g30, g30.np - 1, 0, 0, 0, 0, v); if (!runAll(t, v).any) { console.log(`AUDIT-COVFLOW FAILED: ${id} year ${t}: the a = 0 state on the richest row fails every move`); process.exit(1); }
    planted += 2;
    let rows = 0, cells = 0, floorFail = 0, dead = 0, worstDead = 0, taxDead = 0; const deadBy = {};
    for (let ip = 0; ip < g30.np; ip++) {
      const Wj = g30.axes.W.pts[ip], a = Wj > 0 ? 1 - (d0 - TOL / 2) / Wj : -Infinity;
      if (!(a > 0 && a < 1)) continue;
      rows++;
      for (let it = 0; it < g30.nt; it++) for (let ig = 0; ig < g30.gain.length; ig++) for (let ic = 0; ic < g30.pcls.length; ic++) {
        toVec(g30, ip, 0, it, ig, ic, v);
        const pen = a * Wj, rest = Wj - pen, b = g30.axes.b.pts[it], isa = b * rest; v[0] = pen; v[1] = isa; v[2] = rest - isa;
        const o = runAll(t, v); cells++;
        if (!o.anyFloor) floorFail++;
        if (!o.any) { dead++; const k = `gain ${g30.gain[ig]} b ${b.toFixed(1)}`; deadBy[k] = (deadBy[k] || 0) + 1; if (o.worst > worstDead) { worstDead = o.worst; taxDead = o.tax; } }
      }
    }
    total += cells; totalDead += dead;
    console.log(`${''.padEnd(16)} year ${t}: step | d0 ${d0.toFixed(0)} | rows with an edge ${rows} | cells ${cells} | floor moves all fail ${floorFail} | dead ${dead} | largest unmet among the dead ${worstDead.toFixed(0)} (tax on its best move ${taxDead.toFixed(0)})${dead ? ` | dead by ${Object.entries(deadBy).map(([k, n]) => `${k}: ${n}`).join(', ')}` : ''}`);
  }
  console.log(`${''.padEnd(16)} done`);
}
if (!total) { console.log('AUDIT-COVFLOW FAILED: no edge cell was flowed: a print of nothing is an error'); process.exit(1); }
console.log(`TOTAL: ${total} edge cells flowed, ${totalDead} dead; ${planted} planted checks held`);
