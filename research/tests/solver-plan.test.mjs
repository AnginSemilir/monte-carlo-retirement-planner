/*
 * THE PRODUCT ENTRY POINT (PLAN.md finding M1). `solvePlan` must be exactly `solveMixture` with the decided
 * baseline written out - so the app can never inherit the research engine's historical defaults - and
 * `solve()`'s own defaults must be untouched, because every recorded result is written against them.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, solveMixture, solvePlan, productLevels, PRODUCT_BASELINE, PRODUCT_DEFAULTS } from '../../src/solver/solve.js';
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
ok(a.meta.riskAbove && a.meta.riskAbove.decision === 'off: no tier above the plan', 'by default, a plan whose pension is at the top tier gets no risk above and no extra simulation');
// step 6's defaults written out: raises capped at 1.1; S162 carries a minimum pot of its own, which is kept
const ownPot = E.num(plan.config.solvencyFloor, 0);
ok(ownPot > 0, `S162 carries its own minimum pot (GBP${ownPot}), and the default does not replace it`);
const b = solveMixture(E, M, plan, { ...PRODUCT_BASELINE, points: 8, lambda: 0.5, raiseCap: 1.1, spendLevels: productLevels(m.ctx.floorFrac), lump: m.ctx.fullLumpSum, tiers: true });
let same = a.mix.tables.length === b.mix.tables.length;
a.mix.tables.forEach((ta, k) => { const tb = b.mix.tables[k]; for (let t = 0; t < ta.lsurv.length; t++) for (let i = 0; i < ta.g.size; i++) if (ta.lsurv[t][i] !== tb.lsurv[t][i] || ta.beq[t][i] !== tb.beq[t][i] || ta.short[t][i] !== tb.short[t][i] || ta.pol[t][i] !== tb.pol[t][i]) same = false; });
ok(same, 'solvePlan equals solveMixture with the baseline written out, bit for bit, in every world');
ok(a.meta.wR === 0 && a.meta.levelSearch === 'exhaustive' && a.meta.raiseWeight === 0.003 && a.meta.tiers && a.finalExact, 'the result records the product baseline: full scan, exact final year');
ok(a.g.shareDead === null, 'no #106 option: neither passed its re-check');
const noRisk = solvePlan(E, M, plan, { lambda: 0.5, points: 8, riskConsent: false });
ok(!noRisk.meta.tiers, 'without consent to change risk there are no tier moves');

// step 6 (24 Sep): the decided defaults, and what the user can change
ok(a.meta.raiseSurvival === true && a.meta.failureShortfall === 'floor', 'the M17 floor fix is on');
ok(Math.max(...a.meta.spendLevels) === 1.1, 'raises are capped at 110% by default');
ok(a.m.ctx.solvencyFloor === ownPot, "a plan's own minimum pot is kept");
const bare = solvePlan(E, M, { ...plan, config: { ...plan.config, solvencyFloor: 0 } }, { lambda: 0.5, points: 8 });
ok(bare.m.ctx.solvencyFloor === Math.round(PRODUCT_DEFAULTS.minPotYears * target), 'a plan with none gets one year of target spending');
const blocked = solvePlan(E, M, plan, { lambda: 0.5, points: 8, raiseCap: 1, minPotYears: 0 });
ok(Math.max(...blocked.meta.spendLevels) === 1 && !(blocked.m.ctx.solvencyFloor > 0), 'the user can block raises and ask for no minimum pot');
const est = solvePlan(E, M, plan, { lambda: 0.5, points: 8, estateWeight: 0 });
ok(est.meta.bequestWeight > 0 && Math.abs(est.meta.bequestWeight - 0.01) < 1e-12 && est.meta.bequestShape === 'logfloor', 'an estate setting of 0% means a weight of 0.01, never zero (M20)');
const up = solvePlan(E, M, plan, { lambda: 0.5, points: 8, riskAbove: true });
ok(up.meta.tiers.length === a.meta.tiers.length, 'asking for risk above changes nothing when the pension is already at the top tier (every library household, M21)');
const med = { ...plan, accounts: plan.accounts.map(x => (/^Pensions|^S&S ISA/.test(x.category) ? { ...x, risk: 'Medium Risk' } : x)) };
const medOff = solvePlan(E, M, med, { lambda: 0.5, points: 8, riskAbove: false }), medUp = solvePlan(E, M, med, { lambda: 0.5, points: 8, riskAbove: true });
ok(medUp.meta.tiers.length === medOff.meta.tiers.length + 1, 'held at Medium, risk above adds exactly one tier when asked for (M14)');
ok(solvePlan(E, M, med, { lambda: 0.5, points: 8, riskAbove: true, riskConsent: false }).meta.tiers === null, 'and never without consent to change risk');
// by default it is decided per plan: thin (simulated survival below 95% without it) and no worse on the same paths
const auto = solvePlan(E, M, med, { lambda: 0.5, points: 8, thinPaths: 200 });
const d = auto.meta.riskAbove;
ok(d && typeof d.survivalWithout === 'number' && (d.survivalWithout >= 0.95 ? /not thin/.test(d.decision) && auto.meta.tiers.length === medOff.meta.tiers.length : /thin/.test(d.decision)), `held at Medium, the default decides by simulated survival: ${d && d.decision} (${d && (100 * d.survivalWithout).toFixed(1)}% without${d && d.survivalWith !== undefined ? `, ${(100 * d.survivalWith).toFixed(1)}% with` : ''})`);
ok(!d || !/^on/.test(d.decision) || d.survivalWith >= d.survivalWithout, 'it is kept only when no worse on the same paths');
const thin = { ...med, spending: { ...med.spending, targetSpend: Math.round(1.6 * target), floorSpend: Math.round(0.8 * 1.6 * target) } };
const dt = solvePlan(E, M, thin, { lambda: 0.5, points: 8, thinPaths: 200 }).meta.riskAbove;
ok(dt.survivalWithout < 0.95 && /^(on|off): thin/.test(dt.decision), `a thin plan (spending raised to 1.6x) is checked with it: ${dt.decision} (${(100 * dt.survivalWithout).toFixed(1)}% -> ${(100 * dt.survivalWith).toFixed(1)}%)`);
ok(solvePlan(E, M, thin, { lambda: 0.5, points: 8, riskConsent: false, thinPaths: 200 }).meta.riskAbove.decision === 'off: no consent to change risk', 'and without consent the default never applies');
assert.throws(() => solvePlan(E, M, plan, { lambda: 0.5, points: 8, giaTiers: true }), /taxable/); n++; console.log('PASS  the taxable account\'s tier is refused in the product (M15)');

// the research engine's own defaults are untouched
const r = solve(E, M, plan, { points: 8 });
ok(r.meta.wR === 0.5 && r.meta.levelSearch === 'exhaustive' && r.meta.raiseWeight === 0 && r.g.shareDead === null, 'solve() keeps its historical defaults');
console.log(`solver-plan: ${n} passed`);
