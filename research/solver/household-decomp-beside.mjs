/*
 * BESIDE THE DECOMPOSITION'S READ (HOUSEHOLD-DECOMP.md; D129 (1); EXPLORATORY, written after the read, deciding nothing): the
 * figures the reviewer at the read asked to be printed (reviews/2026-11-18-read-household-decomp.md, findings 1 to 4), from
 * the run's unit files (results/household-decomp-7002):
 *   1. each variant less K2 with its interval (stats.mjs survivalChange and survivalChangeU), and the pooled recovery without
 *      S191-90;
 *   2. the cost beside the spending: the capped pot and lifetime tax, each variant against HS and K2;
 *   3. on L (the paths K2 keeps and HS loses): the mean lifetime tax under HS, CEIL and each variant; how L's paths fail
 *      under HS, and on those failing at the minimum pot at the end the mean shortfall below it; on the paths of L each
 *      variant keeps, its spending against HS's and its tax and end pot against HS's;
 *   4. HSBC less HSB, paired by path, on each unit.
 *   node research/solver/household-decomp-beside.mjs
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange, survivalChangeU } from './stats.mjs';
import { armOf, cells } from './reduce-household.mjs';
import { UNIT_IDS, VARIANTS, recoveryOf, cappedOf } from './reduce-household-decomp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'household-decomp-7002'), FAIL_TOLERANCE = 1;
const ARMS = ['K2', 'HS', 'HSB', 'HSC', 'HSBC', 'CEIL', 'CEILB', 'CEILC', 'CEILBC'];
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), iv = r => `${f3(r.d)} (${f3(r.lo)} to ${f3(r.hi)})`;
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const mean = (A, I) => (I.length ? I.reduce((t, i) => t + A[i], 0) / I.length : NaN);
const units = UNIT_IDS.map(id => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, `${id}.json.gz`))).toString()); for (const a of ARMS) U.arms[a] = armOf(U.arms[a]); return U; });
console.log(`BESIDE THE DECOMPOSITION'S READ (EXPLORATORY, after the read, deciding nothing; the reviewer's findings 1 to 4): ${units.length} units from ${DIR}, seed ${units[0].seed}, ${units[0].N} paths; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}`);
console.log('\n1. Each variant less K2, paired by path (survivalChange; survivalChangeU beside):');
for (const U of units) for (const v of VARIANTS) { const c = cells(U.arms.K2, U.arms[v]); console.log(`  ${U.id.padEnd(8)} ${v.padEnd(5)} ${iv(survivalChange(c.lost, c.saved, c.N))}; survivalChangeU ${iv(survivalChangeU(c.a, c.lost, c.saved, c.d))}`); }
for (const v of VARIANTS) {
  const rs = units.map(U => ({ id: U.id, r: recoveryOf(U.arms.K2, U.arms.HS, U.arms[v]) })), rest = rs.filter(x => x.id !== 'S191-90');
  const sum = (xs, k) => xs.reduce((t, x) => t + x.r[k], 0);
  console.log(`  ${v} recovery pooled: ${sum(rs, 'rec')} of ${sum(rs, 'L')} (${(100 * sum(rs, 'rec') / sum(rs, 'L')).toFixed(1)}%); without S191-90: ${sum(rest, 'rec')} of ${sum(rest, 'L')} (${(100 * sum(rest, 'rec') / sum(rest, 'L')).toFixed(1)}%)`);
}
console.log('\n2. The cost beside the spending: the capped pot and lifetime tax (the mean over every path):');
for (const U of units) for (const v of VARIANTS) {
  const h = cappedOf(U.cap, U.arms.HS, U.arms[v]), k = cappedOf(U.cap, U.arms.K2, U.arms[v]), all = Array.from({ length: U.N }, (_, i) => i);
  console.log(`  ${U.id.padEnd(8)} ${v.padEnd(5)} the capped pot against HS ${f3(h.pct)}% (${gbp(h.gbp)} a path), against K2 ${f3(k.pct)}% (${gbp(k.gbp)} a path); lifetime tax ${gbp(mean(U.arms[v].tax, all))} against HS ${gbp(mean(U.arms.HS.tax, all))} and K2 ${gbp(mean(U.arms.K2.tax, all))}`);
}
console.log('\n3. On L, the paths K2 keeps and HS loses:');
for (const U of units) {
  const A = U.arms, L = [];
  for (let i = 0; i < U.N; i++) if (A.K2.survived[i] && !A.HS.survived[i]) L.push(i);
  const atFloor = L.filter(i => A.HS.failYear[i] === U.T && A.HS.unmet[i] <= FAIL_TOLERANCE), short = atFloor.map(i => U.floor - A.HS.pot[i]);
  console.log(`  ${U.id}: L ${L.length}; under HS ${atFloor.length} fail at the minimum pot at the end (the pot £${Math.round(U.floor).toLocaleString('en-GB')}; their end pot short of it by ${gbp(short.reduce((t, x) => t + x, 0) / Math.max(1, short.length))} on average), ${L.length - atFloor.length} a year unfunded`);
  console.log(`    the mean lifetime tax on L: ${['HS', 'CEIL', 'HSB', 'CEILB', 'HSC', 'CEILC', 'HSBC'].map(a => `${a} ${gbp(mean(A[a].tax, L))}`).join(', ')}`);
  for (const v of VARIANTS) {
    const K = L.filter(i => A[v].survived[i]);
    const sp = K.length ? 100 * (K.reduce((t, i) => t + A[v].delivered[i], 0) / K.reduce((t, i) => t + A.HS.delivered[i], 0) - 1) : NaN;
    console.log(`    ${v.padEnd(5)} keeps ${K.length} of L: on those, its spending ${f3(sp)}% of HS's, its lifetime tax ${gbp(mean(A[v].tax, K) - mean(A.HS.tax, K))} against HS's and its end pot ${gbp(mean(A[v].pot, K) - mean(A.HS.pot, K))}`);
  }
}
console.log('\n4. HSBC less HSB, paired by path (survivalChange):');
for (const U of units) { const c = cells(U.arms.HSB, U.arms.HSBC); console.log(`  ${U.id.padEnd(8)} ${iv(survivalChange(c.lost, c.saved, c.N))} (${c.saved} saved, ${c.lost} lost)`); }
console.log(`\n  the rule's half on S333F: HSC recovers ${recoveryOf(units[1].arms.K2, units[1].arms.HS, units[1].arms.HSC).rec} of L ${recoveryOf(units[1].arms.K2, units[1].arms.HS, units[1].arms.HSC).L}, where half is ${Math.ceil(recoveryOf(units[1].arms.K2, units[1].arms.HS, units[1].arms.HSC).L / 2)}`);
