/*
 * THE STORE OF SOLVES (the launch plan's step L2, F6; src/solverCache.js): the base and the latest dial position kept
 * together, within a byte budget, the least recently used evicted first and never the base a position is stored beside.
 * Driven through its own code on an in-memory IndexedDB (the few calls it makes, each answered a tick later, a
 * transaction committing when no request is left; Node has none of its own). Full tier.
 *   1. the rule (storePlan): two solves kept; a third evicts the least recently used; never the one named to keep; one over
 *      the budget alone is not stored; one that cannot fit beside the kept one is not stored;
 *   2. the store: a base and its position both kept and restored; a second position of the same plan evicts the first and
 *      keeps the base; a restore makes a solve the most recently used; a solve of other code is dropped and never restored;
 *   3. planted: a budget below the record refuses cleanly (stored false, a reason, what was stored untouched); the quota
 *      (the store's write aborting with QuotaExceededError) is a miss with its reason, what was stored untouched; a rule
 *      that forgets `keep` evicts the base, and check 2 sees it.
 *   node research/tests/solve-store.test.mjs
 */
import { storePlan, recordBytes, useIndexedDB, storeSolveWhy, loadSolve, probeSolve, touchSolve } from '../../src/solverCache.js';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

/* an in-memory IndexedDB: open, one object store, get / put / delete / clear, transactions that commit or abort whole */
function memoryIDB({ abortPut = null } = {}) {
  const dbs = new Map();
  const later = f => setTimeout(f, 0);
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
            const t = { error: null }, staged = new Map(data), journal = [];
            let pending = 0, done = false;
            const settle = () => later(() => { if (done || pending) return; done = true; if (t.error) { if (t.onabort) t.onabort(); return; } if (mode === 'readwrite') { data.clear(); for (const [k, v] of staged) data.set(k, v); } if (t.oncomplete) t.oncomplete(); });
            const request = (fn) => { const r = {}; pending++; later(() => { pending--; if (t.error) { settle(); return; } try { r.result = fn(); if (r.onsuccess) r.onsuccess(); } catch (e) { t.error = e; } settle(); }); return r; };
            t.objectStore = () => ({
              get: k => request(() => (staged.has(k) ? structuredClone(staged.get(k)) : undefined)),
              put: (v, k) => request(() => { if (abortPut && abortPut(k)) { const e = new Error('planted: the quota'); e.name = 'QuotaExceededError'; throw e; } journal.push(k); staged.set(k, structuredClone(v)); return k; }),
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
const rec = (mb, tag) => ({ layers: [[{ surv: [new Float64Array(Math.round(mb * 1e6 / 8)).fill(tag)] }]], ref: null, riskAbove: false, meta: { tag } });
const keys = idb => [...(idb.data.get('rp-solver') || new Map()).keys()].filter(k => k.startsWith('solve:')).map(k => k.slice(6)).sort();

// 1. the rule
{ const ix = [{ key: 'a', bytes: 100, used: 1 }, { key: 'b', bytes: 100, used: 2 }];
  const p1 = storePlan(ix.slice(0, 1), { key: 'b', bytes: 100 }), p2 = storePlan(ix, { key: 'c', bytes: 100 }), p3 = storePlan(ix, { key: 'c', bytes: 100 }, { keep: 'a' });
  ok(p1.store && p1.evict.length === 0, '1. a second solve is kept beside the first');
  ok(p2.store && p2.evict.join() === 'a', `1. a third evicts the least recently used (${p2.evict})`);
  ok(p3.store && p3.evict.join() === 'b', `1. never the one named to keep (${p3.evict})`);
  const p4 = storePlan([], { key: 'c', bytes: 700e6 }), p5 = storePlan(ix.map(e => ({ ...e, bytes: 100e6 })), { key: 'c', bytes: 550e6 }, { keep: 'a', budget: 600e6 });
  ok(!p4.store && /over the store/.test(p4.why), `1. one over the budget alone is not stored (${p4.why})`);
  ok(!p5.store && /beside/.test(p5.why), `1. one that cannot fit beside the kept solve is not stored (${p5.why})`);
  ok(recordBytes(rec(1, 1)) === 1e6, '1. a record\'s bytes are its typed arrays\''); }

// 2. the store
const CODE = 'worker-abc';
async function scenario(idb, planted = null) {
  useIndexedDB(idb);
  const S = planted || storeSolveWhy;
  const s1 = await S('base', CODE, rec(1, 1)), s2 = await S('pos3', CODE, rec(1, 3), { keep: 'base' });
  const both = keys(idb).join();
  const s3 = await S('pos6', CODE, rec(1, 6), { keep: 'base' });
  return { s1, s2, s3, both, after: keys(idb).join(), base: await loadSolve('base', CODE), pos3: await loadSolve('pos3', CODE) };
}
{ const idb = memoryIDB(), r = await scenario(idb);
  ok(r.s1.stored && r.s2.stored && r.both === 'base,pos3', `2. a base and its position both kept (${r.both})`);
  ok(r.s3.stored && r.after === 'base,pos6' && r.base && r.base.meta.tag === 1 && r.pos3 === null, `2. a second position evicts the first and keeps the base (${r.after})`);
  ok(await probeSolve('pos6', CODE) && !(await probeSolve('pos6', 'other-code')), '2. probed by key and code');
  // a restore makes a solve the most recently used: restore pos6, then store another solve with no keep: the base goes
  await loadSolve('pos6', CODE);
  await new Promise(res => setTimeout(res, 5));
  await storeSolveWhy('other', CODE, rec(1, 9));
  ok(keys(idb).join() === 'other,pos6', `2. a restore makes a solve the most recently used: the base, used longer ago, is evicted (${keys(idb).join()})`);
  await touchSolve('pos6', CODE);
  const s = await storeSolveWhy('newcode-solve', 'worker-def', rec(1, 5));
  ok(s.stored && keys(idb).join() === 'newcode-solve' && !(await loadSolve('pos6', CODE)), `2. a solve of other code is dropped and never restored (${keys(idb).join()})`); }

// 3. planted
{ const idb = memoryIDB(); useIndexedDB(idb);
  await storeSolveWhy('base', CODE, rec(1, 1));
  const s = await storeSolveWhy('big', CODE, rec(2, 2), { budget: 1.5e6 });
  ok(!s.stored && /over the store/.test(s.why) && keys(idb).join() === 'base', `3. planted, a budget below the record: not stored (${s.why}), what was stored untouched`); }
{ const idb = memoryIDB({ abortPut: k => k === 'solve:pos3' }); useIndexedDB(idb);
  await storeSolveWhy('base', CODE, rec(1, 1));
  const s = await storeSolveWhy('pos3', CODE, rec(1, 3), { keep: 'base' });
  ok(!s.stored && /full/.test(s.why) && keys(idb).join() === 'base' && (await loadSolve('base', CODE)), `3. planted, the quota: a miss (${s.why}), the base still stored and restored`); }
{ // a rule that forgets keep: the store as storeSolveWhy without its keep, the base evicted by the second position
  const forgets = (key, code, record, o = {}) => storeSolveWhy(key, code, record, { ...o, keep: null });
  const idb = memoryIDB(), r = await scenario(idb, async (k, c, rr, o) => { const out = await forgets(k, c, rr, o); await new Promise(res => setTimeout(res, 2)); return out; });
  const caught = !(r.s3.stored && r.after === 'base,pos6');
  ok(caught, `3. planted, a rule that forgets keep: check 2 sees the base evicted (${r.after})`); }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
