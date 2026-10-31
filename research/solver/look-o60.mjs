/*
 * O60: A TIER'S RETURN AGAINST THE MEDIAN OF ITS BLEND (PLAN.md O60; the plan-auditor, 29 Sep; the deep review, 29 Sep 21:08).
 * research/cma-import.py makes each tier's return by blending the equity and gilt figures LINEARLY (blend(): w e + (1 - w) b),
 * while its volatility is blended at the source's correlation (blend_vol). The solver reads a tier's R as a median (7m). The
 * median growth of a blend rebalanced each year is, in log terms, the weighted log medians plus the diversification return,
 *   g = w ln(1 + e) + (1 - w) ln(1 + b) + (w se^2 + (1 - w) sb^2 - sp^2) / 2,  sp^2 = w^2 se^2 + (1 - w)^2 sb^2 + 2 w (1 - w) rho se sb,
 * so its median return is exp(g) - 1. This prints, per tier, the import's linear figure, the blend's median and the gap, and the
 * step the panel's de-risk takes (High Risk to Medium Risk, the pension's two-tier move). Declared: the source's volatilities are
 * used as log-return standard deviations (they are annual arithmetic figures; the difference is second order).
 * Checks: the linear blend must reproduce cma-gbp.json's tier nominal figures to 0.01 (the import's own arithmetic), and at an
 * equity weight of 1 or 0 the gap must be 0 (no diversification), or it stops.
 *   node research/solver/look-o60.mjs > research/solver/results-o60.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const J = JSON.parse(readFileSync(join(HERE, '..', 'tests', 'cma-gbp.json'), 'utf8'));
const H = String(J.horizonYears), rho = J.correlationEquityBond, infl = J.inflationUsed / 100;
const eq = J.assets[J.equityProxy], bd = J.assets[J.bondProxy];
const e = eq.expected[H] / 100, b = bd.expected[H] / 100, se = eq.volatility / 100, sb = bd.volatility / 100;
const WEIGHTS = [['High Risk', 0.9], ['Medium/High Risk', 0.7], ['Medium Risk', 0.5], ['Medium/Low Risk', 0.3], ['Low Risk', 0.1]];
const real = nom => (1 + nom) / (1 + infl) - 1;
const linear = w => w * e + (1 - w) * b;
const median = w => { const sp2 = w * w * se * se + (1 - w) ** 2 * sb * sb + 2 * w * (1 - w) * rho * se * sb; return Math.exp(w * Math.log(1 + e) + (1 - w) * Math.log(1 + b) + (w * se * se + (1 - w) * sb * sb - sp2) / 2) - 1; };
// checks
const bad = WEIGHTS.filter(([k, w]) => Math.abs(100 * linear(w) - J.tiers[k].nominal) > 0.01).map(([k]) => k);
const ends = [0, 1].map(w => Math.abs(median(w) - (w ? e : b)));
if (bad.length || ends.some(x => x > 1e-12)) { console.log(`CHECK FAILED: the linear blend misses the import's nominal on ${bad.join(', ') || 'none'}; the gap at w = 0 and 1: ${ends.map(x => x.toExponential(2)).join(', ')}`); process.exit(1); }
console.log(`O60: EACH TIER'S RETURN (the import's linear blend) AGAINST THE MEDIAN OF ITS BLEND REBALANCED YEARLY (${J.source}, ${H}-year horizon; ${J.equityProxy} and ${J.bondProxy}, correlation ${rho}; real at ${(100 * infl).toFixed(1)}% inflation)`);
console.log('  tier                equity  linear (the model)  blend median  gap (points a year)');
const row = {};
for (const [k, w] of WEIGHTS) {
  const lin = 100 * real(linear(w)), med = 100 * real(median(w)); row[k] = { lin, med };
  console.log(`  ${k.padEnd(18)}  ${w.toFixed(1).padStart(6)}  ${lin.toFixed(2).padStart(17)}%  ${med.toFixed(2).padStart(11)}%  ${(med - lin).toFixed(2).padStart(8)}`);
}
const a = row['High Risk'], m = row['Medium Risk'];
console.log(`\nTHE PANEL'S DE-RISK (the pension from High Risk to Medium Risk): the model's step ${(a.lin - m.lin).toFixed(2)} points a year; the blend medians' step ${(a.med - m.med).toFixed(2)}; the model overcharges it by ${((a.lin - m.lin) - (a.med - m.med)).toFixed(2)} points a year`);
console.log(`checks: the linear blend reproduces the import's ${WEIGHTS.length} tier nominal figures to 0.01; the gap is 0 at an equity weight of 0 and 1`);
