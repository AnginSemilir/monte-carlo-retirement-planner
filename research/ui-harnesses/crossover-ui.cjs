/*
 * CROSSING BETWEEN THE TWO APPS CARRIES YOUR FIGURES, AND NEVER EATS THEM.
 *
 * crossover.test.mjs pins the adapters as pure functions. This pins the thing a user actually does:
 * press the switch at the top of the page and find their plan waiting on the other side. It is a
 * separate check because the risk lives in the SHELL, not the adapters - which key is read, which is
 * written, and in what order relative to the component mounting and re-saving its own state.
 *
 * The fourth assertion is the one that matters most. Each page saves itself on every render, so a
 * crossing that wrote a blank over the other page's saved plan would destroy real work with no undo,
 * and it would happen to anybody who pressed the button twice on a fresh visit.
 *
 * Run: node crossover-ui.cjs [port]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || '5181';
// NO STYLESHEET IS INJECTED. These harnesses used to read a Tailwind build from /tmp and addStyleTag it,
// a leftover from when the dev server leaned on a Tailwind CDN. The built site links its own compiled
// CSS, and layering an older copy over the top silently overrides it: a stale `.flex` rule landing after
// the real `@media (min-width:1024px){.lg\:grid{...}}` collapsed a two-column layout to one, and stale
// colour tokens produced contrast failures that did not exist in the shipped page.
const GIA = 'Other Investments (e.g. GIA)';
const plan = {demographics:{planningMode:'single',currentAgeSelf:51,retireAgeSelf:61,salarySelf:68000,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11500,terminalAge:93},
  spending:{targetSpend:42000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:410000,contrib:14000,growth:2,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:120000,contrib:5000,growth:1,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:35000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:22000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};
const ok = (l,c,d='') => { console.log(`  ${c?'ok  ':'FAIL'}  ${l}${d?'   '+d:''}`); if(!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.addInitScript(pl => { if (!localStorage.getItem('rp_plan_full_v28')) { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', 'full'); } }, plan);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(800);
  // full -> simple
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Open the simple version/.test(b.textContent)); x.click(); });
  await p.waitForTimeout(1200);
  const simple = await p.evaluate(() => JSON.parse(localStorage.getItem('rp_simple_v1') || 'null'));
  ok('the full plan crossed into the simple page', !!simple && Number(simple.pen) === 410000 && Number(simple.spend) === 42000,
     simple ? `pen ${simple.pen}, spend ${simple.spend}, age ${simple.ageSelf}` : 'nothing written');
  ok('...with contributions and risk levels', Number(simple.penC) === 14000 && simple.penRisk === 'High Risk', `${simple.penC}, ${simple.penRisk}`);
  /*
   * There used to be a banner here saying what could not come across. It was removed: it appeared on
   * every crossing, said the same thing every time, and cost a card at the top of the page somebody had
   * just navigated to. What matters is that the figures DID cross, which the two assertions above check
   * directly, and that the plan left behind is untouched, which the one below does. This asserts the
   * banner's absence so its return is a deliberate act rather than an accident.
   */
  const banner = await p.evaluate(() => /Your figures came with you/.test(document.body.innerText));
  ok('no banner interrupts the arrival', !banner);
  const fullStill = await p.evaluate(() => JSON.parse(localStorage.getItem('rp_plan_full_v28')||'null'));
  ok('the full plan it came from is untouched', fullStill && fullStill.accounts.find(a=>a.id==='pen_self').balance === 410000);

  // edit on the simple page, then cross back
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('rp_simple_v1')); s.spend = 37000; s.isa = 150000; localStorage.setItem('rp_simple_v1', JSON.stringify(s)); });
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(900);  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Open the full planner/.test(b.textContent)); x.click(); });
  await p.waitForTimeout(1200);
  const back = await p.evaluate(() => JSON.parse(localStorage.getItem('rp_plan_full_v28') || 'null'));
  ok('the simple edits crossed back into the full planner',
     back && back.spending.targetSpend === 37000 && back.accounts.find(a=>a.id==='isa_self').balance === 150000,
     back ? `spend ${back.spending.targetSpend}, isa ${back.accounts.find(a=>a.id==='isa_self').balance}` : 'nothing');

  // a blank simple page must never wipe a saved full plan
  await p.evaluate(() => { localStorage.removeItem('rp_simple_v1'); localStorage.setItem('rp_which_app', 'simple'); });
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(900);  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Open the full planner/.test(b.textContent)); x.click(); });
  await p.waitForTimeout(1000);
  const after = await p.evaluate(() => JSON.parse(localStorage.getItem('rp_plan_full_v28') || 'null'));
  ok('a blank simple page does NOT overwrite the saved full plan',
     after && after.spending.targetSpend === 37000, after ? `spend ${after.spending.targetSpend}` : 'wiped');
  await b.close();
  console.log(process.exitCode ? '\nFAILED' : '\nall ok');
})();
