/*
 * A RESTORED SOLVE HOLDS ITS TABLES ONCE (Phase 11 item 2, found by phone-memory.cjs). A solve restored from the store
 * (src/solverCache.js; solve.js `opts.restore`) copies the record's tables into its own year by year, and the solve keeps its
 * options; until the fix it kept the record through them, so a restored solve held its tables twice: S116 at 45 points in the
 * browser, 512MB with one solve on show after a restore against 307MB after the same solve made fresh. The full tier.
 *
 * On S116 and S370 (S370 with the tier state's layers and the adaptive reference), at light settings:
 * 1. a restored solve keeps none of its record once the caller lets it go, as the worker does (its handler returns): a weak
 *    reference to every array of the record, none left after a garbage collection. Beside it, reported: the heap and the
 *    array buffers held against the same solve made fresh (a fresh solve also keeps the caches it built, S1's memo among
 *    them, which a restore never builds, so the fresh solve is no bound);
 * 2. the restored solve is the fresh one's: its tables bit for bit, and the engine's run of the solved plan on 200 paths the
 *    same (the record's tables are not read after the solve).
 * Its plant 'holdrecord' (src/solverApp.js PLANT: the record kept, as before the fix) fails check 1.
 *   node --expose-gc research/tests/restore-memory.test.mjs [--plant holdrecord]
 *   node research/tests/restore-memory.test.mjs --plants
 */
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const PLANTS = { holdrecord: [1] };
const self = fileURLToPath(import.meta.url);
if (typeof global.gc !== 'function' || args[0] === '--plants') {
  // the measurement needs the garbage collector by hand: run again under --expose-gc (each plant in its own process)
  const runs = args[0] === '--plants' ? Object.keys(PLANTS).map(p => ['--plant', p]) : [args];
  let bad = 0;
  for (const a of runs) {
    let out = '';
    try { out = execFileSync(process.execPath, ['--expose-gc', self, ...a], { encoding: 'utf8' }); } catch (e) { out = e.stdout || ''; if (args[0] !== '--plants') bad = 1; }
    if (args[0] !== '--plants') { process.stdout.write(out); continue; }
    const want = PLANTS[a[1]], failed = [...new Set(out.split('\n').filter(l => l.startsWith('  FAIL ')).map(l => Number(/^ {2}FAIL (\d+)\./.exec(l)?.[1])))].sort((x, y) => x - y);
    const right = JSON.stringify(failed) === JSON.stringify(want);
    if (!right) bad++;
    console.log(`plant '${a[1]}': checks failing ${failed.join(', ') || 'none'} (its own: ${want.join(', ')}) ${right ? 'ok' : 'WRONG'}`);
  }
  if (args[0] === '--plants') console.log(bad ? `PLANTS: ${bad} of ${runs.length} did not fail exactly their own checks` : `PLANTS: all ${runs.length} fail exactly their own checks`);
  process.exit(bad ? 1 : 0);
}
const PLANT_NAME = args[0] === '--plant' ? args[1] : null;
if (PLANT_NAME && !PLANTS[PLANT_NAME]) { console.log(`no plant '${PLANT_NAME}'`); process.exit(2); }

const load = rel => import(pathToFileURL(join(ROOT, rel)).href);
let E = await load('research/engine.mjs').catch(() => null);
if (!E) { execFileSync('python3', [join(ROOT, 'research/build-engine.py')], { stdio: 'ignore' }); E = await load('research/engine.mjs'); }
const M = await load('src/solver/model.js');
const { runPolicy } = await load('src/solver/solve.js');
const { solveForApp, PLANT } = await load('src/solverApp.js');
const { cacheOf, recordBytes } = await load('src/solverCache.js');
const { tablesOf, digestOf } = await load('src/solverDigest.js');
const { buildScenarios } = await load('research/policy-study/scenarios.mjs');
if (PLANT_NAME) PLANT.rule = PLANT_NAME;

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const all = buildScenarios(), raw = id => all.find(s => s.id === id).plan;
const OPTS = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
// the heap and the array buffers after a garbage collection, settled: an array buffer's memory is let go after the collection
// that finds it unreachable, so collect, wait, and collect again until the figure holds still
const held = async () => {
  let last = Infinity;
  for (let i = 0; i < 20; i++) {
    global.gc();
    await new Promise(r => setTimeout(r, 100));
    const m = process.memoryUsage(), now = m.heapUsed + m.arrayBuffers;
    if (Math.abs(now - last) < 1 << 20) return now;
    last = now;
  }
  return last;
};
const MB = n => `${(n / 1048576).toFixed(1)}MB`;
const NP = 200, SEED = 99002;
const runs = r => JSON.stringify(E.pathsForSeed(SEED, NP, r.m.ctx.totalYears).map(zs => runPolicy(r, zs)));

const mem = [], same = [];
for (const id of ['S116', 'S370']) {
  const plan = raw(id);
  let fresh = solveForApp(E, M, plan, OPTS);
  // what the fresh solve gives first: running paths fills the engine's caches, which outlive the solve, so the fresh solve is
  // weighed after them
  const want = { digest: await digestOf(tablesOf(fresh)), runs: runs(fresh) };
  const m0 = await held();
  const holder = { rec: structuredClone(cacheOf(fresh)) }, bytes = recordBytes(holder.rec);
  // a weak reference to every array of the record: none may outlive the restore once the caller lets the record go
  const weak = [], walk = v => { if (ArrayBuffer.isView(v)) weak.push(new WeakRef(v)); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(holder.rec);
  fresh = null;
  // the worker's handler: the record a local of a function that returns (src/solverWorker.js 'solve' with a stored solve)
  const restoreOf = h => { const rec = h.rec; h.rec = null; return solveForApp(E, M, plan, { ...OPTS, restore: rec }); };
  const r = restoreOf(holder);
  const m1 = await held(), extra = m1 - m0, live = weak.filter(w => w.deref() !== undefined).length;
  mem.push({ id, extra, bytes, live, arrays: weak.length, ok: live === 0 });
  const got = { digest: await digestOf(tablesOf(r)), runs: runs(r) };
  same.push({ id, ok: got.digest === want.digest && got.runs === want.runs && r.meta.restored === true, digest: got.digest.slice(0, 12) });
}
ok(1, 'a restored solve keeps none of its record once the caller lets it go (every array of the record collected)', mem.every(x => x.ok), mem.map(x => `${x.id} ${x.live} of the record's ${x.arrays} arrays kept (${MB(x.bytes)}); held beside the fresh solve ${x.extra >= 0 ? '+' : ''}${MB(x.extra)}, reported`).join('; '));
ok(2, 'the restored solve is the fresh one\'s: its tables bit for bit, the engine\'s run of 200 paths the same', same.every(x => x.ok), same.map(x => `${x.id} ${x.ok ? 'the same' : 'DIFFERS'} (${x.digest})`).join('; '));

console.log(`\n${passed} passed, ${failed} failed${PLANT_NAME ? ` (planted: ${PLANT_NAME})` : ''}`);
process.exit(failed ? 1 : 0);
