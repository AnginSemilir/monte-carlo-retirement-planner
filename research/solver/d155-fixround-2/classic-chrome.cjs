// EXPLORATORY probe (D155, the answers to the reviewer's third look; run: node research/solver/d155-fixround-2/classic-chrome.cjs
// <port>, the port serving 9d04859a's light build, the classic planner chosen): on each phone in the light theme, the chrome the
// classic page drew around a tab's own content, for Plan Inputs (as it opened) and the four tabs whose content Details keeps
// (Config & Assumptions, Historical Backtest, Audit Data Table, Documentation): where the tab's content starts, where the page
// ends below it, and so the classic screen cap converted to content (phone-ui.cjs DETAILS_CHROME and INPUTS_CHROME). The
// household is phone-ui's own, read from its source
const { chromium, devices } = require('/tmp/node_modules/playwright');
const { join } = require('node:path');
const { readFileSync } = require('node:fs');
const ROOT = join(__dirname, '../../..');
const GIA = 'Other Investments (e.g. GIA)';
const src = readFileSync(join(ROOT, 'research/ui-harnesses/phone-ui.cjs'), 'utf8');
const plan = eval('(' + /const plan = (\{[\s\S]*?\n\});/.exec(src)[1] + ')');   // eslint-disable-line no-eval
const PORT = process.argv[2];
// the classic tabs, their caps (phone-ui.cjs at 9d04859a, SCREEN_CAP) and the label the classic bottom bar or More sheet gave each
const TABS = [['Plan Inputs', 2.0, 'Inputs'], ['Config & Assumptions', 2.0, 'Config'], ['Historical Backtest', 2.6, 'Backtest'], ['Audit Data Table', 1.8, 'Audit'], ['Documentation', 2.2, 'Docs']];
const go = async (p, full, short) => {
  const direct = await p.evaluate(s => { const nav = document.querySelector('[data-bottomnav]'); const b = nav && [...nav.querySelectorAll('button')].find(x => x.textContent.trim().startsWith(s)); if (!b) return false; b.click(); return true; }, short);
  if (direct) return 'the bottom bar';
  await p.evaluate(() => { const nav = document.querySelector('[data-bottomnav]'); const m = nav && [...nav.querySelectorAll('button')].find(b => /more/i.test(b.getAttribute('aria-label') || b.textContent)); if (m) m.click(); });
  await p.waitForTimeout(400);
  const picked = await p.evaluate(f => { const b = [...document.querySelectorAll('[role="dialog"] button')].find(x => x.textContent.trim().startsWith(f)); if (!b) return false; b.click(); return true; }, full);
  return picked ? 'More' : null;
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const ctx = await b.newContext({ ...devices[dev], defaultBrowserType: undefined });
    const p = await ctx.newPage();
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); localStorage.setItem('rp_planner', 'classic'); localStorage.setItem('rp_theme_v1', 'light'); }, plan);
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1800);
    const vh = devices[dev].viewport.height;
    console.log(`${dev} (${devices[dev].viewport.width}x${vh})`);
    for (const [label, cap, short] of TABS) {
      const via = await go(p, label, short);
      await p.waitForTimeout(900);
      await p.evaluate(() => window.scrollTo(0, 0));
      const m = await p.evaluate(isInputs => {
        const app = document.querySelector('[data-app-content]');
        const kids = app ? [...app.children].filter(k => k.getBoundingClientRect().height > 0) : [];
        const tab = kids[kids.length - 1];
        if (!tab) return null;
        // Plan Inputs: its section, under the section tabs that sit in the tab's own container; the other tabs: the tab's content
        const sec = isInputs ? tab.querySelector('[data-section]') : null;
        const el = sec || tab, r = el.getBoundingClientRect();
        return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), page: document.documentElement.scrollHeight };
      }, label === 'Plan Inputs');
      if (!m) { console.log(`  ${label}: not reached`); continue; }
      const chrome = m.top + (m.page - m.bottom);
      console.log(`  ${label} (via ${via}): its content from ${m.top}px to ${m.bottom}px, the page ${m.page}px: ${m.top}px above and ${m.page - m.bottom}px below, ${chrome}px of chrome; its cap ${cap} screens, ${Math.round(cap * vh)}px a page, ${Math.round(cap * vh - chrome)}px of content`);
    }
    await ctx.close();
  }
  await b.close();
})();
