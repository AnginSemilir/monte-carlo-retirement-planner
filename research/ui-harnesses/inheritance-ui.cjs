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
  ok('simplifications are disclosed', await p.evaluate(()=>/the pension column is your nomination form/.test(document.body.textContent)));

  // a share that does not total 100 must warn rather than silently rescale
  // fill() drives React's onChange properly; a raw dispatched event does not update controlled state
  const shareBox = p.locator('input[type=number]').filter({ hasNot: p.locator('[disabled]') }).first();
  await shareBox.fill('60');
  await p.waitForTimeout(500);
  ok('a share that is not 100% warns', await p.evaluate(()=>/not 100%/.test(document.body.textContent)));
  // the special-circumstances inputs
  await p.evaluate(()=>{const d=[...document.querySelectorAll('summary')].find(x=>/Special circumstances/i.test(x.textContent)); if(d)d.click();});
  await p.waitForTimeout(300);
  ok('quick succession relief inputs exist', await p.evaluate(()=>/quick succession relief/i.test(document.body.textContent)));
  ok('it says the relief must be claimed', await p.evaluate(()=>/not given automatically/i.test(document.body.textContent)));
  ok('active service exemption offered', await p.evaluate(()=>/Death on active service/.test(document.body.textContent)));
  // compensation that is disregarded for inheritance tax, and what it is worth
  ok('exempt compensation can be entered', await p.evaluate(()=>!!document.querySelector('[data-exempt-compensation]')));
  await p.locator('[data-exempt-compensation]').fill('300000');
  await p.waitForTimeout(600);
  ok('and the tab prices it', await p.evaluate(()=>/Off the bill/.test(document.body.textContent)));
  // the panel's next line opens with "40% of the whole", so the amount has to be matched by shape
  const saved = await p.evaluate(()=>{const m=document.body.textContent.match(/Off the bill \u2014 £(\d{1,3}(?:,\d{3})*)/); return m?m[1]:null;});
  ok('at the death rate applied to the payment', saved==='120,000', `£${saved} on £300,000`);
  ok('and says the two reliefs do not compete', await p.evaluate(()=>/does two separate jobs, and using one does not spend the other/.test(document.body.textContent)));
  await p.locator('[data-exempt-compensation]').fill('');
  await p.waitForTimeout(400);
  ok('and the war pension distinction is recorded', await p.evaluate(()=>/tax-free income, with no bearing on inheritance tax/.test(document.body.textContent)));

  /*
   * The suggested gift. A second load with an estate well over the £2m line, because the point of the
   * suggestion is a band being withdrawn - a household under the threshold must never see it.
   */
  const rich = JSON.parse(JSON.stringify(plan));
  const p2 = await b.newPage({viewport:{width:1500,height:1600}});
  const errs2=[]; p2.on('pageerror',e=>errs2.push(e.message));
  await p2.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p2.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),rich);
  await p2.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p2.waitForTimeout(900);
  await p2.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p2.waitForTimeout(800);
  ok('an estate over £2m is offered a gift', await p2.evaluate(()=>!!document.querySelector('[data-gift-suggestion]')));
  const sug = await p2.evaluate(()=>document.querySelector('[data-gift-suggestion]')?.textContent||'');
  console.log('     '+sug.replace(/\s+/g,' ').slice(0,260));
  ok('it quotes a gift and a saving', /Giving away £[\d,]+/.test(sug) && /a saving of £[\d,]+/.test(sug));
  ok('it explains why this gift does not need seven years', /owned at death/.test(sug));

  /*
   * The claim the card makes has to survive being taken up: accept the gift and the estate at the chosen
   * age must actually land on the £2m line. Sizing it as the raw excess - the obvious wrong answer -
   * overshoots by about half, so the amount must also be well below that excess.
   */
  const estateAt = (pg,age) => pg.evaluate((a)=>{
    const t=[...document.querySelectorAll('table')].find(t=>/If you die at/.test(t.textContent));
    const r=[...t.querySelectorAll('tbody tr')].find(r=>new RegExp('^'+a).test(r.querySelector('td').textContent.trim()));
    return r ? Number(r.querySelectorAll('td')[1].textContent.replace(/[^0-9.]/g,'')) : null;
  }, String(age));
  const estBefore = await estateAt(p2,80);
  const amount = Number((sug.match(/Giving away £([\d,]+)/)||[])[1].replace(/,/g,''));
  ok('the gift is smaller than the excess it removes', amount > 0 && amount < (estBefore-2000000)*0.9,
    `£${amount.toLocaleString()} against £${Math.round(estBefore-2000000).toLocaleString()} over`);

  await p2.click('[data-add-suggested-gift]');
  await p2.waitForTimeout(700);
  const estAfter = await estateAt(p2,80);
  ok('accepting it lands the estate on the £2m line', Math.abs(estAfter-2000000) < 5000,
    `£${estBefore.toLocaleString()} -> £${estAfter.toLocaleString()}`);
  ok('accepting it writes a gift row', await p2.evaluate(()=>/Gift to restore the residence allowance/.test(document.body.textContent)));
  ok('and the row is marked planned, not already given', await p2.evaluate(()=>{
    const r=[...document.querySelectorAll('input')].find(i=>i.value==='Gift to restore the residence allowance');
    return !!r && /planned/.test(r.closest('div').textContent);
  }));
  ok('taking the advice removes the advice', await p2.evaluate(()=>!document.querySelector('[data-gift-suggestion]')));
  ok('no page errors on the gift flow', errs2.length===0, errs2.slice(0,2).join(' | '));

  // and the negative: a household that never reaches the threshold must not be advised to give money away
  const modest = JSON.parse(JSON.stringify(plan));
  modest.inheritance.homeValue = 200000;
  modest.accounts.find(a=>a.id==='pen_self').balance = 250000;
  modest.accounts.find(a=>a.id==='isa_self').balance = 80000;
  modest.accounts.find(a=>a.id==='other_self').balance = 40000;
  modest.accounts.find(a=>a.id==='cash_self').balance = 20000;
  const p3 = await b.newPage({viewport:{width:1500,height:1600}});
  await p3.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p3.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),modest);
  await p3.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p3.waitForTimeout(900);
  await p3.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p3.waitForTimeout(800);
  ok('an estate under £2m is offered nothing', await p3.evaluate(()=>!document.querySelector('[data-gift-suggestion]')));

  /*
   * The will and the nomination as two columns, and the draw-down period per person. Two beneficiaries
   * on very different incomes, because with one person every split normalises to 100% and nothing can
   * move: the whole point is who gets the pension rather than how much of it there is.
   */
  const two = JSON.parse(JSON.stringify(plan));
  two.inheritance.beneficiaries = [
    { id: 'b1', name: 'Alex', relationship: 'descendant', sharePct: 50, income: 70000 },
    { id: 'b2', name: 'Sam', relationship: 'descendant', sharePct: 50, income: 0, age: 19 }
  ];
  const p4 = await b.newPage({viewport:{width:1500,height:1600}});
  const errs4=[]; p4.on('pageerror',e=>errs4.push(e.message));
  await p4.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p4.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),two);
  await p4.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p4.waitForTimeout(900);
  await p4.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p4.waitForTimeout(800);
  const keeps = (name) => p4.evaluate((n)=>{
    const r=[...document.querySelector('[data-person-table]').querySelectorAll('tbody tr')].find(r=>r.textContent.includes(n));
    return Number([...r.querySelectorAll("td")][6].textContent.replace(/[^0-9.]/g,''));
  }, name);
  const total = () => p4.evaluate(()=>[...document.querySelector('[data-person-table]').querySelectorAll('tbody tr')]
    .reduce((t,r)=>t+Number([...r.querySelectorAll("td")][6].textContent.replace(/[^0-9.]/g,'')),0));
  /*
   * The pension column is opt-in. Two percentage boxes on every row read as one field asked for twice -
   * reported from a phone - so the row carries one box until the household says the two documents differ.
   */
  ok('one share box per person before the split is asked for',
    await p4.evaluate(()=>![...document.querySelectorAll('label')].some(l=>/of the pension/.test(l.textContent))));
  await p4.locator('label', { hasText: /Split the pension differently/ }).locator('input').check();
  await p4.waitForTimeout(500);
  ok('the beneficiary table asks for a pension share separately', await p4.evaluate(()=>[...document.querySelectorAll('label')].some(l=>/of the pension/.test(l.textContent))));
  /*
   * Nor may the two read as one field entered twice once both are shown: the pension box used to carry
   * the will share as its placeholder, so both said the same number under near-identical labels.
   */
  ok('the two share boxes are not mistakable for each other', await p4.evaluate(()=>{
    const pen=[...document.querySelectorAll('label')].find(l=>/of the pension/.test(l.textContent));
    const will=[...document.querySelectorAll('label')].find(l=>/under your will/.test(l.textContent));
    if(!pen||!will) return false;
    const pi=pen.querySelector('input'), wi=will.querySelector('input');
    return pi.placeholder !== String(wi.value) && /same/i.test(pi.placeholder);
  }));
  const before = await total();
  // nominate the whole pension to the one with no income, leaving the will alone
  const penInputs = p4.locator('label', { hasText: /of the pension/ }).locator('input');
  await penInputs.nth(0).fill('0');
  await penInputs.nth(1).fill('100');
  await p4.waitForTimeout(600);
  const after = await total();
  const samBefore = await keeps('Sam'), alexBefore = await keeps('Alex');
  ok('the nomination moves the pension without moving the house', samBefore > alexBefore,
    `Sam £${samBefore.toLocaleString()} vs Alex £${alexBefore.toLocaleString()}`);
  /*
   * Concentrating a large pension on one person is NOT automatically better - each heir has their own
   * allowances, so £900k on one 19-year-old over five years reaches the additional rate that splitting it
   * would have avoided. On this plan it costs a little. It is the nomination TOGETHER with the longer
   * draw-down that wins, and that is the pair the tab has to be able to express.
   */
  ok('concentrating it alone is roughly neutral here', Math.abs(after - before) < before * 0.01,
    `£${before.toLocaleString()} -> £${after.toLocaleString()}`);
  await p4.locator('label', { hasText: /draws over/ }).locator('input').nth(1).fill('20');
  await p4.waitForTimeout(600);
  const withSpread = await total();
  ok('nomination plus a twenty-year draw-down is what wins', withSpread > before,
    `£${before.toLocaleString()} -> £${withSpread.toLocaleString()} (+£${(withSpread-before).toLocaleString()})`);
  ok('no page errors on the nomination flow', errs4.length===0, errs4.slice(0,2).join(' | '));

  // gifts out of income
  /*
   * Which gifts came from a compensation award is derived, not ticked: the box only appears where it
   * could apply, and it is an override rather than a requirement.
   */
  await p4.evaluate(()=>{const d=[...document.querySelectorAll('summary')].find(x=>/Special circumstances/i.test(x.textContent)); if(d)d.click();});
  await p4.waitForTimeout(300);
  await p4.locator('[data-exempt-compensation]').fill('300000');
  await p4.locator('[data-exempt-compensation-date]').fill('2026-02-01');
  await p4.waitForTimeout(500);
  const addGift = await p4.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Add gift/.test(x.textContent)); if(b){b.click();return true;} return false;});
  ok('a gift can be added', addGift);
  await p4.waitForTimeout(400);
  const giftYear = p4.locator('label', { hasText: /^year/ }).locator('input').last();
  await giftYear.fill('2027');
  const giftAmt = p4.locator('label', { hasText: /^amount/ }).locator('input').last();
  await giftAmt.fill('100000');
  await p4.waitForTimeout(700);
  ok('there is nothing to tick: the match is derived, with no way to opt out',
    await p4.evaluate(()=>![...document.querySelectorAll('label')].some(x=>/from the compensation/.test(x.textContent))));
  /*
   * At a death age far enough out, the 2027 gift has survived seven years on its own and the award is
   * deliberately NOT spent on it - so the badge only appears once the death age brings it inside.
   */
  ok('an old gift does not consume the award', await p4.evaluate(()=>!/already drawn from the award/.test(document.body.textContent)));
  ok('so the whole award still shows as free to give', await p4.evaluate(()=>/£300,000 of £300,000 left/.test(document.body.textContent)));
  const deathAge = await p4.evaluate(()=>{
    const l=[...document.querySelectorAll('label')].find(x=>/Expected age at death/.test(x.textContent));
    const i=l && l.parentElement.querySelector('input'); if(i){i.setAttribute('data-death-age','');return true;} return false;});
  ok('the death age can be found', deathAge);
  await p4.locator('[data-death-age]').fill('66');
  await p4.waitForTimeout(800);
  ok('bringing death inside seven years spends the award on the gift',
    await p4.evaluate(()=>/of your gifts is already drawn from the award/.test(document.body.textContent)));
  ok('and the headroom falls by the gift', await p4.evaluate(()=>/£200,000 of £300,000 left/.test(document.body.textContent)));
  /*
   * An old saved plan carrying the removed override must not be honoured. On its own page, because a
   * reload here would re-seed localStorage from addInitScript and drop the tab back to the default one.
   */
  const legacy = JSON.parse(JSON.stringify(two));
  legacy.inheritance = { ...legacy.inheritance, compensationPayment: 300000, compensationDate: '2026-02-01',
    deathAge: 66, gifts: [{ id: 'g', amount: 100000, year: 2027, fromCompensation: 'no' }] };
  const p5 = await b.newPage({viewport:{width:1500,height:1500}});
  p5.on('pageerror',e=>errs4.push(e.message));
  await p5.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p5.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),legacy);
  await p5.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p5.waitForTimeout(1000);
  await p5.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p5.waitForTimeout(900);
  ok('a legacy "not from the award" flag is dropped on load, not honoured',
    await p5.evaluate(()=>!JSON.parse(localStorage.getItem('rp_plan_full_v28')).inheritance.gifts.some(g=>g.fromCompensation==='no')));
  ok('so the gift is covered by the award after all',
    await p5.evaluate(()=>/of your gifts is already drawn from the award/.test(document.body.textContent)));

  ok('the s.21 exemption is offered', await p4.evaluate(()=>/Regular gifts out of income/.test(document.body.textContent)));
  ok('and it says what makes it exempt', await p4.evaluate(()=>/habitual/.test(document.body.textContent)));
  ok('the surplus is quoted from the plan', await p4.evaluate(()=>/income after living costs is/.test(document.body.textContent)));

  // the docs section, which only renders on its own tab
  await p.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Documentation|Docs/i.test(b.textContent)); if(x)x.click();});
  await p.waitForTimeout(700);
  ok('documentation section exists', await p.evaluate(()=>!!document.getElementById('doc-inheritance')));
  ok('it records that draining the pension early does NOT follow', await p.evaluate(()=>/It does not/.test(document.getElementById('doc-inheritance')?.textContent||'')));
  ok('it names the reservation-of-benefit trap', await p.evaluate(()=>/reservation of benefit/.test(document.getElementById('doc-inheritance')?.textContent||'')));
  ok('and states what is not modelled', await p.evaluate(()=>/deliberately absent from the optimiser/.test(document.getElementById('doc-inheritance')?.textContent||'')));
  ok('and why only one gift is ever suggested', await p.evaluate(()=>/owned at death/.test(document.getElementById('doc-inheritance')?.textContent||'')));

  ok('no page errors', errs.length===0, errs.slice(0,2).join(' | '));
  await b.close();
  console.log(fails?`\n${fails} FAILED`:'\nall checks passed');
  process.exit(fails?1:0);
})();
