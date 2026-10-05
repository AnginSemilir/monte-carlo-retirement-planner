/*
 * EDGE-SPLIT'S PREFLIGHT PARSE CHECK: reduce-edge.mjs's stamp gate holds the logs to predictions/diag-edge.md, and the
 * preflight is launched under "none", so the preflight calls the reducer's own parse, gate (at the preflight's size: 4 points,
 * 20 paths), per-path file checks, identity and reading. The identity runs against HYB's own preflight (results/diaghyb-preflight:
 * the same unit at 4 points, 20 paths, seed 7005; through reduce-hyb.mjs's parse, gate and file checks at that size), so the
 * code since HYB (grid.js pclsSeg, default off) is shown to leave the SNAP and PCLSI arms path for path where they were, and
 * HYB's preflight HYB arm joins the reading. Planted: a done line dropped, P-LO logged on the high segment, a unit at a tie
 * margin, a unit at a death tax of 0.4, a sum line off its file by a survivor, and one path's tax moved in a PCLSI file
 * against HYB's must each be refused.
 *   node research/solver/preflight-parse-edge.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, loadTraces, identity, stampOf, UNIT_KEYS, PANEL } from './reduce-edge.mjs';
import { parse as parseH, gate as gateH, loadTraces as loadH } from './reduce-hyb.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diagedge-preflight'), HDIR = join(HERE, 'results', 'diaghyb-preflight');
const logsIn = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
const texts = logsIn(DIR);
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const SIZE = { pts: '4', npw: 20 }, ST = stampOf(texts[0]);
// HYB's preflight files, through its own gate at the preflight's size
const htexts = logsIn(HDIR), hus = htexts.flatMap(parseH), hbad = gateH(hus, SIZE);
if (!hus.length || hbad.length) { console.log(`PREFLIGHT PARSE FAILED: HYB's preflight files do not pass its gate (${hus.length} units):\n  ${hbad.slice(0, 5).join('\n  ')}`); process.exit(1); }
const ht0 = loadH(hus, HDIR, stampOf(htexts[0]));
if (ht0.bad.length) { console.log(`PREFLIGHT PARSE FAILED: HYB's preflight files: ${ht0.bad.slice(0, 5).join('; ')}`); process.exit(1); }
const run = (ts, tweak = null) => {
  const us = ts.flatMap(parse); const bad = gate(us, SIZE); if (bad.length) return { us, bad };
  const tr = loadTraces(us, DIR, ST); if (tweak) tweak(tr.files);
  return { us, bad: tr.bad.length ? tr.bad : identity(tr.files, ht0.files), files: tr.files };
};
const { us, bad, files } = run(texts);
if (us.filter(u => u.done).length !== UNIT_KEYS.length) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNIT_KEYS.length} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const at = (re, f) => { const i = texts.findIndex(t => re.test(t)); if (i < 0) { console.log(`PREFLIGHT PARSE FAILED: no log matches ${re}`); process.exit(1); } return texts.map((t, j) => (j === i ? f(t) : t)); };
const planted = [
  ['a done line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+done .*\n/m, '') : t))).bad],
  ['P-LO logged on the high segment', () => run(at(/\/P-LO \|/, t => t.replace(/(ran OFF\/PRODUCT\/W0\.02\/P-LO: .* seg )lo/, '$1hi'))).bad],
  ['a unit at a tie margin', () => run(at(/W0\.02\/PCLSI \|/, t => t.replace(/(ran OFF\/PRODUCT\/W0\.02\/PCLSI: .* tieMargin )\S+/, '$10.0001'))).bad],
  ['a unit at a death tax of 0.4', () => run(at(/W0\.02\/SNAP \|/, t => t.replace(/(ran OFF\/PRODUCT\/W0\.02\/SNAP: .*deathTax )0\b/, '$10.4'))).bad],
  ['a sum line off its file by a survivor', () => run(at(/W0\.02\/SNAP \|/, t => t.replace(/(sum OFF\/PRODUCT\/W0\.02\/SNAP: paths 20 survived )(\d+)/, (m, a, n) => `${a}${Number(n) === 0 ? 1 : Number(n) - 1}`))).bad],
  ['one path\'s tax off HYB\'s', () => run(texts, fs => { fs['S130 PCLSI'].tax[3] += 1; }).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
for (const id of PANEL) files[`${id} HYB`] = ht0.files[`${id} HYB`];
let lines = 0, reached = false;
reading(files, l => { lines++; if (/^\n?OUTCOME:/.test(l)) reached = true; }, { b: 200 });
if (!reached) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size, every per-path file held to its sum line, the SNAP and PCLSI arms equal to HYB's preflight path for path on ${UNIT_KEYS.filter(k => / (SNAP|PCLSI)$/.test(k)).length} units; ${planted.length} planted faults refused; the reading ran to its outcome (${lines} lines, not read)`);
