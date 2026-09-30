/*
 * 7AM'S PREFLIGHT PARSE CHECK: reduce-7am.mjs's stamp gate refuses a log launched under "none", and no record holds these
 * solves at the preflight's size, so the preflight calls the reducer's own parse and gate at its size (4 wealth points)
 * with the preflight's own units as the references - P's record for a household is its '@logblend' unit here (the anchor's
 * own solve for share 0.50), 7ai's linear bundle unit its '@halfblend' - so the identity check is trivially met (it is the
 * registered run's, against P's and 7ai's records); every other gate check - settings, lines, counts, the tiers each unit
 * carries - runs in full, and the reading runs to its outcome line (counted, not printed). Planted: a copy with P's charge
 * changed on one unit, a copy with one tiers line's real moved, and a copy with one opening2 line dropped must be refused.
 *   node research/solver/preflight-parse-7am.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, reading, UNITS, parseTiers, parseOpen2, readO60, labelOf, PTAG, BTAG, KNIFE } from './reduce-7am.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7am-preflight'), SIZE = { pts: '4' };
const o60 = readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8'));
const texts = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DIR, f), 'utf8')) : [];
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const refs = us => {
  const get = (id, l) => us.find(u => u.id === id && u.arm === 'READER' && u.label === l) || null;
  const self = u => (u ? { ...u, joint: { ...u.joint } } : null);
  return { pref: id => self(id === KNIFE ? get(id, labelOf(PTAG, 'linear')) : get(id, labelOf(PTAG, 'logblend'))),
    bref: (id, set) => self(get(id, labelOf(BTAG, set === 'reversed' ? 'halfreversed' : 'halfblend'))) };
};
const run = txt => { const us = txt.flatMap(parse), R = refs(us); return { us, R, bad: gate(us, R.pref, R.bref, txt.flatMap(parseTiers), txt.flatMap(parseOpen2), o60, SIZE) }; };
const { us, R, bad } = run(texts);
if (UNITS.some(([id, a, l]) => !us.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`PREFLIGHT PARSE FAILED: ${us.filter(u => u.done).length} of ${UNITS.length} units done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const planted = [
  ["P's charge changed on one unit", () => run(texts.map(t => t.replace(/(joint READER\/TS\+J\/MP\/30x5\/W0\.02@reversed: true switchMargin 0 switchCharge )0\.001/, '$10.002'))).bad],
  ["a tiers line's real moved", () => run(texts.map(t => t.replace(/(tiers READER\/TS\+J\/W0\.02@halfblend: pen \S*?High_Risk:)(\d+\.\d+)/, (m, a, b) => a + (+b + 0.05).toFixed(2)))).bad],
  ['an opening2 line dropped', () => run(texts.map((t, i) => (i === 0 ? t.replace(/^\s+opening2 .*\n/m, '') : t))).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
// the reading, with the stand-in references: P's linear gap is the preflight's '@logblend' unit's, 7ai's three sets the halves'
let lines = 0, outcome = '';
const bset = (id, set) => { const x = R.bref(id, set === 'linear' ? 'blend' : set); return x; };
reading(us, R.pref, bset, l => { lines++; if (/OUTCOME/.test(l)) outcome = l.trim(); });
if (!outcome) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome line'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${us.length} units parsed and gated at the preflight's size (every check but the identity, which is the registered run's); ${planted.length} planted faults refused; the reading ran to its outcome line (${lines} lines, not read)`);
