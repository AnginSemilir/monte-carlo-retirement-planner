/*
 * THE FULL-SCALE BROWSER SOLVE (Phase 12 item 5, the readiness checklist: "45 points, the real settings, the floor at 80%, one
 * household. Its tables must be Node's bit for bit, and its time is recorded. The harnesses otherwise run at light settings").
 * Not in run-all.sh's gate: research/solver/launch-ready.mjs reads its results file (results-fullscale.txt), whose stamp names the
 * code it ran on (research/solver/launch-stamp.mjs).
 *
 * The site exactly as it ships (`vite build`, no harness settings: the app's 45 wealth points, the candidate, the floor at 80% of
 * the target where the plan sets none), served with the isolation headers, in Chromium. One household, S116 from the research
 * library (never anybody's own plan): Node solves it (solveForApp at the app's settings) and fingerprints its tables
 * (src/solverDigest.js); the page solves the same plan through the solver's client as the new planner does (its key, split across
 * the cores the page is told it has), and its tables' fingerprint must be Node's. Recorded: both times, the parts, whether the page
 * was cross-origin isolated, the tables' size.
 * Its plant (FULLSCALE_PLANT=grid: the page asked for 44 wealth points, not the app's 45) fails the check.
 *   node research/ui-harnesses/solver-fullscale-ui.cjs [port] [--parts N]      (the site is served on port + 13)
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const args = process.argv.slice(2);
const PORT = args.find(a => /^\d+$/.test(a)) || '4173', SITE_PORT = String(Number(PORT) + 13);
const PARTS = Number((args[args.indexOf('--parts') + 1] || '').match(/^\d+$/) ? args[args.indexOf('--parts') + 1] : 4);
const ROOT = join(__dirname, '../..'), VITE = join(ROOT, 'node_modules/vite/bin/vite.js');
const PLANT = process.env.FULLSCALE_PLANT || '';
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), M = await load('src/solver/model.js');
  const { solveForApp } = await load('src/solverApp.js'), D = await load('src/solverDigest.js'), { APP_POINTS } = await load('src/solverSettings.js');
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs'), { stamp } = await load('research/solver/launch-stamp.mjs');
  const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S116').plan);
  console.log(`the code: ${stamp()}; S116 at the app's own settings (${APP_POINTS} wealth points, the floor at 80% of the target)${PLANT ? `; planted: ${PLANT}` : ''}`);

  // Node
  const t0 = process.hrtime.bigint();
  const r = solveForApp(E, M, plan, {});
  const nodeSecs = Number(process.hrtime.bigint() - t0) / 1e9;
  const A = D.tablesOf(r), nodeDigest = await D.digestOf(A), size = D.sizeOf(A);
  console.log(`  Node: solved in ${nodeSecs.toFixed(1)} s on one core, ${size.values} values (${(size.bytes / 1048576).toFixed(0)} MB), digest ${nodeDigest.slice(0, 16)}`);

  // the page: the site as it ships
  const OUT = mkdtempSync(join(tmpdir(), 'solver-fullscale-'));
  const env = { ...process.env };
  for (const k of ['SOLVER_HARNESS', 'SOLVER_HARNESS_OPTS', 'PLANNER_BETA_OFF', 'PLANNER_PLANT']) delete env[k];
  let server = null;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'], env });
    server = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT, '--port', SITE_PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    let up = false;
    for (let i = 0; i < 40 && !up; i++) { try { up = (await fetch(`http://localhost:${SITE_PORT}/`)).ok; } catch (e) { await new Promise(res => setTimeout(res, 500)); } }
    const page = await b.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(n => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => n }); }, PARTS);
    await page.goto(`http://localhost:${SITE_PORT}/`, { waitUntil: 'networkidle' });
    const res = await page.evaluate(async ([pl, parts, plant]) => {
      const c = await window.__solverHarness(), opts = plant === 'grid' ? { points: 44 } : {};
      const key = await c.keyOf(window.__solverEngine, pl, opts), t = performance.now();
      const job = c.startSolve(pl, { ...opts, key, parts });
      const done = await job.done, secs = (performance.now() - t) / 1000, dg = await job.ask('digest');
      job.close();
      return { secs, parts: done.parts, isolated: crossOriginIsolated, digest: dg.digest, values: dg.values, points: done.meta && done.meta.points };
    }, [plan, PARTS, PLANT]);
    console.log(`  the page: solved in ${res.secs.toFixed(1)} s, split ${res.parts} ways, ${res.isolated ? 'cross-origin isolated' : 'not isolated'}, ${res.values} values, digest ${res.digest.slice(0, 16)}`);
    ok(`the site as it ships solves S116 at ${APP_POINTS} wealth points, its tables Node's bit for bit`, up && res.digest === nodeDigest && res.values === size.values,
      `${res.digest.slice(0, 16)} against Node's ${nodeDigest.slice(0, 16)}; ${res.values} values against ${size.values}`);
    ok('the times recorded', res.secs > 0 && nodeSecs > 0, `the page ${res.secs.toFixed(1)} s split ${res.parts} ways, Node ${nodeSecs.toFixed(1)} s on one core`);
    ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  } finally { if (server) server.kill(); await b.close(); rmSync(OUT, { recursive: true, force: true }); }
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
