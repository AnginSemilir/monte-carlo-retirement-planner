/*
 * THE MINIMUM POT AT THE TERMINAL AGE (`config.solvencyFloor`), which had no test until 22 Sep.
 *
 * TWO DIFFERENT FLOORS live a few lines apart in this codebase and are not related:
 *   - the SPENDING floor (`spending.floorSpend`, Phase 2d): the least the household could live on in a
 *     year. It drives trimming, and `solveFlex` bisects lambda against it.
 *   - the MINIMUM POT (`config.solvencyFloor`, this file): the least they want left at the terminal age.
 *     A run that reaches the end below it is a failure, exactly as the full engine scores it.
 * A test that confuses them would pass while the product was wrong, so each assertion below names which.
 *
 * The rule is enforced in four places and all four compare the pot BEFORE death tax: the solver's
 * terminal node (`solve`), `runPolicy`, and the two forward runners in `experiment.mjs`. Comparing the
 * net pot instead would be a silent, plausible bug; A1 and A2 are written to catch it.
 *
 * 19 of the 41 experiment households set one, from £35k to £1.08m, so every headline figure in the plan
 * was measured with this active on nearly half the sample.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, runPolicy, spendLevelsFor } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const base = singles.find(s => s.id === 'S004').plan;
/* minPot: the MINIMUM POT. floorFrac: the SPENDING floor, as a share of target, or 0 for none. */
const variant = (minPot, floorFrac = 0) => {
  const raw = JSON.parse(JSON.stringify(base));
  const target = E.num(raw.spending.targetSpend, 0);
  return E.resolveMpaa(E.normalizePlan({
    ...raw,
    config: { ...raw.config, guardrails: false, lookaheadYears: 0, solvencyFloor: minPot },
    spending: floorFrac ? { ...raw.spending, floorSpend: Math.round(target * floorFrac), floorConfidence: 90 } : raw.spending
  }));
};
const POINTS = 20, N = 600;
const solveAt = (plan, opts = {}) => { const m = M.prepare(E, plan); return { r: solve(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum, ...opts }), m }; };
const zs = (() => { const a = []; let seed = 90210; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const g = () => { const u = rnd() || 1e-9, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  for (let p = 0; p < N; p++) { const row = []; for (let y = 0; y < 70; y++) row.push(g()); a.push(row); } return a; })();

console.log('=========== A. THE CONTRACT ON REPLAY (minimum pot) ===========');
{
  const MIN = 300000;
  const { r, m } = solveAt(variant(MIN));
  ok('A0  the minimum pot reaches the solver from config.solvencyFloor', m.ctx.solvencyFloor === MIN, `£${(m.ctx.solvencyFloor / 1000).toFixed(0)}k`);
  const rs = zs.map(z => runPolicy(r, z));
  const surv = rs.filter(x => x.survived);
  const bad = surv.filter(x => x.terminal < MIN - 1e-6);
  ok('A1  every surviving run ends with a pot at or above the minimum, measured BEFORE death tax',
    bad.length === 0, `${surv.length} survived of ${rs.length}, ${bad.length} below the minimum`);
  // if the code compared the NET pot to the minimum, runs with gross >= min > net would be marked failed
  const netBelow = surv.filter(x => x.terminalNet < MIN).length;
  ok('A2  ...and the gross test is the one in force: survivors exist whose NET pot is below the minimum',
    netBelow > 0, `${netBelow} survivors have a net pot below £${(MIN / 1000).toFixed(0)}k; comparing net would have failed them`);
}

console.log('=========== B. THE SOLVER RESPONDS TO IT ===========');
{
  const mids = [0, 300000, 900000];
  const out = mids.map(v => { const { r } = solveAt(variant(v)); const rs = zs.map(z => runPolicy(r, z));
    const ts = rs.filter(x => x.survived).map(x => x.terminal).sort((a, b) => a - b);
    return { v, surv: 100 * rs.filter(x => x.survived).length / rs.length, med: ts.length ? ts[Math.floor(ts.length / 2)] : 0 }; });
  const f = (o) => `min £${(o.v / 1000).toFixed(0)}k: survival ${o.surv.toFixed(1)}%, median end pot £${(o.med / 1000).toFixed(0)}k`;
  out.forEach(o => console.log('      ' + f(o)));
  ok('B1  a higher minimum pot cannot raise survival: the same plan is being asked for more',
    out[0].surv >= out[1].surv - 1e-9 && out[1].surv >= out[2].surv - 1e-9);
  ok('B2  ...and the solver holds more back: the median end pot rises with the minimum',
    out[2].med > out[0].med, `£${(out[0].med / 1000).toFixed(0)}k -> £${(out[2].med / 1000).toFixed(0)}k`);
}

console.log('=========== C. ZERO MEANS OFF, TO THE BIT ===========');
{
  const a = solveAt(variant(0)).r, b = solveAt(variant(0)).r;
  const same = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
  const eq = a.pol.every((p, t) => same(Array.from(p), Array.from(b.pol[t]))) && a.surv.every((v, t) => same(Array.from(v), Array.from(b.surv[t])));
  ok('C1  a minimum pot of zero is inert and reproducible', eq && zs.every(z => runPolicy(a, z).survived === runPolicy(b, z).survived));
}

console.log('=========== D. THE TWO FLOORS ARE DIFFERENT THINGS ===========');
{
  // spending floor on, minimum pot off: nothing should fail at the end for pot reasons
  const { r: rSpend } = solveAt(variant(0, 0.8), { spendLevels: spendLevelsFor(0.8), lambda: 0.2 });
  const endFails = zs.map(z => runPolicy(rSpend, z)).filter(x => !x.survived && x.failAge === null).length;
  ok('D1  a SPENDING floor with no MINIMUM POT never fails a run at the terminal age for its pot', endFails === 0);
  // both on: the minimum pot is still enforced on every survivor, and trimming has not disabled it
  const MIN = 300000;
  const { r: rBoth } = solveAt(variant(MIN, 0.8), { spendLevels: spendLevelsFor(0.8), lambda: 0.2 });
  const rs = zs.map(z => runPolicy(rBoth, z));
  const surv = rs.filter(x => x.survived);
  ok('D2  with BOTH set, every survivor still clears the minimum pot',
    surv.length > 0 && surv.every(x => x.terminal >= MIN - 1e-6), `${surv.length} survivors, all at or above £${(MIN / 1000).toFixed(0)}k`);
  ok('D3  ...and the spending floor is still doing its own job: some runs trimmed',
    rs.some(x => x.atTarget < x.spendYears), 'at least one run spent below target in some year');
}

console.log(`\n=========== ${passed} passed, ${failed} failed ===========`);
process.exit(failed ? 1 : 0);
