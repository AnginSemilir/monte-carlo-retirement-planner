/*
 * WHAT A BAD SAVE DOES. The app keeps everything in localStorage and offers a JSON import. Both are
 * paths where the data is not the app's own: an old version, a corrupted write, a file somebody edited
 * by hand, a quota that is full. Each case here is loaded fresh and the question is the same - does the
 * app come up, say something useful, and keep the user's other data?
 *
 * Also checks the worker/main-thread equivalence the code promises (?forceMain=1 gives the same survival
 * figure to the digit) and that a scenario name is rendered as text, not markup.
 *
 * Run: node research/qa/storage-ui.cjs [port]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || 4173;
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

const GOOD = {
  demographics: { planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 62, salarySelf: 70000, statePensionSelf: 12548, terminalAge: 95, statePensionAge: 67, privatePensionAge: 57 },
  spending: { targetSpend: 40000 },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 300000, contrib: 12000, growth: 0, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 80000, contrib: 6000, growth: 0, risk: 'High Risk' },
    { id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 40000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 20000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ], config: {}
};

async function load(b, storage, { query = '' } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, storage);
  await p.goto(`http://localhost:${PORT}/${query}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1600);
  const up = await p.evaluate(() => ({ root: document.getElementById('root').childElementCount, text: (document.body.innerText || '').length, title: /planner/i.test(document.body.innerText) }));
  return { ctx, p, errs, up };
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  console.log('== corrupt and stale storage ==');
  const cases = {
    'plan is not JSON': { rp_plan_full_v28: '{not json' },
    'plan is a number': { rp_plan_full_v28: '42' },
    'plan is an array': { rp_plan_full_v28: '[1,2,3]' },
    'plan with accounts as a string': { rp_plan_full_v28: JSON.stringify({ ...GOOD, accounts: 'nope' }) },
    'plan with a 2MB scenario name': { rp_plan_full_v28: JSON.stringify(GOOD), rp_saved_scenarios_v3: JSON.stringify([{ id: 's1', name: 'x'.repeat(2_000_000), data: GOOD }]) },
    'scenarios not an array': { rp_saved_scenarios_v3: '{"a":1}' },
    'theme is garbage': { rp_theme_v1: 'neon' },
    'number format is garbage': { rp_number_format_v1: 'roman' },
    'which-app is garbage': { rp_which_app: 'spreadsheet' },
    'simple state is garbage': { rp_which_app: 'simple', rp_simple_v1: '{"earnings":"no","oneOffs":5,"ageSelf":{"a":1}}' },
    'an older plan key only (v27)': { rp_plan_full_v27: JSON.stringify(GOOD) }
  };
  for (const [label, storage] of Object.entries(cases)) {
    const { ctx, errs, up } = await load(b, storage);
    ok(`${label}: the app comes up`, up.root > 0 && up.text > 100 && up.title && errs.length === 0, `${up.text} chars, ${errs.length} error(s)${errs[0] ? ': ' + errs[0].slice(0, 90) : ''}`);
    await ctx.close();
  }

  console.log('== an older plan version is not silently discarded ==');
  {
    const keys = await (async () => { const { ctx, p } = await load(b, {}); const k = await p.evaluate(() => Object.keys(localStorage)); await ctx.close(); return k; })();
    ok('the plan key the app writes today', keys.some(k => /rp_plan_full_v\d+/.test(k)), keys.join(', '));
    const { ctx, p } = await load(b, { rp_plan_full_v27: JSON.stringify(GOOD) });
    const carried = await p.evaluate(() => { const s = localStorage.getItem('rp_plan_full_v28'); try { return s ? JSON.parse(s).accounts.find(a => a.id === 'pen_self').balance : null; } catch { return null; } });
    ok('a v27 plan is migrated into v28 (pension balance survives)', carried === 300000, `v28 pension balance: ${carried}`);
    await ctx.close();
  }

  console.log('== JSON import ==');
  {
    const { ctx, p } = await load(b, {});
    await p.evaluate(() => { const t = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Plan Inputs'); if (t) t.click(); });
    await p.waitForTimeout(600);
    const tryImport = async (label, content, expectApplied) => {
      const input = await p.$('input[type=file]');
      if (!input) { ok(`${label}: a file input exists`, false); return; }
      await input.setInputFiles({ name: 'plan.json', mimeType: 'application/json', buffer: Buffer.from(content) });
      await p.waitForTimeout(900);
      const r = await p.evaluate(() => {
        const s = localStorage.getItem('rp_plan_full_v28');
        let bal = null; try { bal = JSON.parse(s).accounts.find(a => a.id === 'pen_self').balance; } catch { /* not a plan */ }
        return { bal, text: document.body.innerText.slice(0, 4000) };
      });
      const applied = r.bal === 987654;
      ok(`${label}: ${expectApplied ? 'applied' : 'refused'}`, applied === expectApplied, `pension balance now ${r.bal}; ${/invalid|not a plan|could not|couldn|failed|unrecognised|error/i.test(r.text) ? 'a message was shown' : 'no message seen'}`);
    };
    const good = JSON.parse(JSON.stringify(GOOD)); good.accounts[0].balance = 987654;
    await tryImport('a plain text file', 'hello', false);
    await tryImport('a JSON array', '[1,2]', false);
    await tryImport('a JSON object with no plan in it', '{"foo":1}', false);
    await tryImport('a plan with a script in a field', JSON.stringify({ ...good, demographics: { ...good.demographics, note: '<img src=x onerror=alert(1)>' } }), true);
    const xss = await p.evaluate(() => document.querySelectorAll('img[src="x"]').length);
    ok('a markup string in the plan is not rendered as markup', xss === 0, `${xss} injected img(s)`);
    await ctx.close();
  }

  console.log('== scenario names are text ==');
  {
    const { ctx, p } = await load(b, { rp_plan_full_v28: JSON.stringify(GOOD), rp_saved_scenarios_v3: JSON.stringify([{ id: 's1', name: '<b>bold</b><img src=x onerror=1>', data: GOOD }]) });
    await p.evaluate(() => { const t = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Plan Inputs'); if (t) t.click(); });
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => ({ imgs: document.querySelectorAll('img[src="x"]').length, bolds: [...document.querySelectorAll('b')].filter(b => b.textContent === 'bold').length, shown: /<b>bold<\/b>/.test(document.body.innerText) }));
    ok('the name shows as its literal text', r.imgs === 0 && r.bolds === 0, JSON.stringify(r));
    await ctx.close();
  }

  console.log('== worker and main thread agree ==');
  {
    const run = async (query) => {
      const { ctx, p } = await load(b, { rp_plan_full_v28: JSON.stringify(GOOD) }, { query });
      await p.evaluate(() => { const t = [...document.querySelectorAll('button')].find(x => /Projection/.test(x.textContent)); if (t) t.click(); });
      await p.waitForTimeout(500);
      await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent)); x.click(); });
      await p.waitForFunction(() => !!document.querySelector('[data-slide-pill="6"]'), null, { timeout: 240000 });
      await p.waitForTimeout(800);
      const text = await p.evaluate(() => document.body.innerText);
      const m = text.match(/(\d+\.\d)%\s*±/);
      await ctx.close();
      return m ? m[1] : null;
    };
    const w = await run(''), m = await run('?forceMain=1');
    ok('same survival rate on the worker and the main thread', w !== null && w === m, `worker ${w}% vs main ${m}%`);
  }

  console.log('== quota ==');
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => {
      // fill the store so the app's next write throws QuotaExceededError
      try { let i = 0; while (i < 60) { localStorage.setItem('filler' + i, 'x'.repeat(100000)); i++; } } catch { /* full */ }
    });
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const t = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Plan Inputs'); if (t) t.click(); });
    await p.waitForTimeout(500);
    await p.evaluate(() => {
      const input = [...document.querySelectorAll('[data-you-rows] input, input[type=number]')].find(i => i.getBoundingClientRect().width > 0);
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '46'); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await p.waitForTimeout(800);
    const up = await p.evaluate(() => ({ root: document.getElementById('root').childElementCount, text: (document.body.innerText || '').length }));
    ok('typing with a full localStorage does not crash the page', up.root > 0 && up.text > 100 && errs.length === 0, `${errs.length} error(s)${errs[0] ? ': ' + errs[0].slice(0, 100) : ''}`);
    await ctx.close();
  }

  await b.close();
  console.log(`\n${fails ? fails + ' FAILED' : 'all ok'}`);
})();
