// EXPLORATORY probe (D155 fix round; run: node research/solver/d155-fixround/<name>.cjs <port>): You's sections on a Pixel 7, the page's height and the section's own, and long drop-downs,
// on a build at PORT; with CLASSIC=1 the parent's classic planner's Plan Inputs instead (rp_planner 'classic')
const { chromium, devices } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2], CLASSIC = process.env.CLASSIC === '1';
const GIA = 'Other Investments (e.g. GIA)';
const plan = { demographics: { planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 62, salarySelf: 70000, employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976, terminalAge: 95 },
  spending: { targetSpend: 40000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [{ id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 320000, contrib: 12000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 90000, contrib: 6000, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 40000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 25000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ ...devices['Pixel 7'], defaultBrowserType: undefined }); const p = await ctx.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.addInitScript(([pl, c]) => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_theme_v1', 'light'); if (c) { localStorage.setItem('rp_planner', 'classic'); localStorage.setItem('rp_which_app', 'full'); } }, [plan, CLASSIC]);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800);
  await p.evaluate(c => { const want = c ? /Inputs/ : /^You$/; const x = [...document.querySelectorAll('[data-bottomnav] button')].find(b => want.test(b.textContent.trim())); if (x) x.click(); }, CLASSIC);
  await p.waitForTimeout(1500);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('[data-section-tabs] [role=tab]')].map(b => b.textContent.trim()));
  console.log(`${CLASSIC ? 'the classic Plan Inputs' : 'the planner\'s You'} at :${PORT}: ${tabs.join(', ')}`);
  for (const t of tabs) {
    await p.evaluate(n => { const x = [...document.querySelectorAll('[data-section-tabs] [role=tab]')].find(b => b.textContent.trim() === n); if (x) x.click(); }, t);
    await p.waitForTimeout(600); await p.evaluate(() => window.scrollTo(0, 0));
    const m = await p.evaluate(() => { const secs = [...document.querySelectorAll('[data-section]')]; const sec = secs[0]; const top = sec ? sec.getBoundingClientRect().top + scrollY : 0;
      return { page: document.documentElement.scrollHeight, one: secs.length, own: sec ? Math.round(sec.getBoundingClientRect().height) : null, top: Math.round(top),
        longSelects: [...document.querySelectorAll('[data-section] select')].filter(x => x.options.length >= 6).map(x => `${x.getAttribute('aria-label') || x.name || '?'} (${x.options.length})`) }; });
    console.log(`  ${t}: page ${m.page}px; ${m.one} section(s), its own height ${m.own}px from ${m.top}px; long drop-downs ${m.longSelects.join(', ') || 'none'}`);
  }
  await b.close();
})();
