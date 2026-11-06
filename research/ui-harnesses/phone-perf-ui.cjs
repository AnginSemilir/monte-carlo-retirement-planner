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
 * And on a build with the new planner (Phase 11; B10, D59), opted in on the same phone:
 *
 *   5 "Solve my plan" solves the plan in the solver's workers, every path in, the main thread free throughout, with
 *     the bytes the page and its workers fetched recorded. Planted once (PHONE_PERF_PLANT=hogmain: the page holds the
 *     main thread on every message from the solver's workers), the main-thread check fails.
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
/*
 * The long-task line. 1,500 when the worker landed, at about 700ms measured. RAISED TO 2,200 on 30 Oct, on the
 * maintainer's call, after main and the branch failed it alike. Alternated on one machine, the long tasks of
 * the same run: main (d9d9b08) 1,324 to 1,688, the branch head 1,271 to 1,865, one population; the build of
 * 20 Sep (d9b9491) 941 to 1,105. The difference is engine work, not the runner: bisected to 969669a (tax on
 * savings interest and on dividends, two more income-tax calls a person a year), which measured 1,372 and
 * 1,461. 2,200 sits about 335ms above the worst of them, more than half the spread, and still catches a page
 * frozen for the 28 seconds this harness exists to prevent, twelve times over.
 */
const LONG_TASK_CEILING = 2200;
/*
 * The new planner's line (Phase 11, 5 Nov): the long tasks from pressing "Solve my plan" on a phone to every path in, about
 * two and a half minutes at the harnesses' light settings, the solve in the solver's workers. Ten runs on a switch-on build
 * read 312 to 4,627ms (results-phone-perf-planner.txt); a trace spreads them over garbage collection, unpacking the
 * workers' messages, and style, layout and paint, with no one task to cut. 7,000 sits above the worst by more than half the
 * spread, as the projection's line does, and the planted hog (the main thread held on every message from the solver's
 * workers) read 22,652.
 */
const SOLVE_LONG_TASK_CEILING = 7000;
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

  // PHONE_PERF_ONLY (run-all.sh's two modes, Phase 12): 'classic', sections 1 to 4, the classic planner on the site as it
  // ships; 'planner', section 5 alone, the new planner on the light settings' build. Unset, every section.
  const only = process.env.PHONE_PERF_ONLY === 'planner', classicOnly = process.env.PHONE_PERF_ONLY === 'classic';
  if (!only) {
  // ---- 1 & 2: the throttled run, off the main thread ----
  console.log(`Pixel 7 at ${THROTTLE}x CPU throttle`);
  const a = await open(b, '', { throttle: true });
  await startRun(a.page);
  const t0 = Date.now();
  await waitDone(a.page);
  const wall = Date.now() - t0;
  const lt = await a.page.evaluate(() => window.__longtask);
  console.log(`  run finished in ${(wall / 1000).toFixed(1)}s; long tasks ${Math.round(lt)}ms (was ${BEFORE_MS}ms)`);
  ok('the main thread stays free during the projection', lt >= 0 && lt < LONG_TASK_CEILING, `${Math.round(lt)}ms of long tasks, ceiling ${LONG_TASK_CEILING}ms`);
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

  }

  // ---- 5: the new planner on a phone (Phase 11 item 3; B10, D59) ----
  // Opted in on a phone, "Solve my plan" solves the plan in the solver's workers and fills Your plan in; the main thread
  // stays free throughout, as the projection's must. Measured from the press to the card's "done" (every path in), at the
  // build's own settings (run-all's switch-on build: the harnesses' light settings). The bytes the page and its workers
  // fetched are recorded. On the site's own build the new planner is not there, and the run says so.
  if (classicOnly) console.log('the new planner on a phone: run in the new mode (PHONE_PERF_ONLY=planner), on the light settings\' build');
  else {
  console.log(`the new planner, opted in, Pixel 7 at ${THROTTLE}x CPU throttle: "Solve my plan" to every path in`);
    const ctx = await b.newContext({ ...devices['Pixel 7'] });
    const page = await ctx.newPage();
    const st = { errs: [], solverWorkers: 0, bytes: { page: 0, workers: 0, n: 0 }, seen: new Set() };
    page.on('pageerror', e => st.errs.push(e.message));
    page.on('worker', w => { if (/solverWorker/.test(w.url())) st.solverWorkers++; });
    page.on('requestfinished', async r => {
      if (!/\.(js|mjs|wasm)(\?|$)/.test(r.url())) return;
      let z = null;
      try { z = await r.sizes(); } catch (e) { return; }
      // a worker's script reports no body size here: it is counted from its body, gzipped as the server sends it, once
      const worker = /Worker-[^/]*\.js(\?|$)/.test(r.url());
      let n = z.responseBodySize + z.responseHeadersSize;
      if (worker) {
        if (st.seen.has(r.url())) return;
        st.seen.add(r.url());
        try { const resp = await r.response(); n = require('node:zlib').gzipSync(await resp.body()).length; } catch (e) { n = 0; }
      }
      if (worker) st.bytes.workers += n; else st.bytes.page += n;
      st.bytes.n++;
      if (process.env.PHONE_PERF_LIST) console.log(`    ${worker ? 'worker' : 'page  '} ${Math.round(n / 1024)}KB ${r.url().replace(/.*\//, '')}`);
    });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.addInitScript(() => {
      window.__longtask = 0;
      try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__longtask += e.duration; }).observe({ entryTypes: ['longtask'] }); } catch (err) { window.__longtask = -1; }
    });
    await page.addInitScript(pl => {
      if (sessionStorage.getItem('seeded')) return;
      localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
      localStorage.setItem('rp_which_app', JSON.stringify('full'));
      localStorage.setItem('rp_planner', 'new');
      sessionStorage.setItem('seeded', '1');
    }, plan);
    // PHONE_PERF_PLANT=hogmain (a planted fault, run once by hand): the page holds the main thread a third of a second on
    // every message from the solver's workers, as a page that did its solving work there would; the check below must fail
    if (process.env.PHONE_PERF_PLANT === 'hogmain') await page.addInitScript(() => {
      const Real = window.Worker;
      window.Worker = function (url, o) {
        const w = new Real(url, o);
        if (/solverWorker/.test(String(url))) w.addEventListener('message', () => { const t = performance.now(); while (performance.now() - t < 300) { /* hog */ } });
        return w;
      };
      window.Worker.prototype = Real.prototype;
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    // either planner drawn: the new planner's places, or the classic planner's tab bar with none of them
    await page.waitForSelector('[data-place="plan"], [data-tabbar], [data-bottomnav]', { timeout: 120000, state: 'attached' }).catch(() => {});
    const opted = await page.evaluate(() => !!document.querySelector('[data-place="plan"]'));
    if (!opted) console.log('  not measured: the new planner is not in this build (the switch is off)');
    else {
      await page.waitForSelector('[data-plan-answer] [data-solve-request], [data-plan-answer="solving"], [data-plan-answer="done"]', { timeout: 120000 }).catch(() => {});
      const asked = await page.evaluate(() => { window.__longtask = 0; const x = document.querySelector('[data-plan-answer] [data-solve-request]'); if (x) { x.click(); return true; } return false; });
      const t0 = Date.now();
      let done = true;
      try { await page.waitForSelector('[data-plan-answer="done"]', { timeout: 1500000 }); } catch (e) { done = false; }
      const wall = Date.now() - t0, lt = await page.evaluate(() => window.__longtask);
      await page.waitForTimeout(1500);
      console.log(`  solved and filled in ${(wall / 1000).toFixed(1)}s; long tasks ${Math.round(lt)}ms; bytes fetched: the page's scripts ${Math.round(st.bytes.page / 1024)}KB, the workers' ${Math.round(st.bytes.workers / 1024)}KB gzipped (${st.bytes.n} scripts)`);
      ok('the new planner on a phone: "Solve my plan" asked, solved, every path in', asked && done, `asked ${asked}, done ${done}`);
      ok('...the main thread stays free while it solves and fills in', done && lt >= 0 && lt < SOLVE_LONG_TASK_CEILING, `${Math.round(lt)}ms of long tasks, ceiling ${SOLVE_LONG_TASK_CEILING}ms`);
      ok('...the solve ran in the solver\'s workers', st.solverWorkers >= 1, `${st.solverWorkers} solver worker(s)`);
      ok('...no page errors', st.errs.length === 0, st.errs.slice(0, 2).join(' | '));
    }
    await ctx.close();
  }

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
