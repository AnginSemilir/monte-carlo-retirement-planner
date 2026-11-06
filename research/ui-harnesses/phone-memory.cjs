/*
 * THE PHONE'S MEMORY, MEASURED IN THE HARNESS'S BROWSER (Phase 11 item 2; D59: no solve on the maintainer's phone). The
 * launch plan: "The phone holds the solve on show, and for a locked position its base (F5), after step P's cuts." This reads
 * how much that is, at the app's own settings (45 wealth points, the real candidate), in Chromium with a Pixel 7's screen:
 * the page and its workers' memory (performance.measureUserAgentSpecificMemory, which the page's cross-origin isolation
 * allows; taken after a garbage collection, so what is held), after the solve on show (the dial at its default), after a
 * locked position (the dial at 3: the solve on show and its base), and back at the default. Beside each: the time to solve
 * and fill in, what the status line said on the way (a base solved again says "at the Low setting first"), the solves the
 * store keeps on this device (src/solverCache.js) and the site's storage used. A measurement, not a gate (EXPLORATORY): a
 * phone's limit cannot be modelled here, and D59 skips the device run. Library households only (never anybody's own plan).
 * A browser profile of its own by default, as a phone's browser keeps one; --private runs in a fresh context, as a private
 * window does (its storage quota about 1GB here).
 *   node research/ui-harnesses/phone-memory.cjs [--private] [household ...]      (default S116; builds the switch-on site at
 *                                                                                  the app's own settings, serves it on 4199)
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const { execFileSync, spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const ROOT = join(__dirname, '../..'), VITE = join(ROOT, 'node_modules/vite/bin/vite.js'), PORT = 4199;
const argv = process.argv.slice(2), PRIVATE = argv.includes('--private');
const IDS = argv.filter(a => !a.startsWith('--')).length ? argv.filter(a => !a.startsWith('--')) : ['S116'];
const MB = n => `${(n / 1048576).toFixed(1)}MB`;

(async () => {
  const OUT = mkdtempSync(join(tmpdir(), 'phone-memory-'));
  // the switch on at the app's own settings: SOLVER_PREVIEW_OPTS unset, so the page passes the solver no options
  const env = { ...process.env, SOLVER_PREVIEW: '1' };
  delete env.SOLVER_PREVIEW_OPTS;
  execFileSync(process.execPath, [VITE, 'build', '--outDir', OUT, '--emptyOutDir', '--logLevel', 'error'], { cwd: ROOT, stdio: 'inherit', env });
  const server = spawn(process.execPath, [VITE, 'preview', '--outDir', OUT, '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));
  const { buildScenarios } = await import(pathToFileURL(join(ROOT, 'research/policy-study/scenarios.mjs')).href);
  const all = buildScenarios();
  const b = PRIVATE ? await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }) : null;
  const profiles = [];
  try {
    console.log(`Chromium, a Pixel 7's screen, the app's own settings (45 wealth points), ${PRIVATE ? 'a fresh context (a private window)' : 'a browser profile of its own'}`);
    for (const id of IDS) {
      const plan = all.find(s => s.id === id).plan;
      let ctx;
      if (PRIVATE) ctx = await b.newContext({ ...devices['Pixel 7'] });
      else { const dir = mkdtempSync(join(tmpdir(), 'phone-memory-profile-')); profiles.push(dir); ctx = await chromium.launchPersistentContext(dir, { ...devices['Pixel 7'], executablePath: '/opt/pw-browsers/chromium' }); }
      const p = await ctx.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.addInitScript(([pl]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); localStorage.setItem('rp_planner', 'new'); sessionStorage.setItem('seeded', '1'); } }, [plan]);
      await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
      const iso = await p.evaluate(() => self.crossOriginIsolated);
      // after a garbage collection (the API waits for one, at most about 20 seconds), so what the page and its workers hold
      const mem = async () => p.evaluate(async () => { if (!performance.measureUserAgentSpecificMemory) return null; const m = await performance.measureUserAgentSpecificMemory(); const by = {}; for (const x of m.breakdown) { const k = (x.attribution && x.attribution[0] && x.attribution[0].scope) || 'other'; by[k] = (by[k] || 0) + x.bytes; } return { total: m.bytes, by }; });
      // the store's index (src/solverCache.js: the small 'index' entry beside the solves) and the site's storage used
      const store = async () => p.evaluate(async () => {
        const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : {};
        const ix = await new Promise(res => { const q = indexedDB.open('rp-solver', 1); q.onupgradeneeded = () => q.result.createObjectStore('solves'); q.onerror = () => res(null); q.onsuccess = () => { const db = q.result; try { const g = db.transaction('solves', 'readonly').objectStore('solves').get('index'); g.onsuccess = () => { res(g.result || []); db.close(); }; g.onerror = () => { res(null); db.close(); }; } catch { res(null); db.close(); } }; });
        return { usage: est.usage || 0, quota: est.quota || 0, ix: (ix || []).map(e => ({ key: String(e.key).slice(0, 8), bytes: e.bytes })) };
      });
      // the status line's words while it works, each once in order
      const said = [];
      let t0 = Date.now();
      const watch = setInterval(async () => { try { const t = await p.evaluate(() => { const s = document.querySelector('[data-solve-status]'); return s ? s.textContent.replace(/\s+/g, ' ').replace(/\d+%/, 'N%').trim() : ''; }); if (t && (!said.length || said[said.length - 1].t !== t)) said.push({ t, at: Math.round((Date.now() - t0) / 1000) }); } catch { /* the page is busy */ } }, 2000);
      const done = async ms => { const t0 = Date.now(); await p.waitForSelector('[data-plan-answer="done"]', { timeout: ms }); return Date.now() - t0; };
      // the dial is in the levers sheet on a phone: open it, choose, close it; then the card's "Solve again" (a phone asks)
      const dial = async v => {
        if (!(await p.$(`[data-solver-choice="cuts"] [data-value="${v}"]:visible`))) { await p.click('[data-open-levers]'); await p.waitForTimeout(800); }
        await p.click(`[data-solver-choice="cuts"] [data-value="${v}"]`);
        await p.waitForTimeout(600);
        await p.keyboard.press('Escape');
        await p.waitForTimeout(800);
      };
      const ask = async () => { await p.click('[data-plan-answer] [data-solve-request]', { timeout: 120000 }); t0 = Date.now(); };
      const rows = [];
      const step = async (label, t) => { await p.waitForTimeout(3000); const words = said.splice(0); rows.push([label, await mem(), t, await store(), words]); t0 = Date.now(); };
      await step('before the solve', 0);
      await ask();
      await step('the solve on show (the dial at its default)', await done(3600000));
      await dial(3);
      await ask();
      await step('a locked position (the dial at 3: the solve on show and its base)', await done(3600000));
      await dial(1);
      // back at the default the solve is the one stored on this device: the phone still asks before it restores it
      await p.waitForTimeout(3000);
      if (await p.$('[data-plan-answer] [data-solve-request]')) await ask();
      await step('back at the default', await done(3600000));
      clearInterval(watch);
      console.log(`\n${id} (cross-origin isolated ${iso}):`);
      for (const [label, m, t, st, words] of rows) {
        console.log(`  ${label}: ${m ? `${MB(m.total)} (${Object.entries(m.by).map(([k, v]) => `${k} ${MB(v)}`).join(', ')})` : 'not measurable here'}${t ? `; solved and filled in ${(t / 1000).toFixed(0)}s` : ''}`);
        if (words.length) console.log(`    the status line (seconds from the request): ${words.map(w => `${w.at}s "${w.t}"`).join(' > ')}`);
        console.log(`    the store: ${st.ix.length ? st.ix.map(e => `${e.key} ${MB(e.bytes)}`).join(', ') : 'nothing'}; the site's storage ${MB(st.usage)} of ${MB(st.quota)}`);
      }
      console.log(`  page errors: ${errs.length ? errs.slice(0, 2).join(' | ') : 'none'}`);
      await ctx.close();
    }
  } finally { if (b) await b.close(); server.kill(); rmSync(OUT, { recursive: true, force: true }); for (const d of profiles) rmSync(d, { recursive: true, force: true }); }
})().catch(e => { console.log('threw', e && e.stack); process.exit(1); });
