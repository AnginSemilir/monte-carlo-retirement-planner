/*
 * THE PLANNER ON EMULATED PHONES.
 *
 * The regression harness already walks 390px, but a narrow window is not a phone: it has a mouse pointer, a device pixel
 * ratio of 1, and no touch. This one runs real device descriptors - an iPhone 13 and a Pixel 7 - so `(pointer: coarse)`
 * matches, touch targets are measured at the scale a finger actually meets, and the layout is exercised the way it ships.
 *
 * What it asserts, on each phone in both themes:
 *   - every place (Your plan, You, What if, Details) is reached from the bottom bar and puts its own content on screen, with
 *     no sideways scroll, nothing below 3:1 contrast, and no interactive control under 44px without an explicit hit area;
 *   - the bottom bar is present, fixed, tall enough to hit and not on top of the page's last content; the top strip hidden;
 *   - the theme is one cycling button, not three;
 * and once, on the Pixel 7: You's inputs are at least 16px (so focusing one does not zoom), its sections show one at a time
 * and a swipe moves between them, and a glossary term is its own tap target, opening its definition and closing again.
 *
 * Until D155 (28 Nov 2026) this harness walked the classic planner's eight tabs and its Simple page; those retired with them,
 * and the checks here are the ones of features the planner keeps (CLASSIC-RETIRE.md, the gate). The planner's own phone checks
 * (its bottom bar's four places, the seven slides, the levers sheet, the solve on request) are solver-planner-ui.cjs check 12.
 *
 * No stylesheet is injected here: the built site links its own compiled CSS.
 *
 * Run: node phone-ui.cjs [port] [shotDir]
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const { CONTRAST_PROBE, OVERFLOW_PROBE, TOUCH_PROBE, NAV_PROBE, INPUT_SIZE_PROBE } = require('./lib/probes.cjs');
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
// each place: its bottom bar label, its <main data-place>, and a phrase only it renders
const PLACES = [
  ['Your plan', 'plan', /Your plan/i],
  ['You', 'you', /With partner/i],
  ['What if', 'whatif', /What if/i],
  ['Details', 'details', /Year by year/i],
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
const waitPlace = (page, place, marker) => page.waitForFunction(([pl, src]) => {
  const m = document.querySelector(`[data-place="${pl}"]`); return !!m && new RegExp(src, 'i').test(m.innerText);
}, [place, marker.source], { timeout: 8000 }).catch(() => {});

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

      for (const [label, place, marker] of PLACES) {
        const via = await fromBar(p, label);
        ok(`${label}: reachable from the bottom bar`, via, via ? '' : 'no button');
        if (!via) continue;
        await waitPlace(p, place, marker);
        await p.waitForTimeout(400);
        const text = await p.evaluate(pl => { const m = document.querySelector(`[data-place="${pl}"]`); return m ? m.innerText : ''; }, place);
        ok(`${label}: renders its own content`, marker.test(text), marker.test(text) ? '' : (text.slice(0, 50).replace(/\n/g, ' ') || 'no place'));
        const over = await p.evaluate(OVERFLOW_PROBE);
        ok(`${label}: no sideways scroll`, over <= 1, `${over}px`);
        const bad = await p.evaluate(CONTRAST_PROBE);
        ok(`${label}: no text below the WCAG bar`, bad.length === 0, bad.slice(0, 2).map(x => `"${x.text}" ${x.ratio}:1`).join(' | '));
        const small = await p.evaluate(TOUCH_PROBE, 44);
        ok(`${label}: no control under 44px`, small.length === 0, small.slice(0, 3).map(x => `${x.tag} "${x.text}" ${x.w}x${x.h}`).join(' | '));
        if (SHOT && theme === 'light') await p.screenshot({ path: `${SHOT}/phone-${devName.replace(/\s/g, '')}-${place}.png` });
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

      if (devName === 'Pixel 7' && theme === 'light') {
        // ---- You on a phone: its inputs, its sections, the swipe between them ----
        await fromBar(p, 'You');
        await waitPlace(p, 'you', /With partner/i);
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

        // ---- a glossary term: its own tap target, opening its definition and closing again ----
        let help = null;
        for (const [label, place, marker] of [['You', 'you', /With partner/i], ['Details', 'details', /Year by year/i]]) {
          await fromBar(p, label);
          await waitPlace(p, place, marker);
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
