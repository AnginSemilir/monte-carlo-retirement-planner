/*
 * DOES PREPARING FOR A KNOWN COST MAKE A TANGIBLE DIFFERENCE, AND WHAT DOES IT COST?
 *
 * The lookahead draws the pension at the basic rate in the years before a known one-off cost and parks
 * the money to pay it, instead of letting the cost land on the pension in one year and run through the
 * higher bands. The expected gain is tax, and through tax, survival. The expected cost is growth: money
 * leaves the pension's tax-free compounding early and half of it sits in cash, so the median pot at the
 * end may fall even where survival rises. Which way the trade goes, and by how much, is what this runs.
 *
 * Households: a spread of the library, three ways.
 *   lib   as written - only the cost-early and both flows carry a cost, 6% of wealth three years in
 *   c25   the same household with a cost of 25% of its wealth six years after retirement
 *   c50   the same at 50%
 * Horizons: 0 (today's behaviour), 3, 5, 8 years. Same seed throughout, so every cell sees the same
 * futures and the differences are the rule's alone.
 *
 * Usage: node lookahead-study.mjs [households=30] [trials=1200] [seed=2024]
 *
 * RESULT (30 households, 1200 paths, seed 2024, growth-aware projection of the liquid wrappers):
 *
 *   The rule acted in 7 of 60 cost variants and never on the library as written. Of the 53 idle
 *   variants, 47 had the cost covered by the liquid wrappers on the expected path with no extra pension
 *   draw, so idleness was right. The other six were misses of two kinds: households whose living draw
 *   already fills the basic-rate band (S308: £358k a year from a £3.6m pension), where the ceiling
 *   leaves no room by design; and households whose liquid covers the cost but is then not there for
 *   that year's living draw, which falls on the pension instead (S070, S406: an extra £25k-£120k).
 *
 *   Where it acted, five-year horizon:
 *     c25 (3)  survival  0.00 mean   median pot  +10k   tax  -8.5k   cost-year pension draw  -53k
 *     c50 (4)  survival +0.71 mean   median pot  +71k   tax -24.2k   cost-year pension draw -146k
 *   Best +3.1 survival (S126 c50: 279k drawn in the cost year became 33k, tax -29k, median +114k);
 *   worst -0.3 (S182 c50, noise: it set aside 7k for a draw that did not change). Two households
 *   over-prepared by 7k-25k against a shortfall that later growth erased, costing 1k-4k of tax and
 *   10k-44k of median pot. Three and eight years score within noise of five.
 *
 *   So: no tangible difference for most households, because most have the liquid to pay a known cost
 *   already; a large one for the pension-heavy household facing a cost it cannot meet from liquid, and
 *   the median pot rises rather than falls there, because twenty points of tax outweigh a few years of
 *   the pension's extra growth. It never cost more than a point of survival anywhere.
 */
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';

const N = Number(process.argv[2] || 30), TRIALS = Number(process.argv[3] || 1200), SEED = Number(process.argv[4] || 2024);
const HORIZONS = [0, 3, 5, 8];
const all = buildScenarios();
const pick = [];
for (let i = 0; i < N; i++) pick.push(all[Math.floor(i * all.length / N)]);

const wealthOf = (plan) => plan.accounts.reduce((s, a) => s + E.num(a.balance, 0), 0);
const withCost = (sc, share) => {
  const p = JSON.parse(JSON.stringify(sc.plan));
  const d = p.demographics;
  const ctx = E.buildContext(p);
  // six years after retirement, and never before the pension can be reached
  const yearsToCost = Math.max(d.retireAgeSelf - d.currentAgeSelf, ctx.nmpa - d.currentAgeSelf) + 6;
  const year = ctx.baseYear + yearsToCost;
  if (d.currentAgeSelf + yearsToCost >= d.terminalAge - 3) return null;
  p.oneOffCosts = [...(p.oneOffCosts || []), { id: 'study', date: `${year}-06-01`, year, owner: 'Myself', amount: Math.round(wealthOf(p) * share), desc: 'study cost' }];
  return p;
};
const variants = (sc) => [['lib', sc.plan], ['c25', withCost(sc, 0.25)], ['c50', withCost(sc, 0.5)]].filter(([, p]) => p);

const score = (plan, look) => {
  const p = JSON.parse(JSON.stringify(plan)); p.config = { ...p.config, lookaheadYears: look };
  const mc = E.monteCarlo(p, { trials: TRIALS, seed: SEED });
  const rows = E.simulateDeterministic(p, 'expected');
  const costYears = new Set((p.oneOffCosts || []).map(c => Number(c.year)));
  const costRows = rows.filter(r => costYears.has(r.year));
  return {
    survival: mc.successRate, median: mc.medianTerminalNet, p10: mc.p10TerminalNet, tax: mc.medianLifetimeTax,
    costYearPension: costRows.reduce((s, r) => s + r.drawdownPensions, 0),
    reserved: rows.reduce((s, r) => s + r.reserved, 0), acted: rows.some(r => r.reserved > 0)
  };
};

console.log(`${pick.length} households, ${HORIZONS.join('/')}-year horizons, ${TRIALS} paths, seed ${SEED}\n`);
const out = [];
const t0 = Date.now();
for (const sc of pick) {
  for (const [variant, plan] of variants(sc)) {
    const cells = {};
    for (const h of HORIZONS) cells[h] = score(plan, h);
    const base = cells[0];
    if (!cells[5].acted) { out.push({ id: sc.id, variant, acted: false }); continue; }
    const d = (h, k) => cells[h][k] - base[k];
    out.push({ id: sc.id, variant, acted: true, base,
      dSurv: Object.fromEntries(HORIZONS.map(h => [h, d(h, 'survival')])),
      dMed: Object.fromEntries(HORIZONS.map(h => [h, d(h, 'median')])),
      dP10: Object.fromEntries(HORIZONS.map(h => [h, d(h, 'p10')])),
      dTax: Object.fromEntries(HORIZONS.map(h => [h, d(h, 'tax')])),
      dPen: Object.fromEntries(HORIZONS.map(h => [h, d(h, 'costYearPension')])) });
    const c = cells[5];
    console.log(`${sc.id.padEnd(5)} ${variant} ${sc.name.slice(0, 34).padEnd(35)} surv ${base.survival.toFixed(1).padStart(5)} -> ${c.survival.toFixed(1).padStart(5)} (${d(5, 'survival') >= 0 ? '+' : ''}${d(5, 'survival').toFixed(1)})  median ${(d(5, 'median') / 1000).toFixed(0).padStart(5)}k  p10 ${(d(5, 'p10') / 1000).toFixed(0).padStart(4)}k  tax ${(d(5, 'tax') / 1000).toFixed(0).padStart(4)}k  cost-year pension ${(base.costYearPension / 1000).toFixed(0)}k -> ${(c.costYearPension / 1000).toFixed(0)}k  set aside ${(c.reserved / 1000).toFixed(0)}k`);
  }
}
const acted = out.filter(r => r.acted);
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
console.log(`\n${out.length} household-variants in ${((Date.now() - t0) / 1000).toFixed(0)}s; the rule acted in ${acted.length} (the rest have no cost inside a horizon after retirement)`);
for (const v of ['lib', 'c25', 'c50']) {
  const rs = acted.filter(r => r.variant === v); if (!rs.length) { console.log(`\n${v}: the rule never acted`); continue; }
  console.log(`\n${v}  (${rs.length} households)      horizon   survival Δ (mean / median)   up>1pt  down>1pt   median pot Δ   p10 Δ   lifetime tax Δ   cost-year pension Δ`);
  for (const h of HORIZONS.slice(1)) {
    const s = rs.map(r => r.dSurv[h]);
    console.log(`  ${String(h).padStart(28)}y   ${mean(s).toFixed(2).padStart(6)} / ${med(s).toFixed(2).padStart(6)}        ${String(s.filter(x => x > 1).length).padStart(4)}     ${String(s.filter(x => x < -1).length).padStart(4)}     ${(mean(rs.map(r => r.dMed[h])) / 1000).toFixed(1).padStart(8)}k  ${(mean(rs.map(r => r.dP10[h])) / 1000).toFixed(1).padStart(6)}k   ${(mean(rs.map(r => r.dTax[h])) / 1000).toFixed(1).padStart(8)}k   ${(mean(rs.map(r => r.dPen[h])) / 1000).toFixed(1).padStart(8)}k`);
  }
}
