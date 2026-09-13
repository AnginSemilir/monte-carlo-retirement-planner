// The Inheritance tab as a deck: three steps that ask, one that answers, and "See all" to undo it.
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5195';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:68,retireAgeSelf:67,salarySelf:0,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:'',spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:1200000,contrib:0,growth:'',risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:175000,contrib:0,growth:'',risk:'High Risk'},
    {id:'other_self',owner:'Myself',category:'Other Investments (e.g. GIA)',balance:400000,contrib:0,growth:'',risk:'High Risk'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'},
  inheritance:{ deathAge:71, homeValue:1400000, homeToDescendants:true,
    compensationPayment:900000, compensationDate:'2025-06-01', transferredNrbPct:100, transferredRnrbPct:100,
    gifts:[{id:'g1',amount:308000,year:2026}],
    beneficiaries:[{id:'b1',name:'Alex',relationship:'descendant',sharePct:50,income:200000,age:36},
                   {id:'b2',name:'Sam',relationship:'descendant',sharePct:50,income:93000,age:35}] }
};
let fails=0; const ok=(l,c,d='')=>{console.log(`  ${c?'ok  ':'FAIL'}  ${l}${d?'   '+d:''}`); if(!c)fails++;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1400,height:1200}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),plan);
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1200);
  await p.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p.waitForTimeout(1200);
  const seen = () => p.evaluate(()=>({
    heirs: !!document.body.textContent.match(/Who inherits/) && !!document.querySelector('input[value="Alex"]'),
    estate: /What the estate is made of/.test(document.body.textContent),
    gifts: /Gifts you have already made/.test(document.body.textContent),
    route: !!document.querySelector('[data-estate-optimiser]'),
    results: /What they receive, by when you die/.test(document.body.textContent)
  }));
  for (const step of [1,2,3,4]) {
    await p.evaluate((n)=>{const b=document.querySelectorAll('button[title]')[0] && [...document.querySelectorAll('button[title]')].filter(x=>/^(Who inherits|What you own|What you have given|The best route)$/.test(x.title))[n-1]; if(b)b.click();}, step);
    await p.waitForTimeout(500);
    const v = await seen();
    const want = { 1:'heirs', 2:'estate', 3:'gifts', 4:'route' }[step];
    ok(`step ${step} shows ${want}`, v[want], JSON.stringify(v));
    ok(`and only that`, Object.entries(v).filter(([k,on])=>on && k!==want && !(step===4&&k==='results')).length===0, JSON.stringify(v));
  }
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/See all/.test(x.textContent)); if(b)b.click();});
  await p.waitForTimeout(500);
  const all = await seen();
  ok('"See all" puts the whole tab back', Object.values(all).every(Boolean), JSON.stringify(all));
  ok('the answer step carries the optimiser and the figures', all.route && all.results);
  ok('no page errors', errs.length===0, errs.slice(0,2).join(' | '));
  await b.close();
  console.log(fails? `\n${fails} FAILED` : '\nall checks passed');
  process.exit(fails?1:0);
})();
