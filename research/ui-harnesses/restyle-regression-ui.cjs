/*
 * THE CHECK A RESTYLE ACTUALLY NEEDS.
 *
 * The other harnesses assert behaviour - a card applies, a band draws, a worker answers. None of them
 * would notice the failure a change of palette really produces, which is text the same colour as what
 * is behind it. So this one walks every place of the planner (Your plan, You, What if, Details: the classic planner's tabs
 * until D155 retired them, 28 Nov 2026), in each theme, at two widths, and asserts four things that a retint breaks and a
 * unit test cannot see:
 *
 *   1 NOTHING IS INVISIBLE   every run of text is measured against the background actually behind it -
 *                            walking up the ancestors, because a transparent element inherits whatever
 *                            it sits on - and its WCAG contrast ratio has to clear 3:1. That bar is
 *                            deliberately below AA: this is looking for text that vanished, not for
 *                            captions a point too light.
 *   2 NOTHING OVERFLOWS      no horizontal page scroll at 390px, which is where a restyle's new
 *                            paddings and radii show up as a sideways-scrolling phone.
 *   3 NOTHING ERRORS         no page error in any place in any theme.
 *   4 EVERY PLACE RENDERS    each one still puts its own content on screen, so a place that throws and
 *                            renders empty cannot pass by being silently blank: an element its own card
 *                            draws, not the place's heading, which the page draws before the card arrives
 *                            (the reviewer on D155, finding 4); and Your plan is measured on its answer,
 *                            not its progress: the solved plan's figures, strip and outlook on the card, its
 *                            first paths in (on a phone the solve is asked for). Its last paths add no part
 *                            to the card, and wait four minutes and more a page at these settings.
 *
 * And, at 390, every section of Details, which a phone shows one at a time (the classic planner's Config, Historical
 * Backtest and Documentation tabs held them until D155, each measured so); and at both widths the full documentation, opened
 * where it lives in Details (the reviewer on D155, finding 1).
 *
 * Run: node restyle-regression-ui.cjs [port] [shotDir]
 */
const { chromium } = require('/tmp/node_modules/playwright');
// the contrast maths is shared with the phone harness so the two can never drift apart
const { CONTRAST_PROBE } = require('./lib/probes.cjs');
const PORT = process.argv[2] || '5173';
const SHOT = process.argv[3] || '';
const GIA = 'Other Investments (e.g. GIA)';

const plan = {
  demographics: { planningMode: 'single', currentAgeSelf: 55, retireAgeSelf: 60, salarySelf: 70000, employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976, terminalAge: 95 },
  spending: { targetSpend: 45000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 450000, contrib: 1000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 180000, contrib: 500, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 40000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
};
// each place (its button's label, its <main data-place>), and an element only that place's own card draws, so "it loaded"
// cannot be satisfied by an empty panel or by the heading the page draws before the card arrives
const PLACES = [
  ['Your plan', 'plan', '[data-plan-answer]:not([data-plan-answer="loading"])'],
  ['You', 'you', '[data-section="you"]'],
  ['What if', 'whatif', '[data-whatif-scenarios]'],
  ['Details', 'details', '[data-audit-ledger]'],
];

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

const PHONE_MAX = 767;                 // in step with src/viewport.js

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const theme of ['light', 'dark', 'sepia']) {
    for (const width of [1400, 390]) {
      /*
       * `hasTouch` on the narrow one, because a phone is no longer a width alone: a narrow window with a
       * trackpad is a desktop with a narrow window - which is what a Chromebook at 200% display scaling
       * is, and what sent one to the phone layout. A page opened at 390 with a mouse is now correctly
       * the desktop layout, so a harness that means to test the phone has to say it is a phone.
       */
      const p = await b.newPage({ viewport: { width, height: 1000 }, hasTouch: width <= PHONE_MAX });
      const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.route('https://fonts.googleapis.com/**', r => r.abort());
      await p.route('https://fonts.gstatic.com/**', r => r.abort());
      await p.addInitScript(([pl, t]) => {
        localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
        localStorage.setItem('rp_theme_v1', t);
      }, [plan, theme]);
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1600);
      console.log(`\n${theme} @ ${width}px`);
      let worstAll = [];
      const measure = async (label) => {
        const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        ok(`${label}: no sideways scroll`, over <= 1, `${over}px`);
        const bad = await p.evaluate(CONTRAST_PROBE);
        ok(`${label}: no text below the WCAG bar`, bad.length === 0,
          bad.slice(0, 3).map(x => `"${x.text}" ${x.ratio}:1 ${x.color}`).join(' | '));
        worstAll = worstAll.concat(bad);
      };
      const toPlace = (t) => p.evaluate((n) => {
        const x = [...document.querySelectorAll('[data-tabbar] button, [data-bottomnav] button')].find(b => b.textContent.trim() === n && b.getBoundingClientRect().width > 0);
        if (x) { x.click(); return true; } return false;
      }, t);
      for (const [tab, place, sel] of PLACES) {
        const clicked = await toPlace(tab);
        if (!clicked) { ok(`${tab}: place button present`, false); continue; }
        // a place's cards load lazily: wait for an element its own card draws
        await p.waitForFunction(([pl, q]) => !!document.querySelector(`[data-place="${pl}"] ${q}`), [place, sel], { timeout: 15000 }).catch(() => {});
        if (place === 'plan') {
          // the answer, not the progress: on a phone the solve is asked for; at the light settings it is in within seconds
          await p.evaluate(() => document.querySelector('[data-plan-answer="ask"] [data-solve-request]')?.click());
          await p.waitForSelector('[data-plan-answer="filling"], [data-plan-answer="done"]', { timeout: 180000 }).catch(() => {});
        }
        await p.waitForTimeout(400);
        const own = await p.evaluate(([pl, q]) => !!document.querySelector(`[data-place="${pl}"] ${q}`), [place, sel]);
        ok(`${tab}: renders its own content`, own, own ? '' : `no ${sel}`);
        if (place === 'plan') {
          const state = await p.evaluate(() => document.querySelector('[data-plan-answer]')?.getAttribute('data-plan-answer'));
          ok(`${tab}: measured on its answer, not its progress`, state === 'filling' || state === 'done', `the card ${state}`);
        }
        await measure(tab);
        if (SHOT && width === 1400) await p.screenshot({ path: `${SHOT}/reg-${theme}-${tab.replace(/[^a-z]/gi, '')}.png` });
      }
      // Details: on a phone a section at a time, each measured; at both widths the full documentation, opened
      await toPlace('Details');
      await p.waitForTimeout(400);
      const sections = width <= PHONE_MAX ? await p.evaluate(() => [...document.querySelectorAll('[data-place="details"] [data-section-tabs] [role=tab]')].map(x => x.textContent.trim())) : [];
      if (width <= PHONE_MAX) ok(`Details: its sections, a phone's tabs`, sections.length >= 4, sections.join(', '));
      for (const t of sections.slice(1)) {
        await p.evaluate(n => { const x = [...document.querySelectorAll('[data-place="details"] [data-section-tabs] [role=tab]')].find(b => b.textContent.trim() === n); if (x) x.click(); }, t);
        await p.waitForTimeout(600);
        if (/History/.test(t)) await p.waitForSelector('[data-place="details"] [data-history-row], [data-place="details"] [data-history-grid]', { timeout: 20000 }).catch(() => {});
        await measure(`Details / ${t}`);
      }
      if (width <= PHONE_MAX) {
        const docsTab = sections.find(t => /solver decides/.test(t));
        if (docsTab) await p.evaluate(n => { const x = [...document.querySelectorAll('[data-place="details"] [data-section-tabs] [role=tab]')].find(b => b.textContent.trim() === n); if (x) x.click(); }, docsTab);
        await p.waitForTimeout(400);
      }
      await p.click('[data-place="details"] [data-docs-open]').catch(() => {});
      await p.waitForSelector('[data-place="details"] #doc-solver', { timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(600);
      const docs = await p.evaluate(() => document.querySelectorAll('[data-place="details"] [id^="doc-"]').length);
      ok('Details: the full documentation opens', docs >= 8, `${docs} cards`);
      await measure('Details / the full documentation');
      if (width <= PHONE_MAX && sections.length) await p.evaluate(n => { const x = [...document.querySelectorAll('[data-place="details"] [data-section-tabs] [role=tab]')].find(b => b.textContent.trim() === n); if (x) x.click(); }, sections[0]);
      /*
     * The phone layout must not leak on to the desktop, and must actually appear on a phone. Both halves
     * matter: a media query typo that showed the bottom bar at 1400 would otherwise only be caught by
     * somebody looking at the page.
     */
    const chrome = await p.evaluate(() => ({
      nav: !!document.querySelector('[data-bottomnav]'),
      strip: (() => { const el = document.querySelector('[data-tabbar]'); return el ? Math.round(el.getBoundingClientRect().height) : 0; })()
    }));
    if (width >= 1024) {
      ok(`${theme} @ ${width}: no bottom nav on desktop`, !chrome.nav);
      ok(`${theme} @ ${width}: the top tab strip is showing`, chrome.strip > 0, `${chrome.strip}px`);
    } else {
      ok(`${theme} @ ${width}: bottom nav present`, chrome.nav);
      ok(`${theme} @ ${width}: the top tab strip is hidden`, chrome.strip === 0, `${chrome.strip}px`);
    }
    ok(`${theme} @ ${width}: no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.close();
    }
  }

  // the control itself: does switching actually repaint, and does it survive a reload
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.route('https://fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); }, plan);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1400);
  console.log('\ntheme control');
  const groundOf = () => p.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  const pick = (title) => p.evaluate((t) => { const x = [...document.querySelectorAll('button')].find(b => b.getAttribute('title') === t); if (x) x.click(); return !!x; }, title);
  await pick('Light'); await p.waitForTimeout(350); const light = await groundOf();
  await pick('Dark'); await p.waitForTimeout(350); const dark = await groundOf();
  ok('light and dark paint different grounds', light !== dark, `${light} vs ${dark}`);
  ok('dark stamps the document', await p.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark'));
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
  ok('the choice survives a reload', (await groundOf()) === dark, await groundOf());
  await pick('Sepia'); await p.waitForTimeout(350); const sepia = await groundOf();
  ok('sepia is its own ground, not a repaint of either', sepia !== light && sepia !== dark, `${sepia}`);
  ok('...and stamps the document as sepia', await p.evaluate(() => document.documentElement.getAttribute('data-theme') === 'sepia'));
  // Sepia is a paper theme, so it must never carry the class that drives the dark-only rules.
  ok('...without claiming to be dark', await p.evaluate(() => !document.documentElement.classList.contains('dark')));
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
  ok('...and survives a reload without a flash of light', (await groundOf()) === sepia, await groundOf());
  /*
   * Following the device is no longer a button - sepia took its place - but it is still the state of
   * anyone who has never chosen, which is almost everyone. Clearing the stored preference is how a first
   * visit is reproduced, and the page must still resolve to a real palette and follow the machine.
   */
  await p.evaluate(() => localStorage.removeItem('rp_theme_v1'));
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
  ok('a first visit still follows the device', ['light', 'dark'].includes(await p.evaluate(() => document.documentElement.getAttribute('data-theme'))));
  ok('...and stores that it is following, not what it resolved to', await p.evaluate(() => localStorage.getItem('rp_theme_v1') === 'system'));
  await p.close();

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
