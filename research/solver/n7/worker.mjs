/*
 * N7's worker: one solve at a time on this device, timed, its tables hashed for the check against Node's (build.mjs).
 * page.mjs posts { id, plan, opts }; the reply is { id, ok, secs, values, bytes, moves, digest } or { id, ok: false, error }.
 * Exported for the page's own thread too, when the browser refuses a worker.
 */
// src/solver reads two research switches from process.env as it loads; in a browser there is none, so the defaults apply
globalThis.process ??= { env: {} };
const mods = Promise.all([import('../../engine.mjs'), import('../../../src/solver/model.js'), import('../../../src/solver/solve.js'), import('./digest.mjs')]);

export async function solveOnce({ plan, opts }) {
  const [E, M, S, D] = await mods;
  const t0 = performance.now();
  const r = S.solvePlan(E, M, plan, opts);
  const secs = (performance.now() - t0) / 1000, A = D.tablesOf(r);
  return { secs, ...D.sizeOf(A), moves: r.actions.length, digest: await D.digestOf(A) };
}

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.onmessage = async ({ data }) => {
    try { self.postMessage({ id: data.id, ok: true, ...(await solveOnce(data)) }); }
    catch (e) { self.postMessage({ id: data.id, ok: false, error: String((e && e.message) || e) }); }
  };
  mods.then(() => self.postMessage({ ready: true }), e => self.postMessage({ ready: false, error: String((e && e.message) || e) }));
}
