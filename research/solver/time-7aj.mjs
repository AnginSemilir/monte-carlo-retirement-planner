/*
 * 7AJ'S MEASURED COST (the plan-auditor on dd69dbe597, BLOCKING 1: a time put to the maintainer cites a measured run, not the
 * pre-run budget). Sums every unit's `secs` lines (the solve and the forward run) in results/diag7aj, by arm, and the wall
 * time four at a time; the cost of re-running 7aj's design at another estate weight is the same 50 units.
 *   node research/solver/time-7aj.mjs > research/solver/results-time-7aj.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'results/diag7aj');
const files = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f));
if (files.length !== 50) throw new Error(`expected 50 unit logs, found ${files.length}`);
const by = {};
let lines = 0;
for (const f of files) {
  const t = readFileSync(join(DIR, f), 'utf8');
  const arm = (/unit (CAND|SHIP)\//.exec(t) || [])[1];
  if (!arm) throw new Error(`${f}: no unit line`);
  const secs = [...t.matchAll(/ secs (\d+)/g)].map(m => Number(m[1]));
  if (secs.length !== 2) throw new Error(`${f}: ${secs.length} secs lines, expected 2 (the solve and the run)`);
  lines += secs.length;
  by[arm] = (by[arm] || 0) + secs[0] + secs[1];
}
const total = Object.values(by).reduce((a, b) => a + b, 0);
console.log(`7AJ'S MEASURED COST: ${files.length} unit logs, ${lines} secs lines (the solve and the forward run of each unit)`);
for (const [arm, s] of Object.entries(by)) console.log(`  ${arm}: ${(s / 3600).toFixed(2)} core-hours`);
console.log(`  total: ${(total / 3600).toFixed(2)} core-hours, about ${(total / 3600 / 4).toFixed(1)} h on four cores at four units at once`);
