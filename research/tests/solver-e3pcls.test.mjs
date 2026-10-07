/*
 * E3'S LUMP-SUM HALF (solve.js `e3pcls`; PLAN.md E3-PCLS; the maintainer, 6 Oct: 'Do the lump sum work before phase 4
 * anyway'). A cell whose pension is empty has every allowance bucket equal to its zero bucket's only if nothing can pay into
 * the pension in that year or later; the solver copies those cells past `lastPenIn`. This is its identity check:
 *   1. every table bit for bit the same with e3pcls on and off - on S124 under the research candidate (no inflow: copies
 *      from year 0), S194 under today's product, S180 under the candidate (still working), S126 under the candidate (a dated
 *      pension deposit in year 4) and S126 with a further deposit six years in that the allowance stages into later years - with
 *      cells copied (an identity on nothing copied proves nothing) and fewer moves evaluated (the copies skip their solve);
 *   2. planted, each of which must break identity, or the rule is untested: copying in every year (S180); copying from the
 *      last inflow year itself (the boundary: S180, S126, the staged deposit); and each clause dropped alone on a household
 *      it alone sets (work on S180, deposit on S126, transfer on the staged deposit);
 *   3. under E2 (the solve split four ways, research/solver/e2.mjs): S180's candidate with e3pcls the same split and unsplit,
 *      the same cells copied and moves evaluated (the copies sit in E2's copy pass, made by part 0 after each year's barrier).
 *   node research/tests/solver-e3pcls.test.mjs [points=4]
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { solveSplit } from '../solver/e2.mjs';
import { CANDIDATE_OPTS, candidatePlan } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const PTS = Number(process.argv[2] || 4), LAMBDA = 0.0223606797749979;
const norm = p => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const raw = id => JSON.parse(JSON.stringify(buildScenarios().find(x => x.id === id).plan));
const withDeposit = (p, years, amount) => { const y = E.buildContext(E.normalizePlan(p)).baseYear + years; p.oneOffContributions = [...(p.oneOffContributions || []), { id: 'e3pcls-dep', date: `${y}-06-01`, year: y, owner: 'Myself', category: 'Pensions', amount }]; return p; };
// every table the solve keeps, in a fixed order (solver-e3.test.mjs's list)
const arrays = r => { const out = []; const W = r.tablesW; const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L); else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  return out; };
const differ = (A, B) => { if (A.length !== B.length) return Infinity; let d = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = B[i]; if (a.length !== b.length) return Infinity; for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) d++; } return d; };

// one household for each clause that can set lastPenIn (the deep review of 7 Oct 00:01 UK: S126 has a dated pension deposit
// in year 4, so it is not a copy-from-year-0 case; S124 has no inflow at all), and the plants each clause must fail without
const CASES = [
  ['S124', 'CANDIDATE (no inflow)', () => candidatePlan(E, norm(raw('S124'))), { ...CANDIDATE_OPTS }, 'none', []],
  ['S194', 'PRODUCT', () => norm(raw('S194')), {}, null, []],
  ['S180', 'CANDIDATE (working)', () => candidatePlan(E, norm(raw('S180'))), { ...CANDIDATE_OPTS }, 'work', ['all', 'work', 'boundary']],
  ['S126', 'CANDIDATE (a dated pension deposit)', () => candidatePlan(E, norm(raw('S126'))), { ...CANDIDATE_OPTS }, 'deposit', ['deposit', 'boundary']],
  ['S126+deposit', 'CANDIDATE (a deposit staged into later years)', () => candidatePlan(E, norm(withDeposit(raw('S126'), 6, 20000))), { ...CANDIDATE_OPTS }, 'transfer', ['transfer', 'boundary']],
];
for (const [id, name, planFn, o, setBy, plants] of CASES) {
  const plan = planFn(), base = { lambda: LAMBDA, points: PTS, ...o };
  const t0 = Date.now(), off = solvePlan(E, M, plan, base), t1 = Date.now(), on = solvePlan(E, M, plan, { ...base, e3pcls: true }), t2 = Date.now();
  const A = arrays(off), d = differ(A, arrays(on)), info = on.meta.e3pcls;
  ok(d === 0, `${id} ${name} at ${PTS} points: every table bit for bit the same with e3pcls (${A.length} arrays; ${(t1 - t0) / 1000} s off, ${(t2 - t1) / 1000} s on)`);
  ok(info && info.copied > 0 && on.meta.evaluated < off.meta.evaluated, `${id}: cells copied (${info && info.copied}; lastPenIn ${info && info.lastPenIn}, set by ${info && info.setBy}) and fewer moves evaluated (${on.meta.evaluated} against ${off.meta.evaluated})`);
  if (setBy) ok(info.setBy === setBy || (setBy !== 'none' && info.setBy.split('+').includes(setBy)), `${id}: lastPenIn set by ${setBy} (${info.setBy})`);
  for (const P of plants) {
    const dp = differ(A, arrays(solvePlan(E, M, plan, { ...base, e3pcls: true, e3pclsPlant: P })));
    ok(dp > 0, `planted on ${id}: ${P === 'all' ? 'copying in every year' : P === 'boundary' ? 'copying from the last inflow year itself' : `dropping the ${P} clause`} breaks identity (${dp} values differ)`);
  }
}
{ // 3. under E2
  const plan = candidatePlan(E, norm(raw('S180'))), o = { ...CANDIDATE_OPTS, lambda: LAMBDA, points: PTS, e3pcls: true };
  const a = solvePlan(E, M, plan, o), b = await solveSplit(E, M, plan, o, 4), d = differ(arrays(a), arrays(b));
  ok(d === 0 && a.meta.e3pcls.copied === b.meta.e3pcls.copied && a.meta.evaluated === b.meta.evaluated, `S180 under E2: e3pcls the same split four ways and unsplit (${d} values differ; ${b.meta.e3pcls.copied} copied, ${b.meta.evaluated} evaluated)`);
}
console.log(`\ne3pcls: ${n} passed`);
