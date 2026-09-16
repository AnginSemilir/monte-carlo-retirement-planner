const { chromium } = require('/tmp/node_modules/playwright');
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
  const out = {};
  for (const [label, w, h] of [['laptop1366x768', 1366, 768], ['desktop1440x900', 1440, 900], ['big1920x1080', 1920, 1080]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, plan);
    await p.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(900);
    await p.evaluate(() => { const x=[...document.querySelectorAll('[data-tabbar] button')].find(b=>b.textContent.includes('Projection')); if(x) x.click(); });
    await p.waitForTimeout(500);
    await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Run the projection/i.test(b.textContent)); x.click(); });
    await p.waitForFunction(() => ![...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Stop'), null, { timeout: 300000 });
    await p.waitForTimeout(1200);
    const rows = {};
    for (const step of ['5', '7']) {
      await p.evaluate(s => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===s); if(x) x.click(); }, step);
      await p.waitForTimeout(1600);
      rows[step] = await p.evaluate(() => {
        const pills = [...document.querySelectorAll('button')].filter(b=>/^[1-7]$/.test(b.textContent.trim()));
        const last = pills[pills.length-1];
        const svg = [...document.querySelectorAll('svg')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];
        const inputs = [...document.querySelectorAll('input')].filter(i=>i.offsetParent && /number|text/.test(i.type));
        return { pillsTop: last?Math.round(last.getBoundingClientRect().top):null,
                 chartW: svg?Math.round(svg.getBoundingClientRect().width):0,
                 chartBottom: svg?Math.round(svg.getBoundingClientRect().bottom):null,
                 firstControlTop: inputs[0]?Math.round(inputs[0].getBoundingClientRect().top):null,
                 vh: window.innerHeight, vw: window.innerWidth };
      });
    }
    out[label] = rows;
    await p.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
