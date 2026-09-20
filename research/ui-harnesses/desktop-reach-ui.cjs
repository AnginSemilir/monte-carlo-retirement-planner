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

async function open(b, w, h, app = 'full', seed = plan) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.addInitScript(([pl, sp, which]) => {
    localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
    localStorage.setItem('rp_simple_v1', JSON.stringify(sp));
    localStorage.setItem('rp_which_app', which === 'simple' ? 'simple' : JSON.stringify('full'));
  }, [seed, simple, app]);
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

  /*
   * ---------- WHAT COUNTS AS A PHONE ----------
   *
   * Width alone was the rule, and it sent a Chromebook to the phone layout: display scaling is common on
   * those machines and a 1366px panel at 200% reports 683 CSS pixels. The rule now asks a second
   * question - is the thing pointing at this a finger - so a narrow window with a trackpad keeps the
   * desktop layout, and a phone keeps the phone one whatever its width.
   *
   * Asserted from the outside, by which navigation is on the page: the bottom bar belongs to one layout
   * and the tab strip to the other, and both at once (or neither) is the failure this guards.
   */
  console.log('a narrow window is not a phone');
  for (const w of [683, 700]) {
    const nar = await open(b, w, 800);
    const shape = await nar.p.evaluate(() => ({
      bottomNav: !!document.querySelector('[data-bottomnav]'),
      phoneBar: !!document.querySelector('[data-phone-bar]'),
      tabStrip: (() => { const t = document.querySelector('[data-tabbar]'); return !!t && t.getBoundingClientRect().height > 0; })()
    }));
    ok(`${w}px with a pointer keeps the desktop layout`, shape.tabStrip && !shape.bottomNav && !shape.phoneBar,
      JSON.stringify(shape));
    await nar.p.close();
  }

  // ---------- a 1366x768 laptop ----------
  console.log('1366x768, the commonest laptop screen');
  const { p, errs } = await open(b, 1366, 768);
  await tab(p, 'Projection');
  await runProjection(p);

  await step(p, 2);
  const five = await p.evaluate(() => {
    const pills = [...document.querySelectorAll('[data-slide-pill]')];
    return { pillsTop: pills.length ? Math.round(pills[pills.length - 1].getBoundingClientRect().top) : null, vh: window.innerHeight,
      cards: document.querySelectorAll('[data-answer-card]').length };
  });
  ok('step 2 holds both solved answers', five.cards === 2, `${five.cards} cards`);

  /*
   * THE GRID UNDER THEM.
   *
   * The two cards are one number each, and a number is a poor answer to a trade. This is the same
   * question run at every combination in a window around what was entered, so what one more year of
   * work is worth can be read rather than inferred. Four things have to hold for it to be worth its
   * seconds of CPU: it fills in rather than appearing at the end, the window contains the plan AND the
   * answer, the shading breaks at the target rather than at the middle of the range, and a cell can be
   * taken.
   */
  const filling = await p.evaluate(() => document.querySelectorAll('[data-grid-cell]').length);
  await p.waitForFunction(() => !document.querySelector('[data-spend-grid] .animate-pulse') && document.querySelectorAll('[data-grid-cell]').length > 0,
    null, { timeout: 240000 }).catch(() => {});
  const gridState = await p.evaluate(() => {
    const cells = [...document.querySelectorAll('[data-grid-cell]')];
    const at = (k) => cells.find(c => c.getAttribute('data-grid-cell') === k);
    const ages = [...new Set(cells.map(c => Number(c.getAttribute('data-grid-cell').split(':')[0])))];
    const spends = [...new Set(cells.map(c => Number(c.getAttribute('data-grid-cell').split(':')[1])))];
    const rate = (c) => Number(c.textContent.trim());
    // monotone: along a row spending more can only survive worse, down a column retiring later better
    let rowBad = 0, colBad = 0;
    for (const a of ages) for (let i = 1; i < spends.length; i++) {
      const x = at(`${a}:${spends[i]}`), y = at(`${a}:${spends[i - 1]}`);
      if (x && y && rate(x) > rate(y)) rowBad++;
    }
    for (const sp of spends) for (let i = 1; i < ages.length; i++) {
      const x = at(`${ages[i]}:${sp}`), y = at(`${ages[i - 1]}:${sp}`);
      if (x && y && rate(x) < rate(y)) colBad++;
    }
    const hereCell = cells.find(c => c.querySelector('span'));
    const safe = [...document.querySelectorAll('[data-answer-card="spend"] span')].map(x => x.textContent.trim())
      .find(t => /^\u00a3[\d,]+$/.test(t));
    return { n: cells.length, ages, spends, rowBad, colBad, here: hereCell ? hereCell.getAttribute('data-grid-cell') : null,
      frontier: document.querySelectorAll('[data-spend-grid] polyline').length, safe };
  });
  ok('the grid runs a window of ages against spends', gridState.n >= 40 && gridState.ages.length >= 5 && gridState.spends.length >= 5,
    `${gridState.n} cells, ${gridState.ages.length} ages x ${gridState.spends.length} spends`);
  ok('...filled in as it went, not all at the end', filling >= 0 && gridState.n > filling, `${filling} while running, ${gridState.n} at the end`);
  ok('...with the plan as entered marked in it', !!gridState.here, String(gridState.here));
  ok('...and the solved safe maximum inside its range', (() => {
    const v = Number(String(gridState.safe || '').replace(/[^0-9]/g, ''));
    return v > 0 && v >= gridState.spends[0] && v <= gridState.spends[gridState.spends.length - 1];
  })(), `${gridState.safe} in \u00a3${gridState.spends[0]}-\u00a3${gridState.spends[gridState.spends.length - 1]}`);
  ok('...a row only falls and a column only rises', gridState.rowBad === 0 && gridState.colBad === 0,
    `${gridState.rowBad} rises along a row, ${gridState.colBad} falls down a column`);
  ok('...and the target line drawn over it', gridState.frontier === 2, `${gridState.frontier} polylines`);

  /* Taking a cell is the point of drawing it: both axes go into the sandbox, and the dashboard shows it. */
  const took = await p.evaluate(() => {
    const c = [...document.querySelectorAll('[data-grid-cell]')].find(x => x.getAttribute('data-grid-cell').endsWith(':' + x.getAttribute('data-grid-cell').split(':')[1]));
    const cell = document.querySelectorAll('[data-grid-cell]')[9];
    const key = cell.getAttribute('data-grid-cell');
    cell.scrollIntoView({ block: 'center' }); cell.click();
    return key;
  });
  await p.waitForTimeout(1600);
  const landed = await p.evaluate(() => ({
    step: document.querySelector('[data-slide-here="true"]')?.getAttribute('data-slide-pill'),
    retire: [...document.querySelectorAll('[data-quick-dials] span')].map(x => x.textContent.trim()).find(t => /^\d{2}$/.test(t)),
    amber: [...document.querySelectorAll('svg path')].filter(x => x.getAttribute('stroke-dasharray') === '6,4' && x.getAttribute('stroke-width') === '3.5').length
  }));
  ok('clicking a cell takes you to the dashboard with it in the sandbox',
    landed.step === '3' && landed.retire === took.split(':')[0], `cell ${took} -> step ${landed.step}, retire at ${landed.retire}`);
  ok('...and the amber line is drawn for it', landed.amber > 0, `${landed.amber} dashed path(s)`);
  // put it back, so the checks below start from a plan with nothing changed
  await p.evaluate(() => { const r = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Reset'); if (r) r.click(); });
  await p.waitForTimeout(900);
  ok('...and Reset puts the sandbox back', (await p.evaluate(AMBER)) === 0, `${await p.evaluate(AMBER)} dashed path(s)`);
  await step(p, 2);
  await p.waitForTimeout(800);
  ok('...and the deck’s own pills are still on screen', five.pillsTop !== null && five.pillsTop < five.vh, `pills at ${five.pillsTop} of ${five.vh}`);

  await step(p, 3);
  const seven = await p.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    const dials = [...document.querySelectorAll('[data-quick-dials] button')];
    const inView = dials.filter(d => { const r = d.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
    const pills = [...document.querySelectorAll('[data-slide-pill]')];
    return { chartBottom: svg ? Math.round(svg.getBoundingClientRect().bottom) : null, dials: dials.length, inView: inView.length,
      pillsTop: pills.length ? Math.round(pills[pills.length - 1].getBoundingClientRect().top) : null, vh: window.innerHeight };
  });
  ok('step 3: the chart fits the screen', seven.chartBottom !== null && seven.chartBottom < seven.vh, `chart ends ${seven.chartBottom} of ${seven.vh}`);
  ok('...with the dials that move it beneath, not below the fold', seven.inView >= 4, `${seven.inView} of ${seven.dials} dials in view`);
  ok('...and the pills still reachable', seven.pillsTop !== null && seven.pillsTop < seven.vh, `pills at ${seven.pillsTop}`);

  const before = await p.evaluate(AMBER);
  await p.evaluate(() => { const d = [...document.querySelectorAll('[data-quick-dials] button[aria-label^="increase"]')].find(x => /a year/i.test(x.getAttribute('aria-label'))); if (d) d.click(); });
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
  await step(wide.p, 3);
  await wide.p.waitForTimeout(900);
  const w = await wide.p.evaluate(() => {
    const s = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    return { chartW: s ? Math.round(s.getBoundingClientRect().width) : 0, vw: window.innerWidth };
  });
  // the dashboard keeps a 330px rail beside the chart, so the chart is the page's width less that
  ok('the chart uses a large monitor', w.chartW >= 1050, `${w.chartW}px of ${w.vw}px`);
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
    console.log(`the dashboard at ${width}x900`);
    const wide = await open(b, width, 900);
    await tab(wide.p, 'Projection');
    const headLeft = await wide.p.evaluate(() => { const h = [...document.querySelectorAll('h3')].find(x => /Run the projection/.test(x.textContent)); return h ? Math.round(h.getBoundingClientRect().left) : null; });
    await wide.p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent)); if (x) x.click(); });
    await wide.p.waitForFunction(() => !!document.querySelector('[data-slide-pill="3"]'), null, { timeout: 240000 });
    await step(wide.p, 3);
    await wide.p.waitForTimeout(900);
    const geo = await wide.p.evaluate(() => {
      const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
      const card = svg && svg.closest('[data-dash-chart]');
      if (!card) return null;
      const cr = card.getBoundingClientRect();
      let right = -1e9, left = 1e9;
      for (const pa of svg.querySelectorAll('path')) {
        const st = pa.getAttribute('stroke');
        if (!st || st === 'none') continue;
        const r = pa.getBoundingClientRect();
        if (r.width === 0) continue;
        right = Math.max(right, r.right); left = Math.min(left, r.left);
      }
      const dash = document.querySelector('[data-projection-dashboard]');
      return { over: Math.round(right - cr.right), under: Math.round(cr.left - left),
        svgW: Math.round(svg.getBoundingClientRect().width),
        dashW: dash ? Math.round(dash.getBoundingClientRect().width) : null,
        page: Math.round(document.documentElement.clientWidth) };
    });
    ok('the drawn chart stays inside its card', !!geo && geo.over <= 0 && geo.under <= 0,
      geo ? `${geo.over > 0 ? geo.over + 'px past the right edge' : 'inside'}, ${geo.svgW}px wide` : 'no dashboard chart found');
    /*
     * The page is capped at max-w-7xl, which is right for prose and wrong for a dashboard: capped, the
     * chart measured the same on a 1366 and a 1920 screen and left 682px of empty page beside the thing
     * people came to look at. The dashboard escapes the cap from 1536px up; the words on the cards above
     * it do not, which is what `headLeft` pins.
     */
    ok('...and the dashboard uses more than the capped page', !!geo && geo.dashW > 1280, geo ? `${geo.dashW}px of ${geo.page}px` : '');
    /* and not by a fixed 6rem either, which left 448px of a 1920 screen empty: what it gets is the page
       less its own gutter, whatever the monitor is */
    ok('...all the way to the page\'s own gutter', !!geo && geo.page - geo.dashW <= 80, geo ? `${geo.page - geo.dashW}px of margin` : '');
    ok('...while the cards above it keep the page\'s own margin', headLeft !== null && headLeft > 0, `page margin ${headLeft}`);
    /*
     * The cap came off the other tabs too. A Chromebook at 1536 showed Plan Inputs as a 1280px column
     * with 128px of empty page either side, which is the width the form's four-column grid could have
     * used. So every tab runs to the page gutter now, except Documentation, which is a column of text
     * and keeps the measure that suits one.
     */
    const contentW = async (name) => { await tab(wide.p, name); return wide.p.evaluate(() => { const c = document.querySelector('[data-app-content]'); return c ? Math.round(c.getBoundingClientRect().width) : null; }); };
    const inputsW = await contentW('Plan Inputs'); const docsW = await contentW('Documentation');
    ok(`Plan Inputs runs to the page gutter at ${width}`, inputsW !== null && width - inputsW <= 80, `${inputsW}px of ${width}px`);
    ok('...and Documentation keeps its text column', docsW !== null && docsW <= 1280, `${docsW}px`);
    ok(`no page errors at ${width}`, wide.errs.length === 0, wide.errs.slice(0, 2).join(' | '));
  }

  /*
   * THE LAST STEP IS THE DASHBOARD.
   *
   * It was reachable only through "See all" before, which meant the screen that holds everything was the
   * one nobody walked to. Across as well as down: a figure strip, one chart at full size with a toggle
   * for which method drew it, and the dials that move it beside it. The strip carries the figures THAT
   * chart produces - a simulation has a failure age, a compounded line has none, and a figure beside a
   * picture that did not make it is the bug worth guarding.
   */
  console.log('Step 3, the dashboard');
  {
    const dash = await open(b, 1440, 900);
    await tab(dash.p, 'Projection');
    await dash.p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent)); if (x) x.click(); });
    await dash.p.waitForFunction(() => !!document.querySelector('[data-slide-pill="3"]'), null, { timeout: 240000 });
    await dash.p.waitForFunction(() => { const x = [...document.querySelectorAll('button')].find(y => y.textContent.trim() === 'Run the projection'); return x && !x.disabled; }, null, { timeout: 240000 });
    await dash.p.waitForTimeout(400);
    ok('the deck opens on the topline, not on the dashboard',
      !(await dash.p.evaluate(() => !!document.querySelector('[data-projection-dashboard]'))));
    await dash.p.evaluate(() => { const x = document.querySelector('[data-slide-pill="3"]'); if (x) x.click(); });
    await dash.p.waitForTimeout(1600);
    const shape = () => dash.p.evaluate(() => {
      const d = document.querySelector('[data-projection-dashboard]');
      if (!d) return null;
      const row = d.children[1];
      const cols = [...row.children].map(c => ({ h: Math.round(c.getBoundingClientRect().height), content: c.scrollHeight }));
      const card = document.querySelector('[data-dash-chart]');
      return {
        chart: card ? card.getAttribute('data-dash-chart') : null,
        tiles: [...document.querySelectorAll('[data-dash-tile]')].map(t => t.querySelector('span').textContent.trim()),
        dials: document.querySelectorAll('[data-quick-dials] button[aria-label^="increase"]').length,
        retireStep: ([...document.querySelectorAll('[data-quick-dials] button[aria-label^="increase"]')]
          .map(b => b.getAttribute('aria-label')).find(l => /retire at/i.test(l)) || '').replace(/.* by /, ''),
        pills: document.querySelectorAll('[data-slide-pill]').length,
        bands: [...document.querySelectorAll('[data-dash-chart] [data-chart-head] button')].map(x => x.textContent.trim()),
        legend: [...document.querySelectorAll('[data-chart-legend] button')].map(x => x.textContent.trim()),
        legendRows: new Set([...document.querySelectorAll('[data-chart-legend] button')].map(x => Math.round(x.getBoundingClientRect().top))).size,
        bottom: Math.round(d.getBoundingClientRect().bottom + window.scrollY),
        /* the chart column must fit the row it was given; the rail is a scroll container by design */
        chartOver: Math.max(0, cols[0] ? cols[0].content - cols[0].h : 0), cols
      };
    });
    const both = await shape();
    ok('...and then it is a dashboard, opening on the simulation', !!both && both.chart === 'mc', both ? both.chart : 'none');
    ok('...a strip of figures over it', !!both && both.tiles.length === 7, both ? `${both.tiles.length} tiles` : '');
    ok('...the dials that move it, beside rather than below', !!both && both.dials > 0, both ? `${both.dials} dials` : '');
    ok('...and the other two steps one click away', !!both && both.pills === 3, both ? `${both.pills} step pills` : '');
    /*
     * One pair of buttons means one step, and for an age the step people want is a year. The rail took
     * the largest of the four the wide dial offers, which made the only way to move a retirement age a
     * five-year jump.
     */
    ok('...stepping a retirement age by a year, not five', !!both && both.retireStep === '1', both ? `by ${both.retireStep || 'no retire dial'}` : '');
    /*
     * THE CONTROLS THE CHART NEEDS, ON THE SCREEN THE CHART IS ON.
     *
     * The dashboard used to render the charts with no band picker at all, so the y-axis was scaled to
     * whichever band the deck happened to be left on and there was no way to change it from here. The
     * axis follows the band, so this is not a preference - it is whether the picture is readable.
     */
    ok('...with the band picker above the chart', !!both && ['Expected only', 'Upper/lower quartiles', '10th/90th percentiles'].every(l => both.bands.includes(l)),
      both ? both.bands.join(' · ') : '');
    /*
     * SEVEN CHIPS, NOT SIX. The six wrappers are drawn OVER the picture; the picture itself - the
     * simulated median and its fan, or the compounded band - was drawn with no chip at all, so turning
     * every series off left one line behind that nothing named and nothing could remove.
     */
    ok('...and every series in the legend, on one line', !!both && both.legend.length === 7 && both.legendRows === 1,
      both ? `${both.legend.join(', ')} in ${both.legendRows} row(s)` : '');
    ok('...including the chart\'s own line, named for what drew it',
      !!both && both.legend[0] === 'Simulated median', both ? both.legend[0] : '');
    ok('...the whole of it on one 1440x900 screen', !!both && both.bottom <= 900, both ? `ends at ${both.bottom}px` : '');
    /*
     * NOTHING DRAWN THAT NOTHING NAMES. Switch off all seven chips and the plot area must be empty of
     * lines - the test that caught the unnamed one.
     */
    const plotted = () => dash.p.evaluate(() => [...document.querySelectorAll('[data-dash-chart] svg path')]
      .filter(x => (x.getAttribute('stroke') || 'none') !== 'none' && !x.closest('[data-chart-legend]')).length);
    const drawn = await plotted();
    /* only the chips that are ON: three of the six series start off, and pressing those would draw
       three more lines rather than clearing the picture */
    const pressAllOn = () => dash.p.evaluate(async () => {
      for (let i = 0; i < 12; i++) {
        const on = document.querySelector('[data-chart-legend] button[aria-pressed="true"]');
        if (!on) return;
        on.click();
        await new Promise(r => setTimeout(r, 90));
      }
    });
    await pressAllOn();
    await dash.p.waitForTimeout(500);
    ok('...and every line in the picture can be switched off', (await plotted()) === 0, `${drawn} drawn, ${await plotted()} left`);
    await dash.p.evaluate(async () => {
      for (const b of [...document.querySelectorAll('[data-chart-legend] button[aria-pressed="false"]')]) { b.click(); await new Promise(r => setTimeout(r, 90)); }
    });
    await dash.p.waitForTimeout(500);
    /*
     * THE THINGS THE DASHBOARD MUST NOT COST YOU. It is where you stay, so the theme has to be
     * changeable from it, the chart has to open full-screen from it, and the run card that starts the
     * whole thing has no business sitting above a chart that has already been run.
     */
    const kit = await dash.p.evaluate(() => ({
      theme: ['Light', 'Dark', 'Sepia'].every(t => [...document.querySelectorAll('button[aria-label]')].some(b => b.getAttribute('aria-label') === t)),
      expand: !!document.querySelector('[data-dash-expand]'),
      runCard: [...document.querySelectorAll('h3')].some(h => /Run the projection/.test(h.textContent)),
    }));
    ok('...with the theme still changeable from it', kit.theme, '');
    ok('...an expander on the chart', kit.expand, '');
    ok('...and no run card above a chart that has already run', !kit.runCard, '');
    await dash.p.evaluate(() => { const x = document.querySelector('[data-dash-expand]'); if (x) x.click(); });
    await dash.p.waitForTimeout(600);
    ok('...which opens the chart full-screen', await dash.p.evaluate(() => !!document.querySelector('[role=dialog][aria-modal=true]')));
    await dash.p.keyboard.press('Escape');
    await dash.p.waitForTimeout(400);
    ok('...with the chart column inside the row it was given', !!both && both.chartOver === 0,
      both ? both.cols.map(c => `${c.content} in ${c.h}`).join(' \u00b7 ') : '');

    /*
     * THE TOGGLE, WHERE THE EXPAND BUTTON USED TO BE. Two charts at 300px each was a shape rather than
     * a picture; one at full size with a switch is the phone's answer and now the desktop's.
     */
    await dash.p.evaluate(() => { const x = [...document.querySelectorAll('[data-sandbox-chart-mode] button')].find(y => y.textContent.trim() === 'Rate based'); if (x) x.click(); });
    await dash.p.waitForTimeout(900);
    const rate = await shape();
    ok('the toggle swaps which chart has the column', !!rate && rate.chart === 'rate', rate ? rate.chart : 'none');
    ok('...and swaps the strip to what that chart produces',
      !!rate && rate.tiles.some(t => /Expected pot/i.test(t)) && !rate.tiles.some(t => /quartile/i.test(t)),
      rate ? rate.tiles.join(' | ') : '');
    ok('...while the dials stay, because an edit is possible in every state', !!rate && rate.dials > 0, rate ? `${rate.dials} dials` : '');

    /*
     * THE AMBER LINE HAS TO BE MADE OF WHAT THE CHART IS MADE OF.
     *
     * The dashboard drew both charts and took the sandbox line from step 7's own setting, which defaults
     * to the compounded run - so the Monte Carlo chart got a smooth deterministic line laid over its fan,
     * in the same amber, with nothing saying it was a different method. On the rate chart an edit still
     * redraws instantly; on the simulation it has to simulate, and say that it is.
     */
    const dashed = () => dash.p.evaluate(() => [...document.querySelectorAll('svg path')]
      .filter(x => x.getAttribute('stroke-dasharray') === '6,4' && x.getAttribute('stroke-width') === '3.5').length);
    const beforeEdit = await dashed();
    await dash.p.evaluate(() => { const x = [...document.querySelectorAll('[data-quick-dials] button[aria-label^="increase"]')].find(y => /retire at/i.test(y.getAttribute('aria-label'))); if (x) x.click(); });
    await dash.p.waitForTimeout(700);
    ok('an edit on the rate chart moves the line at once', (await dashed()) > beforeEdit, `${beforeEdit} then ${await dashed()} dashed path(s)`);
    await dash.p.evaluate(() => { const x = [...document.querySelectorAll('[data-sandbox-chart-mode] button')].find(y => y.textContent.trim() === 'Monte Carlo'); if (x) x.click(); });
    const simulating = await dash.p.waitForFunction(() => /simulating/i.test(document.querySelector('[data-sandbox-chart-mode]')?.innerText || ''),
      null, { timeout: 20000 }).then(() => true).catch(() => false);
    ok('...and on the simulation it says it is simulating, rather than drawing the smooth line over the fan', simulating, '');
    const settled = await dash.p.waitForFunction(() => /sandbox survival/i.test(document.querySelector('[data-sandbox-chart-mode]')?.innerText || ''),
      null, { timeout: 120000 }).then(() => true).catch(() => false);
    ok('...then reports what the simulated edit actually survives', settled,
      await dash.p.evaluate(() => (document.querySelector('[data-sandbox-chart-mode]')?.innerText || '').replace(/\s+/g, ' ').slice(0, 80)));

    ok('no page errors on the dashboard', dash.errs.length === 0, dash.errs.slice(0, 2).join(' | '));
  }

  /*
   * SAID ONCE, IN THE CHROME. The real-terms note used to be a blue banner on the title card, a grey
   * line over the inputs, a sub-line under half the figures and a clause in several field hints - and
   * a thing said six times on one screen is not read anywhere. It is a property of the whole model, so
   * it sits in the line that describes the whole model, which is on screen whichever tab you are on.
   * The check is per tab, because the failure mode is not "missing", it is "back to twice".
   */
  {
    const once = await open(b, 1440, 900);
    const counts = [];
    for (const name of ['Start Here', 'Plan Inputs', 'Config & Assumptions', 'Projection', 'Strategy']) {
      await tab(once.p, name);
      counts.push([name, await once.p.evaluate(() => (document.body.innerText.match(/in today\u2019s money|in today's money/g) || []).length)]);
    }
    const bad = counts.filter(([, n]) => n !== 1);
    ok('the today\u2019s-money note is said exactly once on every tab', bad.length === 0,
       counts.map(([n, c]) => `${n}:${c}`).join(' '));
    const where = await once.p.evaluate(() => {
      const p = [...document.querySelectorAll('p')].find(x => /Every amount is in today/.test(x.textContent));
      return p ? p.textContent.replace(/\s+/g, ' ').trim().slice(-60) : null;
    });
    ok('...in the line under the title', !!where && /reads from it\. Every amount is in today/.test(where + ''), where || 'not found');
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

  /*
   * THE GAIN PROMPT SITS UNDER THE BALANCE IT IS ABOUT.
   *
   * It used to be an amber banner on every tab but this one - "no unrealised gain on Other Investments,
   * so only future growth is taxed" - repeated per owner, above whatever you had come to read. It asks
   * for a figure, so it belongs under the field that figure goes with, and the banner should not carry
   * it at all.
   */
  {
    const gia = await open(b, 1440, 900);
    await tab(gia.p, 'Plan Inputs');
    await gia.p.waitForTimeout(500);
    const seen = await gia.p.evaluate(() => {
      const hint = document.querySelector('[data-gia-gain-hint]');
      const cell = hint && hint.closest('td');
      const input = cell && cell.querySelector('input');
      return { hint: !!hint, underTheField: !!(hint && input) && hint.getBoundingClientRect().top >= input.getBoundingClientRect().bottom - 1,
        advanced: !!document.getElementById('advanced-inputs') };
    });
    ok('the GIA gain prompt is under the balance field', seen.hint && seen.underTheField, JSON.stringify(seen));
    await gia.p.evaluate(() => { const h = document.querySelector('[data-gia-gain-hint]'); if (h) h.click(); });
    await gia.p.waitForTimeout(600);
    const opened = await gia.p.evaluate(() => {
      const el = document.getElementById('advanced-inputs');
      return el ? /unrealised gain/i.test(el.innerText) : false;
    });
    ok('...and pressing it opens Advanced inputs where the figure goes', opened === true, `advanced shows the field: ${opened}`);
    await tab(gia.p, 'Projection');
    await gia.p.waitForTimeout(500);
    const banner = await gia.p.evaluate(() => /unrealised gain/i.test(document.body.innerText));
    ok('...and the banner no longer says it on the other tabs', banner === false, `still in a banner: ${banner}`);
    await gia.p.close();
  }

  /*
   * SPENDING GUARDRAILS.
   *
   * A rule that changes what the survival rate means has to be visible where the rate is made: the note
   * beside the run button names the state and links to the switch and the explanation. Off by default,
   * so every figure the app has ever shown is unchanged; on, the audit table grows a column naming the
   * years the rule acted, and the dashboard grows the tile that keeps the rate honest. All of it is
   * exercised through the real switch on the Config tab, not by seeding the plan, because the path a
   * person takes is the one worth proving.
   */
  console.log('spending guardrails at 1400x900');
  {
    const g = await open(b, 1400, 900);
    await tab(g.p, 'Projection');
    const note = await g.p.evaluate(() => { const n = document.querySelector('[data-guardrail-note]'); return n ? { text: n.innerText, links: [...n.querySelectorAll('button')].map(x => x.textContent.trim()) } : null; });
    ok('the run card says whether spending guardrails are on', !!note && /guardrails off/i.test(note.text), note ? note.text.split('\n')[0].slice(0, 60) : 'no note');
    ok('...and links to the explanation and the switch', !!note && note.links.includes('Documentation') && note.links.includes('Config'), note ? note.links.join(', ') : '');
    await tab(g.p, 'Audit Data Table');
    ok('no guardrail column in the audit table while the rule is off', await g.p.evaluate(() => ![...document.querySelectorAll('th')].some(t => /Guardrail/.test(t.textContent))));
    // the Config link from the note lands on the switch, which starts unchecked
    await tab(g.p, 'Projection');
    await g.p.evaluate(() => { [...document.querySelectorAll('[data-guardrail-note] button')].find(x => x.textContent.trim() === 'Config').click(); });
    await g.p.waitForTimeout(900);
    const sw = await g.p.evaluate(() => { const el = document.querySelector('[data-guardrails-toggle]'); if (!el) return null; const r = el.getBoundingClientRect(); return { checked: el.checked, onScreen: r.top >= 0 && r.bottom <= window.innerHeight }; });
    ok('the Config link lands on the switch, unchecked and on screen', !!sw && !sw.checked && sw.onScreen, JSON.stringify(sw));
    await g.p.evaluate(() => document.querySelector('[data-guardrails-toggle]').click());
    await g.p.waitForTimeout(400);
    ok('...and it switches on', await g.p.evaluate(() => document.querySelector('[data-guardrails-toggle]').checked));
    await tab(g.p, 'Audit Data Table');
    const audit = await g.p.evaluate(() => {
      const th = [...document.querySelectorAll('th')].some(t => /Guardrail/.test(t.textContent));
      const cells = [...document.querySelectorAll('[data-guardrail-cell]')];
      const acted = cells.filter(c => !/^\s*\u2014\s*$/.test(c.innerText) && c.innerText.trim() !== '').map(c => c.innerText.replace(/\s+/g, ' ').trim());
      return { th, rows: cells.length, acted: acted.slice(0, 4), actedN: acted.length };
    });
    ok('the audit table gains a Guardrail column when the rule is on', audit.th && audit.rows > 0, `${audit.rows} rows`);
    ok('...naming the years the rule acted on the expected path', audit.actedN > 0, audit.acted.join(' | '));
    ok('...and not every year, or it is not a list of events', audit.actedN < audit.rows, `${audit.actedN} of ${audit.rows}`);
    await tab(g.p, 'Projection');
    ok('the run card now says on', await g.p.evaluate(() => /guardrails on/i.test(document.querySelector('[data-guardrail-note]')?.innerText || '')));
    await runProjection(g.p);
    await step(g.p, 3);
    const tile = await g.p.evaluate(() => { const t = [...document.querySelectorAll('[data-projection-dashboard] *')].find(el => /Spending after guardrails/.test(el.textContent) && el.children.length <= 3); return t ? t.parentElement.innerText.replace(/\s+/g, ' ').slice(0, 120) : null; });
    ok('the dashboard shows what the household lived on beside the survival rate', !!tile && /£/.test(tile) && /unlucky tenth/.test(tile), tile || 'no tile');
    // the Documentation link lands on the explainer
    await step(g.p, 1);
    await g.p.evaluate(() => { [...document.querySelectorAll('[data-guardrail-note] button')].find(x => x.textContent.trim() === 'Documentation').click(); });
    await g.p.waitForTimeout(1500);
    const doc = await g.p.evaluate(() => { const el = document.getElementById('doc-guardrails'); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), h2: el.querySelector('h2')?.textContent || '' }; });
    ok('the Documentation link lands on the guardrails explainer', !!doc && doc.top < 200 && /Guardrails/.test(doc.h2), doc ? `${doc.h2} at ${doc.top}px` : 'no section');
    ok('no page errors with guardrails', g.errs.length === 0, g.errs.slice(0, 2).join(' | '));
    await g.p.context().close();
  }

  /*
   * THE ONE-OFF COST LOOKAHEAD.
   *
   * A number on the Config tab, five years by default, off at zero. The same household with a cost of
   * £600k at 66, four years into retirement and past the access age: with the default the audit table
   * carries a "Set aside" column naming the years the rule drew and the cost year each draw was for,
   * and only the years before the cost carry a figure; set to 0 through the real field the column goes.
   * The Documentation link lands on its card.
   */
  console.log('one-off cost lookahead at 1400x900');
  {
    const costly = JSON.parse(JSON.stringify(plan));
    costly.oneOffCosts = [{ id: 'c1', date: '2047-06-01', year: 2047, owner: 'Myself', amount: 600000, desc: 'house move' }];
    const g = await open(b, 1400, 900, 'full', costly);
    await tab(g.p, 'Config');
    const field = await g.p.evaluate(() => { const el = document.querySelector('[data-lookahead-years]'); if (!el) return null; const r = el.getBoundingClientRect(); return { value: el.value, h: Math.round(r.height), label: document.querySelector('label[for="config-lookahead-years"]')?.textContent || '' }; });
    ok('the Config tab has the horizon field, at five by default, with a label', !!field && field.value === '5' && /years ahead/i.test(field.label) && field.h >= 24, JSON.stringify(field));
    await tab(g.p, 'Audit Data Table');
    const audit = await g.p.evaluate(() => {
      const th = [...document.querySelectorAll('th')].some(t => /Set aside/.test(t.textContent));
      const rows = [...document.querySelectorAll('tbody tr')].map(tr => ({ year: Number(tr.querySelector('td')?.textContent), cell: (tr.querySelector('[data-lookahead-cell]')?.innerText || '').replace(/\s+/g, ' ').trim() }));
      const acted = rows.filter(r => /£/.test(r.cell));
      return { th, n: rows.length, acted: acted.map(r => `${r.year}: ${r.cell}`), before: acted.every(r => r.year >= 2042 && r.year < 2047), named: acted.every(r => /for 2047/.test(r.cell)) };
    });
    ok('the audit table carries a Set aside column by default', audit.th && audit.n > 0, `${audit.n} rows`);
    ok('...with figures only in the five years before the cost', audit.acted.length > 0 && audit.acted.length <= 5 && audit.before, audit.acted.join(' | '));
    ok('...each naming the cost year it is for', audit.named);
    await tab(g.p, 'Config');
    await g.p.fill('[data-lookahead-years]', '0');
    await g.p.waitForTimeout(400);
    await tab(g.p, 'Audit Data Table');
    ok('set to zero through the field, the column goes', await g.p.evaluate(() => ![...document.querySelectorAll('th')].some(t => /Set aside/.test(t.textContent))));
    await tab(g.p, 'Config');
    await g.p.evaluate(() => { [...document.querySelectorAll('#config-lookahead button')].find(x => /Documentation/.test(x.textContent)).click(); });
    // The scroll is smooth, and the Documentation tab fills in its contents list after the scroll has
    // started, which shifts what follows by up to 200px. So wait for the card to settle rather than
    // sampling at a fixed moment, and accept a landing anywhere in the top third of the screen: the
    // claim is that the link takes you to the card, not that the browser's scroll is pixel-exact.
    await g.p.waitForFunction(() => { const el = document.getElementById('doc-lookahead'); return el && el.getBoundingClientRect().top < 260; }, null, { timeout: 6000 }).catch(() => {});
    // ...and then for the smooth scroll to stop moving, so the figure reported is where it came to rest
    await g.p.waitForFunction(() => new Promise(res => { const at = () => document.getElementById('doc-lookahead')?.getBoundingClientRect().top; const a = at(); setTimeout(() => res(at() === a), 250); }), null, { timeout: 6000 }).catch(() => {});
    const doc = await g.p.evaluate(() => { const el = document.getElementById('doc-lookahead'); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), h2: el.querySelector('h2')?.textContent || '' }; });
    ok('the Documentation link lands on the lookahead explainer', !!doc && doc.top >= -24 && doc.top < 260 && /One-off Cost/.test(doc.h2), doc ? `${doc.h2} at ${doc.top}px` : 'no section');
    ok('no page errors with the lookahead', g.errs.length === 0, g.errs.slice(0, 2).join(' | '));
    await g.p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
