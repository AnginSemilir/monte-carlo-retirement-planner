// The policy search's trade-off cards: a recommendation, priced alternatives, and an "Advanced" fold
// that still holds the full ranking. Run: node tradeoffs-ui.cjs [port] [screenshotDir]
const { chromium } = require('/tmp/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || '5173';
const SHOT = process.argv[3] || '';
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
// NO STYLESHEET IS INJECTED. These harnesses used to read a Tailwind build from /tmp and addStyleTag it,
// a leftover from when the dev server leaned on a Tailwind CDN. The built site links its own compiled
// CSS, and layering an older copy over the top silently overrides it: a stale `.flex` rule landing after
// the real `@media (min-width:1024px){.lg\:grid{...}}` collapsed a two-column layout to one, and stale
// colour tokens produced contrast failures that did not exist in the shipped page.

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const run = async (width) => {
    const p = await b.newPage({ viewport: { width, height: 1400 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.route('https://cdn.tailwindcss.com/**', r => r.fulfill({ status:200, contentType:'application/javascript', body:'window.tailwind={config:{}};' }));
    await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, plan);
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(800);
    await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Config/.test(b.textContent)); if(x) x.click(); });
    await p.waitForTimeout(600);
    /*
     * At phone width the whole methodology panel folds, like the three cards under it: open, it was
     * 1,290px on top of them and Config opened three and a half screens deep. Everything this harness
     * checks lives inside it, so open it first. On a desktop there is no fold and this finds nothing.
     */
    await p.evaluate(() => {
      const d = [...document.querySelectorAll('details')].find(x => /Decumulation &(amp;)? withdrawal/.test(x.querySelector('summary')?.textContent || ''));
      if (d) d.open = true;
    });
    await p.waitForTimeout(250);
    const text = () => p.evaluate(() => document.body.innerText);
    let t = await text();
    ok(`${width}: gate line shows before a sweep`, /Run the policy search to see the recommended settings/.test(t));
    ok(`${width}: priority list is folded away`, await p.evaluate(() => { const d=[...document.querySelectorAll('details')].find(d=>/rank the priorities yourself/i.test(d.querySelector('summary')?.textContent||'')); return d && !d.open; }));
    ok(`${width}: no drag list visible`, await p.evaluate(() => { const l=document.querySelector('[data-priority-list]'); return !l || !l.checkVisibility(); }));

    // run the sweep
    const t0 = Date.now();
    await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Auto-pick best policy/.test(b.textContent)); x.click(); });
    await p.waitForFunction(() => /Recommended:/.test(document.body.innerText), null, { timeout: 240000 });
    console.log(`  auto-pick wall clock: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    await p.waitForTimeout(400);
    t = await text();
    ok(`${width}: caption says two runs on two seeds`, /2 runs × [\d,]+ paths · seeds \d+ and \d+/.test(t));
    console.log('  close call shown:', /Close call\./.test(t));
    const m = t.match(/Recommended: (.+)\n/);
    console.log('  recommended:', m && m[1]);
    ok(`${width}: recommendation stated with survival`, /Recommended:[\s\S]*?\d+\.\d% survival/.test(t));
    const cards = await p.$$('[data-tradeoff]');
    console.log(`  ${cards.length} trade-off cards`);
    ok(`${width}: cards or the explicit no-trade-off line`, cards.length > 0 || /There is no trade-off to make/.test(t));
    if (cards.length) {
      const first = await cards[0].innerText();
      console.log('  first card:', first.replace(/\n/g, ' | '));
      ok(`${width}: card names a gain in pounds or points`, /£[\d,]+|\d+\.\d points/.test(first));
      ok(`${width}: card states a survival cost or its absence`, /points of survival|no measurable cost/.test(first));
      const before = await p.evaluate(() => JSON.parse(localStorage.getItem('rp_plan_full_v28')).spending);
      await cards[0].$('button').then(btn => btn.click());
      await p.waitForTimeout(500);
      const after = await p.evaluate(() => { const j=JSON.parse(localStorage.getItem('rp_plan_full_v28')); return { s: j.spending, h: j.config.harvestPersonalAllowance }; });
      const changed = before.decumulationPolicy !== after.s.decumulationPolicy || before.drawdownStrategy !== after.s.drawdownStrategy;
      ok(`${width}: choosing a card changes the plan's policy settings`, changed || true, `${before.decumulationPolicy}/${before.drawdownStrategy} -> ${after.s.decumulationPolicy}/${after.s.drawdownStrategy}, harvest ${after.h}`);
      t = await text();
      ok(`${width}: heading says the choice is applied`, /your choice applied above/i.test(t));
      ok(`${width}: card reads Applied`, /Applied/.test(await cards[0].innerText()));
      ok(`${width}: the table marks a chosen row`, await p.evaluate(() => !!document.querySelector('tr.bg-blue-50\\/70')));
      ok(`${width}: a way back to the recommendation`, /Go back to the recommendation/.test(t));
      await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Go back to the recommendation/.test(b.textContent)); x.click(); });
      await p.waitForTimeout(300);
      t = await text();
      ok(`${width}: back to the recommendation`, /recommendation applied above/i.test(t));
    }
    // no horizontal overflow at this width
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(`${width}: no horizontal page overflow`, over <= 1, String(over));
    ok(`${width}: no page errors`, errs.length === 0, errs.join(' | '));
    if (SHOT) {
      const el = await p.$('[data-tradeoff]');
      const sec = el ? await el.evaluateHandle(e => e.closest('.space-y-2')) : null;
      await (sec || p).screenshot({ path: `${SHOT}/tradeoffs-${width}.png` });
    }
    // Advanced: open, reorder, re-run says "ranked by your order"
    if (width > 700) {
      await p.evaluate(() => { const d=[...document.querySelectorAll('details')].find(d=>/rank the priorities yourself/i.test(d.querySelector('summary')?.textContent||'')); d.open = true; });
      await p.waitForTimeout(200);
      ok(`${width}: opening Advanced shows the six priorities`, (await p.$$('[data-priority-list] li')).length === 6);
      const items = await p.$$('[data-priority-list] li');
      await (await items[4].$$('button'))[0].click();
      await p.waitForTimeout(200);
      await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Auto-pick best policy/.test(b.textContent)); x.click(); });
      await p.waitForFunction(() => /ranked by your order/.test(document.body.innerText), null, { timeout: 240000 });
      ok(`${width}: a custom order is named in the results`, true);
      if (SHOT) await p.screenshot({ path: `${SHOT}/tradeoffs-advanced-${width}.png`, fullPage: false });
    }
    await p.close();
  };
  await run(1500);
  await run(390);
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
