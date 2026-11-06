/*
 * THE PAGE'S SIDE OF THE SOLVER (Part C Phase 7, research/solver/PHASE-7.md). Loaded lazily, by src/useSolver.js when the
 * switch is on, so the first load of the app fetches none of it.
 *
 *   const key = await keyOf(engine, plan, opts);          // what the solve depends on (src/solverKey.js); the engine is
 *                                                         // App.jsx's, handed in (importing App.jsx here would split the
 *                                                         // page's own first-load code into another chunk)
 *   const job = startSolve(plan, { key, base, parts, lambda, points, research, onProgress, onStored });
 *   const { meta, secs, parts, restored, base } = await job.done;   // rejects with 'cancelled' after job.cancel()
 *   await job.ask('simulate', { trials, seed });          // the owner worker's answers (src/solverWorker.js)
 *   await job.strategy(plan, seed, upto, { exact });      // the Strategy tab's figures, split across the solve's parts (exact:
 *                                                         // the first `upto` paths alone, though more have been run)
 *   await job.actions(plan, seed, n);                     // this year's skip costs, split the same way
 *   job.close();                                          // the owner worker, and the solved tables with it, let go
 *   const f = startFigures(engine, plan, { seed, upto });  // a variant's figures, its tables let go (Phase 10, F6)
 *
 * With a key, the owner first asks the store (src/solverCache.js): a stored solve of the same key and code is restored in that
 * one worker; otherwise the plan is solved, split across workers where the page is cross-origin isolated (src/solverPool.js),
 * and stored. Elsewhere the solve runs whole in one worker.
 * A dial position above 1 (step L2) names its base ({ plan, key }: baseOf): the owner first restores or solves the base and
 * keeps it, then solves the position on it; a split position's parts each restore the base from one shared copy. The store
 * keeps the base beside the latest position (src/solverCache.js), so another position of the same plan costs one solve.
 */
import { arenaFor, failArena } from './solverPool.js';
// Part C Phase 10 (B5): the page's isolation where its host sends no headers, asked for with the first solve (src/useSolver.js)
export { ensureIsolation } from './isolation.js';
import { solveKey } from './solverKey.js';
import { dialBase } from './solverSettings.js';

export const PLANT = { rule: '' };   // tests only: 'noqueue' lets two figures' asks run at once (solver-client.test.mjs); 'keepshared' keeps a job's shared memory after it is let go (solver-close.test.mjs); 'phoneparts' lifts the phone's budget (phone-budget.test.mjs)
export const canSplit = () => typeof SharedArrayBuffer !== 'undefined' && (typeof crossOriginIsolated === 'undefined' || crossOriginIsolated)
  && typeof SharedArrayBuffer.prototype.grow === 'function';
/* gate 5's four cores at most (D11), fewer where the machine has fewer */
export const defaultParts = () => (canSplit() ? Math.max(1, Math.min(4, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 1)) : 1);
/*
 * THE PHONE'S BUDGET (Phase 11 item 2; the launch plan's F5: "Phase 11 ... sets the phone's budget from the result"). A dial
 * position solves its base first, and each part of its split solve restores the base (L2), so its peak memory grows with the
 * parts; the solve on show peaks at about the same split any way (results-phone-memory.txt). On a touch device (no fine,
 * hovering pointer: a phone or a tablet, in either orientation) a solve with a base splits TOUCH_BASE_PARTS ways at most;
 * every other solve, and every solve elsewhere, splits as before (research/tests/phone-budget.test.mjs).
 */
export const TOUCH_BASE_PARTS = 2;
export const touchDevice = () => typeof window !== 'undefined' && !!window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const partsFor = (parts, base) => (base && touchDevice() && PLANT.rule !== 'phoneparts' ? Math.min(parts, TOUCH_BASE_PARTS) : parts);
const newWorker = () => new Worker(new URL('./solverWorker.js', import.meta.url), { type: 'module' });
/* the solve's key on the page: the plan as the solver takes it and the settings (the code is checked by the worker) */
export const keyOf = (engine, plan, opts = {}) => solveKey(engine, plan, opts);
/* a dial position's base as startSolve takes it ({ plan, key }), or null at position 1 */
export async function baseOf(engine, plan, opts = {}) {
  const bp = dialBase(engine.normalizePlan(plan));
  return bp ? { plan: bp, key: await solveKey(engine, bp, opts) } : null;
}

/*
 * A PLAN'S FIGURES WITHOUT ITS TABLES (Part C Phase 10; the launch plan's F6: "a position not chosen keeps only its figures").
 * A variant of the plan on screen (another of the dial's positions, another retirement age, a scenario, a step of a search)
 * solved in workers of its own, the Strategy tab's headline and comparison run on the paths and seed the plan's own use,
 * and the workers let go: only the figures are kept. A dial position's base is restored from the store where it is kept
 * (the store keeps the base beside the latest position), so a position costs one solve. The variant itself is neither
 * restored nor stored unless `keyed` (the dial's position 1 is that base, restored by its key).
 *   const f = startFigures(engine, plan, { seed, upto, ...opts });   const { headline, compare } = await f.done;   f.cancel();
 */
export function startFigures(engine, plan, { seed, upto, keyed = false, parts = defaultParts(), ...opts } = {}) {
  let job = null, cancelled = false;
  const done = (async () => {
    const base = await baseOf(engine, plan, opts), key = keyed ? await keyOf(engine, plan, opts) : null;
    if (cancelled) throw new Error('cancelled');
    job = startSolve(plan, { ...opts, key, base, parts });
    try {
      await job.done;
      const { strategy } = await job.strategy(plan, seed, upto, { exact: true });
      return { headline: strategy.headline, compare: strategy.compare };
    } finally { job.close(); }
  })();
  return { done, cancel() { cancelled = true; if (job) { job.cancel(); job.close(); } } };
}

export function startSolve(plan, { key = null, base = null, parts: asked = defaultParts(), onProgress = null, onStored = null, ...opts } = {}) {
  const parts = partsFor(asked, base);
  const owner = newWorker(), workers = [owner], pending = new Map();
  let seq = 0, finished = false, rejectDone = null, arena = null, n = 1;
  // a job let go keeps none of its shared memory (Phase 11, phone-memory.cjs): its handle can outlive it (an earlier state of
  // the page holds its asks), so the arena is dropped here and not left to the handle (research/tests/solver-close.test.mjs)
  // so are the workers' handlers, which the solve's phases set and which close over what a phase held (a position's shared base)
  const release = () => { if (PLANT.rule === 'keepshared') return; arena = null; for (const w of workers) { w.onmessage = null; w.onerror = null; } };
  const stop = () => { if (arena) failArena(arena); workers.forEach(w => w.terminate()); release(); };
  // the owner's answers: ask() replies by id, the solve's own messages under id 0
  let onMain = null;
  owner.onmessage = ({ data }) => {
    if (data.id !== 0) {
      const p = pending.get(data.id); if (!p) return; pending.delete(data.id);
      if (data.error) p.reject(new Error(data.error)); else p.resolve(data);
      return;
    }
    if (data.progress) { if (onProgress) onProgress(data.progress); return; }
    if (data.stored !== undefined) { if (onStored) onStored(data.stored, data.why || null); return; }
    if (onMain) onMain(data);
  };
  const ask = (kind, extra = {}) => {
    const id = ++seq;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); owner.postMessage({ id, kind, ...extra }); });
  };
  // a kept part's questions, answered by id as the owner's are
  let kept = [];
  const askerOf = w => {
    const waiting = new Map();
    w.onmessage = ({ data }) => { const p = waiting.get(data.id); if (!p) return; waiting.delete(data.id); if (data.error) p.reject(new Error(data.error)); else p.resolve(data); };
    w.onerror = e => { for (const p of waiting.values()) p.reject(new Error((e && e.message) || 'a solver part failed')); waiting.clear(); };
    return (kind, extra = {}) => { const id = ++seq; return new Promise((resolve, reject) => { waiting.set(id, { resolve, reject }); w.postMessage({ id, kind, ...extra }); }); };
  };
  /*
   * The Strategy tab's figures on paths 0 to upto-1 (src/solverWorker.js 'strategy'). With a split solve's parts kept, the
   * paths not yet run are shared out evenly, the owner taking the first share, and the owner joins them in path order, so
   * the figures are the whole run's (research/tests/sim-split.test.mjs). Without parts, the owner runs them all.
   */
  let have = 0, haveKey = null, line = Promise.resolve();
  const strategyNow = async (plan, seed, upto, { exact = false } = {}) => {
    const k = JSON.stringify([seed, plan]);
    if (k !== haveKey) { have = 0; haveKey = k; }
    if (!kept.length || upto <= have) { const r = await ask('strategy', { plan, seed, upto, exact }); have = Math.max(have, upto); return r; }
    const all = [ask, ...kept], n = all.length, span = upto - have;
    const share = i => [have + Math.floor((i * span) / n), have + Math.floor(((i + 1) * span) / n)];
    const got = await Promise.all(all.map((a, i) => a('runs', { plan, seed, from: share(i)[0], to: share(i)[1] })));
    const r = await ask('strategy', { plan, seed, upto, exact, runs: got.map(g => g.runs) });
    have = upto;
    return r;
  };
  // one at a time (Phase 10): the Strategy tab, the age dial, the dial's line and the scenarios each ask for figures of the one
  // solve, and two asks at once would share out the same next paths, which the owner refuses to join twice
  const strategy = (...args) => {
    const r = PLANT.rule === 'noqueue' ? strategyNow(...args) : line.then(() => strategyNow(...args));
    line = r.catch(() => {});
    return r;
  };

  /*
   * This year's skip costs on paths 0 to n-1 (src/solverWorker.js 'actions'), after the headline. With a split solve's parts
   * kept, each part runs the skips on its share of the paths ('skipruns') and the owner joins them in path order against the
   * plan's runs it holds, so the costs are the whole run's (research/tests/skip-split.test.mjs). Without parts, the owner runs
   * them all.
   */
  const actions = async (plan, seed, n) => {
    if (!kept.length) return ask('actions', { plan, seed, n });
    const all = [ask, ...kept], m = all.length, share = i => [Math.floor((i * n) / m), Math.floor(((i + 1) * n) / m)];
    const got = await Promise.all(all.map((a, i) => a('skipruns', { plan, seed, from: share(i)[0], to: share(i)[1] })));
    return ask('actions', { plan, seed, n, parts: got.map(g => g.skipruns) });
  };

  const done = new Promise((resolve, reject) => {
    rejectDone = reject;
    // one solve: the base of a dial position ('base') or the plan itself ('solve'), restored when stored, else split where it can be
    const phase = async (kind, phasePlan, phaseKey, baseKey) => {
      const hit = phaseKey ? (await ask('probe', { key: phaseKey })).hit : false;
      if (finished) return null;
      n = 1; arena = null;
      if (!hit && parts > 1 && canSplit()) { arena = arenaFor(); if (arena) n = parts; }
      // a split position's parts each restore its base, shared once by the owner that holds it
      let partBase = n > 1 && baseKey ? { plan: base.plan, rec: (await ask('share')).rec } : null;
      const ends = [];
      for (let i = 1; i < n; i++) {
        const w = newWorker(); workers.push(w);
        ends.push(new Promise((res, rej) => {
          w.onmessage = ({ data }) => (data.error ? rej(new Error(data.error)) : res());
          w.onerror = e => rej(new Error((e && e.message) || `solver part ${i} failed`));
          w.postMessage({ kind: 'part', part: i, parts: n, arena, plan: phasePlan, opts, ...(partBase ? { base: partBase } : {}) });
        }));
      }
      const main = new Promise((res, rej) => {
        onMain = data => (data.error ? rej(new Error(data.error)) : res(data));
        owner.onerror = e => rej(new Error((e && e.message) || 'the solver failed'));
        owner.postMessage({ id: 0, kind, plan: phasePlan, opts, parts: n, arena, key: phaseKey, ...(baseKey ? { baseKey } : {}) });
      });
      const [m] = await Promise.all([main, ...ends]);
      // the parts hold the base they were sent: the page lets its copy go (solver-close.test.mjs)
      if (PLANT.rule !== 'keepshared') partBase = null;
      // the plan's own solve keeps its parts, each holding the solve, to run its share of the Strategy tab's paths (Phase 9);
      // a dial position's base lets them go
      if (kind === 'solve') kept = workers.slice(1).map(askerOf); else workers.splice(1).forEach(w => w.terminate());
      return m;
    };
    (async () => {
      const b = base ? await phase('base', base.plan, base.key, null) : null;
      if (finished || (base && !b)) return;
      const m = await phase('solve', plan, key, base ? base.key : null);
      if (finished || !m) return; finished = true;
      resolve({ meta: m.meta, secs: m.secs + (b ? b.secs : 0), parts: n, restored: !!m.restored, base: b ? { restored: b.restored || false, secs: b.secs } : null, code: m.code || null });
    })().catch(err => { if (finished) return; finished = true; stop(); reject(err); });
  });
  return {
    done,
    get parts() { return n; },
    cancel() {
      if (finished) return; finished = true;
      stop();
      rejectDone(new Error('cancelled'));
    },
    ask,
    strategy,
    actions,
    close() { owner.terminate(); kept.forEach((_, i) => workers[i + 1] && workers[i + 1].terminate()); workers.splice(1).forEach(w => w.terminate()); kept = []; for (const p of pending.values()) p.reject(new Error('closed')); pending.clear(); release(); }
  };
}
