// EXPLORATORY probe (D155 fix round; run: node research/solver/d155-fixround/<name>.cjs <port>): solver-planner check 17's word list, as widened, over every place with Details' full
// documentation open, on a build at PORT (the same reading check 17 makes: each place's textContent)
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2];
const src = require('fs').readFileSync(require('path').join(__dirname, '../../ui-harnesses/solver-planner-ui.cjs'), 'utf8');
const WORDS = eval(/const TOURNAMENT_WORDS = (\[.*\]);/.exec(src)[1]);
const plan = { demographics: { planningMode: 'single', currentAgeSelf: 61, retireAgeSelf: 61, salarySelf: 0, employmentSelf: 'employed', statePensionAge: 67, privatePensionAge: 57, statePensionSelf: 11976, terminalAge: 95 },
  spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [{ id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 400000, contrib: 0, growth: 3, risk: 'High Risk' }], otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); }, plan);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
  const go = n => p.evaluate(x => { const b = [...document.querySelectorAll('[data-tabbar] button')].find(t => t.textContent.trim() === x); if (b) b.click(); }, n);
  await go('Details'); await p.waitForTimeout(1200);
  await p.click('[data-place="details"] [data-docs-open]').catch(() => {});
  await p.waitForSelector('[data-place="details"] #doc-solver', { timeout: 30000 }).catch(() => {});
  const found = [];
  for (const [id, label] of [['plan', 'Your plan'], ['you', 'You'], ['whatif', 'What if'], ['details', 'Details']]) {
    await go(label); await p.waitForTimeout(1200);
    const text = await p.evaluate(i => { const el = document.querySelector(`[data-place="${i}"]`); return el ? el.textContent : ''; }, id);
    for (const w of WORDS) for (const m of text.matchAll(new RegExp(w.source, w.flags.includes('g') ? w.flags : w.flags + 'g'))) found.push(`${id}: "${text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 25).replace(/\s+/g, ' ')}"`);
  }
  console.log(`check 17's words on :${PORT}: ${found.length} found${found.length ? '\n  ' + found.join('\n  ') : ''}`);
  await b.close();
})();
