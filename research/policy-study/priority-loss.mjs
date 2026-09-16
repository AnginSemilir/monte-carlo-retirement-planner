/*
 * WHAT DOES EACH PRIORITY LOSE WHEN IT IS RANKED LAST?
 *
 * The survival guard protects one metric because survival is the one that cannot be undone. Every other
 * priority is currently unprotected: rank "least lifetime tax" sixth and nothing stops the chosen policy
 * paying far more tax than the best available.
 *
 * That may be exactly right - ranking something last IS saying you will trade it away. The question is
 * whether the amounts are proportionate or wild, because a control that silently costs someone 80% of
 * a thing they still cared about, just ranked below other things, is not a preference, it is a trap.
 *
 * Loss is expressed relative to that metric's own epsilon, so points and pounds are comparable: "3x"
 * means three times what the app itself calls a meaningful difference.
 */
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';
const HEIR = [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 60000 }];
const KEYS = E.PRIORITY_KEYS;

const scs = buildScenarios().filter((_, i) => i % 4 === 0);
const ev = [];
scs.forEach((sc, n) => {
  sc.plan.inheritance = { deathAge: 82, homeValue: 350000, homeToDescendants: true, beneficiaries: HEIR };
  const cands = E.buildPolicyCandidates(sc.plan).map(c => {
    const ctx = E.buildContext(E.resolveMpaa(c.planState));
    const stats = E.monteCarlo(ctx, { trials: 900, seed: 12345 });
    stats.postTaxInheritance = E.postTaxInheritanceFor(c.planState, ctx);
    return { ...c, stats };
  });
  ev.push({ sc, cands });
  if (n % 30 === 0) process.stderr.write(`${n}/${scs.length}\n`);
});

const pad = (s, n) => String(s).padEnd(n);
const q = (a, p) => a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : 0;
console.log(`\n=== ${ev.length} households: each metric's loss when it is ranked LAST ===`);
console.log('Loss as a multiple of that metric\'s own "meaningful difference" threshold\n');
console.log(`  ${pad('metric', 10)} ${pad('mean x', 9)} ${pad('median x', 10)} ${pad('90th x', 9)} ${pad('worst x', 9)} ${pad('worst, in its own units', 26)} >10x`);

for (const key of KEYS) {
  const m = E.PRIORITY_METRICS[key];
  const order = [...KEYS.filter(k => k !== key), key];          // this metric ranked last
  const losses = [], raw = [];
  for (const e of ev) {
    const vals = e.cands.map(c => m.get(c.stats));
    const best = m.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const got = m.get(E.pickBest(e.cands, { priorities: order }).stats);
    const gap = Math.abs(best - got);
    const eps = Math.max(1e-9, m.epsilon(best));
    losses.push(gap / eps); raw.push(gap);
  }
  losses.sort((a, b) => a - b); raw.sort((a, b) => a - b);
  const money = key !== 'survive' && key !== 'bridge';
  const worstRaw = money ? `£${Math.round(raw[raw.length - 1]).toLocaleString()}` : `${raw[raw.length - 1].toFixed(2)}pt`;
  console.log(`  ${pad(key, 10)} ${pad((losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(1), 9)} ${pad(q(losses, 0.5).toFixed(1), 10)} ${pad(q(losses, 0.9).toFixed(1), 9)} ${pad(losses[losses.length - 1].toFixed(1), 9)} ${pad(worstRaw, 26)} ${losses.filter(x => x > 10).length}`);
}
console.log('\nA metric losing only a few multiples of its own threshold is behaving proportionately.');
console.log('One losing tens of multiples is being given away, and would justify a cap of its own.');
