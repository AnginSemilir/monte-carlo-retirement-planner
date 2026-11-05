/*
 * PART C PHASE 9: THE STRATEGY TAB UNDER THE SOLVER'S SWITCH (the launch plan section 4; since step U, the new planner's Your plan, src/PlannerPlan.jsx). REQUIRED.
 *
 * 1. The site as built (the switch off): the Strategy tab is the tournament as today, and no solver code is fetched.
 * 2. A preview build with the switch on at this harness's light settings (vite.config.js solver-preview; the strategy's
 *    steps 200 then 500 paths), opted in to the new planner (rp_planner 'new': step U, LAYOUT.md section 11.2), a single
 *    household from the research library (never anybody's own plan):
 *      - Your plan is the solved plan, and comes as its own chunk;
 *      - its figures, once all its paths are in, are Node's (src/solverStrategy.js strategyOf on the saved plan, solved at the
 *        same light settings, on the projection's seed): the solved plan's bit for bit (the headline, its comparison column,
 *        the raise), your plan's and both arms' money bands within a relative 1e-12 (Node's Math.pow and Chromium's round in
 *        the last place differently: research/ui-harnesses/pow-probe.cjs);
 *      - the words on the card and the explanation under it are the wording table's for that case (src/solverWords.js);
 *      - this year's actions come in, then the rule of thumb (src/solverDistil.js), shown exactly when following it costs
 *        under half a point of survival (the harness's light settings: 300 paired paths).
 * 3. The wording's four cases (B4), each on a library household that reads so at these settings: starting at the target,
 *    a short dip (the note), a long dip (the full text), never back at target (the full text).
 *    And the skip costs on their fixture (SKIP_FIXTURE): the page's Node's, a known costly action above 0, the costs not all
 *    0, and a planted dominated action at least 0.
 * 4. A failed solve (the launch plan's F16): the worker planted to fail every question; Your plan says so, offers "try again"
 *    and the classic planner (the app's rules).
 * 5. A couple under the switch (D42): the couples card, nothing solved.
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
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, strategySteps: [200, 500], strategyActionsN: 300 };
// a household for each of the wording's cases at these settings (research/ui-harnesses' own scan, 1 Nov), the main one first
const CASES = { main: 'S126', atTarget: 'S000', short: 'S162', long: 'S054', never: 'S364' };
// the skip costs' fixture (the launch plan's Phase 9: "a fixture with a known costly action (the pension drawn to the
// basic-rate limit in a bridge year)"). At these settings no library household's first move draws the pension to the
// basic-rate limit (research/solver/skip-scan.mjs, 2 Nov: none of the 30 retired in their bridge). S116 (61, the state
// pension at 67) draws it to the personal allowance and re-wraps it, and cuts its spending to 80%; skipping the re-wrap
// lost 3 paths of 300 and saved none, skipping the cut lost 4 and saved none (skip-scan.mjs --all)
// planted (STRATEGY_SKIP_FIXTURE=S126, a household surviving nearly every path, its skips all 0): the costly check fails
const SKIP_FIXTURE = process.env.STRATEGY_SKIP_FIXTURE || 'S116';
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
const VITE = join(ROOT, 'node_modules/vite/bin/vite.js');

async function open(b, port, plan, { plantFail = false, planner = 'new' } = {}) {
  // the planted failure: the page's solver worker answers every question with an error (no change to the app's code: the
  // page's Worker constructor is wrapped for the solver's script; a route on the worker's own request is not honoured)
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1100 } });
  if (plantFail) await ctx.addInitScript(() => {
    const Real = window.Worker;
    window.Worker = function (url, o) {
      if (!/solverWorker/.test(String(url))) return new Real(url, o);
      const w = { onmessage: null, onerror: null, terminate() {}, postMessage(m) { setTimeout(() => w.onmessage && w.onmessage({ data: { id: (m && m.id) || 0, error: 'planted: the solver failed' } }), 0); } };
      return w;
    };
  });
  const p = await ctx.newPage();
  const errs = [], urls = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', q => urls.push(q.url()));
  await p.addInitScript(([k, pl, pick]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); if (pick) localStorage.setItem('rp_planner', pick); sessionStorage.setItem('seeded', '1'); } }, [STORE, plan, planner]);
  await p.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  // the switch off (the site's build): the classic Strategy tab; opted in: Your plan, where the new planner lands
  await p.evaluate(() => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(b => /^Strategy$|Your plan/.test(b.textContent.trim())); if (x) x.click(); });
  await p.waitForTimeout(1200);
  return { p, errs, urls };
}
const saved = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE);
const tab = p => p.evaluate(() => ({
  tournament: !!document.querySelector('[data-tournament]') || [...document.querySelectorAll('div')].some(d => /Strategy Tournament/.test(d.textContent) && d.children.length < 4),
  strategy: !!document.querySelector('[data-solver-strategy]'),
  couple: !!document.querySelector('[data-solver-couple]') || !!document.querySelector('[data-planner-couple]'),
  state: (document.querySelector('[data-solver-strategy]') || {}).dataset ? document.querySelector('[data-solver-strategy]').dataset.strategyState : null
}));
const diffs = (a, b, at = '') => {
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return Object.is(a, b) ? [] : [`${at}: ${JSON.stringify(a)} against ${JSON.stringify(b)}`];
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => diffs(a[k], b[k], `${at}.${k}`));
};
const waitDone = (p, ms = 900000) => p.waitForSelector('[data-solver-strategy][data-strategy-state="done"]', { timeout: ms });

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), M = await load('src/solver/model.js');
  const { solveForApp } = await load('src/solverApp.js'), { strategyOf, actionsOf, firstMove, moveOf, partsOf, runPath } = await load('src/solverStrategy.js');
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
    await p.context().close(); }

  const OUT = mkdtempSync(join(tmpdir(), 'solver-strategy-'));
  let server = null;
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, SOLVER_PREVIEW: '1', SOLVER_PREVIEW_OPTS: JSON.stringify(LIGHT) } });
    server = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT, '--port', PREVIEW_PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    let up = false;
    for (let i = 0; i < 40 && !up; i++) { try { const r = await fetch(`http://localhost:${PREVIEW_PORT}/`); up = r.ok; } catch (e) { await new Promise(res => setTimeout(res, 500)); } }
    ok('the preview build (the switch on) is served', up, `port ${PREVIEW_PORT}`);

    // 2 and 3: each case's household, the main one checked figure for figure
    // STRATEGY_CASES=main,never,skips (a working run's narrowing; the gate runs every case)
    const only = process.env.STRATEGY_CASES ? process.env.STRATEGY_CASES.split(',') : null;
    for (const [which, id] of Object.entries(CASES).filter(([w]) => !only || only.includes(w))) {
      const { p, errs, urls } = await open(b, PREVIEW_PORT, planOf(id)), s = await tab(p);
      if (which === 'main') ok(`switch on, opted in, ${id}: Your plan is the solved plan, not the tournament`, s.strategy && !s.tournament && !s.couple, JSON.stringify(s));
      let done = true;
      try { await waitDone(p); } catch (e) { done = false; }
      const figs = done ? JSON.parse(await p.getAttribute('[data-solver-strategy]', 'data-strategy-figures')) : null;
      // the card's words and the explanation beside it: in the new planner the explanation sits under the card in Your plan
      // (src/PlannerPlan.jsx), no longer inside it
      const text = done ? await p.evaluate(() => { const c = document.querySelector('[data-solver-strategy]'), x = document.querySelector('[data-place="plan"] [data-strategy-explanation]'); return (c ? c.textContent : '') + ' ' + (x ? x.textContent : ''); }) : '';
      const node = done ? nodeStrategy(await saved(p)) : null;
      if (which === 'main') {
        // the solved plan's figures bit for bit (the headline, its comparison column, the raise, the outlook's spending), your
        // plan's and both arms' money bands within a relative 1e-12: Node's Math.pow and Chromium's round differently in the
        // last place (research/ui-harnesses/pow-probe.cjs, results-pow-probe.txt), and the money passes through it (your plan's
        // median pot on S126 1 ulp apart since 2 Nov; step U's outlook, the solved plan's money bands, a few years 1 ulp apart),
        // where the counts (survival, the headline's levels and years) do not move
        const only = o => ({ ...o, compare: { solved: o.compare.solved }, outlook: o.outlook && { ...o.outlook, wealth: null } });
        const solvedSame = done && JSON.stringify(only(figs)) === JSON.stringify(only(node));
        const rd = (x, y) => Math.abs(x - y) / Math.max(1, Math.abs(y));
        const rel = done ? Math.max(...Object.keys(node.compare.yours).map(k => rd(figs.compare.yours[k], node.compare.yours[k])),
          ...['yours', 'solved'].flatMap(arm => node.outlook.wealth[arm].flatMap((bd, t) => ['p10', 'p25', 'p50', 'p75', 'p90'].map(k => rd(figs.outlook.wealth[arm][t][k], bd[k]))))) : Infinity;
        ok(`${id}: all ${LIGHT.strategySteps[1]} paths in, the solved plan's figures Node's bit for bit (headline, comparison, raise), your plan's and the money bands within a relative 1e-12`, solvedSame && rel <= 1e-12, done ? `${figs.headline.case}, start ${figs.headline.startLevel}%, survival ${figs.headline.survival.toFixed(1)}% (Node ${node.headline.survival.toFixed(1)}%), yours ${figs.compare.yours.survival.toFixed(1)}% (largest relative gap ${rel.toExponential(1)}); ${diffs(only(figs), only(node)).slice(0, 2).join('; ') || 'every other figure the same'}` : 'not done');
        ok(`${id}: Your plan came as its own chunk`, urls.some(u => /PlannerPlan/.test(u)));
        // this year's actions, then the rule of thumb, shown exactly when following it costs under half a point
        let more = true;
        try { await p.waitForSelector('[data-strategy-rule]', { timeout: 900000, state: 'attached' }); } catch (e) { more = false; }
        const acts = await p.getAttribute('[data-strategy-actions]', 'data-strategy-actions').catch(() => null);
        const rule = more ? await p.$eval('[data-strategy-rule]', el => ({ shown: el.dataset.strategyRule, cost: Number(el.dataset.strategyRuleCost) })) : null;
        ok(`${id}: this year's actions in, and the rule of thumb ${rule ? rule.shown : 'missing'} at a cost of ${rule ? rule.cost.toFixed(2) : '-'} points (shown only under 0.5)`, more && acts === 'done' && (rule.shown === 'shown') === (rule.cost < 0.5), `actions ${acts}`);
      }
      if (done) {
        const w = headlineWords(figs.headline, fmt), x = explanationWords(figs.headline);
        // the amount as LAYOUT.md section 3.1 sets it: the figure and "a year" large, and on a plan above its target the rest of
        // the string the line under it (", above your £5,000 target" -> "Above your £5,000 target.")
        const am = /^(.*?) a year(?:, (.*))?$/.exec(w.amount), amount = am ? [`${am[1]} a year`, am[2] ? `${am[2][0].toUpperCase()}${am[2].slice(1)}.` : null] : [w.amount];
        const words = [w.title, ...amount, w.share, w.back, ...(x ? x.paras : [])].filter(Boolean).every(t => text.includes(t));
        const kind = await p.evaluate(() => { const x = document.querySelector('[data-place="plan"] [data-strategy-explanation]'); return x ? x.dataset.strategyExplanation : null; });
        const wantKind = which === 'atTarget' ? null : which === 'short' ? 'short' : which === 'main' ? (x ? x.kind : null) : 'full';
        ok(`${which === 'main' ? id : `the case '${which}' (${id})`}: reads ${figs.headline.case}, the wording table's words on the card, the explanation ${kind || 'none'}`, (which === 'main' || figs.headline.case === which) && words && kind === wantKind, `${w.amount}${w.back ? ' / ' + w.back : ''}`);
      } else ok(`the case '${which}' (${id}): its figures came in`, false);
      ok(`${id}: no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close();
    }

    // 2b. the skip costs on the fixture: the page's Node's; the re-wrap (the pension drawn to the allowance in a bridge year)
    // costs above 0; the costs not all 0; a planted dominated action (the year's move at its highest spending level, the rest
    // of it unchanged) costs at least 0
    if (!only || only.includes('skips')) {
      const { p, errs } = await open(b, PREVIEW_PORT, planOf(SKIP_FIXTURE));
      let done = true;
      try { await p.waitForSelector('[data-strategy-actions="done"]', { timeout: 900000 }); } catch (e) { done = false; }
      const page = done ? await p.$$eval('[data-strategy-action]', els => els.map(el => ({ part: el.dataset.strategyAction, cost: el.dataset.strategyCost === '' ? null : Number(el.dataset.strategyCost) }))) : [];
      const pl = done ? await saved(p) : null, r = done ? solveForApp(E, M, pl, LIGHT) : null;
      const node = done ? actionsOf(E, r, pl, { seed: SEED, n: LIGHT.strategyActionsN }) : null;
      const same = done && JSON.stringify(page) === JSON.stringify(node.actions.map(x => ({ part: x.part, cost: x.cost })));
      const harvest = done ? node.actions.find(x => x.part === 'harvest') : null;
      ok(`${SKIP_FIXTURE}: this year's skip costs in, the page's Node's (${LIGHT.strategyActionsN} paired paths)`, same, done ? page.map(x => `${x.part} ${x.cost === null ? '-' : x.cost.toFixed(2)}`).join('; ') : 'not done');
      ok(`${SKIP_FIXTURE}: the re-wrap (the pension drawn to the personal allowance in a bridge year) costs above 0 to skip, and the costs are not all 0`, !!harvest && harvest.cost > 0 && node.actions.some(x => x.cost), harvest ? `the re-wrap ${harvest.cost.toFixed(2)} points (lost ${harvest.lost}, saved ${harvest.saved})` : 'no re-wrap in the first move');
      if (done) {
        const f = firstMove(E, r), sc = f.sc, q = partsOf(r.actions[f.mv.index], r.c.acts[f.mv.index]), top = Math.max(...r.actions.map(x => x.spendLevel || 1));
        const domAi = r.actions.findIndex((x, ai) => { const d = partsOf(x, r.c.acts[ai]); return d.level === top && d.draw === q.draw && d.isaFirst === q.isaFirst && d.harvest === q.harvest && d.tierPen === q.tierPen && d.tierIsa === q.tierIsa; });
        const dom = { ...sc, policyOverride: { ...f.base, choose: (st, t, held) => (t === 0 ? moveOf(r, domAi, f.mv) : f.base.choose(st, t, held)) } };
        let dl = 0, ds = 0;
        for (const zs of E.pathsForSeed(SEED, LIGHT.strategyActionsN, sc.totalYears)) { const x = runPath(E, sc, zs).survived, y = runPath(E, dom, zs).survived; if (x && !y) dl++; else if (!x && y) ds++; }
        ok(`${SKIP_FIXTURE}: the year's move forced to spend ${Math.round(100 * top)}% (a planted dominated action) costs at least 0`, domAi >= 0 && domAi !== f.mv.index && dl - ds >= 0, `${((100 * (dl - ds)) / LIGHT.strategyActionsN).toFixed(2)} points (lost ${dl}, saved ${ds})`);
      }
      ok(`${SKIP_FIXTURE}: no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close();
    }

    // 4. a failed solve
    { const { p, errs } = await open(b, PREVIEW_PORT, planOf(CASES.main), { plantFail: true });
      let failed = true;
      try { await p.waitForSelector('[data-solver-strategy][data-strategy-state="failed"]', { timeout: 60000 }); } catch (e) { failed = false; }
      const retry = await p.$('[data-strategy-retry]'), classic = await p.$('[data-plan-answer="failed"] [data-open-classic]');
      ok('planted, the solver failing: Your plan says so, offers "try again" and the classic planner (the app\'s rules)', failed && !!retry && !!classic);
      ok('planted: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close(); }

    // 5. a couple
    if (!couple) ok('a couple in the library to test with', false);
    else { const { p, errs, urls } = await open(b, PREVIEW_PORT, couple.plan), s = await tab(p);
      await p.waitForTimeout(2000);
      ok(`switch on, opted in, a couple (${couple.id}): the couples card, and nothing solved`, s.couple && !s.strategy && !urls.some(u => /solverWorker/.test(u)), JSON.stringify(s));
      ok('a couple: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close(); }
  } finally {
    if (server) server.kill();
    rmSync(OUT, { recursive: true, force: true });
  }
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(`  FAIL  the harness threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
