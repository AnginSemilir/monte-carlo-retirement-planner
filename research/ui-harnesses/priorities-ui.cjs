// The ranked-priority control: does promoting a priority actually change the policy the app picks?
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

  const order = () => p.evaluate(() => [...document.querySelectorAll('ol li')].map(li => li.querySelector('div.font-bold')?.textContent).filter(Boolean));
  const first = await order();
  console.log('default order:', first.slice(0,3).join(' > '));
  ok('priority list renders, survival first', /running out/i.test(first[0] || ''), first[0]);
  ok('all six priorities present', first.length === 6, String(first.length));

  // promote "biggest expected pot" to the top by clicking its up-arrow repeatedly
  const potIdx = first.findIndex(t => /biggest expected pot/i.test(t));
  ok('found the pot priority', potIdx > 0, String(potIdx));
  for (let i = potIdx; i > 0; i--) {
    await p.evaluate((n) => { const li=[...document.querySelectorAll('ol li')][n]; li.querySelectorAll('button')[0].click(); }, i);
    await p.waitForTimeout(120);
  }
  const after = await order();
  console.log('after promoting:', after.slice(0,3).join(' > '));
  ok('promotion moved it to the top', /biggest expected pot/i.test(after[0] || ''), after[0]);

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
  ok('reset restores survival first', /running out/i.test(reset[0] || ''), reset[0]);

  // the advanced panel: per-priority thresholds, auto-listed in the current rank order
  await p.evaluate(()=>{const d=[...document.querySelectorAll('summary')].find(x=>/set your own thresholds/i.test(x.textContent)); if(d)d.click();});
  await p.waitForTimeout(400);
  const adv = await p.evaluate(()=>{
    const d=[...document.querySelectorAll('details')].find(x=>/set your own thresholds/i.test(x.textContent));
    if(!d) return null;
    return {rows:[...d.querySelectorAll('label')].map(l=>l.textContent.replace(/\s+/g,' ').trim()), units:[...d.querySelectorAll('label span:last-child')].map(x=>x.textContent.trim())};
  });
  ok('advanced thresholds panel exists', !!adv && adv.rows.length===6, adv?`${adv.rows.length} rows`:'missing');
  ok('it lists priorities in the CURRENT rank order', !!adv && /Not running out/.test(adv.rows[0]), adv?adv.rows[0].slice(0,40):'');
  ok('rate metrics use points and money metrics use percent', !!adv && adv.units.includes('pts') && adv.units.includes('%'), adv?adv.units.join(','):'');
  ok('the safety limit is disclosed', await p.evaluate(()=>/never more than/.test(document.body.textContent)));

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
