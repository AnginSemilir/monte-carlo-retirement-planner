/*
 * A SOLVE LET GO KEEPS NONE OF ITS SHARED MEMORY (Phase 11 item 2, found by phone-memory.cjs). A split solve's tables live in
 * a shared arena the client makes (src/solverPool.js arenaFor). When the plan changes the page cancels and closes the job, but
 * its handle can outlive it (an earlier state of the page holds its asks), and the handle kept the arena: on S116 at 45 points
 * in the browser, back at the dial's default with the solve restored on one worker, the page's processes held about as much
 * split two or four ways as at the locked position before it, and a third of that split one way (results-phone-memory.txt).
 * The client now drops the arena when a job is closed or cancelled. The full tier.
 *
 * On S126 at light settings, the solve split two ways, its workers run in this process (as solver-client.test.mjs runs them),
 * every shared buffer the client makes watched by a weak reference:
 *   1. the control: a split solve that is done and still in use keeps its arena (the watch can see a buffer held);
 *   2. a job closed, its handle still held: none of its shared buffers left after a garbage collection;
 *   3. a job cancelled while it solves, its handle still held: the same;
 *   4. a dial position's job (its base solved first, then the position split with the base shared out to its parts), closed,
 *      its handle still held: none of its shared buffers left, the base shared out among them (the workers' handlers, set by
 *      the solve's phases, closed over it).
 * The plant (the client's PLANT 'keepshared': what a job held kept after it is let go) fails checks 2, 3 and 4.
 *   node --expose-gc research/tests/solver-close.test.mjs [--plant keepshared]
 *   node research/tests/solver-close.test.mjs --plants
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), self = fileURLToPath(import.meta.url);
const PLANTS = { keepshared: [2, 3, 4] };
if (typeof global.gc !== 'function' || args[0] === '--plants') {
  // the collector by hand: run again under --expose-gc (each plant in its own process)
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

// every shared buffer made from here on, watched by a weak reference
const RealSAB = globalThis.SharedArrayBuffer, made = [];
globalThis.SharedArrayBuffer = new Proxy(RealSAB, { construct(T, a) { const b = new T(...a); made.push(new WeakRef(b)); return b; } });

const E = await import('../engine.mjs');
const M = await import('../../src/solver/model.js');
const { solveForApp } = await import('../../src/solverApp.js');
const { buildScenarios } = await import('../policy-study/scenarios.mjs');

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const opts = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S126').plan);

/* a solver worker in this process (solver-client.test.mjs's): each part holds the plan solved whole, solved once; `slow`, the
   milliseconds it takes to answer (check 3 cancels a job before its workers answer) */
let slow = 0;
const shares = [];   // the bases shared out, watched on their own
const solves = new Map();
const solveOnce = (p, o) => { const k = JSON.stringify([p, o]); if (!solves.has(k)) solves.set(k, solveForApp(E, M, p, o)); return solves.get(k); };
class InProcessWorker {
  constructor() { this.solved = null; this.onmessage = null; this.onerror = null; this.dead = false; }
  postMessage(data) { setTimeout(() => this.handle(data), slow); }
  terminate() { this.dead = true; }
  reply(m) { setImmediate(() => { if (!this.dead && this.onmessage) this.onmessage({ data: m }); }); }
  handle(data) {
    if (this.dead) return;
    const { id, kind } = data;
    try {
      if (kind === 'part') { this.solved = solveOnce(data.plan, data.opts); this.reply({ done: true }); return; }
      if (kind === 'solve' || kind === 'base') { this.solved = solveOnce(data.plan, data.opts); this.reply({ id, done: true, meta: {}, secs: 0, restored: false }); return; }
      if (kind === 'probe') { this.reply({ id, hit: false }); return; }
      // the base shared out to a split position's parts (src/solverWorker.js 'share': the held base in shared memory)
      if (kind === 'share') { const b = new SharedArrayBuffer(8 * 4096); shares.push(new WeakRef(b)); this.reply({ id, rec: { layers: [new Float64Array(b)] } }); return; }
      throw new Error(`no '${kind}' here`);
    } catch (e) { this.reply({ id, error: e.message }); }
  }
}
globalThis.Worker = InProcessWorker;
const C = await import('../../src/solverClient.js');
if (PLANT_NAME) C.PLANT.rule = PLANT_NAME;
solveOnce(plan, opts);   // solved once, before the watch counts: the tables the workers hold are not the client's

const settle = async () => { for (let i = 0; i < 6; i++) { global.gc(); await new Promise(r => setTimeout(r, 50)); } };
const alive = from => made.slice(from).filter(w => w.deref() !== undefined).length;
const held = [];   // the handles, kept as an earlier state of the page keeps them

// 1. the control
let from = made.length;
{ const job = C.startSolve(plan, { ...opts, parts: 2 }); held.push(job); const d = await job.done; await settle();
  ok(1, 'a split solve done and in use keeps its arena', d.parts === 2 && alive(from) > 0, `split ${d.parts} ways; ${alive(from)} of ${made.length - from} shared buffers alive`); }
// 2. closed
{ const job = held[0]; job.close(); await settle();
  ok(2, 'a job closed, its handle still held: none of its shared buffers left', alive(from) === 0, `${alive(from)} of ${made.length - from} alive after the close`); }
// 3. cancelled while it solves
from = made.length;
{ slow = 500;
  const job = C.startSolve(plan, { ...opts, parts: 2 }); held.push(job);
  let state = 'solving'; job.done.then(() => { state = 'done'; }, e => { state = e.message; });
  await new Promise(r => setTimeout(r, 50));
  const started = made.length - from, before = state; job.cancel(); await settle(); await new Promise(r => setTimeout(r, 600)); await settle();
  ok(3, 'a job cancelled while it solves, its handle still held: none of its shared buffers left', before === 'solving' && state === 'cancelled' && started > 0 && alive(from) === 0, `${started} made before the cancel, the job ${before} then ${state}; ${alive(from)} alive after it`); }

// 4. a dial position: its base first, then the position split with the base shared out
slow = 0; from = made.length;
{ const job = C.startSolve(plan, { ...opts, parts: 2, key: 'the-position', base: { plan, key: 'the-base' } }); held.push(job);
  const d = await job.done; await settle(); const made4 = made.length - from;
  job.close(); await settle();
  const base = shares.filter(w => w.deref() !== undefined).length;
  ok(4, 'a dial position\'s job closed, its handle still held: none of its shared buffers left, the shared base among them', d.parts === 2 && shares.length === 1 && base === 0 && alive(from) === 0, `split ${d.parts} ways, ${made4} shared buffers made, the base shared out ${shares.length} time(s); after the close ${alive(from)} alive, the shared base ${base ? 'kept' : 'let go'}`); }

console.log(`\n${passed} passed, ${failed} failed${PLANT_NAME ? ` (planted: ${PLANT_NAME})` : ''}`);
process.exit(failed ? 1 : 0);
