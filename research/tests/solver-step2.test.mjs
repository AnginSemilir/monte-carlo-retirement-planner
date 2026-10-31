/*
 * STEP 2 SOLVER CHANGES (PLAN.md step 2): the ternary level search and the #106 share-dead treatments.
 * Both default off, so the default solve must be bit-identical; each option must do what it claims.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; };
const planOf = (id) => { const sc = buildScenarios().find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } })); };
const LEVELS = [1.2, 1.1, 1, 0.95, 0.9, 0.8];

// 1. the ternary search: close to the exhaustive scan, and never worse where it agrees
{
  const plan = planOf('S162');
  const base = { points: 12, lambda: 0.5, raiseWeight: 0.003, spendLevels: LEVELS, tiers: true, lump: true, resilienceWeight: 0 };
  const ex = solve(E, M, plan, base), te = solve(E, M, plan, { ...base, levelSearch: 'ternary' });
  let diff = 0, cells = 0, maxDv = 0;
  for (let t = 0; t < ex.pol.length; t++) for (let i = 0; i < ex.g.size; i++) { cells++; if (ex.pol[t][i] !== te.pol[t][i]) diff++; maxDv = Math.max(maxDv, Math.abs(ex.surv[t][i] - te.surv[t][i])); }
  ok(te.meta.levelSearch === 'ternary' && ex.meta.levelSearch === 'exhaustive', 'meta records the search');
  ok(diff / cells < 0.005, `ternary stores the exhaustive move on all but ${(100 * diff / cells).toFixed(3)}% of cells`);
  ok(maxDv < 0.01, `survival tables agree within a point everywhere (max ${(100 * maxDv).toFixed(3)})`);
  ok(te.meta.evaluated < ex.meta.evaluated, `ternary evaluates fewer flows (${te.meta.evaluated} against ${ex.meta.evaluated})`);
}

// 2. the share-dead treatments on S126, the household #106 is about
{
  const plan = planOf('S126');
  const base = { points: 12, lambda: 0.022, spendLevels: [1, 0.9, 0.8], lump: true, resilienceWeight: 0 };
  const v = (o) => { const r = solve(E, M, plan, { ...base, ...o }); return { r, v: r.value(M.initialState(r.m), 0).survival }; };
  const none = v({}), none2 = v({ shareDead: null }), drop = v({ shareDead: 'drop' }), lin = v({ shareDead: 'linear' });
  let same = true; for (let t = 0; t < none.r.lsurv.length; t++) for (let i = 0; i < none.r.g.size; i++) if (none.r.lsurv[t][i] !== none2.r.lsurv[t][i]) same = false;
  ok(same, 'shareDead unset is bit-identical');
  ok(drop.r.g.shareDead === 'drop' && lin.r.g.shareDead === 'linear', 'the grid carries the option');
  // the opening read goes through interp (value), the tables through readValues: check the tables moved
  let moved = 0; for (let t = 0; t < 3; t++) for (let i = 0; i < none.r.g.size; i++) if (Math.abs(none.r.surv[t][i] - drop.r.surv[t][i]) > 0.05) moved++;
  ok(moved > 0, `'drop' changes the early-year tables where a dead share corner sat (${moved} cells moved by over 5 points)`);
}
console.log(`solver-step2: ${n} passed`);
