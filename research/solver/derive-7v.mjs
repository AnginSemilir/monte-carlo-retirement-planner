/*
 * 7V'S POWER (predictions/diag-7v.md, Power; its output hashed in the prediction and re-run by the launcher). Each item is
 * read by reduce-7v.mjs's own families (harmFamily, gainFamily: the regimen's exact rule, Holm over the item's legs, the
 * case's margin) on Poisson counts drawn under each story, 20,000 draws a story, with a background of b paths each way on
 * every leg (b = 1.33, 7s's half a path a 3,000 scaled to 8,000, and b = 13.3, five a 3,000). The sizes come from the
 * nearest records: the reader's harm against off, 42 (S126) and 29 (bridge 4) paths of 8,000 at 7t's settings
 * (results-7t-vs-product.txt, read by read-7t-vs-product.mjs's overlap line), 38 and 25 at 7e's 30 points scaled
 * (0.47 and 0.31 points, results-7e.txt); O16's S172 loss 0.77 points (61 of 8,000) and O21's S330 gain 0.27 (21 of
 * 8,000), results-m14b.txt and results-quadref.txt, both on seed 7011 at 3,000 paths and M14b's settings.
 *   node research/solver/derive-7v.mjs > research/solver/results-derive-7v.txt
 */
import { harmFamily, gainFamily, N } from './reduce-7v.mjs';

const DRAWS = 20000;
let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
// one leg drawn: `lost` and `saved` are the story's own paths, the background b each way on top
const draw = (lost, saved, b, margin = 0.25) => { const l = pois(lost + b), s = pois(saved + b); return { label: 'x', k: { a: N - l - s - 400, lost: l, saved: s, d: 400, N }, margin }; };
const f = v => (v / DRAWS).toFixed(3);
function tally(name, b, one) {
  const t = {};
  for (let d = 0; d < DRAWS; d++) { const o = one(b); t[o] = (t[o] || 0) + 1; }
  console.log(`  ${name.padEnd(62)} b ${b.toFixed(2).padEnd(5)} ${Object.keys(t).sort().map(k => `${k} ${f(t[k])}`).join('  ')}`);
}
const H = { S126: 42, 'bridge 4': 29 }, H30 = { S126: 38, 'bridge 4': 25 };
const two = fn => Object.keys(H).map(fn);
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
console.log(`7V'S POWER: ${N} paths; ${DRAWS} draws a story (seed 7002); every leg read by reduce-7v.mjs's own families with Holm over the item's legs; margin 0.25 (the harmed cases survive 99%+)\n`);
for (const b of [0.5 * N / 3000, 5 * N / 3000]) {
  console.log(`BACKGROUND ${b.toFixed(2)} PATHS EACH WAY ON EVERY LEG`);
  // item 1: the reader's harm at the product's settings
  for (const [nm, sz] of [['7t\'s size (42, 29)', H], ['7e\'s at 30 points (38, 25)', H30], ['half 7e\'s (19, 13)', { S126: 19, 'bridge 4': 13 }], ['none', { S126: 0, 'bridge 4': 0 }]])
    tally(`item 1, the reader's harm at ${nm}`, b, bb => tri(harmFamily(Object.keys(sz).map(id => draw(sz[id], 0, bb))), x => x.o === 'harm', x => x.o === 'no material harm'));
  // item 2: the reader against off at margin 0 - no difference (P), or the harm kept (not P)
  tally('item 2, the reader identical to off at 0 (P)', b, bb => tri(harmFamily(two(() => draw(0, 0, bb))), x => x.o === 'no material harm', x => x.o === 'harm'));
  tally('item 2, the harm kept at 0 (7t\'s size)', b, bb => tri(harmFamily(two(id => draw(H[id], 0, bb))), x => x.o === 'no material harm', x => x.o === 'harm'));
  // item 3's last condition: one policy at 0 against the product - no harm (P), 14 of S126's lost kept (7t's READER/M0),
  // or the harm kept
  for (const [nm, k] of [['none left (P)', 0], ['14 and 10 left (7t\'s margin-0 losses)', 14], ['the harm kept', 40]])
    tally(`item 3's no-harm leg at 0, ${nm}`, b, bb => { const r = harmFamily(two(id => draw(k === 40 ? H[id] : k === 14 ? (id === 'S126' ? 14 : 10) : 0, 0, bb))); return r.every(x => x.o === 'no material harm') ? 'no material harm on both' : r.every(x => x.o === 'harm') ? 'harm on both' : 'mixed'; });
  // item 5: one policy against the reader at 1e-4 and 0 - no gain, or a gain of half the harm at each
  tally('item 5, one policy gains nothing', b, bb => tri(gainFamily([...two(() => draw(0, 0, bb)), ...two(() => draw(0, 0, bb))]), x => x.o === 'gain', x => x.o === 'no material gain'));
  tally('item 5, one policy saves half the harm at each margin', b, bb => tri(gainFamily([...two(id => draw(0, H[id] / 2, bb)), ...two(id => draw(0, H[id] / 2, bb))]), x => x.o === 'gain', x => x.o === 'no material gain'));
  // item 6: the learner at one policy and 0 - nothing, or a quarter of the harm (7t's READER+L saved 5 on S126)
  tally('item 6, the learner adds nothing', b, bb => tri(gainFamily(two(() => draw(0, 0, bb))), x => x.o === 'gain', x => x.o === 'no material gain'));
  tally('item 6, the learner saves a quarter of the harm', b, bb => tri(gainFamily(two(id => draw(0, H[id] / 4, bb))), x => x.o === 'gain', x => x.o === 'no material gain'));
  // item 7: the pairs - reproduced at 0.001 (O16's 61 lost, O21's 21 saved, S330 at the 0.5 margin: it survives 77%)
  tally('item 7, S172 reproduces O16\'s loss (61 of 8,000)', b, bb => harmFamily([draw(61, 0, bb), draw(0, 0, bb)])[0].o);
  tally('item 7, S172 meets at 0 (no difference there)', b, bb => harmFamily([draw(61, 0, bb), draw(0, 0, bb)])[1].o);
  tally('item 7, S330 reproduces O21\'s gain (21 of 8,000, margin 0.5)', b, bb => gainFamily([draw(0, 21, bb, 0.5), draw(0, 0, bb, 0.5)])[0].o);
  tally('item 7, S330 meets at 0 (no difference there, margin 0.5)', b, bb => gainFamily([draw(0, 21, bb, 0.5), draw(0, 0, bb, 0.5)])[1].o);
  console.log('');
}
