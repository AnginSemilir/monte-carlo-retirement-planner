/*
 * A FAILED PATH KEEPS ITS SPENDING FIGURES (the eighteenth plan review, 24 Sep 15:06 UK). `runPolicy` returned early on a
 * failed path without `belowSum` and `aboveSum`, and experiment.mjs's statsFlex read them as 0 - so every below- and
 * above-target year of a failed path counted at level 0: the solver's depth too low, its total cut too high and its raise
 * total too low wherever paths fail (K5 stage 1: S070's cut read 3.02-5.49 where its paths spent 0.64-3.56).
 *
 * Pinned by an identity that holds on every path: a year is below target, at it, or above it, so
 *     levelSum = belowSum + aboveSum + (years exactly at target)       where years at target = atTarget - aboveTarget
 * (above-target years count in atTarget too). On the old code a failed path had no belowSum, and this is NaN.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, runPolicy } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };

// S070: a thin household (K5's twelve), where a small solve fails on a good share of paths
const sc = buildScenarios().find(s => s.id === 'S070');
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } }));
const m = M.prepare(E, plan);
const r = solve(E, M, plan, { points: 6, lump: m.ctx.fullLumpSum, lambda: 0.02, raiseWeight: 0.003, spendLevels: [1.1, 1, 0.95, 0.9, 0.8], resilienceWeight: 0, finalExact: true });
const outs = E.pathsForSeed(7002, 300, m.ctx.totalYears).map(zs => runPolicy(r, zs));
const failed = outs.filter(o => !o.survived), survived = outs.filter(o => o.survived);
ok(failed.length >= 10 && survived.length >= 10, `S070 at 6 points: both kinds of path to check (${failed.length} failed, ${survived.length} survived, of 300)`);
const identity = o => Math.abs(o.levelSum - o.belowSum - o.aboveSum - (o.atTarget - o.aboveTarget)) < 1e-6;
ok(failed.every(o => Number.isFinite(o.belowSum) && Number.isFinite(o.aboveSum)), 'planted: every failed path reports its below- and above-target totals');
ok(failed.every(identity), 'every failed path: level sum = below + above + years at target');
ok(survived.every(identity), 'every surviving path: the same identity');
// the depth a failed path reports is a real spending level, never the 0 the missing total used to give
const depthOf = o => (o.spendYears - o.atTarget > 0 ? o.belowSum / (o.spendYears - o.atTarget) : null);
ok(failed.filter(o => depthOf(o) !== null).every(o => depthOf(o) >= 0.8 - 1e-9), 'a failed path\'s level when below target is at or above the floor (0.8), never 0');

console.log(`\n${n} passed`);
