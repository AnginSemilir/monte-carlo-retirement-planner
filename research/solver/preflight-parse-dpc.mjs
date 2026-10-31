/*
 * THE THREE-ARM DRAW-PAUSE CONTRAST'S PREFLIGHT PARSE CHECK: reduce-dpc.mjs's stamp gate holds the logs to
 * predictions/measure-dpc.md, and the preflight is launched under "none", so the preflight calls the reducer's own parse,
 * gate (at the preflight's size: 4 points, 20 paths; SNAP held to DP's own audit run at that size) and reading. Planted: a
 * copy with one unit's done line dropped, a copy with one SNAP dp line changed by a path (off DP's), a copy with SHIFT run on
 * the default buckets, and a copy with one dist cliff changed must each be refused; SNAP's traces (written to the preflight's
 * folder) are held to their dp lines, and one held to a dp line whose reach is changed must be refused.
 *   node research/solver/preflight-parse-dpc.mjs [dir] [dp reference dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, dpRecords, loadTraces, stampOf, PANEL, ARMS } from './reduce-dpc.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diagdpc-preflight'), REF = process.argv[3] || join(HERE, 'results', 'diagdp-preflight-dpc');
const read = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
const texts = read(DIR), refs = read(REF);
if (!texts.length || !refs.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${texts.length ? REF : DIR}: a check that ran on nothing is an error`); process.exit(1); }
const dp = dpRecords(refs), SIZE = { pts: '4', npw: 20, dp };
const run = ts => { const us = ts.flatMap(parse); return { us, bad: gate(us, SIZE) }; };
const { us, bad } = run(texts), want = PANEL.length * Object.keys(ARMS).length;
if (us.filter(u => u.done).length !== want) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${want} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const ST = stampOf(texts[0]), tb = loadTraces(us, DIR, ST);
if (tb.length) { console.log(`PREFLIGHT PARSE FAILED: SNAP's traces:\n  ${tb.join('\n  ')}`); process.exit(1); }
const at = (re, f) => { const i = texts.findIndex(t => re.test(t)); if (i < 0) { console.log(`PREFLIGHT PARSE FAILED: no log matches ${re}`); process.exit(1); } return texts.map((t, j) => (j === i ? f(t) : t)); };
if (!loadTraces(run(at(/unit OFF\/PRODUCT\/W0\.02 \|/, t => t.replace(/(dp OFF\/PRODUCT\/W0\.02: paths 20 survived \d+ reach )(\d+)/, (m, a, n) => `${a}${Number(n) + 1}`))).us, DIR, ST).length) { console.log('PREFLIGHT PARSE FAILED: a trace held to a dp line off its reach is not refused'); process.exit(1); }
const planted = [
  ['a done line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+done .*\n/m, '') : t))).bad],
  ['a SNAP dp line off DP\'s by a path', () => run(at(/unit OFF\/PRODUCT\/W0\.02 \|/, t => t.replace(/(dp OFF\/PRODUCT\/W0\.02: paths 20 survived )(\d+)/, (m, a, n) => `${a}${Number(n) === 0 ? 1 : Number(n) - 1}`))).bad],
  ['SHIFT on the default buckets', () => run(at(/\/SHIFT \|/, t => t.replace('pcls 0,0.6,1', 'pcls 0,0.5,1'))).bad],
  ['a dist cliff changed', () => run(at(/\/PCLSI \|/, t => t.replace(/(dist \S+: cliff )0\.75/, '$10.8'))).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
let lines = 0, reached = false;
reading(us, l => { lines++; if (/^TOTALS SHIFT/.test(l)) reached = true; });
if (!reached) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its totals'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size, SNAP equal to DP's own audit at that size on all ${PANEL.length} households; ${us.filter(u => u.arm === 'SNAP').length} SNAP traces held to their dp lines (one held to a changed reach refused); ${planted.length} planted faults refused; the reading ran to its totals (${lines} lines, not read)`);
