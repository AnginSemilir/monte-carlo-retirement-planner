// CGT ON THE SWEEP, DETERMINISTIC (external review, 21 Oct 2026; exploratory; Part A, F0). One single household with a
// £400k taxable account holding £240k of gain; the same move every year (cash first, taxable before ISA, the sweep on) in
// the engine, the solver's fast flow and model.js, at expected returns. Prints each year's CGT and wealth, and the totals.
// usage (from the repository root): node research/reviews/2026-10-21/scripts/engine-checks/carry.mjs
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd();
const imp = (p) => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs');
const M = await imp('src/solver/model.js');
const F = await imp('src/solver/fast.js');
const { buildActions } = await imp('src/solver/solve.js');
const { vecOf } = await imp('src/solver/grid.js');
const acc = (id, owner, category, balance, risk, extra = {}) => ({ id, owner, category, balance, contrib: 0, growth: 0, risk, ...extra });
const base = E.normalizePlan({
  demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 66, terminalAge: 95, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976 },
  spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [acc('pen_self','Myself','Pensions',200000,'High Risk'), acc('isa_self','Myself','S&S ISAs',100000,'Medium/High Risk'),
             acc('other_self','Myself','Other Investments (e.g. GIA)',400000,'Medium Risk',{ unrealisedGain: 240000 }), acc('cash_self','Myself','Cash Savings',15000,'Cash Equivalents')],
  config: { valuationDate: '2026-01-01', lookaheadYears: 0, guardrails: false }
});
const menu = buildActions(); const ai = menu.findIndex(a => a.steps[0] === 'cash' && !a.harvest && a.spendLevel === 1 && !a.tierPen && !a.tierIsa);
const a = menu[ai]; console.log('action', ai, a.label, a.steps.join('>'), 'sweep', a.sweepCash);
// engine, with a stand-in table that always returns this move (the bridge's shape)
const choose = () => ({ steps: a.steps, costSteps: a.steps, harvest: false, harvestCeil: 'pa', lump: false, sweepCash: true, spendLevel: 1, tierPen: 0, tierIsa: 0, code: 'X' });
const plan = E.resolveMpaa(base);
const ctx = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose, switchCost: 0 } } });
const rows = E.simulateDeterministic(ctx, 'expected');
// the solver's fast flow and the exact reduced model, same move, same expected rates
const m = M.prepare(E, plan); const c = F.compile(m, [a]); const s = vecOf(m, M.initialState(m));
const st = M.initialState(m); const actM = { steps: a.steps, costSteps: a.steps, harvest: false, harvestCeil: 'pa', lump: false, sweepCash: true, contrib: null };
let ce = 0, cf = 0, cm = 0;
for (let t = 0; t <= m.ctx.totalYears; t++) {
  F.flow(c, t, 0, s); cf += c.last.cgtPaid; F.grow(c, t, s, c.real);
  const rm = M.step(m, st, actM, t, null); cm += rm.cgtPaid;
  ce += rows[t].cgtPaid;
  if (t < 4 || t === m.ctx.totalYears) console.log(`t ${t}: CGT engine ${rows[t].cgtPaid.toFixed(0)}  fast ${c.last.cgtPaid.toFixed(0)}  model.js ${rm.cgtPaid.toFixed(0)} | wealth engine ${rows[t].totalCombined.toFixed(0)}  fast ${(s[0]+s[1]+s[2]).toFixed(0)}  model.js ${rm.totalCombined.toFixed(0)}`);
}
console.log(`lifetime CGT: engine ${ce.toFixed(0)}  fast flow ${cf.toFixed(0)}  model.js ${cm.toFixed(0)}`);
