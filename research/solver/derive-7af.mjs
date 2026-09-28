/*
 * 7AF'S POWER (predictions/diag-7af.md, Power; its output hashed in the prediction and re-run by the launcher).
 * ITEM 1 (no material harm on 16 households, Holm): each household's paired cells of CAND against SHIP drawn as Poisson
 * counts - saved at m/2, lost at m/2 + L (L the true loss in paths: loss x N / 100) - with the churn m (the paths the two
 * arms differ on without a true change) set from the records: 7aa's TS+J against PRODUCT at W0.02 differs on 6 (bridge 4),
 * 4 (S360 reader) and 12 (S360 off) of 8,000 paths (results-7aa.txt); read by reduce-7af.mjs's own items(). Stories: A,
 * no household loses (m = 6, 12, 20, 50 on every household); B, one household loses 0.4 points; C, one loses 0.25; D, one
 * loses 0.2; each with m = 12 elsewhere. The margin 0.25 on every household (conservative: the panel's households below
 * 95% take 0.5). 20,000 draws a story, seeded.
 * ITEM 2 (spending): from 7aa's own runs of S360 - READER/TS+J/W0.02 and OFF/PRODUCT/W0.02 are 7af's CAND and SHIP on S360
 * (through 7aa's gate) - the relative spending change and its paired standard error (reduce-7af.mjs spendChange), the one
 * household the records hold both arms of.
 *   node research/solver/derive-7af.mjs > research/solver/results-derive-7af.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import * as A from './reduce-7aa.mjs';
import { N, PANEL, items, spendYears, spendPaths, spendChange } from './reduce-7af.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DA = join(HERE, 'results', 'diag7aa');
const LA = Object.fromEntries(readdirSync(DA).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DA, f), 'utf8')]));
requireFairLogs(LA, A.PRED);
const ua = Object.values(LA).flatMap(A.parse);
{ const b = A.gate(ua); if (b.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
const ST = (() => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(LA)[0]); return { code: st[1], audit: st[2], prediction: st[3], sha: st[4] }; })();
const tr = (id, arm, l) => { const u = ua.find(x => x.id === id && x.arm === arm && x.label === l), f = join(DA, A.traceName(id, arm, l)), t = JSON.parse(gunzipSync(readFileSync(f)).toString()); if (!A.traceAgrees(t, ST, arm, l, u.run.sim)) { console.log(`${f}: not as 7aa's reducer reads it`); process.exit(1); } return { T: decode(t), sim: u.run.sim }; };

let s = 7002 >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = l => { if (l <= 0) return 0; const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const DRAWS = 20000;
console.log(`7AF'S POWER: ${N} paths a household, 16 households, read by reduce-7af.mjs items(); ${DRAWS} draws a story (seed 7002)\n`);
console.log('ITEM 1 (no material harm, Holm across 16; the margin 0.25 on every household)');
const noSpend = () => ({ change: { a: 1, b: 1, d: 0, se: 0, lo: 0, hi: 0 }, rel: new Float64Array(4) });
const story = (name, mOf, lossOf) => {
  const tally = { HELD: 0, FALSIFIED: 0, INCONCLUSIVE: 0 };
  for (let i = 0; i < DRAWS; i++) {
    const draw = Object.fromEntries(PANEL.map(([id], j) => { const m = mOf(j), L = lossOf(j) * N / 100; return [id, { saved: pois(m / 2), lost: pois(m / 2 + L) }]; }));
    const K = (id, b, a) => { const d = draw[id]; return { saved: d.saved, lost: d.lost, a: N - d.saved - d.lost, d: 0, N }; };
    tally[items(K, () => 99, noSpend)[0].outcome]++;
  }
  console.log(`  ${name.padEnd(64)} ${Object.entries(tally).filter(([, v]) => v).map(([k, v]) => `${k} ${(v / DRAWS).toFixed(3)}`).join('  ')}`);
};
for (const m of [6, 12, 20, 50]) story(`A: no household loses, churn ${m} on every household`, () => m, () => 0);
for (const [nm, loss] of [['B', 0.4], ['C', 0.25], ['D', 0.2]]) story(`${nm}: one household loses ${loss} points, churn 12 everywhere`, () => 12, j => (j === 10 ? loss : 0));
story('B at churn 20 everywhere', () => 20, j => (j === 10 ? 0.4 : 0));

console.log('\nITEM 2 (spending): S360 in 7aa\'s records, READER/TS+J/W0.02 (CAND) against OFF/PRODUCT/W0.02 (SHIP), through 7aa\'s gate');
{ const X = tr('S360', 'OFF', 'PRODUCT/W0.02'), Y = tr('S360', 'READER', 'TS+J/W0.02'), sy = spendYears(X.T, Y.T), c = spendChange(spendPaths(X.T, sy), spendPaths(Y.T, sy));
  console.log(`  S360: spending ${c.a.toFixed(4)} -> ${c.b.toFixed(4)}: ${(100 * c.d).toFixed(3)}% (se ${(100 * c.se).toFixed(3)} points of a per cent); survival ${X.sim.toFixed(4)} -> ${Y.sim.toFixed(4)}`); }
console.log('\nThe spending item\'s standard error on one household at 8,000 paths is the figure above; the 5% and 1% lines sit many standard errors from it, so item 2 reads by the size of the change, its uncertainty the credence.');
