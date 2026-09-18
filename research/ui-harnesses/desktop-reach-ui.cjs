/*
 * WHAT A DESKTOP CAN ACTUALLY REACH.
 *
 * The phone work exposed faults that were never phone faults. Measured on the build before these fixes:
 *
 *   - 1366x768, step 7: the chart ended at y=638 and the first sandbox control began at y=1101, so the
 *     chart and the dial that moves it were never on screen together. 1366x768 is the commonest laptop
 *     screen there is, and this is the same fault the phone bottom sheet was built for.
 *   - 1366x768, step 5: the deck's own numbered pills sat at y=839, which is 71px below the fold, so
 *     after reading a step you had to go looking for the way to the next one.
 *   - The Documentation tab was 7,143px with nothing folded and no contents, so you could not see the
 *     shape of the reference without scrolling past all of it.
 *   - The chart measured 1,238px wide on a 1366, a 1440 and a 1920 screen alike, because the page is
 *     capped at 1280. On a large monitor that left 682px of empty page beside the chart.
 *   - One control was 361x17, under the 24px WCAG 2.5.8 AA minimum. The phone passed it only because the
 *     touch rule lifts everything to 44px, which is a different success criterion (2.5.5, AAA, touch).
 *
 * Every assertion here is one of those, so a regression names itself. Run: node desktop-reach-ui.cjs [port]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const { OVERFLOW_PROBE } = require('./lib/probes.cjs');
const PORT = process.argv[2] || '5173';
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:45,retireAgeSelf:62,salarySelf:70000,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:40000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:320000,contrib:12000,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:90000,contrib:6000,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:40000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:25000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};
const simple = { ageSelf:'52', retireSelf:'60', spend:'40000', pen:'350000', isa:'200000', gia:'60000', cash:'40000', statePensionSelf:'11976' };

/*
 * WCAG 2.5.8 (AA) is 24px and applies whatever the pointer; 2.5.5 (AAA) is 44px and is about touch. The
 * phone harness checks 44 because it emulates a finger. This checks 24, which a mouse is also owed. The
 * inline exception is real - a control inside a sentence is exempt - so a target whose parent is a text
 * element is skipped, exactly as the phone probe does.
 */
const SMALL_24 = () => {
  const inline = new Set(['P','SPAN','LI','LABEL','TD','TH']);
  return [...document.querySelectorAll('button, a[href], input, select, summary, [role=button]')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; })
    .filter(el => !el.closest('[data-dev-chrome]') && !(el.parentElement && inline.has(el.parentElement.tagName)))
    .map(el => ({ tag: el.tagName, text: (el.textContent||'').trim().slice(0,30), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }))
    .filter(x => x.h < 24 || x.w < 24);
};
const AMBER = () => [...document.querySelectorAll('svg path')]
  .filter(x => x.getAttribute('stroke-dasharray') === '6,4' && x.getAttribute('stroke-width') === '3.5').length;

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

async function open(b, w, h, app = 'full') {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.addInitScript(([pl, sp, which]) => {
    localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
    localStorage.setItem('rp_simple_v1', JSON.stringify(sp));
    localStorage.setItem('rp_which_app', which === 'simple' ? 'simple' : JSON.stringify('full'));
  }, [plan, simple, app]);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  return { p, errs };
}
const tab = async (p, name) => { await p.evaluate(n => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(b => b.textContent.includes(n)); if (x) x.click(); }, name); await p.waitForTimeout(650); };
const step = async (p, n) => { await p.evaluate(s => { const x = document.querySelector(`[data-slide-pill="${s}"]`); if (x) x.click(); }, String(n)); await p.waitForTimeout(1700); };
async function runProjection(p) {
  await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent)); x.click(); });
  await p.waitForFunction(() => ![...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Stop'), null, { timeout: 300000 });
  await p.waitForTimeout(1000);
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ---------- a 1366x768 laptop ----------
  console.log('1366x768, the commonest laptop screen');
  const { p, errs } = await open(b, 1366, 768);
  await tab(p, 'Projection');
  await runProjection(p);

  await step(p, 5);
  const five = await p.evaluate(() => {
    const pills = [...document.querySelectorAll('[data-slide-pill]')];
    return { pillsTop: pills.length ? Math.round(pills[pills.length - 1].getBoundingClientRect().top) : null, vh: window.innerHeight };
  });
  ok('step 5: the deck’s own pills are on screen', five.pillsTop !== null && five.pillsTop < five.vh, `pills at ${five.pillsTop} of ${five.vh}`);

  await step(p, 7);
  const seven = await p.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    const dials = [...document.querySelectorAll('[data-quick-dials] button')];
    const inView = dials.filter(d => { const r = d.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
    const pills = [...document.querySelectorAll('[data-slide-pill]')];
    return { chartBottom: svg ? Math.round(svg.getBoundingClientRect().bottom) : null, dials: dials.length, inView: inView.length,
      pillsTop: pills.length ? Math.round(pills[pills.length - 1].getBoundingClientRect().top) : null, vh: window.innerHeight };
  });
  ok('step 7: the chart fits the screen', seven.chartBottom !== null && seven.chartBottom < seven.vh, `chart ends ${seven.chartBottom} of ${seven.vh}`);
  ok('...with the dials that move it beneath, not below the fold', seven.inView >= 4, `${seven.inView} of ${seven.dials} dials in view`);
  ok('...and the pills still reachable', seven.pillsTop !== null && seven.pillsTop < seven.vh, `pills at ${seven.pillsTop}`);

  const before = await p.evaluate(AMBER);
  await p.evaluate(() => { const d = [...document.querySelectorAll('[data-quick-dials] button')].find(x => x.textContent.trim() === '+1,000'); if (d) d.click(); });
  await p.waitForTimeout(1600);
  const after = await p.evaluate(AMBER);
  ok('...and a desktop dial draws the amber line', before === 0 && after > 0, `${before} then ${after} dashed path(s)`);

  await tab(p, 'Documentation');
  const docs = await p.evaluate(() => ({
    contents: !!document.querySelector('[data-doc-contents]'),
    entries: document.querySelectorAll('[data-doc-contents] li').length,
    cards: document.querySelectorAll('[id^="doc-"]').length
  }));
  ok('the reference says what is in it', docs.contents && docs.entries >= 8, `${docs.entries} entries`);
  // Read off the cards rather than a hand-kept list, so a card that stops leading with a heading shows here.
  ok('...one entry per card, none missing', docs.entries === docs.cards, `${docs.entries} entries for ${docs.cards} cards`);
  const jumped = await p.evaluate(async () => {
    const li = document.querySelectorAll('[data-doc-contents] li')[4];
    const label = li.querySelector('button').textContent.trim();
    li.querySelector('button').click();
    await new Promise(r => setTimeout(r, 1200));
    const card = [...document.querySelectorAll('[id^="doc-"]')].find(el => (el.querySelector('h2') || {}).textContent?.trim() === label);
    return card ? Math.round(card.getBoundingClientRect().top) : null;
  });
  ok('...and an entry jumps to its card', jumped !== null && Math.abs(jumped) < 120, `card top ${jumped}`);

  /*
   * THE GLOSSARY, WHICH ONLY EXISTS HERE.
   *
   * GIA, NMPA, MPAA, PCLS: the right words, and a wall to anybody who has only ever paid into a workplace
   * pension. Each keeps its name and gains a definition on hover. It is a desktop feature on purpose - a
   * tooltip needs a pointer that can rest without pressing - so this is where it is checked.
   *
   * The two failures worth guarding are the ones a tooltip has: clipped by a scroll container it sits in,
   * or hanging off the edge of the window. Both are measured, not eyeballed.
   */
  await tab(p, 'Config & Assumptions');
  const terms = await p.evaluate(() => document.querySelectorAll('[data-term]').length);
  ok('Config carries glossary terms', terms > 0, `${terms} terms`);
  const mark = await p.evaluate(() => {
    const el = document.querySelector('[data-term]');
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const on = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { hitOk: !!on && (on === el || el.contains(on)), shimmer: /gradient/.test(getComputedStyle(el).backgroundImage) };
  });
  ok('...each one is its own hit target, marked by a shimmering underline', mark.hitOk && mark.shimmer,
    `hit target ${mark.hitOk}, underline gradient ${mark.shimmer}`);
  // A real pointer, not a synthetic MouseEvent: React derives onMouseEnter from a bubbling mouseover at
  // the root, so a hand-dispatched non-bubbling 'mouseenter' reaches nothing and the tooltip never opens.
  await p.hover('[data-term]');
  await p.waitForTimeout(200);
  const tip = await p.evaluate(() => {
    const el = document.querySelector('[data-term]');
    const bub = document.querySelector('[role=tooltip]');
    if (!bub) return { shown: false };
    const r = bub.getBoundingClientRect();
    return { shown: true, term: el.getAttribute('data-term'), text: bub.textContent.trim().length,
      inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
      described: el.getAttribute('aria-describedby') === bub.id };
  });
  /*
   * A CLICK MUST NOT UNDO WHAT THE HOVER JUST DID. The trigger is one control on every device now, so it
   * carries both a hover handler and a click handler - and while it toggled on click, arriving with the
   * pointer opened the bubble and the click that followed closed it again. Somebody who clicks a word
   * rather than resting on it saw nothing happen at all.
   */
  await p.click('[data-term]');
  await p.waitForTimeout(200);
  tip.heldOnClick = await p.evaluate(() => !!document.querySelector('[role=tooltip]'));
  await p.mouse.move(2, 2);
  await p.waitForTimeout(200);
  tip.gone = await p.evaluate(() => !document.querySelector('[role=tooltip]'));
  ok('...and hovering one explains it', !!tip && tip.shown && tip.text > 40, tip ? `${tip.term}: ${tip.text} chars` : 'nothing shown');
  ok('...inside the window, not clipped or off the edge', !!tip && tip.inside, tip ? String(tip.inside) : '');
  ok('...and a click on the word keeps it open rather than closing it', !!tip && tip.heldOnClick === true,
     tip ? `open after the click: ${tip.heldOnClick}` : '');
  ok('...named to a screen reader, and gone on the way out', !!tip && tip.described && tip.gone,
     tip ? `described ${tip.described}, gone ${tip.gone}` : '');

  for (const t of ['Start Here', 'Plan Inputs', 'Config & Assumptions', 'Projection', 'Strategy', 'Historical Backtest', 'Audit Data Table', 'Documentation']) {
    await tab(p, t);
    const small = await p.evaluate(SMALL_24);
    ok(`${t}: no control under 24px`, small.length === 0, small.slice(0, 3).map(x => `${x.tag} "${x.text}" ${x.w}x${x.h}`).join(' | '));
  }
  const over = await p.evaluate(OVERFLOW_PROBE);
  ok('no sideways scroll at 1366', over <= 1, `${over}px`);
  ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();

  // ---------- a 1920x1080 monitor ----------
  console.log('1920x1080');
  const wide = await open(b, 1920, 1080);
  await tab(wide.p, 'Projection');
  await runProjection(wide.p);
  await step(wide.p, 5);
  const w = await wide.p.evaluate(() => {
    const s = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    return { chartW: s ? Math.round(s.getBoundingClientRect().width) : 0, vw: window.innerWidth };
  });
  ok('the chart uses a large monitor', w.chartW >= 1400, `${w.chartW}px of ${w.vw}px`);
  const overW = await wide.p.evaluate(OVERFLOW_PROBE);
  ok('...without the card escaping the page', overW <= 1, `${overW}px`);
  await wide.p.close();

  /*
   * THE CHART STAYS INSIDE ITS CARD ON A LARGE MONITOR.
   *
   * The chart card escapes the page's 1280px cap from 1536px up, so a big screen is not mostly empty
   * beside the picture. The first version of that moved the CHART and left the card behind, and from
   * 1536px the drawn line crossed its own card's border and ended 33px past it. Both halves are checked
   * here: the line is inside the card, and the card's prose is still on the same left margin as the
   * cards above and below it, since the fix could otherwise have dragged the text out with the chart.
   */
  for (const width of [1536, 1920]) {
    console.log(`the chart card at ${width}x900`);
    const wide = await open(b, width, 900);
    await tab(wide.p, 'Projection');
    const headLeft = await wide.p.evaluate(() => { const h = [...document.querySelectorAll('h3')].find(x => /Run the projection/.test(x.textContent)); return h ? Math.round(h.getBoundingClientRect().left) : null; });
    await wide.p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent)); if (x) x.click(); });
    await wide.p.waitForFunction(() => !!document.querySelector('[data-slide-pill="4"]'), null, { timeout: 240000 });
    await step(wide.p, 4);
    const geo = await wide.p.evaluate(() => {
      const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
      const card = svg && svg.closest('.wide-chart-card');
      if (!card) return null;
      const cr = card.getBoundingClientRect();
      let right = -1e9, left = 1e9;
      for (const pa of svg.querySelectorAll('path')) {
        const s = pa.getAttribute('stroke');
        if (!s || s === 'none') continue;
        const r = pa.getBoundingClientRect();
        if (r.width === 0) continue;
        right = Math.max(right, r.right); left = Math.min(left, r.left);
      }
      // the card's own words: its first child that is not the chart, and its explanation paragraph
      const first = [...card.children].find(c => !c.classList.contains('chart-holder'));
      const para = card.querySelector('p');
      return { over: Math.round(right - cr.right), under: Math.round(cr.left - left), svgW: Math.round(svg.getBoundingClientRect().width),
        head: first ? Math.round(first.getBoundingClientRect().left) : null, para: para ? Math.round(para.getBoundingClientRect().left) : null };
    });
    ok('the drawn chart stays inside its card', !!geo && geo.over <= 0 && geo.under <= 0,
      geo ? `${geo.over > 0 ? geo.over + 'px past the right edge' : 'inside'}, ${geo.svgW}px wide` : 'no wide chart card found');
    ok('...and the card keeps the page\'s left margin for its words', !!geo && geo.head === headLeft && geo.para === headLeft,
      geo ? `heading ${geo.head}, paragraph ${geo.para}, the page ${headLeft}` : '');
    ok('...with the chart wider than the capped page would allow', !!geo && geo.svgW > 1280, geo ? `${geo.svgW}px` : '');
    ok(`no page errors at ${width}`, wide.errs.length === 0, wide.errs.slice(0, 2).join(' | '));
  }

  /*
   * "SEE ALL" IS A DASHBOARD ON A DESKTOP.
   *
   * It used to be the same seven cards in the same order, stacked, which is the thing it exists to
   * replace. Across as well as down now: a figure strip, both charts on one shared axis in the main
   * column, and the dials that move them beside it. Either chart can take the column, and the strip
   * then swaps to the six figures THAT chart produces - a simulation has a failure age, a compounded
   * line has none, and a figure beside a picture that did not make it is the bug worth guarding.
   */
  console.log('See all, as a dashboard');
  {
    const dash = await open(b, 1440, 900);
    await tab(dash.p, 'Projection');
    await dash.p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent)); if (x) x.click(); });
    await dash.p.waitForFunction(() => !!document.querySelector('[data-slide-pill="7"]'), null, { timeout: 240000 });
    await dash.p.waitForFunction(() => { const x = [...document.querySelectorAll('button')].find(y => y.textContent.trim() === 'Run the projection'); return x && !x.disabled; }, null, { timeout: 240000 });
    await dash.p.waitForTimeout(400);
    ok('the deck is one step at a time until you ask for all of it',
      !(await dash.p.evaluate(() => !!document.querySelector('[data-projection-dashboard]'))));
    await dash.p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'See all'); if (x) x.click(); });
    await dash.p.waitForTimeout(1400);
    const shape = () => dash.p.evaluate(() => {
      const d = document.querySelector('[data-projection-dashboard]');
      if (!d) return null;
      const row = d.children[1];
      const cols = [...row.children].map(c => ({ h: Math.round(c.getBoundingClientRect().height), content: c.scrollHeight }));
      return {
        charts: [...document.querySelectorAll('[data-dash-chart]')].map(c => c.getAttribute('data-dash-chart')),
        tiles: [...document.querySelectorAll('[data-dash-tile]')].map(t => t.querySelector('span').textContent.trim()),
        dials: document.querySelectorAll('[data-quick-dials] button[aria-label^="increase"]').length,
        jumps: document.querySelectorAll('[data-dash-jump]').length,
        over: cols.filter(c => c.content > c.h + 1).length, cols
      };
    });
    const both = await shape();
    ok('...and then it is a dashboard with both charts', !!both && both.charts.join() === 'mc,rate', both ? both.charts.join(' + ') : 'none');
    ok('...a strip of figures over them', !!both && both.tiles.length === 7, both ? `${both.tiles.length} tiles` : '');
    ok('...the dials that move them, beside rather than below', !!both && both.dials > 0, both ? `${both.dials} dials` : '');
    ok('...and the deck order kept as a way to jump', !!both && both.jumps === 7, both ? `${both.jumps} jump links` : '');
    /*
     * Neither column may be taller than the row it was given. The chart is a viewBox with h-auto, so its
     * height is its WIDTH times an aspect - shrinking its card does not shrink the picture, it makes it
     * overflow, and the card's legend wraps to two lines and costs 77px of the allowance. Both of those
     * were wrong at first and the only symptom was a column quietly 27px too tall.
     */
    ok('...with neither column overflowing the row', !!both && both.over === 0,
      both ? both.cols.map(c => `${c.content} in ${c.h}`).join(' · ') : '');

    await dash.p.evaluate(() => document.querySelector('[data-dash-expand="mc"]').click());
    await dash.p.waitForTimeout(1200);
    const one = await shape();
    ok('expanding one chart drops the other', !!one && one.charts.join() === 'mc', one ? one.charts.join(' + ') : '');
    ok('...and swaps the strip to what that chart produces',
      !!one && one.tiles.length === 6 && one.tiles.some(t => /failure age/i.test(t)) && !one.tiles.some(t => /Safe maximum/i.test(t)),
      one ? one.tiles.join(' | ') : '');
    ok('...while the dials stay, because an edit is possible in every state', !!one && one.dials > 0, one ? `${one.dials} dials` : '');
    ok('...and it still fits its row', !!one && one.over === 0, one ? one.cols.map(c => `${c.content} in ${c.h}`).join(' · ') : '');
    await dash.p.evaluate(() => document.querySelector('[data-dash-expand="mc"]').click());
    await dash.p.waitForTimeout(1000);
    const back = await shape();
    ok('collapsing puts both back', !!back && back.charts.join() === 'mc,rate', back ? back.charts.join(' + ') : '');
    ok('no page errors on the dashboard', dash.errs.length === 0, dash.errs.slice(0, 2).join(' | '));
  }

  // ---------- the simple page ----------
  console.log('the simple page at 1440x900');
  const sp = await open(b, 1440, 900, 'simple');
  await sp.p.waitForFunction(() => /How it draws the money/.test(document.body.innerText), null, { timeout: 180000 });
  await sp.p.waitForTimeout(1200);
  const st = await sp.p.evaluate(() => {
    const els = [...document.querySelectorAll('button[aria-label^="increase"], button[aria-label^="decrease"]')];
    const under = els.filter(x => { const r = x.getBoundingClientRect(); return r.width < 24 || r.height < 24; });
    return { n: els.length, under: under.length };
  });
  ok('the steppers clear 24px', st.n > 0 && st.under === 0, `${st.under} of ${st.n} under`);
  const overS = await sp.p.evaluate(OVERFLOW_PROBE);
  ok('...without crowding the form off the page', overS <= 1, `${overS}px`);
  ok('no page errors on the simple page', sp.errs.length === 0, sp.errs.slice(0, 2).join(' | '));

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
