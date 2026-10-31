/*
 * 7AE'S POWER (predictions/diag-7ae.md, Power; its output hashed in the prediction and re-run by the launcher). 7ae reads the
 * bad node (world 0) at margin 0 on 8,000 paths a unit. Its sampled figures are the node runs' realised gains (TS+J over
 * OPEN0, paired); the prices are the tables' own numbers, without sampling error. This script sizes the sampled part from
 * 7ad's 30x5 records, read through 7aa's, 7ac's and 7ad's gates (results/diag7aa, results/diag7ac, results/diag7ad): world
 * 0's node runs on 4,000 paths for bridge 4 (reader, W0), S194 (off, W0.02) and S126 (reader, W0), each path's TS+J survival
 * less OPEN0's on the three units together (the units share their paths, so a path's three differences are drawn as one).
 * ITEMS 1 AND 3: 8,000 paths are drawn with replacement from 7ad's 4,000 path triples (the true realised gains 7ad's, at
 * margin 0 scaled by a factor g: the margin-0 run may realise more or less than the 1e-3 run - g 1, 0.7, 1.3, by scaling the
 * saved paths' share); the margin-0 prices set by story against the true realised; each draw read by reduce-7ae.mjs's own
 * rule (items(), pooled()).
 * ITEM 2: counts of path-years (thousands a unit) with no record before this run: its uncertainty is the credence.
 * 20,000 draws a story, seeded.
 *   node research/solver/derive-7ae.mjs > research/solver/results-derive-7ae.txt
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import * as A from './reduce-7aa.mjs';
import * as C from './reduce-7ac.mjs';
import * as D from './reduce-7ad.mjs';
import { JOBS, WN, YEARS, items } from './reduce-7ae.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const logsOf = Dir => Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')]));
const LA = logsOf(join(HERE, 'results', 'diag7aa')), LC = logsOf(join(HERE, 'results', 'diag7ac')), DIRD = join(HERE, 'results', 'diag7ad'), LD = logsOf(DIRD);
requireFairLogs(LA, A.PRED); requireFairLogs(LC, C.PRED); requireFairLogs(LD, D.PRED);
const ua = Object.values(LA).flatMap(A.parse), uc = Object.values(LC).flatMap(C.parse), jd = Object.values(LD).flatMap(D.parse);
{ const b = A.gate(ua); if (b.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
const refA = (id, arm, tag, w) => ua.find(u => u.id === id && u.arm === arm && u.label === A.label(tag, w));
{ const b = C.gate(uc, (i, a, w) => refA(i, a, 'TS+J', w), (i, a, w) => refA(i, a, 'PRODUCT', w)); if (b.length) { console.log(`FAIR-TEST GATE (7ac): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
const refC = (id, arm, w) => uc.find(u => u.id === id && u.arm === arm && u.w === w) || null;
{ const b = D.gate(jd, refA, refC); if (b.length) { console.log(`FAIR-TEST GATE (7ad): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
const stD = (() => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(LD)[0]); return { code: st[1], audit: st[2], prediction: st[3], sha: st[4] }; })();
const tr = (id, arm, w, rule, sim) => { const f = join(DIRD, D.traceName(id, arm, '30x5', rule, 0, w)); if (!existsSync(f)) { console.log(`no 7ad trace ${f}`); process.exit(1); } const t = JSON.parse(gunzipSync(readFileSync(f)).toString()); if (!D.traceAgrees(t, stD, arm, '30x5', rule, 0, w, sim)) { console.log(`${f}: not as 7ad's reducer reads it`); process.exit(1); } return decode(t).survived; };

// 7ad's world-0 node runs at 30x5: each path's difference on each unit
const U = JOBS.map(([id, arm, w]) => { const u = jd.find(j => j.id === id && j.arm === arm && j.w === w && j.grid === '30x5').tags['TS+J'], nd = u.nodes[0], J = tr(id, arm, w, 'TS+J', nd.simJ), O = tr(id, arm, w, 'OPEN0', nd.simO); const diff = Int8Array.from(J, (x, i) => x - O[i]); const saved = diff.filter(x => x > 0).length, lost = diff.filter(x => x < 0).length; return { id, arm, w, price: u.worlds[0].surv, diff, saved, lost, d: 100 * (saved - lost) / diff.length }; });
const n4 = U[0].diff.length;
console.log(`7AE'S POWER: ${WN} paths at the node drawn from 7ad's ${n4} world-0 path triples at 30x5 (the three units together); 20000 draws a story (seed 7002); read by reduce-7ae.mjs's items()\n`);
console.log('THE SIZES (7ad, world 0 at 30x5, margin 1e-3, through 7aa\'s, 7ac\'s and 7ad\'s gates)');
for (const x of U) console.log(`  ${`${x.id} (${x.arm.toLowerCase()}) W${x.w}`.padEnd(22)} saved ${x.saved} lost ${x.lost} of ${n4}: realised ${x.d.toFixed(3)}; price ${x.price.toFixed(3)}; ratio ${(x.price / x.d).toFixed(2)}`);
{ const sp = U.reduce((t, x) => t + x.price, 0), sd = U.reduce((t, x) => t + x.d, 0); console.log(`  pooled: price ${sp.toFixed(3)} realised ${sd.toFixed(3)} ratio ${(sp / sd).toFixed(2)}`); }

let s = 7002 >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const DRAWS = 20000;
// one draw: WN path triples with replacement; a saved path kept with probability g (g < 1) or a neutral path turned saved
// with the probability that adds (g - 1) of the saved share (g > 1) - the margin-0 run's realised gain g times 7ad's
const drawK = g => {
  const diffs = U.map(() => new Int8Array(WN));
  for (let i = 0; i < WN; i++) { const p = Math.floor(rnd() * n4); U.forEach((x, k) => { let v = x.diff[p]; if (g < 1 && v > 0 && rnd() > g) v = 0; else if (g > 1 && v === 0 && rnd() < (g - 1) * x.saved / (n4 - x.saved - x.lost)) v = 1; diffs[k][i] = v; }); }
  return diffs.map(diff => { let saved = 0, lost = 0; for (const v of diff) { if (v > 0) saved++; else if (v < 0) lost++; } return { saved, lost, N: WN, diff }; });
};
const STORIES = [
  ['the margin is the cause: priced as realised at margin 0', x => x.trueD],
  ['mostly: priced at 0.9 of the realised', x => 0.9 * x.trueD],
  ['half-way: priced at the 1e-3 ratio\'s mid-point to 1', x => 0.5 * (x.price / x.d + 1) * x.trueD],
  ['priced at 0.8 of the realised', x => 0.8 * x.trueD],
  ['not the cause: the 1e-3 ratio kept (each unit its own)', x => (x.price / x.d) * x.trueD],
  ['not the cause: the 1e-3 price kept', x => x.price],
];
const L0 = () => Array.from({ length: YEARS + 1 }, (_, y) => (y === 0 ? null : { held: 1000, fwdHoldCellLeave: 0 }));
for (const g of [1, 0.7, 1.3]) {
  console.log(`\nITEMS 1 AND 3, the margin-0 run's realised gain ${g} times 7ad's (true pooled ${(g * U.reduce((t, x) => t + x.d, 0)).toFixed(3)})`);
  for (const [name, priceOf] of STORIES) {
    const t1 = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 }, t3 = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
    for (let i = 0; i < DRAWS; i++) {
      const ks = drawK(g), prices = U.map(x => priceOf({ ...x, trueD: g * x.d }));
      const P = (id, m) => ({ worlds: [{ surv: m === '0' ? prices[JOBS.findIndex(j => j[0] === id)] : 0 }], moves: { chosen: 12, stay: 3 } });
      const K = (id, m) => ks[JOBS.findIndex(j => j[0] === id)];
      const it = items(P, K, () => L0());
      t1[it[0].outcome]++; t3[it[2].outcome]++;
    }
    const fmt = t => Object.entries(t).filter(([, v]) => v).map(([k, v]) => `${k} ${(v / DRAWS).toFixed(3)}`).join('  ');
    console.log(`  ${name.padEnd(58)} item 1: ${fmt(t1).padEnd(44)} item 3: ${fmt(t3)}`);
  }
}
console.log('\nITEM 2: the share of held path-years (years 1 to 7, OPEN0 at margin 1e-3, thousands a unit) where the forward move holds and the cell leaves; no record holds it before this run, so its power is its sampling (a share of 10% on 10,000 path-years has a binomial se near 0.3 points: the 2% and 10% thresholds sit many se apart) and its uncertainty the credence.');
