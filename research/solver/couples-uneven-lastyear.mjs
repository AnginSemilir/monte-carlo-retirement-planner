/*
 * WHY PA2'S EXTRA LOST PATHS FAIL IN THE PLAN'S LAST YEAR (post hoc, deciding nothing; D154 (5), D149 (1)'s lead; written 27 Nov).
 * COUPLES-UNEVEN's side read (results-couples-uneven-beside.txt C) found almost every path PA2 loses against ROUTE failing in the
 * plan's last year with no spending unmet: a path the engine fails at its end because the pot left is below the plan's minimum
 * pot (src/App.jsx runTrial, ctx.solvencyFloor), not one that ran out of money. This reads the run's own arrays (seed 7002,
 * already read; results/couples-uneven-7002) and solves and runs nothing. For each of PA2, SPLIT and FIX, over the paths it
 * loses against ROUTE:
 *   A. how they fail: spending unmet, or the pot left below the minimum pot alone;
 *   B. how far below: the pot left as a share of the minimum pot under the arm, and under ROUTE on the same paths;
 *   C. what the arm did instead on those paths: its spending delivered and its lifetime tax less ROUTE's, in pounds a path and
 *      as a share of ROUTE's; and beside it the same on the paths both keep;
 *   D. what a minimum pot a little lower would do: the arm's paths lost against ROUTE were the end test at 99%, 95% and 90% of
 *      the minimum pot (each arm's paths judged the same way), to size how much of the loss sits at the end test's edge.
 *   REG=1 node research/solver/couples-uneven-lastyear.mjs > research/solver/results-couples-uneven-lastyear.txt
 */
import { loadDir } from './reduce-couples-uneven.mjs';
import { readAnyPanel } from './couples-any-panel.mjs';
import { OUT_DEFAULT, unitsOf } from './audit-couples-uneven.mjs';

if (process.env.REG !== '1') { console.error('couples-uneven-lastyear: reads the registered panel, REG=1'); process.exit(2); }
const units = loadDir(process.argv[2] || OUT_DEFAULT).sort((a, b) => a.k - b.k);
if (units.length !== 28) { console.error(`couples-uneven-lastyear: ${units.length} units, not 28`); process.exit(2); }
const n = units[0].N;
if (units.some(u => u.N !== n)) { console.error('couples-uneven-lastyear: the units are on different path counts'); process.exit(2); }
const plans = Object.fromEntries(unitsOf(readAnyPanel()).map(u => [u.id, u.plan]));
const floorOf = id => { const p = plans[id]; if (!p) throw new Error(`couples-uneven-lastyear: no plan for ${id}`); return Number(p.config && p.config.solvencyFloor) || 0; };
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const sg = (x, d) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
const q = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y), i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const qs = a => `median ${(100 * q(a, 0.5)).toFixed(1)}%, quartiles ${(100 * q(a, 0.25)).toFixed(1)}% to ${(100 * q(a, 0.75)).toFixed(1)}%, from ${(100 * q(a, 0)).toFixed(1)}% to ${(100 * q(a, 1)).toFixed(1)}%`;
const UNMET = 1e-6;

console.log(`WHY PA2'S EXTRA LOST PATHS FAIL IN THE PLAN'S LAST YEAR (post hoc, deciding nothing; COUPLES-UNEVEN's arrays, seed 7002, already read; ${units.length} units, ${n} paths each; no unit solved or run)`);
const floors = [...new Set(units.map(u => floorOf(u.id)))];
console.log(`The minimum pot, the plan's own (config.solvencyFloor): ${floors.map(gbp).join(', ')} over the ${units.length} units; a path that meets every year's spending fails at its end when the pot left is below it.`);
for (const arm of ['PA2', 'SPLIT', 'FIX']) {
  let lost = 0, unmetLost = 0;
  const shareArm = [], shareRoute = [], dDel = [], dTax = [], rDel = [], rTax = [];
  let keptN = 0, keptDel = 0, keptRouteDel = 0, keptTax = 0, keptRouteTax = 0;
  const atEdge = { 0.99: 0, 0.95: 0, 0.9: 0 };
  for (const u of units) {
    const A = u.arms[arm], R = u.arms.ROUTE, F = floorOf(u.id);
    for (let i = 0; i < n; i++) {
      if (R.survived[i] && A.survived[i]) { keptN++; keptDel += A.delivered[i]; keptRouteDel += R.delivered[i]; keptTax += A.tax[i]; keptRouteTax += R.tax[i]; }
      if (!(R.survived[i] && !A.survived[i])) continue;
      lost++;
      if (A.unmet[i] > UNMET) { unmetLost++; continue; }
      if (F > 0) { shareArm.push(A.pot[i] / F); shareRoute.push(R.pot[i] / F); }
      dDel.push(A.delivered[i] - R.delivered[i]); rDel.push(R.delivered[i]);
      dTax.push(A.tax[i] - R.tax[i]); rTax.push(R.tax[i]);
      for (const k of Object.keys(atEdge)) if (F > 0 && A.pot[i] >= Number(k) * F) atEdge[k]++;
    }
  }
  const floorLost = lost - unmetLost, mean = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length), sum = a => a.reduce((s, x) => s + x, 0);
  console.log(`\n${arm} less ROUTE: ${lost} paths lost of ${units.length * n} (the 28 units' paths)`);
  console.log(`  A. ${unmetLost} with spending unmet; ${floorLost} with every year's spending met, failing at the end on the minimum pot alone`);
  if (floorLost) {
    console.log(`  B. on those ${floorLost}: the pot left under ${arm} as a share of the minimum pot ${qs(shareArm)}; under ROUTE on the same paths ${qs(shareRoute)}`);
    console.log(`  C. on those ${floorLost}, ${arm} less ROUTE a path: spending delivered ${gbp(mean(dDel))} (${sg(100 * sum(dDel) / sum(rDel), 3)}% of ROUTE's), lifetime tax ${gbp(mean(dTax))} (${sg(100 * sum(dTax) / sum(rTax), 2)}%)`);
    console.log(`     on the ${keptN} paths both keep, ${arm} less ROUTE a path: spending delivered ${gbp((keptDel - keptRouteDel) / keptN)} (${sg(100 * (keptDel / keptRouteDel - 1), 3)}%), lifetime tax ${gbp((keptTax - keptRouteTax) / keptN)} (${sg(100 * (keptTax / keptRouteTax - 1), 2)}%)`);
    console.log(`  D. of those ${floorLost}, the pot left at or above 99% of the minimum pot ${atEdge[0.99]}, 95% ${atEdge[0.95]}, 90% ${atEdge[0.9]}`);
  }
}
// D's second half: each arm judged against a minimum pot of 95% and 90% of the plan's, on every path, against ROUTE judged the same
console.log('\nD (whole). Each arm\'s paths kept net against ROUTE, the end test at the plan\'s minimum pot and at 95% and 90% of it (both arms judged the same way; spending unmet still a failure):');
for (const arm of ['PA2', 'SPLIT', 'FIX']) {
  // a path kept at s: kept at the plan's minimum pot, or failed on the end test alone (no spending unmet) with the pot left at
  // or above s of it
  const okAt = (X, i, s, F) => X.survived[i] === 1 || (X.unmet[i] <= UNMET && X.pot[i] >= s * F);
  const net = s => { let t = 0; for (const u of units) { const A = u.arms[arm], R = u.arms.ROUTE, F = floorOf(u.id); for (let i = 0; i < n; i++) t += (okAt(A, i, s, F) ? 1 : 0) - (okAt(R, i, s, F) ? 1 : 0); } return t; };
  console.log(`  ${arm.padEnd(5)} at the minimum pot ${net(1)}; at 95% ${net(0.95)}; at 90% ${net(0.9)}`);
}
