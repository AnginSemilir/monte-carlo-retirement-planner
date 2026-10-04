/*
 * 7AU'S DERIVATION (predictions/diag-7au.md): the slice, the power and the time, from P's records (results/diagP, through
 * P's parse; the traces P's own) before 7au runs.
 *   1. S194's node slice at P's charge: each path's whole score (reduce-7aa.mjs wholePaths, P's configuration) under WA less
 *      under OPEN2 (P's traces at 0.001, 16,000 node paths): its mean, sd and se, survival saved/lost.
 *   2. Item 1's power (the learner's share of the slice): a learner recovering a share s is modelled as taking WA's path
 *      outcome on a random fraction s of the paths and OPEN2's elsewhere (d_L = B d_W, B ~ Bernoulli(s); declared, not
 *      derived: a real learner's gains need not be a random subset of WA's). Each of 400 replicates applies item 1's rule with
 *      the normal approximation to the paired randomization test (n 16,000; declared): the premise, then LEARNABLE when
 *      mean(d_L - 2/3 d_W) > 0 and NOT LEARNABLE when mean(d_W/3 - d_L) > 0, one-sided at 0.05 after Holm over the two.
 *   3. Item 2's power (no material harm across all worlds): the churn the records show between two nearby choosers on the
 *      same paths - P's TS+J at 0.001 against TS+J at the margin 1e-3 (16,000 paths, each unit) - as the learner's discordance
 *      under a true change of 0; 4,000 replicates splitting it evenly, the exact rule (Holm over the three legs) at the unit's
 *      margin; and the whole score's half-width from the same pair (wholeLeg at 0.05).
 *   4. The time, from 7as's printed seconds (results/diag7as): solve, node and all-world runs a path.
 *   node research/solver/derive-7au.mjs > research/solver/results-derive-7au.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { mcnemarHarmP, holm, outcome, marginFor } from './stats.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import * as F from './reduce-7af.mjs';
import * as P from './reduce-P.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIRP = join(HERE, 'results', 'diagP'), DIRS = join(HERE, 'results', 'diag7as');
const logs = d => readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8'));
const jobsP = logs(DIRP).flatMap(P.parse);
const tagP = (id, m) => { const j = jobsP.find(x => x.kind === `core:${m}` && x.id === id); return j ? j.tags[m] : null; };
const tr = (id, arm, m, rule, w, where) => decode(JSON.parse(gunzipSync(readFileSync(join(DIRP, P.traceName(id, arm, m, rule, w, where)))).toString()));
const cfgOf = (id, X, Y) => { const u = tagP(id, 'P'); return { lambda: Number(P.field(u.ran, 'lambda')), floor: Math.min(...P.field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(P.CORE.find(c => c[0] === id)[2]), spendYears: F.spendYears(X, Y) }; };
const mean = xs => xs.reduce((t, x) => t + x, 0) / xs.length, sd = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((t, x) => t + (x - m) ** 2, 0) / (xs.length - 1)); };
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`, f4 = x => x.toFixed(4);
// mulberry32 (a 32-bit generator in integer arithmetic; an LCG in doubles loses its low bits past 2^53)
let seed = 7004; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pOne = xs => { const m = mean(xs), s = sd(xs) / Math.sqrt(xs.length); if (!(s > 0)) return m > 0 ? 0 : 1; const z = m / s; return 0.5 * erfc(z / Math.SQRT2); };
function erfc(x) { const t = 1 / (1 + 0.5 * Math.abs(x)), y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? y : 2 - y; }

console.log('7AU DERIVATION (predictions/diag-7au.md): from P\'s records (results/diagP) and 7as\'s seconds (results/diag7as)');
// 1. the slice
const O = tr('S194', 'OFF', 'P', 'OPEN2', '0.02', 'world0'), W = tr('S194', 'OFF', 'P', 'WA', '0.02', 'world0');
const cfg = cfgOf('S194', O, W), wo = A.wholePaths(O, cfg), ww = A.wholePaths(W, cfg), dW = Array.from(ww, (v, j) => v - wo[j]);
const kOW = cells(O.survived, W.survived);
console.log(`\n1. S194'S NODE SLICE AT P'S CHARGE (WA less OPEN2, ${dW.length} node paths): whole ${f3(mean(dW))} a path (sd ${sd(dW).toFixed(3)}, se ${(sd(dW) / Math.sqrt(dW.length)).toFixed(4)}); survival WA ${O.N ? (100 * W.survived.reduce((t, x) => t + x, 0) / W.N).toFixed(4) : '-'} against OPEN2 ${(100 * O.survived.reduce((t, x) => t + x, 0) / O.N).toFixed(4)} (saved ${kOW.saved}, lost ${kOW.lost})`);
console.log(`   paths whose whole score differs: ${dW.filter(x => Math.abs(x) > 1e-9).length} of ${dW.length}`);
// 2. item 1's power
const R1 = 400, shares = [0, 0.2, 1 / 3, 0.5, 2 / 3, 0.75, 0.8, 1];
console.log(`\n2. ITEM 1'S POWER (${R1} replicates a share; d_L = B d_W, B ~ Bernoulli(s); the normal approximation, Holm over the two directions):`);
console.log('   share s   premise  LEARNABLE  NOT LEARNABLE  INCONCLUSIVE');
for (const s of shares) {
  let prem = 0, le = 0, nl = 0, inc = 0;
  for (let r = 0; r < R1; r++) {
    // resample paths (the bootstrap: the run's paths are a fresh draw of the same size) and the learner's subset
    const idx = Array.from({ length: dW.length }, () => Math.floor(rnd() * dW.length)), dw = idx.map(j => dW[j]), dl = dw.map(x => (rnd() < s ? x : 0));
    const pS = pOne(dw);
    if (!(pS < 0.05 && mean(dw) > 0)) { inc++; continue; }
    prem++;
    const [hU, hD] = holm([pOne(dl.map((x, j) => x - (2 / 3) * dw[j])), pOne(dl.map((x, j) => dw[j] / 3 - x))]);
    if (hU < 0.05) le++; else if (hD < 0.05) nl++; else inc++;
  }
  console.log(`   ${s.toFixed(3).padStart(7)}   ${f4(prem / R1)}   ${f4(le / R1)}     ${f4(nl / R1)}         ${f4(inc / R1)}`);
}
// 3. item 2's power
console.log('\n3. ITEM 2\'S POWER (a true change of 0 with the churn of P\'s TS+J at 0.001 against 1e-3 across all worlds, 16,000 paths; 4,000 replicates; the exact rule with Holm over three legs; the whole score\'s half-width):');
const legs = P.CORE.map(([id, arm, w]) => { const X = tr(id, arm, '1e-3', 'TS+J', w, 'all'), Y = tr(id, arm, 'P', 'TS+J', w, 'all'), k = cells(X.survived, Y.survived), wl = A.wholeLeg(X, Y, cfgOf(id, X, Y), 0.05), sv = 100 * Y.survived.reduce((t, x) => t + x, 0) / Y.N; return { id, k, wl, mg: marginFor(sv), sv }; });
const R2 = 4000; let allNo = 0;
const perLeg = legs.map(() => 0);
for (let r = 0; r < R2; r++) {
  const sims = legs.map(l => { const d = l.k.lost + l.k.saved; let lost = 0; for (let i = 0; i < d; i++) if (rnd() < 0.5) lost++; return { lost, saved: d - lost, N: l.k.N, mg: l.mg }; });
  const h = holm(sims.map(x => mcnemarHarmP(x.lost, x.saved)));
  const ok = sims.map((x, i) => outcome({ b: x.lost, c: x.saved, N: x.N, margin: x.mg, pHolm: h[i], level: 0.05 }).outcome === 'no material harm');
  ok.forEach((v, i) => { if (v) perLeg[i]++; }); if (ok.every(Boolean)) allNo++;
}
legs.forEach((l, i) => console.log(`   ${l.id.padEnd(9)} survival ${l.sv.toFixed(3)} margin ${l.mg}; churn ${l.k.saved} saved/${l.k.lost} lost of ${l.k.N}; P(no material harm) ${f4(perLeg[i] / R2)}; whole score ${f3(l.wl.d)} (${l.wl.lo.toFixed(3)} to ${l.wl.hi.toFixed(3)}), half-width ${((l.wl.hi - l.wl.lo) / 2).toFixed(3)}`));
console.log(`   all three legs no material harm by survival: ${f4(allNo / R2)}`);
// 4. the time
const secs = logs(DIRS).join('\n');
const grab = re => [...secs.matchAll(re)].map(m => Number(m[1]));
const solve = grab(/ solve \S+: table \S+ secs (\d+)/g), node = grab(/ node \S+ 0 z \S+: .* paths 16000 secs (\d+)/g), allw = grab(/ all \S+: TS\+J \S+ held0 \d+ paths 8000 secs (\d+)/g);
const ms = mean(solve), mrule = mean(node) / 3 / 16000, mall = mean(allw) / 8000;
const nodeJob = ms + 2 * 16000 * mrule + 2 * 2000 * mrule, allJob = ms + 2 * 16000 * mall + 2000 * mall;
console.log(`\n4. THE TIME (7as's seconds, the same code): a solve ${ms.toFixed(0)} s (${solve.length} solves); a node rule ${(mrule * 1000).toFixed(1)} ms a path; an all-world run ${(mall * 1000).toFixed(1)} ms a path (the learner's overhead NOT CHECKED: the posterior is a few operations a year beside chooseAction's scoring)`);
console.log(`   node:L (two rules on 16,000, two on 2,000) ${(nodeJob / 3600).toFixed(2)} h; each all:L (two rules on 16,000, one on 2,000) ${(allJob / 3600).toFixed(2)} h; total ${((nodeJob + 3 * allJob) / 3600).toFixed(1)} core-hours, the longest job ${(Math.max(nodeJob, allJob) / 3600).toFixed(2)} h on four cores`);
// 5. the learner's pace at the node (learn.mjs: one risky pot a year, signal x = S z + V e; S/V about 0.125 to 0.13 on
// S126's tiers, its header): on a path at world 0's node the expected log-likelihood gain of world 0 over world 1 is
// (S/V)^2 (z0 - z1)^2 / 2 a year; the posterior weight on world 0 along that expected path from the prior 1/6, 2/3, 1/6 (world 2
// falls away faster: twice the distance). No noise: the median path's pace, not its spread.
{
  const z = [-Math.sqrt(3), 0, Math.sqrt(3)], prior = [1 / 6, 2 / 3, 1 / 6];
  console.log('\n5. THE LEARNER\'S PACE AT WORLD 0\'S NODE (the expected-evidence path; S/V from learn.mjs\'s header):');
  for (const sv of [0.125, 0.13]) {
    const row = [1, 5, 10, 15, 25].map(t => { const l = z.map(zk => -t * sv * sv * (zk - z[0]) ** 2 / 2), w = prior.map((p, k) => p * Math.exp(l[k])), s = w.reduce((a, b) => a + b, 0); return `year ${t} ${(w[0] / s).toFixed(3)}`; });
    console.log(`   S/V ${sv}: a year's log-odds gain over world 1 ${(sv * sv * 3 / 2).toFixed(4)}; the weight on world 0: ${row.join(', ')} (WA's: 1)`);
  }
}
