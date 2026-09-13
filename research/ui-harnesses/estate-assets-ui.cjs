// What the estate is made of, and everything in it that is not a wrapper or the home.
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5189';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:68,retireAgeSelf:67,salarySelf:0,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:'',spendBands:[],drawdownStrategy:'Phased Drawdown'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:1200000,contrib:0,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:175000,contrib:0,growth:3,risk:'High Risk'},
    {id:'other_self',owner:'Myself',category:'Other Investments (e.g. GIA)',balance:400000,contrib:0,growth:'',risk:'High Risk'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'},
  inheritance:{ deathAge:71, homeValue:1400000, homeToDescendants:true,
    beneficiaries:[{id:'b1',name:'Alex',relationship:'descendant',sharePct:100,income:60000,age:36}] }
};
let fails=0; const ok=(l,c,d='')=>{console.log(`  ${c?'ok  ':'FAIL'}  ${l}${d?'   '+d:''}`); if(!c)fails++;};
const money=(s)=>Number(String(s).replace(/[^0-9.-]/g,''));
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:1600}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),plan);
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1000);
  await p.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p.waitForTimeout(900);

  // ---- the breakdown card ----
  const rows = () => p.evaluate(()=>{const t=document.querySelector('[data-estate-breakdown] table');
    return t? [...t.querySelectorAll('tbody tr')].map(r=>[...r.querySelectorAll('td')].map(d=>d.textContent.trim())) : null;});
  const r0 = await rows();
  ok('the breakdown card renders', !!r0 && r0.length>=4, r0?`${r0.length} rows`:'missing');
  if (r0) r0.forEach(r=>console.log('     '+r.join(' | ')));
  ok('it shows today alongside the projection', !!r0 && r0.some(r=>money(r[1])===1200000 && money(r[2])>1200000));
  ok('the home is held flat', !!r0 && r0.some(r=>/home/i.test(r[0]) && money(r[1])===1400000 && money(r[2])===1400000));
  // the card must agree with the by-age table above it rather than with a number typed into this test
  const headline = await p.evaluate(()=>{const t=[...document.querySelectorAll('table')].find(t=>/If you die at/.test(t.textContent));
    const r=[...t.querySelectorAll('tbody tr')].find(r=>/your estimate/.test(r.textContent));
    return Number([...r.querySelectorAll('td')][1].textContent.replace(/[^0-9]/g,''));});
  ok('the total matches the headline estate', !!r0 && money(r0[r0.length-1][2])===headline,
    `${r0?r0[r0.length-1][2]:''} against £${headline.toLocaleString()}`);
  ok('and the parts add up to it', !!r0 && Math.abs(r0.slice(0,-1).reduce((t,r)=>t+money(r[2]),0) - headline) <= 1,
    `£${r0?r0.slice(0,-1).reduce((t,r)=>t+money(r[2]),0).toLocaleString():''}`);
  ok('it says the contrib column is not the return',
    await p.evaluate(()=>/how fast your contributions rise, not the return/.test(document.body.textContent)));
  ok('and links back to Plan Inputs',
    await p.evaluate(()=>[...document.querySelectorAll('button')].some(x=>/Balances and allocations live on Plan Inputs/.test(x.textContent))));

  // a pre-2027 death has to explain the missing pension rather than just show a smaller number
  const deathAge = await p.evaluate(()=>{const l=[...document.querySelectorAll('label')].find(x=>/Expected age at death/.test(x.textContent));
    const i=l && l.parentElement.querySelector('input'); if(i){i.setAttribute('data-death-age','');return true;} return false;});
  ok('the death age can be found', deathAge);
  await p.locator('[data-death-age]').fill('68'); await p.waitForTimeout(900);
  ok('a pre-2027 death says why the pension is missing',
    await p.evaluate(()=>/pension is outside the estate at this death age/.test(document.body.textContent)));
  await p.locator('[data-death-age]').fill('71'); await p.waitForTimeout(900);

  // ---- other assets ----
  ok('assets can be added', await p.evaluate(()=>!!document.querySelector('[data-add-asset]')));
  const estateAt = () => p.evaluate(()=>{const t=document.querySelector('[data-estate-breakdown] table');
    const rs=[...t.querySelectorAll('tbody tr')]; return Number(rs[rs.length-1].querySelectorAll('td')[2].textContent.replace(/[^0-9]/g,''));});
  const before = await estateAt();
  await p.click('[data-add-asset]'); await p.waitForTimeout(500);
  const val = p.locator('label', { hasText: /^worth/ }).locator('input').last();
  await val.fill('600000'); await p.waitForTimeout(900);
  ok('a buy-to-let raises the estate by its value', (await estateAt()) - before === 600000, `${before} -> ${await estateAt()}`);
  ok('and no ownership date is asked for', await p.evaluate(()=>![...document.querySelectorAll('label')].some(l=>/owned since/.test(l.textContent))));

  // switch it to a business: the date appears and the relief lands
  const ihtNow = () => p.evaluate(()=>{const t=[...document.querySelectorAll('table')].find(t=>/If you die at/.test(t.textContent));
    const r=[...t.querySelectorAll('tbody tr')].find(r=>/your estimate/.test(r.textContent));
    return Number([...r.querySelectorAll('td')][3].textContent.replace(/[^0-9]/g,''));});
  const taxAsProperty = await ihtNow();
  await p.locator('select').filter({ hasText: /Second home/ }).selectOption('business');
  await p.waitForTimeout(900);
  ok('a business asks when it was acquired', await p.evaluate(()=>[...document.querySelectorAll('label')].some(l=>/owned since/.test(l.textContent))));
  ok('and long-held it is fully relieved', (await ihtNow()) < taxAsProperty, `£${taxAsProperty.toLocaleString()} -> £${(await ihtNow()).toLocaleString()}`);
  ok('the relief is reported', await p.evaluate(()=>/of business or agricultural relief/.test(document.body.textContent)));

  // bought recently: the two-year test bites
  await p.locator('label', { hasText: /owned since/ }).locator('input').last().fill('2028');
  await p.waitForTimeout(900);
  ok('bought inside two years of death, the relief is withdrawn', (await ihtNow()) === taxAsProperty,
    `£${(await ihtNow()).toLocaleString()} against £${taxAsProperty.toLocaleString()} untouched`);
  ok('and the tab says why', await p.evaluate(()=>/would not have been owned for 2 years/.test(document.body.textContent)));
  ok('and it still counts in the estate', (await estateAt()) - before === 600000);

  ok('the docs record what is and is not modelled',
    await p.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Documentation|Docs/i.test(b.textContent)); if(x)x.click(); return true;}));
  await p.waitForTimeout(800);
  ok('including that buying in is still never suggested',
    await p.evaluate(()=>/deliberately absent from the optimiser/.test(document.getElementById('doc-inheritance')?.textContent||'')));
  ok('no page errors', errs.length===0, errs.slice(0,2).join(' | '));
  await b.close();
  console.log(fails? `\n${fails} FAILED` : '\nall checks passed');
  process.exit(fails?1:0);
})();
