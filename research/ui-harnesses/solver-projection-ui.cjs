/*
 * PART C PHASE 10: THE PROJECTION UNDER THE SOLVER'S SWITCH (the launch plan section 4, Phase 10; research/solver/PHASE-10.md).
 * REQUIRED. Built item by item; today item 2, the projection running the solved plan.
 *
 * 1. The site as built (the switch off): the projection is your plan's, with no solver line on it.
 * 2. A preview build with the switch on at light settings (vite.config.js solver-preview), S126 from the research library:
 *      - a projection run before the solve has landed is your plan's, and goes stale when the solve lands ("Re-run");
 *      - re-run, it is the solved plan's: its survival Node's (the engine's monteCarlo of the solved plan at the same light
 *        settings, the projection's own paths and seed), with your plan's survival beside it ("as you are now"), Node's for
 *        the plan as entered, and the typical spending beside them.
 *
 *   node research/ui-harnesses/solver-projection-ui.cjs [port]      (the preview build is served on port + 10)
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const PORT = process.argv[2] || '4173', PREVIEW_PORT = String(Number(PORT) + 10);
const ROOT = join(__dirname, '../..');
const STORE = 'rp_plan_full_v28', SEED = 12345, TRIALS = 5000;
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
const VITE = join(ROOT, 'node_modules/vite/bin/vite.js');

async function open(b, port, plan) {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1100 } }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await ctx.addInitScript(([k, pl]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); sessionStorage.setItem('seeded', '1'); } }, [STORE, plan]);
  await p.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  return { p, errs, ctx };
}
const tab = (p, re) => p.evaluate(src => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(b => new RegExp(src).test(b.textContent)); if (x) x.click(); }, re.source);
const runProjection = async p => {
  await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /^\s*(Run the projection|Re-run the simulations)\s*$/.test(b.textContent)); if (x) x.click(); });
  await p.waitForFunction(() => /Survival rate/.test(document.body.innerText) && ![...document.querySelectorAll('button')].some(b => /Testing…|Solving…|Simulating…|Comparing…/.test(b.textContent)), null, { timeout: 900000 });
};

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), M = await load('src/solver/model.js');
  const { solveForApp } = await load('src/solverApp.js'), { solvedContext, yourContext } = await load('src/solverStrategy.js');
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const plan = buildScenarios().find(s => s.id === 'S126').plan;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // 1. the switch off
  { const { p, errs, ctx } = await open(b, PORT, plan);
    await tab(p, /Projection/); await p.waitForTimeout(800); await runProjection(p);
    const yours = await p.$('[data-solver-yours]');
    ok('switch off: the projection is your plan\'s, with no solver line', !yours && /Your plan as entered/.test(await p.textContent('body')));
    ok('switch off: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close(); }

  const OUT = mkdtempSync(join(tmpdir(), 'solver-projection-'));
  let server = null;
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, SOLVER_PREVIEW: '1', SOLVER_PREVIEW_OPTS: JSON.stringify(LIGHT) } });
    server = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT, '--port', PREVIEW_PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    let up = false;
    for (let i = 0; i < 40 && !up; i++) { try { const r = await fetch(`http://localhost:${PREVIEW_PORT}/`); up = r.ok; } catch (e) { await new Promise(res => setTimeout(res, 500)); } }
    ok('the preview build (the switch on) is served', up, `port ${PREVIEW_PORT}`);

    const { p, errs, ctx } = await open(b, PREVIEW_PORT, plan);
    // a run before the solve lands: your plan's figures
    await tab(p, /Projection/); await p.waitForTimeout(300); await runProjection(p);
    const early = await p.$('[data-solver-yours]');
    // the solve lands (the Config tab's state line carries it), then the projection reads stale
    await tab(p, /Config/);
    let solved = true;
    try { await p.waitForSelector('[data-solve-state="solved"]', { timeout: 900000 }); } catch (e) { solved = false; }
    await tab(p, /Projection/); await p.waitForTimeout(800);
    const stale = await p.$('[data-stale-results="solve"], [data-rerun-note]');
    ok('a run before the solve landed is your plan\'s, and goes stale when it lands', solved && !early && !!stale, `solved ${solved}, early solver line ${!!early}, stale note ${!!stale}`);
    // re-run: the solved plan's
    await runProjection(p);
    const got = await p.$eval('[data-solver-yours]', el => ({ yours: Number(el.dataset.solverYours), survival: Number(el.dataset.solverSurvival) })).catch(() => null);
    const saved = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE);
    const r = solveForApp(E, M, saved, LIGHT);
    const nodeSolved = E.monteCarlo(solvedContext(E, r), { trials: TRIALS, seed: SEED }).successRate;
    const nodeYours = E.monteCarlo(yourContext(E, saved), { trials: TRIALS, seed: SEED }).successRate;
    const text = await p.textContent('body');
    ok('re-run, the projection is the solved plan\'s: its survival Node\'s, your plan\'s beside it Node\'s, the typical spending shown', got && got.survival === nodeSolved && got.yours === nodeYours && /The solved plan/.test(text) && !!(await p.$('[data-solver-delivered]')),
      got ? `solved ${got.survival}% (Node ${nodeSolved}%), as you are now ${got.yours}% (Node ${nodeYours}%)` : 'no solver line');
    ok('switch on: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  } finally {
    if (server) server.kill();
    rmSync(OUT, { recursive: true, force: true });
  }
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(`  FAIL  the harness threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
