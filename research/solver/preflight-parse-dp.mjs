/*
 * THE DRAW-PAUSE MEASUREMENT'S PREFLIGHT PARSE CHECK: reduce-dp.mjs's stamp gate holds the logs to predictions/measure-dp.md,
 * and the preflight is launched under "none", so the preflight calls the reducer's own parse, gate (at the preflight's size:
 * 4 points, 20 paths) and reading. Planted: a copy with one household's done line dropped, a copy with a reader on one ran
 * line, and a copy with one dp line's pause count above its reach must each be refused.
 *   node research/solver/preflight-parse-dp.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, PANEL } from './reduce-dp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diagdp-preflight'), SIZE = { pts: '4', npw: 20 };
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const run = ts => { const us = ts.flatMap(parse); return { us, bad: gate(us, SIZE) }; };
const { us, bad } = run(texts);
if (PANEL.some(id => !us.some(u => u.id === id && u.done))) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${PANEL.length} households done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const planted = [
  ['a done line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+done .*\n/m, '') : t))).bad],
  ['a reader on a ran line', () => run(texts.map((t, i) => (i === 1 ? t.replace('bridgeRead false', 'bridgeRead reader') : t))).bad],
  ['a pause count above reach', () => run(texts.map((t, i) => (i === 2 ? t.replace(/( reach )(\d+)(.* pause )(\d+)/, (m, a, r, b) => `${a}${r}${b}${Number(r) + 1}`) : t))).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
let lines = 0, totals = '';
reading(us, l => { lines++; if (/^\s*TOTALS/.test(l)) totals = 'reached'; });
if (!totals) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its totals'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} households parsed and gated at the preflight's size; ${planted.length} planted faults refused; the reading ran to its totals (${lines} lines, not read)`);
