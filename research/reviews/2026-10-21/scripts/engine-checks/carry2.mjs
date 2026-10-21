// CGT ON THE SWEEP, MONTE CARLO (external review, 21 Oct 2026; exploratory; Part A, F0). The household of carry.mjs at two
// spending levels: survival in the engine and in the solver's fast flow on the same 3,000 paths of seed 515151.
// usage (from the repository root): node research/reviews/2026-10-21/scripts/engine-checks/carry2.mjs
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
const mk = (spend) => E.resolveMpaa(E.normalizePlan({
  demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 66, terminalAge: 95, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976 },
  spending: { targetSpend: spend, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [acc('pen_self','Myself','Pensions',200000,'High Risk'), acc('isa_self','Myself','S&S ISAs',100000,'Medium/High Risk'),
             acc('other_self','Myself','Other Investments (e.g. GIA)',400000,'Medium Risk',{ unrealisedGain: 240000 }), acc('cash_self','Myself','Cash Savings',15000,'Cash Equivalents')],
  config: { valuationDate: '2026-01-01', lookaheadYears: 0, guardrails: false }
}));
const menu = buildActions(); const ai = menu.findIndex(a => a.steps[0] === 'cash' && !a.harvest && a.spendLevel === 1 && !a.tierPen && !a.tierIsa); const a = menu[ai];
const choose = () => ({ steps: a.steps, costSteps: a.steps, harvest: false, harvestCeil: 'pa', lump: false, sweepCash: true, spendLevel: 1, tierPen: 0, tierIsa: 0, code: 'X' });
const N = 3000, SEED = 515151;
for (const spend of [42000, 46000]) {
  const plan = mk(spend);
  const eng = E.monteCarlo({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose, switchCost: 0 } } }, { trials: N, seed: SEED });
  const m = M.prepare(E, plan); m.shiftZ = 0; const c = F.compile(m, [a]); const zsAll = E.pathsForSeed(SEED, N, m.ctx.totalYears);
  let ok = 0; const real = new Float64Array(4); const T = m.ctx.totalYears;
  for (const zs of zsAll) { const s = vecOf(m, M.initialState(m)); let alive = true;
    for (let t = 0; t <= T; t++) { const u = F.flow(c, t, 0, s); if (u > 1 || c.last.preNmpaInsolvent) { alive = false; break; }
      for (let i = 0; i < 4; i++) real[i] = Math.exp(Math.log(1 + c.real[i]) + c.sigma[i] * zs[T + 1] + c.volEffAt[t][i] * zs[t]) - 1; F.grow(c, t, s, real); }
    if (alive) ok++; }
  const fast = 100 * ok / N, se = Math.sqrt(fast * (100 - fast) / N);
  console.log(`spend ${spend}: survival engine ${eng.successRate.toFixed(2)}  fast flow (solver's forward run) ${fast.toFixed(2)}  diff ${(fast - eng.successRate).toFixed(2)} (paired paths; marginal se ~${se.toFixed(2)})`);
}
