// the candidate's run on 100 paths, hashed: the identity of the tiersBelow copy (option unset, e3pcls off) and the unedited code
import { resolve } from 'path'; import { pathToFileURL } from 'url'; import { createHash } from 'crypto';
const root = process.cwd(), imp = p => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js'), C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs'); const { LAMBDA, SEED } = await imp('research/solver/v4-ensemble.mjs');
const [id, pts, extraJson] = process.argv.slice(2); const extra = JSON.parse(extraJson || '{}');
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const r = C.solveCandidate(E, M, plan, { lambda: LAMBDA, points: Number(pts), bequestWeight: 0.02, ...extra });
const T = r.m.ctx.totalYears, hs = createHash('sha256'); let surv = 0;
for (const zs of E.pathsForSeed(SEED, 100, T)) { const o = S.runPolicy(r, Float64Array.from(zs)); if (o.survived) surv++; hs.update(`${o.survived}|${o.terminal}|${o.lifetimeTax}|${o.levelSum};`); }
const th = createHash('sha256'); for (const k of [r.surv, r.beq, r.lsurv]) for (const a of k) th.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
console.log(JSON.stringify({ id, pts, extra, moves: r.actions.length, pairs: r.meta.tierState, survived: surv, runHash: hs.digest('hex').slice(0, 16), tableHash: th.digest('hex').slice(0, 16) }));
