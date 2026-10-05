/*
 * COV-B-STEP'S PREFLIGHT PARSE CHECK: reduce-covb.mjs's stamp gate holds the logs to predictions/diag-covb.md, and the
 * preflight is launched under "none", so the preflight calls the reducer's own parse, gate (at the preflight's size: 4 points,
 * 20 paths a world), per-path file checks and reading. Planted: a copy with one household's done line dropped, a copy with
 * COV's coverage entry removed, a copy with a sum line's survivors off its file by one, and a copy with S370's ORDER arm
 * dropped from its case line must each be refused.
 *   node research/solver/preflight-parse-covb.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, loadFiles, stampOf, UNITS } from './reduce-covb.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diagcovb-preflight');
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const SIZE = { pts: '4', npw: 20 }, ST = stampOf(texts[0]);
const run = ts => { const us = ts.flatMap(parse); const bad = gate(us, SIZE); return { us, bad: bad.length ? bad : loadFiles(us, DIR, ST, SIZE.npw).bad }; };
const { us, bad } = run(texts);
if (us.filter(u => u.done).length !== UNITS.length) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNITS.length} households done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const at = (re, f) => { const i = texts.findIndex(t => re.test(t)); if (i < 0) { console.log(`PREFLIGHT PARSE FAILED: no log matches ${re}`); process.exit(1); } return texts.map((t, j) => (j === i ? f(t) : t)); };
const planted = [
  ['a done line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+done .*\n/m, '') : t))).bad],
  ['COV without its coverage entry', () => run(at(/^S130 /m, t => t.replace(/(solve COV: .* coverage )\S+/, '$1-'))).bad],
  ['a sum line off its file by a survivor', () => run(at(/^S126 /m, t => t.replace(/(sum TAX: paths \d+ survived )(\d+)/, (m, a, n) => `${a}${Number(n) === 0 ? 1 : Number(n) - 1}`))).bad],
  ['S370 without its ORDER arm', () => run(at(/^S370 /m, t => t.replace(/arms BASE,TAX,COV,ORDER/, 'arms BASE,TAX,COV'))).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
const { files } = loadFiles(us, DIR, ST, SIZE.npw);
let lines = 0, reached = false;
reading(files, us, l => { lines++; if (/^\n?OUTCOME:/.test(l)) reached = true; });
if (!reached) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} households parsed and gated at the preflight's size, every per-path file held to its sum lines and the controls' identities; ${planted.length} planted faults refused; the reading ran to its outcome (${lines} lines, not read)`);
