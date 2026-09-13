import { accumulationOutlay, solveEscalation, applyEscalationToPlan, buildTournament, normalizePlan, buildContext } from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) { pass++; console.log(`  PASS  ${n}`); } else { fail++; console.log(`  FAIL  ${n} ${extra}`); } };
const H = { real: 5, unlucky: -1, lucky: 9, nominal: 7.5, volatility: 15, label: 'H' };

const mk = (penEsc, isaEsc, over = {}) => ({
  demographics: { planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 65, salarySelf: 80000, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: 90, ...(over.demographics || {}) },
  spending: { targetSpend: 35000, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 200000, contrib: 10000, growth: penEsc, risk: 'H' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 100000, contrib: 10000, growth: isaEsc, risk: 'H' },
    { id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 0, contrib: 0, growth: 0, risk: 'H' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'H' }
  ],
  riskProfiles: { H }, otherIncomes: [], oneOffContributions: [], oneOffCosts: [],
  config: { valuationDate: '2026-01-01' }
});

console.log('\nA. accumulationOutlay basics');
{
  const flat = accumulationOutlay(normalizePlan(mk(0, 0)));
  const esc = accumulationOutlay(normalizePlan(mk(5, 0)));
  ok('escalating costs more than flat', esc > flat, `${esc} vs ${flat}`);
  ok('outlay is positive and finite', flat > 0 && Number.isFinite(flat));
  const noContrib = normalizePlan(mk(0, 0));
  noContrib.accounts.forEach(a => { a.contrib = 0; });
  ok('no contributions gives zero outlay', accumulationOutlay(noContrib) === 0);
  // only accumulation years count: retiring immediately means nothing is ever paid in
  ok('retiring now gives zero outlay', accumulationOutlay(normalizePlan(mk(0, 0, { demographics: { retireAgeSelf: 45 } }))) === 0);
  ok('rateOverride re-prices the same year-0 amounts', accumulationOutlay(normalizePlan(mk(5, 0)), 0) === accumulationOutlay(normalizePlan(mk(0, 0)), 0));
}

console.log('\nB. solveEscalation hits the target');
{
  const plan = normalizePlan(mk(5, 0));
  const target = 350000;
  const s = solveEscalation(plan, target);
  ok('returns a rate', s.rate !== null, JSON.stringify(s));
  ok('achieved outlay matches target within £250', Math.abs(s.after - target) < 250, `after ${Math.round(s.after)} vs ${target}`);
  ok('before reflects the inherited escalation', Math.abs(s.before - accumulationOutlay(plan)) < 1);
  ok('rate is stored at 0.01pp precision', Math.abs(s.rate * 10000 - Math.round(s.rate * 10000)) < 1e-9, String(s.rate));
  const unreachable = solveEscalation(plan, 1);
  ok('unreachable target returns null rate rather than a wrong one', unreachable.rate === null);
}

console.log('\nC. applyEscalationToPlan');
{
  const plan = normalizePlan(mk(5, 2));
  const out = applyEscalationToPlan(plan, 0.0312);
  ok('every account gets the solved rate', out.accounts.every(a => a.growth === 3.12), out.accounts.map(a => a.growth).join(','));
  ok('year-0 contributions are untouched', out.accounts.find(a => a.id === 'pen_self').contrib === 10000);
  ok('source plan is not mutated', plan.accounts.find(a => a.id === 'pen_self').growth === 5);
  // a pre-built schedule must have its old escalation stripped, not stacked
  const sched = normalizePlan(mk(5, 0));
  sched.accounts.find(a => a.id === 'pen_self').contribByYear = [1000, 1050, 1102, 1158];
  const res = applyEscalationToPlan(sched, 0);
  const arr = res.accounts.find(a => a.id === 'pen_self').contribByYear;
  ok('schedule rescaled to a flat rate becomes flat', arr.slice(0, 4).every(v => Math.abs(v - 1000) <= 1), arr.slice(0, 4).join(','));
}

console.log('\nD. buildTournament holds every player to the baseline outlay');
{
  for (const [label, pe, ie] of [['pen 5 / isa 0', 5, 0], ['both flat', 0, 0], ['pen 0 / isa 5', 0, 5], ['pen 8 / isa 1', 8, 1]]) {
    const t = buildTournament(normalizePlan(mk(pe, ie)), {});
    const target = t.meta.baselineOutlay;
    ok(`${label}: meta carries the baseline outlay`, target > 0);
    const drifts = t.strategies.filter(s => s.id !== 'baseline').flatMap(s => (s.planState ? [s.planState] : (s.candidates || []).map(c => c.planState)))
      .map(ps => Math.abs(accumulationOutlay(ps) - target) / target);
    const worst = Math.max(...drifts);
    ok(`${label}: every player within 0.1% of baseline outlay`, worst < 0.001, `worst ${(worst * 100).toFixed(3)}%`);
  }
}

console.log('\nE. escalation metadata is exposed for the UI');
{
  const t = buildTournament(normalizePlan(mk(5, 0)), {});
  const relief = t.strategies.find(s => s.id === 'relief');
  ok('non-baseline strategies carry escalation metadata', !!relief.escalation);
  ok('metadata records the unnormalised cost', relief.escalation.before > relief.escalation.target, `${Math.round(relief.escalation.before)} vs ${Math.round(relief.escalation.target)}`);
  ok('metadata records the achieved cost near target', Math.abs(relief.escalation.after - relief.escalation.target) / relief.escalation.target < 0.001);
  ok('baseline carries no escalation adjustment', !t.strategies.find(s => s.id === 'baseline').escalation);
  const surv = t.strategies.find(s => s.id === 'survival');
  ok('survival candidates are normalised too', surv.candidates.every(c => c.escalation));
  // the plan the projection actually runs must agree with the reported rate
  const ctx = buildContext(relief.planState);
  ok('plan growth matches the reported rate', Math.abs(ctx.acc.pen_self.growth - relief.escalation.rate) < 1e-9, `${ctx.acc.pen_self.growth} vs ${relief.escalation.rate}`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
