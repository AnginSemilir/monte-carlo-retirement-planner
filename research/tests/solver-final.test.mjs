/*
 * THE FINAL YEAR, SCORED EXACTLY (`finalExact`, 23 Sep). Found by the step-2 records: the last year read the
 * stored move of the NEAREST cell, and from a near-empty position that cell could afford a move the real
 * position could not. Off, everything is bit-identical to before; on, the tables are untouched and the final
 * year's move is the exact argmax of the end-of-plan score at the true position.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, chooseAction } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const sc = buildScenarios().find(s => s.id === 'S206');
const target = E.num(sc.plan.spending.targetSpend, 0);
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0, solvencyFloor: 1 * target }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * target) } }));
const base = { points: 8, lambda: 0.1, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], resilienceWeight: 0, lump: true };
const off = solve(E, M, plan, base), on = solve(E, M, plan, { ...base, finalExact: true });
const T = off.m.ctx.totalYears;

let same = true;
for (let t = 0; t <= T; t++) for (let i = 0; i < off.g.size; i++) if (off.lsurv[t][i] !== on.lsurv[t][i] || off.pol[t][i] !== on.pol[t][i] || off.beq[t][i] !== on.beq[t][i]) same = false;
ok(same, 'the option leaves every table and stored move bit-identical: it changes only the final-year read');

// random positions in the final year, from near-empty to comfortable
let seed = 11; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const s0 = vecOf(off.m, M.initialState(off.m));
const states = [];
for (let k = 0; k < 300; k++) {
  const W = target * (0.3 + 3 * rnd() * rnd()), a = rnd(), b = rnd();
  const s = Float64Array.from(s0); s[0] = a * W; s[1] = b * (1 - a) * W; s[2] = (1 - a) * (1 - b) * W; s[3] = 0.25 * rnd(); s[6] = -1;
  states.push(s);
}
let snapSame = true;
for (const s of states) if (off.actions[chooseAction(off, Float64Array.from(s), T)] !== off.policy(Float64Array.from(s), T)) snapSame = false;
ok(snapSame, 'off, the final year still reads the nearest cell\'s stored move');

// the exact end-of-plan score, computed here from first principles
const { floor, deathTax, beqOf } = on.terminal;
const exactScore = (r, s, ai) => {
  const post = Float64Array.from(s); const unmet = F.flow(r.c, T, ai, post);
  if (unmet > 1 || r.c.last.preNmpaInsolvent) return -Infinity;
  let sv = 0, bq = 0; const nr = r.nodeRealOfAt[T][ai];
  r.quadWeights.forEach((w, zi) => { const g = Float64Array.from(post); F.grow(r.c, T, g, nr[zi]); const tot = g[0] + g[1] + g[2]; const alive = !(floor > 0 && tot < floor); sv += w * (alive ? 1 : 0); bq += w * (alive ? beqOf(Math.max(0, tot - g[0] * deathTax)) : 0); });
  return sv + r.wB * bq - (r.c.yr.spend[T] > 0 ? r.costOf(r.levelOf[ai]) : 0);
};
let argmaxOk = true, feasibleOk = true, snapFails = 0, exactFails = 0;
for (const s of states) {
  const chosen = chooseAction(on, Float64Array.from(s), T);
  const scores = on.actions.map((_, ai) => exactScore(on, s, ai));
  const best = Math.max(...scores);
  if (Math.abs(scores[chosen] - best) > 1e-12) argmaxOk = false;
  const anyFeasible = scores.some(x => x > -Infinity);
  if (anyFeasible && scores[chosen] === -Infinity) feasibleOk = false;
  const snapped = chooseAction(off, Float64Array.from(s), T);
  const fails = (ai) => { const p = Float64Array.from(s); const u = F.flow(on.c, T, ai, p); return u > 1 || on.c.last.preNmpaInsolvent; };
  if (anyFeasible && fails(snapped)) snapFails++;
  if (anyFeasible && fails(chosen)) exactFails++;
}
ok(argmaxOk, 'on, the final-year move is the exact argmax of the end-of-plan score at the true position (300 positions)');
ok(feasibleOk && exactFails === 0, 'on, the final year never picks a move that fails when one that pays exists');
console.log(`      of the same 300 positions, the nearest-cell move fails outright where a paying move exists on ${snapFails}`);
console.log(`solver-final: ${n} passed`);
