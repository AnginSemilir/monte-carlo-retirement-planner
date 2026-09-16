// Measures the desktop layout against the things the phone work changed. Read-only: nothing is edited.
const { chromium, devices } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '4173';
const OUT = '/home/user/vitejs-vite-kdvuf9qw/research/desktop-review';
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:45,retireAgeSelf:62,salarySelf:70000,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:40000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:320000,contrib:12000,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:90000,contrib:6000,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:40000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:25000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};

const SMALL_PROBE = (min) => {
  const inline = new Set(['P','SPAN','LI','LABEL','TD','TH']);
  return [...document.querySelectorAll('button, a[href], input, select, summary, [role=button]')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; })
    .filter(el => !el.closest('[data-dev-chrome]') && !(el.parentElement && inline.has(el.parentElement.tagName)))
    .map(el => ({ tag: el.tagName, text: (el.textContent||'').trim().slice(0,28), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }))
    .filter(x => x.h < min || x.w < min);
};
const widest = () => { const s=[...document.querySelectorAll('svg')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0]; return s?Math.round(s.getBoundingClientRect().width):0; };

async function page(b, dev) {
  const ctx = dev ? await b.newContext({ ...devices[dev] }) : await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, plan);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1000);
  return p;
}
const tab = async (p, name) => { await p.evaluate(n => { const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>b.textContent.includes(n)); if(x) x.click(); }, name); await p.waitForTimeout(700); };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = {};

  // --- desktop at 1440x900 ---
  const d = await page(b);
  await tab(d, 'Documentation');
  out.docsHeightDesktop = await d.evaluate(() => document.documentElement.scrollHeight);
  out.docsDetailsDesktop = await d.evaluate(() => document.querySelectorAll('[id^="doc-"] details').length);
  await d.screenshot({ path: `${OUT}/desktop-docs.png` });

  await tab(d, 'Projection');
  await d.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Run the projection/i.test(b.textContent)); x.click(); });
  await d.waitForFunction(() => ![...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Stop'), null, { timeout: 300000 });
  await d.waitForTimeout(1500);
  await d.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='5'); if(x) x.click(); });
  await d.waitForTimeout(1500);
  out.chartWidthDesktop = await d.evaluate(widest);
  out.viewportDesktop = await d.evaluate(() => window.innerWidth);
  out.contentWidthDesktop = await d.evaluate(() => { const el = document.querySelector('.max-w-7xl'); return el ? Math.round(el.getBoundingClientRect().width) : null; });
  out.hasExpandDesktop = await d.evaluate(() => !!document.querySelector('[data-chart-expand]'));
  await d.screenshot({ path: `${OUT}/desktop-step5.png` });

  // step 7: is the chart still on screen while you edit the sandbox?
  await d.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='7'); if(x) x.click(); });
  await d.waitForTimeout(2000);
  await d.screenshot({ path: `${OUT}/desktop-step7.png` });
  out.step7Desktop = await d.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];
    const inputs = [...document.querySelectorAll('input[type=text], input[type=number]')].filter(i=>i.offsetParent);
    const first = inputs[0];
    return { chartBottom: svg ? Math.round(svg.getBoundingClientRect().bottom) : null,
             firstControlTop: first ? Math.round(first.getBoundingClientRect().top) : null,
             viewportH: window.innerHeight, pageH: document.documentElement.scrollHeight };
  });
  out.smallDesktop24 = await d.evaluate(SMALL_PROBE, 24);
  out.smallDesktop44 = await d.evaluate(SMALL_PROBE, 44);

  // --- a 1366x768 laptop, the commonest real screen ---
  const ctxL = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const l = await ctxL.newPage();
  await l.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await l.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, plan);
  await l.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await l.waitForTimeout(900);
  await tab(l, 'Projection');
  await l.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Run the projection/i.test(b.textContent)); x.click(); });
  await l.waitForFunction(() => ![...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Stop'), null, { timeout: 300000 });
  await l.waitForTimeout(1200);
  await l.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='7'); if(x) x.click(); });
  await l.waitForTimeout(2000);
  await l.screenshot({ path: `${OUT}/laptop-step7.png` });
  out.step7Laptop = await l.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];
    const inputs = [...document.querySelectorAll('input')].filter(i=>i.offsetParent && /number|text/.test(i.type));
    return { chartW: svg?Math.round(svg.getBoundingClientRect().width):0, chartBottom: svg?Math.round(svg.getBoundingClientRect().bottom):null,
             firstControlTop: inputs[0]?Math.round(inputs[0].getBoundingClientRect().top):null, viewportH: window.innerHeight };
  });

  // --- the phone, for the side by side ---
  const ph = await page(b, 'Pixel 7');
  await ph.evaluate(() => { const x=[...document.querySelectorAll('[data-bottomnav] button')].find(b=>/Run|Project/i.test(b.textContent)); if(x) x.click(); });
  await ph.waitForTimeout(600);
  await ph.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Run the projection/i.test(b.textContent)); if(x) x.click(); });
  await ph.waitForFunction(() => ![...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Stop'), null, { timeout: 300000 });
  await ph.waitForTimeout(1200);
  await ph.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='7'); if(x) x.click(); });
  await ph.waitForTimeout(2000);
  await ph.screenshot({ path: `${OUT}/phone-step7.png` });

  // --- the simple page, both widths ---
  const s = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const sp = await s.newPage();
  await sp.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await sp.addInitScript(() => { localStorage.setItem('rp_which_app', 'simple'); });
  await sp.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await sp.waitForTimeout(4000);
  await sp.screenshot({ path: `${OUT}/desktop-simple.png` });
  out.simpleChartDesktop = await sp.evaluate(widest);

  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
