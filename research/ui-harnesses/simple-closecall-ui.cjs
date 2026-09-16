// The simple page after the two-seed search: the policy line renders, the Monte Carlo chart still has its
// band and sample paths, and a close call (when one occurs) is stated. Run: node simple-closecall-ui.cjs [port] [shotDir]
const { chromium } = require('/tmp/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || '5173';
const SHOT = process.argv[3] || '';
const css = fs.existsSync('/tmp/claude-0/twbuild/out.css') ? fs.readFileSync('/tmp/claude-0/twbuild/out.css', 'utf8') : '';
// S378-shaped: long bridge, ISA-heavy, the household the full app flagged as a close call
const plans = {
  isaHeavy: { ageSelf: '52', retireSelf: '55', spend: '40000', pen: '350000', isa: '450000', gia: '60000', cash: '40000', statePensionSelf: '11976' },
  reference: { ageSelf: '62', retireSelf: '61', spend: '55000', pen: '900000', isa: '300000', gia: '600000', cash: '100000', statePensionSelf: '11976' }
};
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [name, plan] of Object.entries(plans)) {
    const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.route('https://cdn.tailwindcss.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.tailwind={config:{}};' }));
    await p.addInitScript(pl => { localStorage.setItem('rp_simple_v1', JSON.stringify(pl)); localStorage.setItem('rp_which_app', 'simple'); }, plan);
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(600);
    if (css) await p.addStyleTag({ content: css });
    const t0 = Date.now();
    await p.waitForFunction(() => /How it draws the money/.test(document.body.innerText), null, { timeout: 120000 });
    const t = await p.evaluate(() => document.body.innerText);
    console.log(`${name}: answered in ${((Date.now() - t0) / 1000).toFixed(1)}s; close call: ${/Close call\./.test(t)}`);
    ok(`${name}: policy line names a policy`, /How it draws the money: \w/.test(t));
    if (/Close call\./.test(t)) console.log('  ', (t.match(/Close call\.[^\n]*/) || [''])[0].slice(0, 220));
    // Monte Carlo view: band and sample paths present
    await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Monte Carlo/.test(b.textContent)); if (x) x.click(); });
    await p.waitForTimeout(800);
    const svg = await p.evaluate(() => {
      const s = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
      if (!s) return null;
      const paths = [...s.querySelectorAll('path')];
      const xs = (d) => [...d.matchAll(/[ML]\s*(-?[\d.]+)/g)].map(m => Number(m[1]));
      const span = (d) => { const v = xs(d); return v.length ? Math.max(...v) - Math.min(...v) : 0; };
      // the band is a filled <polygon>; its x-extent is the first number of each point pair
      const polySpan = (pts) => { const v = pts.trim().split(/\s+/).map(pt => Number(pt.split(',')[0])).filter(Number.isFinite); return v.length ? Math.max(...v) - Math.min(...v) : 0; };
      const bands = [...s.querySelectorAll('polygon')].filter(x => getComputedStyle(x).fill !== 'none');
      return { w: s.getBoundingClientRect().width, n: paths.length, long: paths.filter(x => (x.getAttribute('d') || '').length > 200).length, band: Math.max(0, ...bands.map(x => polySpan(x.getAttribute('points') || ''))) };
    });
    ok(`${name}: Monte Carlo band spans the chart`, svg && svg.band > 0.6 * svg.w, svg ? `${Math.round(svg.band)}px of ${Math.round(svg.w)}px` : 'no svg');
    ok(`${name}: sample paths are drawn`, svg && svg.long >= 10, svg ? `${svg.long} long paths of ${svg.n}` : 'no svg');
    ok(`${name}: no page errors`, errs.length === 0, errs.join(' | '));
    if (SHOT) await p.screenshot({ path: `${SHOT}/simple-${name}.png`, fullPage: false });
    await p.close();
  }
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
