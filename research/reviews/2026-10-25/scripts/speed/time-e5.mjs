// A solve of the latest candidate (HR, the third step) on the speed checkout, timed alone, its tables hashed:
//   node time-e5.mjs <household> <points> <arm: N1LOOP (the prototype, its layer loop) | E5 (the prototype with E5, reading the four tables) | E6 (E5 with the packed reads) | E7 | ALL (E5 with E7 to E11) | ALL-E<n> (all but one) | CAND (as it stands)>
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, ptsArg, arm] = process.argv.slice(2), PTS = Number(ptsArg || 45);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
// the smaller savings (E7 to E11), each opt-in on the speed checkout: ALL takes the five, ALL-E<n> all but one
const FIVE = { E7: { mixOnce: true }, E8: { postIds: true }, E9: { hoistNext: true }, E10: { gfnFast: true }, E11: { readerDirect: true } };
const allBut = (skip) => Object.assign({ tableDealing: false }, ...Object.entries(FIVE).filter(([k]) => k !== skip).map(([, v]) => v));
const extra = arm === 'N1LOOP' ? { tableDealing: false, tsOnce: false } : arm === 'E5' ? { tableDealing: false, packedReads: false } : arm === 'E6' ? { tableDealing: false, packedReads: true } : arm === 'E7' ? { tableDealing: false, mixOnce: true }
  : arm === 'ALL' ? allBut('') : arm.startsWith('ALL-') ? allBut(arm.slice(4)) : arm === 'CAND' ? {} : (() => { throw new Error(`arm ${arm}?`); })();
const t0 = Date.now(), r = S.solvePlan(E, M, C.candidatePlan(E, plan), { ...C.CANDIDATE_OPTS, lambda: 0.0223606797749979, points: PTS, menuPlus: ['hr'], tiersBelow: 3, ...extra }), secs = (Date.now() - t0) / 1000;
const hh = createHash('sha256'); const W = r.tablesW;
for (const ls of W.layW) for (const L of ls) for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) hh.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
console.log(JSON.stringify({ who: id, arm: `HRT3-${arm}`, points: PTS, secs, moves: r.actions.length, tierState: r.meta.tierState, hash: hh.digest('hex').slice(0, 16), realAt: process.env.REALAT_NOCACHE ? 'uncached' : 'cached' }));
