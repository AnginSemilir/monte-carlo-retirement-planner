/*
 * THE DERIVATION FOR CARRY (predictions/diag-carry.md; reduce-carry.mjs, the reader). From the records, before the reader
 * reads: the two deep reviews' cause credences (deep-review-log.md: 7 Oct 22:06 UK for the carry family, 8 Oct 05:58 UK
 * for O123), 7aj's per-household discordant counts (results-7aj.txt item 1, the fitted side of CARRY), and the sampling
 * spread of a whole-score point (the item-2 intervals of results-7aj.txt and results-7aw.txt, already read and recorded).
 * Nothing here reads a trace or compares 7aj with 7aw.
 *   1. the inputs;
 *   2. item 1's power: under a symmetric null of m moving paths a household (m its 7aj discordant count, saved plus lost:
 *      a proxy, declared), the chance the reader's departure rule fires (|sum x| >= 8 and |change| >= 2.58 se, computed by
 *      the rule's own formula over the binomial); over the 22 households not HIGH-CHURN, the chance of a false departure
 *      that fails F2 or F3; and the power to see a one-margin departure (0.25 point, 20 net paths) on one of the nineteen;
 *   3. item 2's outcomes under each O123 cause: the least fixed-policy point drawn as each cause states it (declared shapes
 *      below), read by the registered rule (HELD in the band; outside, INCONCLUSIVE when its 95% interval, the median
 *      half-width of the whole-score intervals on record, reaches the band, else FALSIFIED);
 *   4. the credences and the decision table's row credences.
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
const CARRY = causesAt('7 Oct 22:06 UK'), O123 = causesAt('8 Oct 05:58 UK');
const aj = classesFrom(read('results-7aj.txt'));
const m = Object.fromEntries(PANEL.map(id => [id, aj.item1[id].saved + aj.item1[id].lost]));
const nineteen = PANEL.filter(id => !SWITCH_RISK.includes(id) && !HIGH_CHURN.includes(id)), notHC = PANEL.filter(id => !HIGH_CHURN.includes(id));
// the interval the registered rule reads is the least household's: in each record, the half-width of the household holding
// the least whole point, averaged over the two records
const leastOf = rec => Object.entries(rec).sort((a, b) => a[1].d - b[1].d)[0];
const L7aj = leastOf(item2Of(read('results-7aj.txt'))), L7aw = leastOf(item2Of(read('results-7aw.txt')));
const H = ((L7aj[1].hi - L7aj[1].lo) + (L7aw[1].hi - L7aw[1].lo)) / 4;
const SD = H / 1.96;   // the least point's sampling sd, from that interval (conservative: the guarded interval is wider than the point's spread)
// the units whose two opening figures differ in 7aj (the counterfactual figure already apart from the held one): where a
// counterfactual figure alone can move, so where an EDGE can arise
const OPEN = [...read('results-7aj.txt').matchAll(/^  (.+?)\s+(SHIP|CAND)\s+table .* \(opening (\d+),(\d+)\)/gm)];
const E = OPEN.filter(x => x[3] !== x[4]).length / OPEN.length;
console.log('CARRY: THE DERIVATION (predictions/diag-carry.md; nothing here reads a trace or compares 7aj with 7aw)');
console.log('\n1. THE INPUTS');
console.log(`  the 7 Oct 22:06 UK causes: ${Object.entries(CARRY).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`  the 8 Oct 05:58 UK causes: ${Object.entries(O123).map(([k, v]) => `${k} ${v}`).join(', ')}`);
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
    if (show) console.log(`  under ${c} (${w}): FALSIFIED ${f3(fal)}, INCONCLUSIVE ${f3(inc)}, HELD ${f3(held)}`); }
  return o; };
const i1 = item1At(E, true);
for (const k of [2, 3]) { const o = item1At(Math.min(1, k * E), false); console.log(`  sensitivity, the EDGE share at ${k} times (${f3(Math.min(1, k * E))}): HELD ${f2(o.HELD)} INCONCLUSIVE ${f2(o.INCONCLUSIVE)} FALSIFIED ${f2(o.FALSIFIED)}`); }

// 3. item 2's outcomes under each cause (DECLARED shapes: REOPT a normal about the derivation's -0.016 with sd SD;
//    SCALE uniform over +0.03 to +0.10, the measured +0.064 inside it; OTHER uniform over -0.25 to -0.12)
const [LO, HI] = O123_IV, sd = SD;
const outcome2 = x => (x >= LO && x <= HI) ? 'HELD' : ((x + H < LO || x - H > HI) ? 'FALSIFIED' : 'INCONCLUSIVE');
const Phi = z => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2), q = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - q : q; };
const gridAt = (H0, lo, hi, dens) => { const o = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }, n = 20000; let tot = 0; for (let i = 0; i < n; i++) { const x = lo + (hi - lo) * (i + 0.5) / n, w = dens(x); const out = (x >= LO && x <= HI) ? 'HELD' : ((x + H0 < LO || x - H0 > HI) ? 'FALSIFIED' : 'INCONCLUSIVE'); o[out] += w; tot += w; } for (const k in o) o[k] /= tot; return o; };
const grid = (lo, hi, dens) => { const o = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }, n = 20000; let tot = 0; for (let i = 0; i < n; i++) { const x = lo + (hi - lo) * (i + 0.5) / n, w = dens(x); o[outcome2(x)] += w; tot += w; } for (const k in o) o[k] /= tot; return o; };
const under = { 'O123-REOPT': grid(-0.016 - 8 * sd, -0.016 + 8 * sd, x => Math.exp(-((x + 0.016) ** 2) / (2 * sd * sd))), 'O123-SCALE': grid(0.03 + 1e-9, 0.10, () => 1), 'O123-OTHER': grid(-0.25, -0.12 - 1e-9, () => 1) };
console.log('\n3. ITEM 2 UNDER EACH CAUSE (the least fixed-policy point at 0.02, read by the registered rule)');
console.log(`  DECLARED shapes: REOPT normal about -0.016 (the 7aw derivation's point, which the review's REOPT says holds under fixed policies), sd ${f3(sd)} (the half-width over 1.96); the interval's half-width ${f3(H)}; SCALE uniform +0.03 to +0.10; OTHER uniform -0.25 to -0.12`);
const i2 = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 };
for (const [c, w] of Object.entries(O123)) { const o = under[c]; for (const k in i2) i2[k] += w * o[k]; console.log(`  under ${c} (${w}): HELD ${f3(o.HELD)}, INCONCLUSIVE ${f3(o.INCONCLUSIVE)}, FALSIFIED ${f3(o.FALSIFIED)}`); }
for (const k of [2, 3]) { const sdk = k * sd, Hk = k * H, u = { 'O123-REOPT': gridAt(Hk, -0.016 - 8 * sdk, -0.016 + 8 * sdk, x => Math.exp(-((x + 0.016) ** 2) / (2 * sdk * sdk))), 'O123-SCALE': gridAt(Hk, 0.03 + 1e-9, 0.10, () => 1), 'O123-OTHER': gridAt(Hk, -0.25, -0.12 - 1e-9, () => 1) };
  const o = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }; for (const [c, w] of Object.entries(O123)) for (const q in o) o[q] += w * u[c][q];
  console.log(`  sensitivity, the spread and half-width at ${k} times (sd ${f3(sdk)}, half-width ${f3(Hk)}): HELD ${f2(o.HELD)} INCONCLUSIVE ${f2(o.INCONCLUSIVE)} FALSIFIED ${f2(o.FALSIFIED)}`); }

// 4. the credences and the decision table
console.log('\n4. THE CREDENCES');
console.log(`CREDENCE item 1: point - HELD ${f2(i1.HELD)} INCONCLUSIVE ${f2(i1.INCONCLUSIVE)} FALSIFIED ${f2(i1.FALSIFIED)}`);
console.log(`CREDENCE item 2: point -0.016 HELD ${f2(i2.HELD)} INCONCLUSIVE ${f2(i2.INCONCLUSIVE)} FALSIFIED ${f2(i2.FALSIFIED)}`);
const p1 = i1.HELD, p2 = i2.HELD;
console.log(`  the decision table's rows (the items taken as independent: one reads survival paths, the other whole scores of another run's traces): 1 HELD and 2 HELD ${f2(p1 * p2)}; 1 HELD, 2 not ${f2(p1 * (1 - p2))}; 1 not, 2 HELD ${f2((1 - p1) * p2)}; neither ${f2((1 - p1) * (1 - p2))}`);
