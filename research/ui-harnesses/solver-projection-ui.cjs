/*
 * PART C PHASE 10: THE PROJECTION UNDER THE SOLVER'S SWITCH (the launch plan section 4, Phase 10; research/solver/PHASE-10.md).
 * REQUIRED. Built item by item; today item 2, the projection running the solved plan, and item 7, the audit table and history.
 *
 * 1. The site as built (the switch off): the projection is your plan's, with no solver line on it.
 * 2. A preview build with the switch on at light settings (vite.config.js solver-preview), S126 from the research library:
 *      - a projection run before the solve has landed is your plan's, and goes stale when the solve lands ("Re-run");
 *      - re-run, it is the solved plan's: its survival Node's (the engine's monteCarlo of the solved plan at the same light
 *        settings, the projection's own paths and seed), with your plan's survival beside it ("as you are now"), Node's for
 *        the plan as entered, and the typical spending beside them.
 *    Item 2's rest: beside "as you are now", your plan's typical spending, Node's (planted, PROJECTION_PLANT=yoursdeliv, the
 *    spending taken from another figure, it fails); the "Spend and date" step offers the solved plan's own answers (the Simple page's search, section 6, on
 *    the plan on screen at the step's survival), starting from the page's own safe maximum.
 * 3. Item 7, the same preview: the audit table is the solved plan's expected-return ledger, its totals Node's year for year
 *    (rowsOf, src/solverStrategy.js) and each year's action Node's move; "Your plan" gives your plan's ledger, Node's, with
 *    no action column. History is the solved plan through real history, labelled the out-of-model check: its verdict and
 *    the pot left Node's for the start year shown, your plan's verdict beside it Node's. The switch off (section 1): your
 *    plan's ledger with no action column, and no out-of-model check.
 *    Planted once (PROJECTION_PLANT=histexp: the built page asks history for the expected path instead), section 3's history
 *    check fails.
 * 4. Item 3, the same preview, the Config tab: under the dial, the line at the plan's own setting is the headline's figures
 *    (Node's strategyOf on the solved plan, the Strategy tab's first paths and seed); "Show the four settings" works the other
 *    three out in the background, nearest first along the dial, each line's survival Node's for the plan at that setting;
 *    choosing another setting re-solves the plan there, its line the figure the list showed for it, and the others kept.
 *    Planted once (PROJECTION_PLANT=dialfar: the built page solves the settings farthest first), the order check fails.
 * 5. Item 4, the same preview, S188 (working, retiring at its plan's age), the Strategy tab: the age dial's line at the plan's
 *    own age is the headline's figures, Node's; "Solve retiring at ..." works out the ages three either side, nearest first,
 *    the earlier first on a tie, each line's survival Node's for the plan retiring at that age. S126, retired, has no age dial.
 *    Planted once (PROJECTION_PLANT=agelate: the later age first on a tie), the order check fails.
 * 6. Item 5, the same preview, the Simple page (one person): "Find the solved plan's answers" searches over solves for the
 *    highest target the solved plan keeps at 90% and the earliest retirement it keeps there (src/solverSearch.js), each
 *    solve's survival the engine's run of the solved plan; the page's answers and every setting it tried are Node's, the
 *    same search over the same solves. Planted once (PROJECTION_PLANT=simpleseed: the card's paths from another seed), the
 *    answers check fails.
 * 7. Item 6, the same preview, the full app with S126 and a saved scenario spending £2,000 more: under the scenario
 *    comparison, the plan on screen's line is the headline's figures, Node's; "Solve this scenario" solves the scenario in
 *    workers of its own, its line Node's for that plan. Planted once (PROJECTION_PLANT=scenseed: the scenario solved on
 *    another seed), the scenario check fails.
 *
 *   node research/ui-harnesses/solver-projection-ui.cjs [port]      (the preview build is served on port + 10)
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync, readdirSync, readFileSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const PORT = process.argv[2] || '4173', PREVIEW_PORT = String(Number(PORT) + 10);
// PROJECTION_PLANT: one plant or several, comma-separated (each breaks a different check); PROJECTION_SECTIONS: the switch-on
// sections to run beyond 1 and 2 (e.g. "4,5"), all when unset
const PLANTS = new Set((process.env.PROJECTION_PLANT || '').split(',').filter(Boolean));
const ONLY = process.env.PROJECTION_SECTIONS ? new Set(process.env.PROJECTION_SECTIONS.split(',')) : null, want = n => !ONLY || ONLY.has(String(n));
const ROOT = join(__dirname, '../..');
const STORE = 'rp_plan_full_v28', SEED = 12345, TRIALS = 5000, UPTO = 2000;
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
  const { solveForApp } = await load('src/solverApp.js'), { solvedContext, yourContext, rowsOf, strategyOf } = await load('src/solverStrategy.js');
  const { atDial, dialOrder, ageOptions, atAge } = await load('src/solverSettings.js');
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const plan = buildScenarios().find(s => s.id === 'S126').plan;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // 1. the switch off
  { const { p, errs, ctx } = await open(b, PORT, plan);
    await tab(p, /Projection/); await p.waitForTimeout(800); await runProjection(p);
    const yours = await p.$('[data-solver-yours]');
    ok('switch off: the projection is your plan\'s, with no solver line', !yours && /Your plan as entered/.test(await p.textContent('body')));
    await tab(p, /Audit/); await p.waitForTimeout(500);
    const ledger = await p.$eval('[data-audit-ledger]', el => el.dataset.auditLedger).catch(() => null), acts = await p.$$('[data-audit-action]');
    await tab(p, /Backtest|Historical/); await p.waitForTimeout(500);
    const oom = await p.$('[data-history-solved]');
    ok('switch off: the audit table is your plan\'s ledger with no action column, and history has no out-of-model check', ledger === 'yours' && acts.length === 0 && !oom, `ledger ${ledger}, action cells ${acts.length}, out-of-model ${!!oom}`);
    ok('switch off: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close(); }
  { const { SIMPLE_BLANK } = await load('research/simplePlan.mjs');
    const c = await b.newContext({ viewport: { width: 1400, height: 1100 } }), p = await c.newPage();
    // the page is chosen by the key read raw (src/Shell.jsx: getItem('rp_which_app') === 'simple'), not as JSON
    await c.addInitScript(sp => { localStorage.setItem('rp_simple_v1', JSON.stringify(sp)); localStorage.setItem('rp_which_app', 'simple'); }, { ...SIMPLE_BLANK, ageSelf: 56, retireSelf: 60, spend: 26000, pen: 420000, isa: 90000, cash: 15000 });
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    // the Simple page itself, with its figures drawn ("Lucky pot" is the Simple page's own figure), before the card's absence means anything
    const onSimple = await p.waitForFunction(() => /Lucky pot @/.test(document.body.textContent), null, { timeout: 120000 }).then(() => true, () => false);
    ok('switch off: the Simple page has no answers from the solver', onSimple && !(await p.$('[data-simple-solver]')), `on the Simple page ${onSimple}, the card ${!!(await p.$('[data-simple-solver]'))}`);
    await c.close(); }

  const OUT = mkdtempSync(join(tmpdir(), 'solver-projection-'));
  let server = null;
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, SOLVER_PREVIEW: '1', SOLVER_PREVIEW_OPTS: JSON.stringify(LIGHT) } });
    if (PLANTS.has('histexp')) {
      // the plant: the page asks history for the expected path instead (item 7's history check must fail)
      const dir = join(OUT, 'assets'); let hit = 0;
      for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
        const src = readFileSync(join(dir, f), 'utf8'), out = src.replace(/market:([\w$]+)===`expected`\?`expected`:\{historical:!0,startYear:\1\}/, () => { hit++; return 'market:`expected`'; });
        if (out !== src) writeFileSync(join(dir, f), out);
      }
      ok('PLANTED: the page asks history for the expected path (the history check below must FAIL)', hit === 1, `${hit} place patched`);
    }
    if (PLANTS.has('yoursdeliv')) {
      // your plan's spending taken from another figure (item 2's spending check must fail)
      const dir = join(OUT, 'assets'); let hit = 0;
      for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
        const src = readFileSync(join(dir, f), 'utf8'), out = src.replace(/p10Terminal:([\w$]+)\.p10Terminal,medianRealisedSpend:\1\.medianRealisedSpend/, (m, v) => { hit++; return `p10Terminal:${v}.p10Terminal,medianRealisedSpend:${v}.p10Terminal`; });
        if (out !== src) writeFileSync(join(dir, f), out);
      }
      ok('PLANTED: your plan\'s spending from another figure (the spending check below must FAIL)', hit >= 1, `${hit} place(s) patched`);
    }
    if (PLANTS.has('scenseed')) {
      // the scenarios card asks its scenario's figures on another seed (item 6's scenario check must fail)
      const dir = join(OUT, 'assets'); let hit = 0;
      for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
        const src = readFileSync(join(dir, f), 'utf8');
        if (!/data-solver-scenarios/.test(src)) continue;
        const out = src.replace(/startFigures\(([\w$]+),([\w$]+),\{\.\.\.([\w$]+)\|\|\{\},seed:([\w$]+),upto:([\w$]+)\}\)/, (m, a, b, c, d, e) => { hit++; return `startFigures(${a},${b},{...${c}||{},seed:${d}+1,upto:${e}})`; });
        if (out !== src) writeFileSync(join(dir, f), out);
      }
      ok('PLANTED: the scenarios card on another seed (the scenario check below must FAIL)', hit >= 1, `${hit} place(s) patched`);
    }
    for (const plantName of ['agelate', 'simpleseed'].filter(x => PLANTS.has(x))) {
      const dir = join(OUT, 'assets'); let hit = 0;
      for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
        const src = readFileSync(join(dir, f), 'utf8');
        const out = plantName === 'agelate'
          // the age dial's tie-break turned round: the later age first (item 4's order check must fail)
          ? src.replace(/\.sort\(\(([\w$]+),([\w$]+)\)=>Math\.abs\(\1-([\w$]+)\)-Math\.abs\(\2-\3\)\|\|\1-\2\)/, (m, a, b, c) => { hit++; return `.sort((${a},${b})=>Math.abs(${a}-${c})-Math.abs(${b}-${c})||${b}-${a})`; })
          // the Simple card's paths from another seed (item 5's answers check must fail)
          : (/data-simple-solver/.test(src) ? src.replace(/seed:([\w$]+)=12345\b/g, (m, v) => { hit++; return `seed:${v}=12346`; }) : src);
        if (out !== src) writeFileSync(join(dir, f), out);
      }
      ok(`PLANTED: ${plantName === 'agelate' ? 'the later age first on a tie (the age order check below must FAIL)' : 'the Simple card on another seed (its answers check below must FAIL)'}`, hit >= 1, `${hit} place(s) patched`);
    }
    if (PLANTS.has('dialfar')) {
      // the plant: the page solves the dial's other settings farthest first (item 3's order check must fail)
      const dir = join(OUT, 'assets'); let hit = 0;
      for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
        const src = readFileSync(join(dir, f), 'utf8'), out = src.replace(/\.sort\(\(([\w$]+),([\w$]+)\)=>\1\[1\]-\2\[1\]\|\|\1\[2\]-\2\[2\]\)/, (m, a, b) => { hit++; return `.sort((${a},${b})=>${b}[1]-${a}[1]||${a}[2]-${b}[2])`; });
        if (out !== src) writeFileSync(join(dir, f), out);
      }
      ok('PLANTED: the page solves the dial\'s settings farthest first (the order check below must FAIL)', hit >= 1, `${hit} place(s) patched`);
    }
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

    // item 2's rest: your plan's spending beside its survival ("as you are now"), Node's for the plan as entered
    const yd = await p.$eval('[data-solver-yours-delivered]', el => Number(el.dataset.solverYoursDelivered)).catch(() => null);
    const nodeYoursSpend = E.monteCarlo(yourContext(E, saved), { trials: TRIALS, seed: SEED }).medianRealisedSpend;
    ok('beside "as you are now", your plan\'s typical spending, Node\'s', yd !== null && yd === nodeYoursSpend, `${yd} (Node ${nodeYoursSpend})`);
    if (want('2b')) {
    // item 2's rest: the "Spend and date" step offers the solved plan's own answers, from the page's own safe maximum, at the
    // survival the step is set to; the figures beside it are your plan's rules
    // the step by its pill on a desktop (the harness's width), by the phone's step bar where there is no pill
    await p.evaluate(() => { const x = document.querySelector('[data-slide-pill="2"]') || document.querySelector('[data-deck-step="2"]'); if (x) x.click(); });
    const fullCard = await p.waitForSelector('[data-solver-answers="full"]', { timeout: 60000 }).then(() => true, () => false);
    // the card starts from the page's own safe maximum, so read it once the page has worked that out
    await p.waitForFunction(() => [...document.querySelectorAll('span')].some(x => x.textContent.trim() === 'Safe maximum'), null, { timeout: 240000 }).catch(() => {});
    const fc = fullCard ? await p.$eval('[data-solver-answers="full"]', el => ({ from: Number(el.dataset.simpleSolverFrom), text: el.textContent })) : null;
    const pageMax = await p.evaluate(() => { const t = [...document.querySelectorAll('span')].find(x => x.textContent.trim() === 'Safe maximum'); const v = t && t.nextElementSibling ? t.nextElementSibling.textContent : ''; return Number(v.replace(/[^0-9.]/g, '')) || null; });
    ok('the "Spend and date" step offers the solved plan\'s own answers on request, from the page\'s safe maximum, at 90%, the figures beside it your plan\'s rules',
      !!fc && fc.from === pageMax && /keeps at 90%|Find the solved plan/.test(fc.text) && /follow your plan's rules/.test(fc.text), fc ? `from £${fc.from} (the page's safe maximum £${pageMax}): "${fc.text.trim().slice(0, 90)}…"` : 'no card');

    }
    if (want('3')) {
    // 3. item 7: the audit table and history
    const sc = solvedContext(E, r), yc = yourContext(E, saved);
    const x = rowsOf(E, r, 'expected');
    await tab(p, /Audit/);
    const solvedLedger = await p.waitForSelector('[data-audit-ledger="solved"]', { timeout: 120000 }).then(() => true, () => false);
    const page = await p.$$eval('[data-audit-total]', els => els.map(el => ({ total: Number(el.dataset.auditTotal), act: (el.querySelector('[data-audit-action]') || { dataset: {} }).dataset.auditAction })));
    const badTotal = page.filter((q, t) => !x.rows[t] || q.total !== x.rows[t].totalCombined).length, badAct = page.filter((q, t) => q.act !== (x.parts[t] ? JSON.stringify(x.parts[t]) : '')).length;
    ok('the audit table is the solved plan\'s ledger: every year\'s total Node\'s, and every year\'s action Node\'s move', solvedLedger && page.length === x.rows.length && badTotal === 0 && badAct === 0,
      `solved ledger ${solvedLedger}, ${page.length} rows (Node ${x.rows.length}), totals differing ${badTotal}, actions differing ${badAct}; year 1 "${await p.$eval('[data-audit-action]', el => el.textContent).catch(() => '-')}"`);
    await p.evaluate(() => { const x = [...document.querySelectorAll('[data-audit-view] button')].find(b => /Your plan/.test(b.textContent)); if (x) x.click(); });
    const yoursLedger = await p.waitForSelector('[data-audit-ledger="yours"]', { timeout: 10000 }).then(() => true, () => false);
    const yrows = E.simulateDeterministic(yc, 'expected'), ytot = await p.$$eval('[data-audit-total]', els => els.map(el => Number(el.dataset.auditTotal))), yacts = await p.$$('[data-audit-action]');
    ok('"Your plan" gives your plan\'s ledger, Node\'s, with no action column', yoursLedger && ytot.length === yrows.length && ytot.every((v, t) => v === yrows[t].totalCombined) && yacts.length === 0,
      `your ledger ${yoursLedger}, ${ytot.length} rows, action cells ${yacts.length}`);
    await tab(p, /Backtest|Historical/);
    const hs = await p.waitForSelector('[data-history-solved]', { timeout: 120000 }).then(() => true, () => false);
    const h = hs ? await p.$eval('[data-history-solved]', el => ({ survived: el.dataset.historySolved, start: Number(el.dataset.historyStart), terminal: Number(el.dataset.historyTerminal), yours: el.dataset.historyYours, text: el.textContent })) : null;
    const nh = h ? rowsOf(E, r, { historical: true, startYear: h.start }) : null, ny = h ? E.evaluateRows(yc, E.simulateHistorical(yc, h.start)) : null;
    ok('history is the solved plan through real history, labelled the out-of-model check: its verdict and pot left Node\'s, your plan\'s verdict beside it Node\'s',
      !!h && /out-of-model check/i.test(h.text) && h.terminal === nh.verdict.terminalPot && h.survived === (nh.verdict.survived ? 'survived' : 'failed') && h.yours === (ny.survived ? 'survived' : 'failed'),
      h ? `from ${h.start}: the solved plan ${h.survived}, the pot left ${Math.round(h.terminal)} (Node ${Math.round(nh.verdict.terminalPot)}, ${nh.verdict.survived ? 'survived' : 'failed'}); your plan ${h.yours} (Node ${ny.survived ? 'survived' : 'failed'})` : 'no out-of-model check');

    }
    if (want('4')) {
    // 4. item 3: the dial's live line and the four settings
    await tab(p, /Config/);
    const line = await p.waitForSelector('[data-figures="dial"] [data-figures-line]', { timeout: 300000 }).then(() => true, () => false);
    const at = line ? await p.$eval('[data-figures="dial"] [data-figures-line]', el => ({ at: Number(el.dataset.figuresAt), survival: Number(el.dataset.figuresSurvival), text: el.textContent })) : null;
    const nodeHere = strategyOf(E, r, saved, { trials: UPTO, seed: SEED }).headline;
    ok('under the dial, the line at your setting is the headline\'s figures, Node\'s', !!at && at.at === 1 && at.survival === nodeHere.survival && /At this setting: start at/.test(at.text),
      at ? `"${at.text.trim()}" (Node ${nodeHere.survival}%)` : 'no line');
    await p.evaluate(() => { const b = document.querySelector('[data-figures="dial"] [data-figures-show]'); if (b) b.click(); });
    // the order the settings fill in, polled: each is worked out in turn
    const seen = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 1500000) {
      const got = await p.$$eval('[data-figures="dial"] [data-figures-pos]', els => els.filter(el => el.dataset.figuresSurvival !== '').map(el => Number(el.dataset.figuresPos))).catch(() => []);
      for (const x of got) if (!seen.includes(x)) seen.push(x);
      if (got.length === 4) break;
      await p.waitForTimeout(500);
    }
    const others = seen.filter(x => x !== 1);
    ok('"Show the four settings" works the other three out nearest first along the dial', others.length === 3 && others.join(',') === dialOrder(1).join(','), `filled in ${others.join(', ') || 'none'} (nearest first ${dialOrder(1).join(', ')})`);
    const listed = Object.fromEntries(await p.$$eval('[data-figures="dial"] [data-figures-pos]', els => els.map(el => [el.dataset.figuresPos, el.dataset.figuresSurvival === '' ? null : Number(el.dataset.figuresSurvival)])));
    const nodeAt = {};
    for (const x of [3, 6, 10]) { const px = atDial(saved, x); nodeAt[x] = strategyOf(E, solveForApp(E, M, px, LIGHT), px, { trials: UPTO, seed: SEED }).headline.survival; }
    ok('each setting\'s line is Node\'s for the plan at that setting', [3, 6, 10].every(x => listed[x] === nodeAt[x]) && listed[1] === nodeHere.survival,
      [1, 3, 6, 10].map(x => `${x}: ${listed[x]}% (Node ${x === 1 ? nodeHere.survival : nodeAt[x]}%)`).join(', '));
    // choosing Medium: the plan re-solves there; its line is the figure the list showed, and the others stay
    await p.evaluate(() => { const b = document.querySelector('[data-solver-choice="cuts"] [data-value="3"]'); if (b) b.click(); });
    const moved = await p.waitForFunction(() => { const el = document.querySelector('[data-figures="dial"] [data-figures-line]'); return el && el.dataset.figuresAt === '3'; }, null, { timeout: 900000 }).then(() => true, () => false);
    const after = moved ? await p.$eval('[data-figures="dial"] [data-figures-line]', el => Number(el.dataset.figuresSurvival)) : null;
    const kept = Object.fromEntries(await p.$$eval('[data-figures="dial"] [data-figures-pos]', els => els.map(el => [el.dataset.figuresPos, el.dataset.figuresSurvival === '' ? null : Number(el.dataset.figuresSurvival)])));
    ok('choosing Medium re-solves the plan there: its line the figure the list showed, and the other settings\' figures kept', moved && after === listed[3] && [1, 6, 10].every(x => kept[x] === listed[x]),
      `Medium ${after}% (listed ${listed[3]}%); kept ${[1, 6, 10].map(x => `${x}: ${kept[x]}%`).join(', ')}`);
    }
    await tab(p, /Strategy/); await p.waitForTimeout(1500);
    ok('S126, retired, has no age dial', !(await p.$('[data-solver-ages]')));
    ok('switch on: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();

    if (want('5')) {
    // 5. item 4: the age dial, on a household still working
    {
      const plan188 = buildScenarios().find(x => x.id === 'S188').plan;
      const { p, errs, ctx } = await open(b, PREVIEW_PORT, plan188);
      await tab(p, /Config/);
      const solved188 = await p.waitForSelector('[data-solve-state="solved"]', { timeout: 900000 }).then(() => true, () => false);
      await tab(p, /Strategy/);
      const line = await p.waitForSelector('[data-figures="ages"] [data-figures-line]', { timeout: 300000 }).then(() => true, () => false);
      const saved188 = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE);
      const r188 = solveForApp(E, M, saved188, LIGHT), own = strategyOf(E, r188, saved188, { trials: UPTO, seed: SEED }).headline;
      const at = line ? await p.$eval('[data-figures="ages"] [data-figures-line]', el => ({ at: Number(el.dataset.figuresAt), survival: Number(el.dataset.figuresSurvival), text: el.textContent })) : null;
      const ao = ageOptions(saved188, solvedContext(E, r188).owners[0].age0);
      ok('the age dial\'s line at the plan\'s own age is the headline\'s figures, Node\'s', solved188 && !!at && !!ao && at.at === ao.own && at.survival === own.survival, at ? `"${at.text.trim()}" (Node ${own.survival}%)` : `solved ${solved188}, no line`);
      await p.evaluate(() => { const b = document.querySelector('[data-figures="ages"] [data-figures-show]'); if (b) b.click(); });
      const seenA = [], tA = Date.now();
      while (Date.now() - tA < 2400000) {
        const got = await p.$$eval('[data-figures="ages"] [data-figures-pos]', els => els.filter(el => el.dataset.figuresSurvival !== '').map(el => Number(el.dataset.figuresPos))).catch(() => []);
        for (const x of got) if (!seenA.includes(x)) seenA.push(x);
        if (ao && got.length === ao.ages.length) break;
        await p.waitForTimeout(500);
      }
      const othersA = seenA.filter(x => !ao || x !== ao.own);
      ok('"Solve retiring at ..." works the ages out nearest first, the earlier first on a tie', !!ao && othersA.join(',') === ao.order.join(','), `filled in ${othersA.join(', ') || 'none'} (expected ${ao ? ao.order.join(', ') : '-'})`);
      const listedA = Object.fromEntries(await p.$$eval('[data-figures="ages"] [data-figures-pos]', els => els.map(el => [el.dataset.figuresPos, el.dataset.figuresSurvival === '' ? null : Number(el.dataset.figuresSurvival)])));
      const nodeA = {};
      for (const a of ao ? ao.order : []) { const pa = atAge(saved188, a); nodeA[a] = strategyOf(E, solveForApp(E, M, pa, LIGHT), pa, { trials: UPTO, seed: SEED }).headline.survival; }
      ok('each age\'s line is Node\'s for the plan retiring at that age', !!ao && ao.order.every(a => listedA[a] === nodeA[a]), ao ? ao.ages.map(a => `${a}: ${listedA[a]}% (Node ${a === ao.own ? own.survival : nodeA[a]}%)`).join(', ') : 'no ages');
      ok('switch on, S188: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await ctx.close();
    }

    }
    if (want('6')) {
    // 6. item 5: the Simple page's answers from the solver
    {
      const { SIMPLE_BLANK, toFullPlan } = await load('research/simplePlan.mjs');
      const { highestTarget, earliestAge } = await load('src/solverSearch.js');
      const simple = { ...SIMPLE_BLANK, ageSelf: 56, retireSelf: 60, spend: 26000, pen: 420000, isa: 90000, cash: 15000, statePensionSelf: 11500 };
      const ctxS = await b.newContext({ viewport: { width: 1400, height: 1100 } }), p = await ctxS.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await ctxS.addInitScript(sp => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('rp_simple_v1', JSON.stringify(sp)); localStorage.setItem('rp_which_app', 'simple'); sessionStorage.setItem('seeded', '1'); } }, simple);
      await p.goto(`http://localhost:${PREVIEW_PORT}/`, { waitUntil: 'networkidle' });
      const card = await p.waitForFunction(() => { const el = document.querySelector('[data-simple-solver]'); return el && el.dataset.simpleSolverFrom !== ''; }, null, { timeout: 300000 }).then(() => true, () => false);
      const from = card ? await p.$eval('[data-simple-solver]', el => Number(el.dataset.simpleSolverFrom)) : null;
      await p.evaluate(() => { const b = document.querySelector('[data-simple-solver-ask]'); if (b) b.click(); });
      const done = await p.waitForSelector('[data-simple-solver="done"]', { timeout: 3600000 }).then(() => true, () => false);
      const got = done ? await p.$eval('[data-simple-solver]', el => ({ spend: el.dataset.simpleSolverSpend, age: el.dataset.simpleSolverAge, tried: JSON.parse(el.dataset.simpleSolverTried), text: el.textContent })) : null;
      const evalAt = make => async x => { const pl = toFullPlan(make(x)); return strategyOf(E, solveForApp(E, M, pl, LIGHT), pl, { trials: UPTO, seed: SEED }).headline.survival; };
      const nt = from ? await highestTarget(evalAt(x => ({ ...simple, spend: x })), { from }) : null;
      const na = from ? await earliestAge(evalAt(a => ({ ...simple, retireSelf: a })), { from: simple.retireSelf, after: simple.ageSelf, last: simple.terminalAge - 1 }) : null;
      const same = got && nt && na && String(nt.spend ?? '') === got.spend && String(na.age ?? '') === got.age
        && got.tried.spend.join(',') === nt.tried.map(t => t.x).join(',') && got.tried.age.join(',') === na.tried.map(t => t.x).join(',');
      ok('the Simple page\'s answers from the solver are Node\'s search over the same solves, every setting tried the same, named apart from the safe starting spend',
        card && done && same && /Highest target the solved plan keeps at 90%/.test(got.text) && /Earliest retirement the solved plan keeps at 90%/.test(got.text),
        got && nt && na ? `from £${from}: the highest target £${got.spend} (Node £${nt.spend}; tried ${got.tried.spend.join(', ')} / ${nt.tried.map(t => t.x).join(', ')}), the earliest age ${got.age} (Node ${na.age}; tried ${got.tried.age.join(', ')} / ${na.tried.map(t => t.x).join(', ')})` : `card ${card}, done ${done}`);
      ok('switch on, the Simple page: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await ctxS.close();
    }

    }
    if (want('7')) {
    // 7. item 6: scenarios each carry a solve, on request
    {
      const planB = { ...plan, spending: { ...plan.spending, targetSpend: Number(plan.spending.targetSpend) + 2000 } };
      const ctx7 = await b.newContext({ viewport: { width: 1400, height: 1100 } }), p = await ctx7.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await ctx7.addInitScript(([k, pl, pb]) => { if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(k, JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full'));
        localStorage.setItem('rp_saved_scenarios_v3', JSON.stringify([{ id: 's1', name: 'Scenario 1', data: pl }, { id: 's2', name: 'Spend 2000 more', data: pb }]));
        sessionStorage.setItem('seeded', '1'); } }, [STORE, plan, planB]);
      await p.goto(`http://localhost:${PREVIEW_PORT}/`, { waitUntil: 'networkidle' });
      await tab(p, /Config/);
      const solved7 = await p.waitForSelector('[data-solve-state="solved"]', { timeout: 900000 }).then(() => true, () => false);
      await tab(p, /Projection/); await p.waitForTimeout(800);
      await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Spend 2000 more/.test(b.textContent)); if (x) x.click(); });
      const card = await p.waitForFunction(() => { const el = document.querySelector('[data-solver-scenario="__current__"]'); return el && el.dataset.solverScenarioSurvival !== ''; }, null, { timeout: 300000 }).then(() => true, () => false);
      const base = card ? await p.$eval('[data-solver-scenario="__current__"]', el => Number(el.dataset.solverScenarioSurvival)) : null;
      await p.evaluate(() => { const x = document.querySelector('[data-solver-scenario="s2"] [data-solver-scenario-ask]'); if (x) x.click(); });
      const got = await p.waitForFunction(() => { const el = document.querySelector('[data-solver-scenario="s2"]'); return el && el.dataset.solverScenarioSurvival !== ''; }, null, { timeout: 900000 }).then(() => true, () => false);
      const sv = got ? await p.$eval('[data-solver-scenario="s2"]', el => ({ survival: Number(el.dataset.solverScenarioSurvival), text: el.textContent })) : null;
      const nodeBase = strategyOf(E, solveForApp(E, M, plan, LIGHT), plan, { trials: UPTO, seed: SEED }).headline.survival;
      const nodeB = strategyOf(E, solveForApp(E, M, planB, LIGHT), planB, { trials: UPTO, seed: SEED }).headline.survival;
      ok('under the scenario comparison, the plan on screen\'s line is Node\'s, and "Solve this scenario" gives the scenario\'s, Node\'s', solved7 && card && base === nodeBase && !!sv && sv.survival === nodeB,
        `the plan ${base}% (Node ${nodeBase}%), the scenario ${sv ? sv.survival : '-'}% (Node ${nodeB}%)${sv ? `: "${sv.text.trim()}"` : ''}`);
      ok('switch on, the scenarios: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await ctx7.close();
    }
    }
  } finally {
    if (server) server.kill();
    rmSync(OUT, { recursive: true, force: true });
  }
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(`  FAIL  the harness threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
