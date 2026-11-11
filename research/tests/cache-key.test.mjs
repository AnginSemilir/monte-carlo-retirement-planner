/*
 * THE STORED SOLVES' KEY IS THE SOLVER'S CODE, NOT THE WORKER'S URL (the launch plan's step P1 (g); F19, confirmed by
 * research/solver/results-cache-key.txt: a screen change alone gave the worker a new URL, and so every stored solve a new key).
 *
 * Builds the site (vite build, the project's own config) in a copy of its build inputs, and reads the key the solver worker
 * carries (vite-plugin-solver-code.js writes it over the placeholder in src/solverWorker.js):
 *   1. the build as it is carries a module-graph key;
 *   2. a screen change (the Config tab's Reseed button's text, below the engine slice) keeps the key, where the worker's URL
 *      moves (F19 again, on this code);
 *   3. a change to App.jsx's engine slice moves it;
 *   4. a change to src/solverPool.js (outside App.jsx: the worker's graph, not a list) moves it;
 *   5. a change to the solver (src/solver/solve.js) moves it;
 *   6. the worker reads the key, and falls back to its URL only where no build wrote one (codeOf);
 *   7. the plugin's engine slice is research/build-engine.py's (the head of research/engine.mjs).
 *   8. what names a stored solve (src/solverKey.js) names the candidate's `coarse` and `sweepCashIsaTo`, consent withdrawn and
 *      the dial's position (D73's port, step 8).
 *   CACHE_KEY_PLANT=url builds with the placeholder left in (the URL fallback): checks 1 and 2 fail; CACHE_KEY_PLANT=nod73: check 8.
 * The full tier (about a minute: five builds; on a runner with no packages installed, the copy installs them first).
 */
import { mkdtempSync, cpSync, symlinkSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { engineSlice } from '../../vite-plugin-solver-code.js';
import { codeOf } from '../../src/solverCache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const INPUTS = ['index.html', 'vite.config.js', 'vite-plugin-inline-edit.js', 'vite-plugin-solver-code.js', 'package.json', 'postcss.config.js', 'tailwind.config.js', 'src', 'public', 'scripts'];
let pass = 0, fail = 0;
const failed = [];
const ok = (n, c, extra = '') => { c ? pass++ : (fail++, failed.push(n.split(/\s+/)[0])); console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

// 8 (D73's port, step 8; D74): what names a stored solve names the candidate's `coarse` and `sweepCashIsaTo`, and the two things
// that take a solve off the anchors (consent to change risk withdrawn, a dial position above 1), so a solve stored one way is
// never the stored solve of the other. No build: src/solverKey.js's own key. CACHE_KEY_PLANT=nod73 keys every solve without
// the candidate's two keys (solverKey.js PLANT 'nod73'): check 8 fails.
{
  const E = await import('../engine.mjs'), { solveKey, PLANT: KEY_PLANT } = await import('../../src/solverKey.js'), { APP_CANDIDATE, withAims, atDial } = await import('../../src/solverSettings.js');
  const { buildScenarios } = await import('../policy-study/scenarios.mjs');
  const plan = buildScenarios().find(s => s.id === 'S116').plan, key = p => solveKey(E, p, {}, 'solver-code:x');
  if (process.env.CACHE_KEY_PLANT === 'nod73') KEY_PLANT.rule = 'nod73';
  const k0 = await key(plan), kNoConsent = await key(withAims(plan, { riskConsent: false })), kDial = await key(atDial(withAims(plan), 3));
  const was = KEY_PLANT.rule; KEY_PLANT.rule = 'nod73'; const kWithout = await key(plan); KEY_PLANT.rule = was;
  ok('8  the stored solves\' key names the candidate\'s coarse and sweepCashIsaTo, consent withdrawn and the dial\'s position', !!APP_CANDIDATE.coarse && APP_CANDIDATE.sweepCashIsaTo === 'isa' && new Set([k0, kNoConsent, kDial, kWithout]).size === 4,
    `the plan ${k0.slice(0, 12)}; without the two keys ${kWithout.slice(0, 12)}; consent withdrawn ${kNoConsent.slice(0, 12)}; the dial at 3 ${kDial.slice(0, 12)}`);
}

const W = mkdtempSync(join(tmpdir(), 'cache-key-'));
for (const f of INPUTS) if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(W, f), { recursive: true });
// the project's own packages where they are installed (a working copy); where they are not (the full tier's runner, which
// installs none), the copy installs them from the lockfile, so the check runs there too (CACHE_KEY_INSTALL=1 forces it)
if (existsSync(join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')) && !process.env.CACHE_KEY_INSTALL) symlinkSync(join(ROOT, 'node_modules'), join(W, 'node_modules'), 'dir');
else {
  cpSync(join(ROOT, 'package-lock.json'), join(W, 'package-lock.json'));
  const t = Date.now();
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: W, stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`(the packages installed in the copy from package-lock.json, ${((Date.now() - t) / 1000).toFixed(0)} s)`);
}
const VITE = join(W, 'node_modules', 'vite', 'bin', 'vite.js');

// one build: the worker's key, or, where the build wrote none, its URL's file name (what the worker would key on)
function build(label) {
  const out = join(W, `dist-${label}`);
  execFileSync(process.execPath, [VITE, 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], { cwd: W, env: process.env, stdio: ['ignore', 'ignore', 'inherit'] });
  const files = readdirSync(join(out, 'assets')).filter(f => /^solverWorker-.*\.js$/.test(f));
  if (files.length !== 1) throw new Error(`${label}: ${files.length} solver workers built`);
  const m = readFileSync(join(out, 'assets', files[0]), 'utf8').match(/solver-code:[0-9a-f]{16}/);
  return { key: m ? m[0] : `url:${files[0]}`, file: files[0] };
}
// an edit in the copy, undone after its build
function edited(label, file, from, to) {
  const p = join(W, file), was = readFileSync(p, 'utf8');
  if (from !== null && was.split(from).length !== 2) throw new Error(`${label}: ${JSON.stringify(from)} not found once in ${file}`);
  writeFileSync(p, from === null ? was + to : was.replace(from, to));
  try { return build(label); } finally { writeFileSync(p, was); }
}

try {
  const app = readFileSync(join(W, 'src', 'App.jsx'), 'utf8');
  const exportAt = app.split('\n').findIndex(l => l.startsWith('export {'));
  const lastSliceLine = app.split('\n')[exportAt - 1];
  const a = build('as-is');
  const b = edited('screen', 'src/App.jsx', '>Reseed</button>', '>Reseed now</button>');
  const c = edited('engine', 'src/App.jsx', `\n${lastSliceLine}\nexport {`, `\n${lastSliceLine}\nconst CACHE_KEY_ENGINE_PLANT = 1; void CACHE_KEY_ENGINE_PLANT;\nexport {`);
  const d = edited('pool', 'src/solverPool.js', null, '\nexport const CACHE_KEY_POOL_PLANT = 1;\n');
  const e = edited('solver', 'src/solver/solve.js', null, '\nexport const CACHE_KEY_SOLVER_PLANT = 1;\n');
  console.log(`keys: as built ${a.key} (${a.file}); a screen change ${b.key} (${b.file}); the engine slice ${c.key}; solverPool.js ${d.key}; solve.js ${e.key}`);
  ok('1  the build as it is: the solver worker carries a module-graph key, not its URL', /^solver-code:/.test(a.key), a.key);
  ok('2  a screen change (the Reseed button\'s text) keeps the key, where the worker\'s URL moves', b.key === a.key && b.file !== a.file, `${a.key} -> ${b.key}; the worker ${a.file} -> ${b.file}`);
  ok('3  a change to App.jsx\'s engine slice moves the key', c.key !== a.key && /^solver-code:/.test(c.key));
  ok('4  a change to src/solverPool.js moves the key', d.key !== a.key && /^solver-code:/.test(d.key));
  ok('5  a change to src/solver/solve.js moves the key', e.key !== a.key && /^solver-code:/.test(e.key));
  const loc = { href: 'https://x/assets/solverWorker-abc.js' };
  ok('6  the worker reads a written key, and falls back to its URL where none was written', codeOf(a.key, loc) === a.key && codeOf('__SOLVER_CODE_KEY__', loc) === loc.href && codeOf('solver-code:xyz', loc) === loc.href && codeOf('__SOLVER_CODE_KEY__', undefined) === 'unknown');
  const eng = readFileSync(join(ROOT, 'research', 'engine.mjs'), 'utf8');
  ok('7  the plugin\'s engine slice is research/build-engine.py\'s (the head of research/engine.mjs)', eng.startsWith(engineSlice(readFileSync(join(ROOT, 'src', 'App.jsx'), 'utf8'))));
} finally {
  rmSync(W, { recursive: true, force: true });
}
console.log(`\n=========== ${pass} passed, ${fail} failed${failed.length ? `: ${failed.join('; ')}` : ''} ===========`);
process.exit(fail ? 1 : 0);
