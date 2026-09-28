/*
 * 7AC ITEM 3'S BRANCHES, THEIR POWER (predictions/diag-7ac.md, Power; the plan-auditor's review of 28 Sep 12:49 UK, MINOR 1).
 * A FALSIFIED item 3 is read in one of three branches by the same pooled cells read for a loss (reduce-7ac.mjs: h3, a
 * reduce-7v.mjs harmFamily at the pooled margin 0.1, beside item 3's gainFamily): without a loss (no material harm), by a
 * loss (harm), or with a loss not ruled out (inconclusive). derive-7ac.mjs gives the item's outcome only; this gives the
 * branch each story lands in, by the same draws: the sizes from results-derive-7ac.txt (its hash checked against the
 * prediction's derive line), the counts drawn as Poisson with a background of b paths each way (b = 0.5, 5 and 15), 20,000
 * draws a story from seed 7002, as derive-7ac.mjs draws item 3.
 * THE STORIES (OPEN0 against TS, pooled over S126 and S194 on the paths the product survives at W0.02):
 *   - OPEN0 as the product on its survivors (it saves TS's losses there) and as TS+J (TS+J's cells against TS): item 3 HELD;
 *   - OPEN0 as TS (the opening carried 7aa's item 5): FALSIFIED, and the reading its Decision fed names needs the no-loss
 *     branch;
 *   - OPEN0 losing to TS what TS loses to the product there (the mirror: 9 and 16): FALSIFIED by a loss is the branch wanted.
 *   node research/solver/derive-7ac-branch.mjs > research/solver/results-derive-7ac-branch.txt
 *   node research/solver/derive-7ac-branch.mjs <a copy>    the hash guard on a planted copy: must refuse
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { MARGINS } from './stats.mjs';
import * as V from './reduce-7v.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// the size file: results-derive-7ac.txt, or another path to show the hash guard refusing a changed copy (rule 6)
const F = process.argv[2] || join(HERE, 'results-derive-7ac.txt'), text = readFileSync(F, 'utf8');
const want = /sha256 ([0-9a-f]+)/.exec(/^- `derive: .*$/m.exec(readFileSync(join(HERE, 'predictions', 'diag-7ac.md'), 'utf8'))[0])[1];
const got = createHash('sha256').update(readFileSync(F)).digest('hex');
if (!got.startsWith(want)) { console.log(`results-derive-7ac.txt is not the registered derivation's output (sha256 ${got.slice(0, 16)}, the prediction's ${want})`); process.exit(1); }
const size = key => {
  const m = new RegExp(`^  ${key}\\s+.*on PRODUCT's survivors \\((\\d+)\\) TS loses (\\d+), TS\\+J against TS (\\d+)/(\\d+)$`, 'm').exec(text);
  if (!m) { console.log(`results-derive-7ac.txt: no size line for ${key}`); process.exit(1); }
  return { n: Number(m[1]), tsLost: Number(m[2]), jSaved: Number(m[3]), jLost: Number(m[4]) };
};
const rec = [size('S126 \\(reader\\) W0\\.02'), size('S194 \\(off\\) W0\\.02')];

const DRAWS = 20000;
let sd = 7002 >>> 0;
const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return Math.max(0, Math.round(m + (u - 6) * Math.sqrt(m))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const drawK = (saved, lost, b, n) => { const l = pois(lost + b), s = pois(saved + b); return { a: n - l - s, lost: l, saved: s, d: 0, N: n }; };
// item 3 and its branch, as reduce-7ac.mjs reads them (items(): i3, h3, o3, branch3)
const read = kp => {
  const g = V.gainFamily([{ id: 'pooled', k: kp, margin: MARGINS.pooled }])[0].o, h = V.harmFamily([{ id: 'pooled', k: kp, margin: MARGINS.pooled }])[0].o;
  const o = g === 'gain' ? 'HELD' : g === 'no material gain' ? 'FALSIFIED' : 'INCONCLUSIVE';
  return o !== 'FALSIFIED' ? o : h === 'harm' ? 'FALSIFIED by a loss' : h === 'no material harm' ? 'FALSIFIED without a loss' : 'FALSIFIED, a loss not ruled out';
};
const STORIES = [
  ['OPEN0 as the product on its survivors (saves TS\'s losses)', r => [r.tsLost, 0]],
  ['OPEN0 as TS+J (TS+J\'s cells against TS)', r => [r.jSaved, r.jLost]],
  ['OPEN0 as TS (the opening carried 7aa\'s item 5)', () => [0, 0]],
  ['OPEN0 losing to TS what TS loses to the product (a loss)', r => [0, r.tsLost]],
];
console.log(`7AC ITEM 3'S BRANCHES: pooled over S126 and S194 on the product's survivors at W0.02 (${rec.map(r => r.n).join(' and ')} paths; TS loses ${rec.map(r => r.tsLost).join(' and ')}; TS+J against TS ${rec.map(r => `${r.jSaved}/${r.jLost}`).join(' and ')}; from results-derive-7ac.txt, sha256 ${got.slice(0, 16)}); ${DRAWS} draws a story (seed 7002); read as reduce-7ac.mjs reads item 3 and its branch (gainFamily and harmFamily at the pooled margin ${MARGINS.pooled})\n`);
for (const b of [0.5, 5, 15]) {
  console.log(`BACKGROUND ${b} PATHS EACH WAY`);
  for (const [nm, f] of STORIES) {
    const t = {};
    for (let d = 0; d < DRAWS; d++) {
      const kp = rec.map(r => { const [s, l] = f(r); return drawK(s, l, b, r.n); }).reduce((x, k) => ({ a: x.a + k.a, lost: x.lost + k.lost, saved: x.saved + k.saved, d: 0, N: x.N + k.N }), { a: 0, lost: 0, saved: 0, d: 0, N: 0 });
      const o = read(kp); t[o] = (t[o] || 0) + 1;
    }
    console.log(`  ${nm.padEnd(60)} ${Object.keys(t).sort().map(k => `${k} ${(t[k] / DRAWS).toFixed(3)}`).join('  ')}`);
  }
  console.log('');
}
