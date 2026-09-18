/*
 * THE PROJECTION, ON A PHONE, WITHOUT FREEZING IT.
 *
 * "Run the projection" used to do all of its arithmetic on the main thread. Measured by this harness on
 * the build before the change - Pixel 7, 4x CPU throttle, the plan below - one run took 30.6 seconds and
 * spent 28,398ms of that in long tasks. A long task is the browser's own name for "this page is not
 * responding to you", so that is a phone frozen for most of half a minute. Every other heavy thing on
 * the site had already been moved to a worker; this had not, and it is the button most people press
 * first. After the change the same run takes 6.0 seconds with about 0.7s of long tasks, so the wall
 * clock improved as well: the chunked loop's yields are themselves expensive on a throttled phone.
 *
 * Four things are checked, and the last two matter as much as the speed:
 *
 *   1 the main thread stays free   - long-task total during the run, which is what a frozen page IS
 *   2 a worker actually ran        - a silent fallback would leave 1 passing and this at zero
 *   3 the answer did not change    - the same run with ?forceMain=1 must agree to the digit
 *   4 Stop still stops             - a worker cannot be interrupted politely, so cancel terminates it
 *
 * 3 is the one that would catch a real regression: identical seeds and identical functions are the
 * argument that moving the work is safe, and this is the measurement of that argument.
 *
 * Run: node phone-perf-ui.cjs [port]
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5173';
const THROTTLE = 4;
const BEFORE_MS = 28398;  // this harness, this plan, the build before the worker existed
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:45,retireAgeSelf:62,salarySelf:70000,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:40000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:320000,contrib:12000,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:90000,contrib:6000,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:40000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:25000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
const running = () => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Stop');

async function open(browser, query, { throttle = false } = {}) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  const state = { errs: [], workers: 0 };
  page.on('pageerror', e => state.errs.push(e.message));
  page.on('worker', () => { state.workers++; });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  /*
   * A long task is anything that owned the main thread for over 50ms - the browser's own definition of
   * "this page is not responding to you". Installed before any script runs, so nothing is missed, and
   * zeroed immediately before the run so page load does not count against it.
   */
  await page.addInitScript(() => {
    window.__longtask = 0;
    try {
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__longtask += e.duration; })
        .observe({ entryTypes: ['longtask'] });
    } catch (err) { window.__longtask = -1; }   // -1 reads as "not measurable here", not as "fast"
  });
  await page.addInitScript(pl => {
    localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
    localStorage.setItem('rp_which_app', JSON.stringify('full'));
  }, plan);
  if (throttle) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  }
  await page.goto(`http://localhost:${PORT}/${query}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Projection/.test(b.textContent)); if (x) x.click(); });
  await page.waitForTimeout(400);
  return { ctx, page, state };
}

const startRun = (page) => page.evaluate(() => {
  window.__longtask = 0;
  const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent));
  x.click();
});

// The deck's numbered pills appear while stage 2 is still solving, so they do not mean "finished".
// Stop going away does.
const waitDone = (page, timeout = 300000) => page.waitForFunction(
  () => ![...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Stop'), null, { timeout });

// Survival rate off step 1 and the safe maximum off step 2, as text, which is what somebody reads.
async function figures(page) {
  const step1 = await page.evaluate(() => document.body.innerText);
  const after = (t, label, n) => {
    const L = t.split('\n').map(x => x.trim()).filter(Boolean);
    const i = L.indexOf(label);
    return i < 0 ? null : L[i + n];
  };
  await page.evaluate(() => { const x = document.querySelector('[data-deck-step="2"]') || document.querySelector('[data-slide-pill="2"]'); if (x) x.click(); });
  await page.waitForTimeout(1200);
  const step2 = await page.evaluate(() => document.body.innerText);
  return {
    survival: after(step1, 'Survival rate', 1),
    pot: after(step1, 'Pot at retirement', 1),
    safeMax: after(step2, 'Safe maximum', 1),
    achieved: after(step2, 'It actually survives', 1)
  };
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ---- 1 & 2: the throttled run, off the main thread ----
  console.log(`Pixel 7 at ${THROTTLE}x CPU throttle`);
  const a = await open(b, '', { throttle: true });
  await startRun(a.page);
  const t0 = Date.now();
  await waitDone(a.page);
  const wall = Date.now() - t0;
  const lt = await a.page.evaluate(() => window.__longtask);
  console.log(`  run finished in ${(wall / 1000).toFixed(1)}s; long tasks ${Math.round(lt)}ms (was ${BEFORE_MS}ms)`);
  ok('the main thread stays free during the projection', lt >= 0 && lt < 1500, `${Math.round(lt)}ms of long tasks`);
  ok('...and a worker actually ran', a.state.workers >= 1, `${a.state.workers} worker(s)`);
  const fastFigures = await figures(a.page);
  ok('no page errors', a.state.errs.length === 0, a.state.errs.slice(0, 2).join(' | '));

  // ---- 3: the same run, forced onto the main thread, must agree ----
  const m = await open(b, '?forceMain=1');
  await startRun(m.page);
  await waitDone(m.page);
  const mainFigures = await figures(m.page);
  ok('...with no worker, as asked', m.state.workers === 0, `${m.state.workers} worker(s)`);
  for (const k of ['survival', 'pot', 'safeMax', 'achieved']) {
    ok(`the worker's ${k} is the main thread's answer`, fastFigures[k] !== null && fastFigures[k] === mainFigures[k],
      `${fastFigures[k]} vs ${mainFigures[k]}`);
  }

  // ---- 4: Stop still stops ----
  const c = await open(b, '', { throttle: true });
  await startRun(c.page);
  await c.page.waitForTimeout(1500);
  const wasRunning = await c.page.evaluate(running);
  const t1 = Date.now();
  await c.page.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Stop'); if (x) x.click(); });
  let stopped = true;
  try { await waitDone(c.page, 8000); } catch (err) { stopped = false; }
  const took = Date.now() - t1;
  ok('the run was still going when Stop was pressed', wasRunning);
  ok('...and Stop ends it promptly', stopped && took < 2000, `${took}ms`);
  ok('...leaving the page usable', await c.page.evaluate(() => {
    const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent));
    return !!x && !x.disabled;
  }));

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
