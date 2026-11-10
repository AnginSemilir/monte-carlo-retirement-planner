// Do two sessions give the same arrays for the same unit? (Item 1 of EXPERIMENTS-AND-PORTS.md.)
//   node d4-same.mjs <arrays file from session A> <the same unit's arrays file from session B>
// An arrays file of audit-couples.mjs is gzipped JSON holding the unit's results and, beside them, what differs between any
// two runs: the seconds taken (solveSecs, engineSecs, secs, beside.secs) and the CPU's name (cpu). Those five are set aside
// and the rest compared whole. It prints the two hashes of the rest and, if they differ, the NAMES of the fields that
// differ. It prints no value from either file, so it shows no result.
// Use it on a PREFLIGHT's files (a seed that is not D4's). D63 has nothing on d4-backup read before all 520 units are in.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const [a, b] = process.argv.slice(2);
if (!a || !b) { console.error('usage: node d4-same.mjs <arrays file A> <arrays file B>'); process.exit(2); }
const load = f => { const o = JSON.parse(gunzipSync(readFileSync(f)).toString('utf8')); for (const k of ['solveSecs', 'engineSecs', 'secs', 'cpu']) delete o[k]; if (o.beside && typeof o.beside === 'object') delete o.beside.secs; return o; };
const canon = v => (Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',')}}` : JSON.stringify(v));
const A = load(a), B = load(b), sha = o => createHash('sha256').update(canon(o)).digest('hex').slice(0, 16);
const differ = [];
const walk = (x, y, at) => { const xo = x && typeof x === 'object' && !Array.isArray(x), yo = y && typeof y === 'object' && !Array.isArray(y);
  if (xo && yo) { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], at ? `${at}.${k}` : k); } else if (canon(x) !== canon(y)) differ.push(at); };
walk(A, B, '');
if (!('main' in A) || !('stamp' in A)) { console.log('NOT AN ARRAYS FILE: no main or no stamp in the first file'); process.exit(2); }
console.log(`A ${sha(A)}  B ${sha(B)}  ${differ.length ? `DIFFERENT in: ${differ.join(', ')}` : 'the same but for the seconds and the CPU'}`);
process.exit(differ.length ? 1 : 0);
