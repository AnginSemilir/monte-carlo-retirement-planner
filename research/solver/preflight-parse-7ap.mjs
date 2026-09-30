/*
 * 7AP'S PREFLIGHT PARSE CHECK: reduce-7ap.mjs's stamp gate refuses a log launched under "none", and 7al's records are at 30
 * points and 2,000 paths, so the preflight calls the reducer's own parse and gate at its size (4 wealth points, 20 paths)
 * with the preflight's own DEFAULT units as the references - so the identity check is trivially met (it is the registered
 * run's, against 7al's records); every other gate check - settings, the axis line, the twins, every line, the counts and
 * sums - runs in full, and the reading runs to its outcome line (counted, not printed). Planted: a copy with one PCLSI
 * unit's axis line read as snapped, a copy with one pcell line dropped, and a copy with one DEFAULT table off its
 * reference must be refused.
 *   node research/solver/preflight-parse-7ap.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, UNITS } from './reduce-7ap.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7ap-preflight'), SIZE = { pts: '4', npw: 20 };
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const clean = texts.flatMap(parse);
const refOf = us => (id, a, l) => { const u = us.find(x => x.id === id && x.arm === a && x.label === l); return u ? { ...u } : null; };
const run = (txt, ref = refOf(clean)) => { const us = txt.flatMap(parse); return { us, bad: gate(us, ref, SIZE) }; };
const { us, bad } = run(texts);
if (UNITS.some(([id, a, l]) => !us.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNITS.length} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const planted = [
  ['a PCLSI unit read as snapped', () => run(texts.map(t => t.replace(/(axis READER\/TS\+J\/W0\.02\/PCLSI: pclsInterp )true/, '$1false'))).bad],
  ['a pcell line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+pcell .*\n/m, '') : t))).bad],
  ['a DEFAULT table off its reference', () => run(texts, (id, a, l) => { const r = refOf(clean)(id, a, l); return r && id === 'S370' && !l.endsWith('/PCLSI') ? { ...r, table: '0.0000' } : r; }).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
let lines = 0, outcome = '';
reading(us, l => { lines++; if (/^OUTCOME/.test(l.trim())) outcome = l.trim(); });
if (!outcome) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome line'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size (every check but the identity with 7al, which is the registered run's); ${planted.length} planted faults refused; the reading ran to its outcome line (${lines} lines, not read)`);
