/*
 * THE REPOSITORY'S HYGIENE (the external review of 21 Oct, Part B Step 3: the misses that needed no judgement, only an
 * assertion that runs every time). Checked here, each against a planted case:
 *   1. no research script names an absolute path (a script that imports the live tree by absolute path runs the working
 *      tree's code from inside a launcher snapshot, and breaks in any other clone);
 *   2. the household band is a fixture in git (research/solver/fixtures/), and nothing reads it from the gitignored results
 *      folder (it was lost there in a container restart);
 *   3. every file run-all.mjs's FAST list names exists (a missing one is a failure there, not a skip);
 *   4. every file the launcher's smoke stamp hashes exists as a file;
 *   5. no integer generator stepped in doubles: an LCG step (s * M + C) reduced by >>> 0, % m or & mask loses its low bits
 *      once s * M can pass 2^53, and cycles (21 Oct: the power simulation's read the same in every replicate; the >>> 0
 *      form with 1103515245 repeats every 419 draws, the % 2^31 and & 0x7fffffff forms every 10,466). Math.imul, or a
 *      product that stays under 2^53 (1664525 on a 32-bit state), is exact.
 *   node research/tests/hygiene.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FAST } from './run-all.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

// every script under research/, the archive and the external review's own folder left out (records, not code we run)
const SKIP = ['research/solver/archive', 'research/solver/results', 'research/reviews', 'research/policy-study/results', 'research/ui-harnesses/node_modules'];
const walk = dir => readdirSync(join(ROOT, dir)).flatMap(name => {
  const rel = `${dir}/${name}`;
  if (SKIP.some(s => rel === s || rel.startsWith(`${s}/`)) || name === 'node_modules') return [];
  return statSync(join(ROOT, rel)).isDirectory() ? walk(rel) : /\.(mjs|js|sh)$/.test(name) ? [rel] : [];
});
export const absolutePaths = text => [...String(text).matchAll(/(['"`])\/(?:home|root|Users)\/[^'"`\n]*\1/g)].map(m => m[0]);
export const bandFromResults = text => /results[/'", ]+band-/.test(String(text)) || /RESULTS, ['"`]band-/.test(String(text));

const scripts = walk('research').filter(f => f !== 'research/tests/hygiene.test.mjs');   // its own planted strings left out
const abs = scripts.flatMap(f => absolutePaths(readFileSync(join(ROOT, f), 'utf8')).map(p => `${f}: ${p}`));
ok(scripts.length > 100 && abs.length === 0, `no absolute path in any of ${scripts.length} research scripts${abs.length ? ` (${abs.slice(0, 3).join('; ')})` : ''}`);
ok(absolutePaths("import * as E from '/home/user/repo/research/engine.mjs';").length === 1 && absolutePaths("import * as E from '../engine.mjs';").length === 0, 'planted: an absolute import is caught, a relative one is not');

let tracked = '';
try { tracked = execFileSync('git', ['ls-files', 'research/solver/fixtures/band-70-98-7001.json'], { cwd: ROOT }).toString().trim(); } catch { tracked = ''; }
ok(tracked === 'research/solver/fixtures/band-70-98-7001.json' && JSON.parse(readFileSync(join(ROOT, tracked), 'utf8')).length > 0, 'the household band is a fixture tracked by git');
const fromResults = scripts.filter(f => bandFromResults(readFileSync(join(ROOT, f), 'utf8')));
ok(fromResults.length === 0, `no script reads a band from the results folder${fromResults.length ? ` (${fromResults.join(', ')})` : ''}`);
ok(bandFromResults("readFileSync(join(HERE, 'results/band-70-98-7001.json'))") && !bandFromResults("readFileSync(join(HERE, 'fixtures/band-70-98-7001.json'))"), 'planted: a band read from results is caught, one from fixtures is not');

const missing = FAST.filter(f => !existsSync(join(ROOT, 'research/tests', f)));
ok(FAST.length > 0 && missing.length === 0, `every one of FAST's ${FAST.length} files exists${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`);

// 4. the launcher's smoke stamp hashes: every file it lists exists as a file (a script reading a results folder by new URL
// put that folder in the list, and the launcher refused every batch on a tree without it: 21 Oct, Step 2's first launch)
{ const C = await import('../solver/code-id.mjs'), { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } = await import('node:fs'), { tmpdir } = await import('node:os');
  const listed = C.smokeFiles(ROOT), notFile = listed.filter(f => !existsSync(join(ROOT, f)) || !statSync(join(ROOT, f)).isFile());
  ok(C.smokeId(ROOT) !== null && notFile.length === 0, `the smoke stamp hashes ${listed.length} files, every one a file${notFile.length ? ` (not: ${notFile.join(', ')})` : ''}`);
  // planted: a copy of the stamp's own inputs with one audit reading a missing results folder by new URL, and one starting a
  // missing worker: the first must still hash, the second must not
  const tmp = mkdtempSync(join(tmpdir(), 'hygiene-smoke-'));
  try {
    for (const d of ['src', 'research']) mkdirSync(join(tmp, d), { recursive: true });
    cpSync(join(ROOT, 'src/solver'), join(tmp, 'src/solver'), { recursive: true });
    for (const f of ['research/engine.mjs', 'research/solver/experiment.mjs', 'research/solver/record.mjs', 'research/policy-study/scenarios.mjs', 'research/solver/settings.mjs', 'research/solver/code-id.mjs', 'research/solver/smoke.sh'])
      if (existsSync(join(ROOT, f))) { mkdirSync(join(tmp, f, '..'), { recursive: true }); cpSync(join(ROOT, f), join(tmp, f)); }
    writeFileSync(join(tmp, 'research/solver/audit-plant.mjs'), "const x = readFileSync(new URL('./results/no-such-folder/' + id + '.json', import.meta.url));\n");
    const readsData = C.smokeId(tmp) !== null;
    writeFileSync(join(tmp, 'research/solver/audit-plant.mjs'), "const w = new Worker(new URL('./no-such-worker.mjs', import.meta.url));\n");
    const missingWorker = C.smokeId(tmp) === null;
    ok(readsData && missingWorker, `planted: an audit reading a missing results folder by new URL still hashes (${readsData}); one starting a missing worker does not (${missingWorker})`);
  } finally { rmSync(tmp, { recursive: true, force: true }); } }

// 5. no integer generator stepped in doubles (research/ and src/): the step's largest exact product, the multiplier times
// the state's bound (the reduction's modulus) plus the increment, must stay within 2^53
export const doubleLcgs = text => [...String(text).matchAll(/\b\w+\s*\*\s*(\d{5,})(?:\s*\+\s*(\d+))?\s*\)?\s*(?:>>>\s*0\b|%\s*(\d+)|&\s*(0x[0-9a-fA-F]+|\d+))/g)]
  .filter(m => +m[1] * (m[3] ? +m[3] : m[4] ? Number(m[4]) + 1 : 2 ** 32) + (+m[2] || 0) > 2 ** 53).map(m => m[0]);
const lcgs = [...scripts, ...walk('src')].flatMap(f => doubleLcgs(readFileSync(join(ROOT, f), 'utf8')).map(x => `${f}: ${x}`));
ok(lcgs.length === 0, `no integer generator stepped in doubles in research/ or src/${lcgs.length ? ` (${lcgs.length}: ${lcgs.slice(0, 4).join('; ')})` : ''}`);
ok(['s = (s * 1103515245 + 12345) >>> 0', 'x = (x * 1103515245 + 12345) & 0x7fffffff', 'st = (st * 1103515245 + 12345) % 2147483648'].every(t => doubleLcgs(t).length === 1)
  && ['x = (Math.imul(x, 1103515245) + 12345) >>> 0', 'rng = (rng * 1664525 + 1013904223) >>> 0', 'const y = a * 100000 % 7'].every(t => doubleLcgs(t).length === 0),
  'planted: the three doubles forms of 1103515245 are caught; Math.imul, 1664525 on a 32-bit state and a small product are not');

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} hygiene checks failed`);
