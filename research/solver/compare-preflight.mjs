// BN-OFF, BIT FOR BIT (AN's build check and preflight): a saved preflight job's file and log against a rerun's, the stamp line
// and each "secs" figure aside (the code id and the wall time are the only things a rerun on new code may change).
//   node research/solver/compare-preflight.mjs <saved dir> <rerun dir> <file.json.gz> <log.txt>
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
const [A, B, file, log] = process.argv.slice(2);
const J = d => { const o = JSON.parse(gunzipSync(readFileSync(join(d, file))).toString()); delete o.stamp; return JSON.stringify(o); };
const Lg = d => readFileSync(join(d, log), 'utf8').split('\n').filter(l => !/^stamp: /.test(l)).map(l => l.replace(/secs \d+/g, 'secs -')).join('\n');
let ja = '', jb = '', la = '', lb = '';
try { ja = J(A); jb = J(B); la = Lg(A); lb = Lg(B); } catch (e) { console.log(`bn-off: FAILED to read (${e.message})`); process.exit(1); }
const sameFile = ja.length > 1000 && ja === jb, sameLog = la.split('\n').length > 20 && la === lb;
if (!sameLog) { const x = la.split('\n'), y = lb.split('\n'); const i = x.findIndex((l, k) => l !== y[k]); console.log(`bn-off: first differing log line ${i}:\n  saved ${String(x[i]).slice(0, 160)}\n  rerun ${String(y[i]).slice(0, 160)}`); }
console.log(`bn-off: file ${sameFile ? 'identical' : 'DIFFERS'} (${ja.length} bytes of JSON), log ${sameLog ? 'identical' : 'DIFFERS'} (${la.split('\n').length} lines)`);
process.exit(sameFile && sameLog ? 0 : 1);
