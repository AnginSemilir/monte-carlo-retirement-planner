/*
 * THE PHONE'S GRID (Phase 11 item 1; B10, D59: "Just do phones for 45 points anyway"). A phone solves at the app's own 45
 * wealth points, on request, as every other device does: nothing in the page picks a coarser grid for a phone. The full tier.
 *
 * 1. The app's grid is 45 points (src/solverSettings.js APP_POINTS, the candidate's since D26).
 * 2. The site's page passes the solver no options of its own (App.jsx `SOLVER_OPTS = null`; only a harness's preview build
 *    sets them), so the worker solves at APP_POINTS.
 * 3. The pattern search: no line under src/ sets `points` (a key or an assignment) from the device (a phone, the screen,
 *    the cores, the memory or the user agent).
 * 4. A solve's key carries the grid: a plan keyed with the default options keys as one keyed at 45 points, and not as one at
 *    30, so a solve stored on one device is the same solve on any other.
 * Its plants (each fails its own check): 'points30' (APP_POINTS read as 30: check 1), 'opts' (the page's options set: check
 * 2), 'phone30' (a line choosing 30 points on a phone, put into src/solverClient.js's text: check 3).
 *   node research/tests/phone-grid.test.mjs [--plant <name>]
 *   node research/tests/phone-grid.test.mjs --plants        every plant in turn, each in its own process
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const PLANTS = { points30: [1], opts: [2], phone30: [3] };
if (args[0] === '--plants') {
  let bad = 0;
  for (const [name, want] of Object.entries(PLANTS)) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--plant', name], { encoding: 'utf8' }); } catch (e) { out = e.stdout || ''; }
    const failed = [...new Set(out.split('\n').filter(l => l.startsWith('  FAIL ')).map(l => Number(/^ {2}FAIL (\d+)\./.exec(l)?.[1])))].sort();
    const right = JSON.stringify(failed) === JSON.stringify(want);
    if (!right) bad++;
    console.log(`plant '${name}': checks failing ${failed.join(', ') || 'none'} (its own: ${want.join(', ')}) ${right ? 'ok' : 'WRONG'}`);
  }
  console.log(bad ? `PLANTS: ${bad} of ${Object.keys(PLANTS).length} did not fail exactly their own checks` : `PLANTS: all ${Object.keys(PLANTS).length} fail exactly their own checks`);
  process.exit(bad ? 1 : 0);
}
const PLANT = args[0] === '--plant' ? args[1] : null;
if (PLANT && !PLANTS[PLANT]) { console.log(`no plant '${PLANT}'`); process.exit(2); }

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const load = rel => import(pathToFileURL(join(ROOT, rel)).href);

// 1. the app's grid
const { APP_POINTS } = await load('src/solverSettings.js');
const points = PLANT === 'points30' ? 30 : APP_POINTS;
ok(1, 'the app solves at 45 wealth points (src/solverSettings.js APP_POINTS)', points === 45, `APP_POINTS ${points}`);

// 2. the site's page passes no options of its own
const app = readFileSync(join(ROOT, 'src/App.jsx'), 'utf8').replace('\nconst SOLVER_OPTS = null;\n', PLANT === 'opts' ? '\nconst SOLVER_OPTS = { points: 30 };\n' : '\nconst SOLVER_OPTS = null;\n');
const optsLine = (/\nconst SOLVER_OPTS = (.*);\n/.exec(app) || [])[1];
ok(2, 'the site\'s page passes the solver no options (App.jsx `const SOLVER_OPTS = null;`), so the worker solves at APP_POINTS', optsLine === 'null', `SOLVER_OPTS ${optsLine}`);

// 3. the pattern search: no statement under src/ that names `points` reads the device
const files = [];
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(js|jsx|mjs)$/.test(f)) files.push(p); } };
walk(join(ROOT, 'src'));
const DEVICE = /isPhone|matchMedia|innerWidth|screen\.|hardwareConcurrency|deviceMemory|userAgent|maxTouchPoints/;
const hits = [];
for (const f of files) {
  let text = readFileSync(f, 'utf8');
  if (PLANT === 'phone30' && f.endsWith(join('src', 'solverClient.js'))) text += '\nconst gridFor = isPhone => ({ points: isPhone ? 30 : 45 });\n';
  // a line that sets `points` (a key or an assignment) and reads the device on the same line; comments left out
  text.split('\n').forEach((line, i) => {
    if (/\bpoints\s*[:=](?!=)/.test(line) && DEVICE.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)) hits.push(`${f.slice(ROOT.length + 1)}:${i + 1}: ${line.trim().slice(0, 120)}`);
  });
}
ok(3, `no line under src/ sets points from the device (${files.length} files searched)`, hits.length === 0, hits.slice(0, 3).join(' | '));

// 4. the key carries the grid
// the engine as the tests build it from App.jsx (research/build-engine.py), built here if it is not there yet
let E2 = await load('research/engine.mjs').catch(() => null);
if (!E2) { execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' }); E2 = await load('research/engine.mjs'); }
const { solveKey } = await load('src/solverKey.js');
const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
const plan = buildScenarios().find(s => s.id === 'S116').plan;
const kDefault = await solveKey(E2, plan, {}), k45 = await solveKey(E2, plan, { points: 45 }), k30 = await solveKey(E2, plan, { points: 30 });
ok(4, 'a plan keyed with the default options keys as at 45 points and not as at 30 (S116)', kDefault === k45 && kDefault !== k30, `default ${kDefault.slice(0, 12)}, 45 ${k45.slice(0, 12)}, 30 ${k30.slice(0, 12)}`);

console.log(`\n${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
