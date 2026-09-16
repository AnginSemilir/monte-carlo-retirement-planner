/*
 * THE BUILT SITE, NOT THE DEV SERVER.
 *
 * Everything else in here drives `vite dev`, where the Tailwind CDN used to paper over a missing
 * stylesheet and the edit endpoint exists. This one serves dist/ and checks what a visitor actually
 * gets: styling from the built stylesheet, no third-party requests, no authoring tools, both apps
 * working, and the sharing metadata a link preview reads.
 *
 * Run:  npm run build && npx serve -s dist -l 4173 && node production-build-ui.cjs 4173 [shotDir]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '4173';
const SHOT = process.argv[3] || '';
let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // every request the page makes, so a leftover CDN or a font host shows up as itself
  const hosts = new Set();
  p.on('request', r => { try { hosts.add(new URL(r.url()).host); } catch { /* data: */ } });
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);

  ok('no Tailwind CDN request', ![...hosts].some(h => /cdn\.tailwindcss/.test(h)), [...hosts].join(', '));
  ok('a built stylesheet is linked', await p.evaluate(() => [...document.styleSheets].some(s => (s.href || '').includes('/assets/'))));
  // the real question: did the utilities actually apply?
  const styled = await p.evaluate(() => {
    const el = [...document.querySelectorAll('h1, h2')].find(x => x.textContent.trim());
    const cs = el && getComputedStyle(el);
    const body = getComputedStyle(document.body);
    // the root carries the page background so overscroll and short pages do not show browser white
    const root = getComputedStyle(document.documentElement);
    const painted = [root.backgroundColor, body.backgroundColor].find(c => c && !/rgba\(0, 0, 0, 0\)/.test(c));
    return el ? { weight: cs.fontWeight, family: cs.fontFamily.slice(0, 30), bg: painted || 'transparent' } : null;
  });
  ok('headings are styled by the built CSS', !!styled && Number(styled.weight) >= 600, styled ? `weight ${styled.weight}, ${styled.family}` : 'no heading');
  ok('the page has a painted background', !!styled && styled.bg !== 'transparent', styled && styled.bg);

  ok('no authoring tools shipped', await p.evaluate(() => ![...document.querySelectorAll('button')].some(x => /Edit page/i.test(x.textContent))));
  const meta = await p.evaluate(() => ({
    title: document.title,
    desc: document.querySelector('meta[name="description"]')?.content || '',
    og: document.querySelector('meta[property="og:title"]')?.content || ''
  }));
  ok('the tab and link preview are named', /Can I Retire/i.test(meta.title) && meta.desc.length > 60 && !!meta.og, `${meta.title} | ${meta.desc.slice(0, 40)}…`);
  ok('the footer states what this is', await p.evaluate(() => /nothing is advice/i.test(document.body.innerText)));

  // both apps run: the full one lands on Start Here, the simple one computes an answer
  ok('the full planner renders its tabs', await p.evaluate(() => /Plan Inputs/.test(document.body.innerText)));
  await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Open the simple version/.test(b.textContent)); if (x) x.click(); });
  await p.waitForTimeout(800);
  ok('the simple page opens', await p.evaluate(() => /Can I retire\?/i.test(document.body.innerText)));
  // and its worker - the one thing a static host can break - actually runs
  await p.evaluate(() => {
    localStorage.setItem('rp_simple_v1', JSON.stringify({ ageSelf: '62', retireSelf: '63', spend: '40000', pen: '600000', isa: '200000', gia: '0', cash: '50000', statePensionSelf: '11976' }));
  });
  await p.reload({ waitUntil: 'networkidle' });
  const t0 = Date.now();
  await p.waitForFunction(() => /How it draws the money/.test(document.body.innerText), null, { timeout: 120000 }).catch(() => {});
  ok('the worker answers in the built site', await p.evaluate(() => /How it draws the money/.test(document.body.innerText)), `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (SHOT) await p.screenshot({ path: `${SHOT}/production-simple.png` });

  ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
