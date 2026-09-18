/*
 * WHICH COLOURS FAIL, NOT JUST HOW MANY NODES. axe reported ~390 contrast nodes; this groups them by the
 * foreground/background pair and the font size, per theme, so the fix is a token change rather than a
 * node-by-node hunt. Two screens per theme are enough to see the pairs: Plan Inputs and Projection.
 *
 * Run: node research/qa/contrast-ui.cjs [port]
 */
const fs = require('fs');
const { chromium } = require('/tmp/node_modules/playwright');
const AXE = fs.readFileSync('/tmp/node_modules/axe-core/axe.min.js', 'utf8');
const PORT = process.argv[2] || 4173;
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
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const theme of ['light', 'dark', 'sepia']) {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const p = await ctx.newPage();
    await p.addInitScript(([t, g]) => { localStorage.setItem('rp_theme_v1', t); localStorage.setItem('rp_plan_full_v28', JSON.stringify(g)); }, [theme, GOOD]);
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    const pairs = {};
    for (const tab of ['Plan Inputs', 'Config & Assumptions', 'Strategy', 'Documentation']) {
      await p.evaluate(t => { const x = [...document.querySelectorAll('[data-tabbar] button, button')].find(b => b.textContent.trim() === t); if (x) x.click(); }, tab);
      await p.waitForTimeout(600);
      await p.evaluate(AXE);
      const rows = await p.evaluate(async () => {
        const res = await window.axe.run(document, { runOnly: ['color-contrast'] });
        const v = res.violations[0];
        if (!v) return [];
        return v.nodes.map(n => {
          const d = n.any[0] && n.any[0].data;
          const el = document.querySelector(n.target[0]);
          const cls = el ? [...el.classList].filter(c => /^text-|^bg-/.test(c)).join(' ') : '';
          return d ? { fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, expected: d.expectedContrastRatio, size: d.fontSize, cls, text: (el && el.textContent || '').trim().slice(0, 30) } : null;
        }).filter(Boolean);
      });
      for (const r of rows) {
        const k = `${r.fg} on ${r.bg} · ${r.size} · needs ${r.expected}`;
        const cur = pairs[k] || { n: 0, ratio: r.ratio, cls: new Set(), sample: r.text };
        cur.n++; cur.cls.add(r.cls || '(no text-/bg- class)');
        pairs[k] = cur;
      }
    }
    console.log(`\n== ${theme} ==`);
    Object.entries(pairs).sort((a, b) => b[1].n - a[1].n).slice(0, 8).forEach(([k, v]) =>
      console.log(`${String(v.n).padStart(4)}  ${k}  got ${v.ratio}   classes: ${[...v.cls].slice(0, 3).join(' | ')}   e.g. "${v.sample}"`));
    await ctx.close();
  }
  await b.close();
})();
