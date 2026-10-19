/*
 * COPY-X'S YEARS READ (reported lines for results-copyx.txt; read-only, from the batch's own files): where the copy rule moves
 * each world's bridge residual. Per world and bridge year it prints the copy rule's change in the residual, path by path on the
 * same paths, CX less C and SNRX less SNR, with its 95% normal interval, and each world's sums over the step years (3 and 7)
 * and over the other bridge years (1, 2 and 4 to 6), beside the control's own residual there: a change confined to some years
 * leaves the control's residual at the others as it was, so a world whose total turns from over to under with no change at
 * those years shows an error the control already had (unmasked, RULES.md section 9), not one the rule made. It runs the
 * reducer's gate first (reduce-copyx.mjs in its full mode) and refuses if it fails.
 *   node research/solver/read-copyx-years.mjs [dir] > research/solver/results-copyx-years.txt
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { HOUSE, LABELS } from './reduce-copyx.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = process.argv[2] || join(HERE, 'results', 'diagcopyx');
const g = spawnSync('node', [join(HERE, 'reduce-copyx.mjs'), DIR], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
if (!/^GATE: passed/m.test(g)) { console.log('the reducer\'s gate did not pass on these files'); process.exit(1); }
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
const dec = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const J = Object.fromEntries(Object.keys(LABELS).map(a => [a, JSON.parse(gunzipSync(readFileSync(join(DIR, `${HOUSE}-${LABELS[a].replace('/', '-')}.json.gz`))).toString())]));
const Y = (a, t, k) => { const v = J[a].per[`Y${t}${k}`]; if (!v) { console.log(`no Y${t}${k} in ${a}'s file`); process.exit(1); } return Float64Array.from(dec(v), x => 100 * x); };
const paired = (ctl, arm) => { const n = ctl.length; let s = 0; for (let i = 0; i < n; i++) s += arm[i] - ctl[i]; const m = s / n; let v = 0; for (let i = 0; i < n; i++) v += (arm[i] - ctl[i] - m) ** 2; const se = Math.sqrt(v / (n - 1) / n); return { d: m, lo: m - 1.96 * se, hi: m + 1.96 * se }; };
const mean = a => a.reduce((t, x) => t + x, 0) / a.length, sum = (k, a, ts) => ts.reduce((acc, t) => acc.map((x, i) => x + Y(a, t, k)[i]), new Float64Array(Y(a, 1, k).length));
const STEP = [3, 7], REST = [1, 2, 4, 5, 6], ALL = [1, 2, 3, 4, 5, 6, 7];
console.log('COPY-X: WHERE THE COPY RULE MOVES THE BRIDGE RESIDUAL (results/diagcopyx; reported lines, grade C, one household, one seed)');
console.log(`GATE: passed (reduce-copyx.mjs over ${DIR})`);
for (const [ctl, arm] of [['C', 'CX'], ['SNR', 'SNRX']]) {
  for (let k = 0; k < 3; k++) {
    console.log(`\n${arm} less ${ctl}, world ${k}, by bridge year (points, path by path, 95%):`);
    for (const t of ALL) { const p = paired(Y(ctl, t, k), Y(arm, t, k)); console.log(`  year ${t}: ${ctl} ${f4(mean(Y(ctl, t, k)))}, ${arm} ${f4(mean(Y(arm, t, k)))}, change ${f4(p.d)} (${f4(p.lo)} to ${f4(p.hi)})`); }
    for (const [name, ts] of [['the step years 3 and 7', STEP], ['the other bridge years 1, 2 and 4 to 6', REST]]) {
      const c = sum(k, ctl, ts), x = sum(k, arm, ts), p = paired(c, x);
      console.log(`  SUM ${arm} world ${k}, ${name}: ${ctl} ${f4(mean(c))}, ${arm} ${f4(mean(x))}, change ${f4(p.d)} (${f4(p.lo)} to ${f4(p.hi)})`);
    }
  }
}
