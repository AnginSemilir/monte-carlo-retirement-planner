/*
 * THE BROWSER CHECK IN CHROMIUM (Phase 12 item 5; public/browser-check.html). Unused since D60 (6 Nov: the maintainer excluded
 * the Safari and Firefox checks from the readiness checklist); kept with the page, for a later check of another browser. The page the maintainer opens in Safari and in
 * Firefox, run here in Chromium on the site exactly as it ships, its block printed under the code's stamp
 * (research/solver/launch-stamp.mjs): the reference research/solver/browser-results.mjs reads the other browsers' blocks against.
 * Also a check of the page itself: it loads, solves S116 at the app's 45 points, and leaves the visitor's saved plan and their
 * planner's choice as they were.
 *   node research/ui-harnesses/browser-check-ui.cjs [port]      (the site is served on port + 14)
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const PORT = process.argv.find(a => /^\d+$/.test(a)) || '4173', SITE_PORT = String(Number(PORT) + 14);
const ROOT = join(__dirname, '../..'), VITE = join(ROOT, 'node_modules/vite/bin/vite.js');
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

(async () => {
  const { stamp } = await import(pathToFileURL(join(ROOT, 'research/solver/launch-stamp.mjs')).href);
  console.log(`the code: ${stamp()}; the browser check in Chromium, the site as it ships`);
  const OUT = mkdtempSync(join(tmpdir(), 'browser-check-'));
  const env = { ...process.env };
  for (const k of ['SOLVER_HARNESS', 'SOLVER_HARNESS_OPTS', 'PLANNER_BETA_OFF', 'PLANNER_PLANT']) delete env[k];
  let server = null;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'], env });
    server = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT, '--port', SITE_PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    let up = false;
    for (let i = 0; i < 40 && !up; i++) { try { up = (await fetch(`http://localhost:${SITE_PORT}/`)).ok; } catch (e) { await new Promise(res => setTimeout(res, 500)); } }
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    // a visitor with a saved plan of their own who opted in to the new planner: the check must leave both as they were
    const MINE = { demographics: { planningMode: 'single', currentAgeSelf: 50 }, spending: { targetSpend: 30000 }, accounts: [] };
    await ctx.addInitScript(m => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('rp_plan_full_v28', JSON.stringify(m)); localStorage.setItem('rp_planner', 'new'); sessionStorage.setItem('seeded', '1'); } }, MINE);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(`http://localhost:${SITE_PORT}/browser-check.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => !document.getElementById('go').disabled, null, { timeout: 120000 });
    const before = await page.evaluate(() => localStorage.getItem('rp_plan_full_v28'));
    await page.click('#go');
    await page.waitForFunction(() => /^Done|stopped/.test(document.getElementById('status').textContent), null, { timeout: 1800000 });
    const block = await page.textContent('[data-browser-check]');
    const after = await page.evaluate(() => ({ planner: localStorage.getItem('rp_planner'), plan: localStorage.getItem('rp_plan_full_v28') }));
    console.log(block.split('\n').map(l => `  | ${l}`).join('\n'));
    const at = Object.fromEntries(block.split('\n').slice(1).map(l => [l.split(':')[0], l.slice(l.indexOf(':') + 2)]));
    ok('the page solves S116 at the app\'s 45 points and simulates it, its block complete', up && !at.error && at.points === '45' && /^[0-9a-f]{64}$/.test(at.digest || '') && /^\d+\.\d{3}%$/.test(at.survival || ''), JSON.stringify(at).slice(0, 200));
    ok('the visitor\'s choice of planner and saved plan left as they were', after.planner === 'new' && JSON.parse(after.plan).spending.targetSpend === 30000 && after.plan === before, `planner ${after.planner}`);
    ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } finally { if (server) server.kill(); await b.close(); rmSync(OUT, { recursive: true, force: true }); }
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
