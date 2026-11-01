/*
 * PART C PHASE 8: THE CONFIG TAB UNDER THE SOLVER'S SWITCH (research/solver/PHASE-8.md). REQUIRED.
 *
 * 1. The site as built (the switch off, `const SOLVER = false` in src/App.jsx): the Config tab as today, its policy search,
 *    policy, drawdown, lookahead, harvest and playbook all there, neither solver card, and no solver code fetched.
 * 2. A preview build beside it with the switch on (vite.config.js solver-preview: SOLVER_PREVIEW=1, this harness's light
 *    settings), a single household (S126 from the research library, never anybody's own plan):
 *      - the policy fields hidden, the guardrails marked as the plan's own, both solver cards shown;
 *      - each lever and lock writes plan.solver (or the minimum pot) in the saved plan, and the solve's key on the page
 *        (data-solve-key) moves to Node's key for that saved plan (src/solverKey.js);
 *      - the plan on screen solves, and after the last change re-solves to solved under the last key;
 *      - the hidden policy fields are unchanged in the saved plan.
 * 2b. The preview build on a phone (the launch plan's B10): the solve waits for "Solve my plan", then solves.
 * 3. The preview build, a couple (D42): the tab as today with the solver's line, no solver card, and nothing solved.
 *
 *   node research/ui-harnesses/solver-config-ui.cjs [port]      (the preview build is served on port + 7)
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const PORT = process.argv[2] || '4173', PREVIEW_PORT = String(Number(PORT) + 7);
const ROOT = join(__dirname, '../..');
const STORE = 'rp_plan_full_v28';
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
const SOLVER_URL = /SolverConfig|solverClient|solverWorker/;
const VITE = join(ROOT, 'node_modules/vite/bin/vite.js');

async function open(b, port, plan) {
  const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = [], urls = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', q => urls.push(q.url()));
  await p.addInitScript(([k, pl]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); sessionStorage.setItem('seeded', '1'); } }, [STORE, plan]);
  await p.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  await p.evaluate(() => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(b => b.textContent.includes('Config & Assumptions')); if (x) x.click(); });
  await p.waitForTimeout(1200);
  return { p, errs, urls };
}
const saved = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE);
/* what the Config tab shows of the policy fields and the solver's cards */
const tabState = p => p.evaluate(() => ({
  search: [...document.querySelectorAll('button')].some(b => /Auto-pick best policy/.test(b.textContent)),
  policy: !!document.querySelector('select[aria-label="Decumulation policy"]'),
  drawdown: !!document.querySelector('select[aria-label="Pension drawdown strategy"]'),
  lookahead: !!document.querySelector('#config-lookahead-years'),
  harvest: !!document.querySelector('select[aria-label="Harvest ceiling"]'),
  playbook: [...document.querySelectorAll('summary')].some(s => /How to actually follow this policy/.test(s.textContent)),
  priorities: !!document.querySelector('[data-priority-list]'),
  guardrails: !!document.querySelector('[data-guardrails-toggle]'),
  guardOwn: !!document.querySelector('[data-guardrails-own]'),
  aims: !!document.querySelector('[data-solver-aims]'),
  locks: !!document.querySelector('[data-solver-locks]'),
  couple: !!document.querySelector('[data-solver-couple]'),
  note: !!document.querySelector('[data-solver-rules-note]')
}));
const POLICY = ['search', 'policy', 'drawdown', 'lookahead', 'harvest', 'playbook'];

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), { solveKey } = await load('src/solverKey.js');
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const all = buildScenarios(), single = all.find(s => s.id === 'S126').plan;
  const couple = all.find(s => E.normalizePlan(s.plan).demographics.planningMode === 'couple');
  const nodeKey = plan => solveKey(E, plan, LIGHT);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // 1. the site as built: the switch off
  { const { p, errs, urls } = await open(b, PORT, single), s = await tabState(p);
    ok('switch off: the Config tab keeps its policy search, policy, drawdown, lookahead, harvest and playbook', POLICY.every(k => s[k]), JSON.stringify(s));
    ok('switch off: neither solver card nor the solver\'s line, the guardrails unmarked', !s.aims && !s.locks && !s.couple && !s.note && s.guardrails && !s.guardOwn);
    const got = urls.filter(u => SOLVER_URL.test(u));
    ok('switch off: no solver code fetched', got.length === 0, got.join(', ') || `${urls.length} requests`);
    ok('switch off: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await p.close(); }

  // 2. the preview build, the switch on
  const OUT = mkdtempSync(join(tmpdir(), 'solver-preview-'));
  let server = null;
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, SOLVER_PREVIEW: '1', SOLVER_PREVIEW_OPTS: JSON.stringify(LIGHT) } });
    // vite itself, not through npx, so the one child is the server and stopping it stops the server
    server = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT, '--port', PREVIEW_PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    let up = false;
    for (let i = 0; i < 40 && !up; i++) { try { const r = await fetch(`http://localhost:${PREVIEW_PORT}/`); up = r.ok; } catch (e) { await new Promise(res => setTimeout(res, 500)); } }
    ok('the preview build (the switch on) is served', up, `port ${PREVIEW_PORT}`);

    const { p, errs, urls } = await open(b, PREVIEW_PORT, single), s = await tabState(p);
    ok('switch on, a single household: the policy fields hidden', POLICY.every(k => !s[k]) && !s.priorities, JSON.stringify(s));
    ok('switch on: both solver cards shown, the guardrails marked as the plan\'s own, the tab\'s note', s.aims && s.locks && !s.couple && s.guardrails && s.guardOwn && s.note);
    const before = await saved(p);
    const KEEP = pl => JSON.stringify([pl.spending.decumulationPolicy, pl.spending.drawdownStrategy, pl.spending.priorities, pl.config.lookaheadYears, pl.config.harvestPersonalAllowance, pl.config.harvestCeiling, pl.config.guardrails]);

    // the plan on screen solves
    await p.waitForSelector('[data-solve-state="solved"]', { timeout: 600000 });
    const k0 = await p.getAttribute('[data-solve-state]', 'data-solve-key'), n0 = await nodeKey(await saved(p));
    ok('the plan on screen solves, under Node\'s key for the saved plan', k0 === n0, `${k0.slice(0, 16)} against ${n0.slice(0, 16)}`);

    // each lever and lock: the saved plan, then the key
    const STEPS = [
      ['the dial at 3', () => p.click('[data-solver-choice="cuts"] button[data-value="3"]'), pl => pl.solver && pl.solver.aims && pl.solver.aims.cuts === 3],
      ['the estate lower', () => p.click('[data-solver-choice="estate"] button[data-value="lower"]'), pl => pl.solver.aims.estate === 'lower'],
      ['raises blocked', () => p.click('[data-solver-choice="raises"] button[data-value="blocked"]'), pl => pl.solver.aims.raises === 'blocked'],
      ['consent withdrawn', () => p.uncheck('[data-solver-consent]'), pl => pl.solver.aims.riskConsent === false],
      ['the minimum pot at 40,000', () => p.fill('[data-solver-minpot]', '40000'), pl => Number(pl.config.solvencyFloor) === 40000],
      ['no pension before 63', () => p.fill('[data-solver-lock="pensionBefore"]', '63'), pl => pl.solver.locks && pl.solver.locks.pensionBefore === 63],
      ['the pension\'s tier at most Medium/Low', () => p.selectOption('[data-solver-lock="tier-pen"]', 'Medium/Low Risk'), pl => pl.solver.locks.tierCeiling.pen === 'Medium/Low Risk'],
      ['the lump sum never', () => p.selectOption('[data-solver-lock="lumpSum"]', 'never'), pl => pl.solver.locks.lumpSum === 'never']
    ];
    let lastKey = k0;
    for (const [name, act, wrote] of STEPS) {
      await act();
      let pl = null;
      for (let i = 0; i < 40; i++) { pl = await saved(p); if (wrote(pl)) break; await p.waitForTimeout(250); }
      const want = await nodeKey(pl);
      let got = null;
      for (let i = 0; i < 60; i++) { got = await p.getAttribute('[data-solve-state]', 'data-solve-key'); if (got === want) break; await p.waitForTimeout(250); }
      ok(`${name}: the saved plan carries it, and the solve's key moves to Node's for it`, wrote(pl) && got === want && want !== lastKey, `${(got || '').slice(0, 16)} against ${want.slice(0, 16)}`);
      lastKey = want;
    }
    await p.waitForFunction(k => { const e = document.querySelector('[data-solve-state]'); return e && e.dataset.solveState === 'solved' && e.dataset.solveKey === k; }, lastKey, { timeout: 600000 });
    ok('after the last change the plan re-solves to solved, under the last key', true, lastKey.slice(0, 16));
    const after = await saved(p);
    ok('the hidden policy fields are unchanged in the saved plan', KEEP(after) === KEEP(before), KEEP(after));
    ok('switch on: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    ok('switch on: the solver cards came as their own chunk', urls.some(u => /SolverConfig/.test(u)));
    await p.close();

    // 2b. a phone (the launch plan's B10: the phone solves on request): no solver worker until asked, then the plan solves
    { const { devices } = require('/tmp/node_modules/playwright');
      const ctx = await b.newContext({ ...devices['Pixel 7'] }), q = await ctx.newPage(), urls = [], errs = [];
      q.on('request', r => urls.push(r.url())); q.on('pageerror', e => errs.push(e.message));
      await q.addInitScript(([k, pl]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); sessionStorage.setItem('seeded', '1'); } }, [STORE, single]);
      await q.goto(`http://localhost:${PREVIEW_PORT}/`, { waitUntil: 'networkidle' });
      await q.evaluate(() => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(t => /Config/.test(t.textContent)); if (x) x.click(); });
      await q.waitForTimeout(3000);
      const early = urls.filter(u => /solverWorker/.test(u)), btn = await q.$('[data-solve-request]');
      ok('a phone: the solver waits for its request (no solver worker started, a "Solve my plan" button)', early.length === 0 && !!btn, `${early.length} solver workers; button ${!!btn}`);
      if (btn) {
        await btn.click();
        let solved = true;
        try { await q.waitForSelector('[data-solve-state="solved"]', { timeout: 600000 }); } catch (e) { solved = false; }
        ok('a phone: asked, the plan solves', solved && urls.some(u => /solverWorker/.test(u)));
      }
      ok('a phone: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await ctx.close(); }

    // 3. a couple under the switch
    if (!couple) ok('a couple in the library to test with', false);
    else {
      const c = await open(b, PREVIEW_PORT, couple.plan), cs = await tabState(c.p);
      ok(`switch on, a couple (${couple.id}): the tab as today, with the solver's line and no solver card`, POLICY.every(k => cs[k]) && cs.couple && !cs.aims && !cs.locks && !cs.guardOwn, JSON.stringify(cs));
      await c.p.waitForTimeout(3000);
      const got = c.urls.filter(u => /solverClient|solverWorker/.test(u));
      ok('a couple: nothing solved, no solver code fetched', got.length === 0, got.join(', ') || 'none');
      ok('a couple: no page errors', c.errs.length === 0, c.errs.slice(0, 2).join(' | '));
      await c.p.close();
    }
  } finally {
    if (server) server.kill();
    rmSync(OUT, { recursive: true, force: true });
  }
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(`  FAIL  the harness threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
