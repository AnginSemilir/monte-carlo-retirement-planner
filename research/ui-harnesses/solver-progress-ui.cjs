/*
 * PART C PHASE 7: THE SOLVER'S PLUMBING IN THE BUILT SITE (research/solver/PHASE-7.md step 7a). REQUIRED.
 *
 * The switch (`const SOLVER = false` in src/App.jsx) is off, so the app must be the app of today: its first load fetches no
 * solver code and nothing on the page solves. The plumbing behind it is reached through the lazy chunk's one way in
 * (window.__solverHarness, src/useSolver.js), and checked against Node on the same household and settings:
 *   - a solve in the page's worker reports its progress, each phase rising year by year to its end;
 *   - its tables are Node's bit for bit (src/solverDigest.js, the same SHA-256 fingerprint in both);
 *   - the solved plan, simulated by the engine in the worker that owns the tables, gives Node's statistics exactly;
 *   - a cancelled solve stops at once and says so;
 *   - the page is cross-origin isolated (the preview server's headers, vite.config.js), and a solve split across two
 *     workers (src/solverPool.js) gives the same tables as the whole one;
 *   - Phase 7b: the solve is stored under its key (src/solverKey.js, src/solverCache.js); after a reload the same key restores
 *     it, in a fraction of the solve's time, with Node's tables and simulation; a pound more of spending target is another key,
 *     and solves afresh.
 * S126 from the research library (never anybody's own plan) at 4 wealth points and a light lattice, so it runs in minutes.
 *
 *   node research/ui-harnesses/solver-progress-ui.cjs [port]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync } = require('node:child_process');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const PORT = process.argv[2] || '4173';
const ROOT = join(__dirname, '../..');
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
const OPTS = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const SIM = { trials: 300, seed: 99001 };
/* within each pass and phase, done must run 1, 2, ..., total */
const progressOk = calls => {
  const by = new Map();
  for (const c of calls) { const k = `${c.pass || ''}|${c.phase}`; if (!by.has(k)) by.set(k, []); by.get(k).push(c); }
  return by.size > 0 && [...by.values()].every(s => s.every((c, i) => c.done === i + 1 && c.total === s[0].total) && s[s.length - 1].done === s[0].total);
};

(async () => {
  // Node's answer: the engine slice rebuilt from this App.jsx, the same household, settings and paths
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), M = await load('src/solver/model.js'), { withTable } = await load('src/solver/bridge.js');
  const { solveForApp } = await load('src/solverApp.js'), D = await load('src/solverDigest.js');
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const plan = buildScenarios().find(s => s.id === 'S126').plan;
  const t0 = Date.now(), r = solveForApp(E, M, plan, OPTS), nodeSecs = (Date.now() - t0) / 1000;
  const A = D.tablesOf(r), nodeDigest = await D.digestOf(A);
  const nodeStats = E.monteCarlo(E.buildContext(withTable(r.m.ctx.plan, r)), SIM);
  console.log(`  Node: S126 solved in ${nodeSecs.toFixed(1)} s, ${A.length} arrays, digest ${nodeDigest.slice(0, 16)}; survival ${nodeStats.successRate}`);

  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const urls = []; p.on('request', q => urls.push(q.url()));
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const solverUrls = urls.filter(u => /solver(Client|Worker)/.test(u));
  ok('with the switch off, the first load fetches no solver code', solverUrls.length === 0, solverUrls.join(', ') || `${urls.length} requests`);
  ok('the full planner renders', await p.evaluate(() => /Plan Inputs/.test(document.body.innerText)));

  const whole = await p.evaluate(async ({ plan, opts, sim }) => {
    const c = await window.__solverHarness(), prog = [], t0 = performance.now(), key = await c.keyOf(window.__solverEngine, plan, opts);
    let storedOk; const stored = new Promise(res => { storedOk = res; });
    const job = c.startSolve(plan, { ...opts, key, parts: 1, onProgress: x => prog.push(x), onStored: storedOk });
    const done = await job.done, secs = (performance.now() - t0) / 1000;
    const dg = await job.ask('digest'), st = await job.ask('simulate', sim), wasStored = await stored;
    job.close();
    return { done, secs, dg, stats: st.stats, prog, key, wasStored, isolated: self.crossOriginIsolated, canSplit: c.canSplit() };
  }, { plan, opts: OPTS, sim: SIM });
  const phases = [...new Set(whole.prog.map(x => x.phase))];
  ok('the solve reports its progress, each phase rising year by year to its end', progressOk(whole.prog) && phases.includes('years'),
    `${whole.prog.length} reports, phases ${phases.join(', ')}; solved in ${whole.secs.toFixed(1)} s in the page, ${nodeSecs.toFixed(1)} s in Node`);
  ok("the page's tables are Node's bit for bit", whole.dg.digest === nodeDigest && whole.dg.values > 0, `${whole.dg.values} values, ${whole.dg.digest.slice(0, 16)} against ${nodeDigest.slice(0, 16)}`);
  ok("the solved plan's simulation is Node's exactly", JSON.stringify(whole.stats) === JSON.stringify(nodeStats), `survival ${whole.stats.successRate} against ${nodeStats.successRate} on ${SIM.trials} paths`);

  const cancel = await p.evaluate(async ({ plan, opts }) => {
    const c = await window.__solverHarness();
    let first = null;
    const job = c.startSolve(plan, { ...opts, parts: 1, onProgress: () => { if (!first) first = performance.now(); } });
    while (!first) await new Promise(res => setTimeout(res, 20));
    job.cancel();
    const t = performance.now();
    try { await job.done; return { ok: false, why: 'resolved' }; } catch (e) { return { ok: e.message === 'cancelled', why: e.message, ms: performance.now() - t }; }
  }, { plan, opts: OPTS });
  // Phase 7b: stored under its key, restored after a reload
  ok('the solve is stored under its key', whole.wasStored === true && whole.done.restored === false && /^[0-9a-f]{64}$/.test(whole.key), `key ${whole.key.slice(0, 16)}, stored ${whole.wasStored}`);
  await p.reload({ waitUntil: 'networkidle' });
  const again = await p.evaluate(async ({ plan, opts, sim }) => {
    const c = await window.__solverHarness(), key = await c.keyOf(window.__solverEngine, plan, opts), t0 = performance.now();
    const job = c.startSolve(plan, { ...opts, key });
    const done = await job.done, secs = (performance.now() - t0) / 1000, dg = await job.ask('digest'), st = await job.ask('simulate', sim);
    job.close();
    const edited = { ...plan, spending: { ...plan.spending, targetSpend: Number(plan.spending.targetSpend) + 1 } }, k2 = await c.keyOf(window.__solverEngine, edited, opts);
    const j2 = c.startSolve(edited, { ...opts, key: k2, parts: 1 });
    let first = false; const d2 = await Promise.race([j2.done.then(d => d), new Promise(res => setTimeout(() => { first = true; res(null); }, 4000))]);
    j2.cancel(); j2.close();
    return { key, done, secs, dg, stats: st.stats, k2, editedRestored: d2 ? d2.restored : false, editedStillSolving: first };
  }, { plan, opts: OPTS, sim: SIM });
  ok('after a reload the same key restores the solve, quicker than solving it', again.key === whole.key && again.done.restored === true && again.secs < whole.secs,
    `restored in ${again.secs.toFixed(1)} s against ${whole.secs.toFixed(1)} s solved`);
  ok("the restored tables and simulation are Node's", again.dg.digest === nodeDigest && JSON.stringify(again.stats) === JSON.stringify(nodeStats), `${again.dg.digest.slice(0, 16)}; survival ${again.stats.successRate}`);
  ok('a pound more of spending target is another key, and solves afresh', again.k2 !== again.key && !again.editedRestored && again.editedStillSolving, `key ${again.k2.slice(0, 16)}; still solving after 4 s`);

  ok('a cancelled solve stops at once and says so', cancel.ok && cancel.ms < 1000, `${cancel.why} after ${cancel.ms === undefined ? '?' : cancel.ms.toFixed(0)} ms`);

  ok('the preview page is cross-origin isolated, so a solve can split', whole.isolated && whole.canSplit, `crossOriginIsolated ${whole.isolated}, canSplit ${whole.canSplit}`);
  if (whole.isolated && whole.canSplit) {
    const split = await p.evaluate(async ({ plan, opts }) => {
      const c = await window.__solverHarness(), t0 = performance.now();
      const job = c.startSolve(plan, { ...opts, parts: 2 });
      const done = await job.done, secs = (performance.now() - t0) / 1000, dg = await job.ask('digest');
      job.close();
      return { done, secs, dg };
    }, { plan, opts: OPTS });
    ok('a solve split across two workers gives the whole solve\'s tables', split.done.parts === 2 && split.done.meta.e2 && split.done.meta.e2.parts === 2 && split.dg.digest === nodeDigest,
      `${split.done.parts} parts, ${split.secs.toFixed(1)} s, ${split.dg.digest.slice(0, 16)}`);
  }
  ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(`  FAIL  the harness threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
