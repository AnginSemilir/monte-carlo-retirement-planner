// The memo's own plants under E5 (the table without the dealing cost): which of them a test of the memo can use there.
// The latest candidate (HR, the third step) with tableDealing false, as E5 alone and with the four cuts in E5's path
// (E7, E8, E9, E11), each with the memo's plant 'noworld' (the world left out of its key) and 'nocls' (the growth class
// left out), every table value compared with the unplanted solve's.
//   node memo-plant.mjs <household> <points>
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, ptsArg] = process.argv.slice(2), PTS = Number(ptsArg || 4);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const base = { ...C.CANDIDATE_OPTS, lambda: 0.0223606797749979, points: PTS, menuPlus: ['hr'], tiersBelow: 3, tableDealing: false };
const FOUR = { mixOnce: true, postIds: true, hoistNext: true, readerDirect: true };
const arrays = r => { const out = []; for (const ls of r.tablesW.layW) for (const L of ls) for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); return out; };
const differ = (A, B) => { let d = 0, n = 0; for (let i = 0; i < A.length; i++) for (let j = 0; j < A[i].length; j++) { n++; if (!Object.is(A[i][j], B[i][j])) d++; } return { d, n }; };
const solve = extra => arrays(S.solvePlan(E, M, C.candidatePlan(E, plan), { ...base, ...extra }));
for (const [label, cuts] of [['E5 alone', {}], ['E5 with the four', FOUR]]) {
  const ref = solve(cuts);
  for (const plant of ['noworld', 'nocls']) {
    const x = solve({ ...cuts, expMemoPlant: plant }), dd = differ(ref, x);
    console.log(`${id} at ${PTS} points, ${label}, the memo's plant '${plant}': ${dd.d} of ${dd.n} values differ: ${dd.d > 0 ? 'IT BITES' : 'IT DOES NOT BITE'}`);
  }
}
