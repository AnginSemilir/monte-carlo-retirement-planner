// The tournament's final scoring now runs as one batch across the worker pool: does it still finish, rank, and time reasonably?
const { chromium } = require('/tmp/node_modules/playwright');
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:45,retireAgeSelf:60,salarySelf:70000,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:40000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:250000,contrib:1000,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:80000,contrib:500,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:20000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:30000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1300 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('https://cdn.tailwindcss.com/**', r => r.fulfill({ status:200, contentType:'application/javascript', body:'window.tailwind={config:{}};' }));
  await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, plan);
  await p.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/^Strategy|Strategy$/.test(b.textContent.trim())||/Strategy/.test(b.textContent)); if(x) x.click(); });
  await p.waitForTimeout(600);
  const btn = await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Compare strategies now/.test(b.textContent)); return x ? x.textContent.trim() : null; });
  console.log('run button:', btn);
  if (!btn) { console.log('buttons:', await p.evaluate(() => [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,60).join(' | '))); await b.close(); return; }
  const t0 = Date.now();
  await p.evaluate((label) => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label); x.click(); }, btn);
  // done when the progress labels are gone and the search summary has rendered
  await p.waitForFunction(() => { const t = document.body.innerText; return /best survival at/.test(t) && !/Player \d+\/\d+|Scoring \d+ players|Scored \d+ of \d+ players/.test(t); }, null, { timeout: 300000 });
  await p.waitForTimeout(500);
  const t = await p.evaluate(() => document.body.innerText);
  const pct = t.match(/\d+\.\d%/g) || [];
  console.log(`tournament wall clock: ${((Date.now()-t0)/1000).toFixed(1)}s; survival figures on page: ${pct.length}; errors: ${errs.length} ${errs.join(' | ')}`);
  console.log('snippet:', (t.match(/[^\n]*(won|winner|Winner|best)[^\n]*/) || [''])[0].slice(0, 200));
  await b.close();
})();
