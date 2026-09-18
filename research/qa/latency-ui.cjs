/*
 * WHAT A KEYSTROKE COSTS, AND WHAT A SESSION LEAKS.
 *
 * Two runtime measurements the harnesses do not make:
 *
 *   1 TYPING LATENCY. For a field on each planner, type a digit and time how long the main thread stays
 *     busy afterwards (long tasks over 50ms, and the gap until the next animation frame). At 1x on a
 *     desktop and at 4x CPU throttle on a phone, since the 13,000-line component re-renders whole.
 *
 *   2 HEAP ACROSS TAB SWITCHES. Cycle every tab twenty times and read the JS heap before and after,
 *     with a GC forced in between. A steady climb is a listener, a worker or a timer that never lets go.
 *
 * Run: node research/qa/latency-ui.cjs [port]
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || 4173;
const simple = { ageSelf: 45, retireSelf: 62, terminalAge: 95, spend: 40000, salary: 70000, pen: 300000, isa: 80000, penC: 12000, isaC: 6000 };
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

const INSTALL = () => {
  window.__lt = [];
  new PerformanceObserver(list => list.getEntries().forEach(e => window.__lt.push({ start: e.startTime, dur: e.duration }))).observe({ type: 'longtask', buffered: true });
};

async function typeAndMeasure(p, selectorFn, label, n = 6) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = await p.evaluate(async ([fnSrc, i]) => {
      const el = (new Function('return (' + fnSrc + ')')())();
      if (!el) return null;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      window.__lt = [];
      const t0 = performance.now();
      setter.call(el, String(40000 + i * 1000));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      // the moment the browser next paints after React has committed
      const painted = await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))));
      await new Promise(r => setTimeout(r, 400));
      const lt = window.__lt.filter(t => t.start >= t0 - 5);
      return { toPaint: painted - t0, longTasks: lt.length, longMs: lt.reduce((s, t) => s + t.dur, 0), worst: Math.max(0, ...lt.map(t => t.dur)) };
    }, [selectorFn.toString(), i]);
    if (r) out.push(r);
    await p.waitForTimeout(250);
  }
  if (!out.length) { console.log(`  ${label}: field not found`); return; }
  const med = (k) => { const v = out.map(o => o[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
  console.log(`  ${label.padEnd(44)} to paint ${med('toPaint').toFixed(0).padStart(4)}ms · long tasks ${med('longTasks')} totalling ${med('longMs').toFixed(0)}ms · worst ${med('worst').toFixed(0)}ms   (medians of ${out.length})`);
  return out;
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [devName, opts, throttle] of [['desktop 1x', { viewport: { width: 1366, height: 768 } }, 1], ['phone 4x', { ...devices['iPhone 13'] }, 4]]) {
    console.log(`\n== typing latency · ${devName} ==`);
    // the full planner
    {
      const ctx = await b.newContext(opts);
      const p = await ctx.newPage();
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
      await p.addInitScript(INSTALL);
      await p.addInitScript(g => localStorage.setItem('rp_plan_full_v28', JSON.stringify(g)), GOOD);
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(2000);
      await p.evaluate(() => { const t = [...document.querySelectorAll('[data-tabbar] button, button')].find(x => x.textContent.trim() === 'Plan Inputs' || x.textContent.trim() === 'Inputs'); if (t) t.click(); });
      await p.waitForTimeout(800);
      await typeAndMeasure(p, () => [...document.querySelectorAll('input[data-money], input[type=number], input[inputmode]')].find(i => i.getBoundingClientRect().width > 0 && /^(?:\d[\d,]*)?$/.test(i.value)), 'full planner, a money field on Plan Inputs');
      await ctx.close();
    }
    // the simple planner (its chart redraws on every edit)
    {
      const ctx = await b.newContext(opts);
      const p = await ctx.newPage();
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
      await p.addInitScript(INSTALL);
      await p.addInitScript(s => { localStorage.setItem('rp_which_app', 'simple'); localStorage.setItem('rp_simple_v1', JSON.stringify(s)); }, simple);
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(3500);
      await p.evaluate(() => { const t = [...document.querySelectorAll('[data-simple-tabs] button')].find(x => x.textContent.trim() === 'Inputs'); if (t) t.click(); });
      await p.waitForTimeout(600);
      await typeAndMeasure(p, () => [...document.querySelectorAll('input[inputmode=numeric]')].find(i => i.getBoundingClientRect().width > 0 && /40,?000/.test(i.value)), 'simple planner, the spending field');
      await ctx.close();
    }
  }

  console.log('\n== heap across tab switches (desktop) ==');
  {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('HeapProfiler.enable');
    await p.addInitScript(g => localStorage.setItem('rp_plan_full_v28', JSON.stringify(g)), GOOD);
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2000);
    const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(300); const m = await cdp.send('Runtime.getHeapUsage'); return Math.round(m.usedSize / 1048576 * 10) / 10; };
    const tabs = ['Start Here', 'Plan Inputs', 'Config & Assumptions', 'Projection', 'Strategy', 'Historical Backtest', 'Audit Data Table', 'Documentation'];
    const cycle = async () => { for (const t of tabs) { await p.evaluate(tt => { const x = [...document.querySelectorAll('[data-tabbar] button, button')].find(b => b.textContent.trim() === tt); if (x) x.click(); }, t); await p.waitForTimeout(120); } };
    await cycle(); await cycle();
    const h0 = await heap();
    for (let i = 0; i < 20; i++) await cycle();
    const h1 = await heap();
    for (let i = 0; i < 20; i++) await cycle();
    const h2 = await heap();
    const listeners = await p.evaluate(() => { let n = 0; for (const k of ['scroll', 'resize', 'keydown']) { n += (window.getEventListeners ? Object.values(window.getEventListeners(window))[0]?.length || 0 : 0); } return n; });
    console.log(`  heap after warm-up ${h0}MB · after 20 cycles ${h1}MB · after 40 cycles ${h2}MB   (${(h2 - h0).toFixed(1)}MB drift over 320 tab switches)${listeners ? ' · listeners ' + listeners : ''}`);
    await ctx.close();
  }
  await b.close();
})();
