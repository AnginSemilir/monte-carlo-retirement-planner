/*
 * O62 FOR P (PLAN.md O62; the plan-auditor's MINOR 2 of 29 Sep, P's read): on each of P's core units and settings, is the
 * forced-opening run OPEN2 at world 0's node the same run as TS+J's own there (TS+J opening 2/2 by itself), field by field?
 * If so, no forced opening P reads differs from a chosen one - its year-0 spend level included. Reads results/diagP's
 * OPEN2 and TS+J world-0 traces and compares the survived, level, tier, wealth, taxPaid and failYear fields byte for byte.
 * Planted: one byte changed in a copy of the first pair's level field must read as differing.
 *   node research/solver/look-o62-p.mjs > research/solver/results-o62-p.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagP');
const FIELDS = ['survived', 'level', 'tier', 'wealth', 'taxPaid', 'failYear'];
const read = f => JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString());
const differ = (a, b) => FIELDS.filter(k => a[k] !== b[k]);
const pairs = readdirSync(DIR).filter(f => /-open2-world0@/.test(f)).sort().map(f => [f, f.replace('-open2-', '-ts_j-')]);
if (pairs.length !== 9) { console.log(`CHECK FAILED: ${pairs.length} OPEN2 traces, not 9 (three units at three settings)`); process.exit(1); }
console.log("O62 FOR P: OPEN2 (the year-0 move forced to 2/2) against TS+J's own run at world 0's node, field by field (results/diagP)");
let same = 0;
for (const [o, t] of pairs) {
  const A = read(o), B = read(t), d = differ(A, B);
  if (A.N !== B.N) d.push('N');
  if (!d.length) same++;
  console.log(`  ${o.replace('-open2-world0', '').replace('.json.gz', '').padEnd(28)} ${A.N} paths: ${d.length ? `DIFFER in ${d.join(', ')}` : `identical (${FIELDS.join(', ')})`}`);
}
{ const A = read(pairs[0][0]), B = { ...A }; const buf = Buffer.from(B.level, 'base64'); buf[buf.length - 1] ^= 1; B.level = buf.toString('base64');
  if (!differ(A, B).includes('level')) { console.log('PLANTED CHECK FAILED: a changed byte in level reads as identical'); process.exit(1); } }
console.log(`\n${same} of ${pairs.length} OPEN2 runs identical to TS+J's own, every field (planted: a changed byte in level reads as differing)`);
