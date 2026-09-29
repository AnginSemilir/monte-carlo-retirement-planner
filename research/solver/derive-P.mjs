/*
 * P'S DERIVATION AND POWER (predictions/diag-p.md; its output hashed in the prediction and re-run by the launcher). Every
 * figure is from 7ae's traces, read through 7ae's own gate chain (reduce-P.mjs loadRefs: 7aa, 7ac, 7ad, 7ae; 7af beside).
 *   1. THE MARGINS. Items 1 and 2 are read against half 7ae's own pooled shifts from 1e-3 to margin 0 (OPEN0 and TS+J at world
 *      0's node, the three units, 8,000 paths, 7ae's pooled interval; TS+J opened in the de-risked pair at both margins, so
 *      its shift is the continuation's at equal openings, item 2's): M1 and M2 in reduce-P.mjs must be those halves rounded
 *      down to two places.
 *   2. THE WHOLE SCORE AT THE NODE (item 3's scale): S194, TS+J at margin 0 against 1e-3 (reduce-7aa.mjs wholeLeg at 0.05),
 *      and its per-path whole-score differences.
 *   3. THE CHURN by year band (reduce-P.mjs churn), TS+J and OPEN0 at 1e-3 and at margin 0, by unit - reported: the churn is
 *      no longer an item (the deep review after 7ag: most of margin 0's extra riskier moves are end-of-plan moves that cost
 *      nothing).
 *   4. POWER, by simulation over 7ae's own per-path differences (x_i: a path's margin-0 less 1e-3 figure, summed over the
 *      units for items 1 and 2; S194's whole score for item 3). A story q: each path takes the alternative's difference (the
 *      fall back to 1e-3's for item 1, -x_i; margin 0's fall for items 2 and 3, +x_i) with probability q, else a random sign
 *      of |x_i| (noise of the same size with no shift) - so q = 0 is P as predicted with the records' own discordance as
 *      noise, q = 1 the alternative, q = 0.5 halfway (the margin). Every draw takes WN paths drawn with replacement from 7ae's
 *      8,000 (so every column carries sampling noise; the first derivation's 8,000 column did not resample and read 1.000 by
 *      construction at q = 1: the plan-auditor's BLOCKING 2 of 29 Sep, O56). Read by reduce-P.mjs's own thresholds (M1, M2,
 *      MW). 4,000 draws a story, seeded.
 *   Items 4 and 5 (all worlds) have no record at margin 0 or P to draw from (every TS+J run across all worlds was at 0.001);
 *   their power is stated in the prediction from 7aa's own discordance, not simulated here. Items 6 and 7 are counts read
 *   without sampling error of this kind (the openings are solves; item 7's shares sit on thousands of path-years).
 *   node research/solver/derive-P.mjs > research/solver/results-derive-P.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { M1, M2, MW, CORE, WN, churn, BANDS, pair, loadRefs, Z95 } from './reduce-P.mjs';
import * as E from './reduce-7ae.mjs';
import * as A from './reduce-7aa.mjs';
import * as F from './reduce-7af.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = n => join(HERE, 'results', n);
const { TRE, jobsE } = loadRefs(R_('diag7ae'), R_('diag7ad'), R_('diag7ac'), R_('diag7aa'), R_('diag7af'));
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

// 2. the whole score at the node, S194
const e194 = jobsE.find(j => j.id === 'S194').tags['0'];
const X = tr('S194', '1e-3', 'TS+J'), Y = tr('S194', '0', 'TS+J');
const cfg = { lambda: Number(A.field(e194.ran, 'lambda')), floor: Math.min(...A.field(e194.ran, 'levels').split(',').map(Number)), scale: e194.joint.scale, cap: e194.joint.cap, wb: 0.02, spendYears: F.spendYears(X, Y) };
const w194 = A.wholeLeg(X, Y, cfg, 0.05), wa = A.wholePaths(X, cfg), wb = A.wholePaths(Y, cfg), xW = Float64Array.from(wa, (a, i) => wb[i] - a);
console.log(`\n2. THE WHOLE SCORE AT THE NODE, S194: TS+J at margin 0 against 1e-3 ${iv(w194)} (survival part ${f3(w194.sd)}, the rest ${f3(w194.rest)}); item 3's margin MW ${MW}`);

// 3. the churn by band (reported)
console.log(`\n3. THE CHURN AT THE NODE by year band (${BANDS.map(([a, b]) => `${a}-${b > 100 ? 'end' : b}`).join(', ')}): switches / moves to a riskier tier a path (the path alive)`);
const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
for (const [id] of CORE) for (const [r, m] of [['TS+J', '1e-3'], ['TS+J', '0'], ['OPEN0', '1e-3'], ['OPEN0', '0']]) { const c = churn(tr(id, m, r)); console.log(`  ${`${id} ${r}/${m}`.padEnd(20)} ${BANDS.map((_, k) => `${mean(c.sw[k]).toFixed(3)}/${mean(c.rr[k]).toFixed(3)}`).join('  ')}`); }

// 4. power
let s = 7002 >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const sumsOf = (xs, ys) => { const n = xs[0].length, out = new Float64Array(n); for (let i = 0; i < n; i++) { let d = 0; for (let u = 0; u < xs.length; u++) d += xs[u][i] - ys[u][i]; out[i] = d; } return out; };
const DRAWS = 4000;
const story = (x, q, sign, read, scale) => { const n = WN, c = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let k = 0; k < DRAWS; k++) { let a = 0, a2 = 0; for (let i = 0; i < n; i++) { const xi = x[Math.floor(rnd() * x.length)]; const d = rnd() < q ? sign * xi : (rnd() < 0.5 ? -1 : 1) * Math.abs(xi); a += d; a2 += d * d; } const m = a / n, se = Math.sqrt(Math.max(0, (a2 / n - m * m) / n)); c[read(scale * m, scale * (m - Z95 * se), scale * (m + Z95 * se))]++; }
  return Object.entries(c).filter(([, v]) => v).map(([o, v]) => `${o} ${(v / DRAWS).toFixed(3)}`).join('  '); };
const svOf = rule => sumsOf(CORE.map(([id]) => tr(id, '0', rule).survived), CORE.map(([id]) => tr(id, '1e-3', rule).survived));
const readM = M => (m, lo, hi) => (lo > -M ? 'HELD' : hi < -M ? 'FALSIFIED' : 'INCONCLUSIVE');
console.log(`\n4. POWER at ${WN} node paths drawn with replacement from 7ae's 8,000 (${DRAWS} draws a story; q the share of paths taking the alternative's difference, the rest the records' discordance as noise with no shift)`);
for (const [name, x, sign, read, scale] of [
  ['ITEM 1 (OPEN0/P against OPEN0/M0; the alternative OPEN0 falling back to 1e-3\'s)', svOf('OPEN0'), -1, readM(M1), 100],
  ['ITEM 2 (OPEN2/P against OPEN2/1e-3; the alternative the continuation falling as at margin 0 - 7ae\'s TS+J, which opened in the pair at both margins)', svOf('TS+J'), 1, readM(M2), 100],
  ['ITEM 3 (S194 at the node by the whole score; the alternative margin 0\'s fall)', xW, 1, readM(MW), 1]]) {
  console.log(`  ${name}`);
  for (const q of [0, 0.25, 0.5, 0.75, 1]) console.log(`    q ${q.toFixed(2)}: ${story(x, q, sign, read, scale)}`);
}
