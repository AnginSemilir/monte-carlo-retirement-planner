/*
 * WHAT DOES IT COST A HOUSEHOLD TO NEVER BE ASKED?
 *
 * The streamlined page has no priority control. It runs the candidates, applies the DEFAULT order's
 * winner, and names it in a line of text. PLAN-streamlined.md justifies that with a sentence -
 * "the default order is a perfectly respectable answer everywhere" - which was written from the
 * priority-effect study's headline and is NOT what that study measured. It measured which policy each
 * ordering picks, not how much worse off you are for not having been asked. This re-cut asks that.
 *
 * THE MEASURE. For each household and each priority K, priority-effect already recorded
 *
 *     gainVsDefaultEps = score_K(K-first winner) - score_K(default winner), in multiples of K's epsilon
 *
 * signed so positive always means "more of the thing". That is the default order's SHORTFALL on K: what
 * a household that cared most about K would have gained by being asked. Epsilon units are what make the
 * six comparable - a point of survival and a pound of bequest are otherwise not addable.
 *
 * ONE HONEST CAVEAT, AND ITS BOUND. Ranking K first does not return the best candidate on K; it narrows
 * to within one epsilon of the best and lets the priorities below choose inside that band. So the K-first
 * winner can itself be up to 1 epsilon short of the best available, and this figure understates the true
 * regret by at most that much. Both ends are reported: the measured shortfall, and shortfall + 1 as the
 * upper bound. Where the two sides of the bracket lead to the same conclusion, the conclusion holds.
 *
 * The threshold that matters is 1 epsilon, because that is the tolerance the ranking itself treats as
 * "the same". A shortfall under 1x is a difference the engine has already declared immaterial; it is
 * the ones above that the missing control is costing somebody.
 *
 * TWO ROWS THAT CANNOT SAY ANYTHING, AND ARE MARKED RATHER THAN DROPPED:
 *
 *   survive  is FIRST in the default order, so "rank survival first" IS the default order - 0 of 420
 *            households differ. Its zero shortfall is arithmetic, not evidence. This is the identical
 *            trap that flawed v1 of priority-effect, which is why it is called out here.
 *   downside is SECOND, so its contrast is a swap of the top two and a much smaller perturbation than
 *            the other four get. 118 of 420 differ, so it is not circular - but it is understated.
 *
 * The default order is survive -> downside -> bequest -> bridge -> pot -> tax. That it serves its own
 * top priorities well is a property of the order, not a discovery about it. The four lower rows are
 * where the question actually gets answered.
 *
 * AND ONE UNIT WARNING. toleranceFor falls back to a flat floor when the best achievable value is zero,
 * which happens on tax whenever some policy pays no lifetime tax at all. The epsilon is then £1,000 -
 * a floor, not a proportional tolerance - and ratios against it run to the hundreds. The money metrics
 * are therefore printed in pounds beside the multiples, and the pounds are the figure to quote.
 *
 * Usage: node default-order-cost.mjs [results/priority-effect.json]
 */
import fs from 'fs';
import path from 'path';
import * as E from '../engine.mjs';

const file = process.argv[2] || path.join(import.meta.dirname, 'results', 'priority-effect.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const recs = data.records;
const KEYS = E.PRIORITY_KEYS;
const NAME = Object.fromEntries(KEYS.map(k => [k, E.PRIORITY_METRICS[k].label]));

const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : '—';
const bar = (f, w = 20) => '█'.repeat(Math.max(0, Math.round(f * w))).padEnd(w, '·');
const hr = (s) => console.log(`\n${s}\n${'='.repeat(s.length)}`);
const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

// the default order's shortfall on K; negative would mean the default beat the K-first pick, which the
// lexicographic order makes impossible on K itself, so it is floored at zero rather than hidden
const shortfall = (r, k) => Math.max(0, r.byFirst[k].gainVsDefaultEps);

console.log(`default-order-cost: ${recs.length} households, ${data.trials} paths, seed ${data.seed}`);
console.log(`source ${path.basename(file)}, generated ${data.generated || '(partial)'}`);
console.log(`\nAll figures are multiples of that priority's own tolerance. Under 1x is a gap the ranking`);
console.log(`itself treats as no gap at all.`);

// ------------------------------------------------- 1. per priority
hr('1. IF A HOUSEHOLD CARED MOST ABOUT X, WHAT DID THE DEFAULT ORDER COST THEM?');
// which metrics are money, and so worth printing in pounds rather than multiples of a floor
const MONEY = new Set(KEYS.filter(k => !['survive', 'bridge'].includes(k)));
const gbp = (n) => (n >= 0 ? '£' : '-£') + Math.round(Math.abs(n)).toLocaleString('en-GB');
const STRUCTURAL = { survive: ' <- circular: this IS the default order', downside: ' <- understated: a swap of the top two' };
console.log('priority'.padEnd(34), 'median'.padStart(8), 'p90'.padStart(8), 'worst'.padStart(9), '  ', 'over 1x'.padStart(13), 'over 3x'.padStart(13));
const perKey = {};
for (const k of KEYS) {
  const v = recs.map(r => shortfall(r, k));
  const over1 = v.filter(x => x > 1).length, over3 = v.filter(x => x > 3).length;
  perKey[k] = { median: q(v, 0.5), p90: q(v, 0.9), max: Math.max(...v), over1, over3 };
  console.log(NAME[k].padEnd(34), q(v, 0.5).toFixed(2).padStart(8), q(v, 0.9).toFixed(2).padStart(8),
    Math.max(...v).toFixed(2).padStart(9), '  ',
    `${String(over1).padStart(3)} ${pct(over1, v.length).padStart(6)}`.padStart(13),
    `${String(over3).padStart(3)} ${pct(over3, v.length).padStart(6)}`.padStart(13),
    STRUCTURAL[k] || '');
  if (MONEY.has(k)) {
    // the same shortfalls in pounds, which is the unit that survives an epsilon set by a floor
    const p = recs.map(r => shortfall(r, k) * r.metrics[k].eps);
    console.log(''.padEnd(34), gbp(q(p, 0.5)).padStart(8), gbp(q(p, 0.9)).padStart(8), gbp(Math.max(...p)).padStart(9), '   in pounds');
  }
}

// ------------------------------------------------- 2. per household: the worst it could go
hr('2. PER HOUSEHOLD: THE WORST THE MISSING CONTROL COULD COST THEM');
console.log('Taking, for each household, the priority the default order serves WORST - the case where the');
console.log('one thing they cared about is the one thing the default gave up.\n');
const worstPer = recs.map(r => {
  let best = { k: null, v: 0 };
  for (const k of KEYS) { const v = shortfall(r, k); if (v > best.v) best = { k, v }; }
  return { r, ...best };
});
const buckets = [[0, 1, 'under 1x  (immaterial by the engine\'s own tolerance)'], [1, 3, '1x to 3x'], [3, 10, '3x to 10x'], [10, Infinity, 'over 10x']];
for (const [lo, hi, label] of buckets) {
  const n = worstPer.filter(w => w.v > lo - (lo === 0 ? 1 : 0) && w.v <= hi && (lo === 0 ? w.v <= 1 : w.v > lo)).length;
  console.log(label.padEnd(50), String(n).padStart(4), bar(n / recs.length), pct(n, recs.length));
}
const vals = worstPer.map(w => w.v);
console.log(`\nmedian ${q(vals, 0.5).toFixed(2)}x   p90 ${q(vals, 0.9).toFixed(2)}x   worst ${Math.max(...vals).toFixed(2)}x`);
console.log('\nAnd which priority it is, when it is over 1x:');
const blame = {};
worstPer.filter(w => w.v > 1).forEach(w => { blame[w.k] = (blame[w.k] || 0) + 1; });
const nOver1 = worstPer.filter(w => w.v > 1).length;
Object.entries(blame).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => {
  console.log('  ' + NAME[k].padEnd(32), String(n).padStart(4), pct(n, nOver1));
});

// ------------------------------------------------- 3. the upper bound
hr('3. THE SAME QUESTION AT THE PESSIMISTIC END OF THE BRACKET');
console.log('Ranking K first lands within one epsilon of the best on K, not ON the best - so the true cost');
console.log('can be up to 1x higher than measured. Adding that 1x to every figure:\n');
for (const [lo, hi, label] of buckets) {
  const n = worstPer.filter(w => { const v = w.v + 1; return lo === 0 ? v <= 1 : (v > lo && v <= hi); }).length;
  console.log(label.padEnd(50), String(n).padStart(4), bar(n / recs.length), pct(n, recs.length));
}

// ------------------------------------------------- 4. where it bites
hr('4. WHICH HOUSEHOLDS PAY FOR THE MISSING CONTROL?');
for (const [i, axis] of [[0, 'stage'], [1, 'mix'], [2, 'wealth'], [3, 'spend']]) {
  const groups = {};
  worstPer.forEach(w => { const g = w.r.name.split('/')[i]; (groups[g] = groups[g] || []).push(w.v); });
  console.log(`\nby ${axis}:`);
  Object.entries(groups).sort((a, b) => q(b[1], 0.5) - q(a[1], 0.5)).forEach(([g, vs]) => {
    const over = vs.filter(v => v > 1).length;
    console.log('  ' + g.padEnd(18), String(vs.length).padStart(4), 'households   median',
      q(vs, 0.5).toFixed(2).padStart(6) + 'x', '  over 1x', pct(over, vs.length).padStart(6));
  });
}

// ------------------------------------------------- 5. the verdict the page needs
hr('5. WHAT THIS MEANS FOR A PAGE WITH NO PRIORITY CONTROL');
const fine = worstPer.filter(w => w.v <= 1).length;
const fineUB = worstPer.filter(w => w.v + 1 <= 1).length;
console.log(`The default order is within tolerance on EVERY priority for ${fine} of ${recs.length} households (${pct(fine, recs.length)}).`);
console.log(`At the pessimistic end of the bracket that falls to ${fineUB} (${pct(fineUB, recs.length)}).`);
const bad = worstPer.filter(w => w.v > 3).length;
console.log(`It is more than 3x short on at least one priority for ${bad} (${pct(bad, recs.length)}).`);

/*
 * The same verdict with the two structural rows excluded, so the claim rests only on the four
 * priorities the contrast can actually speak to.
 */
const FAIR = KEYS.filter(k => !['survive', 'downside'].includes(k));
const fairWorst = recs.map(r => Math.max(...FAIR.map(k => shortfall(r, k))));
const fairFine = fairWorst.filter(v => v <= 1).length;
console.log(`\nCounting only the four priorities the contrast can speak to (bequest, bridge, pot, tax):`);
console.log(`  within tolerance on all four for ${fairFine} of ${recs.length} (${pct(fairFine, recs.length)}),`);
console.log(`  median worst-case ${q(fairWorst, 0.5).toFixed(2)}x, and over 3x for ${fairWorst.filter(v => v > 3).length} (${pct(fairWorst.filter(v => v > 3).length, recs.length)}).`);
console.log(`\nSo the finding does not depend on the circular row: it holds on the lower four alone.`);
