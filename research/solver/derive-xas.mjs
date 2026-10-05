// XAS's sizes and power (predictions/diag-xas.md), from COV-B-STEP's saved fixed reads (results/diagcovb; through
// reduce-covb.mjs's gate and stamp check first, rule 3 - reduce-xas.mjs covbFiles):
//   1. per household, arm and reader year: reads, mean D = read - claim and its per-path sd - the size each item splits,
//      and the noise the draw term carries (the claim's year-to-year spread);
//   2. item 1's and item 2's power: y = rep - quad is a function of the state, with no draw in it, so its per-path spread is
//      bounded above by the spread of D itself (which adds the draw); at that bound, the smallest |mean y| each test shows
//      after Holm (one-sided 0.05/2 and 0.05/4, normal approximation) against the D it splits;
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

console.log('\n2. POWER: the smallest |mean y| shown after Holm, y = rep - quad a path, its sd at most D\'s (the draw removed)');
const z = p => { let lo = 0, hi = 10; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; (0.5 * (1 + erf(m / Math.SQRT2)) < 1 - p ? (lo = m) : (hi = m)); } return lo; };
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
{
  const F = C.files.S370.fixed, steps = [...new Set(F.t.filter((_, j) => F.kind[j] === 1))], before = steps.map(s => s - 1);
  // item 1: COV, S370, the years before each step, a path's reads summed (two years: the sd of a sum at most twice one year's)
  const s1 = before.reduce((s, t) => s + SD[`S370 COV ${t}`], 0), n1 = 6000, mdd1 = (z(0.05 / 2) + z(0.2)) * s1 / Math.sqrt(n1);
  const Dbef = before.map(t => { const J = F.t.map((x, j) => (x === t ? j : -1)).filter(j => j >= 0); return mean(J.map(j => F.arms.COV.read[j] - F.arms.COV.claim[j])); });
  console.log(`  item 1 (COV, S370, years ${before.join(', ')}): per-path sd at most ${e(s1)}; 80% power after Holm over 2 for |mean y| ${e(mdd1)} a path, against COV's mean D there ${Dbef.map(e).join(' and ')} (summed ${e(Dbef.reduce((s, x) => s + x, 0))})`);
  for (const id of ['S370', 'S130']) {
    const G = C.files[id].fixed, st = [...new Set(G.t.filter((_, j) => G.kind[j] === 1))], s2 = st.reduce((s, t) => s + SD[`${id} BASE ${t}`], 0), n2 = 6000;
    const mdd2 = (z(0.05 / 4) + z(0.2)) * s2 / Math.sqrt(n2);
    const Dst = st.map(t => { const J = G.t.map((x, j) => (x === t ? j : -1)).filter(j => j >= 0); return mean(J.map(j => G.arms.BASE.read[j] - G.arms.BASE.claim[j])); });
    console.log(`  item 2 (BASE, ${id}, step years ${st.join(', ')}): per-path sd at most ${e(s2)}; 80% power after Holm over 4 for |mean y| ${e(mdd2)} a path, against BASE's mean D ${Dst.map(e).join(' and ')}`);
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
