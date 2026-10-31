/*
 * 7AR'S PREFLIGHT PARSE CHECK: reduce-7ar.mjs's stamp gate refuses a log launched under "none", and 7ap's records are at 30
 * points and 2,000 paths, so the preflight calls the reducer's own parse and gate at its size (4 wealth points, 20 paths)
 * with the preflight's own READER DEFAULT and PCLSI units as the references - so the identity check is trivially met (it is
 * the registered run's, against 7ap's records); every other gate check - settings, the axis lines, the twins, 7ap's own
 * checks on every unit, every line, and the three terms summing to the residual by year, by bin and by path - runs in full,
 * and the reading runs to its outcome line (counted, not printed). Planted: a copy with the PCLSF unit's axis line read as
 * three buckets, a copy with one dec line dropped, a copy with one pstage path's read term moved, and a copy with READER
 * PCLSI's table off its reference must each be refused.
 *   node research/solver/preflight-parse-7ar.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, UNITS } from './reduce-7ar.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7ar-preflight'), SIZE = { pts: '4', npw: 20 };
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const clean = texts.flatMap(parse);
const refOf = us => (id, a, l) => { const u = us.find(x => x.id === id && x.arm === a && x.label === l); return u ? { ...u } : null; };
const run = (txt, ref = refOf(clean)) => { const us = txt.flatMap(parse); return { us, bad: gate(us, ref, SIZE) }; };
const { us, bad } = run(texts);
if (UNITS.some(([id, a, l]) => !us.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNITS.length} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const movePath = t => t.replace(/(pstage READER\/TS\+J\/W0\.02 world 0: )(-?[\d.]+),(-?[\d.]+),/, (m, a, q, d) => `${a}${q},${(Number(d) + 1).toFixed(4)},`);
const planted = [
  ['the PCLSF unit on three buckets', () => run(texts.map(t => t.replace(/(axis READER\/TS\+J\/W0\.02\/PCLSF: pclsInterp true pcls )0,0\.01,0\.5,1/, '$10,0.5,1'))).bad],
  ['a dec line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+dec .*\n/m, '') : t))).bad],
  ['one pstage path\'s read term moved', () => run(texts.map(movePath)).bad],
  ['READER PCLSI\'s table off its reference', () => run(texts, (id, a, l) => { const r = refOf(clean)(id, a, l); return r && a === 'READER' && l.endsWith('/PCLSI') ? { ...r, table: '0.0000' } : r; }).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
let lines = 0, outcome = '';
reading(us, l => { lines++; if (/^OUTCOME/.test(l.trim())) outcome = l.trim(); }, { b: 2000 });
if (!outcome) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome line'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size (every check but the identity with 7ap, which is the registered run's); ${planted.length} planted faults refused; the reading ran to its outcome line (${lines} lines, not read)`);
