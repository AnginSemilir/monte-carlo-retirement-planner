/*
 * 7AD'S POWER (predictions/diag-7ad.md, Power; its output hashed in the prediction and re-run by the launcher). 7ad reads
 * two kinds of figure:
 *   - the tables' own numbers (the year-0 gap, each world's like-for-like price): deterministic, no sampling error - items 3
 *     and 4, and item 2's gap half, read them exactly, so their power against their thresholds is 1 and their uncertainty is
 *     the credence alone (no record measures the gap at another grid);
 *   - the node runs (4,000 paths a node, paired, TS+J against OPEN0): sampled - item 1, and item 2's mispricing half.
 * This script sizes the sampled part from 7ac's records, read through 7aa's and 7ac's gates (results/diag7aa,
 * results/diag7ac): world 0's TS+J and OPEN0 survival on its first 1,000 paths (the first 1,000 of 7ad's 4,000, the same
 * paths: the reducer's gate checks it) and world 0's whole-score price at 30x5 (7ac's price; 7ad reads the survival part,
 * which no record holds - so the stories set it against the whole price).
 * ITEM 1: the node's saved paths are the first 1,000's net (known) plus a Poisson count over the other 3,000 at a true rate
 * drawn from the first 1,000 (a gamma with shape net + 0.5, the first 1,000's evidence) or held at the first 1,000's rate;
 * a background of b paths each way over the 4,000 (b = 0.5, 5, 15: two policies from the same tables differing in one move
 * may still differ on a few paths either way) is added to saved and lost; read by reduce-7ad.mjs's rule (the exact interval
 * at 0.025, below it on both units).
 * ITEM 2's MISPRICING: at 30x5 m30 = the node's realised less the price; at 60x5 the true mispricing falls by a share f (0,
 * 1/3, 1/2, 1) and the 60x5 node run adds its own noise - the four policies on the same paths disagree on k paths (k = 10, 30,
 * 60), a paired difference of sd 100 sqrt(k) / 4000 points; read by reduce-7ad.mjs's rule (m30 > 0 and m60 <= 2/3 m30).
 * 20,000 draws a story, seeded.
 *   node research/solver/derive-7ad.mjs > research/solver/results-derive-7ad.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { survivalChange } from './stats.mjs';
import * as A from './reduce-7aa.mjs';
import * as C from './reduce-7ac.mjs';
import { ALPHA1, WN } from './reduce-7ad.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const logsOf = D => Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')]));
const LA = logsOf(join(HERE, 'results', 'diag7aa')), LC = logsOf(join(HERE, 'results', 'diag7ac'));
requireFairLogs(LA, A.PRED); requireFairLogs(LC, C.PRED);
const ua = Object.values(LA).flatMap(A.parse), uc = Object.values(LC).flatMap(C.parse);
{ const b = A.gate(ua); if (b.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
const refA = (id, arm, tag, w) => ua.find(u => u.id === id && u.arm === arm && u.label === A.label(tag, w));
{ const b = C.gate(uc, (i, a, w) => refA(i, a, 'TS+J', w), (i, a, w) => refA(i, a, 'PRODUCT', w)); if (b.length) { console.log(`FAIR-TEST GATE (7ac): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }

// a seeded generator (mulberry32), Poisson (Knuth: the rates here stay below 300), normal (Box-Muller), gamma (Marsaglia-Tsang)
let s = 7002 >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = l => { if (l <= 0) return 0; const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const norm = () => { const u = Math.max(rnd(), 1e-300), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const gamma = k => { if (k < 1) return gamma(k + 1) * Math.pow(rnd(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = norm(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = rnd(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } };
const DRAWS = 20000;
// the exact interval memoised: the same counts recur on every draw
const ivMemo = new Map();
const sc = (lost, saved) => { const key = `${lost}|${saved}`; if (!ivMemo.has(key)) ivMemo.set(key, survivalChange(lost, saved, WN, ALPHA1)); return ivMemo.get(key); };

const UNITS = [['bridge 4', 'READER', '0'], ['S194', 'OFF', '0.02']];
const SZ = UNITS.map(([id, arm, w]) => { const u = uc.find(x => x.id === id && x.arm === arm && x.w === w), w0 = u.worlds[0]; const net = Math.round(10 * (w0.simJ - w0.simO)); return { id, arm, w, net, simJ: w0.simJ, simO: w0.simO, whole: w0.price }; });
console.log(`7AD'S POWER: ${WN} paths a node, the first 1000 7ac's; ${DRAWS} draws a story (seed 7002); read by reduce-7ad.mjs's rule\n`);
console.log('THE SIZES (7ac world 0 at 30x5, through 7aa\'s and 7ac\'s gates)');
for (const x of SZ) console.log(`  ${`${x.id} (${x.arm.toLowerCase()}) W${x.w}`.padEnd(22)} first 1000: TS+J ${x.simJ.toFixed(1)} OPEN0 ${x.simO.toFixed(1)}, net ${x.net} paths (${(x.net / 10).toFixed(1)} points); world 0's whole-score price ${x.whole.toFixed(4)}`);

// ITEM 1
const draw1 = (x, b, fixed) => { const r = fixed ? x.net / 1000 : gamma(x.net + 0.5) / 1000; return { saved: x.net + pois(3000 * r) + pois(b), lost: pois(b) }; };
const STORIES1 = [
  ['cause 1: the survival price the whole price (7ac\'s)', x => x.whole],
  ['cause 1, weaker: the survival price 1.5 times the whole price', x => 1.5 * x.whole],
  ['the survival price half the realised (the first 1000\'s net)', x => 0.5 * x.net / 10],
  ['cause 2: the survival price the realised (the first 1000\'s net): priced right', x => x.net / 10],
  ['priced right on bridge 4 only', (x, j) => (j === 0 ? x.net / 10 : x.whole)],
];
for (const fixed of [false, true]) {
  console.log(`\nITEM 1 (30x5, world 0: the survival price below the node's exact interval at ${ALPHA1}, both units), the true rate ${fixed ? 'held at the first 1000\'s' : 'drawn from the first 1000 (gamma, shape net + 0.5)'}`);
  for (const b of [0.5, 5, 15]) for (const [name, price] of STORIES1) {
    const tally = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
    for (let i = 0; i < DRAWS; i++) {
      const o = SZ.map((x, j) => { const k = draw1(x, b, fixed), iv = sc(k.lost, k.saved), p = price(x, j); return p < iv.lo ? 'low' : 'not'; });
      tally[o.every(v => v === 'low') ? 'HELD' : o.every(v => v === 'not') ? 'FALSIFIED' : 'INCONCLUSIVE']++;
    }
    console.log(`  ${name.padEnd(80)} b ${String(b).padEnd(4)} ${Object.entries(tally).filter(([, v]) => v).map(([k, v]) => `${k} ${(v / DRAWS).toFixed(3)}`).join('  ')}`);
  }
}

// ITEM 2's MISPRICING HALF (the gap half is exact)
console.log('\nITEM 2, THE MISPRICING HALF (m30 > 0 and m60 <= 2/3 m30, both units; the gap half read exactly): m30 from the first 1000\'s net and the whole price, its node noise from the draws above (b 5, the rate drawn); at 60x5 the true mispricing falls by f, the 60x5 node run k paths apart from the 30x5 one');
for (const k of [10, 30, 60]) for (const f of [0, 1 / 3, 1 / 2, 1]) {
  let yes = 0;
  for (let i = 0; i < DRAWS; i++) {
    const ok = SZ.every(x => { const kk = draw1(x, 5, false), d30 = sc(kk.lost, kk.saved).d, m30 = d30 - x.whole, mTrue = x.net / 10 - x.whole; const m60 = m30 - f * mTrue + 100 * Math.sqrt(k) / WN * norm(); return m30 > 0 && m60 <= (2 / 3) * m30; });
    if (ok) yes++;
  }
  console.log(`  k ${String(k).padEnd(3)} the mispricing falls by ${f === 0 ? '0  ' : f === 1 ? 'all' : f.toFixed(2)}: the half reads 'falls by a third' on both units ${(yes / DRAWS).toFixed(3)}`);
}
console.log('\nITEMS 3 AND 4, AND ITEM 2\'S GAP HALF: the tables\' own numbers, no sampling error - power 1 against the thresholds; the uncertainty is the credence (no record holds the gap at another grid).');
