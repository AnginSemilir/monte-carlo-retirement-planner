/*
 * 7AV'S PREFLIGHT PARSE CHECK: reduce-7av.mjs's stamp gate refuses a log launched under "none", and 7at's records are at 30
 * points and 2,000 paths, so the preflight calls the reducer's own parse and gate at its size (4 wealth points, 20 paths) with
 * the preflight's own READER units at 6 share points as the references - so the identity checks are trivially met (they are
 * the registered run's, against 7at's records); every other gate check - the axis, grid and reference of each unit, the
 * twins, 7at's checks (7ar's and 7ap's) on every unit, the step split's lines and sums and the quadratic's responsiveness -
 * runs in full, and the reading runs to its outcome line (counted, not printed). Planted: a copy with a 12-point unit's grid
 * read as 6, a copy with one sdec line dropped, a copy with one psplit path moved, and a copy with S130 PCLSI's table off its
 * reference must each be refused.
 *   node research/solver/preflight-parse-7av.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, UNITS, labelOf } from './reduce-7av.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7av-preflight'), SIZE = { pts: '4', npw: 20 };
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const clean = texts.flatMap(parse);
const refOf = us => (id, a, l) => { const u = us.find(x => x.id === id && x.arm === a && x.label === l); return u ? { ...u } : null; };
const run = (txt, ref = refOf(clean)) => { const us = txt.flatMap(parse); return { us, bad: gate(us, ref, SIZE) }; };
const { us, bad } = run(texts);
if (UNITS.some(([id, a, l]) => !us.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNITS.length} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const L12 = `READER/${labelOf('TS+J', 'PCLSI', 12)}`.replace(/[/+.]/g, m => `\\${m}`);
const movePath = t => t.replace(new RegExp(`(psplit ${L12} world 0: )(-?[\\d.]+),`), (m, a, q) => `${a}${(Number(q) + 1).toFixed(4)},`);
const planted = [
  ['a 12-point unit read on a 6-point grid', () => run(texts.map(t => t.replace(new RegExp(`( ran ${L12}: .* grid total4x)12x12`), '$16x6'))).bad],
  ['an sdec line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+sdec .*\n/m, '') : t))).bad],
  ['one psplit path moved', () => run(texts.map(movePath)).bad],
  ['S130 PCLSI\'s table off its reference', () => run(texts, (id, a, l) => { const r = refOf(clean)(id, a, l); return r && id === 'S130' && l === labelOf('TS+J', 'PCLSI') ? { ...r, table: '0.0000' } : r; }).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
let lines = 0, outcome = '';
reading(us, l => { lines++; if (/^OUTCOME/.test(l.trim())) outcome = l.trim(); }, { b: 2000 });
if (!outcome) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome line'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size (every check but the identity with 7at, which is the registered run's); ${planted.length} planted faults refused; the reading ran to its outcome line (${lines} lines, not read)`);
