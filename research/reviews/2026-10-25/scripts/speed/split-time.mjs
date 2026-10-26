// The split's check (E2, research/solver/e2.mjs) on the speed checkout: the latest candidate (HR, the third step) with the
// table without the dealing cost, E5 and the five smaller cuts (ALL), all but one (ALL-E<n>) or E5 alone (E5), solved on one core (parts 1) or split
// (parts 2 here, this machine's two cores), timed, its tables hashed. e3pcls is off in both (declared: its pin is stale on the
// speed checkout's code, and the guard's own alternative is e3pcls: false), so the ratio of the two is the split's speed-up.
//   node split-time.mjs <household> <parts> <ALL | ALL-E<n> | E5> [points=45]
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs'), X = await imp('research/solver/e2.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, partsArg, arm, ptsArg] = process.argv.slice(2), parts = Number(partsArg), PTS = Number(ptsArg || 45);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const FIVE = { E7: { mixOnce: true }, E8: { postIds: true }, E9: { hoistNext: true }, E10: { gfnFast: true }, E11: { readerDirect: true } };
const allBut = (skip) => Object.assign({}, ...Object.entries(FIVE).filter(([k]) => k !== skip).map(([, v]) => v));
const cuts = arm === 'ALL' ? allBut('') : arm.startsWith('ALL-') && FIVE[arm.slice(4)] ? allBut(arm.slice(4)) : arm === 'E5' ? {} : (() => { throw new Error(`arm ${arm}?`); })();
const opts = { ...C.CANDIDATE_OPTS, e3pcls: false, lambda: 0.0223606797749979, points: PTS, menuPlus: ['hr'], tiersBelow: 3, tableDealing: false, ...cuts };
const t0 = Date.now(), r = parts > 1 ? await X.solveSplit(E, M, C.candidatePlan(E, plan), opts, parts) : S.solvePlan(E, M, C.candidatePlan(E, plan), opts), secs = (Date.now() - t0) / 1000;
const hh = createHash('sha256');
for (const ls of r.tablesW.layW) for (const L of ls) for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) hh.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
console.log(JSON.stringify({ who: id, arm: `SPLIT-${arm}`, parts, points: PTS, secs, hash: hh.digest('hex').slice(0, 16), e3pcls: false }));
