import * as E from '/home/user/vitejs-vite-kdvuf9qw/research/engine.mjs';
/*
 * How long the model takes, on a real 32-year plan with three heirs. Run it after anything that adds
 * work to a hot path: the numbers below were measured on a container, so treat them as a baseline to
 * compare against rather than a promise about anyone's laptop.
 *
 *   node research/audit/timing.mjs
 */
const raw = {
  demographics: { planningMode: 'single', currentAgeSelf: 68, retireAgeSelf: 65, salarySelf: '',
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: 100 },
  spending: { targetSpend: 50000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 1200000, contrib: 0, growth: '', risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 175000, contrib: 0, growth: '', risk: 'High Risk' },
    { id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 400, contrib: 0, growth: '', risk: 'Low Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: '', contrib: 0, growth: '', risk: 'Low Risk' }],
  otherIncomes: [{ id: 'i1', name: '', owner: 'Myself', startAge: 67, endAge: '', amount: 11000, incomeType: 'earnings' }],
  oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-09-13' },
  inheritance: { deathAge: 71, homeValue: 1400000, homeToDescendants: true,
    beneficiaries: [
      { id: 'b1', name: 'Sam', relationship: 'descendant', sharePct: 45, income: 93000, age: 35 },
      { id: 'b2', name: 'Kiki', relationship: 'descendant', sharePct: 10, income: 0, age: 4 },
      { id: 'b3', name: 'Alex', relationship: 'descendant', sharePct: 45, income: 150000, age: 36 }] }
};
const plan = E.normalizePlan(raw);
const time = (label, fn, reps=1) => {
  fn(); // warm
  const t0 = process.hrtime.bigint();
  for (let i=0;i<reps;i++) fn();
  const ms = Number(process.hrtime.bigint()-t0)/1e6/reps;
  console.log(`  ${label.padEnd(46)} ${ms.toFixed(2).padStart(9)} ms`);
  return ms;
};
console.log('engine hot paths (single household, 32-year plan)\n');
let ctx, rows;
time('normalizePlan', ()=>E.normalizePlan(raw), 200);
time('buildContext', ()=>{ctx=E.buildContext(E.resolveMpaa(plan));}, 200);
time('simulateDeterministic', ()=>{rows=E.simulateDeterministic(ctx,'expected');}, 200);
time('evaluateRows', ()=>E.evaluateRows(ctx,rows), 500);
time('estateAtDeath', ()=>E.estateAtDeath(plan.config,{pen:1e6,isa:2e5,other:1e5,cash:5e4},{deathAge:80,deathYear:2038,homeValue:1.4e6,homeToDescendants:true,beneficiaries:plan.inheritance.beneficiaries}), 2000);
time('bestPensionSplit (3 heirs, exhaustive)', ()=>E.bestPensionSplit(plan.config,{pen:1e6,isa:2e5,other:1e5,cash:5e4},{deathAge:80,deathYear:2038,homeValue:1.4e6,homeToDescendants:true,beneficiaries:plan.inheritance.beneficiaries}), 20);
time('simulateHistorical', ()=>E.simulateHistorical(ctx,1970), 100);
console.log('');
time('monteCarlo 1,000 trials', ()=>E.monteCarlo(ctx,{trials:1000,seed:1}), 3);
time('monteCarlo 5,000 trials (the app default)', ()=>E.monteCarlo(ctx,{trials:5000,seed:1}), 2);
time('optimizeSpend (400/5000, the app default)', ()=>E.optimizeSpend(ctx,{targetRate:90,seed:1}), 1);
console.log('');
time('suggestGift (the Inheritance tab memo)', ()=>{
  const row=rows.find(r=>r.ageSelf>=71)||rows[rows.length-1];
  const liq={cash:0,other:400,isa:175000};
  E.suggestGift(plan.config,{pen:row.pensions,isa:row.isas,other:row.other,cash:row.cash},
    {deathAge:71,deathYear:row.year,homeValue:1.4e6,homeToDescendants:true,giftYear:2027,liquidToday:liq,
     beneficiaries:plan.inheritance.beneficiaries,
     project:(amt)=>{const c=E.buildContext(E.resolveMpaa({...plan,inheritance:{...plan.inheritance,gifts:[{id:'p',amount:amt,year:2027}]}}));
       const rr=E.simulateDeterministic(c,'expected'); const r2=rr.find(x=>x.ageSelf>=71)||rr[rr.length-1];
       return {pen:r2.pensions,isa:r2.isas,other:r2.other,cash:r2.cash,survived:E.evaluateRows(c,rr).survived};}});
}, 5);
time('optimizeInheritance (the estate search)', ()=>E.optimizeInheritance(raw), 5);
time('buildTournament', ()=>E.buildTournament(E.resolveMpaa(plan),{}), 20);
