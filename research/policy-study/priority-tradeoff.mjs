/*
 * HOW MUCH CAN A PRIORITY ORDER COST YOU IN THE THING YOU RANKED LOWER?
 *
 * The ranking is lexicographic: the first priority narrows the field to candidates within its epsilon
 * of the best, and later priorities only choose among those. Nothing in that mechanism protects a
 * lower-ranked priority. Rank inheritance first and survival is consulted only among the candidates
 * that were already inheritance-optimal - so if every one of those happens to be fragile, the
 * recommendation is fragile, and the user is never told they bought it.
 *
 * That may be fine. A household that genuinely prefers a larger legacy has the right to trade some
 * safety for it. But "some" needs a number, and nobody has measured what the current design actually
 * gives away. This finds the distribution and, more importantly, the TAIL: the mean is reassuring and
 * the mean is not what ruins somebody.
 *
 * The output is the evidence for choosing a cap, not the cap itself.
 */
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';

const TRIALS = 1200, SEED = 12345;
const HEIR = [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 60000 }];
const DEATH_AGE = 82, HOME = 350000;

const scenarios = buildScenarios().filter((_, i) => i % 3 === 0);   // 120 households
const evaluated = [];
scenarios.forEach((sc, n) => {
  sc.plan.inheritance = { deathAge: DEATH_AGE, homeValue: HOME, homeToDescendants: true, beneficiaries: HEIR };
  const cands = E.buildPolicyCandidates(sc.plan).map(c => {
    const ctx = E.buildContext(E.resolveMpaa(c.planState));
    const stats = E.monteCarlo(ctx, { trials: TRIALS, seed: SEED });
    stats.postTaxInheritance = E.postTaxInheritanceFor(c.planState, ctx);
    return { ...c, stats };
  });
  evaluated.push({ sc, cands, bestSurvival: Math.max(...cands.map(c => c.stats.successRate)) });
  if (n % 40 === 0) process.stderr.write(`${n}/${scenarios.length}\n`);
});

const REST = ['survive', 'downside', 'bequest', 'bridge', 'pot', 'tax'];
const orderWith = (first) => [first, ...REST.filter(k => k !== first)];
const pad = (s, n) => String(s).padEnd(n);
const q = (a, p) => a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : 0;

console.log(`=== ${evaluated.length} households, each priority promoted to first in turn ===`);
console.log('"Sacrifice" = percentage points of survival given up against the BEST survival available\n');
console.log(`  ${pad('ranked first', 12)} ${pad('mean', 8)} ${pad('median', 8)} ${pad('90th', 8)} ${pad('99th', 8)} ${pad('WORST', 8)} ${pad('>5pt', 7)} ${pad('>10pt', 7)} >20pt`);

const findings = {};
for (const first of REST) {
  const priorities = orderWith(first);
  const sac = evaluated.map(e => e.bestSurvival - E.pickBest(e.cands, { priorities }).stats.successRate).sort((a, b) => a - b);
  const mean = sac.reduce((a, b) => a + b, 0) / sac.length;
  findings[first] = { sac, mean, worst: sac[sac.length - 1] };
  console.log(`  ${pad(first, 12)} ${pad(mean.toFixed(2), 8)} ${pad(q(sac, 0.5).toFixed(2), 8)} ${pad(q(sac, 0.9).toFixed(2), 8)} ${pad(q(sac, 0.99).toFixed(2), 8)} ${pad(sac[sac.length - 1].toFixed(2), 8)} ${pad(sac.filter(x => x > 5).length, 7)} ${pad(sac.filter(x => x > 10).length, 7)} ${sac.filter(x => x > 20).length}`);
}

console.log('\nTHE WORST INDIVIDUAL CASES - where a stated preference costs the most safety');
const worstRows = [];
for (const first of REST.filter(k => k !== 'survive')) {
  const priorities = orderWith(first);
  evaluated.forEach(e => {
    const pick = E.pickBest(e.cands, { priorities });
    const sac = e.bestSurvival - pick.stats.successRate;
    if (sac > 3) worstRows.push({ first, name: e.sc.name, sac, got: pick.stats.successRate, best: e.bestSurvival, policy: pick.decumulationPolicy });
  });
}
worstRows.sort((a, b) => b.sac - a.sac).slice(0, 12).forEach(r =>
  console.log(`  ${pad(r.first, 10)} ${pad(r.name, 40)} ${r.best.toFixed(1)}% -> ${r.got.toFixed(1)}%  (gives up ${r.sac.toFixed(1)}pt, picks ${r.policy})`));
if (!worstRows.length) console.log('  none above 3pt.');

console.log('\nWHAT DOES THE SACRIFICE BUY? (households where survival was given up by >2pt)');
for (const first of ['bequest', 'pot', 'tax']) {
  const priorities = orderWith(first);
  const gains = [];
  evaluated.forEach(e => {
    const safe = E.pickBest(e.cands, { priorities: orderWith('survive') });
    const pick = E.pickBest(e.cands, { priorities });
    const sac = safe.stats.successRate - pick.stats.successRate;
    if (sac > 2) {
      const m = E.PRIORITY_METRICS[first];
      const gain = m.get(pick.stats) - m.get(safe.stats);
      gains.push({ sac, gain, rel: m.get(safe.stats) ? 100 * gain / Math.abs(m.get(safe.stats)) : 0 });
    }
  });
  if (!gains.length) { console.log(`  ${pad(first, 10)} never gives up more than 2pt.`); continue; }
  const mg = gains.reduce((t, g) => t + g.rel, 0) / gains.length;
  const ms = gains.reduce((t, g) => t + g.sac, 0) / gains.length;
  console.log(`  ${pad(first, 10)} ${gains.length} households: average ${ms.toFixed(1)}pt of survival for ${mg >= 0 ? '+' : ''}${mg.toFixed(1)}% more ${first}`);
}
