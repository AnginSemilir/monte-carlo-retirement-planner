/*
 * 7AV'S OBSERVED STEP READS (NOT A READING OF 7AV: the run is NOT SETTLED by its registered gate, results-7av.txt). Prints, from
 * the logs alone and without reduce-7av.mjs's items, each READER unit's world-0 bridge step reads as the audit printed them
 * (audit-7av.mjs's sdec lines): the step reads' flat, straight-line and quadratic terms a path and the unsupported weight, by
 * year, and their sums over the step years, so the post-hoc observations the ledger quotes come from a script (grade C: seen
 * after the run, unregistered, one seed, two households). The run's stamps are checked against predictions/diag-7av.md first.
 *   node research/solver/observe-7av.mjs [dir] > research/solver/results-7av-observed.txt
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = process.argv[2] || join(HERE, 'results', 'diag7av');
const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
if (Object.keys(logs).length !== 7) { console.log(`observe-7av: ${Object.keys(logs).length} logs in ${DIR}, not 7`); process.exit(1); }
requireFairLogs(logs, 'research/solver/predictions/diag-7av.md');
const SD = /^\s+sdec (\S+) world 0 year (\d+): reads (\d+) step (\d+) flat (\S+) lin (\S+) quad (\S+) unsup (\S+) qmoved (\d+)/;
console.log('7AV, OBSERVED STEP READS (not a reading: the run is NOT SETTLED by its registered gate; grade C, post hoc). World 0, the bridge years with step reads; terms in points a path (the read less the claim at t + 1).');
const rows = [];
for (const text of Object.values(logs)) {
  const id = (/^(\S.*?)\s+case \| unit (\S+)/m.exec(text) || [])[1], unit = (/^\S.*?\s+case \| unit (\S+)/m.exec(text) || [])[1];
  if (!/^READER\//.test(unit)) continue;
  const ys = text.split('\n').map(l => SD.exec(l)).filter(m => m && m[1] === unit && +m[4] > 0).map(m => ({ t: +m[2], n: +m[4], flat: +m[5], lin: +m[6], quad: +m[7], unsup: +m[8], qm: +m[9] }));
  rows.push({ id: id.trim(), unit, ys });
}
rows.sort((a, b) => (a.id + a.unit).localeCompare(b.id + b.unit));
for (const r of rows) {
  const s = k => r.ys.reduce((t, y) => t + y[k], 0);
  console.log(`  ${r.id.padEnd(6)} ${r.unit.padEnd(32)} ${r.ys.map(y => `year ${y.t}: flat ${y.flat.toFixed(4)} line ${y.lin.toFixed(4)} quad ${y.quad.toFixed(4)} unsup ${y.unsup.toFixed(4)}`).join(' | ')} || sums flat ${s('flat').toFixed(4)} line ${s('lin').toFixed(4)} quad ${s('quad').toFixed(4)}`);
}
