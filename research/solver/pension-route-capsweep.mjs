/*
 * The earnings cap's sweep (D154 (3); research/solver/pension-route-mutations.py --capsweep, which builds the two engines):
 * allocateBudget on engine A against engine B over salaries (blank to £260,000), the three routes, the pass-through at 0, 50
 * and 100%, the MPAA, budgets, ISA shares and a pension floor; any difference in what it returns is counted and the first
 * five printed. With B the earnings cap's route read put back to the NIC class, an equivalent change, nothing differs; with B
 * the gross-up's put back, the control, it does.
 *   node research/solver/pension-route-capsweep.mjs <engine A> <engine B>
 */
import { pathToFileURL } from 'node:url';

const [A, B] = await Promise.all(process.argv.slice(2, 4).map(f => import(pathToFileURL(f).href)));
const base = (salary, emp, pass, mpaa) => ({ demographics: { planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 65, salarySelf: salary, employmentSelf: emp, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: 90, ...(mpaa ? { mpaaAgeSelf: 40 } : {}) },
  spending: { targetSpend: 35000, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [{ id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 200000, contrib: 8000, growth: 0, risk: 'H' }, { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 100000, contrib: 5000, growth: 0, risk: 'H' }, { id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 0, contrib: 0, growth: 0, risk: 'H' }, { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'H' }],
  riskProfiles: { H: { real: 4, unlucky: 0, lucky: 8, nominal: 6, volatility: 12, label: 'H' } }, otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01', employerNicPassThrough: pass } });
let n = 0, diff = 0;
const where = [];
for (const salary of [0, 9000, 15000, 34000, 52000, 80000, 110000, 140000, 260000]) for (const emp of ['employed-net', 'employed', 'self-employed']) for (const pass of [0, 50, 100]) for (const mpaa of [false, true]) {
  const ca = A.buildContext(A.normalizePlan(base(salary, emp, pass, mpaa))), cb = B.buildContext(B.normalizePlan(base(salary, emp, pass, mpaa)));
  for (const budget of [1000, 8000, 30000, 80000, 300000]) for (const share of [0, 0.3, 1]) for (const floor of [null, [3000]]) {
    const o = { ...(floor ? { penFloorGross: floor } : {}) };
    const a = JSON.stringify(A.allocateBudget(ca, budget, share, o)), b = JSON.stringify(B.allocateBudget(cb, budget, share, o));
    n++;
    if (a !== b) { diff++; if (where.length < 5) where.push(`${emp} £${salary} pass ${pass}% mpaa ${mpaa} budget £${budget} share ${share}`); }
  }
}
console.log(`allocateBudget compared on ${n} cases: ${diff} differ${where.length ? ` (the first: ${where[0]})` : ''}`);
