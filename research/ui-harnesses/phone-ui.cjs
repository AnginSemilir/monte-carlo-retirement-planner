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
        ok(`${label}: no text below 3:1`, bad.length === 0, bad.slice(0, 2).map(x => `"${x.text}" ${x.ratio}:1`).join(' | '));
        const small = await p.evaluate(TOUCH_PROBE, 44);
        ok(`${label}: no control under 44px`, small.length === 0, small.slice(0, 3).map(x => `${x.tag} "${x.text}" ${x.w}x${x.h}`).join(' | '));
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
        await p.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === '6'), null, { timeout: 240000 });
        await p.waitForTimeout(1200);
        const vw = desc.viewport.width;
        for (const step of ['4', '5', '7']) {
          await p.evaluate((n) => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === n); if (b) b.click(); }, step);
          await p.waitForTimeout(900);
          const w = await p.evaluate(CHART_WIDTH_PROBE);
          ok(`step ${step}: the chart uses the screen`, w >= vw * 0.92, `${w}px of ${vw}px`);
          const over = await p.evaluate(OVERFLOW_PROBE);
          ok(`step ${step}: no sideways scroll`, over <= 1, `${over}px`);
        }
        // fullscreen, on the Monte Carlo step
        await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '5'); if (b) b.click(); });
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
        await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '7'); if (b) b.click(); });
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
       * THE SIMPLE PAGE. Its fault on a phone was the same as the sandbox's: the form stacked above the
       * chart, so you edited blind. The chart is ordered first and sticks, with the dials that move it
       * directly underneath.
       */
      await p.evaluate(() => { localStorage.setItem('rp_which_app', 'simple'); });
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1800);
      const simple = await p.evaluate(() => {
        const card = document.querySelector('[data-phone-chart]');
        if (!card) return null;
        const col = card.parentElement;
        return { first: col.firstElementChild === card, sticky: getComputedStyle(card).position };
      });
      ok('the simple page leads with the chart', !!simple && simple.first, simple ? `first=${simple.first}` : 'no phone chart card');
      ok('...and it sticks to the top', !!simple && simple.sticky === 'sticky', simple ? simple.sticky : '');
      if (simple) {
        const stuck = await p.evaluate(async () => {
          window.scrollTo(0, 600);
          await new Promise(r => setTimeout(r, 300));
          const card = document.querySelector('[data-phone-chart]');
          const inputs = [...document.querySelectorAll('input')].filter(i => i.getBoundingClientRect().height > 0);
          const visible = inputs.filter(i => { const r = i.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
          return { top: Math.round(card.getBoundingClientRect().top), inputs: visible.length };
        });
        ok('...staying put while the form scrolls under it', stuck.top <= 1, `card top ${stuck.top}`);
        ok('...with the form still reachable beneath', stuck.inputs > 0, `${stuck.inputs} inputs in view`);
        // a dial must actually move the line
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
        ok('...and a dial moves the line', moved.ok && moved.changed, JSON.stringify(moved));
        /*
         * The portfolio row is five columns inside 412px. A stepper is 48px of that beside a field with
         * about 60px left for six digits, so on a phone they go and the field gets the room; the sticky
         * card's dials above the chart are the better place to nudge a balance anyway. And the card is
         * p-3, so its chart bleeds by 1.75rem - .bleed's 2.25 was half a rem too far each side, which was
         * this page's 7px of horizontal scroll.
         */
        const portfolio = await p.evaluate(() => {
          const risk = document.querySelector('select[aria-label$="risk level"]');
          const grid = risk ? risk.parentElement : null;
          return { steppers: grid ? grid.querySelectorAll('button[aria-label^="increase"], button[aria-label^="decrease"]').length : -1,
            over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        ok('...no steppers crowding the portfolio row', portfolio.steppers === 0, `${portfolio.steppers}`);
        ok('...and the page does not scroll sideways', portfolio.over <= 0, `${portfolio.over}px`);
        const sizes = await p.evaluate(INPUT_SIZE_PROBE);
        const small = sizes.filter(x => x.font < 16);
        ok('...inputs are at least 16px, so focusing does not zoom', small.length === 0, `${small.length} of ${sizes.length} under 16px`);
      }
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
          bannerSentences: ((document.querySelector('[data-money-banner]') || {}).innerText || '').split('.').filter(x => x.trim()).length,
          firstFieldTop: fields.length ? Math.round(fields[0].getBoundingClientRect().top + scrollY) : null, vh: innerHeight,
          carried: /figures came with you/i.test(document.body.innerText), tabs: document.querySelectorAll('[data-section-tabs] [role=tab]').length,
          sections: document.querySelectorAll('[data-section]').length };
      });
      console.log('  inputs, second pass');
      // The card is Start Here's alone on a phone: the bottom bar already names the screen you are on.
      ok('no title card away from Start Here', first.titleCard === null, 'present');
      ok('the scenario bar is one row', first.scenarioBar !== null && first.scenarioBar <= 56, `${first.scenarioBar}px`);
      ok('the crossover button is one line', first.crossover !== null && first.crossover <= 48, `${first.crossover}px`);
      ok('the money banner is one sentence', first.bannerSentences === 1, `${first.bannerSentences}`);
      ok('the first field is on the first screen', first.firstFieldTop !== null && first.firstFieldTop < first.vh, `${first.firstFieldTop} of ${first.vh}`);
      ok('nothing says your figures came with you', !first.carried);
      ok('...but the today\u2019s-money line stays where amounts are typed', first.bannerSentences === 1, `${first.bannerSentences} sentence(s)`);
      const home = await (async () => { await navigate(p, 'Start Here', 'Start'); await p.waitForTimeout(500);
        const r = await p.evaluate(() => { const c = document.querySelector('[data-title-card]'); return c ? Math.round(c.getBoundingClientRect().height) : null; });
        await navigate(p, 'Plan Inputs', 'Inputs'); await p.waitForTimeout(500); return r; })();
      ok('Start Here still carries it, in one row', home !== null && home <= 96, `${home}px`);
      ok('the sections are six tabs, one showing', first.tabs === 6 && first.sections === 1, `${first.tabs} tabs, ${first.sections} sections`);
      for (const t of ['You', 'Portfolio', 'Income', 'One-off deposits', 'One-off costs', 'Advanced']) {
        await sectionTab(t);
        const m = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, one: document.querySelectorAll('[data-section]').length,
          bigSelects: [...document.querySelectorAll('[data-section] select')].filter(x => x.options.length >= 6).length }));
        const over = await p.evaluate(OVERFLOW_PROBE);
        ok(`${t}: one section, under two screens and a half, nothing sideways`, m.one === 1 && m.h <= 1800 && over <= 1 && m.bigSelects === 0, `${m.h}px, ${m.bigSelects} long selects, ${over}px overflow`);
      }
      await sectionTab('You');
      const you = await p.evaluate(() => {
        const labels = [...document.querySelectorAll('[data-you-rows] label')];
        const left = labels.filter(l => { const c = l.parentElement.querySelector('input, button'); return c && l.getBoundingClientRect().left < c.getBoundingClientRect().left; }).length;
        return { labels: labels.length, left, steppers: document.querySelectorAll('[data-you-rows] button[aria-label^="increase"]').length, hints: document.querySelectorAll('[data-you-rows] button[aria-label^="About"]').length };
      });
      ok('You is rows: label left, control right', you.labels >= 7 && you.left === you.labels, `${you.left} of ${you.labels}`);
      ok('...with steppers on the ages and a ? on the explanations', you.steppers >= 3 && you.hints >= 3, `${you.steppers} steppers, ${you.hints} hints`);
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
      await p.waitForFunction(() => ![...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Stop') && [...document.querySelectorAll('button')].some(b => b.textContent.trim() === '6'), null, { timeout: 300000 });
      await p.waitForTimeout(1200);
      const curStep = () => p.evaluate(() => { const on = [...document.querySelectorAll('button')].find(b => /^[1-7]$/.test(b.textContent.trim()) && /bg-accent/.test(b.className)); return on ? Number(on.textContent) : null; });
      await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '4'); if (x) x.click(); });
      await p.waitForTimeout(1500);
      // scrolled into view first: a touch outside the viewport is cancelled by the browser, not delivered
      const chartMid = () => p.evaluate(() => { const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]; svg.scrollIntoView({ block: 'center' }); const r = svg.getBoundingClientRect(); return r.top + r.height / 2; });
      const dots = await p.evaluate(() => document.querySelectorAll('[data-slide-dots] span').length);
      ok('the step head shows where you are', dots === 7, `${dots} dots`);
      await swipe(320, 80, await chartMid());
      await p.waitForTimeout(1000);
      ok('a swipe across the chart turns the step', (await curStep()) === 5, `step ${await curStep()}`);
      const sl = await p.evaluate(() => { const r = document.querySelector('input[type=range]'); if (!r) return null; r.scrollIntoView({ block: 'center' }); const b = r.getBoundingClientRect(); return { x: b.left + b.width * 0.7, y: b.top + b.height / 2 }; });
      if (sl) { await swipe(sl.x, sl.x - 220, sl.y); ok('...but not one that starts on the horizon slider', (await curStep()) === 5, `step ${await curStep()}`); }
      await p.evaluate(() => window.scrollTo(0, 0));
      await swipe(80, 320, await chartMid());
      await p.waitForTimeout(1000);
      ok('...and a swipe right goes back, without leaving the site', (await curStep()) === 4 && (await p.evaluate(() => document.body.innerText.length > 100)), `step ${await curStep()}`);

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
