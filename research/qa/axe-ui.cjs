/*
 * ACCESSIBILITY, MEASURED: axe-core over every tab, at both widths, in all three themes.
 *
 * The harnesses check contrast at 3:1 and touch targets at 44px, which are the two rules that were
 * failing when they were written. This runs the whole WCAG 2.x A/AA rule set instead and reports what
 * it finds, grouped by rule, with one example selector each - so a finding can be located rather than
 * just counted.
 *
 * Run: node research/qa/axe-ui.cjs [port]   (axe.min.js from /tmp/node_modules/axe-core)
 */
const fs = require('fs');
const { chromium, devices } = require('/tmp/node_modules/playwright');
const AXE = fs.readFileSync('/tmp/node_modules/axe-core/axe.min.js', 'utf8');
const PORT = process.argv[2] || 4173;
const THEMES = ['light', 'dark', 'sepia'];
const FULL_TABS = ['Start Here', 'Plan Inputs', 'Config & Assumptions', 'Projection', 'Strategy', 'Historical Backtest', 'Audit Data Table', 'Documentation'];
const SIMPLE_TABS = ['Inputs', 'Chart', 'Figures'];
const simple = { ageSelf: 45, retireSelf: 62, terminalAge: 95, spend: 40000, salary: 70000, pen: 300000, isa: 80000, penC: 12000, isaC: 6000 };

const totals = new Map();   // rule id -> { impact, count, where: Set, help }
const add = (ctxLabel, v) => {
  const key = v.id;
  const cur = totals.get(key) || { impact: v.impact, count: 0, where: new Set(), help: v.help, example: v.nodes[0] && v.nodes[0].target.join(' ') };
  cur.count += v.nodes.length;
  cur.where.add(ctxLabel);
  totals.set(key, cur);
};

async function scan(p, label) {
  await p.evaluate(AXE);
  const r = await p.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target })) }));
  });
  r.forEach(v => add(label, v));
  const n = r.reduce((s, v) => s + v.nodes.length, 0);
  console.log(`  ${label}: ${r.length} rule(s), ${n} node(s)${r.length ? ' - ' + r.map(v => `${v.id}(${v.nodes.length})`).join(', ') : ''}`);
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const theme of THEMES) {
    for (const [devName, opts] of [['phone', { ...devices['iPhone 13'] }], ['desktop', { viewport: { width: 1366, height: 768 } }]]) {
      // the full planner
      {
        const ctx = await b.newContext(opts);
        const p = await ctx.newPage();
        await p.addInitScript(t => localStorage.setItem('rp_theme_v1', t), theme);
        await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(1500);
        console.log(`\n== full planner · ${theme} · ${devName} ==`);
        for (const tab of FULL_TABS) {
          const went = await p.evaluate((t) => { const x = [...document.querySelectorAll('[data-tabbar] button, button')].find(b => b.textContent.trim() === t); if (x) { x.click(); return true; } return false; }, tab);
          await p.waitForTimeout(600);
          if (!went) { console.log(`  ${tab}: not reachable`); continue; }
          await scan(p, `full/${theme}/${devName}/${tab}`);
        }
        await ctx.close();
      }
      // the simple planner
      {
        const ctx = await b.newContext(opts);
        const p = await ctx.newPage();
        await p.addInitScript(([t, s]) => { localStorage.setItem('rp_theme_v1', t); localStorage.setItem('rp_which_app', 'simple'); localStorage.setItem('rp_simple_v1', JSON.stringify(s)); }, [theme, simple]);
        await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(2500);
        console.log(`== simple planner · ${theme} · ${devName} ==`);
        if (devName === 'phone') {
          for (const tab of SIMPLE_TABS) {
            await p.evaluate((t) => { const x = [...document.querySelectorAll('[data-simple-tabs] button')].find(b => b.textContent.trim() === t); if (x) x.click(); }, tab);
            await p.waitForTimeout(600);
            await scan(p, `simple/${theme}/phone/${tab}`);
          }
        } else {
          await scan(p, `simple/${theme}/desktop`);
        }
        await ctx.close();
      }
    }
  }
  await b.close();

  console.log('\n\n=========== BY RULE ===========');
  const rows = [...totals.entries()].sort((a, b) => ({ critical: 0, serious: 1, moderate: 2, minor: 3 }[a[1].impact] - { critical: 0, serious: 1, moderate: 2, minor: 3 }[b[1].impact]) || b[1].count - a[1].count);
  for (const [id, t] of rows) {
    console.log(`${t.impact.padEnd(9)} ${id.padEnd(28)} ${String(t.count).padStart(5)} nodes  in ${t.where.size} screen(s)   ${t.help}`);
    console.log(`          e.g. ${t.example}`);
  }
  fs.writeFileSync('research/qa/axe-results.json', JSON.stringify(rows.map(([id, t]) => ({ id, ...t, where: [...t.where] })), null, 2));
})();
