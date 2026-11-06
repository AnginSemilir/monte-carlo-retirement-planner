/*
 * THE PHONE'S GRID (Phase 11 item 1; B10, D59: "Just do phones for 45 points anyway"). A phone solves at the app's own 45
 * wealth points, on request, as every other device does: nothing in the page picks a coarser grid for a phone. The full tier.
 *
 * 1. The app's grid is 45 points (src/solverSettings.js APP_POINTS, the candidate's since D26).
 * 2. The site's page passes the solver no options of its own (App.jsx `SOLVER_OPTS = null`; only a harness's preview build
 *    sets them), so the worker solves at APP_POINTS.
 * 3. The pattern search: nothing under src/ sets `points` (a key, a prop or an assignment) from the device (a phone, the
 *    screen, the cores, the memory or the user agent): the expression it takes reads none, directly or through a name that
 *    does. (Read by the expression since 6 Nov: Phase 12 put a fixed `points` prop on lines that also pass `isPhone` to
 *    another prop, which the scan by the line read as a grid chosen by the device.)
 * 4. A solve's key carries the grid: a plan keyed with the default options keys as one keyed at 45 points, and not as one at
 *    30, so a solve stored on one device is the same solve on any other.
 * 5. The scan itself: on planted lines it flags a value read from the device directly, through a name, as a JSX prop and as
 *    an assignment, and passes a fixed `points` beside the device passed to another prop (Phase 12's lines).
 * Its plants (each fails its own check): 'points30' (APP_POINTS read as 30: check 1), 'opts' (the page's options set: check
 * 2), 'phone30' (a line choosing 30 points on a phone, put into src/solverClient.js's text: check 3), 'phone30via' (the
 * same through a name set from the cores on another line: check 3).
 *   node research/tests/phone-grid.test.mjs [--plant <name>]
 *   node research/tests/phone-grid.test.mjs --plants        every plant in turn, each in its own process
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const PLANTS = { points30: [1], opts: [2], phone30: [3], phone30via: [3] };
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

// 3. the pattern search: no expression under src/ that sets `points` reads the device, directly or through a name that does
const files = [];
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(js|jsx|mjs)$/.test(f)) files.push(p); } };
walk(join(ROOT, 'src'));
const DEVICE = /isPhone|matchMedia|innerWidth|screen\.|hardwareConcurrency|deviceMemory|userAgent|maxTouchPoints/;
// the expression at s[i]: a JSX prop's braces whole, else up to the first , or ; at depth 0 or the bracket that closes it
const valueAt = (s, i) => {
  let depth = 0, j = i;
  if (s[i] === '{') {
    for (; j < s.length; j++) { if ('([{'.includes(s[j])) depth++; else if (')]}'.includes(s[j]) && --depth === 0) return s.slice(i + 1, j); }
    return s.slice(i + 1);
  }
  for (; j < s.length; j++) {
    const c = s[j];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (depth === 0) break; depth--; }
    else if ((c === ',' || c === ';') && depth === 0) break;
  }
  return s.slice(i, j);
};
export function pointsFromDevice(text) {
  const lines = String(text).split('\n'), hits = [], fromDevice = new Set();
  const code = l => !/^\s*(\/\/|\*|\/\*)/.test(l);
  // the names the file sets from the device (a declaration, or a later declarator on its line)
  for (const l of lines.filter(code)) for (const m of l.matchAll(/(?:\b(?:const|let|var)\s+|,\s*)([A-Za-z_$][\w$]*)\s*=(?![=>])\s*/g)) if (DEVICE.test(valueAt(l, m.index + m[0].length))) fromDevice.add(m[1]);
  lines.forEach((l, i) => {
    if (!code(l)) return;
    for (const m of l.matchAll(/\bpoints\s*(?::|=(?![=>]))\s*/g)) {
      const v = valueAt(l, m.index + m[0].length), names = v.match(/[A-Za-z_$][\w$]*/g) || [];
      if (DEVICE.test(v) || names.some(n => fromDevice.has(n))) hits.push(`${i + 1}: ${l.trim().slice(0, 120)}`);
    }
  });
  return hits;
}
const hits = [];
for (const f of files) {
  let text = readFileSync(f, 'utf8');
  if (PLANT === 'phone30' && f.endsWith(join('src', 'solverClient.js'))) text += '\nconst gridFor = isPhone => ({ points: isPhone ? 30 : 45 });\n';
  if (PLANT === 'phone30via' && f.endsWith(join('src', 'solverClient.js'))) text += '\nconst gridPts = navigator.hardwareConcurrency < 4 ? 30 : 45;\nconst gridOpts = { points: gridPts };\n';
  hits.push(...pointsFromDevice(text).map(h => `${f.slice(ROOT.length + 1)}:${h}`));
}
ok(3, `nothing under src/ sets points from the device (${files.length} files searched)`, hits.length === 0, hits.slice(0, 3).join(' | '));

// 4. the key carries the grid
// the engine as the tests build it from App.jsx (research/build-engine.py), built here if it is not there yet
let E2 = await load('research/engine.mjs').catch(() => null);
if (!E2) { execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' }); E2 = await load('research/engine.mjs'); }
const { solveKey } = await load('src/solverKey.js');
const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
const plan = buildScenarios().find(s => s.id === 'S116').plan;
const kDefault = await solveKey(E2, plan, {}), k45 = await solveKey(E2, plan, { points: 45 }), k30 = await solveKey(E2, plan, { points: 30 });
ok(4, 'a plan keyed with the default options keys as at 45 points and not as at 30 (S116)', kDefault === k45 && kDefault !== k30, `default ${kDefault.slice(0, 12)}, 45 ${k45.slice(0, 12)}, 30 ${k30.slice(0, 12)}`);

// 5. the scan, on planted lines
const BAD = [
  'const gridFor = isPhone => ({ points: isPhone ? 30 : 45 });',
  'const pts = window.innerWidth < 600 ? 30 : 45;\nconst o = { points: pts };',
  'const a = 1, pts = matchMedia(q).matches ? 30 : 45;\nsolve(plan, { points: pts });',
  '<Solve plan={plan} points={isPhone ? 30 : 45} />',
  'opts.points = navigator.deviceMemory < 4 ? 30 : 45;'
];
const GOOD = [
  '<PlannerDocs isPhone={isPhone} open={docsOpen} points={(SOLVER_OPTS && SOLVER_OPTS.points) || 45} paths={x}>',
  "aside={isPhone ? null : aimsPanel()} onOpenClassic={() => setPlanner('classic')} points={(SOLVER_OPTS && SOLVER_OPTS.points) || 45}",
  'const o = { points: APP_POINTS, parts: isPhone ? 2 : 4 };',
  '// points: isPhone ? 30 : 45 (a comment)'
];
const bad = BAD.map(t => pointsFromDevice(t).length), good = GOOD.map(t => pointsFromDevice(t).length);
ok(5, 'the scan flags each planted read of the device (directly, through a name, a prop, an assignment) and passes a fixed points beside it', bad.every(c => c > 0) && good.every(c => c === 0), `flagged ${bad.join('/')}; fixed flagged ${good.join('/')}`);

console.log(`\n${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
