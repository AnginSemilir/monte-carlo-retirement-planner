/*
 * 7AQ'S PREFLIGHT PARSE CHECK: reduce-7aq.mjs's stamp gate refuses a log launched under "none", and 7am's and P's records are
 * at 30 points, so the preflight calls the reducer's own parse and gate at its size (4 wealth points) with references built
 * from the preflight's own units - each full-step unit its own 7am record, each half unit's ran and joint lines its own P
 * record, the record gaps the gate needs positive given as positive - so the identity and pair checks are trivially met
 * (they are the registered run's, against 7am's and P's records); every other gate check - the units, the settings, the
 * signed line against the bisected gap on every unit, the tiers - runs in full, and the reading runs to its outcome line
 * (counted, not printed). Planted: a copy with one signed line dropped, a copy with one signed gap moved off its bisected
 * gap, and a copy with one full-step table off its reference must be refused.
 *   node research/solver/preflight-parse-7aq.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, parseTiers, parseOpen2, readO60, UNITS, PTAG, labelOf, setOf } from './reduce-7aq.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7aq-preflight');
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const o60 = readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8'));
const clean = texts.flatMap(parse);
const POS = { gap: '1.0000e-4', open1e3: 0, open0: 2 };
const refsOf = us => {
  const half = id => us.find(u => u.id === id && setOf(u.label) === 'halfblend');
  const pref = id => { const h = half(id); return h ? { table: h.table, ran: h.ran, joint: h.joint, gap: POS } : null; };
  const mref = (id, l) => { const u = us.find(x => x.id === id && x.label === l); if (u) return { ...u }; return l.startsWith(PTAG) ? { ...pref(id), gap: POS } : { gap: { gap: '1.0e-3' } }; };
  const bref = () => ({ gap: { gap: '1.0e-3' } });
  return { pref, mref, bref };
};
const run = (txt, refs = refsOf(clean)) => { const us = txt.flatMap(parse); return { us, bad: gate(us, refs.pref, refs.mref, txt.flatMap(parseTiers), txt.flatMap(parseOpen2), o60, { pts: '4' }) }; };
const { us, bad } = run(texts);
if (UNITS.some(([id, a, l]) => !us.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNITS.length} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const planted = [
  ['a signed line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+signed .*\n/m, '') : t))).bad],
  ['a signed gap moved off its bisected gap', () => run(texts.map((t, i) => (i === 1 ? t.replace(/^(\s+signed \S+: )(\S+)/m, (_, a, g) => `${a}${(Number(g) + 0.01).toExponential(6)}`) : t))).bad],
  ['a full-step table off its reference', () => { const r = refsOf(clean); return run(texts, { ...r, mref: (id, l) => { const x = r.mref(id, l); return id === 'bridge 0' && l === labelOf(PTAG, 'logblend') ? { ...x, table: '0.0000' } : x; } }).bad; }],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
const r = refsOf(clean);
let lines = 0, outcome = '';
reading(us, r.pref, r.mref, r.bref, l => { lines++; if (/^OUTCOME/.test(l.trim())) outcome = l.trim(); });
if (!outcome) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome line'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size (every check but the identity with 7am's and P's records, which is the registered run's); ${planted.length} planted faults refused; the reading ran to its outcome line (${lines} lines, not read)`);
