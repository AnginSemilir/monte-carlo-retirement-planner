/*
 * THE PER-TEST SKIP AND ITS TRACE CHECK (the launch plan of 1 Nov, step 0, B8; research/tests/fast-skip.mjs, trace-reads.mjs).
 * Full tier only (about an hour: check 3 runs the fast tier once more).
 *   1. a scratch tree with six tests, each reading by another way (a file, an import, a directory's listing, a node child
 *      with its own env, a worker, another program): the first run traces all six; the second skips all but the one that
 *      starts another program; a planted change to each input re-runs its test and no other; a change to a file none read
 *      re-runs nothing;
 *   2. the trace check on that tree: every record complete; planted, a read taken out of a record (the file read
 *      directly, and the one a node child reads): the check fails;
 *   3. the trace check on the fast tier itself (research/tests/fast-inputs.json, as committed): every record complete,
 *      each test passing in a tree that holds only its recorded inputs;
 *   4. on a scratch git tree, a test walking a directory that holds an untracked cache: its record keeps the tracked file,
 *      the generated engine and a probe of an absent path, and leaves the cache out (the record the same in every clone);
 *      planted, the same trace without the filter names the cache.
 *   node research/tests/fast-skip.test.mjs [--fixture]     (--fixture: checks 1, 2 and 4)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { traced, recordOf } from './fast-skip.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), SKIP = join(HERE, 'fast-skip.mjs');
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

const R = mkdtempSync(join(tmpdir(), 'fast-skip-fixture-'));
const put = (p, s) => { mkdirSync(dirname(join(R, p)), { recursive: true }); writeFileSync(join(R, p), s); };
put('a.txt', 'a\n'); put('b.mjs', 'export const b = 1;\n'); put('c.txt', 'c\n'); put('e.txt', 'e\n'); put('d/x', ''); put('d/y', ''); put('z.txt', 'z\n');
const T = {
  't/file.test.mjs': "import { readFileSync } from 'node:fs'; process.exit(readFileSync('a.txt', 'utf8').trim() === 'a' ? 0 : 1);\n",
  't/import.test.mjs': "import { b } from '../b.mjs'; process.exit(b === 1 ? 0 : 1);\n",
  't/listing.test.mjs': "import { readdirSync } from 'node:fs'; process.exit(readdirSync('d').length >= 2 ? 0 : 1);\n",
  't/child.test.mjs': "import { execFileSync } from 'node:child_process'; const s = execFileSync(process.execPath, ['-e', \"process.stdout.write(require('fs').readFileSync('c.txt', 'utf8'))\"], { env: { PATH: process.env.PATH }, encoding: 'utf8' }); process.exit(s.trim() === 'c' ? 0 : 1);\n",
  't/worker.test.mjs': "import { Worker } from 'node:worker_threads'; const w = new Worker(new URL('./w.mjs', import.meta.url)); w.on('message', m => process.exit(m === 'e' ? 0 : 1));\n",
  't/program.test.mjs': "import { spawnSync } from 'node:child_process'; process.exit(spawnSync('cat', ['a.txt']).status);\n"
};
for (const [p, s] of Object.entries(T)) put(p, s);
// the worker outlives its message and the test exits on the message, so a worker's record written only at its own exit is
// lost on every run (the full tier of 1 Nov lost it on some: the race this pins)
put('t/w.mjs', "import { readFileSync } from 'node:fs'; import { parentPort } from 'node:worker_threads'; parentPort.postMessage(readFileSync('e.txt', 'utf8').trim()); setTimeout(() => {}, 1500);\n");
const NAMES = Object.keys(T), INPUTS = join(R, 'inputs.json'), CACHE = join(R, 'cache.json');
const skip = (...extra) => spawnSync(process.execPath, [SKIP, '--root', R, '--tests', NAMES.join(','), '--inputs', INPUTS, '--cache', CACHE, ...extra], { encoding: 'utf8' });
const ran = out => out.split('\n').map(l => /^fast-skip: run +(\S+)/.exec(l)).filter(Boolean).map(m => m[1]).sort();
const want = (...names) => [...names, 't/program.test.mjs'].sort().join(',');

// 1. the skip
{ const r1 = skip(); ok(r1.status === 2 && ran(r1.stdout).length === 6, `1. the first run traces all six and asks for the inputs file to be staged (exit ${r1.status}, ${ran(r1.stdout).length} run)`);
  const r2 = skip(); ok(r2.status === 0 && ran(r2.stdout).join(',') === want(), `1. the second run skips all but the test that starts another program (${ran(r2.stdout).join(', ')})`);
  const rec = JSON.parse(readFileSync(INPUTS, 'utf8'));
  ok(rec['t/child.test.mjs'].read.includes('c.txt') && rec['t/worker.test.mjs'].read.includes('e.txt') && rec['t/worker.test.mjs'].read.includes('t/w.mjs') && rec['t/listing.test.mjs'].list.includes('d') && rec['t/program.test.mjs'].spawns.includes('cat'),
    '1. the records hold the node child\'s read (its own env), the worker\'s script and read, the listing and the program');
  const PLANTS = [['a.txt', 'a\n\n', 't/file.test.mjs'], ['b.mjs', 'export const b = 1; // planted\n', 't/import.test.mjs'], ['d/w', '', 't/listing.test.mjs'], ['c.txt', 'c\n\n', 't/child.test.mjs'], ['e.txt', 'e\n\n', 't/worker.test.mjs']];
  for (const [p, s, t] of PLANTS) {
    put(p, s);
    const d = skip('--dry');
    ok(ran(d.stdout).join(',') === want(t), `1. planted, ${p} changed: ${t} runs, and no other but the program's (${ran(d.stdout).join(', ')})`);
    skip();
  }
  appendFileSync(join(R, 'z.txt'), 'planted\n');
  const d = skip('--dry'); ok(ran(d.stdout).join(',') === want(), `1. planted, a file no test reads changed: nothing re-runs (${ran(d.stdout).join(', ')})`); }

// 2. the trace check on the scratch tree
{ const c = skip('--check'); ok(c.status === 0 && /every record complete/.test(c.stdout), `2. the trace check on the scratch tree: every record complete (${c.stdout.trim().split('\n').pop()})`);
  const good = readFileSync(INPUTS, 'utf8');
  for (const [t, p] of [['t/file.test.mjs', 'a.txt'], ['t/child.test.mjs', 'c.txt']]) {
    const rec = JSON.parse(good); rec[t].read = rec[t].read.filter(x => x !== p); writeFileSync(INPUTS, JSON.stringify(rec));
    const c2 = skip('--check', '--tests', t);
    ok(c2.status !== 0 && new RegExp(`FAIL ${t.replace('/', '\\/')}`).test(c2.stdout), `2. planted, ${p} taken out of ${t}'s record: the trace check fails (${(c2.stdout.split('\n').find(l => l.startsWith('FAIL')) || '').slice(0, 140)})`);
  }
  writeFileSync(INPUTS, good); }
rmSync(R, { recursive: true, force: true });

// 3. the trace check on the fast tier
if (!process.argv.includes('--fixture')) {
  const c = spawnSync(process.execPath, [SKIP, '--check'], { encoding: 'utf8', cwd: join(HERE, '../..'), maxBuffer: 1 << 26 });
  const lines = c.stdout.trim().split('\n');
  for (const l of lines.filter(x => x.startsWith('FAIL'))) console.log(`      ${l.slice(0, 400)}`);
  ok(c.status === 0, `3. the trace check on the fast tier: ${lines.pop()}`);
}

// 4. the record holds what a clean checkout has
{ const G = mkdtempSync(join(tmpdir(), 'fast-skip-git-'));
  const g = (p, s) => { mkdirSync(dirname(join(G, p)), { recursive: true }); writeFileSync(join(G, p), s); };
  g('k/a.txt', 'a\n'); g('k/cache/x.pyc', 'cache\n'); g('research/engine.mjs', 'export const E = 1;\n');
  g('t/walk.test.mjs', "import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'; const walk = d => readdirSync(d).flatMap(n => statSync(`${d}/${n}`).isDirectory() ? walk(`${d}/${n}`) : [`${d}/${n}`]); const all = walk('k'); readFileSync('k/a.txt'); readFileSync('research/engine.mjs'); process.exit(all.length === 2 && !existsSync('absent.txt') ? 0 : 1);\n");
  execFileSync('git', ['init', '-q'], { cwd: G }); execFileSync('git', ['add', 'k/a.txt', 't/walk.test.mjs'], { cwd: G });
  const r = spawnSync(process.execPath, [SKIP, '--root', G, '--tests', 't/walk.test.mjs', '--inputs', join(G, 'inputs.json'), '--cache', join(G, 'cache.json')], { encoding: 'utf8' });
  const rec = JSON.parse(readFileSync(join(G, 'inputs.json'), 'utf8'))['t/walk.test.mjs'], names = [...rec.read, ...rec.probe, ...rec.list];
  ok(r.status === 2 && rec.read.includes('k/a.txt') && rec.read.includes('research/engine.mjs') && rec.probe.includes('absent.txt') && rec.list.includes('k') && !names.some(p => p.startsWith('k/cache')),
    `4. the record keeps the tracked file, the generated engine, the absent probe and the listing, and leaves the untracked cache out (${names.filter(p => p.startsWith('k/')).join(', ')})`);
  const raw = recordOf((await traced(G, 't/walk.test.mjs')).traces), rawNames = [...raw.read, ...raw.probe, ...raw.list];
  ok(rawNames.some(p => p.startsWith('k/cache')), `4. planted, the same trace without the filter names the cache (${rawNames.filter(p => p.startsWith('k/cache')).join(', ')})`);
  rmSync(G, { recursive: true, force: true }); }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
