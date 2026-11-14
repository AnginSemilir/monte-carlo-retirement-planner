/*
 * STEP U: THE NEW PLANNER (research/reviews/2026-11-03/LAYOUT.md section 11.1; the launch plan's step U). REQUIRED.
 *
 * Builds its own harness build at the light settings (as solver-strategy does: vite.config.js solver-harness; the switch and
 * PLANNER_BETA on in the source since Phase 12), opts in (rp_planner 'new'), and runs on a desktop viewport (1,440 by 900) and an iPhone 13. Each case's fixture
 * is a library household chosen because it reads so at the light settings (never anybody's own plan):
 *   MAIN  S116: 61, retired, a plan that starts below its target (a dip), the canvas's main example at full scale;
 *   RAISE S090: 61, retired, at its target from the first year, with an Auto deposit (the raise line absent: L13; the policy
 *         routes the deposit, so a policy change moves the key);
 *   WORK  S224: 55, still working (the age card).
 * Its checks, each numbered as LAYOUT.md section 11.1 numbers them:
 *   1  the places: four, in order, each with its data-place; none of the classic labels;
 *   2  the first solve: the strip idle, solving, simulating, solved; the card solving, filling, done; its figures the
 *      reference's bit for bit once all its paths are in (strategyOf on the saved plan at the same light settings and seed,
 *      from the unbundled source in this same Chromium: lib/reference.cjs, 13 Nov 2026; before it Node's, the money within a
 *      relative 1e-12, until this container's Chromium parted from Node in exp and log as well as pow), and the two survival
 *      figures Node's;
 *   3  beside the answer: the levers panel right of the card, its top within 40px; no line under the dial repeating the
 *      answer's figures; "Compare the four settings" gives four rows on the first step's paths, the plan's own marked, a queued
 *      row saying "waiting its turn";
 *   4  a lever: the dial moves data-solve-key; the card stale with its band and percentage, the old figures readable; then the
 *      new answer, the band gone;
 *   5  the outlook, read from the drawing: both charts; each mark's figures (data-x, data-y, read back from where it was drawn)
 *      equal the worker's (data-outlook-bands, data-outlook-typical); the line's first ten years the ten-year rows'; the line
 *      unmoved once every path is in; the back mark at the headline's back year; the raise line where it adds to the headline,
 *      and none on S090;
 *   6  this year, the rule, ten years, the comparison, with the comparison's new title and column;
 *   7  You: seven sections in order, Limits sixth, Your current approach in the seventh, each control's line; a guardrails
 *      change keeps data-solve-key and re-runs the comparison (its column moves, the solved plan's figures the same bit for
 *      bit); an input change makes the plan stale; Your money gives each pot's annual contribution and its yearly increase,
 *      editable, named so and drawn like its balance, a contribution typed in reaching the plan; on S090 a policy change
 *      moves the key;
 *   8  What if: the age card for a working household and none for a retired one; the target card's five options; the limits
 *      card and the scenarios card; each saying its cost before it is asked;
 *   9  Details: the solved ledger with its action column; the history check; Assumptions with Display and the solver's
 *      settings; the docs section;
 *  10  a couple: the couples card on three places; "Open the classic planner" shows the classic tabs, and a reload keeps them;
 *      with couples off, You's Limits as before D5 (a row a wrapper for the household, no line for the two of them) and its
 *      first change writing the household's ceiling alone (the reviewer of 14 Nov, finding 1);
 *  11  a failure (the worker planted to fail every question): the failure card, "Try again", the classic link, your current
 *      approach's figures under it, its money chart named as yours alone (there is no solved plan), the levers still usable;
 *  12  the phone: the four places each 44px or more; no horizontal scroll on any place; nothing solved and no solver chunk
 *      fetched until "Solve my plan"; the six slides by the step bar and by swipe; the levers sheet opened and shut with Escape;
 *      a change in it makes the plan stale (data-solve-key unchanged until asked), and the worker is asked nothing until
 *      "Solve again";
 *  13  the quick start: an empty plan shows it; "Work out my plan" waits for the four readiness fields; filled, it builds
 *      the plan and solves; it asks each pot's annual contribution and the contribution's yearly increase, and the plan it
 *      builds carries them (D62, 8 Nov; before it, a pointer to You, Your money);
 *  14  the classic planner, the switch on, fetches none of the solver's chunks;
 *  15  the opt-in both ways (Phase 12 item 3; the readiness checklist's "switched on and off without losing a plan"): from the
 *      classic planner "Try the new planner (beta)" opens the new planner and "Classic planner" comes back, each time with
 *      the saved plan as it was and rp_planner as chosen, and a reload keeping the choice;
 *  16  the rollback (B6: "one deploy turns it off for everyone"): a build with PLANNER_BETA false (vite.config.js
 *      solver-harness, PLANNER_BETA_OFF=1) shows a visitor who opted in the classic planner, with no opt-in;
 *  17  the rename pass (Phase 12 item 1): no tournament word ("tournament", "recommended policy", "bridge safety margin") and
 *      no classic tab's name on any of the four places, Details' full documentation open; the documentation leads with how the
 *      solver decides, the coverage card lists the solver's approximations, the glossary gives its four words;
 *  19  couples on (Part D, D5.5): a build with COUPLES_ON=1 (vite.config.js solver-harness: src/couplesSwitch.js COUPLES true);
 *      a library couple holding its money 60/40 solves in the new planner (each person's table, then the couple): no couples
 *      card, the headline said to the two of them, this year's actions each named for its person, every figure the
 *      reference's bit for bit (the couple solved from the unbundled source in this Chromium as the worker solves it:
 *      src/solverCouple.js couplePlans, solveForApp for each person with their partner's age, assembleCouple; strategyOf on
 *      it); a reload restores both tables from the store (the diagnostic: restored, parts above one), every figure the
 *      reference's again (whether the parts then run shares of the paths the page cannot show: couple-split.test.mjs);
 *      You's Limits gives each person their own ceiling rows and says the pension age and the lump sum hold for both;
 *      the same couple re-held 90/10 shows the couples card with its reason ('uneven'); and check 10's card, couples off,
 *      gives its reason 'off'; the speed mode offered to the couple with the couple's warning (D98);
 *  20  the speed mode (D97 (3), D98, on the main fixture): its box in the levers off by default with the single's warning,
 *      the maintainer's words; on, the plan carries `solver.speed` 'fast' and solves under a key of its own, every figure the
 *      reference's for that plan (the reference solving it in speed mode); off again, no field left on the plan and the plan's
 *      own key back;
 *  18  the diagnostic (Phase 12 item 4, F17): "Copy the details for a bug report" in Details on a solved plan gives the
 *      whitelist's fields in order and no number of 100 or more outside the lines of counts, seconds, versions and hex; on the
 *      failure card, not completed and the error's words.
 * Its plants (PLANNER_PLANT, built into the preview: src/plannerPlant.js), each failing exactly its own check, all in one
 * run with --plants (results-planner-ui-plants.txt): leversunder (3), fifthplace (1), onefewer (2), noband (4), chartyear (5),
 * keyguard (7), contribold (7: Your money's contributions drawn grey and their increase named as the classic table names it),
 * nocouple (10), lockspart (10: You's Limits giving a couple the solver does not run the card for two, as f1b2b457 did),
 * failboth (11: the failure view's money chart drawn as both arms, the solved plan's named), phonesolve (12),
 * staleask (12), navtarget40 (12), noquickcontrib (13: the plan the quick start builds without the contributions it was given),
 * classicfetch (14), optinloses (15: the switch between the planners resets the plan), betaignored (16: the page reads
 * rp_planner whatever PLANNER_BETA says), tournamentdocs (17: the documentation keeps the tournament's sections in the new
 * planner), diagwhole (18: the diagnostic appends the solve's record whole), couplecard (19: an in-band couple shown the couples
 * card), coupleage (19: each person's table solved without their partner's age, which the couple's assembly refuses),
 * speedoff (20: the speed mode's box writes nothing to the plan), speedcouple (10: the speed mode offered to a couple the
 * solver does not run).
 *   node research/ui-harnesses/solver-planner-ui.cjs [port] [--plants]      (the build is served on port + 11, the rollback on + 12, couples on + 13)
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const { reference } = require('./lib/reference.cjs');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const args = process.argv.slice(2), PLANTS_RUN = args.includes('--plants');
const PORT = args.find(a => /^\d+$/.test(a)) || '4173', PREVIEW_PORT = String(Number(PORT) + 11), ROLLBACK_PORT = String(Number(PORT) + 12), COUPLES_PORT = String(Number(PORT) + 13);
const ROOT = join(__dirname, '../..');
const STORE = 'rp_plan_full_v28', SEED = 12345;
// the speed mode's two warnings, the maintainer's word for word (D98; src/solverWords.js SPEED_WORDS, pinned to the same words by
// research/tests/speed-mode.test.mjs check 7)
const SPEED_SINGLE = 'Speed mode works out your figures about twice as fast by looking at fewer options in each simulated year. In our tests it very slightly lowered the chance your money lasts: about 2 in 10,000 on average, and at most about 2 in 1,000. This year\'s recommended actions still use every option.';
const SPEED_COUPLE = 'For couples, speed mode is less tested. It ranged from slightly slower to nearly twice as fast, and it spent a little less and held slightly less in shares than the full calculation. Use the full calculation for decisions.';
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, strategySteps: [200, 500], strategyActionsN: 300 };
const FIX = { main: 'S116', raise: 'S090', work: 'S224' };
const ALL_PLANTS = ['leversunder', 'fifthplace', 'onefewer', 'noband', 'chartyear', 'keyguard', 'contribold', 'nocouple', 'lockspart', 'failboth', 'phonesolve', 'staleask', 'navtarget40', 'noquickcontrib', 'classicfetch', 'optinloses', 'betaignored', 'tournamentdocs', 'diagwhole', 'couplecard', 'coupleage', 'speedoff', 'speedcouple'];
const PLANT_CHECKS = { leversunder: 3, fifthplace: 1, onefewer: 2, noband: 4, chartyear: 5, keyguard: 7, contribold: 7, nocouple: 10, lockspart: 10, failboth: 11, phonesolve: 12, staleask: 12, navtarget40: 12, noquickcontrib: 13, classicfetch: 14, optinloses: 15, betaignored: 16, tournamentdocs: 17, diagwhole: 18, couplecard: 19, coupleage: 19, speedoff: 20, speedcouple: 10 };
const PLANTED = PLANTS_RUN ? ALL_PLANTS : (process.env.PLANNER_PLANT || '').split(',').filter(Boolean);
const failed = new Set();
let fails = 0;
const ok = (n, l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${n}. ${l}${d ? '   ' + d : ''}`); if (!c) { fails++; failed.add(n); } };
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
const VITE = join(ROOT, 'node_modules/vite/bin/vite.js');
const CLASSIC_LABELS = ['Strategy', 'Config & Assumptions', 'Audit Data Table', 'Historical Backtest'];
// the tournament's words and the classic tabs' names (Phase 12 item 1, the rename pass: they never reach the new planner)
const TOURNAMENT_WORDS = [/tournament/i, /recommended polic/i, /bridge safety margin/i, /\bStrategy tab\b/, /\bConfig tab\b/, /\bProjection tab\b/, /\bPlan Inputs\b/];
const PLACES = [['plan', 'Your plan'], ['you', 'You'], ['whatif', 'What if'], ['details', 'Details']];

// a page with the plan saved (or none), the planner chosen, and the solver's worker watched: each message the page sends it,
// with the strip's state at the time (check 12), and, planted, every question answered with an error (check 11)
async function open(b, plan, { phone = false, planner = 'new', plantFail = false, port = PREVIEW_PORT } = {}) {
  const ctx = await b.newContext(phone ? { ...devices['iPhone 13'] } : { viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(([fail]) => {
    window.__asks = [];
    const Real = window.Worker;
    window.Worker = function (url, o) {
      if (!/solverWorker/.test(String(url))) return new Real(url, o);
      if (fail) {
        const w = { onmessage: null, onerror: null, terminate() {}, addEventListener() {}, removeEventListener() {}, postMessage(m) { setTimeout(() => w.onmessage && w.onmessage({ data: { id: (m && m.id) || 0, error: 'planted: the solver failed' } }), 0); } };
        return w;
      }
      const w = new Real(url, o), post = w.postMessage.bind(w);
      w.postMessage = (m, t) => { const el = document.querySelector('[data-solve-status]'); window.__asks.push({ kind: m && m.kind, state: el ? el.dataset.solveState : null }); return post(m, t); };
      return w;
    };
  }, [plantFail]);
  const p = await ctx.newPage();
  const errs = [], urls = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', q => urls.push(q.url()));
  await p.addInitScript(([k, pl, pick]) => {
    if (sessionStorage.getItem('seeded')) return;
    if (pl) localStorage.setItem(k, JSON.stringify(pl)); else localStorage.removeItem(k);
    localStorage.setItem('rp_which_app', 'full');
    if (pick) localStorage.setItem('rp_planner', pick); else localStorage.removeItem('rp_planner');
    sessionStorage.setItem('seeded', '1');
  }, [STORE, plan, planner]);
  await p.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  return { p, errs, urls };
}
const goPlace = async (p, label) => { await p.evaluate(l => { const x = [...document.querySelectorAll('[data-tabbar] button, [data-bottomnav] button')].find(b => b.textContent.trim() === l); if (x) x.click(); }, label); await p.waitForTimeout(500); };
const saved = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), STORE);
const strip = p => p.evaluate(() => { const el = document.querySelector('[data-solve-status]'); return el ? { state: el.dataset.stripState, solve: el.dataset.solveState, key: el.dataset.solveKey, text: el.textContent } : null; });
const card = p => p.evaluate(() => { const el = document.querySelector('[data-plan-answer]'); return el ? el.dataset.planAnswer : null; });
// how long a wait for the page may take: fifteen minutes on a clean build (a light-settings solve takes under half a minute),
// two and a half in the plants run, where 'onefewer' keeps the card from ever reaching 'done' and each wait would run out
const WAIT_MS = PLANTS_RUN ? 150000 : 900000;
const waitCard = (p, state, ms = WAIT_MS) => p.waitForSelector(`[data-plan-answer="${state}"]`, { timeout: ms }).then(() => true, () => false);
const figs = p => p.evaluate(() => { const el = document.querySelector('[data-strategy-figures]'); return el ? JSON.parse(el.dataset.strategyFigures) : null; });
const box = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, h: r.height }; }, sel);
// an element's text now, '' when it is not there: p.textContent waits for the element (30 s), which a plant that removes it
// (noband) turned into a long hang inside a loop
const textNow = (p, sel) => p.evaluate(q => { const el = document.querySelector(q); return el ? el.textContent : ''; }, sel);
const relDiff = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(b));
// the diagnostic (check 18): press "Copy the details for a bug report" inside `scope`, read the text shown; its fields; and every
// number of 100 or more outside the lines that carry counts, seconds, versions and hex (grid, times, browser, key, code)
const diagnosticIn = async (p, scope) => {
  await p.click(`${scope} [data-diagnostic-copy]`).catch(() => {});
  const text = await p.waitForSelector(`${scope} [data-diagnostic]`, { timeout: 10000 }).then(el => el.textContent(), () => null);
  if (!text) return null;
  const lines = text.split('\n').slice(1), fields = lines.map(l => l.split(':')[0]);
  const big = lines.filter(l => !/^(grid|times|browser|key|code): /.test(l)).flatMap(l => (l.match(/\d[\d,.]*/g) || []).filter(n => Number(n.replace(/,/g, '')) >= 100));
  return { fields, big, at: Object.fromEntries(lines.map(l => [l.split(':')[0], l.slice(l.indexOf(':') + 2)])) };
};
const DIAG_FIELDS = ['code', 'key', 'state', 'completed', 'dial', 'aims', 'limits', 'floor', 'grid', 'times', 'parts', 'isolated', 'browser', 'error'];
// where two figure sets first part, for a failing check's line: the path to it and the two values
const firstDiff = (a, b, at = '') => {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = firstDiff(a[k], b[k], `${at}.${k}`); if (d) return d; }
  }
  return `${at || '(top)'}: page ${JSON.stringify(a)} against the reference ${JSON.stringify(b)}`.slice(0, 240);
};

(async () => {
  execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' });
  const E = await load('research/engine.mjs'), M = await load('src/solver/model.js');
  const { solveForApp } = await load('src/solverApp.js'), S = await load('src/solverStrategy.js');
  const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
  const all = buildScenarios(), planOf = id => all.find(s => s.id === id).plan;
  const couple = all.find(s => E.normalizePlan(s.plan).demographics.planningMode === 'couple');
  const last = LIGHT.strategySteps[LIGHT.strategySteps.length - 1];
  const nodeOf = pl => { const r = solveForApp(E, M, pl, LIGHT); return { r, s: S.strategyOf(E, r, pl, { trials: last, seed: SEED }), first: S.strategyOf(E, r, pl, { trials: LIGHT.strategySteps[0], seed: SEED }) }; };

  const OUT = mkdtempSync(join(tmpdir(), 'solver-planner-'));
  let server = null;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  // the reference: the same figures from the unbundled source, in this Chromium (lib/reference.cjs); as JSON, the route the
  // page's own figures take
  const ref = await reference(b);
  const refStrategy = async pl => JSON.parse(await ref.run(async ({ pl, light, seed, trials }) => {
    const E = await import('/research/engine.mjs'), M = await import('/src/solver/model.js');
    const { solveForApp } = await import('/src/solverApp.js'), { strategyOf } = await import('/src/solverStrategy.js');
    return JSON.stringify(strategyOf(E, solveForApp(E, M, pl, light), pl, { trials, seed }));
  }, { pl, light: LIGHT, seed: SEED, trials: last }));
  // a couple's reference (Part D, D5.5): solved as the worker solves it, each person's table then the couple, in this Chromium
  const refCouple = async pl => JSON.parse(await ref.run(async ({ pl, light, seed, trials }) => {
    const E = await import('/research/engine.mjs'), M = await import('/src/solver/model.js');
    const { solveForApp } = await import('/src/solverApp.js'), { strategyOf } = await import('/src/solverStrategy.js');
    const { couplePlans, assembleCouple } = await import('/src/solverCouple.js');
    const cut = couplePlans(E, pl), one = w => solveForApp(E, M, cut.plans[w], { ...light, ageWith: cut.ageWith[w] });
    const cp = assembleCouple(E, M, cut.household, { self: one('self'), part: one('part') }, { solvedOn: { self: { plan: cut.plans.self, ageWith: cut.ageWith.self }, part: { plan: cut.plans.part, ageWith: cut.ageWith.part } } });
    return JSON.stringify(strategyOf(E, cp, pl, { trials, seed }));
  }, { pl, light: LIGHT, seed: SEED, trials: last }));
  try {
    execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, SOLVER_HARNESS: '1', SOLVER_HARNESS_OPTS: JSON.stringify(LIGHT), PLANNER_PLANT: PLANTED.join(',') } });
    server = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT, '--port', PREVIEW_PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    let up = false;
    for (let i = 0; i < 40 && !up; i++) { try { const r = await fetch(`http://localhost:${PREVIEW_PORT}/`); up = r.ok; } catch (e) { await new Promise(res => setTimeout(res, 500)); } }
    console.log(`the harness's build (the switch and PLANNER_BETA on, as the source has them${PLANTED.length ? `; planted: ${PLANTED.join(', ')}` : ''}) served: ${up}`);

    // ---------------------------------------------------------------- 14. the classic planner fetches no solver chunk
    { const { p, errs, urls } = await open(b, planOf(FIX.main), { planner: null });
      for (const t of ['Projection', 'Strategy', 'Config & Assumptions']) { await goPlace(p, t); }
      await p.waitForTimeout(1500);
      const got = urls.filter(u => /solverClient|solverWorker|PlannerPlan|SolverConfig|SolverFigures/.test(u));
      const tabs = await p.$$eval('[data-tabbar] button', bs => bs.map(x => x.textContent.trim()));
      ok(14, 'the classic planner under SOLVER true: its own tabs, none of the solver\'s chunks fetched', got.length === 0 && tabs.includes('Plan Inputs') && !(await p.$('[data-place]')), got.join(', ') || `${urls.length} requests`);
      ok(14, 'the classic planner: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close(); }

    // ---------------------------------------------------------------- 1 to 7 and 9 on the main fixture, a desktop
    { const { p, errs, urls } = await open(b, planOf(FIX.main));
      // 1. the places
      const labels = await p.$$eval('[data-tabbar] button', bs => bs.map(x => x.textContent.trim()));
      const seen = [];
      for (const [id, label] of PLACES) { await goPlace(p, label); if (await p.$(`[data-place="${id}"]`)) seen.push(id); }
      const body = await p.evaluate(() => [...document.querySelectorAll('[data-tabbar], [data-bottomnav]')].map(n => n.textContent).join(' '));
      ok(1, 'four places in order, each with its data-place, none of the classic labels', JSON.stringify(labels) === JSON.stringify(PLACES.map(x => x[1])) && seen.length === 4 && !CLASSIC_LABELS.some(l => body.includes(l)), `${labels.join(' | ')}; reached ${seen.join(', ')}`);
      await goPlace(p, 'Your plan');

      // 2. the first solve: the strip's and the card's states as they pass
      const stripSeen = [], cardSeen = [], pcts = [];
      let typAtFilling = null;
      for (let i = 0; i < WAIT_MS / 200; i++) {
        const [st, cd] = await Promise.all([strip(p), card(p)]);
        if (st && stripSeen[stripSeen.length - 1] !== st.state) stripSeen.push(st.state);
        if (cd && cardSeen[cardSeen.length - 1] !== cd) cardSeen.push(cd);
        const m = st && /(\d+)%/.exec(st.text); if (m && st.state === 'solving') pcts.push(Number(m[1]));
        if (cd === 'filling' && typAtFilling === null) typAtFilling = await p.$eval('[data-outlook="spend"]', el => el.dataset.outlookTypical).catch(() => null);
        if (cd === 'done' && st && st.state === 'solved') break;
        await p.waitForTimeout(200);
      }
      const order = (seq, want) => { let k = 0; for (const x of seq) if (x === want[k]) k++; return k === want.length; };
      const rising = pcts.length > 1 && pcts[pcts.length - 1] > pcts[0];
      ok(2, 'the strip: solving with its percentage rising, then simulating, then solved', order(stripSeen, ['solving', 'simulating', 'solved']) && rising, `${stripSeen.join(' > ')}; ${pcts[0]}% to ${pcts[pcts.length - 1]}%`);
      ok(2, 'the card: solving, then filling, then done', order(cardSeen, ['solving', 'filling', 'done']), cardSeen.join(' > '));
      const page = await figs(p), pl = await saved(p), node = nodeOf(pl);
      // every figure the reference's bit for bit: the same source, unbundled, in this same Chromium (lib/reference.cjs), so the
      // arithmetic is the page's own (Node's differs from this Chromium's in the last place of pow, exp and log:
      // research/ui-harnesses/pow-probe.cjs); Node's two survival figures held beside it
      const want = page ? await refStrategy(pl) : null, same = page && JSON.stringify(page) === JSON.stringify(want);
      ok(2, `all ${last} paths in, every figure the reference's bit for bit (the solved plan's, your current approach's, both arms' money bands)`, same, page ? `start ${page.headline.startLevel}%, survival ${page.headline.survival.toFixed(2)}%, trials ${page.trials}${same ? '' : `; first apart at ${firstDiff(page, want)}`}` : 'no figures');
      ok(2, "the solved plan's survival and your current approach's are Node's", !!page && page.headline.survival === node.s.headline.survival && page.compare.yours.survival === node.s.compare.yours.survival, page ? `${page.headline.survival} and ${page.compare.yours.survival} against Node's ${node.s.headline.survival} and ${node.s.compare.yours.survival}` : 'no figures');

      // 3. beside the answer
      const a = await box(p, '[data-plan-answer]'), lv = await box(p, '[data-solver-aims]');
      const repeat = await p.$('[data-solver-aims] [data-figures-line]');
      ok(3, 'the levers panel beside the answer: its left edge right of the card, its top within 40px', !!a && !!lv && lv.left > a.right && Math.abs(lv.top - a.top) <= 40, a && lv ? `card ${Math.round(a.left)} to ${Math.round(a.right)}, panel from ${Math.round(lv.left)}; tops ${Math.round(a.top)}, ${Math.round(lv.top)}` : 'missing');
      await p.click('[data-solver-aims] [data-figures-show]').catch(() => {});
      let queued = false, rows = [];
      for (let i = 0; i < 40; i++) {
        rows = await p.$$eval('[data-figures-table] tr[data-figures-pos]', els => els.map(e => ({ pos: e.dataset.figuresPos, wait: e.dataset.figuresWait, text: e.textContent, surv: e.dataset.figuresSurvival })));
        if (rows.some(r => r.wait === 'queued' && /waiting its turn/.test(r.text))) { queued = true; break; }
        await p.waitForTimeout(150);
      }
      const own = rows.find(r => /\(yours\)/.test(r.text));
      ok(3, '"Compare the four settings": four rows on the first step\'s paths, the plan\'s own marked, a queued row "waiting its turn", no line repeating the answer', !repeat && rows.length === 4 && queued && !!own && Number(own.surv) === node.first.headline.survival,
        `${rows.length} rows; queued ${queued}; own ${own ? own.surv : '-'} against Node's first step ${node.first.headline.survival}`);
      await p.reload({ waitUntil: 'networkidle' });   // lets the comparison's solves go
      await waitCard(p, 'done');

      // 5. the outlook, read from the drawing (on the solved plan as it stands)
      const o = await p.evaluate(() => {
        const sp = document.querySelector('[data-outlook="spend"]'), we = document.querySelector('[data-outlook="wealth"]');
        if (!sp || !we) return null;
        const pts = (root, sel, keys) => [...root.querySelectorAll(`${sel} circle`)].map(c => Object.fromEntries(keys.map(k => [k, Number(c.dataset[k])])));
        return {
          bands: JSON.parse(sp.dataset.outlookBands), typical: sp.dataset.outlookTypical ? JSON.parse(sp.dataset.outlookTypical) : null, back: sp.dataset.outlookBack, raise: sp.dataset.outlookRaise,
          wbands: JSON.parse(we.dataset.outlookBands), tpts: pts(sp, '[data-points="typical"]', ['x', 'y']), bpts: pts(sp, '[data-points="bands"]', ['x', 'p10', 'p25', 'p75', 'p90']),
          wpts: pts(we, '[data-points="bands"]', ['x', 'p10', 'p50', 'p90']), backX: (sp.querySelector('[data-outlook-backmark]') || { dataset: {} }).dataset.x,
          ahead: (document.querySelector('[data-ahead-spend]') || { dataset: {} }).dataset.aheadSpend
        };
      });
      const near = (x, y) => Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(y));
      const age0 = o && o.bands.length ? o.bands[0].age - o.bands[0].t : 0;
      const bandsDrawn = o && o.bpts.length === o.bands.length && o.bpts.every((q, i) => near(q.x, o.bands[i].age) && ['p10', 'p25', 'p75', 'p90'].every(k => near(q[k], o.bands[i][k])));
      const typDrawn = o && o.typical && o.tpts.length === o.bands.length && o.tpts.every((q, i) => near(q.x, o.bands[i].age) && near(q.y, o.typical[o.bands[i].t]));
      const wDrawn = o && o.wpts.length === o.wbands.solved.length && o.wpts.every((q, t) => near(q.x, age0 + t) && ['p10', 'p50', 'p90'].every(k => near(q[k], o.wbands.solved[t][k])));
      const sc = S.solvedContext(E, node.r), aheadRows = o && o.ahead ? JSON.parse(o.ahead) : [];
      const ten = aheadRows.map(([ag, sp]) => (sp > 0 ? Math.round((100 * sp) / E.spendTargetAtAge(sc, ag)) : 0));
      const raiseWant = node.s.raise && !(node.s.raise.t === node.s.headline.retireT && node.s.raise.level <= node.s.headline.startLevel) ? 'shown' : 'none';
      ok(5, 'both charts drawn, every mark at the worker\'s figures (the bands, the money\'s bands, the typical run)', !!o && bandsDrawn && typDrawn && wDrawn, o ? `${o.bpts.length} band marks, ${o.tpts.length} typical marks, ${o.wpts.length} money marks` : 'no charts');
      ok(5, 'the line\'s first ten years are the ten-year rows\' spending, and it has not moved since the first step', !!o && ten.length === 10 && JSON.stringify(ten) === JSON.stringify(o.typical.slice(0, 10)) && (typAtFilling === null || typAtFilling === JSON.stringify(o.typical)),
        o ? `${ten.join(' ')} against ${o.typical ? o.typical.slice(0, 10).join(' ') : '-'}` : '');
      ok(5, `the back mark at the headline's back year (${page && page.headline.backYear}) and the raise line ${raiseWant}`, !!o && (page.headline.backT === null ? !o.backX : near(Number(o.backX), age0 + page.headline.backT)) && o.raise === raiseWant, o ? `mark at ${o.backX}; raise ${o.raise}` : '');

      // 6. this year, the rule, ten years, the comparison
      let more = true;
      try { await p.waitForSelector('[data-strategy-rule]', { timeout: WAIT_MS, state: 'attached' }); } catch (e) { more = false; }
      const six = await p.evaluate(() => ({
        acts: (document.querySelector('[data-strategy-actions]') || { dataset: {} }).dataset.strategyActions,
        rule: (() => { const el = document.querySelector('[data-strategy-rule]'); return el ? { shown: el.dataset.strategyRule, cost: Number(el.dataset.strategyRuleCost) } : null; })(),
        ahead: !!document.querySelector('[data-strategy-ahead]'),
        title: (document.querySelector('[data-strategy-compare] h3') || {}).textContent || '',
        cols: [...document.querySelectorAll('[data-strategy-compare] th')].map(t => t.textContent.trim()),
        rules: (document.querySelector('[data-compare-rules]') || {}).textContent || ''
      }));
      ok(6, 'this year in, the rule shown exactly under half a point, the ten years, and the comparison retitled with its new column', more && six.acts === 'done' && six.rule && (six.rule.shown === 'shown') === (six.rule.cost < 0.5) && six.ahead
        && /^The solved plan against your current approach, on the same/.test(six.title) && six.cols.includes('Your current approach') && /Your current approach is your plan run by the app's own rules/.test(six.rules), JSON.stringify(six).slice(0, 220));

      // 4. a lever: the dial to Medium
      const k0 = (await strip(p)).key, amount0 = await textNow(p, '[data-plan-amount]');
      await p.click('[data-solver-choice="cuts"] [data-value="3"]');
      let stale = null;
      for (let i = 0; i < 100 && !stale; i++) {
        const st = await strip(p), c = await card(p);
        if (c === 'stale' && st.key !== k0) stale = { band: await textNow(p, '[data-stale-band]'), amount: await textNow(p, '[data-plan-amount]'), key: st.key };
        await p.waitForTimeout(150);
      }
      let sawPct = false;
      for (let i = 0; i < 200 && stale && !sawPct; i++) { const t = await textNow(p, '[data-stale-band]'); if (/\d+%/.test(t)) sawPct = true; else await p.waitForTimeout(200); }
      ok(4, 'the dial moves data-solve-key; the card stale behind its band, with its percentage, the old figures still readable', !!stale && /Before your last change/.test(stale.band) && sawPct && stale.amount === amount0, stale ? `band "${stale.band.slice(0, 60)}"; amount ${stale.amount}` : 'never stale');
      const back = await waitCard(p, 'done');
      ok(4, 'then the new answer, the band gone', back && !(await p.$('[data-stale-band]')));

      // 7. You (the figures before the guardrails change are read here, on Your plan, where they are drawn)
      const before = await figs(p);
      await goPlace(p, 'You');
      const secs = await p.$$eval('[data-place="you"] [data-section]', els => els.map(e => e.dataset.section));
      const ctl = await p.$$eval('[data-section="advanced"] [data-current-approach] [data-approach-control]', els => els.map(e => [e.dataset.approachControl, e.dataset.approachResolves, /works your plan out again|re-runs the comparison/.test(e.textContent)]));
      const wantCtl = [['policy', 'yes'], ['drawdown', 'yes'], ['harvest', 'yes'], ['guardrails', 'no'], ['lookahead', 'no']];
      ok(7, 'seven sections in order, Limits sixth, Your current approach in the seventh, each control with its line', JSON.stringify(secs) === JSON.stringify(['you', 'money', 'income', 'deposits', 'costs', 'limits', 'advanced']) && JSON.stringify(ctl.map(x => [x[0], x[1]])) === JSON.stringify(wantCtl) && ctl.every(x => x[2]), `${secs.join(' ')}; ${ctl.map(x => x[0]).join(' ')}`);
      const kG = (await strip(p)).key;
      await p.click('[data-guardrails-toggle]');
      await p.waitForTimeout(2500);
      const kG2 = (await strip(p)).key;
      await goPlace(p, 'Your plan');
      await waitCard(p, 'done');
      const after = await figs(p);
      ok(7, 'a guardrails change keeps the key and re-runs the comparison: its column moves, the solved plan\'s figures the same bit for bit', kG === kG2 && !!before && !!after && JSON.stringify(after.compare.solved) === JSON.stringify(before.compare.solved) && JSON.stringify(after.compare.yours) !== JSON.stringify(before.compare.yours),
        `key ${kG === kG2 ? 'kept' : 'moved'}; your survival ${before && before.compare.yours.survival} to ${after && after.compare.yours.survival}`);
      await goPlace(p, 'You');
      const kI = (await strip(p)).key;
      await p.evaluate(() => { const el = document.querySelector('[data-solver-minpot]') || [...document.querySelectorAll('[data-section="you"] input[type="number"], [data-section="you"] input[inputmode]')][0]; if (!el) return; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, String((Number(el.value.replace(/[^\d.]/g, '')) || 0) + 1000)); el.dispatchEvent(new Event('input', { bubbles: true })); });
      let inStale = false;
      for (let i = 0; i < 40 && !inStale; i++) { const st = await strip(p); inStale = st.solve === 'stale' || (st.solve === 'solving' && st.key !== kI); await p.waitForTimeout(150); }
      ok(7, 'an input change in You makes the plan stale', inStale);
      // Your money: each pot's annual contribution and how much it rises a year, editable, named so, and drawn like its balance
      // (the maintainer, 5 Nov: the contributions looked locked, the increase not said to be the contribution's); typed in, a
      // contribution reaches the plan
      await p.evaluate(() => { const x = document.querySelector('[data-place="you"] [data-section="money"]'); if (x) x.scrollIntoView(); });
      const money = await p.evaluate(() => {
        const sec = document.querySelector('[data-place="you"] [data-section="money"]');
        if (!sec) return null;
        const rows = [...sec.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('input')].map(i => ({ off: i.disabled || i.readOnly, bg: getComputedStyle(i).backgroundColor })));
        return { heads: [...sec.querySelectorAll('th')].map(t => t.textContent.trim()), rows };
      });
      const moneyOk = !!money && money.heads.includes('Annual contribution (£)') && money.heads.includes('Contribution increase (%/yr)') && money.rows.length >= 4
        && money.rows.every(r => r.length >= 3 && !r[1].off && !r[2].off && r[1].bg === r[0].bg);
      await p.fill('[data-place="you"] [data-section="money"] tbody tr:first-child td:nth-child(3) input', '7000').catch(() => {});
      await p.waitForTimeout(600);
      const typed = await saved(p).then(pl => { const a = (pl.accounts || []).find(x => x.id === 'pen_self'); return a ? String(a.contrib) : null; });
      ok(7, 'Your money: each pot\'s annual contribution and its yearly increase editable, named so and drawn like its balance; a contribution typed in reaches the plan', moneyOk && typed === '7000',
        money ? `heads ${money.heads.slice(1, 4).join(' | ')}; ${money.rows.length} pots; contribution like its balance on ${money.rows.filter(r => r[1] && r[0] && r[1].bg === r[0].bg).length}; the pension's contribution saved as ${typed}` : 'no money section');
      ok(1, 'the main fixture: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

      // 9. Details (on this solve, as it now stands)
      await goPlace(p, 'Details');
      await p.waitForSelector('[data-place="details"] [data-audit-ledger="solved"]', { timeout: WAIT_MS }).catch(() => {});
      const d9 = await p.evaluate(() => ({
        ledger: !!document.querySelector('[data-place="details"] [data-audit-ledger="solved"]'),
        move: [...document.querySelectorAll('[data-place="details"] [data-audit-ledger] th')].some(t => /The year.s move/.test(t.textContent)),
        hist: !!document.querySelector('[data-place="details"] [data-details="history"]'), assumptions: !!document.querySelector('[data-place="details"] [data-assumptions] [data-display]') && !!document.querySelector('[data-place="details"] [data-solver-settings]'),
        docs: !!document.querySelector('[data-place="details"] [data-docs-solver]')
      }));
      ok(9, 'Details: the solved ledger with its action column, the history check, Assumptions with Display and the solver\'s settings, the docs section', d9.ledger && d9.move && d9.hist && d9.assumptions && d9.docs, JSON.stringify(d9));

      // 17. the rename pass: every place, Details' full documentation open, without the tournament's words or a classic tab's name
      await p.click('[data-place="details"] [data-docs-open]').catch(() => {});
      await p.waitForSelector('[data-place="details"] #doc-solver', { timeout: 30000 }).catch(() => {});
      const found = [];
      for (const [id, label] of PLACES) {
        await goPlace(p, label);
        const text = await p.evaluate(i => { const el = document.querySelector(`[data-place="${i}"]`); return el ? el.textContent : ''; }, id);
        for (const w of TOURNAMENT_WORDS) { const m = text.match(w); if (m) found.push(`${id}: "${m[0]}"`); }
      }
      await goPlace(p, 'Details');
      const d17 = await p.evaluate(() => ({ solver: !!document.querySelector('[data-place="details"] #doc-solver'), approx: document.querySelectorAll('[data-place="details"] [data-solver-approximations] li').length,
        coverage: !!document.querySelector('[data-place="details"] #doc-coverage'), glossary: ['The solved plan', 'Your current approach', 'Limits', 'A rule of thumb'].every(w => [...document.querySelectorAll('[data-place="details"] [data-docs-solver] dt')].some(d => d.textContent.trim() === w)) }));
      ok(17, 'the rename pass: no tournament word or classic tab name on any place, the full documentation open; Docs leads with how the solver decides, the coverage card lists the solver\'s approximations, the glossary\'s four words',
        found.length === 0 && d17.solver && d17.approx >= 8 && d17.coverage && d17.glossary, `${found.slice(0, 6).join('; ') || 'none found'}; ${JSON.stringify(d17)}`);

      // 18. the diagnostic on a solved plan (Details' solver settings): the whitelist's fields, no amount
      const g18 = await diagnosticIn(p, '[data-place="details"] [data-solver-settings]');
      ok(18, 'the details for a bug report, on a solved plan: the whitelist\'s fields in order, completed, the grid and the solver\'s code named, and no number of 100 or more outside the counts\' lines',
        !!g18 && JSON.stringify(g18.fields) === JSON.stringify(DIAG_FIELDS) && g18.big.length === 0 && g18.at.completed === 'yes' && /^solver-code:[0-9a-f]{16}$/.test(g18.at.code) && /^\d+ wealth points, \d+ paths$/.test(g18.at.grid),
        g18 ? `fields ${g18.fields.length}${g18.fields.length !== DIAG_FIELDS.length ? ` (${g18.fields.join(', ').slice(0, 120)})` : ''}; numbers of 100 or more ${g18.big.slice(0, 4).join(', ') || 'none'}; completed ${g18.at.completed}; code ${g18.at.code}` : 'no diagnostic shown');
      // 20. the speed mode (D97 (3), D98): off by default with the single's warning; on, the plan carries it and solves under a key
      // of its own, every figure the reference's for that plan (which solves it in speed mode); off again, no field left on the
      // plan and its own key back. The plant 'speedoff' (the box writes nothing) fails it.
      await goPlace(p, 'Your plan');
      await p.waitForSelector('[data-solver-aims] [data-solver-speed]', { timeout: 60000, state: 'attached' }).catch(() => {});
      const sp0 = await p.evaluate(() => { const b = document.querySelector('[data-solver-aims] [data-solver-speed]'), w = document.querySelector('[data-solver-aims] [data-solver-speed-warning]'); return b ? { checked: b.checked, warning: w ? w.textContent : '' } : null; });
      const nextSolve = async k => {   // the solve after a change: its key, once its card is done again
        let nk = null, left = false;
        for (const t0 = Date.now(); Date.now() - t0 < WAIT_MS;) {
          const st = await strip(p), c = await card(p);
          if (st && st.key && st.key !== k) nk = st.key;
          if (nk && c !== 'done') left = true;
          if (nk && left && c === 'done' && st.solve === 'solved' && st.key === nk) return nk;
          if (!nk && Date.now() - t0 > 30000) return null;   // the change never moved the key
          await p.waitForTimeout(150);
        }
        return null;
      };
      const k20 = (await strip(p)).key;
      await p.click('[data-solver-aims] [data-solver-speed]').catch(() => {});
      const k21 = await nextSolve(k20), pl21 = await saved(p);
      const page21 = k21 ? await figs(p) : null, want21 = page21 ? await refStrategy(pl21) : null;
      const same21 = !!page21 && JSON.stringify(page21) === JSON.stringify(want21);
      ok(20, 'the speed mode: off by default with the single\'s warning (D98); on, the plan carries it and solves under a key of its own, every figure the reference\'s for that plan',
        !!sp0 && !sp0.checked && sp0.warning === SPEED_SINGLE && !!k21 && pl21 && pl21.solver && pl21.solver.speed === 'fast' && same21,
        `${sp0 ? `box ${sp0.checked ? 'on' : 'off'}, the warning ${sp0.warning === SPEED_SINGLE ? 'the single\'s' : `"${sp0.warning.slice(0, 60)}"`}` : 'no box'}; key ${k21 ? 'moved' : 'NOT moved'}; plan ${pl21 && pl21.solver ? JSON.stringify(pl21.solver.speed || null) : 'no solver'}; figures ${same21 ? 'the reference\'s' : 'NOT the reference\'s'}`);
      await p.click('[data-solver-aims] [data-solver-speed]').catch(() => {});
      const k22 = k21 ? await nextSolve(k21) : null, pl22 = await saved(p);
      ok(20, 'the speed mode off again: no field left on the plan, its own key back', !!k22 && k22 === k20 && !(pl22 && pl22.solver && 'speed' in pl22.solver), `key ${k22 === k20 ? 'the plan\'s own' : 'NOT the plan\'s own'}; ${pl22 && pl22.solver && 'speed' in pl22.solver ? 'a speed field left' : 'no speed field'}`);
      void urls;
      await p.context().close(); }

    // ---------------------------------------------------------------- 5 (S090) and 7 (S090's policy) and 8 (retired)
    { const { p, errs } = await open(b, planOf(FIX.raise));
      await waitCard(p, 'done');
      const raise = await p.$eval('[data-outlook="spend"]', el => el.dataset.outlookRaise).catch(() => null);
      ok(5, `${FIX.raise}: starting at its raise, no raise line under the chart (L13)`, raise === 'none', `raise ${raise}`);
      await goPlace(p, 'What if');
      const w = await p.evaluate(() => ({ ages: !!document.querySelector('[data-solver-ages]'), targets: Number((document.querySelector('[data-solver-targets]') || { dataset: {} }).dataset.targetsOptions || 0),
        limits: !!document.querySelector('[data-solver-answers="full"]'), scen: !!document.querySelector('[data-whatif-scenarios]'), costs: document.querySelectorAll('[data-place="whatif"] [data-figures-cost]').length }));
      ok(8, `${FIX.raise} (retired): no age card; the target card's five options; the limits and scenarios cards; each saying its cost before it is asked`, !w.ages && w.targets === 5 && w.limits && w.scen && w.costs >= 2, JSON.stringify(w));
      await goPlace(p, 'You');
      const k = (await strip(p)).key;
      await p.evaluate(() => { const s = document.querySelector('select[aria-label="Decumulation policy"]'); const other = [...s.options].find(o => o.value !== s.value && /ISA/i.test(o.textContent)) || [...s.options].find(o => o.value !== s.value); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, other.value); s.dispatchEvent(new Event('change', { bubbles: true })); });
      let moved = false;
      for (let i = 0; i < 40 && !moved; i++) { moved = (await strip(p)).key !== k; await p.waitForTimeout(150); }
      ok(7, `${FIX.raise} (an Auto deposit the policy routes): a policy change moves the key`, moved);
      ok(8, `${FIX.raise}: no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close(); }

    // ---------------------------------------------------------------- 8. a working household's age card
    { const { p, errs } = await open(b, planOf(FIX.work));
      await waitCard(p, 'filling');
      await goPlace(p, 'What if');
      await p.waitForSelector('[data-solver-ages] [data-figures-show]', { timeout: WAIT_MS }).catch(() => {});
      const ages = await p.$('[data-solver-ages] [data-figures-cost]');
      ok(8, `${FIX.work} (working): the age card, its cost said before it is asked`, !!ages);
      ok(8, `${FIX.work}: no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close(); }

    // ---------------------------------------------------------------- 10. a couple
    if (!couple) ok(10, 'a couple in the library to test with', false);
    else { const { p, errs } = await open(b, couple.plan);
      const on = [];
      for (const [id, label] of [['plan', 'Your plan'], ['whatif', 'What if'], ['details', 'Details']]) { await goPlace(p, label); if (await p.$(`[data-place="${id}"] [data-planner-couple]`)) on.push(id); }
      await goPlace(p, 'Your plan');
      // couples off in this build (src/couplesSwitch.js, D6 the maintainer's word): the card gives that as its reason (D5.4)
      const why10 = await p.evaluate(() => { const el = document.querySelector('[data-place="plan"] [data-planner-couple]'); return el ? el.dataset.plannerCouple : null; });
      ok(10, 'a couple, couples off: the card gives its reason, \'off\'', why10 === 'off', `the card ${why10 === null ? 'missing' : `says '${why10}'`}`);
      // the speed mode (D97 (3)) is not offered to a couple the solver does not run, on any place: their screens as before
      const speed10 = await p.evaluate(() => document.querySelectorAll('[data-solver-speed]').length);
      ok(10, 'a couple, couples off: no speed mode offered', speed10 === 0, `${speed10} speed boxes`);
      // You's Limits, couples off (the reviewer of 14 Nov, finding 1): the card as before D5, a row a wrapper for the household,
      // no line for the two of them, and its first change writes the household's ceiling alone
      await goPlace(p, 'You');
      const LIM = '[data-place="you"] [data-section="limits"] [data-solver-locks]';
      await p.waitForSelector(LIM, { timeout: 20000 }).catch(() => {});
      const lim10 = await p.evaluate(sel => { const c = document.querySelector(sel); return c ? { both: !!c.querySelector('[data-locks-couple]'), rows: [...c.querySelectorAll('select[data-solver-lock^="tier-"]')].map(x => `${x.dataset.solverLock}:${x.getAttribute('aria-label')}`) } : null; }, LIM);
      const OLD = { 'tier-pen': 'Riskiest tier for the pension', 'tier-isa': 'Riskiest tier for the ISA' };
      let wrote10 = null;
      if (lim10 && lim10.rows.length) {
        const first = lim10.rows[0].split(':')[0];
        await p.selectOption(`${LIM} select[data-solver-lock="${first}"]`, 'Low Risk').catch(() => {});
        await p.waitForTimeout(800);
        const sv = await saved(p);
        wrote10 = sv && sv.solver && sv.solver.locks ? { first, locks: sv.solver.locks } : { first, locks: null };
      }
      const asBefore = !!lim10 && !lim10.both && lim10.rows.length > 0 && lim10.rows.every(r => { const [k, ...l] = r.split(':'); return OLD[k] === l.join(':'); });
      const wroteOne = !!wrote10 && !!wrote10.locks && wrote10.locks.tierCeiling && wrote10.locks.tierCeiling[wrote10.first.slice(5)] === 'Low Risk' && !('tierCeilingPart' in wrote10.locks);
      ok(10, 'a couple, couples off: You\'s Limits as before D5 (a row a wrapper for the household, no line for the two of them), its first change writing the household\'s ceiling alone', asBefore && wroteOne,
        lim10 ? `rows ${lim10.rows.join(' | ') || 'none'}; the line for the two of them ${lim10.both ? 'shown' : 'not shown'}; the saved locks ${JSON.stringify(wrote10 && wrote10.locks)}` : 'no Limits card on You');
      await goPlace(p, 'Your plan');
      await p.click('[data-planner-couple] [data-open-classic]').catch(() => {});
      await p.waitForTimeout(800);
      const tabs = await p.$$eval('[data-tabbar] button', bs => bs.map(x => x.textContent.trim()));
      await p.reload({ waitUntil: 'networkidle' });
      const tabs2 = await p.$$eval('[data-tabbar] button', bs => bs.map(x => x.textContent.trim()));
      ok(10, `${couple.id}: the couples card on Your plan, What if and Details; "Open the classic planner" shows the classic tabs, and a reload keeps them`, on.length === 3 && tabs.includes('Plan Inputs') && tabs2.includes('Plan Inputs'), `card on ${on.join(', ') || 'none'}; tabs ${tabs.slice(0, 3).join(', ')}; after a reload ${tabs2.slice(0, 3).join(', ')}`);
      ok(10, 'a couple: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

      await p.context().close(); }

    // ---------------------------------------------------------------- 15. the opt-in both ways keeps the plan
    { const { p, errs } = await open(b, planOf(FIX.main), { planner: null });
      await p.waitForSelector('[data-tabbar]', { timeout: 60000 }).catch(() => {});
      const before = JSON.stringify(await saved(p)), pick = () => p.evaluate(() => localStorage.getItem('rp_planner'));
      const tried = await p.$('[data-try-planner]');
      if (tried) await tried.click();
      await p.waitForSelector('[data-place]', { timeout: 60000 }).catch(() => {});
      const inNew = { place: !!(await p.$('[data-place]')), plan: JSON.stringify(await saved(p)) === before, pick: await pick() };
      await p.click('[data-crossover-planner]').catch(() => {});
      await p.waitForTimeout(800);
      const tabs = await p.$$eval('[data-tabbar] button', bs => bs.map(x => x.textContent.trim()));
      const back = { classic: tabs.includes('Plan Inputs') && !(await p.$('[data-place]')), plan: JSON.stringify(await saved(p)) === before, pick: await pick() };
      await p.reload({ waitUntil: 'networkidle' });
      const tabs2 = await p.$$eval('[data-tabbar] button', bs => bs.map(x => x.textContent.trim()));
      const again = { classic: tabs2.includes('Plan Inputs') && !(await p.$('[data-place]')), plan: JSON.stringify(await saved(p)) === before };
      ok(15, 'the opt-in both ways: "Try the new planner (beta)" opens the new planner and "Classic planner" comes back, the saved plan as it was each time, rp_planner as chosen, a reload keeping it',
        !!tried && inNew.place && inNew.plan && inNew.pick === 'new' && back.classic && back.plan && back.pick === 'classic' && again.classic && again.plan,
        `the button ${tried ? 'there' : 'missing'}; new planner ${JSON.stringify(inNew)}; back ${JSON.stringify(back)}; after a reload ${JSON.stringify(again)}`);
      ok(15, 'the opt-in both ways: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close(); }

    // ---------------------------------------------------------------- 16. the rollback: PLANNER_BETA false
    { const OUT2 = mkdtempSync(join(tmpdir(), 'solver-planner-rollback-'));
      let server2 = null;
      try {
        execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT2, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, SOLVER_HARNESS: '1', SOLVER_HARNESS_OPTS: JSON.stringify(LIGHT), PLANNER_BETA_OFF: '1', PLANNER_PLANT: PLANTED.join(',') } });
        server2 = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT2, '--port', ROLLBACK_PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
        let up2 = false;
        for (let i = 0; i < 40 && !up2; i++) { try { const r = await fetch(`http://localhost:${ROLLBACK_PORT}/`); up2 = r.ok; } catch (e) { await new Promise(res => setTimeout(res, 500)); } }
        const { p, errs } = await open(b, planOf(FIX.main), { planner: 'new', port: ROLLBACK_PORT });
        await p.waitForSelector('[data-tabbar], [data-place]', { timeout: 60000 }).catch(() => {});
        const tabs = await p.$$eval('[data-tabbar] button', bs => bs.map(x => x.textContent.trim()));
        const s = { served: up2, classic: tabs.includes('Plan Inputs'), place: !!(await p.$('[data-place]')), optIn: !!(await p.$('[data-try-planner]')), pick: await p.evaluate(() => localStorage.getItem('rp_planner')) };
        ok(16, 'the rollback (PLANNER_BETA false): a visitor who opted in sees the classic planner, with no opt-in', s.served && s.classic && !s.place && !s.optIn, JSON.stringify(s));
        ok(16, 'the rollback: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
        await p.context().close();
      } finally { if (server2) server2.kill(); rmSync(OUT2, { recursive: true, force: true }); } }

    // ---------------------------------------------------------------- 11. a failure
    { const { p, errs } = await open(b, planOf(FIX.main), { plantFail: true });
      const f = await waitCard(p, 'failed', 120000);
      const g18 = await diagnosticIn(p, '[data-plan-answer="failed"]');
      ok(18, 'the details for a bug report, on the failure card: the whitelist\'s fields, not completed, the error\'s words',
        !!g18 && DIAG_FIELDS.every(k => g18.fields.includes(k)) && g18.at.completed === 'no' && /planted: the solver failed/.test(g18.at.error || ''),
        g18 ? `completed ${g18.at.completed}; error "${g18.at.error}"` : 'no diagnostic shown');
      const parts = await p.evaluate(() => ({ retry: !!document.querySelector('[data-plan-answer="failed"] [data-strategy-retry]'), classic: !!document.querySelector('[data-plan-answer="failed"] [data-open-classic]') }));
      const yours = await p.waitForSelector('[data-failed-current="in"]', { timeout: 300000 }).then(() => true, () => false);
      // the money chart under it is your current approach's alone: named so, and nowhere the solved plan's (there is none)
      const chart = await p.evaluate(() => { const c = document.querySelector('[data-failed-current] svg[data-chart="wealth"]'); return c ? { text: c.textContent, aria: c.getAttribute('aria-label') || '' } : null; });
      const alone = !!chart && /your current approach/i.test(chart.text) && !/solved plan/i.test(chart.text) && /^Your current approach's money/.test(chart.aria) && !/solved plan/i.test(chart.aria);
      const c0 = await p.$eval('[data-solver-choice="cuts"] [aria-checked="true"]', el => el.dataset.value).catch(() => null);
      await p.click('[data-solver-choice="cuts"] [data-value="6"]').catch(() => {});
      await p.waitForTimeout(400);
      const c1 = await p.$eval('[data-solver-choice="cuts"] [aria-checked="true"]', el => el.dataset.value).catch(() => null);
      ok(11, 'planted, the solver failing: the failure card with "Try again" and the classic link, your current approach\'s figures under it (its money chart named as yours alone), the levers usable', f && parts.retry && parts.classic && yours && alone && c0 !== c1 && c1 === '6', `${JSON.stringify(parts)}; yours ${yours}; the chart ${chart ? `"${chart.text.replace(/\s+/g, ' ').slice(-60)}"` : 'none'}; dial ${c0} to ${c1}`);
      ok(11, 'a failure: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close(); }

    // ---------------------------------------------------------------- 12. the phone
    { const { p, errs, urls } = await open(b, planOf(FIX.main), { phone: true });
      const nav = await p.$$eval('[data-bottomnav] button', bs => bs.map(x => ({ t: x.textContent.trim(), h: x.getBoundingClientRect().height })));
      const four = PLACES.map(([, l]) => nav.find(x => x.t === l));
      ok(12, 'the phone\'s bottom bar: the four places, each 44px or more', four.every(x => x && x.h >= 44), nav.map(x => `${x.t} ${Math.round(x.h)}px`).join(', '));
      const wide = [];
      for (const [id, label] of PLACES) { await goPlace(p, label); const w = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (w > 0) wide.push(`${id} +${w}px`); }
      ok(12, 'no horizontal scroll on any place at 390px', wide.length === 0, wide.join(', '));
      await goPlace(p, 'Your plan');
      await p.waitForTimeout(2500);
      const pre = urls.filter(u => /solverClient|solverWorker/.test(u)), st0 = await strip(p);
      ok(12, 'nothing solved and no solver chunk fetched until "Solve my plan"', pre.length === 0 && st0 && st0.solve === 'idle' && !!(await p.$('[data-plan-answer="ask"]')), `${pre.length} solver requests; ${st0 && st0.solve}`);
      await p.click('[data-plan-answer="ask"] [data-solve-request]').catch(() => {});
      const done = await waitCard(p, 'done');
      const steps = (await p.$$('[data-deck-step]')).length;
      await p.click('[data-deck-step="3"]').catch(() => {});
      const at3 = await p.$('[data-deck-slide="3"]');
      await p.evaluate(() => { const el = document.querySelector('[data-deck-slide]'); const r = el.getBoundingClientRect(), y = r.top + 40; const ev = (t, x) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerId: 7, pointerType: 'touch' })); ev('pointerdown', 300); ev('pointerup', 100); });
      await p.waitForTimeout(300);
      const at4 = await p.$('[data-deck-slide="4"]');
      ok(12, 'the six slides, by the step bar and by swipe', done && steps === 6 && !!at3 && !!at4, `${steps} steps; slide 3 ${!!at3}; swiped to 4 ${!!at4}`);
      await p.click('[data-deck-step="1"]').catch(() => {});
      await p.click('[data-open-levers]').catch(() => {});
      const opened = !!(await p.$('[data-levers-sheet="open"]'));
      await p.keyboard.press('Escape');
      await p.waitForTimeout(200);
      const shut = !!(await p.$('[data-levers-sheet="closed"]'));
      await p.click('[data-open-levers]').catch(() => {});
      const k0 = (await strip(p)).key, asks0 = await p.evaluate(() => window.__asks.length);
      await p.click('[data-levers-sheet] [data-solver-choice="cuts"] [data-value="3"]').catch(() => {});
      await p.waitForTimeout(3000);
      const st1 = await strip(p), asks = await p.evaluate(n => window.__asks.slice(n), asks0);
      await p.keyboard.press('Escape');
      const asked = asks.filter(x => ['strategy', 'actions', 'ahead', 'distil', 'rows', 'simulate', 'solve'].includes(x.kind));
      ok(12, 'the levers sheet opens and shuts with Escape; a change in it makes the plan stale, the key unchanged and the worker asked nothing until "Solve again"', opened && shut && st1.solve === 'stale' && st1.key === k0 && asked.length === 0,
        `opened ${opened}, shut ${shut}; ${st1.solve}, key ${st1.key === k0 ? 'kept' : 'moved'}; asked ${asked.map(x => x.kind).join(', ') || 'nothing'}`);
      await p.click('[data-solve-status] [data-solve-request]').catch(() => {});
      let again = false;
      for (let i = 0; i < 60 && !again; i++) { const st = await strip(p); again = st.solve === 'solving' || (st.solve === 'solved' && st.key !== k0); await p.waitForTimeout(150); }
      ok(12, '"Solve again" solves it', again);
      ok(12, 'the phone: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close(); }

    // ---------------------------------------------------------------- 13. the quick start
    { const { p, errs } = await open(b, null);
      const shown = !!(await p.$('[data-place="plan"] [data-quick-start]'));
      const potFields = await p.$$eval('[data-quick-start] [data-quick-pot] [data-quick-field]', els => els.map(el => el.getAttribute('data-quick-field'))).catch(() => []);
      const dis0 = await p.$eval('[data-quick-go]', el => el.disabled).catch(() => null);
      for (const [k, v] of [['ageSelf', '60'], ['retireSelf', '60'], ['spend', '30000']]) await p.fill(`[data-quick-field="${k}"]`, v);
      const dis1 = await p.$eval('[data-quick-go]', el => el.disabled).catch(() => null);
      await p.fill('[data-quick-field="pen"]', '600000');
      const dis2 = await p.$eval('[data-quick-go]', el => el.disabled).catch(() => null);
      for (const [k, v] of [['penC', '12000'], ['penG', '2'], ['isaC', '4000']]) await p.fill(`[data-quick-field="${k}"]`, v).catch(() => {});
      await p.click('[data-quick-go]').catch(() => {});
      let solving = false;
      for (let i = 0; i < 80 && !solving; i++) { const st = await strip(p); solving = !!st && (st.solve === 'solving' || st.solve === 'solved'); await p.waitForTimeout(150); }
      const pl = await saved(p);
      ok(13, 'an empty plan shows the quick start; "Work out my plan" waits for the four readiness fields; filled, it builds the plan and solves', shown && dis0 === true && dis1 === true && dis2 === false && solving && pl && Number(pl.spending.targetSpend) === 30000,
        `shown ${shown}; disabled ${dis0}, ${dis1}, ${dis2}; solving ${solving}`);
      const want = ['pen', 'penC', 'penG', 'isa', 'isaC', 'isaG', 'gia', 'giaC', 'giaG', 'cash', 'cashC', 'cashG'];
      const acc = id => ((pl && pl.accounts) || []).find(a => a.id === id) || {}, num = v => Number(v || 0);
      const carried = [[acc('pen_self'), 600000, 12000, 2], [acc('isa_self'), 0, 4000, 0], [acc('other_self'), 0, 0, 0], [acc('cash_self'), 0, 0, 0]];
      ok(13, 'the quick start asks each pot\'s balance, annual contribution and contribution increase, and the plan it builds carries them (D62)',
        JSON.stringify(potFields) === JSON.stringify(want) && carried.every(([a, b, c, g]) => num(a.balance) === b && num(a.contrib) === c && num(a.growth) === g),
        `fields ${potFields.join(', ') || 'none'}; pension ${num(acc('pen_self').contrib)} rising ${num(acc('pen_self').growth)}%, ISA ${num(acc('isa_self').contrib)}, other ${num(acc('other_self').contrib)}, cash ${num(acc('cash_self').contrib)}`);
      ok(13, 'the quick start: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.context().close(); }

    // ---------------------------------------------------------------- 19. couples on (Part D, D5.5)
    { const OUT3 = mkdtempSync(join(tmpdir(), 'solver-planner-couples-'));
      let server3 = null;
      try {
        execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT3, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, SOLVER_HARNESS: '1', SOLVER_HARNESS_OPTS: JSON.stringify(LIGHT), COUPLES_ON: '1', ...(PLANTED.length ? { PLANNER_PLANT: PLANTED.join(',') } : {}) } });
        server3 = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT3, '--port', COUPLES_PORT, '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
        let up3 = false;
        for (let i = 0; i < 40 && !up3; i++) { try { const r = await fetch(`http://localhost:${COUPLES_PORT}/`); up3 = r.ok; } catch (e) { await new Promise(res => setTimeout(res, 500)); } }
        const share = pl => { const of = w => pl.accounts.filter(a => a.id.endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0); return of('self') / (of('self') + of('part')); };
        const even = couple && Math.abs(share(couple.plan) - 0.6) < 0.05 ? couple : all.find(s2 => s2.plan.demographics.planningMode === 'couple' && Math.abs(share(s2.plan) - 0.6) < 0.05);
        // (a) an in-band couple solves on the page, its figures the reference's
        { const { p, errs } = await open(b, even.plan, { port: COUPLES_PORT });
          const done = await waitCard(p, 'done', WAIT_MS);
          const page = done ? await figs(p) : null, pl = await saved(p), want = page ? await refCouple(pl) : null;
          const same = !!page && JSON.stringify(page) === JSON.stringify(want);
          const words = await p.evaluate(() => { const el = document.querySelector('[data-plan-answer]'); return el ? el.textContent : ''; });
          const card = !!(await p.$('[data-place="plan"] [data-planner-couple]'));
          await p.waitForSelector('[data-strategy-actions="done"]', { timeout: WAIT_MS }).catch(() => {});
          const acts = await p.$$eval('[data-strategy-action]', els => els.map(e => e.dataset.strategyAction));
          ok(19, `couples on: ${even.id} (60/40) solves in the new planner, no couples card, the headline said to the two of you`, up3 && done && !card && /two of you|first of you/.test(words), `served ${up3}; done ${done}; card ${card}`);
          ok(19, 'couples on: every figure the reference\'s bit for bit (each person\'s table with their partner\'s age, then the couple, strategyOf on it)', same, page ? `survival ${page.headline.survival}% against ${want && want.headline.survival}%` : 'no figures');
          const speedWords = await p.evaluate(() => { const w = document.querySelector('[data-solver-aims] [data-solver-speed-warning]'); return w ? w.textContent : null; });
          ok(19, 'couples on: the speed mode offered with the couple\'s warning (D98)', speedWords === SPEED_COUPLE, speedWords === null ? 'no warning shown' : speedWords === SPEED_COUPLE ? 'the couple\'s' : `"${speedWords.slice(0, 60)}"`);
          ok(19, 'couples on: this year\'s actions each named for its person (or nothing to change)', acts.length > 0 && acts.every(a => a === 'none' || /^(self|part|household):/.test(a)), acts.join(', ') || 'none shown');
          ok(19, 'couples on: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
          // (c) D5.6: a reload restores both people's tables from the store (the owner copying each record in, its parts
          // following it): every figure the reference's again, the solve named restored with its parts, the actions per person.
          // The diagnostic's parts are the last phase's count, so whether the parts then ran shares of the couple's paths is not
          // seen here (the reviewer of 14 Nov, finding 4 (e)): couple-split.test.mjs shows it for the client
          await p.reload({ waitUntil: 'networkidle' });
          const again = await waitCard(p, 'done', WAIT_MS), page2 = again ? await figs(p) : null;
          await p.waitForSelector('[data-strategy-actions="done"]', { timeout: WAIT_MS }).catch(() => {});
          const acts2 = await p.$$eval('[data-strategy-action]', els => els.map(e => e.dataset.strategyAction));
          await goPlace(p, 'Details');
          const g19 = await diagnosticIn(p, '[data-place="details"] [data-solver-settings]');
          const restored = !!g19 && /restored from the store/.test(g19.at.times || ''), nparts = g19 ? Number(g19.at.parts) : 0;
          ok(19, 'couples on, reloaded: both people\'s tables restored from the store, the parts above one, every figure the reference\'s again, the actions per person',
            again && !!page2 && JSON.stringify(page2) === JSON.stringify(want) && restored && nparts > 1 && acts2.length > 0 && acts2.every(a => a === 'none' || /^(self|part|household):/.test(a)),
            `done ${again}; ${g19 ? `times "${g19.at.times}", parts ${g19.at.parts}` : 'no diagnostic'}; survival ${page2 ? page2.headline.survival : '-'}% against ${want && want.headline.survival}%`);
          ok(19, 'couples on, reloaded: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
          // (d) the limits per person (D5): You's Limits gives a ceiling row for each of the partner's wrappers, and says the
          // pension age and the lump sum hold for both
          await goPlace(p, 'You');
          await p.waitForSelector('[data-place="you"] [data-section="limits"] [data-solver-locks]', { timeout: 20000 }).catch(() => {});
          const lim = await p.evaluate(() => ({ both: !!document.querySelector('[data-place="you"] [data-section="limits"] [data-locks-couple]'),
            part: [...document.querySelectorAll('[data-place="you"] [data-section="limits"] [data-solver-lock^="tier-part-"]')].map(e => e.dataset.solverLock),
            self: [...document.querySelectorAll('[data-place="you"] [data-section="limits"] [data-solver-lock^="tier-"]')].map(e => e.dataset.solverLock).filter(x => !x.startsWith('tier-part-')) }));
          ok(19, 'couples on: the limits per person, a ceiling row for each person\'s wrappers, the age and the lump sum said to hold for both', lim.both && lim.part.length > 0 && lim.self.length > 0, JSON.stringify(lim));
          await p.context().close(); }
        // (b) the same couple re-held 90/10: the couples card, its reason the uneven holding
        { const re = JSON.parse(JSON.stringify(even.plan)), tot = {};
          for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); tot[k] = (tot[k] || 0) + (Number(a.balance) || 0); }
          for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); if (/_self$/.test(a.id)) a.balance = tot[k] * 0.9; else if (/_part$/.test(a.id)) a.balance = tot[k] * 0.1; }
          const { p, errs } = await open(b, re, { port: COUPLES_PORT });
          await p.waitForSelector('[data-place="plan"] [data-planner-couple]', { timeout: 60000 }).catch(() => {});
          const why = await p.evaluate(() => { const el = document.querySelector('[data-place="plan"] [data-planner-couple]'); return el ? el.dataset.plannerCouple : null; });
          ok(19, 'couples on: the same couple re-held 90/10 is shown the couples card, its reason the uneven holding', why === 'uneven', `the card ${why === null ? 'missing' : `says '${why}'`}`);
          ok(19, 'couples on, held 90/10: no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
          await p.context().close(); }
      } finally { if (server3) server3.kill(); rmSync(OUT3, { recursive: true, force: true }); } }
  } finally {
    await ref.close(); await b.close();
    if (server) server.kill();
    rmSync(OUT, { recursive: true, force: true });
  }
  if (PLANTED.length) {
    const want = [...new Set(PLANTED.map(x => PLANT_CHECKS[x]))].sort((x, y) => x - y), got = [...failed].sort((x, y) => x - y);
    const exact = JSON.stringify(want) === JSON.stringify(got);
    console.log(`\nPLANTED (${PLANTED.join(', ')}): checks failing ${got.join(', ') || 'none'}; their own ${want.join(', ')}: ${exact ? 'EACH PLANT FAILS EXACTLY ITS OWN CHECKS' : 'NOT EXACT'}`);
    process.exit(exact ? 0 : 1);
  }
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(`  FAIL  the harness threw: ${e && e.stack ? e.stack : e}`); process.exit(1); });
