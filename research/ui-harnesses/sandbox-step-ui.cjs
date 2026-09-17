/*
 * THE SANDBOX IS STEP 7 OF THE PROJECTION DECK.
 *
 * It used to hang below the deck behind its own reveal flag, which put it six clicks from the figure it
 * exists to move and - because the deck shows one step at a time - never on screen beside the chart it
 * draws on. Moving it into the deck is easy to undo by accident, and two of its properties are invisible
 * to every other harness:
 *
 *   1 it is REACHABLE like any other step, from the numbered pills, in one click
 *   2 the Monte Carlo chart renders ABOVE the controls, and arrives FINISHED rather than rewound - the
 *     reveal clock has to special-case this step, and getting that wrong gives a stub band and
 *     two-point paths, which is exactly the bug that shipped once before
 *   3 editing a contribution puts the amber sandbox line on THAT SAME screen
 *   4 it is the last step, so it offers no "Next"
 *
 * Run: node sandbox-step-ui.cjs [port] [shotDir]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || '5173';
const SHOT = process.argv[3];
// NO STYLESHEET IS INJECTED. These harnesses used to read a Tailwind build from /tmp and addStyleTag it,
// a leftover from when the dev server leaned on a Tailwind CDN. The built site links its own compiled
// CSS, and layering an older copy over the top silently overrides it: a stale `.flex` rule landing after
// the real `@media (min-width:1024px){.lg\:grid{...}}` collapsed a two-column layout to one, and stale
// colour tokens produced contrast failures that did not exist in the shipped page.
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:45,retireAgeSelf:62,salarySelf:70000,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:40000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:320000,contrib:12000,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:90000,contrib:6000,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:40000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:25000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.route('https://cdn.tailwindcss.com/**', r => r.fulfill({ status:200, contentType:'application/javascript', body:'window.tailwind={config:{}};' }));
  await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, plan);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(800);

  let fails = 0;
  const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
  const pill = (n) => p.evaluate(k => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===String(k)); if(x) x.click(); return !!x; }, n);

  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Projection/.test(b.textContent)); if(x) x.click(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Run the projection/i.test(b.textContent)); x.click(); });
  await p.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === '6'), null, { timeout: 180000 });
  await p.waitForTimeout(1500);

  // 1. the deck offers a seventh step
  const pills = await p.evaluate(() => [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/^[1-9]$/.test(t)));
  ok('the deck has a 7th numbered step', pills.includes('7'), `pills ${[...new Set(pills)].sort().join(',')}`);

  // step 6's Next names it
  await pill(6); await p.waitForTimeout(500);
  const next6 = await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/^Next:/.test(b.textContent.trim())); return x ? x.textContent.trim() : null; });
  ok('step 6 offers Next: Change something', /Change something/.test(next6 || ''), String(next6));

  /*
   * The band toggle opens on "Expected only" now - one line, on an axis that follows it, because that is
   * what makes a change to the plan visible. This harness measures the band's span to prove step 7
   * arrives finished rather than mid-reveal, so it asks for a band first. The toggle lives on the two
   * chart steps, so the ask happens there and step 7 inherits it: one control for the whole deck.
   */
  await pill(5); await p.waitForTimeout(600);
  const asked = await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Upper/lower quartiles'); if (x) { x.click(); return true; } return false; });
  ok('a band can be asked for from the chart step', asked);
  await p.waitForTimeout(600);

  // 2. one click from the pills, and the chart is there and FINISHED
  const reached = await pill(7);
  await p.waitForTimeout(1800);
  ok('step 7 is reachable in one click from the pills', reached);

  const probe = await p.evaluate(() => {
    const svgs = [...document.querySelectorAll('svg')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width);
    const svg = svgs[0]; if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const paths = [...svg.querySelectorAll('path')].map(x=>({d:x.getAttribute('d')||'',fill:x.getAttribute('fill')||'',stroke:x.getAttribute('stroke')||'',dash:x.getAttribute('stroke-dasharray')||'',width:x.getAttribute('stroke-width')||''}));
    const xs = d => [...d.matchAll(/[ML]\s*(-?[\d.]+)/g)].map(m=>Number(m[1]));
    const span = d => { const v = xs(d); return v.length ? Math.max(...v)-Math.min(...v) : 0; };
    const filled = paths.filter(x=>x.fill && x.fill!=='none');
    const panel = [...document.querySelectorAll('h3')].some(h=>/Sandbox/.test(h.textContent));
    const chartTop = r.top, panelEl = [...document.querySelectorAll('h3')].find(h=>/Sandbox/.test(h.textContent));
    return { width: r.width, long: paths.filter(x=>x.d.length>200).length, bandSpan: Math.max(0,...filled.map(x=>span(x.d))),
             panel, chartTop, panelTop: panelEl ? panelEl.getBoundingClientRect().top : null,
             amber: paths.filter(x=>x.dash==='6,4' && x.width==='3.5').length };
  });
  ok('step 7 renders a chart', !!probe && probe.width > 400, probe ? `${Math.round(probe.width)}px` : 'none');
  ok('...arriving FINISHED, not rewound to a stub band', probe.bandSpan > 0.6*probe.width, `band ${Math.round(probe.bandSpan)}px of ${Math.round(probe.width)}px`);
  ok('...with full-length paths, not two-point ones', probe.long >= 3, `${probe.long} long paths`);
  ok('the sandbox panel is on the same screen', probe.panel);
  ok('...and the chart is ABOVE the controls', probe.panelTop !== null && probe.chartTop < probe.panelTop, `chart ${Math.round(probe.chartTop)} vs panel ${Math.round(probe.panelTop)}`);

  // 4. it is the last step
  const next7 = await p.evaluate(() => [...document.querySelectorAll('button')].some(b=>/^Next:/.test(b.textContent.trim())));
  ok('step 7 is last, so it offers no Next', !next7);

  // 3. an edit puts the amber line on this same screen
  // the sandbox line's own signature: 3.5px, 6,4 dash. The nominal and cash series are dashed as well,
  // so this must match on both attributes or it counts them and can never read zero.
  ok('no amber sandbox line before editing', probe.amber === 0, `${probe.amber}`);
  // Money fields are text inputs carrying thousands separators, not number inputs: a plain number input
  // cannot show a separator at all. `data-money` marks them, and the displayed value has to be stripped
  // before it is a number again - Number("12,000") is NaN, which would have quietly found no target.
  const edited = await p.evaluate(() => {
    const ins = [...document.querySelectorAll('input[data-money], input[type="number"]')];
    const val = (el) => Number(String(el.value).replace(/[^0-9.-]/g, ''));
    const set = (el, v) => { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(el, String(v)); el.dispatchEvent(new Event('input',{bubbles:true})); };
    const target = ins.find(i => val(i) === 12000) || ins.find(i => val(i) > 1000);
    if (!target) return false; set(target, val(target) + 9000); return true;
  });
  await p.waitForTimeout(1200);
  const after = await p.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];
    const paths = [...svg.querySelectorAll('path')];
    return { amber: paths.filter(x=>(x.getAttribute('stroke-dasharray')||'')==='6,4' && (x.getAttribute('stroke-width')||'')==='3.5').length };
  });
  ok('an edit was possible', edited);
  ok('editing draws the amber sandbox line on this same screen', after.amber > 0, `${after.amber} dashed path(s)`);

  if (SHOT) await p.screenshot({ path: `${SHOT}/sandbox-step.png` });
  // ERR_FAILED is the Google Fonts request this harness aborts itself; the proxy blocks it regardless.
  const real = errs.filter(e => !/ERR_CERT_AUTHORITY_INVALID|ERR_FAILED|tailwind|favicon|fonts\./i.test(e));
  ok('no page errors', real.length === 0, real.join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
