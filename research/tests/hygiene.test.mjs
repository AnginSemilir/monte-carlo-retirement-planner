/*
 * THE REPOSITORY'S HYGIENE (the external review of 21 Oct, Part B Step 3: the misses that needed no judgement, only an
 * assertion that runs every time). Checked here, each against a planted case:
 *   1. no research script names an absolute path (a script that imports the live tree by absolute path runs the working
 *      tree's code from inside a launcher snapshot, and breaks in any other clone);
 *   2. the household band is a fixture in git (research/solver/fixtures/), and nothing reads it from the gitignored results
 *      folder (it was lost there in a container restart);
 *   3. every file run-all.mjs's FAST list names exists (a missing one is a failure there, not a skip).
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

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} hygiene checks failed`);
