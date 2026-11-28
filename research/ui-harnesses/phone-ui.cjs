/*
 * THE PLANNER ON EMULATED PHONES.
 *
 * The regression harness already walks 390px, but a narrow window is not a phone: it has a mouse pointer, a device pixel
 * ratio of 1, and no touch. This one runs real device descriptors - an iPhone 13 and a Pixel 7 - so `(pointer: coarse)`
 * matches, touch targets are measured at the scale a finger actually meets, and the layout is exercised the way it ships.
 *
 * What it asserts, on each phone in both themes:
 *   - every place (Your plan, You, What if, Details) is reached from the bottom bar and puts its own content on screen (an
 *     element its own card draws, not the place's heading, which the page draws before the card arrives), with no sideways
 *     scroll, nothing below 3:1 contrast, and no interactive control under 44px without an explicit hit area or an
 *     equivalent control at 44px (lib/probes.cjs);
 *   - every section of You and of Details, one at a time as the phone shows them, the same three (Details' history check's
 *     start years are cells under 44px across whose equivalent is the Start year box: planted, PHONE_PLANT=noequivalent
 *     hides the Start year controls and the history check's 44px check fails);
 *   - the full documentation, opened in Details: the same three, and its cards folded, the text still there, a scroll you
 *     can reach the end of;
 *   - each section of Details no longer than the classic planner's tab that held it allowed (its screen cap, SCREEN_CAP
 *     there: Audit Data Table 1.8 screens, Historical Backtest 2.6, Config & Assumptions 2.0, Documentation 2.2), converted
 *     as You's form is below: the classic page drew 100px of its own around those tabs' content (28px above, 72px below), so
 *     a cap of c screens is c times the screen's height less 100px of content; the content the classic tab carried is held
 *     to it, and what the planner adds to the section or unfolds in it is measured and reported, not held to the classic bar
 *     (the history check's strip of every start year; in Assumptions, Tax rules open, which the classic Config folded on a
 *     phone, Display's heading with the theme, and the solver's settings): the reviewer's second look at D155, finding 2, and
 *     its third look, finding 1. Planted, each fails: PHONE_PLANT=nolengthsub (the planner's additions left in) the history
 *     check and Assumptions on the iPhone 13; PHONE_PLANT=docsopen (every documentation card opened) the documentation's;
 *   - the history check's chart on a phone: it uses the screen (92% of its width), and its expand button opens it at full
 *     screen, the dialog the viewport's width and height, Escape closing it (the classic planner's projection chart was
 *     checked so until D155; the reviewer's second look, finding 6). Planted (PHONE_PLANT=halfchart, the dialog at half the
 *     screen's height), the height check fails;
 *   - the bottom bar is present, fixed, tall enough to hit and not on top of the page's last content; the top strip hidden;
 *   - the theme is one cycling button, not three;
 *   - You's phone form, on each phone in both themes as the classic planner's Plan Inputs was until D155 (the reviewer's
 *     second look, finding 3): its inputs are at least 16px (so focusing one does not zoom), its sections show one at a
 *     time, the form's own content under the classic bar with no long drop-down, the section it opens at within the classic
 *     Plan Inputs tab's own cap, 2.0 screens less the 140px its page drew around a section (the third look, finding 3;
 *     planted, PHONE_PLANT=tallyou, 500px more there, it fails on the iPhone 13), and a swipe moves between them; its rows are
 *     a label left and a control right, every control on one edge, the explanations a tap away; a new band opens as a row
 *     of three fields; an income stream cannot start before its owner retires and snaps back; a folded explanation shows its
 *     first lines; each wrapper is a card with its tier, opening into six chips that set the tier and fold away; and a
 *     glossary term is its own tap target, opening its definition and closing again.
 *
 * Until D155 (28 Nov 2026) this harness walked the classic planner's eight tabs and its Simple page; those retired with them,
 * and the checks here are the ones of features the planner keeps (CLASSIC-RETIRE.md, the gate; the sections, the
 * documentation and the phone form ported on the reviewer's finding 1, reviews/2026-11-28-classic-retire.md). The planner's
 * own phone checks (its bottom bar's four places, the seven slides, the levers sheet, the solve on request) are
 * solver-planner-ui.cjs check 12.
 *
 * No stylesheet is injected here: the built site links its own compiled CSS.
 *
 * Run: node phone-ui.cjs [port] [shotDir]
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const { CONTRAST_PROBE, OVERFLOW_PROBE, TOUCH_PROBE, NAV_PROBE, INPUT_SIZE_PROBE, CHART_WIDTH_PROBE } = require('./lib/probes.cjs');
const PORT = process.argv[2] || '5173';
const SHOT = process.argv[3];
// PHONE_PLANT: one plant or several, comma-separated (each breaks a different check)
const PLANTS = new Set((process.env.PHONE_PLANT || '').split(',').filter(Boolean));
const GIA = 'Other Investments (e.g. GIA)';

const plan = {
  demographics: { planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 62, salarySelf: 70000, employmentSelf: 'employed',
    statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976, terminalAge: 95 },
  spending: { targetSpend: 40000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 320000, contrib: 12000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 90000, contrib: 6000, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 40000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 25000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
};
// each place: its bottom bar label, its <main data-place>, and an element only its own card draws (the place's heading is the
// page's, drawn before the lazily loaded card arrives, so it cannot tell a card that renders empty: the reviewer on D155, 4)
const PLACES = [
  ['Your plan', 'plan', '[data-plan-answer]:not([data-plan-answer="loading"])'],
  ['You', 'you', '[data-you-rows]'],
  ['What if', 'whatif', '[data-whatif-scenarios]'],
  ['Details', 'details', '[data-audit-ledger]'],
];

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

// a place the way a finger reaches it: its button on the bottom bar, by its whole label ('You' is the start of 'Your plan')
const fromBar = (page, label) => page.evaluate(l => {
  const nav = document.querySelector('[data-bottomnav]');
  const b = nav && [...nav.querySelectorAll('button')].find(x => x.textContent.trim() === l);
  if (!b) return false;
  b.click(); return true;
}, label);
const waitPlace = (page, place, sel) => page.waitForFunction(([pl, q]) => !!document.querySelector(`[data-place="${pl}"] ${q}`),
  [place, sel], { timeout: 15000 }).catch(() => {});
const drawn = (page, place, sel) => page.evaluate(([pl, q]) => !!document.querySelector(`[data-place="${pl}"] ${q}`), [place, sel]);
// a place's section tabs, as a phone shows them (one section at a time)
const sectionsOf = (page, place) => page.evaluate(pl => [...document.querySelectorAll(`[data-place="${pl}"] [data-section-tabs] [role=tab]`)].map(x => x.textContent.trim()), place);
const toSection = async (page, place, name) => {
  await page.evaluate(([pl, n]) => { const x = [...document.querySelectorAll(`[data-place="${pl}"] [data-section-tabs] [role=tab]`)].find(b => b.textContent.trim() === n); if (x) x.click(); }, [place, name]);
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
};
// planted: the Start year controls off the page, so the history check's start years have no equivalent at 44px
const plantEquivalent = page => (PLANTS.has('noequivalent') ? page.evaluate(() => document.querySelectorAll('input[aria-label="Start year"]').forEach(x => { x.style.display = 'none'; })) : null);
// overflow, contrast and the 44px floor of what is on screen, under a label
const measure = async (page, label) => {
  await plantEquivalent(page);
  const over = await page.evaluate(OVERFLOW_PROBE);
  ok(`${label}: no sideways scroll`, over <= 1, `${over}px`);
  const bad = await page.evaluate(CONTRAST_PROBE);
  ok(`${label}: no text below the WCAG bar`, bad.length === 0, bad.slice(0, 2).map(x => `"${x.text}" ${x.ratio}:1`).join(' | '));
  const small = await page.evaluate(TOUCH_PROBE, 44);
  ok(`${label}: no control under 44px`, small.length === 0, `${small.length ? `${small.length}: ` : ''}${small.slice(0, 3).map(x => `${x.tag} "${x.text}" ${x.w}x${x.h}`).join(' | ')}`);
};

/*
 * EACH SECTION OF DETAILS NO LONGER THAN ITS CLASSIC TAB ALLOWED (the reviewer's second look at D155, finding 2). The classic
 * planner's phone check held each tab's page to a screen cap (SCREEN_CAP), so a cap of c screens is c x the screen's height
 * less the chrome the classic page drew around the tab's content: around the four tabs whose content Details keeps (Config,
 * Historical Backtest, Audit Data Table, Documentation) 28px above and 72px below, 100px, on both phones (the reviewer's third
 * look, finding 1, and the second fix round's record, results-d155-fixround-2.txt section 5); a Plan Inputs section started
 * 56px down, under its own sticky section tabs, so 140px there (results-d155-fixround.txt section 3), which You's caps below
 * use. The content the classic tab carried is held to that; what the planner adds to the section, or shows open where the
 * classic folded it on a phone, is measured and reported beside it, not held to the classic bar, as You's form is below
 * (DECISIONS-PENDING.md).
 */
const DETAILS_CHROME = 100, INPUTS_CHROME = 140;
const DETAILS_CAP = { ledger: ['Audit Data Table', 1.8], history: ['Historical Backtest', 2.6], assumptions: ['Config & Assumptions', 2.0] };
const DETAILS_ADDED = {
  // the strip of every start year: the planner's (at 9d04859a it rendered only under the solver's switch, which the classic
  // planner never had)
  history: [['[data-history-strip]', 'the strip of every start year (the planner\'s)']],
  // Tax rules sat in the classic Config's policy panel, folded on a phone; Display's heading card carries the theme, which
  // the classic Config did not (its number format card, below it, is the classic's and stays in); the solver's settings
  assumptions: [['[data-tax-rules]', 'Tax rules, open (folded on a phone in the classic Config)'], ['[data-display-theme]', 'Display\'s heading with the theme'], ['[data-solver-settings]', 'the solver\'s settings']],
};
const detailsLength = async (page, label, vh) => {
  const m = await page.evaluate(added => {
    const s = document.querySelector('[data-place="details"] section[data-details]');
    if (!s) return null;
    const id = s.getAttribute('data-details');
    return { id, own: s.getBoundingClientRect().height, parts: (added[id] || []).map(([q, what]) => ({ what, h: [...s.querySelectorAll(q)].reduce((a, x) => a + x.getBoundingClientRect().height, 0) })) };
  }, DETAILS_ADDED);
  const capOf = m && DETAILS_CAP[m.id];
  if (!capOf) { ok(`${label}: a section of Details with a classic tab's cap`, false, m ? `section ${m.id}` : 'no section'); return; }
  const [tab, cap] = capOf, allowed = Math.round(cap * vh - DETAILS_CHROME);
  const added = PLANTS.has('nolengthsub') ? 0 : m.parts.reduce((a, x) => a + x.h, 0), content = Math.round(m.own - added);
  ok(`${label}: the classic ${tab} tab's content within its ${cap} screens`, content <= allowed, `${content}px of ${allowed}px (the section ${Math.round(m.own)}px)`);
  for (const x of m.parts) if (x.h) console.log(`  (reported) ${label}: ${x.what} adds ${Math.round(x.h)}px`);
};
// the full documentation, from its contents to its last card: the classic Documentation tab's content (its cap 2.2 screens)
const docsLength = async (page, label, vh) => {
  // planted (PHONE_PLANT=docsopen): every card of the documentation opened, its whole text on the page (the folds' own checks
  // run before it), so the length check below must fail
  if (PLANTS.has('docsopen')) await page.evaluate(() => document.querySelectorAll('[data-place="details"] [id^="doc-"] details').forEach(x => { x.open = true; }));
  const d = await page.evaluate(() => {
    const c = document.querySelector('[data-place="details"] [data-doc-contents]'), cards = [...document.querySelectorAll('[data-place="details"] [id^="doc-"]')];
    if (!cards.length) return null;
    return { own: cards[cards.length - 1].getBoundingClientRect().bottom - (c || cards[0]).getBoundingClientRect().top };
  });
  const allowed = Math.round(2.2 * vh - DETAILS_CHROME);
  ok(`${label}: the classic Documentation tab's content within its 2.2 screens`, !!d && d.own <= allowed, d ? `${Math.round(d.own)}px of ${allowed}px, from the contents to the last card` : 'no documentation');
};
/*
 * THE HISTORY CHECK'S CHART AT FULL SCREEN (the reviewer's second look at D155, finding 6): the classic planner's phone check
 * held its projection chart to the screen's width and its full screen to the viewport, and Escape to closing it; the planner
 * keeps the same overlay for the history check's chart on a phone (src/App.jsx renderHistoricalChart and ChartFullscreen).
 */
const fullScreenChart = async (page, label, vw) => {
  const w = await page.evaluate(CHART_WIDTH_PROBE);
  ok(`${label}: the chart uses the screen`, w >= vw * 0.92, `${w}px of ${vw}px`);
  const opened = await page.evaluate(() => { const b = document.querySelector('[data-place="details"] [data-chart-expand]'); if (!b) return false; b.click(); return true; });
  ok(`${label}: the chart has an expand button`, opened);
  if (!opened) return;
  await page.waitForTimeout(700);
  if (PLANTS.has('halfchart')) await page.evaluate(() => { const d = document.querySelector('[role="dialog"][aria-modal="true"]'); if (d) { d.style.height = '50vh'; d.style.bottom = 'auto'; } });
  const fs = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (!d) return null;
    const svg = [...d.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    return { w: svg ? Math.round(svg.getBoundingClientRect().width) : 0, vw: window.innerWidth, dw: Math.round(d.getBoundingClientRect().width), h: Math.round(d.getBoundingClientRect().height), vh: window.innerHeight };
  });
  ok(`${label}: expand opens the chart at full screen, the viewport's width`, !!fs && fs.w >= fs.vw - 4 && Math.abs(fs.dw - fs.vw) <= 2, fs ? `the chart ${fs.w}px, the dialog ${fs.dw}px, of ${fs.vw}px` : 'no dialog');
  ok(`${label}: ...and its height`, !!fs && Math.abs(fs.h - fs.vh) <= 2, fs ? `${fs.h}px of ${fs.vh}px` : '');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  ok(`${label}: ...and Escape closes it`, await page.evaluate(() => !document.querySelector('[role="dialog"][aria-modal="true"]')));
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [devName, desc] of [['iPhone 13', devices['iPhone 13']], ['Pixel 7', devices['Pixel 7']]]) {
    for (const theme of ['light', 'dark']) {
      // the descriptor's defaultBrowserType is webkit for the iPhone; Chromium ignores it and honours the parts that matter
      // here - viewport, deviceScaleFactor, isMobile and hasTouch
      const ctx = await browser.newContext({ ...desc, defaultBrowserType: undefined });
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
      await p.addInitScript(([pl, t]) => {
        localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
        localStorage.setItem('rp_theme_v1', t);
      }, [plan, theme]);
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1500);

      console.log(`\n${devName} @ ${theme} (${desc.viewport.width}x${desc.viewport.height})`);
      ok('the pointer is coarse', await p.evaluate(() => matchMedia('(pointer: coarse)').matches));

      for (const [label, place, sel] of PLACES) {
        const via = await fromBar(p, label);
        ok(`${label}: reachable from the bottom bar`, via, via ? '' : 'no button');
        if (!via) continue;
        await waitPlace(p, place, sel);
        await p.waitForTimeout(400);
        const own = await drawn(p, place, sel);
        ok(`${label}: renders its own content`, own, own ? '' : `no ${sel}`);
        await measure(p, label);
        if (SHOT && theme === 'light') await p.screenshot({ path: `${SHOT}/phone-${devName.replace(/\s/g, '')}-${place}.png` });
        /*
         * EVERY SECTION, not the first alone: a phone shows You and Details a section at a time, and the classic planner's tabs
         * that held them (Plan Inputs, Config, Historical Backtest, Documentation) were each measured so until D155.
         */
        if (place === 'you' || place === 'details') {
          const tabs = await sectionsOf(p, place);
          if (place === 'details' && tabs.length) await detailsLength(p, `${label} / ${tabs[0]}`, desc.viewport.height);
          for (const t of tabs.slice(1)) {
            await toSection(p, place, t);
            // the history check's strip comes when every start year is run: wait for its cells, or the floor reads nothing
            if (/History/.test(t)) await p.waitForSelector('[data-place="details"] [data-history-cell]', { timeout: 20000 }).catch(() => {});
            await measure(p, `${label} / ${t}`);
            if (place === 'details' && !/solver decides/.test(t)) await detailsLength(p, `${label} / ${t}`, desc.viewport.height);
            if (/History/.test(t)) { await fullScreenChart(p, `${label} / ${t}`, desc.viewport.width); await p.evaluate(() => window.scrollTo(0, 0)); }
            if (/solver decides/.test(t)) {
              // the full documentation, opened where it lives
              await p.click('[data-place="details"] [data-docs-open]').catch(() => {});
              await p.waitForSelector('[data-place="details"] #doc-solver', { timeout: 15000 }).catch(() => {});
              await p.waitForTimeout(600);
              await p.evaluate(() => window.scrollTo(0, 0));
              await measure(p, `${label} / the full documentation`);
              /*
               * TEXT REDUCTION. The documentation's cards fold on a phone: heading visible, body in a closed <details>. Both
               * halves matter - folded by default AND still in the DOM, because the point was to shorten the scroll, not to
               * delete the reference.
               */
              const d = await p.evaluate(() => {
                const ds = [...document.querySelectorAll('[id^="doc-"] details')];
                return { n: ds.length, open: ds.filter(x => x.open).length, body: ds.filter(x => (x.textContent || '').length > 400).length, pageH: document.documentElement.scrollHeight };
              });
              ok('the full documentation folds on a phone', d.n >= 8 && d.open === 0, `${d.n} cards, ${d.open} open`);
              ok('...with the text still in the DOM', d.body >= 6, `${d.body} cards over 400 chars`);
              ok('...and a scroll you can get to the end of', d.pageH < 4000, `${d.pageH}px`);
              await docsLength(p, `${label} / the full documentation`, desc.viewport.height);
            }
          }
          if (tabs.length) await toSection(p, place, tabs[0]);
        }
      }

      const nav = await p.evaluate(NAV_PROBE);
      ok('the bottom nav is there', nav.present);
      if (nav.present) {
        ok('...fixed to the bottom', nav.fixed && nav.atBottom, `fixed ${nav.fixed}, atBottom ${nav.atBottom}`);
        ok('...tall enough to hit', nav.height >= 52, `${nav.height}px`);
        ok('...and not covering the content', nav.clear !== false, `content ends ${nav.lastBottom}, nav starts ${nav.navTop}`);
      }
      const strip = await p.evaluate(() => { const el = document.querySelector('[data-tabbar]'); return el ? Math.round(el.getBoundingClientRect().height) : 0; });
      ok('the top tab strip is hidden', strip === 0, `${strip}px`);
      const themeCtl = await p.evaluate(() => ({
        cycle: document.querySelectorAll('[data-theme-cycle]').length,
        group: [...document.querySelectorAll('button')].filter(b => /^(Light|Dark|Sepia)$/.test(b.getAttribute('aria-label') || '')).length
      }));
      ok('the theme is one cycling button, not three', themeCtl.cycle === 1 && themeCtl.group === 0, `${themeCtl.cycle} cycle, ${themeCtl.group} of three`);

      {
        // ---- You on a phone, on each phone in both themes (the reviewer's second look at D155, finding 3): its inputs, its
        // sections, the swipe between them ----
        await fromBar(p, 'You');
        await waitPlace(p, 'you', '[data-you-rows]');
        await p.waitForTimeout(400);
        const sizes = await p.evaluate(INPUT_SIZE_PROBE);
        const tiny = sizes.filter(x => x.font < 16);
        ok('You: inputs are at least 16px, so focusing does not zoom', sizes.length > 0 && tiny.length === 0, `${tiny.length} of ${sizes.length} under 16px`);
        const sectionTab = async (name) => { await p.evaluate(t => { const x = [...document.querySelectorAll('[data-section-tabs] [role=tab]')].find(b => b.textContent.trim() === t); if (x) x.click(); }, name); await p.waitForTimeout(450); };
        const activeSection = () => p.evaluate(() => document.querySelector('[data-section-tabs] [aria-selected="true"]')?.textContent.trim());
        const tabs = await p.evaluate(() => [...document.querySelectorAll('[data-section-tabs] [role=tab]')].map(b => b.textContent.trim()));
        await sectionTab(tabs[0]);
        ok('You: its sections are tabs, one showing', tabs.length >= 6 && (await activeSection()) === tabs[0], `${tabs.join(', ')}; showing ${await activeSection()}`);
        const swipe = async (fromX, toX, y) => {
          const cdp = await ctx.newCDPSession(p);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: fromX, y }] });
          for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: fromX + (toX - fromX) * i / 6, y }] });
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await cdp.detach();
          await p.waitForTimeout(450);
        };
        // a swipe on the content moves to the next section; it starts on the rows, not on the tab row
        const yRow = await p.evaluate(() => { const el = document.querySelector('[data-you-rows]'); const r = el && el.getBoundingClientRect(); return r ? Math.min(r.top + 30, innerHeight - 100) : innerHeight / 2; });
        await swipe(320, 80, yRow);
        ok('You: a swipe left moves to the next section', (await activeSection()) === tabs[1], await activeSection());
        await swipe(80, 320, yRow);
        ok('...and a swipe right comes back', (await activeSection()) === tabs[0], await activeSection());

        /*
         * YOU'S PHONE FORM (the classic planner's Plan Inputs until D155, the same form): each section one at a time, nothing
         * sideways, and the form's own content no longer than the classic page allowed it with no long drop-down (the tiers are
         * chips). The classic page held a section under two screens and a half, 1,800px, with 140px of its own above and below
         * the section, so the form's content had 1,660px; the planner's You heading starts every section 266px lower (322px
         * on this phone, the classic page's 56px), which is the place's design and not the form's, so the bar is the section's
         * own height (FORM_CAP). What the planner adds to the form is measured and reported, not held to the classic bar: Your
         * current approach's controls in Advanced (the classic planner's Config until D155) and Limits, the solver's own card,
         * whose riskiest tiers are drop-downs (the reviewer on D155's fix round; DECISIONS-PENDING.md).
         */
        const FORM_CAP = 1800 - INPUTS_CHROME;
        /*
         * AND THE TAB AS IT OPENS no longer than the classic planner's Plan Inputs tab allowed on a phone (its screen cap, 2.0
         * screens: SCREEN_CAP there, on the section it opened at), converted with the 140px its page drew around a section:
         * the form's own content of You's first section (the reviewer's third look at D155, finding 3). Planted
         * (PHONE_PLANT=tallyou: 500px more in that section), it fails on the iPhone 13, under the 1,660px bar above.
         */
        const INPUTS_CAP = 2.0;
        for (const t of tabs) {
          await sectionTab(t);
          if (t === tabs[0] && PLANTS.has('tallyou')) await p.evaluate(() => { const sec = document.querySelector('[data-place="you"] [data-section]'); if (sec) { const d = document.createElement('div'); d.style.height = '500px'; d.setAttribute('data-planted', ''); sec.appendChild(d); } });
          const m = await p.evaluate(() => {
            const secs = [...document.querySelectorAll('[data-place="you"] [data-section]')], sec = secs[0];
            const added = sec ? [...sec.querySelectorAll('[data-current-approach]')].reduce((a, x) => a + x.getBoundingClientRect().height, 0) : 0;
            const own = sec ? sec.getBoundingClientRect().height : 0;
            return { one: secs.length, id: sec ? sec.getAttribute('data-section') : null, page: document.documentElement.scrollHeight, own: Math.round(own), form: Math.round(own - added), added: Math.round(added),
              bigSelects: sec && sec.getAttribute('data-section') !== 'limits' ? [...sec.querySelectorAll('select')].filter(x => x.options.length >= 6).length : 0,
              limitsSelects: sec && sec.getAttribute('data-section') === 'limits' ? [...sec.querySelectorAll('select')].filter(x => x.options.length >= 6).map(x => `${x.getAttribute('aria-label')} (${x.options.length})`) : [] };
          });
          const over = await p.evaluate(OVERFLOW_PROBE);
          ok(`You / ${t}: one section, the form's own content under the classic bar, nothing sideways, no long drop-down`, m.one === 1 && m.form <= FORM_CAP && over <= 1 && m.bigSelects === 0,
            `the form ${m.form}px of ${FORM_CAP}, ${m.bigSelects} long selects, ${over}px overflow; the page ${m.page}px`);
          if (t === tabs[0]) {
            const allowed = Math.round(INPUTS_CAP * desc.viewport.height - INPUTS_CHROME);
            ok(`You / ${t}: the classic Plan Inputs tab's content as it opened within its ${INPUTS_CAP} screens`, m.form <= allowed, `the form ${m.form}px of ${allowed}px`);
            await p.evaluate(() => document.querySelectorAll('[data-planted]').forEach(x => x.remove()));
          }
          if (m.added) console.log(`  (reported) You / ${t}: Your current approach's controls add ${m.added}px, the section ${m.own}px, the page ${m.page}px`);
          if (m.limitsSelects.length) console.log(`  (reported) You / ${t}: the solver's limits as drop-downs: ${m.limitsSelects.join(', ')}`);
        }
        /*
         * AN INCOME STREAM CANNOT START BEFORE ITS OWNER RETIRES. Nothing is drawn or saved while somebody is still working, so an
         * earlier start was money entered, taxed, shown in the year-by-year table and then dropped. The field takes the
         * retirement age as its floor and snaps back to it.
         */
        await sectionTab(tabs.find(t => /^Income$/.test(t)) || 'Income');
        await p.evaluate(() => { const a = [...document.querySelectorAll('[data-place="you"] button')].find(b => /Add stream/i.test(b.textContent)); if (a) a.click(); });
        await p.waitForTimeout(600);
        const marked = await p.evaluate(() => {
          const rows = [...document.querySelectorAll('[data-place="you"] div')].filter(d => /^From age/.test((d.innerText || '').trim()) && d.querySelector('input[type=number]'));
          const el = rows[rows.length - 1];
          if (!el) return null;
          const i = el.querySelector('input[type=number]');
          i.setAttribute('data-probe', '1');
          return { min: i.getAttribute('min'), retire: JSON.parse(localStorage.getItem('rp_plan_full_v28')).demographics.retireAgeSelf };
        });
        ok('an income stream cannot start before the age you retire', !!marked && Number(marked.min) === Number(marked.retire), marked ? `min ${marked.min}, retiring at ${marked.retire}` : 'no From age field');
        if (marked) {
          const field = p.locator('input[data-probe="1"]');
          await field.fill(String(Number(marked.retire) - 12));
          await p.waitForTimeout(250);
          await p.keyboard.press('Tab');
          await p.waitForTimeout(500);
          const snapped = await p.evaluate(() => {
            const i = document.querySelector('input[data-probe="1"]');
            const saved = JSON.parse(localStorage.getItem('rp_plan_full_v28')).otherIncomes;
            return { shown: i ? i.value : null, saved: saved.length ? saved[saved.length - 1].startAge : null };
          });
          ok('...and an earlier age typed in snaps back to it', Number(snapped.shown) === Number(marked.retire) && Number(snapped.saved) === Number(marked.retire), `shows ${snapped.shown}, saved ${snapped.saved}`);
          await p.evaluate(() => { const d = [...document.querySelectorAll('button')].find(b => /Remove this income stream/i.test(b.getAttribute('aria-label') || '')); if (d) d.click(); });
          await p.waitForTimeout(400);
        }
        await sectionTab(tabs[0]);
        const you = await p.evaluate(() => {
          const labels = [...document.querySelectorAll('[data-you-rows] label')];
          // the CONTROL column, not the first button in the row: a label can hold a glossary word, a button of its own
          const left = labels.filter(l => { const c = l.parentElement.querySelector('[data-field-control]'); return c && l.getBoundingClientRect().left < c.getBoundingClientRect().left; }).length;
          // every control in one column, the same right edge: a stray -/+ would show here as a second edge
          const ctrls = [...document.querySelectorAll('[data-you-rows] input, [data-you-rows] select')].map(c => Math.round(c.getBoundingClientRect().right));
          return { labels: labels.length, left, hints: document.querySelectorAll('[data-you-rows] button[aria-label^="About"]').length,
            terms: document.querySelectorAll('[data-you-rows] button[data-term]').length,
            steppers: document.querySelectorAll('[data-you-rows] button[aria-label^="increase"]').length, edges: [...new Set(ctrls)].length, ctrls: ctrls.length };
        });
        ok('You is rows: label left, control right', you.labels >= 7 && you.left === you.labels, `${you.left} of ${you.labels}`);
        ok('...every control ending on one line, and the explanations one tap away', you.edges === 1 && you.steppers === 0 && (you.hints + you.terms) >= 3,
          `${you.ctrls} controls on ${you.edges} right edge(s), ${you.steppers} steppers, ${you.hints} hints, ${you.terms} terms`);
        await p.evaluate(() => { const b = [...document.querySelectorAll('[data-place="you"] button')].find(x => /Add band/.test(x.textContent)); if (b) b.click(); });
        await p.waitForTimeout(400);
        const band = await p.evaluate(() => { const r = document.querySelector('[data-collapsed-row]'); return r ? { open: r.getAttribute('data-open'), inputs: r.querySelectorAll('input').length } : null; });
        ok('a new band opens as a row of three fields', !!band && band.open === 'true' && band.inputs === 3, JSON.stringify(band));
        await p.evaluate(() => { const b = document.querySelector('[data-collapsed-row] button[aria-label="Remove this band"]'); if (b) b.click(); });
        await p.waitForTimeout(300);
        // the explanation is on the screen, not behind a mark: two clamped lines of the real sentence, the rest a tap away
        await sectionTab(tabs[1]);
        const preview = await p.evaluate(() => {
          const f = [...document.querySelectorAll('[data-place="you"] [data-fine]')].find(x => x.getBoundingClientRect().height > 0);
          if (!f) return null;
          const txt = f.firstElementChild, btn = f.querySelector('[data-help-dot]');
          return { chars: (txt.innerText || '').trim().length, clamped: /line-clamp/.test(txt.className || ''), label: (btn ? btn.textContent : '').trim() };
        });
        ok('a folded explanation shows its first lines and names the rest', !!preview && preview.chars > 40 && preview.clamped === true && /\u2026$/.test(preview.label),
          preview ? `${preview.chars} chars, opens with "${preview.label}"` : 'no fold found');
        const risk = await p.evaluate(() => ({ summaries: document.querySelectorAll('[data-risk-summary]').length, cards: document.querySelectorAll('[data-wrapper-card]').length }));
        // five cards since the Cash ISA wrapper: four with a tier of their own, the Cash ISA saying it grows at the Cash Savings rate
        ok('each wrapper is a card showing its tier, the Cash ISA borrowing Cash Savings\'', risk.cards === 5 && risk.summaries === 4, `${risk.cards} cards, ${risk.summaries} tiers`);
        await p.evaluate(() => document.querySelector('[data-risk-summary]')?.click());
        await p.waitForTimeout(300);
        const chips = await p.evaluate(() => document.querySelectorAll('[data-wrapper-card] [role=radio]').length);
        ok('...which opens into six chips, not a drop-down', chips === 6, `${chips} chips`);
        await p.evaluate(() => document.querySelectorAll('[data-wrapper-card] [role=radio]')[2]?.click());
        await p.waitForTimeout(400);
        const picked = await p.evaluate(() => ({ saved: JSON.parse(localStorage.getItem('rp_plan_full_v28')).accounts[0].risk, closed: document.querySelectorAll('[data-wrapper-card] [role=radio]').length === 0 }));
        ok('...and a chip sets the tier and folds away', picked.saved === 'Medium Risk' && picked.closed, JSON.stringify(picked));
        await sectionTab(tabs[0]);

        // ---- a glossary term: its own tap target, opening its definition and closing again ----
        let help = null;
        for (const [label, place, sel] of [['You', 'you', '[data-you-rows]'], ['Details', 'details', '[data-audit-ledger]']]) {
          await fromBar(p, label);
          await waitPlace(p, place, sel);
          await p.waitForTimeout(400);
          // open the folds first, the way a reader does: a term inside a closed card is laid out but cannot be scrolled to
          await p.evaluate(() => { document.querySelectorAll('details:not([open])').forEach(d => { d.open = true; }); });
          await p.waitForTimeout(400);
          help = await p.evaluate(() => {
            const vis = el => el.getBoundingClientRect().width > 0;
            let onScreen = null;
            for (const cand of document.querySelectorAll('[data-term]')) {
              if (!vis(cand)) continue;
              cand.scrollIntoView({ block: 'center' });
              const rr = cand.getBoundingClientRect();
              if (rr.top >= 0 && rr.bottom <= window.innerHeight) { onScreen = cand; cand.setAttribute('data-term-probe', '1'); break; }
            }
            if (!onScreen) return { terms: document.querySelectorAll('[data-term]').length, reached: false };
            const r = onScreen.getBoundingClientRect();
            const on = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return { terms: document.querySelectorAll('[data-term]').length, reached: true, hitOk: !!on && (on === onScreen || onScreen.contains(on)),
              shimmer: /gradient/.test(getComputedStyle(onScreen).backgroundImage), tall: Math.round(r.height) };
          });
          if (help.reached) { help.where = label; break; }
        }
        ok('a glossary term can be brought onto the screen', !!help && help.reached, help ? `${help.terms} terms${help.where ? ` in ${help.where}` : ''}` : 'none');
        if (help && help.reached) {
          ok('...and it is the tap target itself, not a mark beside it', help.hitOk === true, `at the middle of it a finger hits ${help.hitOk ? 'the term' : 'something else'}`);
          ok('...marked as pressable by a shimmering underline', help.shimmer === true, `background gradient: ${help.shimmer}`);
          ok('...at the height of the text it sits in, not the 44px floor', help.tall <= 30, `${help.tall}px tall`);
          // the bubble closes on scroll by design, so the tap waits for the scroll to settle
          await p.waitForTimeout(400);
          await p.evaluate(() => { const t = document.querySelector('[data-term-probe]'); if (t) t.click(); });
          await p.waitForTimeout(350);
          const bub = await p.evaluate(() => { const t = document.querySelector('[role=tooltip]'); return t ? { w: Math.round(t.getBoundingClientRect().width), chars: t.textContent.trim().length } : null; });
          ok('...tapping one opens its definition', !!bub && bub.chars > 40, bub ? `${bub.w}px, ${bub.chars} chars` : 'nothing opened');
          await p.evaluate(() => { const b = document.querySelector('[role=tooltip] button'); if (b) b.click(); });
          await p.waitForTimeout(300);
          ok('...and it closes again', await p.evaluate(() => !document.querySelector('[role=tooltip]')));
        }
      }
      ok(`${devName} @ ${theme}: no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  }
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
