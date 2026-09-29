/*
 * O36'S PREMISE, TESTED BY DRAW ORDER (PLAN.md register O36: "the reader's reference on bridges of two years or more (the
 * plan's tiers, the opening mix) - a fix of its own"). A description, grade C; no solve, no test registered.
 *   The reader's reference (solve.js chanceOf) pays each bridge year's bill from the accessible pots IN PROPORTION to the
 *   opening balances (the ISA, the taxable account and cash, as one lognormal mix). The solver does not draw that way: a
 *   move's draw order (solve.js buildActions) takes cash, then the taxable account, then the ISA - or the ISA first, then
 *   cash, then the taxable account - and the solver chooses among them. On share 0.95 this prints, per world, the chance the
 *   bridge is paid at the plan's tiers:
 *     (a) the reference's own closed form (referenceChance, as solve.js builds it);
 *     (b) a direct simulation of the reference's own model (one lognormal mix) - (a) and (b) must agree, or the closed
 *         form is the fault;
 *     (c) direct simulations of each draw order, pot by pot: the ISA and the taxable account on one shared return draw a
 *         year (the solver's nodeRealOf: exp(ln(1 + R) + V z), one z), cash at its own rate and volatility;
 *   and, beside them, the engine's own bridge failures in 7x's run with the tier held at the plan's tiers for life
 *   (results/diag7x/share_0.95-reader@h00@m3, the paths whose money runs out in the bridge years).
 *   Its check: (a) and (b) within 0.5 points in every world, or it stops. 200,000 draws a world, seeded.
 *   node research/solver/look-o36-order.mjs > research/solver/results-o36-order.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { buildActions } from '../../src/solver/solve.js';
import { bridgeTable, vecOf } from '../../src/solver/grid.js';
import { referenceChance } from '../../src/solver/reader.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { decode } from './reduce-7t.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// share 0.95 built exactly as read-o36-p0.mjs builds it (audit-s126.mjs's variant)
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
const s126 = buildScenarios().find(s => s.id === 'S126');
const p = JSON.parse(JSON.stringify(s126.plan));
const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(0.95 * W) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * 0.05 * W) }; return a; });
{ const nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - 2; p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) }; }
const plan = E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const m = M.prepare(E, plan);
const s0 = vecOf(m, M.initialState(m));
const actions = buildActions({ spendLevels: [0.8, 0.9, 0.95, 1, 1.1], tiers: [[0, 0], [2, 2]] });

let seed = 7002 >>> 0;
const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const DRAWS = 200000, TOL = 1;

const o = m.ctx.owners[0], bal = id => (id && m.acc[id] ? m.acc[id].balance : 0);
const bi = bal(o.ids.isa), bg = bal(o.ids.other), bc = bal(o.ids.cash), tot = bi + bg + bc;
const wi = bi / tot, wg = bg / tot, wc = bc / tot;
console.log(`O36'S PREMISE BY DRAW ORDER: share 0.95's bridge at the plan's tiers (accessible money ${Math.round(s0[1] + s0[2])}: ISA ${Math.round(bi)}, taxable ${Math.round(bg)}, cash ${Math.round(bc)}); ${DRAWS} draws a world; grade C, a description`);
const WORLDS = [[-Math.sqrt(3), 1 / 6], [0, 2 / 3], [Math.sqrt(3), 1 / 6]];
const agg = { a: 0, b: 0, cashFirst: 0, isaFirst: 0 };
let bad = false;
for (const [z, wt] of WORLDS) {
  m.shiftZ = z;
  const c = F.compile(m, actions);
  const B = bridgeTable(E, m, c, 0.8, 2);
  const bills = []; for (let j = 0; j < B.accessAt; j++) bills.push(B.needY[j] - B.inY[j]);
  // (a) the reference's closed form, as solve.js builds it
  const rho = [], vol = [];
  for (let j = 0; j < bills.length - 1; j++) {
    const vi = c.volEffAt[j][1], vg = c.volEffAt[j][2], vc = c.volEffAt[j][3] || 0, v = wi * vi + wg * vg + wc * vc;
    const gross = wi * (1 + c.real[1]) * Math.exp(vi * vi / 2) + wg * (1 + c.real[2]) * Math.exp(vg * vg / 2) + wc * (1 + c.real[3]) * Math.exp(vc * vc / 2);
    rho.push(Math.log(gross) - v * v / 2); vol.push(v);
  }
  const pa = referenceChance(bills, rho, vol)(s0[1] + s0[2]);
  // (b) the reference's own model, simulated: one lognormal mix
  let okB = 0;
  for (let d = 0; d < DRAWS; d++) { let acc = s0[1] + s0[2] - bills[0], ok = acc >= -TOL; for (let j = 1; ok && j < bills.length; j++) { acc = Math.max(acc, 0) * Math.exp(rho[j - 1] + vol[j - 1] * gauss()); acc -= bills[j]; if (acc < -TOL) ok = false; } if (ok) okB++; }
  const pb = okB / DRAWS;
  // (c) each draw order, pot by pot (the ISA and the taxable account on one z a year; cash on its own draw)
  const byOrder = order => { let okc = 0;
    for (let d = 0; d < DRAWS; d++) {
      const pot = { isa: bi, other: bg, cash: bc }; let ok = true;
      for (let j = 0; ok && j < bills.length; j++) {
        if (j > 0) { const zr = gauss(), zc = gauss(), g = (k, vi) => Math.exp(Math.log(1 + c.real[k]) + c.volEffAt[j - 1][k] * vi);
          pot.isa *= g(1, zr); pot.other *= g(2, zr); pot.cash *= (c.volEffAt[j - 1][3] ? g(3, zc) : (1 + c.real[3])); }
        let need = bills[j]; for (const k of order) { const take = Math.min(pot[k], need); pot[k] -= take; need -= take; }
        if (need > TOL) ok = false;
      }
      if (ok) okc++;
    }
    return okc / DRAWS; };
  const pc = byOrder(['cash', 'other', 'isa']), pi = byOrder(['isa', 'cash', 'other']);
  if (Math.abs(pa - pb) > 0.005) bad = true;
  agg.a += wt * pa; agg.b += wt * pb; agg.cashFirst += wt * pc; agg.isaFirst += wt * pi;
  const f = x => `${(100 * x).toFixed(2)}%`;
  console.log(`  world z ${z.toFixed(3)} (weight ${wt.toFixed(3)}): bills ${bills.map(Math.round).join(', ')}; paid (a) the reference ${f(pa)}, (b) its model simulated ${f(pb)}; (c) cash, taxable, ISA ${f(pc)}; ISA, cash, taxable ${f(pi)}`);
}
if (bad) { console.log('CHECK FAILED: the reference\'s closed form and its own model simulated differ by more than 0.5 points'); process.exit(1); }
const f = x => `${(100 * x).toFixed(2)}%`;
console.log(`\nWEIGHTED OVER THE WORLDS, the chance the bridge is NOT paid: the reference ${f(1 - agg.a)} (its model simulated ${f(1 - agg.b)}); cash first ${f(1 - agg.cashFirst)}; ISA first ${f(1 - agg.isaFirst)}`);
// the engine's own bridge failures (7x, the tier held at the plan's tiers for life; the draw order the solver chose)
const T = decode(JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', 'diag7x', 'share_0.95-reader@h00@m3.json.gz')))));
let inBridge = 0; for (let i = 0; i < T.N; i++) if (!T.survived[i] && T.failYear[i] >= 0 && T.failYear[i] < 2) inBridge++;
console.log(`THE ENGINE (7x, READER/H00/M3, ${T.N} paths, the solver's own draw order): the bridge not paid on ${inBridge} paths, ${f(inBridge / T.N)}`);
