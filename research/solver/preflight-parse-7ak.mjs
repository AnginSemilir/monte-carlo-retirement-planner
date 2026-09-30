/*
 * 7AK'S PREFLIGHT PARSE CHECK: reduce-7ak.mjs's stamp gate refuses a log launched under "none", so the preflight calls the
 * reducer's own parse, gate and reading over its logs at the preflight's size (4 wealth points, 20 paths), with P's
 * preflight (results/diagP-preflight: the same size and seed) as the reference - each solve P's preflight solve, each run's
 * trace its first 20 node paths. The gate must refuse nothing; the reading runs to its outcome line (counted, not printed).
 * Planted: a table changed, a snap count made inconsistent, and a trace byte changed must be refused.
 *   node research/solver/preflight-parse-7ak.mjs [dir] [dirP]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, readTrace, labelOf } from './reduce-7ak.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7ak-preflight'), DIRP = process.argv[3] || join(HERE, 'results', 'diagP-preflight');
const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
const texts = logs(DIR), P = logs(DIRP);
if (!texts.length || !P.length) { console.log(`PREFLIGHT PARSE FAILED: no logs (${texts.length} in ${DIR}, ${P.length} in ${DIRP}): a check that ran on nothing is an error`); process.exit(1); }
const refP = (id, label) => {
  const t = P.find(x => new RegExp(`^${id}\\s+case \\| job core:P ${label.split('/')[0]}/30x5/W${label.split('/W')[1]} `, 'm').test(x));
  if (!t) return null;
  const L = label.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), tb = new RegExp(`^\\s+solve ${L}: table (\\S+) secs`, 'm').exec(t), rn = new RegExp(`^\\s+ran ${L}: (.*)$`, 'm').exec(t);
  return tb && rn ? { table: tb[1], ran: rn[1] } : null;
};
const traces = (dir, flip = false) => (id, A, w, rule) => {
  const base = `${id.replace(/ /g, '_')}-${A.toLowerCase()}`, r = rule.toLowerCase().replace(/\+/g, '_');
  const a = readTrace(join(dir, `${base}-${r}-world0@w${w}.json.gz`)), p = readTrace(join(DIRP, `${base}-mp-${r}-world0@w${w}.json.gz`));
  if (flip && a && rule === 'OPEN0' && id === 'bridge 4') a.tier[a.tier.length - 1] ^= 1;
  return [a, p];
};
const check = (T, tr = traces(DIR)) => { const units = T.flatMap(parse); return { units, bad: gate(units, refP, tr, { np: 20 }) }; };
const c = check(texts);
if (c.bad.length) { console.log(`PREFLIGHT PARSE FAILED:\n  ${c.bad.join('\n  ')}`); process.exit(1); }
let lines = 0; const R = reading(c.units, () => { lines++; });
if (!R || !R.items) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome'); process.exit(1); }
const swap = (re, to) => { let done = false; return texts.map(t => (done || !re.test(t) ? t : (done = true, t.replace(re, to)))); };
const faults = [
  ['a table changed', swap(/(solve READER\/TS\+J\/MP\/30x5\/W0: table )(\d)/, (m, a, d) => a + ((+d + 1) % 10)), traces(DIR)],
  ['a snap count inconsistent', swap(/(snap READER\/TS\+J\/MP\/30x5\/W0 OPEN0 year 1: held \d+ disagree )(\d+)/, (m, a, d) => a + (+d + 1)), traces(DIR)],
  ['a trace byte changed', texts, traces(DIR, true)]];
const missed = faults.filter(([, T, tr]) => check(T, tr).bad.length === 0).map(([n]) => n);
if (missed.length) { console.log(`PREFLIGHT PARSE FAILED: planted faults not refused: ${missed.join('; ')}`); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: both units parsed and gated at the preflight's size with nothing refused - each solve P's preflight solve (table, ran line), each run P's preflight node paths field by field; the reading ran to its outcome line (${lines} lines, not printed) (planted ${faults.length})`);
