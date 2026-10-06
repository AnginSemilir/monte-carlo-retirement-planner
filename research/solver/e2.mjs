/*
 * E2: ONE SOLVE SPLIT ACROSS CORES (PLAN.md Phase 4 condition 5; the maintainer, 6 Oct: 'Include e2 as counted in gate 5',
 * '4 cores is fine'). The research build of it, on Node's worker threads; the app's is Phase 7's, on its own workers.
 *
 *   const r = await solveSplit(E, M, plan, opts, 4);   // the same result solvePlan(E, M, plan, opts) returns
 *
 * The calling thread is part 0 and runs solvePlan itself; parts 1..n-1 are workers running the same call (e2-worker.mjs).
 * solve.js does the splitting (its opts.e2): every part allocates its tables through the pool below, in the same order,
 * so table i is the same shared memory in every part; part 0 creates each one and posts it to the workers, which take it
 * synchronously from their port. Each cell of a year goes to the first part to claim it, then every part waits at the barrier (Atomics), so no
 * part reads a year before every part has written it. A part that throws sets the failure flag, and every waiting part
 * throws too: a split solve fails whole, never half-written.
 *
 * Exact: every table the same split and unsplit, checked by research/tests/e2.test.mjs (as E3c checked e3), with a
 * planted fault the check must catch.
 */
import { Worker, MessageChannel } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { solvePlan } from '../../src/solver/solve.js';

const WORKER = fileURLToPath(new URL('./e2-worker.mjs', import.meta.url));
const WAIT_MS = 1000;

/* the shared control block: [arrived, generation, failed] and one 64-bit sum slot */
export function makeControl() {
  return { ctrl: new SharedArrayBuffer(16), sum: new SharedArrayBuffer(8) };
}

/* a part's pool: allocation (part 0 creates and posts, the others receive), the barrier and the cross-part sum */
export function makePool(part, parts, control, ports, planted = null) {
  const ctrl = new Int32Array(control.ctrl), sum = new BigInt64Array(control.sum);
  const failed = () => Atomics.load(ctrl, 2) !== 0;
  const fail = () => { Atomics.store(ctrl, 2, 1); Atomics.add(ctrl, 1, 1); Atomics.notify(ctrl, 1); };
  let made = 0;
  const take = (n, Kind) => {
    made++;
    if (part === 0) {
      const sab = new SharedArrayBuffer(n * Kind.BYTES_PER_ELEMENT);
      for (const p of ports) p.postMessage({ i: made, n, kind: Kind.name, sab });
      return new Kind(sab);
    }
    // a worker: the next buffer part 0 made, taken synchronously; the order and size must match its own call's
    for (;;) {
      const got = ports[0].receive();
      if (got) {
        const { i, n: n0, kind, sab } = got.message;
        if (i !== made || n0 !== n || kind !== Kind.name) { fail(); throw new Error(`e2: part ${part} asked for table ${made} (${Kind.name} ${n}), part 0 made ${i} (${kind} ${n0})`); }
        return new Kind(sab);
      }
      if (failed()) throw new Error(`e2: part ${part}: another part failed`);
      Atomics.wait(ctrl, 1, Atomics.load(ctrl, 1), 5);
    }
  };
  const barrier = () => {
    const gen = Atomics.load(ctrl, 1);
    if (failed()) throw new Error(`e2: part ${part}: another part failed`);
    if (Atomics.add(ctrl, 0, 1) === parts - 1) { Atomics.store(ctrl, 0, 0); Atomics.add(ctrl, 1, 1); Atomics.notify(ctrl, 1); return; }
    while (Atomics.load(ctrl, 1) === gen) Atomics.wait(ctrl, 1, gen, WAIT_MS);
    if (failed()) throw new Error(`e2: part ${part}: another part failed`);
  };
  const total = (n) => {
    Atomics.add(sum, 0, BigInt(n)); barrier();
    const v = Number(Atomics.load(sum, 0)); barrier();
    if (part === 0) Atomics.store(sum, 0, 0n);
    barrier();
    return v;
  };
  return { part, parts, planted, f64: (n) => take(n, Float64Array), u16: (n) => take(n, Uint16Array), i32: (n) => take(n, Int32Array), barrier, sum: total, fail };
}

/* solvePlan split across `parts` cores; resolves to part 0's result once every worker has finished. `planted` (tests only):
   'drop' - part 1 claims cells and never writes them; 'throw' - part 2 fails before it starts */
export async function solveSplit(E, M, plan, opts = {}, parts = 4, planted = null) {
  if (!(parts >= 2)) return solvePlan(E, M, plan, opts);
  const control = makeControl();
  const workers = [], ports = [], ends = [];
  for (let part = 1; part < parts; part++) {
    const { port1, port2 } = new MessageChannel();
    const w = new Worker(WORKER, { workerData: { part, parts, control, plan, opts, port: port2, planted }, transferList: [port2] });
    ends.push(new Promise((resolve, reject) => {
      w.once('error', (e) => { Atomics.store(new Int32Array(control.ctrl), 2, 1); reject(e); });
      w.once('exit', (code) => (code === 0 ? resolve() : reject(new Error(`e2: part ${part} exited ${code}`))));
    }));
    workers.push(w); ports.push(port1);
  }
  const pool = makePool(0, parts, control, ports);
  let r;
  try { r = solvePlan(E, M, plan, { ...opts, e2: pool }); }
  catch (e) { pool.fail(); await Promise.allSettled(ends); throw e; }
  await Promise.all(ends);
  for (const p of ports) p.close();
  return r;
}
