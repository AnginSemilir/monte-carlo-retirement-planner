/*
 * V4, THE PURPOSE TEST ON THE ASSEMBLED CANDIDATE (the external review of 21 Oct, Part B Step 5; STATE.md D4: with the
 * policy ensemble, the stopping rule for the grid and cliff work; run after 7u-F reads; exploratory). audit-bestof.mjs's
 * method unchanged (PLAN.md M18, the maintainer's test of 23 Sep: "check how far from the top score was the one with the
 * best survivability - if it is less than noise alone, we are successful"), on the candidate (solveCandidate: the
 * mixture, the tier state, the reader under the adaptive package):
 *   - 20 positions the plan reaches (60 paths of seed 8101; half drawn from where the chooser's own expected survival for
 *     its move is between 30% and 97%, the cliff), the same position seed 131;
 *   - at each, the top 6 DISTINCT moves by the score the candidate's chooser ranks by (chooseAction's own scores, the
 *     worlds weighted and the switch charge applied: r._sc after the call), moves landing on the same position and
 *     tiers counted once;
 *   - each simulated on 800 fresh paths (seed 20000 + position): that move now, the candidate after it; picked on the
 *     first 400 (half A), measured on the other 400 (half B) against the candidate's own pick, so the winner's luck on A
 *     does not count;
 *   - two yardsticks per path: survival, and the whole score (the solver's own objective, reduce-7uf.mjs wholeScore over
 *     the run's trace at the unit's estate weight; the original's caveat, an old objective, does not arise).
 * D4's measure: the best-on-A move beyond 2 paired se ahead on B at no more than 5% of positions, at both estate weights.
 *   node research/solver/audit-bestof-cand.mjs <household | band:K> <lambda> <weight> [positions=20] [paths=800] [K=6]
 * The original eight (batch-bestof-floor.sh): band 10, 32, 64, 68, 50, 6, 16, 26 at their own lambdas; and 7u-F's harmed
 * or unsettled households at 7u's lambda. Prints one SUMMARY line a run; per-position rows to results/bestof-cand.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { solveCandidate, CANDIDATE_HASH } from './candidate.mjs';
import { makeTrace } from './record.mjs';
import { wholeScore } from './reduce-7uf.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const [who, lamArg, wArg] = process.argv.slice(2, 5);
const PTS = Number(process.env.PTS || 45), OUTD = process.env.OUTDIR || null;   // the external review, 25 Oct: the latest candidate's settings
const EXTRA = { ...(process.env.MENUPLUS ? { menuPlus: process.env.MENUPLUS.split(',') } : {}), ...(process.env.TIERS_BELOW ? { tiersBelow: Number(process.env.TIERS_BELOW) } : {}) };
const LAMBDA = Number(lamArg), W = Number(wArg), NPOS = Number(process.argv[5] || 20), NP = Number(process.argv[6] || 800), KC = Number(process.argv[7] || 6);
if (!who || !(LAMBDA >= 0) || !(W > 0)) { console.error('usage: audit-bestof-cand.mjs <household | band:K> <lambda> <weight> [positions] [paths] [K]'); process.exit(2); }
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const sc = who.startsWith('band:') ? singles[JSON.parse(readFileSync(join(HERE, 'fixtures/band-70-98-7001.json'), 'utf8'))[Number(who.slice(5))].i] : singles.find(s => s.id === who);
if (!sc) { console.error(`audit-bestof-cand: no household ${who}`); process.exit(2); }
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } }));
const t0 = Date.now(), r = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...EXTRA }), T = r.m.ctx.totalYears, n = r.actions.length;
console.log(`${sc.id} (${who}): the candidate ${CANDIDATE_HASH} at ${PTS} points, ${n} moves, tier pairs ${r.meta.tierState}, tiersBelow ${r.meta.tiersBelow}, menuPlus ${(EXTRA.menuPlus || []).join('+') || 'none'}, lambda ${LAMBDA}, estate weight ${W}, solved in ${Math.round((Date.now() - t0) / 1000)} s; ${NPOS} positions, the top ${KC} distinct moves, ${NP} paths (${NP / 2} to pick, ${NP / 2} to measure)`);

// the survival the chooser expects for move ai (each table's survival part, weighted as chooseAction weights them)
const SC1 = new Float64Array(n), TX1 = new Float64Array(n), BQ1 = new Float64Array(n), SV1 = new Float64Array(n);
const survOf = (s, t, held, ai) => r.mix.tables.reduce((acc, tab, k) => { scoreMoves(tab, s, t, SC1, TX1, BQ1, held, { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[Math.min(t, tab.nodeRealOfAt.length - 1)][ai] }, SV1); return acc + r.mix.weights[k] * SV1[ai]; }, 0);

/* 1. positions the plan reaches */
const visits = [];
for (const zs of E.pathsForSeed(8101, 60, T)) runPolicy(r, zs, { visit: (t, s, held) => { if (t < T) visits.push({ t, s: Float64Array.from(s), held: held ? { ...held } : null }); } });
let seed = 131; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const forecastOf = v => survOf(v.s, v.t, v.held, chooseAction(r, v.s, v.t, v.held));
const cliff = visits.filter(v => { const f = forecastOf(v); return f > 0.3 && f < 0.97; });
const picks = [];
for (let k = 0; k < NPOS; k++) { const pool = (k % 2 === 1 && cliff.length) ? cliff : visits; picks.push({ ...pool[Math.floor(rnd() * pool.length)], cliff: pool === cliff }); }

/* 2. the top KC distinct moves by the chooser's own scores */
const post = new Float64Array(16);
function candidates(v) {
  const own = chooseAction(r, v.s, v.t, v.held), SC = Float64Array.from(r._sc), BQ = Float64Array.from(r._bq);
  const order = [...SC.keys()].filter(ai => SC[ai] > -Infinity).sort((a, b) => (SC[b] - SC[a]) || (BQ[b] - BQ[a]));
  if (order[0] !== own) { const i = order.indexOf(own); if (i > 0) { order.splice(i, 1); order.unshift(own); } }   // the chooser's pick first (a tie broken its way)
  const seen = new Set(), out = [];
  for (const ai of order) {
    post.fill(0); post.set(v.s.subarray(0, Math.min(v.s.length, post.length))); F.flow(r.c, v.t, ai, post);
    const a = r.c.acts[ai], key = `${Array.from(post.subarray(0, 7), x => Math.round(x / 10)).join(',')}|${a.tierPen || 0}/${a.tierIsa || 0}`;
    if (seen.has(key)) continue;
    seen.add(key); out.push({ ai, score: SC[ai] });
    if (out.length >= KC) break;
  }
  return out;
}

/* 3. a move simulated: that move now, the candidate after; per path survival and the whole score */
const bsOf = (tr, surv) => ({ survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: tr.Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) });
function simulate(v, ai, paths) {
  const tr = makeTrace(paths.length, T + 1), ok = new Uint8Array(paths.length);
  paths.forEach((zs, i) => { tr.row = i; if (runPolicy(r, Float64Array.from(zs), { start: { s: v.s, t: v.t, held: v.held, firstAi: ai }, trace: tr }).survived) ok[i] = 1; });
  return { ok, obj: wholeScore(bsOf(tr, ok), W, tr.Y) };
}
const mean = a => a.reduce((p, q) => p + q, 0) / a.length;
const pairedSe = (a, b) => { const d = a.map((x, i) => x - b[i]); const m_ = mean(d); return Math.sqrt(d.reduce((p, x) => p + (x - m_) ** 2, 0) / (d.length * (d.length - 1))); };
const out = [];
for (let pi = 0; pi < picks.length; pi++) {
  const v = picks[pi], cands = candidates(v);
  if (cands.length < 2) continue;
  const paths = E.pathsForSeed(20000 + pi, NP, T), half = NP >> 1, sims = cands.map(c => simulate(v, c.ai, paths));
  const A = x => Array.from(x.subarray(0, half)), B = x => Array.from(x.subarray(half));
  const rows = cands.map((c, k) => ({ ai: c.ai, scoreGap: cands[0].score - c.score, survA: 100 * mean(A(sims[k].ok)), survB: 100 * mean(B(sims[k].ok)), objA: mean(A(sims[k].obj)), objB: mean(B(sims[k].obj)) }));
  const bestObj = rows.reduce((b, x, k) => (x.objA > rows[b].objA ? k : b), 0), bestSurv = rows.reduce((b, x, k) => (x.survA > rows[b].survA ? k : b), 0);
  const dObj = rows[bestObj].objB - rows[0].objB, seObj = bestObj ? pairedSe(B(sims[bestObj].obj), B(sims[0].obj)) : 0;
  const dSurv = rows[bestSurv].survB - rows[0].survB, seSurv = bestSurv ? 100 * pairedSe(B(sims[bestSurv].ok), B(sims[0].ok)) : 0;
  // THE PLANT (the external review, 25 Oct): the same read with the last distinct rival standing in for the chooser's pick,
  // on the same simulations. A measure that cannot see a pick that bad would pass whatever the chooser did.
  const L = cands.length - 1, plant = { dObj: rows[bestObj].objB - rows[L].objB, seObj: bestObj !== L ? pairedSe(B(sims[bestObj].obj), B(sims[L].obj)) : 0,
    dSurv: rows[bestSurv].survB - rows[L].survB, seSurv: bestSurv !== L ? 100 * pairedSe(B(sims[bestSurv].ok), B(sims[L].ok)) : 0 };
  out.push({ t: v.t, cliff: v.cliff, rows, bestObj, bestSurv, dObj, seObj, dSurv, seSurv, plant });
}
const beyond = (x, se) => se > 0 && x > 2 * se, f = (x, d = 2) => (x >= 0 ? '+' : '') + x.toFixed(d), N = out.length;
const bS = out.filter(x => beyond(x.dSurv, x.seSurv)).length, bO = out.filter(x => beyond(x.dObj, x.seObj)).length;
const pS = out.filter(x => beyond(x.plant.dSurv, x.plant.seSurv)).length, pO = out.filter(x => beyond(x.plant.dObj, x.plant.seObj)).length;
console.log(`SUMMARY ${sc.id} W${W} lambda ${LAMBDA}: ${N} positions (${out.filter(x => x.cliff).length} on the cliff); survival: best-on-A ahead on B ${f(mean(out.map(x => x.dSurv)))} points, beyond 2 se at ${bS}/${N}; whole score: ahead ${f(mean(out.map(x => x.dObj)), 3)} points, beyond 2 se at ${bO}/${N}; the candidate's own pick best on A (whole score) at ${out.filter(x => x.bestObj === 0).length}/${N}`);
console.log(`PLANT ${sc.id} W${W}: the last distinct rival standing in for the pick, on the same simulations: survival ahead ${f(mean(out.map(x => x.plant.dSurv)))} points, beyond 2 se at ${pS}/${N}; whole score ahead ${f(mean(out.map(x => x.plant.dObj)), 3)}, beyond 2 se at ${pO}/${N}`);
const DIR = OUTD || join(HERE, 'results/bestof-cand');
mkdirSync(DIR, { recursive: true });
writeFileSync(join(DIR, `${sc.id}-w${W}.json`), JSON.stringify({ id: sc.id, who, lambda: LAMBDA, weight: W, candidate: CANDIDATE_HASH, points: PTS, menuPlus: EXTRA.menuPlus || [], tiersBelow: r.meta.tiersBelow, tierState: r.meta.tierState, moves: n, paths: NP, K: KC, positions: out }));
