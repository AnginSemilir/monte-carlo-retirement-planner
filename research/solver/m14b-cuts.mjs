/*
 * M14b's CUTS, down-only against one tier above allowed (results/m14b-down, results/m14b-up; the same files reduce-m14.mjs
 * read behind its fair-test gate, results-m14b.txt): per household, per path, the years spent below target and the total
 * cut in target-years (from each record's per-year spending level, % of target; 0 = not a spending year or dead). The solver
 * trades survival against cuts (lambda per household: each result file's solver.lambda), so a survival cost can come with fewer cuts.
 * Mean over the 3,000 paths, with the paired difference's se. Also the cut cost the score charges, lambda x sum over paid
 * years of (1 - level)^2, in survival points (x100), paired - dead years are recorded as level 0 and count as no cut, so an
 * arm that fails more shows less cut (the twenty-seventh review). Planted: a made-up record with one path at 80% for two
 * years must give 2 years below and 0.4 target-years cut, or the script stops.
 *
 *   node research/solver/m14b-cuts.mjs > research/solver/results-m14b-cuts.txt
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRecord } from './record.mjs';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const perPath = (r, lam = 1) => { const b = new Float64Array(r.N), c = new Float64Array(r.N), k = new Float64Array(r.N); for (let i = 0; i < r.N; i++) for (let t = 0; t < r.Y; t++) { const l = r.trace.level[i * r.Y + t]; if (l > 0 && l < 100) { b[i]++; c[i] += (100 - l) / 100; k[i] += 100 * lam * ((100 - l) / 100) ** 2; } } return { b, c, k }; };
{ const p = perPath({ N: 1, Y: 3, trace: { level: new Uint8Array([80, 80, 100]) } }); if (p.b[0] !== 2 || Math.abs(p.c[0] - 0.4) > 1e-12 || Math.abs(p.k[0] - 8) > 1e-9) { console.log('PLANTED CHECK FAILED'); process.exit(1); } }
const pd = (x, y) => { const n = x.length, d = Array.from(x, (v, i) => y[i] - v), m = d.reduce((a, v) => a + v, 0) / n, sd = Math.sqrt(d.reduce((a, v) => a + (v - m) ** 2, 0) / (n - 1)); return { m, se: sd / Math.sqrt(n) }; };
const f = (x, k = 3) => x.toFixed(k), sg = x => (x >= 0 ? '+' : '') + f(x);
console.log('# M14b cuts, per path: years below target and total cut (target-years), down -> up (paired se); lambda per household');
for (const id of readdirSync(join(R, 'm14b-up')).filter(x => /^S\d+\.solver\.record\.json\.gz$/.test(x)).map(x => x.slice(0, 4)).sort()) {
  const lam = JSON.parse(readFileSync(join(R, 'm14b-up', `${id}.json`), 'utf8')).solver.lambda;
  const d = perPath(readRecord(join(R, 'm14b-down', `${id}.solver.record.json.gz`)), lam), u = perPath(readRecord(join(R, 'm14b-up', `${id}.solver.record.json.gz`)), lam);
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length, B = pd(d.b, u.b), C = pd(d.c, u.c), K = pd(d.k, u.k);
  console.log(`  ${id}  lambda ${String(lam).slice(0, 6).padEnd(6)}  years below ${f(mean(d.b))} -> ${f(mean(u.b))} (${sg(B.m)} +/- ${f(B.se)})   total cut ${f(mean(d.c))} -> ${f(mean(u.c))} (${sg(C.m)} +/- ${f(C.se)})   cut cost in the score ${sg(K.m)} +/- ${f(K.se)} survival points`);
}
