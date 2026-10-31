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
 * Look 2's paths (the maintainer, 25 Sep 22:45 UK, the forty-eighth review's BLOCKING 1): 8,000 for bridge 4, wealth
 * x0.5, S130 and S128 (reduce-7e.mjs LONG), 3,000 for the rest. Beside the half-width, the exact lower end at look 2
 * under no change (b = c = half the scaled discordance; stats.mjs outcome at 0.045), which decides where the
 * approximation is close. The smallest harm look 2 can show: with the discordance scaled to look 2's paths, the least
 * net loss k whose exact p, times Holm's largest multiplier (24), is below 0.045 - in points, k / paths x 100. A smaller
 * true loss reads inconclusive or no material harm, never harm.
 *   node research/solver/derive-7e.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathsNeeded, mcnemarHarmP, pooledRE, pooledFE, outcome } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = 'results-f1v2.txt', text = readFileSync(join(HERE, SRC), 'utf8'), N = 1000;
const LONG = ['bridge 4', 'wealth x0.5', 'S130', 'S128'], L2 = id => (LONG.includes(id) ? 8000 : 3000);
const rows = [];
for (const l of text.split('\n')) {
  const m = /^(\S.{0,15}?)\s+a0 [\d.]+ B \d+ class \S+\s*\| OFF table\s+[\d.]+ sim\s+([\d.]+) .*\| survival ([+-][\d.]+) \+\/- ([\d.]+)/.exec(l);
  if (!m) continue;
  const [id, offSim, d, se] = [m[1].trim(), +m[2], +m[3], +m[4]];
  const n = Math.round((se * N / 100) ** 2), margin = offSim >= 95 ? 0.25 : 0.5;
  const half = k => 196 * Math.sqrt(n * k / N) / k;   // points, at k paths: the discordance scales with the paths (n k / N)
  const P2 = L2(id), n2 = n * P2 / N; let k = 1; while (k <= n2 && mcnemarHarmP(Math.ceil((n2 + k) / 2), Math.floor((n2 - k) / 2)) * 24 >= 0.045) k++;
  const ex = outcome({ b: n2 / 2, c: n2 / 2, N: P2, margin, pHolm: 1, level: 0.045 });
  rows.push({ id, offSim, d, se, n, margin, P2, h1: half(N), h2: half(P2), ex, need: n ? pathsNeeded(n / N, margin / 100) : 0, minHarm: Math.max(k, margin * P2 / 100) / P2 * 100 });
}
console.log(`# node research/solver/derive-7e.mjs - 7e's power from ${SRC} (7c: v2 against off, ${N} paths)`);
console.log('case             off sim  change  se    discordant  margin  half-width @1000  look 2 paths  half-width  exact lower end, no change  paths needed  expected          least harm shown at look 2');
for (const r of rows) {
  const at = r.h1 < r.margin ? 'decides at look 1' : r.ex.outcome === 'no material harm' ? 'look 2 decides' : 'may stay open';
  console.log(`${r.id.padEnd(16)} ${r.offSim.toFixed(1).padStart(6)}  ${(r.d >= 0 ? '+' : '') + r.d.toFixed(2)}  ${r.se.toFixed(2)}  ${String(r.n).padStart(6)}      ${r.margin.toFixed(2)}    ${r.h1.toFixed(2).padStart(5)}             ${String(r.P2).padStart(5)}        ${r.h2.toFixed(2).padStart(5)}       ${r.ex.lo.toFixed(3).padStart(7)}                    ${String(r.need).padStart(8)}      ${at.padEnd(17)} ${r.minHarm.toFixed(2)}`);
}
const open1 = rows.filter(r => r.h1 >= r.margin), open3 = rows.filter(r => r.h1 >= r.margin && r.ex.outcome !== 'no material harm');
console.log(`\n${rows.length} cases with a record; look 1 expected to leave open ${open1.length} (${open1.map(r => r.id).join(', ')}); still open after look 2 if the true change is zero (exact): ${open3.length} (${open3.map(r => r.id).join(', ') || 'none'})`);
console.log('The half-width test assumes a true change near zero. A case with a large gain clears the margin whatever its width: with v2,');
console.log(`${rows.filter(r => r.d - r.h1 > 0).map(r => `${r.id} ${r.d >= 0 ? '+' : ''}${r.d.toFixed(2)}`).join(', ')} lay above zero by more than the look-1 half-width.`);
console.log('NOT KNOWN (no record for this comparison): S162, S172, S168. The no-bridge controls S194, S252, S330: 0 discordant by construction.');

// THE POOLED FLOOR (the forty-seventh review's BLOCKING 1; fixed effect since the maintainer's choice, 25 Sep 22:45 UK,
// the forty-eighth review's MINOR 2): the fixed-effect interval over the pool, random effects beside it, each case at its
// expected look (its look-2 paths where look 1 is expected to leave it open, else 1,000), its discordance scaled to the
// paths, under five scenarios. The pool is the cases the prediction expects unchanged (reduce-7e.mjs POOL); the three without a
// record for this comparison (S162, S172, S168) are given the median discordance of the recorded pool cases (declared).
const POOL = ['S126', 'share 0.90', 'bridge 1', 'bridge 4', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S124', 'S128', 'S130', 'bridge 6', 'S366', 'S162', 'S172', 'S168'];
const byId = Object.fromEntries(rows.map(r => [r.id, r]));
const med = (() => { const ns = POOL.filter(id => byId[id]).map(id => byId[id].n).sort((a, b) => a - b); return ns[Math.floor(ns.length / 2)]; })();
const poolCase = (id, dPts) => { const r = byId[id], n1 = r ? r.n : med, open = r ? r.h1 >= r.margin : false, Nn = open ? L2(id) : N, n = Math.round(n1 * Nn / N), net = Math.round(dPts * Nn / 100);
  const c = Math.max(0, Math.round((n + net) / 2)), b = Math.max(0, c - net); return { b, c, N: Nn }; };
const sg = x => `${x.mean >= 0 ? '+' : ''}${x.mean.toFixed(3)}  (${x.lo.toFixed(3)} to ${x.hi.toFixed(3)})`;
const scen = (name, d) => { const cs = POOL.map(id => poolCase(id, d(id))), fe = pooledFE(cs), re = pooledRE(cs); return `${name.padEnd(62)} ${sg(fe)}  ${fe.lo > -0.1 ? 'above -0.1' : 'NOT above -0.1'}    random effects ${sg(re)}`; };
console.log(`\nThe pooled floor (fixed effect; random effects reported beside it) over the ${POOL.length} cases expected unchanged (median discordance ${med} for S162, S172, S168; each case at its expected look):`);
console.log(scen('no change on any case', () => 0));
console.log(scen('S130 gains 1 point (its 80% upper bound), the rest unchanged', id => (id === 'S130' ? 1 : 0)));
console.log(scen('S128 loses 1 point (its 80% lower bound), the rest unchanged', id => (id === 'S128' ? -1 : 0)));
console.log(scen('S124 gains 3 points, the rest unchanged', id => (id === 'S124' ? 3 : 0)));
console.log(scen('bridge 4 gains 3 points, the rest unchanged', id => (id === 'bridge 4' ? 3 : 0)));
console.log(scen('every case loses 0.2 points (a small systematic cost)', () => -0.2));
