/*
 * PART C PHASE 10: THE PAGE'S ISOLATION WHERE THE HOST SENDS NO HEADERS (the launch plan's B5; public/coi-sw.js,
 * src/isolation.js). REQUIRED.
 *
 * 1. The site as built, the classic planner (the switch-off app bit for bit, Phase 12): no service worker registered, no
 *    isolation code fetched.
 * 2. A harness's build at light settings (vite.config.js solver-harness), opted in to the new planner (only it solves; step U), served the
 *    way GitHub Pages serves it, with no headers at all
 *    (this harness's own static server), a single household from the research library:
 *      - the first load registers the worker and reloads once; then the page is cross-origin isolated;
 *      - a plan saved before the worker existed still loads (the plan seeded before the first load is the plan on screen);
 *      - in the isolated page a solve split across workers gives the whole solve's tables, Node's bit for bit.
 * 3. With service workers unavailable (blocked for the context): the page is not isolated, and the solve runs whole in one
 *    worker, the same tables.
 * 4. The switch file (`coi-off` served beside the worker) while the worker controls the page: on the next load the page
 *    unregisters it and reloads once without it, no longer isolated; while the file stays, nothing registers again.
 *
 *   node research/ui-harnesses/solver-isolation-ui.cjs [port]      (the headerless server on port + 9)
 *   ISOLATION_PLANT=nosw ...   the worker's script left out of the site: the isolation and the split must fail
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync } = require('node:child_process');
const { join, extname, normalize } = require('node:path');
const { mkdtempSync, rmSync, existsSync, statSync, createReadStream } = require('node:fs');
const { tmpdir } = require('node:os');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const PORT = process.argv[2] || '4173', BARE_PORT = Number(PORT) + 9;
const ROOT = join(__dirname, '../..');
const STORE = 'rp_plan_full_v28';
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
const VITE = join(ROOT, 'node_modules/vite/bin/vite.js');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.txt': 'text/plain' };

/* GitHub Pages as it serves the site: the files and their types, no COOP, no COEP, nothing else; and the switch file on demand */
function bareServer(dir) {
  const state = { off: false };
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u.endsWith('/')) u += 'index.html';
    if (u === '/coi-off') { if (state.off) { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('off'); } else { res.writeHead(404); res.end(); } return; }
    const f = normalize(join(dir, u));
    if (!f.startsWith(dir) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' });
    createReadStream(f).pipe(res);
  });
  return { server, state };
}
const seed = async (ctx, plan) => ctx.addInitScript(([k, pl]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); localStorage.setItem('rp_planner', 'new'); sessionStorage.setItem('seeded', '1'); } }, [STORE, plan]);
/* the page's isolation, read across the reload the worker asks for */
async function isolatedWithin(p, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await p.evaluate(() => window.crossOriginIsolated === true)) return true; } catch (e) { /* the page is reloading */ }
    await p.waitForTimeout(300);
  }
  return false;
}
const state = p => p.evaluate(async () => ({ isolated: window.crossOriginIsolated === true, regs: (await navigator.serviceWorker.getRegistrations()).length, controlled: !!navigator.serviceWorker.controller, tried: sessionStorage.getItem('rp_coi_reloaded') }));
/* a solve in the page through the solver's own client (the progress harness's way in), its parts and its tables' digest */
const solveIn = (p, plan, opts, parts) => p.evaluate(async ({ plan, opts, parts }) => {
  const c = await window.__solverHarness(), job = c.startSolve(plan, { ...opts, ...(parts ? { parts } : {}) });
  const done = await job.done, dg = await job.ask('digest'); job.close();
  return { parts: done.parts, digest: dg.digest, values: dg.values, canSplit: c.canSplit() };
}, { plan, opts, parts });

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), M = await load('src/solver/model.js'), D = await load('src/solverDigest.js');
  const { solveForApp } = await load('src/solverApp.js'), { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const plan = buildScenarios().find(s => s.id === 'S126').plan;
  const nodeDigest = await D.digestOf(D.tablesOf(solveForApp(E, M, plan, LIGHT)));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // 1. the site as built: the classic planner
  { const ctx = await b.newContext(), p = await ctx.newPage(), urls = [], errs = [];
    p.on('request', q => urls.push(q.url())); p.on('pageerror', e => errs.push(e.message));
    await seed(ctx, plan);
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    const s = await state(p), got = urls.filter(u => /isolation|coi-sw/.test(u));
    ok('the classic planner: no service worker registered, no isolation code fetched', s.regs === 0 && got.length === 0, `${s.regs} registrations; ${got.join(', ') || 'none fetched'}`);
    ok('the classic planner: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close(); }

  const OUT = mkdtempSync(join(tmpdir(), 'solver-isolation-'));
  const { server, state: srv } = bareServer(OUT);
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, SOLVER_HARNESS: '1', SOLVER_HARNESS_OPTS: JSON.stringify(LIGHT) } });
    // ISOLATION_PLANT=nosw (a planted fault, run once by hand): the worker's script left out of the site served
    if (process.env.ISOLATION_PLANT === 'nosw') rmSync(join(OUT, 'coi-sw.js'));
    await new Promise(res => server.listen(BARE_PORT, res));
    const head = await fetch(`http://localhost:${BARE_PORT}/`);
    ok('the switch-on build served with no isolation headers, as GitHub Pages serves it', head.ok && !head.headers.get('cross-origin-embedder-policy') && !head.headers.get('cross-origin-opener-policy'), `port ${BARE_PORT}`);

    // 2. the first load, the worker, the reload
    { const ctx = await b.newContext(), p = await ctx.newPage(), errs = [], navs = [];
      p.on('pageerror', e => errs.push(e.message));
      p.on('framenavigated', f => { if (f === p.mainFrame()) navs.push(f.url()); });
      await seed(ctx, plan);
      await p.goto(`http://localhost:${BARE_PORT}/`, { waitUntil: 'load' });
      const iso = await isolatedWithin(p, 30000), s = await state(p);
      ok('switch on, no headers: the first load registers the worker and reloads once; then the page is cross-origin isolated', iso && s.regs === 1 && s.controlled && s.tried === '1' && navs.length === 2, `${navs.length} loads, ${s.regs} registration, isolated ${s.isolated}`);
      const savedPlan = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE);
      // the page isolated is the reloaded document, not yet the app drawn in it: wait for the app (2 Nov: read at once, it
      // failed once in the gate with the plan in place, the tabs not yet on the page), the new planner's place on the page (Phase
      // 12: it opts in, and since the rename pass the new planner names no classic tab, which this check had waited for)
      const drawn = await p.waitForFunction(() => !!document.querySelector('[data-place]'), null, { timeout: 15000 }).then(() => true, () => false);
      ok('a plan saved before the worker existed still loads', savedPlan && savedPlan.spending && Number(savedPlan.spending.targetSpend) === Number(plan.spending.targetSpend) && drawn, `target ${savedPlan && savedPlan.spending && savedPlan.spending.targetSpend}, the app drawn ${drawn}`);
      const split = await solveIn(p, plan, LIGHT, 2);
      ok('in the isolated page a solve split across two workers gives the whole solve\'s tables, Node\'s bit for bit', split.canSplit && split.parts === 2 && split.digest === nodeDigest, `${split.parts} parts, ${split.values} values, ${split.digest.slice(0, 16)} against ${nodeDigest.slice(0, 16)}`);
      ok('switch on: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

      // 4. the switch file, served while the worker controls the page (the live site's case): on the next load the page
      // unregisters the worker and reloads once without it
      srv.off = true;
      const before = navs.length;
      await p.reload({ waitUntil: 'load' });
      await p.waitForTimeout(4000);
      const s2 = await state(p);
      ok('the switch file served: the worker unregistered, the page reloaded once without it, no longer isolated', !s2.isolated && s2.regs === 0 && !s2.controlled && navs.length - before === 2, `${navs.length - before} loads after the switch, ${s2.regs} registrations, isolated ${s2.isolated}`);
      await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(2000);
      const s3 = await state(p);
      ok('the switch file still served: nothing registers again, and no further reload of its own', s3.regs === 0 && !s3.isolated && navs.length - before === 3, `${navs.length - before} loads, ${s3.regs} registrations`);
      srv.off = false;
      await ctx.close(); }

    // 3. service workers unavailable
    { const ctx = await b.newContext({ serviceWorkers: 'block' }), p = await ctx.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await seed(ctx, plan);
      await p.goto(`http://localhost:${BARE_PORT}/`, { waitUntil: 'load' }); await p.waitForTimeout(3000);
      const s = await state(p).catch(() => ({ isolated: false, regs: 0 }));
      const whole = await solveIn(p, plan, LIGHT, 2);
      ok('service workers blocked: the page is not isolated, and the solve runs whole in one worker, the same tables', !s.isolated && !whole.canSplit && whole.parts === 1 && whole.digest === nodeDigest, `isolated ${s.isolated}, ${whole.parts} part, ${whole.digest.slice(0, 16)}`);
      ok('service workers blocked: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await ctx.close(); }
  } finally {
    server.close();
    rmSync(OUT, { recursive: true, force: true });
  }
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(`  FAIL  the harness threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
