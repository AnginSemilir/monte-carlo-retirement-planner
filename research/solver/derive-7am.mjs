/*
 * 7AM'S DERIVATION (predictions/diag-7am.md; PLAN.md 7am; O67). What the records say before any 7am solve:
 *   1. Item 1's rule applied to 7ai's recorded arms (results-7ai.txt, the reducer's own table): for the bundle
 *      (READER/TS+J) and the shipping default (OFF/PRODUCT), the pairs whose two shifts move the gap opposite ways, and
 *      the split's ratio |blind|/|following| under 0.3 and at 0.55 or more - so the rule is seen to call the shipping
 *      default smooth and the bundle jittery on the records it was drawn from (a check of the rule, not of P).
 *   2. P's seven linear gaps (P's open job, results/diagP through reduce-P.mjs parse) against its charge 0.001, and the
 *      pension tier each opens at margin 0: the knife edge is the household whose gap is the smallest share of the charge.
 *   3. Item 3's reference points: a response smooth to second order has a sign-blind part that scales with the step's
 *      square (q = 0.25 at half the step); a kink scales with the step (q = 0.5); a jump does not scale (q = 1). The
 *      thresholds 0.33 and 0.4 sit between them.
 *   4. The time: P's measured open-job solves on the seven (their solve lines' secs) and 7ai's measured bundle blend and
 *      reversed solves (results-7ai-secs.txt), for the 14 P solves, the 14 half-shift bundle solves and the anchor.
 * No solve. Output hashed on the prediction's derive: line.
 *   node research/solver/derive-7am.mjs > research/solver/results-derive-7am.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as P from './reduce-P.mjs';
import { split, opposite, SMOOTH, JITTERY, HOUSEHOLDS, KNIFE, Q_KINK, Q_CURVED } from './reduce-7am.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const t = readFileSync(join(HERE, 'results-7ai.txt'), 'utf8');
console.log("7AM'S DERIVATION");
console.log('1. item 1\'s rule on 7ai\'s records (results-7ai.txt): opposite, ratio under 0.3, ratio 0.55 or more, of 7');
for (const arm of ['READER/TS+J', 'OFF/PRODUCT']) {
  let opp = 0, sm = 0, jit = 0; const rs = [];
  for (const id of HOUSEHOLDS) {
    const m = new RegExp(`^\\s+${id.replace('.', '\\.')}\\s+${arm.replace(/[/+]/g, c => '\\' + c)}\\s+\\|\\s+(\\S+)\\s.*?\\|\\s+(\\S+)\\s.*?\\|\\s+(\\S+)\\s`, 'm').exec(t);
    if (!m) { console.error(`no row ${id} ${arm}`); process.exit(1); }
    if (opposite(m[1], m[2], m[3])) opp++;
    const s = split(m[1], m[2], m[3]);
    if (s && s.ratio < SMOOTH) sm++;
    if (s && s.ratio >= JITTERY) jit++;
    rs.push(s ? s.ratio.toFixed(2) : 'n/a');
  }
  console.log(`   ${arm.padEnd(12)} opposite ${opp}, ratio < ${SMOOTH} on ${sm}, ratio >= ${JITTERY} on ${jit} (ratios ${rs.join(' ')}) -> by item 1's rule ${opp >= 6 && sm >= 5 ? 'HELD (smooth, answers the sign)' : jit >= 5 ? 'FALSIFIED (jittery)' : 'INCONCLUSIVE'}`);
}
console.log('2. P\'s linear gaps (results/diagP, the open job) against its charge 0.001, and the pension tier opened at margin 0');
const D = join(HERE, 'results', 'diagP');
const jobs = readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().flatMap(f => P.parse(readFileSync(join(D, f), 'utf8')));
const rows = HOUSEHOLDS.map(id => { const j = jobs.find(x => x.kind === 'open' && x.id === id && x.arm === 'READER' && x.grid === '30x5' && x.w === '0.02' && x.done); return { id, g: j.tags.P.gap }; });
for (const r of rows) console.log(`   ${r.id.padEnd(11)} gap ${r.g.gap.padStart(10)} = ${(100 * Number(r.g.gap) / 0.001).toFixed(1).padStart(5)}% of the charge; opens ${r.g.open0} at margin 0 (${r.g.open1e3} at 0.001)`);
const secsP = HOUSEHOLDS.map(id => jobs.find(x => x.kind === 'open' && x.id === id && x.arm === 'READER' && x.grid === '30x5' && x.w === '0.02' && x.done).tags.P.secs);
const least = rows.reduce((a, b) => (Number(a.g.gap) <= Number(b.g.gap) ? a : b));
console.log(`   the knife edge (the smallest gap): ${least.id} ${least.id === KNIFE ? '(the registered knife edge)' : `(NOT the registered knife edge ${KNIFE})`}`);
console.log(`3. item 3's reference points: q = 0.25 smooth to second order, 0.5 a kink, 1 a jump; FALSIFIED (curved) at q <= ${Q_CURVED}, HELD (non-smooth) at q >= ${Q_KINK}, on 5 of 7`);
const sec = readFileSync(join(HERE, 'results-7ai-secs.txt'), 'utf8');
const cm = /blend and reversed solves: (\d+), secs (\d+) to (\d+), sum (\d+)/.exec(sec);
if (!cm) { console.error('results-7ai-secs.txt: no summary line'); process.exit(1); }
const pSum = 2 * secsP.reduce((t, x) => t + x, 0) + secsP[0], cSum = +cm[4];
console.log(`4. the time: P's open-job solves ${Math.min(...secsP)} to ${Math.max(...secsP)} s (${secsP.join(', ')}); 14 P solves and the anchor at those times ${pSum} s; the bundle's ${cm[1]} blend and reversed solves in 7ai ${cm[2]} to ${cm[3]} s, ${cSum} s (results-7ai-secs.txt; the half shifts sized by them); together ${(pSum + cSum)} core-seconds, ${((pSum + cSum) / 3600).toFixed(2)} core-hours, ${((pSum + cSum) / 3600 / 4).toFixed(2)} hours on four cores at those times`);
