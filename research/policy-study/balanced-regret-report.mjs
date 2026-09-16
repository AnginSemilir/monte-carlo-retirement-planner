/*
 * SURVIVE-FIRST AGAINST BALANCED - AND WHAT THE TIE-BREAK IS ACTUALLY DECIDING.
 *
 * The question this run was launched to answer was "should a page with no priority control use
 * pickBalanced instead of the default order". It was overtaken mid-run by the decision to pick on
 * survival - but the default order IS survive-first, so `defaultRegret` in this data is precisely the
 * regret of the rule the simple page now uses, and the run answers the newer question unchanged.
 *
 * The newer question is sharper. On the reference household 14 of 18 candidates came back within
 * tolerance of the best survival rate, so survival did not choose the winner - the tie-break did, on a
 * money metric separated by fractions, and it flipped between trial counts. That makes two things worth
 * measuring, and they are different:
 *
 *   1 HOW OFTEN survival fails to discriminate, so the tie-break is doing the real work
 *   2 WHAT IT COSTS when it does - and whether pickBalanced, which refuses to rank anything last,
 *     carries a lower worst case on exactly those households
 *
 * Regret is in each metric's own tolerance: 0 means "got the best available", 1 means "one tolerance
 * short", and under 1 is a gap the engine already treats as no gap.
 *
 * Usage: node balanced-regret-report.mjs [results/balanced-regret.json]
 */
import fs from 'fs';
import path from 'path';
import * as E from '../engine.mjs';

const file = process.argv[2] || path.join(import.meta.dirname, 'results', 'balanced-regret.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const recs = data.records;
const KEYS = E.PRIORITY_KEYS;
const NAME = Object.fromEntries(KEYS.map(k => [k, E.PRIORITY_METRICS[k].label]));
const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : '—';
const bar = (f, w = 20) => '█'.repeat(Math.max(0, Math.round(f * w))).padEnd(w, '·');
const hr = (s) => console.log(`\n${s}\n${'='.repeat(s.length)}`);
const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const worstOf = (r, which) => Math.max(...KEYS.map(k => Math.max(0, r.metrics[k][which])));

console.log(`balanced-regret: ${recs.length} households, ${data.trials} paths, seed ${data.seed}`);
console.log(`generated ${data.generated || '(partial run)'}`);

// ---------------------------------------------------------------- 1. does survival discriminate
hr('1. HOW OFTEN DOES SURVIVAL ACTUALLY CHOOSE THE POLICY?');
console.log('Survival spread = best minus worst across all candidates, in tolerances. Under 1x it cannot');
console.log('separate anything, so whatever the page recommends was chosen by the tie-break, not by');
console.log('survival - which is the rule the page names on screen.\n');
const sSpread = recs.map(r => r.metrics.survive.spread);
const flat = recs.filter(r => r.metrics.survive.spread < 1).length;
console.log('survival cannot separate them (<1x) '.padEnd(42), String(flat).padStart(4), bar(flat / recs.length), pct(flat, recs.length));
console.log('survival separates something (>=1x)'.padEnd(42), String(recs.length - flat).padStart(4), bar((recs.length - flat) / recs.length), pct(recs.length - flat, recs.length));
console.log(`\nmedian spread ${q(sSpread, 0.5).toFixed(2)}x, p90 ${q(sSpread, 0.9).toFixed(2)}x, worst ${Math.max(...sSpread).toFixed(2)}x`);

// ---------------------------------------------------------------- 2. head to head
hr('2. SURVIVE-FIRST AGAINST BALANCED, ON WORST-CASE REGRET');
console.log('For each household, the priority each rule serves WORST - the thing you would most regret');
console.log('if it happened to be the one you cared about.\n');
const dW = recs.map(r => worstOf(r, 'defaultRegret'));
const bW = recs.map(r => worstOf(r, 'balancedRegret'));
console.log('rule'.padEnd(20), 'median'.padStart(9), 'p90'.padStart(9), 'worst'.padStart(10), 'within 1x on all'.padStart(18));
for (const [label, v] of [['survive-first', dW], ['balanced', bW]]) {
  const fine = v.filter(x => x <= 1).length;
  console.log(label.padEnd(20), q(v, 0.5).toFixed(2).padStart(9), q(v, 0.9).toFixed(2).padStart(9),
    Math.max(...v).toFixed(2).padStart(10), `${fine} (${pct(fine, v.length)})`.padStart(18));
}
const better = recs.filter((r, i) => bW[i] < dW[i] - 1e-9).length;
const same = recs.filter((r, i) => Math.abs(bW[i] - dW[i]) <= 1e-9).length;
console.log(`\nbalanced has the lower worst case on ${better} households (${pct(better, recs.length)}),`);
console.log(`survive-first on ${recs.length - better - same} (${pct(recs.length - better - same, recs.length)}), tied on ${same} (${pct(same, recs.length)}).`);

// ---------------------------------------------------------------- 3. per priority
hr('3. WHAT EACH RULE GIVES UP, PRIORITY BY PRIORITY');
console.log('priority'.padEnd(34), 'survive-first'.padStart(15), 'balanced'.padStart(12), '  which is better');
for (const k of KEYS) {
  const d = q(recs.map(r => Math.max(0, r.metrics[k].defaultRegret)), 0.5);
  const b = q(recs.map(r => Math.max(0, r.metrics[k].balancedRegret)), 0.5);
  const verdict = Math.abs(d - b) < 0.05 ? 'the same' : d < b ? 'survive-first' : 'balanced';
  console.log(NAME[k].padEnd(34), (d.toFixed(2) + 'x').padStart(15), (b.toFixed(2) + 'x').padStart(12), '  ' + verdict);
}
console.log('\n(medians. Survival should read ~0 for survive-first by construction - it is the rule.)');

// ---------------------------------------------------------------- 4. the households that matter
hr('4. ON THE HOUSEHOLDS WHERE SURVIVAL TIES, WHICH TIE-BREAK IS BETTER?');
console.log('These are the ones where the page is not really choosing on survival at all, because it');
console.log('cannot - so this is the comparison that decides what the tie-break should be.\n');
const tied = recs.filter(r => r.metrics.survive.spread < 1);
if (!tied.length) console.log('none');
else {
  const td = tied.map(r => worstOf(r, 'defaultRegret'));
  const tb = tied.map(r => worstOf(r, 'balancedRegret'));
  console.log(`${tied.length} households.`);
  console.log('rule'.padEnd(20), 'median'.padStart(9), 'p90'.padStart(9), 'worst'.padStart(10));
  console.log('survive-first'.padEnd(20), q(td, 0.5).toFixed(2).padStart(9), q(td, 0.9).toFixed(2).padStart(9), Math.max(...td).toFixed(2).padStart(10));
  console.log('balanced'.padEnd(20), q(tb, 0.5).toFixed(2).padStart(9), q(tb, 0.9).toFixed(2).padStart(9), Math.max(...tb).toFixed(2).padStart(10));
  const tBetter = tied.filter((r, i) => tb[i] < td[i] - 1e-9).length;
  console.log(`\nbalanced is better on ${tBetter} of them (${pct(tBetter, tied.length)}).`);
  const agree = tied.filter(r => r.same).length;
  console.log(`The two rules pick the SAME policy on ${agree} (${pct(agree, tied.length)}), so the choice is moot there.`);
}

// ---------------------------------------------------------------- 5. verdict
hr('5. VERDICT');
const agreeAll = recs.filter(r => r.same).length;
console.log(`The two rules pick the same policy on ${agreeAll} of ${recs.length} households (${pct(agreeAll, recs.length)}).`);
console.log(`Where they differ, balanced carries the lower worst-case regret on ${pct(better, recs.length - agreeAll)} of them.`);
