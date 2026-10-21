/*
 * THE SWEEP'S GAIN IS TAXED AS THE ENGINE TAXES IT (the external review of 21 Oct, F0; Part B Step 1, item 6). Every solver
 * move keeps the cash buffer topped up from the taxable account; the engine books the gain on that sale into next year's
 * tally (cgtCarry, App.jsx 7d), and before the fix neither solver model ever taxed it. The review's household (its
 * engine-checks/carry.mjs): a £400k taxable account holding £240k of gain, one move every year (cash first, taxable before
 * the ISA, the sweep on), at expected returns:
 *   1. a forward run of the fast flow (vecOf's state, the carry in slot 11) and model.js pay the engine's capital gains
 *      tax in every year, and hold the engine's wealth, to a pound;
 *   2. a grid cell's flow (seven slots, no carry) is charged the late gain in its own year: from the forward run's position
 *      each year with nothing carried in, it pays that flow's bill plus between nothing and the higher rate on the gain the
 *      flow carries out, and more than the bill alone in some years;
 *   3. planted: a forward run whose carry slot is dropped each year pays less than the engine (the fault the fix closed);
 *   4. after bad years on a taxable account bought at today's value, the engine carries an unrealised loss (its basis above
 *      the value): a forward run follows its pots and gain share every year; planted, a run that clamps the share at
 *      zero, as before the fix, parts from it.
 *   node research/tests/solver-carry.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { buildActions, solveMixture, runPolicy, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { modelStateOf as modelStateOfEngine } from '../../src/solver/bridge.js';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

const acc = (id, owner, category, balance, risk, extra = {}) => ({ id, owner, category, balance, contrib: 0, growth: 0, risk, ...extra });
const base = E.normalizePlan({
  demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 66, terminalAge: 95, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976 },
  spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [acc('pen_self', 'Myself', 'Pensions', 200000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 100000, 'Medium/High Risk'),
    acc('other_self', 'Myself', 'Other Investments (e.g. GIA)', 400000, 'Medium Risk', { unrealisedGain: 240000 }), acc('cash_self', 'Myself', 'Cash Savings', 15000, 'Cash Equivalents')],
  config: { valuationDate: '2026-01-01', lookaheadYears: 0, guardrails: false }
});
const menu = buildActions(), ai = menu.findIndex(a => a.steps[0] === 'cash' && !a.harvest && a.spendLevel === 1 && !a.tierPen && !a.tierIsa), a = menu[ai];
const choose = () => ({ steps: a.steps, costSteps: a.steps, harvest: false, harvestCeil: 'pa', lump: false, sweepCash: true, spendLevel: 1, tierPen: 0, tierIsa: 0, code: 'X' });
const plan = E.resolveMpaa(base);
const rows = E.simulateDeterministic(E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose, switchCost: 0 } } }), 'expected');
const m = M.prepare(E, plan), c = F.compile(m, [a]), T = m.ctx.totalYears;
const actM = { steps: a.steps, costSteps: a.steps, harvest: false, harvestCeil: 'pa', lump: false, sweepCash: true, contrib: null };

// 1 and 2. the forward run, model.js and, from the forward run's state each year, a grid cell's flow
const s = vecOf(m, M.initialState(m)), st = M.initialState(m);
ok(s.length === 12 && s[11] === 0, `vecOf's state carries the gains into next year in slot 11 (length ${s.length})`);
let worstF = 0, worstM = 0, worstW = 0, outside = 0, charged = 0, lifeE = 0, lifeF = 0, lifeM = 0;
for (let t = 0; t <= T; t++) {
  // the grid cell: the same position with nothing carried in, seven slots; against the forward flow from it with slot 11 at 0
  const g7 = Float64Array.from(s.subarray(0, 7)), f0 = Float64Array.from(s); f0[11] = 0;
  F.flow(c, t, 0, f0); const bill0 = c.last.cgtPaid, late = f0[11];
  F.flow(c, t, 0, g7); const billG = c.last.cgtPaid;
  if (!(billG >= bill0 - 1e-6 && billG <= bill0 + late * m.P.cgtHigherRate + 1e-6)) outside++;
  if (billG > bill0 + 1) charged++;
  // the forward run itself, model.js and the engine
  F.flow(c, t, 0, s); const billF = c.last.cgtPaid; F.grow(c, t, s, c.real);
  const rm = M.step(m, st, actM, t, null);
  lifeE += rows[t].cgtPaid; lifeF += billF; lifeM += rm.cgtPaid;
  worstF = Math.max(worstF, Math.abs(billF - rows[t].cgtPaid)); worstM = Math.max(worstM, Math.abs(rm.cgtPaid - rows[t].cgtPaid));
  worstW = Math.max(worstW, Math.abs(s[0] + s[1] + s[2] - rows[t].totalCombined), Math.abs(rm.totalCombined - rows[t].totalCombined));
}
ok(worstF < 1 && worstM < 1 && worstW < 1, `every year of ${T + 1}: the forward run's and model.js's capital gains tax within £1 of the engine's (worst £${worstF.toFixed(2)}, £${worstM.toFixed(2)}), wealth within £1 (worst £${worstW.toFixed(2)}); lifetime engine £${lifeE.toFixed(0)}, forward £${lifeF.toFixed(0)}, model.js £${lifeM.toFixed(0)}`);
ok(outside === 0 && charged > 0, `a grid cell (no carry) pays the year's bill plus at most the higher rate on the late gain in every year, and more than the bill alone in ${charged} of ${T + 1} (outside the bounds: ${outside})`);

// 4. an unrealised loss, made by bad years on the same household with its taxable account bought at today's value (no
// gain, so one bad year puts it under water): the engine's basis stays above the value and later gains are offset against
// it; a forward run keeps the loss as a negative gain share (before, it was clamped at zero and forgotten)
{
  const planL = E.resolveMpaa(E.normalizePlan({ ...base, accounts: base.accounts.map(a => (a.id === 'other_self' ? { ...a, unrealisedGain: 0 } : a)) }));
  const mL = M.prepare(E, planL);
  // the mixture's tables grow each path with its own shift, as the engine does (a plain solve folds it into the yearly spread)
  const r = solveMixture(E, M, planL, { ...PRODUCT_BASELINE, points: 4, spendLevels: [1], raiseWeight: 0, lambda: 0 });
  const fixedAi = r.actions.findIndex(x => x.steps[0] === 'cash' && !x.harvest && x.spendLevel === 1 && !x.tierPen && !x.tierIsa);
  const TL = mL.ctx.totalYears, zs = Float64Array.from({ length: TL + 2 }, (_, t) => (t > TL ? 0 : t === 1 || t === 2 ? -2.5 : 0.3));   // the last entry: the path's shift, 0
  const ctx2 = E.buildContext({ ...planL, spending: { ...planL.spending, policyOverride: { kind: 'table', choose, switchCost: 0 } } }), st2 = E.freshState(ctx2), engineStates = [];
  for (let t = 0; t <= TL; t++) { engineStates[t] = vecOf(mL, modelStateOfEngine(st2)); E.stepYear(ctx2, st2, t, { z: zs[t], zPath: 0 }); }
  const compare = (plantClamp) => {
    let worst = 0, losses = 0;
    runPolicy(r, zs, { choose: () => fixedAi, visit: (t, s) => {
      const e = engineStates[t];
      if (e[3] < -1e-9) losses++;
      worst = Math.max(worst, Math.abs(s[3] - e[3]) * 1e6, Math.abs(s[0] - e[0]), Math.abs(s[1] - e[1]), Math.abs(s[2] - e[2]));
      if (plantClamp) s[3] = Math.max(0, s[3]);
    } });
    return { worst, losses };
  };
  const real = compare(false), planted = compare(true);
  ok(real.losses > 0 && real.worst < 1, `bad years on a taxable account bought at today's value: the engine carries an unrealised loss in ${real.losses} years, and the forward run's pots and gain share follow it every year (worst gap ${real.worst.toFixed(3)}: pounds, or millionths of the share)`);
  ok(planted.worst > 1, `planted: a forward run that clamps the gain share at zero (the fault before the fix) parts from the engine (worst gap ${planted.worst.toFixed(0)})`);
}

// 3. planted: the carry slot dropped every year (the fault before the fix): the forward run pays less than the engine
{
  const sp = vecOf(m, M.initialState(m));
  let life = 0;
  for (let t = 0; t <= T; t++) { sp[11] = 0; F.flow(c, t, 0, sp); life += c.last.cgtPaid; F.grow(c, t, sp, c.real); }
  ok(life < lifeE - 1000, `planted: with the carry dropped each year the forward run pays £${life.toFixed(0)} against the engine's £${lifeE.toFixed(0)}, and check 1 would see it`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} carry checks failed`);
