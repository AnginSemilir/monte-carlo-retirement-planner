/*
 * WHAT A DESKTOP CAN ACTUALLY REACH.
 *
 * WCAG 2.5.8 (AA) is 24px and applies whatever the pointer; 2.5.5 (AAA) is 44px and is about touch. The phone harness
 * checks 44 because it emulates a finger. This checks 24, which a mouse is also owed, in every place of the planner. The
 * inline exception is real - a control inside a sentence is exempt - so a target whose parent is a text element is skipped,
 * exactly as the phone probe does; so is the equivalent one, a small target whose function another control on the page
 * carries at 24px (its container names that control: the history strip's start years, the Start year slider). And:
 *   - a glossary term is its own hit target, marked by a shimmering underline; hovering one explains it, inside the window;
 *     a click on the word keeps it open rather than closing it; it is named to a screen reader, and gone on the way out;
 *   - the GIA gain prompt sits under the balance it is about, and pressing it opens Advanced inputs where the figure goes,
 *     while the warnings banner no longer says it;
 *   - no sideways scroll at 1366.
 *
 * Until D155 (28 Nov 2026) this harness walked the classic planner's tabs, its projection deck and dashboard, its grid of
 * ages against spends and its Simple page; those retired with them, and the checks here are the ones of features the
 * planner keeps (CLASSIC-RETIRE.md, the gate). Run: node desktop-reach-ui.cjs [port]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { OVERFLOW_PROBE } = require('./lib/probes.cjs');
const PORT = process.argv[2] || '5173';
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics: { planningMode: 'single', currentAgeSelf: 52, retireAgeSelf: 60, salarySelf: 65000, employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976, terminalAge: 95 },
  spending: { targetSpend: 40000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 350000, contrib: 10000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 200000, contrib: 5000, growth: 3, risk: 'Medium/High Risk' },
    // a balance with no gain against it: the prompt below asks for the figure
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 60000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 40000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01', cgtEnabled: true }
};
const PLACES = [['Your plan', 'plan', /Your plan/i], ['You', 'you', /With partner/i], ['What if', 'whatif', /What if/i], ['Details', 'details', /Year by year/i]];

const SMALL_24 = () => {
  const inline = new Set(['P', 'SPAN', 'LI', 'LABEL', 'TD', 'TH']);
  return [...document.querySelectorAll('button, a[href], input, select, summary, [role=button]')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; })
    .filter(el => !el.closest('[data-dev-chrome]') && !(el.parentElement && inline.has(el.parentElement.tagName)))
    // WCAG 2.5.8's equivalent: a small target whose function another control on the page carries at 24px or more (the
    // history strip's start years, the Start year slider), named on its container and present here at that size
    .filter(el => {
      const eq = el.closest('[data-target-equivalent]');
      if (!eq) return true;
      const alt = document.querySelector(eq.getAttribute('data-target-equivalent')), r = alt && alt.getBoundingClientRect();
      return !(r && r.width >= 24 && r.height >= 24);
    })
    .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 30), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }))
    .filter(x => x.h < 24 || x.w < 24);
};

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

async function open(b, w, h, seed = plan) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); }, seed);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  return { p, errs };
}
// a place by its button's whole label ('You' is the start of 'Your plan'), waiting for its own content
const place = async (p, label) => {
  const [, id, marker] = PLACES.find(x => x[0] === label);
  await p.evaluate(n => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(b => b.textContent.trim() === n); if (x) x.click(); }, label);
  await p.waitForFunction(([pl, src]) => { const m = document.querySelector(`[data-place="${pl}"]`); return !!m && new RegExp(src, 'i').test(m.innerText); }, [id, marker.source], { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(400);
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ---------- 1366x768, the commonest laptop screen ----------
  console.log('1366x768');
  const { p, errs } = await open(b, 1366, 768);
  /*
   * GLOSSARY TERMS, in Details' Assumptions (the classic planner's Config until D155). The two failures worth guarding are
   * the ones a tooltip has: clipped by a scroll container it sits in, or hanging off the edge of the window. Both are
   * measured, not eyeballed.
   */
  await place(p, 'Details');
  const terms = await p.evaluate(() => document.querySelectorAll('[data-term]').length);
  ok('Details carries glossary terms', terms > 0, `${terms} terms`);
  const mark = await p.evaluate(() => {
    const el = [...document.querySelectorAll('[data-term]')].find(x => x.getBoundingClientRect().width > 0);
    if (!el) return { hitOk: false, shimmer: false };
    el.setAttribute('data-term-probe', '1');
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const on = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { hitOk: !!on && (on === el || el.contains(on)), shimmer: /gradient/.test(getComputedStyle(el).backgroundImage) };
  });
  ok('...each one is its own hit target, marked by a shimmering underline', mark.hitOk && mark.shimmer, `hit target ${mark.hitOk}, underline gradient ${mark.shimmer}`);
  // A real pointer, not a synthetic MouseEvent: React derives onMouseEnter from a bubbling mouseover at the root, so a
  // hand-dispatched non-bubbling 'mouseenter' reaches nothing and the tooltip never opens.
  await p.hover('[data-term-probe]');
  await p.waitForTimeout(200);
  const tip = await p.evaluate(() => {
    const el = document.querySelector('[data-term-probe]');
    const bub = document.querySelector('[role=tooltip]');
    if (!bub) return { shown: false };
    const r = bub.getBoundingClientRect();
    return { shown: true, term: el.getAttribute('data-term'), text: bub.textContent.trim().length,
      inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, described: el.getAttribute('aria-describedby') === bub.id };
  });
  // A click must not undo what the hover just did: the trigger carries both a hover and a click handler
  await p.click('[data-term-probe]');
  await p.waitForTimeout(200);
  tip.heldOnClick = await p.evaluate(() => !!document.querySelector('[role=tooltip]'));
  await p.mouse.move(2, 2);
  await p.waitForTimeout(200);
  tip.gone = await p.evaluate(() => !document.querySelector('[role=tooltip]'));
  ok('...and hovering one explains it', tip.shown && tip.text > 40, tip.shown ? `${tip.term}: ${tip.text} chars` : 'nothing shown');
  ok('...inside the window, not clipped or off the edge', tip.inside === true, String(tip.inside));
  ok('...and a click on the word keeps it open rather than closing it', tip.heldOnClick === true, `open after the click: ${tip.heldOnClick}`);
  ok('...named to a screen reader, and gone on the way out', tip.described === true && tip.gone === true, `described ${tip.described}, gone ${tip.gone}`);

  for (const [label] of PLACES) {
    await place(p, label);
    const small = await p.evaluate(SMALL_24);
    ok(`${label}: no control under 24px`, small.length === 0, small.slice(0, 3).map(x => `${x.tag} "${x.text}" ${x.w}x${x.h}`).join(' | '));
    const over = await p.evaluate(OVERFLOW_PROBE);
    ok(`${label}: no sideways scroll at 1366`, over <= 1, `${over}px`);
  }
  ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();

  /*
   * THE GAIN PROMPT SITS UNDER THE BALANCE IT IS ABOUT. It used to be an amber banner above whatever you had come to read -
   * "no unrealised gain on Other Investments, so only future growth is taxed" - repeated per owner. It asks for a figure,
   * so it belongs under the field that figure goes with, and the banner should not carry it at all.
   */
  console.log('1440x900, the gain prompt');
  const gia = await open(b, 1440, 900);
  await place(gia.p, 'You');
  const seen = await gia.p.evaluate(() => {
    const hint = [...document.querySelectorAll('[data-gia-gain-hint]')].find(x => x.getBoundingClientRect().width > 0);
    const cell = hint && (hint.closest('td') || hint.closest('[data-field-row]') || hint.parentElement);
    const input = cell && cell.querySelector('input');
    return { hint: !!hint, underTheField: !!(hint && input) && hint.getBoundingClientRect().top >= input.getBoundingClientRect().bottom - 1 };
  });
  ok('the GIA gain prompt is under the balance field', seen.hint && seen.underTheField, JSON.stringify(seen));
  await gia.p.evaluate(() => { const h = [...document.querySelectorAll('[data-gia-gain-hint]')].find(x => x.getBoundingClientRect().width > 0); const btn = h && (h.tagName === 'BUTTON' ? h : h.querySelector('button')); if (btn) btn.click(); });
  await gia.p.waitForTimeout(600);
  const opened = await gia.p.evaluate(() => { const el = document.getElementById('advanced-inputs'); return el ? /unrealised gain/i.test(el.innerText) : false; });
  ok('...and pressing it opens Advanced inputs where the figure goes', opened === true, `Advanced shows the field: ${opened}`);
  await place(gia.p, 'Your plan');
  const banner = await gia.p.evaluate(() => /unrealised gain/i.test(document.body.innerText));
  ok('...and the warnings banner does not say it', banner === false, `still in a banner: ${banner}`);
  ok('no page errors with the prompt', gia.errs.length === 0, gia.errs.slice(0, 2).join(' | '));
  await gia.p.close();

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
