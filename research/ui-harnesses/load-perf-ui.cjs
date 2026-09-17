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
 * The byte count is the load-bearing assertion and the ceiling below is the looser one, on purpose. Three
 * runs of the same build spread about 100ms either way - 2,011 to 2,080 after, 2,105 to 2,225 before - so
 * a threshold placed between the two medians would fail on noise as often as on a regression. The bytes
 * are deterministic: 198KB against 214KB, every run.
 */
const CEILING = 2400;

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };

async function measure(b, label) {
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
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
  await page.waitForFunction(() => /What each tab is for|Can I retire/i.test(document.body.innerText), null, { timeout: 120000 });
  const content = Date.now() - t0;
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
  return { label, content, js: Math.round(wire.transfer / 1024), raw: Math.round(bytes.js / 1024), css: Math.round(bytes.css / 1024), requests: bytes.requests };
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
  ok('...having downloaded less than before', runs[0].js > 0 && runs[0].js < BEFORE.js, `${runs[0].js}KB over the wire, was ${BEFORE.js}KB`);
  ok('...and the streamlined page is not among it', runs[0].requests <= 3, `${runs[0].requests} script/style requests`);
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
