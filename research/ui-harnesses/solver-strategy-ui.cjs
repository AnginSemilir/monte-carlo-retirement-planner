/*
 * PART C PHASE 9: THE STRATEGY TAB UNDER THE SOLVER'S SWITCH (the launch plan section 4; src/SolverStrategy.jsx). REQUIRED.
 *
 * 1. The site as built (the switch off): the Strategy tab is the tournament as today, and no solver code is fetched.
 * 2. A preview build with the switch on at this harness's light settings (vite.config.js solver-preview; the strategy's
 *    steps 200 then 500 paths), a single household from the research library (never anybody's own plan):
 *      - the tab is the solved plan, not the tournament, and comes as its own chunk;
 *      - its figures, once all its paths are in, are Node's bit for bit (src/solverStrategy.js strategyOf on the saved plan,
 *        solved at the same light settings, on the projection's seed), the headline, the comparison and the raise;
 *      - the words on the card are the wording table's for that case (src/solverWords.js).
 * 3. The wording's four cases (B4), each on a library household that reads so at these settings: starting at the target,
 *    a short dip (the note), a long dip (the full text), never back at target (the full text).
 * 4. A failed solve (the launch plan's F16): the worker planted to fail every question; the tab says so, offers "try again",
 *    and keeps the tournament (the app's rules) below.
 * 5. A couple under the switch (D42): the tournament, with the solver's line.
 *
 *   node research/ui-harnesses/solver-strategy-ui.cjs [port]      (the preview build is served on port + 8)
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const PORT = process.argv[2] || '4173', PREVIEW_PORT = String(Number(PORT) + 8);
const ROOT = join(__dirname, '../..');
const STORE = 'rp_plan_full_v28', SEED = 12345;
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, strategySteps: [200, 500] };
// a household for each of the wording's cases at these settings (research/ui-harnesses' own scan, 1 Nov), the main one first
const CASES = { main: 'S126', atTarget: 'S000', short: 'S162', long: 'S054', never: 'S364' };
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
const VITE = join(ROOT, 'node_modules/vite/bin/vite.js');

async function open(b, port, plan, { plantFail = false } = {}) {
  const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = [], urls = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', q => urls.push(q.url()));
  // the planted failure: every question to the solver's worker answered with an error (no change to the app's code)
  if (plantFail) await p.route(/solverWorker[^/]*\.js/, r => r.fulfill({ contentType: 'text/javascript', body: "self.onmessage = e => self.postMessage({ id: e.data && e.data.id || 0, error: 'planted: the solver failed' });" }));
  await p.addInitScript(([k, pl]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); sessionStorage.setItem('seeded', '1'); } }, [STORE, plan]);
  await p.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  await p.evaluate(() => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(b => /Strategy/.test(b.textContent)); if (x) x.click(); });
  await p.waitForTimeout(1200);
  return { p, errs, urls };
}
const saved = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE);
const tab = p => p.evaluate(() => ({
  tournament: !!document.querySelector('[data-tournament]') || [...document.querySelectorAll('div')].some(d => /Strategy Tournament/.test(d.textContent) && d.children.length < 4),
  strategy: !!document.querySelector('[data-solver-strategy]'),
  couple: !!document.querySelector('[data-solver-couple]'),
  state: (document.querySelector('[data-solver-strategy]') || {}).dataset ? document.querySelector('[data-solver-strategy]').dataset.strategyState : null
}));
const waitDone = (p, ms = 900000) => p.waitForSelector('[data-solver-strategy][data-strategy-state="done"]', { timeout: ms });

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), M = await load('src/solver/model.js');
  const { solveForApp } = await load('src/solverApp.js'), { strategyOf } = await load('src/solverStrategy.js');
  const { headlineWords, explanationWords } = await load('src/solverWords.js');
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const all = buildScenarios(), planOf = id => all.find(s => s.id === id).plan;
  const couple = all.find(s => E.normalizePlan(s.plan).demographics.planningMode === 'couple');
  const fmt = v => E.formatGBP(v);
  const nodeStrategy = pl => strategyOf(E, solveForApp(E, M, pl, LIGHT), pl, { trials: LIGHT.strategySteps[LIGHT.strategySteps.length - 1], seed: SEED });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // 1. the switch off
  { const { p, errs, urls } = await open(b, PORT, planOf(CASES.main)), s = await tab(p);
    ok('switch off: the Strategy tab is the tournament, without the solver\'s view', s.tournament && !s.strategy && !s.couple, JSON.stringify(s));
    const got = urls.filter(u => /SolverStrategy|solverClient|solverWorker/.test(u));
    ok('switch off: no solver code fetched', got.length === 0, got.join(', ') || `${urls.length} requests`);
    ok('switch off: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await p.close(); }

  const OUT = mkdtempSync(join(tmpdir(), 'solver-strategy-'));
  let server = null;
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, SOLVER_PREVIEW: '1', SOLVER_PREVIEW_OPTS: JSON.stringify(LIGHT) } });
    server = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT, '--port', PREVIEW_PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    let up = false;
    for (let i = 0; i < 40 && !up; i++) { try { const r = await fetch(`http://localhost:${PREVIEW_PORT}/`); up = r.ok; } catch (e) { await new Promise(res => setTimeout(res, 500)); } }
    ok('the preview build (the switch on) is served', up, `port ${PREVIEW_PORT}`);

    // 2 and 3: each case's household, the main one checked figure for figure
    for (const [which, id] of Object.entries(CASES)) {
      const { p, errs, urls } = await open(b, PREVIEW_PORT, planOf(id)), s = await tab(p);
      if (which === 'main') ok(`switch on, ${id}: the tab is the solved plan, not the tournament`, s.strategy && !s.tournament && !s.couple, JSON.stringify(s));
      let done = true;
      try { await waitDone(p); } catch (e) { done = false; }
      const figs = done ? JSON.parse(await p.getAttribute('[data-solver-strategy]', 'data-strategy-figures')) : null;
      const text = done ? await p.textContent('[data-solver-strategy]') : '';
      const node = done ? nodeStrategy(await saved(p)) : null;
      if (which === 'main') {
        ok(`${id}: all ${LIGHT.strategySteps[1]} paths in, the figures Node's bit for bit (headline, comparison, raise)`, done && JSON.stringify(figs) === JSON.stringify(node), done ? `${figs.headline.case}, start ${figs.headline.startLevel}%, survival ${figs.headline.survival.toFixed(1)}% (Node ${node.headline.survival.toFixed(1)}%), yours ${figs.compare.yours.survival.toFixed(1)}%` : 'not done');
        ok(`${id}: the tab came as its own chunk`, urls.some(u => /SolverStrategy/.test(u)));
      }
      if (done) {
        const w = headlineWords(figs.headline, fmt), x = explanationWords(figs.headline);
        const words = [w.title, w.amount, w.share, w.back, ...(x ? x.paras : [])].filter(Boolean).every(t => text.includes(t));
        const kind = await p.$eval('[data-solver-strategy]', el => { const x = el.querySelector('[data-strategy-explanation]'); return x ? x.dataset.strategyExplanation : null; });
        const wantKind = which === 'atTarget' ? null : which === 'short' ? 'short' : which === 'main' ? (x ? x.kind : null) : 'full';
        ok(`${which === 'main' ? id : `the case '${which}' (${id})`}: reads ${figs.headline.case}, the wording table's words on the card, the explanation ${kind || 'none'}`, (which === 'main' || figs.headline.case === which) && words && kind === wantKind, `${w.amount}${w.back ? ' / ' + w.back : ''}`);
      } else ok(`the case '${which}' (${id}): its figures came in`, false);
      ok(`${id}: no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.close();
    }

    // 4. a failed solve
    { const { p, errs } = await open(b, PREVIEW_PORT, planOf(CASES.main), { plantFail: true });
      let failed = true;
      try { await p.waitForSelector('[data-solver-strategy][data-strategy-state="failed"]', { timeout: 60000 }); } catch (e) { failed = false; }
      const s = await tab(p), retry = await p.$('[data-strategy-retry]');
      ok('planted, the solver failing: the tab says so, offers "try again", and keeps the tournament (the app\'s rules) below', failed && !!retry && s.tournament, JSON.stringify(s));
      ok('planted: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.close(); }

    // 5. a couple
    if (!couple) ok('a couple in the library to test with', false);
    else { const { p, errs, urls } = await open(b, PREVIEW_PORT, couple.plan), s = await tab(p);
      await p.waitForTimeout(2000);
      ok(`switch on, a couple (${couple.id}): the tournament, with the solver's line, and nothing solved`, s.tournament && s.couple && !s.strategy && !urls.some(u => /solverWorker/.test(u)), JSON.stringify(s));
      ok('a couple: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.close(); }
  } finally {
    if (server) server.kill();
    rmSync(OUT, { recursive: true, force: true });
  }
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(`  FAIL  the harness threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
