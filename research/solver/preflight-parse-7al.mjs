/*
 * 7AL'S PREFLIGHT PARSE CHECK: reduce-7al.mjs's stamp gate refuses a log launched under "none", and no record holds these
 * solves at the preflight's size, so the preflight calls the reducer's own parse and gate at its size (4 wealth points, 20
 * paths a world) with each unit as its own reference (the identity check is then trivially met: it is the registered
 * run's, against 7ah, 7ag, 7aa and 7af); every other gate check - settings, lines, counts, the telescoping - runs in full,
 * and the reading runs to its outcome line (counted, not printed). Planted: a copy with a table changed against its
 * reference, a copy with a bridge stage's paths through changed, and a copy with one resid line dropped must be refused.
 *   node research/solver/preflight-parse-7al.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, UNITS } from './reduce-7al.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7al-preflight'), SIZE = { pts: '4', npw: 20 };
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const run = txt => { const us = txt.flatMap(parse); return { us, bad: gate(us, (id, a, l) => us.find(u => u.id === id && u.arm === a && u.label === l) || null, SIZE) }; };
const { us, bad } = run(texts);
if (UNITS.some(([id, a, l]) => !us.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNITS.length} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
// planted: each fault must be refused
const planted = [
  ['a table changed against its reference', () => { const x = texts.flatMap(parse); const r = x.map(u => ({ ...u })); r[0].table = '0.0001'; return gate(x, (id, a, l) => r.find(u => u.id === id && u.arm === a && u.label === l) || null, SIZE); }],
  ['a bridge stage\'s paths through changed', () => run(texts.map((t, i) => (i === 0 ? t.replace(/(stage \S+ world 0 bridge: paths \d+ start \S+ end \S+ through )(\d+)/, (m, a, b) => a + (+b + 1)) : t))).bad],
  ['a resid line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+resid \S+ world 1 year 2: .*\n/m, '') : t))).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
let lines = 0, outcome = '';
reading(us, l => { lines++; if (/^\nOUTCOME|^OUTCOME/.test(l)) outcome = l.trim(); });
if (!outcome) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome line'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size (every check but the identity, which is the registered run's); ${planted.length} planted faults refused; the reading ran to its outcome line (${lines} lines, not read)`);
