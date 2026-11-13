/*
 * HOW LONG BEFORE THE PAGE IS THERE, ON A PHONE.
 *
 * Bytes are a proxy; this measures the thing itself. Pixel 7 at 4x CPU throttle and a slow-4G network
 * profile, cold cache, measuring first contentful paint and the point at which the page has actually
 * rendered its own content rather than an empty shell.
 *
 * Measured on the build before the loading work, three runs, median:
 *
 *   content on screen        2,203ms        after: 2,059ms
 *   javascript over the wire 214KB          after: 198KB
 *
 * Modest, and worth saying so plainly: about 145ms and 16KB. Most of what remains is the planner's own
 * interface, which is one 12,000-line module and cannot be split without breaking it up first. The next
 * real win is the Documentation tab, around 360 lines of prose that almost nobody opens on a first visit;
 * it was left alone because extracting it means passing a few dozen values across a new boundary, which
 * is a refactor with its own regression risk rather than a build setting.
 *
 * The three changes it measures are: importing the four d3 functions the app uses rather than the
 * thirty-package meta-bundle, which also came out of both workers; loading the streamlined page on
 * demand, since only one of the two pages is ever on screen; and nothing else - no functionality moved
 * or was deferred behind a click.
 *
 * Run: node load-perf-ui.cjs [port]
 */
const { chromium, devices } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5173';
/*
 * Measured by this harness on the build before the loading work, three runs, median.
 *
 * First contentful paint is deliberately NOT among these. It reports reliably on an unthrottled run and
 * came back empty on every throttled one, and a metric that reads null half the time is worse than no
 * metric: it invites a threshold nobody can trust. What is measured instead is the thing that matters to
 * somebody holding the phone - how long until the app's own content is on the screen.
 */
const BEFORE = { content: 2203, js: 214 };
/*
 * JS_CEILING, and why it is not BEFORE.js any more.
 *
 * "Smaller than the build before the loading work" was the right assertion on the day and a worsening
 * one ever since: 214KB is a fact about a build from months ago, the page has gained real features since
 * (the grid, the dashboard, the phone deck), and the margin had worn down to about a kilobyte. The last
 * two paragraphs of help text each failed this, which is a test telling an author to write less prose
 * rather than telling anybody about loading.
 *
 * What is worth guarding is a REGRESSION, so the ceiling is today's measured figure plus headroom:
 * index.js is 212.8KB gzipped, everything else is a lazy chunk. 220 catches a dependency accidentally
 * pulled into the entry - the failure this exists for - and does not fail on a sentence. Re-measure and
 * move it deliberately when it is approached again; the 214 above stays as the historical mark, still
 * printed in the summary line.
 */
/*
 * RAISED TO 226 on 21 Sep 2026: the solver's bridge (plan Phase 3) put the table override, the tier
 * profiles and the sweep into the engine's year, and index.js went from 212.8KB to 221KB gzipped. That
 * is engine code the app will use, not a dependency, so the ceiling moves to the new figure plus the
 * same headroom. The solver itself stays a lazy chunk (Part C), and this line is where it is checked.
 */
/*
 * RAISED TO 228 on 3 Nov 2026, the maintainer's call (D57): Part C Phase 10's switch-on build read 229KB at B1's gate. Most of
 * that was the regression this exists for - App.jsx's static import of ledgerWords had pulled the solver's wording table into
 * the entry - fixed by loading it with the solved ledger (229 to 227). The last kilobyte is Phase 10's own switch-on code in
 * App.jsx (the solved ledger's toggle, the lazy cards' wiring, the spending beside survival); Phase 9 already sat at 226. The
 * byte count is deterministic, so the ceiling is the measured 227 plus one: the solver's cards stay lazy chunks, and a
 * dependency pulled into the entry still fails here.
 */
const JS_CEILING = 228;
/*
 * THE CLASSIC PLANNER ON A SWITCH-ON BUILD, 232 on 5 Nov 2026 (step U; D58 (2), the maintainer's line: "a classic run over
 * 228KB moves its ceiling to the measured figure plus one, up to 232KB"). On the site's own build (the switch off) the classic
 * planner is unchanged at 226KB and keeps the 228 above. On a switch-on build its first load carries the new planner's header,
 * its status strip's wiring and the places' names (LAYOUT.md section 11.2), the places themselves in chunks of their own: the
 * first measure read 236KB with What if, Details and their cards inline, and 231KB once they moved to src/PlannerCards.jsx,
 * the print sheet to src/solvedSheet.js and the strip to its own chunk, then 232KB with Details' <main> drawn by App.jsx again (LAYOUT.md
 * section 10). The byte count is deterministic. The measured figure plus one would be 233, past D58's limit, so the ceiling
 * is the limit itself, 232, with no headroom left: the next kilobyte on a switch-on build's first load goes to the
 * maintainer. A switch-on build is one where the opted-in runs below reach the new planner.
 *
 * 235 on 13 Nov 2026, the maintainer's ruling (D94 (2)): the first batch of the improvements read 234KB at B1's gate (233 on
 * 0e3511ea, 234 with the harvest ceiling; main's own build 232). The growth is the engine's own code in src/App.jsx: the
 * year in HMRC's order, relief on money paid into a pension, the pages naming the year's sweep, the ceiling on the year's
 * whole taxable income. So the measured figure plus one, and D58 (2)'s limit is amended: a later batch whose growth in
 * the first load is the engine's own code moves this the same way, the measured figure plus one with a dated note,
 * reported at its merge; growth of any other kind (a dependency, a screen's code in the entry) still stops for the
 * maintainer.
 */
const JS_CEILING_SWITCH_ON = 235;
/*
 * The byte count is the load-bearing assertion and the ceiling below is the looser one, on purpose. Three
 * runs of the same build spread about 100ms either way - 2,011 to 2,080 after, 2,105 to 2,225 before - so
 * a threshold placed between the two medians would fail on noise as often as on a regression. The bytes
 * are deterministic: 198KB against 214KB, every run.
 *
 * RAISED TO 2,600 after this machine drifted into the old line. Measured on the same commit the ceiling
 * was set for: 2,396ms and 2,413ms - straddling 2,400, so half the runs failed on nothing. The build
 * under test the same afternoon measured 2,422ms and 2,440ms, inside the same 50ms spread, which is
 * what says this is the runner rather than the page. The bytes are still the assertion that would catch
 * a real regression; this one is here to catch a page that has become several times slower, and 2,600
 * still does that.
 *
 * RAISED TO 2,950 after the same drift again, and this time it is not an inference. The work in flight
 * was the solver's reduced model, which no part of the app imports, so `vite build` on main and on the
 * branch produced byte-identical dist trees - one sha256 over both, 1,538,303 bytes each. The page the
 * harness loads was therefore literally the same bytes, and it measured 2,638 / 2,660 / 2,694 on main
 * and 2,694 / 2,722 / 2,753 on the branch: one population, 2,638 to 2,753, median about 2,695, against
 * a line at 2,600 that every run now crosses. 2,950 sits 200ms above the worst of them, nearly twice
 * the 115ms spread, and still catches a page that has become several times slower. If a future change
 * approaches this line, build both sides and compare the bundles before touching the number: identical
 * bytes mean the runner, and different bytes mean the page.
 *
 * RAISED TO 3,800 on 30 Oct, on the maintainer's call, after main and the branch failed it alike. The
 * build both sides rule, taken further: the very commit the 2,950 line was set on (d9b9491, measured 2,638
 * to 2,753 then) measured 2,966 to 3,006 on this machine, so the runner is about 12% slower. The page grew
 * too: alternated with the branch head, that commit ran about 270ms faster, and main ran the same as the
 * head (not bisected here; phone-perf's long tasks bisect to 969669a, the engine's tax on savings interest
 * and dividends). Alternated on one machine: main (d9d9b08) 3,104 to 3,155, the branch head 3,065 to 3,389,
 * the branch before Part C's solver plumbing 3,128 to 3,544: one population, 3,065 to 3,544. 3,800 sits about
 * 250ms above the worst of them, half the spread, and still catches a page that has become several times
 * slower.
 */
const CEILING = 3800;
/*
 * THE NEW PLANNER'S FIRST LOAD (step U, research/reviews/2026-11-03/LAYOUT.md section 11.2; D58 (2), the maintainer's line in the
 * launch plan's section 7a): opted in (rp_planner 'new'), a saved single plan until the answer card shows its first state, and
 * an empty plan until the quick start shows. Your plan's chunk loads by then, so it is above the entry's figure; its own
 * ceiling is its measured figure plus one, with a dated note. On the site's own build (the switch off) the new planner is not
 * there, and the run says so rather than measuring the classic planner twice.
 */
// 5 Nov 2026 (D58 (2)): measured 232KB for a saved plan and 233KB for an empty one (the quick start's chunk), so 234
// 13 Nov 2026 (D94 (2)): measured 234KB for a saved plan and 236KB for an empty one on the first batch of the improvements
// (the same engine code as the classic ceiling's note above), so 237
const PLANNER_JS_CEILING = 237;

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

async function measure(b, label, planner = null) {
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  if (planner) await page.addInitScript(([pl]) => { if (pl) localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); else localStorage.removeItem('rp_plan_full_v28'); localStorage.setItem('rp_which_app', 'full'); localStorage.setItem('rp_planner', 'new'); }, [planner.plan]);
  const bytes = { js: 0, css: 0, requests: 0 };
  page.on('response', async (r) => {
    const t = r.request().resourceType();
    if (t !== 'script' && t !== 'stylesheet') return;
    bytes.requests++;
    try { const buf = await r.body(); if (t === 'script') bytes.js += buf.length; else bytes.css += buf.length; } catch { /* redirect or aborted */ }
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  // slow 4G: the connection a phone actually has away from wifi
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const t0 = Date.now();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'commit' });
  // "there" means the app's own content, not an empty shell that has painted a background
  // opted in: the new planner's answer card or quick start; on a build without it (the site's), the classic planner, whose
  // full planner opens a saved plan on Plan Inputs with neither phrase below, so its tab bar with no place of the new
  // planner's counts too (the new planner draws its places with its tab bar, so that never ends its wait early)
  if (planner) await page.waitForFunction(() => !!document.querySelector('[data-plan-answer], [data-quick-start]') || (!!document.querySelector('[data-tabbar]') && !document.querySelector('[data-place]')) || /What each tab is for|Can I retire/i.test(document.body.innerText), null, { timeout: 120000 });
  else await page.waitForFunction(() => /What each tab is for|Can I retire/i.test(document.body.innerText), null, { timeout: 120000 });
  const content = Date.now() - t0;
  const opted = planner ? await page.evaluate(() => !!document.querySelector('[data-place]')) : null;
  // getEntriesByName misses it: the paint timeline is its own entry type, and asking for the name alone
  // returned null on every run while the paint had plainly happened.
  // What crossed the wire, which is what a phone waits for. page.on('response') hands back the DECODED
  // body, so counting that reports the uncompressed size and would read as a regression against any
  // figure quoted in gzip. The resource timeline knows the difference.
  const wire = await page.evaluate(() => {
    const js = performance.getEntriesByType('resource').filter(r => r.initiatorType === 'script' || /\.js(\?|$)/.test(r.name));
    return { transfer: js.reduce((t, r) => t + (r.transferSize || r.encodedBodySize || 0), 0), n: js.length };
  });
  await ctx.close();
  return { label, content, js: Math.round(wire.transfer / 1024), raw: Math.round(bytes.js / 1024), css: Math.round(bytes.css / 1024), requests: bytes.requests, opted };
}
// a single person's plan for the new planner's first load: round, made-up figures, as COUPLE's below (never anybody's plan)
const SINGLE = {
  demographics: { planningMode: 'single', currentAgeSelf: 61, retireAgeSelf: 61, statePensionAge: 67, privatePensionAge: 57, statePensionSelf: 11000, terminalAge: 95 },
  spending: { targetSpend: 40000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 500000, contrib: 0, growth: 0, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 150000, contrib: 0, growth: 0, risk: 'High Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' } };

/*
 * TYPING, WHICH IS THE OTHER HALF OF "FAST".
 *
 * Reported from a Chromebook: typing into Plan Inputs was laggy once a projection had been run. It was
 * laggy before one too. Every keystroke rewrote `plan`, and the whole engine chain hung off it directly -
 * resolveMpaa, buildContext and a full deterministic run, then the same again for the sandbox. Profiled
 * on a couple with eight wrappers, one keypress spent 130ms in stepYear and simulateDeterministic BEFORE
 * the character was painted.
 *
 * Measured here, unthrottled, as the time from keydown to the input showing the character:
 *
 *   before   101ms median on a fresh plan, 124ms after a run, spikes to 338ms
 *   after      4-10ms median
 *
 * The fix is useDeferredValue: the character is urgent, the projection behind it is not. This runs at 4x
 * CPU throttle, where the old code measured about 400ms a keystroke, so the ceiling catches a return to
 * doing the engine's work on the keypress rather than after it.
 */
const TYPE_CEILING = 60;
/*
 * AN INVENTED HOUSEHOLD, AND IT HAS TO STAY INVENTED.
 *
 * This fixture exists to make the typing measurement representative: a couple with eight accounts is
 * roughly the heaviest plan somebody types into, and the projection behind each keystroke is what the
 * ceiling below is guarding. What it must NOT be is anybody's real plan. This file is published in a
 * public repository, and salaries, balances and retirement ages are exactly the sort of thing that
 * reads as a test fixture to the person who wrote it and as a disclosure to everybody else - an
 * oddly precise balance is a particular giveaway, because nobody invents 32157.
 *
 * So every figure here is round and made up. Keep it that way: when this needs a different shape, edit
 * these numbers rather than pasting a plan out of the app.
 */
const COUPLE = {
  demographics: { planningMode: 'couple', currentAgeSelf: 40, currentAgePart: 38, retireAgeSelf: 60, retireAgePart: 60,
    salarySelf: 75000, salaryPart: 42000, employmentSelf: 'employed', employmentPart: 'employed',
    statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 12548, statePensionPart: 11000, terminalAge: 100 },
  spending: { targetSpend: 48000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'p1', owner: 'Myself', category: 'Pensions', balance: 90000, contrib: 15000, growth: 4, risk: 'High Risk' },
    { id: 'i1', owner: 'Myself', category: 'S&S ISAs', balance: 40000, contrib: 7000, growth: 0, risk: 'High Risk' },
    { id: 'g1', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 0, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'c1', owner: 'Myself', category: 'Cash Savings', balance: 5000, contrib: 3000, growth: 0, risk: 'Cash Equivalents' },
    { id: 'p2', owner: 'Partner', category: 'Pensions', balance: 35000, contrib: 6000, growth: 4, risk: 'High Risk' },
    { id: 'i2', owner: 'Partner', category: 'S&S ISAs', balance: 15000, contrib: 3000, growth: 0, risk: 'High Risk' },
    { id: 'g2', owner: 'Partner', category: 'Other Investments (e.g. GIA)', balance: 0, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'c2', owner: 'Partner', category: 'Cash Savings', balance: 2500, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' } };

async function typingLatency(b) {
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.addInitScript((pl) => {
    localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
    localStorage.setItem('rp_which_app', JSON.stringify('full'));
  }, COUPLE);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(4000);
  /* the money field for a salary: a plan field, not the scenario name box, so the whole engine chain
     depends on what is typed into it */
  const armed = await p.evaluate(() => {
    const i = [...document.querySelectorAll('input')].filter(x => x.offsetParent && x.type === 'text' && /[£,0-9]/.test(x.value))[0];
    if (!i) return false;
    i.focus();
    try { i.setSelectionRange(i.value.length, i.value.length); } catch (e) { /* number inputs refuse it */ }
    window.__lat = [];
    i.addEventListener('keydown', () => {
      const t0 = performance.now(); const before = i.value;
      const tick = () => { if (i.value !== before) window.__lat.push(Math.round(performance.now() - t0)); else requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    return true;
  });
  if (!armed) { await ctx.close(); return null; }
  for (const ch of '123456') await p.keyboard.type(ch, { delay: 400 });
  const lat = await p.evaluate(() => window.__lat || []);
  await ctx.close();
  if (!lat.length) return null;
  const s = [...lat].sort((x, y) => x - y);
  return { median: s[Math.floor(s.length / 2)], all: lat };
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  console.log('Pixel 7, 4x CPU throttle, slow 4G, cold cache');
  const runs = [];
  for (let i = 0; i < 3; i++) { const r = await measure(b, `run ${i + 1}`); runs.push(r); console.log(`  ${r.label}: content ${r.content}ms, ${r.js}KB`); }
  // Drop anything that did not report rather than letting a null sort into the middle and be read as
  // the median, which is how a missing measurement turns into a confident wrong number.
  const med = (k) => { const v = runs.map(r => r[k]).filter(x => typeof x === 'number').sort((a, c) => a - c); return v.length ? v[Math.floor(v.length / 2)] : null; };
  const content = med('content');
  console.log(`  median content on screen      ${content}ms (was ${BEFORE.content}ms)`);
  console.log(`  javascript over the wire      ${runs[0].js}KB (${runs[0].raw}KB decoded) over ${runs[0].requests} script/style requests`);
  // Thresholds sit above the measured figures with headroom, so this fails on a real regression rather
  // than on the noise between two runs of the same build.
  ok('the page is usable promptly on a throttled phone', content < CEILING, `${content}ms, ceiling ${CEILING}ms`);
  // the new planner's first load (step U): a saved single plan to the answer card's first state, an empty one to the quick start;
  // measured before the classic planner's bytes are judged, since whether it is there says which ceiling the classic run has
  console.log('the new planner\'s first load, opted in (rp_planner new), Pixel 7');
  const np = [await measure(b, 'a saved plan', { plan: SINGLE }), await measure(b, 'an empty plan', { plan: null })];
  for (const r of np) console.log(`  ${r.label}: content ${r.content}ms, ${r.js}KB${r.opted ? '' : ' (the new planner is not in this build: the switch is off)'}`);
  const switchOn = np.every(r => r.opted), jsCeiling = switchOn ? JS_CEILING_SWITCH_ON : JS_CEILING;
  ok('...and no more javascript than the ceiling allows', runs[0].js > 0 && runs[0].js <= jsCeiling,
    `${runs[0].js}KB over the wire, ceiling ${jsCeiling}KB (${switchOn ? 'a switch-on build, D58 (2) and D94 (2)' : 'the site\'s build'}; ${BEFORE.js}KB before the loading work)`);
  ok('...and the streamlined page is not among it', runs[0].requests <= 3, `${runs[0].requests} script/style requests`);
  if (switchOn) {
    const top = Math.max(...np.map(r => r.js));
    ok('the new planner\'s first load: no more javascript than its own ceiling allows', top > 0 && top <= PLANNER_JS_CEILING, `${np.map(r => `${r.label} ${r.js}KB`).join(', ')}, ceiling ${PLANNER_JS_CEILING}KB`);
  } else console.log('  not measured against its ceiling: the switch is off in this build (the classic planner, measured above)');

  /*
   * NOTHING LEAVES THIS ORIGIN.
   *
   * The footer promises that a visitor's plan stays in their browser, and until the fonts were
   * self-hosted that was true of the DATA while every visitor's IP address still reached Google for a
   * stylesheet. This walks every request the page makes, of any kind, and fails on any host that is not
   * the page's own - so a font link, an analytics snippet or a CDN icon set can never be added back
   * without this going red first. It is the one assertion in the suite that is about a promise rather
   * than a measurement.
   */
  console.log('every request the page makes, Pixel 7');
  const hosts = await (async () => {
    const ctx = await b.newContext({ ...devices['Pixel 7'] });
    const p = await ctx.newPage();
    const seen = new Set();
    p.on('request', (r) => { try { seen.add(new URL(r.url()).host); } catch { /* data: and blob: have no host */ } });
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    // A projection run is where a worker and its chunks load, so the check covers more than first paint.
    await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Run the projection/i.test(b.textContent)); if (x) x.click(); });
    await p.waitForTimeout(4000);
    await ctx.close();
    return [...seen];
  })();
  const foreign = hosts.filter(h => h !== `localhost:${PORT}`);
  ok('the page calls no host but its own', foreign.length === 0, foreign.length ? `also called ${foreign.join(', ')}` : `${hosts.join(', ')} only`);

  console.log('typing into a plan field, Pixel 7 at 4x throttle');
  const t = await typingLatency(b);
  ok('a typed character appears without waiting for the engine', !!t && t.median <= TYPE_CEILING,
    t ? `${t.median}ms median, ${JSON.stringify(t.all)}, ceiling ${TYPE_CEILING}ms` : 'no field found to type into');
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
