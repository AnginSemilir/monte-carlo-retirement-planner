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
 *                            not its progress: the solved plan's figures and outlook on the card, its first
 *                            paths in (on a phone the solve is asked for), and the typical run's cards that
 *                            come just after them (the next ten years, the "In shares" strip, the run pot by
 *                            pot), waited for by their own marks: the card can read 'filling' before it carries
 *                            them, since they come with the next question to the solve (on b612be65's build,
 *                            with other pages solving beside it, the strip and its 70% label, under the bar,
 *                            were not yet on the page when the card first read 'filling'). Its last paths change the same
 *                            cards' figures and draw nothing new, and wait four minutes and more a page at
 *                            these settings; this year's actions and the rule of thumb come after them and
 *                            are not measured here (their words and figures are solver-strategy's checks).
 *                            At 390, where a phone shows Your plan as a deck of slides, one mounted at a
 *                            time, every slide is measured, each with its own content drawn where it has
 *                            figures: the reviewer's second look at D155, finding 4.
 *
 * And, at 390, every section of Details, which a phone shows one at a time (the classic planner's Config, Historical
 * Backtest and Documentation tabs held them until D155, each measured so); and at both widths the full documentation, opened
 * where it lives in Details (the reviewer on D155, finding 1).
 *
 * First, the contrast probe itself on a page of planted layers (the reviewer's second look at D155, finding 5): a layer
 * painted beneath a label is composited under it (the strip's shape, and a label above its layer by z-index), and a veil
 * painted over the text (after it in paint order, or above it by z-index) or a hidden layer is not, so pale text under them
 * still fails. Planted (RESTYLE_PLANT=layerall: the probe composites every earlier positioned sibling over the text, the D155
 * fix round's rule), that check fails.
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
const RPLANT = process.env.RESTYLE_PLANT || '';
// the planted layers: each card a label over or under a layer, the case named on the label (lib/probes.cjs CONTRAST_PROBE)
const LAYERS = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; font: 14px sans-serif; background: #fff; }
  .card { position: relative; width: 300px; height: 40px; margin: 8px; background: #fff; overflow: hidden; }
  .layer { position: absolute; inset: 0; }
  .t { padding: 10px; display: inline-block; }
</style></head><body>
<div class="card"><div class="layer" style="background: rgb(49,46,129); opacity: 0.9"></div><span class="t" style="position: relative; color: rgb(255,255,255)">beneath one</span></div>
<div class="card"><div class="layer" style="background: rgb(49,46,129); z-index: 1"></div><span class="t" style="position: relative; z-index: 2; color: rgb(255,255,255)">beneath two</span></div>
<div class="card"><div class="layer" style="background: rgba(0,0,0,0.7)"></div><span class="t" style="color: rgb(220,220,220)">veiled static</span></div>
<div class="card"><div class="layer" style="background: rgba(0,0,0,0.7); z-index: 10"></div><span class="t" style="position: relative; color: rgb(220,220,220)">veiled above</span></div>
<div class="card"><div class="layer" style="background: rgb(0,0,0); visibility: hidden"></div><span class="t" style="position: relative; color: rgb(220,220,220)">hidden layer</span></div>
<div class="card"><span class="t" style="color: rgb(220,220,220)">no layer</span></div>
</body></html>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  {
    // the probe on planted layers: beneath one and two composited (white on the indigo shade passes), the rest not (pale text
    // on the white card, as a reader sees it: the veils cover it, the hidden layer is not painted, the last has no layer)
    const p = await b.newPage({ viewport: { width: 400, height: 600 } });
    await p.setContent(LAYERS);
    const flagged = await p.evaluate(CONTRAST_PROBE, { layerAll: RPLANT === 'layerall' });
    const hit = t => flagged.some(x => x.text === t);
    const want = { 'beneath one': false, 'beneath two': false, 'veiled static': true, 'veiled above': true, 'hidden layer': true, 'no layer': true };
    const wrong = Object.entries(want).filter(([t, w]) => hit(t) !== w).map(([t, w]) => `${t} ${w ? 'passed' : 'flagged'}`);
    console.log('\nthe contrast probe on planted layers');
    ok('a layer painted beneath the text is composited under it, and a veil over it or a hidden layer is not', wrong.length === 0,
      `${wrong.length ? `wrong: ${wrong.join(', ')}; ` : ''}flagged ${flagged.map(x => `"${x.text}" ${x.ratio}:1`).join(', ') || 'none'}${RPLANT ? ` (planted: ${RPLANT})` : ''}`);
    await p.close();
  }
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
          // the answer, not the progress: on a phone the solve is asked for; at the light settings it is in within seconds on a
          // quiet machine, and the wait is a ceiling: with other pages solving beside it (the D155 second fix round's own runs,
          // three at once on four cores) the sepia desktop's took over three minutes, so it waits up to ten
          await p.evaluate(() => document.querySelector('[data-plan-answer="ask"] [data-solve-request]')?.click());
          await p.waitForSelector('[data-plan-answer="filling"], [data-plan-answer="done"]', { timeout: 600000 }).catch(() => {});
        }
        const RUN = ['[data-strategy-ahead]', '[data-invest-strip]', '[data-more="life"]'];
        if (place === 'plan' && width > PHONE_MAX) {
          // the typical run's cards, asked for once the first paths are in: wait for each by its own mark
          for (const q of RUN) await p.waitForSelector(`[data-place="plan"] ${q}`, { timeout: 600000 }).catch(() => {});
        }
        await p.waitForTimeout(400);
        const own = await p.evaluate(([pl, q]) => !!document.querySelector(`[data-place="${pl}"] ${q}`), [place, sel]);
        ok(`${tab}: renders its own content`, own, own ? '' : `no ${sel}`);
        if (place === 'plan') {
          const state = await p.evaluate(() => document.querySelector('[data-plan-answer]')?.getAttribute('data-plan-answer'));
          ok(`${tab}: measured on its answer, not its progress`, state === 'filling' || state === 'done', `the card ${state}`);
          if (width > PHONE_MAX) {
            const run = await p.evaluate(qs => qs.filter(q => !document.querySelector(`[data-place="plan"] ${q}`)), RUN);
            ok(`${tab}: the typical run's cards drawn (the next ten years, the "In shares" strip, the run pot by pot)`, run.length === 0, run.length ? `missing ${run.join(', ')}` : '');
          }
        }
        await measure(tab);
        if (place === 'plan' && width <= PHONE_MAX) {
          // a phone's deck mounts one slide at a time (src/PlannerPlan.jsx Deck): every slide, each with its own content (slide 2
          // the spending's chart, 3 the money's, 4 the "In shares" strip, 5 the next ten years, 6 the run pot by pot, 7 the
          // comparison with your current approach), measured as the first was
          const steps = await p.evaluate(() => [...document.querySelectorAll('[data-place="plan"] [data-deck-step]')].map(x => x.getAttribute('data-deck-step')));
          ok(`${tab}: a phone's deck of slides`, steps.length >= 7, `${steps.length} slides`);
          const OWN = { 2: '[data-outlook="spend"]', 3: '[data-outlook="wealth"]', 4: '[data-invest-strip]', 5: '[data-strategy-ahead]', 6: '[data-more="life"]', 7: '[data-strategy-compare]' };
          for (const n of steps.slice(1)) {
            await p.evaluate(k => document.querySelector(`[data-place="plan"] [data-deck-step="${k}"]`)?.click(), n);
            await p.waitForSelector(`[data-place="plan"] [data-deck-slide="${n}"]`, { timeout: 10000 }).catch(() => {});
            if (OWN[n]) await p.waitForSelector(`[data-place="plan"] [data-deck-slide="${n}"] ${OWN[n]}`, { timeout: 60000 }).catch(() => {});
            await p.waitForTimeout(400);
            const shown = await p.evaluate(([k, q]) => ({ slide: !!document.querySelector(`[data-place="plan"] [data-deck-slide="${k}"]`), own: !q || !!document.querySelector(`[data-place="plan"] [data-deck-slide="${k}"] ${q}`) }), [n, OWN[n] || '']);
            ok(`${tab} / slide ${n}: shown, with its own content`, shown.slide && shown.own, `slide ${shown.slide}${OWN[n] ? `, ${OWN[n]} ${shown.own}` : ''}`);
            await measure(`${tab} / slide ${n}`);
          }
          if (steps.length) await p.evaluate(() => document.querySelector('[data-place="plan"] [data-deck-step="1"]')?.click());
        }
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
