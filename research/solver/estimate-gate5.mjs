/*
 * GATE 5'S IMPACT, ESTIMATED (the maintainer, 18 Oct: "Skip the build time gate for now, just give me an estimate of impact";
 * PLAN.md AREF, items/FOOT-S366.md): the adaptive reference's cost read from AX-HO's recorded solves (results-axho.txt: each
 * adaptive job's build and solve seconds beside its order-reference twin on the same household, the batch's five jobs on four
 * cores) and the fix's own cost from FOOT-S366's preflight (K1 against K1F, the same household and load); then, under E2,
 * each part building its own reference (solve.js's E2 comment: every part builds its own reader tables; NOT CHECKED by a
 * run) while the rest of the solve divides by the parts (ideal scaling, an assumption): grade C throughout.
 *   node research/solver/estimate-gate5.mjs > research/solver/results-gate5-estimate.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), rd = f => readFileSync(join(HERE, f), 'utf8');
const ax = rd('results-axho.txt'), pf = rd('results-foot-preflight.txt');
const built = j => { const m = new RegExp(`${j}'s reference: .* built in ([0-9.]+) s; solve ([0-9]+) s`).exec(ax); return m ? { build: +m[1], solve: +m[2] } : null; };
const plain = j => { const m = new RegExp(`^\\s*${j}: solve ([0-9]+) s`, 'm').exec(ax); return m ? +m[1] : null; };
const adapt = l => { const m = new RegExp(`adaptive ${l}/P30S6Q5: .* secs ([0-9.]+)`).exec(pf); return m ? +m[1] : null; };
const pairs = [['S366', 'J1', 'J2'], ['S360', 'J3', 'J4']].map(([h, a, o]) => ({ h, a, o, A: built(a), O: plain(o) }));
const k1 = adapt('K1'), k1f = adapt('K1F');
if (pairs.some(p => !p.A || !(p.O > 0)) || !(k1 > 0) || !(k1f > 0)) { console.log('the records did not read'); process.exit(1); }
const f1 = x => x.toFixed(1), pc = x => `${(100 * x).toFixed(1)}%`;
console.log('GATE 5\'S IMPACT, ESTIMATED (grade C; results-axho.txt, results-foot-preflight.txt)\n\n1. ONE PROCESS A SOLVE (AX-HO\'s batch, 60 points, five jobs on four cores)');
for (const p of pairs) { const x = p.A.solve - p.O; console.log(`  ${p.h}: ${p.a} under the adaptive reference ${p.A.solve} s (its build ${p.A.build} s, ${pc(p.A.build / p.A.solve)} of the solve) against ${p.o} under the order reference ${p.O} s: ${x} s more (${pc(x / p.O)})`); }
console.log(`\n2. THE FIX'S OWN COST (FOOT-S366's preflight, S362 at a fifteenth of the points, the same load): K1's build ${k1} s, K1F's ${k1f} s (${pc(k1f / k1 - 1)})`);
console.log('\n3. UNDER E2 (each part builds its own reference, not split; the rest of the solve split ideally)');
for (const n of [4, 8]) for (const p of pairs) { const ad = (p.A.solve - p.A.build) / n + p.A.build, or = p.O / n; console.log(`  ${n} parts, ${p.h}: about ${f1(ad / 60)} min against ${f1(or / 60)} min under the order reference, ${f1((ad - or) / 60)} min more (${pc(ad / or - 1)}), the build ${pc(p.A.build / ad)} of the wall`); }
