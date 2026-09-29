/*
 * 7AG'S PREFLIGHT PARSE CHECK (as 7af's): reduce-7ag.mjs's stamp gate refuses a log launched under "none", so the preflight
 * calls the reducer's own parse(), gate(), loadTraces() and reading() directly over its logs, at the preflight's sizes (4
 * points, 20 paths for every unit, TSOFF included), with 7af's preflight S126 units (results/diag7af-preflight: the same
 * sizes and seed, read through 7af's own gate and traces against 7aa's preflight) as TSOFF's references and item 3's
 * pairs. The gate must refuse nothing; the reading runs to its outcome line, its lines counted, not printed. No figure is
 * read.
 *   node research/solver/preflight-parse-7ag.mjs [dir] [dir7af] [dir7aa]
 *     defaults results/diag7ag-preflight, results/diag7af-preflight, results/diag7aa-preflight
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, UNITS, loadTraces, reading, SHIP, CAND } from './reduce-7ag.mjs';
import * as F from './reduce-7af.mjs';
import * as A from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const N_PRE = 20, PTS_PRE = '4';
const stampOf = t => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(t || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
/* 7af's preflight S126 units and traces, through 7af's gate against 7aa's preflight */
function ref126(textsF, textsA, dirF, dirA) {
  const unitsF = textsF.flatMap(F.parse), unitsA = textsA.flatMap(A.parse);
  const refA = (id, arm, l) => unitsA.find(u => u.id === id && u.arm === arm && u.label === l) || null;
  const bad = F.gate(unitsF, refA, N_PRE, PTS_PRE), u126 = unitsF.filter(u => u.id === 'S126');
  const TRF = bad.length ? {} : F.loadTraces(u126, dirF, stampOf(textsF[0]), bad, dirA, stampOf(textsA[0]), refA, N_PRE);
  return { u126, bad, T126: bad.length ? null : { SHIP: TRF[`S126|${SHIP[0]}|${SHIP[1]}`], CAND: TRF[`S126|${CAND[0]}|${CAND[1]}`] } };
}
export function check(texts, R, dir) {
  const units = texts.flatMap(parse);
  const bad = gate(units, N_PRE, PTS_PRE, R.u126);
  let TR = null;
  if (dir && !bad.length) TR = loadTraces(units, dir, stampOf(texts[0]), bad, N_PRE);
  return { units, bad, TR };
}
function planted(texts, R, dir) {
  const good = check(texts, R, dir);
  const plant = (f, why) => { const t = f(texts); if (t.join('\n') === texts.join('\n')) throw new Error(`the plant "${why}" changed nothing`); return String(check(t, R).bad.length > 0); };
  const cases = [
    ['the preflight\'s own logs: every unit, nothing refused, every trace as the reducer reads it', `${good.units.length} ${good.bad.length}`, `${UNITS.length} 0`],
    ['planted: a missing gap line is refused', plant(ts => ts.map(t => t.replace(/^\s+gap \S+: .*$/m, '')), 'no gap line'), 'true'],
    ['planted: a unit run twice is refused', plant(ts => [...ts, ts[0]], 'a unit twice'), 'true'],
    ['planted: a wrong seed is refused', plant(ts => ts.map(t => t.replace(/seed 7002/g, 'seed 7003')), 'a wrong seed'), 'true'],
    ['planted: CAND per world is refused', plant(ts => ts.map(t => t.replace(/(joint READER\/TS\+J\/\S+: )true/, '$1false')), 'per-world tables'), 'true'],
    ['planted: TSOFF at another scale than 7af\'s S126 is refused', plant(ts => ts.map(t => (/unit OFF\/TS\+J\/W0\.02/.test(t) ? t.replace(/( scale )(\d+)/, (m, a, b) => `${a}${Number(b) + 1}`) : t)), 'TSOFF\'s scale'), 'true'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([nm, got, w]) => `${nm} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return { n: cases.length, good };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ag-preflight'), DIRF = args[1] || join(HERE, 'results', 'diag7af-preflight'), DIRA = args[2] || join(HERE, 'results', 'diag7aa-preflight');
  const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
  const texts = logs(DIR), textsF = logs(DIRF), textsA = logs(DIRA);
  if (texts.length !== UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${texts.length} of ${UNITS.length} logs in ${DIR}`); process.exit(1); }
  if (textsF.length !== F.UNITS.length) { console.log(`PREFLIGHT INCOMPLETE - ${textsF.length} of ${F.UNITS.length} 7af preflight logs in ${DIRF}`); process.exit(1); }
  const R = ref126(textsF, textsA, DIRF, DIRA);
  if (R.bad.length) { console.log(`PREFLIGHT PARSE FAILED (7af's preflight):\n  ${R.bad.join('\n  ')}`); process.exit(1); }
  const { n, good } = planted(texts, R, DIR);
  if (good.bad.length) { console.log(`PREFLIGHT PARSE FAILED:\n  ${good.bad.join('\n  ')}`); process.exit(1); }
  let lines = 0, outcome = false;
  try { reading(good.units, good.TR, l => { lines++; if (/^\nOUTCOME: /.test(l)) outcome = true; }, N_PRE, R.T126); } catch (e) { console.log(`PREFLIGHT READING FAILED: ${e.message}`); process.exit(1); }
  if (!outcome) { console.log(`PREFLIGHT READING FAILED: no outcome line in ${lines} lines`); process.exit(1); }
  console.log(`PREFLIGHT PARSE PASSED: ${UNITS.length} units parsed and gated at the preflight's sizes with nothing refused, TSOFF against 7af's preflight S126 units; every trace named and stamped as the reducer reads it; the reducer's reading ran over them, item 3 paired with 7af's preflight traces, to its outcome line (${lines} lines, not printed) (planted ${n})`);
}
