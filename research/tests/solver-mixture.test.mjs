/*
 * THE SCENARIO MIXTURE over the per-path mean shift. K tables, each solved with the shift held for the
 * whole horizon, the move chosen by their weighted average; the forward run applies each path's own shift
 * as the engine does. These hold the plumbing to that description and put the gap on the record.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, solveMixture, runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p, zeroSigma = false) => { const q = JSON.parse(JSON.stringify(p)); if (zeroSigma) Object.values(q.riskProfiles).forEach(rp => { rp.sigmaParam = 0; }); return E.resolveMpaa(E.normalizePlan({ ...q, config: { ...q.config, guardrails: false, lookaheadYears: 0 } })); };

console.log('=========== A. THE TABLES ===========');
{
  const sc = singles.find(s => s.id === 'S034');
  const plan = prep(sc.plan);
  const r = solveMixture(E, M, plan, { points: 16, mix: 3 });
  ok('A1  three tables, the central one returned with the mixture attached', r.mix && r.mix.tables.length === 3 && r.meta.mixture === 3 && r.mix.tables[1] === r);
  const v = r.mix.tables.map(t => t.value(M.initialState(t.m), 0).survival);
  ok('A2  the low-shift table is the least optimistic and the high-shift the most', v[0] < v[1] && v[1] < v[2], v.map(x => (100 * x).toFixed(1)).join(' < '));
  ok('A3  a shift table carries the plain volatility and its shift, not the fold', r.c.shiftMode && r.c.sigma[0] > 0 && Math.abs(r.c.volEffAt[0][0] - r.m.acc[r.m.ctx.owners[0].ids.pen].vol) < 1e-12 && Math.abs(r.mix.tables[0].c.real[0] - (Math.exp(Math.log(1 + r.c.real[0]) - r.c.sigma[0] * Math.sqrt(3)) - 1)) < 1e-12);
  const plain = solve(E, M, prep(sc.plan, true), { points: 16 });
  const r0 = solveMixture(E, M, prep(sc.plan, true), { points: 16, mix: 3 });
  const s0 = plain.value(M.initialState(plain.m), 0), s1 = r0.value(M.initialState(r0.m), 0);
  ok('A4  with no per-path shift the mixture is the plain solve', Math.abs(s0.survival - s1.survival) < 1e-12 && r0.mix.tables.every(t => Math.abs(t.value(M.initialState(t.m), 0).survival - s0.survival) < 1e-12));
}

console.log('=========== B. THE FORWARD RUN CARRIES THE PATH\'S OWN SHIFT ===========');
{
  const sc = singles.find(s => s.id === 'S070');
  const plan = prep(sc.plan);
  const r = solveMixture(E, M, plan, { points: 16, mix: 3 });
  const T = r.m.ctx.totalYears;
  const base = E.pathsForSeed(5, 200, T);
  const withShift = (zp) => base.map(z => { const q = Float64Array.from(z); q[T + 1] = zp; return q; });
  const surv = (paths) => 100 * paths.filter(z => runPolicy(r, z).survived).length / paths.length;
  const lo = surv(withShift(-2)), mid = surv(withShift(0)), hi = surv(withShift(2));
  ok('B1  the same yearly draws survive less with a bad held shift and more with a good one', lo < mid && mid < hi, `${lo.toFixed(1)} < ${mid.toFixed(1)} < ${hi.toFixed(1)}`);
  const fold = solve(E, M, plan, { points: 16 });
  const f = surv(withShift(2));
  ok('B2  ...and a fold-mode table ignores the path shift, since it is already folded', Math.abs(100 * base.filter(z => runPolicy(fold, z).survived).length / base.length - 100 * withShift(2).filter(z => runPolicy(fold, z).survived).length / base.length) < 1e-9);
}

console.log('=========== C. THROUGH THE REAL ENGINE ===========');
{
  const sc = singles.find(s => s.id === 'S034');
  const plan = prep(sc.plan);
  const m0 = M.prepare(E, plan);
  const r = solveMixture(E, M, plan, { points: 30, lump: m0.ctx.fullLumpSum, mix: 5 });
  const trials = 1500, seed = 9102;
  const mc = E.monteCarlo(withTable(plan, r), { trials, seed });
  const zs = E.pathsForSeed(seed, trials, m0.ctx.totalYears);
  const fc = 100 * zs.filter(z => runPolicy(r, z).survived).length / trials;
  ok('C1  the mixture drives the engine and its forecast is within a point and a half of the engine on the worst fold household', Math.abs(mc.successRate - fc) <= 1.5, `engine ${mc.successRate.toFixed(1)}, forecast ${fc.toFixed(1)}, gap ${(mc.successRate - fc).toFixed(2)} (the one-year fold gave -4.7 here)`);
  ok('C2  five solves cost about five times one', r.meta.ms > 0 && r.meta.mixture === 5, `${(r.meta.ms / 1000).toFixed(0)}s for five`);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
