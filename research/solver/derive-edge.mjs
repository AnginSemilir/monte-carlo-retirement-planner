/*
 * EDGE-SPLIT'S DERIVATION (predictions/diag-edge.md; PLAN.md O101): the power of each item under each of the deep review's
 * stories for O101 (deep-review-log.md 5 Oct 11:50 UK, its CAUSE CREDENCES), and each item's outcome probabilities as the
 * prior-weighted mixture over them - the credences check-prediction.mjs holds the prediction to (CREDENCE lines).
 * INPUTS, read from committed files (no figure typed):
 *   item 1 (PCLSI's tables): the read's discordant paths, PCLSI over HYB (results-hyb.txt: 'read (PCLSI over HYB): b .. c ..')
 *     on S130 and S128 - the paths P-LO and P-HI share between them;
 *   item 2 (SNAP's tables): PCLSI over SNAP as the stand-in for S-INT over SNAP, never run (grade C): its discordant count
 *     (results-derive-hyb-edges.txt section 3) and its survival change in points (results-hyb.txt SECONDARY).
 * THE MODEL: each of the gain's discordant paths goes to one edge - the low edge with probability f (item 1; the high edge
 *   with probability g in item 2), the other edge otherwise - so y = (one split arm) - (the other) is +1 or -1 on it;
 *   saved paths count with their sign, lost paths against it; and as many paths again as the gain's lost count differ
 *   between the split arms for no reason, evenly both ways (the noise floor). ROOM OUTSIDE THE PARENTS (the HYB close's lesson,
 *   lessons.md; the plan-auditor's BLOCKING 2 of 5 Oct 12:22 UK): in half the draws of every story the removed pause moves -
 *   each split arm independently loses up to half as many paths again as the gain saves, from the paths both parents save,
 *   so a split arm can fall below HYB (or its table's snapped arm) as HYB fell below SNAP. The test is the reducer's: an exact sign test
 *   (the randomization test on +/-1) each way, Holm over the 4 (S130 and S128), at 0.05; the outcome read on S130.
 * THE PRIORS: the review's own probabilities are its judgement. The record of such judgements: items whose credence leaned
 *   on a review's ranked cause or story read as the review said 1 of 19 times (the deep review of the prediction record,
 *   deep-review-log.md 5 Oct 10:16 UK) - an outcome rate for items, not the rate at which a review's top cause is true. The
 *   registered prior (B) is a stated sceptical choice built on it: EDGE at (1 + 1) / (19 + 2) by Laplace, the rest shared among
 *   the other causes in the review's proportions; the review's own priors (A) are printed beside, for the scorecard.
 * THE STORIES (the review's ranked causes; their split of the edges judged here):
 *   EDGE 0.70: the low edge carries most of item 1's gain, f uniform on [0.7, 1]; on SNAP's tables the high edge, g the same;
 *   WITHIN 0.15: no allowance cost inside a bucket - each split about halfway, f and g uniform on [0.3, 0.7];
 *   TABLES 0.10: PCLSI's tables cost survival of their own - nothing ties the gain to an edge, f and g uniform on [0, 1];
 *   NOISE 0.03: no gain: the split arms differ only by the noise floor;
 *   STEP 0.02: the step reads - f and g uniform on [0, 1].
 * The point of each item is the prior mean of f (item 1) or g (item 2), the edge's expected share of its gain.
 *   node research/solver/derive-edge.mjs > research/solver/results-derive-edge.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(HERE, f), 'utf8');
const HYB = read('results-hyb.txt'), EDGES = read('results-derive-hyb-edges.txt');
const need = (re, txt, what) => { const m = re.exec(txt); if (!m) { console.log(`INPUT MISSING: ${what}`); process.exit(1); } return m; };
const readOf = id => { const m = need(new RegExp(`^\\s+${id}\\s+tables \\(HYB over SNAP\\).*?read \\(PCLSI over HYB\\): b (\\d+) c (\\d+)`, 'm'), HYB, `${id}'s read line in results-hyb.txt`); return { b: +m[1], c: +m[2] }; };
const snapOf = id => {
  const d = +need(new RegExp(`^\\s+${id}\\s+PCLSI against SNAP: discordant (\\d+)`, 'm'), EDGES, `${id}'s PCLSI against SNAP line in results-derive-hyb-edges.txt`)[1];
  const pts = +need(new RegExp(`^\\s+${id}\\s+PCLSI less SNAP\\s+survival\\s+(-?[\\d.]+)`, 'm'), HYB, `${id}'s PCLSI less SNAP line in results-hyb.txt`)[1];
  const net = Math.round(pts * 6000 / 100), c = (d + net) / 2, b = (d - net) / 2;
  if (!Number.isInteger(c) || c < 0 || b < 0) { console.log(`INPUT INCONSISTENT: ${id} discordant ${d}, net ${net}`); process.exit(1); }
  return { b, c };
};
const IN = { 1: { S130: readOf('S130'), S128: readOf('S128') }, 2: { S130: snapOf('S130'), S128: snapOf('S128') } };

// an exact one-sided sign test: P(X >= k) for X ~ Bin(n, 1/2)
const lgam = (() => { const L = [0]; for (let i = 1; i <= 5000; i++) L[i] = L[i - 1] + Math.log(i); return L; })();
export function signP(k, n) { if (n === 0) return 1; let s = 0; for (let j = k; j <= n; j++) s += Math.exp(lgam[n] - lgam[j] - lgam[n - j] - n * Math.LN2); return Math.min(1, s); }
export function holm(ps) { const o = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]), out = new Array(ps.length); let run = 0; o.forEach(([p, i], r) => { run = Math.max(run, Math.min(1, (ps.length - r) * p)); out[i] = run; }); return out; }
// a seeded generator (32-bit LCG) and a binomial draw
let X = 7005; const rnd = () => ((X = (Math.imul(X, 1103515245) + 12345) >>> 0) / 4294967296);
const binom = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (rnd() < p) k++; return k; };
/* one household's (up, n): up the paths with y = +1 of n discordant, at share s of the gain to the first arm */
function draw({ b, c }, s, gain = true) {
  const noise = b;   // the noise floor: as many again as the gain's lost paths, evenly both ways
  let up = binom(noise, 0.5), n = noise, first = 0;   // first: the first split arm's net paths over its snapped parent
  if (gain) { const cs = binom(c, s), bs = binom(b, s); up += cs + (b - bs); n += c + b; first += cs - bs; }
  // the pause relocated, in half the draws: each split arm loses up to c / 2 more paths of those both parents save
  if (rnd() < 0.5) { const l1 = Math.floor(rnd() * (c / 2 + 1)), l2 = Math.floor(rnd() * (c / 2 + 1)); up += l2; n += l1 + l2; first -= l1; }
  return { up, n, share: gain && c - b > 0 ? first / (c - b) : NaN };
}
export function outcome(h) {   // h: { S130: {up,n}, S128: {up,n} } -> HELD / FALSIFIED / INCONCLUSIVE on S130
  const ps = ['S130', 'S128'].flatMap(id => [signP(h[id].up, h[id].n), signP(h[id].n - h[id].up, h[id].n)]), hp = holm(ps);
  return hp[0] < 0.05 ? 'HELD' : hp[1] < 0.05 ? 'FALSIFIED' : 'INCONCLUSIVE';
}
const STORIES_A = [['EDGE', 0.70, () => 0.7 + 0.3 * rnd(), true], ['WITHIN', 0.15, () => 0.3 + 0.4 * rnd(), true], ['TABLES', 0.10, () => rnd(), true], ['NOISE', 0.03, () => 0.5, false], ['STEP', 0.02, () => rnd(), true]];
const LOG = read('deep-review-log.md'), REC = need(/read as the review said (\d+) of (\d+)/, LOG, 'the record of review-ranked causes in deep-review-log.md');
const HITS = +REC[1], TRIES = +REC[2], P_EDGE = (HITS + 1) / (TRIES + 2), REST = STORIES_A.slice(1).reduce((s, x) => s + x[1], 0);
const STORIES = STORIES_A.map(([nm, p, f, g]) => [nm, nm === 'EDGE' ? P_EDGE : p * (1 - P_EDGE) / REST, f, g]);
const MEANS = { EDGE: 0.85, WITHIN: 0.5, TABLES: 0.5, NOISE: 0.5, STEP: 0.5 };

// PLANTED (rule 6)
{
  const bad = [];
  if (Math.abs(signP(0, 10) - 1) > 1e-12 || Math.abs(signP(10, 10) - 1 / 1024) > 1e-12 || Math.abs(signP(8, 10) - 56 / 1024) > 1e-12) bad.push('signP');
  if (JSON.stringify(holm([0.01, 0.04, 0.03, 0.5])) !== JSON.stringify([0.04, 0.09, 0.09, 0.5])) bad.push(`holm ${JSON.stringify(holm([0.01, 0.04, 0.03, 0.5]))}`);
  if (outcome({ S130: { up: 30, n: 30 }, S128: { up: 0, n: 0 } }) !== 'HELD' || outcome({ S130: { up: 0, n: 30 }, S128: { up: 0, n: 0 } }) !== 'FALSIFIED' || outcome({ S130: { up: 15, n: 30 }, S128: { up: 0, n: 0 } }) !== 'INCONCLUSIVE') bad.push('outcome');
  // EDGE: f 1 on S130 with b 0 noise 0 is every path up
  // the gain's paths all to the first arm: every gain path up, plus any relocation losses (each loss adds one path)
  for (let k = 0; k < 20; k++) { const d = draw({ b: 0, c: 50 }, 1); if (d.up < 50 || d.n < 50 || d.share > 1 || d.share < 0) bad.push(`draw ${JSON.stringify(d)}`); }
  if (!(draw({ b: 0, c: 0 }, 1, false).share !== draw({ b: 0, c: 0 }, 1, false).share)) bad.push('the share of no gain is not NaN');
  if (bad.length) { console.log(`PLANTED CHECK FAILED: ${bad.join('; ')}`); process.exit(1); }
}

const R = 20000, f3 = x => x.toFixed(3), f2 = x => x.toFixed(2);
console.log('EDGE-SPLIT\'S DERIVATION (predictions/diag-edge.md): the power by story and the mixture; planted: passed\n');
console.log('1. INPUTS (read from results-hyb.txt and results-derive-hyb-edges.txt)');
console.log(`  item 1, the read's discordant paths (PCLSI over HYB): S130 c ${IN[1].S130.c} b ${IN[1].S130.b}; S128 c ${IN[1].S128.c} b ${IN[1].S128.b}`);
console.log(`  item 2, PCLSI over SNAP as S-INT over SNAP's stand-in (grade C): S130 c ${IN[2].S130.c} b ${IN[2].S130.b}; S128 c ${IN[2].S128.c} b ${IN[2].S128.b}`);
console.log(`\n2. THE OUTCOMES BY STORY (${R} draws a story and item, seed 7005): HELD / INCONCLUSIVE / FALSIFIED`);
const byStory = {};
for (const it of [1, 2]) for (const [nm, , share, gain] of STORIES_A) {
  const n = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 };
  for (let r = 0; r < R; r++) { const s = share(); n[outcome({ S130: draw(IN[it].S130, s, gain), S128: draw(IN[it].S128, s, gain) })]++; }
  byStory[`${it} ${nm}`] = n;
  console.log(`  item ${it} ${nm.padEnd(6)}: ${f3(n.HELD / R)} / ${f3(n.INCONCLUSIVE / R)} / ${f3(n.FALSIFIED / R)}${nm === 'EDGE' ? '   (the power: HELD under the ranked cause)' : ''}`);
}
const pct = (xs, q) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
function shares(S, it) { const xs = []; for (let r = 0; r < R; r++) { const u = rnd(); let acc = 0, st = S[S.length - 1]; for (const x of S) { acc += x[1]; if (u < acc) { st = x; break; } } xs.push(draw(IN[it].S130, st[2](), st[3]).share); } return xs; }
const mixOf = (S, it) => { const m = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }; for (const [nm, p] of S) for (const k of Object.keys(m)) m[k] += p * byStory[`${it} ${nm}`][k] / R; return m; };
const pointOf = S => S.reduce((t, [nm, p]) => t + p * MEANS[nm], 0);
console.log(`\n3. THE PRIORS: A, the review's: ${STORIES_A.map(([nm, p]) => `${nm} ${f2(p)}`).join(', ')}; B, registered (a stated sceptical choice) - EDGE at ${f3(P_EDGE)}, Laplace on the record that ${HITS} of ${TRIES} items leaning on a review's cause or story read as it said, the rest in the review's proportions: ${STORIES.map(([nm, p]) => `${nm} ${f3(p)}`).join(', ')}`);
for (const [nm, S] of [['A', STORIES_A], ['B', STORIES]]) for (const it of [1, 2]) { const m = mixOf(S, it); console.log(`  prior ${nm}, item ${it}: HELD ${f3(m.HELD)} INCONCLUSIVE ${f3(m.INCONCLUSIVE)} FALSIFIED ${f3(m.FALSIFIED)}; point ${f2(pointOf(S))}`); }
const point = pointOf(STORIES);
const MED = {};
for (const it of [1, 2]) { const xs = shares(STORIES, it); MED[it] = pct(xs, 0.5); console.log(`  prior B, item ${it}: the first split arm's share of the gain over its snapped parent on S130 (relocation included), 10th and 90th centiles ${f2(pct(xs, 0.1))} and ${f2(pct(xs, 0.9))}, median ${f2(pct(xs, 0.5))}`); }
console.log(`\n4. THE CREDENCES (prior B, the mixture, each outcome to two places; the point the first split arm's median share of its item's gain over the snapped parent, relocation included; check-prediction.mjs holds the prediction to these)`);
for (const it of [1, 2]) { const m = mixOf(STORIES, it), h = +m.HELD.toFixed(2), i = +m.INCONCLUSIVE.toFixed(2), fl = +(1 - h - i).toFixed(2); console.log(`CREDENCE item ${it}: point ${f2(MED[it])} HELD ${f2(h)} INCONCLUSIVE ${f2(i)} FALSIFIED ${f2(fl)}`); }
{ const logs = readdirSync(join(HERE, 'results', 'diaghyb')).filter(f => /^case\d+\.txt$/.test(f)).map(f => read(join('results', 'diaghyb', f))).join('\n');
  const sv = [...logs.matchAll(/solve OFF\S+: secs (\d+)/g)].map(m => +m[1]), fw = [...logs.matchAll(/sum OFF\S+: .* secs (\d+)/g)].map(m => +m[1]);
  if (!sv.length || !fw.length) { console.log('INPUT MISSING: HYB\'s seconds'); process.exit(1); }
  const tot = 2 * Math.max(...sv) + 7 * Math.max(...fw);
  console.log(`\n5. THE COST (HYB's seconds, results/diaghyb case logs: solves ${Math.min(...sv)}-${Math.max(...sv)} s, forward arms ${Math.min(...fw)}-${Math.max(...fw)} s): 2 solves and 7 forward arms a household at the slowest, ${tot} s, ${f2(tot / 3600)} hours a household; 3 households in parallel on quiet cores; each process stopped at 4 hours.`); }
