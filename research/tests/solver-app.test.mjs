/*
 * THE SOLVER IN THE APP: ITS SETTINGS AND ITS SPLIT (Part C Phase 7, research/solver/PHASE-7.md step 7a).
 *   1. src/solverApp.js's copy of the candidate: the same options as research/solver/candidate.json key for key, its hash
 *      the candidate's (CANDIDATE_HASH), its tier returns O60's (blendReals), its plan candidatePlan's; planted: a copy with
 *      one setting changed, or one tier's return, fails the comparison;
 *   2. solveForApp the candidate's solve: every table the same bit for bit as solvePlan on candidatePlan with
 *      CANDIDATE_OPTS (S126 at 4 points, a light lattice);
 *   3. src/solverPool.js, the page's split, on Node's worker threads: every table and the adaptive reference's arrays the
 *      same split 2 and 3 ways as whole; planted: a part that claims cells and drops them (the tables differ), a part that
 *      carves a table the others do not (the barrier's check fails the solve), a part that throws (every part fails).
 *   node research/tests/solver-app.test.mjs
 */
// e3pcls guard: the solves below compare tables on this code (solveForApp against solvePlan, split against whole); e3pcls's own exactness is solver-e3pcls.test.mjs's, which retakes the pin
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { APP_CANDIDATE, APP_TIER_REALS, APP_LAMBDA, appPlan, solveForApp } from '../../src/solverApp.js';
import { arenaFor, arenaPool } from '../../src/solverPool.js';
import { CANDIDATE_OPTS, CANDIDATE_HASH, hashOf, blendReals, candidatePlan } from '../solver/candidate.mjs';
import { checkE3pclsPin } from '../solver/e3pcls-pin.mjs';
import { LAMBDA } from '../solver/panel-7uf.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const all = buildScenarios();
const planOf = id => { const h = all.find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 } })); };
checkE3pclsPin({ ...CANDIDATE_OPTS });
const WORKER = fileURLToPath(new URL('./solver-app-worker.mjs', import.meta.url));
const SMALL = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, PTS = 4;

// 1. the copy
const same = (a, b) => JSON.stringify(a, Object.keys(a).sort()) === JSON.stringify(b, Object.keys(b).sort()) && JSON.stringify(a.adaptiveLattice) === JSON.stringify(b.adaptiveLattice) && JSON.stringify(a.menuPlus) === JSON.stringify(b.menuPlus);
const realsSame = (a, b) => Object.keys(b).length === Object.keys(a).length && Object.entries(b).every(([k, v]) => a[k] === v);
ok(same(APP_CANDIDATE, CANDIDATE_OPTS) && hashOf({ ...APP_CANDIDATE }) === CANDIDATE_HASH, `1. the app's candidate is candidate.json key for key, its hash ${hashOf({ ...APP_CANDIDATE })} the candidate's ${CANDIDATE_HASH}`);
ok(realsSame(APP_TIER_REALS, blendReals()), `1. the app's tier returns are O60's: ${JSON.stringify(APP_TIER_REALS)}`);
ok(APP_LAMBDA === LAMBDA, `1. the app's dislike of cuts is Phase 4's lambda (${APP_LAMBDA})`);
ok(!same({ ...APP_CANDIDATE, switchCharge: 0.002 }, CANDIDATE_OPTS) && !same({ ...APP_CANDIDATE, adaptiveLattice: { ...APP_CANDIDATE.adaptiveLattice, nz: 64 } }, CANDIDATE_OPTS)
  && !realsSame({ ...APP_TIER_REALS, 'Low Risk': 2.77 }, blendReals()), '1. planted: one setting, the lattice, or one tier\'s return changed in the copy fails the comparison');
{ const p = planOf('S126'), a = appPlan(E, p), b = candidatePlan(E, p);
  ok(JSON.stringify(a) === JSON.stringify(b), '1. appPlan is candidatePlan on S126'); }

// 2. the app's solve is the candidate's
const plan = planOf('S126'), opts = { lambda: LAMBDA, points: PTS, research: SMALL };
const arrays = r => { const out = []; const W = r.tablesW; const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L); else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  const ref = r.g && r.g.reader && r.g.reader.adaptive && r.g.reader.adaptive.ref;
  if (ref) { const { V, MV, V0, MV0, AST, ASTY } = ref.arrays(), yrs = o => Object.keys(o).map(Number).sort((x, y) => x - y); out.push(AST);
    for (const Vk of V) for (const t of yrs(Vk)) out.push(Vk[t]); for (const t of yrs(MV)) out.push(MV[t]); for (const Vk of V0) for (const t of yrs(Vk)) out.push(Vk[t]); for (const t of yrs(MV0)) out.push(MV0[t]); for (const t of yrs(ASTY)) out.push(ASTY[t]); }
  return out; };
const differ = (A, B) => { if (A.length !== B.length) return Infinity; let d = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = B[i]; if (a.length !== b.length) return Infinity; for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) d++; } return d; };
const values = A => A.reduce((t, a) => t + a.length, 0);
const t0 = Date.now(), one = solveForApp(E, M, plan, opts), t1 = Date.now();
const ref = solvePlan(E, M, candidatePlan(E, plan), { ...CANDIDATE_OPTS, ...SMALL, lambda: LAMBDA, points: PTS });
const A = arrays(one);
ok(differ(A, arrays(ref)) === 0 && one.g.reader.adaptive, `2. S126: solveForApp's ${A.length} arrays (${values(A)} values, the reference's among them) the same bit for bit as the candidate's solve (${(t1 - t0) / 1000} s)`);

// 3. the split on the arena
async function split(parts, planted = null) {
  const arena = arenaFor();
  if (!arena) throw new Error('no growable SharedArrayBuffer here');
  const ends = [], said = [];
  for (let part = 1; part < parts; part++) {
    const w = new Worker(WORKER, { workerData: { part, parts, arena, plan, opts, planted } });
    w.on('message', m => said.push(m.error));
    ends.push(new Promise((resolve, reject) => {
      w.once('error', e => { Atomics.store(new Int32Array(arena.ctrl), 2, 1); reject(e); });
      w.once('exit', code => (code === 0 ? resolve() : reject(new Error(`part ${part} exited ${code}`))));
    }));
  }
  const pool = arenaPool(0, parts, arena);
  let r = null, err = null;
  try { r = solveForApp(E, M, plan, { ...opts, e2: pool }); } catch (e) { pool.fail(); err = e; }
  const settled = await Promise.allSettled(ends);
  const workerErr = settled.find(s => s.status === 'rejected');
  return { r, err: err || (workerErr && workerErr.reason) || null, bytes: arena.buf.byteLength, said: [...(err ? [err.message] : []), ...said] };
}
for (const parts of [2, 3]) {
  const t2 = Date.now(), s = await split(parts), t3 = Date.now();
  const d = s.r ? differ(A, arrays(s.r)) : Infinity, sp = s.r && s.r.g.reader.adaptive.ref.split;
  ok(!s.err && d === 0 && s.r.meta.e2 && s.r.meta.e2.parts === parts && sp && sp.written === sp.cells, `3. S126 split ${parts} ways on the arena (${(s.bytes / 2 ** 20).toFixed(1)} MB carved): every array the same as whole, ${d} of ${values(A)} values differ; the reference's ${sp ? sp.cells : '?'} cells each written (${(t3 - t2) / 1000} s)${s.err ? ` ERROR ${s.err.message}` : ''}`);
}
{ const s = await split(2, 'drop'), d = s.r ? differ(A, arrays(s.r)) : Infinity;
  ok(d > 0, `3. planted: part 1 claims cells and drops them: ${d === Infinity ? 'the solve failed' : `${d} values differ`}`); }
{ const s = await split(3, 'stray'), caught = s.said.find(m => /carved/.test(m));
  ok(s.err && !s.r && caught, `3. planted: part 1 carves one table more: the barrier fails the solve (${caught ? caught.slice(0, 140) : `NOT CAUGHT: ${s.said.join(' | ')}`})`); }
{ const s = await split(3, 'throw');
  ok(s.err && !s.r, `3. planted: part 1 throws before it starts: the solve fails whole (${s.err ? String(s.err.message || s.err).slice(0, 120) : 'NOT CAUGHT'})`); }
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
