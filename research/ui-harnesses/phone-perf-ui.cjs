/*
 * THE PLANNER'S SOLVE, ON A PHONE, WITHOUT FREEZING IT (Phase 11 item 3; B10, D59).
 *
 * "Solve my plan" solves the plan in the solver's workers, every path in, the main thread free throughout, with the bytes
 * the page and its workers fetched recorded. Planted once (PHONE_PERF_PLANT=hogmain: the page holds the main thread on every
 * message from the solver's workers), the main-thread check fails.
 *
 * Until D155 (28 Nov 2026) this harness also timed the classic planner's "Run the projection" (sections 1 to 4: the main
 * thread free during the projection, a worker running it, the worker's answer the main thread's to the digit, and Stop);
 * that button retired with the classic planner, and the projection's worker serves only the planner's failure view now.
 * Section 5, the planner's own, is the harness, under its old number.
 *
 * Run: node phone-perf-ui.cjs [port]
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5173';
const THROTTLE = 4;
/*
 * The new planner's line (Phase 11, 5 Nov): the long tasks from pressing "Solve my plan" on a phone to every path in, about
 * two and a half minutes at the harnesses' light settings, the solve in the solver's workers. Ten runs on a switch-on build
 * read 312 to 4,627ms (results-phone-perf-planner.txt); a trace spreads them over garbage collection, unpacking the
 * workers' messages, and style, layout and paint, with no one task to cut. 7,000 sits above the worst by more than half the
 * spread, as the classic planner's projection's line did, and the planted hog (the main thread held on every message from the solver's
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
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ---- 5: the planner on a phone (Phase 11 item 3; B10, D59) ----
  // On a phone, "Solve my plan" solves the plan in the solver's workers and fills Your plan in; the main thread stays free
  // throughout. Measured from the press to the card's "done" (every path in), at the build's own settings (run-all's light
  // build). The bytes the page and its workers fetched are recorded.
  {
  console.log(`the planner, Pixel 7 at ${THROTTLE}x CPU throttle: "Solve my plan" to every path in`);
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
    await page.waitForSelector('[data-place="plan"]', { timeout: 120000, state: 'attached' }).catch(() => {});
    const drawn = await page.evaluate(() => !!document.querySelector('[data-place="plan"]'));
    if (!drawn) ok('the planner draws Your plan', false);
    else {
      await page.waitForSelector('[data-plan-answer] [data-solve-request], [data-plan-answer="solving"], [data-plan-answer="done"]', { timeout: 120000 }).catch(() => {});
      const asked = await page.evaluate(() => { window.__longtask = 0; const x = document.querySelector('[data-plan-answer] [data-solve-request]'); if (x) { x.click(); return true; } return false; });
      const t0 = Date.now();
      let done = true;
      try { await page.waitForSelector('[data-plan-answer="done"]', { timeout: 1500000 }); } catch (e) { done = false; }
      const wall = Date.now() - t0, lt = await page.evaluate(() => window.__longtask);
      await page.waitForTimeout(1500);
      console.log(`  solved and filled in ${(wall / 1000).toFixed(1)}s; long tasks ${Math.round(lt)}ms; bytes fetched: the page's scripts ${Math.round(st.bytes.page / 1024)}KB, the workers' ${Math.round(st.bytes.workers / 1024)}KB gzipped (${st.bytes.n} scripts)`);
      ok('the planner on a phone: "Solve my plan" asked, solved, every path in', asked && done, `asked ${asked}, done ${done}`);
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
