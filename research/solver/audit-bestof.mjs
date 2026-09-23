/*
 * THE BEST-OF-CANDIDATES CHECK (PLAN.md finding M18; the maintainer's test, 23 Sep 22:00): "take many
 * scenarios, run them through the solver, then check how far from the top score was the one with the best
 * survivability - if it is less than noise alone, we are successful."
 *
 *   node research/solver/audit-bestof.mjs <bandIndex> <lambda> [positions=20] [paths=800] [K=6]
 *
 * At positions the plan actually reaches, the table's top K DISTINCT moves (moves that lead to the same
 * position and tier are one candidate, since their futures are identical) are each simulated - take that move
 * now, follow the solver afterwards - on the same fresh paths. The paths are split in two halves. The best
 * candidate is PICKED on half A and MEASURED on half B, against the solver's own pick measured on half B:
 * picking and measuring on the same paths would hand the winner the luck of the draw (the winner's curse)
 * and make the solver look beaten by noise alone.
 *
 * Two yardsticks, both simulated per path, never read from the table:
 *   - survival, the maintainer's question;
 *   - the solver's own objective: survived + estate credit - trim penalty + raise credit, which is what the
 *     table ranks by. A move that survives more by cutting more is a legitimate trade on this yardstick, not
 *     a mistake, so the two are reported side by side.
 *
 * Positions: half drawn from anywhere the plan goes, half from where the table's forecast is between 30% and
 * 97% - on the cliff, where decisions are not near-ties (step 2b drew only near-ties at random).
 *
 * PREDICTION (the predictions register, written before this ran): on the solver's own objective the
 * half-A best beats the solver's pick on half B by more than two paired standard errors at no more than 5% of
 * positions, and the mean advantage is within two standard errors of zero. On survival alone the best
 * candidate is ahead by under half a point on average and within noise at 90% of positions; where it is
 * ahead, it gets there by cutting more (a trade the objective makes on purpose). FALSIFIED IF more than 10% of
 * positions show a half-B advantage beyond two se on the solver's own objective, or the mean advantage
 * exceeds 0.5 points of score beyond noise.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, runPolicy, scoreMoves } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const K = Number(process.argv[2]), LAMBDA = Number(process.argv[3]);
const NPOS = Number(process.argv[4] || 20), NP = Number(process.argv[5] || 800), KC = Number(process.argv[6] || 6);
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync(join(HERE, 'results/band-70-98-7001.json'), 'utf8'));
const sc = singles[band[K].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const T = m.ctx.totalYears;
const r = solve(E, M, plan, { points: Number(process.env.POINTS || 30), lambda: LAMBDA, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum, resilienceWeight: 0, finalExact: process.env.FINALEXACT === '1' || undefined, raiseSurvival: process.env.RAISESURV === '1' || undefined, failureShortfall: process.env.FAILSHORT ? (process.env.FAILSHORT === 'zero' ? 'zero' : true) : undefined });
const mu = r.meta.raiseWeight, lam = r.lambda, gam = r.shortExp;

/* 1. positions the plan reaches, with the table's forecast there */
const visits = [];
const SC = new Float64Array(r.actions.length), TX = new Float64Array(r.actions.length), BQ = new Float64Array(r.actions.length);
for (const zs of E.pathsForSeed(8101, 60, T)) runPolicy(r, zs, { visit: (t, s, held) => { if (t < T) visits.push({ t, s: Float64Array.from(s), held: { ...held } }); } });
let seed = 131; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const onCliff = (v) => { const sv = r.value(v.s, v.t).survival; return sv > 0.3 && sv < 0.97; };
const cliff = visits.filter(onCliff);
const picks = [];
for (let k = 0; k < NPOS; k++) {
  const pool = (k % 2 === 1 && cliff.length) ? cliff : visits;
  picks.push({ ...pool[Math.floor(rnd() * pool.length)], cliff: pool === cliff });
}

/* 2. the top KC distinct candidates at a position, by the score chooseAction uses */
const post = new Float64Array(8);
function candidates(v) {
  scoreMoves(r, v.s, v.t, SC, TX, BQ, v.held);
  const order = [...SC.keys()].filter(ai => SC[ai] > -Infinity).sort((a, b) => (SC[b] - SC[a]) || (BQ[b] - BQ[a]));
  const seen = new Set(), out = [];
  for (const ai of order) {
    post.set(v.s); F.flow(r.c, v.t, ai, post);
    const a = r.actions[ai];
    const key = `${Array.from(post.subarray(0, 7), x => Math.round(x / 10)).join(',')}|${a.tierPen}/${a.tierIsa}`;
    if (seen.has(key)) continue;
    seen.add(key); out.push({ ai, score: SC[ai] });
    if (out.length >= KC) break;
  }
  return out;
}

/* 3. simulate a candidate on the paths: per path, survived and the objective's own tally */
function simulate(v, ai, paths) {
  const ok = new Uint8Array(paths.length), obj = new Float64Array(paths.length);
  paths.forEach((zs, i) => {
    let raise = 0, trim = 0;
    const o = runPolicy(r, zs, { start: { s: v.s, t: v.t, held: v.held, firstAi: ai }, visit: (t, s, held, a) => {
      if (!(r.c.yr.spend[t] > 0)) return;
      const l = r.levelOf[a];
      if (l > 1) raise += mu * Math.sqrt(Math.min(0.2, l - 1)); else if (l < 1) trim += lam * Math.pow(1 - l, gam);
    } });
    ok[i] = o.survived ? 1 : 0;
    obj[i] = (o.survived ? 1 + r.wB * r.terminal.beqOf(o.terminalNet) : 0) + raise - trim;
  });
  return { ok, obj };
}
const mean = a => a.reduce((p, q) => p + q, 0) / a.length;
const pairedSe = (a, b) => { const d = a.map((x, i) => x - b[i]); const m_ = mean(d); return Math.sqrt(d.reduce((p, x) => p + (x - m_) ** 2, 0) / (d.length * (d.length - 1))); };

const out = [];
for (let pi = 0; pi < picks.length; pi++) {
  const v = picks[pi];
  const cands = candidates(v);
  if (cands.length < 2) continue;
  const paths = E.pathsForSeed(20000 + pi, NP, T), half = NP >> 1;
  const sims = cands.map(c => simulate(v, c.ai, paths));
  const A = x => Array.from(x.subarray(0, half)), B = x => Array.from(x.subarray(half));
  const rows = cands.map((c, k) => ({ label: r.actions[c.ai].label, scoreGap: cands[0].score - c.score,
    survA: 100 * mean(A(sims[k].ok)), survB: 100 * mean(B(sims[k].ok)), objA: mean(A(sims[k].obj)), objB: mean(B(sims[k].obj)) }));
  // picked on half A, measured on half B, against the solver's pick (candidate 0) on half B
  const bestObj = rows.reduce((b, x, k) => (x.objA > rows[b].objA ? k : b), 0);
  const bestSurv = rows.reduce((b, x, k) => (x.survA > rows[b].survA ? k : b), 0);
  const dObj = rows[bestObj].objB - rows[0].objB, seObj = bestObj ? pairedSe(B(sims[bestObj].obj), B(sims[0].obj)) : 0;
  const dSurv = rows[bestSurv].survB - rows[0].survB, seSurv = bestSurv ? 100 * pairedSe(B(sims[bestSurv].ok), B(sims[0].ok)) : 0;
  out.push({ t: v.t, cliff: v.cliff, forecast: r.value(v.s, v.t).survival, rows, bestObj, bestSurv, dObj, seObj, dSurv, seSurv,
    bestSurvScoreGap: rows[bestSurv].scoreGap, bestSurvLabel: rows[bestSurv].label });
}

/* 4. the report */
const beyond = (x, se) => se > 0 && x > 2 * se;
const f = (x, d = 2) => (x >= 0 ? '+' : '') + x.toFixed(d);
console.log(`${sc.id} ${sc.name.slice(0, 40)} - ${out.length} positions (${out.filter(x => x.cliff).length} on the cliff), ${KC} candidates, ${NP} paths (${NP / 2} to pick, ${NP / 2} to measure), lambda ${LAMBDA}`);
for (const [label, rows] of [['all', out], ['on the cliff (forecast 30-97%)', out.filter(x => x.cliff)]]) {
  if (!rows.length) continue;
  const n = rows.length;
  console.log(`  ${label.padEnd(32)} objective: solver's pick is best-on-A ${rows.filter(x => x.bestObj === 0).length}/${n}; best-on-A ahead on B ${f(100 * mean(rows.map(x => x.dObj)))} pts (beyond 2 se at ${rows.filter(x => beyond(x.dObj, x.seObj)).length}/${n})` +
    `  |  survival: best-on-A ahead on B ${f(mean(rows.map(x => x.dSurv)))} pts (beyond 2 se at ${rows.filter(x => beyond(x.dSurv, x.seSurv)).length}/${n}), its score gap from the top ${mean(rows.map(x => x.bestSurvScoreGap)).toExponential(1)}`);
}
mkdirSync(join(HERE, 'results/bestof'), { recursive: true });
writeFileSync(join(HERE, `results/bestof/${sc.id}${process.env.TAG ? '-' + process.env.TAG : ''}.json`), JSON.stringify({ id: sc.id, lambda: LAMBDA, paths: NP, K: KC, knobs: { raiseSurvival: !!r.raiseSurvival, failureShortfall: r.failureShortfall || false }, positions: out }, null, 1));
