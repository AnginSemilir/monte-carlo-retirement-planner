/*
 * COV'S EDGE PRINT (PLAN.md COV; the deep review after PMAP, deep-review-log.md 4 Oct 18:35 UK: "before the build, a no-solve
 * print of acc*_k over req[t] by household, world and bridge year"; the maintainer's go-ahead, the 4 Oct 18:49 row). A
 * MEASUREMENT with no test. PMAP's unit (READER/TS+J/W0.02/PCLSI, 6 share points) on PMAP's five households, solved at 4
 * wealth points only to build the reader: each world's reference chance (g.reader.chanceOf) depends on the year's bills and
 * that world's rates at the plan's tiers, not on the grid's resolution, so the threshold it gives is the 30-point run's.
 * For every reader year t and world k it prints:
 *   d0      the year's own bill (needY - inY at t), the step edge being d0 less the tolerance (1);
 *   req     bridgeTable v2's req[t]: the worst zero-growth prefix of the bills net of inflows (the bills the reader reads);
 *   acc*    the least accessible money at which the chance reaches one half (audit-pmap.mjs's bisection);
 *   step    whether the chance is a pure 0/1 step (every value 0 or 1 on a grid of 400 points to five times req);
 *   acc* over req, and acc* less (d0 - 1) over d0: the edge's place against the bill and against A1's normaliser.
 * A line a household also gives the largest spread of acc* across the worlds in each year (the joint-worlds question).
 *   node research/solver/audit-covedge.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
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
const L = 'READER/TS+J/W0.02/PCLSI';
console.log(`COV'S EDGE PRINT: ${L} at ${SH} share points, solved at ${POINTS} wealth points to build the reader; per household, reader year and world: d0, req, acc*, step, acc*/req, (acc* - (d0 - 1)) / d0`);
const f0 = x => (Number.isFinite(x) ? x.toFixed(0) : String(x)), f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
for (const id of UNITS) {
  const h = caseOf(id);
  if (!h) { console.error(`audit-covedge: no case ${id}`); process.exit(2); }
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, shares: SH, bridgeRead: 'reader', bequestWeight: W, tierState: true, jointWorlds: true, pclsInterp: true, e3: false });
  const g = r.g, K = r.worlds.length, T = r.m.ctx.totalYears;
  if (!r.meta.tierState || !r.meta.jointWorlds || g.pclsInterp !== true || g.ni !== SH) { console.error(`audit-covedge: ${id} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} pclsInterp ${g.pclsInterp} shares ${g.ni}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | worlds ${K} | reader ${g.reader ? 'yes' : 'no'} | secs ${Math.round((Date.now() - t0) / 1000)}`);
  if (!g.reader) { console.log(`${''.padEnd(16)} none: no reader year`); console.log(`${''.padEnd(16)} done`); continue; }
  let n = 0;
  for (let t = 0; t <= T; t++) {
    if (!g.reader.years[t]) continue;
    const accs = [];
    for (let k = 0; k < K; k++) {
      const f = g.reader.chanceOf(k, t), bills = f.schedule.bills, d0 = bills[0];
      let cum = 0, req = -Infinity; for (const b of bills) { cum += b; req = Math.max(req, cum); }
      // the threshold: the least accessible money at which the chance reaches one half (the chance rises with money)
      let lo = 0, hi = Math.max(1, 2 * req), acc;
      if (f(0) >= 0.5) acc = 0; else { while (f(hi) < 0.5 && hi < 1e12) hi *= 2; if (f(hi) < 0.5) acc = Infinity; else { for (let i = 0; i < 200 && hi - lo > 1e-6 * Math.max(1, hi); i++) { const mid = (lo + hi) / 2; if (f(mid) >= 0.5) hi = mid; else lo = mid; } acc = hi; } }
      let step = true; for (let i = 0; i <= 400 && step; i++) { const q = f(5 * Math.max(req, 1) * i / 400); if (!(q <= 1e-12 || q >= 1 - 1e-12)) step = false; }
      accs.push(acc); n++;
      console.log(`${''.padEnd(16)} edge year ${t} world ${k}: d0 ${f0(d0)} req ${f0(req)} acc* ${f0(acc)} step ${step ? 'yes' : 'no'} bills ${bills.length} accreq ${f4(acc / req)} accd0 ${f4((acc - (d0 - 1)) / d0)}`);
    }
    const fin = accs.filter(Number.isFinite);
    console.log(`${''.padEnd(16)} spread year ${t}: acc* from ${f0(Math.min(...fin))} to ${f0(Math.max(...fin))} across ${K} worlds, the largest over the least ${f4(Math.max(...fin) / Math.min(...fin))}`);
  }
  console.log(`${''.padEnd(16)} done ${n} reads`);
}
