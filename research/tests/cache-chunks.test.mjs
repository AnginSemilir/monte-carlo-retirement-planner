/*
 * A STORED SOLVE IN CHUNKS (Part D, D5.6's measurement, 14 Nov; src/solverCache.js). This container's Chromium (153) refuses
 * one IndexedDB value over 133,169,152 bytes ("The serialized keys and/or value are too large"), and a solve's record at the
 * app's settings is about 200 MB, so no solve at 45 points was stored and every visit solved again; the store said only "the
 * store failed (null)", its transaction rejecting on the request's error before the abort had set the transaction's own. The
 * record is now kept as a head beside chunks of its typed arrays, each its own value. Driven on an in-memory IndexedDB that
 * refuses a value over a set size in Chromium 153's order (results-couple-timing.txt, its probe): during the put, an error
 * event at the transaction while its error is still null; then the error set and the transaction finished, so a request
 * made after it throws at once (TransactionInactiveError); the requests made before it fail with AbortError; the abort
 * carries the reason. A value's size is its serialization by V8 (the serializer structured clone uses). The full tier.
 *   1. split and join: a record shaped as cacheOf's, in chunks of at most the size asked (an array over it alone in its
 *      chunk), the head holding no typed array, joined back to the same shape, types and bytes;
 *   2. at Chromium's own limit and the store's own chunk size: a 140 MB record stored whole (as before) is refused and the
 *      reason named is the browser's, not "(null)"; stored in chunks, each under the limit, it loads back bit for bit;
 *   3. what a store drops it drops whole: an evicted solve, a solve stored again under its key with fewer chunks, and a solve
 *      of other code leave no chunk behind; every chunk in the store belongs to a stored solve, and every stored solve has all
 *      of its chunks;
 *   4. a solve stored whole before this change loads as it was;
 *   5. a real solve's record (S370 at light settings, the adaptive reference in it), the browser's limit set below the whole
 *      record: stored in chunks, loaded and restored, its tables and reference the solve's, bit for bit;
 *   6. one array over the browser's limit: not stored, the browser's reason named, the solve stored before untouched;
 *   7. no rejection left unhandled: a request made on a transaction the refusal has finished throws, and the store's
 *      transaction catches it (before, an unhandled rejection in the worker).
 * Plants (--planted runs each and wants its checks to fail): 'whole' (the record stored whole, as before: 2, 3 and 5),
 * 'keepparts' (a dropped solve's chunks left behind: 3).
 *   node research/tests/cache-chunks.test.mjs [--planted]
 */
import v8 from 'node:v8';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { splitRecord, joinRecord, recordBytes, useIndexedDB, storeSolveWhy, loadSolve, probeSolve, CHUNK_BYTES, CACHE_PLANT, cacheOf } from '../../src/solverCache.js';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['whole', ['2', '3', '5']], ['keepparts', ['3']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [SELF], { env: { ...process.env, CACHE_CHUNKS_PLANT: plant }, encoding: 'utf8', maxBuffer: 64e6 }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...new Set([...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]))], okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
CACHE_PLANT.rule = process.env.CACHE_CHUNKS_PLANT || '';

let pass = 0, fail = 0;
const ok = (c, msg) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); };
const unhandled = [];
process.on('unhandledRejection', e => { unhandled.push(e); console.log(`(an unhandled rejection: ${e && e.name}: ${e && e.message})`); });
const CODE = 'worker-abc', CHROMIUM_MAX = 133169152;   // this container's Chromium 153 (results-couple-timing.txt)

/*
 * An in-memory IndexedDB: open, one object store, get / put / delete / clear, transactions that commit or abort whole. A put
 * whose value serializes to more than maxValue bytes is refused in Chromium 153's order (the probe in
 * results-couple-timing.txt): during the put, an error event at the transaction while its error is still null; then its error
 * set (UnknownError, "The serialized keys and/or value are too large") and the transaction finished, so a request made after
 * it throws at once (TransactionInactiveError); each request made before it fails with AbortError (at the request, then the
 * transaction's onerror); the abort follows.
 */
function memoryIDB({ maxValue = Infinity } = {}) {
  const dbs = new Map(), later = f => setTimeout(f, 0);
  const sizeOver = v => { if (maxValue === Infinity) return 0; const n = v8.serialize(v).length; return n > maxValue ? n : 0; };
  const named = (name, message) => Object.assign(new Error(message), { name });
  return {
    data: dbs,
    open(name) {
      const q = {};
      later(() => {
        const fresh = !dbs.has(name); if (fresh) dbs.set(name, new Map());
        const data = dbs.get(name);
        q.result = {
          createObjectStore() {}, close() {},
          transaction(_store, mode) {
            const t = { error: null, abort() { if (finished) throw named('InvalidStateError', 'The transaction has finished.'); finished = true; later(settle); } }, staged = new Map(data);
            let pending = 0, done = false, finished = false;
            const settle = () => later(() => {
              if (done || pending) return;
              done = true;
              if (finished) { if (t.onabort) t.onabort(); return; }
              if (mode === 'readwrite') { data.clear(); for (const [k, v] of staged) data.set(k, v); }
              if (t.oncomplete) t.oncomplete();
            });
            const request = fn => {
              if (finished) throw named('TransactionInactiveError', "Failed to execute on 'IDBObjectStore': The transaction has finished.");
              const r = { error: null }; pending++;
              later(() => {
                pending--;
                if (finished) {
                  r.error = named('AbortError', 'The transaction was aborted, so the request cannot be fulfilled.');
                  const ev = { target: r }; if (r.onerror) r.onerror(ev); if (t.onerror) t.onerror(ev);
                } else { r.result = fn(); if (r.onsuccess) r.onsuccess({ target: r }); }
                settle();
              });
              return r;
            };
            t.objectStore = () => ({
              get: k => request(() => (staged.has(k) ? structuredClone(staged.get(k)) : undefined)),
              put: (v, k) => {
                if (finished) return request(() => null);   // throws, as a request on a finished transaction does
                const n = sizeOver(v);
                if (n) {
                  if (t.onerror) t.onerror({ target: t });
                  t.error = named('UnknownError', `The serialized keys and/or value are too large (size=${n} bytes, max=${maxValue} bytes).`);
                  finished = true; later(settle);
                  return { error: null };
                }
                return request(() => { staged.set(k, structuredClone(v)); return k; });
              },
              delete: k => request(() => { staged.delete(k); }),
              clear: () => request(() => { staged.clear(); })
            });
            later(settle);
            return t;
          }
        };
        if (fresh && q.onupgradeneeded) q.onupgradeneeded();
        if (q.onsuccess) q.onsuccess();
      });
      return q;
    }
  };
}
const store = idb => idb.data.get('rp-solver') || new Map();
/* a record's shape with each typed array as its type, its length and the hash of its bytes */
function desc(v) {
  if (ArrayBuffer.isView(v)) return `${v.constructor.name}:${v.length}:${createHash('sha256').update(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)).digest('hex').slice(0, 16)}`;
  if (Array.isArray(v)) return v.map(desc);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, desc(v[k])]));
  return v;
}
const same = (a, b) => JSON.stringify(desc(a)) === JSON.stringify(desc(b));
const without = (r, ...ks) => Object.fromEntries(Object.entries(r).filter(([k]) => !ks.includes(k)));
const hasView = v => ArrayBuffer.isView(v) || (Array.isArray(v) ? v.some(hasView) : v && typeof v === 'object' ? Object.values(v).some(hasView) : false);
const f64 = (n, seed) => { const a = new Float64Array(n); for (let i = 0; i < n; i++) a[i] = Math.sin(seed * 7919 + i) * 1e3; return a; };

// 1. split and join
{ let s = 1;
  const years = T => Array.from({ length: T }, () => f64(1000, s++));
  const layer = () => ({ surv: years(6), beq: years(6), resil: years(6), pol: years(6), short: years(6) });
  const yrs = T => Object.fromEntries(Array.from({ length: T }, (_, t) => [String(t + 1), f64(1000, s++)]));
  const rec = {
    layers: [[layer(), layer()], [layer()]],
    ref: { AST: new Int32Array(3000).map((_, i) => i % 7), ASTY: { 1: new Int8Array(1000).fill(3), 2: new Uint8Array(1000).fill(4) }, V: [yrs(3), yrs(3)], MV: yrs(3), V0: [yrs(2)], MV0: yrs(2), big: f64(5000, 99), nonMono: 2, footLive: 0 },
    riskAbove: true, meta: { points: 4, tags: ['a', 'b'], nothing: null, riskAbove: { decision: 'on 85' } }
  };
  const max = 20000, sp = splitRecord(rec, max), sizes = sp.chunks.map(c => c.reduce((t, a) => t + a.byteLength, 0));
  const leaves = sp.chunks.reduce((t, c) => t + c.length, 0), refs = (JSON.stringify(sp.head).match(/"\$a":/g) || []).length;
  ok(sp.chunks.every((c, i) => sizes[i] <= max || c.length === 1) && sizes.some(z => z > max), `1. in chunks of at most ${max} bytes, the one array over it alone in its chunk (${sp.chunks.length} chunks, the largest ${Math.max(...sizes)} bytes)`);
  const views = v => (ArrayBuffer.isView(v) ? 1 : Array.isArray(v) ? v.reduce((t, x) => t + views(x), 0) : v && typeof v === 'object' ? Object.values(v).reduce((t, x) => t + views(x), 0) : 0);
  ok(!hasView(sp.head) && leaves === refs && leaves === views(rec), `1. the head holds no typed array, each of the record's ${views(rec)} arrays named once in it (${refs} named, ${leaves} in the chunks)`);
  ok(same(joinRecord(sp.head, sp.chunks), rec), '1. joined back: the same shape, types and bytes');
  ok(same(joinRecord(structuredClone(sp.head), structuredClone(sp.chunks)), rec), '1. and so after each part is cloned on its own, as a store keeps them'); }

// 2. at Chromium's own limit and the store's own chunk size
{ const big = { layers: [[{ surv: Array.from({ length: 35 }, (_, i) => { const a = new Float64Array(5e5).fill(i + 0.5); a[i * 997] = -i; return a; }) }]], ref: null, riskAbove: false, meta: { tag: 'big' } };
  const want = desc(big), bytes = recordBytes(big);
  const idb = memoryIDB({ maxValue: CHROMIUM_MAX }); useIndexedDB(idb);
  const was = CACHE_PLANT.rule;
  CACHE_PLANT.rule = 'whole';
  const w = await storeSolveWhy('big', CODE, big, { budget: 600e6 });
  CACHE_PLANT.rule = was;
  ok(!w.stored && /too large/.test(w.why) && !/null/.test(w.why) && store(idb).size === 0, `2. a ${(bytes / 1e6).toFixed(0)} MB record stored whole, as before, is refused, the browser's reason named and nothing left behind (${w.why})`);
  const s = await storeSolveWhy('big', CODE, big, { budget: 600e6 });
  const parts = [...store(idb).keys()].filter(k => k.startsWith('part:big:'));
  const sizes = parts.map(k => v8.serialize(store(idb).get(k)).length);
  ok(s.stored && parts.length === Math.ceil(bytes / CHUNK_BYTES) && sizes.every(z => z <= CHROMIUM_MAX), `2. stored in chunks of the store's ${CHUNK_BYTES / 1e6} MB: ${s.stored ? 'stored' : `not stored (${s.why})`}, ${parts.length} chunks, the largest ${sizes.length ? (Math.max(...sizes) / 1e6).toFixed(1) : '-'} MB serialized, under the browser's ${CHROMIUM_MAX}`);
  const back = await loadSolve('big', CODE);
  ok(!!back && JSON.stringify(desc(without(back, 'key', 'code', 'stored'))) === JSON.stringify(want) && (await probeSolve('big', CODE)), '2. loaded back bit for bit, and probed by its key'); }

// 3. what a store drops it drops whole
{ const idb = memoryIDB(); useIndexedDB(idb);
  const rec = (k, tag) => ({ layers: [[{ surv: Array.from({ length: k }, (_, i) => f64(1000, tag * 100 + i)) }]], ref: null, riskAbove: false, meta: { tag } });
  const o = { chunk: 16000 };
  const partsOf = key => [...store(idb).keys()].filter(k => k.startsWith(`part:${key}:`)).length;
  const orphans = () => {
    const ix = store(idb).get('index') || [], out = [];
    for (const k of store(idb).keys()) { const m = /^part:(.*):(\d+)$/.exec(k); if (m && !ix.some(e => e.key === m[1] && +m[2] < (e.chunks || 0))) out.push(k); }
    for (const e of ix) for (let i = 0; i < (e.chunks || 0); i++) if (!store(idb).has(`part:${e.key}:${i}`)) out.push(`missing part:${e.key}:${i}`);
    return out;
  };
  await storeSolveWhy('base', CODE, rec(6, 1), o);
  await storeSolveWhy('pos3', CODE, rec(6, 3), { ...o, keep: 'base' });
  const before = partsOf('pos3');
  await new Promise(res => setTimeout(res, 3));
  await storeSolveWhy('pos6', CODE, rec(6, 6), { ...o, keep: 'base' });
  ok(before === 3 && partsOf('pos3') === 0 && partsOf('base') === 3 && orphans().length === 0, `3. an evicted solve leaves no chunk (pos3's ${before} chunks, then ${partsOf('pos3')}; the base's ${partsOf('base')}; ${orphans().length} chunks of no solve)`);
  await storeSolveWhy('pos6', CODE, rec(2, 7), { ...o, keep: 'base' });
  const again = await loadSolve('pos6', CODE);
  ok(partsOf('pos6') === 1 && orphans().length === 0 && again && again.meta.tag === 7, `3. a solve stored again under its key with fewer chunks leaves none of the old (${partsOf('pos6')} chunk; ${orphans().join(' ') || 'none of no solve'})`);
  await storeSolveWhy('new', 'worker-def', rec(4, 9), o);
  const left = [...store(idb).keys()].filter(k => k.startsWith('part:'));
  ok(left.length === 2 && left.every(k => k.startsWith('part:new:')) && orphans().length === 0, `3. a solve of other code drops every chunk of the old code's (${left.join(' ')})`); }

// 4. a solve stored whole before this change loads as it was
{ const idb = memoryIDB(); useIndexedDB(idb);
  await probeSolve('x', CODE);   // makes the store
  const old = { layers: [[{ surv: [f64(500, 4), f64(500, 5)], beq: [f64(500, 6)] }]], ref: null, riskAbove: true, meta: { tag: 'old' } };
  store(idb).set('solve:old', structuredClone({ ...old, key: 'old', code: CODE, stored: 1 }));
  store(idb).set('index', [{ key: 'old', code: CODE, bytes: recordBytes(old), used: 1 }]);
  const back = await loadSolve('old', CODE);
  ok(!!back && same(without(back, 'key', 'code', 'stored'), old), '4. a solve stored whole, as before, loads as it was'); }

// 5. a real solve's record
{ const E = await import('../engine.mjs'), M = await import('../../src/solver/model.js');
  const { solveForApp } = await import('../../src/solverApp.js');
  const { tablesOf, digestOf } = await import('../../src/solverDigest.js');
  const { refDigest } = await import('./restore-split-lib.mjs');
  const { buildScenarios } = await import('../policy-study/scenarios.mjs');
  const OPTS = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
  const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S370').plan);
  const solved = solveForApp(E, M, plan, OPTS), rec = cacheOf(solved), bytes = recordBytes(rec);
  let largest = 0;
  const walk = v => { if (ArrayBuffer.isView(v)) largest = Math.max(largest, v.byteLength); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(rec);
  const chunk = Math.max(largest, Math.ceil(bytes / 8)), maxValue = 2 * chunk + 65536;
  const idb = memoryIDB({ maxValue }); useIndexedDB(idb);
  const s = await storeSolveWhy('s370', CODE, rec, { chunk });
  const entry = (store(idb).get('index') || []).find(e => e.key === 's370');
  ok(maxValue < bytes && s.stored && entry && entry.chunks > 1, `5. S370's record (${(bytes / 1e6).toFixed(1)} MB, its largest array ${(largest / 1e6).toFixed(2)} MB), the limit at ${(maxValue / 1e6).toFixed(1)} MB, under the whole record: ${s.stored ? `stored in ${entry.chunks} chunks` : `not stored (${s.why})`}`);
  const back = await loadSolve('s370', CODE);
  let restored = null;
  if (back) restored = solveForApp(E, M, plan, { ...OPTS, restore: back });
  const dWant = await digestOf(tablesOf(solved)), dGot = restored ? await digestOf(tablesOf(restored)) : 'none';
  ok(!!restored && restored.meta.restored && dGot === dWant && refDigest(restored) === refDigest(solved), `5. loaded and restored: the tables (${dWant.slice(0, 16)} against ${String(dGot).slice(0, 16)}) and the reference the solve's, bit for bit`); }

// 6. one array over the browser's limit
{ const idb = memoryIDB({ maxValue: 1e6 }); useIndexedDB(idb);
  const base = { layers: [[{ surv: [f64(1000, 1), f64(1000, 2)] }]], ref: null, riskAbove: false, meta: { tag: 'base' } };
  await storeSolveWhy('base', CODE, base);
  const keys = [...store(idb).keys()].sort().join();
  const huge = { layers: [[{ surv: [f64(250000, 3)] }]], ref: null, riskAbove: false, meta: { tag: 'huge' } };
  const s = await storeSolveWhy('huge', CODE, huge);
  const back = await loadSolve('base', CODE);
  ok(!s.stored && /too large/.test(s.why) && [...store(idb).keys()].sort().join() === keys && back && same(without(back, 'key', 'code', 'stored'), base), `6. a 2 MB array over a 1 MB limit: not stored (${s.why}), the base untouched and restored`); }

// 7. no rejection left unhandled
await new Promise(res => setTimeout(res, 50));
ok(unhandled.length === 0, `7. no rejection left unhandled (${unhandled.length}${unhandled.length ? `: ${[...new Set(unhandled.map(e => e && e.name))].join(', ')}` : ''})`);

console.log(fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`);
process.exit(fail ? 1 : 0);
