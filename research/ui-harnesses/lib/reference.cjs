/*
 * THE REFERENCE, WORKED OUT IN THE HARNESS'S OWN BROWSER (13 Nov 2026).
 *
 * The solver's harnesses hold the page's tables and figures to a reference "bit for bit": the same household, settings,
 * paths and seed, solved again outside the page's plumbing (the bundle, the minifier, the workers, the split, the store).
 * Until 13 Nov that reference was worked out in Node. It could be, because Node's V8 and the harness's Chromium gave the
 * same double for Math.exp, log, expm1, log1p and cbrt, and differed only in Math.pow (pow-probe.cjs, step U; the money
 * bands were held within a relative 1e-12 for that reason). The container's Chromium is now 153 (it was 141), and its exp,
 * log, cbrt, expm1 and log1p differ from Node 22's in the last place on about one input in fifteen
 * (research/solver/results-pow-probe.txt). So main's own code, green at this gate on 8 Nov, fails the bit-for-bit checks
 * here: the tables are another V8's arithmetic, not another solve.
 *
 * What the checks are for has not changed: the page's plumbing must give the solver's own answer. So the reference is
 * now worked out by the same source, UNBUNDLED (research/engine.mjs and src/ as they sit in the tree, served as plain ES
 * modules by the small server below), on the main thread of a blank page in the SAME browser the harness drives. The
 * arithmetic is then the page's own, and a difference is the plumbing's: a bundler or minifier changing the code, a
 * worker, the split or the store changing the tables. What is no longer held is that the browser's V8 computes what
 * Node's does; it does not, and no figure the app shows a visitor ever rested on it. The counts (survival, levels, years)
 * are still held to Node's where a harness held them.
 *
 *   const ref = await reference(browser);                    // one page, kept for the harness's life
 *   const r = await ref.run(async ({ plan, opts }) => {       // runs in that page: import by repository path
 *     const E = await import('/research/engine.mjs'), M = await import('/src/solver/model.js');
 *     ...
 *   }, { plan, opts });
 *   await ref.close();
 *
 * The harness rebuilds research/engine.mjs first (python3 research/build-engine.py), as it did for Node.
 * PLANT (REFERENCE_PLANT=bundle, shown once in research/solver/results-reference.txt): the server answers a request for
 * src/solver/grid.js with a copy whose normal distribution function is nudged, standing for a bundle that changed the code; the
 * reference then differs from the page and every bit-for-bit check fails.
 */
const http = require('node:http');
const fs = require('node:fs');
const { join, normalize, extname } = require('node:path');
const ROOT = join(__dirname, '../../..');
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };

async function reference(browser, { root = ROOT } = {}) {
  const server = http.createServer((q, s) => {
    const rel = decodeURIComponent(q.url.split('?')[0]);
    if (rel === '/' || rel === '/__reference') { s.writeHead(200, { 'content-type': 'text/html' }); s.end('<!doctype html><title>reference</title>'); return; }
    const file = normalize(join(root, rel));
    // only the source the reference imports: the engine slice, src/ and the library's households
    if (!file.startsWith(root + '/') || !/^\/(src|research)\//.test(rel) || !TYPES[extname(file)] || !fs.existsSync(file)) { s.writeHead(404); s.end(); return; }
    let body = fs.readFileSync(file);
    if (process.env.REFERENCE_PLANT === 'bundle' && rel === '/src/solver/grid.js') body = Buffer.from(plant(body.toString()));
    s.writeHead(200, { 'content-type': TYPES[extname(file)], 'cache-control': 'no-store' }); s.end(body);
  });
  await new Promise((res, rej) => { server.once('error', rej); server.listen(0, '127.0.0.1', res); });
  const port = server.address().port;
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${port}/__reference`);
  // src/solver reads its research switches from process.env as its modules load; the page's worker gives them an empty one
  // (src/solverProcessShim.js), and so does the reference
  await page.evaluate(() => { globalThis.process ??= {}; globalThis.process.env ??= {}; });
  const version = browser.version();
  return {
    port, version,
    run: async (fn, arg) => {
      const r = await page.evaluate(fn, arg);
      if (errs.length) throw new Error(`the reference page threw: ${errs.join(' | ')}`);
      return r;
    },
    close: async () => { await page.close().catch(() => {}); await new Promise(res => server.close(res)); }
  };
}
/* the plant: the normal distribution function's argument a part in a thousand million high, as a bundle that changed the
   code would (a constant folded wrongly) */
function plant(src) {
  const at = 'export function Phi(z) {';
  if (!src.includes(at)) throw new Error('reference.cjs: the plant found no Phi(z) in grid.js');
  return src.replace(at, at + ' z = z * (1 + 1e-9);');
}
module.exports = { reference };
