/*
 * P0, THE PROFILE, ITS BROWSER HALF (the launch plan's step P: "in the container's Chromium, one worker and split").
 * EXPLORATORY: a measurement, deciding nothing; a diagnostic, not in run-all's lists. research/solver/profile-solve.mjs is
 * its Node half (where the solve's time goes, by part and by function, on V8).
 *
 * Builds the site as it is into a scratch folder, serves it with the preview server's isolation headers, and drives the
 * solver through the page's own client (window.__solverHarness, src/solverClient.js), as solver-progress-ui.cjs does, at the
 * app's settings (45 points, the candidate), on gate 5's four households (bridge 4, S126, S370, share 0.50), S090 and S188
 * with its pension one tier lower (profile-solve.mjs's thin plan, which the 'auto' rule solves twice),
 * each with its floor at 80% of its target:
 *   1. one worker: from the ask to the worker's first report (its start-up and first step), the reference's build and the
 *      backward pass by the solve's own reports, the whole solve, and the store (IndexedDB) after it;
 *   2. after a reload, the same key: the restore, from the ask to the restored tables;
 *   3. split four ways (the page isolated): the solve;
 *   4. the engine's simulation of the solved plan in the worker that owns it (300 paths), ms a path.
 *   node research/ui-harnesses/profile-browser.cjs [port] [id ...]     (port 4174; the six households)
 * Run with nothing else on the machine.
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const argv = process.argv.slice(2), PORT = /^\d+$/.test(argv[0] || '') ? argv.shift() : '4174';
const ROOT = join(__dirname, '../..');
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
const IDS = argv.length ? argv : ['bridge 4', 'S126', 'S370', 'share 0.50', 'S090', 'S188 pension one tier down'];
const SIM = { trials: 300, seed: 12345 };
const f1 = x => x.toFixed(1);

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  // perf-step.mjs's households (audit-e2x.mjs's variant(), copied)
  const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
  const s126 = all.find(s => s.id === 'S126'), LIQ = /^S&S ISA|^Other Investments|^Cash/;
  const variant = (name, { a0 = 0.85, bridge = 2 } = {}) => {
    const p = JSON.parse(JSON.stringify(s126.plan));
    const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
    p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) }; return a; });
    const age = E.num(p.demographics.privatePensionAge, 58) - bridge;
    p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
    return { id: name, plan: p };
  };
  const BUILT = { 'bridge 4': { bridge: 4 }, 'share 0.50': { a0: 0.5 } };
  // profile-solve.mjs's thin plan with a tier above: S188 with its pension one tier lower, so the 'auto' rule solves it twice
  const s188down = () => { const p = JSON.parse(JSON.stringify(all.find(s => s.id === 'S188').plan)); p.accounts = p.accounts.map(a => (/^Pensions/.test(a.category) ? { ...a, risk: 'Medium/High Risk' } : a)); return { id: 'S188 pension one tier down', plan: p }; };
  const planOf = id => { const c = id === 'S188 pension one tier down' ? s188down() : BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id); const p = c.plan; return E.normalizePlan({ ...p, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }); };

  const out = mkdtempSync(join(tmpdir(), 'profile-browser-'));
  execFileSync(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  const server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--outDir', out, '--port', PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(res => setTimeout(res, 3000));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    const env = await p.evaluate(() => ({ isolated: self.crossOriginIsolated, cores: navigator.hardwareConcurrency, ua: navigator.userAgent.match(/Chrome\/[\d.]+/)[0] }));
    console.log(`P0, THE PROFILE, ITS BROWSER HALF (step P; EXPLORATORY): ${IDS.join(', ')}; the floor at 80%; the app's settings; ${env.ua}, ${env.cores} cores, isolated ${env.isolated}`);
    for (const id of IDS) {
      const plan = planOf(id);
      // 1. one worker
      const whole = await p.evaluate(async ({ plan, sim }) => {
        const c = await window.__solverHarness(), prog = [], key = await c.keyOf(window.__solverEngine, plan, {});
        let storedAt = null, storedOk; const stored = new Promise(res => { storedOk = res; });
        const t0 = performance.now();
        const job = c.startSolve(plan, { key, parts: 1, onProgress: x => prog.push({ ...x, at: performance.now() - t0 }), onStored: s => { storedAt = performance.now() - t0; storedOk(s); } });
        const done = await job.done, secs = (performance.now() - t0) / 1000;
        const wasStored = await stored, storeS = (storedAt / 1000) - secs;
        const ts = performance.now(), st = await job.ask('simulate', sim), simMs = (performance.now() - ts) / sim.trials;
        job.close();
        return { secs, prog, wasStored, storeS, simMs, surv: st.stats.successRate, meta: { points: done.meta && done.meta.points, riskAbove: done.meta && done.meta.riskAbove ? String(done.meta.riskAbove.decision || '') : '' } };
      }, { plan, sim: SIM });
      const first = whole.prog.length ? whole.prog[0].at / 1000 : NaN;
      const passes = [...new Set(whole.prog.map(x => x.pass || 1))];
      const lines = passes.map(pass => {
        const ms = whole.prog.filter(x => (x.pass || 1) === pass), ref = ms.filter(x => x.phase === 'reference'), yrs = ms.filter(x => x.phase === 'years');
        const refEnd = ref.length ? ref[ref.length - 1].at : (ms[0] ? ms[0].at : 0), yrEnd = yrs.length ? yrs[yrs.length - 1].at : refEnd;
        const yrT = yrs.map((x, i) => x.at - (i ? yrs[i - 1].at : refEnd)).sort((a, b) => a - b);
        return `pass ${pass}: the reference's build to ${f1(refEnd / 1000)} s, the backward pass ${f1((yrEnd - refEnd) / 1000)} s over ${yrs.length} years (a year ${(yrT[0] / 1000).toFixed(2)} to ${(yrT[yrT.length - 1] / 1000).toFixed(2)} s)`;
      });
      console.log(`\n== ${id}: one worker: the first report ${first.toFixed(2)} s after the ask; ${lines.join('; ')}; the whole solve ${f1(whole.secs)} s; stored ${whole.wasStored && whole.wasStored.stored !== undefined ? whole.wasStored.stored : whole.wasStored} ${f1(whole.storeS)} s after; the simulation ${whole.simMs.toFixed(1)} ms a path (survival ${whole.surv}); the tier above ${whole.meta.riskAbove || 'none'}`);
      // 2. after a reload, the restore
      await p.reload({ waitUntil: 'networkidle' });
      const again = await p.evaluate(async ({ plan }) => {
        const c = await window.__solverHarness(), key = await c.keyOf(window.__solverEngine, plan, {}), t0 = performance.now();
        const job = c.startSolve(plan, { key, parts: 1 });
        const done = await job.done, secs = (performance.now() - t0) / 1000;
        job.close();
        return { secs, restored: done.restored };
      }, { plan });
      // 3. split four ways
      const split = env.isolated ? await p.evaluate(async ({ plan }) => {
        const c = await window.__solverHarness(), t0 = performance.now();
        const job = c.startSolve(plan, { parts: 4 });
        const done = await job.done, secs = (performance.now() - t0) / 1000;
        job.close();
        return { secs, parts: done.parts };
      }, { plan }) : null;
      console.log(`   after a reload: restored ${again.restored} in ${f1(again.secs)} s (${(100 * again.secs / whole.secs).toFixed(1)}% of the solve); split four ways: ${split ? `${split.parts} parts, ${f1(split.secs)} s (x${(whole.secs / split.secs).toFixed(2)} the one worker's speed)` : 'not isolated'}`);
      await p.evaluate(() => new Promise(res => { const q = indexedDB.deleteDatabase('rp-solver'); q.onsuccess = q.onerror = q.onblocked = () => res(); }));
    }
    console.log(errs.length ? `\npage errors: ${errs.slice(0, 3).join(' | ')}` : '\nno page errors');
  } finally {
    await b.close();
    server.kill();
    rmSync(out, { recursive: true, force: true });
  }
  console.log('\nEXPLORATORY: a measurement for step P, deciding nothing.');
})().catch(e => { console.log(`the profile threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
