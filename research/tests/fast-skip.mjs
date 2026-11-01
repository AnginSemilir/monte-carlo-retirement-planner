/*
 * THE FAST TIER, SKIPPING WHAT CANNOT HAVE CHANGED (the launch plan of 1 Nov, step 0, B8; the pre-commit hook).
 *
 * A test's inputs are what it touched the last time it ran here under research/tests/trace-reads.mjs: every file it, its
 * node children and its workers read or loaded, every directory listed, every path probed. They are kept by test in
 * research/tests/fast-inputs.json (committed, so the full tier can check them), and the content each had when the test
 * last passed in this clone is kept in the git directory (fast-skip.json, never committed). A test runs unless every
 * input is as it was then; one that started another program (git, python, a shell) always runs; one with no record runs.
 * Each test that runs is traced again, and a pass records it. Paths under node_modules count as package-lock.json; a path
 * that exists here but not in a clean checkout (untracked, and not build-engine.py's) is left out (checkoutPaths).
 *
 *   node research/tests/fast-skip.mjs [-j N]       run the fast tier's tests whose inputs changed (exit 1 on a failure;
 *                                                   exit 2 when all passed and fast-inputs.json changed: stage it)
 *   node research/tests/fast-skip.mjs --all        run and trace every test of the tier
 *   node research/tests/fast-skip.mjs --dry        say what would run and why, run nothing
 *   node research/tests/fast-skip.mjs --check      the trace check: each test run in a tree holding only its recorded
 *                                                   inputs (listed names as empty stand-ins), traced again; it fails if
 *                                                   the test fails there or touches anything its record lacks
 *   --root DIR --tests a.test.mjs,b.test.mjs --inputs FILE --cache FILE     another tree and list (fast-skip.test.mjs)
 * CI runs the whole fast tier on every push (run-all.mjs fast), so a skip here can never hide a failure from CI.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, statSync, lstatSync, readdirSync, mkdirSync, mkdtempSync, rmSync, copyFileSync, symlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), TRACER = join(HERE, 'trace-reads.mjs');
const NM = 'node_modules', LOCK = 'package-lock.json';

/* the content of a path as an input: a file's hash, a directory's listing, or its absence */
export function stateOf(root, p, kind) {
  const a = join(root, p);
  let st; try { st = statSync(a); } catch { return 'absent'; }
  if (kind === 'list') return st.isDirectory() ? 'dir:' + createHash('sha256').update(listing(a).join('\n')).digest('hex').slice(0, 16) : 'file';
  if (st.isDirectory()) return 'dir';
  if (kind === 'probe') return 'file';
  return createHash('sha256').update(readFileSync(a)).digest('hex').slice(0, 16);
}
const listing = a => readdirSync(a, { withFileTypes: true }).map(d => d.name + (d.isDirectory() ? '/' : '')).sort();

/* one test's record from its processes' traces: what it read, probed and listed, outputs dropped */
export function recordOf(traces) {
  const u = k => new Set(traces.flatMap(t => t[k] || []));
  const read = u('read'), probe = u('probe'), list = u('list'), write = u('write'), first = u('firstWrite'), spawned = u('spawn');
  const fold = p => (p === NM || p.startsWith(NM + '/') ? LOCK : p);
  const keep = s => [...new Set([...s].map(fold))].filter(p => !first.has(p)).sort();
  const r = keep(read), pr = keep(probe).filter(p => !r.includes(p)), li = keep(list);
  const outdirs = [...new Set([...write].map(p => dirname(p)).filter(d => d !== '.'))].sort();
  return { read: r, probe: pr, list: li, outdirs, spawns: [...spawned].sort(), nodeModules: [...read].some(p => p.startsWith(NM + '/')) };
}
export const fingerprint = (root, rec) => Object.fromEntries([...rec.read.map(p => [p, stateOf(root, p, 'read')]), ...rec.probe.map(p => ['?' + p, stateOf(root, p, 'probe')]), ...rec.list.map(p => ['/' + p, stateOf(root, p, 'list')])]);
export const sameFp = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(k => a[k] === b[k]); };

/* the paths a clean checkout has: every file git tracks, the directories holding them, and build-engine.py's outputs. A
   path that exists here but is none of those (a local cache, a scratch file) is left out of a record, so the record is the
   same in every clone (hygiene's named research/solver/__pycache__, a cache this clone had and a fresh one lacks, on 1 Nov);
   a path absent here stays (absent in a clean checkout too). Outside a git work tree nothing is left out (null). */
export const GENERATED = ['research/engine.mjs', 'research/simplePlan.mjs'];
export function checkoutPaths(root, generated = GENERATED) {
  let files;
  try { files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean); } catch { return null; }
  const s = new Set(['.', LOCK, ...generated]);
  for (const f of files) { s.add(f); for (let p = f; p.includes('/');) { p = p.slice(0, p.lastIndexOf('/')); s.add(p); } }
  return s;
}
export function keepCheckout(root, rec, known) {
  if (!known) return rec;
  const local = p => { if (known.has(p)) return false; try { lstatSync(join(root, p)); return true; } catch { return false; } };
  return { ...rec, read: rec.read.filter(p => !local(p)), probe: rec.probe.filter(p => !local(p)), list: rec.list.filter(p => !local(p)) };
}

/* run one test file under the trace, in a tree; resolves to { code, secs, tail, traces } */
export function traced(root, file, traceRoot = root) {
  return new Promise(res => {
    const dir = mkdtempSync(join(tmpdir(), 'fast-trace-')), t0 = Date.now();
    const env = { ...process.env, TRACE_DIR: dir, TRACE_ROOT: traceRoot, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --import=${TRACER}`.trim() };
    const p = spawn(process.execPath, [join(root, file)], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', d => { out = (out + d).slice(-4000); }); p.stderr.on('data', d => { out = (out + d).slice(-4000); });
    p.on('close', code => {
      const traces = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => { try { return JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { return {}; } });
      rmSync(dir, { recursive: true, force: true });
      res({ code, secs: Math.round((Date.now() - t0) / 1000), tail: out.trim().split('\n').slice(-3).join(' | '), traces });
    });
  });
}

/* a tree holding only a record's inputs: files copied, probed files copied, listed names as empty stand-ins */
export function prunedTree(root, rec) {
  const t = mkdtempSync(join(tmpdir(), 'fast-pruned-'));
  const put = p => { const a = join(root, p), b = join(t, p); let st; try { st = lstatSync(a); } catch { return; } mkdirSync(dirname(b), { recursive: true }); if (st.isDirectory()) mkdirSync(b, { recursive: true }); else if (!existsSync(b)) copyFileSync(a, b); };
  for (const d of rec.list) { const a = join(root, d); if (!existsSync(a) || !statSync(a).isDirectory()) continue; mkdirSync(join(t, d), { recursive: true }); for (const n of listing(a)) { const b = join(t, d, n); if (n.endsWith('/')) mkdirSync(b, { recursive: true }); else if (!existsSync(b)) writeFileSync(b, ''); } }
  for (const p of [...rec.read, ...rec.probe]) if (p !== LOCK || !rec.nodeModules) put(p); else put(LOCK);
  // a stand-in written above for a file the test reads is replaced by the file
  for (const p of rec.read) { const a = join(root, p), b = join(t, p); try { if (statSync(a).isFile()) copyFileSync(a, b); } catch { } }
  for (const d of rec.outdirs) mkdirSync(join(t, d), { recursive: true });
  if (rec.nodeModules && existsSync(join(root, NM))) symlinkSync(join(root, NM), join(t, NM));
  return t;
}

function gitDir(root) { try { return resolve(root, execFileSync('git', ['rev-parse', '--git-dir'], { cwd: root, encoding: 'utf8' }).trim()); } catch { return join(root, '.git'); } }
const readJson = (f, d) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return d; } };

async function pool(items, J, fn) { const q = [...items]; await Promise.all(Array.from({ length: Math.min(J, q.length) }, async () => { while (q.length) await fn(q.shift()); })); }

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const J = Math.max(1, Number(opt('-j')) || 1), ROOT = resolve(opt('--root') || join(HERE, '../..'));
  const tests = opt('--tests') ? opt('--tests').split(',') : (await import('./run-all.mjs')).fastTier();
  const testPath = f => (f.includes('/') ? f : `research/tests/${f}`);
  const INPUTS = resolve(opt('--inputs') || join(HERE, 'fast-inputs.json')), CACHE = resolve(opt('--cache') || join(gitDir(ROOT), 'fast-skip.json'));
  const inputs = readJson(INPUTS, {}), cache = readJson(CACHE, {});

  if (args.includes('--check')) {
    const fails = [];
    await pool(tests, J, async f => {
      const rec = inputs[f];
      if (!rec) { fails.push(f); console.log(`FAIL ${f}: no record in ${INPUTS}`); return; }
      if (rec.spawns.length) { console.log(`skip ${f}: starts ${rec.spawns.join(', ')}, so it always runs and its record is not relied on`); return; }
      const t = prunedTree(ROOT, rec), r = await traced(t, testPath(f)), got = recordOf(r.traces);
      rmSync(t, { recursive: true, force: true });
      const has = new Set([...rec.read, ...rec.probe]), lists = new Set(rec.list);
      const extra = [...got.read.filter(p => !has.has(p)), ...got.probe.filter(p => !has.has(p)), ...got.list.filter(p => !lists.has(p)).map(p => p + '/')];
      if (r.code === 0 && extra.length === 0) console.log(`ok   ${f} (${r.secs} s, ${rec.read.length} files read, ${rec.probe.length} probed, ${rec.list.length} listed)`);
      else { fails.push(f); console.log(`FAIL ${f}: ${r.code !== 0 ? `exit ${r.code} in a tree of its inputs alone: ${r.tail.slice(0, 300)}` : ''}${extra.length ? ` touched beyond its record: ${extra.slice(0, 8).join(', ')}` : ''}`); }
    });
    console.log(`fast-skip --check: ${tests.length} tests, ${fails.length ? `FAILED: ${fails.join(', ')}` : 'every record complete'}`);
    process.exit(fails.length ? 1 : 0);
  }

  // which tests run, and why
  const plan = tests.map(f => {
    const rec = inputs[f], c = cache[f];
    if (args.includes('--all')) return { f, why: 'asked' };
    if (!rec) return { f, why: 'no traced inputs yet' };
    if (rec.spawns.length) return { f, why: `starts ${rec.spawns.join(', ')}` };
    if (!c) return { f, why: 'no pass recorded in this clone' };
    const now = fingerprint(ROOT, rec), changed = Object.keys(now).filter(k => now[k] !== c.fp[k]);
    return changed.length || !sameFp(now, c.fp) ? { f, why: `changed: ${changed.slice(0, 4).join(', ') || 'its input list'}${changed.length > 4 ? ` and ${changed.length - 4} more` : ''}` } : { f, why: null };
  });
  const run = plan.filter(p => p.why), skip = plan.filter(p => !p.why);
  for (const p of plan) console.log(`fast-skip: ${p.why ? 'run' : 'skip'} ${p.f}${p.why ? ` (${p.why})` : ''}`);
  if (args.includes('--dry')) process.exit(0);

  const bad = [];
  let inputsChanged = false;
  // each pass is kept as it lands, so a run stopped part way keeps what it traced
  const save = () => {
    writeFileSync(CACHE, JSON.stringify(cache));
    if (inputsChanged) writeFileSync(INPUTS, JSON.stringify(Object.fromEntries(Object.keys(inputs).sort().map(k => [k, inputs[k]])), null, 1) + '\n');
  };
  const known = run.length ? checkoutPaths(ROOT) : null;
  await pool(run.map(p => p.f), J, async f => {
    const r = await traced(ROOT, testPath(f));
    console.log(`${r.code === 0 ? 'ok  ' : 'FAIL'} ${f} (${r.secs} s)${r.code === 0 ? '' : `: ${r.tail.slice(0, 300)}`}`);
    if (r.code !== 0) { bad.push(f); delete cache[f]; save(); return; }
    const rec = keepCheckout(ROOT, recordOf(r.traces), known);
    if (JSON.stringify(rec) !== JSON.stringify(inputs[f])) { inputs[f] = rec; inputsChanged = true; }
    cache[f] = { fp: fingerprint(ROOT, rec), passed: new Date().toISOString() };
    save();
  });
  for (const f of Object.keys(inputs)) if (!tests.includes(f) && !opt('--tests')) { delete inputs[f]; inputsChanged = true; }
  save();
  console.log(`fast-skip: ${tests.length} tests, ${run.length} run, ${skip.length} skipped (inputs unchanged since they passed), ${run.length - bad.length} passed${bad.length ? `, FAILED: ${bad.join(', ')}` : ''}${inputsChanged && !bad.length ? `; the traced inputs changed, ${INPUTS} rewritten` : ''}`);
  process.exit(bad.length ? 1 : inputsChanged ? 2 : 0);
}
