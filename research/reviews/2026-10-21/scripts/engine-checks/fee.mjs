// CHARGES (external review, 21 Oct 2026; exploratory; Part A, F0a). Survival of two library households under the plan's
// own rules with 0, 0.5% and 1% a year taken off every tier's real return, on 3,000 paths of seed 424242.
// usage (from the repository root): node research/reviews/2026-10-21/scripts/engine-checks/fee.mjs
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd();
const imp = (p) => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const sc = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const pick = [sc.find(s => s.name === 'just-retired/balanced/comfortable/4.2') || sc[40], sc.find(s => s.name.startsWith('in-drawdown/balanced')) || sc[5]];
for (const s of pick) {
  const plan = E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(s.plan)), config: { ...s.plan.config, lookaheadYears: 0 } }));
  const fee = (bp) => { const rp = {}; for (const [k, v] of Object.entries(plan.riskProfiles)) rp[k] = { ...v, real: Number(v.real) - bp / 100 }; return { ...plan, riskProfiles: rp }; };
  const out = [0, 50, 100].map(bp => E.monteCarlo(fee(bp), { trials: 3000, seed: 424242 }).successRate.toFixed(1));
  console.log(s.id, s.name, 'survival at fee 0 / 0.5% / 1.0% a year:', out.join(' / '));
}
