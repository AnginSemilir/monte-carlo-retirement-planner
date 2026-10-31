/*
 * THE SOLVED TABLES, KEPT ACROSS VISITS (Part C Phase 7b, research/solver/PHASE-7.md). A candidate solve is minutes of four
 * cores, so the worker that solved a plan stores its tables in IndexedDB under the solve's key (src/solverKey.js: the plan
 * as the solver takes it, the settings and the solver's own code), and a later visit with the same key restores them in
 * seconds (solve.js `opts.restore`) instead of solving again. The latest plan only: a candidate solve at 45 points is about
 * 261 MB of tables (results-n7-check.txt), so each store replaces the one before. Any failure (no IndexedDB, a private
 * window, the quota) is a miss: the plan is solved, never refused.
 */
const DB = 'rp-solver', STORE = 'solves';

const open = () => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') { reject(new Error('no IndexedDB')); return; }
  const q = indexedDB.open(DB, 1);
  q.onupgradeneeded = () => q.result.createObjectStore(STORE);
  q.onsuccess = () => resolve(q.result);
  q.onerror = () => reject(q.error);
});
const tx = (db, mode, fn) => new Promise((resolve, reject) => {
  const t = db.transaction(STORE, mode), s = t.objectStore(STORE);
  let out;
  Promise.resolve(fn(s)).then(v => { out = v; });
  t.oncomplete = () => resolve(out);
  t.onerror = () => reject(t.error);
  t.onabort = () => reject(t.error || new Error('aborted'));
});
const req = q => new Promise((resolve, reject) => { q.onsuccess = () => resolve(q.result); q.onerror = () => reject(q.error); });

/* whether a solve of this key, made by this code, is stored: the small record beside it, so asking loads no tables */
export async function probeSolve(key, code) {
  try {
    const db = await open();
    const k = await tx(db, 'readonly', s => req(s.get('latestKey')));
    db.close();
    return !!(k && k.key === key && k.code === code);
  } catch { return false; }
}

/* the stored solve for this key, made by this code (the worker's own fingerprinted URL), or null */
export async function loadSolve(key, code) {
  try {
    const db = await open();
    const rec = await tx(db, 'readonly', s => req(s.get('latest')));
    db.close();
    return rec && rec.key === key && rec.code === code ? rec : null;
  } catch { return null; }
}

/* store this solve as the latest, with the code that made it; resolves to true when written */
export async function storeSolve(key, code, record) {
  try {
    const db = await open();
    await tx(db, 'readwrite', s => { s.clear(); s.put({ ...record, key, code, stored: Date.now() }, 'latest'); s.put({ key, code }, 'latestKey'); });
    db.close();
    return true;
  } catch { return false; }
}

export async function clearSolves() {
  try { const db = await open(); await tx(db, 'readwrite', s => { s.clear(); }); db.close(); return true; } catch { return false; }
}

/*
 * What a solve keeps for its restore (solve.js `opts.restore`): every world's tier layers, their surv, beq, resil, pol and
 * short by year; the adaptive reference's arrays and counts; which solve the 'auto' risk rule kept (a restore solves the same
 * way directly); and the meta. Copied out of shared memory: IndexedDB cannot store a SharedArrayBuffer.
 */
export function cacheOf(r) {
  const cp = a => a.slice(), W = r.tablesW;
  const layer = L => ({ surv: L.surv.map(cp), beq: L.beq.map(cp), resil: L.resil.map(cp), pol: L.pol.map(cp), short: L.short.map(cp) });
  const layers = W.layW ? W.layW.map(ls => ls.map(layer)) : W.survW.map((_, k) => [layer({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] })]);
  const a = r.g && r.g.reader && r.g.reader.adaptive && r.g.reader.adaptive.ref;
  let ref = null;
  if (a) {
    const { V, MV, V0, MV0, AST, ASTY } = a.arrays(), yrs = o => Object.fromEntries(Object.entries(o).map(([t, x]) => [t, cp(x)]));
    ref = { AST: cp(AST), ASTY: yrs(ASTY), V: V.map(yrs), MV: yrs(MV), V0: V0.map(yrs), MV0: yrs(MV0), nonMono: a.nonMono, footLive: a.footLive || 0 };
  }
  const decision = r.meta.riskAbove ? r.meta.riskAbove.decision : '';
  return { layers, ref, riskAbove: decision.startsWith('on'), meta: JSON.parse(JSON.stringify(r.meta)) };
}
