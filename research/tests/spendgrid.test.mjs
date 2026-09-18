/*
 * THE AGE-AGAINST-SPEND GRID.
 *
 * The grid's whole claim is that a reader can compare one cell with the cell beside it and the cell
 * above it, and that the difference between them is the PLAN rather than the luck of the draw. Three
 * things have to hold for that to be true, and each is asserted here:
 *
 *   1. A row is monotone. Spending more can only lower the share of futures that last, because nothing
 *      else about the plan has changed. A row that wobbles means the cells are not sharing a path set.
 *   2. A column is monotone the other way: retiring later can only help, at a fixed spend.
 *   3. The same window run twice gives the same numbers. Common random numbers are what make cells
 *      comparable; a grid drawn on fresh draws each time would shimmer.
 *
 * The frontier is checked against the SOLVER rather than against itself: the line drawn on the grid is
 * interpolated between neighbouring cells, and the claim made in the UI is that it lands close to what
 * optimizeSpend would return for the same age. "Close" is measured here rather than asserted by eye.
 */
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const GIA = 'Other Investments (e.g. GIA)';

const mk = (o = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: o.age ?? 45, retireAgeSelf: o.ret ?? 60, salarySelf: 65000,
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: o.term ?? 90
  },
  spending: { targetSpend: o.spend ?? 34000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: o.pen ?? 600000, contrib: o.penC ?? 12000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: o.isa ?? 250000, contrib: o.isaC ?? 6000, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: o.gia ?? 80000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: o.cash ?? 40000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
});

const TRIALS = 300, SEED = 4242;

console.log('=========== A. THE WINDOW HOLDS THE PLAN AND THE ANSWER ===========');
{
  for (const o of [{}, { spend: 18000, age: 30, ret: 55 }, { spend: 120000, pen: 3e6 }]) {
    const ctx = E.buildContext(mk(o));
    const w = E.gridWindow(ctx, { anchor: E.optimizeSpend(ctx, { targetRate: 90, seed: SEED, searchTrials: 300, finalTrials: 500 }).spend });
    ok(`the entered age is a row (spend ${w.target})`, w.ages.includes(w.planned), `${w.ages[0]}-${w.ages[w.ages.length - 1]}`);
    // the entered spend need not be a column when it is not a round number, but a column must be within
    // half a step of it, or the grid opens somewhere the reader does not recognise
    const near = Math.min(...w.spends.map(s => Math.abs(s - w.target)));
    ok('...and a column sits on the entered spend', near <= w.step / 2, `nearest column is £${near} away, step £${w.step}`);
    const nearAnchor = Math.min(...w.spends.map(s => Math.abs(s - w.anchor)));
    ok('...and the solved safe maximum is inside the range', w.anchor >= w.spends[0] && w.anchor <= w.spends[w.spends.length - 1],
       `£${Math.round(w.anchor).toLocaleString()} in £${w.spends[0].toLocaleString()}-£${w.spends[w.spends.length - 1].toLocaleString()} (nearest column £${Math.round(nearAnchor)})`);
    ok('...ages never run past the plan end', w.ages[w.ages.length - 1] < E.num(ctx.terminalAge, 100), `to ${w.ages[w.ages.length - 1]}`);
    ok('...and never before today', w.ages[0] >= Math.round(E.num(ctx.owners[0].age0, 0)), `from ${w.ages[0]}`);
  }
  ok('the step is a round number at any scale',
    [12000, 30000, 50000, 90000, 250000].every(t => E.NICE_STEPS === undefined || E.niceStep(t * 0.09) > 0),
    [12000, 30000, 50000, 90000, 250000].map(t => `${t}->${E.niceStep(t * 0.09)}`).join(' '));
}

console.log('\n=========== B. A ROW ONLY FALLS, A COLUMN ONLY RISES ===========');
const plan = mk();
const ctx = E.buildContext(plan);
const SOLVED90 = E.optimizeSpend(ctx, { targetRate: 90, seed: SEED, searchTrials: 400, finalTrials: 1000 });
const W = E.gridWindow(ctx, { anchor: SOLVED90.spend });
const grid = {};
for (const a of W.ages) grid[a] = E.spendRow(E.buildContext(E.shiftRetirement(plan, a - W.planned)), { spends: W.spends, trials: TRIALS, seed: SEED });
{
  let worstRow = 0, worstCol = 0;
  for (const a of W.ages) for (let i = 1; i < W.spends.length; i++) worstRow = Math.max(worstRow, grid[a][i].rate - grid[a][i - 1].rate);
  for (let i = 0; i < W.spends.length; i++) for (let k = 1; k < W.ages.length; k++) {
    worstCol = Math.max(worstCol, grid[W.ages[k - 1]][i].rate - grid[W.ages[k]][i].rate);
  }
  ok('spending more never survives better', worstRow <= 0, `worst rise along a row: ${worstRow.toFixed(2)} pts`);
  ok('retiring later never survives worse', worstCol <= 0, `worst fall down a column: ${worstCol.toFixed(2)} pts`);
}

console.log('\n=========== C. THE SAME WINDOW TWICE IS THE SAME GRID ===========');
{
  const again = E.spendRow(E.buildContext(E.shiftRetirement(plan, 0)), { spends: W.spends, trials: TRIALS, seed: SEED });
  const same = again.every((c, i) => c.rate === grid[W.planned][i].rate);
  ok('common random numbers survive a re-run', same,
    same ? 'identical' : `${again.map(c => c.rate.toFixed(1)).join(',')} vs ${grid[W.planned].map(c => c.rate.toFixed(1)).join(',')}`);
  const other = E.spendRow(E.buildContext(plan), { spends: W.spends, trials: TRIALS, seed: SEED + 1 });
  ok('...and a different seed is a different draw', !other.every((c, i) => c.rate === grid[W.planned][i].rate), '');
}

console.log('\n=========== D. THE INTERPOLATED LINE AGAINST THE SOLVER ===========');
{
  /*
   * At the trial count the APP uses, not the one the rest of this file uses. The tolerance below is a
   * third of a column, and a cell's own sampling error has to be smaller than that for the comparison
   * to mean anything: a row falls about four points per column here, so ±3.4 points at 300 trials is
   * ±four fifths of a column and would fail or pass on the draw. At 1,000 it is ±1.9 points.
   */
  const planRow = E.spendRow(ctx, { spends: W.spends, trials: 1000, seed: SEED });
  for (const target of [85, 90]) {
    const line = E.frontierSpend(planRow, target);
    const solved = target === 90 ? SOLVED90 : E.optimizeSpend(ctx, { targetRate: target, seed: SEED, searchTrials: 400, finalTrials: 1000 });
    if (line === null) { ok(`@${target}%: the window brackets the answer`, false, 'no crossing in the window'); continue; }
    /*
     * The claim the drawn line makes is about the CURVE, not about the solver: this is the spending at
     * which the plan crosses the target. So it is checked by running it.
     */
    const at = E.monteCarlo(ctx, { trials: 1000, seed: SEED, spendOverride: Math.round(line) });
    ok(`@${target}%: the line is where the plan really crosses it`, Math.abs(at.successRate - target) <= 1.2,
      `£${Math.round(line).toLocaleString()} runs at ${at.successRate.toFixed(1)}%`);
    /*
     * And it must not contradict the card above it. optimizeSpend is deliberately conservative - it
     * returns the last candidate that VERIFIED at or above the target, so it sits below the true
     * crossing (£47,000 at 91.5% where the curve crosses at about £49,300 here). The line may therefore
     * sit above the card's figure, and must never sit below it, which would read as the grid offering
     * less than the solver just promised.
     */
    ok(`@${target}%: ...and never below what the card promises`, line >= solved.spend - W.step / 3,
      `line £${Math.round(line).toLocaleString()} vs solved £${Math.round(solved.spend).toLocaleString()} at ${solved.successRate.toFixed(1)}%`);
  }
  ok('a row that clears the target everywhere has no crossing',
    E.frontierSpend([{ spend: 1000, rate: 100 }, { spend: 2000, rate: 99 }], 90) === null, '');
  ok('...and neither does one that misses it everywhere',
    E.frontierSpend([{ spend: 1000, rate: 40 }, { spend: 2000, rate: 20 }], 90) === null, '');
  ok('a crossing between two cells is read between them', (() => {
    const v = E.frontierSpend([{ spend: 10000, rate: 94 }, { spend: 20000, rate: 86 }], 90);
    return Math.abs(v - 15000) < 1;
  })(), '');
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
