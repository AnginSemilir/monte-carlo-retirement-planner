/*
 * XAS-R'S DERIVATION (predictions/diag-xasr.md): what XAS's gated files say before XAS-R runs. A re-use of XAS's files for
 * a new question, so their gate runs first (CHECKLIST item 3: reduce-xasr.mjs xasFiles, XAS's own gate with COV-B-STEP's
 * under it).
 *   1. THE SIZES: COV's representation error (read - ex5) in S370's years before each step, per read and per path (the P of
 *      item 1), and bridge 4's (reported).
 *   2. THE POWER: the share s item 1 can tell from its thresholds, at 80% power after Holm over four one-sided tests, at an
 *      ASSUMED spread of D - c P per path equal to P's own (grade C), and at twice it.
 *   3. THE COST: from XAS's measured seconds (solves and the forward read), XAS-R's re-read taken at three times XAS's.
 *   4. THE CREDENCES, from stated priors (grade C: the priors are judged, the arithmetic is not).
 *   node research/solver/derive-xasr.mjs > research/solver/results-derive-xasr.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { xasFiles, LO, HI, Q_HELD, Q_FALS } from './reduce-xasr.mjs';
import { logsOf } from './reduce-xas.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const X = xasFiles();
if (X.bad.length) { console.log(`GATE: FAILED\n  ${X.bad.join('\n  ')}`); process.exit(1); }
console.log('GATE: passed - XAS\'s 4 households through reduce-xas.mjs\'s gate, the identity against COV-B-STEP\'s reads and the draw check');
const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const sd = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };
const e = x => x.toExponential(3);
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
const zUp = p => { let lo = 0, hi = 10; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; (Phi(m) < 1 - p ? (lo = m) : (hi = m)); } return lo; };
const before = t => { const steps = [...new Set(t.t.filter((_, j) => t.kind[j] === 1))]; return steps.map(s => s - 1).filter(y => !steps.includes(y)).sort((a, b) => a - b); };
const perPath = (t, J, f) => { const m = new Map(); for (const j of J) { const key = t.k[j] * 1e6 + t.p[j]; m.set(key, (m.get(key) || 0) + f(j)); } return [...m.values()]; };

console.log('\n1. THE SIZES (COV, rep = read - ex5 in the years before each step; P a path\'s sum over the year\'s reads)');
const P = {};
for (const id of ['S370', 'bridge 4']) {
  const t = X.files[id], A = t.arms.COV;
  for (const y of before(t)) {
    const J = t.t.map((_, j) => j).filter(j => t.t[j] === y), p = perPath(t, J, j => A.read[j] - A.ex5[j]);
    P[`${id} ${y}`] = p;
    console.log(`  ${id.padEnd(8)} year ${y}: reads ${J.length}, mean rep ${e(mean(J.map(j => A.read[j] - A.ex5[j])))}; paths ${p.length}, mean P ${e(mean(p))}, sd P ${e(sd(p))}`);
  }
}

console.log('\n2. THE POWER (item 1: tests of mean(D - 0.3 P) and mean(0.6 P - D) above 0, one-sided, Holm over four; at 80% power the');
console.log('   detectable distance of s from a threshold is (z + z80) sd(D - c P) / (sqrt(n) mean P), the spread ASSUMED equal to sd(P))');
const zH = zUp(0.05 / 4) + zUp(0.2), MDD = {};
for (const y of before(X.files.S370)) {
  const p = P[`S370 ${y}`];
  for (const mult of [1, 2]) {
    const d = zH * mult * sd(p) / (Math.sqrt(p.length) * mean(p));
    MDD[`${y} ${mult}`] = d;
    console.log(`  S370 year ${y} at ${mult}x the assumed spread: s told from ${LO} or ${HI} at a distance of ${d.toFixed(4)}`);
  }
}

console.log('\n3. THE COST (XAS\'s measured seconds; XAS-R re-solves both arms and re-reads the years before each step with up to 8');
console.log('   node builds a read - taken at three times XAS\'s forward read, an upper estimate, grade C)');
{
  const logs = logsOf(join(HERE, 'results', 'diagxas'));
  let total = 0;
  for (const id of ['S370', 'bridge 4', 'S126']) {
    const txt = Object.values(logs).find(v => new RegExp(`^${id}\\s+case`, 'm').test(v));
    const solve = [...txt.matchAll(/solve (?:BASE|COV): secs (\d+)/g)].reduce((s, m) => s + Number(m[1]), 0);
    const read = Math.max(0, ...[...txt.matchAll(/ xas (?:BASE|COV) \S+: .* secs (\d+)/g)].map(m => Number(m[1])));
    const est = solve + 3 * read;
    total += est;
    console.log(`  ${id.padEnd(8)}: solves ${solve} s, XAS's read ${read} s -> XAS-R about ${est} s (${(est / 3600).toFixed(2)} h)`);
  }
  console.log(`  all three: ${(total / 3600).toFixed(2)} core-hours; one process a household, three at once: the longest household's time`);
}

console.log('\n4. THE CREDENCES, DERIVED FROM STATED PRIORS (grade C: the priors are judged, the arithmetic is not)');
// item 1: the share s (v-a) removes, in each of S370's two years, from three stories - YB-COPY (s ~ normal(0.75, 0.15)),
// YB-GRID (s ~ normal(0.15, 0.10)) and neither (s uniform on [0, 1]) - weighted by the review's ranking shaded halfway to the
// deep-review record's rate (YB-COPY (0.45 + 0.10) / 2, YB-GRID (0.30 + 0.10) / 2, the rest to neither). Given a story the
// two years are drawn independently; a year reads COPY when s is at least 0.6 and past 0.3 by the detectable distance,
// GRID when s is at most 0.3 and short of 0.6 by it (section 2 at twice the assumed spread).
{
  const ys = before(X.files.S370), d = Math.max(...ys.map(y => MDD[`${y} 2`]));
  const stories = [['YB-COPY', 0.275, 0.75, 0.15], ['YB-GRID', 0.2, 0.15, 0.1], ['neither', 0.525, null, null]];
  const pr = (mu, s, lo, hi) => (mu === null ? Math.max(0, Math.min(1, hi) - Math.max(0, lo)) : Phi((hi - mu) / s) - Phi((lo - mu) / s));
  let H = 0, F = 0, pt = 0;
  for (const [nm, w, mu, s] of stories) {
    const c = pr(mu, s, Math.max(HI, LO + d), Infinity), g = pr(mu, s, -Infinity, Math.min(LO, HI - d));
    const h = c ** ys.length, f = g ** ys.length;
    H += w * h; F += w * f; pt += w * (mu === null ? 0.5 : mu);
    console.log(`  item 1, story ${nm} (weight ${w}): a year COPY ${c.toFixed(3)}, GRID ${g.toFixed(3)}; both years COPY ${h.toFixed(3)}, both GRID ${f.toFixed(3)}`);
  }
  console.log(`  item 1: HELD ${H.toFixed(2)} INCONCLUSIVE ${(1 - H - F).toFixed(2)} FALSIFIED ${F.toFixed(2)}; the share's expectation ${pt.toFixed(2)}`);
  console.log(`CREDENCE item 1: point ${pt.toFixed(2)} HELD ${H.toFixed(2)} INCONCLUSIVE ${(1 - H - F).toFixed(2)} FALSIFIED ${F.toFixed(2)}`);
}
// item 2: q, the part of the opening score's rise the non-survival reads carry, from three stories - S126-BLEND (q ~
// normal(0.95, 0.10)), survival (q ~ normal(0.2, 0.2)) and neither (q uniform on [0, 1]). S126-BLEND's weight moves up from
// the record's 0.10 to 0.45 on the observed sizes (both moves' scores rise 4.05e-2 and 4.51e-2 under COV where the year-1
// survival reads move -3.52e-4: results-derive-xas-review.txt), survival 0.20, neither the rest. The two moves share the
// state and the tables, so they are taken as one draw.
{
  const stories = [['S126-BLEND', 0.45, 0.95, 0.1], ['survival', 0.2, 0.2, 0.2], ['neither', 0.35, null, null]];
  let H = 0, F = 0, pt = 0;
  for (const [nm, w, mu, s] of stories) {
    const h = mu === null ? 1 - Q_HELD : 1 - Phi((Q_HELD - mu) / s), f = mu === null ? Q_FALS : Phi((Q_FALS - mu) / s);
    H += w * h; F += w * f; pt += w * (mu === null ? 0.5 : mu);
    console.log(`  item 2, story ${nm} (weight ${w}): q >= ${Q_HELD} ${h.toFixed(3)}, q <= ${Q_FALS} ${f.toFixed(3)}`);
  }
  console.log(`  item 2: HELD ${H.toFixed(2)} INCONCLUSIVE ${(1 - H - F).toFixed(2)} FALSIFIED ${F.toFixed(2)}; q's expectation ${pt.toFixed(2)}`);
  console.log(`CREDENCE item 2: point ${pt.toFixed(2)} HELD ${H.toFixed(2)} INCONCLUSIVE ${(1 - H - F).toFixed(2)} FALSIFIED ${F.toFixed(2)}`);
}
