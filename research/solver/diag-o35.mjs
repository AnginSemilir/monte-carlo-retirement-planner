/*
 * O35'S DIAGNOSTIC (PLAN.md O35's gate; the ledger 27 Sep 21:29, step (b)): WHERE IS THE EDGE THE FIVE POINTS MISS ON SHARE 0.95?
 * A measurement, run through the launcher (PREDICTION="none:..."), no test. One solve of share 0.95 at the product's settings
 * with the reader (solvePlan, 30 points, 5 return points, the 'auto' risk above, lambda held at 7t's to 7x's, the final year
 * exact; the plan prepared as audit-s126.mjs's measureV2 prepares it). At the opening state, for every move at year 0, in each
 * world: the year's flow; next year's reader bill (the menu's lowest level's floor, the reader's first bill at t = 1) and where
 * its step falls in the year's return (z*: the accessible money after the year's growth just meets the bill less 1); and next
 * year's table read (survival, through the reader, as the backward pass reads it) averaged over the year's return by 5 points
 * (the product's) and 15 (Gauss-Hermite), and by 4,000 equal-probability points (the reference). Then, for each spend level, the de-risk's year-1 value as
 * each average sees it: the plan's tier against 2/2 (the freed opening's pair), mixture-weighted.
 *   node research/solver/diag-o35.mjs [points=30] > research/solver/results-o35-diag.txt
 * Grade C: one household, one state, the table's own read (no simulated paths).
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solvePlan, gaussHermite, NODES, WEIGHTS } from '../../src/solver/solve.js';
import { vecOf, readValues } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const POINTS = Number(process.argv[2] || 30), LAMBDA = 0.0223606797749979;
// share 0.95 as audit-s126.mjs's variant builds it: 95% of the wealth in the pension, the rest in the accessible pots pro
// rata, the household two years before its pension age
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
const s126 = buildScenarios().find(s => s.id === 'S126');
const p = JSON.parse(JSON.stringify(s126.plan));
const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(0.95 * W) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * 0.05 * W) }; return a; });
{ const nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - 2; p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) }; }
// as measureV2: guardrails and the lookahead off, the floor 0.8 of the target
const plan = E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const t0 = Date.now();
const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: 'reader' });
const secs = Math.round((Date.now() - t0) / 1000);
const s0 = vecOf(r.m, M.initialState(r.m)), g = r.g;
const realAt = (c, z, out, act, t) => { const R = act.real, V = act.volEffAt[t]; for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + R[i]) + V[i] * z) - 1; return out; };
// the reference: 4,000 equal-probability points (the midpoint in u = Phi(z)). Not Gauss-Hermite at 201: solve.js
// gaussHermite underflows at that order (its weights sum to about 3.6e-162, its nodes collapse), checked 27 Sep; the solver
// uses it at 15 at most. PhiInv by Acklam's rational approximation (relative error under 1.2e-9).
const PhiInv = p => { const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572], c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]; const pl = 0.02425; if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); } if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); } const q = p - 0.5, r2 = q * q; return (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * q / (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1); };
const DENSE = 4000, dense = { nodes: Array.from({ length: DENSE }, (_, i) => PhiInv((i + 0.5) / DENSE)), weights: new Array(DENSE).fill(1 / DENSE) };
const rules = { 5: { nodes: NODES, weights: WEIGHTS }, 15: gaussHermite(15), dense };
// a planted check (rule 6): each rule integrates 1 and z^2 under the normal (weights sum to 1; the second moment 1). The
// tolerance on the sum is 1e-5: the product's 5-point WEIGHTS are printed to six decimals and sum to 0.999999 (the first
// re-run stopped here, 27 Sep; runs.log 22:02); the fault it was planted for, gaussHermite(201), sums to about 3.6e-162
for (const [n, q] of Object.entries(rules)) { const s0 = q.weights.reduce((t, w) => t + w, 0), s2 = q.nodes.reduce((t, z, i) => t + q.weights[i] * z * z, 0); if (Math.abs(s0 - 1) > 1e-5 || Math.abs(s2 - 1) > 2e-3) { console.log(`PLANTED CHECK FAILED: the ${n}-point rule integrates 1 to ${s0} and z^2 to ${s2}`); process.exit(1); } }
console.log(`O35'S DIAGNOSTIC: share 0.95, the product's settings with the reader, ${POINTS} points, 5 return points (solve ${secs} s); mixture ${r.meta.mixture} worlds, weights ${r.mix.weights.map(w => w.toFixed(4)).join(', ')}; the opening state (pension ${Math.round(s0[0])}, ISA ${Math.round(s0[1])}, taxable and cash ${Math.round(s0[2])})`);
console.log(`the reader's years: ${Array.from(g.reader.years).map((v, i) => (v ? i : -1)).filter(i => i >= 0).join(', ')}; the risk above: ${r.meta.riskAbove ? r.meta.riskAbove.decision : 'unset'}\n`);
const rows = [];
for (let k = 0; k < r.worlds.length; k++) {
  const tab = r.worlds[k], c = tab.c;
  const RD = g.reader.of.get(tab.lsurv[1]), bills = RD && RD.chance.schedule ? RD.chance.schedule.bills : [];
  const stepAt = bills.length ? bills[0] - 1 : null;
  console.log(`WORLD ${k} (shift ${r.mix.nodes[k].toFixed(3)}): the reader's bills from year 1: ${bills.map(Math.round).join(', ')}; the step at accessible money ${stepAt === null ? 'none' : Math.round(stepAt)}`);
  console.log('  move                                       level tier  flow   z*       5 points   15 points  4000 points  (next year\'s survival read, %)');
  const post = new Float64Array(s0.length), grown = new Float64Array(s0.length), rb = new Float64Array(4), rd = new Float64Array(4);
  for (let ai = 0; ai < tab.actions.length; ai++) {
    const act = c.acts[ai];
    post.set(s0);
    const unmet = F.flow(c, 0, ai, post);
    const fails = unmet > 1 || c.last.preNmpaInsolvent;
    const accAt = z => { grown.set(post); F.grow(c, 0, grown, realAt(c, z, rb, act, 0)); return grown[1] + grown[2]; };
    let zs = null;
    if (!fails && stepAt !== null) {
      if (accAt(-9) >= stepAt) zs = -Infinity; else if (accAt(9) < stepAt) zs = Infinity;
      else { let lo = -9, hi = 9; while (hi - lo > 1e-9) { const m = 0.5 * (lo + hi); if (accAt(m) >= stepAt) hi = m; else lo = m; } zs = hi; }
    }
    const ev = n => { if (fails) return 0; const q = rules[n]; let s = 0; for (let j = 0; j < q.nodes.length; j++) { accAt(q.nodes[j]); readValues(g, tab.lsurv[1], tab.beq[1], grown, rd, tab.lresil[1], tab.short[1], 1); s += q.weights[j] * rd[0]; } return s; };
    const row = { k, ai, level: act.level, tp: act.tierPen, ti: act.tierIsa, fails, zs, e5: ev(5), e15: ev(15), e201: ev('dense'), label: tab.actions[ai].label };
    rows.push(row);
  }
  // one line per level and tier: the move with the best reference read (the withdrawal order matters little here)
  const best = new Map();
  for (const x of rows.filter(x => x.k === k)) { const key = `${x.level}|${x.tp}/${x.ti}`; if (!best.has(key) || x.e201 > best.get(key).e201) best.set(key, x); }
  for (const x of [...best.values()].sort((a, b) => b.level - a.level || a.tp - b.tp)) {
    const z = x.zs === null ? '   -   ' : !Number.isFinite(x.zs) ? (x.zs < 0 ? '  below' : '  above') : x.zs.toFixed(3).padStart(7);
    console.log(`  ${x.label.slice(0, 42).padEnd(42)} ${x.level.toFixed(2)}  ${x.tp}/${x.ti}  ${x.fails ? 'FAIL' : ' ok '} ${z}  ${(100 * x.e5).toFixed(3).padStart(9)}  ${(100 * x.e15).toFixed(3).padStart(9)}  ${(100 * x.e201).toFixed(3).padStart(9)}`);
  }
  console.log('');
}
// the de-risk's year-1 value as each average sees it, mixture-weighted: per level, the best move at 2/2 less the best at 0/0
console.log('THE DE-RISK\'S YEAR-1 VALUE (next year\'s survival read, points, mixture-weighted): the best move at 2/2 less the best at 0/0, per spend level');
const levels = [...new Set(rows.map(x => x.level))].sort((a, b) => b - a);
for (const lv of levels) {
  const at = (tier, n) => r.worlds.reduce((t, _, k) => { const xs = rows.filter(x => x.k === k && x.level === lv && `${x.tp}/${x.ti}` === tier); return t + r.mix.weights[k] * Math.max(...xs.map(x => x[n])); }, 0);
  const d = n => 100 * (at('2/2', n) - at('0/0', n));
  console.log(`  level ${lv.toFixed(2)}: 5 points ${d('e5').toFixed(4)}, 15 points ${d('e15').toFixed(4)}, 4000 points ${d('e201').toFixed(4)}`);
}
