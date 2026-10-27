/*
 * THE CASH ISA ABOVE THE BUFFER (EXPLORATORY; GAPS-SWEEP.md, the inventory's sixth row): plan inputs only, no simulation. For
 * each single household in the library (Phase 4's panel and reserve orders left out), the cash-ISA money a solved table's
 * sweep moves into the GIA in year 0: the sheltered cash above what the year-0 buffer keeps (taxable cash first), as
 * plan-probe.mjs's ISA2ISA computes it.
 *   node shelter-scan.mjs        (from the root of the code under test)
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync } from 'fs';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const panel = JSON.parse(readFileSync('research/solver/phase4-panel.json', 'utf8')), orders = JSON.parse(readFileSync('research/solver/phase4-orders.json', 'utf8'));
const held = new Set([...panel.panel.map(h => (h.id || h).replace(/F$/, '')), ...orders.lib, ...orders.fire].map(x => String(x.id || x).replace(/F$/, '')));
const rows = [];
for (const s of buildScenarios()) {
  if (s.tags.household !== 'single' || held.has(s.id)) continue;
  const ctx = E.buildContext(s.plan), o = ctx.owners[0];
  const buffer = E.spendTargetAtAge(ctx, ctx.ageSelf0) * ctx.cashBufferYears;
  const cashIsa = s.plan.accounts.find(a => a.id === 'cashIsa_self'), cash = s.plan.accounts.find(a => a.id === 'cash_self');
  const sheltered = E.num(cashIsa.balance, 0), taxable = E.num(cash.balance, 0);
  const moved = Math.max(0, sheltered - Math.max(0, buffer - taxable));
  const total = ctx.accounts.reduce((x, a) => x + a.balance, 0);
  rows.push({ id: s.id, moved, sheltered, buffer, share: moved / total });
}
const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
const m = rows.map(r => r.moved).sort((a, b) => a - b), sh = rows.map(r => r.share).sort((a, b) => a - b);
console.log(`the cash ISA a table's sweep moves into the GIA in year 0, over ${rows.length} single households of the library (Phase 4's ${held.size} left out)`);
console.log(`  households with any: ${rows.filter(r => r.moved > 0).length}; over £10,000: ${rows.filter(r => r.moved > 10000).length}; over £50,000: ${rows.filter(r => r.moved > 50000).length}; over £250,000: ${rows.filter(r => r.moved > 250000).length}`);
console.log(`  the amount: median £${Math.round(q(m, 0.5))}, 90th centile £${Math.round(q(m, 0.9))}, largest £${Math.round(m[m.length - 1])} (${rows.find(r => r.moved === m[m.length - 1]).id}); as a share of wealth: median ${(100 * q(sh, 0.5)).toFixed(1)}%, 90th centile ${(100 * q(sh, 0.9)).toFixed(1)}%`);
for (const id of ['S224', 'S380', 'S370', 'S362']) { const r = rows.find(x => x.id === id); if (r) console.log(`  ${id}: £${Math.round(r.moved)} of £${Math.round(r.sheltered)} sheltered (the year-0 buffer £${Math.round(r.buffer)})`); }
