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
const { CONTRAST_PROBE, OVERFLOW_PROBE, TOUCH_PROBE, NAV_PROBE, CHART_WIDTH_PROBE } = require('./lib/probes.cjs');
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

// label, the regex that proves the tab rendered its own content, and the short label the bottom bar uses
const TABS = [
  ['Start Here', /What each tab is for/i, 'Start'],
  ['Plan Inputs', /Demographics, salaries/i, 'Inputs'],
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
      await p.addInitScript(([pl, t]) => {
        localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
        localStorage.setItem('rp_which_app', 'full');
        localStorage.setItem('rp_theme_v1', t);
      }, [plan, theme]);
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

      const nav = await p.evaluate(NAV_PROBE);
      ok('the bottom nav is there', nav.present);
      if (nav.present) {
        ok('...fixed to the bottom', nav.fixed && nav.atBottom, `fixed ${nav.fixed}, atBottom ${nav.atBottom}`);
        ok('...tall enough to hit', nav.height >= 52, `${nav.height}px`);
        ok('...and not covering the content', nav.clear !== false, `content ends ${nav.lastBottom}, nav starts ${nav.navTop}`);
      }
      const strip = await p.evaluate(() => { const el = document.querySelector('[data-tabbar]'); return el ? Math.round(el.getBoundingClientRect().height) : 0; });
      ok('the top tab strip is hidden', strip === 0, `${strip}px`);

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
