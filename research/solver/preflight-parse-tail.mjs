/*
 * TAIL'S PREFLIGHT PARSE CHECK: reduce-tail.mjs's stamp gate holds the logs to predictions/diag-tail.md, and the preflight is
 * launched under "none", so the preflight calls the reducer's own parse, gate (at the preflight's size: 4 points, 20 paths),
 * per-path file checks, identity and reading. The identity runs against ADOPT-PI's own preflight (results/diagadoptpi-preflight:
 * the same unit at 4 points, 20 paths, seed 7005; through reduce-adoptpi.mjs's parse, gate and file checks at that size), so
 * the code since ADOPT-PI is shown to leave the SNAP and PCLSI arms path for path where they were. Planted: a done line
 * dropped, HYB's read logged interpolated, PCLSI-TIE logged at another margin, a DT unit at death tax 0, a sum line off its
 * file by a survivor, and one path's tax moved in a PCLSI file against ADOPT-PI's must each be refused.
 *   node research/solver/preflight-parse-tail.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, loadTraces, identity, stampOf, UNIT_KEYS } from './reduce-tail.mjs';
import { parse as parseA, gate as gateA, loadTraces as loadA, logsOf } from './reduce-adoptpi.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diagtail-preflight'), ADIR = join(HERE, 'results', 'diagadoptpi-preflight');
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const SIZE = { pts: '4', npw: 20 }, ST = stampOf(texts[0]);
// ADOPT-PI's preflight files, through its own gate at the preflight's size
const alogs = logsOf(ADIR), aus = Object.values(alogs).flatMap(parseA), abad = gateA(aus, SIZE);
if (!aus.length || abad.length) { console.log(`PREFLIGHT PARSE FAILED: ADOPT-PI's preflight files do not pass its gate (${aus.length} units):\n  ${abad.slice(0, 5).join('\n  ')}`); process.exit(1); }
const at0 = loadA(aus, ADIR, stampOf(Object.values(alogs)[0]));
if (at0.bad.length) { console.log(`PREFLIGHT PARSE FAILED: ADOPT-PI's preflight files: ${at0.bad.slice(0, 5).join('; ')}`); process.exit(1); }
const run = (ts, tweak = null) => {
  const us = ts.flatMap(parse); const bad = gate(us, SIZE); if (bad.length) return { us, bad };
  const tr = loadTraces(us, DIR, ST); if (tweak) tweak(tr.files);
  return { us, bad: tr.bad.length ? tr.bad : identity(tr.files, at0.files), files: tr.files };
};
const { us, bad, files } = run(texts);
if (us.filter(u => u.done).length !== UNIT_KEYS.length) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNIT_KEYS.length} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const at = (re, f) => { const i = texts.findIndex(t => re.test(t)); if (i < 0) { console.log(`PREFLIGHT PARSE FAILED: no log matches ${re}`); process.exit(1); } return texts.map((t, j) => (j === i ? f(t) : t)); };
const planted = [
  ['a done line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+done .*\n/m, '') : t))).bad],
  ['HYB logged interpolated', () => run(at(/\/HYB \|/, t => t.replace(/(ran OFF\/PRODUCT\/W0\.02\/HYB: .* read )false/, '$1true'))).bad],
  ['PCLSI-TIE at another margin', () => run(at(/\/PCLSI-TIE \|/, t => t.replace(/(ran OFF\/PRODUCT\/W0\.02\/PCLSI-TIE: .* tieMargin )\S+/, '$10.0001'))).bad],
  ['a DT unit at death tax 0', () => run(at(/\/DT\/SNAP \|/, t => t.replace(/(ran OFF\/PRODUCT\/W0\.02\/DT\/SNAP: .*deathTax )0\.4/, '$10'))).bad],
  ['a sum line off its file by a survivor', () => run(at(/W0\.02\/SNAP \|/, t => t.replace(/(sum OFF\/PRODUCT\/W0\.02\/SNAP: paths 20 survived )(\d+)/, (m, a, n) => `${a}${Number(n) === 0 ? 1 : Number(n) - 1}`))).bad],
  ['one path\'s tax off ADOPT-PI\'s', () => run(texts, fs => { fs['S130 PCLSI'].tax[3] += 1; }).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
let lines = 0, reached = false;
reading(files, us, l => { lines++; if (/^\n?OUTCOME:/.test(l)) reached = true; }, { b: 200 });
if (!reached) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size, every per-path file held to its sum line, the SNAP and PCLSI arms equal to ADOPT-PI's preflight path for path on ${UNIT_KEYS.filter(k => / (SNAP|PCLSI)$/.test(k) && !/ DT /.test(k)).length} units; ${planted.length} planted faults refused; the reading ran to its outcome (${lines} lines, not read)`);
