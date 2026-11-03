/*
 * WHERE A DOCUMENTATION LINK LANDS, MEASURED (not in run-all's lists: a diagnostic, run by hand).
 *
 * desktop-reach-ui.cjs's lookahead section, the steps before its click repeated (the Audit tab, the field set to 0 through
 * the Config tab, back), then the Documentation link clicked and the card's top read once the scroll has stopped, N times,
 * with the page's CPU throttled CPU_THROTTLE times (the gate's machine is busier than a lone run's). B1's gate on c5370be read
 * -36px against desktop-reach's -24; this showed why (`research/solver/results-doc-landing.txt`).
 *
 *   N=10 CPU_THROTTLE=4 node research/ui-harnesses/doc-landing.cjs <port>
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
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const N = +(process.env.N || 3), RATE = +(process.env.CPU_THROTTLE || 1), tops = [];
  for (let i = 0; i < N; i++) {
    const costly = JSON.parse(JSON.stringify(plan));
    costly.oneOffCosts = [{ id: 'c1', date: '2047-06-01', year: 2047, owner: 'Myself', amount: 600000, desc: 'house move' }];
    const g = await open(b, 1400, 900, 'full', costly);
    if (RATE > 1) { const c = await g.p.context().newCDPSession(g.p); await c.send('Emulation.setCPUThrottlingRate', { rate: RATE }); }
    await tab(g.p, 'Config');
    await g.p.waitForTimeout(600);
    if (!process.env.DIRECT) {
      await tab(g.p, 'Audit Data Table');
      await tab(g.p, 'Config');
      await g.p.fill('[data-lookahead-years]', '0');
      await g.p.waitForTimeout(400);
      await tab(g.p, 'Audit Data Table');
      await tab(g.p, 'Config');
    }
    await g.p.evaluate(() => { [...document.querySelectorAll('#config-lookahead button')].find(x => /Documentation/.test(x.textContent)).click(); });
    await g.p.waitForFunction(() => { const el = document.getElementById('doc-lookahead'); return el && el.getBoundingClientRect().top < 260; }, null, { timeout: 6000 }).catch(() => {});
    await g.p.waitForFunction(() => new Promise(res => { const at = () => document.getElementById('doc-lookahead')?.getBoundingClientRect().top; const a = at(); setTimeout(() => res(at() === a), 250); }), null, { timeout: 6000, polling: 300 }).catch(() => {});
    await g.p.waitForTimeout(+(process.env.SETTLE || 0));
    const top = await g.p.evaluate(() => { const el = document.getElementById('doc-lookahead'); return el ? Math.round(el.getBoundingClientRect().top) : null; });
    tops.push(top);
    await g.p.context().close();
  }
  console.log(`throttle x${RATE}: tops ${tops.join(', ')}; outside [-24, 260): ${tops.filter(t => t === null || t < -24 || t >= 260).length} of ${N}`);
  await b.close();
})();
