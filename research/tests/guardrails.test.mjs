/*
 * Guyton-Klinger guardrails: a spending rule, tested as mechanics rather than as a promise.
 *
 * The rule can make a plan look safer without making the household richer - a path that survives by
 * cutting three times is still a survival - so the assertions here are about what the rule DOES and
 * what it reports, not about survival going up. Two invariants are also pinned: with the rule off the
 * engine is exactly what it was, and the solver's safe starting spend is never lower with the rule on
 * than off, because the option to cut can only widen what a starting figure can survive.
 */
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const GIA = 'Other Investments (e.g. GIA)';
const G = E.GUARDRAILS;

const mk = (o = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: o.age ?? 55, retireAgeSelf: o.ret ?? 60, salarySelf: 65000,
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: o.sp ?? 11500, terminalAge: o.term ?? 95
  },
  spending: { targetSpend: o.spend ?? 40000, spendBands: o.bands ?? [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: o.pen ?? 500000, contrib: 10000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: o.isa ?? 250000, contrib: 6000, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: o.gia ?? 60000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ],
  otherIncomes: o.incomes ?? [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01', guardrails: o.on ?? true }
});

// One path through stepYear with a chosen shock series, keeping every row.
const walk = (plan, zAt = () => 0) => {
  const ctx = E.buildContext(plan);
  const state = E.freshState(ctx);
  const rows = [];
  for (let t = 0; t <= ctx.totalYears; t++) rows.push(E.stepYear(ctx, state, t, { z: zAt(t, ctx), zPath: 0 }));
  return { ctx, rows };
};
const retired = (rows, ctx) => rows.filter(r => r.ageSelf >= ctx.owners[0].retireAge);

console.log('=========== A. OFF IS OFF ===========');
{
  const off = mk({ on: false });
  ok('A1  a plan saved before the rule existed reads as off', E.normalizePlan({ ...off, config: { valuationDate: '2026-01-01' } }).config.guardrails === false);
  ok('A2  the context carries no rule when off', E.buildContext(off).guardrails === null);
  const { ctx, rows } = walk(off, () => -1.5);
  ok('A3  every year multiplier is exactly 1 with the rule off, even through losses', rows.every(r => r.spendMult === 1 && r.guardrail === null));
  const mc = E.monteCarlo(off, { trials: 300, seed: 3 });
  ok('A4  realised spend equals the plan with the rule off', Math.abs(mc.medianRealisedSpend - 40000) < 1 && mc.cutPathShare === 0, `${mc.medianRealisedSpend}`);
}

console.log('=========== B. THE RULES, ONE AT A TIME ===========');
{
  // a smooth expected path: nothing to react to, so nothing is cut and nothing is skipped
  const { ctx, rows } = walk(mk());
  const ret = retired(rows, ctx);
  ok('B1  the rails are set the first year the portfolio is drawn on', ret[0].spendMult === 1 && ret[0].guardrail === null);
  ok('B2  no cut and no skipped rise on a path that never loses money', ret.every(r => !/cut|no rise/.test(r.guardrail || '')));
  ok('B3  the multiplier never falls on that path', ret.every(r => r.spendMult >= 1));
}
{
  // three bad years straight after retiring: the pot falls, the rate breaches the upper rail, spending is cut
  const { ctx, rows } = walk(mk(), (t, c) => (t >= 5 && t <= 7 ? -2.2 : 0));   // retire at t=5
  const ret = retired(rows, ctx);
  const firstCut = ret.findIndex(r => /cut/.test(r.guardrail || ''));
  ok('B4  a run of losses triggers the capital preservation cut', firstCut > 0 && firstCut <= 4, `first cut in retired year ${firstCut}`);
  const cutRow = ret[firstCut], before = ret[firstCut - 1];
  const expectNoRise = before.spendMult / (1 + ctx.inflation);
  const expectCut = expectNoRise * (1 - G.cut);
  ok('B5  ...and the cut year skips the inflation rise as well, in that order',
    /no rise/.test(cutRow.guardrail) && Math.abs(cutRow.spendMult - expectCut) < 1e-9, `${cutRow.guardrail}: ${cutRow.spendMult.toFixed(5)} vs ${expectCut.toFixed(5)}`);
  // the year after a single loss with no breach: only the inflation rise is skipped
  const { ctx: c2, rows: r2 } = walk(mk({ pen: 900000, isa: 400000 }), (t) => (t === 6 ? -1.0 : 0));
  const ret2 = retired(r2, c2);
  const skip = ret2.find(r => r.guardrail === 'no rise');
  const prev = ret2[ret2.indexOf(skip) - 1];
  ok('B6  a lone losing year on a well-funded plan skips the rise and nothing more', !!skip && Math.abs(skip.spendMult - prev.spendMult / (1 + c2.inflation)) < 1e-9);
}
{
  // a boom: the rate falls below the lower rail and the prosperity rule grants a rise
  const { ctx, rows } = walk(mk(), (t) => (t >= 5 && t <= 8 ? 1.6 : 0));
  const ret = retired(rows, ctx);
  const raise = ret.find(r => /raise/.test(r.guardrail || ''));
  ok('B7  a run of good years triggers the prosperity rise', !!raise && raise.spendMult > 1, raise ? `${raise.spendMult.toFixed(3)} at ${raise.ageSelf}` : 'no raise');
  ok('B8  ...by exactly the rule\'s step', !!raise && Math.abs(raise.spendMult - (ret[ret.indexOf(raise) - 1].spendMult * (1 + G.raise))) < 1e-9);
}
{
  // the freeze: losses inside the final freezeYears skip the rise but never cut
  const plan = mk({ term: 95 });
  const c0 = E.buildContext(plan);
  const late = c0.totalYears - G.freezeYears + 2;
  const { ctx, rows } = walk(plan, (t) => (t >= late && t <= late + 3 ? -2.5 : 0));
  const tail = rows.filter(r => (ctx.totalYears - r.t) <= G.freezeYears);
  ok('B9  no cut inside the final freeze window, however bad the years', tail.every(r => !/cut/.test(r.guardrail || '')), `${tail.filter(r => r.guardrail).map(r => r.guardrail).join(' | ')}`);
  ok('B10 ...while the skipped rise still applies there', tail.some(r => /no rise/.test(r.guardrail || '')));
}
{
  // guaranteed income covers everything: no draw, so no rate, so the rule never fires
  const plan = mk({ spend: 20000, incomes: [{ id: 'db', owner: 'Myself', name: 'DB', amount: 30000, startAge: 60, endAge: '', type: 'db' }] });
  const { ctx, rows } = walk(plan, () => -2.0);
  ok('B11 a household that never draws on the pots is never touched by the rule', retired(rows, ctx).every(r => r.spendMult === 1 && r.guardrail === null));
}
{
  // spend bands compose: the multiplier scales the band's figure, not the headline
  const plan = mk({ bands: [{ id: 'b', fromAge: 75, toAge: 95, amount: 30000 }] });
  const { ctx, rows } = walk(plan);
  const at80 = rows.find(r => r.ageSelf === 80);
  ok('B12 a spend band still sets the year\'s figure under the rule', Math.abs(at80.targetSpend - (E.spendTargetAtAge(ctx, 80) - 11500) * at80.spendMult - 11500) < 1, `${at80.targetSpend.toFixed(0)} at mult ${at80.spendMult.toFixed(3)}`);
  // the rule must not read the household's own plan as good news: the band year re-sets the rails
  const at75 = rows.find(r => r.ageSelf === 75);
  ok('B13 ...and the band\'s own drop re-sets the rails rather than triggering a rise', /rails re-set/.test(at75.guardrail || '') && !/raise/.test(at75.guardrail || ''), at75.guardrail || 'nothing');
  ok('B14 ...so the multiplier stays near 1 on a smooth path instead of undoing the band', at80.spendMult < 1.25, at80.spendMult.toFixed(3));
  const at68 = rows.find(r => r.ageSelf === 68);
  ok('B15 the state pension starting re-sets the rails the same way', /rails re-set/.test(at68.guardrail || ''), at68.guardrail || 'nothing');
}

console.log('=========== C. WHAT IT REPORTS ===========');
{
  const on = E.monteCarlo(mk(), { trials: 600, seed: 11 }), off = E.monteCarlo(mk({ on: false }), { trials: 600, seed: 11 });
  ok('C1  some paths are cut and some are raised', on.cutPathShare > 0 && on.raisePathShare > 0, `${on.cutPathShare.toFixed(1)}% cut, ${on.raisePathShare.toFixed(1)}% raised`);
  ok('C2  realised spend figures are finite money', Number.isFinite(on.medianRealisedSpend) && Number.isFinite(on.p10RealisedSpend) && on.p10RealisedSpend <= on.medianRealisedSpend, `median ${on.medianRealisedSpend.toFixed(0)}, p10 ${on.p10RealisedSpend.toFixed(0)}`);
  ok('C3  the unlucky tenth lived on less than the plan', on.p10RealisedSpend < 40000, `${on.p10RealisedSpend.toFixed(0)}`);
  console.log(`      survival ${off.successRate.toFixed(1)}% fixed -> ${on.successRate.toFixed(1)}% with guardrails; median cut years ${on.medianCutYears}`);
}
{
  const lean = { pen: 320000, isa: 120000, gia: 20000, spend: 38000 };
  const sOff = E.optimizeSpend(mk({ ...lean, on: false }), { targetRate: 90, seed: 5, searchTrials: 300, finalTrials: 600 });
  const sOn = E.optimizeSpend(mk({ ...lean, on: true }), { targetRate: 90, seed: 5, searchTrials: 300, finalTrials: 600 });
  ok('C4  the safe STARTING spend is never lower with the rule on', sOn.spend >= sOff.spend, `${sOff.spend} fixed, ${sOn.spend} with guardrails`);
  ok('C5  ...and both still clear the target they were asked for', sOff.successRate >= 90 && sOn.successRate >= 90, `${sOff.successRate.toFixed(1)}% and ${sOn.successRate.toFixed(1)}%`);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
