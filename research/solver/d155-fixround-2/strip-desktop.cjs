// EXPLORATORY probe (D155 second fix round; run: node research/solver/d155-fixround-2/strip-desktop.cjs <port>): the "In shares"
// strip on the desktop's Your plan (1400px, the light theme, restyle-regression's household), when the card first reads
// 'filling' and when it reads 'done': the strip's labels on the page, and what the contrast probe flags. On b612be65's light
// build, with other pages solving beside it, the strip was not yet drawn when the card first read 'filling'; on a quiet
// machine it was there within 0.6s; drawn, its 70% label is under the bar
const { chromium } = require('/tmp/node_modules/playwright');
const { join } = require('node:path');
const { readFileSync } = require('node:fs');
const ROOT = join(__dirname, '../../..');
const { CONTRAST_PROBE } = require(join(ROOT, 'research/ui-harnesses/lib/probes.cjs'));
const GIA = 'Other Investments (e.g. GIA)';
// restyle-regression's own household, read from its source so the two cannot drift
const src = readFileSync(join(ROOT, 'research/ui-harnesses/restyle-regression-ui.cjs'), 'utf8');
const plan = eval('(' + /const plan = (\{[\s\S]*?\n\});/.exec(src)[1] + ')');   // eslint-disable-line no-eval
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  await p.route('https://fonts.googleapis.com/**', r => r.abort()); await p.route('https://fonts.gstatic.com/**', r => r.abort());
  await p.addInitScript(([pl]) => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_theme_v1', 'light'); }, [plan]);
  await p.goto(`http://localhost:${process.argv[2]}/`, { waitUntil: 'domcontentloaded' });
  for (const st of ['filling', 'done']) {
    await p.waitForSelector(`[data-plan-answer="${st}"]`, { timeout: 900000 }).catch(() => {});
    await p.waitForTimeout(600);
    const labels = await p.evaluate(() => [...document.querySelectorAll('[data-invest-strip] span')].filter(s => /%$/.test(s.textContent.trim())).map(s => { const r = s.getBoundingClientRect(); return `${s.textContent.trim()}@${Math.round(r.left)},${Math.round(r.top)} ${r.width > 0 ? 'shown' : 'hidden'}`; }));
    const bad = await p.evaluate(CONTRAST_PROBE);
    const state = await p.evaluate(() => document.querySelector('[data-plan-answer]')?.getAttribute('data-plan-answer'));
    console.log(`${st} (the card ${state}): strip labels ${labels.join(', ') || 'none'}; probe flags ${bad.map(x => `"${x.text}" ${x.ratio}`).join(', ') || 'none'}`);
  }
  await b.close();
})();
