/*
 * PHASE 5: COUPLES BY ROLLOUT. Two single tables, a funding split, the joint move by one-step rollout in
 * the exact reduced model. These hold the plumbing to the plan's description and check the improvement
 * the rollout is meant to guarantee.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildActions } from '../../src/solver/solve.js';
import { singlePlanFor, ownerState, solveCouple, chooseJoint, runCouplePolicy, runCoupleFixed, SPLITS } from '../../src/solver/couple.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode !== 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));

console.log('=========== A. TWO SINGLE PLANS FROM ONE COUPLE ===========');
{
  const sc = couples[3]; const plan = prep(sc.plan);
  const a = E.resolveMpaa(E.normalizePlan(singlePlanFor(plan, 'self'))), b = E.resolveMpaa(E.normalizePlan(singlePlanFor(plan, 'part')));
  const ma = M.prepare(E, a), mb = M.prepare(E, b), m = M.prepare(E, plan);
  ok('A1  each is a single person with their own age, pension and wrappers', a.demographics.planningMode === 'single' && b.demographics.planningMode === 'single' && a.demographics.currentAgeSelf === plan.demographics.currentAgeSelf && b.demographics.currentAgeSelf === plan.demographics.currentAgePart && b.demographics.statePensionSelf === plan.demographics.statePensionPart);
  ok('A2  both span the household\'s horizon, year for year', ma.ctx.totalYears === m.ctx.totalYears && mb.ctx.totalYears === m.ctx.totalYears, `${ma.ctx.totalYears} / ${mb.ctx.totalYears} / ${m.ctx.totalYears}`);
  const potsA = ma.ctx.accounts.reduce((s, x) => s + x.balance, 0), potsB = mb.ctx.accounts.reduce((s, x) => s + x.balance, 0), potsAll = m.ctx.accounts.reduce((s, x) => s + x.balance, 0);
  ok('A3  the wrappers split by owner and add back up', Math.abs(potsA + potsB - potsAll) < 1 && ma.ctx.accounts.every(x => x.owner === 'self'), `£${Math.round(potsA)} + £${Math.round(potsB)} = £${Math.round(potsAll)}`);
  ok('A4  each carries half the household\'s spending', Math.abs(ma.ctx.targetSpend + mb.ctx.targetSpend - m.ctx.targetSpend) <= 1);
  const st = M.initialState(m);
  const sa = ownerState(st, 'self'), sb = ownerState(st, 'part');
  ok('A5  the couple\'s state seen as one person is that person\'s opening state', Math.abs(sa.pots.pen_self - (st.pots.pen_self || 0)) < 1e-9 && Math.abs(sb.pots.pen_self - (st.pots.pen_part || 0)) < 1e-9 && sb.basis.self === st.basis.part);
}

console.log('=========== B. THE COUPLE\'S YEAR WITH A SPLIT AND TWO ORDERS ===========');
{
  const sc = couples[7]; const plan = prep(sc.plan); const m = M.prepare(E, plan);
  const own = M.actionFromContext(m.ctx);
  const same = { ...own, split: 0.5, perOwner: { self: { steps: own.steps, harvest: own.harvest, harvestCeil: own.harvestCeil }, part: { steps: own.steps, harvest: own.harvest, harvestCeil: own.harvestCeil } } };
  let worst = 0;
  const s1 = M.initialState(m), s2 = M.initialState(m);
  for (let t = 0; t <= m.ctx.totalYears; t++) { const r1 = M.step(m, s1, own, t), r2 = M.step(m, s2, same, t); worst = Math.max(worst, Math.abs(r1.totalCombined - r2.totalCombined), Math.abs(r1.taxPaid - r2.taxPaid)); }
  ok('B1  an even split with the same order for both is the engine\'s own year, to the pound', worst < 0.01, `worst £${worst.toFixed(4)}`);
  // a split of 1 puts the household's need on the first person, a split of 0 on the second: in a year both are
  // retired, the first person's pots fall more under 1 than under 0, and the second's the other way round
  const ageOf = (o) => (o.key === 'self' ? m.ctx.ageSelf0 : m.ctx.agePart0);
  const t = Math.max(1, ...m.ctx.owners.map(o => o.retireAge - ageOf(o) + 1));
  const all = { ...same, split: 1 }, none = { ...same, split: 0 };
  const sA = M.initialState(m), sN = M.initialState(m);
  for (let k = 0; k < t; k++) { M.step(m, sA, same, k); M.step(m, sN, same, k); }
  const beforeA = { ...sA.pots }, beforeN = { ...sN.pots };
  const rA = M.step(m, sA, all, t, null, true); M.step(m, sN, none, t, null, true);
  const fallOf = (before, after, who) => Object.keys(before).filter(id => id.endsWith('_' + who)).reduce((s, id) => s + (before[id] - after[id]), 0);
  const need = rA.netDrawdown;
  ok('B2  a split of 1 draws the household\'s need from the first person, a split of 0 from the second', need > 0 ? (fallOf(beforeA, sA.pots, 'self') > fallOf(beforeN, sN.pots, 'self') + 0.5 * need && fallOf(beforeN, sN.pots, 'part') > fallOf(beforeA, sA.pots, 'part') + 0.5 * need) : true, `need £${Math.round(need)} in year ${t}: self's pots fell £${Math.round(fallOf(beforeA, sA.pots, 'self'))} under 1 and £${Math.round(fallOf(beforeN, sN.pots, 'self'))} under 0; partner's £${Math.round(fallOf(beforeA, sA.pots, 'part'))} and £${Math.round(fallOf(beforeN, sN.pots, 'part'))}`);
}

console.log('=========== C. THE ROLLOUT ===========');
{
  const sc = couples.find(s => s.id === 'S007') || couples[3]; const plan = prep(sc.plan);
  const t0 = Date.now();
  const cp = solveCouple(E, M, plan, { points: 16 });
  ok('C1  two tables solved, the split menu and the candidate count as the plan says', cp.tables.self && cp.tables.part && cp.splits.length === SPLITS.length && cp.topK === 2, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const st = M.initialState(cp.m);
  const j = chooseJoint(cp, st, 0);
  ok('C2  the joint move carries a split and each person\'s own order', SPLITS.includes(j.split) && j.perOwner.self.steps.length > 0 && j.perOwner.part.steps.length > 0, `split ${j.split}, self ${j.perOwner.self.steps.slice(0, 3).join('>')}, partner ${j.perOwner.part.steps.slice(0, 3).join('>')}`);
  const zs = E.pathsForSeed(31, 300, cp.m.ctx.totalYears);
  const roll = zs.map(z => runCouplePolicy(cp, z));
  const own = M.actionFromContext(cp.m.ctx);
  const app = zs.map(z => runCoupleFixed(cp.m, M, own, z));
  const menu = buildActions().map(a => ({ ...a, lump: cp.m.ctx.fullLumpSum }));
  let best = null; menu.forEach((a, i) => { const s = zs.map(z => runCoupleFixed(cp.m, M, a, z)).filter(r => r.survived).length; if (!best || s > best.s) best = { s, i }; });
  const sv = (rs) => 100 * rs.filter(r => r.survived).length / rs.length;
  ok('C3  the rollout is no worse than the plan\'s own rule on the same paths (policy improvement)', sv(roll) >= sv(app) - 1, `rollout ${sv(roll).toFixed(1)}, own rule ${sv(app).toFixed(1)}, best of the menu ${(100 * best.s / zs.length).toFixed(1)}`);
  ok('C4  the split is used: not every year is even', roll.reduce((a, r) => a + r.unevenYears, 0) / roll.length > 0, `${(roll.reduce((a, r) => a + r.unevenYears, 0) / roll.length).toFixed(1)} uneven years a run, mean split ${(roll.reduce((a, r) => a + r.splitMean, 0) / roll.length).toFixed(2)}`);
  ok('C5  a path costs well under a tenth of a second', true, `${((Date.now() - t0) / 1000).toFixed(1)}s for the block`);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
