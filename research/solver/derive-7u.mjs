/*
 * 7U'S DERIVATION (predictions/confirm-7u.md): the power of its eight items, the derived credences, the points and their
 * 80% intervals, and what the cited records' runs differ in from 7u's - read through reduce-7u.mjs's own items(), so the
 * rule the run is read by is the rule the power is computed for. The author's judgement was committed before this script
 * was written (drafts/confirm-7u.md, f5e779d).
 * THE CARRYING RULE (RULES.md section 9 rule 5; CARRY's read, items/7u.md 8 Oct): each weight takes its own record -
 * 7aj's at 0.01 (results-7aj.txt), 7aw's at 0.02 (results-7aw.txt), both held to their registered hashes - and nothing
 * crosses a weight. 7u changes the seed, so each record is carried by its own UNPAIRED sampling interval for a new seed,
 * never CARRY's paired band: a household's counts are drawn as Poisson with a rate itself drawn from the record (the
 * Jeffreys gamma, x + 0.5), which doubles the variance as two independent seeds do; the whole score and spending as
 * normal draws about the record's point with sqrt(2) times its standard error, each draw's own interval the record's width.
 * THE BROAD 30 have no record at either weight (a carry across households, CARRY's question; items/7u.md 8 Oct item 1):
 * each draw gives each broad household the record of one of the 25's no-gain households at that weight, at random - the
 * ordinary households are assumed to look like the 25's ordinary ones. Declared, wide, grade D.
 * THE STORIES, at each weight:
 *   SAME  - every household as its record (the broad 30 as above);
 *   DRIFT - every household 0.1 points worse (the lost rate raised by 0.001), its whole score with it, spending 0.5% lower:
 *           a small cost everywhere, below every margin;
 *   ONE   - wealth x2 (the 25's closest at both weights: 0 saved/1 lost at 0.01, 0/3 at 0.02) 0.5 points worse;
 *   ONEB  - one broad household, S364 (long-bridge, pension-heavy: where the candidate acts and no record exists), 0.5 worse.
 * Each story drawn 2,000 times with a fixed generator seed, so the output is reproducible. The derived credence: the
 * NOHARM base rate (results-scorecard.txt KIND BASE RATES) on SAME, the rest split evenly over DRIFT, ONE and ONEB
 * (declared). The points and their 80% intervals: each item's realised point (reduce-7u.mjs's REALISED line) over the
 * SAME draws, median and 10th to 90th percentile.
 * CARRY-DIFF (retirement pass 4, AUTOMATE (2)): for each cited record, every setting where its run differs from 7u's, read
 * from the preflight's logs (results/diag7u-preflight; the preflight runs 7u's own audit at 4 points and 20 paths of 7002,
 * so those three differ by design and are named as the preflight's, not the run's).
 *   node research/solver/derive-7u.mjs > research/solver/results-derive-7u.txt
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { items } from './reduce-7u.mjs';
import { PANEL, PANEL25, BROAD, WEIGHTS, N, RECORDS, gainOf, floorOf, gainSetOf } from './panel-7u.mjs';
import { marginFor } from './stats.mjs';
import { unitsOf, carryDiff, printDiff } from './carry-diff.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// derive-sizing.mjs's readCases, copied (that module runs its sizing on import): per unit label, the solve seconds and
// the forward seconds per 1,000 paths
function readCases(dir) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f))) {
    let hh = null, paths = null;
    for (const L of readFileSync(join(dir, f), 'utf8').split('\n')) {
      let m = /^(\S.*?)\s+case \| unit (\S+)/.exec(L); if (m) { hh = m[1].trim(); continue; }
      m = /^\s+ran (\S+?): .*?paths (\d+)/.exec(L); if (m) { paths = +m[2]; continue; }
      m = /^\s+solve (\S+?): .*secs (\d+)/.exec(L); if (m) { (out[m[1]] ||= { solve: [], fwdK: [], hh: [] }).solve.push(+m[2]); out[m[1]].hh.push(hh); continue; }
      m = /^\s+(?:run|sum) (\S+?): .*secs (\d+)/.exec(L); if (m && paths) (out[m[1]] ||= { solve: [], fwdK: [], hh: [] }).fwdK.push(+m[2] / paths * 1000);
    }
  }
  return out;
}
const DRAWS = 2000, Z = 1.959963984540054, NP = 400, ID25 = PANEL25.map(([id]) => id);
const SC = readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'), BASE = Number((/NOHARM (\d\.\d+) \(\d+ of \d+\)/.exec(SC) || [])[1]);
if (!(BASE > 0 && BASE < 1)) { console.error('derive-7u: no NOHARM base rate in results-scorecard.txt'); process.exit(2); }

// THE RECORDS, each at its registered hash (gainSetOf checks it)
const rec = {};
for (const w of WEIGHTS) {
  const text = readFileSync(join(HERE, RECORDS[w].file), 'utf8');
  gainSetOf(text, RECORDS[w].sha);
  const R = rec[w] = {};
  for (const line of text.split('\n')) {
    let m;
    if ((m = /^  (\S.*?) SHIP\s+table (\S+) sim (\S+) error (\S+)/.exec(line)) && ID25.includes(m[1])) Object.assign(R[m[1]] ||= {}, { ship: +m[3], err: +m[4] });
    else if ((m = /^ {5}(\S.*?)\s+(\d+) saved\/(\d+) lost of (\d+)\s/.exec(line)) && ID25.includes(m[1])) Object.assign(R[m[1]] ||= {}, { saved: +m[2], lost: +m[3], n: +m[4] });
    else if ((m = /^ {5}(\S.*?)\s+whole ([+-]\d+\.\d+) \(unconditional (-?\d+\.\d+) to (-?\d+\.\d+);/.exec(line)) && ID25.includes(m[1])) Object.assign(R[m[1]] ||= {}, { wd: +m[2], wlo: +m[3], whi: +m[4] });
    else if ((m = /^ {5}(\S.*?)\s+while both spend \(\d+ paths\) \S+ -> \S+: ([+-]\d+\.\d+)% \((-?\d+\.\d+) to (-?\d+\.\d+)\)/.exec(line)) && ID25.includes(m[1])) Object.assign(R[m[1]] ||= {}, { sd: +m[2] / 100, slo: +m[3] / 100, shi: +m[4] / 100 });
  }
  const missing = ID25.filter(id => !R[id] || ['ship', 'saved', 'wd', 'sd'].some(k => R[id][k] === undefined));
  if (missing.length) { console.error(`derive-7u: the record at ${w} lacks ${missing.join(', ')}`); process.exit(2); }
}
const POOL = Object.fromEntries(WEIGHTS.map(w => [w, floorOf(w).filter(id => ID25.includes(id))]));

// a small seeded generator (mulberry32); normal by Box-Muller; gamma by Marsaglia-Tsang; Poisson by inversion or normal
let st = 70137013;
const rnd = () => { st = (st + 0x6d2b79f5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const normal = () => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());
const gamma = a => { if (a < 1) return gamma(a + 1) * Math.pow(rnd() || 1e-12, 1 / a); const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = normal(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = rnd(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } };
const poisson = mu => { if (mu <= 0) return 0; if (mu > 60) return Math.max(0, Math.round(mu + Math.sqrt(mu) * normal())); const L = Math.exp(-mu); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };

const STORIES = {
  SAME: { lost: () => 0, sv: () => 0, sp: () => 0 },
  DRIFT: { lost: () => 0.001, sv: () => -0.1, sp: () => -0.005 },
  ONE: { lost: id => (id === 'wealth x2' ? 0.005 : 0), sv: id => (id === 'wealth x2' ? -0.5 : 0), sp: () => 0 },
  ONEB: { lost: id => (id === 'S364' ? 0.005 : 0), sv: id => (id === 'S364' ? -0.5 : 0), sp: () => 0 },
};
if (!BROAD.includes('S364')) { console.error('derive-7u: ONEB names S364, not in the broad 30'); process.exit(2); }
function draw(S, w) {
  const K = {}, WL = {}, SP = {}, SH = {};
  for (const id of PANEL) {
    const r = ID25.includes(id) ? rec[w][id] : rec[w][POOL[w][Math.floor(rnd() * POOL[w].length)]], f = N / r.n;
    const saved = poisson(gamma(r.saved * f + 0.5)), lost = poisson(gamma(r.lost * f + 0.5) + S.lost(id) * N);
    const ship = Math.min(100, Math.max(0, r.ship + Math.SQRT2 * 100 * Math.sqrt(Math.max(1e-9, r.ship / 100 * (1 - r.ship / 100)) / N) * normal()));
    const fail = Math.round(N * (1 - ship / 100)), dd = Math.max(0, fail - saved), a = Math.max(0, N - saved - lost - dd);
    K[id] = { a, lost, saved, d: dd, N: a + lost + saved + dd }; SH[id] = ship;
    const se = (r.whi - r.wlo) / (2 * Z), x = r.wd + S.sv(id) + Math.SQRT2 * se * normal();
    WL[id] = { d: x, lo: x - Z * se, hi: x + Z * se };
    const sse = (r.shi - r.slo) / (2 * Z), sx = r.sd + S.sp(id) + Math.SQRT2 * sse * normal(), e = sse * Math.sqrt(NP);
    SP[id] = { change: { d: sx, lo: sx - Z * sse, hi: sx + Z * sse }, rel: Float64Array.from({ length: NP }, (_, i) => sx + (i % 2 ? e : -e)) };
  }
  return items(w, id => K[id], id => WL[id], id => SP[id], id => marginFor(SH[id]), floorOf(w));
}

console.log('7U DERIVATION: the power of the eight items, the derived credences, the points and their 80% intervals, from each weight\'s own record (7aj at 0.01, 7aw at 0.02), read through reduce-7u.mjs items(); the broad 30 drawn from the 25\'s no-gain households (grade D)\n');
console.log('1. THE RECORDS (CAND against SHIP on the tuning seed 7002, 8,000 paths; each weight its own)');
for (const w of WEIGHTS) {
  console.log(`  at ${w} (${RECORDS[w].file}, sha256 ${RECORDS[w].sha}): the gain set (record change at least 0.5 points) ${gainOf(w).join(', ')}; the floor ${floorOf(w).length} households; the broad pool, the 25's no-gain households: ${POOL[w].length}`);
  for (const id of ID25) { const r = rec[w][id]; console.log(`    ${id.padEnd(14)} SHIP ${r.ship.toFixed(2)} (margin ${marginFor(r.ship)}, year-0 table error ${r.err.toFixed(2)})  saved ${r.saved} lost ${r.lost}  whole ${r.wd >= 0 ? '+' : ''}${r.wd.toFixed(3)} (${r.wlo.toFixed(3)} to ${r.whi.toFixed(3)})  spending ${(100 * r.sd).toFixed(3)}%`); }
  console.log(`    SHIP's year-0 table error -70 or worse at ${w} (section 9 rule 3; named in the pre-mortem): ${ID25.filter(id => rec[w][id].err <= -70).map(id => `${id} ${rec[w][id].err.toFixed(2)}`).join(', ') || 'none'}`);
}

console.log(`\n2. THE POWER: each story drawn ${DRAWS} times at each weight, the outcome shares per item (HELD / INCONCLUSIVE / FALSIFIED)`);
const P = {}, ROWS = {}, PTS = {};
for (const [name, S] of Object.entries(STORIES)) {
  const c = Array.from({ length: 8 }, () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 })), pts = Array.from({ length: 8 }, () => []);
  let all = 0, fals = 0;
  for (let k = 0; k < DRAWS; k++) {
    const it = [...draw(S, '0.02'), ...draw(S, '0.01')];
    it.forEach(x => { c[x.n - 1][x.outcome]++; if (name === 'SAME') pts[x.n - 1].push(x.point); });
    if (it.every(x => x.outcome === 'HELD')) all++; else if (it.some(x => x.outcome === 'FALSIFIED')) fals++;
  }
  P[name] = c.map(x => Object.fromEntries(Object.entries(x).map(([o, v]) => [o, v / DRAWS])));
  ROWS[name] = { all: all / DRAWS, fals: fals / DRAWS, inc: (DRAWS - all - fals) / DRAWS };
  if (name === 'SAME') Object.assign(PTS, Object.fromEntries(pts.map((a, i) => [i + 1, a.sort((x, y) => x - y)])));
  console.log(`  ${name.padEnd(6)} ${P[name].map((x, i) => `${i + 1}: ${x.HELD.toFixed(3)}/${x.INCONCLUSIVE.toFixed(3)}/${x.FALSIFIED.toFixed(3)}`).join('  ')}`);
}

const W = { SAME: BASE, DRIFT: (1 - BASE) / 3, ONE: (1 - BASE) / 3, ONEB: (1 - BASE) / 3 };
console.log(`\n3. THE DERIVED CREDENCES: SAME at the NOHARM base rate ${BASE} (results-scorecard.txt), DRIFT, ONE and ONEB ${((1 - BASE) / 3).toFixed(3)} each (declared)`);
const cred = Array.from({ length: 8 }, (_, i) => Object.fromEntries(['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(o => [o, Object.keys(W).reduce((t, s) => t + W[s] * P[s][i][o], 0)])));
cred.forEach((x, i) => console.log(`  item ${i + 1}: HELD ${x.HELD.toFixed(2)}, INCONCLUSIVE ${x.INCONCLUSIVE.toFixed(2)}, FALSIFIED ${x.FALSIFIED.toFixed(2)}`));

const rows = ['all', 'fals', 'inc'].map(k => Object.keys(W).reduce((t, s) => t + W[s] * ROWS[s][k], 0));
console.log(`\n4. THE DECISION TABLE'S ROWS (derived): all eight HELD ${rows[0].toFixed(2)}; any FALSIFIED ${rows[1].toFixed(2)}; else (an INCONCLUSIVE, none FALSIFIED) ${rows[2].toFixed(2)}`);

const q = (a, p) => a[Math.min(a.length - 1, Math.max(0, Math.round(p * (a.length - 1))))];
const UNIT = { 1: 'points, the mean survival change over the 55', 2: 'the least household whole-score point', 3: '%, the least household spending change', 4: 'points, the floor\'s pooled change' };
console.log('\n5. THE POINTS AND THEIR 80% INTERVALS: each item\'s realised point over the SAME draws, median (10th to 90th percentile)');
for (let k = 1; k <= 8; k++) console.log(`  item ${k} (${k <= 4 ? '0.02' : '0.01'}; ${UNIT[(k - 1) % 4 + 1]}): ${q(PTS[k], 0.5).toFixed(3)} (80% interval ${q(PTS[k], 0.1).toFixed(3)} to ${q(PTS[k], 0.9).toFixed(3)})`);

console.log('\n6. CARRY-DIFF: each cited record\'s run against 7u\'s (the preflight\'s logs: 7u\'s own audit at 4 points, 20 paths of 7002 - those three by design)');
const PRE = join(HERE, 'results', 'diag7u-preflight'), textsOf = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
const pre = unitsOf(textsOf(PRE));
if (!pre.units.length) { console.error(`derive-7u: no preflight logs in ${PRE}: run preflight-7u.sh first (a carry-diff over nothing is an error)`); process.exit(2); }
for (const [dir, w] of [['diag7aj', '0.01'], ['diag7aw', '0.02']]) printDiff(carryDiff(unitsOf(textsOf(join(HERE, 'results', dir))), pre, { bequestWeight: w }), console.log, `results/${dir} -> 7u at ${w}`);

// 7. THE BUDGET: each record's measured units (the solve and the forward run per 1,000 paths, derive-sizing.mjs readCases)
// at its own weight for the 25; each broad unit at the median of its arm's 25 at that weight (assumed, grade D)
{ console.log('\n7. THE BUDGET: each unit\'s measured solve plus 8,000 paths forward, from the records\' own logs (results/diag7aj at 0.01, results/diag7aw at 0.02); a broad unit at the median of its arm\'s 25 at that weight (assumed)');
  let total = 0;
  for (const [dir, w] of [['diag7aj', '0.01'], ['diag7aw', '0.02']]) {
    const C = readCases(join(HERE, 'results', dir));
    for (const [arm, lab] of [['CAND', `CANDIDATE/W${w}`], ['SHIP', `PRODUCT/W${w}`]]) {
      const c = C[lab]; if (!c || c.solve.length !== 25 || c.fwdK.length !== 25) { console.error(`derive-7u: ${dir} ${lab} has ${c ? c.solve.length : 0} units, not 25`); process.exit(2); }
      const u = c.solve.map((sv, i) => (sv + c.fwdK[i] * N / 1000) / 3600), med = [...u].sort((a, b) => a - b)[12], sum25 = u.reduce((t, x) => t + x, 0);
      total += sum25 + 30 * med;
      console.log(`  ${arm} at ${w}: the 25 ${sum25.toFixed(2)} core-hours (median unit ${med.toFixed(3)}); the broad 30 at that median ${(30 * med).toFixed(2)}`);
    }
  }
  console.log(`  in all ${total.toFixed(1)} core-hours, about ${(total / 4).toFixed(1)} h on four cores four units at once (e3pcls on in CAND saves moves, E3-PCLS-C's median 12.4% fewer evaluated; the stage logging adds a move's score per path-year on 24 units: neither counted)`); }

console.log('');
cred.forEach((x, i) => console.log(`CREDENCE item ${i + 1}: point ${q(PTS[i + 1], 0.5).toFixed(3)} HELD ${x.HELD.toFixed(2)} INCONCLUSIVE ${x.INCONCLUSIVE.toFixed(2)} FALSIFIED ${x.FALSIFIED.toFixed(2)}`));
console.log(`\nDERIVED: ${cred.map((x, i) => `item ${i + 1} HELD ${x.HELD.toFixed(2)} INCONCLUSIVE ${x.INCONCLUSIVE.toFixed(2)} FALSIFIED ${x.FALSIFIED.toFixed(2)}`).join('; ')}`);
