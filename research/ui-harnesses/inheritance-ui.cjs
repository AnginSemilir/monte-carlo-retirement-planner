// The Inheritance tab: does it compute what the engine says, and does the 75 cliff actually show?
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5187';
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:62,retireAgeSelf:61,salarySelf:0,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:38000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:900000,contrib:0,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:300000,contrib:0,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:200000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:80000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'},
  inheritance:{ deathAge:80, homeValue:400000, homeToDescendants:true,
    beneficiaries:[{id:'b1',name:'Alex',relationship:'descendant',sharePct:100,income:70000}] }
};
let fails=0; const ok=(l,c,d='')=>{console.log(`  ${c?'ok  ':'FAIL'}  ${l}${d?'   '+d:''}`); if(!c)fails++;};
const money=(s)=>Number(String(s).replace(/[^0-9.-]/g,''));

(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:1500}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),plan);
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(900);
  await p.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p.waitForTimeout(800);

  ok('tab renders', await p.evaluate(()=>/What your heirs actually receive/.test(document.body.textContent)));
  ok('beneficiary row is shown', await p.evaluate(()=>!!document.querySelector('input[value="Alex"]')));

  // the by-age table must price several ages, with the chosen one marked
  const rows = await p.evaluate(()=>{
    const t=[...document.querySelectorAll('table')].find(t=>/If you die at/.test(t.textContent));
    return t? [...t.querySelectorAll('tbody tr')].map(r=>[...r.querySelectorAll('td')].map(d=>d.textContent.trim())) : null;
  });
  ok('by-age table exists', !!rows && rows.length>=4, rows?`${rows.length} ages`:'missing');
  if (rows) {
    rows.forEach(r=>console.log('     '+r.join(' | ')));
    ok('the chosen age is marked', rows.some(r=>/your estimate/.test(r[0])));
    const a74=rows.find(r=>/^74/.test(r[0])), a80=rows.find(r=>/^80/.test(r[0]));
    ok('death before 75 shows no beneficiary income tax', a74 && a74[4]==='—', a74?a74[4]:'no row');
    ok('death at 80 does show it', a80 && money(a80[4])>0, a80?a80[4]:'no row');
    ok('heirs receive less at 80 than at 74', a74&&a80&&money(a80[5])<money(a74[5]), a74&&a80?`${a74[5]} -> ${a80[5]}`:'');
  }
  ok('the 75 cliff is called out in pounds', await p.evaluate(()=>/costs your heirs/.test(document.body.textContent)));
  ok('per-person table present', await p.evaluate(()=>/Person by person/.test(document.body.textContent)));
  ok('simplifications are disclosed', await p.evaluate(()=>/single tax year/.test(document.body.textContent)));

  // a share that does not total 100 must warn rather than silently rescale
  // fill() drives React's onChange properly; a raw dispatched event does not update controlled state
  const shareBox = p.locator('input[type=number]').filter({ hasNot: p.locator('[disabled]') }).first();
  await shareBox.fill('60');
  await p.waitForTimeout(500);
  ok('a share that is not 100% warns', await p.evaluate(()=>/not 100%/.test(document.body.textContent)));
  ok('no page errors', errs.length===0, errs.slice(0,2).join(' | '));
  await b.close();
  console.log(fails?`\n${fails} FAILED`:'\nall checks passed');
  process.exit(fails?1:0);
})();
