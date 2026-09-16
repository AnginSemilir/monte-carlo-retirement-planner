// The ranked-priority control (under Advanced): reorder, persist, reset, thresholds, balanced mode, docs.
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5185';
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:62,retireAgeSelf:61,salarySelf:0,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:70000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:900000,contrib:0,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:300000,contrib:0,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:600000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:100000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};

let fails = 0;
const ok = (l, c, d='') => { console.log(`  ${c?'ok  ':'FAIL'}  ${l}${d?'   '+d:''}`); if(!c) fails++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1400 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('https://cdn.tailwindcss.com/**', r => r.fulfill({ status:200, contentType:'application/javascript', body:'window.tailwind={config:{}};' }));
  await p.addInitScript(pl => localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)), plan);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/^Config/.test(b.textContent.trim())||/Config/.test(b.textContent)); if(x) x.click(); });
  await p.waitForTimeout(600);

  // the ranking lives behind the Advanced fold now; open it before reading the list
  await p.evaluate(() => { const d=[...document.querySelectorAll('details')].find(x=>/rank the priorities yourself/i.test(x.querySelector('summary')?.textContent||'')); if (d) d.open = true; });
  await p.waitForTimeout(300);
  // scoped to the priority list: the Config tab also renders the policy playbook as an <ol>, and an
  // unscoped query silently counted both
  const order = () => p.evaluate(() => [...document.querySelectorAll('[data-priority-list] li')].map(li => li.querySelector('div.font-bold')?.textContent).filter(Boolean));
  const first = await order();
  console.log('default order:', first.slice(0,3).join(' > '));
  ok('priority list renders, survival first', /avoiding depletion/i.test(first[0] || ''), first[0]);
  ok('all six priorities present', first.length === 6, String(first.length));

  // promote "biggest expected pot" to the top by clicking its up-arrow repeatedly
  const potIdx = first.findIndex(t => /largest expected portfolio/i.test(t));
  ok('found the pot priority', potIdx > 0, String(potIdx));
  for (let i = potIdx; i > 0; i--) {
    await p.evaluate((n) => { const li=[...document.querySelectorAll('[data-priority-list] li')][n]; li.querySelectorAll('button')[0].click(); }, i);
    await p.waitForTimeout(120);
  }
  const after = await order();
  console.log('after promoting:', after.slice(0,3).join(' > '));
  ok('promotion moved it to the top', /largest expected portfolio/i.test(after[0] || ''), after[0]);

  /*
   * Persistence is checked by reading the stored plan rather than by reloading: addInitScript re-seeds
   * localStorage on EVERY navigation, so a reload would restore the fixture and the test would fail
   * against a working app.
   */
  const stored = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('rp_plan_full_v28')).spending.priorities; } catch (e) { return null; } });
  ok('the new order is written to the saved plan', Array.isArray(stored) && stored[0] === 'pot', JSON.stringify(stored));

  // reset
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Reset to default/.test(b.textContent)); if(x) x.click(); });
  await p.waitForTimeout(300);
  const reset = await order();
  ok('reset restores survival first', /avoiding depletion/i.test(reset[0] || ''), reset[0]);

  // the advanced panel: per-priority thresholds, auto-listed in the current rank order
  await p.evaluate(()=>{const d=[...document.querySelectorAll('summary')].find(x=>/set your own thresholds/i.test(x.textContent)); if(d)d.click();});
  await p.waitForTimeout(400);
  const adv = await p.evaluate(()=>{
    // by its own summary: the thresholds fold sits inside the Advanced fold, whose textContent contains it too
    const d=[...document.querySelectorAll('details')].find(x=>/set your own thresholds/i.test(x.querySelector('summary')?.textContent||''));
    if(!d) return null;
    return {rows:[...d.querySelectorAll('label')].map(l=>l.textContent.replace(/\s+/g,' ').trim()), units:[...d.querySelectorAll('label span:last-child')].map(x=>x.textContent.trim())};
  });
  ok('advanced thresholds panel exists', !!adv && adv.rows.length===6, adv?`${adv.rows.length} rows`:'missing');
  ok('it lists priorities in the CURRENT rank order', !!adv && /Avoiding depletion/.test(adv.rows[0]), adv?adv.rows[0].slice(0,40):'');
  ok('rate metrics use points and money metrics use percent', !!adv && adv.units.includes('pts') && adv.units.includes('%'), adv?adv.units.join(','):'');
  ok('the safety limit is disclosed', await p.evaluate(()=>/never more than/.test(document.body.textContent)));

  // balanced mode: a separate mechanism beside the list, not a seventh row in it
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Balance them all/.test(x.textContent)); if(b)b.click();});
  await p.waitForTimeout(400);
  ok('balanced mode can be switched on', await p.evaluate(()=>/weighed together rather than in order/.test(document.body.textContent)));
  ok('the ranked list stays visible but greyed', await p.evaluate(()=>{
    const ol=document.querySelector('[data-priority-list]');
    return !!ol && ol.className.includes('opacity-40') && ol.querySelectorAll('li').length===6;
  }));
  ok('the choice is saved to the plan', await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('rp_plan_full_v28')).spending.priorityMode==='balanced';}catch(e){return false;}}));
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Rank my priorities/.test(x.textContent)); if(b)b.click();});
  await p.waitForTimeout(300);
  ok('and switching back restores the ranked list', await p.evaluate(()=>{
    const ol=document.querySelector('[data-priority-list]'); return !!ol && !ol.className.includes('opacity-40');
  }));

  // the policy playbook is generated on the same tab
  ok('the policy how-to is shown', await p.evaluate(()=>/How to actually follow this policy/.test(document.body.textContent)));
  ok('and reads as instructions, not tokens', await p.evaluate(()=>!/penPA|penBasic|penAny/.test(document.body.textContent)));

  // the docs link must land on a real section - which only renders once its tab is open
  await p.evaluate(() => { const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>/Documentation|Docs/i.test(b.textContent)); if(x) x.click(); });
  await p.waitForTimeout(700);
  ok('docs section exists', await p.evaluate(() => !!document.getElementById('doc-priorities')));
  const docRows = await p.evaluate(() => { const d=document.getElementById('doc-priorities'); return d ? d.querySelectorAll('tbody tr').length : 0; });
  ok('docs table lists every priority', docRows === 6, String(docRows));
  ok('no page errors', errs.length === 0, errs.slice(0,2).join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall checks passed');
  process.exit(fails?1:0);
})();
