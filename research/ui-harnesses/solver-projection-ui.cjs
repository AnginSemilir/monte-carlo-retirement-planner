/*
 * PART C PHASE 10: THE PROJECTION UNDER THE SOLVER'S SWITCH (the launch plan section 4, Phase 10; research/solver/PHASE-10.md).
 * REQUIRED. In step U the solver's pieces moved to the new planner's places (Your plan, What if, Details), and this follows them.
 *
 * 1. (Retired 28 Nov 2026 with the classic planner, D155: the site as built, the switch off, its projection, audit table and
 *    backtest your plan's with no solver line, and the Simple page with no answers from the solver.)
 * 2. A preview build with the switch on at light settings (vite.config.js solver-preview), the planner (step U,
 *    research/reviews/2026-11-03/LAYOUT.md section 11.2; the only planner since D155), S126 from the research library: Your
 *    plan's outlook, drawn from the headline's own runs, its money bands the engine's monteCarlo bands on the same paths and
 *    seed within a relative 1e-12 for each arm (Node's Math.pow and Chromium's round in the last place differently:
 *    research/ui-harnesses/pow-probe.cjs), the spending bands Node's bit for bit.
 *    Planted once (PROJECTION_PLANT=outlookswap: the outlook's two arms swapped), the outlook check fails.
 * 3. Item 7, the same preview, Details: the year by year ledger is the solved plan's expected-return ledger, its totals
 *    Node's year for year (rowsOf, src/solverStrategy.js) and each year's move Node's; "Your current approach" gives your
 *    plan's ledger, Node's, with no move column. The history check is the solved plan through real history, labelled the
 *    out-of-model check: its verdict and the pot left Node's for the start year shown, your current approach's verdict beside
 *    it Node's. The solve's worker answers the page's questions in turn, so Details is opened once Your plan's last ones are
 *    in (this year's actions and the rule of thumb, on 1,000 paired paths each), and the ledger then has its two minutes to
 *    itself (on the D155 fix round's gate, 28 Nov, with the machine loaded beside it, the ledger asked behind them had not
 *    come within the two minutes); the time of each is printed. And the order a reader meets who opens Details as soon as the
 *    answer is in, on a second page of the same plan (the reviewer's third look at D155, finding 5): while the solved ledger
 *    is worked out behind Your plan's last questions the page says it shows your current approach's, and the solved ledger
 *    comes, every total and move Node's, within two minutes of the last answer the solve's worker gave before it.
 *    Planted once (PROJECTION_PLANT=histexp: the built page asks history for the expected path instead), the history check
 *    fails.
 * 4. Item 3, the same preview, beside the answer: "Compare the four settings" works the other three out in the background,
 *    nearest first along the dial, each row's survival Node's for the plan at that setting, the plan's own the headline on the
 *    first paths; choosing another setting re-solves the plan there, its row the figure the table showed, the others kept.
 *    Planted once (PROJECTION_PLANT=dialfar: the built page solves the settings farthest first), the order check fails.
 * 5. Item 4, the same preview, S188 (working, retiring at its plan's age), What if: the age card's line at the plan's own age
 *    is the headline's figures, Node's; "Solve retiring at ..." works out the ages three either side, nearest first, the
 *    earlier first on a tie, each line's survival Node's for the plan retiring at that age. S126, retired, has no age card.
 *    Planted once (PROJECTION_PLANT=agelate: the later age first on a tie), the order check fails.
 * 6. Item 5, on S188's What if: "The solved plan's limits" searches over solves for the highest target the solved plan keeps
 *    at 90% and the earliest retirement it keeps there (src/solverSearch.js); the page's answers and every setting it tried
 *    are Node's, the same search over the same solves. Planted once (PROJECTION_PLANT=simpleseed: the card's paths from
 *    another seed), the answers check fails.
 * 7. Item 6, the same preview, S126 and a saved scenario spending £2,000 more, What if: the current plan's line is the
 *    headline's figures, Node's; "Solve this scenario" solves the scenario in workers of its own, its line Node's for that
 *    plan. Planted once (PROJECTION_PLANT=scenseed: the scenario solved on another seed), the scenario check fails.
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
  await ctx.addInitScript(([k, pl]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, JSON.stringify(pl)); sessionStorage.setItem('seeded', '1'); } }, [STORE, plan]);
  await p.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  return { p, errs, ctx };
}
// the new planner's places, by their names in the tab strip (step U)
const place = async (p, label) => { await p.evaluate(l => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(t => t.textContent.trim() === l); if (x) x.click(); }, label); await p.waitForTimeout(800); };

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), M = await load('src/solver/model.js');
  const { solveForApp } = await load('src/solverApp.js'), { solvedContext, yourContext, rowsOf, strategyOf } = await load('src/solverStrategy.js');
  const { atDial, dialOrder, ageOptions, atAge } = await load('src/solverSettings.js');
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const plan = buildScenarios().find(s => s.id === 'S126').plan;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  const OUT = mkdtempSync(join(tmpdir(), 'solver-projection-'));
  let server = null;
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, SOLVER_HARNESS: '1', SOLVER_HARNESS_OPTS: JSON.stringify(LIGHT), PLANNER_PLANT: PLANTS.has('outlookswap') ? 'outlookswap' : '' } });
    if (PLANTS.has('histexp')) {
      // the plant: the page asks history for the expected path instead (item 7's history check must fail)
      const dir = join(OUT, 'assets'); let hit = 0;
      for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
        const src = readFileSync(join(dir, f), 'utf8'), out = src.replace(/market:([\w$]+)===`expected`\?`expected`:\{historical:!0,startYear:\1\}/, () => { hit++; return 'market:`expected`'; });
        if (out !== src) writeFileSync(join(dir, f), out);
      }
      ok('PLANTED: the page asks history for the expected path (the history check below must FAIL)', hit === 1, `${hit} place patched`);
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
    // 2. Your plan's outlook (item 2, in the new planner: step U, LAYOUT.md section 3.1): from the headline's own runs, its
    // money bands the engine's monteCarlo bands on the same paths and seed within a relative 1e-12 for each arm (the money
    // passes through Math.pow, which Node and Chromium round differently in the last place: pow-probe.cjs), and the spending
    // bands Node's bit for bit
    const done2 = await p.waitForSelector('[data-plan-answer="done"]', { timeout: 900000 }).then(() => true, () => false);
    const saved = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE);
    const r = solveForApp(E, M, saved, LIGHT);
    const pageOut = done2 ? await p.evaluate(() => ({ spend: JSON.parse(document.querySelector('[data-outlook="spend"]').dataset.outlookBands), wealth: JSON.parse(document.querySelector('[data-outlook="wealth"]').dataset.outlookBands) })) : null;
    const mcS = E.monteCarlo(solvedContext(E, r), { trials: TRIALS, seed: SEED, collectPaths: true }).bands, mcY = E.monteCarlo(yourContext(E, saved), { trials: TRIALS, seed: SEED, collectPaths: true }).bands;
    const nodeOut = strategyOf(E, r, saved, { trials: TRIALS, seed: SEED }).outlook;
    const relOf = (arm, mc) => mc.length === pageOut.wealth[arm].length ? Math.max(...mc.flatMap((bd, t) => ['p10', 'p25', 'p50', 'p75', 'p90'].map(k => Math.abs(pageOut.wealth[arm][t][k] - bd[k]) / Math.max(1, Math.abs(bd[k]))))) : Infinity;
    const relS = pageOut ? relOf('solved', mcS) : Infinity, relY = pageOut ? relOf('yours', mcY) : Infinity;
    ok('Your plan\'s outlook: the money bands the engine\'s monteCarlo bands for each arm within 1e-12, the spending bands Node\'s',
      !!pageOut && relS <= 1e-12 && relY <= 1e-12 && JSON.stringify(pageOut.spend) === JSON.stringify(nodeOut.spend),
      pageOut ? `${pageOut.wealth.solved.length} years; the median at the end ${Math.round(pageOut.wealth.solved[pageOut.wealth.solved.length - 1].p50)} (the engine ${Math.round(mcS[mcS.length - 1].p50)}); the solved plan's within ${relS.toExponential(1)}, yours within ${relY.toExponential(1)}` : 'no outlook');

    if (want('3')) {
    // 3. item 7, in Details: the year by year ledger and the history check
    const yc = yourContext(E, saved);
    const x = rowsOf(E, r, 'expected');
    // Your plan's last questions first: after its paths are all in it asks the solve for this year's actions and the rule of
    // thumb on 1,000 paired paths each (src/PlannerPlan.jsx), and the solve's worker answers its questions in turn, so the
    // ledger asked behind them waits for them. On the fix round's gate (28 Nov), with the machine loaded beside it, they took
    // longer than the ledger's two minutes and the check read the ledger before it came; waiting for them here leaves the two
    // minutes to the ledger itself, and the time each took is printed beside the check
    const t0 = Date.now();
    const extras = await p.waitForSelector('[data-place="plan"] [data-strategy-actions="done"]', { timeout: 900000 }).then(() => p.waitForSelector('[data-place="plan"] [data-strategy-rule]', { state: 'attached', timeout: 900000 })).then(() => true, () => false);
    const tExtras = Math.round((Date.now() - t0) / 1000);
    await place(p, 'Details');
    const t1 = Date.now();
    const solvedLedger = await p.waitForSelector('[data-place="details"] [data-audit-ledger="solved"]', { timeout: 120000 }).then(() => true, () => false);
    const tLedger = Math.round((Date.now() - t1) / 1000);
    const page = await p.$$eval('[data-place="details"] [data-audit-total]', els => els.map(el => ({ total: Number(el.dataset.auditTotal), act: (el.querySelector('[data-audit-action]') || { dataset: {} }).dataset.auditAction })));
    const badTotal = page.filter((q, t) => !x.rows[t] || q.total !== x.rows[t].totalCombined).length, badAct = page.filter((q, t) => q.act !== (x.parts[t] ? JSON.stringify(x.parts[t]) : '')).length;
    ok('Details\' year by year is the solved plan\'s ledger: every year\'s total Node\'s, and every year\'s move Node\'s', solvedLedger && page.length === x.rows.length && badTotal === 0 && badAct === 0,
      `solved ledger ${solvedLedger}, ${page.length} rows (Node ${x.rows.length}), totals differing ${badTotal}, moves differing ${badAct}; Your plan's actions and rule ${extras ? `in after ${tExtras}s` : `not in after ${tExtras}s`}, the ledger ${solvedLedger ? `in ${tLedger}s` : `not in after ${tLedger}s`} later`);
    await p.evaluate(() => { const x = [...document.querySelectorAll('[data-audit-view] button')].find(b => /Your current approach/.test(b.textContent)); if (x) x.click(); });
    const yoursLedger = await p.waitForSelector('[data-audit-ledger="yours"]', { timeout: 10000 }).then(() => true, () => false);
    const yrows = E.simulateDeterministic(yc, 'expected'), ytot = await p.$$eval('[data-audit-total]', els => els.map(el => Number(el.dataset.auditTotal))), yacts = await p.$$('[data-audit-action]');
    ok('"Your current approach" gives your plan\'s ledger, Node\'s, with no move column', yoursLedger && ytot.length === yrows.length && ytot.every((v, t) => v === yrows[t].totalCombined) && yacts.length === 0,
      `your ledger ${yoursLedger}, ${ytot.length} rows, move cells ${yacts.length}`);
    const hs = await p.waitForSelector('[data-history-solved]', { timeout: 120000 }).then(() => true, () => false);
    const h = hs ? await p.$eval('[data-history-solved]', el => ({ survived: el.dataset.historySolved, start: Number(el.dataset.historyStart), terminal: Number(el.dataset.historyTerminal), yours: el.dataset.historyYours, text: el.textContent })) : null;
    const nh = h ? rowsOf(E, r, { historical: true, startYear: h.start }) : null, ny = h ? E.evaluateRows(yc, E.simulateHistorical(yc, h.start)) : null;
    ok('the history check is the solved plan through real history, labelled the out-of-model check: its verdict and pot left Node\'s, your current approach\'s verdict beside it Node\'s',
      !!h && /out-of-model check/i.test(h.text) && h.terminal === nh.verdict.terminalPot && h.survived === (nh.verdict.survived ? 'survived' : 'failed') && h.yours === (ny.survived ? 'survived' : 'failed'),
      h ? `from ${h.start}: the solved plan ${h.survived}, the pot left ${Math.round(h.terminal)} (Node ${Math.round(nh.verdict.terminalPot)}); yours ${h.yours} (Node ${ny.survived ? 'survived' : 'failed'})` : 'no out-of-model check');
    /*
     * THE LEDGER ASKED BEHIND YOUR PLAN'S LAST QUESTIONS, the order a reader meets who opens Details as soon as the answer is in
     * (the reviewer's third look at D155, finding 5): a second page of the same plan (its solve from the first page's store),
     * Details opened the moment its card reads 'done', with this year's actions and the rule of thumb still being worked out.
     * While the solved plan's ledger is not in, the page says whose ledger it shows and that the solved plan's is coming; it
     * comes, every total and move Node's, within two minutes of the last answer the solve's worker gave before it (each answer
     * timed as it arrives, by a listener on the solve's workers)
     */
    {
      const q = await ctx.newPage(), qerrs = [];
      q.on('pageerror', e => qerrs.push(e.message));
      await q.addInitScript(() => {
        const Real = window.Worker;
        window.__answers = [];
        window.Worker = function (url, o) {
          const w = new Real(url, o);
          if (/solverWorker/.test(String(url))) w.addEventListener('message', e => { const d = e.data || {}; for (const k of ['actions', 'distil', 'rows']) if (d[k] !== undefined) window.__answers.push({ k, t: performance.now() }); });
          return w;
        };
      });
      await q.goto(`http://localhost:${PREVIEW_PORT}/`, { waitUntil: 'networkidle' });
      const qDone = await q.waitForSelector('[data-plan-answer="done"]', { timeout: 900000 }).then(() => true, () => false);
      await place(q, 'Details');
      const tOpen = await q.evaluate(() => performance.now());
      const first = await q.evaluate(() => ({ ledger: (document.querySelector('[data-place="details"] [data-audit-ledger]') || { dataset: {} }).dataset.auditLedger || null,
        wait: (document.querySelector('[data-place="details"] [data-audit-wait]') || { dataset: {} }).dataset.auditWait || null,
        heading: /Your current approach, year by year/.test((document.querySelector('[data-place="details"]') || { innerText: '' }).innerText),
        behind: !(window.__answers || []).some(a => a.k === 'actions') }));
      const honest = first.ledger === 'solved' || (first.ledger === 'yours' && first.wait === 'pending' && first.heading);
      const qGot = await q.waitForSelector('[data-place="details"] [data-audit-ledger="solved"]', { timeout: 900000 }).then(() => true, () => false);
      const qPage = await q.$$eval('[data-place="details"] [data-audit-total]', els => els.map(el => ({ total: Number(el.dataset.auditTotal), act: (el.querySelector('[data-audit-action]') || { dataset: {} }).dataset.auditAction })));
      const qBad = qPage.filter((v, t) => !x.rows[t] || v.total !== x.rows[t].totalCombined || v.act !== (x.parts[t] ? JSON.stringify(x.parts[t]) : '')).length;
      const ans = await q.evaluate(() => window.__answers || []);
      const rowsAt = (ans.find(a => a.k === 'rows') || {}).t;
      const before = rowsAt === undefined ? [] : ans.filter(a => a.k !== 'rows' && a.t <= rowsAt);
      const from = rowsAt === undefined ? null : Math.max(tOpen, ...before.map(a => a.t));
      const lag = from === null ? null : Math.round((rowsAt - from) / 1000);
      ok('Details opened before Your plan\'s last answers: while the solved ledger is worked out the page says it shows your current approach\'s, and the solved ledger comes within two minutes of the solve\'s last answer before it, every total and move Node\'s',
        qDone && honest && qGot && qPage.length === x.rows.length && qBad === 0 && lag !== null && lag <= 120,
        `opened with the ledger ${first.ledger} (the line ${first.wait || 'none'}${first.heading ? ', the heading your current approach\'s' : ''}), the actions ${first.behind ? 'not yet in' : 'already in'}; the solved ledger ${qGot && rowsAt !== undefined ? `in ${Math.round((rowsAt - tOpen) / 1000)}s after Details opened, ${lag}s after the last answer before it (${before.map(a => a.k).join(', ') || 'none'})` : 'never in'}; ${qPage.length} rows, ${qBad} differing`);
      ok('the second page: no page errors', qerrs.length === 0, qerrs.slice(0, 2).join(' | '));
      await q.close();
    }
    }
    if (want('4')) {
    // 4. item 3, beside the answer: "Compare the four settings", a table on the first step's paths, nearest first
    await place(p, 'Your plan');
    const nodeHere = strategyOf(E, r, saved, { trials: UPTO, seed: SEED }).headline;
    await p.waitForSelector('[data-solver-aims] [data-figures-show]', { timeout: 300000 }).catch(() => {});
    await p.evaluate(() => { const b = document.querySelector('[data-solver-aims] [data-figures-show]'); if (b) b.click(); });
    const seen = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 1500000) {
      const got = await p.$$eval('[data-figures="dial"] [data-figures-pos]', els => els.filter(el => el.dataset.figuresSurvival !== '').map(el => Number(el.dataset.figuresPos))).catch(() => []);
      for (const x of got) if (!seen.includes(x)) seen.push(x);
      if (got.length === 4) break;
      await p.waitForTimeout(500);
    }
    const others = seen.filter(x => x !== 1);
    ok('"Compare the four settings" works the other three out nearest first along the dial', others.length === 3 && others.join(',') === dialOrder(1).join(','), `filled in ${others.join(', ') || 'none'} (nearest first ${dialOrder(1).join(', ')})`);
    const listed = Object.fromEntries(await p.$$eval('[data-figures="dial"] [data-figures-pos]', els => els.map(el => [el.dataset.figuresPos, el.dataset.figuresSurvival === '' ? null : Number(el.dataset.figuresSurvival)])));
    const nodeAt = {};
    for (const x of [3, 6, 10]) { const px = atDial(saved, x); nodeAt[x] = strategyOf(E, solveForApp(E, M, px, LIGHT), px, { trials: UPTO, seed: SEED }).headline.survival; }
    ok('each setting\'s row is Node\'s for the plan at that setting, the plan\'s own the headline on the first paths', [3, 6, 10].every(x => listed[x] === nodeAt[x]) && listed[1] === nodeHere.survival,
      [1, 3, 6, 10].map(x => `${x}: ${listed[x]}% (Node ${x === 1 ? nodeHere.survival : nodeAt[x]}%)`).join(', '));
    await p.evaluate(() => { const b = document.querySelector('[data-solver-choice="cuts"] [data-value="3"]'); if (b) b.click(); });
    const moved = await p.waitForFunction(() => { const el = document.querySelector('[data-figures="dial"] tr[data-figures-pos="3"]'); return el && /\(yours\)/.test(el.textContent) && el.dataset.figuresSurvival !== ''; }, null, { timeout: 900000 }).then(() => true, () => false);
    const kept = Object.fromEntries(await p.$$eval('[data-figures="dial"] [data-figures-pos]', els => els.map(el => [el.dataset.figuresPos, el.dataset.figuresSurvival === '' ? null : Number(el.dataset.figuresSurvival)])));
    ok('choosing Medium re-solves the plan there: its row the figure the table showed, the other settings\' figures kept', moved && kept[3] === listed[3] && [1, 6, 10].every(x => kept[x] === listed[x]),
      `Medium ${kept[3]}% (listed ${listed[3]}%); kept ${[1, 6, 10].map(x => `${x}: ${kept[x]}%`).join(', ')}`);
    }
    await place(p, 'What if'); await p.waitForTimeout(1500);
    ok('S126, retired, has no age card on What if', !(await p.$('[data-solver-ages]')));
    ok('switch on: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();

    if (want('5')) {
    // 5. item 4, on What if: the age card, on a household still working
    {
      const plan188 = buildScenarios().find(x => x.id === 'S188').plan;
      const { p, errs, ctx } = await open(b, PREVIEW_PORT, plan188);
      const solved188 = await p.waitForSelector('[data-solve-state="solved"]', { timeout: 900000 }).then(() => true, () => false);
      await place(p, 'What if');
      const line = await p.waitForSelector('[data-figures="ages"] [data-figures-line]', { timeout: 300000 }).then(() => true, () => false);
      const saved188 = await p.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE);
      const r188 = solveForApp(E, M, saved188, LIGHT), own = strategyOf(E, r188, saved188, { trials: UPTO, seed: SEED }).headline;
      const at = line ? await p.$eval('[data-figures="ages"] [data-figures-line]', el => ({ at: Number(el.dataset.figuresAt), survival: Number(el.dataset.figuresSurvival), text: el.textContent })) : null;
      const ao = ageOptions(saved188, solvedContext(E, r188).owners[0].age0);
      ok('the age card\'s line at the plan\'s own age is the headline\'s figures, Node\'s', solved188 && !!at && !!ao && at.at === ao.own && at.survival === own.survival, at ? `"${at.text.trim()}" (Node ${own.survival}%)` : `solved ${solved188}, no line`);
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

      // 6. item 5, on What if: the solved plan's limits, the same search Node runs over the same solves
      if (want('6')) {
        const { highestTarget, earliestAge } = await load('src/solverSearch.js');
        const { atSpend } = await load('src/solverSettings.js');
        const from = Number(saved188.spending.targetSpend);
        await p.evaluate(() => { const b = document.querySelector('[data-solver-answers="full"] [data-simple-solver-ask]'); if (b) b.click(); });
        const done = await p.waitForSelector('[data-solver-answers="full"][data-simple-solver="done"]', { timeout: 3600000 }).then(() => true, () => false);
        const got = done ? await p.$eval('[data-solver-answers="full"]', el => ({ spend: el.dataset.simpleSolverSpend, age: el.dataset.simpleSolverAge, tried: JSON.parse(el.dataset.simpleSolverTried), text: el.textContent })) : null;
        const evalAt = make => async v => { const pl = make(v); return strategyOf(E, solveForApp(E, M, pl, LIGHT), pl, { trials: UPTO, seed: SEED }).headline.survival; };
        const age0 = solvedContext(E, r188).owners[0].age0, terminal = E.normalizePlan(saved188).demographics.terminalAge;
        const nt = await highestTarget(evalAt(v => atSpend(saved188, v)), { from });
        const na = await earliestAge(evalAt(v => atAge(saved188, v)), { from: Number(saved188.demographics.retireAgeSelf), after: age0, last: Number(terminal) - 1 });
        const same = got && String(nt.spend ?? '') === got.spend && String(na.age ?? '') === got.age && got.tried.spend.join(',') === nt.tried.map(t => t.x).join(',') && got.tried.age.join(',') === na.tried.map(t => t.x).join(',');
        ok('What if\'s limits are Node\'s search over the same solves, every setting tried the same, named apart from the safe starting spend',
          done && same && /Highest target the solved plan keeps at 90%/.test(got.text) && /Earliest retirement the solved plan keeps at 90%/.test(got.text) && /The solved plan.s limits/.test(got.text),
          got ? `the highest target £${got.spend} (Node £${nt.spend}; tried ${got.tried.spend.join(', ')}), the earliest age ${got.age} (Node ${na.age})` : 'not done');
      }
      ok('switch on, S188: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
    }
    if (want('7')) {
    // 7. item 6, on What if: scenarios each carry a solve, on request
    {
      const planB = { ...plan, spending: { ...plan.spending, targetSpend: Number(plan.spending.targetSpend) + 2000 } };
      const ctx7 = await b.newContext({ viewport: { width: 1400, height: 1100 } }), p = await ctx7.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await ctx7.addInitScript(([k, pl, pb]) => { if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(k, JSON.stringify(pl));
        localStorage.setItem('rp_saved_scenarios_v3', JSON.stringify([{ id: 's1', name: 'Scenario 1', data: pl }, { id: 's2', name: 'Spend 2000 more', data: pb }]));
        sessionStorage.setItem('seeded', '1'); } }, [STORE, plan, planB]);
      await p.goto(`http://localhost:${PREVIEW_PORT}/`, { waitUntil: 'networkidle' });
      const solved7 = await p.waitForSelector('[data-solve-state="solved"]', { timeout: 900000 }).then(() => true, () => false);
      await place(p, 'What if');
      const card = await p.waitForFunction(() => { const el = document.querySelector('[data-solver-scenario="__current__"]'); return el && el.dataset.solverScenarioSurvival !== ''; }, null, { timeout: 300000 }).then(() => true, () => false);
      const base = card ? await p.$eval('[data-solver-scenario="__current__"]', el => Number(el.dataset.solverScenarioSurvival)) : null;
      await p.evaluate(() => { const x = document.querySelector('[data-solver-scenario="s2"] [data-solver-scenario-ask]'); if (x) x.click(); });
      const got = await p.waitForFunction(() => { const el = document.querySelector('[data-solver-scenario="s2"]'); return el && el.dataset.solverScenarioSurvival !== ''; }, null, { timeout: 900000 }).then(() => true, () => false);
      const sv = got ? await p.$eval('[data-solver-scenario="s2"]', el => ({ survival: Number(el.dataset.solverScenarioSurvival), text: el.textContent })) : null;
      const nodeBase = strategyOf(E, solveForApp(E, M, plan, LIGHT), plan, { trials: UPTO, seed: SEED }).headline.survival;
      const nodeB = strategyOf(E, solveForApp(E, M, planB, LIGHT), planB, { trials: UPTO, seed: SEED }).headline.survival;
      ok('on What if, the current plan\'s line is Node\'s, and "Solve this scenario" gives the scenario\'s, Node\'s', solved7 && card && base === nodeBase && !!sv && sv.survival === nodeB,
        `the plan ${base}% (Node ${nodeBase}%), the scenario ${sv ? sv.survival : '-'}% (Node ${nodeB}%)`);
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
