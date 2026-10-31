/*
 * THE MIXTURE RULE'S RATES, MEASURED (stats.mjs mixtureChange and mixtureOutcome; the maintainer's decision of 18 Oct, PLAN.md's
 * 18 Oct 09:43 row): paired paths drawn in three worlds at given control survival, discordance and true per-world changes,
 * 4,000 a world, read by the rule. At a true weighted loss exactly at the margin the rate of "no material harm" should stay at
 * or under 2.5% (the one-sided error of a 95% interval); at a true change of zero the rate of "harm" too. The losses sit evenly
 * across worlds, as a trade (the bad world loses, the good gains), or in the middle world alone.
 *   node research/solver/sim-mixture.mjs > research/solver/results-sim-mixture.txt
 */
import { mixtureChange, mixtureOutcome, mixtureMean, marginRel, MIX3W, MIX_LEVEL } from './stats.mjs';

// mulberry32 (a 32-bit generator in integer arithmetic: a first draft multiplied past 2^53 and lost its low bits, reading 8% to
// 25% where the correct draws read 3% to 4%)
let seed = 20261018 >>> 0;
const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const N = 4000, REPS = Number(process.argv[2] || 20000);
const draw = (p, l, s) => { let a = 0, b = 0, c = 0, d = 0; for (let i = 0; i < N; i++) { const u = rnd(); if (u < p - l) a++; else if (u < p) b++; else if (u < p + s) c++; else d++; } return { a, b, c, d }; };
const run = (name, p, q, delta, margin) => {
  const ls = p.map((pk, k) => [(q[k] - delta[k] / 100) / 2, (q[k] + delta[k] / 100) / 2]);
  if (ls.some(([l, s]) => l < 0 || s < 0)) throw new Error(`${name}: discordance below the change`);
  const T = { 0.05: { 'no material harm': 0, harm: 0, inconclusive: 0 }, [MIX_LEVEL]: { 'no material harm': 0, harm: 0, inconclusive: 0 } };
  for (let r = 0; r < REPS; r++) { const cells = p.map((pk, k) => draw(pk, ls[k][0], ls[k][1])); for (const lv of Object.keys(T)) T[lv][mixtureOutcome(mixtureChange(cells, MIX3W, Number(lv)), margin).outcome]++; }
  const wd = MIX3W.reduce((t, w, k) => t + w * delta[k], 0), f = t => `no material harm ${(100 * t['no material harm'] / REPS).toFixed(2)}%, harm ${(100 * t.harm / REPS).toFixed(2)}%`;
  console.log(`  ${name}: true weighted change ${wd.toFixed(4)} at margin ${margin}: at 95% ${f(T[0.05])}; at ${100 * (1 - MIX_LEVEL)}% (the rule) ${f(T[MIX_LEVEL])}`);
};
console.log(`THE MIXTURE RULE'S RATES (${REPS} draws a row, ${N} paths a world, weights 1/6, 2/3, 1/6; seed 20261018)`);
const S362 = [0.2975, 0.49875, 0.6765], Q362 = [0.0078, 0.0058, 0.007], m362 = marginRel(49.48);
console.log('\nS362-like (survival 29.75, 49.875, 67.65; discordance as FOOT-S366 found, 0.78%, 0.58%, 0.70%):');
run('even loss at the margin', S362, Q362, [-0.5, -0.5, -0.5], m362);
run('a trade at the margin (bad -1.7, middle -0.5, good +0.7)', S362, [0.02, 0.0058, 0.0075], [-1.7, -0.5, 0.7], m362);
run('the middle world alone at the margin', S362, [0.0078, 0.0085, 0.007], [0, -0.75, 0], m362);
run('no change', S362, Q362, [0, 0, 0], m362);
run('FOOT-S366\'s trade (bad -0.575, middle +0.025, good +0.55)', S362, Q362, [-0.575, 0.025, 0.55], m362);
const MID = [0.6, 0.8, 0.9], QM = [0.02, 0.02, 0.02], mM = marginRel(78.33);
console.log('\nmid survival (60, 80, 90; discordance 2% a world):');
run('even loss at the margin', MID, QM, [-0.5, -0.5, -0.5], mM);
run('a trade at the margin (bad -1.7, middle -0.5, good +0.7)', MID, QM, [-1.7, -0.5, 0.7], mM);
run('no change', MID, QM, [0, 0, 0], mM);
const HI = [0.978, 0.999, 0.9995], QH = [0.006, 0.003, 0.003], mH = marginRel(99.53);
console.log('\nhigh survival (97.8, 99.9, 99.95; discordance 0.6%, 0.3%, 0.3%):');
run('even loss at the margin', HI, QH, [-0.25, -0.25, -0.25], mH);
run('the bad world alone (-1.5, a weighted -0.25)', HI, [0.016, 0.003, 0.003], [-1.5, 0, 0], mH);
run('no change', HI, QH, [0, 0, 0], mH);
// the whole score's form (mixtureMean): each path's difference the survival change (+-100 on a discordant path) plus a continuous
// part (the estate, cuts and raises: normal, sd 0.3 points) on every path, the true weighted mean at minus the margin
const runMean = (name, q, delta, margin, reps) => {
  let nmh = 0, harm = 0;
  for (let r = 0; r < reps; r++) {
    const pairs = q.map((qk, k) => { const A = new Float64Array(N), B = new Float64Array(N), l = (qk - delta[k] / 100) / 2; for (let i = 0; i < N; i++) { const u = rnd(), e = 0.3 * Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd()); B[i] = (u < l ? -100 : u < qk ? 100 : 0) + e; } return { A, B }; });
    const m = mixtureMean(pairs); if (m.lo > -margin) nmh++; else if (m.hi < 0 && -m.d >= margin) harm++;
  }
  console.log(`  ${name}: at ${100 * (1 - MIX_LEVEL)}% no material harm ${(100 * nmh / reps).toFixed(2)}%, harm ${(100 * harm / reps).toFixed(2)}%`);
};
console.log('\nthe whole score (mixtureMean), S362-like discordance, a continuous part of sd 0.3 points a path:');
runMean('even loss at the margin', Q362, [-0.5, -0.5, -0.5], m362, 4000);
runMean('a trade at the margin (bad -1.7, middle -0.5, good +0.7)', [0.02, 0.0058, 0.0075], [-1.7, -0.5, 0.7], m362, 4000);
runMean('no change', Q362, [0, 0, 0], m362, 4000);
