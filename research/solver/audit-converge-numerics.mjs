/*
 * PHASE V: IS THE NUMERICAL MACHINERY CONVERGED?   (PLAN.md Phase V)
 *
 *   node research/solver/audit-converge-numerics.mjs [bandIndex=32]
 *
 * V1  the quadrature - five Gauss-Hermite nodes, hardcoded, never varied in this repository
 * V2  the grid resolution - 20 and 40 exist as ALTERNATIVES, never as a convergence sequence
 * V3  the interpolation scheme - log-odds for survival, never compared against linear
 *
 * Why these and not the objective's weights: a wrong weight biases a PREFERENCE, visibly and
 * arguably. An unconverged discretisation biases EVERYTHING invisibly - and identically in both arms
 * of Phase 4, so Phase 4 cannot detect it. Finding out afterwards invalidates the gate retroactively.
 */
import * as E from '/home/user/vitejs-vite-kdvuf9qw/research/engine.mjs';
import * as M from '/home/user/vitejs-vite-kdvuf9qw/src/solver/model.js';
import { solve } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/solve.js';
import { tiersFor } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/fast.js';
import { buildScenarios } from '/home/user/vitejs-vite-kdvuf9qw/research/policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';

const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync('/home/user/vitejs-vite-kdvuf9qw/research/solver/results/band-70-98-7001.json', 'utf8'));
const sc = singles[band[Number(process.argv[2] || 32)].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const base = { lambda: 0.5, spendLevels: [1.2, 1.1, 1, 0.9, 0.8], tiers: tiersFor(m), lump: m.ctx.fullLumpSum };
const open = () => M.initialState(m);
const run = (o) => { const t = Date.now(); const r = solve(E, M, plan, { ...base, ...o }); const v = r.value(open(), 0); return { r, v, ms: Date.now() - t }; };
/* how many stored moves differ between two tables of the SAME size */
const policyDiff = (a, b) => {
  if (a.g.size !== b.g.size) return null;
  let d = 0, n = 0;
  for (let t = 0; t < a.pol.length; t++) for (let i = 0; i < a.g.size; i++) { n++; if (a.pol[t][i] !== b.pol[t][i]) d++; }
  return { d, n, pc: 100 * d / n };
};

console.log(`Phase V on ${sc.id} - ${sc.name.slice(0, 40)}, ${m.ctx.totalYears + 1} years\n`);

console.log('=========== V1. THE QUADRATURE ===========');
console.log('five Gauss-Hermite nodes are exact for polynomials to degree nine. The integrand contains a');
console.log('survival cliff, which is not a polynomial, so that bound does not apply. Outer nodes carry 1.1%.\n');
console.log('  nodes   opening survival      vs 5 nodes     moves differing     seconds');
const q5 = run({ points: 30 });
const qs = [{ n: 5, x: q5 }];
for (const n of [9, 15]) qs.push({ n, x: run({ points: 30, quadNodes: n }) });
for (const { n, x } of qs) {
  const d = 100 * (x.v.survival - q5.v.survival);
  const pd = n === 5 ? null : policyDiff(q5.r, x.r);
  console.log(`  ${String(n).padStart(5)}   ${(100 * x.v.survival).toFixed(4).padStart(16)}   ${(n === 5 ? '-' : (d >= 0 ? '+' : '') + d.toFixed(4)).padStart(12)}   ${(pd ? pd.pc.toFixed(3) + '%' : '-').padStart(17)}   ${(x.ms / 1000).toFixed(1).padStart(7)}`);
}
const q15 = qs[qs.length - 1].x, dq = Math.abs(100 * (q15.v.survival - q5.v.survival));
const pq = policyDiff(q5.r, q15.r);
console.log(`\n  GATE V1: five nodes stand if survival is within 0.1 of a point of fifteen AND under 1% of moves differ.`);
console.log(`  -> survival gap ${dq.toFixed(4)} pts, moves differing ${pq ? pq.pc.toFixed(3) : '?'}%  ...  ${dq <= 0.1 && pq && pq.pc < 1 ? 'PASS' : 'FAIL - every result here carries an unmeasured bias'}`);

console.log('\n=========== V2. THE GRID RESOLUTION ===========');
console.log('20 and 40 exist as alternatives, never as a convergence sequence. The Richardson hook is null.\n');
console.log('  points   opening survival    step from previous     seconds');
let prev = null; const seq = [];
for (const p of [16, 24, 30, 40, 56]) {
  const x = run({ points: p });
  const step = prev === null ? null : 100 * (x.v.survival - prev);
  seq.push({ p, s: x.v.survival, step });
  console.log(`  ${String(p).padStart(6)}   ${(100 * x.v.survival).toFixed(4).padStart(16)}   ${(step === null ? '-' : (step >= 0 ? '+' : '') + step.toFixed(4)).padStart(19)}   ${(x.ms / 1000).toFixed(1).padStart(7)}`);
  prev = x.v.survival;
}
const steps = seq.slice(1).map(x => Math.abs(x.step));
const shrinking = steps.every((v, i) => i === 0 || v <= steps[i - 1] + 1e-9);
const gap30 = Math.abs(100 * (seq.find(x => x.p === 56).s - seq.find(x => x.p === 30).s));
console.log(`\n  GATE V2: thirty points stand if the steps are shrinking AND the gap from 30 to 56 is under 0.2 pts.`);
console.log(`  -> steps ${shrinking ? 'ARE' : 'are NOT'} shrinking, 30-to-56 gap ${gap30.toFixed(4)} pts  ...  ${shrinking && gap30 <= 0.2 ? 'PASS' : 'FAIL'}`);
if (!shrinking) console.log('  a sequence that is not converging is the worse outcome: the answer depends on a resolution nobody chose.');
