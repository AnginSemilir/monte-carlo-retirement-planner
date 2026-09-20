/*
 * GATE 2: THE SOLVER, HELD TO WHAT CAN BE KNOWN WITHOUT RUNNING IT AGAINST ANYTHING.
 *
 * A backward induction can be wrong in ways a comparison never shows: it can be exactly, confidently
 * wrong on every household in the same direction. So before it is compared with anything, it is held
 * to properties that must hold whatever the household:
 *
 *   A. a case with a closed-form answer, where the table must agree with arithmetic;
 *   B. monotonicity - more money in any pot can never make survival worse, because a move that ignores
 *      the extra money is always available;
 *   C. the guard against a certain-success shortcut: the zero-growth need is NOT a survival bound for
 *      an invested pot, and the test keeps proving it so nobody reintroduces the shortcut;
 *   D. plumbing - restricted to one move, the solver reproduces that fixed policy path for path;
 *   E. the move chosen at the household's true position is never worse than the one read from the
 *      nearest cell, which is the measurement behind the switch to `chooseAction`;
 *   F. what the solver refuses.
 *
 * NOT YET HERE, and said so rather than faked: the incremental re-solve (a balance edit touches no
 * table, a spend edit touches only years from the affected one) and the timing budget. Neither exists
 * until the fast flow does; the timing is printed below as a figure, not asserted, so the number that
 * the fast flow has to beat is on the record.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, runPolicy, buildActions } from '../../src/solver/solve.js';
import { zeroGrowthNeed } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const GIA = 'Other Investments (e.g. GIA)';

const off = (p) => { const q = JSON.parse(JSON.stringify(p)); q.config = { ...q.config, guardrails: false, lookaheadYears: 0 }; return q; };
const prep = (p) => E.resolveMpaa(E.normalizePlan(off(p)));

/*
 * A household with ONE pot that is never taxed and never grows: an ISA, a flat real return, no
 * volatility, no state pension, no allowances to fill. Survival is then arithmetic: it makes it if and
 * only if the pot covers spend times the remaining years. Every approximation the grid makes is still
 * in play - the log axes, the interpolation, the buckets - so this is the cleanest test of them.
 */
const closedForm = (isa, spend, years) => E.normalizePlan({
  demographics: { planningMode: 'single', currentAgeSelf: 70, retireAgeSelf: 60, salarySelf: 0, employmentSelf: 'employed', statePensionAge: 99, privatePensionAge: 58, statePensionSelf: 0, terminalAge: 70 + years },
  spending: { targetSpend: spend, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Sequential' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: isa, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [],
  // a flat world: the cash tier at zero real return and zero volatility, no buffer to hold back
  riskProfiles: { 'Cash Equivalents': { label: 'flat', real: 0, nominal: 0, volatility: 0, sigmaParam: 0 } },
  config: { valuationDate: '2026-01-01', guardrails: false, lookaheadYears: 0, cashBufferMonths: 0 }
});

console.log('=========== A. A CLOSED-FORM CASE ===========');
{
  const spend = 20000, years = 10;   // 11 rows: ages 70 to 80 inclusive
  const need = spend * 11;
  const solvedAt = (isa) => { const r = solve(E, M, E.resolveMpaa(closedForm(isa, spend, years)), { points: 12 }); return r.value(M.initialState(r.m), 0).survival; };
  const rich = solvedAt(need * 1.5), poor = solvedAt(need * 0.5);
  ok('A1  well above the need, the table reads certain survival', rich > 0.99, rich.toFixed(4));
  ok('A2  well below it, certain failure', poor < 0.01, poor.toFixed(4));
  /*
   * The cliff sits at the need, and the TABLE smears it: each backward step interpolates across a cell,
   * and eleven steps compound. Log-odds interpolation keeps a single read sharp but cannot undo the
   * compounding, so at 8% either side of the need the table reads about 0.8 and 0.2 rather than 1 and
   * 0. That is a property of a 12-point grid, and it is why the table's own figure is never the
   * measurement: the SIMULATED policy, A5 and A6 below, is right at 2% either side.
   */
  const just = solvedAt(need * 1.08), short = solvedAt(need * 0.92);
  ok('A3  the table crosses one half at the need, from the right side', just > 0.5 && short < 0.5 && just > short, `${short.toFixed(3)} at -8%, ${just.toFixed(3)} at +8% (the smear a 12-point grid gives)`);
  ok('A4  ...and is monotone across the cliff', solvedAt(need * 0.8) <= short && just <= solvedAt(need * 1.3));
  // and a simulation of the chosen moves agrees with the arithmetic exactly, because nothing is random
  const r = solve(E, M, E.resolveMpaa(closedForm(need * 1.02, spend, years)), { points: 12 });
  const zs = new Float64Array(years + 3);
  ok('A5  run forward, a pot 2% above the need survives', runPolicy(r, zs).survived);
  const r2 = solve(E, M, E.resolveMpaa(closedForm(need * 0.98, spend, years)), { points: 12 });
  ok('A6  ...and 2% below it fails', !runPolicy(r2, zs).survived);
}

const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const at = (id) => singles.find(s => s.id === id);

console.log('=========== B. MONOTONICITY, WHICH MUST HOLD WHATEVER THE HOUSEHOLD ===========');
{
  /*
   * With the gain and lump-sum buckets fixed, more money on any pot axis can never lower what the
   * solver is maximising: the move that leaves the extra money alone is always in the list. What it
   * maximises is the SCORE - survival plus the weighted resilience and capped bequest - so that is the
   * quantity that must be monotone, on every cell of every year. Survival alone need not be: a richer
   * cell may legitimately choose a move that gives up a sliver of survival for resilience or bequest,
   * and the first run of this test after the objective changed found exactly that, 373 cells out of
   * 468,000 with the worst a tenth of a point. So survival is checked too, but against the size of
   * trade the weights permit rather than against zero.
   */
  const r = solve(E, M, prep(at('S280').plan), { points: 10 });
  const { g, surv, resil, beq, wR, wB } = r;
  let violScore = 0, worstScore = 0, violSurv = 0, worstSurv = 0, cells = 0;
  const tol = 1e-6;
  for (let t = 0; t <= r.m.ctx.totalYears; t++) {
    const S = surv[t], R = resil[t], B = beq[t];
    const score = (i) => S[i] + wR * R[i] + wB * B[i];
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++)
      for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
        const i = g.index(ip, ii, it, ig, ic); cells++;
        const check = (j) => {
          const ds = score(i) - score(j); if (ds > tol) { violScore++; worstScore = Math.max(worstScore, ds); }
          const dv = S[i] - S[j]; if (dv > tol) { violSurv++; worstSurv = Math.max(worstSurv, dv); }
        };
        // richer along every pot axis on the per-pot grid; along total wealth only on the total-wealth grid
        if (ip + 1 < g.np) check(g.index(ip + 1, ii, it, ig, ic));
        if (g.mode !== 'total' && ii + 1 < g.ni) check(g.index(ip, ii + 1, it, ig, ic));
        if (g.mode !== 'total' && it + 1 < g.nt) check(g.index(ip, ii, it + 1, ig, ic));
      }
  }
  ok(`B1  the score never falls as any pot grows (${cells} cells, ${r.m.ctx.totalYears + 1} years)`, violScore === 0, violScore ? `${violScore} violations, worst ${worstScore.toFixed(5)}` : 'none');
  ok('B2  ...and survival gives up at most a quarter-point where a richer cell trades it for resilience or bequest', worstSurv < 0.0025, `${violSurv} cells, worst ${(100 * worstSurv).toFixed(3)} pts`);
}

console.log('=========== C. WHY THERE IS NO CERTAIN-SUCCESS SHORTCUT ===========');
{
  /*
   * The plan meant to skip every cell rich enough to pay every remaining year with no growth at the
   * worst tax rate. For an invested pot "no growth" is not the worst case, and this proves it on a
   * full solve: cells above that line do not all read 1. If they ever do, the shortcut could return;
   * until then this is the guard against someone reintroducing it.
   */
  const r = solve(E, M, prep(at('S140').plan), { points: 10 });
  const { g, surv, m } = r;
  let above = 0, below1 = 0, minAbove = 1;
  for (let t = 0; t <= m.ctx.totalYears; t++) {
    if ((m.ctx.ageSelf0 + t) < m.ctx.nmpa) continue;
    const line = zeroGrowthNeed(m, t);
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++)
      for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
        const wealth = g.mode === 'total' ? g.axes.W.pts[ip] : g.axes.pen.pts[ip] + g.axes.isa.pts[ii] + g.axes.tax.pts[it];
        if (wealth < line) continue;
        above++;
        const v = surv[t][g.index(ip, ii, it, ig, ic)];
        minAbove = Math.min(minAbove, v);
        if (v < 0.999) below1++;
      }
  }
  ok(`C1  above the zero-growth need, survival is high but NOT certain (${above} cells)`, below1 > 0 && minAbove > 0.5, `min ${minAbove.toFixed(3)}, ${below1} cells below 0.999: negative years exist, so no shortcut`);
  ok('C2  ...and the solver has no shortcut option to switch on', r.meta.skipped === undefined);
}

console.log('=========== D. PLUMBING: ONE MOVE REPRODUCES A FIXED POLICY ===========');
{
  const plan = prep(at('S140').plan);
  const m = M.prepare(E, plan);
  const pol = E.DECUMULATION_POLICIES['Bracket Fill'];
  const one = { steps: pol.steps, costSteps: m.ctx.costSteps, harvest: false, harvestCeil: 'pa', sweepCash: false, lump: false, contrib: null };
  const r = solve(E, M, plan, { points: 8, actions: [one], lump: false });
  const zs = E.pathsForSeed(777, 200, m.ctx.totalYears);
  const direct = (z) => { const st = M.initialState(m); const rates = {};
    for (let t = 0; t <= m.ctx.totalYears; t++) { m.ctx.accounts.forEach(a => { const v = Math.sqrt(a.vol * a.vol + a.sigmaParam * a.sigmaParam); rates[a.id] = Math.exp(Math.log(1 + a.real) + v * z[t]) - 1; });
      const row = M.step(m, st, one, t, rates); if (row.unmetDemand > 1 || row.preNmpaInsolvent) return false; }
    return true; };
  let agree = 0;
  for (const z of zs) if (direct(z) === runPolicy(r, z).survived) agree++;
  ok('D1  restricted to one move, the table reproduces that policy on every path', agree === zs.length, `${agree} of ${zs.length}`);
}

console.log('=========== E. THE MOVE AT THE TRUE POSITION BEATS THE NEAREST CELL ===========');
{
  const plan = prep(at('S280').plan);
  const r = solve(E, M, plan, { points: 10 });
  const zs = E.pathsForSeed(991, 400, r.m.ctx.totalYears);
  const rate = (opts) => 100 * zs.filter(z => runPolicy(r, z, opts).survived).length / zs.length;
  const chosen = rate({}), stored = rate({ stored: true });
  ok('E1  choosing from the value function at the true position is no worse than the nearest cell', chosen >= stored - 0.5, `${chosen.toFixed(1)}% vs ${stored.toFixed(1)}%`);
}

console.log('=========== F. WHAT THE SOLVER REFUSES ===========');
{
  const couple = buildScenarios().find(s => s.plan.demographics.planningMode !== 'single');
  ok('F1  a couple is refused, naming the phase', (() => { try { solve(E, M, prep(couple.plan), { points: 6 }); return false; } catch (e) { return /phase 5/.test(e.message); } })());
  ok('F2  the move list is the twenty-four the plan describes', buildActions().length === 24);
  ok('F3  every move keeps cash directly before the GIA, which is what lets the grid merge them', buildActions().every(a => a.steps.indexOf('other') === a.steps.indexOf('cash') + 1));
  ok('F4  ...and the pension steps in band order', buildActions().every(a => { const i = ['penPA', 'penBasic', 'penAny'].map(x => a.steps.indexOf(x)); return i[0] < i[1] && i[1] < i[2]; }));
}

console.log('=========== G. TIMING, ON THE RECORD ===========');
{
  const r = solve(E, M, prep(at('S280').plan), { points: 12 });
  console.log(`      one household, 12 points, ${r.meta.years} years, ${r.meta.actions} moves: ${(r.meta.ms / 1000).toFixed(1)}s, ${r.meta.evaluated} moves evaluated`);
  console.log('      (not asserted: the plan\'s budget is under 4s and belongs to the fast flow, which does not exist yet)');
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
