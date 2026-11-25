/*
 * EVERY COUPLE ON THE SOLVER, WHY THE YOUNGER COHORT'S LIFETIME TAX RISES UNDER ROUTE (EXPLORATORY; after the dress rehearsal's
 * read, deciding nothing). The read (results-couples-any.txt) found ROUTE paying far more lifetime tax than APP on S351F's and
 * S357F's units, the cause not shown (reports/2026-11-24-couples-any-rehearsal-read.md; DECISIONS-PENDING.md, C's question).
 * For each unit named, both arms run year by year (E.stepYear, as audit-phase4.mjs runPath does) on the rehearsal's own seed
 * 7002, already read, its first PATHS paths, ROUTE solved as the rehearsal's audit solves it (audit-couples-any.mjs solveRoute)
 * on its page's own context (solvedContext), APP on arm A's: each year's mean over the paths of
 *   - the tax the engine counts in lifetime tax (taxPaid, the bill beyond the tax on pay, and cgtPaid), and the taxable
 *     pension drawn;
 *   - each wrapper's wealth at the year's end: the pensions, the ISAs, the taxable account ('other') and cash.
 * It prints, for each unit, the plan's own cash, each arm's wrappers at the end of plan year 0, its lifetime tax a path (the
 * rehearsal's figures on these paths), and that tax split into the years before the first person's pension access and after,
 * and into income tax and CGT; then its rows every five plan years.
 *   node research/solver/couples-any-tax-trace.mjs [unit ...] > research/solver/results-couples-any-tax-trace.txt
 */
import * as E from '../engine.mjs';
import { readAnyPanel, anySolverPlanOf } from './couples-any-panel.mjs';
import { solveRoute } from './audit-couples-any.mjs';
import { solvedContext } from '../../src/solverStrategy.js';
import { APP_POINTS } from '../../src/solverSettings.js';
import { codeId } from './code-id.mjs';

const SEED = 7002, PATHS = 200, DEFAULT_UNITS = ['S357F-Wg-own', 'S357F-N-own', 'S351F-Ri3s-Y75'];
const KEYS = ['taxPaid', 'cgtPaid', 'taxablePensionSelf', 'taxablePensionPart', 'pensions', 'isas', 'other', 'cash'];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_UNITS;
const k = x => `£${Math.round(x / 1000).toLocaleString('en-GB')}k`, gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;
const panel = readAnyPanel();
console.log(`EVERY COUPLE ON THE SOLVER, WHY THE YOUNGER COHORT'S LIFETIME TAX RISES UNDER ROUTE (EXPLORATORY, deciding nothing): ${ids.join(', ')}, the rehearsal's seed ${SEED} (already read), its first ${PATHS} paths, each year's mean over them; code ${(codeId() || { hash: 'unknown' }).hash}`);
for (const id of ids) {
  const U = panel.find(u => u.id === id);
  if (!U) { console.log(`${id}: not a unit of the rehearsal's panel`); continue; }
  const { a, hp } = anySolverPlanOf(U.plan), R = solveRoute(hp, { pts: APP_POINTS });
  const ctxs = { APP: E.buildContext(E.resolveMpaa(a.planState)), ROUTE: solvedContext(E, R.cp) }, T = ctxs.ROUTE.totalYears;
  const paths = E.pathsForSeed(SEED, PATHS, T).map(z => Float64Array.from(z)), mean = {}, ages = [];
  for (const arm of ['APP', 'ROUTE']) {
    const ctx = ctxs[arm], Y = T + 1, m = Array.from({ length: Y }, () => Object.fromEntries(KEYS.map(x => [x, 0])));
    for (const zs of paths) {
      const st = E.freshState(ctx), zPath = zs.length > Y ? zs[Y] : 0;
      for (let t = 0; t <= T; t++) { const row = E.stepYear(ctx, st, t, { z: zs[t], zPath }); for (const x of KEYS) m[t][x] += (row[x] || 0) / PATHS; ages[t] = row.ageSelf; }
    }
    mean[arm] = m;
  }
  const access = Math.max(0, ages.findIndex(x => x >= 58)), cashPlan = U.plan.accounts.filter(x => /^cash_/.test(x.id)).reduce((t, x) => t + E.num(x.balance, 0), 0);
  const part = (arm, from, to, f) => mean[arm].slice(from, to).reduce((t, r) => t + f(r), 0);
  const tax = r => r.taxPaid + r.cgtPaid;
  console.log(`${id} (class ${U.cls}; the first person ${ages[0]} now, pension access from plan year ${access}): the plan's own cash ${k(cashPlan)}`);
  for (const arm of ['APP', 'ROUTE']) {
    const y0 = mean[arm][0];
    console.log(`    ${arm.padEnd(5)} at the end of plan year 0: the pensions ${k(y0.pensions)}, the ISAs ${k(y0.isas)}, the taxable account ${k(y0.other)}, cash ${k(y0.cash)}; lifetime tax ${gbp(part(arm, 0, T + 1, tax))} a path: before pension access ${gbp(part(arm, 0, access, tax))}, after ${gbp(part(arm, access, T + 1, tax))}; income tax beyond the tax on pay ${gbp(part(arm, 0, T + 1, r => r.taxPaid))}, CGT ${gbp(part(arm, 0, T + 1, r => r.cgtPaid))}; the taxable pension drawn ${gbp(part(arm, 0, T + 1, r => r.taxablePensionSelf + r.taxablePensionPart))}`);
  }
  console.log('    every five plan years, APP | ROUTE: tax (income tax beyond pay + CGT), the taxable account, cash');
  for (let t = 0; t <= T; t += 5) {
    const A = mean.APP[t], X = mean.ROUTE[t];
    console.log(`    year ${String(t).padStart(2)} (age ${ages[t]}): ${k(A.taxPaid)} + ${k(A.cgtPaid)}, ${k(A.other)}, ${k(A.cash)} | ${k(X.taxPaid)} + ${k(X.cgtPaid)}, ${k(X.other)}, ${k(X.cash)}`);
  }
}
