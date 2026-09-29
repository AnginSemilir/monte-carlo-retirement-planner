/*
 * 7AH'S PREFLIGHT PARSE CHECK: reduce-7ah.mjs's stamp gate refuses a log launched under "none", so the preflight calls the
 * reducer's own parse(), gate(), loadTraces() and reading() directly over its logs, at the preflight's sizes (4 wealth
 * points, 20 paths), with 7af's and 7ag's preflights (results/diag7af-preflight, diag7ag-preflight: the same sizes and seed,
 * their own code, each proved by its own preflight parse check) as READER/W0.02's references. The gate must refuse nothing;
 * READER/W0.02 must be their preflight CAND to the bit (ran line, table, trace); the reading runs to its outcome line, its
 * lines counted, not printed. No figure is read. Planted: faults put into the preflight's own logs must be refused.
 *   node research/solver/preflight-parse-7ah.mjs [dir] [dir7af] [dir7ag]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { parse, gate, UNITS, loadTraces, reading, FROM_AF, traceName, stampOf } from './reduce-7ah.mjs';
import { decode } from './reduce-7t.mjs';
import * as F from './reduce-7af.mjs';
import * as G from './reduce-7ag.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const N_PRE = 20, PTS_PRE = '4';
const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
const asObj = texts => Object.fromEntries(texts.map((t, i) => [`case${i}.txt`, t]));
function check(texts, X, dir) {
  const units = texts.flatMap(parse), bad = gate(units, X.refUnit, { n: N_PRE, pts: PTS_PRE });
  let TR = null;
  if (dir && !bad.length) TR = loadTraces(units, dir, stampOf(asObj(texts)), bad, X.refT, N_PRE);
  return { units, bad, TR };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const R_ = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = R_(0, 'diag7ah-preflight'), DIRF = R_(1, 'diag7af-preflight'), DIRG = R_(2, 'diag7ag-preflight');
  const texts = logs(DIR);
  if (texts.length !== UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${texts.length} of ${UNITS.length} logs in ${DIR}`); process.exit(1); }
  const unitsF = logs(DIRF).flatMap(F.parse), unitsG = logs(DIRG).flatMap(G.parse);
  const X = {
    refUnit: id => (FROM_AF.includes(id) ? unitsF.find(u => u.id === id && u.arm === F.CAND[0] && u.label === F.CAND[1]) : unitsG.find(u => u.id === id && u.arm === G.CAND[0] && u.label === G.CAND[1])) || null,
    refT: id => { const f = join(FROM_AF.includes(id) ? DIRF : DIRG, traceName(id, 'READER', 'TS+J/W0.02')); return existsSync(f) ? decode(JSON.parse(gunzipSync(readFileSync(f)).toString())) : null; } };
  const good = check(texts, X, DIR);
  // planted: each fault must change the logs and be refused (a check that ran on nothing is an error, not a pass)
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t, X, null).bad.length > 0); };
  const cases = [
    ['the preflight\'s own logs: every unit, nothing refused, every trace as the reducer reads it', `${good.units.length} ${good.bad.length}`, `${UNITS.length} 0`],
    ['planted: a missing done line is refused', plant(ts => ts.map((t, i) => (i === 0 ? t.replace(/^\s+done .*$/m, '') : t)), 'no done'), 'true'],
    ['planted: a wrong seed is refused', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7004')), 'a wrong seed'), 'true'],
    ['planted: ORDER without its reference is refused', plant(ts => ts.map(t => t.replace(/ readerRef order/g, '')), 'no readerRef'), 'true'],
    ['planted: another table on a READER/W0.02 unit is refused', plant(ts => ts.map(t => t.replace(/(solve READER\/TS\+J\/W0\.02: table )(\d+\.\d+)/, (m, a, b) => `${a}${(Number(b) + 1).toFixed(4)}`)), 'another table'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); if (good.bad.length) console.log(`  ${good.bad.join('\n  ')}`); process.exit(1); }
  let lines = 0, outcome = false;
  try { reading(good.units, good.TR, l => { lines++; if (/^\nOUTCOME: /.test(l)) outcome = true; }); } catch (e) { console.log(`PREFLIGHT READING FAILED: ${e.message}`); process.exit(1); }
  if (!outcome) { console.log(`PREFLIGHT READING FAILED: no outcome line in ${lines} lines`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${UNITS.length} units parsed and gated at the preflight's sizes with nothing refused - READER/W0.02 7af's and 7ag's preflight CAND by ran line, table and trace; ORDER READER's with readerRef order; 0.01 the 0.02 solve with the weight; every trace named and stamped as the reducer reads it; the reducer's reading ran to its outcome line (${lines} lines, not printed) (planted ${cases.length - 1})`);
}
