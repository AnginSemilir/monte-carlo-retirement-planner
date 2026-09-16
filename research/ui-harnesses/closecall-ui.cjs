// Drives the close-call branch. Plans: node -e 'import("./research/policy-study/scenarios.mjs").then(({buildScenarios})=>{const s=buildScenarios();const H=[{id:"k",relationship:"descendant",sharePct:100,income:60000}];const o={};for(const i of [224,210,378,182,42]){o[s[i].id]={...s[i].plan,inheritance:{...(s[i].plan.inheritance||{}),beneficiaries:H}}}require("fs").writeFileSync("plans.json",JSON.stringify(o))})'
// Find a plan whose two runs disagree, and exercise the close-call card. Usage: node closecall-ui.cjs plans.json shotDir
const { chromium } = require('/tmp/node_modules/playwright');
const fs = require('fs');
const plans = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const SHOT = process.argv[3];
const css = fs.readFileSync('/tmp/claude-0/twbuild/out.css', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let found = null;
  for (const [id, plan] of Object.entries(plans)) {
    for (const width of [1400, 390]) {
      if (found && width === 1400) continue;
      if (!found && width === 390) continue;
      const p = await b.newPage({ viewport: { width, height: 1300 } });
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.route('https://cdn.tailwindcss.com/**', r => r.fulfill({ status:200, contentType:'application/javascript', body:'window.tailwind={config:{}};' }));
      await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, plan);
      await p.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(800);
      await p.addStyleTag({ content: css });
      await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Config/.test(b.textContent)); if(x) x.click(); });
      await p.waitForTimeout(500);
      const t0 = Date.now();
      await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Auto-pick best policy/.test(b.textContent)); x.click(); });
      await p.waitForFunction(() => /Recommended:/.test(document.body.innerText), null, { timeout: 240000 });
      await p.waitForTimeout(300);
      const t = await p.evaluate(() => document.body.innerText);
      const close = /Close call\./.test(t);
      console.log(`${id} @${width}: ${((Date.now()-t0)/1000).toFixed(1)}s, close call: ${close}, errors: ${errs.length}`);
      if (close) {
        found = id;
        const note = t.match(/Close call\.[^\n]*/); console.log('  note:', note && note[0]);
        const card = await p.$('[data-close-call="1"]');
        console.log('  card:', card ? (await card.innerText()).replace(/\n/g, ' | ') : 'MISSING');
        if (card) {
          const el = await card.evaluateHandle(e => e.closest('.space-y-2'));
          await el.screenshot({ path: `${SHOT}/closecall-${width}.png` });
          if (width === 1400) {
            const before = await p.evaluate(() => JSON.parse(localStorage.getItem('rp_plan_full_v28')).spending.decumulationPolicy + '/' + JSON.parse(localStorage.getItem('rp_plan_full_v28')).spending.drawdownStrategy);
            await (await card.$('button')).click();
            await p.waitForTimeout(400);
            const after = await p.evaluate(() => JSON.parse(localStorage.getItem('rp_plan_full_v28')).spending.decumulationPolicy + '/' + JSON.parse(localStorage.getItem('rp_plan_full_v28')).spending.drawdownStrategy);
            const t2 = await p.evaluate(() => document.body.innerText);
            console.log(`  applied other run's pick: ${before} -> ${after}; heading says choice applied: ${/your choice applied above/i.test(t2)}; card reads Applied: ${/Applied/.test(await card.innerText())}`);
          }
        }
      }
      await p.close();
      if (!close) break;
    }
    if (found) break;
  }
  if (!found) console.log('no close call found among the candidate plans');
  await b.close();
})();
