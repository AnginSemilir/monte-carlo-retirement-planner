/*
 * THE COUPLES' SCREENS, PICTURED FOR THE MAINTAINER (Part D, D5's report). EXPLORATORY: pictures, deciding nothing; not in
 * run-all's lists. Builds the harness's light build with couples on (vite.config.js: SOLVER_HARNESS=1, its light settings,
 * couples on in the source since D99), opens a library couple holding 60/40 in the new planner, waits for the solve and its figures, and takes:
 *   desktop (1,440 by 900): Your plan whole; You's Limits; What if; Details;
 *   phone (an iPhone 13): Your plan after "Solve my plan".
 * The light settings make the figures quick and coarse: the pictures show the screens, not a plan's numbers.
 *   node research/ui-harnesses/shots-couple.cjs <out-dir> [port]      (port 4177)
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync, mkdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const argv = process.argv.slice(2), OUTDIR = argv[0], PORT = /^\d+$/.test(argv[1] || '') ? argv[1] : '4177';
if (!OUTDIR) { console.log('usage: node research/ui-harnesses/shots-couple.cjs <out-dir> [port]'); process.exit(2); }
const ROOT = join(__dirname, '../..');
const STORE = 'rp_plan_full_v28';
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, strategySteps: [200, 500], strategyActionsN: 300 };
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);

(async () => {
  mkdirSync(OUTDIR, { recursive: true });
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const c = buildScenarios().find(s => s.id === 'S069');
  const out = mkdtempSync(join(tmpdir(), 'shots-couple-'));
  execFileSync(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, SOLVER_HARNESS: '1', SOLVER_HARNESS_OPTS: JSON.stringify(LIGHT) } });
  const server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--outDir', out, '--port', PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(res => setTimeout(res, 3000));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const place = async (p, label) => { await p.evaluate(l => { const x = [...document.querySelectorAll('[data-tabbar] button, [data-bottomnav] button')].find(bt => bt.textContent.trim() === l); if (x) x.click(); }, label); await p.waitForTimeout(800); };
  const open = async opts => {
    const ctx = await b.newContext(opts);
    // as the harness seeds a page (solver-planner-ui.cjs open): the plan saved, the full app, the new planner, once a tab
    await ctx.addInitScript(([key, plan]) => { if (sessionStorage.getItem('seeded')) return; localStorage.setItem(key, JSON.stringify(plan)); localStorage.setItem('rp_which_app', 'full'); localStorage.setItem('rp_planner', 'new'); sessionStorage.setItem('seeded', '1'); }, [STORE, c.plan]);
    const p = await ctx.newPage();
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    return p;
  };
  try {
    // the desktop
    { const p = await open({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
      await p.waitForSelector('[data-plan-answer="done"]', { timeout: 900000 });
      await p.waitForSelector('[data-strategy-actions="done"]', { timeout: 900000 }).catch(() => {});
      await p.waitForTimeout(1500);
      await p.screenshot({ path: join(OUTDIR, '1-your-plan.png'), fullPage: true });
      await place(p, 'You');
      const lim = await p.$('[data-place="you"] [data-section="limits"]');
      if (lim) { await lim.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await lim.screenshot({ path: join(OUTDIR, '2-you-limits.png') }); }
      await place(p, 'What if');
      await p.screenshot({ path: join(OUTDIR, '3-what-if.png'), fullPage: true });
      await place(p, 'Details');
      await p.screenshot({ path: join(OUTDIR, '4-details.png'), fullPage: true });
      await p.context().close(); }
    // the phone
    { const p = await open({ ...devices['iPhone 13'] });
      await p.waitForSelector('[data-plan-answer="ask"] [data-solve-request]', { timeout: 60000 }).catch(() => {});
      await p.click('[data-plan-answer="ask"] [data-solve-request]').catch(() => {});
      await p.waitForSelector('[data-plan-answer="done"]', { timeout: 900000 }).catch(() => {});
      await p.waitForTimeout(1500);
      await p.screenshot({ path: join(OUTDIR, '5-phone-your-plan.png'), fullPage: true });
      await p.context().close(); }
    console.log(`the couples' screens pictured (S069, light settings) in ${OUTDIR}`);
  } finally {
    await b.close();
    server.kill();
    rmSync(out, { recursive: true, force: true });
  }
})().catch(e => { console.log(`the pictures threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
