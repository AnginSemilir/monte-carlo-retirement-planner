/*
 * REDUCER FOR PROBE M17 (PLAN.md finding M17): the two cures for "spend more and hold maximum risk when a future
 * is failing", against the baseline on the same paths (s2-fnewex, identical flags otherwise).
 *
 * For each household and arm: survival and its paired difference from the baseline (the standard error from the
 * paths where the two disagree); the share of failing paths' last three paid years spent ABOVE target, and at the
 * plan's own tier; years funded before failure and years unfunded per path; years below target; spending.
 *
 *   node research/solver/reduce-m17.mjs
 */
import { readRecord } from './record.mjs';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const IDS = ['S070', 'S184', 'S330', 'S354', 'S126', 'S112'];
const ARMS = [['baseline', 's2-fnewex'], ['floor', 'm17-floor'], ['zero', 'm17-zero']];

function stats(rec) {
  const { N, Y, trace: tr, paths: P } = rec;
  let surv = 0, lastN = 0, lastUp = 0, lastPlan = 0, unfunded = 0, fundedFail = 0, nFail = 0, below = 0, lvl = 0, lvlN = 0;
  for (let i = 0; i < N; i++) {
    if (P.survived[i]) surv++;
    else {
      const t = tr.failYear[i];
      if (t > 0) {
        nFail++; fundedFail += t; unfunded += (Y - 1) - t;
        for (let k = Math.max(0, t - 3); k < t; k++) { const j = i * Y + k; if (!tr.level[j]) continue; lastN++; if (tr.level[j] > 100) lastUp++; if (tr.tier[j] === 0) lastPlan++; }
      }
    }
    below += P.belowYears[i];
    for (let k = 0; k < Y; k++) { const l = tr.level[i * Y + k]; if (l) { lvl += l; lvlN++; } }
  }
  return { surv: 100 * surv / N, ok: P.survived, up: lastN ? 100 * lastUp / lastN : NaN, plan: lastN ? 100 * lastPlan / lastN : NaN,
    unfunded: unfunded / N, fundedFail: nFail ? fundedFail / nFail : NaN, below: below / N, spend: lvlN ? lvl / lvlN / 100 : NaN };
}
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-');
console.log('PROBE M17 - the cures for failing futures, paired against the baseline on the same 3,000 paths');
console.log('  id    arm        survival  (paired diff +/- se)   last 3 paid years before failure: raising / at plan tier   years unfunded/path  funded yrs (failing)  years below  spending');
for (const id of IDS) {
  const base = existsSync(join(R, 's2-fnewex', `${id}.solver.record.json.gz`)) ? stats(readRecord(join(R, 's2-fnewex', `${id}.solver.record.json.gz`))) : null;
  for (const [arm, tag] of ARMS) {
    const file = join(R, tag, `${id}.solver.record.json.gz`);
    if (!existsSync(file)) { console.log(`  ${id}  ${arm.padEnd(9)}  (not run)`); continue; }
    const s = stats(readRecord(file));
    let pair = '';
    if (base && arm !== 'baseline') {
      let disc = 0; for (let i = 0; i < s.ok.length; i++) if (s.ok[i] !== base.ok[i]) disc++;
      const se = 100 * Math.sqrt(disc) / s.ok.length;
      pair = `${(s.surv - base.surv >= 0 ? '+' : '') + f(s.surv - base.surv, 2)} +/- ${f(se, 2)}`;
    }
    console.log(`  ${id}  ${arm.padEnd(9)} ${f(s.surv, 2).padStart(7)}   ${pair.padEnd(20)}   ${f(s.up, 0).padStart(5)}% / ${f(s.plan, 0).padStart(4)}%                          ${f(s.unfunded, 2).padStart(6)}             ${f(s.fundedFail, 1).padStart(6)}           ${f(s.below, 1).padStart(5)}   ${f(s.spend, 3)}`);
  }
}
