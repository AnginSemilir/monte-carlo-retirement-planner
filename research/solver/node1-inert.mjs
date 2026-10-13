/*
 * NODE-1's INERTNESS CHECK: the solver with `shareNodes` unset must be bit for bit the code before it. Run once from this tree
 * and once from a worktree of the commit before the option (its research/engine.mjs copied in), both printing these hashes.
 *   node research/solver/node1-inert.mjs <tree root>
 */
// prints a hash of every world's survival and bequest tables in every year, S360 and S126 at 4 points under the candidate's options, from the tree given
import { createHash } from 'node:crypto';
const root = process.argv[2];
const E = await import(root + '/research/engine.mjs'), M = await import(root + '/src/solver/model.js');
const { solveCandidate } = await import(root + '/research/solver/candidate.mjs');
const { buildScenarios } = await import(root + '/research/policy-study/scenarios.mjs');
const all = buildScenarios();
for (const id of ['S360', 'S126']) {
  const sc = all.find(s => s.id === id && s.plan.demographics.planningMode === 'single');
  const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } }));
  const r = solveCandidate(E, M, plan, { lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, e3pcls: false });
  const h = createHash('sha256');
  for (const w of r.worlds) for (let t = 0; t < w.lsurv.length; t++) { h.update(Buffer.from(w.lsurv[t].buffer)); h.update(Buffer.from(w.beq[t].buffer)); }
  console.log(`${id}: tables ${h.digest('hex').slice(0, 16)}`);
}
