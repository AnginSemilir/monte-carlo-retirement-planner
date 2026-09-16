/*
 * THE CHECK A RESTYLE ACTUALLY NEEDS.
 *
 * The other harnesses assert behaviour - a card applies, a band draws, a worker answers. None of them
 * would notice the failure a change of palette really produces, which is text the same colour as what
 * is behind it. So this one walks every tab, in both themes, at two widths, and asserts four things
 * that a retint breaks and a unit test cannot see:
 *
 *   1 NOTHING IS INVISIBLE   every run of text is measured against the background actually behind it -
 *                            walking up the ancestors, because a transparent element inherits whatever
 *                            it sits on - and its WCAG contrast ratio has to clear 3:1. That bar is
 *                            deliberately below AA: this is looking for text that vanished, not for
 *                            captions a point too light.
 *   2 NOTHING OVERFLOWS      no horizontal page scroll at 390px, which is where a restyle's new
 *                            paddings and radii show up as a sideways-scrolling phone.
 *   3 NOTHING ERRORS         no page error on any tab in any theme.
 *   4 EVERY TAB RENDERS      each one still puts its own content on screen, so a tab that throws and
 *                            renders empty cannot pass by being silently blank.
 *
 * Run: node restyle-regression-ui.cjs [port] [shotDir]
 */
const { chromium } = require('/tmp/node_modules/playwright');
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
// each tab, and a phrase only that tab renders, so "it loaded" cannot be satisfied by an empty panel
const TABS = [
  ['Start Here', /What each tab is for/i],
  ['Plan Inputs', /Demographics, salaries/i],
  ['Config & Assumptions', /Decumulation/i],
  ['Projection', /Run the projection/i],
  ['Strategy', /tournament/i],
  ['Historical Backtest', /1928|backtest/i],
  ['Audit Data Table', /audit|year-by-year|Age/i],
  ['Documentation', /methodology|documentation|priorit/i],
];

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

// WCAG contrast, measured against the background that is really behind the text
const CONTRAST_PROBE = () => {
  const lum = (c) => {
    const [r, g, b] = c;
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => { const m = (s || '').match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
  const bgOf = (el) => {
    let n = el, acc = [255, 255, 255];
    const stack = [];
    while (n && n.nodeType === 1) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) stack.push(c); if (c && c[3] === 1) break; n = n.parentElement; }
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc);
    return acc;
  };
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    // the in-page editor is dev-only chrome and never ships, so it is not part of what a visitor sees
    if (el.closest('[data-dev-chrome]')) continue;
    // only elements with their own visible text run
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim().length > 1).map(n => n.textContent.trim()).join(' ');
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const fg = parse(cs.color); if (!fg) continue;
    const bg = bgOf(el);
    const f = lum(over(fg, bg)), b = lum(bg);
    const ratio = (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05);
    if (ratio < 3) bad.push({ text: own.slice(0, 45), ratio: +ratio.toFixed(2), color: cs.color, size: cs.fontSize });
  }
  return bad;
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const theme of ['light', 'dark']) {
    for (const width of [1400, 390]) {
      const p = await b.newPage({ viewport: { width, height: 1000 } });
      const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.route('https://fonts.googleapis.com/**', r => r.abort());
      await p.route('https://fonts.gstatic.com/**', r => r.abort());
      await p.addInitScript(([pl, t]) => {
        localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
        localStorage.setItem('rp_which_app', 'full');
        localStorage.setItem('rp_theme_v1', t);
      }, [plan, theme]);
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1600);
      console.log(`\n${theme} @ ${width}px`);
      let worstAll = [];
      for (const [tab, marker] of TABS) {
        const clicked = await p.evaluate((t) => {
          const x = [...document.querySelectorAll('[data-tabbar] button')].find(b => b.textContent.includes(t));
          if (x) { x.click(); return true; } return false;
        }, tab);
        if (!clicked) { ok(`${tab}: tab button present`, false); continue; }
        await p.waitForTimeout(700);
        const text = await p.evaluate(() => document.body.innerText);
        ok(`${tab}: renders its own content`, marker.test(text), marker.test(text) ? '' : text.slice(0, 60).replace(/\n/g, ' '));
        const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        ok(`${tab}: no sideways scroll`, over <= 1, `${over}px`);
        const bad = await p.evaluate(CONTRAST_PROBE);
        ok(`${tab}: no text below 3:1 contrast`, bad.length === 0,
          bad.slice(0, 3).map(x => `"${x.text}" ${x.ratio}:1 ${x.color}`).join(' | '));
        worstAll = worstAll.concat(bad);
        if (SHOT && width === 1400) await p.screenshot({ path: `${SHOT}/reg-${theme}-${tab.replace(/[^a-z]/gi, '')}.png` });
      }
      ok(`${theme} @ ${width}: no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
      await p.close();
    }
  }

  // the control itself: does switching actually repaint, and does it survive a reload
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.route('https://fonts.googleapis.com/**', r => r.abort());
  await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', 'full'); }, plan);
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
  await pick('Match my device'); await p.waitForTimeout(350);
  ok('following the device resolves to a real theme', ['light', 'dark'].includes(await p.evaluate(() => document.documentElement.getAttribute('data-theme'))));
  ok('and stores the preference, not the result', await p.evaluate(() => localStorage.getItem('rp_theme_v1') === 'system'));
  await p.close();

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
