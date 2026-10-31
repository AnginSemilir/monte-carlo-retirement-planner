/*
 * 7AF'S PREFLIGHT PARSE CHECK (as 7ae's): reduce-7af.mjs's stamp gate refuses a log launched under "none", so the preflight
 * calls the reducer's own parse(), gate(), loadTraces() and reading() directly over its logs, at the preflight's sizes (4
 * points, 20 paths), with 7aa's preflight units (results/diag7aa-preflight: the same sizes and seed, its own code) as the
 * identity references. The gate must refuse nothing; every unit 7aa's preflight also ran must equal it, its trace path by
 * path; the reading runs to its outcome line, its lines counted, not printed. No figure is read.
 *   node research/solver/preflight-parse-7af.mjs [dir] [dir7aa]   defaults results/diag7af-preflight, results/diag7aa-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, UNITS, loadTraces, reading } from './reduce-7af.mjs';
import * as A from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const N_PRE = 20, PTS_PRE = '4';
const stampOf = t => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(t || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
export function check(texts, textsA, dir, dirA) {
  const units = texts.flatMap(parse), unitsA = textsA.flatMap(A.parse);
  const refA = (id, arm, l) => unitsA.find(u => u.id === id && u.arm === arm && u.label === l) || null;
  const bad = gate(units, refA, N_PRE, PTS_PRE);
  let TR = null;
  if (dir && !bad.length) TR = loadTraces(units, dir, stampOf(texts[0]), bad, dirA, stampOf(textsA[0]), refA, N_PRE);
  return { units, bad, TR, ids: UNITS.filter(([id, a, l]) => refA(id, a, l)).length };
}
function planted(texts, textsA, dir, dirA) {
  const good = check(texts, textsA, dir, dirA);
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t, textsA).bad.length > 0); };
  const cases = [
    ['the preflight\'s own logs: every unit, nothing refused, every trace as the reducer reads it, units compared with 7aa\'s', `${good.units.length} ${good.bad.length} ${good.ids > 0}`, `${UNITS.length} 0 true`],
    ['planted: a missing gap line is refused', plant(ts => ts.map(t => t.replace(/^\s+gap \S+: .*$/m, '')), 'no gap line'), 'true'],
    ['planted: a unit run twice is refused', plant(ts => [...ts, ts[0]], 'a unit twice'), 'true'],
    ['planted: a wrong seed is refused', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: a table off 7aa\'s preflight is refused', plant(ts => ts.map(t => (/unit READER\/TS\+J\/W0\.02/.test(t) && /^S126 /m.test(t) ? t.replace(/(solve \S+: table )(\d+)/, (m, a, b) => `${a}${Number(b) + 1}`) : t)), 'another table'), 'true'],
    ['planted: CAND per world is refused', plant(ts => ts.map(t => t.replace(/(joint \S+\/TS\+J\/\S+: )true/, '$1false')), 'per-world tables'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return { n: cases.length, good };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7af-preflight'), DIRA = args[1] || join(HERE, 'results', 'diag7aa-preflight');
  const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
  const texts = logs(DIR), textsA = logs(DIRA);
  if (texts.length !== UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${texts.length} of ${UNITS.length} logs in ${DIR}`); process.exit(1); }
  if (textsA.length !== A.UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${textsA.length} of ${A.UNITS.length} 7aa preflight logs in ${DIRA}`); process.exit(1); }
  const { n, good } = planted(texts, textsA, DIR, DIRA);
  if (good.bad.length) { console.log(`PREFLIGHT PARSE FAILED:\n  ${good.bad.join('\n  ')}`); process.exit(1); }
  let lines = 0, outcome = false;
  try { reading(good.units, good.TR, l => { lines++; if (/^\nOUTCOME: /.test(l)) outcome = true; }, N_PRE); } catch (e) { console.log(`PREFLIGHT READING FAILED: ${e.message}`); process.exit(1); }
  if (!outcome) { console.log(`PREFLIGHT READING FAILED: no outcome line in ${lines} lines`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${UNITS.length} units parsed and gated at the preflight's sizes with nothing refused; ${good.ids} units equal to 7aa's preflight, their traces path by path; every trace named and stamped as the reducer reads it; the reducer's reading ran over them to its outcome line (${lines} lines, not printed) (planted ${n})`);
}
