import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const near = (n, a, b, tol = 0.5) => ok(n, Math.abs(a - b) <= tol, `got ${Math.round(a)}, expected ${Math.round(b)}`);

const H = { real: 4, unlucky: 0, lucky: 8, nominal: 6, volatility: 12, label: 'H' };
const base = (spending) => ({
  demographics: { planningMode: 'single', currentAgeSelf: 55, retireAgeSelf: 58, salarySelf: 60000,
    statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: 90 },
  spending: { targetSpend: 40000, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic', ...spending },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 400000, contrib: 0, growth: 0, risk: 'H' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 200000, contrib: 0, growth: 0, risk: 'H' },
    { id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 0, contrib: 0, growth: 0, risk: 'H' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 50000, contrib: 0, growth: 0, risk: 'H' }
  ],
  riskProfiles: { H }, otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
});
const ctxOf = (spending) => E.buildContext(E.normalizePlan(base(spending)));

console.log('=== no bands is a flat spend ===');
{
  const ctx = ctxOf({});
  ok('empty band list', ctx.spendBands.length === 0);
  near('age 58 uses the headline spend', E.spendTargetAtAge(ctx, 58), 40000);
  near('age 89 too', E.spendTargetAtAge(ctx, 89), 40000);
}

console.log('\n=== bands override only the years they name ===');
{
  const ctx = ctxOf({ spendBands: [
    { id: 'a', fromAge: 58, toAge: 67, amount: 45000 },
    { id: 'b', fromAge: 68, toAge: 79, amount: 34000 },
    { id: 'c', fromAge: 80, toAge: 90, amount: 40000 }
  ] });
  near('first band', E.spendTargetAtAge(ctx, 58), 45000);
  near('first band, last year', E.spendTargetAtAge(ctx, 67), 45000);
  near('second band', E.spendTargetAtAge(ctx, 68), 34000);
  near('third band rises again', E.spendTargetAtAge(ctx, 85), 40000);
  ok('spending can rise as well as fall', E.spendTargetAtAge(ctx, 85) > E.spendTargetAtAge(ctx, 79));
  // a year before any band falls back
  near('a year no band covers falls back to the headline', E.spendTargetAtAge(ctx, 57), 40000);
}

console.log('\n=== a partial set only names the years that differ ===');
{
  const ctx = ctxOf({ spendBands: [{ id: 'a', fromAge: 70, toAge: 75, amount: 60000 }] });
  near('before the band', E.spendTargetAtAge(ctx, 65), 40000);
  near('inside it', E.spendTargetAtAge(ctx, 72), 60000);
  near('after it', E.spendTargetAtAge(ctx, 80), 40000);
}

console.log('\n=== a blank end age runs to the terminal age ===');
{
  const ctx = ctxOf({ spendBands: [{ id: 'a', fromAge: 80, toAge: '', amount: 25000 }] });
  near('band applies at 80', E.spendTargetAtAge(ctx, 80), 25000);
  near('and still at the terminal age', E.spendTargetAtAge(ctx, 90), 25000);
  near('but not before it', E.spendTargetAtAge(ctx, 79), 40000);
}

console.log('\n=== legacy tapers migrate to the identical schedule ===');
{
  // the old behaviour: 10% off from 75, a further 10% off the reduced figure from 85
  const legacy = base({ taper1Age: 75, taper1Rate: 10, taper2Age: 85, taper2Rate: 10 });
  const ctx = E.buildContext(E.normalizePlan(legacy));
  ok('tapers became bands', ctx.spendBands.length === 2, JSON.stringify(ctx.spendBands));
  near('before any taper', E.spendTargetAtAge(ctx, 70), 40000);
  near('taper 1: 10% off', E.spendTargetAtAge(ctx, 75), 36000);
  near('still taper 1 at 84', E.spendTargetAtAge(ctx, 84), 36000);
  near('taper 2 compounds on the taper-1 figure', E.spendTargetAtAge(ctx, 85), 32400);
  near('and holds to the end', E.spendTargetAtAge(ctx, 90), 32400);

  // and the whole projection must be unchanged versus the old engine's arithmetic
  const rows = E.simulateDeterministic(ctx, 'expected');
  const spendAt = (age) => 40000 * (age >= 75 ? 0.9 : 1) * (age >= 85 ? 0.9 : 1);
  let worst = 0;
  rows.forEach(r => {
    const age = 55 + r.t;
    if (age < 58) return;
    worst = Math.max(worst, Math.abs(E.spendTargetAtAge(ctx, age) - spendAt(age)));
  });
  near('every projected year matches the old taper formula', worst, 0, 1);

  // a single taper migrates too
  const one = E.buildContext(E.normalizePlan(base({ taper1Age: 80, taper1Rate: 25 })));
  near('single taper before', E.spendTargetAtAge(one, 79), 40000);
  near('single taper after', E.spendTargetAtAge(one, 80), 30000);

  // an explicit (even empty) band list must win over any stale taper fields
  const both = E.buildContext(E.normalizePlan(base({ taper1Age: 75, taper1Rate: 10, spendBands: [] })));
  ok('an explicit band list is not overwritten by legacy tapers', both.spendBands.length === 0);
  near('so the taper no longer applies', E.spendTargetAtAge(both, 80), 40000);
}

console.log('\n=== validation ===');
{
  const bad = E.buildContext(E.normalizePlan(base({ spendBands: [{ id: 'a', fromAge: 80, toAge: 70, amount: 10000 }] })));
  ok('a backwards band is warned about', bad.warnings.some(w => /before it begins/.test(w)), JSON.stringify(bad.warnings));
  const overlap = E.buildContext(E.normalizePlan(base({ spendBands: [
    { id: 'a', fromAge: 60, toAge: 75, amount: 50000 },
    { id: 'b', fromAge: 70, toAge: 80, amount: 30000 }
  ] })));
  ok('overlapping bands are warned about', overlap.warnings.some(w => /overlap/.test(w)), JSON.stringify(overlap.warnings.filter(w => /overlap/.test(w))));
  near('and the earlier band wins, as the warning says', E.spendTargetAtAge(overlap, 72), 50000);
}

console.log('\n=== the safe-spend solver scales the whole shape ===');
{
  const ctx = ctxOf({ spendBands: [
    { id: 'a', fromAge: 58, toAge: 70, amount: 50000 },
    { id: 'b', fromAge: 71, toAge: 90, amount: 25000 }
  ] });
  const solved = E.optimizeSpend(ctx, { trials: 300, seed: 7, targetSuccess: 90 });
  ok('the solver returns a spend', solved.spend > 0, String(solved.spend));
  // the shape must be preserved: the late band stays half the early one
  const ratio = 25000 / 50000;
  const rows = E.simulateDeterministic(ctx, 'expected');
  ok('band ratio is 2:1 in the shape itself', Math.abs((E.spendTargetAtAge(ctx, 75) / E.spendTargetAtAge(ctx, 60)) - ratio) < 1e-9);
  ok('projection runs without error under bands', rows.length > 0);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
