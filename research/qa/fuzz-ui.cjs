/*
 * FUZZ: RANDOM INPUT INTO EVERY FIELD, RANDOM TAPS ON EVERY BUTTON, AND DOES THE PAGE STAY UP.
 *
 * The fifteen harnesses walk the happy path with sensible figures. This walks an unreasonable one: it
 * picks a visible control at random, types something from a pool that includes blanks, negatives,
 * strings and absurd magnitudes (or clicks it, or picks a random option), and watches for:
 *
 *   - an uncaught page error or an unhandled rejection (there is no error boundary, so one of these on
 *     a render is a blank page)
 *   - console.error output that is not a known React dev warning
 *   - the root going empty, or the app's own text disappearing
 *   - NaN, "undefined" or "null" surfacing in the visible text
 *
 * A seed makes a run reproducible. Import, file pickers and the crossover are left alone: the first
 * two need a file, the third is a page change that the crossover harness already covers.
 *
 * Run: node research/qa/fuzz-ui.cjs [port] [actionsPerConfig] [seed]
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || 4173;
const N = Number(process.argv[3] || 300);
let seed = Number(process.argv[4] || 20260918);
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const POOL = ['', '0', '-1', '1e9', 'abc', '12,345', '99999999', '3.5', ' ', '£5,000', '150', '2030-01-01', '-500000', '0.0001', '1000000000000'];
const SKIP = /Import|Clear all inputs|Export|Delete|Remove|Full planner|Simple planner|Download|Stop/i;
const simple = { ageSelf: 45, retireSelf: 62, terminalAge: 95, spend: 40000, salary: 70000, pen: 300000, isa: 80000, penC: 12000, isaC: 6000 };

const problems = [];
const note = (cfg, kind, detail, action) => { problems.push({ cfg, kind, detail: String(detail).slice(0, 220), action }); console.log(`  !! ${cfg} ${kind}: ${String(detail).slice(0, 160)}   [after ${action}]`); };

async function fuzz(b, cfgName, opts, init) {
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  let last = 'load';
  const recent = [];   // the last actions before a crash, so a fuzz find can be replayed by hand
  p.on('pageerror', e => { note(cfgName, 'pageerror', e.message, last); console.log('  recent actions:\n    ' + recent.slice(-14).join('\n    ')); if (process.env.FUZZ_STOP) process.exit(2); });
  p.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/ERR_CERT|net::|favicon|fonts\.g/.test(t)) return;
    note(cfgName, 'console.error', t, last);
  });
  if (init) await p.addInitScript(init.fn, init.arg);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  const t0 = Date.now();
  let acted = 0;
  for (let i = 0; i < N; i++) {
    const action = await p.evaluate(([POOL, SKIP_SRC, r1, r2, r3]) => {
      const SKIP = new RegExp(SKIP_SRC, 'i');
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.disabled && !el.closest('[data-dev-chrome]'); };
      const inputs = [...document.querySelectorAll('input:not([type=file]):not([type=checkbox]):not([type=radio]), textarea')].filter(vis);
      const selects = [...document.querySelectorAll('select')].filter(vis);
      const buttons = [...document.querySelectorAll('button, [role=button], summary, input[type=checkbox]')].filter(vis).filter(b => !SKIP.test(b.textContent || '') && !SKIP.test(b.getAttribute('aria-label') || ''));
      const kind = r1 < 0.55 && inputs.length ? 'input' : r1 < 0.7 && selects.length ? 'select' : buttons.length ? 'button' : inputs.length ? 'input' : 'none';
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      if (kind === 'input') {
        const el = inputs[Math.floor(r2 * inputs.length)];
        const v = el.type === 'range' ? String(Math.round(r3 * 100)) : POOL[Math.floor(r3 * POOL.length)];
        el.focus(); setter.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur();
        return `type "${v}" into ${el.getAttribute('aria-label') || el.placeholder || el.name || el.type}`;
      }
      if (kind === 'select') {
        const el = selects[Math.floor(r2 * selects.length)];
        el.selectedIndex = Math.floor(r3 * el.options.length);
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return `select "${el.value}" in ${el.getAttribute('aria-label') || 'select'}`;
      }
      if (kind === 'button') {
        const el = buttons[Math.floor(r2 * buttons.length)];
        const label = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30);
        el.click();
        return `click "${label}"`;
      }
      return 'none';
    }, [POOL, SKIP.source, rnd(), rnd(), rnd()]);
    last = action;
    recent.push(action);
    acted++;
    await p.waitForTimeout(60 + Math.floor(rnd() * 120));
    if (i % 25 === 24) {
      // is the app still standing?
      const state = await p.evaluate(() => {
        const root = document.getElementById('root');
        const text = document.body.innerText || '';
        const bad = (text.match(/\bNaN\b|\bundefined\b|\bnull\b|£NaN|Infinity/g) || []).slice(0, 5);
        return { children: root ? root.childElementCount : -1, textLen: text.length, bad, dialogs: document.querySelectorAll('[role=dialog]').length };
      });
      if (state.children <= 0 || state.textLen < 80) note(cfgName, 'blank page', `${state.children} root children, ${state.textLen} chars of text`, action);
      if (state.bad.length) note(cfgName, 'bad text', state.bad.join(' | '), action);
      // press Escape so a stuck overlay does not swallow the rest of the run
      await p.keyboard.press('Escape');
    }
  }
  console.log(`  ${cfgName}: ${acted} actions in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await ctx.close();
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const phone = { ...devices['iPhone 13'] };
  const desk = { viewport: { width: 1366, height: 768 } };
  const simpleInit = { fn: (s) => { localStorage.setItem('rp_which_app', 'simple'); localStorage.setItem('rp_simple_v1', JSON.stringify(s)); }, arg: simple };
  console.log(`fuzz: ${N} actions per configuration, seed ${process.argv[4] || 20260918}`);
  const only = process.env.FUZZ_ONLY;
  if (!only || only === 'full/desktop') await fuzz(b, 'full/desktop', desk, null);
  if (!only || only === 'full/phone') await fuzz(b, 'full/phone', phone, null);
  if (!only || only === 'simple/desktop') await fuzz(b, 'simple/desktop', desk, simpleInit);
  if (!only || only === 'simple/phone') await fuzz(b, 'simple/phone', phone, simpleInit);
  await b.close();
  console.log(`\n=========== ${problems.length} problem(s) ===========`);
  const byKind = {};
  for (const pr of problems) { const k = `${pr.cfg} ${pr.kind}: ${pr.detail.slice(0, 90)}`; byKind[k] = (byKind[k] || 0) + 1; }
  Object.entries(byKind).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`${String(n).padStart(4)}  ${k}`));
  require('fs').writeFileSync('research/qa/fuzz-results.json', JSON.stringify(problems, null, 2));
})();
