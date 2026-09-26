/*
 * THE OFF PATH, BEFORE AND AFTER `jointWorlds` (the seventy-sixth review, MINOR 6): solver-joint.test.mjs's check A compares
 * the option absent with the option false, one code path, so it cannot catch a change to the off path. This prints a hash of
 * every world's tables (survival, estate, resilience, shortfall, moves, every year) for the arms 7t runs with the option
 * off, from the solver in a given checkout. Run it in a checkout of the commit before 70a8b55 and in this one; equal hashes
 * say the off path computes the same tables to the bit. It solves and reads no result files; it runs no audit script.
 *   node research/tests/joint-off-identity.mjs [repo root]      default: this checkout
 */
import { createHash } from 'node:crypto';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '../..'));
const imp = p => import(pathToFileURL(join(ROOT, p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js');
const { solveMixture, solvePlan } = await imp('src/solver/solve.js');
const { tiersFor } = await imp('src/solver/fast.js');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');

const hashOf = tables => {
  const h = createHash('sha256');
  for (const tab of tables) for (const kk of ['surv', 'beq', 'resil', 'short', 'pol']) for (const v of tab[kk]) h.update(Buffer.from(v.buffer, v.byteOffset, v.byteLength));
  return h.digest('hex').slice(0, 16);
};
const all = buildScenarios();
const out = [];
// solver-joint.test.mjs's own case and settings (check A), the option absent
{
  const p = all.find(x => x.id === 'S004').plan;
  const plan = E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
  const m = M.prepare(E, plan);
  const r = solveMixture(E, M, plan, { points: 10, lump: m.ctx.fullLumpSum, tiers: tiersFor(m), mix: 3, spendLevels: [1, 0.95, 0.9, 0.8], lambda: 0.05, finalExact: true });
  out.push(`S004 solveMixture 10 points: ${hashOf(r.mix.tables)}`);
}
// 7t's product entry on S126, off and the reader, at 4 points (audit-s126.mjs measureV2's plan and settings, the option absent)
for (const bridgeRead of [false, 'reader']) {
  const h = all.find(x => x.id === 'S126');
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const r = solvePlan(E, M, plan, { lambda: 0.0223606797749979, points: 4, bridgeRead });
  out.push(`S126 solvePlan 4 points, bridgeRead ${bridgeRead}: ${hashOf(r.mix.tables)}`);
}
console.log(out.join('\n'));
