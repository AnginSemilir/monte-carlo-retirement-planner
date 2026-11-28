/*
 * THE BUILT SITE, NOT THE DEV SERVER.
 *
 * Everything else in here drives `vite dev`, where the Tailwind CDN used to paper over a missing
 * stylesheet and the edit endpoint exists. This one serves dist/ and checks what a visitor actually
 * gets: styling from the built stylesheet, no third-party requests, no authoring tools, the planner
 * working, its solve's worker running, and the sharing metadata a link preview reads. (The classic planner and the Simple
 * page, which this opened until D155 retired them on 28 Nov 2026, are gone; the new planner is the only one.)
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
    // the first heading on screen (the page's h1 is for screen readers, hidden by the built CSS's sr-only)
    const el = [...document.querySelectorAll('h1, h2')].find(x => x.textContent.trim() && x.getBoundingClientRect().width > 2);
    const sr = [...document.querySelectorAll('h1, h2')].find(x => x.classList.contains('sr-only'));
    const cs = el && getComputedStyle(el);
    const body = getComputedStyle(document.body);
    // the root carries the page background so overscroll and short pages do not show browser white
    const root = getComputedStyle(document.documentElement);
    const painted = [root.backgroundColor, body.backgroundColor].find(c => c && !/rgba\(0, 0, 0, 0\)/.test(c));
    // the weight its own class asks for: a bare heading is the browser's 700, and Tailwind's base sets 400 until a utility says
    const asked = el && (/(?:^| )font-(medium|semibold|bold)(?: |$)/.exec(el.className) || [])[1];
    return el ? { text: el.textContent.trim().slice(0, 30), weight: cs.fontWeight, want: { medium: 500, semibold: 600, bold: 700 }[asked] || null,
      family: cs.fontFamily.slice(0, 30), bg: painted || 'transparent', srHidden: sr ? sr.getBoundingClientRect().width <= 1 : true } : null;
  });
  ok('headings are styled by the built CSS', !!styled && (styled.want ? Number(styled.weight) === styled.want : Number(styled.weight) >= 600) && styled.srHidden,
    styled ? `"${styled.text}": weight ${styled.weight}${styled.want ? ` (its class ${styled.want})` : ''}, ${styled.family}; the screen readers' heading ${styled.srHidden ? 'hidden' : 'SHOWN'}` : 'no heading');
  ok('the page has a painted background', !!styled && styled.bg !== 'transparent', styled && styled.bg);

  ok('no authoring tools shipped', await p.evaluate(() => ![...document.querySelectorAll('button')].some(x => /Edit page/i.test(x.textContent))));
  const meta = await p.evaluate(() => ({
    title: document.title,
    desc: document.querySelector('meta[name="description"]')?.content || '',
    og: document.querySelector('meta[property="og:title"]')?.content || ''
  }));
  ok('the tab and link preview are named', /Can I Retire/i.test(meta.title) && meta.desc.length > 60 && !!meta.og, `${meta.title} | ${meta.desc.slice(0, 40)}…`);
  ok('the footer states what this is', await p.evaluate(() => /not financial advice/i.test(document.body.innerText) && /stays in this browser/i.test(document.body.innerText)));

  // the planner runs: a fresh visitor lands on its four places, and a plan handed over is solved in its worker, the one thing
  // a static host can break (the worker's chunk, its module type, its isolation), the solve reporting its progress from there
  const places = await p.evaluate(() => [...document.querySelectorAll('[data-tabbar] button')].map(b => b.textContent.trim()));
  ok('the planner renders its four places', JSON.stringify(places) === JSON.stringify(['Your plan', 'You', 'What if', 'Details']), places.join(', '));
  await p.evaluate(() => {
    localStorage.setItem('rp_plan_full_v28', JSON.stringify({
      demographics: { planningMode: 'single', currentAgeSelf: 60, retireAgeSelf: 62, salarySelf: 40000, employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976, terminalAge: 92 },
      spending: { targetSpend: 36000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
      accounts: [{ id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 500000, contrib: 0, growth: 0, risk: 'High Risk' },
        { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 150000, contrib: 0, growth: 0, risk: 'Medium/High Risk' },
        { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 40000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
      otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' } }));
  });
  await p.reload({ waitUntil: 'networkidle' });
  const t0 = Date.now();
  const barOf = () => p.evaluate(() => { const el = document.querySelector('[data-solve-status]'); const bar = el && el.querySelector('[style*="width"]'); return { solve: el ? el.dataset.solveState : null, pct: bar ? parseFloat(bar.style.width) : null }; });
  await p.waitForFunction(() => { const el = document.querySelector('[data-solve-status]'); const bar = el && el.querySelector('[style*="width"]'); return !!bar && parseFloat(bar.style.width) > 0; }, null, { timeout: 120000 }).catch(() => {});
  const first = await barOf();
  await p.waitForTimeout(6000);
  const later = await barOf();
  ok('the solve runs in its worker in the built site, reporting its progress', first.solve === 'solving' && first.pct > 0 && (later.solve !== 'solving' || later.pct > first.pct),
    `${first.solve} at ${first.pct}% after ${((Date.now() - t0) / 1000 - 6).toFixed(1)}s, then ${later.solve} at ${later.pct}%`);
  if (SHOT) await p.screenshot({ path: `${SHOT}/production-planner.png` });

  ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
