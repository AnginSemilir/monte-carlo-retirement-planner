// XAS's sizes and power (predictions/diag-xas.md), from COV-B-STEP's saved fixed reads (results/diagcovb; through
// reduce-covb.mjs's gate and stamp check first, rule 3 - reduce-xas.mjs covbFiles):
//   1. per household, arm and reader year: reads, mean D = read - claim and its per-path sd - the size each item splits,
//      and the noise the draw term carries (the claim's year-to-year spread);
//   2. item 1's and item 2's power at an ASSUMED spread: the per-path sd of y = rep - quad taken as D's. Not a bound (the
//      plan-auditor's BLOCKING 1 of 5 Oct 10:09 UK): var(rep - quad) = var(rep + quad) - 4 cov(rep, quad), and rep and quad
//      share ex5 with opposite signs, so cov is negative where the 5-point value errs and sd(y) can exceed sd(D) less the
//      draw; grade C. The reducer prints the realised sd(y) and the detectable |mean y| beside each item;
//   3. the cost: COV-B-STEP's solve seconds for BASE and COV (its solve lines), the fixed re-read's seconds (its moves lines)
//      times the extra scoring (two arms x three one-step values against one chooseAction a read), S126's swap at two
//      forward runs an arm; four households on four cores.
//   node research/solver/derive-xas.mjs > research/solver/results-derive-xas.txt
// e3 off: no solve is run here
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { covbFiles } from './reduce-xas.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagcovb');
const C = covbFiles(DIR);
if (C.bad.length) { console.log(`GATE: FAILED\n  ${C.bad.join('\n  ')}`); process.exit(1); }
console.log('GATE: passed (reduce-covb.mjs\'s gate and the fair-gate stamp check over results/diagcovb)');
const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
const sd = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };
const e = x => x.toExponential(3);
const IDS = ['S370', 'S130', 'bridge 4', 'S126'];

console.log('\n1. D = read - claim by household, arm and reader year (COV-B-STEP\'s fixed reads at BASE\'s states)');
const SD = {};
for (const id of IDS) {
  const F = C.files[id].fixed, yrs = [...new Set(F.t)].sort((a, b) => a - b);
  for (const a of ['BASE', 'COV']) for (const t of yrs) {
    const J = F.t.map((x, j) => (x === t ? j : -1)).filter(j => j >= 0), d = J.map(j => F.arms[a].read[j] - F.arms[a].claim[j]);
    SD[`${id} ${a} ${t}`] = sd(d);
    console.log(`  ${id.padEnd(9)} ${a.padEnd(4)} year ${t} ${F.kind[J[0]] ? 'step  ' : 'spread'}: reads ${J.length} mean D ${e(mean(d))} sd ${e(sd(d))}`);
  }
}

console.log('\n2. POWER AT AN ASSUMED SPREAD (grade C): the smallest |mean y| shown after Holm if y = rep - quad has a per-path sd equal to D\'s; not a bound - the reducer prints the realised sd(y) beside each item');
const z = p => { let lo = 0, hi = 10; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; (0.5 * (1 + erf(m / Math.SQRT2)) < 1 - p ? (lo = m) : (hi = m)); } return lo; };
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
{
  const F = C.files.S370.fixed, steps = [...new Set(F.t.filter((_, j) => F.kind[j] === 1))], before = steps.map(s => s - 1);
  // item 1: COV, S370, the years before each step, a path's reads summed (two years: the sd of a sum at most twice one year's)
  const s1 = before.reduce((s, t) => s + SD[`S370 COV ${t}`], 0), n1 = 6000, mdd1 = (z(0.05 / 2) + z(0.2)) * s1 / Math.sqrt(n1);
  const Dbef = before.map(t => { const J = F.t.map((x, j) => (x === t ? j : -1)).filter(j => j >= 0); return mean(J.map(j => F.arms.COV.read[j] - F.arms.COV.claim[j])); });
  console.log(`  item 1 (COV, S370, years ${before.join(', ')}): per-path sd taken as ${e(s1)}; 80% power after Holm over 2 for |mean y| ${e(mdd1)} a path, against COV's mean D there ${Dbef.map(e).join(' and ')} (summed ${e(Dbef.reduce((s, x) => s + x, 0))})`);
  for (const id of ['S370', 'S130']) {
    const G = C.files[id].fixed, st = [...new Set(G.t.filter((_, j) => G.kind[j] === 1))], s2 = st.reduce((s, t) => s + SD[`${id} BASE ${t}`], 0), n2 = 6000;
    const mdd2 = (z(0.05 / 4) + z(0.2)) * s2 / Math.sqrt(n2);
    const Dst = st.map(t => { const J = G.t.map((x, j) => (x === t ? j : -1)).filter(j => j >= 0); return mean(J.map(j => G.arms.BASE.read[j] - G.arms.BASE.claim[j])); });
    console.log(`  item 2 (BASE, ${id}, step years ${st.join(', ')}): per-path sd taken as ${e(s2)}; 80% power after Holm over 4 for |mean y| ${e(mdd2)} a path, against BASE's mean D ${Dst.map(e).join(' and ')}`);
  }
}

console.log('\n3. THE COST (COV-B-STEP\'s seconds, measured under its own load)');
let tot = 0, longest = 0;
for (const f of readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).sort()) {
  const txt = readFileSync(join(DIR, f), 'utf8'), id = (/^(\S.*?)\s+case \|/m.exec(txt) || [])[1];
  if (!IDS.includes(id && id.trim())) continue;
  const sec = a => Number((new RegExp(`solve ${a}: secs (\\d+)`).exec(txt) || [])[1]);
  const mv = Number((/moves COV: .* secs (\d+)/.exec(txt) || [])[1]), fw = [...txt.matchAll(/sum (BASE|COV): .* secs (\d+)/g)].reduce((s, m) => s + Number(m[2]), 0);
  // the re-read: chooseAction a read (COV-B-STEP's, one arm's chooser beside BASE's) becomes BASE's chooser plus, a read and arm,
  // three one-step scorings (5 points, 41 points, and stepExpect for BASE), each about one world's chooser: x4 as a bound
  const t = sec('BASE') + sec('COV') + 4 * mv + (id.trim() === 'S126' ? 2 * fw : 0);
  tot += t; longest = Math.max(longest, t);
  console.log(`  ${id.trim().padEnd(9)} solves ${sec('BASE')} + ${sec('COV')} s; re-read ${mv} s x 4; ${id.trim() === 'S126' ? `swap ${2 * fw} s; ` : ''}${(t / 3600).toFixed(2)} core-hours`);
}
console.log(`  total ${(tot / 3600).toFixed(1)} core-hours; one process a household on four cores: ${(longest / 3600).toFixed(2)} hours (an upper estimate, grade C)`);

// 4. THE CREDENCES, DERIVED (the deep review of the prediction record, deep-review-log.md 5 Oct 10:16 UK: credences were
// judged, never computed from the Power section's stories, and XAS item 1's contradicted its own point). Each item's
// outcome probabilities as a mixture over stated priors, mapped through the decision bands:
//   item 1: the representation's share s of read - exF in S370's years before the steps, prior normal (point, sd from the
//     80% interval). y = rep - quad has mean (2s - 1) x D, so REP (HELD) when 2s - 1 is above the detectable fraction f of
//     D, QUAD (FALSIFIED) when below -f, SPLIT otherwise. f is not known before the run (sd(y) is not bounded by sd(D), the
//     plan-auditor's BLOCKING 1 of 5 Oct 10:09 UK): an even mixture of f at section 2's assumed spread and at twice it.
//   item 2: per household the probability that the step reads read REP, from two stories - (a) at the last step year the
//     next year has no reader step, so the 5-point quadrature crosses no cliff and quad is small (the build check at 4
//     points printed quad 3.3e-6 against rep 1.5e-1 on S370 and -3.4e-9 against 2.3e-1 on S130; grade C: 4 points, 9
//     paths a world); (b) the anchoring discount: a deep review's ranked cause read as ranked in 1 of 19 items, so with
//     weight w the household reads as a coin among the three outcomes. HELD needs both households (a conjunction,
//     the households' stories taken as independent - an upper bound on the spread, not on HELD).
console.log('\n4. THE CREDENCES, DERIVED FROM STATED PRIORS (grade C: the priors are judged, the arithmetic is not)');
const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
{
  const point = 0.5, lo80 = 0.2, hi80 = 0.8, sdS = (hi80 - lo80) / (2 * 1.2816);
  const F = C.files.S370.fixed, steps = [...new Set(F.t.filter((_, j) => F.kind[j] === 1))], before = steps.map(s => s - 1);
  const s1 = before.reduce((s, t) => s + SD[`S370 COV ${t}`], 0), mdd1 = (z(0.05 / 2) + z(0.2)) * s1 / Math.sqrt(6000);
  const Dsum = before.reduce((acc, t) => { const J = F.t.map((x, j) => (x === t ? j : -1)).filter(j => j >= 0); return acc + mean(J.map(j => F.arms.COV.read[j] - F.arms.COV.claim[j])); }, 0);
  const out = [0, 0, 0];
  for (const mult of [1, 2]) {
    const f = Math.min(0.99, mult * mdd1 / Math.abs(Dsum)), up = (1 + f) / 2, dn = (1 - f) / 2;
    const pH = 1 - Phi((up - point) / sdS), pF = Phi((dn - point) / sdS);
    out[0] += pH / 2; out[1] += (1 - pH - pF) / 2; out[2] += pF / 2;
    console.log(`  item 1 at ${mult}x the assumed spread: detectable fraction ${f.toFixed(3)} of D; HELD when s > ${up.toFixed(3)}, FALSIFIED when s < ${dn.toFixed(3)}: HELD ${pH.toFixed(3)} INCONCLUSIVE ${(1 - pH - pF).toFixed(3)} FALSIFIED ${pF.toFixed(3)}`);
  }
  console.log(`  item 1 (prior s ~ normal(${point}, ${sdS.toFixed(3)}), the 80% interval ${lo80} to ${hi80}): HELD ${out[0].toFixed(2)} INCONCLUSIVE ${out[1].toFixed(2)} FALSIFIED ${out[2].toFixed(2)}`);
  // the line check-prediction.mjs reads (credences derived, the maintainer's unlock of 5 Oct)
  console.log(`CREDENCE item 1: point ${point} HELD ${out[0].toFixed(2)} INCONCLUSIVE ${out[1].toFixed(2)} FALSIFIED ${out[2].toFixed(2)}`);
  const w = 0.3, story = { S370: [0.85, 0.12, 0.03], S130: [0.9, 0.08, 0.02] }, coin = [1 / 3, 1 / 3, 1 / 3];
  const per = Object.fromEntries(Object.entries(story).map(([id, p]) => [id, p.map((x, i) => (1 - w) * x + w * coin[i])]));
  const H = per.S370[0] * per.S130[0], Fz = 1 - (1 - per.S370[2]) * (1 - per.S130[2]);
  for (const [id, p] of Object.entries(per)) console.log(`  item 2 ${id}: story (a) REP ${story[id][0]} SPLIT ${story[id][1]} QUAD ${story[id][2]}, mixed with a coin at weight ${w}: REP ${p[0].toFixed(3)} SPLIT ${p[1].toFixed(3)} QUAD ${p[2].toFixed(3)}`);
  console.log(`  item 2 (both REP for HELD, either QUAD for FALSIFIED): HELD ${H.toFixed(2)} INCONCLUSIVE ${(1 - H - Fz).toFixed(2)} FALSIFIED ${Fz.toFixed(2)}`);
  console.log(`CREDENCE item 2: point - HELD ${H.toFixed(2)} INCONCLUSIVE ${(1 - H - Fz).toFixed(2)} FALSIFIED ${Fz.toFixed(2)}`);
}
