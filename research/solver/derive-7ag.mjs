/*
 * 7AG'S POWER (predictions/diag-7ag.md, Power; its output hashed in the prediction and re-run by the launcher).
 * ITEM 1 (no material harm on 9 households, Holm, the margins fixed at registration: reduce-7ag.mjs MARGIN): each
 * household's paired cells of CAND against SHIP drawn as Poisson counts - saved at m/2, lost at m/2 + L (L the true loss in
 * paths: loss x N / 100) - read by reduce-7ag.mjs's own items() at 16,000 paths. The churn m (paths the arms differ on with
 * no true change) from the records: 7af's CAND against SHIP differs on 0 to 91 of 8,000 on its bridge households
 * (results-7af.txt, wealth x0.5 69/22 the most apart from the two large gains); 7e's reader against off on these nine
 * differs on 0 to 82 of 1,000 (results-7e.txt: S370 17 lost/65 saved, S124 28/11 of 3,000), so at 16,000 paths up to about
 * 1,300. Stories: A, no household loses (m = 12, 50, 300, 1,300 on every household); B, S124 loses at 7e's reader rate
 * (0.57 points) with m = 208 there (7e's 39 of 3,000, scaled) and 50 elsewhere; C and D, one household at 0.25 loses 0.4
 * and 0.25 points (m = 50); E, S128 (margin 0.5) loses 0.75 points at m = 300; F, the records' own churn and gains, no
 * loss: S124 104 lost/104 saved (7e's 39 of 3,000 scaled, no net loss), S370 its 7e counts scaled to 16,000 (272 lost,
 * 1,040 saved), bridge 4+cost 8/576 (7e's 0/36 of 1,000 scaled), 8/8 on the rest. 20,000 draws a story, seeded.
 * ITEM 3 (S126's attribution, 8,000 paths; the item reads CAND against TSOFF): the repair (CAND as TSOFF: saved and lost
 * each Poisson 3, churn 6) and the reader's harm masked under the tier state at 0.25, 0.30, 0.35 and 0.59 points (lost
 * Poisson 3 + the loss in paths, saved Poisson 3; 0.59 is the tier state's part in 7af, 47 of 8,000), read by item3().
 * ITEM 2 reads by the size of the change: 7af's household standard errors at 8,000 paths were under 0.04 points of a per
 * cent (results-7af.txt), at 16,000 about 0.7 of that; the 5% and 1% lines sit many standard errors away.
 *   node research/solver/derive-7ag.mjs > research/solver/results-derive-7ag.txt
 */
import { N, N_S126, PANEL, MARGIN, items, item3 } from './reduce-7ag.mjs';

let s = 7002 >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// Poisson draws: Knuth's product for small means, a rounded normal above 500 (its error there is far below a path's worth of the margin)
const pois = l => { if (l <= 0) return 0; if (l > 500) { const u = Math.max(rnd(), 1e-12), v = rnd(); return Math.max(0, Math.round(l + Math.sqrt(l) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))); } const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const DRAWS = 20000;
console.log(`7AG'S POWER: ${N} paths a household, ${PANEL.length} households, read by reduce-7ag.mjs items() at the registered margins (${PANEL.map(([id]) => `${id} ${MARGIN[id]}`).join(', ')}); ${DRAWS} draws a story (seed 7002)\n`);
console.log('ITEM 1 (no material harm, Holm across 9)');
const noSpend = () => ({ change: { a: 1, b: 1, d: 0, se: 0, lo: 0, hi: 0 }, rel: new Float64Array(4) });
const story = (name, mOf, lossOf, gainOf = () => 0) => {
  const tally = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let i = 0; i < DRAWS; i++) {
    const draw = Object.fromEntries(PANEL.map(([id]) => { const m = mOf(id), L = lossOf(id) * N / 100; return [id, { saved: pois(m / 2 + gainOf(id)), lost: pois(m / 2 + L) }]; }));
    const K = (id, b, a) => { const d = draw[id]; return { saved: d.saved, lost: d.lost, a: N - d.saved - d.lost, d: 0, N }; };
    tally[items(K, noSpend)[0].outcome]++;
  }
  console.log(`  ${name.padEnd(72)} ${Object.entries(tally).filter(([, v]) => v).map(([k, v]) => `${k} ${(v / DRAWS).toFixed(3)}`).join('  ')}`);
};
for (const m of [12, 50, 300, 1300]) story(`A: no household loses, churn ${m} on every household`, () => m, () => 0);
story('B: S124 loses 0.57 points (7e\'s reader rate), churn 208 there, 50 elsewhere', id => (id === 'S124' ? 208 : 50), id => (id === 'S124' ? 0.57 : 0));
story('C: S162 (margin 0.25) loses 0.4 points, churn 50 everywhere', () => 50, id => (id === 'S162' ? 0.4 : 0));
story('D: S162 (margin 0.25) loses 0.25 points, churn 50 everywhere', () => 50, id => (id === 'S162' ? 0.25 : 0));
story('E: S128 (margin 0.5) loses 0.75 points, churn 300 everywhere', () => 300, id => (id === 'S128' ? 0.75 : 0));
{ const rec = { S124: [104, 104], S370: [272, 1040], 'bridge 4+cost': [8, 576] };
  // F, the records' own counts: lost at rec[0], saved at rec[1]
  const tally = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let i = 0; i < DRAWS; i++) {
    const draw = Object.fromEntries(PANEL.map(([id]) => { const [l, g] = rec[id] || [8, 8]; return [id, { saved: pois(g), lost: pois(l) }]; }));
    tally[items((id) => { const d = draw[id]; return { saved: d.saved, lost: d.lost, a: N - d.saved - d.lost, d: 0, N }; }, noSpend)[0].outcome]++;
  }
  console.log(`  ${'F: the records\' churn and gains as counts (lost/saved: S124 104/104, S370 272/1040, bridge 4+cost 8/576, 8/8 elsewhere)'.padEnd(72)} ${Object.entries(tally).filter(([, v]) => v).map(([k, v]) => `${k} ${(v / DRAWS).toFixed(3)}`).join('  ')}`); }
console.log('\nITEM 3 (S126, CAND against TSOFF on 7af\'s 8,000 paths; HELD on the guarded unconditional interval)');
for (const [name, loss] of [['the repair: CAND as TSOFF (saved and lost each Poisson 3)', 0], ['the reader\'s harm masked, 0.25 points', 0.25], ['masked, 0.30 points', 0.30], ['masked, 0.35 points', 0.35], ['masked, 0.59 points (the tier state\'s part in 7af)', 0.59]]) {
  const tally = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let i = 0; i < DRAWS; i++) { const saved = pois(3), lost = pois(3 + loss * N_S126 / 100), c = { saved, lost, a: N_S126 - saved - lost, d: 0, N: N_S126 }; tally[item3(c, c).outcome]++; }
  console.log(`  ${name.padEnd(72)} ${Object.entries(tally).filter(([, v]) => v).map(([k, v]) => `${k} ${(v / DRAWS).toFixed(3)}`).join('  ')}`);
}
