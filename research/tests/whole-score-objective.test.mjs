/*
 * THE WHOLE SCORE TIED TO THE SOLVER'S OBJECTIVE (the whole-score rule's committed check, part (c): drafts/whole-score-rule.md
 * row 7, "the scorer tied to the solver's objective by a test"). reduce-7aa.mjs's wholePaths scores each path of a run from its
 * trace, with its weights read from the run's logged lines (lambda and the levels from the ran line, scale and cap from the
 * joint line, the estate weight from the unit). It is a re-implementation; nothing tied it to solve.js. Here one solve at the
 * research settings is run forward (S370: 400 paths of seed 7002, where every term below is exercised), and every path is
 * scored twice:
 *   - by wholePaths, with its configuration built from the fields the audit mode logs, as the reducers build it;
 *   - by the solver's own objective, s + wR rs + wB b - h (solve.js scoreMoves), realised on the path with the solver's own
 *     closures where it exposes them (costOf, terminal.beqOf, wB, levelOf, lambda, shortExp); the run-out charge and survival
 *     are this test's restatement of solve.js's failCostAt (l.711-713) and its terminal rule, which it does not expose (the
 *     plan-auditor's MINOR 3 of 29 Sep; failureShortfall 'floor' is asserted, so they cannot drift unseen today): r.costOf on each lived spend year's chosen level (a trim's charge, or a raise's credit counted only in a
 *     future that survives: raiseSurvival), a run-out charged at the lowest level from its year on (failureShortfall
 *     'floor', solve.js failCostAt), the estate as r.terminal.beqOf of the end pot net of the death charge at r.wB, and
 *     nothing for a future that ends below the minimum pot (finalYearExact: survival and estate 0).
 * Stated before it ran (29 Sep): the two agree on every path to 1e-5 points (the trace keeps wealth in single precision) under the settings the whole-score reads use
 * (resilience weight 0, drift weight 0, switch charge 0, death charge 0), and each term is exercised on some path, or the
 * check ran on nothing. Terms the whole score leaves out by design, asserted zero here: resilience (wR), the drift cost and a
 * switch charge (P's arm is judged at the default objective, whose switch charge is 0). Planted: a wrong scale, a wrong
 * lambda, a raise counted on a future that fails, and the death charge on, must each break the agreement.
 *   node research/tests/whole-score-objective.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from '../solver/record.mjs';
import { wholePaths } from '../solver/reduce-7aa.mjs';
import { spendYears } from '../solver/reduce-7af.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const all = buildScenarios();
const prep = id => { const sc = all.find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } })); };
const ID = process.env.WS_ID || 'S370', NP = Number(process.env.WS_PATHS || 400), WB = 0.02;
const r = solvePlan(E, M, prep(ID), { lambda: 0.0223606797749979, points: 4, riskAbove: true, bridgeRead: 'reader', bequestWeight: WB });
const T = r.m.ctx.totalYears, Y = T + 1;

// the settings the whole-score reads use: the terms wholePaths leaves out are zero in the solver too
ok(r.wR === 0, `resilience weight ${r.wR}: 0`);
ok(r.driftCostOf.every(x => x === 0), 'drift cost 0 on every move');
ok(!(r.switchCharge > 0), `switch charge ${r.switchCharge || 0}: 0`);
ok(r.terminal.deathTax === 0, `the solver's death charge ${r.terminal.deathTax}: 0`);
ok(r.meta.failureShortfall === 'floor' && r.meta.raiseSurvival === true, `a run-out charged at the floor (${r.meta.failureShortfall}); a raise counted where the future survives (${r.meta.raiseSurvival})`);

// run forward with a trace, keeping each year's chosen move
const tr = makeTrace(NP, Y), chosen = Array.from({ length: NP }, () => new Int16Array(Y).fill(-1)), outs = [];
E.pathsForSeed(7002, NP, T).forEach((zs, i) => { tr.row = i; outs.push(runPolicy(r, zs, { trace: tr, visit: (t, s, held, ai) => { chosen[i][t] = ai; } })); });
const X = { ...tr, survived: Uint8Array.from(outs.map(o => (o.survived ? 1 : 0))) };

// wholePaths's configuration, from the fields the audit mode logs (audit-s126.mjs: the ran line's lambda and levels, the
// joint line's scale and cap, the unit's estate weight), as the reducers build it (reduce-7ah.mjs cfgOf)
const logged = { lambda: Number(String(r.meta.lambda)), floor: Math.min(...r.meta.spendLevels), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, a) => t + a.balance, 0))), cap: Math.round(r.meta.bequestCap), wb: WB };
const cfg = { ...logged, spendYears: spendYears(X, X) };

// the solver's own objective, realised on each path with the solver's closures
const failLevel = Math.min(...r.levelOf), spendY = t => r.c.yr.spend[t] > 0;
function solverScore(i, o = {}) {
  const out = outs[i], fy = tr.failYear[i], alive = out.survived;
  let h = 0, raise = 0;
  for (let t = 0; t <= T; t++) {
    if (!spendY(t)) continue;
    if (fy >= 0 && t >= fy) { h += r.lambda * Math.pow(1 - Math.min(1, failLevel), r.shortExp); continue; }
    const c = r.costOf(r.levelOf[chosen[i][t]]);
    if (c >= 0) h += c; else raise -= c;
  }
  // the end pot net of the solver's death charge (0 here, asserted), or a planted 40% of it
  const net = out.terminal * (1 - (o.deathTax ? 0.4 : r.terminal.deathTax)), est = alive ? r.terminal.beqOf(net) : 0;
  return 100 * ((alive ? 1 : 0) + r.wB * est - h + (alive || o.raiseDead ? raise : 0));
}

const W = wholePaths(X, cfg), S = outs.map((_, i) => solverScore(i));
let worst = 0; for (let i = 0; i < NP; i++) worst = Math.max(worst, Math.abs(W[i] - S[i]));
// each term exercised, or the check ran on nothing
const cnt = { cut: 0, raise: 0, fail: 0, belowPot: 0, alive: 0, capped: 0, raiseDead: 0 };
for (let i = 0; i < NP; i++) {
  const fy = tr.failYear[i], lv = t => r.levelOf[chosen[i][t]];
  let cut = false, rs = false; for (let t = 0; t <= T; t++) if (spendY(t) && chosen[i][t] >= 0 && (fy < 0 || t < fy)) { if (lv(t) < 1) cut = true; if (lv(t) > 1) rs = true; }
  if (cut) cnt.cut++; if (rs) cnt.raise++; if (fy >= 0) cnt.fail++; if (fy < 0 && !outs[i].survived) cnt.belowPot++;
  if (outs[i].survived) { cnt.alive++; if (outs[i].terminal > r.meta.bequestCap) cnt.capped++; } else if (rs) cnt.raiseDead++;
}
console.log(`  ${ID}, ${NP} paths: ${cnt.alive} survive, ${cnt.fail} run out, ${cnt.belowPot} end below the minimum pot; ${cnt.cut} with a trim, ${cnt.raise} with a raise (${cnt.raiseDead} of them failing); ${cnt.capped} end above the estate cap; largest |wholePaths - objective| ${worst.toExponential(2)} points`);
ok(cnt.alive > 0 && cnt.fail > 0 && cnt.belowPot > 0 && cnt.cut > 0 && cnt.raise > 0 && cnt.raiseDead > 0 && cnt.capped > 0, 'every term exercised: a future that survives, one that runs out, one that ends below the minimum pot, a trim, a raise, a raise on a future that fails, and an estate above the cap');
ok(worst < 1e-5, `wholePaths equals the solver's objective realised on every one of ${NP} paths (largest gap ${worst.toExponential(2)} points; the trace keeps wealth in single precision)`);

// planted: each fault must break the agreement on some path
const gap = (A, B) => { let g = 0; for (let i = 0; i < NP; i++) g = Math.max(g, Math.abs(A[i] - B[i])); return g; };
ok(gap(wholePaths(X, { ...cfg, scale: 2 * cfg.scale }), S) > 1e-3, 'planted: wholePaths at twice the scale disagrees');
ok(gap(wholePaths(X, { ...cfg, lambda: 2 * cfg.lambda }), S) > 1e-3, 'planted: wholePaths at twice lambda disagrees');
ok(gap(W, outs.map((_, i) => solverScore(i, { deathTax: true }))) > 1e-3, 'planted: the objective with a 40% charge on the end pot disagrees (O53: the whole score needs the charge off)');
ok(gap(W, outs.map((_, i) => solverScore(i, { raiseDead: true }))) > 1e-6, 'planted: a raise counted on a future that fails disagrees');
console.log(`\nwhole-score-objective: ${n} passed`);
