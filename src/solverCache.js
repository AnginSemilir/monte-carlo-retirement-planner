/*
 * THE SOLVED TABLES, KEPT ACROSS VISITS (Part C Phase 7b, research/solver/PHASE-7.md; two entries from step L2 of the launch
 * plan). A candidate solve is minutes of four cores, so the worker that solved a plan stores its tables in IndexedDB under
 * the solve's key (src/solverKey.js: the plan as the solver takes it, the settings and the solver's own code), and a later
 * visit with the same key restores them in seconds (solve.js `opts.restore`) instead of solving again.
 * Two solves at most, the base and the latest dial position (a position is solved on its base's tiers, so it needs the base
 * beside it), within CACHE_BUDGET bytes (two solves of S370 are 530 MB: results-app-timing.txt on the review's branch). A
 * store evicts the least recently used solve first, never the one it names to keep (the position's base); a solve that
 * cannot fit beside it is not stored; a solve of other code is dropped, since it can never be restored. Any failure (no
 * IndexedDB, a private window, the quota) is a miss and says why: the plan is solved, never refused. The rule itself is
 * storePlan, a pure function; research/tests/solve-store.test.mjs drives the store on an in-memory IndexedDB.
 */
export const CACHE_MAX = 2, CACHE_BUDGET = 600e6;
let idb = typeof indexedDB === 'undefined' ? undefined : indexedDB;
/* tests only: another IndexedDB (an in-memory one in Node) */
export const useIndexedDB = f => { idb = f; };
const DB = 'rp-solver', STORE = 'solves';

const open = () => new Promise((resolve, reject) => {
  if (!idb) { reject(new Error('no IndexedDB')); return; }
  const q = idb.open(DB, 1);
  q.onupgradeneeded = () => q.result.createObjectStore(STORE);
  q.onsuccess = () => resolve(q.result);
  q.onerror = () => reject(q.error);
});
/*
 * One transaction: `fn` makes its requests, the result is what `fn` returns once the transaction commits. Chromium 153 refuses
 * a value too large in its own order (results-couple-timing.txt, the probe): an error event at the transaction while the
 * transaction's error is still null (the store said "the store failed (null)", rejecting on it), then the error set and the
 * transaction finished, so the next request throws at once (TransactionInactiveError); the requests already made fail with
 * AbortError, and the abort carries the reason. So the reason is taken at the abort, and what `fn` throws aborts the
 * transaction (nothing half-written commits) and is the reason only where the transaction has none of its own.
 */
const tx = (db, mode, fn) => new Promise((resolve, reject) => {
  const t = db.transaction(STORE, mode), s = t.objectStore(STORE);
  let out, failed = null;
  Promise.resolve(fn(s)).then(v => { out = v; }, e => { failed = failed || e; try { t.abort(); } catch { /* finished already */ } });
  t.oncomplete = () => resolve(out);
  t.onerror = ev => { failed = (ev && ev.target && ev.target.error) || t.error || failed; };
  t.onabort = () => reject(t.error || failed || new Error('aborted'));
});
const req = q => new Promise((resolve, reject) => { q.onsuccess = () => resolve(q.result); q.onerror = () => reject(q.error); });

/*
 * The store's rule: given what is stored ([{ key, bytes, used }]) and a new solve ({ key, bytes }), which to evict, or that it
 * is not stored: at most `max` solves and `budget` bytes, the least recently used evicted first, never `keep`.
 */
export function storePlan(index, entry, { max = CACHE_MAX, budget = CACHE_BUDGET, keep = null } = {}) {
  if (!(entry.bytes <= budget)) return { store: false, evict: [], why: `the solve's ${(entry.bytes / 1e6).toFixed(1)} MB is over the store's ${(budget / 1e6).toFixed(1)} MB` };
  const rest = index.filter(e => e.key !== entry.key).sort((a, b) => a.used - b.used), evict = [];
  const over = () => rest.length + 1 > max || rest.reduce((t, e) => t + e.bytes, 0) + entry.bytes > budget;
  while (over()) { const i = rest.findIndex(e => e.key !== keep); if (i < 0) break; evict.push(rest[i].key); rest.splice(i, 1); }
  return over() ? { store: false, evict: [], why: 'no room for it beside the solve it keeps' } : { store: true, evict };
}
/*
 * A STORED SOLVE IN CHUNKS (Part D, D5.6's measurement, 14 Nov). Chromium refuses one IndexedDB value over 127 MiB ("The
 * serialized keys and/or value are too large", max 133169152 bytes, this container's Chromium 153), and a solve's record at
 * the app's settings is about 200 MB, so every solve at 45 points failed to store and every visit solved again. The record
 * is kept as a head (its fields, each typed array named by its place) beside chunks of at most CHUNK_BYTES of its typed
 * arrays, each its own value (`part:<key>:<i>`), and joined back on a load, the same arrays (cache-chunks.test.mjs). A
 * record stored whole (before) loads as it was. CACHE_PLANT (tests only): 'whole' stores a record whole, as before;
 * 'keepparts' drops a solve's head and leaves its chunks behind.
 */
export const CHUNK_BYTES = 64e6;
export const CACHE_PLANT = { rule: '' };
export function splitRecord(rec, max = CHUNK_BYTES) {
  const leaves = [];
  const walk = v => {
    if (ArrayBuffer.isView(v)) { leaves.push(v); return { $a: leaves.length - 1 }; }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  const head = walk(rec), chunks = [];
  let cur = [], size = 0;
  for (const a of leaves) { if (cur.length && size + a.byteLength > max) { chunks.push(cur); cur = []; size = 0; } cur.push(a); size += a.byteLength; }
  if (cur.length) chunks.push(cur);
  return { head, chunks };
}
export function joinRecord(head, chunks) {
  const leaves = chunks.flat();
  const walk = v => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.keys(v).length === 1 && Number.isInteger(v.$a) ? leaves[v.$a] : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(head);
}
const dropSolve = (s, e) => { s.delete(`solve:${e.key}`); if (CACHE_PLANT.rule === 'keepparts') return; for (let i = 0; i < (e.chunks || 0); i++) s.delete(`part:${e.key}:${i}`); };
/* a stored record's bytes: its typed arrays' */
export function recordBytes(rec) {
  let n = 0;
  const walk = v => { if (ArrayBuffer.isView(v)) n += v.byteLength; else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(rec);
  return n;
}
/* the code a stored solve is kept for (step P1 (g)): the solver worker's module-graph key when a build wrote it over the
 * placeholder (vite-plugin-solver-code.js), else the worker's URL */
export const codeOf = (k, loc) => (/^solver-code:[0-9a-f]{16}$/.test(k) ? k : loc ? loc.href : 'unknown');
const readIndex = s => req(s.get('index')).then(x => (Array.isArray(x) ? x : []));
/* whether a solve of this key, made by this code, is stored: the small index beside the solves, so asking loads no tables */
export async function probeSolve(key, code) {
  try {
    const db = await open();
    const ix = await tx(db, 'readonly', s => readIndex(s));
    db.close();
    return ix.some(e => e.key === key && e.code === code);
  } catch { return false; }
}
/* the stored solve for this key, made by this code (the worker's own fingerprinted URL), or null; using it makes it the most
   recently used */
export async function loadSolve(key, code) {
  try {
    const db = await open();
    const rec = await tx(db, 'readwrite', async s => {
      const ix = await readIndex(s), e = ix.find(x => x.key === key && x.code === code);
      if (!e) return null;
      const r = await req(s.get(`solve:${key}`));
      if (!r) return null;
      e.used = Date.now(); s.put(ix, 'index');
      if (!r.head) return r;   // stored whole
      const chunks = [];
      for (let i = 0; i < r.chunks; i++) chunks.push(await req(s.get(`part:${key}:${i}`)));
      if (chunks.some(c => !Array.isArray(c))) return null;
      return { ...joinRecord(r.head, chunks), key: r.key, code: r.code, stored: r.stored };
    });
    db.close();
    return rec && rec.key === key && rec.code === code ? rec : null;
  } catch { return null; }
}
/* mark a stored solve as just used (the base, when a position is solved on it), so a store evicts it last */
export async function touchSolve(key, code) {
  try {
    const db = await open();
    await tx(db, 'readwrite', async s => { const ix = await readIndex(s), e = ix.find(x => x.key === key && x.code === code); if (e) { e.used = Date.now(); s.put(ix, 'index'); } });
    db.close();
    return true;
  } catch { return false; }
}
/* store this solve, with the code that made it, by storePlan's rule, its typed arrays in chunks of at most `chunk` bytes;
   { stored, why } (why: the reason it was not) */
export async function storeSolveWhy(key, code, record, { keep = null, max = CACHE_MAX, budget = CACHE_BUDGET, chunk = CHUNK_BYTES } = {}) {
  let db = null;
  try {
    db = await open();
    const bytes = recordBytes(record);
    const out = await tx(db, 'readwrite', async s => {
      const all = await readIndex(s), stale = all.filter(e => e.code !== code), ix = all.filter(e => e.code === code);
      const p = storePlan(ix, { key, bytes }, { keep, max, budget });
      if (!p.store) return p;
      for (const e of stale) dropSolve(s, e);
      for (const k of p.evict) dropSolve(s, ix.find(e => e.key === k) || { key: k });
      const was = all.find(e => e.key === key);
      if (was) dropSolve(s, was);
      const now = Date.now(), kept = ix.filter(e => e.key !== key && !p.evict.includes(e.key));
      let chunks = 0;
      if (CACHE_PLANT.rule === 'whole') s.put({ ...record, key, code, stored: now }, `solve:${key}`);
      else {
        const sp = splitRecord(record, chunk);
        sp.chunks.forEach((c, i) => s.put(c, `part:${key}:${i}`));
        chunks = sp.chunks.length;
        s.put({ head: sp.head, chunks, key, code, stored: now }, `solve:${key}`);
      }
      s.put([...kept, { key, code, bytes, used: now, chunks }], 'index');
      return p;
    });
    db.close();
    return out.store ? { stored: true, why: null } : { stored: false, why: out.why };
  } catch (e) {
    if (db) db.close();
    const quota = e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e.message || '')));
    const what = e && e.name && e.message ? `${e.name}: ${e.message}` : (e && (e.name || e.message)) || String(e);   // the browser's own words
    return { stored: false, why: quota ? "the browser's storage for this site is full" : `the store failed (${what})` };
  }
}
export async function storeSolve(key, code, record, opts) { return (await storeSolveWhy(key, code, record, opts)).stored; }
export async function clearSolves() {
  try { const db = await open(); await tx(db, 'readwrite', s => { s.clear(); }); db.close(); return true; } catch { return false; }
}
/*
 * A stored solve as shared memory: every typed array of the record copied once into one SharedArrayBuffer, the same shape
 * of views (step L2: a split dial position's parts each restore its base from it, with no copy per message). Where shared
 * memory is missing, the record itself.
 */
export function shareRecord(rec) {
  if (typeof SharedArrayBuffer === 'undefined') return rec;
  let n = 0;
  const size = v => { if (ArrayBuffer.isView(v)) n = Math.ceil(n / 8) * 8 + v.byteLength; else if (Array.isArray(v)) v.forEach(size); else if (v && typeof v === 'object') Object.values(v).forEach(size); };
  size(rec);
  const buf = new SharedArrayBuffer(Math.max(8, n));
  let off = 0;
  const copy = v => {
    if (ArrayBuffer.isView(v)) { off = Math.ceil(off / 8) * 8; const a = new v.constructor(buf, off, v.length); a.set(v); off += v.byteLength; return a; }
    if (Array.isArray(v)) return v.map(copy);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, copy(x)]));
    return v;
  };
  return copy(rec);
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
/*
 * What a part of a restored solve split is handed (Part D, D5.6; solve.js RESTORE, adaptive.js `restore`): part 0 copies the
 * stored record into the shared tables; every other part follows it, making the same tables on the arena and copying
 * nothing, so it needs the record's small fields alone: which solve the 'auto' risk rule kept, the meta, the reference's step
 * thresholds (each part keeps its own) and its counts. No table crosses to a part.
 */
export function followRecord(rec) {
  const ref = rec.ref ? { follow: true, ASTY: rec.ref.ASTY, nonMono: rec.ref.nonMono, footLive: rec.ref.footLive || 0 } : null;
  return { follow: true, layers: null, ref, riskAbove: rec.riskAbove, meta: rec.meta };
}
