/*
 * SPEED PROTOTYPE N1 (EXPLORATORY; the external review, 25 Oct): the latest candidate (HR, the third step, 45 points)
 * solved as it stands and with `tableDealing: false` (the tier state's table without a switch's dealing cost; the chooser
 * still pays it), in one process on the speed checkout. Prints each solve's time, how far the tables moved (the policy at
 * the plan's own tier pair, every cell and year; the survival table's largest change), then both run on the same paths
 * of the tuning seed, paired: survival and the whole score. The pin check is bypassed (the checkout carries the
 * prototype): solvePlan with candidatePlan and CANDIDATE_OPTS, as solveCandidate calls it, e3pcls as the candidate has it.
 *   node n1-compare.mjs <household> [points=45] [paths=2000]
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const { makeTrace } = await imp('research/solver/record.mjs');
const { wholeScore } = await imp('research/solver/reduce-7uf.mjs');
const [id, ptsArg, nArg] = process.argv.slice(2);
const PTS = Number(ptsArg || 45), N = Number(nArg || 2000), LAMBDA = 0.0223606797749979, W = 0.02, SEED = 7002;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const opts = { ...C.CANDIDATE_OPTS, lambda: LAMBDA, points: PTS, bequestWeight: W, menuPlus: ['hr'], tiersBelow: 3 };
const arms = [['HRT3', {}], ['HRT3, the table without the dealing cost', { tableDealing: false }]];
const out = [];
for (const [label, extra] of arms) {
  const t0 = Date.now(), r = S.solvePlan(E, M, C.candidatePlan(E, plan), { ...opts, ...extra }), secs = (Date.now() - t0) / 1000;
  log(`${id} ${label}: solved in ${secs.toFixed(0)} s (${r.actions.length} moves, tier pairs ${r.meta.tierState}, ${PTS} points)`);
  out.push({ label, r, secs });
}
const [a, b] = out;
let cells = 0, polDiff = 0, maxDs = 0;
for (let t = 0; t < a.r.pol.length; t++) for (let i = 0; i < a.r.pol[t].length; i++) { cells++; if (a.r.pol[t][i] !== b.r.pol[t][i]) polDiff++; const d = Math.abs(a.r.surv[t][i] - b.r.surv[t][i]); if (d > maxDs) maxDs = d; }
log(`the tables at the plan's own tier pair: the policy differs at ${polDiff} of ${cells} cells (${(100 * polDiff / cells).toFixed(2)}%); the survival table's largest change ${maxDs.toExponential(3)}; the solve ${(a.secs / b.secs).toFixed(2)} times as fast`);
const T = a.r.m.ctx.totalYears, Y = T + 1, paths = E.pathsForSeed(SEED, N, T);
const runs = out.map(({ r }) => {
  const tr = makeTrace(N, Y), surv = new Uint8Array(N);
  paths.forEach((zs, k) => { tr.row = k; if (S.runPolicy(r, Float64Array.from(zs), { trace: tr }).survived) surv[k] = 1; });
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((x, q) => x + q.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  return { surv, ws: Float64Array.from(wholeScore(bs, W, Y)) };
});
const mean = x => x.reduce((p, q) => p + q, 0) / x.length, seOf = x => { const m = mean(x); return Math.sqrt(x.reduce((p, q) => p + (q - m) ** 2, 0) / (x.length - 1) / x.length); };
const dS = Array.from(runs[1].surv, (x, k) => 100 * (x - runs[0].surv[k])), dW = Array.from(runs[1].ws, (x, k) => x - runs[0].ws[k]);
const saved = dS.filter(x => x > 0).length, lost = dS.filter(x => x < 0).length;
log(`on ${N} paths of seed ${SEED}: survival ${(100 * mean(Array.from(runs[0].surv))).toFixed(2)}% then ${(100 * mean(Array.from(runs[1].surv))).toFixed(2)}%; the table without the dealing cost less as it stands, paired: survival ${mean(dS).toFixed(3)} points (se ${seOf(dS).toFixed(3)}; ${saved} saved, ${lost} lost), whole score ${mean(dW).toFixed(3)} (se ${seOf(dW).toFixed(3)})`);
