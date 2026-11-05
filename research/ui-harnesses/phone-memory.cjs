/*
 * THE PHONE'S MEMORY, MEASURED IN THE HARNESS'S BROWSER (Phase 11 item 2; D59: no solve on the maintainer's phone). The
 * launch plan: "The phone holds the solve on show, and for a locked position its base (F5), after step P's cuts." This reads
 * how much that is, at the app's own settings (45 wealth points, the real candidate), in Chromium with a Pixel 7's screen:
 * the page and its workers' memory (performance.measureUserAgentSpecificMemory, which the page's cross-origin isolation
 * allows), after the solve on show (the dial at its default), after a locked position (the dial at 3: the solve on show and
 * its base), and back at the default. A measurement, not a gate (EXPLORATORY): a phone's limit cannot be modelled here, and
 * D59 skips the device run. Library households only (never anybody's own plan).
 *   node research/ui-harnesses/phone-memory.cjs [household ...]      (default S116; builds the switch-on site at the app's
 *                                                                      own settings and serves it on 4199)
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const ROOT = join(__dirname, '../..'), VITE = join(ROOT, 'node_modules/vite/bin/vite.js'), PORT = 4199;
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ['S116'];
const MB = n => `${(n / 1048576).toFixed(1)}MB`;

(async () => {
  const OUT = mkdtempSync(join(tmpdir(), 'phone-memory-'));
  // the switch on at the app's own settings: SOLVER_PREVIEW_OPTS unset, so the page passes the solver no options
  const env = { ...process.env, SOLVER_PREVIEW: '1' };
  delete env.SOLVER_PREVIEW_OPTS;
  execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: 'inherit', env });
  const server = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT, '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));
  const { buildScenarios } = await import(pathToFileURL(join(ROOT, 'research/policy-study/scenarios.mjs')).href);
  const all = buildScenarios();
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--enable-blink-features=ForceEagerMeasureMemory'] });
  try {
    console.log(`Chromium ${b.version()}, a Pixel 7's screen, the app's own settings (45 wealth points)`);
    for (const id of IDS) {
      const plan = all.find(s => s.id === id).plan;
      const ctx = await b.newContext({ ...devices['Pixel 7'] }), p = await ctx.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.addInitScript(([pl]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); localStorage.setItem('rp_planner', 'new'); sessionStorage.setItem('seeded', '1'); } }, [plan]);
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
      const iso = await p.evaluate(() => self.crossOriginIsolated);
      const mem = async () => p.evaluate(async () => { if (!performance.measureUserAgentSpecificMemory) return null; const m = await performance.measureUserAgentSpecificMemory(); const by = {}; for (const x of m.breakdown) { const k = (x.attribution && x.attribution[0] && x.attribution[0].scope) || 'other'; by[k] = (by[k] || 0) + x.bytes; } return { total: m.bytes, by }; });
      const done = async (ms) => { const t0 = Date.now(); await p.waitForSelector('[data-plan-answer="done"]', { timeout: ms }); return Date.now() - t0; };
      const rows = [];
      // the dial is in the levers sheet on a phone: open it, choose, close it; then the card's "Solve again" (a phone asks)
      const dial = async v => {
        if (!(await p.$(`[data-solver-choice="cuts"] [data-value="${v}"]:visible`))) { await p.click('[data-open-levers]'); await p.waitForTimeout(800); }
        await p.click(`[data-solver-choice="cuts"] [data-value="${v}"]`);
        await p.waitForTimeout(600);
        await p.keyboard.press('Escape');
        await p.waitForTimeout(800);
      };
      const ask = async () => { await p.click('[data-plan-answer] [data-solve-request]', { timeout: 120000 }); };
      rows.push(['before the solve', await mem(), 0]);
      await ask();
      const t1 = await done(3600000);
      await p.waitForTimeout(3000);
      rows.push(['the solve on show (the dial at its default)', await mem(), t1]);
      await dial(3);
      await ask();
      const t2 = await done(3600000);
      await p.waitForTimeout(3000);
      rows.push(['a locked position (the dial at 3: the solve on show and its base)', await mem(), t2]);
      await dial(1);
      // back at the default the solve is the one stored on this device: it may come back without asking
      await p.waitForTimeout(3000);
      if (await p.$('[data-plan-answer] [data-solve-request]')) await ask();
      const t3 = await done(3600000);
      await p.waitForTimeout(3000);
      rows.push(['back at the default', await mem(), t3]);
      console.log(`\n${id} (cross-origin isolated ${iso}):`);
      for (const [label, m, t] of rows) console.log(`  ${label}: ${m ? `${MB(m.total)} (${Object.entries(m.by).map(([k, v]) => `${k} ${MB(v)}`).join(', ')})` : 'not measurable here'}${t ? `; solved and filled in ${(t / 1000).toFixed(0)}s` : ''}`);
      console.log(`  page errors: ${errs.length ? errs.slice(0, 2).join(' | ') : 'none'}`);
      await ctx.close();
    }
  } finally { await b.close(); server.kill(); rmSync(OUT, { recursive: true, force: true }); }
})().catch(e => { console.log('threw', e && e.stack); process.exit(1); });
