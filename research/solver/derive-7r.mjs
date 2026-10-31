/*
 * 7R'S POWER (predictions/diag-7r.md, Power; the sixty-sixth review's MINOR 4: a committed script, its output hashed in the
 * prediction and re-run by the launcher). 7e's rates (results-7e.txt: S126 14 lost, 0 saved of 3,000; bridge 4 26 lost,
 * 1 saved of 8,000; S366 under v1 7 lost, 0 saved of 1,000, results-o17-7e.txt) scaled to 3,000 paths, drawn as Poisson
 * counts, 20,000 draws a scenario from a fixed seed, and read by 7r's rule - restated here from reduce-7r.mjs decide(),
 * items() and o23(), because the reducer reads its files when imported; its planted checks pin its own copy.
 *   node research/solver/derive-7r.mjs > research/solver/results-derive-7r.txt
 */
import { mcnemarHarmP, holm, survivalChange, binomUpperHalf } from './stats.mjs';

const N = 3000, ALPHA = 0.05, MARGIN = 0.25, DRAWS = 20000;
let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const x = (lost, saved) => ({ lost, saved, p: mcnemarHarmP(lost, saved) });
// the rule
const carries = (c, pH) => c.lost > c.saved && pH < ALPHA;
const none = c => survivalChange(c.lost, c.saved, N, ALPHA).lo > -MARGIN;
const readCase = (T, R, pT, pR) => { const t = carries(T, pT), r = carries(R, pR), tn = none(T), rn = none(R); return t && r ? 'both' : t && rn ? 'tier' : r && tn ? 'method' : tn && rn ? 'neither' : 'unresolved'; };
function outcome(cases) {
  const hp = holm(cases.map(c => c.rd.p)), rep = cases.map((c, j) => c.rd.lost > c.rd.saved && hp[j] < ALPHA);
  const ps = holm(cases.flatMap(c => [c.T.p, c.R.p]));
  const reads = cases.map((c, j) => readCase(c.T, c.R, ps[2 * j], ps[2 * j + 1]));
  const counted = reads.filter((r, j) => rep[j]);
  if (!counted.length) return { o: 'INCONCLUSIVE', rep };
  if (counted.includes('tier') && !counted.some(r => r === 'method' || r === 'both')) return { o: 'HELD', rep };
  if (counted.includes('method') && !counted.some(r => r === 'tier' || r === 'both')) return { o: 'FALSIFIED', rep };
  return { o: 'INCONCLUSIVE', rep };
}
// 7e's rates at 3,000 paths
const RATE = { S126: [14, 0], 'bridge 4': [26 * 3000 / 8000, 3000 / 8000] };
const draw = ([l, s]) => x(pois(l), pois(s));
function scenario(name, make) {
  const tally = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 }, repS = [0, 0], both = [0];
  for (let d = 0; d < DRAWS; d++) { const r = outcome(make()); tally[r.o]++; r.rep.forEach((v, j) => { if (v) repS[j]++; }); if (r.rep.every(Boolean)) both[0]++; }
  const f = v => (v / DRAWS).toFixed(3);
  console.log(`${name.padEnd(62)} HELD ${f(tally.HELD)}  FALSIFIED ${f(tally.FALSIFIED)}  INCONCLUSIVE ${f(tally.INCONCLUSIVE)}   item 1: S126 ${f(repS[0])}, bridge 4 ${f(repS[1])}, both ${f(both[0])}`);
}
console.log(`7R'S POWER: 7e's rates scaled to ${N} paths (S126 ${RATE.S126[0]} lost, ${RATE.S126[1]} saved; bridge 4 ${RATE['bridge 4'][0]} lost, ${RATE['bridge 4'][1]} saved), Poisson counts, ${DRAWS} draws a scenario (seed 7002)\n`);
console.log('THE PRIMARY READ, by the true story (RTIER the reader\'s tiers with off\'s rest; RREST the reverse):');
scenario('the tier carries it all (RTIER = the reader, RREST = off)', () => ['S126', 'bridge 4'].map(id => { const rd = draw(RATE[id]); return { rd, T: rd, R: x(0, 0) }; }));
scenario('the rest carries it all (RTIER = off, RREST = the reader)', () => ['S126', 'bridge 4'].map(id => { const rd = draw(RATE[id]); return { rd, T: x(0, 0), R: rd }; }));
scenario('each carries half, independently', () => ['S126', 'bridge 4'].map(id => { const [l, s] = RATE[id], T = draw([l / 2, s / 2]), R = draw([l / 2, s / 2]); return { rd: x(T.lost + R.lost, T.saved + R.saved), T, R }; }));
scenario('the tier on S126, the rest on bridge 4', () => { const a = draw(RATE.S126), b = draw(RATE['bridge 4']); return [{ rd: a, T: a, R: x(0, 0) }, { rd: b, T: x(0, 0), R: b }]; });
scenario('no harm on these paths (the reader 1 lost, 1 saved expected)', () => ['S126', 'bridge 4'].map(() => { const rd = draw([1, 1]); return { rd, T: rd, R: x(0, 0) }; }));
// O23
console.log('\nO23 (item 3), S366 under v1 at 3,000 paths:');
for (const [name, l, s] of [['real at 7e\'s rate (21 lost, 0 saved expected)', 21, 0], ['noise at 7e\'s discordance (10.5 lost, 10.5 saved expected)', 10.5, 10.5], ['no change at all (1 lost, 1 saved expected)', 1, 1]]) {
  const t = { replicated: 0, closes: 0, open: 0 };
  for (let d = 0; d < DRAWS; d++) { const c = x(pois(l), pois(s)), iv = survivalChange(c.lost, c.saved, N, ALPHA); t[c.lost > c.saved && c.p < ALPHA ? 'replicated' : iv.lo > -MARGIN ? 'closes' : 'open']++; }
  console.log(`  ${name.padEnd(60)} replicated ${(t.replicated / DRAWS).toFixed(3)}  closes ${(t.closes / DRAWS).toFixed(3)}  stays open ${(t.open / DRAWS).toFixed(3)}`);
}
// the least counts each read needs, and item 5's interval
console.log('\nTHE LEAST COUNTS, with none saved:');
const least = m => { for (let b = 1; b < 60; b++) if (m * mcnemarHarmP(b, 0) < ALPHA) return b; return null; };
console.log(`  a swap arm carries the harm alone after Holm over the four: ${least(4)} lost (the smallest of the four p values is multiplied by 4)`);
console.log(`  item 1's case, the other case far stronger (Holm's second step): ${least(1)} lost; both cases alike: ${least(2)} lost each`);
const noneMax = (() => { let b = 0; while (survivalChange(b + 1, 0, N, ALPHA).lo > -MARGIN) b++; return b; })();
console.log(`  "carries none" holds up to ${noneMax} lost with none saved (the exact interval's lower end above -${MARGIN} of ${N})`);
let k = 0; const n = 2985; while (k < n && 1 - binomUpperHalf(k + 1, n) <= 0.025 / 2) k++;
console.log(`\nITEM 5: about ${n} pairs; the 97.5% interval for the paired median runs from order statistic ${k} to ${n + 1 - k}, ${Math.round(n / 2) - k} either side of the middle`);
