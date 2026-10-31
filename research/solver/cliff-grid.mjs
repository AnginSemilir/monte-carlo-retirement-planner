/*
 * THE CLIFF AGAINST THE GRID (24 Sep; for the blurred-cliffs brief). For three library households, the wealth axis the
 * solver actually builds (grid.js makeGrid, 30 points: a point at zero, then 29 geometric) and its gap; and the width of
 * the end-of-plan cliff in log wealth - roughly the tier's yearly volatility x sqrt(years left), an upper estimate since
 * money withdrawn early is exposed for less time - in units of that gap, for the library's Low, Medium and High tiers.
 *
 *   node research/solver/cliff-grid.mjs        (kept in results-cliff-grid.txt)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { makeGrid } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const all = buildScenarios();
for (const id of ['S194', 'S126', 'S162']) {
  const sc = all.find(s => s.id === id);
  const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
  const m = M.prepare(E, plan), g = makeGrid(m, { points: 30 });
  const W = g.axes.W.pts, spend = g.spend, gap = Math.log(W[2] / W[1]);
  const d = sc.plan.demographics, acc = sc.plan.accounts.filter(a => E.num(a.balance, 0) > 0).map(a => `${a.category.split(' ')[0]} ${Math.round(E.num(a.balance, 0) / 1000)}k ${a.risk}`).join(', ');
  console.log(`${id}: age ${d.currentAgeSelf}, retires ${d.retireAgeSelf}, pension access ${d.privatePensionAge}, State Pension ${d.statePensionSelf}/yr from ${d.statePensionAge}, plan to ${d.terminalAge}; target spend ${sc.plan.spending.targetSpend}/yr; ${acc}`);
  console.log(`   wealth axis: 0, then ${(W[1] / spend).toFixed(2)} to ${(W[W.length - 1] / spend).toFixed(0)} years of target spending; neighbours ${(100 * (Math.exp(gap) - 1)).toFixed(0)}% apart (log gap ${gap.toFixed(3)})`);
  for (const tier of ['Low Risk', 'Medium Risk', 'High Risk']) {
    const vol = sc.plan.riskProfiles[tier].volatility / 100;
    const cells = [1, 2, 4, 8, 16].map(n => `${n}y ${(vol * Math.sqrt(n) / gap).toFixed(2)}`).join('  ');
    console.log(`   ${tier.padEnd(12)} (vol ${(100 * vol).toFixed(2)}%): cliff width (1 sd) in grid gaps, by years before the end: ${cells}`);
  }
}
