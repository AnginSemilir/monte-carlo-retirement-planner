/*
 * SENSE CHECK: does ranking on a priority actually deliver that priority?
 *
 * The priority machinery is unit-tested for mechanism - the ordering is lexicographic, the epsilons
 * behave, promotion changes the answer. None of that establishes the thing that matters: that a
 * household ranking "leave as much behind" actually ends up with more left behind than one ranking
 * "do not run out". A metric can be perfectly implemented and still measure the wrong quantity.
 *
 * There is a specific reason to doubt the bequest one. It ranks on `medianTerminalNet`, which is the
 * gross terminal pot less a flat death-tax percentage that defaults to ZERO - so out of the box it
 * ranks on the gross pot. The inheritance study found gross and post-tax inheritance pick a different
 * policy in 24.8% of cases, because the gross figure knows nothing about the nil-rate bands, the
 * residence allowance, the 2027 pension rule, or the beneficiary's own income tax.
 *
 * So: rank each household under each priority order, then measure what it actually GOT, using
 * estateAtDeath for the inheritance figure rather than the proxy.
 */
import * as E from '../engine.mjs';
import { buildScenarios } from './scenarios.mjs';

const TRIALS = 1200, SEED = 12345;
const HEIR = [{ id: 'k', relationship: 'descendant', sharePct: 100, income: 60000 }];
// the scenarios predate the inheritance tab, so give each one the heir this study assumes
const DEATH_AGE = 82, HOME = 350000;

// one pass of expensive work per candidate, then rank the same stats many ways
const scenarios = buildScenarios().filter((_, i) => i % 6 === 0);   // 60 households, enough to see a pattern
const rows = [];
scenarios.forEach((sc, n) => {
  sc.plan.inheritance = { deathAge: DEATH_AGE, homeValue: HOME, homeToDescendants: true, beneficiaries: HEIR };
  const cands = E.buildPolicyCandidates(sc.plan).map(c => {
    const ctx = E.buildContext(E.resolveMpaa(c.planState));
    const stats = E.monteCarlo(ctx, { trials: TRIALS, seed: SEED });
    const det = E.simulateDeterministic(ctx, 'expected');
    const last = det[det.length - 1];
    const ev = E.evaluateRows(ctx, det);
    const est = E.estateAtDeath(sc.plan.config, { pen: last.pensions, isa: last.isas, other: last.other, cash: last.cash },
      { deathAge: DEATH_AGE, deathYear: 2040, homeValue: HOME, homeToDescendants: true, beneficiaries: HEIR });
    // the app now computes this itself; the study attaches the same figure so the ranking sees it
    stats.postTaxInheritance = ev.survived ? est.netToBeneficiaries : 0;
    return { ...c, stats, trueInheritance: ev.survived ? est.netToBeneficiaries : 0 };
  });
  rows.push({ sc, cands });
  if (n % 20 === 0) process.stderr.write(`${n}/${scenarios.length}\n`);
});

const ORDERS = {
  'survive first':  ['survive', 'downside', 'bequest', 'bridge', 'pot', 'tax'],
  'bequest first':  ['bequest', 'survive', 'downside', 'bridge', 'pot', 'tax'],
  'pot first':      ['pot', 'survive', 'downside', 'bequest', 'bridge', 'tax'],
  'tax first':      ['tax', 'survive', 'downside', 'bequest', 'bridge', 'pot']
};

const pad = (s, n) => String(s).padEnd(n);
const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
console.log(`=== ${rows.length} households, ${Object.keys(ORDERS).length} priority orders ===\n`);

console.log('WHAT EACH ORDER ACTUALLY DELIVERS (mean across households)');
console.log(`  ${pad('priority order', 18)} ${pad('survival', 11)} ${pad('median pot', 15)} ${pad('TRUE inheritance', 18)} lifetime tax`);
const got = {};
for (const [name, priorities] of Object.entries(ORDERS)) {
  const picks = rows.map(r => ({ r, c: E.pickBest(r.cands, { priorities }) }));
  got[name] = {
    survival: mean(picks.map(p => p.c.stats.successRate)),
    pot: mean(picks.map(p => p.c.stats.medianTerminal)),
    inh: mean(picks.map(p => p.c.trueInheritance)),
    tax: mean(picks.map(p => p.c.stats.medianLifetimeTax)),
    picks
  };
  const g = got[name];
  console.log(`  ${pad(name, 18)} ${pad(g.survival.toFixed(2) + '%', 11)} ${pad('£' + Math.round(g.pot).toLocaleString(), 15)} ${pad('£' + Math.round(g.inh).toLocaleString(), 18)} £${Math.round(g.tax).toLocaleString()}`);
}

console.log('\nDOES EACH ORDER BEAT THE OTHERS AT ITS OWN GAME?');
const base = got['survive first'];
const check = (name, key, label, higherBetter = true) => {
  const a = got[name][key], b = base[key];
  const better = higherBetter ? a > b : a < b;
  console.log(`  ${pad(name, 18)} ${pad(label, 20)} ${better ? 'YES' : 'NO '}  ${higherBetter ? '' : '(lower is better) '}${Math.round(a).toLocaleString()} vs ${Math.round(b).toLocaleString()} under survive-first`);
  return better;
};
check('pot first', 'pot', 'more expected pot');
const bequestWorks = check('bequest first', 'inh', 'more real inheritance');
check('tax first', 'tax', 'less lifetime tax', false);

console.log('\nHOW OFTEN DOES "BEQUEST FIRST" PICK THE POLICY THAT ACTUALLY LEAVES MOST?');
let hit = 0, miss = 0, cost = [];
for (const p of got['bequest first'].picks) {
  const best = p.r.cands.reduce((a, b) => (b.trueInheritance > a.trueInheritance ? b : a));
  if (Math.abs(best.trueInheritance - p.c.trueInheritance) < 1) hit++;
  else { miss++; cost.push(best.trueInheritance - p.c.trueInheritance); }
}
console.log(`  picks the genuinely best policy in ${hit} of ${hit + miss} (${(100 * hit / (hit + miss)).toFixed(0)}%)`);
if (cost.length) {
  cost.sort((a, b) => a - b);
  console.log(`  when it misses, it costs the heirs a median of £${Math.round(cost[Math.floor(cost.length / 2)]).toLocaleString()}, up to £${Math.round(cost[cost.length - 1]).toLocaleString()}`);
}
/*
 * A "miss" is only a defect if it exceeds the epsilon. Inside it, the candidates are declared equal on
 * bequest BY DESIGN and the next priority decides - which is the whole point of a ranked list rather
 * than a single objective. So the number that matters is not the hit rate, it is whether any miss
 * escapes the tolerance the user was promised.
 */
let outside = 0, worst = 0;
for (const p of got['bequest first'].picks) {
  const best = p.r.cands.reduce((a, b) => (b.trueInheritance > a.trueInheritance ? b : a));
  const gap = best.trueInheritance - p.c.trueInheritance;
  const tol = Math.abs(best.trueInheritance) * E.MONEY_EPSILON_REL;
  if (gap > tol + 1) { outside++; worst = Math.max(worst, 100 * gap / Math.max(1, best.trueInheritance)); }
}
console.log(`\n  misses that exceed the ${Math.round(E.MONEY_EPSILON_REL * 100)}% "meaningful difference" tolerance: ${outside} of ${hit + miss}`);
console.log(`  ${outside === 0 ? '  -> every miss is inside the tolerance: the ranking is doing exactly what it promises.'
  : `  -> worst overshoot ${worst.toFixed(1)}% - these are real defects, not the epsilon.`}`);
