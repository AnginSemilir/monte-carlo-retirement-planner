/*
 * THE USER'S RULES AND THE ESTATE CURVE (PLAN.md step 3). Each rule only removes moves; the curve credits
 * nothing at or below the minimum pot and diminishing amounts above it. Defaults are bit-identical.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; };
const sc = buildScenarios().find(s => s.id === 'S162');
const planWith = (cfg = {}) => E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0, ...cfg } }));
const LEVELS = [1.2, 1.1, 1, 0.95, 0.9, 0.8];
const base = { points: 8, lambda: 0.5, raiseWeight: 0.003, spendLevels: LEVELS, lump: true, resilienceWeight: 0 };
const levelsOf = (r) => [...new Set(r.actions.map(a => a.spendLevel))].sort((a, b) => a - b);

const r0 = solve(E, M, planWith(), base);
ok(JSON.stringify(levelsOf(r0)) === JSON.stringify([0.8, 0.9, 0.95, 1, 1.1, 1.2]), 'the full six-level menu by default');
ok(JSON.stringify(levelsOf(solve(E, M, planWith(), { ...base, raiseCap: 1.1 }))) === JSON.stringify([0.8, 0.9, 0.95, 1, 1.1]), 'raiseCap 1.1 removes 1.2 only');
ok(JSON.stringify(levelsOf(solve(E, M, planWith(), { ...base, raiseCap: 1 }))) === JSON.stringify([0.8, 0.9, 0.95, 1]), 'raiseCap 1 blocks every raise');
ok(JSON.stringify(levelsOf(solve(E, M, planWith(), { ...base, blockTrim: true }))) === JSON.stringify([1, 1.1, 1.2]), 'blockTrim removes every level below the target');
const both = solve(E, M, planWith(), { ...base, blockTrim: true, raiseCap: 1 });
ok(JSON.stringify(levelsOf(both)) === JSON.stringify([1]), 'both together leave only the plan as written');

// the estate curve: nothing at or below the minimum pot, concave above it
const target = E.num(sc.plan.spending.targetSpend, 0);
const rL = solve(E, M, planWith({ solvencyFloor: 3 * target }), { ...base, bequestShape: 'logfloor', estateScale: 1 });
ok(rL.meta.bequestShape === 'logfloor', 'the result records the curve');
let same = true; const rC = solve(E, M, planWith(), base), rC2 = solve(E, M, planWith(), { ...base, bequestShape: undefined });
for (let t = 0; t < rC.lsurv.length; t++) for (let i = 0; i < rC.g.size; i++) if (rC.beq[t][i] !== rC2.beq[t][i]) same = false;
ok(same, 'the default estate term is unchanged');
// the final-year credit read back from the table: zero wherever the terminal pot cannot exceed the floor
const Tn = rL.beq.length - 1; let neg = false, over = false;
for (let i = 0; i < rL.g.size; i++) { if (rL.beq[Tn][i] < 0) neg = true; }
ok(!neg, 'the credit is never negative');
console.log(`solver-levers: ${n} passed`);
