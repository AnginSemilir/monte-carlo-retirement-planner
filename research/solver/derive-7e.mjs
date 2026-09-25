/*
 * 7e'S POWER, DERIVED (predictions/bridge-reader.md, field "Power"; the regimen's rule that a prediction's arithmetic is a
 * committed script). The nearest earlier record for the reader against off is 7c's v2 against off on the same cases
 * (results-f1v2.txt: 1,000 paths of seed 7002, final year averaged): both change the bridge read, and v2's changes of
 * move are where the reader's are expected. Per case:
 *   discordant paths n = (se x N / 100)^2 (the review's A1: se is sqrt(n) / N in points), rounded
 *   margin 0.25 points where off simulates 95% or more, 0.5 below (the regimen's margins)
 *   the exact interval's half-width is about 1.96 sqrt(n) / N x 100 points; look 1 can show no material harm when it
 *   fits inside the margin; paths needed N > 1.96^2 d / delta^2 with d = n / N (the review's section 16 item 7)
 * The cases 7c did not run (S162, S172, S168) have no record for this comparison: NOT KNOWN, left to look 2. The
 * no-bridge controls have no reader table, so no discordant path by construction (reader-solve.test.mjs pins it on S000).
 * The smallest harm look 2 can show: with the discordance scaled to 3,000 paths (3n), the least net loss k whose exact
 * p, times Holm's largest multiplier (24), is below 0.045 - in points, k / 3000 x 100. A smaller true loss reads
 * inconclusive or no material harm, never harm.
 *   node research/solver/derive-7e.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathsNeeded, mcnemarHarmP, pooledRE } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = 'results-f1v2.txt', text = readFileSync(join(HERE, SRC), 'utf8'), N = 1000;
const rows = [];
for (const l of text.split('\n')) {
  const m = /^(\S.{0,15}?)\s+a0 [\d.]+ B \d+ class \S+\s*\| OFF table\s+[\d.]+ sim\s+([\d.]+) .*\| survival ([+-][\d.]+) \+\/- ([\d.]+)/.exec(l);
  if (!m) continue;
  const [id, offSim, d, se] = [m[1].trim(), +m[2], +m[3], +m[4]];
  const n = Math.round((se * N / 100) ** 2), margin = offSim >= 95 ? 0.25 : 0.5;
  const half = k => 196 * Math.sqrt(n * k / N) / k;   // points, at k paths: the discordance scales with the paths (n k / N)
  const n3 = 3 * n; let k = 1; while (k <= n3 && mcnemarHarmP(Math.ceil((n3 + k) / 2), Math.floor((n3 - k) / 2)) * 24 >= 0.045) k++;
  rows.push({ id, offSim, d, se, n, margin, h1: half(N), h3: half(3000), need: n ? pathsNeeded(n / N, margin / 100) : 0, minHarm: Math.max(k, margin * 30) / 30 });
}
console.log(`# node research/solver/derive-7e.mjs - 7e's power from ${SRC} (7c: v2 against off, ${N} paths)`);
console.log('case             off sim  change  se    discordant  margin  half-width @1000  @3000  paths needed  look 1 expected   least harm shown at 3,000');
for (const r of rows) {
  const at1 = r.h1 < r.margin ? 'decides' : r.h3 < r.margin ? 'look 2 decides' : 'may stay open';
  console.log(`${r.id.padEnd(16)} ${r.offSim.toFixed(1).padStart(6)}  ${(r.d >= 0 ? '+' : '') + r.d.toFixed(2)}  ${r.se.toFixed(2)}  ${String(r.n).padStart(6)}      ${r.margin.toFixed(2)}    ${r.h1.toFixed(2).padStart(5)}             ${r.h3.toFixed(2).padStart(5)}  ${String(r.need).padStart(8)}      ${at1.padEnd(16)}  ${r.minHarm.toFixed(2)}`);
}
const open1 = rows.filter(r => r.h1 >= r.margin), open3 = rows.filter(r => r.h3 >= r.margin);
console.log(`\n${rows.length} cases with a record; look 1 expected to leave open ${open1.length} (${open1.map(r => r.id).join(', ')}); still open after look 2: ${open3.length} (${open3.map(r => r.id).join(', ') || 'none'})`);
console.log('The half-width test assumes a true change near zero. A case with a large gain clears the margin whatever its width: with v2,');
console.log(`${rows.filter(r => r.d - r.h1 > 0).map(r => `${r.id} ${r.d >= 0 ? '+' : ''}${r.d.toFixed(2)}`).join(', ')} lay above zero by more than the look-1 half-width.`);
console.log('NOT KNOWN (no record for this comparison): S162, S172, S168. The no-bridge controls S194, S252, S330: 0 discordant by construction.');

// THE POOLED FLOOR (the forty-seventh review's BLOCKING 1): the random-effects interval over the pool, each case at its
// expected look (3,000 paths where look 1 is expected to leave it open, else 1,000), its discordance scaled to the paths,
// under three scenarios. The pool is the cases the prediction expects unchanged (reduce-7e.mjs POOL); the three without a
// record for this comparison (S162, S172, S168) are given the median discordance of the recorded pool cases (declared).
const POOL = ['S126', 'share 0.90', 'bridge 1', 'bridge 4', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S124', 'S128', 'S130', 'bridge 6', 'S366', 'S162', 'S172', 'S168'];
const byId = Object.fromEntries(rows.map(r => [r.id, r]));
const med = (() => { const ns = POOL.filter(id => byId[id]).map(id => byId[id].n).sort((a, b) => a - b); return ns[Math.floor(ns.length / 2)]; })();
const poolCase = (id, dPts) => { const r = byId[id], n1 = r ? r.n : med, open = r ? r.h1 >= r.margin : false, Nn = open ? 3000 : N, n = Math.round(n1 * Nn / N), net = Math.round(dPts * Nn / 100);
  const c = Math.max(0, Math.round((n + net) / 2)), b = Math.max(0, c - net); return { b, c, N: Nn }; };
const scen = (name, d) => { const pr = pooledRE(POOL.map(id => poolCase(id, d(id)))); return `${name.padEnd(62)} ${pr.mean >= 0 ? '+' : ''}${pr.mean.toFixed(3)}  (${pr.lo.toFixed(3)} to ${pr.hi.toFixed(3)})  ${pr.lo > -0.1 ? 'above -0.1' : 'NOT above -0.1'}`; };
console.log(`\nThe pooled floor over the ${POOL.length} cases expected unchanged (median discordance ${med} for S162, S172, S168; each case at its expected look):`);
console.log(scen('no change on any case', () => 0));
console.log(scen('S130 gains 1 point (its 80% upper bound), the rest unchanged', id => (id === 'S130' ? 1 : 0)));
console.log(scen('S128 loses 1 point (its 80% lower bound), the rest unchanged', id => (id === 'S128' ? -1 : 0)));
console.log(scen('every case loses 0.2 points (a small systematic cost)', () => -0.2));
