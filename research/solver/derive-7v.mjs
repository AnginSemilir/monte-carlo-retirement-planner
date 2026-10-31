/*
 * 7V'S POWER (predictions/diag-7v.md, Power; its output hashed in the prediction and re-run by the launcher). Each item is
 * read by reduce-7v.mjs's own families (harmFamily, gainFamily: the regimen's exact rule, Holm over the item's legs, the
 * case's margin) on Poisson counts drawn under each story, 20,000 draws a story, with a background of b paths each way on
 * every leg (b = 1.33, 7s's half a path a 3,000 scaled to 8,000, and b = 13.3, five a 3,000; and for the margin-0 legs of
 * the pairs also b = 100, since 7t's S360 differed on 526 paths at margin 0: results-7t-vs-product.txt).
 * THE SIZES, from the records (the ninety-third review, BLOCKING 1: 7e's primary rows are 16-point reads):
 *   - the reader's harm at 30 points: 7e's only 30-point read is S126, 3 lost of 1,000 (-0.30; results-7e.txt, "S126 @30"),
 *     24 of 8,000 scaled; bridge 4 has no 30-point read, so it is drawn at 24, 16, 8 and 0; beside them 7t's 16-point size
 *     against 7t's OFF, 42 and 29 of 8,000 (results-7t-vs-product.txt);
 *   - what is left at margin 0 (items 3 and 10), 7t's against 7t's OFF (results-7t-vs-product.txt): READER+J/M0 0 saved
 *     and 2 lost on S126, 11 and 5 on bridge 4; READER/M0 0 and 14 on S126, 3 and 6 on bridge 4;
 *   - one policy against the reader at margin 0 (item 5), 7t's READER+J/M0 against READER/M0: 12 saved, 0 lost on S126,
 *     11 and 2 on bridge 4 (results/diag7t/part0.txt and part1.txt, the pairs line);
 *   - O16's S172 loss, 0.77 points (61 of 8,000; results-m14b.txt; -0.67 with the final year exact, results-o19.txt), and
 *     O21's S330 gain, 0.27 (21 of 8,000; results-quadref-exact.txt), both on seed 7011 at 3,000 paths and M14b's settings.
 *   node research/solver/derive-7v.mjs > research/solver/results-derive-7v.txt
 */
import { harmFamily, gainFamily, N } from './reduce-7v.mjs';

const DRAWS = 20000;
let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return Math.max(0, Math.round(m + (u - 6) * Math.sqrt(m))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
// one leg drawn: `lost` and `saved` are the story's own paths, the background b each way on top
const draw = (lost, saved, b, margin = 0.25) => { const l = pois(lost + b), s = pois(saved + b); return { label: 'x', k: { a: N - l - s - 400, lost: l, saved: s, d: 400, N }, margin }; };
const f = v => (v / DRAWS).toFixed(3);
function tally(name, b, one) {
  const t = {};
  for (let d = 0; d < DRAWS; d++) { const o = one(b); t[o] = (t[o] || 0) + 1; }
  console.log(`  ${name.padEnd(74)} b ${b.toFixed(2).padEnd(6)} ${Object.keys(t).sort().map(k => `${k} ${f(t[k])}`).join('  ')}`);
}
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const both = r => (r.every(x => x.o === 'no material harm') ? 'no material harm on both' : r.every(x => x.o === 'harm') ? 'harm on both' : 'mixed');
console.log(`7V'S POWER: ${N} paths; ${DRAWS} draws a story (seed 7002); every leg read by reduce-7v.mjs's own families with Holm over the item's legs; margin 0.25 (the harmed cases survive 99%+) unless named\n`);
for (const b of [0.5 * N / 3000, 5 * N / 3000]) {
  console.log(`BACKGROUND ${b.toFixed(2)} PATHS EACH WAY ON EVERY LEG`);
  // item 1: the reader's harm at the product's settings (S126 [lost, saved], bridge 4 [lost, saved])
  for (const [nm, a, c] of [['7e\'s 30-point S126 (24), bridge 4 at 24', 24, 24], ['7e\'s 30-point S126 (24), bridge 4 at 16', 24, 16], ['7e\'s 30-point S126 (24), bridge 4 at 8', 24, 8], ['7e\'s 30-point S126 (24), bridge 4 at none', 24, 0], ['7t\'s 16-point size (42, 29)', 42, 29], ['no harm on either', 0, 0]])
    tally(`item 1, the reader's harm: ${nm}`, b, bb => tri(harmFamily([draw(a, 0, bb), draw(c, 0, bb)]), x => x.o === 'harm', x => x.o === 'no material harm'));
  // item 2: the reader against off at margin 0 - no difference (P), or a harm the size of 7e's kept
  tally('item 2, the reader identical to off at 0 (P)', b, bb => tri(harmFamily([draw(0, 0, bb), draw(0, 0, bb)]), x => x.o === 'no material harm', x => x.o === 'harm'));
  tally('item 2, a harm of 24 and 16 kept at 0', b, bb => tri(harmFamily([draw(24, 0, bb), draw(16, 0, bb)]), x => x.o === 'no material harm', x => x.o === 'harm'));
  // items 3 and 10, the no-harm legs at margin 0 against the product
  tally('item 3\'s leg at 0: one policy leaves 7t\'s READER+J/M0 losses (2; 5 lost, 11 saved)', b, bb => both(harmFamily([draw(2, 0, bb), draw(5, 11, bb)])));
  tally('item 3\'s leg at 0: none left', b, bb => both(harmFamily([draw(0, 0, bb), draw(0, 0, bb)])));
  tally('item 3\'s leg at 0: the harm kept (24 and 16)', b, bb => both(harmFamily([draw(24, 0, bb), draw(16, 0, bb)])));
  tally('item 10: the reader alone leaves 7t\'s READER/M0 losses (14; 6 lost, 3 saved)', b, bb => tri(harmFamily([draw(14, 0, bb), draw(6, 3, bb)]), x => x.o === 'no material harm', x => x.o === 'harm'));
  // item 4: noise at 0 on one leg of fourteen (Holm over all fourteen)
  // (7t's S360 off lost 520 at margin 0: far past the 40 below, and slow to draw exactly, so not drawn)
  for (const [nm, k] of [['none on any leg', 0], ['24 lost on one leg of fourteen', 24], ['40 lost on one leg of fourteen', 40]])
    tally(`item 4, noise at 0: ${nm}`, b, bb => { const r = harmFamily(Array.from({ length: 14 }, (_, j) => draw(j === 0 ? k : 0, 0, bb))); return r.some(x => x.o === 'harm') ? 'HELD' : r.every(x => x.o === 'no material harm') ? 'FALSIFIED' : 'INCONCLUSIVE'; });
  // item 5: one policy against the reader at margin 0 - nothing, or 7t's size (12 saved; 11 saved, 2 lost)
  tally('item 5, one policy gains nothing at 0', b, bb => tri(gainFamily([draw(0, 0, bb), draw(0, 0, bb)]), x => x.o === 'gain', x => x.o === 'no material gain'));
  tally('item 5, 7t\'s size at 0 (12 saved; 11 saved, 2 lost)', b, bb => tri(gainFamily([draw(0, 12, bb), draw(2, 11, bb)]), x => x.o === 'gain', x => x.o === 'no material gain'));
  // item 6: the learner at one policy and 0 - nothing, or a quarter of 7e's harm
  tally('item 6, the learner adds nothing', b, bb => tri(gainFamily([draw(0, 0, bb), draw(0, 0, bb)]), x => x.o === 'gain', x => x.o === 'no material gain'));
  tally('item 6, the learner saves 6 and 4', b, bb => tri(gainFamily([draw(0, 6, bb), draw(0, 4, bb)]), x => x.o === 'gain', x => x.o === 'no material gain'));
  // item 7: the pairs - reproduced at 0.001 (O16's 61 lost, O21's 21 saved, S330 at the 0.5 margin: it survives 77%)
  tally('item 7, S172 reproduces O16\'s loss (61 of 8,000)', b, bb => harmFamily([draw(61, 0, bb), draw(0, 0, bb)])[0].o);
  tally('item 7, S172 reproduces the exact-final-year loss (-0.67: 54 of 8,000)', b, bb => harmFamily([draw(54, 0, bb), draw(0, 0, bb)])[0].o);
  tally('item 7, S330 reproduces O21\'s gain (21 of 8,000, margin 0.5)', b, bb => gainFamily([draw(0, 21, bb, 0.5), draw(0, 0, bb, 0.5)])[0].o);
  console.log('');
}
// the pairs at margin 0, where churn can move many paths both ways (7t's S360: 526 at margin 0)
console.log('THE PAIRS AT MARGIN 0 WITH A LARGE BACKGROUND (the ninety-third review, BLOCKING 1: the backgrounds above come from margin-0.001 runs)');
for (const b of [13.3, 100]) {
  tally('item 7, S172 meets at 0 (no difference there)', b, bb => harmFamily([draw(61, 0, 1.33), draw(0, 0, bb)])[1].o);
  tally('item 7, S330 meets at 0 (no difference there, margin 0.5)', b, bb => gainFamily([draw(0, 21, 1.33, 0.5), draw(0, 0, bb, 0.5)])[1].o);
}
