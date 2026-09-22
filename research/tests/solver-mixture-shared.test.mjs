/*
 * PHASE E0: THE MIXTURE SOLVES ITS WORLDS SIDE BY SIDE, SHARING ONE FLOW A CELL.
 *
 * `solveMixture` used to be `zs.map(z => solve(...))` - K independent solves, each rebuilding every
 * post-decision state. `F.flow` moves the year's money and reads only structural fields of the action
 * and the context; the world's held shift reaches the arithmetic solely through `nodeRealOfAt`, because
 * `F.grow` takes the rates as a parameter. So the K tables can be built side by side with one flow a
 * cell shared between them, and what comes out must be what the separate solves produced.
 *
 * These checks are the durable form of gate E0. The gate itself compared against a verbatim copy of the
 * solver as it stood before the change (`_solve-before-e0.js`, deleted when E0 merged); that copy cannot
 * live forever, so the question is asked here in the form that survives: the interleaved build must
 * equal K separate builds made by THIS code, and must make a Kth of the flow calls.
 *
 * Measured when E0 landed, 22 Sep, S004 at 30 points: flow calls 19,595,520 -> 6,531,840 exactly, and
 * three separate solves 34.3s -> 20.7s interleaved with tiers off (1.66x), 62.7s -> 47.0s with tiers on
 * (1.33x), against a 1.5x / 1.2x forecast.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, solveMixture } from '../../src/solver/solve.js';
import { tiersFor } from '../../src/solver/fast.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const MIX3 = [-Math.sqrt(3), 0, Math.sqrt(3)];
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const POINTS = 20;

console.log('=========== A. THE INTERLEAVED BUILD IS THE SEPARATE BUILDS, TO THE BIT ===========');
for (const id of ['S004', 'S178']) {
  const plan = prep(singles.find(x => x.id === id).plan);
  const m = M.prepare(E, plan);
  for (const tiers of [false, true]) {
    const o = { points: POINTS, lump: m.ctx.fullLumpSum, tiers: tiers ? tiersFor(m) : undefined };
    const sep = MIX3.map(z => solve(E, M, plan, { ...o, shiftZ: z }));
    const mix = solveMixture(E, M, plan, { ...o, mix: 3 });
    const eq = mix.mix.tables.every((tab, k) =>
      ['surv', 'beq', 'resil', 'short'].every(kk => tab[kk].every((v, t) => same(Array.from(v), Array.from(sep[k][kk][t]))))
      && tab.pol.every((v, t) => same(Array.from(v), Array.from(sep[k].pol[t]))));
    ok(`A  ${id} tiers ${tiers ? 'on ' : 'off'}: all three worlds equal three separate solves`, eq);
  }
}

console.log('=========== B. THE SINGLE-WORLD PATH IS UNTOUCHED BY CARRYING K ===========');
{
  /*
   * Carrying K through `solve` restructured the ordinary path too, and that path is what every other
   * test and the whole of Part C use. A K = 1 build must be reproducible and must not depend on being
   * reached through the mixture.
   */
  const plan = prep(singles.find(x => x.id === 'S004').plan);
  const m = M.prepare(E, plan);
  const o = { points: POINTS, lump: m.ctx.fullLumpSum };
  const a = solve(E, M, plan, o), b = solve(E, M, plan, o);
  ok('B1  two single-world solves of the same plan agree to the bit',
    a.pol.every((p, t) => same(Array.from(p), Array.from(b.pol[t]))) && a.surv.every((v, t) => same(Array.from(v), Array.from(b.surv[t]))));
  ok('B2  a single-world solve carries a one-element world list holding itself', a.worlds.length === 1 && a.worlds[0] === a);
  const centre = solve(E, M, plan, { ...o, shiftZ: 0 });
  const mix = solveMixture(E, M, plan, { ...o, mix: 3 });
  ok('B3  the mixture presents the middle world, which is the zero-shift solve',
    mix.mix.tables.length === 3 && mix.mix.tables[1] === mix
    && centre.pol.every((p, t) => same(Array.from(p), Array.from(mix.pol[t]))));
}

console.log('=========== C. THE WORK IS SHARED, NOT MERELY TIMED ===========');
{
  /*
   * The gate is the call count, not the clock: a 1.2x claim sits inside timing noise, so a build that
   * shared nothing could still look convincing on a stopwatch. This needs SOLVER_PROFILE=1; without it
   * the counters are absent and the check reports that rather than passing silently.
   */
  const plan = prep(singles.find(x => x.id === 'S004').plan);
  const m = M.prepare(E, plan);
  const o = { points: POINTS, lump: m.ctx.fullLumpSum, tiers: tiersFor(m) };
  const sep = MIX3.map(z => solve(E, M, plan, { ...o, shiftZ: z }));
  const mix = solveMixture(E, M, plan, { ...o, mix: 3 });
  const sepFlows = sep.reduce((a, x) => a + (x.meta.profile ? x.meta.profile.flows : 0), 0);
  const mixFlows = mix.meta.profile ? mix.meta.profile.flows : 0;
  if (sepFlows && mixFlows) ok('C1  the interleaved mixture makes exactly a third of the flow calls',
    sepFlows === 3 * mixFlows, `${mixFlows} against ${sepFlows}`);
  else console.log('SKIP  C1  needs SOLVER_PROFILE=1 for the flow counters');
}

console.log(`\n=========== ${passed} passed, ${failed} failed ===========`);
process.exit(failed ? 1 : 0);
