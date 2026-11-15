/*
 * BESIDE THE ALLOWANCE STEP'S READ (ALLOWANCE-BOTH.md; D98; EXPLORATORY, seed 7002), written after the read and deciding
 * nothing. It reads the same units the reducer read (results/allowance-both-7002) through the reducer's own functions and
 * prints where part 4's capped pot falls: each household's capped pot, BOTH against NOW, in pounds and percent, its share of
 * the summed change, and the pooled capped pot without each household in turn (part 4: not lower by more than 0.1%).
 * Added for the reviewer at the read (reviews/2026-11-15-read-allowance-both.md), still deciding nothing:
 *   B  part 4's two halves without each household in turn (the reviewer's MINOR 5: the last line tested the capped half
 *      alone);
 *   C  each household's survival change and its share of the summed change; S090's whole score; the rule's parts and its
 *      verdict on the seven without S090 (MINOR 2);
 *   D  what the audit's draw count counts: BOTH's base moves (solve.js buildActions) whose leading pension run passes
 *      'penPAr', of them the new draw itself (the run 'penPA', 'penPAr' and no further pension step), and the re-wrap
 *      moves to 'paraw' (BLOCKING 1);
 *   E  NOW's and RAWPA's units against the ceiling-lead units of 13 Nov (results/ceiling-lead-7002): each table digest and
 *      every stored array they share, byte for byte (MINOR 4).
 *   F  RAWPA against NOW by household, the capped pot and lifetime tax (the second round's MINOR 2: the report gave two of
 *      them as differences of the read's figures).
 *   node research/solver/allowance-both-beside.mjs [dir] [ceiling-lead dir]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, compare, RULE, verdictOf } from './reduce-allowance-both.mjs';
import { buildActions } from '../../src/solver/solve.js';
import { HOUSEHOLDS } from './audit-allowance-both.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'allowance-both-7002');
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const units = HOUSEHOLDS.map(id => raw.find(u => u.id === id)).map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
const gbp = v => `${v < 0 ? '-' : ''}£${Math.abs(Math.round(v)).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
const R = compare(units, 'NOW', 'BOTH'), sum = R.H.reduce((t, h) => t + (h.capB - h.capA), 0);
console.log(`BESIDE THE ALLOWANCE STEP'S READ (EXPLORATORY, written after the read, deciding nothing): ${units.length} households of ${DIR.split('/').slice(-1)[0]}; part 4's capped pot, BOTH against NOW, pooled ${f(R.capped)}% (the bar ${RULE.capped}%)`);
console.log(`\nEach household's capped pot (the pot held to its estate cap, the mean over its paths), BOTH against NOW:`);
for (const h of [...R.H].sort((a, b) => (a.capB - a.capA) - (b.capB - b.capA))) console.log(`  ${h.id.padEnd(6)} ${gbp(h.capA)} to ${gbp(h.capB)}, ${gbp(h.capB - h.capA)} (${f(100 * (h.capB / h.capA - 1))}%), ${(100 * (h.capB - h.capA) / sum).toFixed(1)}% of the summed change`);
console.log(`\nThe pooled capped pot without each household in turn (part 4 holds at ${RULE.capped}% or above):`);
console.log(`  ${HOUSEHOLDS.map(id => { const Q = compare(units.filter(u => u.id !== id), 'NOW', 'BOTH'); return `${id} ${f(Q.capped)}%`; }).join(', ')}`);
const holdWithout = HOUSEHOLDS.filter(id => compare(units.filter(u => u.id !== id), 'NOW', 'BOTH').capped >= RULE.capped);
console.log(`  the households without whom part 4's capped half would hold: ${holdWithout.join(', ') || 'none'}`);

// B: part 4 is both halves (reduce-allowance-both.mjs compare: the pot not lower by more than 0.5%, the capped pot by 0.1%)
console.log(`\nB. Part 4's two halves without each household in turn (the mean pot at ${RULE.pot}% or above, the capped pot at ${RULE.capped}% or above):`);
for (const id of HOUSEHOLDS) { const Q = compare(units.filter(u => u.id !== id), 'NOW', 'BOTH'); console.log(`  without ${id.padEnd(6)} the pot ${f(Q.pot)}%, the capped pot ${f(Q.capped)}%: part 4 ${Q.part4 ? 'holds' : 'fails'}`); }
console.log(`  the households without whom part 4 would hold, both halves: ${HOUSEHOLDS.filter(id => compare(units.filter(u => u.id !== id), 'NOW', 'BOTH').part4).join(', ') || 'none'}`);

// C: the survival gain by household, S090's whole score, and the rule on the seven without S090
const sv = HOUSEHOLDS.map(id => ({ id, R: compare(units.filter(u => u.id === id), 'NOW', 'BOTH') })), svSum = sv.reduce((t, x) => t + x.R.pooled, 0);
console.log(`\nC. Each household's survival change, BOTH against NOW (points), and its share of the summed change (${f(svSum)}):`);
console.log(`  ${sv.map(x => `${x.id} ${f(x.R.pooled)} (${(100 * x.R.pooled / svSum).toFixed(1)}%)`).join(', ')}`);
const S090 = compare(units.filter(u => u.id === 'S090'), 'NOW', 'BOTH');
console.log(`  S090 alone: survival ${f(S090.pooled)} (${f(S090.lo)} to ${f(S090.hi)}); the whole score ${f(S090.score.d)} (${f(S090.score.lo)} to ${f(S090.score.hi)}); the capped pot ${f(S090.capped)}%`);
const W7 = compare(units.filter(u => u.id !== 'S090'), 'NOW', 'BOTH');
console.log(`  the seven without S090, by the rule's parts: 1. pooled survival ${f(W7.pooled)} (${f(W7.lo)} to ${f(W7.hi)}): ${W7.part1 ? 'holds' : 'fails'}; 2. ${W7.harmed.length ? 'a household wholly below: ' + W7.harmed.join(', ') : 'no household wholly below'}: ${W7.part2 ? 'holds' : 'fails'}; 3. spending ${f(W7.spend, 4)}: ${W7.part3 ? 'holds' : 'fails'}; 4. the pot ${f(W7.pot)}%, the capped pot ${f(W7.capped)}%: ${W7.part4 ? 'holds' : 'fails'}; 5. the whole score ${f(W7.score.d)} (${f(W7.score.lo)} to ${f(W7.score.hi)}), survival's lower end ${f(W7.lo)}: ${W7.part5 ? 'holds' : 'fails'}; the rule would read ${verdictOf(W7)}`);

// D: the menu the audit's counts read (audit-allowance-both.mjs leadsRaw and wrapsRaw), BOTH's base moves
const lead = mv => { const st = mv.steps || [], i = st.findIndex(x => !x.startsWith('pen')); return st.slice(0, i < 0 ? st.length : i); };
const acts = buildActions({ menuPlus: ['hr', 'paraw'] }), through = acts.filter(mv => lead(mv).includes('penPAr'));
const draw = through.filter(mv => { const r = lead(mv); return r.length === 2 && r[0] === 'penPA' && r[1] === 'penPAr'; });
const wraps = acts.filter(mv => !!mv.harvest && mv.harvestCeil === 'paraw');
console.log(`\nD. BOTH's base moves (solve.js buildActions, menuPlus hr and paraw; one spending level, one tier pair): ${acts.length}`);
console.log(`  whose leading pension run passes 'penPAr' (the audit's draw count counts these): ${through.length}`);
console.log(`  of them the new draw itself, the run 'penPA', 'penPAr' and no further pension step: ${draw.length}; the rest, ${through.length - draw.length}, are NOW's ladders ('penPA' then 'penBasic' and on) with 'penPAr' between`);
console.log(`  the leading runs counted: ${[...new Set(through.map(mv => lead(mv).join('+')))].join('; ')}`);
console.log(`  re-wrapping to 'paraw' (the audit's re-wrap count counts these): ${wraps.length}`);

// E: NOW and RAWPA against the ceiling-lead units of 13 Nov, byte for byte
const CL = process.argv[3] || join(HERE, 'results', 'ceiling-lead-7002');
const clOf = id => JSON.parse(gunzipSync(readFileSync(join(CL, `${id}.json.gz`))).toString());
const KEYS = ['digest', 'survived', 'delivered', 'target', 'pot', 'tax'];
console.log(`\nE. NOW's and RAWPA's units against the ceiling-lead units of 13 Nov (${CL.split('/').slice(-1)[0]}): the table digest and the arrays ${KEYS.slice(1).join(', ')}, byte for byte:`);
const rowsE = HOUSEHOLDS.map(id => { const U = raw.find(u => u.id === id), C = clOf(id); return `${id} ${['NOW', 'RAWPA'].map(a => `${a} ${KEYS.every(k => JSON.stringify(U.arms[a][k]) === JSON.stringify(C.arms[a][k])) ? 'the same' : 'DIFFERENT (' + KEYS.filter(k => JSON.stringify(U.arms[a][k]) !== JSON.stringify(C.arms[a][k])).join(', ') + ')'}`).join(', ')}`; });
console.log(`  ${rowsE.join('\n  ')}`);
console.log(`  stamps: this run ${raw[0].stamp ? JSON.stringify(raw[0].stamp) : '?'}; the ceiling-lead units ${JSON.stringify(clOf(HOUSEHOLDS[0]).stamp || '?')}`);

// F: RAWPA against NOW by household (the engine-wide allowance as given, beside the rule), from the reducer's own compare
const RW = compare(units, 'NOW', 'RAWPA');
console.log(`\nF. RAWPA against NOW by household (the capped pot and lifetime tax, the means over each household's paths):`);
for (const h of RW.H) console.log(`  ${h.id.padEnd(6)} the capped pot ${gbp(h.capB - h.capA)} (${f(100 * (h.capB / h.capA - 1))}%), lifetime tax ${gbp(h.taxB - h.taxA)}`);
