/*
 * REDUCER FOR THE PURPOSE TEST (PLAN.md finding M18): pools results/bestof/<id>[-TAG].json over the households.
 *
 *   node research/solver/reduce-bestof.mjs            the first run (no tag)
 *   TAG=floor node research/solver/reduce-bestof.mjs  the re-run with the M17 floor fix on
 *
 * Per position: the best candidate on survival PICKED on half A, MEASURED on half B against the solver's own pick
 * (row 0), with its paired standard error; the same on the objective the audit simulates. "Cuts more" compares the
 * spend level in the winning rival's label with the solver's pick.
 *
 * The objective the audit simulates is survived + estate credit - trim penalty + raise credit, charged only in
 * years that are paid. With the floor fix on, the solver's own objective also charges a year with no money at the
 * floor's price, so on that run the objective columns measure the OLD yardstick: the survival criterion is the test.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const D = join(dirname(fileURLToPath(import.meta.url)), 'results/bestof');
const TAG = process.env.TAG || '';
const files = readdirSync(D).filter(f => (TAG ? f.endsWith(`-${TAG}.json`) : /^S\d+\.json$/.test(f))).sort();
const mean = a => a.reduce((p, q) => p + q, 0) / a.length;
const sem = a => { const m = mean(a); return Math.sqrt(a.reduce((p, x) => p + (x - m) ** 2, 0) / (a.length * (a.length - 1))); };
const corr = (x, y) => { const mx = mean(x), my = mean(y); let a = 0, b = 0, c = 0; for (let i = 0; i < x.length; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / Math.sqrt(b * c); };
const spendOf = label => { const m = /spend (\d+)%/.exec(label); return m ? Number(m[1]) : 100; };
const f = (x, d = 2) => (x >= 0 ? '+' : '') + x.toFixed(d);

const all = [];
for (const file of files) { const j = JSON.parse(readFileSync(join(D, file), 'utf8')); for (const p of j.positions) all.push({ id: j.id, knobs: j.knobs, ...p }); }
const n = all.length;
if (!n) { console.log(`no files for tag '${TAG}'`); process.exit(0); }
const beyond = (x, se) => se > 0 && x > 2 * se;
const survIn = all.filter(p => !beyond(p.dSurv, p.seSurv)).length;
const ahead = all.filter(p => p.bestSurv !== 0 && p.dSurv > 0);
const cutMore = ahead.filter(p => spendOf(p.rows[p.bestSurv].label) < spendOf(p.rows[0].label)).length;
const cutLess = ahead.filter(p => spendOf(p.rows[p.bestSurv].label) > spendOf(p.rows[0].label)).length;
const objBeyond = all.filter(p => beyond(p.dObj, p.seObj)).length;
// the table's ranking: every challenger's score gap from the top against its simulated gap on half B
const gx = [], gs = [], go = [];
for (const p of all) for (let k = 1; k < p.rows.length; k++) { gx.push(p.rows[k].scoreGap); gs.push(p.rows[k].survB - p.rows[0].survB); go.push(p.rows[k].objB - p.rows[0].objB); }
const far = []; for (let i = 0; i < gx.length; i++) if (gx[i] > 0.005) far.push(i);

console.log(`THE PURPOSE TEST${TAG ? ` (${TAG})` : ''}: ${files.length} households, ${n} positions (${all.filter(p => p.cliff).length} on the cliff); knobs ${JSON.stringify(all[0].knobs || {})}`);
console.log(`  survival: best-on-A within noise of the solver's pick at ${survIn} of ${n} (${(100 * survIn / n).toFixed(0)}%); mean advantage on B ${f(mean(all.map(p => p.dSurv)))} +/- ${sem(all.map(p => p.dSurv)).toFixed(3)} points; beyond 2 se at ${n - survIn}`);
console.log(`            on the cliff: within noise at ${all.filter(p => p.cliff && !beyond(p.dSurv, p.seSurv)).length} of ${all.filter(p => p.cliff).length}, mean ${f(mean(all.filter(p => p.cliff).map(p => p.dSurv)))}`);
console.log(`            where a rival is ahead on B (${ahead.length} positions): it spends less than the solver's pick at ${cutMore}, more at ${cutLess}, the same at ${ahead.length - cutMore - cutLess}`);
console.log(`  objective (the audit's yardstick): beyond 2 se at ${objBeyond} of ${n} (${(100 * objBeyond / n).toFixed(1)}%); mean advantage ${f(100 * mean(all.map(p => p.dObj)))} +/- ${(100 * sem(all.map(p => p.dObj))).toFixed(2)} points`);
console.log(`  the table's ranking over ${gx.length} challengers: score gap vs simulated survival gap r = ${corr(gx, gs).toFixed(2)}, vs simulated objective gap r = ${corr(gx, go).toFixed(2)}; the ${far.length} put over half a point behind simulate ${f(100 * mean(far.map(i => go[i])))} points on the objective, ahead at ${far.filter(i => go[i] > 0).length}`);
console.log('  per household (survival: within noise / mean advantage; objective: beyond 2 se)');
for (const id of [...new Set(all.map(p => p.id))]) {
  const ps = all.filter(p => p.id === id);
  console.log(`    ${id}  ${ps.filter(p => !beyond(p.dSurv, p.seSurv)).length}/${ps.length}  ${f(mean(ps.map(p => p.dSurv)))}   ${ps.filter(p => beyond(p.dObj, p.seObj)).length}`);
}
