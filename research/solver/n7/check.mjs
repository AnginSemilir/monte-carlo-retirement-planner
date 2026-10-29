/*
 * N7's page checked in headless Chromium on this machine (CHECKLIST 5: each check shown failing on a planted fault).
 * Serves the repository's root, opens research/solver/n7/index.html and reads the page's own state (window.__n7):
 *   1. #run-check: the worker starts, the code reads "as built", the check solve's tables match Node's bit for bit;
 *   2. planted: a comment added to src/solver/solve.js as served - the code check reads "changed" and the table check
 *      stands down (same: null), so a stale page cannot claim a match;
 *   3. planted: data.json's digest for the check altered - the table check reads "no".
 * With --quick it then runs #run-quick (S370, both solves) for this machine's browser times beside Node's.
 *   node research/solver/n7/check.mjs [--quick]
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const TYPES = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
let plant = null;
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '');
  if (path.includes('..')) { res.writeHead(403).end(); return; }
  try {
    let body = await readFile(join(ROOT, path));
    if (plant === 'code' && path === 'src/solver/solve.js') body = Buffer.concat([body, Buffer.from('\n// planted\n')]);
    if (plant === 'digest' && path === 'research/solver/n7/data.json') { const d = JSON.parse(body); d.check.ref.digest = d.check.ref.digest.replace(/^./, c => (c === '0' ? '1' : '0')); body = Buffer.from(JSON.stringify(d)); }
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/research/solver/n7/index.html`;
const browser = await chromium.launch();
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

async function open(hash, rows, timeout) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}${hash}`, { waitUntil: 'domcontentloaded' });   // not 'load': the web fonts may never arrive here
  await page.waitForFunction(k => window.__n7 && window.__n7.rows.length >= k && !window.__n7.running, rows, { timeout, polling: 1000 });
  const s = await page.evaluate(() => ({ mode: window.__n7.mode, codeOk: window.__n7.codeOk, rows: window.__n7.rows, code: document.getElementById('dev-code').textContent }));
  await page.close();
  return { ...s, errors };
}

{ plant = null; const s = await open('#run-check', 1, 120000), r = s.rows[0];
  ok(s.mode === 'worker' && s.codeOk === true && r.ok && r.same === true && !s.errors.length,
    `the check: in ${s.mode}, the code ${s.codeOk ? 'as built' : 'NOT as built'}, ${r.caseId} at ${r.points} points in ${r.secs} s (Node ${r.ref.nodeSecs} s), its tables ${r.same ? 'the same as Node\'s bit for bit' : 'DIFFERENT'} (${r.values} values)${s.errors.length ? `; page errors: ${s.errors.join('; ')}` : ''}`); }
{ plant = 'code'; const s = await open('#run-check', 1, 120000), r = s.rows[0];
  ok(s.codeOk === false && /changed/.test(s.code) && r.same === null, `planted: solve.js changed as served: the code reads "${s.code.split(' ')[0]}", the table check ${r.same === null ? 'stands down' : `reads ${r.same}`}`); }
{ plant = 'digest'; const s = await open('#run-check', 1, 120000), r = s.rows[0];
  ok(s.codeOk === true && r.same === false, `planted: Node's digest altered in data.json: the table check reads ${r.same === false ? '"no"' : r.same}`); }
plant = null;

if (process.argv.includes('--quick')) {
  const s = await open('#run-quick', 2, 4 * 3600 * 1000);
  for (const r of s.rows) ok(r.ok && r.same === true, `this machine's Chromium, ${r.caseId} ${r.arm} at ${r.points} points: ${r.secs} s, Node (built, under its batch's load) ${r.ref.nodeSecs} s, gate 5 ${r.gate5} s; tables ${(r.bytes / 1048576).toFixed(0)} MB, ${r.same ? 'the same as Node\'s bit for bit' : 'DIFFERENT'}`);
}
await browser.close(); server.close();
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
