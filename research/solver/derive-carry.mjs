/*
 * THE DERIVATION FOR CARRY (predictions/diag-carry.md; reduce-carry.mjs, the reader). From the records, before the reader
 * reads: the two deep reviews' cause credences (deep-review-log.md: 7 Oct 22:06 UK for the carry family, 8 Oct 05:58 UK
 * for O123), the base rate of an item leaning on a deep review's cause (results-scorecard.txt), 7aj's per-household
 * discordant counts (results-7aj.txt item 1, the fitted side of CARRY), and the width of the least household's whole-score
 * interval (results-7aj.txt and results-7aw.txt item 2, already read and recorded).
 * Nothing here reads a trace or compares 7aj with 7aw.
 *   1. the inputs;
 *   2. item 1's power: under a symmetric null of m moving paths a household (m its 7aj discordant count, saved plus lost:
 *      a proxy, declared), the chance the reader's departure rule fires (|sum x| >= 8 and |change| >= 2.58 se, computed by
 *      the rule's own formula over the binomial); over the 22 households not HIGH-CHURN, the chance of a false departure
 *      that fails F2 or F3; and the power to see a one-margin departure (0.25 point, 20 net paths) on one of the nineteen;
 *   3. item 2's outcomes under each O123 cause: under REOPT the least fixed-policy point lies in the band by the cause's
 *      own statement (the paths are saved and fixed, so no sampling spread is added: the plan-auditor's BLOCKING 1(b) of
 *      8 Oct 08:23 UK); under SCALE and OTHER the point is drawn as each states it (declared shapes below) and read by the
 *      registered rule (outside, INCONCLUSIVE when its 95% interval - the least household's half-width on record,
 *      averaged over 7aj and 7aw - reaches the band, else FALSIFIED);
 *   4. the credences FROM THE BASE RATE (results-scorecard.txt: an item leaning on a deep review's cause, 0.10; neither
 *      receipt says it shaded toward it - BLOCKING 1(a)): each item's leading cause moved halfway from the review's
 *      credence to the base rate, the other causes sharing the rest in proportion to the review's credences (derive-
 *      xasr2.mjs's rule, the plan-auditor's BLOCKING 1 of 6 Oct); then through sections 2 and 3; and the decision table.
 *   node research/solver/derive-carry.mjs > research/solver/results-derive-carry.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classesFrom, item2Of, SWITCH_RISK, HIGH_CHURN, O123_IV, N, Z, MIN_SUM } from './reduce-carry.mjs';
import { PANEL } from './reduce-7aw.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(HERE, f), 'utf8');
const f3 = x => x.toFixed(3), f2 = x => x.toFixed(2);

// 1. the inputs
const log = read('deep-review-log.md');
const causesAt = stamp => { const line = log.split('\n').find(l => l.startsWith(`- ${stamp}`)); const m = line && /CAUSE CREDENCES: ([^\n|]*)$/.exec(line); if (!m) throw new Error(`no cause credences at ${stamp}`); return Object.fromEntries(m[1].split(';').map(x => x.trim().split('=')).map(([k, v]) => [k, Number(v)])); };
const REVIEW = { CARRY: causesAt('7 Oct 22:06 UK'), O123: causesAt('8 Oct 05:58 UK') };
// the base rate: results-scorecard.txt's KIND BASE RATES, 'an item leaning on a deep review's cause or story'
const BASE = Number((/leaning on a deep review's cause or story (\d\.\d+)/.exec(read('results-scorecard.txt')) || [])[1]);
if (!(BASE > 0 && BASE < 1)) throw new Error('no base rate for an item leaning on a deep review\'s cause in results-scorecard.txt');
// the lead halfway from the review's credence to the base rate, the others sharing the rest in proportion
const shade = c => { const [lead] = Object.entries(c).sort((x, y) => y[1] - x[1])[0], L = (c[lead] + BASE) / 2, rest = Object.entries(c).filter(([k]) => k !== lead), tot = rest.reduce((t, [, v]) => t + v, 0);
  return Object.fromEntries([[lead, L], ...rest.map(([k, v]) => [k, (1 - L) * v / tot])]); };
const CARRY = shade(REVIEW.CARRY), O123 = shade(REVIEW.O123);
const aj = classesFrom(read('results-7aj.txt'));
const m = Object.fromEntries(PANEL.map(id => [id, aj.item1[id].saved + aj.item1[id].lost]));
const nineteen = PANEL.filter(id => !SWITCH_RISK.includes(id) && !HIGH_CHURN.includes(id)), notHC = PANEL.filter(id => !HIGH_CHURN.includes(id));
// the interval the registered rule reads is the least household's: in each record, the half-width of the household holding
// the least whole point, averaged over the two records
const leastOf = rec => Object.entries(rec).sort((a, b) => a[1].d - b[1].d)[0];
const L7aj = leastOf(item2Of(read('results-7aj.txt'))), L7aw = leastOf(item2Of(read('results-7aw.txt')));
const H = ((L7aj[1].hi - L7aj[1].lo) + (L7aw[1].hi - L7aw[1].lo)) / 4;
// the units whose two opening figures differ in 7aj (the counterfactual figure already apart from the held one): where a
// counterfactual figure alone can move, so where an EDGE can arise
const OPEN = [...read('results-7aj.txt').matchAll(/^  (.+?)\s+(SHIP|CAND)\s+table .* \(opening (\d+),(\d+)\)/gm)];
const E = OPEN.filter(x => x[3] !== x[4]).length / OPEN.length;
console.log('CARRY: THE DERIVATION (predictions/diag-carry.md; nothing here reads a trace or compares 7aj with 7aw)');
console.log('\n1. THE INPUTS');
console.log(`  the 7 Oct 22:06 UK causes: ${Object.entries(REVIEW.CARRY).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`  the 8 Oct 05:58 UK causes: ${Object.entries(REVIEW.O123).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`  the base rate of an item leaning on a deep review's cause (results-scorecard.txt KIND BASE RATES): ${BASE}`);
console.log(`  shaded (the lead halfway to the base rate, the rest in proportion): ${Object.entries(CARRY).map(([k, v]) => `${k} ${f3(v)}`).join(', ')}; ${Object.entries(O123).map(([k, v]) => `${k} ${f3(v)}`).join(', ')}`);
console.log(`  7aj's discordant paths (saved + lost), the proxy for the paths that can move between the weights: ${PANEL.map(id => `${id} ${m[id]}`).join(', ')}`);
console.log(`  the least household's whole-score interval on record: 7aj ${L7aj[0]} half-width ${f3((L7aj[1].hi - L7aj[1].lo) / 2)}, 7aw ${L7aw[0]} ${f3((L7aw[1].hi - L7aw[1].lo) / 2)}; their mean ${f3(H)}, the half-width item 2's rule is read with here`);

// 2. item 1's power, by the reader's own rule over the binomial
const logC = (n, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; };
const departs = (sum, mm) => { const mean = sum / N, sd = Math.sqrt(Math.max(0, (mm - N * mean * mean) / (N - 1))), ch = 100 * mean, se = 100 * sd / Math.sqrt(N); return Math.abs(sum) >= MIN_SUM && Math.abs(ch) >= Z * se; };
// P(departure) when mm paths move, each +1 with chance p (else -1)
function pDepart(mm, p) { if (p >= 1) return departs(mm, mm) ? 1 : 0; let t = 0; for (let k = 0; k <= mm; k++) { const sum = 2 * k - mm; if (departs(sum, mm)) t += Math.exp(logC(mm, k) + k * Math.log(p) + (mm - k) * Math.log(1 - p)); } return t; }
const alpha = Object.fromEntries(PANEL.map(id => [id, m[id] > 0 ? pDepart(m[id], 0.5) : 0]));
const FP = 1 - notHC.reduce((t, id) => t * (1 - alpha[id]), 1);
const NET = 20;   // one margin, 0.25 point of 8,000
const powOf = id => { const mm = Math.max(m[id], NET); return pDepart(mm, (1 + NET / mm) / 2); };
const pow = nineteen.reduce((t, id) => t + powOf(id), 0) / nineteen.length;
console.log('\n2. ITEM 1\'S POWER (the reader\'s departure rule, exact over the binomial)');
console.log(`  a false departure under a symmetric null, per household: ${PANEL.map(id => `${id} ${alpha[id].toExponential(1)}`).join(', ')}`);
console.log(`  over the 22 not HIGH-CHURN (a departure there fails F2, or F3 on the nineteen): ${f3(FP)}`);
console.log(`  the power to see a one-margin departure (${NET} net paths) on one of the nineteen, averaged: ${f3(pow)} (least ${f3(Math.min(...nineteen.map(powOf)))})`);
console.log(`  the EDGE share: ${OPEN.filter(x => x[3] !== x[4]).length} of 7aj's ${OPEN.length} units have their two opening figures apart, ${f3(E)} (a proxy for how often a counterfactual figure alone can move; grade C)`);
// an EDGE decides item 1 only when a departure falls on a household whose flip is in a counterfactual figure alone: under
// CARRY-SWITCH (departures on flips), the EDGE share of its departures; under OMIT and NARROW a departure is a false one
// or on a HIGH-CHURN household, which F2 and F3 read the same either way; under OTHER the nineteen's departures fail F3
// unless that household flips, which the forecast puts at none of the nineteen
const item1At = (e, show) => { const o = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 };
  for (const [c, w] of Object.entries(CARRY)) {
    const pi = c === 'CARRY-OTHER' ? pow : 0, fal = 1 - (1 - FP) * (1 - pi), inc = c === 'CARRY-SWITCH' ? e * (1 - fal) : 0, held = 1 - fal - inc;
    o.FALSIFIED += w * fal; o.INCONCLUSIVE += w * inc; o.HELD += w * held;
    if (show) console.log(`  under ${c} (${f3(w)}): FALSIFIED ${f3(fal)}, INCONCLUSIVE ${f3(inc)}, HELD ${f3(held)}`); }
  return o; };
const i1 = item1At(E, true);
for (const k of [2, 3]) { const o = item1At(Math.min(1, k * E), false); console.log(`  sensitivity, the EDGE share at ${k} times (${f3(Math.min(1, k * E))}): HELD ${f2(o.HELD)} INCONCLUSIVE ${f2(o.INCONCLUSIVE)} FALSIFIED ${f2(o.FALSIFIED)}`); }

// 3. item 2's outcomes under each cause. REOPT: the least fixed-policy point in the band by the cause's own statement
//    (S120's fixed-policy whole is its derived -0.016, and the least of 25 is at most that; saved paths, no spread).
//    DECLARED shapes for the others: SCALE uniform over +0.03 to +0.10 (the measured +0.064 inside it); OTHER uniform
//    over -0.25 to -0.12; each read by the registered rule with the half-width H
const [LO, HI] = O123_IV;
const gridAt = (H0, lo, hi) => { const o = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }, n = 20000; for (let i = 0; i < n; i++) { const x = lo + (hi - lo) * (i + 0.5) / n; o[(x >= LO && x <= HI) ? 'HELD' : ((x + H0 < LO || x - H0 > HI) ? 'FALSIFIED' : 'INCONCLUSIVE')] += 1 / n; } return o; };
const underAt = H0 => ({ 'O123-REOPT': { HELD: 1, INCONCLUSIVE: 0, FALSIFIED: 0 }, 'O123-SCALE': gridAt(H0, HI + 1e-9, 0.10), 'O123-OTHER': gridAt(H0, -0.25, LO - 1e-9) });
const mix2 = under => { const o = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }; for (const [c, w] of Object.entries(O123)) for (const q in o) o[q] += w * under[c][q]; return o; };
console.log('\n3. ITEM 2 UNDER EACH CAUSE (the least fixed-policy point at 0.02, read by the registered rule)');
console.log(`  REOPT: in the band by its own statement (saved paths, no spread added); DECLARED shapes: SCALE uniform +0.03 to +0.10, OTHER uniform -0.25 to -0.12; the interval's half-width ${f3(H)}`);
const under = underAt(H);
for (const [c, w] of Object.entries(O123)) { const o = under[c]; console.log(`  under ${c} (${f3(w)}): HELD ${f3(o.HELD)}, INCONCLUSIVE ${f3(o.INCONCLUSIVE)}, FALSIFIED ${f3(o.FALSIFIED)}`); }
const i2 = mix2(under);
for (const k of [2, 3]) { const o = mix2(underAt(k * H)); console.log(`  sensitivity, the half-width at ${k} times (${f3(k * H)}): HELD ${f2(o.HELD)} INCONCLUSIVE ${f2(o.INCONCLUSIVE)} FALSIFIED ${f2(o.FALSIFIED)}`); }
{ const unshaded = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }; for (const [c, w] of Object.entries(REVIEW.O123)) for (const q in unshaded) unshaded[q] += w * under[c][q];
  console.log(`  for comparison, the review's credences unshaded: HELD ${f2(unshaded.HELD)} INCONCLUSIVE ${f2(unshaded.INCONCLUSIVE)} FALSIFIED ${f2(unshaded.FALSIFIED)}`); }

// 4. the credences and the decision table
console.log('\n4. THE CREDENCES');
console.log(`CREDENCE item 1: point - HELD ${f2(i1.HELD)} INCONCLUSIVE ${f2(i1.INCONCLUSIVE)} FALSIFIED ${f2(i1.FALSIFIED)}`);
console.log(`CREDENCE item 2: point -0.016 HELD ${f2(i2.HELD)} INCONCLUSIVE ${f2(i2.INCONCLUSIVE)} FALSIFIED ${f2(i2.FALSIFIED)}`);
const p1 = i1.HELD, p2 = i2.HELD;
console.log(`  the decision table's rows (the items taken as independent: one reads survival paths, the other whole scores of another run's traces): 1 HELD and 2 HELD ${f2(p1 * p2)}; 1 HELD, 2 not ${f2(p1 * (1 - p2))}; 1 not, 2 HELD ${f2((1 - p1) * p2)}; neither ${f2((1 - p1) * (1 - p2))}`);
