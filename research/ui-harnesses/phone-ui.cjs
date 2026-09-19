/*
 * THE PHONE LAYOUT, ON EMULATED PHONES.
 *
 * The desktop regression harness already walks 390px, but a narrow window is not a phone: it has a mouse
 * pointer, a device pixel ratio of 1, and no touch. This one runs real device descriptors - an iPhone 13
 * and a Pixel 7 - so `(pointer: coarse)` matches, touch targets are measured at the scale a finger
 * actually meets, and the layout is exercised the way it ships.
 *
 * It grows a block per phase. What it asserts today:
 *   - every tab reaches its own content, with no sideways scroll and nothing below 3:1 contrast
 *   - no interactive control is smaller than 44px without an explicit hit area
 *   - the bottom navigation is present, fixed, and does not sit on top of the page's last content
 *   - the top tab strip is hidden
 *
 * Navigation goes through the bottom bar where it exists and falls back to the top strip, so the harness
 * is useful before and after the bar lands.
 *
 * No stylesheet is injected here, unlike the older harnesses. They carry a leftover from when the dev
 * server used a Tailwind CDN; the built site links its own compiled CSS. Injecting a second, older copy
 * over the top is how you get phantom contrast failures from tokens that have since been re-tuned.
 *
 * Run: node phone-ui.cjs [port] [shotDir]
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const { CONTRAST_PROBE, OVERFLOW_PROBE, TOUCH_PROBE, NAV_PROBE, CHART_WIDTH_PROBE, AMBER_PROBE, INPUT_SIZE_PROBE } = require('./lib/probes.cjs');
const PORT = process.argv[2] || '5173';
const SHOT = process.argv[3];
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

const simplePlan = {
  ageSelf: 45, retireSelf: 62, terminalAge: 95, spend: 40000, salary: 70000, couple: false,
  pen: 320000, isa: 90000, gia: 40000, cash: 25000, penC: 12000, isaC: 6000, giaC: 0, cashC: 0,
  penG: '', isaG: '', giaG: '', cashG: '', statePensionSelf: 12548, region: 'ruk', oneOffs: [], earnings: [],
  penRisk: 'High Risk', isaRisk: 'High Risk', giaRisk: 'Medium Risk', cashRisk: 'Cash Equivalents'
};

/*
 * HOW MANY SCREENS A TAB IS ALLOWED TO BE.
 *
 * Measured before the cuts, on the iPhone 13 profile: Config was 5.3 screens, Audit 4.3, Start 3.6,
 * Backtest 3.0. A phone tab that runs past two screens is one where the thing you came for is below the
 * fold and you cannot tell, so each tab now carries a ceiling with about 15% of headroom over what it
 * measures today. Three are allowed more, and each for a reason that is not "it was easier": Backtest
 * holds a chart, an era picker and a verdict; Documentation is a directory of eleven folded sections;
 * Start explains the other seven tabs.
 *
 * Projection went from 1.5 to 1.9 deliberately. Before a run the tab is a button and a card that used to
 * say "The six steps" over a fold holding a paragraph about them; it now shows the seven steps as a
 * list, named, each with a line of what it does. That is 396px of contents where there were 44px of a
 * closed fold, and it is the thing the tab is for - measured at 1,149px of 664, so the ceiling keeps its
 * usual headroom over what it is.
 */
const SCREEN_CAP = {
  'Start Here': 2.1, 'Plan Inputs': 2.0, 'Config & Assumptions': 2.0, 'Projection': 1.9,
  'Strategy': 1.8, 'Historical Backtest': 2.6, 'Audit Data Table': 1.8, 'Documentation': 2.2
};

// label, the regex that proves the tab rendered its own content, and the short label the bottom bar uses
const TABS = [
  ['Start Here', /What each tab is for/i, 'Start'],
  ['Plan Inputs', /With partner/i, 'Inputs'],
  ['Config & Assumptions', /Decumulation/i, 'Config'],
  ['Projection', /Run the projection/i, 'Projection'],
  ['Strategy', /tournament/i, 'Strategy'],
  ['Historical Backtest', /1928|backtest/i, 'Backtest'],
  ['Audit Data Table', /audit|year-by-year|Age/i, 'Audit'],
  ['Documentation', /methodology|documentation|priorit/i, 'Docs'],
];

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

/*
 * Reach a tab the way a finger would. Prefer the bottom bar (direct button, else through More); fall
 * back to the top strip so this harness is meaningful before the bar exists. Returns how it got there,
 * which is itself asserted once the bar has landed.
 */
const navigate = async (page, label, short) => {
  // Step 1: a tab that has its own place on the bar.
  const direct = await page.evaluate((brief) => {
    const nav = document.querySelector('[data-bottomnav]');
    if (!nav) return false;
    const b = [...nav.querySelectorAll('button')].find(x => x.textContent.trim().startsWith(brief));
    if (!b) return false;
    b.click(); return true;
  }, short);
  if (direct) return 'bottom';

  /*
   * Step 2: through More. This has to be two calls with a wait between them. The sheet is a React
   * portal, so it does not exist in the DOM until React has re-rendered - a single evaluate that clicks
   * More and then looks for the row finds nothing, falls through to the top strip, and quietly reports a
   * pass for a route the user does not have.
   */
  const opened = await page.evaluate(() => {
    const nav = document.querySelector('[data-bottomnav]');
    const more = nav && [...nav.querySelectorAll('button')].find(b => /more/i.test(b.getAttribute('aria-label') || ''));
    if (!more) return false;
    if (!document.querySelector('[role="dialog"]')) more.click();
    return true;
  });
  if (opened) {
    await page.waitForTimeout(250);
    const picked = await page.evaluate((full) => {
      const row = [...document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent.trim().startsWith(full));
      if (!row) return false;
      row.click(); return true;
    }, label);
    if (picked) return 'more';
  }

  // Step 3: the desktop strip, so this harness still says something before the bar exists.
  const top = await page.evaluate((full) => {
    const b = [...document.querySelectorAll('[data-tabbar] button')].find(x => x.textContent.includes(full));
    if (!b) return false;
    b.click(); return true;
  }, label);
  return top ? 'top' : null;
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [devName, desc] of [['iPhone 13', devices['iPhone 13']], ['Pixel 7', devices['Pixel 7']]]) {
    for (const theme of ['light', 'dark']) {
      // the descriptor's defaultBrowserType is webkit for the iPhone; Chromium ignores it and honours
      // the parts that matter here - viewport, deviceScaleFactor, isMobile and hasTouch
      const ctx = await browser.newContext({ ...desc, defaultBrowserType: undefined });
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
      await p.addInitScript(([pl, sp, t]) => {
        localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
        // the simple page is seeded too: its phone card only renders once there is enough to answer with
        if (!localStorage.getItem('rp_simple_v1')) localStorage.setItem('rp_simple_v1', JSON.stringify(sp));
        if (!localStorage.getItem('rp_which_app')) localStorage.setItem('rp_which_app', 'full');
        localStorage.setItem('rp_theme_v1', t);
      }, [plan, simplePlan, theme]);
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1500);

      console.log(`\n${devName} @ ${theme} (${desc.viewport.width}x${desc.viewport.height})`);
      ok('the pointer is coarse', await p.evaluate(() => matchMedia('(pointer: coarse)').matches));

      for (const [label, marker, short] of TABS) {
        const via = await navigate(p, label, short);
        // 'top' means it fell back to the hidden desktop strip: the phone route is broken.
        ok(`${label}: reachable from the bottom bar`, via === 'bottom' || via === 'more', via || 'not found');
        if (!via) continue;
        await p.waitForTimeout(650);
        const text = await p.evaluate(() => document.body.innerText);
        ok(`${label}: renders its own content`, marker.test(text), marker.test(text) ? '' : text.slice(0, 50).replace(/\n/g, ' '));
        const over = await p.evaluate(OVERFLOW_PROBE);
        ok(`${label}: no sideways scroll`, over <= 1, `${over}px`);
        const bad = await p.evaluate(CONTRAST_PROBE);
        ok(`${label}: no text below the WCAG bar`, bad.length === 0, bad.slice(0, 2).map(x => `"${x.text}" ${x.ratio}:1`).join(' | '));
        const small = await p.evaluate(TOUCH_PROBE, 44);
        ok(`${label}: no control under 44px`, small.length === 0, small.slice(0, 3).map(x => `${x.tag} "${x.text}" ${x.w}x${x.h}`).join(' | '));
        const tall = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: window.innerHeight,
          beta: /not financial advice/i.test(document.body.innerText) }));
        const screens = tall.h / tall.vh;
        ok(`${label}: ${SCREEN_CAP[label]} screens or less`, screens <= SCREEN_CAP[label], `${screens.toFixed(1)} screens, ${tall.h}px`);
        // The footer said it under all eight. Start Here says it once; nothing else says it at all.
        ok(`${label}: the beta notice is ${label === 'Start Here' ? 'here' : 'not repeated'}`,
           tall.beta === (label === 'Start Here'), tall.beta ? 'present' : 'absent');
        /*
         * TEXT REDUCTION. The eleven Documentation cards fold on a phone: heading visible, body in a
         * closed <details>. Both halves matter - folded by default AND still in the DOM, because the
         * point was to shorten the scroll, not to delete the reference. The tab's own content marker
         * above already proves a closed card has not taken its heading down with it.
         */
        if (label === 'Documentation') {
          const d = await p.evaluate(() => {
            const ds = [...document.querySelectorAll('[id^="doc-"] details')];
            return { n: ds.length, open: ds.filter(x => x.open).length,
              body: ds.filter(x => (x.textContent || '').length > 400).length,
              pageH: document.documentElement.scrollHeight };
          });
          ok('the reference folds on a phone', d.n >= 8 && d.open === 0, `${d.n} cards, ${d.open} open`);
          ok('...with the text still in the DOM', d.body >= 6, `${d.body} cards over 400 chars`);
          ok('...and a scroll you can get to the end of', d.pageH < 4000, `${d.pageH}px`);
        }
        await p.evaluate(() => window.scrollTo(0, 0));
      }

      /*
       * THE CHARTS. A chart on a phone is the thing people came for, so it should be using the screen.
       * 92% rather than 100% because the card keeps a hairline border and the scrollbar gutter varies.
       */
      await navigate(p, 'Projection', 'Projection');
      await p.waitForTimeout(500);
      const ran = await p.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => /Run the projection/i.test(x.textContent));
        if (!b) return false; b.click(); return true;
      });
      ok('the projection runs', ran);
      if (ran) {
        await p.waitForFunction(() => !!document.querySelector('[data-deck-step="8"]'), null, { timeout: 240000 });
        await p.waitForTimeout(1200);
        const vw = desc.viewport.width;
        // The phone keeps its own steps - the dashboard is a desktop layout - so the charts are on
        // steps 5, 6 and 8 as they were, with the trade-off grid added as step 4.
        for (const step of ['5', '6', '8']) {
          await p.evaluate((n) => { const b = document.querySelector(`[data-deck-step="${n}"]`); if (b) b.click(); }, step);
          await p.waitForTimeout(900);
          const w = await p.evaluate(CHART_WIDTH_PROBE);
          ok(`step ${step}: the chart uses the screen`, w >= vw * 0.92, `${w}px of ${vw}px`);
          const over = await p.evaluate(OVERFLOW_PROBE);
          ok(`step ${step}: no sideways scroll`, over <= 1, `${over}px`);
        }
        /*
         * THE STEP'S EXPLANATION, CUT TO TWO LINES. Both halves matter and the first one has already
         * been got wrong once: `line-clamp-2` sets `display:-webkit-box`, so a `block` utility sitting
         * beside it turns the clamp off silently - the text looks the same, the button still opens
         * something that was never shut. So measure the clamp, not just the button.
         */
        await p.evaluate(() => { const b = document.querySelector('[data-deck-step="1"]'); if (b) b.click(); });
        await p.waitForTimeout(600);
        const clamp = await p.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(x => /What this means/.test(x.textContent));
          const sp = btn && btn.previousElementSibling;
          return sp ? { shown: Math.round(sp.getBoundingClientRect().height), full: sp.scrollHeight } : null;
        });
        /* the deck's own contents list: a number on its own says where you are but not what is there */
        /*
         * THE STEPS, IN A BAR ABOVE THE NAVIGATION. They used to be a strip at the FOOT of each card, so
         * moving from step 3 to step 6 meant scrolling to the bottom of step 3 first - and a card is one
         * to three screens. The bar is where the tabs are, one level down from them.
         */
        const bar = await p.evaluate(() => {
          const el = document.querySelector('[data-deck-bar]');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const nav = document.querySelector('[data-bottomnav]');
          const nr = nav ? nav.getBoundingClientRect() : null;
          return { steps: el.querySelectorAll('[data-deck-step]').length,
            named: [...el.querySelectorAll('[data-deck-step]')].map(b => b.textContent.trim()).filter(t => /[a-z]/i.test(t)).length,
            sits: nr ? Math.round(r.bottom - nr.top) : null, onScreen: r.bottom <= window.innerHeight + 1 };
        });
        ok('the steps are a bar above the navigation', !!bar && bar.steps === 8, bar ? `${bar.steps} steps` : 'no bar');
        ok('...each saying what it is, not just its number', !!bar && bar.named === 8, bar ? `${bar.named} named` : '');
        ok('...sitting on the navigation, both on screen', !!bar && Math.abs(bar.sits) <= 2 && bar.onScreen, bar ? `${bar.sits}px from the nav` : '');
        ok('the step explanation is cut to its first lines', !!clamp && clamp.shown < clamp.full,
           clamp ? `${clamp.shown}px shown of ${clamp.full}px` : 'no clamp found');
        await p.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(x => /What this means/.test(x.textContent));
          if (btn) btn.click();
        });
        await p.waitForTimeout(400);
        const reopened = await p.evaluate(() => {
          const btn = [...document.querySelectorAll('button')].find(x => /Show less/.test(x.textContent));
          const sp = btn && btn.previousElementSibling;
          return sp ? { h: Math.round(sp.getBoundingClientRect().height), full: sp.scrollHeight } : null;
        });
        ok('...and one tap opens the whole of it', !!reopened && reopened.h >= reopened.full - 1,
           reopened ? `${reopened.h}px of ${reopened.full}px` : 'never opened');

        // fullscreen, on the Monte Carlo step
        await p.evaluate(() => { const b = document.querySelector('[data-deck-step="6"]'); if (b) b.click(); });
        await p.waitForTimeout(900);
        const opened = await p.evaluate(() => { const b = document.querySelector('[data-chart-expand]'); if (!b) return false; b.click(); return true; });
        ok('the chart has an expand button', opened);
        if (opened) {
          await p.waitForTimeout(700);
          const fs = await p.evaluate(() => {
            const d = document.querySelector('[role="dialog"][aria-modal="true"]');
            if (!d) return null;
            const svg = [...d.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
            return { w: svg ? Math.round(svg.getBoundingClientRect().width) : 0, vw: window.innerWidth,
                     h: Math.round(d.getBoundingClientRect().height), vh: window.innerHeight };
          });
          ok('expand opens a fullscreen chart', !!fs && fs.w >= fs.vw - 4, fs ? `${fs.w}px of ${fs.vw}px` : 'no dialog');
          ok('...filling the viewport height', !!fs && Math.abs(fs.h - fs.vh) <= 2, fs ? `${fs.h} vs ${fs.vh}` : '');
          await p.keyboard.press('Escape');
          await p.waitForTimeout(500);
          const closed = await p.evaluate(() => !document.querySelector('[role="dialog"][aria-modal="true"]'));
          ok('...and Escape closes it', closed);
        }
      }

      /*
       * THE SANDBOX SHEET. The point of the sandbox is watching a line move while you adjust, so the
       * assertions are exactly that: the dial is reachable, and using it draws the amber line on the
       * chart that is still on screen above.
       */
      if (ran) {
        await p.evaluate(() => { const b = document.querySelector('[data-deck-step="8"]'); if (b) b.click(); });
        await p.waitForTimeout(900);
        const sheet = await p.evaluate(() => {
          const el = document.querySelector('[data-sandbox-sheet]');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          // measure the CHART, not a percentage of the screen: "is the chart visible" is the actual
          // requirement, and a fraction is a guess that happens to correlate with it on one device
          const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
          const c = svg ? svg.getBoundingClientRect() : null;
          return { mode: el.getAttribute('data-mode'), top: Math.round(r.top), vh: window.innerHeight,
                   chartBottom: c ? Math.round(c.bottom) : null };
        });
        ok('the sandbox is a sheet on a phone', !!sheet, sheet ? sheet.mode : 'not found');
        if (sheet) {
          ok('...leaving the whole chart visible above it', sheet.chartBottom !== null && sheet.chartBottom <= sheet.top,
            `chart ends ${sheet.chartBottom}, sheet starts ${sheet.top}`);
          const before = await p.evaluate(AMBER_PROBE);
          ok('...no amber line before touching a dial', before === 0, String(before));
          const bumped = await p.evaluate(() => {
            const el = document.querySelector('[data-sandbox-sheet]');
            const b = [...el.querySelectorAll('button')].find(x => x.textContent.trim() === '+500');
            if (!b) return false; b.click(); return true;
          });
          ok('...a contribution dial is there', bumped);
          /*
           * ONE LIST AT A TIME. Every wrapper has a contribution dial and a balance dial, so a couple
           * with eight wrappers had sixteen stacked, the balances below the fold under the
           * contributions. The sheet picks between the two the way the dashboard's rail does, on one row
           * at the top - so the balances are a tap away rather than a scroll away, and neither list is
           * showing while the other is.
           */
          const kinds = await p.evaluate(() => {
            const el = document.querySelector('[data-sandbox-sheet]');
            const row = el && el.querySelector('[data-dial-kind]');
            const money = () => [...el.querySelectorAll('button')].map(b => b.textContent.trim());
            return { row: !!row, top: row ? Math.round(row.getBoundingClientRect().top) : null,
              first: row ? Math.round(row.getBoundingClientRect().height) : null,
              contribShown: money().some(t => t === '+500'), balanceShown: money().some(t => /^\+25,?000$/.test(t)) };
          });
          ok('...the dials pick between paid-in and balance, at the top', kinds.row === true && kinds.contribShown && !kinds.balanceShown,
            `row: ${kinds.row}, ${kinds.first}px, contributions ${kinds.contribShown}, balances ${kinds.balanceShown}`);
          const swapped = await p.evaluate(async () => {
            const el = document.querySelector('[data-sandbox-sheet]');
            const b = [...el.querySelectorAll('[data-dial-kind] button')].find(x => /Balance/i.test(x.textContent));
            if (!b) return null;
            b.click();
            await new Promise(r => setTimeout(r, 400));
            const money = [...el.querySelectorAll('button')].map(x => x.textContent.trim());
            return { balance: money.some(t => /^\+25,?000$/.test(t)), contrib: money.some(t => t === '+500') };
          });
          ok('...and tapping Balance swaps which list is showing', !!swapped && swapped.balance && !swapped.contrib,
            swapped ? `balances ${swapped.balance}, contributions ${swapped.contrib}` : 'no toggle');
          await p.evaluate(async () => {
            const el = document.querySelector('[data-sandbox-sheet]');
            const b = [...el.querySelectorAll('[data-dial-kind] button')].find(x => /year/i.test(x.textContent));
            if (b) { b.click(); await new Promise(r => setTimeout(r, 300)); }
          });
          await p.waitForTimeout(800);
          const after = await p.evaluate(AMBER_PROBE);
          ok('...and using it draws the amber line', after > 0, `${after} dashed path(s)`);
          // everything the desktop panel has is still reachable
          const opened = await p.evaluate(() => {
            const el = document.querySelector('[data-sandbox-sheet]');
            const b = [...el.querySelectorAll('button')].find(x => /All controls/i.test(x.textContent));
            if (!b) return false; b.click(); return true;
          });
          await p.waitForTimeout(700);
          const fullMode = await p.evaluate(() => {
            const el = document.querySelector('[data-sandbox-sheet]');
            return { mode: el && el.getAttribute('data-mode'), inputs: el ? el.querySelectorAll('input').length : 0 };
          });
          ok('...All controls opens the full panel', opened && fullMode.mode === 'full' && fullMode.inputs >= 6,
            `${fullMode.mode}, ${fullMode.inputs} inputs`);
          // and the bar is still usable while the sheet is in quick mode
          await p.evaluate(() => {
            const el = document.querySelector('[data-sandbox-sheet]');
            const b = [...el.querySelectorAll('button')].find(x => /Done|Close/i.test(x.textContent));
            if (b) b.click(); else el.querySelector('button').click();
          });
          await p.waitForTimeout(400);
          const navUsable = await p.evaluate(() => {
            const nav = document.querySelector('[data-bottomnav]');
            if (!nav) return false;
            const r = nav.getBoundingClientRect();
            const mid = document.elementFromPoint(r.left + r.width / 10, r.top + r.height / 2);
            return !!(mid && mid.closest('[data-bottomnav]'));
          });
          ok('...and the nav is still tappable underneath', navUsable);
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

      /*
       * THE SIMPLE PAGE: THREE TABS, AND NOTHING BELOW THE FOLD.
       *
       * It was one column 2,828px tall with the chart pinned to the top. Pinning bought back the feedback
       * an edit needs and spent a third of every screen on it to do so, and the six figures still sat at
       * the bottom of the third screen. Now it is an app screen rather than a document: a 44px bar, one
       * tab, a tab bar, and no scroll anywhere - the assertion this whole block exists for is that every
       * pane's content fits inside its own box on BOTH device profiles, the 664px one included.
       */
      await p.evaluate(() => {
        localStorage.setItem('rp_which_app', 'simple');
        sessionStorage.removeItem('rp_simple_tab');
        sessionStorage.removeItem('rp_simple_section');
      });
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(2200);
      const simpleTab = async (name) => {
        await p.evaluate(t => { const x = [...document.querySelectorAll('[data-simple-tabs] button')].find(b => b.textContent.trim() === t); if (x) x.click(); }, name);
        await p.waitForTimeout(500);
      };
      const formSection = async (name) => {
        await p.evaluate(t => { const x = [...document.querySelectorAll('[data-section-tabs] [role=tab]')].find(b => b.textContent.trim() === t); if (x) x.click(); }, name);
        await p.waitForTimeout(400);
      };
      const tabState = () => p.evaluate(() => {
        const nav = document.querySelector('[data-simple-tabs]');
        if (!nav) return null;
        const btns = [...nav.querySelectorAll('button')];
        const r = nav.getBoundingClientRect();
        const H = (sel) => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().height) : 0; };
        // the pane is the one tall scroller that is not the tab bar; it should never need to scroll
        const pane = [...document.querySelectorAll('div')].find(d => String(d.className || '').includes('overflow-y-auto')
          && d.getBoundingClientRect().height > 100 && !d.closest('[data-simple-tabs]'));
        return {
          n: btns.length,
          labels: btns.map(b => b.textContent.trim()),
          active: btns.filter(b => b.getAttribute('aria-current') === 'page').map(b => b.textContent.trim()).join(),
          small: btns.filter(b => b.getBoundingClientRect().height < 44).length,
          gap: Math.round(window.innerHeight - r.bottom),
          doc: Math.round(document.documentElement.scrollHeight - document.documentElement.clientHeight),
          spill: pane ? Math.round(pane.scrollHeight - pane.clientHeight) : null,
          over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          chart: H('[data-phone-chart]'),
          fields: [...document.querySelectorAll('input')].filter(i => i.getBoundingClientRect().height > 0).length,
          rows: document.querySelectorAll('[data-figure-row]').length,
          sections: document.querySelectorAll('[data-section-tabs] [role=tab]').length,
          legend: /Made up of/.test(document.body.innerText),
          dialsFirst: (() => {
            const card = document.querySelector('[data-phone-chart]');
            if (!card) return null;
            // the widest svg, not the first: every dial button holds a 16px icon svg of its own
            const dials = card.querySelector('[data-phone-dials]');
            const svg = [...card.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
            if (!dials || !svg) return null;
            return dials.getBoundingClientRect().top < svg.getBoundingClientRect().top;
          })()
        };
      });

      // ---- the shell: one bar along the top, and the page title is gone from it
      const shell = await p.evaluate(() => {
        const head = document.querySelector('header');
        const hr = head ? head.getBoundingClientRect() : null;
        return {
          top: hr ? Math.round(hr.top) : null, h: hr ? Math.round(hr.height) : null,
          title: /Can I retire\?/.test(document.body.innerText),
          crossover: !!document.querySelector('[data-crossover]'),
          crossoverInBar: !!(head && head.querySelector('[data-crossover]')),
          themeButtons: document.querySelectorAll('[data-theme-cycle]').length,
          themeGroup: [...document.querySelectorAll('button')].filter(b => /^(Light|Dark|Sepia)$/.test(b.getAttribute('aria-label') || '')).length
        };
      });
      ok('the simple page leads with the planner bar', !!shell && shell.top === 0 && shell.h <= 48, shell ? `${shell.h}px at ${shell.top}` : 'no bar');
      ok('...carrying the way to the full planner', !!shell && shell.crossoverInBar, String(shell && shell.crossover));
      ok('...and the page title is gone', !!shell && shell.title === false, shell && shell.title ? 'still says Can I retire?' : 'gone');
      ok('the theme is one cycling button, not three', !!shell && shell.themeButtons === 1 && shell.themeGroup === 0,
         shell ? `${shell.themeButtons} cycle, ${shell.themeGroup} of three` : '');

      const onChart = await tabState();
      ok('the simple page has three tabs at the foot', !!onChart && onChart.n === 3, onChart ? onChart.labels.join(' / ') : 'no tab bar');
      ok('...on the bottom edge, every one a 44px target', !!onChart && onChart.gap === 0 && onChart.small === 0,
         onChart ? `${onChart.gap}px up, ${onChart.small} under 44` : '');
      ok('...opening on the chart when the plan can be answered', !!onChart && onChart.active === 'Chart', onChart ? onChart.active : '');
      ok('...with the dials above the plot, not below it', !!onChart && onChart.dialsFirst === true, String(onChart && onChart.dialsFirst));
      ok('the Chart tab fits its screen', !!onChart && onChart.spill === 0 && onChart.doc === 0,
         onChart ? `${onChart.spill}px past the pane, ${onChart.doc}px of document scroll` : '');
      ok('...nothing scrolling sideways', !!onChart && onChart.over <= 0, onChart ? `${onChart.over}px` : '');
      // the chart is a tab now, so it no longer needs to stick to anything
      const pos = await p.evaluate(() => { const el = document.querySelector('[data-phone-chart]'); return el ? getComputedStyle(el).position : null; });
      ok('...the card no longer has to stick', pos === 'static', String(pos));
      // a dial must still actually move the line
      const moved = await p.evaluate(async () => {
        const medianD = () => { const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
          const pth = svg && [...svg.querySelectorAll('path')].find(x => x.getAttribute('stroke-width') === '2.5'); return pth ? pth.getAttribute('d') : null; };
        const before = medianD();
        const card = document.querySelector('[data-phone-chart]');
        const plus = [...card.querySelectorAll('button')].find(b => /increase Pension/i.test(b.getAttribute('aria-label') || ''));
        if (!plus) return { ok: false };
        plus.click();
        await new Promise(r => setTimeout(r, 900));
        return { ok: true, changed: medianD() !== before };
      });
      ok('...and a dial still moves the line', moved.ok && moved.changed, JSON.stringify(moved));

      // ---- tab 1: the form, three sections, one screen each
      await simpleTab('Inputs');
      const onYou = await tabState();
      ok('the Inputs tab divides the form into three', !!onYou && onYou.sections === 3, onYou ? `${onYou.sections} sections` : '');
      ok('...showing the form and not the chart', !!onYou && onYou.fields > 4 && onYou.chart === 0,
         onYou ? `${onYou.fields} fields, chart ${onYou.chart}px` : '');
      ok('...and You fits its screen', !!onYou && onYou.spill === 0 && onYou.doc === 0,
         onYou ? `${onYou.spill}px past the pane` : '');
      const sizes = await p.evaluate(INPUT_SIZE_PROBE);
      const small = sizes.filter(x => x.font < 16);
      ok('...inputs are at least 16px, so focusing does not zoom', small.length === 0, `${small.length} of ${sizes.length} under 16px`);

      /*
       * The portfolio was five columns inside 412px: a 60px drop-down reading "Hig", a contribution box
       * with room for three digits, a per-cent field the width of its own label. On a phone it is four
       * rows instead - the balance at full size, the tier and the contributions named underneath it, and
       * the chevron opening those behind the same six chips the full planner uses. Nothing on this tab
       * steps a number any more either: that is what the chart tab's dials are for.
       */
      await formSection('Portfolio');
      const onPortfolio = await tabState();
      const portfolio = await p.evaluate(() => ({
        rows: document.querySelectorAll('[data-wrapper-row]').length,
        selects: document.querySelectorAll('select[aria-label$="risk level"]').length,
        steppers: [...document.querySelectorAll('button[aria-label^="increase"], button[aria-label^="decrease"]')].filter(b => b.getBoundingClientRect().height > 0).length,
        wide: [...document.querySelectorAll('[data-wrapper-row]')].filter(r => r.getBoundingClientRect().width > window.innerWidth).length
      }));
      ok('...the portfolio is one row per wrapper', portfolio.rows === 4 && portfolio.wide === 0, `${portfolio.rows} rows, ${portfolio.wide} too wide`);
      ok('...no drop-down and no stepper on the form', portfolio.selects === 0 && portfolio.steppers === 0,
         `${portfolio.selects} selects, ${portfolio.steppers} steppers`);
      ok('...and Portfolio fits its screen', !!onPortfolio && onPortfolio.spill === 0, onPortfolio ? `${onPortfolio.spill}px past the pane` : '');
      const opened = await p.evaluate(async () => {
        const btn = [...document.querySelectorAll('[data-wrapper-row] button[aria-expanded]')][0];
        if (!btn) return null;
        btn.click();
        await new Promise(r => setTimeout(r, 300));
        const row = btn.closest('[data-wrapper-row]');
        const summary = row.querySelector('[data-risk-summary]');
        if (summary) summary.click();
        await new Promise(r => setTimeout(r, 300));
        const out = { chips: row.querySelectorAll('[role=radio]').length, fields: row.querySelectorAll('input').length };
        btn.click();
        return out;
      });
      ok('...and the chevron opens six chips and the contributions', !!opened && opened.chips === 6 && opened.fields >= 3,
         opened ? `${opened.chips} chips, ${opened.fields} fields` : 'no row');
      await formSection('One-offs & income');
      const onExtras = await tabState();
      ok('...and One-offs & income fits its screen', !!onExtras && onExtras.spill === 0, onExtras ? `${onExtras.spill}px past the pane` : '');
      await formSection('You');

      // ---- tab 3: the figures, as rows rather than a grid of cards
      await simpleTab('Figures');
      const onFigures = await tabState();
      ok('the Figures tab lists the results as rows', !!onFigures && onFigures.rows >= 4, onFigures ? `${onFigures.rows} rows` : '');
      ok('...without the chart or its legend', !!onFigures && onFigures.chart === 0 && !onFigures.legend,
         onFigures ? `chart ${onFigures.chart}px, legend ${onFigures.legend}` : '');
      ok('...and it fits its screen too', !!onFigures && onFigures.spill === 0 && onFigures.doc === 0,
         onFigures ? `${onFigures.spill}px past the pane` : '');
      ok('...with the export still on the page, not inside the fold', await p.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => /Export the year-by-year/.test(x.textContent));
        return !!b && !b.closest('details') && b.getBoundingClientRect().height >= 44;
      }), '');
      // textContent, not innerText: it sits inside the fold, and innerText leaves closed details out
      ok('...and the beta notice with the numbers it qualifies',
         /not financial advice/.test(await p.evaluate(() => document.body.textContent)), '');
      // the choice is about this visit, so it survives a reload of the same session
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1500);
      const kept = await tabState();
      ok('...and the tab you were on survives a reload', !!kept && kept.active === 'Figures', kept ? kept.active : '');

      await p.evaluate(() => { localStorage.setItem('rp_which_app', 'full'); });


      /*
       * THE SECOND PHONE PASS: A FIRST SCREEN YOU CAN TYPE ON, ONE SECTION AT A TIME, A FORM IN ROWS.
       *
       * Measured before it, on this device: the Inputs tab was 4,379px tall and the first field sat
       * 1,015px down, under a 366px title card and a 186px scenario bar; the risk tier was a 410px native
       * select off the right edge of a sideways-scrolling table. Every number below is one of those.
       */
      const swipe = async (fromX, toX, y) => {
        const cdp = await ctx.newCDPSession(p);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: fromX, y }] });
        for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: fromX + (toX - fromX) * i / 6, y }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
        await p.waitForTimeout(450);
      };
      const sectionTab = async (name) => { await p.evaluate(t => { const x = [...document.querySelectorAll('[data-section-tabs] [role=tab]')].find(b => b.textContent.trim() === t); if (x) x.click(); }, name); await p.waitForTimeout(400); };
      const activeSection = () => p.evaluate(() => document.querySelector('[data-section-tabs] [aria-selected="true"]')?.textContent.trim());
      // The simple-page block above switched storage back to the full app without reloading, so the
      // simple page is still what is mounted here. Reload onto the full app, and run the projection
      // again on this page because the reload dropped the earlier run's state.
      await p.evaluate(() => { localStorage.setItem('rp_which_app', 'full'); sessionStorage.removeItem('rp_input_section'); });
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1200);
      await navigate(p, 'Plan Inputs', 'Inputs');
      await p.waitForTimeout(600);
      const first = await p.evaluate(() => {
        const H = (el) => el ? Math.round(el.getBoundingClientRect().height) : null;
        const fields = [...document.querySelectorAll('[data-section] input, [data-section] select')].filter(i => i.getBoundingClientRect().height > 0);
        return { titleCard: document.querySelector('[data-title-card]'), scenarioBar: H(document.querySelector('[data-scenario-bar]')), crossover: H(document.querySelector('[data-crossover]')),
          // the real-terms note is said ONCE per planner now, in the chrome, not over the amounts
          moneySaid: (document.body.innerText.match(/in today\u2019s money|in today's money/g) || []).length,
          firstFieldTop: fields.length ? Math.round(fields[0].getBoundingClientRect().top + scrollY) : null, vh: innerHeight,
          /* the section strip at the very top: the full planner has no bar above it any more, and the
             band of page that used to sit between the two was 28px of empty grey above the fold */
          phoneBar: !!document.querySelector('[data-phone-bar]'),
          stripTop: (() => { const t = document.querySelector('[data-section-tabs]'); return t ? Math.round(t.getBoundingClientRect().top) : null; })(),
          carried: /figures came with you/i.test(document.body.innerText), tabs: document.querySelectorAll('[data-section-tabs] [role=tab]').length,
          sections: document.querySelectorAll('[data-section]').length };
      });
      console.log('  inputs, second pass');
      // The card is Start Here's alone on a phone: the bottom bar already names the screen you are on.
      ok('no title card away from Start Here', first.titleCard === null, 'present');
      /*
       * The scenario row is not on the tab at all any more - it is behind More on the bottom bar, where
       * the tab's other whole-plan actions (export, import, clear) already live. A scenario is switched
       * or saved a handful of times in a session; the row sat above every field for all of it.
       */
      ok('the scenario row is off the tab', first.scenarioBar === null, first.scenarioBar === null ? 'gone' : `${first.scenarioBar}px still there`);
      const inSheet = await p.evaluate(async () => {
        const more = [...document.querySelectorAll('[data-bottomnav] button')].find(b => /More/.test(b.textContent));
        if (!more) return null;
        more.click();
        await new Promise(r => setTimeout(r, 400));
        const bar = document.querySelector('[data-scenario-bar]');
        const out = bar ? {
          select: !!bar.querySelector('select[aria-label="Active scenario"]'),
          saves: [...bar.querySelectorAll('button')].filter(b => /Save/.test(b.textContent)).length,
          small: [...bar.querySelectorAll('button, select')].filter(b => b.getBoundingClientRect().height < 44).length
        } : null;
        const close = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Close');
        if (close) close.click();
        await new Promise(r => setTimeout(r, 300));
        return out;
      });
      ok('...and in the More sheet instead', !!inSheet && inSheet.select && inSheet.saves >= 2,
         inSheet ? `select ${inSheet.select}, ${inSheet.saves} save buttons` : 'not in the sheet');
      ok('...at 44px, like everything else in there', !!inSheet && inSheet.small === 0, inSheet ? `${inSheet.small} under 44` : '');
      /*
       * THE EXPLANATIONS, ON A PHONE, ARE QUESTION MARKS. Two of them: the glossary term, which used to
       * be desktop-only because there is no hover here, and the long explanation that used to be a line
       * of blue text reading like a heading. Both are now a 24px "?" that opens something with a close.
       */
      await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Strategy'); if (b) b.click(); });
      await p.waitForTimeout(900);
      /*
       * Open the folds first, the way a reader does. Most of this tab's prose is inside a collapsed card
       * on a phone, and a term inside a closed one is laid out - it has a width, so every "is it there"
       * check passes - while sitting past the end of the document where nothing can scroll to it. Asking
       * what a finger hits is only a fair question once the text is on the page.
       */
      // PhoneCollapse is a <details>, so opening those is enough. Pressing every collapsed control on
      // the tab is not: some of them open sheets and overlays that cover the text being measured.
      await p.evaluate(() => { document.querySelectorAll('details:not([open])').forEach(d => { d.open = true; }); });
      await p.waitForTimeout(500);
      const help = await p.evaluate(() => {
        const vis = (el) => el.getBoundingClientRect().width > 0;
        const term = [...document.querySelectorAll('[data-term]')].find(vis);
        const dot = [...document.querySelectorAll('[data-help-dot]')].find(vis);
        let hitOk = null, shimmer = null, tall = null, reached = null;
        // the first term that can actually be brought onto the screen, which is the only one a finger
        // could ever reach - and the only one elementFromPoint can answer for
        let onScreen = null;
        for (const cand of document.querySelectorAll('[data-term]')) {
          if (!vis(cand)) continue;
          cand.scrollIntoView({ block: 'center' });
          const rr = cand.getBoundingClientRect();
          if (rr.top >= 0 && rr.bottom <= window.innerHeight) { onScreen = cand; cand.setAttribute('data-term-probe', '1'); break; }
        }
        reached = !!onScreen;
        if (onScreen) {
          const term2 = onScreen;
          const r = term2.getBoundingClientRect();
          const on = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          /*
           * THE ASSERTION THIS HARNESS WAS MISSING.
           *
           * The definitions were unopenable on a phone for weeks and every check here passed, because
           * each one asked whether the mark was PRESENT. It was: a 24px circle, visible, with a working
           * handler. What it did not have was the tap - the global 44px touch floor gave it a box taller
           * than the line it sat in, the box overflowed into the block below, and that block painted over
           * it. So ask the browser the question a finger asks: at the middle of this mark, what would I
           * hit? Anything but the mark itself is a control that cannot be operated.
           */
          hitOk = !!on && (on === term2 || term2.contains(on));
          tall = Math.round(r.height);
          shimmer = /gradient/.test(getComputedStyle(term2).backgroundImage);
        }
        return { terms: document.querySelectorAll('[data-term]').length, dots: document.querySelectorAll('[data-help-dot]').length,
                 termW: term ? Math.round(term.getBoundingClientRect().width) : 0, hitOk, shimmer, tall, reached,
                 clickable: !!term && !!dot, dotClosed: dot ? dot.getAttribute('aria-expanded') : null };
      });
      ok('a glossary term can be brought onto the screen at all', help.terms > 0 && help.reached === true,
        `${help.terms} terms on the tab, reachable by scrolling: ${help.reached}`);
      ok('...and it is the tap target itself, not a mark beside it', help.hitOk === true,
        `at the middle of it a finger hits ${help.hitOk ? 'the term' : 'something else'}`);
      ok('...marked as pressable by a shimmering underline', help.shimmer === true, `background gradient: ${help.shimmer}`);
      ok('...at the height of the text it sits in, not the 44px floor', help.tall !== null && help.tall <= 30, `${help.tall}px tall`);
      /*
       * A FOLD SHOWS ITS FIRST LINES, rather than a mark that promises an unknown quantity of prose.
       * The clamp leaves its own ellipsis and the control under it names what opening gives you.
       */
      ok('...and a long explanation shows its first lines, closed to start', help.dots > 0 && help.dotClosed === 'false', `${help.dots} folds, expanded=${help.dotClosed}`);
      if (help.clickable) {
        /*
         * Tap the one the probe just measured, and let the scrolling settle first. The bubble closes on
         * scroll by design - its coordinates are fixed, so a page that moves under it would leave it
         * pointing at nothing - and a scrollIntoView still settling when the tap lands closes it again
         * immediately. That is a flaky test rather than a flaky feature, so it waits.
         */
        await p.waitForTimeout(400);
        await p.evaluate(() => { const t = document.querySelector('[data-term-probe]') || [...document.querySelectorAll('[data-term]')].find(x => x.getBoundingClientRect().width > 0); t.click(); });
        await p.waitForTimeout(350);
        const bub = await p.evaluate(() => { const t = document.querySelector('[role=tooltip]'); return t ? { w: Math.round(t.getBoundingClientRect().width), chars: t.textContent.trim().length } : null; });
        ok('...tapping one opens its definition', !!bub && bub.chars > 40, bub ? `${bub.w}px, ${bub.chars} chars` : 'nothing opened');
        await p.evaluate(() => { const b = document.querySelector('[role=tooltip] button'); if (b) b.click(); });
        await p.waitForTimeout(300);
        ok('...and it closes again', await p.evaluate(() => !document.querySelector('[role=tooltip]')));
        await p.evaluate(() => [...document.querySelectorAll('[data-help-dot]')].find(x => x.getBoundingClientRect().width > 0).click());
        await p.waitForTimeout(350);
        const box = await p.evaluate(() => {
          const dot = [...document.querySelectorAll('[data-help-dot]')].find(x => x.getBoundingClientRect().width > 0);
          /* two shapes: the clamped fold unclamps in place, the head variant reveals a bordered panel */
          const fine = dot.closest('[data-fine]');
          const body = fine ? fine.firstElementChild
            : (dot.closest('[data-fine-head]') || dot.parentElement).querySelector('span.relative');
          return { open: dot.getAttribute('aria-expanded'), clamped: fine ? /line-clamp/.test(body.className || '') : null,
            h: body ? Math.round(body.getBoundingClientRect().height) : 0 };
        });
        ok('...pressing it opens the rest of the explanation', box.open === 'true' && box.h > 20 && box.clamped !== true,
          `expanded=${box.open}, ${box.h}px, still clamped: ${box.clamped}`);
      }
      /*
       * THE "?" ON THE HEADING'S LINE, NOT UNDER IT.
       *
       * The dot is a 44px touch target, so a card that opened with a heading and then a folded
       * explanation spent a whole row plus two gaps on one question mark floating in an otherwise empty
       * card. Measured on the Strategy tab with nothing to run: 156px of card for a heading, a dot and a
       * link. Sharing the heading's row costs nothing and brings it to 110px.
       */
      await navigate(p, 'Strategy', 'Strategy');
      await p.waitForTimeout(800);
      // measured closed: an open explanation is meant to be tall, and this is about the folded state
      await p.evaluate(() => { document.querySelectorAll('[data-help-dot][aria-expanded="true"]').forEach(b => b.click()); });
      await p.waitForTimeout(350);
      const strat = await p.evaluate(() => {
        const card = [...document.querySelectorAll('div')].find(d => /Strategy Tournament/.test(d.textContent) && (d.className || '').includes('bg-indigo-50'));
        if (!card) return null;
        const dot = card.querySelector('[data-help-dot]');
        const head = card.querySelector('[data-fine-head] > div > div');
        if (!dot || !head) return { h: Math.round(card.getBoundingClientRect().height), sameRow: false };
        return { h: Math.round(card.getBoundingClientRect().height),
          sameRow: Math.abs(dot.getBoundingClientRect().top - head.getBoundingClientRect().top) < 24 };
      });
      ok('the Strategy card keeps its "?" on the heading\'s line', !!strat && strat.sameRow === true,
        strat ? `${strat.h}px card, same row: ${strat.sameRow}` : 'card not found');
      ok('...so the card is a heading and a link, not a screen of nothing', !!strat && strat.h <= 130,
        strat ? `${strat.h}px` : '');
      await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Inputs'); if (b) b.click(); });
      await p.waitForTimeout(700);
      /* and not on this tab at all any more: the way across is on Start Here and in More, so a tab you
         are typing into spends nothing on it */
      ok('the way across is off the tab you are working on', first.crossover === null, `${first.crossover}px`);
      /*
       * It used to be a blue banner on the title card, a grey line over the inputs, a qualifier under
       * half the figures and a clause in three field hints. All of that said the same thing about the
       * whole model, so it is said once in the chrome instead - under the title on a desktop, and in
       * the Start Here line a phone carries in place of that card. The tab where amounts are TYPED is
       * the one that had it twice, so that is the one checked.
       */
      ok('the today\u2019s-money note is not repeated over the inputs', first.moneySaid === 0, `${first.moneySaid} time(s) on the Inputs tab`);
      ok('the first field is on the first screen', first.firstFieldTop !== null && first.firstFieldTop < first.vh, `${first.firstFieldTop} of ${first.vh}`);
      /*
       * FLUSH WITH THE TOP OF THE SCREEN. The strip is pulled up by a measured 28px - the page's 16px
       * top padding plus the 12px row gap it inherits from a hidden sibling - so if either number ever
       * changes, this is where it shows, rather than as a band of grey on somebody's phone.
       */
      ok('the full planner has no bar above the tab it is on', first.phoneBar === false, String(first.phoneBar));
      ok('...so the section strip starts at the top of the screen',
        first.stripTop !== null && Math.abs(first.stripTop) <= 1, `strip at ${first.stripTop}`);
      ok('nothing says your figures came with you', !first.carried);

      /*
       * THE WAY ACROSS, WHERE THE DECISION IS MADE.
       *
       * It used to be a 44px bar at the top of all eight tabs, naming the planner you are already in and
       * offering the other one - a thing people do once, if at all. It is a line under the sentence that
       * introduces the model on Start Here, and a row in More. Not a card either place: the card it
       * replaced said the app's name a second time.
       */
      const bar = await (async () => { await navigate(p, 'Start Here', 'Start'); await p.waitForTimeout(500);
        const r = await p.evaluate(() => {
          const c = document.querySelector('[data-title-card]');
          const x = document.querySelector('[data-crossover]');
          const lead = [...document.querySelectorAll('p')].find(q => /Monte Carlo simulation/i.test(q.textContent));
          return { card: c ? Math.round(c.getBoundingClientRect().height) : null,
            bar: !!document.querySelector('[data-phone-bar]'),
            cross: x ? x.innerText.replace(/\s+/g, ' ').trim() : null,
            crossTag: x ? x.tagName : null, crossH: x ? Math.round(x.getBoundingClientRect().height) : null,
            underLead: !!(x && lead) && x.getBoundingClientRect().top >= lead.getBoundingClientRect().bottom - 1 };
        });
        await navigate(p, 'Plan Inputs', 'Inputs'); await p.waitForTimeout(500); return r; })();
      ok('no title card on Start Here either', bar.card === null, bar.card === null ? 'gone' : `${bar.card}px`);
      ok('...and no bar above it', bar.bar === false, String(bar.bar));
      ok('...the way across is a line under the introduction', /simple planner/i.test(bar.cross || '') && bar.underLead === true,
        `${bar.crossTag} ${bar.crossH}px: ${bar.cross}`);
      const inMore = await p.evaluate(async () => {
        const m = [...document.querySelectorAll('[data-bottomnav] button')].find(b => /More/.test(b.textContent));
        if (!m) return null;
        m.click();
        await new Promise(r => setTimeout(r, 400));
        const d = document.querySelector('[role=dialog][aria-label="More sections"]');
        const out = d ? { cross: !!d.querySelector('[data-crossover]'),
          theme: [...d.querySelectorAll('button[aria-label]')].filter(b => /^(Light|Dark|Sepia)$/.test(b.getAttribute('aria-label'))).length } : null;
        const close = d && [...d.querySelectorAll('button')].find(b => b.textContent.trim() === 'Close');
        if (close) close.click();
        return out;
      });
      await p.waitForTimeout(400);
      ok('...and it is in More too, with the theme the bar used to carry',
        !!inMore && inMore.cross === true && inMore.theme === 3, JSON.stringify(inMore));
      ok('the sections are six tabs, one showing', first.tabs === 6 && first.sections === 1, `${first.tabs} tabs, ${first.sections} sections`);
      for (const t of ['You', 'Portfolio', 'Income', 'One-off deposits', 'One-off costs', 'Advanced']) {
        await sectionTab(t);
        const m = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, one: document.querySelectorAll('[data-section]').length,
          bigSelects: [...document.querySelectorAll('[data-section] select')].filter(x => x.options.length >= 6).length }));
        const over = await p.evaluate(OVERFLOW_PROBE);
        ok(`${t}: one section, under two screens and a half, nothing sideways`, m.one === 1 && m.h <= 1800 && over <= 1 && m.bigSelects === 0, `${m.h}px, ${m.bigSelects} long selects, ${over}px overflow`);
      }
      /*
       * AN INCOME STREAM CANNOT START BEFORE ITS OWNER RETIRES.
       *
       * Nothing is drawn or saved while somebody is still working, so an earlier start was money
       * entered, taxed, shown in the year-by-year table and then dropped: measured on a 40-year-old
       * retiring at 60, £20,000 a year from 45 to 59 moved the survival rate by 0.0 points and the pot
       * at 95 by £0. The field takes the retirement age as its floor and snaps back to it.
       */
      await sectionTab('Income');
      await p.evaluate(() => { const a = [...document.querySelectorAll('button')].find(b => /Add stream/i.test(b.textContent)); if (a) a.click(); });
      await p.waitForTimeout(600);
      const marked = await p.evaluate(() => {
        const rows = [...document.querySelectorAll('div')].filter(d => /^From age/.test((d.innerText || '').trim()) && d.querySelector('input[type=number]'));
        const el = rows[rows.length - 1];
        if (!el) return null;
        const i = el.querySelector('input[type=number]');
        i.setAttribute('data-probe', '1');
        return { min: i.getAttribute('min'), retire: JSON.parse(localStorage.getItem('rp_plan_full_v28')).demographics.retireAgeSelf };
      });
      ok('an income stream cannot start before the age you retire', !!marked && Number(marked.min) === Number(marked.retire),
        marked ? `min ${marked.min}, retiring at ${marked.retire}` : 'no From age field');
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
        ok('...and an earlier age typed in snaps back to it', Number(snapped.shown) === Number(marked.retire) && Number(snapped.saved) === Number(marked.retire),
          `shows ${snapped.shown}, saved ${snapped.saved}`);
        await p.evaluate(() => { const d = [...document.querySelectorAll('button')].find(b => /Remove this income stream/i.test(b.getAttribute('aria-label') || '')); if (d) d.click(); });
        await p.waitForTimeout(400);
      }
      await sectionTab('You');
      const you = await p.evaluate(() => {
        const labels = [...document.querySelectorAll('[data-you-rows] label')];
        // the CONTROL column, not the first button in the row: a label can now hold a glossary word,
        // which is a button of its own and sits exactly where the label does
        const left = labels.filter(l => { const c = l.parentElement.querySelector('[data-field-control]'); return c && l.getBoundingClientRect().left < c.getBoundingClientRect().left; }).length;
        // every control in one column, same left edge and same width: that is what dropping the
        // steppers bought, and a stray -/+ would show up here as a second left edge
        const ctrls = [...document.querySelectorAll('[data-you-rows] input, [data-you-rows] select')]
          .map(c => Math.round(c.getBoundingClientRect().right));
        return { labels: labels.length, left, hints: document.querySelectorAll('[data-you-rows] button[aria-label^="About"]').length,
                 terms: document.querySelectorAll('[data-you-rows] button[data-term]').length,
                 steppers: document.querySelectorAll('[data-you-rows] button[aria-label^="increase"]').length,
                 edges: [...new Set(ctrls)].length, ctrls: ctrls.length };
      });
      ok('You is rows: label left, control right', you.labels >= 7 && you.left === you.labels, `${you.left} of ${you.labels}`);
      /*
       * An explanation is reachable from at least three of these rows, and it does not matter which of
       * the two marks carries it: a "?" folds a paragraph out under the row, a shimmering word opens its
       * definition in a bubble. What is asserted is that the long prose is one tap away rather than
       * printed under every field.
       */
      ok('...every control ending on one line, and the explanations one tap away', you.edges === 1 && you.steppers === 0 && (you.hints + you.terms) >= 3,
         `${you.ctrls} controls on ${you.edges} right edge(s), ${you.steppers} steppers, ${you.hints} hints`);
      await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Add band/.test(x.textContent)); b.click(); });
      await p.waitForTimeout(400);
      const band = await p.evaluate(() => { const r = document.querySelector('[data-collapsed-row]'); return r ? { open: r.getAttribute('data-open'), inputs: r.querySelectorAll('input').length, w: Math.round(r.getBoundingClientRect().width) } : null; });
      ok('a new band opens as a row of three fields', band && band.open === 'true' && band.inputs === 3, JSON.stringify(band));
      await p.evaluate(() => { const b = document.querySelector('[data-collapsed-row] button[aria-label="Remove this band"]'); if (b) b.click(); });
      await p.waitForTimeout(300);
      // a swipe on the content moves to the next section; one that starts on the tab row does not
      await sectionTab('You');
      const yRow = await p.evaluate(() => { const r = document.querySelector('[data-you-rows]').getBoundingClientRect(); return Math.min(r.top + 30, innerHeight - 100); });
      await swipe(320, 80, yRow);
      ok('a swipe left moves to the next section', (await activeSection()) === 'Portfolio', await activeSection());
      await swipe(80, 320, yRow);
      ok('...and a swipe right comes back', (await activeSection()) === 'You', await activeSection());
      await sectionTab('Portfolio');
      /*
       * THE EXPLANATION IS ON THE SCREEN, NOT BEHIND A MARK.
       *
       * A "?" standing alone on a card says only that there is something to read - on the Income tab
       * before a stream is added it was a circle floating in an empty card. Two clamped lines of the
       * real sentence cost the same screen and answer the question for most readers without a press.
       */
      const preview = await p.evaluate(() => {
        const f = [...document.querySelectorAll('[data-fine]')].find(x => x.getBoundingClientRect().height > 0);
        if (!f) return null;
        const txt = f.firstElementChild;
        const btn = f.querySelector('[data-help-dot]');
        return { chars: (txt.innerText || '').trim().length, clamped: /line-clamp/.test(txt.className || ''),
          h: Math.round(f.getBoundingClientRect().height), label: (btn ? btn.textContent : '').trim() };
      });
      ok('a folded explanation shows its first lines and names the rest',
        !!preview && preview.chars > 40 && preview.clamped === true && /\u2026$/.test(preview.label),
        preview ? `${preview.chars} chars in ${preview.h}px, opens with "${preview.label}"` : 'no fold found');
      const risk = await p.evaluate(() => ({ summaries: document.querySelectorAll('[data-risk-summary]').length, cards: document.querySelectorAll('[data-wrapper-card]').length }));
      ok('each wrapper is a card showing its tier', risk.cards === 4 && risk.summaries === 4, `${risk.cards} cards, ${risk.summaries} tiers`);
      await p.evaluate(() => document.querySelector('[data-risk-summary]').click());
      await p.waitForTimeout(300);
      const chips = await p.evaluate(() => document.querySelectorAll('[data-wrapper-card] [role=radio]').length);
      ok('...which opens into six chips, not a drop-down', chips === 6, `${chips} chips`);
      await p.evaluate(() => document.querySelectorAll('[data-wrapper-card] [role=radio]')[2].click());
      await p.waitForTimeout(400);
      const picked = await p.evaluate(() => ({ saved: JSON.parse(localStorage.getItem('rp_plan_full_v28')).accounts[0].risk, closed: document.querySelectorAll('[data-wrapper-card] [role=radio]').length === 0 }));
      ok('...and a chip sets the tier and folds away', picked.saved === 'Medium Risk' && picked.closed, JSON.stringify(picked));
      // the deck: a swipe across the chart turns the step; one on the horizon slider does not
      await navigate(p, 'Projection', 'Projection');
      await p.waitForTimeout(500);
      await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent)); if (x) x.click(); });
      await p.waitForFunction(() => ![...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Stop') && !!document.querySelector('[data-deck-step="8"]'), null, { timeout: 300000 });
      await p.waitForTimeout(1200);
      // the pills carry their names now, so the step is the marked pill's own attribute, not its text
      const curStep = () => p.evaluate(() => { const on = document.querySelector('[data-deck-step][aria-selected="true"]'); return on ? Number(on.getAttribute('data-deck-step')) : null; });
      // step 2 and step 3: the swipe is measured between the last two, because the chart is on step 3
      await p.evaluate(() => { const x = document.querySelector('[data-deck-step="2"]'); if (x) x.click(); });
      await p.waitForTimeout(1500);
      /*
       * Scrolled into view first: a touch outside the viewport is cancelled by the browser, not
       * delivered. The target is the step's own HEADING rather than its chart: a chart sits inside a
       * container that can scroll sideways, and the swipe rules deliberately opt those out, so a drag
       * begun on one proves nothing about whether the deck turns.
       */
      const chartMid = () => p.evaluate(() => {
        /* the step's own head, an h2. It used to fall back to an h3, which was the run card's - and that
           card no longer sits above a deck that has already been run, so there was no h3 to find. */
        const h = document.querySelector('[data-slide-dots]') || document.querySelector('h2');
        h.scrollIntoView({ block: 'center' });
        const r = h.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      // the dots under each head are gone: the bar carries the position, and with somewhere to press
      const dots = await p.evaluate(() => document.querySelectorAll('[data-slide-dots] span').length);
      ok('no second copy of the position inside the card', dots === 0, `${dots} dots`);
      await swipe(320, 80, await chartMid());
      await p.waitForTimeout(1200);
      ok('a swipe across the step turns it', (await curStep()) === 3, `step ${await curStep()}`);
      const sl = await p.evaluate(() => { const r = document.querySelector('input[type=range]'); if (!r) return null; r.scrollIntoView({ block: 'center' }); const b = r.getBoundingClientRect(); return { x: b.left + b.width * 0.7, y: b.top + b.height / 2 }; });
      if (sl) { await swipe(sl.x, sl.x - 220, sl.y); ok('...but not one that starts on the horizon slider', (await curStep()) === 3, `step ${await curStep()}`); }
      await p.evaluate(() => window.scrollTo(0, 0));
      await swipe(80, 320, await chartMid());
      await p.waitForTimeout(1000);
      ok('...and a swipe right goes back, without leaving the site', (await curStep()) === 2 && (await p.evaluate(() => document.body.innerText.length > 100)), `step ${await curStep()}`);

      if (SHOT && theme === 'light') await p.screenshot({ path: `${SHOT}/phone-${devName.replace(/\W/g, '')}.png`, fullPage: false });
      const real = errs.filter(e => !/ERR_CERT_AUTHORITY_INVALID|ERR_FAILED|fonts\./i.test(e));
      ok('no page errors', real.length === 0, real.slice(0, 2).join(' | '));
      await ctx.close();
    }
  }
  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
