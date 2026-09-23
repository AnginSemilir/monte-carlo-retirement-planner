/*
 * PHASE V1: the quadrature order is a parameter. Absent or 5 must reproduce the tabulated five-node
 * solve bit for bit (every existing result depends on it); another order must run through both the
 * backward pass and `scoreMoves`, which reads the table's own weights.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, scoreMoves, gaussHermite, WEIGHTS } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const sc = buildScenarios().find(s => s.id === 'S162');
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const opts = { points: 12, lambda: 0.5, spendLevels: [1, 0.9, 0.8] };
let n = 0;
const ok = (c, msg) => { assert.ok(c, msg); n++; };

const base = solve(E, M, plan, opts);
const five = solve(E, M, plan, { ...opts, quadNodes: 5 });
let same = true;
for (let t = 0; t < base.lsurv.length; t++) for (let i = 0; i < base.g.size; i++) if (base.lsurv[t][i] !== five.lsurv[t][i] || base.pol[t][i] !== five.pol[t][i]) same = false;
ok(same, 'quadNodes 5 is bit-identical to the default');
ok(base.quadWeights === WEIGHTS, 'the default carries the tabulated weights');

const nine = solve(E, M, plan, { ...opts, quadNodes: 9 });
ok(nine.quadWeights.length === 9, 'nine weights carried on the result');
ok(Math.abs(nine.quadWeights.reduce((a, b) => a + b, 0) - 1) < 1e-12, 'nine weights sum to one');
ok(nine.nodeRealOfAt[0][0].length === 9, 'nine growth rates per move');
const s0 = vecOf(nine.m, M.initialState(nine.m));
const A = nine.actions.length, SC = new Float64Array(A), TX = new Float64Array(A), BQ = new Float64Array(A);
scoreMoves(nine, s0, 0, SC, TX, BQ);
ok([...SC].some(Number.isFinite), 'scoreMoves scores with nine nodes');
const v5 = base.value(M.initialState(base.m), 0).survival, v9 = nine.value(M.initialState(nine.m), 0).survival;
ok(Math.abs(v9 - v5) < 0.05, `nine nodes land near five at the opening cell (${(100 * v5).toFixed(2)} vs ${(100 * v9).toFixed(2)})`);
ok(gaussHermite(9).nodes.length === 9, 'gaussHermite(9) has nine nodes');
console.log(`solver-quadnodes: ${n} passed`);
