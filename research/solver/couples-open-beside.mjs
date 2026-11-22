/*
 * THE GUARD'S OWN UNITS, THE DRESS REHEARSAL: BESIDE ITS READ (written after the read, deciding nothing; EXPLORATORY). The
 * rehearsal read's reviewer (reviews/2026-11-22-read-couples-open-rehearsal.md) found two things the write-up said that the
 * records do not show, and asked for figures the read did not print:
 *   MINOR 3  lifetime tax: each unit's mean a path in pounds under both arms, beside its spending on the paths both keep in
 *            pounds, so the write-up's account of the tax percentages rests on figures;
 *   MINOR 4  spending over all paths (saved paths included), each unit's change in percent of APP's mean with its 95% interval
 *            by path (reduce-phase4.mjs spendingItem), the units below beyond noise named.
 * It reads the rehearsal's 44 records as the read did (results/couples-open-7002), each held to the read's own stamp (code
 * 36e4d2a860b2, audit a4ef3698d92c), seed 7002 and 4,000 paths, so it prints from the same arrays without the read's gate.
 *   node research/solver/couples-open-beside.mjs [dir] > research/solver/results-couples-open-rehearsal-beside.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { loadDir } from './reduce-couples-open.mjs';
import { spendingItem } from './reduce-phase4.mjs';
import { cells } from './reduce-household.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const READ = Object.freeze({ code: '36e4d2a860b2', audit: 'a4ef3698d92c', seed: 7002, N: 4000, units: 44 });
const DIR = process.argv[2] || join(HERE, 'results', 'couples-open-7002');
if (!existsSync(DIR)) { console.error(`couples-open-beside: no ${DIR}`); process.exit(2); }
const units = loadDir(DIR).sort((a, b) => a.k - b.k);
const bad = units.filter(u => u.stamp.code !== READ.code || u.stamp.audit !== READ.audit || u.seed !== READ.seed || u.N !== READ.N).map(u => u.id);
if (units.length !== READ.units || bad.length) { console.log(`couples-open-beside: not the read's records (${units.length} units${bad.length ? `; not its stamp, seed or paths: ${bad.join(', ')}` : ''})`); process.exit(1); }

const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
/* spending on the paths both keep, each arm's mean a path in pounds */
const keptMeans = u => { const A = u.arms.APP, X = u.arms.ROUTE; let n = 0, a = 0, x = 0; for (let i = 0; i < u.N; i++) if (A.survived[i] && X.survived[i]) { n++; a += A.delivered[i]; x += X.delivered[i]; } return { n, app: a / n, route: x / n }; };

console.log(`THE GUARD'S OWN UNITS, THE DRESS REHEARSAL: BESIDE ITS READ (EXPLORATORY; written after the read, deciding nothing): ${units.length} records of ${DIR.replace(/.*research\/solver\//, '')}, each on the read's stamp (code ${READ.code}, audit ${READ.audit}), seed ${READ.seed}, ${READ.N} paths`);
console.log('each unit: lifetime tax a path, APP and ROUTE (MINOR 3); spending on the paths both keep, each arm\'s mean a path; spending over all paths, ROUTE against APP in percent of APP\'s mean, by path (MINOR 4)');
const rows = units.map(u => {
  const A = u.arms.APP, X = u.arms.ROUTE, c = cells(A, X), km = keptMeans(u), al = spendingItem([[X, A]], u.N);
  return { u, c, km, al, taxA: sum(A.tax) / u.N, taxX: sum(X.tax) / u.N };
});
for (const r of rows) console.log(`  ${r.u.id.padEnd(12)} class ${r.u.cls.padEnd(2)} ${r.u.route.padEnd(9)} tax a path APP ${gbp(r.taxA)}, ROUTE ${gbp(r.taxX)} (${f3(100 * (r.taxX / r.taxA - 1))}%); on the ${r.km.n} paths both keep APP ${gbp(r.km.app)}, ROUTE ${gbp(r.km.route)} (${f4(100 * (r.km.route / r.km.app - 1))}%); over all paths ${iv(r.al, f4)}%; ${r.c.lost} lost, ${r.c.saved} saved`);
const below = rows.filter(r => r.al.hi < 0), above = rows.filter(r => r.al.lo > 0);
console.log(`spending over all paths: below APP beyond noise on ${below.length} units (${below.map(r => `${r.u.id} ${f4(r.al.d)}%`).join(', ') || 'none'}); above beyond noise on ${above.length}; within noise on ${rows.length - below.length - above.length}`);
const byCouple = {};
for (const r of rows) (byCouple[r.u.couple] = byCouple[r.u.couple] || []).push(r);
for (const [cid, rs] of Object.entries(byCouple)) console.log(`  ${cid}: over all paths below APP beyond noise on ${rs.filter(r => r.al.hi < 0).length} of ${rs.length} units, above on ${rs.filter(r => r.al.lo > 0).length}; tax a path APP from ${gbp(Math.min(...rs.map(r => r.taxA)))} to ${gbp(Math.max(...rs.map(r => r.taxA)))}, ROUTE from ${gbp(Math.min(...rs.map(r => r.taxX)))} to ${gbp(Math.max(...rs.map(r => r.taxX)))}`);
// MINOR 3's claim, tested: where APP pays the least tax, does it also spend far less on the paths both keep?
const lowTax = [...rows].sort((p, q) => p.taxA - q.taxA).slice(0, 11);
console.log(`the eleven units where APP pays the least tax a path (${gbp(lowTax[0].taxA)} to ${gbp(lowTax[lowTax.length - 1].taxA)}): ROUTE's spending on the paths both keep against APP's from ${f4(Math.min(...lowTax.map(r => 100 * (r.km.route / r.km.app - 1))))}% to ${f4(Math.max(...lowTax.map(r => 100 * (r.km.route / r.km.app - 1))))}%, ROUTE lower on ${lowTax.filter(r => r.km.route < r.km.app).length} of them`);
