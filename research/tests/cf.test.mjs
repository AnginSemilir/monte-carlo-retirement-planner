import * as E from '../engine.mjs';
const P = E.taxParams(E.DEFAULT_CONFIG);
let pass=0, fail=0;
const check=(id,d,a,e,tol=1,note='')=>{const ok=Math.abs(a-e)<=tol;ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${id}  ${d}`); if(!ok)console.log(`        expected £${Math.round(e).toLocaleString()}, got £${Math.round(a).toLocaleString()}  ${note}`);};
const ZERO={real:0,unlucky:0,lucky:0,nominal:0,volatility:0,label:'flat'};
const mk=(over={})=>({
  // salary is high enough that the earnings cap never binds, but below the £260k taper threshold so
  // these tests isolate carry-forward mechanics rather than the tapered annual allowance
  demographics:{ planningMode:'single', currentAgeSelf:45, retireAgeSelf:70, salarySelf:over.salary ?? 250000,
    statePensionAge:99, privatePensionAge:58, statePensionSelf:0, terminalAge:75,
    cfBroughtForwardSelf: over.cf ?? '', ...(over.demo||{}) },
  spending:{ targetSpend:0, drawdownStrategy:'Phased Drawdown', decumulationPolicy:'Bracket Fill Basic' },
  accounts:[
    { id:'pen_self', owner:'Myself', category:'Pensions', balance:100000, contrib: over.contrib ?? 10000, growth:0, risk:'Cash Equivalents' },
    { id:'isa_self', owner:'Myself', category:'S&S ISAs', balance:0, contrib:0, growth:0, risk:'Cash Equivalents' },
    { id:'other_self', owner:'Myself', category:E.CATEGORY_LABEL.other, balance:0, contrib:0, growth:0, risk:'Cash Equivalents' },
    { id:'cash_self', owner:'Myself', category:'Cash Savings', balance:0, contrib:0, growth:0, risk:'Cash Equivalents' }],
  riskProfiles:{ 'Cash Equivalents': ZERO },
  otherIncomes:[], oneOffContributions:[], oneOffCosts:[], config:{ valuationDate:'2026-01-01' }
});
const hr=(plan,t)=>E.wrapperHeadroomAtYear(E.buildContext(E.resolveMpaa(plan)),'self','pen',t);

console.log('=== CARRY FORWARD ===');
// £10k/yr against a £60k allowance => £50k unused per prior year.
check('CF1','t=3: allowance + 3 prior years unused - this year contrib', hr(mk(),3), 60000 + 150000 - 10000);
check('CF2','t=1: only 1 in-projection prior year (2 pre-projection, £0 declared)', hr(mk(),1), 60000 + 50000 - 10000);
// Earnings cap must still bind and is NOT lifted by carry forward.
check('CF3','earnings cap still binds and is NOT lifted by carry forward (£30k salary)', hr(mk({salary:30000}),3), 30000 - 10000, 1, 'allowance would be £210k but relief is capped at earnings');
check('CF3b','earnings cap binds at £200k salary too', hr(mk({salary:200000}),3), 200000 - 10000);
// Opening figure decays out of the 3-year window.
const cf30=mk({cf:30000});
check('CF4','opening £30k fully available at t=0', hr(cf30,0), 60000 + 30000 - 10000);
check('CF5','opening decays at t=1 (2/3 pre-projection + 1 in-projection)', hr(cf30,1), 60000 + 20000 + 50000 - 10000);
check('CF6','opening decays at t=2', hr(cf30,2), 60000 + 10000 + 100000 - 10000);
check('CF7','opening gone from t=3', hr(cf30,3), 60000 + 150000 - 10000);
// Not available against the MPAA.
const mp=mk({demo:{ retireAgeSelf:46 }, contrib:10000});
const mpR=E.resolveMpaa(mp);
console.log('   (derived MPAA trigger age:', mpR.demographics.mpaaAgeSelf || 'none', ')');
const mpCtx=E.buildContext(mpR);
const tTrig = Number(mpR.demographics.mpaaAgeSelf) - 45;
check('CF8','carry forward unavailable under MPAA', E.wrapperHeadroomAtYear(mpCtx,'self','pen',tTrig+1), 3600, 1,
  'retired with no earnings: min(MPAA, £3,600) = £3,600');
// ---------------------------------------------------------------- tapered annual allowance
console.log('\n=== TAPERED ANNUAL ALLOWANCE ===');
// HMRC: above £260k adjusted income the allowance drops £1 per £2, floor £10k. Earnings stand in for
// adjusted income here, so these lock the shape of the taper rather than HMRC's exact income measure.
const aaExpect = (s) => Math.max(10000, 60000 - Math.max(0, (s - 260000) / 2));
[[60000,'no taper'],[260000,'exactly at the threshold'],[300000,'mid taper'],[360000,'reaches the floor'],[600000,'well past the floor']]
  .forEach(([sal,note]) => {
    // t=0 so no carry forward accrues; contribution 0 so nothing is deducted
    check('TAPER', `£${sal.toLocaleString()} salary (${note})`, hr(mk({salary:sal,contrib:0}),0), Math.min(aaExpect(sal), sal), 1);
  });
// the taper must not reach below the floor even at absurd income
check('TAPER-FLOOR','allowance never tapers below the £10k floor', hr(mk({salary:5000000,contrib:0}),0), 10000);
// carry forward stacks on the TAPERED figure, not the headline allowance
check('TAPER-CF','carry forward stacks on the tapered allowance', hr(mk({salary:400000,contrib:0}),3), 10000 + 3*10000);

console.log(`\n${pass} passed, ${fail} failed`);
