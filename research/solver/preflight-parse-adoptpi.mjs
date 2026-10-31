/*
 * ADOPT-PI'S PREFLIGHT PARSE CHECK: reduce-adoptpi.mjs's stamp gate holds the logs to predictions/adopt-pi.md, and the
 * preflight is launched under "none", so the preflight calls the reducer's own parse, gate (at the preflight's size: 4
 * points, 20 paths), per-path file checks and reading. Planted: a copy with one unit's done line dropped, a copy with one
 * PCLSI unit's pathsum changed (the pairing broken), a copy with a death-tax unit's death tax read as 0, and a copy with one
 * sum line's survivors off its file by one must each be refused.
 *   node research/solver/preflight-parse-adoptpi.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, loadTraces, stampOf, UNIT_KEYS } from './reduce-adoptpi.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diagadoptpi-preflight');
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const SIZE = { pts: '4', npw: 20 }, ST = stampOf(texts[0]);
const run = ts => { const us = ts.flatMap(parse); const bad = gate(us, SIZE); return { us, bad: bad.length ? bad : loadTraces(us, DIR, ST).bad }; };
const { us, bad } = run(texts);
if (us.filter(u => u.done).length !== UNIT_KEYS.length) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNIT_KEYS.length} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const at = (re, f) => { const i = texts.findIndex(t => re.test(t)); if (i < 0) { console.log(`PREFLIGHT PARSE FAILED: no log matches ${re}`); process.exit(1); } return texts.map((t, j) => (j === i ? f(t) : t)); };
const planted = [
  ['a done line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+done .*\n/m, '') : t))).bad],
  ['a PCLSI unit on other paths', () => run(at(/W0\.02\/PCLSI \|/, t => t.replace(/(sum OFF\/PRODUCT\/W0\.02\/PCLSI: .* pathsum )(\d+)/, (m, a, n) => `${a}${Number(n) + 1}`))).bad],
  ['a death-tax unit at death tax 0', () => run(at(/\/DT\/SNAP \|/, t => t.replace(/(ran OFF\/PRODUCT\/W0\.02\/DT\/SNAP: .*deathTax )0\.4/, '$10'))).bad],
  ['a sum line off its file by a survivor', () => run(at(/W0\.02\/SNAP \|/, t => t.replace(/(sum OFF\/PRODUCT\/W0\.02\/SNAP: paths 20 survived )(\d+)/, (m, a, n) => `${a}${Number(n) === 0 ? 1 : Number(n) - 1}`))).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
const { files } = loadTraces(us, DIR, ST);
let lines = 0, reached = false;
reading(files, l => { lines++; if (/^\n?OUTCOME:/.test(l)) reached = true; });
if (!reached) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size, every per-path file held to its sum line; ${planted.length} planted faults refused; the reading ran to its outcome (${lines} lines, not read)`);
