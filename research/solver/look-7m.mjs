/*
 * 7M: IS THE CAPITAL-MARKET SOURCE'S RETURN FIGURE A MEDIAN OR A MEAN? (PLAN.md 7m; the outside review's Finding 3.)
 * The solver grows a pot by exp(ln(1 + R) + V z) - R the MEDIAN of a year's gross - and R comes from the source's
 * "expected" return (research/cma-import.py, deflated). The source (research/tests/cma-gbp.json: BlackRock's workbook,
 * imported) publishes, per asset and horizon T, an expected annualised return and the 25th and 75th percentiles of the
 * annualised return. The annualised log return is symmetric about its median, so:
 *   if "expected" is the MEDIAN (the geometric, compound figure): ln(1 + expected) sits at the IQR's log midpoint;
 *   if it is the arithmetic MEAN of yearly returns: it sits above the midpoint by about half a year's log variance
 *   (sigma^2 / 2, with sigma the asset's published volatility) - about 1.1 points for equities at 15% volatility.
 * This prints, per asset and horizon, the gap ln(1 + expected) - midpoint beside sigma^2 / 2, and the verdict.
 * Its check: the rule must tell the two apart on a planted mean (expected moved up by sigma^2 / 2), or it stops.
 *   node research/solver/look-7m.mjs > research/solver/results-7m.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const J = JSON.parse(readFileSync(join(HERE, '..', 'tests', 'cma-gbp.json'), 'utf8'));
const assets = Object.values(J.assets);
const ln1 = pct => Math.log(1 + pct / 100);
const gapOf = (exp, b) => ln1(exp) - (ln1(b.p25) + ln1(b.p75)) / 2;
// the verdict for one asset: the mean gap over horizons against half the variance
const verdict = (gaps, half) => (Math.abs(gaps) < 0.25 * half ? 'MEDIAN' : Math.abs(gaps - half) < 0.25 * half ? 'MEAN' : 'NEITHER');
console.log(`7M: THE SOURCE'S "EXPECTED" RETURN - MEDIAN OR MEAN? (${J.source}, as of ${J.asOf}; ${assets.length} assets; nominal, before deflation)`);
console.log('  per asset: the gap ln(1 + expected) - log-IQR midpoint at each horizon (in log points x 100), beside sigma^2 / 2 (x 100)');
let tally = { MEDIAN: 0, MEAN: 0, NEITHER: 0 }, skipped = 0, planted = 0, plantedOk = 0;
for (const a of assets) {
  const hs = Object.keys(a.expected || {}).filter(h => a.band && a.band[h]);
  if (!hs.length || !(a.volatility > 0)) { skipped++; continue; }
  const sig = a.volatility / 100, half = sig * sig / 2;
  const gaps = hs.map(h => gapOf(a.expected[h], a.band[h])), mean = gaps.reduce((t, x) => t + x, 0) / gaps.length;
  const v = verdict(mean, half); tally[v]++;
  // planted: the same asset with "expected" moved to a mean (up by half the variance) must read MEAN, or the rule is blind
  if (half > 0.002) { planted++; const pg = hs.map(h => gapOf(100 * (Math.exp(ln1(a.expected[h]) + half) - 1), a.band[h])); if (verdict(pg.reduce((t, x) => t + x, 0) / pg.length, half) === 'MEAN') plantedOk++; }
  console.log(`  ${a.name.padEnd(40)} vol ${a.volatility.toFixed(1).padStart(5)}%  gaps ${gaps.map(g => (100 * g).toFixed(2)).join(' ')}  mean ${(100 * mean).toFixed(2)}  sigma^2/2 ${(100 * half).toFixed(2)}  ${v}`);
}
if (planted === 0 || plantedOk !== planted) { console.log(`CHECK FAILED: the rule read MEAN on ${plantedOk} of ${planted} planted means`); process.exit(1); }
console.log(`\nVERDICT: ${tally.MEDIAN} assets read MEDIAN, ${tally.MEAN} MEAN, ${tally.NEITHER} neither (${skipped} without a band or volatility); planted means read MEAN on ${plantedOk} of ${planted}`);

// 2. M15 v2's AND R2's DERIVATION RE-DERIVED (PLAN.md "The design" of M15 v2, its rung table; PLAN-HISTORY.md R2): the
// table's "growth after spread" took each rung's return as the MEAN and subtracted spread^2 / 2. The source's figure is the
// MEDIAN (section 1), and the solver grows by exp(ln(1 + R) + V z): a rung's median compound growth is ln(1 + R), and its
// mean gross (1 + R) e^(V^2 / 2). The rungs' return and spread as that table quotes them (pots 30/15/45/10%; cash 1.01%):
const RUNGS = [['0 (plan)', 3.83, 11.6], ['1', 3.59, 10.0], ['2 (today\'s floor)', 3.34, 8.5], ['3 (new)', 3.09, 7.1], ['4 (new)', 2.85, 6.3]];
console.log('\nM15 v2\'S RUNG TABLE RE-DERIVED (each rung\'s return taken as the median, as the source reads)');
console.log('  rung                 return  spread  M15 v2\'s "growth after spread"  median growth ln(1+R)  mean growth (1+R)e^(V^2/2)-1');
const rows = RUNGS.map(([nm, r, v]) => ({ nm, r, v, old: r - (v / 100) ** 2 / 2 * 100, med: 100 * Math.log(1 + r / 100), mean: 100 * ((1 + r / 100) * Math.exp((v / 100) ** 2 / 2) - 1) }));
for (const x of rows) console.log(`  ${x.nm.padEnd(20)} ${x.r.toFixed(2).padStart(5)}%  ${x.v.toFixed(1).padStart(5)}%  ${x.old.toFixed(2).padStart(28)}%  ${x.med.toFixed(2).padStart(20)}%  ${x.mean.toFixed(2).padStart(24)}%`);
console.log('  a step down, rung to rung: spread bought / growth given up (M15 v2\'s) / median growth given up (re-derived)');
for (let i = 1; i < rows.length; i++) console.log(`    ${i - 1} to ${i}: ${(rows[i - 1].v - rows[i].v).toFixed(1)} points of spread for ${(rows[i - 1].old - rows[i].old).toFixed(2)} (M15 v2) / ${(rows[i - 1].med - rows[i].med).toFixed(2)} (median) points of growth`);
