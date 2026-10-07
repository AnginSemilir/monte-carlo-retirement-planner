/*
 * 7AW'S DERIVATION (predictions/diag-7aw.md): the power of its three items and the derived credences, from the nearest
 * record - 7aj's CAND against SHIP at the estate weight 0.01 on the same 25 households, the same candidate and the same
 * blend-median world (results-7aj.txt: item 1's paired cells, the whole score's interval with its survival part and rest,
 * spending while both spend) - read through reduce-7aw.mjs's own items(), so the rule the run is read by is the rule the
 * power is computed for. Not 7af's or 7ag's records: another bundle on the product's tiers (the deep review of 7 Oct 11:42
 * UK: its STOP list). The weight differs (0.01 to 0.02), so every story is a declared departure from 7aj's record, not a
 * measurement (grade C as a forecast: the same candidate and world, one setting moved).
 *   SAME     - each household as at 0.01: item 1's cells at their recorded counts, the whole score at its survival part plus
 *              twice the rest (the estate's term scales with its weight; the cut and raise terms in the rest do not -
 *              declared: the rest is at most 0.25 but on share 0.95 (+2.116), S360 (+1.293) and bridge 4+cost (+0.515), all
 *              far from harm), its spread the recorded unconditional interval's,
 *              spending as recorded;
 *   DRIFT    - SAME with every household losing 0.1 points more (the lost rate raised by 0.001), the whole score's survival
 *              part with it, and spending 0.5% lower everywhere: a small cost of the higher weight, below every margin;
 *   ONE      - SAME with one household (wealth x2, the closest at 0.01: unconditional lower end -0.071 against 0.25) losing
 *              0.5 points more, its whole score with it: a harm the weight brings out on one household.
 * Each story drawn 2,000 times (Poisson counts for item 1; normal draws on the recorded spreads for items 2 and 3), a
 * fixed generator seed (below), so the output is reproducible.
 * The derived credence: the NOHARM base rate (results-scorecard.txt KIND BASE RATES: 0.82, 31 of 37) on SAME; the rest
 * split evenly between DRIFT and ONE (declared).
 *   node research/solver/derive-7aw.mjs > research/solver/results-derive-7aw.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { items, PANEL, MARGIN, N } from './reduce-7aw.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const T = { aj: readFileSync(join(HERE, 'results-7aj.txt'), 'utf8') };
const DRAWS = 2000, BASE = 0.82, Z = 1.959963984540054;
// the records
const rec = {};
for (const [src, text] of Object.entries(T)) {
  for (const line of text.split('\n')) {
    let m;
    if ((m = /^  (\S.*?) SHIP\s+table \S+ sim (\S+)/.exec(line))) (rec[m[1]] ||= { src }).ship = +m[2];
    else if ((m = /^\s{5}(\S.*?)\s+(\d+) saved\/(\d+) lost of (\d+)\s+p /.exec(line)) && PANEL.includes(m[1])) Object.assign(rec[m[1]] ||= { src }, { saved: +m[2], lost: +m[3], n: +m[4] });
    else if ((m = /^\s{5}(\S.*?)\s+whole ([+-]\d+\.\d+) \(unconditional (-?\d+\.\d+) to (-?\d+\.\d+); exact \S+ to \S+; survival part ([+-]\d+\.\d+), the rest ([+-]\d+\.\d+) \+\/- \d+\.\d+\)/.exec(line)) && PANEL.includes(m[1])) Object.assign(rec[m[1]] ||= { src }, { wd: +m[2], wlo: +m[3], whi: +m[4], wsv: +m[5], wrest: +m[6] });
    else if ((m = /^\s{5}(\S.*?)\s+while both spend \((\d+) paths\) \S+ -> \S+: ([+-]\d+\.\d+)% \((-?\d+\.\d+) to (-?\d+\.\d+)\)/.exec(line)) && PANEL.includes(m[1])) Object.assign(rec[m[1]] ||= { src }, { sd: +m[3] / 100, slo: +m[4] / 100, shi: +m[5] / 100 });
  }
}
const missing = PANEL.filter(id => !rec[id] || [rec[id].ship, rec[id].saved, rec[id].wd, rec[id].sd].some(x => x === undefined));
if (missing.length) { console.error(`derive-7aw: the record lacks ${missing.join(', ')}`); process.exit(2); }

// a small seeded generator (mulberry32), Poisson by inversion (small means) or a normal approximation (large), normal by Box-Muller
let st = 424242;
const rnd = () => { st = (st + 0x6d2b79f5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const normal = () => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());
const poisson = mu => { if (mu <= 0) return 0; if (mu > 60) return Math.max(0, Math.round(mu + Math.sqrt(mu) * normal())); const L = Math.exp(-mu); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };

console.log('7AW DERIVATION: the power of the three items and the derived credences, from 7aj\'s record at 0.01 (the same candidate and world), read through reduce-7aw.mjs items()\n');
console.log('1. THE RECORD (CAND against SHIP at 0.01, results-7aj.txt; 8,000 paths)');
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
    const se = (r.whi - r.wlo) / (2 * Z), mean = r.wsv + 2 * r.wrest + S.sv(id), x = mean + se * normal();
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
// the point: item 1's mean survival change over the 25 under SAME, and the whole score's
const pt = PANEL.map(id => { const r = rec[id], f = N / r.n; return 100 * (r.saved - r.lost) * f / N; });
// the decision table's rows: all three HELD; any FALSIFIED; else (one or more INCONCLUSIVE, none FALSIFIED) - per draw, by story
const rows = { all: 0, fals: 0, inc: 0 };
for (const [name, S] of Object.entries(STORIES)) {
  let a = 0, f = 0;
  for (let k = 0; k < DRAWS; k++) { const o = draw(S).map(x => x.outcome); if (o.every(x => x === 'HELD')) a++; else if (o.includes('FALSIFIED')) f++; }
  rows.all += W[name] * a / DRAWS; rows.fals += W[name] * f / DRAWS; rows.inc += W[name] * (DRAWS - a - f) / DRAWS;
}
console.log(`\n4. THE DECISION TABLE'S ROWS (derived): all three HELD ${rows.all.toFixed(2)}; any FALSIFIED ${rows.fals.toFixed(2)}; else (an INCONCLUSIVE, none FALSIFIED) ${rows.inc.toFixed(2)}`);
// the credence lines the prediction check reads, each with its item's point (item 1 the panel's mean survival change under
// SAME, item 2 the whole score's least household point at 0.02, item 3 spending's least household change in %)
{ const pts = [(pt.reduce((t, x) => t + x, 0) / pt.length).toFixed(2), Math.min(...PANEL.map(id => rec[id].wsv + 2 * rec[id].wrest)).toFixed(3), (100 * Math.min(...PANEL.map(id => rec[id].sd))).toFixed(2)];
  console.log('');
  cred.forEach((x, i) => console.log(`CREDENCE item ${i + 1}: point ${pts[i]} HELD ${x.HELD.toFixed(2)} INCONCLUSIVE ${x.INCONCLUSIVE.toFixed(2)} FALSIFIED ${x.FALSIFIED.toFixed(2)}`)); }
console.log(`\n5. THE POINTS under SAME: the panel's mean survival change ${(pt.reduce((t, x) => t + x, 0) / pt.length).toFixed(3)} points (median ${[...pt].sort((x, y) => x - y)[12].toFixed(3)}, least ${Math.min(...pt).toFixed(3)} on ${PANEL[pt.indexOf(Math.min(...pt))]}); the whole score's least point ${Math.min(...PANEL.map(id => rec[id].wsv + 2 * rec[id].wrest)).toFixed(3)}; spending's least ${(100 * Math.min(...PANEL.map(id => rec[id].sd))).toFixed(3)}%`);
