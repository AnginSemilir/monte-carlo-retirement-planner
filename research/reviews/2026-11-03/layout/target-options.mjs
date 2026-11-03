/*
 * THE TARGET CARD'S OPTIONS AND EACH EXAMPLE'S CURRENT APPROACH (LAYOUT.md sections 3.2 and 3.3), from the library's plans,
 * no solve: the target times 0.8, 0.9, 1.1 and 1.2, each to the nearest £500, in the card's order (nearest first) and its
 * button's words; and the rules "your current approach" runs on (the decumulation policy as the app names it, the drawdown
 * strategy, the guardrails, the lookahead), for the comparison's line and You's card. EXPLORATORY, deciding nothing.
 * Run from the root of the agent's code with the engine built:
 *   node <this file> S116 S224 S090
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const imp = p => import(pathToFileURL(resolve(ROOT, p)).href);
const E = await imp('research/engine.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');

const ids = process.argv.slice(2).filter(a => /^S\d+F?$/.test(a));
if (!ids.length) throw new Error('target-options: name the households, e.g. S116 S224');
const code = execSync('git rev-parse --short=12 HEAD', { cwd: ROOT }).toString().trim();
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const ORDER = [0.9, 1.1, 0.8, 1.2];   // nearest first
const to500 = v => Math.round(v / 500) * 500;
const all = buildScenarios();
console.log(`# node target-options.mjs ${ids.join(' ')} (the agent's code at ${code}; no solve; EXPLORATORY, deciding nothing)`);
for (const id of ids) {
  const h = all.find(s => s.id === id);
  if (!h) throw new Error(`target-options: no household ${id}`);
  const plan = E.normalizePlan(h.plan), sp = plan.spending, c = plan.config;
  const target = E.num(sp.targetSpend, 0);
  const opts = ORDER.map(f => to500(target * f));
  const lo = Math.min(...opts), hi = Math.max(...opts);
  const pol = (E.DECUMULATION_POLICIES || {})[sp.decumulationPolicy];
  const shown = pol && pol.label ? String(pol.label).split(' (')[0] : sp.decumulationPolicy;
  console.log(`${id}: target ${gbp.format(target)}; the options, nearest first: ${opts.map(v => gbp.format(v)).join(', ')}; the button: "Solve ${gbp.format(lo)} to ${gbp.format(hi)} a year"`);
  console.log(`${id}: current approach: the decumulation policy "${sp.decumulationPolicy}" (shown as ${shown}); the drawdown strategy ${sp.drawdownStrategy}; guardrails ${c.guardrails ? 'on' : 'off'}; the lookahead ${E.num(c.lookaheadYears, 0)} years; the 0% harvest ${c.harvestPersonalAllowance ? 'on' : 'off'}; an Auto deposit ${(plan.oneOffContributions || []).some(d => d && d.category === 'Auto (policy decides)') ? 'yes' : 'none'} (App.jsx AUTO_DEPOSIT)`);
}
console.log('# done');
