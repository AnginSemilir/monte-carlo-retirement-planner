/*
 * O200's PLANTED CALL (PLAN.md O200; the plan-auditor's receipt of 20 Oct, review-log.md, BLOCKING 2): solve.js finalYearExact,
 * the product's final-year read (PRODUCT_BASELINE's finalIntegral), on a mocked year whose taxable pot clears the floor only at
 * z* about 7, 7.9 and 8.5 standard shocks: its outputs (survival, bequest, resilience) printed, a non-finite one marked. The
 * mock is a one-asset year at a 15% volatility (grade B: a planted call, not a solve).
 *   node research/solver/finalyear-nan.mjs > research/solver/results-finalyear-nan.txt
 */
import { finalYearExact } from '../../src/solver/solve.js';
const c = { real: [0.03, 0.04, 0.04, 0.0], sigma: [0, 0, 0, 0], volEffAt: [[0.15, 0.15, 0.15, 0.0], [0.15, 0.15, 0.15, 0.0]], yr: { frac: [1, 1], buffer: [0, 0] } };
const terminal = { floor: 100000, deathTax: 0, resilK: 50000, shortfall: true, beqOf: n => Math.min(n, 1e6) };
console.log('O200\'S PLANTED CALL: finalYearExact where the floor clears only far in the upper tail (floor 100000)');
let bad = 0;
for (const z of [7, 7.9, 8.5]) {
  const w = 100000 / Math.exp(0.039 + 0.15 * z), post = new Float64Array(7); post[1] = w;
  const out = finalYearExact(c, 1, post, null, terminal, new Float64Array(7), new Float64Array(4), new Float64Array(3)), fin = Array.from(out).every(Number.isFinite);
  if (!fin) bad++;
  console.log(`  z* about ${z}: pot ${w.toFixed(0)} (${(w / 100000).toFixed(4)} of the floor): survival ${out[0].toExponential(3)}, bequest ${out[1]}, resilience ${out[2]}${fin ? '' : ' - NON-FINITE'}`);
}
console.log(`VERDICT: ${bad} of 3 calls return a non-finite value`);
