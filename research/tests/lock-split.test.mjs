/*
 * A DIAL POSITION SPLIT ACROSS WORKERS (the launch plan's step L2, B3, D54; the fast tier, run-all.mjs FAST_JOINING).
 * A position above 1 is solved on its base's tiers (src/solverApp.js solveForApp: `lockTiers` on the base's solve), and a
 * split solve runs that solve in every part, so every part needs the base: the page's worker shares its held base once as
 * shared memory (src/solverCache.js shareRecord) and each part restores it (src/solverWorker.js 'part'). On S126 at light
 * settings, the dial at 3 (both variants' code path; the app's variant, APP_DIAL_VARIANT):
 *   1. the position solved whole is locked to the base (its run record's lockTiers, the base's pairs) with the variant's
 *      weights, and its tables differ from the same lambda unlocked (so a lost lock shows);
 *   2. split two and three ways on the arena, each part restoring the base from the shared record: every array the same
 *      bit for bit as the whole solve's;
 *   3. planted, part 1 handed a base without a tier state (so it solves its cells unlocked): the arrays differ.
 *   node research/tests/lock-split.test.mjs
 */
// e3pcls guard: the solves below compare tables split and whole on this code; e3pcls's own exactness is solver-e3pcls.test.mjs's
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp, dialBase, APP_DIAL_VARIANT, APP_AGE_WEIGHT, APP_LAMBDA } from '../../src/solverApp.js';
import { arenaFor, arenaPool } from '../../src/solverPool.js';
import { cacheOf, shareRecord } from '../../src/solverCache.js';
import { tablesOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const WORKER = fileURLToPath(new URL('./lock-split-worker.mjs', import.meta.url));
const opts = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const raw = buildScenarios().find(s => s.id === 'S126').plan;
const plan = { ...raw, solver: { aims: { cuts: 3, estate: 'standard', raises: 'capped', riskConsent: true } } };
const differ = (A, B) => { if (A.length !== B.length) return Infinity; let d = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = B[i]; if (a.length !== b.length) return Infinity; for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) d++; } return d; };
const values = A => A.reduce((t, a) => t + a.length, 0);

// 1. whole
const basePlan = dialBase(E.normalizePlan(plan)), base = solveForApp(E, M, basePlan, opts);
const whole = solveForApp(E, M, plan, { ...opts, base }), A = tablesOf(whole);
const unlocked = solveForApp(E, M, raw, { ...opts, lambda: 3 * APP_LAMBDA, research: { ...opts.research, tsOnce: false, ...(APP_DIAL_VARIANT === 'B3a' ? { ageWeight: APP_AGE_WEIGHT } : {}) } });
const wantAW = APP_DIAL_VARIANT === 'B3a' ? JSON.stringify(APP_AGE_WEIGHT) : undefined;
ok(base.meta.tierState && whole.meta.lockTiers && whole.lockTiers.rc === base && JSON.stringify(whole.meta.ageWeight) === wantAW && whole.meta.tsOnce === false,
  `1. the dial at 3 (${APP_DIAL_VARIANT}) solved whole on its base's tiers: lockTiers ${JSON.stringify(whole.meta.lockTiers)}, the base's pairs ${base.meta.tierState}, ageWeight ${JSON.stringify(whole.meta.ageWeight)}`);
const dU = differ(A, tablesOf(unlocked));
ok(dU > 0 && dU !== Infinity, `1. the same lambda and weights unlocked: ${dU} of ${values(A)} values differ, so a lost lock shows`);

// 2. split, each part restoring the base from one shared record
const share = { plan: basePlan, rec: shareRecord(cacheOf(base)) };
ok(share.rec.layers[0][0].surv[0].buffer instanceof SharedArrayBuffer, '2. the base shared once as shared memory');
async function split(parts, planted = null) {
  const arena = arenaFor();
  if (!arena) throw new Error('no growable SharedArrayBuffer here');
  const ends = [], said = [];
  for (let part = 1; part < parts; part++) {
    const w = new Worker(WORKER, { workerData: { part, parts, arena, plan, opts, base: share, planted } });
    w.on('message', m => said.push(m.error));
    ends.push(new Promise((resolve, reject) => {
      w.once('error', e => { Atomics.store(new Int32Array(arena.ctrl), 2, 1); reject(e); });
      w.once('exit', code => (code === 0 ? resolve() : reject(new Error(`part ${part} exited ${code}`))));
    }));
  }
  const pool = arenaPool(0, parts, arena);
  let r = null, err = null;
  try { r = solveForApp(E, M, plan, { ...opts, e2: pool, base }); } catch (e) { pool.fail(); err = e; }
  const settled = await Promise.allSettled(ends), workerErr = settled.find(s => s.status === 'rejected');
  return { r, err: err || (workerErr && workerErr.reason) || null, said };
}
for (const parts of [2, 3]) {
  const t0 = Date.now(), s = await split(parts), d = s.r ? differ(A, tablesOf(s.r)) : Infinity;
  ok(!s.err && d === 0 && s.r.meta.e2 && s.r.meta.e2.parts === parts && s.r.meta.lockTiers, `2. split ${parts} ways, each part restoring the base: every array the same as whole, ${d} of ${values(A)} values differ (${(Date.now() - t0) / 1000} s)${s.err ? ` ERROR ${s.err.message || s.err}` : ''}`);
}

// 3. planted: part 1 without the base's tier state
{ const s = await split(2, 'nobase'), d = s.r ? differ(A, tablesOf(s.r)) : Infinity;
  ok(d > 0, `3. planted, part 1 handed a base without a tier state: ${d === Infinity ? 'the solve failed' : `${d} values differ`}`); }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
