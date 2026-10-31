/*
 * THE FINAL YEAR INTEGRATED EXACTLY (`finalIntegral`, O19). finalYearExact must give the same survival and estate as a
 * brute-force integral of the SAME growth over the yearly shock (a 400,001-point grid on [-10, 10]), on a real household's
 * compiled context; it must differ from the 5-node rule where the rule is a staircase (planted: the pot just inside a
 * node's step); and a solve with it on must run and say so in its meta. That earlier years' arithmetic is untouched is
 * by the code (the 5-node loop is the `else` branch), not tested here.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, finalYearExact } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const sc = buildScenarios().find(s => s.id === 'S194');
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const common = { points: 4, lambda: 0.5, raiseWeight: 0.003, spendLevels: [1.1, 1, 0.9, 0.8], tiers: true, tiersAbove: 1, finalExact: true, mix: 3 };
const off = solve(E, M, plan, common);
const on = solve(E, M, plan, { ...common, finalIntegral: true });
ok(on.meta.finalIntegral === true && off.meta.finalIntegral === false, `the meta says which final year ran (on ${on.meta.finalIntegral}, off ${off.meta.finalIntegral})`);
const T = on.m.ctx.totalYears;
ok(on.surv[T].some((v, i) => v !== off.surv[T][i]), 'the final layer changes with it on');

// brute force: the same growth, the same rule, integrated on a fine grid of the yearly shock
const c = on.c, act = c.acts[0], { floor, deathTax, beqOf } = on.terminal;
const realAt = z => { const R = act.real, V = act.volEffAt[T], S = act.sigma, out = new Float64Array(4); for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + R[i]) + S[i] * 0 + V[i] * z) - 1; return out; };
const phi = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
const brute = post => {
  let sv = 0, bq = 0; const N = 400000, a = -10, h = 20 / N, g = new Float64Array(7);
  for (let j = 0; j <= N; j++) {
    const z = a + j * h, w = (j === 0 || j === N ? 0.5 : 1) * h * phi(z);
    g.set(post); F.grow(c, T, g, realAt(z));
    const total = g[0] + g[1] + g[2];
    if (floor > 0 && total < floor) continue;
    sv += w; bq += w * beqOf(Math.max(0, total - g[0] * deathTax));
  }
  return [sv, bq];
};
const five = post => {
  const Z = [-2.85697, -1.355626, 0, 1.355626, 2.85697], W = [0.011257, 0.222076, 0.533333, 0.222076, 0.011257];
  let sv = 0; const g = new Float64Array(7);
  for (let q = 0; q < 5; q++) { g.set(post); F.grow(c, T, g, realAt(Z[q])); if (!(floor > 0 && g[0] + g[1] + g[2] < floor)) sv += W[q]; }
  return sv;
};
ok(floor > 0, `S194 carries a minimum pot (floor ${Math.round(floor)})`);
const out = new Float64Array(3), grown = new Float64Array(7), rbuf = new Float64Array(4);
let worst = 0, worstB = 0, maxGap = 0;
for (const mult of [0.9, 1.0, 1.05, 1.1, 1.15, 1.22, 1.3, 1.5, 2, 4]) {
  const W = floor * mult, post = new Float64Array([0.5 * W, 0.4 * W, 0.1 * W, 0, 0, 0, -1]);
  finalYearExact(c, T, post, act, on.terminal, grown, rbuf, out);
  const [bs, bb] = brute(post);
  worst = Math.max(worst, Math.abs(out[0] - bs)); worstB = Math.max(worstB, Math.abs(out[1] - bb) / Math.max(1e-9, Math.abs(bb)));
  maxGap = Math.max(maxGap, Math.abs(five(post) - out[0]));
  console.log(`      pot ${mult.toFixed(2)} x floor: exact ${(100 * out[0]).toFixed(4)}  brute ${(100 * bs).toFixed(4)}  5-node ${(100 * five(post)).toFixed(2)}   estate exact ${out[1].toFixed(6)} brute ${bb.toFixed(6)}`);
}
ok(worst < 2e-5, `survival matches the brute-force integral to ${worst.toExponential(1)} (under 2e-5)`);
ok(worstB < 2e-3, `the estate credit matches it to ${(100 * worstB).toFixed(3)}% relative (under 0.2%)`);
ok(maxGap > 0.01, `planted: the 5-node rule differs from the exact survival somewhere in the sweep (largest gap ${(100 * maxGap).toFixed(2)} points), so the test can tell them apart`);
// a pot far above the line survives for certain; one far below cannot
finalYearExact(c, T, new Float64Array([0, 0, 20 * floor, 0, 0, 0, -1]), act, on.terminal, grown, rbuf, out);
ok(out[0] === 1, 'a pot of 20 times the floor survives at every shock');
finalYearExact(c, T, new Float64Array([0, 0, 0.01 * floor, 0, 0, 0, -1]), act, on.terminal, grown, rbuf, out);
ok(out[0] === 0 && out[1] === 0, 'a hundredth of the floor cannot reach it at any shock: survival and estate 0');
console.log(`\n${n} passed`);
