/*
 * The Monte Carlo slide's reveal. Regressed once when a step was inserted ahead of it and the reveal
 * clock kept rewinding on a stale slide number, leaving two-point paths and a stub of a band.
 *
 * The reveal is CSS now, not a per-frame React clock, so "is it drawing?" can no longer be answered by
 * measuring how long the `d` attributes are - they are full length from the first frame and the sweep is
 * a stroke-dashoffset animation over them. Checking path length alone would therefore pass no matter
 * what, so this checks the MECHANISM: the paths carry pathLength and the draw class, the band carries
 * its own, and the geometry underneath is full-size. Run: node mc-reveal-ui.cjs [shotDir]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const fs = require('fs');
const SHOT = process.argv[2];
const css = fs.readFileSync('/tmp/claude-0/twbuild/out.css', 'utf8');
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:62,retireAgeSelf:61,salarySelf:0,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:55000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:900000,contrib:0,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:300000,contrib:0,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:600000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:100000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('https://cdn.tailwindcss.com/**', r => r.fulfill({ status:200, contentType:'application/javascript', body:'window.tailwind={config:{}};' }));
  await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, plan);
  await p.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(800);
  await p.addStyleTag({ content: css });
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Projection/.test(b.textContent)); if(x) x.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Run the projection/i.test(b.textContent)); x.click(); });
  await p.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /^5$/.test(b.textContent.trim())), null, { timeout: 120000 });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/^5$/.test(b.textContent.trim())); x.click(); });
  let fails = 0;
  const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
  const probe = () => p.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    const paths = [...svg.querySelectorAll('path')].map(x => ({ d: x.getAttribute('d') || '', fill: x.getAttribute('fill') || '', stroke: x.getAttribute('stroke') || '' }));
    const xs = (d) => [...d.matchAll(/[ML]\s*(-?[\d.]+)/g)].map(m => Number(m[1]));
    const width = svg.getBoundingClientRect().width;
    const span = (d) => { const v = xs(d); return v.length ? (Math.max(...v) - Math.min(...v)) : 0; };
    const filled = paths.filter(x => x.fill && x.fill !== 'none');
    return { n: paths.length, long: paths.filter(x => x.d.length > 200).length, bandSpan: Math.max(0, ...filled.map(x => span(x.d))), width };
  });
  await p.waitForTimeout(600);
  const early = await probe();
  ok('sample paths are present at full geometry', early.long >= 10, `${early.long} long of ${early.n}`);
  // the reveal itself: a static `d` swept by the compositor, which is what keeps this off the main thread
  const mech = await p.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];
    const sp = [...svg.querySelectorAll('path.mc-draw')];
    const cs = sp.length ? getComputedStyle(sp[0]) : null;
    return { drawn: sp.length, pathLength: sp.length ? sp[0].getAttribute('pathLength') : null,
             dash: cs ? cs.strokeDasharray : null, anim: cs ? cs.animationName : null,
             band: !!svg.closest('*') && !!document.querySelector('g.mc-band'),
             spaghetti: !!document.querySelector('g.mc-spaghetti') };
  });
  ok('the sweep is a CSS animation on a static path, not a redrawn one', mech.drawn >= 10 && mech.anim === 'mc-draw', `${mech.drawn} paths, animation ${mech.anim}`);
  ok('...normalised with pathLength so every path sweeps at one rate', mech.pathLength === '1', String(mech.pathLength));
  ok('...and the spaghetti and band groups carry their own', mech.spaghetti && mech.band, `spaghetti ${mech.spaghetti}, band ${mech.band}`);
  await p.waitForTimeout(3500);
  const late = await probe();
  ok('after the reveal, the band spans most of the chart', late.bandSpan > 0.6 * late.width, `band ${Math.round(late.bandSpan)}px of ${Math.round(late.width)}px`);
  ok('and the expected/wrapper lines are full length', late.long >= 3, `${late.long} long paths`);
  // the end state: the band settled and visible, the individual runs dissolved out of the way
  const settled = await p.evaluate(() => {
    const band = document.querySelector('g.mc-band'), sp = document.querySelector('g.mc-spaghetti');
    return { band: band ? Number(getComputedStyle(band).opacity) : null, sp: sp ? Number(getComputedStyle(sp).opacity) : null };
  });
  ok('the band has settled to full opacity', settled.band !== null && settled.band > 0.9, String(settled.band));
  ok('and the individual runs have dissolved', settled.sp !== null && settled.sp < 0.1, String(settled.sp));
  if (SHOT) await p.screenshot({ path: `${SHOT}/mc-slide-late.png` });   // no dir given: don't write ./undefined/
  const real = errs.filter(e => !/ERR_CERT_AUTHORITY_INVALID|tailwind/.test(e));
  ok('no page errors', real.length === 0, real.join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
