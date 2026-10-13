/*
 * NE-EDGE'S ARMS AGAINST S364'S RUNS IN EVERY WORLD (a measurement for the write-up, not a test; the odd result O150):
 * items 1 and 2 count worlds 0 and 1 only (where BASE over-reads by half a point or more) and read removal, so they
 * cannot show an arm reading below the runs. This prints, for S364 under BASE, RZ and RS at P, each world's table, its
 * runs (ok of n) and the table less the runs with the reducer's own interval (offOf, Clopper-Pearson at the reducer's
 * a1), the three worlds and their mixture weights.
 *   Gate: the reducer's own main must print "GATE: passed" over the same folder (its full gate: C's identity control,
 *   B1's tables, every file the log's), or this refuses (exit 3).
 *   Identity: BASE's world 0 and 1 over-reads must equal the reducer's printed 3.3712 and 2.5196 (results-needge.txt
 *   item 1) to four places, or this refuses (exit 3).
 *   Planted: one run of RZ's world 2 moved by 40 paths must move that world's printed difference (a measurement that
 *   cannot see a change is an error, checklist item 6).
 *   node research/solver/measure-needge-under.mjs > research/solver/results-needge-under.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse, offOf, WEIGHTS } from './reduce-needge.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = join(HERE, 'results', 'diagneedge');
const red = spawnSync('node', [join(HERE, 'reduce-needge.mjs'), DIR], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (!/^GATE: passed/m.test(red.stdout || '')) { console.error('measure-needge-under: the reducer\'s gate did not pass over these files'); process.exit(3); }
const jobs = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().flatMap(f => parse(readFileSync(join(DIR, f), 'utf8')));
const S = arm => jobs.find(j => j.id === 'S364' && j.arm === arm);
const f4 = x => x.toFixed(4);
const rows = j => [0, 1, 2].map(k => { const s = j.sims[`P${k}`], t = j.tables[k].P, o = offOf(t, s.ok, s.n); return { k, t, ok: s.ok, n: s.n, ...o }; });

const base = rows(S('BASE'));
if (f4(base[0].d) !== '3.3712' || f4(base[1].d) !== '2.5196') { console.error(`measure-needge-under: BASE's over-reads ${f4(base[0].d)} and ${f4(base[1].d)} are not the reducer's 3.3712 and 2.5196`); process.exit(3); }
const rz = S('RZ'), moved = { ...rz, sims: { ...rz.sims, P2: { ...rz.sims.P2, ok: rz.sims.P2.ok + 40 } } };
const planted = f4(rows(moved)[2].d) !== f4(rows(rz)[2].d);
if (!planted) { console.error('measure-needge-under: a run moved by 40 paths did not move the printed difference'); process.exit(3); }

console.log('NE-EDGE: S364 at P, each arm\'s table against its runs in every world (4,000 paths a world, seed 7002; results/diagneedge behind the reducer\'s gate)');
for (const arm of ['BASE', 'RZ', 'RS']) {
  const r = rows(S(arm));
  console.log(`${arm.padEnd(4)} ${r.map(c => `world ${c.k} (weight ${f4(WEIGHTS[c.k])}): table ${f4(c.t)} runs ${c.ok}/${c.n} = ${f4(100 * c.ok / c.n)} table less runs ${f4(c.d)} (${f4(c.lo)} to ${f4(c.hi)})`).join('; ')}`);
  console.log(`${''.padEnd(4)} mixture: table ${f4(r.reduce((a, c) => a + WEIGHTS[c.k] * c.t, 0))} runs ${f4(r.reduce((a, c) => a + WEIGHTS[c.k] * 100 * c.ok / c.n, 0))}`);
}
console.log('identity: BASE\'s world 0 and 1 over-reads are the reducer\'s (3.3712, 2.5196); planted: a run moved by 40 paths moves the printed difference');
