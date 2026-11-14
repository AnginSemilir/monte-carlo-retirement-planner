/*
 * A COUPLE'S FIGURES IN THE BROWSER, AT THE APP'S SETTINGS (Part D, D5.6; research/solver/PART-D.md). EXPLORATORY: a measurement,
 * deciding nothing; a diagnostic, not in run-all's lists.
 *
 * Builds the site with couples on (vite.config.js: SOLVER_HARNESS=1 with no light settings, so the app's own, and COUPLES_ON=1),
 * serves it with the preview server's isolation headers, and drives the solver through the page's own client
 * (window.__solverHarness, src/solverClient.js), as profile-browser.cjs does. On a library couple holding 60/40 (S069, 61 and
 * 58, some of its paths failing), split four ways:
 *   1. the couple's two solves (each person's table with their partner's age), then the headline's first step (2,000 paths)
 *      and this year's skips (the page's 1,000 paths), the parts kept beside the owner (D5.6);
 *   2. the same figures with the parts let go (the client's PLANT 'coupleowner', the owner alone, as before D5.6), on fewer
 *      paths (500 and 200), each figure's time a path beside the first's;
 *   3. after a reload: both tables restored from the store, split (D5.6), and the headline's first step again.
 * Each figure is the same set whichever runs it (couple-split.test.mjs holds that); this measures only the time.
 *   node research/ui-harnesses/profile-couple.cjs [port]      (port 4176)
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const argv = process.argv.slice(2), PORT = /^\d+$/.test(argv[0] || '') ? argv[0] : '4176';
const ROOT = join(__dirname, '../..');
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
const SEED = 12345, f1 = x => x.toFixed(1);

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const plan = buildScenarios().find(s => s.id === 'S069').plan;
  const out = mkdtempSync(join(tmpdir(), 'profile-couple-'));
  execFileSync(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, SOLVER_HARNESS: '1', COUPLES_ON: '1' } });
  const server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--outDir', out, '--port', PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(res => setTimeout(res, 3000));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    const env = await p.evaluate(() => ({ isolated: self.crossOriginIsolated, cores: navigator.hardwareConcurrency, ua: navigator.userAgent.match(/Chrome\/[\d.]+/)[0] }));
    console.log(`A COUPLE'S FIGURES IN THE BROWSER (D5.6; EXPLORATORY): S069 at the app's settings, split four ways; ${env.ua}, ${env.cores} cores, isolated ${env.isolated}`);
    // 1 and 2: one solve, its figures timed with the parts kept, then with them let go (a second solve of the same plan, restored)
    const run = async (plant, n1, nA) => p.evaluate(async ({ plan, seed, plant, n1, nA }) => {
      const c = await window.__solverHarness();
      c.PLANT.rule = plant;
      const t0 = performance.now(), job = c.startSolve(plan, { parts: 4, couple: { engine: window.__solverEngine } });
      const done = await job.done, solveS = (performance.now() - t0) / 1000;
      const t1 = performance.now(); const s = await job.strategy(plan, seed, n1); const headS = (performance.now() - t1) / 1000;
      const t2 = performance.now(); const a = await job.actions(plan, seed, nA); const actS = (performance.now() - t2) / 1000;
      job.close(); c.PLANT.rule = '';
      return { solveS, restored: done.restored, parts: done.parts, headS, actS, survival: s.strategy.headline.survival, skips: a.actions.actions.filter(x => x.skip !== null).length };
    }, { plan, seed: SEED, plant, n1, nA });
    const kept = await run('', 2000, 1000);
    console.log(`\n1. the parts kept: the two solves ${f1(kept.solveS)} s (restored ${kept.restored}, ${kept.parts} parts); the headline's 2,000 paths ${f1(kept.headS)} s (${f1(1000 * kept.headS / 2000)} ms a path); this year's ${kept.skips} skips on 1,000 paths ${f1(kept.actS)} s; survival ${f1(kept.survival)}%`);
    const alone = await run('coupleowner', 500, 200);
    console.log(`2. the owner alone (as before D5.6): the solves ${f1(alone.solveS)} s (restored ${alone.restored}); the headline's 500 paths ${f1(alone.headS)} s (${f1(1000 * alone.headS / 500)} ms a path); ${alone.skips} skips on 200 paths ${f1(alone.actS)} s`);
    console.log(`   a path of the headline ${f1(1000 * alone.headS / 500)} ms alone against ${f1(1000 * kept.headS / 2000)} ms shared (x${(alone.headS / 500 / (kept.headS / 2000)).toFixed(2)}); a skip's path ${f1(1000 * alone.actS / Math.max(1, alone.skips * 200))} ms against ${f1(1000 * kept.actS / Math.max(1, kept.skips * 1000))} ms`);
    // 3. after a reload
    await p.reload({ waitUntil: 'networkidle' });
    const again = await run('', 2000, 1000);
    console.log(`3. after a reload: the two tables ${again.restored ? 'restored' : 'NOT restored'} in ${f1(again.solveS)} s (${again.parts} parts); the headline's 2,000 paths ${f1(again.headS)} s; the skips ${f1(again.actS)} s; survival ${f1(again.survival)}%`);
    console.log(errs.length ? `\npage errors: ${errs.slice(0, 3).join(' | ')}` : '\nno page errors');
  } finally {
    await b.close();
    server.kill();
    rmSync(out, { recursive: true, force: true });
  }
  console.log('\nEXPLORATORY: a measurement for D5.6, deciding nothing.');
})().catch(e => { console.log(`the profile threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
