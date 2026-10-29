/*
 * THE CROSS-CODE IDENTITY CHECK (SPENDING-CURVE.md section 7). The registered arms ran on the spending-utility code (curve-wt,
 * code 5495d1b168c7), the amendment's on the failure-year code (curve2-wt, curve-audit2.mjs). With failDelivered unset the two
 * codes' tables are the same bit for bit (results-curve-test2.txt); this checks the whole unit end to end: S090's CAND unit
 * re-run on the failure-year code with its harness must be the registered unit bit for bit in everything but the code's hash,
 * the timings and the machine (and `ran.failDelivered`, which only the new harness records: it must be false).
 * Planted: the same comparison against a copy of the re-run with one path's survival flipped must fail.
 *   node cross-code.mjs <the registered unit> <the re-run unit>
 */
import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
const [fa, fb] = process.argv.slice(2);
if (!fa || !fb) { console.error('usage: cross-code.mjs <the registered unit> <the re-run unit>'); process.exit(2); }
const load = f => JSON.parse(gunzipSync(readFileSync(f)));
const A = load(fa), B = load(fb);
const SKIP = new Set(['code', 'solveSecs', 'engineSecs', 'cpu']);
const differ = (x, y) => {
  const out = [];
  for (const k of [...new Set([...Object.keys(x), ...Object.keys(y)])].sort()) {
    if (SKIP.has(k)) continue;
    if (k === 'ran') { const { failDelivered, ...rb } = y.ran || {}; if (failDelivered !== false || JSON.stringify(x.ran) !== JSON.stringify(rb)) out.push('ran'); continue; }
    if (k === 'main') { for (const a of [...new Set([...Object.keys(x.main), ...Object.keys(y.main)])].sort()) if (x.main[a] !== y.main[a]) out.push(`main.${a}`); continue; }
    if (JSON.stringify(x[k]) !== JSON.stringify(y[k])) out.push(k);
  }
  return out;
};
let failed = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) failed++; };
const d = differ(A, B), arrays = Object.keys(A.main).length;
ok(A.id === 'S090' && A.arm === 'CAND' && A.code !== B.code && arrays === 7 && d.length === 0,
  `${A.id} ${A.arm} on ${A.N} paths of seed ${A.seed}: the re-run on code ${B.code} matches the registered unit (code ${A.code}) in every field but the code's hash, the timings and the machine, its ${arrays} arrays of path results byte for byte${d.length ? `; differs in ${d.join(', ')}` : ''}`);
const C = JSON.parse(JSON.stringify(B)), s = Buffer.from(C.main.survived, 'base64');
s[0] ^= 1; C.main.survived = s.toString('base64');
const dp = differ(A, C);
ok(dp.length === 1 && dp[0] === 'main.survived', `planted: with path 1's survival flipped the comparison fails (${dp.join(', ') || 'nothing'})`);
console.log(failed ? `FAILED: ${failed} checks` : 'ALL PASS: 2 checks');
process.exit(failed ? 1 : 0);
