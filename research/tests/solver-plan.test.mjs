/*
 * THE PRODUCT ENTRY POINT (PLAN.md finding M1). `solvePlan` must be exactly `solveMixture` with the decided
 * baseline written out - so the app can never inherit the research engine's historical defaults - and
 * `solve()`'s own defaults must be untouched, because every recorded result is written against them.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, solveMixture, solvePlan, productLevels, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const sc = buildScenarios().find(s => s.id === 'S162');
const target = E.num(sc.plan.spending.targetSpend, 0);
const planWith = (floorFrac) => E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(floorFrac * target) } }));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// the menu for a floor
ok(eq(productLevels(0.8), [1.2, 1.1, 1, 0.95, 0.9, 0.8]), 'a floor of 80% gives the six-level menu');
ok(eq(productLevels(0.85), [1.2, 1.1, 1, 0.95, 0.9, 0.85]), 'the lowest level is always the floor itself');
ok(eq(productLevels(0.9), [1.2, 1.1, 1, 0.95, 0.9]), 'a floor at 90% is not duplicated');
ok(eq(productLevels(1), [1.2, 1.1, 1]), 'a floor at the target (block trimming) leaves nothing below 1');
assert.throws(() => solvePlan(E, M, planWith(0.8), {}), /lambda/); n++; console.log('PASS  solvePlan refuses to run without the dislike-of-cuts setting');

// bit-identity with the options written out, on every world's tables
const plan = planWith(0.8);
const m = M.prepare(E, plan);
const a = solvePlan(E, M, plan, { lambda: 0.5, points: 8 });
const b = solveMixture(E, M, plan, { ...PRODUCT_BASELINE, points: 8, lambda: 0.5, spendLevels: productLevels(m.ctx.floorFrac), lump: m.ctx.fullLumpSum, tiers: true });
let same = a.mix.tables.length === b.mix.tables.length;
a.mix.tables.forEach((ta, k) => { const tb = b.mix.tables[k]; for (let t = 0; t < ta.lsurv.length; t++) for (let i = 0; i < ta.g.size; i++) if (ta.lsurv[t][i] !== tb.lsurv[t][i] || ta.beq[t][i] !== tb.beq[t][i] || ta.short[t][i] !== tb.short[t][i] || ta.pol[t][i] !== tb.pol[t][i]) same = false; });
ok(same, 'solvePlan equals solveMixture with the baseline written out, bit for bit, in every world');
ok(a.meta.wR === 0 && a.meta.levelSearch === 'ternary' && a.meta.raiseWeight === 0.003 && a.meta.tiers, 'the result records the product baseline');
ok(a.g.shareDead === PRODUCT_BASELINE.shareDead, 'the chosen #106 read is on');
const noRisk = solvePlan(E, M, plan, { lambda: 0.5, points: 8, riskConsent: false });
ok(!noRisk.meta.tiers, 'without consent to change risk there are no tier moves');

// the research engine's own defaults are untouched
const r = solve(E, M, plan, { points: 8 });
ok(r.meta.wR === 0.5 && r.meta.levelSearch === 'exhaustive' && r.meta.raiseWeight === 0 && r.g.shareDead === null, 'solve() keeps its historical defaults');
console.log(`solver-plan: ${n} passed`);
