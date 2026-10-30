/*
 * ONE SOLVE SPLIT ACROSS THE PAGE'S WORKERS (Part C Phase 7, research/solver/PHASE-7.md step 7a): E2 as research/solver/e2.mjs
 * runs it on Node's threads, built for a browser.
 *
 * solve.js does the splitting (its `opts.e2`): every part runs the same solve, allocates its tables through the pool in the
 * same order, claims each cell of a year first come, and waits at a barrier before the year below reads it. In Node, part 0
 * makes each table and posts it, and the others take it synchronously from a port; a browser worker cannot take a message
 * synchronously. So here every table is a view into one growable SharedArrayBuffer, the arena, and each part carves its
 * tables from it in its own call order: the same order and sizes in every part, so the same offsets, with no message at all.
 * Fresh memory from a grow is zero, as a fresh buffer is in e2.mjs. A part that throws sets the failure flag, and every part
 * waiting at the barrier throws too, so a split solve fails whole.
 *
 * Needs SharedArrayBuffer, which a page has only when cross-origin isolated (the COOP and COEP headers; PHASE-7.md, deferred
 * to Phase 12 for production), and growable buffers. `arenaFor` returns null where either is missing, and the solve then runs
 * whole in one worker. Exact: research/tests/solver-pool.test.mjs (the tables split and whole, and a planted part that drops
 * its cells), and the harness research/ui-harnesses/solver-progress-ui.cjs in a browser.
 */
const WAIT_MS = 1000;

/* the shared memory of one split solve: the arena, [arrived, generation, failed], one 64-bit sum slot and each part's
   allocation count and offset (up to 64 parts); null if impossible */
export function arenaFor(maxBytes = 2 ** 31) {
  if (typeof SharedArrayBuffer === 'undefined' || (typeof crossOriginIsolated !== 'undefined' && !crossOriginIsolated)) return null;
  for (let max = maxBytes; max >= 2 ** 28; max /= 2) {
    try {
      const buf = new SharedArrayBuffer(0, { maxByteLength: max });
      if (typeof buf.grow !== 'function' || !buf.growable) return null;
      return { buf, ctrl: new SharedArrayBuffer(16), sum: new SharedArrayBuffer(8), log: new SharedArrayBuffer(4 * 2 * 64) };
    } catch { /* the reservation refused: try half */ }
  }
  return null;
}

/* a part's pool on the arena: allocation in call order, the barrier, the cross-part sum and the failure flag */
export function arenaPool(part, parts, arena, planted = null) {
  const ctrl = new Int32Array(arena.ctrl), sum = new BigInt64Array(arena.sum), log = new Int32Array(arena.log), buf = arena.buf;
  const failed = () => Atomics.load(ctrl, 2) !== 0;
  const fail = () => { Atomics.store(ctrl, 2, 1); Atomics.add(ctrl, 1, 1); Atomics.notify(ctrl, 1); };
  let off = 0, made = 0;
  const take = (n, Kind) => {
    off = Math.ceil(off / 8) * 8;   // every view starts on an 8-byte boundary, whatever its kind
    const end = off + n * Kind.BYTES_PER_ELEMENT;
    if (buf.byteLength < end) {
      // another part may grow it past `end` first, and a grow to less than the current length throws: either way, enough
      try { buf.grow(end); } catch (e) { if (buf.byteLength < end) { fail(); throw new Error(`solverPool: part ${part} could not grow the arena to ${end} bytes (${e && e.message})`); } }
    }
    const a = new Kind(buf, off, n);
    off = end; made++;
    return a;
  };
  /*
   * Every part must have carved the same tables by each barrier (e2.mjs checks each table as it is taken; with no message
   * here, the last part to arrive compares every part's count and offset, and a part that strayed fails the solve).
   */
  const barrier = () => {
    const gen = Atomics.load(ctrl, 1);
    if (failed()) throw new Error(`solverPool: part ${part}: another part failed`);
    Atomics.store(log, 2 * part, made); Atomics.store(log, 2 * part + 1, off / 2);   // off is always even (every kind is two bytes or more), under 2^31 halved
    if (Atomics.add(ctrl, 0, 1) === parts - 1) {
      for (let q = 0; q < parts; q++) if (Atomics.load(log, 2 * q) !== made || Atomics.load(log, 2 * q + 1) !== off / 2) {
        fail(); throw new Error(`solverPool: part ${q} carved ${Atomics.load(log, 2 * q)} tables to ${2 * Atomics.load(log, 2 * q + 1)} bytes, part ${part} ${made} to ${off}`);
      }
      Atomics.store(ctrl, 0, 0); Atomics.add(ctrl, 1, 1); Atomics.notify(ctrl, 1); return;
    }
    while (Atomics.load(ctrl, 1) === gen) Atomics.wait(ctrl, 1, gen, WAIT_MS);
    if (failed()) throw new Error(`solverPool: part ${part}: another part failed`);
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

/* the failure flag from outside the parts (the page, when a worker dies or the solve is cancelled) */
export function failArena(arena) {
  const ctrl = new Int32Array(arena.ctrl);
  Atomics.store(ctrl, 2, 1); Atomics.add(ctrl, 1, 1); Atomics.notify(ctrl, 1);
}
