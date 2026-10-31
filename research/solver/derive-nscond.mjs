/*
 * NS-COND: THE DERIVATION (predictions/diag-nscond.md; PLAN.md NS-COND; the deep review after NSB, deep-review-log.md 8 Oct
 * 17:19 UK). From records only, and judged conditional chances, each named:
 *   1. THE INPUTS: the review's cause credences (NSL-UNCOND, NSL-WEALTH, NSL-SHARE, NSL-OTHER; already shaded halfway to
 *      the deep-review lead rate by the review, so not shaded again), the lead rate itself (results-scorecard.txt KIND
 *      BASE RATES, printed for reference), and NSB's derivation output (results-derive-nsb.txt, its registered hash).
 *   2. ITEM 1: per cause, the chance every counting material cell shows R and K (HELD) or N (FALSIFIED), judged from
 *      the mechanism (stated beside each); times the chance some cell is material at 30 points (judged: the 4-point
 *      previews' elive of +3.3 and +0.8 may shrink on the finer wealth grid).
 *   3. ITEMS 2 AND 3: NSB's, unchanged in NS-COND's audit and reducer; their credences carried from NSB's derivation.
 *   node research/solver/derive-nscond.mjs > research/solver/results-derive-nscond.txt
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(HERE, f), 'utf8');
const causes = (() => { const line = read('deep-review-log.md').split('\n').find(l => l.startsWith('- 8 Oct 17:19 UK')); const m = /CAUSE CREDENCES: ([^\n|]*)$/.exec(line); return Object.fromEntries(m[1].split(';').map(x => x.trim().split('=')).map(([k, v]) => [k, Number(v)])); })();
const SC = read('results-scorecard.txt'), LEAD = Number((/leaning on a deep review's cause or story (\d\.\d+)/.exec(SC) || [])[1]);
const NSB_OUT = 'results-derive-nsb.txt', NSB_HASH = '0d215b1e56d741fa';
const nsb = read(NSB_OUT), nsbHash = createHash('sha256').update(nsb).digest('hex').slice(0, 16);
if (nsbHash !== NSB_HASH) throw new Error(`${NSB_OUT} hashes ${nsbHash}, not NSB's registered ${NSB_HASH}`);
const credOf = k => { const m = new RegExp(`^CREDENCE item ${k}: point (\\S+) HELD (\\S+) INCONCLUSIVE (\\S+) FALSIFIED (\\S+)$`, 'm').exec(nsb); return { point: m[1], h: Number(m[2]), i: Number(m[3]), f: Number(m[4]) }; };

console.log('NS-COND: THE DERIVATION (records only: the deep review after NSB, the scorecard, NSB\'s derivation; judged conditional chances, named)');
console.log('\n1. THE INPUTS');
console.log(`  the 8 Oct 17:19 UK causes: ${Object.entries(causes).map(([k, v]) => `${k} ${v}`).join(', ')} (sum ${Object.values(causes).reduce((t, v) => t + v, 0).toFixed(2)}; the review shaded its lead halfway to the lead rate already)`);
console.log(`  the deep-review lead rate (results-scorecard.txt): ${LEAD} (for reference; not applied again)`);
console.log(`  NSB's derivation output ${NSB_OUT}: sha256 ${nsbHash}, its registered hash`);

// 2. ITEM 1. Per cause, judged: [P(every counting material cell shows R and K), P(every one shows N)]
const J = {
  // the survival ratio carries the live error: R shows wherever the estate given survival at the live corners is near the
  // state's (judged 0.85 that it is on every material cell); K needs the reader's survival read sR near s1 as well,
  // relative to s1, which is small at reads touching dead nodes (judged 0.6): 0.51; N cannot show where R does
  'NSL-UNCOND': [0.85 * 0.6, 0.02],
  // resolution along wealth: rho is not the cause, but the live corners at a lower share hold more survival (rho above
  // 1) and an over-read (elive above 0): dividing by rho moves the read toward bE by coincidence on some cells (HELD
  // judged 0.15); N on every material cell needs rho below 1 + elive's direction throughout (judged 0.4)
  'NSL-WEALTH': [0.15, 0.4],
  // resolution along the 6-point share axis: as NSL-WEALTH, rho above 1 at the next share node down
  'NSL-SHARE': [0.15, 0.4],
  // a policy mismatch across wide cells or the reader's own error: no direction (judged 0.2 each)
  'NSL-OTHER': [0.2, 0.2],
};
const MATERIAL = 0.85;   // judged: some counting cell keeps a mean |elive| above 0.05 at 30 points (the 4-point previews +3.3 and +0.8)
let h1 = 0, f1 = 0;
console.log('\n2. ITEM 1: NSL-UNCOND\'S TESTS');
for (const [k, p] of Object.entries(causes)) {
  const [hk, fk] = J[k];
  h1 += p * hk; f1 += p * fk;
  console.log(`  ${k.padEnd(11)} ${p.toFixed(2)}: HELD ${hk.toFixed(2)}, FALSIFIED ${fk.toFixed(2)} (judged; the reasons in this script)`);
}
h1 *= MATERIAL; f1 *= MATERIAL;
const i1 = 1 - h1 - f1;
console.log(`  some counting cell material at 30 points: ${MATERIAL} (judged); with none, INCONCLUSIVE`);
console.log(`  credence: HELD ${h1.toFixed(2)}, INCONCLUSIVE ${i1.toFixed(2)}, FALSIFIED ${f1.toFixed(2)}; no numeric point (the outcome turns on every material cell's R, K and N)`);

// 3. ITEMS 2 AND 3
const c2 = credOf(2), c3 = credOf(3);
console.log('\n3. ITEMS 2 AND 3: NSB\'S, CARRIED');
console.log(`  item 2 (the copy rule's census): HELD ${c2.h.toFixed(2)}, INCONCLUSIVE ${c2.i.toFixed(2)}, FALSIFIED ${c2.f.toFixed(2)}, point ${c2.point} (${NSB_OUT})`);
console.log(`  item 3 (the menu-order reference): HELD ${c3.h.toFixed(2)}, INCONCLUSIVE ${c3.i.toFixed(2)}, FALSIFIED ${c3.f.toFixed(2)}, point ${c3.point} (${NSB_OUT})`);

console.log(`\nCREDENCE item 1: point - HELD ${h1.toFixed(2)} INCONCLUSIVE ${i1.toFixed(2)} FALSIFIED ${f1.toFixed(2)}`);
console.log(`CREDENCE item 2: point ${c2.point} HELD ${c2.h.toFixed(2)} INCONCLUSIVE ${c2.i.toFixed(2)} FALSIFIED ${c2.f.toFixed(2)}`);
console.log(`CREDENCE item 3: point ${c3.point} HELD ${c3.h.toFixed(2)} INCONCLUSIVE ${c3.i.toFixed(2)} FALSIFIED ${c3.f.toFixed(2)}`);
console.log(`\nDERIVED: item 1 HELD ${h1.toFixed(2)} INCONCLUSIVE ${i1.toFixed(2)} FALSIFIED ${f1.toFixed(2)}; item 2 HELD ${c2.h.toFixed(2)} INCONCLUSIVE ${c2.i.toFixed(2)} FALSIFIED ${c2.f.toFixed(2)}; item 3 HELD ${c3.h.toFixed(2)} INCONCLUSIVE ${c3.i.toFixed(2)} FALSIFIED ${c3.f.toFixed(2)}`);
