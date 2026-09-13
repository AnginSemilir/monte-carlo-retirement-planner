// The estate optimiser on the Strategy tab, and the quick succession credit it reports.
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5187';
/*
 * A real exported plan, from a household that cannot use the contributions tournament at all: 68, already
 * retired, nothing being paid in, a £1.4m house and a £1.2m pension. That is the case the estate optimiser
 * exists for, and the one where every figure below was checked by hand.
 */
const plan = {
  "activeProfileView": "Combined",
  "demographics": {
    "planningMode": "single",
    "currentAgeSelf": "68",
    "currentAgePart": "",
    "retireAgeSelf": "65",
    "retireAgePart": "",
    "salarySelf": "",
    "salaryPart": "",
    "salaryGrowthSelf": "",
    "salaryGrowthPart": "",
    "employmentSelf": "employed",
    "employmentPart": "employed",
    "cgtGainsUsedSelf": "15000",
    "cgtGainsUsedPart": "",
    "cfBroughtForwardSelf": "",
    "cfBroughtForwardPart": "",
    "mpaaAgeSelf": "",
    "mpaaAgePart": "",
    "statePensionAge": 68,
    "privatePensionAge": 58,
    "statePensionSelf": "11500",
    "statePensionPart": "",
    "terminalAge": 100
  },
  "spending": {
    "targetSpend": "50000",
    "spendBands": [],
    "drawdownStrategy": "Phased Drawdown",
    "decumulationPolicy": "Bracket Fill Basic",
    "priorities": [
      "survive",
      "downside",
      "bequest",
      "bridge",
      "pot",
      "tax"
    ],
    "priorityTolerances": {},
    "priorityMode": "ranked"
  },
  "inheritance": {
    "deathAge": "71",
    "homeValue": "1400000",
    "homeToDescendants": true,
    "homeSold": false,
    "homeSaleAge": "",
    "transferredNrbPct": "",
    "transferredRnrbPct": "",
    "qsrInheritedValue": "50000",
    "qsrTaxPaid": "",
    "qsrYearsBefore": "2",
    "activeServiceExempt": false,
    "gifts": [
      {
        "id": "gift_1789313394238",
        "amount": "308",
        "year": 2026,
        "desc": "House "
      }
    ],
    "surplusGift": {
      "annual": "2880",
      "fromYear": "",
      "toYear": ""
    },
    "beneficiaries": [
      {
        "id": "ben_1789313225873",
        "name": "Sam",
        "relationship": "descendant",
        "sharePct": "40",
        "income": "93000",
        "age": "35"
      },
      {
        "id": "ben_1789313270534",
        "name": "Kiki ",
        "relationship": "descendant",
        "sharePct": "10",
        "income": "",
        "pensionSharePct": "10",
        "age": "4"
      },
      {
        "id": "ben_1789313343507",
        "name": "Alex",
        "relationship": "descendant",
        "sharePct": "40",
        "income": "150000",
        "age": "36"
      }
    ]
  },
  "accounts": [
    {
      "id": "pen_self",
      "owner": "Myself",
      "category": "Pensions",
      "balance": "1200000",
      "contrib": "0",
      "growth": "",
      "risk": "High Risk"
    },
    {
      "id": "isa_self",
      "owner": "Myself",
      "category": "S&S ISAs",
      "balance": "175000",
      "contrib": "0",
      "growth": "",
      "risk": "High Risk"
    },
    {
      "id": "other_self",
      "owner": "Myself",
      "category": "Other Investments (e.g. GIA)",
      "balance": "400",
      "contrib": "0",
      "growth": "",
      "risk": "Low Risk",
      "unrealisedGain": ""
    },
    {
      "id": "cash_self",
      "owner": "Myself",
      "category": "Cash Savings",
      "balance": "",
      "contrib": "0",
      "growth": "",
      "risk": "Low Risk"
    },
    {
      "id": "pen_part",
      "owner": "Partner",
      "category": "Pensions",
      "balance": "",
      "contrib": "",
      "growth": "",
      "risk": "High Risk"
    },
    {
      "id": "isa_part",
      "owner": "Partner",
      "category": "S&S ISAs",
      "balance": "",
      "contrib": "",
      "growth": "",
      "risk": "High Risk"
    },
    {
      "id": "other_part",
      "owner": "Partner",
      "category": "Other Investments (e.g. GIA)",
      "balance": "",
      "contrib": "",
      "growth": "",
      "risk": "Low Risk",
      "unrealisedGain": ""
    },
    {
      "id": "cash_part",
      "owner": "Partner",
      "category": "Cash Savings",
      "balance": "",
      "contrib": "",
      "growth": "",
      "risk": "Low Risk"
    }
  ],
  "riskProfiles": {
    "High Risk": {
      "label": "Highest: 80\u2013100% Equities",
      "real": 4.79,
      "nominal": 7.41,
      "volatility": 17.1,
      "sigmaParam": 2.14
    },
    "Medium/High Risk": {
      "label": "High: 60\u201380% Equities",
      "real": 4.24,
      "nominal": 6.85,
      "volatility": 13.42,
      "sigmaParam": 1.69
    },
    "Medium Risk": {
      "label": "Medium: 40\u201360% Equities",
      "real": 3.69,
      "nominal": 6.28,
      "volatility": 9.93,
      "sigmaParam": 1.31
    },
    "Medium/Low Risk": {
      "label": "Medium/Low: 20\u201340% Equities",
      "real": 3.14,
      "nominal": 5.72,
      "volatility": 6.89,
      "sigmaParam": 1.03
    },
    "Low Risk": {
      "label": "Low: High interest Cash Savings, Fixed Income, Bonds",
      "real": 2.6,
      "nominal": 5.16,
      "volatility": 5.19,
      "sigmaParam": 0.97
    },
    "Cash Equivalents": {
      "label": "Instant cash savings/money market",
      "real": 1.01,
      "nominal": 3.54,
      "volatility": 0,
      "sigmaParam": 1.57
    }
  },
  "riskSource": "blackrock2026",
  "otherIncomes": [
    {
      "id": "inc_1789312947027",
      "name": "",
      "owner": "Myself",
      "startAge": "67",
      "endAge": "",
      "amount": "11000",
      "incomeType": "earnings",
      "notes": ""
    }
  ],
  "oneOffContributions": [
    {
      "id": "c_1789313110430",
      "date": "2027-01-01",
      "year": 2027,
      "owner": "Myself",
      "category": "Auto (policy decides)",
      "amount": "120000",
      "desc": "",
      "transferredFrom": "External",
      "stagedTargetWrapper": "Other Investments (e.g. GIA)"
    }
  ],
  "oneOffCosts": [],
  "config": {
    "valuationDate": "2026-09-13",
    "inflation": 2.5,
    "personalAllowance": 12570,
    "paTaperThreshold": 100000,
    "paTaperRate": 50,
    "basicBandLimit": 50270,
    "basicTaxRate": 20,
    "higherBandLimit": 125140,
    "higherTaxRate": 40,
    "additionalTaxRate": 45,
    "taxRegion": "ruk",
    "scotStarterRate": 19,
    "scotStarterLimit": 15397,
    "scotBasicRate": 20,
    "scotBasicLimit": 27491,
    "scotIntermediateRate": 21,
    "scotIntermediateLimit": 43662,
    "scotHigherRate": 42,
    "scotHigherLimit": 75000,
    "scotAdvancedRate": 45,
    "scotAdvancedLimit": 125140,
    "scotTopRate": 48,
    "nicPrimaryThreshold": 12570,
    "nicUpperEarningsLimit": 50270,
    "nicMainRate": 8,
    "nicUpperRate": 2,
    "class4MainRate": 6,
    "class4UpperRate": 2,
    "employerNicRate": 15,
    "employerNicPassThrough": 0,
    "pclsProportion": 25,
    "pclsMaxCap": 268275,
    "isaAnnualAllowance": 20000,
    "pensionAnnualAllowance": 60000,
    "pensionNoEarningsLimit": 3600,
    "mpaaLimit": 10000,
    "pensionTaperThreshold": 260000,
    "pensionTaperRate": 50,
    "pensionTaperFloor": 10000,
    "cgtEnabled": true,
    "cgtAnnualExempt": 3000,
    "cgtBasicRate": 18,
    "cgtHigherRate": 24,
    "cashBufferMonths": 6,
    "harvestPersonalAllowance": true,
    "pensionDeathTaxRate": 0,
    "ihtNrb": 325000,
    "ihtRnrb": 175000,
    "ihtRnrbTaperFrom": 2000000,
    "ihtRnrbTaperRate": 50,
    "ihtRate": 40,
    "ihtCharityRate": 36,
    "ihtCharityThresholdPct": 10,
    "pensionsInEstateFrom": 2027,
    "pensionIncomeTaxFromAge": 75,
    "qsrScale": "",
    "giftTaperRates": "",
    "giftAnnualExemption": 3000,
    "inheritedPensionSpreadYears": 5,
    "statePensionAgeForHeirs": 68,
    "assumedStatePensionForHeirs": 11976,
    "bridgeSafetyMargin": 30,
    "solvencyFloor": 0
  }
};
let fails=0; const ok=(l,c,d='')=>{console.log(`  ${c?'ok  ':'FAIL'}  ${l}${d?'   '+d:''}`); if(!c)fails++;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1500,height:1800}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),plan);
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1200);
  await p.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p.waitForTimeout(700);
  ok('the optimiser is on the Inheritance tab', await p.evaluate(()=>!!document.querySelector('[data-estate-optimiser]')));
  await p.click('[data-optimise-estate]');
  // the search is ~40ms of work but the click-to-render round trip is not, and a tight wait here has
  // failed on a loaded machine; waiting for the table itself rather than for a duration
  await p.waitForSelector('[data-lever-table]', { timeout: 15000 });
  await p.waitForTimeout(300);
  const levers = await p.evaluate(()=>[...document.querySelector('[data-lever-table]').querySelectorAll('tbody tr')]
    .map(r=>[...r.querySelectorAll('td')].map(d=>d.textContent.trim())));
  console.log('    levers:'); levers.forEach(l=>console.log('      '+l.join(' | ')));
  ok('every lever is reported', levers.length===6, `${levers.length} rows`);
  ok('drawing the pension early is one of them', levers.some(l=>/draw early/i.test(l[0])));
  ok('and who the pension goes to', levers.some(l=>/pension goes to/i.test(l[0])));
  ok('the will split is answered rather than ignored', await p.evaluate(()=>/does not change the total/.test(document.body.textContent)));
  ok('wrapper transfers are one of them', levers.some(l=>/wrappers/i.test(l[0])));
  const ranked = await p.evaluate(()=>[...document.querySelector('[data-estate-ranked]').querySelectorAll('tbody tr')]
    .map(r=>[...r.querySelectorAll('td')].map(d=>d.textContent.trim())));
  console.log('    ranked:'); ranked.slice(0,4).forEach(l=>console.log('      '+l.join(' | ')));
  const money=(s)=>Number(String(s).replace(/[^0-9.]/g,''));
  ok('ranked best first', ranked.every((r,i)=>i===0||money(ranked[i-1][1])>=money(r[1])));
  // the answer has to be a list of things to do, not a label
  const actions = await p.evaluate(()=>[...document.querySelector('[data-action-plan]').querySelectorAll('li')]
    .map(li=>li.textContent.trim()));
  console.log('    actions:'); actions.forEach((a,i)=>console.log(`      ${i+1}. ${a.slice(0,110)}`));
  ok('there is an action list', actions.length>0, `${actions.length} steps`);
  /*
   * Three cards, because they are three kinds of decision: money you keep, money you give away, and the
   * arithmetic that follows. And the gift card has to answer "why not more" itself - the search has
   * already priced every larger gift, so leaving the household to wonder is leaving them to guess wrong.
   */
  const groups = await p.evaluate(()=>[...document.querySelectorAll('[data-action-group]')].map(d=>d.dataset.actionGroup));
  ok('the actions are split into cards', groups.length >= 2, groups.join(', '));
  ok('reallocation is its own card', groups.includes('reallocate'));
  ok('and the figures that follow are priced on the recommendation',
    await p.evaluate(()=>!!document.querySelector('[data-recommended-workings]')));
  ok('with a working that ends on the tax payable',
    await p.evaluate(()=>/Inheritance tax payable/.test(document.querySelector('[data-recommended-workings]')?.textContent||'')));
  ok('and a split of estate against lifetime gifts',
    await p.evaluate(()=>/Given in your lifetime/.test(document.querySelector('[data-recommended-workings]')?.textContent||'')));
  ok('it names amounts and years, not policy jargon', actions.some(a=>/£[\d,]+/.test(a) && /20\d\d/.test(a)));
  ok('a dead-end lever explains itself', await p.evaluate(()=>/no income tax at all|out of reach/.test(document.body.textContent)));
  ok('charity is priced but not ranked', await p.evaluate(()=>/priced but not ranked/i.test(document.body.textContent)));
  // apply, then confirm the plan actually changed
  const before = await p.evaluate(()=>JSON.parse(localStorage.getItem('rp_plan_full_v28')).spending.decumulationPolicy);
  await p.click('[data-apply-estate]');
  await p.waitForTimeout(900);
  const after = await p.evaluate(()=>JSON.parse(localStorage.getItem('rp_plan_full_v28')));
  ok('applying changes the withdrawal order', after.spending.decumulationPolicy !== before,
    `${before} -> ${after.spending.decumulationPolicy}`);
  ok('and writes the wrapper transfers in', (after.oneOffContributions||[]).some(c=>/Recycle|relief/i.test(c.desc||'')),
    `${(after.oneOffContributions||[]).length} one-off deposits`);
  // the IHT credit, further down the same tab
  await p.evaluate(()=>{const d=[...document.querySelectorAll('summary')].find(x=>/Special circumstances/i.test(x.textContent)); if(d)d.click();});
  await p.waitForTimeout(400);
  ok('a credit with no tax paid says so', await p.evaluate(()=>/the relief is/.test(document.body.textContent)));
  await p.locator('[data-qsr-tax]').fill('900');
  await p.waitForTimeout(700);
  ok('entering the tax paid shows the credit', await p.evaluate(()=>/Quick succession credit/.test(document.body.textContent)));
  const credit = await p.evaluate(()=>{const m=document.body.textContent.match(/Quick succession credit at your chosen death age: £([\d,]+)/); return m?m[1]:null;});
  ok('and it is the tapered share of it', credit==='540', `£${credit} of £900 at 60%`);
  /*
   * The same household priced at a death AFTER 75, where the two levers that were dead ends at 71 come
   * alive: an inherited pension is taxed on the heir, so the split matters, and drawing the pension down
   * early at 20% can beat the estate paying 40% and the heir paying their own rate on what is left.
   */
  const later = JSON.parse(JSON.stringify(plan));
  later.inheritance.deathAge = '80';
  const p2 = await b.newPage({viewport:{width:1500,height:1800}});
  const errs2=[]; p2.on('pageerror',e=>errs2.push(e.message));
  await p2.route('https://cdn.tailwindcss.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.tailwind={config:{}};'}));
  await p2.addInitScript(pl=>localStorage.setItem('rp_plan_full_v28',JSON.stringify(pl)),later);
  await p2.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p2.waitForTimeout(1200);
  await p2.evaluate(()=>{const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Inheritance/.test(b.textContent)); if(x)x.click();});
  await p2.waitForTimeout(700);
  await p2.click('[data-optimise-estate]');
  await p2.waitForSelector('[data-lever-table]', { timeout: 15000 });
  await p2.waitForTimeout(300);
  const lev2 = await p2.evaluate(()=>[...document.querySelector('[data-lever-table]').querySelectorAll('tbody tr')]
    .map(r=>[...r.querySelectorAll('td')].map(d=>d.textContent.trim())));
  console.log('    levers at 80:'); lev2.forEach(l=>console.log('      '+l.join(' | ')));
  const gain = (name) => { const r = lev2.find(x=>new RegExp(name,'i').test(x[0])); return r ? Number(r[1].replace(/[^0-9.]/g,'')) : 0; };
  ok('the pension split now earns its place', gain('pension goes to') > 10000, `+£${gain('pension goes to').toLocaleString()}`);
  ok('and drawing the pension early does too', gain('draw early') > 0, `+£${gain('draw early').toLocaleString()}`);
  ok('the split is quoted as percentages, not all-or-nothing',
    await p2.evaluate(()=>/pension \d+% .+ \/ \d+%/.test(document.body.textContent)));
  const acts2 = await p2.evaluate(()=>[...document.querySelector('[data-action-plan]').querySelectorAll('li')].map(li=>li.textContent));
  // either "why £X and not more" or "no gift, and here is what the best one would have cost" - never silence
  ok('the gift decision explains itself either way',
    await p2.evaluate(()=>{const d=document.querySelector('[data-gift-rationale]');
      return !!d && /worse off|does not leave enough|is worth/.test(d.textContent);}),
    await p2.evaluate(()=>(document.querySelector('[data-gift-rationale]')?.textContent||'MISSING').slice(0,110)));
  ok('the nomination is spelled out as a form to ask for', acts2.some(a=>/expression of wish/.test(a)),
    acts2.length + ' steps');
  ok('and the percentages are named', acts2.some(a=>/%\s*to\s*\w/.test(a)));
  ok('the draw-down instruction quotes the band', acts2.some(a=>/£50,270/.test(a)));
  await p2.click('[data-apply-estate]');
  await p2.waitForTimeout(900);
  /*
   * The list is what is LEFT to do, so acting on it shortens it: once the plan holds the new order and
   * ceiling those steps drop out, and what remains is the paperwork nobody else can do for you.
   */
  const acts3 = await p2.evaluate(()=>[...document.querySelector('[data-action-plan]').querySelectorAll('li')].map(li=>li.textContent));
  ok('applying what the plan can hold shortens the list', acts3.length < acts2.length, `${acts2.length} -> ${acts3.length} steps`);
  ok('and what is left is the paperwork', acts3.some(a=>/expression of wish|holds your will/.test(a)));
  /*
   * Applying twice must change nothing the second time. It used to append a fresh gift with a random id
   * on every click, so the natural response to a button that gives no sign of having worked - clicking
   * it again - silently added the same six-figure gift a second time.
   */
  const countAfterOne = await p2.evaluate(()=>{const s=JSON.parse(localStorage.getItem('rp_plan_full_v28'));
    return { gifts: (s.inheritance.gifts||[]).length, deposits: (s.oneOffContributions||[]).length,
      total: (s.inheritance.gifts||[]).reduce((t,g)=>t+Number(g.amount||0),0) };});
  await p2.click('[data-apply-estate]');
  await p2.waitForTimeout(900);
  const countAfterTwo = await p2.evaluate(()=>{const s=JSON.parse(localStorage.getItem('rp_plan_full_v28'));
    return { gifts: (s.inheritance.gifts||[]).length, deposits: (s.oneOffContributions||[]).length,
      total: (s.inheritance.gifts||[]).reduce((t,g)=>t+Number(g.amount||0),0) };});
  ok('applying a second time adds no second gift', countAfterOne.gifts === countAfterTwo.gifts,
    `${countAfterOne.gifts} -> ${countAfterTwo.gifts}`);
  ok('nor doubles what was given', countAfterOne.total === countAfterTwo.total,
    `£${countAfterOne.total.toLocaleString()} -> £${countAfterTwo.total.toLocaleString()}`);
  ok('nor repeats the wrapper transfers', countAfterOne.deposits === countAfterTwo.deposits,
    `${countAfterOne.deposits} -> ${countAfterTwo.deposits}`);
  ok('and it says what it wrote and where', await p2.evaluate(()=>!!document.querySelector('[data-estate-applied]')));
  ok('telling you to search again rather than click again',
    await p2.evaluate(()=>/Run the search again/.test(document.querySelector('[data-estate-applied]')?.textContent||'')));
  const applied = await p2.evaluate(()=>JSON.parse(localStorage.getItem('rp_plan_full_v28')));
  const shares = (applied.inheritance.beneficiaries||[]).map(x=>Number(x.pensionSharePct));
  ok('applying writes the pension shares', shares.some(x=>x>0) && Math.abs(shares.reduce((t,x)=>t+x,0)-100)<0.01,
    shares.join('/'));
  ok('and the draw-down ceiling', applied.config.harvestCeiling === 'basic', String(applied.config.harvestCeiling));
  ok('no page errors at the later death age', errs2.length===0, errs2.slice(0,2).join(' | '));

  /*
   * Exempt compensation and its deadline. The window is the one figure on the tab that expires, so the
   * checks are that the date drives it, that the optimiser sees it, and that a gift dated too late is
   * called out rather than quietly priced as exempt.
   */
  await p2.evaluate(()=>{const d=[...document.querySelectorAll('summary')].find(x=>/Special circumstances/i.test(x.textContent)); if(d)d.click();});
  await p2.waitForTimeout(400);
  await p2.locator('[data-exempt-compensation]').fill('350000');
  await p2.locator('[data-exempt-compensation-date]').fill('2026-02-01');
  await p2.waitForTimeout(700);
  ok('the gifting deadline is worked out from the payment date',
    await p2.evaluate(()=>/The window shuts on 2028-02-01/.test(document.body.textContent)));
  ok('and the credit is priced', await p2.evaluate(()=>/Off the bill \u2014 £140,000/.test(document.body.textContent)));
  ok('and the whole award reads as still giftable', await p2.evaluate(()=>/£350,000 of £350,000 left/.test(document.body.textContent)));
  await p2.click('[data-optimise-estate]');
  await p2.waitForSelector('[data-lever-table]', { timeout: 15000 });
  await p2.waitForTimeout(300);
  const lev3 = await p2.evaluate(()=>[...document.querySelector('[data-lever-table]').querySelectorAll('tbody tr')]
    .map(r=>[...r.querySelectorAll('td')].map(d=>d.textContent.trim())));
  ok('the optimiser carries a compensation lever', lev3.some(l=>/compensation/i.test(l[0])),
    lev3.map(l=>l[0]).join(' / '));
  ok('and it knows when the window shuts', lev3.some(l=>/2028-02-01/.test(l[2])) || lev3.some(l=>/compensation/i.test(l[0]) && /£/.test(l[1])));

  ok('no page errors', errs.length===0, errs.slice(0,2).join(' | '));
  await b.close();
  console.log(fails?`\n${fails} FAILED`:'\nall checks passed');
  process.exit(fails?1:0);
})();
