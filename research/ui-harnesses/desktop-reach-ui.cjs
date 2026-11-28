/*
 * WHAT A DESKTOP CAN ACTUALLY REACH.
 *
 * WCAG 2.5.8 (AA) is 24px and applies whatever the pointer; 2.5.5 (AAA) is 44px and is about touch. The phone harness
 * checks 44 because it emulates a finger. This checks 24, which a mouse is also owed, in every place of the planner. The
 * inline exception is real - a control inside a sentence is exempt - so a target whose parent is a text element is skipped,
 * exactly as the phone probe does; so is the equivalent one, a small target whose function another control on the page
 * carries at 24px, which the target itself names (data-target-equivalent: the history strip's start years name the Start
 * year box and slider), held only while such a control is on the page at 24px (lib/probes.cjs says why; planted,
 * REACH_PLANT=noequivalent hides the Start year controls and Details' check fails on the strip). And:
 *   - a narrow window with a pointer (683 and 700, a Chromebook at 200%) keeps the desktop layout;
 *   - a glossary term is its own hit target, marked by a shimmering underline; hovering one explains it, inside the window;
 *     a click on the word keeps it open rather than closing it; it is named to a screen reader, and gone on the way out;
 *   - the full documentation says what is in it, one entry a card, and an entry jumps to its card;
 *   - the GIA gain prompt sits under the balance it is about, and pressing it opens Advanced inputs where the figure goes,
 *     while the warnings banner no longer says it;
 *   - spending guardrails, through the real switch in You's Your current approach: no Guardrail column in Details' ledger of
 *     your current approach while off; on, a column naming the years the rule acted, and not every year; its
 *     Documentation link lands on its card;
 *   - the one-off cost lookahead: the field at five by default with its label; the ledger's Set aside column with figures
 *     only in the five years before a cost, each naming it; set to 0 through the field, the column goes; its
 *     Documentation link lands on its card;
 *   - no sideways scroll at 1366.
 *
 * Until D155 (28 Nov 2026) this harness walked the classic planner's tabs, its projection deck and dashboard, its grid of
 * ages against spends and its Simple page; those retired with them, and the checks here are the ones of features the
 * planner keeps (CLASSIC-RETIRE.md, the gate; the narrow window, the documentation's contents and the ledger's columns
 * ported on the reviewer's finding 1, reviews/2026-11-28-classic-retire.md). Run: node desktop-reach-ui.cjs [port]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { OVERFLOW_PROBE } = require('./lib/probes.cjs');
const PORT = process.argv[2] || '5173';
const PLANT = process.env.REACH_PLANT || '';
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
// the ledger's two rules (the guardrails, the lookahead) on the classic planner's own household for them until D155: 45,
// retiring at 62, so a cost in 2047 falls four years into retirement and past the access age, beyond what the liquid
// wrappers hold, and the lookahead has something to set aside (on the household above, retired since 2034 with £200,000 in
// its ISA, the liquid wrappers meet the cost and the rule draws nothing)
const LEDGER_PLAN = {
  demographics: { planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 62, salarySelf: 70000, employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976, terminalAge: 95 },
  spending: { targetSpend: 40000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 320000, contrib: 12000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 90000, contrib: 6000, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 40000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 25000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
};
const PLACES = [['Your plan', 'plan', /Your plan/i], ['You', 'you', /With partner/i], ['What if', 'whatif', /What if/i], ['Details', 'details', /Year by year/i]];

const SMALL_24 = () => {
  const inline = new Set(['P', 'SPAN', 'LI', 'LABEL', 'TD', 'TH']);
  return [...document.querySelectorAll('button, a[href], input, select, summary, [role=button]')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; })
    .filter(el => !el.closest('[data-dev-chrome]') && !(el.parentElement && inline.has(el.parentElement.tagName)))
    // WCAG 2.5.8's equivalent: a small target whose function another control on the page carries at 24px or more, which the
    // target itself names (the history strip's start years, the Start year box and slider), one of them here at that size
    .filter(el => {
      const sel = el.getAttribute('data-target-equivalent');
      if (!sel) return true;
      return ![...document.querySelectorAll(sel)].some(alt => {
        if (alt === el) return false;
        const cs = getComputedStyle(alt);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const r = alt.getBoundingClientRect();
        return r.width >= 24 && r.height >= 24;
      });
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

  /*
   * ---------- WHAT COUNTS AS A PHONE ----------
   *
   * Width alone was the rule, and it sent a Chromebook to the phone layout: display scaling is common on those machines and a
   * 1366px panel at 200% reports 683 CSS pixels. The rule asks a second question - is the thing pointing at this a finger
   * (src/viewport.js) - so a narrow window with a trackpad keeps the desktop layout. Asserted from the outside, by which
   * navigation is on the page: the bottom bar belongs to one layout and the tab strip to the other, and both at once (or
   * neither) is the failure this guards.
   */
  console.log('a narrow window is not a phone');
  for (const w of [683, 700]) {
    const nar = await open(b, w, 800);
    const shape = await nar.p.evaluate(() => ({
      bottomNav: !!document.querySelector('[data-bottomnav]'),
      phoneBar: !!document.querySelector('[data-phone-bar]'),
      tabStrip: (() => { const t = document.querySelector('[data-tabbar]'); return !!t && t.getBoundingClientRect().height > 0; })()
    }));
    ok(`${w}px with a pointer keeps the desktop layout`, shape.tabStrip && !shape.bottomNav && !shape.phoneBar, JSON.stringify(shape));
    await nar.p.context().close();
  }

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
    // planted: the Start year controls off the page, so the history strip's columns have no equivalent here and are held to 24px
    if (PLANT === 'noequivalent') await p.evaluate(() => document.querySelectorAll('input[aria-label="Start year"]').forEach(x => { x.style.display = 'none'; }));
    const small = await p.evaluate(SMALL_24);
    ok(`${label}: no control under 24px`, small.length === 0, small.slice(0, 3).map(x => `${x.tag} "${x.text}" ${x.w}x${x.h}`).join(' | '));
    const over = await p.evaluate(OVERFLOW_PROBE);
    ok(`${label}: no sideways scroll at 1366`, over <= 1, `${over}px`);
  }
  /*
   * THE FULL DOCUMENTATION SAYS WHAT IS IN IT, read off its cards rather than a hand-kept list, so a card that stops leading
   * with a heading shows here; and an entry jumps to its card.
   */
  await place(p, 'Details');
  await p.click('[data-place="details"] [data-docs-open]').catch(() => {});
  await p.waitForSelector('[data-doc-contents]', { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(600);
  const docs = await p.evaluate(() => ({
    contents: !!document.querySelector('[data-doc-contents]'),
    entries: document.querySelectorAll('[data-doc-contents] li').length,
    cards: document.querySelectorAll('[id^="doc-"]').length
  }));
  ok('the full documentation says what is in it', docs.contents && docs.entries >= 8, `${docs.entries} entries`);
  ok('...one entry per card, none missing', docs.entries === docs.cards, `${docs.entries} entries for ${docs.cards} cards`);
  const jumped = await p.evaluate(async () => {
    const li = document.querySelectorAll('[data-doc-contents] li')[4];
    if (!li) return null;
    const label = li.querySelector('button').textContent.trim();
    li.querySelector('button').click();
    await new Promise(r => setTimeout(r, 1500));
    const card = [...document.querySelectorAll('[id^="doc-"]')].find(el => (el.querySelector('h2') || {}).textContent?.trim() === label);
    return card ? Math.round(card.getBoundingClientRect().top) : null;
  });
  ok('...and an entry jumps to its card', jumped !== null && Math.abs(jumped) < 120, `card top ${jumped}`);
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

  /*
   * SPENDING GUARDRAILS, through the real switch in You's Your current approach, read where the rule's years are shown: the
   * ledger of your current approach in Details (the classic planner's Config tab and audit table until D155). Off by default,
   * so the column is absent; on, it names the years the rule acted on the expected path, and not every year, or it is not a
   * list of events. The switch's Documentation link lands on its card.
   */
  // Details' ledger of your current approach: the switch's "Your current approach" once the solved plan's ledger is there too
  const ledgerYours = async pg => {
    await place(pg, 'Details');
    await pg.waitForSelector('[data-audit-ledger]', { timeout: 15000 }).catch(() => {});
    await pg.evaluate(() => { const b = [...document.querySelectorAll('[data-audit-view] button')].find(x => /current approach/.test(x.textContent)); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
    await pg.waitForSelector('[data-audit-ledger="yours"]', { timeout: 8000 }).catch(() => {});
    await pg.waitForTimeout(300);
  };
  const ledgerHas = (pg, name) => pg.evaluate(n => [...document.querySelectorAll('[data-audit-ledger] th')].some(t => t.textContent.trim() === n), name);
  // a Documentation link in You's Your current approach, by its control's card, landing where it says (the scroll is smooth:
  // wait for it to stop, and accept a landing anywhere in the top third of the screen)
  const docLands = async (pg, from, card, heading) => {
    await place(pg, 'You');
    const linked = await pg.evaluate(id => { const c = document.getElementById(id); const btn = c && [...c.querySelectorAll('button')].find(x => /Documentation/.test(x.textContent)); if (btn) { btn.click(); return true; } return false; }, from);
    await pg.waitForFunction(id => { const el = document.getElementById(id); return el && el.getBoundingClientRect().top < 260; }, card, { timeout: 8000 }).catch(() => {});
    await pg.waitForFunction(id => new Promise(res => { const at = () => document.getElementById(id)?.getBoundingClientRect().top; const a = at(); setTimeout(() => res(at() === a), 250); }), card, { timeout: 6000 }).catch(() => {});
    const d = await pg.evaluate(id => { const el = document.getElementById(id); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), h2: el.querySelector('h2')?.textContent || '' }; }, card);
    return { linked, ok: linked && !!d && d.top >= -24 && d.top < 260 && heading.test(d.h2), d };
  };
  console.log('spending guardrails at 1400x900');
  {
    const g = await open(b, 1400, 900, LEDGER_PLAN);
    await ledgerYours(g.p);
    ok('no Guardrail column in the ledger of your current approach while the rule is off', (await g.p.evaluate(() => document.querySelector('[data-audit-ledger]')?.dataset.auditLedger)) === 'yours' && !(await ledgerHas(g.p, 'Guardrail')));
    await place(g.p, 'You');
    const before = await g.p.evaluate(() => { const t = document.querySelector('[data-guardrails-toggle]'); if (!t) return null; t.scrollIntoView({ block: 'center' }); return t.checked; });
    ok('You\'s Your current approach has the switch, off', before === false, String(before));
    await g.p.evaluate(() => document.querySelector('[data-guardrails-toggle]')?.click());
    await g.p.waitForTimeout(400);
    ok('...and it switches on', await g.p.evaluate(() => !!document.querySelector('[data-guardrails-toggle]')?.checked));
    await ledgerYours(g.p);
    // the column follows the plan at once, its figures the deferred projection: wait for a year the rule acted
    const t0 = Date.now();
    await g.p.waitForFunction(() => [...document.querySelectorAll('[data-guardrail-cell]')].some(c => !/^\s*\u2014\s*$/.test(c.innerText) && c.innerText.trim() !== ''), null, { timeout: 8000 }).catch(() => {});
    const waited = Date.now() - t0;
    const audit = await g.p.evaluate(() => {
      const cells = [...document.querySelectorAll('[data-audit-ledger] [data-guardrail-cell]')];
      const acted = cells.filter(c => !/^\s*\u2014\s*$/.test(c.innerText) && c.innerText.trim() !== '').map(c => c.innerText.replace(/\s+/g, ' ').trim());
      return { rows: cells.length, acted: acted.slice(0, 3), actedN: acted.length };
    });
    ok('the ledger gains a Guardrail column when the rule is on', (await ledgerHas(g.p, 'Guardrail')) && audit.rows > 0, `${audit.rows} rows`);
    ok('...naming the years the rule acted on the expected path', audit.actedN > 0, `${audit.acted.join(' | ')} (after ${waited}ms)`);
    ok('...and not every year, or it is not a list of events', audit.actedN < audit.rows, `${audit.actedN} of ${audit.rows}`);
    const link = await docLands(g.p, 'config-guardrails', 'doc-guardrails', /Guardrails/);
    ok('the switch\'s Documentation link lands on the guardrails explainer', link.ok, link.d ? `${link.d.h2} at ${link.d.top}px` : `linked ${link.linked}, no section`);
    ok('no page errors with guardrails', g.errs.length === 0, g.errs.slice(0, 2).join(' | '));
    await g.p.context().close();
  }

  /*
   * THE ONE-OFF COST LOOKAHEAD. A number in You's Your current approach, five years by default, off at zero. The ledger's
   * household with a cost of £600k in 2047, four years into retirement and past the access age: with the default, the ledger of your
   * current approach carries a "Set aside" column naming the years the rule drew and the cost year each draw was for, and only
   * the years before the cost carry a figure; set to 0 through the real field the column goes. Its Documentation link lands
   * on its card.
   */
  console.log('one-off cost lookahead at 1400x900');
  {
    const costly = JSON.parse(JSON.stringify(LEDGER_PLAN));
    costly.oneOffCosts = [{ id: 'c1', date: '2047-06-01', year: 2047, owner: 'Myself', amount: 600000, desc: 'house move' }];
    const g = await open(b, 1400, 900, costly);
    await place(g.p, 'You');
    const field = await g.p.evaluate(() => { const el = document.querySelector('[data-lookahead-years]'); if (!el) return null; const r = el.getBoundingClientRect(); return { value: el.value, h: Math.round(r.height), label: document.querySelector('label[for="config-lookahead-years"]')?.textContent || '' }; });
    ok('You has the lookahead field, at five by default, with a label', !!field && field.value === '5' && /years ahead/i.test(field.label) && field.h >= 24, JSON.stringify(field));
    await ledgerYours(g.p);
    // the column follows the plan at once, its figures the deferred projection: wait for a year the rule drew
    await g.p.waitForFunction(() => [...document.querySelectorAll('[data-audit-ledger] [data-lookahead-cell]')].some(c => /£/.test(c.innerText)), null, { timeout: 8000 }).catch(() => {});
    const audit = await g.p.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-audit-ledger] tbody tr')].map(tr => ({ year: Number(tr.querySelector('td')?.textContent), cell: (tr.querySelector('[data-lookahead-cell]')?.innerText || '').replace(/\s+/g, ' ').trim() }));
      const acted = rows.filter(r => /£/.test(r.cell));
      return { n: rows.length, acted: acted.map(r => `${r.year}: ${r.cell}`), before: acted.every(r => r.year >= 2042 && r.year < 2047), named: acted.every(r => /for 2047/.test(r.cell)) };
    });
    ok('the ledger of your current approach carries a Set aside column by default', (await ledgerHas(g.p, 'Set aside')) && audit.n > 0, `${audit.n} rows`);
    ok('...with figures only in the five years before the cost', audit.acted.length > 0 && audit.acted.length <= 5 && audit.before, audit.acted.join(' | '));
    ok('...each naming the cost year it is for', audit.named);
    await place(g.p, 'You');
    await g.p.fill('[data-lookahead-years]', '0');
    await g.p.waitForTimeout(400);
    await ledgerYours(g.p);
    ok('set to zero through the field, the column goes', !(await ledgerHas(g.p, 'Set aside')));
    const link = await docLands(g.p, 'config-lookahead', 'doc-lookahead', /One-off Cost/);
    ok('the field\'s Documentation link lands on the lookahead explainer', link.ok, link.d ? `${link.d.h2} at ${link.d.top}px` : `linked ${link.linked}, no section`);
    ok('no page errors with the lookahead', g.errs.length === 0, g.errs.slice(0, 2).join(' | '));
    await g.p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
