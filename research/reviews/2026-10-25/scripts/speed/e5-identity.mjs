/*
 * E5's IDENTITY (the external review's speed work, 25 Oct; on the speed checkout). In one process, the latest candidate
 * (HR, the third step) solved four ways: as it stands; the prototype (tableDealing false) with its layer loop (tsOnce
 * false); the prototype with E5 (its default); and E5 planted (tsOncePlant 'nocharge', the switch charge dropped). Every
 * table the solve keeps (each world's every layer: survival, estate, resilience, policy, shortfall) is hashed and the
 * prototype's two are compared value by value: E5 must give the loop's tables bit for bit, and the plant must part them.
 * Run it with REALAT_NOCACHE=1 too: the hashes must not move (the realAt cache is the same doubles).
 *   node e5-identity.mjs <household> <points>
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, ptsArg] = process.argv.slice(2), PTS = Number(ptsArg || 6);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const base = { ...C.CANDIDATE_OPTS, lambda: 0.0223606797749979, points: PTS, menuPlus: ['hr'], tiersBelow: 3 };
const arrays = r => { const out = []; const W = r.tablesW; const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L); else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  return out; };
const hashOf = A => { const hh = createHash('sha256'); for (const a of A) hh.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); return hh.digest('hex').slice(0, 16); };
const differ = (A, B) => { let d = 0, n = 0; for (let i = 0; i < A.length; i++) for (let j = 0; j < A[i].length; j++) { n++; if (!Object.is(A[i][j], B[i][j])) d++; } return { d, n }; };
const run = (label, extra) => { const t0 = Date.now(), r = S.solvePlan(E, M, C.candidatePlan(E, plan), { ...base, ...extra }), A = arrays(r);
  const out = { label, secs: (Date.now() - t0) / 1000, hash: hashOf(A), A, values: A.reduce((t, a) => t + a.length, 0) };
  console.log(`${id} at ${PTS} points, ${label}: ${out.secs.toFixed(0)} s, ${A.length} arrays, ${out.values} values, hash ${out.hash}${process.env.REALAT_NOCACHE ? ' (realAt uncached)' : ''}`); return out; };
const cand = run('the candidate as it stands', {});
const loop = run('the prototype, its layer loop', { tableDealing: false, tsOnce: false });
const e5 = run('the prototype with E5', { tableDealing: false });
const plant = run('E5 planted (the switch charge dropped)', { tableDealing: false, tsOncePlant: 'nocharge' });
const a = differ(loop.A, e5.A), p = differ(loop.A, plant.A);
console.log(`${id}: E5 against the loop: ${a.d} of ${a.n} values differ: ${a.d === 0 ? 'THE SAME BIT FOR BIT' : 'DIFFERENT'}; the plant against the loop: ${p.d} differ: ${p.d > 0 ? 'CAUGHT' : 'NOT CAUGHT'}; E5 ${(loop.secs / e5.secs).toFixed(2)} times as fast as the loop`);
