/*
 * P'S DERIVATION AND POWER (predictions/diag-p.md; its output hashed in the prediction and re-run by the launcher). Every
 * figure is from 7ae's traces, read through 7ae's own gate chain (reduce-P.mjs loadRefs: 7aa, 7ac, 7ad, 7ae; 7af beside).
 *   1. THE MARGINS. Items 1 and 2 are read against half 7ae's own pooled shifts from 1e-3 to margin 0 (OPEN0 and TS+J at world
 *      0's node, the three units, 8,000 paths, 7ae's pooled interval): M1 and M2 in reduce-P.mjs must be those halves rounded
 *      down to two places.
 *   2. THE CHURN. Moves to a riskier tier a path (reduce-P.mjs churn: a lower tier code, the path alive), TS+J at 1e-3 and at
 *      margin 0 and OPEN0 at both, by unit and summed over the three; margin 0's excess over 1e-3 paired, and H3, half of it
 *      (items 3 and 4). Switches a path beside (the deep review's O50 count, which included failed paths' zero bytes).
 *   3. POWER, by simulation over 7ae's own per-path differences (x_i: a path's margin-0 less 1e-3 figure summed over the
 *      units). A story q: each path takes -x_i (for items 1 and 2: the fall back to 1e-3's) or x_i (items 3 and 4: margin 0's
 *      churn) with probability q, else a random sign of |x_i| (noise of the same size with no shift) - so q = 0 is P as its
 *      prediction says with the records' own discordance as noise, q = 1 P as the alternative, q = 0.5 halfway (the margin).
 *      Read by reduce-P.mjs's own thresholds (M1, M2, H3; the pooled interval of reduce-7ae.mjs pooled / reduce-P.mjs
 *      pairedSum). P runs every arm on WN = 16,000 node paths (twice 7ae's), so each draw takes 16,000 paths drawn with
 *      replacement from 7ae's 8,000; 7ae's own 8,000 beside, for the comparison. 4,000 draws a story, seeded.
 *   node research/solver/derive-P.mjs > research/solver/results-derive-P.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { M1, M2, CORE, WN, churn, pairedSum, pair, loadRefs, Z95 } from './reduce-P.mjs';
import * as E from './reduce-7ae.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = n => join(HERE, 'results', n);
const { TRE } = loadRefs(R_('diag7ae'), R_('diag7ad'), R_('diag7ac'), R_('diag7aa'), R_('diag7af'));
const tr = (id, m, rule) => TRE[`${id}|${m}|${rule}`];
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`, iv = p => `${f3(p.d)} (${p.lo.toFixed(3)} to ${p.hi.toFixed(3)})`;

// 1. the margins
const shift = rule => E.pooled(CORE.map(([id]) => pair(tr(id, '1e-3', rule).survived, tr(id, '0', rule).survived)));
const sO = shift('OPEN0'), sJ = shift('TS+J');
const half = x => Math.floor(100 * Math.abs(x) / 2) / 100;
console.log('P\'S DERIVATION AND POWER, from 7ae\'s gated traces (the three units at world 0\'s node, 8,000 paths each)');
console.log('\n1. THE MARGINS: half 7ae\'s pooled shift from 1e-3 to margin 0, rounded down to two places');
console.log(`  OPEN0 ${iv(sO)}: half ${(Math.abs(sO.d) / 2).toFixed(4)} -> ${half(sO.d)}; reduce-P.mjs M1 ${M1}: ${half(sO.d) === M1 ? 'agrees' : 'DISAGREES'}`);
console.log(`  TS+J  ${iv(sJ)}: half ${(Math.abs(sJ.d) / 2).toFixed(4)} -> ${half(sJ.d)}; reduce-P.mjs M2 ${M2}: ${half(sJ.d) === M2 ? 'agrees' : 'DISAGREES'}`);
if (half(sO.d) !== M1 || half(sJ.d) !== M2) { console.log('MARGINS DISAGREE WITH THE REDUCER'); process.exit(1); }

// 2. the churn
console.log('\n2. THE CHURN AT THE NODE: switches / moves to a riskier tier a path (the path alive), by unit');
const CH = {}; const ch = (id, m, rule) => CH[`${id}|${m}|${rule}`] || (CH[`${id}|${m}|${rule}`] = churn(tr(id, m, rule)));
const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
for (const [id] of CORE) console.log(`  ${id.padEnd(9)} ${[['TS+J', '1e-3'], ['TS+J', '0'], ['OPEN0', '1e-3'], ['OPEN0', '0']].map(([r, m]) => `${r}/${m} ${mean(ch(id, m, r).sw).toFixed(3)}/${mean(ch(id, m, r).rr).toFixed(3)}`).join('  ')}`);
const RR = (rule, m) => CORE.map(([id]) => ch(id, m, rule).rr);
const ex = pairedSum(RR('TS+J', '0'), RR('TS+J', '1e-3')), H3 = ex.d / 2;
console.log(`  summed over the units: TS+J/1e-3 ${(RR('TS+J', '1e-3').reduce((t, a) => t + mean(a), 0)).toFixed(3)}, TS+J/0 ${(RR('TS+J', '0').reduce((t, a) => t + mean(a), 0)).toFixed(3)}; margin 0's excess ${iv(ex)}, se ${ex.se.toFixed(4)}; H3 = ${H3.toFixed(4)} (${(H3 / ex.se).toFixed(1)} standard errors of the excess)`);

// 3. power
let s = 7002 >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const sumsOf = (xs, ys) => { const n = xs[0].length, out = new Float64Array(n); for (let i = 0; i < n; i++) { let d = 0; for (let u = 0; u < xs.length; u++) d += xs[u][i] - ys[u][i]; out[i] = d; } return out; };
const DRAWS = 4000;
const story = (x, q, sign, read, n = WN) => { const c = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 }, boot = n !== x.length;
  for (let k = 0; k < DRAWS; k++) { let a = 0, a2 = 0; for (let i = 0; i < n; i++) { const xi = boot ? x[Math.floor(rnd() * x.length)] : x[i]; const d = rnd() < q ? sign * xi : (rnd() < 0.5 ? -1 : 1) * Math.abs(xi); a += d; a2 += d * d; } const m = a / n, se = Math.sqrt(Math.max(0, (a2 / n - m * m) / n)); c[read(m, m - Z95 * se, m + Z95 * se)]++; }
  return Object.entries(c).filter(([, v]) => v).map(([o, v]) => `${o} ${(v / DRAWS).toFixed(3)}`).join('  '); };
const svOf = rule => sumsOf(CORE.map(([id]) => tr(id, '0', rule).survived), CORE.map(([id]) => tr(id, '1e-3', rule).survived));
const readM = M => (m, lo, hi) => (100 * lo > -M ? 'HELD' : 100 * hi < -M ? 'FALSIFIED' : 'INCONCLUSIVE');
const read3 = (m, lo, hi) => (hi < H3 ? 'HELD' : lo > H3 ? 'FALSIFIED' : 'INCONCLUSIVE');
console.log(`\n3. POWER at ${WN} node paths (${DRAWS} draws a story; q the share of paths taking the alternative's difference, the rest the records' discordance as noise with no shift; at 7ae's 8,000 beside)`);
const xO = svOf('OPEN0'), xJ = svOf('TS+J'), xR = sumsOf(RR('TS+J', '0'), RR('TS+J', '1e-3'));
for (const [name, x, sign, read] of [['ITEM 1 (OPEN0/P against OPEN0/M0; the alternative OPEN0 falling back to 1e-3\'s)', xO, -1, readM(M1)], ['ITEM 2 (TS+J/P against TS+J/1e-3; the alternative TS+J falling as at margin 0)', xJ, 1, readM(M2)], ['ITEMS 3 AND 4 (riskier moves against TS+J/1e-3; the alternative margin 0\'s churn)', xR, 1, read3]]) {
  console.log(`  ${name}`);
  // for items 1 and 2 the x are margin 0 less 1e-3: OPEN0 rose (x > 0 on net), so P falling back is -x; TS+J fell (x < 0 on net), so P falling as margin 0 did is +x
  for (const q of [0, 0.25, 0.5, 0.75, 1]) console.log(`    q ${q.toFixed(2)}: ${story(x, q, sign, read)}   | at 8,000: ${story(x, q, sign, read, x.length)}`);
}
