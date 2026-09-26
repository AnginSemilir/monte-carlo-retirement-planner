/*
 * 7R'S LOST PATHS, BY THE KIND OF FAILURE (the sixty-ninth review's BLOCKING 2). Reported, not a test: reduce-7r.mjs is
 * registered and 7r is read, and its printed "median failure year" took a raw -1 as a year. runPolicy marks the year of an
 * in-life failure (a year it could not pay the floor) in the trace, but a path that pays every year and ends below the
 * minimum pot fails at the end with its trace's failure year left at -1 (solve.js runPolicy, the solvency-floor return;
 * record.mjs makeTrace). This script reads the same logs and traces, through the same gates (requireFairLogs over the logs'
 * stamps, each trace's count, seed, arm and stamp against the logs'), and splits each arm's lost paths into the two kinds:
 *   - in life: the year it failed;
 *   - at the end, below the minimum pot: the arm's last-year wealth and off's on the same path.
 * The median failure year counts an end-of-plan failure as the plan's last year.
 *   node research/solver/read-7r-failures.mjs [dir=results/diag7r]   > research/solver/results-7r-failures.txt
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'diag7r');
const PRED = 'research/solver/predictions/diag-7r.md';
const PATHS = 3000, SEED = '7002';
const PANEL = [['S126', ['READER', 'RTIER', 'RREST']], ['bridge 4', ['READER', 'RTIER', 'RREST']], ['wealth x2', ['READER']], ['S366', ['V1']]];

const b = s => Buffer.from(s, 'base64');
export const decode = j => ({ N: j.N, Y: j.Y, survived: new Uint8Array(b(j.survived)), wealth: (x => new Float32Array(x.buffer, x.byteOffset, x.byteLength / 4))(b(j.wealth)), failYear: (x => new Int16Array(x.buffer, x.byteOffset, x.byteLength / 2))(b(j.failYear)) });
export function logStamp(text) {
  const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text || '');
  return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null;
}
export const stampAgrees = (j, st) => !!(st && j && j.stamp && ['code', 'audit', 'prediction', 'sha'].every(x => j.stamp[x] === st[x]));
const lastWealth = (T, i) => T.wealth[i * T.Y + T.Y - 1];
const median = xs => { const s = [...xs].sort((a, c) => a - c), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
// the arm's lost paths against off, by kind; an end-of-plan failure's year is the plan's last (Y - 1)
export function lostKinds(A, B) {
  const inLife = [], atEnd = [];
  for (let i = 0; i < A.N; i++) {
    if (!(A.survived[i] && !B.survived[i])) continue;
    const fy = B.failYear[i];
    if (fy >= 0) inLife.push({ path: i, year: fy });
    else atEnd.push({ path: i, end: lastWealth(B, i), offEnd: lastWealth(A, i) });
  }
  const years = [...inLife.map(x => x.year), ...atEnd.map(() => A.Y - 1)];
  return { lost: inLife.length + atEnd.length, inLife, atEnd, medYear: median(years) };
}
const k = x => `${Math.round(x / 1000)}k`;
const range = xs => (xs.length ? `${k(Math.min(...xs))} to ${k(Math.max(...xs))}` : '-');

// PLANTED, before any real file (rule 6)
{
  const mk = (surv, fails, last) => ({ N: surv.length, Y: 3, survived: Uint8Array.from(surv), failYear: Int16Array.from(fails), wealth: Float32Array.from(last.flatMap(w => [1, 1, w])) });
  // off survives all four; the arm fails path 1 in year 1 (in life) and path 2 at the end (-1), path 3 survives
  const A = mk([1, 1, 1, 1], [-1, -1, -1, -1], [50000, 40000, 35000, 60000]);
  const B = mk([1, 0, 0, 1], [-1, 1, -1, -1], [70000, 0, 20000, 80000]);
  const c = lostKinds(A, B);
  const cases = [
    ['two lost: one in life, one at the end', `${c.lost} ${c.inLife.length} ${c.atEnd.length}`, '2 1 1'],
    ['the in-life failure keeps its year', String(c.inLife[0]?.year), '1'],
    ['the end-of-plan failure: its end wealth and off\'s', `${c.atEnd[0]?.end} ${c.atEnd[0]?.offEnd}`, '20000 35000'],
    ['the median failure year counts an end-of-plan failure as the last year (years 1 and 2)', String(c.medYear), '1.5'],
    ['the stamp line read; a trace stamped as the logs agrees, one with another prediction version or no stamp does not', (() => { const st = logStamp('x\nstamp: code a audit b prediction c sha d\n'); return `${st.sha} ${stampAgrees({ stamp: { ...st } }, st)} ${stampAgrees({ stamp: { ...st, sha: 'e' } }, st)} ${stampAgrees({}, st)}`; })(), 'd true false false'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  if (process.argv.includes('--planted')) { console.log(`planted (${cases.length}): all read as they should`); process.exit(0); }
}

// the real files, through the same gates as reduce-7r.mjs
const logs = {};
for (let i = 0; i < 5; i++) { const f = join(DIR, `part${i}.txt`); if (existsSync(f)) logs[`part${i}.txt`] = readFileSync(f, 'utf8'); }
if (Object.keys(logs).length !== 5) { console.log(`INCOMPLETE - ${Object.keys(logs).length} of 5 logs in ${DIR}`); process.exit(1); }
requireFairLogs(logs, PRED);
const stamps = Object.values(logs).map(logStamp), ST = stamps[0];
if (!ST || stamps.some(x => JSON.stringify(x) !== JSON.stringify(ST))) { console.log('FAIR-TEST GATE: FAILED\n  the logs\' stamp lines are missing or differ'); process.exit(1); }
const minPot = (/ minPot (\d+) /.exec(Object.values(logs).join('\n')) || [])[1];
const load = (id, arm) => {
  const f = join(DIR, `${id.replace(/ /g, '_')}-${arm.toLowerCase()}.json.gz`);
  if (!existsSync(f)) { console.log(`INCOMPLETE - no trace ${f}`); process.exit(1); }
  const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  if (j.N !== PATHS || String(j.seed) !== SEED || j.arm !== arm || !stampAgrees(j, ST)) { console.log(`FAIR-TEST GATE: FAILED\n  ${f}: count, seed, arm or stamp is not the logs'`); process.exit(1); }
  return decode(j);
};
console.log(`7R'S LOST PATHS BY THE KIND OF FAILURE (reported, not a test; the logs' gate and every trace's stamp checked). Against off on`);
console.log(`the same ${PATHS} paths of seed ${SEED}; the minimum pot ${minPot}. An end-of-plan failure paid every year and ended below it.\n`);
for (const [id, arms] of PANEL) {
  const off = load(id, 'OFF');
  for (const arm of arms) {
    const c = lostKinds(off, load(id, arm));
    if (!c.lost) { console.log(`${id.padEnd(9)} ${arm.padEnd(6)} lost 0`); continue; }
    console.log(`${id.padEnd(9)} ${arm.padEnd(6)} lost ${c.lost}: in life ${c.inLife.length}${c.inLife.length ? ` (years ${c.inLife.map(x => x.year).sort((a, z) => a - z).join(', ')})` : ''}; at the end, below the minimum pot ${c.atEnd.length}${c.atEnd.length ? ` (ending ${range(c.atEnd.map(x => x.end))}; off on the same paths ${range(c.atEnd.map(x => x.offEnd))})` : ''}; median failure year ${c.medYear} of ${off.Y - 1}`);
  }
}
