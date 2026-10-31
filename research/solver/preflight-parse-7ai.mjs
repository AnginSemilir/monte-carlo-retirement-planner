/*
 * 7AI'S PREFLIGHT PARSE CHECK: reduce-7ai.mjs's stamp gate refuses a log launched under "none", so the preflight calls the
 * reducer's own parse, gate and reading directly over its logs, at the preflight's size (4 wealth points), with 7af's and
 * 7ag's preflights (results/diag7af-preflight, diag7ag-preflight: the same size and seed) as the linear solves' references.
 * The gate must refuse nothing; the reading runs to its outcome line, its lines counted, not printed. No figure is read.
 * Planted: faults put into the preflight's own logs (a linear table changed, a blend ran line changed, a blend or reversed
 * tiers line put back to the linear figures, a unit's done line removed, an opening2 line removed) must be refused.
 *   node research/solver/preflight-parse-7ai.mjs [dir] [dir7af] [dir7ag]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gate, reading, parseTiers, parseOpen2, readO60, FROM_AF, UNITS } from './reduce-7ai.mjs';
import * as A from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const logs = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
const [DIR, DIRF, DIRG] = [0, 1, 2].map((k, i) => process.argv[2 + k] || join(HERE, 'results', ['diag7ai-preflight', 'diag7af-preflight', 'diag7ag-preflight'][i]));
const texts = logs(DIR), F = logs(DIRF).flatMap(A.parse), G = logs(DIRG).flatMap(A.parse);
if (!texts.length || !F.length || !G.length) { console.log(`PREFLIGHT PARSE FAILED: no logs (${texts.length} in ${DIR}, ${F.length} units in ${DIRF}, ${G.length} in ${DIRG}): a check that ran on nothing is an error`); process.exit(1); }
const o60 = readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8'));
const ref = (id, a, l) => (FROM_AF.includes(id) ? F : G).find(u => u.id === id && u.arm === a && u.label === l && u.done) || null;
const check = T => { const units = T.flatMap(A.parse), open2 = T.flatMap(parseOpen2); return { units, open2, bad: gate(units, ref, T.flatMap(parseTiers), o60, { pts: '4', open2 }) }; };
const c = check(texts);
if (c.bad.length) { console.log(`PREFLIGHT PARSE FAILED:\n  ${c.bad.join('\n  ')}`); process.exit(1); }
let lines = 0; const IT = reading(c.units, c.open2, () => { lines++; });
if (IT.length !== 2 || !IT.every(i => i.outcome)) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome'); process.exit(1); }
// planted: faults in the preflight's own logs
const swap = (re, to) => { let done = false; return texts.map(t => (done || !re.test(t) ? t : (done = true, t.replace(re, to)))); };
const faults = [
  ['a linear table changed', swap(/(solve READER\/TS\+J\/W0\.02: table )(\d)/, (m, a, d) => a + ((+d + 1) % 10))],
  ['a blend ran line changed', swap(/(ran OFF\/PRODUCT\/W0\.02@logblend: .*?minPot )(\d+)/, (m, a, d) => a + (+d + 1000))],
  ['a blend tiers line at the linear figures', swap(/(tiers READER\/TS\+J\/W0\.02@logblend: pen High_Risk:)4\.97/, '$14.79')],
  ['a done line removed', swap(/\n\s+done OFF\/PRODUCT\/W0\.02@logblend/, '')],
  ['a reversed tiers line at the linear figures', swap(/(tiers READER\/TS\+J\/W0\.02@reversed: pen High_Risk:)4\.61/, '$14.79')],
  ['an opening2 line removed', swap(/\n\s+opening2 READER\/TS\+J\/W0\.02@reversed: [^\n]*/, '')]];
const missed = faults.filter(([, T]) => check(T).bad.length === 0).map(([n]) => n);
if (missed.length) { console.log(`PREFLIGHT PARSE FAILED: planted faults not refused: ${missed.join('; ')}`); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${UNITS.length} units parsed and gated at the preflight's size with nothing refused - every linear solve 7af's or 7ag's preflight's own (table, ran line, gap, opening, joint line); each blend and reversed solve its linear pair's but for the tier returns; the reading ran to its outcome line (${lines} lines, not printed) (planted ${faults.length})`);
