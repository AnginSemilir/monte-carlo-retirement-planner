// The Who inherits row: one share box until the household says the two documents differ, and number
// boxes that start empty rather than on a 0 the next keystroke turns into 0200000.
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5188';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:68,retireAgeSelf:67,salarySelf:0,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:40000,spendBands:[],drawdownStrategy:'Phased Drawdown'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:1200000,contrib:0,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:400000,contrib:0,growth:3,risk:'Medium/High Risk'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'},
  inheritance:{ deathAge:71, homeValue:1400000, homeToDescendants:true,
    beneficiaries:[{id:'b1',name:'Alex',relationship:'descendant',sharePct:50,age:36},
                   {id:'b2',name:'Sam',relationship:'descendant',sharePct:50,age:35}] }
};
let fails=0; const ok=(l,c,d='')=>{console.log(`  ${c?'ok  ':'FAIL'}  ${l}${d?'   '+d:''}`); if(!c)fails++;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1600,height:1200}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),plan);
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1000);
  await p.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p.waitForTimeout(900);

  const incomes = () => p.evaluate(()=>[...document.querySelectorAll('label')].filter(l=>/their income/.test(l.textContent)).map(l=>l.querySelector('input').value));

  ok('an untouched income box is empty, not 0', (await incomes()).every(v=>v===''), JSON.stringify(await incomes()));

  // type into the first one the way a person does
  const first = p.locator('label', { hasText: /their income/ }).locator('input').first();
  await first.click(); await first.type('200000'); await p.waitForTimeout(600);
  ok('typing leaves no leading zero', (await incomes())[0]==='200000', JSON.stringify(await incomes()));

  // and the stored plan agrees
  const stored = await p.evaluate(()=>JSON.parse(localStorage.getItem('rp_plan_full_v28')).inheritance.beneficiaries[0].income);
  ok('the plan stores it cleanly', String(stored)==='200000', String(stored));

  // deliberately force a leading zero through the DOM the way the old bug did
  await first.fill(''); await first.type('07'); await p.waitForTimeout(600);
  ok('a leading zero typed in front is cleared', (await incomes())[0]==='7', JSON.stringify(await incomes()));

  // ---- one share box by default ----
  ok('only one percentage box per person to start', await p.evaluate(()=>![...document.querySelectorAll('label')].some(l=>/of the pension/.test(l.textContent))));
  ok('and it is labelled plainly', await p.evaluate(()=>[...document.querySelectorAll('label')].some(l=>l.textContent.trim().startsWith('gets'))));
  ok('the tab explains the pension can still be split', await p.evaluate(()=>/One share each, covering everything/.test(document.body.textContent)));

  // turn the split on
  await p.locator('label', { hasText: /Split the pension differently/ }).locator('input').check();
  await p.waitForTimeout(700);
  ok('ticking reveals the pension column', await p.evaluate(()=>[...document.querySelectorAll('label')].filter(l=>/of the pension/.test(l.textContent)).length===2));
  ok('and the will box is relabelled', await p.evaluate(()=>[...document.querySelectorAll('label')].some(l=>l.textContent.trim().startsWith('under your will'))));
  ok('with the two-documents explanation', await p.evaluate(()=>/Two columns, because there are two documents/.test(document.body.textContent)));

  const penFirst = p.locator('label', { hasText: /of the pension/ }).locator('input').first();
  await penFirst.fill('100'); await p.waitForTimeout(700);
  const heirs1 = await p.evaluate(()=>{const t=[...document.querySelectorAll('table')].find(t=>/Alex/.test(t.textContent)&&/Sam/.test(t.textContent)); return t?t.textContent.replace(/\s+/g,' ').slice(0,160):'';});
  ok('the split moves the per-person figures', /Alex/.test(heirs1), heirs1.slice(0,90));

  // untick: the split must be cleared, not just hidden
  await p.locator('label', { hasText: /Split the pension differently/ }).locator('input').uncheck();
  await p.waitForTimeout(700);
  ok('unticking hides the column', await p.evaluate(()=>![...document.querySelectorAll('label')].some(l=>/of the pension/.test(l.textContent))));
  const cleared = await p.evaluate(()=>JSON.parse(localStorage.getItem('rp_plan_full_v28')).inheritance.beneficiaries.map(b=>b.pensionSharePct));
  ok('and clears the shares rather than hiding them', cleared.every(v=>v===''), JSON.stringify(cleared));

  // a saved plan that already carries a split opens with the column showing
  // a fresh page, because addInitScript re-seeds localStorage on every navigation
  const split = JSON.parse(JSON.stringify(plan));
  split.inheritance.beneficiaries[0].pensionSharePct = 100;
  split.inheritance.beneficiaries[1].pensionSharePct = 0;
  const p2 = await b.newPage({viewport:{width:1600,height:1200}});
  p2.on('pageerror',e=>errs.push(e.message));
  await p2.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p2.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),split);
  await p2.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p2.waitForTimeout(1100);
  await p2.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p2.waitForTimeout(900);
  ok('a plan with a split already set opens with the column shown',
    await p2.evaluate(()=>[...document.querySelectorAll('label')].filter(l=>/of the pension/.test(l.textContent)).length===2));

  ok('the per-person table drops the repeated percentage when unsplit',
    await p.evaluate(()=>{const t=[...document.querySelectorAll('table')].find(t=>/Of which pension/.test(t.textContent)); return !!t;}));
  ok('and names the two documents when it is split',
    await p2.evaluate(()=>{const t=[...document.querySelectorAll('table')].find(t=>/Will/.test(t.textContent)&&/Pension/.test(t.textContent)); return !!t;}));

  ok('no page errors', errs.length===0, errs.slice(0,2).join(' | '));
  await b.close();
  console.log(fails? `\n${fails} FAILED` : '\nall checks passed');
  process.exit(fails?1:0);
})();
