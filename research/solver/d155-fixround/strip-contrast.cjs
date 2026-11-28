// EXPLORATORY probe (D155 fix round; run: node research/solver/d155-fixround/<name>.cjs <port>): the "In shares" strip's labels on Your plan, each against what is really behind it (the
// bar layer, its colour at its opacity, over the card), in each theme
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2];
const GIA = 'Other Investments (e.g. GIA)';
const plan = { demographics: { planningMode: 'single', currentAgeSelf: 55, retireAgeSelf: 60, salarySelf: 70000, employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976, terminalAge: 95 },
  spending: { targetSpend: 45000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [{ id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 450000, contrib: 1000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 180000, contrib: 500, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 40000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const theme of ['light', 'dark', 'sepia']) {
    const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await p.addInitScript(([pl, t]) => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_theme_v1', t); }, [plan, theme]);
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('[data-invest-strip] [data-strip] span', { timeout: 120000 }).catch(() => {});
    await p.waitForTimeout(1000);
    const rows = await p.evaluate(() => {
      const parse = c => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const v = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      const lin = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
      const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
      const over = (fg, bg, a) => ({ r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) });
      const card = el => { let x = el; while (x) { const c = parse(getComputedStyle(x).backgroundColor); if (c && c.a > 0.99) return c; x = x.parentElement; } return { r: 255, g: 255, b: 255 }; };
      return [...document.querySelectorAll('[data-invest-strip] [data-strip] span.relative')].map(sp => {
        const bar = sp.parentElement.querySelector('div.absolute'), bc = parse(getComputedStyle(bar).backgroundColor), op = +getComputedStyle(bar).opacity;
        const chip = parse(getComputedStyle(sp).backgroundColor) || { r: 0, g: 0, b: 0, a: 0 };
        const base = card(sp.parentElement.parentElement), barOn = over(bc, base, op * bc.a), behind = over(chip, barOn, chip.a), fg = parse(getComputedStyle(sp).color);
        const L1 = lum(fg), L2 = lum(behind), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        return `${sp.textContent} text ${getComputedStyle(sp).color} on rgb(${behind.r.toFixed(0)}, ${behind.g.toFixed(0)}, ${behind.b.toFixed(0)}) (the bar at ${op.toFixed(3)}): ${ratio.toFixed(2)}:1`;
      });
    });
    console.log(`${theme}:\n  ${rows.join('\n  ')}`);
    await p.close();
  }
  await b.close();
})();
