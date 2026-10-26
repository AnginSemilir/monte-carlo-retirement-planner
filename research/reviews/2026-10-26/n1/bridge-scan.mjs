// Which households have a bridge (retired before the pension opens), and how big it is against their accessible money
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const panel = new Set(['S362', 'S370', 'S224', 'S380', 'S248', 'S002', 'S330']);
const rows = [];
for (const h of buildScenarios()) {
  const p = E.resolveMpaa(E.normalizePlan(h.plan));
  if (p.demographics.planningMode === 'couple') continue;
  const ctx = E.buildContext(p), age0 = ctx.ageSelf0, d = p.demographics;
  const retire = E.num(d.retireAgeSelf, 0), nmpa = E.num(d.privatePensionAge, 57), spa = E.num(d.statePensionAge, 67);
  const bridgeYears = Math.max(0, nmpa - Math.max(retire, age0));
  if (!bridgeYears) continue;
  let acc = 0, pen = 0; for (const a of ctx.accounts) { if (a.owner !== 'self') continue; if (a.cat === 'pen') pen += a.balance; else acc += a.balance; }
  const target = E.num(p.spending.targetSpend, 0), floorNeed = 0.8 * target * bridgeYears;
  rows.push({ id: h.id, panel: panel.has(h.id), age0, retire, nmpa, bridgeYears, acc, pen, target, ratio: acc / Math.max(1, floorNeed) });
}
rows.sort((a, b) => a.ratio - b.ratio);
console.log(`single households with a bridge (retired before the pension opens): ${rows.length}`);
for (const r of rows) console.log(`${r.panel ? '*' : ' '} ${r.id.padEnd(5)} age ${r.age0} retire ${r.retire} pension ${r.nmpa}: ${r.bridgeYears} bridge years; accessible £${Math.round(r.acc / 1000)}k, pension £${Math.round(r.pen / 1000)}k, target £${Math.round(r.target / 1000)}k; accessible / (floor x bridge years) now ${r.ratio.toFixed(2)}`);
