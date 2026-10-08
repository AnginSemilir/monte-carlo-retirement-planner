/*
 * E2, ONE SOLVE SPLIT ACROSS CORES (research/solver/e2.mjs; solve.js's opts.e2). The maintainer, 6 Oct: E2 counts toward
 * gate 5 'once built and shown exact (every table the same split and unsplit, as E3c showed for e3)'. This is that check:
 *   1. on the research candidate (S126: the reader, TS+J, Q's step, the charge, e3, the smooth allowance axis, the blend
 *      medians), today's product (S194, the tier above 'auto'; its rule takes one solve here, 'off: no tier above the plan', so
 *      the rule's second solve is not exercised: the plan-auditor's MINOR 7 on c60a545864) and the COV edge node (S130, whose
 *      copied cells read other cells of the same year), every table - survival, estate, resilience, policy, shortfall, every
 *      world and every tier-state layer - is bit for bit the same split four ways and unsplit, and so are the counts of
 *      moves evaluated and cells copied;
 *   2. planted: a part that claims cells and never writes them breaks identity, or the comparison proves nothing;
 *   3. planted: a part that fails makes the split solve fail, not hang or return half-written tables.
 *   node research/tests/e2.test.mjs [points=4]
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { solveSplit } from '../solver/e2.mjs';
import { CANDIDATE_OPTS, candidatePlan } from '../solver/candidate.mjs';
import { checkE3pclsPin } from '../solver/e3pcls-pin.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const PTS = Number(process.argv[2] || 4), PARTS = 4, LAMBDA = 0.0223606797749979;
const planOf = id => { const sc = buildScenarios().find(x => x.id === id); return E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } })); };
// every table the solve keeps, in a fixed order (solver-e3.test.mjs's list)
const arrays = r => { const out = []; const W = r.tablesW; const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L); else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  return out; };
const differ = (A, B) => { if (A.length !== B.length) return Infinity; let d = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = B[i]; if (a.length !== b.length) return Infinity; for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) d++; } return d; };
const values = A => A.reduce((t, a) => t + a.length, 0);

const CASES = [
  ['S126', 'CANDIDATE', p => candidatePlan(E, p), { ...CANDIDATE_OPTS }],
  ['S194', 'PRODUCT', p => p, {}],
  ['S130', 'COV', p => p, { bridgeRead: 'reader', readerTax: true, coverage: true, e3: false, bequestWeight: 0.02 }],
];
for (const [id, name, planFn, o] of CASES) {
  const plan = planFn(planOf(id)), opts = { lambda: LAMBDA, points: PTS, ...o };
  checkE3pclsPin(opts);   // the candidate carries e3pcls (8 Oct): its unsplit solve below is a direct solvePlan
  const t0 = Date.now(), one = solvePlan(E, M, plan, opts), t1 = Date.now(), split = await solveSplit(E, M, plan, opts, PARTS), t2 = Date.now();
  const A = arrays(one), d = differ(A, arrays(split));
  ok(d === 0, `${id} ${name} at ${PTS} points: every table bit for bit the same split ${PARTS} ways (${A.length} arrays, ${values(A)} values; ${(t1 - t0) / 1000} s unsplit, ${(t2 - t1) / 1000} s split)`);
  ok(split.meta.evaluated === one.meta.evaluated && JSON.stringify(split.meta.e3 || null) === JSON.stringify(one.meta.e3 || null)
    && JSON.stringify(split.meta.coverage || null) === JSON.stringify(one.meta.coverage || null) && split.meta.e2 && split.meta.e2.parts === PARTS,
    `${id} ${name}: the same moves evaluated (${split.meta.evaluated}) and cells copied (e3 ${JSON.stringify(split.meta.e3 || null)}, coverage ${JSON.stringify(split.meta.coverage || null)})`);
  if (name === 'COV') ok(one.meta.coverage && one.meta.coverage.copied > 0, `${id} COV: the copy pass ran on cells that read another cell of their year (${one.meta.coverage && one.meta.coverage.copied} copied)`);
}
{ // 2. a part that claims cells and drops them
  const plan = planOf('S194'), opts = { lambda: LAMBDA, points: PTS };
  const d = differ(arrays(solvePlan(E, M, plan, opts)), arrays(await solveSplit(E, M, plan, opts, PARTS, 'drop')));
  ok(d > 0, `planted: a part that claims cells and never writes them breaks identity (${d} values differ)`);
}
{ // 3. a part that fails
  const plan = planOf('S194'), opts = { lambda: LAMBDA, points: PTS };
  let err = null; const t0 = Date.now();
  try { await solveSplit(E, M, plan, opts, PARTS, 'throw'); } catch (e) { err = e; }
  ok(err && /failed|exited/.test(String(err.message)), `planted: a part that fails fails the split solve (${err ? err.message : 'no error'}, after ${(Date.now() - t0) / 1000} s)`);
}
console.log(`\ne2: ${n} passed`);
