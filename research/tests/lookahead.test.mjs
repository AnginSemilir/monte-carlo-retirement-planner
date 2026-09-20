/*
 * The one-off cost lookahead, and the cost-aware bridge.
 *
 * A known cost used to arrive as a surprise: read in its own year and met by the cost order, which
 * ends in the pension with no ceiling. From `lookaheadYears` ahead the plan now draws this year's share
 * of the shortfall from the pension at the basic rate and parks it in the ISA then cash. What is pinned
 * here: a plan with no one-off costs is untouched by the setting; a large cost is met with less pension
 * drawn in its year and less tax over the lifetime; the draw never crosses the basic-rate ceiling and
 * never happens before the pension can be reached; and a cost inside the pre-access gap now sizes the
 * bridge, which it used to be left out of.
 */
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const GIA = 'Other Investments (e.g. GIA)';
const BASE = 2026;

const mk = (o = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: o.age ?? 55, retireAgeSelf: o.ret ?? 60, salarySelf: 65000,
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: 95
  },
  spending: { targetSpend: o.spend ?? 35000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: o.pen ?? 600000, contrib: 10000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: o.isa ?? 150000, contrib: 6000, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: o.gia ?? 40000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ],
  otherIncomes: [], oneOffContributions: [],
  oneOffCosts: o.cost ? [{ id: 'c', date: `${o.costYear}-06-01`, year: o.costYear, owner: 'Myself', amount: o.cost, desc: 'test' }] : [],
  config: { valuationDate: `${BASE}-01-01`, lookaheadYears: o.look ?? 0, harvestPersonalAllowance: o.harvest ?? false }
});
const rows = (plan) => E.simulateDeterministic(plan, 'expected');
const P = E.buildContext(mk()).P;
const costYear = BASE + 15;   // age 70: retired, past the access age, before the plan ends

console.log('=========== A. OFF IS OFF, AND NO COST IS NO-OP ===========');
{
  const a = rows(mk({ look: 0 })), b = rows(mk({ look: 5 }));
  ok('A1  with no one-off costs, the horizon changes nothing on the expected path', a.every((r, i) => r.totalCombined === b[i].totalCombined && r.taxPaid === b[i].taxPaid && r.reserved === 0));
  const ma = E.monteCarlo(mk({ look: 0 }), { trials: 300, seed: 3 }), mb = E.monteCarlo(mk({ look: 5 }), { trials: 300, seed: 3 });
  ok('A2  ...nor across the simulation', ma.successRate === mb.successRate && ma.medianTerminal === mb.medianTerminal && ma.medianLifetimeTax === mb.medianLifetimeTax);
  const c0 = rows(mk({ cost: 400000, costYear, look: 0 }));
  ok('A3  with a cost and the horizon at zero, nothing is set aside', c0.every(r => r.reserved === 0));
  ok('A4  a plan saved without the field reads as off', E.normalizePlan({ ...mk(), config: { valuationDate: `${BASE}-01-01` } }).config.lookaheadYears === 0);
}

console.log('=========== B. A LARGE COST, SEEN FIVE YEARS OUT ===========');
{
  // liquid wrappers that will not cover the cost on their own, so the rule has to act: ISA 60k, GIA 10k,
  // pension 900k, and the plain Bracket Fill order so the pension is the natural source either way
  const big = { cost: 400000, costYear, isa: 60000, gia: 10000, pen: 900000 };
  const off = rows(mk({ ...big, look: 0 })), on = rows(mk({ ...big, look: 5 }));
  const T = off.findIndex(r => r.year === costYear);
  const window = on.filter(r => r.year >= costYear - 5 && r.year < costYear);
  ok('B1  money is set aside in the years before the cost', window.some(r => r.reserved > 0), `${window.filter(r => r.reserved > 0).length} of 5 years`);
  ok('B2  ...each naming the cost it is for', window.filter(r => r.reserved > 0).every(r => r.reservedFor === costYear));
  ok('B3  ...and nothing is set aside once the cost has been paid', on.filter(r => r.year > costYear).every(r => r.reserved === 0));
  ok('B4  the pension drawn in the cost year is smaller', on[T].drawdownPensions < off[T].drawdownPensions, `${Math.round(on[T].drawdownPensions)} vs ${Math.round(off[T].drawdownPensions)}`);
  const tax = (rs) => rs.reduce((s, r) => s + r.taxPaid, 0);
  ok('B5  ...and the lifetime tax bill is lower', tax(on) < tax(off), `${Math.round(tax(on))} vs ${Math.round(tax(off))}`);
  // the ceiling: total taxable income (pension drawn plus state pension and other income, which
  // otherTaxableSelf already carries) never crosses the basic-rate limit in a year the reserve draws
  const over = window.filter(r => r.reserved > 0 && (r.taxablePensionSelf + (r.otherTaxableSelf || 0)) > P.higherRateStartsAt + 1);
  ok('B6  the reserve never draws past the basic-rate limit', over.length === 0, over.map(r => `${r.year}: ${Math.round(r.taxablePensionSelf + r.spSelf)}`).join(', '));
  const liquidBefore = on[T - 1].isas + on[T - 1].cash + on[T - 1].other;
  ok('B7  by the year before the cost, the liquid wrappers hold most of it', liquidBefore >= 400000 * 0.85, `${Math.round(liquidBefore)} against 400000`);
  const total = window.reduce((s, r) => s + r.reserved, 0);
  ok('B8  the total set aside is of the order of the cost, not a multiple of it', total > 0 && total <= 400000 * 1.25, `${Math.round(total)}`);
  // the GIA is left alone: it holds the same in every year before the cost whether the rule ran or not
  ok('B9  proceeds land in the ISA and in cash, not the GIA', on.filter(r => r.year < costYear).every((r, i) => Math.abs(r.other - off[i].other) < 1));
}

console.log('=========== C. WHERE IT MUST NOT ACT ===========');
{
  // a cost at 57 for someone retiring at 55: the pension cannot be reached, so nothing is drawn from it
  const pre = rows(mk({ age: 50, ret: 55, cost: 60000, costYear: BASE + 7, look: 5 }));
  ok('C1  before the access age nothing is set aside from the pension', pre.filter(r => r.ageSelf < 58).every(r => r.reserved === 0));
  // a household still working sees the cost but is not retired: no reserve either
  const work = rows(mk({ age: 55, ret: 62, cost: 100000, costYear: BASE + 4, look: 5 }));
  ok('C2  ...nor while still working', work.filter(r => r.ageSelf < 62).every(r => r.reserved === 0));
  // the harvest and the reserve share one ceiling
  const both = rows(mk({ cost: 400000, costYear, isa: 60000, gia: 10000, pen: 900000, look: 5, harvest: true }));
  const w = both.filter(r => r.year >= costYear - 5 && r.year < costYear);
  ok('C3  with the harvest on as well, the ceiling still holds', w.every(r => (r.taxablePensionSelf + (r.otherTaxableSelf || 0)) <= P.higherRateStartsAt + 1));
  ok('C4  ...and no figure is undefined or NaN', both.every(r => Number.isFinite(r.reserved) && Number.isFinite(r.harvested) && Number.isFinite(r.taxPaid)));
}

console.log('=========== D. ACROSS THE SIMULATION ===========');
{
  const big = { cost: 400000, costYear, isa: 60000, gia: 10000, pen: 900000 };
  const off = E.monteCarlo(mk({ ...big, look: 0 }), { trials: 800, seed: 11 });
  const on = E.monteCarlo(mk({ ...big, look: 5 }), { trials: 800, seed: 11 });
  ok('D1  survival does not fall', on.successRate >= off.successRate - 0.5, `${on.successRate.toFixed(1)}% vs ${off.successRate.toFixed(1)}%`);
  ok('D2  the typical lifetime tax bill is lower', on.medianLifetimeTax < off.medianLifetimeTax, `${Math.round(on.medianLifetimeTax)} vs ${Math.round(off.medianLifetimeTax)}`);
  console.log(`      median pot ${Math.round(on.medianTerminal)} vs ${Math.round(off.medianTerminal)}, p10 ${Math.round(on.p10Terminal)} vs ${Math.round(off.p10Terminal)}`);
}

console.log('=========== E. THE BRIDGE COUNTS A COST INSIDE THE GAP ===========');
{
  const none = E.bridgeRequirement(E.buildContext(mk({ age: 50, ret: 55 })));
  const inGap = E.bridgeRequirement(E.buildContext(mk({ age: 50, ret: 55, cost: 60000, costYear: BASE + 6 })));   // age 56, inside 55..58
  const after = E.bridgeRequirement(E.buildContext(mk({ age: 50, ret: 55, cost: 60000, costYear: BASE + 12 })));  // age 62, after access
  ok('E1  a cost inside the gap raises what the bridge must hold', inGap.netNeeded > none.netNeeded + 59000, `${Math.round(none.netNeeded)} -> ${Math.round(inGap.netNeeded)}`);
  ok('E2  ...and its discounted figure with it', inGap.pvNeeded > none.pvNeeded);
  ok('E3  a cost after the access age leaves the bridge alone', Math.abs(after.netNeeded - none.netNeeded) < 1 && after.gapYears === none.gapYears);
  const t = E.buildTournament(mk({ age: 50, ret: 55, cost: 60000, costYear: BASE + 6 }), { scope: 'full' });
  ok('E4  so the tournament sizes for it', t.meta.bridgeCapital > E.buildTournament(mk({ age: 50, ret: 55 }), { scope: 'full' }).meta.bridgeCapital);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
