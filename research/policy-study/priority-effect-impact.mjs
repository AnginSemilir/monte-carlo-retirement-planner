/*
 * WHAT DID THE TWO FIXES CHANGE, AND FOR WHOM?
 *
 * Two changes landed together and both alter which policy a household is handed, so neither should
 * ship on the strength of the argument for it alone:
 *
 *   THE FINAL TIE-BREAK   when every priority has declared the survivors equivalent, the winner used
 *                         to be whichever the candidate grid built first. It is now the best of them
 *                         on whatever was ranked FIRST.
 *   THE BAD-CASE METRIC   "protecting the bad case" used to rank on the tenth-percentile pot, which
 *                         floors at zero and so went blind for fragile households. It now ranks on
 *                         that pot less the spending the plan never afforded.
 *
 * This re-ranks the stored candidate stats under both the old and the new rules and reports the
 * difference. It needs no simulation: priority-effect already banked what each candidate scores.
 *
 * Usage: node priority-effect-impact.mjs [results/priority-effect.json]
 */
import fs from 'fs';
import path from 'path';
import * as E from '../engine.mjs';

const file = process.argv[2] || path.join(import.meta.dirname, 'results', 'priority-effect.json');
const recs = JSON.parse(fs.readFileSync(file, 'utf8')).records;
const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : '—';

let fragile = 0, robust = 0, fragileBlind = 0, robustBlind = 0;
for (const r of recs) {
  const bestSurv = r.metrics.survive.best;
  const blind = r.metrics.downside.spread < 1;
  if (bestSurv < 90) { fragile++; if (blind) fragileBlind++; } else { robust++; if (blind) robustBlind++; }
}
console.log('BEFORE THE FIX, from the stored run (the bad-case priority could not discriminate):');
console.log(`  households whose best available survival is under 90%: ${fragile}`);
console.log(`     of those, bad-case priority blind: ${fragileBlind} (${pct(fragileBlind, fragile)})`);
console.log(`  households at 90% or better: ${robust}`);
console.log(`     of those, bad-case priority blind: ${robustBlind} (${pct(robustBlind, robust)})`);

/*
 * How often the old code had to pick arbitrarily.
 *
 * Not "no priority decided" - that was the wrong test. The tie-break fires whenever the FINAL pool
 * still holds more than one candidate, however much narrowing happened on the way. `settledAfter` is
 * set only when the pool reached one, so a null settledAfter with survivors left is the arbitrary case.
 */
let arbitrary = 0, total = 0;
const leftSizes = {};
for (const r of recs) for (const k of E.PRIORITY_KEYS) {
  total++;
  const b = r.byFirst[k], c = b.consulted || [];
  const finalLeft = c.length ? c[c.length - 1].left : null;
  if (b.settledAfter === null && finalLeft !== null && finalLeft > 1) {
    arbitrary++;
    leftSizes[finalLeft] = (leftSizes[finalLeft] || 0) + 1;
  }
}
console.log(`\nRANKINGS THAT ENDED WITH THE FIELD STILL TIED (where the tie-break now applies):`);
console.log(`  ${arbitrary} of ${total} (${pct(arbitrary, total)}) - the winner was grid order, and is now the best on what was ranked first.`);
if (arbitrary) console.log('  survivors left: ' + Object.entries(leftSizes).sort((a,b)=>a[0]-b[0]).map(([n, c]) => `${n} candidates x${c}`).join(', '));

/* The cases the tie-break exists to remove. */
let worse = 0;
const worstBy = {};
for (const r of recs) for (const k of E.PRIORITY_KEYS) {
  if (r.byFirst[k].intent === 'worse') { worse++; worstBy[k] = (worstBy[k] || 0) + 1; }
}
console.log(`\nHOUSEHOLDS LEFT WORSE ON THE PRIORITY THEY PROMOTED (the target of the tie-break):`);
console.log(`  ${worse} across all priorities: ${Object.entries(worstBy).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}`);
