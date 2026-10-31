/*
 * THE STORED POLICY MUST HOLD EVERY MOVE INDEX. With tiers and five spending levels the menu has 360
 * moves; the table was a Uint8Array, so an index above 255 wrapped to a different move - and the final
 * year of every simulated path reads its move from that table. This pins the width.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, chooseAction } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const sc = buildScenarios().find(s => s.id === 'S162');
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const r = solve(E, M, plan, { points: 10, lambda: 0.5, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], tiers: true, lump: true });
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; };
ok(r.actions.length > 256, `the menu is wider than a byte (${r.actions.length} moves)`);
ok(!(r.pol[0] instanceof Uint8Array), 'the stored policy is not a byte array');
let maxStored = 0; for (const p of r.pol) for (const v of p) if (v > maxStored) maxStored = v;
ok(maxStored < r.actions.length, 'every stored move is a real move');
ok(Math.max(...r.pol.map(p => Math.max(...p))) === maxStored, 'max read back consistently');
// the final year reads the stored move: it must be a valid index and round-trip exactly
const T = r.m.ctx.totalYears, s = vecOf(r.m, M.initialState(r.m));
const ai = chooseAction(r, s, T);
ok(Number.isInteger(ai) && ai >= 0 && ai < r.actions.length, 'the final-year move is a valid index');
console.log(`solver-pol-width: ${n} passed (largest stored move ${maxStored} of ${r.actions.length})`);
