// Where a deposit left to the policy lands, under the plan's policy and under the app's 'Windfall to ISA' (the context the
// solver is built on; no solve). usage (from the root of a copy of the code, engine built): node routing.mjs <household> ...
import { resolve } from 'path'; import { pathToFileURL } from 'url';
const root = process.cwd(), imp = p => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs'); const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
for (const id of process.argv.slice(2)) {
  const h = buildScenarios().find(s => s.id === id);
  for (const pol of [h.plan.spending.decumulationPolicy, 'Windfall to ISA']) {
    const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, spending: { ...h.plan.spending, decumulationPolicy: pol } })), ctx = E.buildContext(plan);
    const dep = [...ctx.oneOffContribs].map(([y, l]) => `${y}: ${l.map(x => `${x.id} ${Math.round(x.amount)}`).join(', ')}`).join('; ') || 'none';
    const drip = [...ctx.stagedTransfers].map(([y, l]) => `${y}: ${l.map(x => `${x.fromId}->${x.toId} ${Math.round(x.amount)}`).join(', ')}`).join('; ') || 'none';
    console.log(`${id} under ${pol}: deposits ${dep}; later transfers ${drip}`);
  }
}
