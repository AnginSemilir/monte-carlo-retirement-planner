/*
 * 7AJ'S DERIVATION (predictions/diag-7aj.md): the power of its three items and the derived credences, from the nearest
 * records - 7af's and 7ag's CAND against SHIP at the estate weight 0.02 on the same 25 households (results-7af.txt,
 * results-7ag.txt: item 1's paired cells, the whole score's interval, spending while both spend) - read through
 * reduce-7aj.mjs's own items(), so the rule the run is read by is the rule the power is computed for.
 * The records are the bundle of 29 Sep (READER/TS+J), not the candidate (Q's step, the charge, e3, the interpolated
 * allowance axis and O60's tiers since), and at 0.02, not 0.01: every story below is a declared departure from them, not a
 * measurement (grade D as a forecast).
 *   SAME     - each household as at 0.02: item 1's cells at their recorded rates (7ag's 16,000 paths scaled to 8,000), the
 *              whole score at its recorded point and spread with the rest (the score less its survival part) halved (the
 *              estate's term scales with its weight; the cut and raise terms do not - declared), spending as recorded;
 *   DRIFT    - SAME with every household losing 0.1 points more (the lost rate raised by 0.001), the whole score's survival
 *              part with it, and spending 0.5% lower everywhere: a small cost of the candidate's later parts or of the
 *              weight, below every margin;
 *   ONE      - SAME with one household (wealth x2, the closest at 0.02: 0 saved/5 lost) losing 0.5 points more, its whole
 *              score with it: a real harm of one of the later parts on one household.
 * Each story drawn 2,000 times (Poisson counts for item 1; normal draws on the recorded spreads for items 2 and 3), a
 * fixed generator seed (below), so the output is reproducible.
 * The derived credence: the NOHARM base rate (results-scorecard.txt KIND BASE RATES: 0.81, 28 of 34) on SAME; the rest
 * split evenly between DRIFT and ONE (declared).
 *   node research/solver/derive-7aj.mjs > research/solver/results-derive-7aj.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { items, PANEL, MARGIN, N } from './reduce-7aj.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const T = { af: readFileSync(join(HERE, 'results-7af.txt'), 'utf8'), ag: readFileSync(join(HERE, 'results-7ag.txt'), 'utf8') };
const DRAWS = 2000, BASE = 0.81, Z = 1.959963984540054;
// the records
const rec = {};
for (const [src, text] of Object.entries(T)) {
  for (const line of text.split('\n')) {
    let m;
    if ((m = /^  (\S.*?) SHIP\s+table \S+ sim (\S+)/.exec(line))) (rec[m[1]] ||= { src }).ship = +m[2];
    else if ((m = /^\s{5}(\S.*?)\s+(\d+) saved\/(\d+) lost of (\d+)\s+p /.exec(line)) && PANEL.includes(m[1])) Object.assign(rec[m[1]] ||= { src }, { saved: +m[2], lost: +m[3], n: +m[4] });
    else if ((m = /^  (\S.*?)\s+([+-]\d+\.\d+) \((-?\d+\.\d+) to (-?\d+\.\d+); survival part ([+-]\d+\.\d+), the rest ([+-]\d+\.\d+)\)$/.exec(line)) && PANEL.includes(m[1])) Object.assign(rec[m[1]] ||= { src }, { wd: +m[2], wlo: +m[3], whi: +m[4], wsv: +m[5], wrest: +m[6] });
    else if ((m = /^\s{5}(\S.*?)\s+while both spend \((\d+) paths\) \S+ -> \S+: ([+-]\d+\.\d+)% \((-?\d+\.\d+) to (-?\d+\.\d+)\)/.exec(line)) && PANEL.includes(m[1])) Object.assign(rec[m[1]] ||= { src }, { sd: +m[3] / 100, slo: +m[4] / 100, shi: +m[5] / 100 });
  }
}
const missing = PANEL.filter(id => !rec[id] || [rec[id].ship, rec[id].saved, rec[id].wd, rec[id].sd].some(x => x === undefined));
if (missing.length) { console.error(`derive-7aj: the records lack ${missing.join(', ')}`); process.exit(2); }

// a small seeded generator (mulberry32), Poisson by inversion (small means) or a normal approximation (large), normal by Box-Muller
let st = 424242;
const rnd = () => { st = (st + 0x6d2b79f5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const normal = () => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());
const poisson = mu => { if (mu <= 0) return 0; if (mu > 60) return Math.max(0, Math.round(mu + Math.sqrt(mu) * normal())); const L = Math.exp(-mu); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };

console.log('7AJ DERIVATION: the power of the three items and the derived credences, from 7af\'s and 7ag\'s records at 0.02 (the bundle), read through reduce-7aj.mjs items()\n');
console.log('1. THE RECORDS (CAND against SHIP at 0.02; 7ag scaled to 8,000 paths)');
for (const id of PANEL) { const r = rec[id], f = N / r.n; console.log(`  ${id.padEnd(14)} SHIP ${r.ship.toFixed(2)} margin ${MARGIN[id]}  saved ${(r.saved * f).toFixed(1)} lost ${(r.lost * f).toFixed(1)}  whole ${r.wd >= 0 ? '+' : ''}${r.wd.toFixed(3)} (${r.wlo.toFixed(3)} to ${r.whi.toFixed(3)}; the rest ${r.wrest >= 0 ? '+' : ''}${r.wrest.toFixed(3)})  spending ${(100 * r.sd).toFixed(3)}% (${(100 * r.slo).toFixed(3)} to ${(100 * r.shi).toFixed(3)})`); }

const STORIES = {
  SAME: { lost: () => 0, sv: () => 0, sp: () => 0 },
  DRIFT: { lost: () => 0.001, sv: () => -0.1, sp: () => -0.005 },
  ONE: { lost: id => (id === 'wealth x2' ? 0.005 : 0), sv: id => (id === 'wealth x2' ? -0.5 : 0), sp: () => 0 },
};
const nP = 400;
function draw(S) {
  const K = {}, WL = {}, SP = {};
  for (const id of PANEL) {
    const r = rec[id], f = N / r.n;
    const saved = poisson(r.saved * f), lost = poisson(r.lost * f + S.lost(id) * N);
    const fail = Math.round(N * (1 - r.ship / 100)), d = Math.max(0, fail - saved), a = Math.max(0, N - saved - lost - d);
    K[id] = { a, lost, saved, d, N: a + lost + saved + d };
    const se = (r.whi - r.wlo) / (2 * Z), mean = r.wsv + r.wrest / 2 + S.sv(id), x = mean + se * normal();
    WL[id] = { d: x, lo: x - Z * se, hi: x + Z * se };
    const sse = (r.shi - r.slo) / (2 * Z), sx = r.sd + S.sp(id) + sse * normal(), e = sse * Math.sqrt(nP);
    SP[id] = { change: { d: sx, lo: sx - Z * sse, hi: sx + Z * sse }, rel: Float64Array.from({ length: nP }, (_, i) => sx + (i % 2 ? e : -e)) };
  }
  return items(id => K[id], id => WL[id], id => SP[id]);
}
console.log(`\n2. THE POWER: each story drawn ${DRAWS} times, the outcome shares per item (HELD / INCONCLUSIVE / FALSIFIED)`);
const P = {};
for (const [name, S] of Object.entries(STORIES)) {
  const c = [1, 2, 3].map(() => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }));
  for (let k = 0; k < DRAWS; k++) draw(S).forEach((x, i) => { c[i][x.outcome]++; });
  P[name] = c.map(x => Object.fromEntries(Object.entries(x).map(([o, v]) => [o, v / DRAWS])));
  console.log(`  ${name.padEnd(6)} ${P[name].map((x, i) => `item ${i + 1} ${x.HELD.toFixed(3)} / ${x.INCONCLUSIVE.toFixed(3)} / ${x.FALSIFIED.toFixed(3)}`).join('   ')}`);
}
console.log(`\n3. THE DERIVED CREDENCES: SAME at the NOHARM base rate ${BASE}, DRIFT and ONE ${((1 - BASE) / 2).toFixed(3)} each (declared)`);
const W = { SAME: BASE, DRIFT: (1 - BASE) / 2, ONE: (1 - BASE) / 2 };
const cred = [0, 1, 2].map(i => Object.fromEntries(['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(o => [o, Object.keys(W).reduce((t, s) => t + W[s] * P[s][i][o], 0)])));
cred.forEach((x, i) => console.log(`  item ${i + 1}: HELD ${x.HELD.toFixed(2)}, INCONCLUSIVE ${x.INCONCLUSIVE.toFixed(2)}, FALSIFIED ${x.FALSIFIED.toFixed(2)}`));
// the decision table's rows: all three HELD; any FALSIFIED; else (one or more INCONCLUSIVE, none FALSIFIED) - per draw, by story
const rows = { all: 0, fals: 0, inc: 0 };
for (const [name, S] of Object.entries(STORIES)) {
  let a = 0, f = 0;
  for (let k = 0; k < DRAWS; k++) { const o = draw(S).map(x => x.outcome); if (o.every(x => x === 'HELD')) a++; else if (o.includes('FALSIFIED')) f++; }
  rows.all += W[name] * a / DRAWS; rows.fals += W[name] * f / DRAWS; rows.inc += W[name] * (DRAWS - a - f) / DRAWS;
}
console.log(`\n4. THE DECISION TABLE'S ROWS (derived): all three HELD ${rows.all.toFixed(2)}; any FALSIFIED ${rows.fals.toFixed(2)}; else (an INCONCLUSIVE, none FALSIFIED) ${rows.inc.toFixed(2)}`);
// the point: item 1's mean survival change over the 25 under SAME, and the whole score's
const pt = PANEL.map(id => { const r = rec[id], f = N / r.n; return 100 * (r.saved - r.lost) * f / N; });
console.log(`\n5. THE POINTS under SAME: the panel's mean survival change ${(pt.reduce((t, x) => t + x, 0) / pt.length).toFixed(3)} points (median ${[...pt].sort((x, y) => x - y)[12].toFixed(3)}, least ${Math.min(...pt).toFixed(3)} on ${PANEL[pt.indexOf(Math.min(...pt))]}); the whole score's least point ${Math.min(...PANEL.map(id => rec[id].wsv + rec[id].wrest / 2)).toFixed(3)}; spending's least ${(100 * Math.min(...PANEL.map(id => rec[id].sd))).toFixed(3)}%`);
