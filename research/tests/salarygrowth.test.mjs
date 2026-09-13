import * as E from '../engine.mjs';

const P = E.taxParams(E.DEFAULT_CONFIG);
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const near = (n, a, b, tol = 1, extra = '') => ok(n, Math.abs(a - b) <= tol, extra || `got ${Math.round(a)}, expected ${Math.round(b)}`);

const H = { real: 4, unlucky: 0, lucky: 8, nominal: 6, volatility: 12, label: 'H' };
const mk = (growth, over = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 65, salarySelf: 50000,
    salaryGrowthSelf: growth, statePensionAge: 68, privatePensionAge: 58,
    statePensionSelf: 11500, terminalAge: 90, ...(over.demographics || {})
  },
  spending: { targetSpend: 30000, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 100000, contrib: 8000, growth: 0, risk: 'H' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 50000, contrib: 5000, growth: 0, risk: 'H' },
    { id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 0, contrib: 0, growth: 0, risk: 'H' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 20000, contrib: 0, growth: 0, risk: 'H' }
  ],
  riskProfiles: { H }, otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
});

console.log('=== the default is a no-op ===');
{
  const blank = E.buildContext(mk(''));
  const zero = E.buildContext(mk(0));
  ok('blank reads as 0% real growth', blank.owners[0].salaryGrowth === 0);
  ok('salaryAtYear is flat at 0%', E.salaryAtYear(blank.owners[0], 0) === 50000 && E.salaryAtYear(blank.owners[0], 19) === 50000);
  // a plan with no field at all must behave identically to one with 0
  const legacy = mk(0);
  delete legacy.demographics.salaryGrowthSelf;
  const legacyCtx = E.buildContext(legacy);
  ok('a saved plan with no such field still works', legacyCtx.owners[0].salaryGrowth === 0);
  const a = E.simulateDeterministic(legacyCtx, 'expected');
  const b = E.simulateDeterministic(zero, 'expected');
  near('and projects identically to an explicit 0', a[a.length - 1].totalCombined, b[b.length - 1].totalCombined, 0.01);
}

console.log('\n=== the rate compounds, and stops at retirement ===');
{
  const ctx = E.buildContext(mk(2));
  const o = ctx.owners[0];
  near('year 0 is the figure entered', E.salaryAtYear(o, 0), 50000);
  near('year 10 compounds at 2%', E.salaryAtYear(o, 10), 50000 * Math.pow(1.02, 10));
  near('relevant earnings track it while working', E.relevantEarningsAtYear(ctx, o, 10), 50000 * Math.pow(1.02, 10));
  ok('relevant earnings are 0 once retired', E.relevantEarningsAtYear(ctx, o, 20) === 0);
  const down = E.buildContext(mk(-3));
  ok('a negative rate winds earnings down', E.salaryAtYear(down.owners[0], 10) < 50000);
}

console.log('\n=== it reaches the allowance cap and the relief rate ===');
{
  // earnings cap the pension allowance, so a rising salary lifts headroom in later years
  const flat = E.buildContext(mk(0, { demographics: { salarySelf: 20000 } }));
  const rising = E.buildContext(mk(5, { demographics: { salarySelf: 20000 } }));
  const hFlat = E.wrapperHeadroomAtYear(flat, 'self', 'pen', 10);
  const hRising = E.wrapperHeadroomAtYear(rising, 'self', 'pen', 10);
  ok('earnings-capped pension headroom rises with pay', hRising > hFlat, `${Math.round(hFlat)} -> ${Math.round(hRising)}`);

  // crossing into higher-rate territory must change the relief priced into the outlay
  const near40 = E.buildContext(mk(0, { demographics: { salarySelf: 45000 } }));
  const grows = E.buildContext(mk(4, { demographics: { salarySelf: 45000 } }));
  const outFlat = E.accumulationOutlay(near40);
  const outGrow = E.accumulationOutlay(grows);
  ok('accumulation outlay falls once pay reaches the higher rate', outGrow < outFlat,
     `${Math.round(outFlat)} -> ${Math.round(outGrow)}`);
}

console.log('\n=== the taper keys off the grown figure ===');
{
  // starts below the £260k taper threshold, grows through it
  const ctx = E.buildContext(mk(6, { demographics: { salarySelf: 200000 } }));
  const o = ctx.owners[0];
  const early = P.aaAt(E.relevantEarningsAtYear(ctx, o, 0));
  const late = P.aaAt(E.relevantEarningsAtYear(ctx, o, 15));
  ok('allowance is untapered early', early === P.pensionAllowance, `${Math.round(early)}`);
  ok('and tapered once pay grows past the threshold', late < early, `${Math.round(early)} -> ${Math.round(late)}`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
