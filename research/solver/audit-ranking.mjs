/*
 * THE RANKING CHECK (PLAN.md step 2b): when the table ranks two moves, does its first choice really
 * simulate better than its second?
 *
 *   node research/solver/audit-ranking.mjs <bandIndex> <lambda> [positions=40] [paths=500]
 *
 * Solves the household on the new baseline (resilience off, six levels, the full level scan, tiers, raises,
 * the exact final year with FINALEXACT=1, single table), walks the solver's own plan along simulated paths and samples positions it actually reaches
 * across the whole retirement. At each, it takes the table's top two moves (by the score chooseAction
 * uses) and their margin, then simulates each - take that move now, follow the solver afterwards - on the
 * same fresh paths. It records whether the first choice did at least as well, on survival and on
 * spending delivered, and what it lost when it did not, bucketed by the table's margin.
 *
 * Prediction (the predictions register): with a clear margin the first choice wins or ties in over 80% of
 * positions; near-ties are close to a coin toss; the average loss when wrong is under half a point and
 * no loss exceeds 2 points on the current grid.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, runPolicy, rankActions, scoreMoves } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const K = Number(process.argv[2]), LAMBDA = Number(process.argv[3]);
const NPOS = Number(process.argv[4] || 40), NP = Number(process.argv[5] || 500);
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync('/home/user/vitejs-vite-kdvuf9qw/research/solver/results/band-70-98-7001.json', 'utf8'));
const sc = singles[band[K].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const T = m.ctx.totalYears;
const r = solve(E, M, plan, { points: 30, lambda: LAMBDA, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum, resilienceWeight: 0, levelSearch: process.env.TERNARY === '1' ? 'ternary' : undefined, shareDead: process.env.SHAREDEAD || undefined, finalExact: process.env.FINALEXACT === '1' || undefined });

/* 1. positions the plan actually reaches: walk it on a sampling draw, keep every visited (t, state, tiers) */
const visits = [];
for (const zs of E.pathsForSeed(8101, 60, T)) runPolicy(r, zs, { visit: (t, s, held) => { if (t < T) visits.push({ t, s: Float64Array.from(s), held: { ...held } }); } });
let seed = 97; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const picks = []; for (let k = 0; k < NPOS && visits.length; k++) picks.push(visits[Math.floor(rnd() * visits.length)]);

/* 2. at each, the table's top two and its margin; then simulate each from there on the same fresh paths */
const A = r.actions.length, SC = new Float64Array(A), TX = new Float64Array(A), BQ = new Float64Array(A);
const out = [];
for (let pi = 0; pi < picks.length; pi++) {
  const v = picks[pi];
  const top = rankActions(r, v.s, v.t, v.held, 2);
  if (top.length < 2) continue;
  scoreMoves(r, v.s, r.finalExact ? v.t : Math.min(v.t, T - 1), SC, TX, BQ, v.held);
  const margin = SC[top[0]] - SC[top[1]];
  const paths = E.pathsForSeed(9000 + pi, NP, T);
  const sim = (ai) => { const ok = new Uint8Array(NP); let lvl = 0, n = 0; paths.forEach((zs, i) => { const o = runPolicy(r, zs, { start: { s: v.s, t: v.t, held: v.held, firstAi: ai } }); ok[i] = o.survived ? 1 : 0; if (o.spendYears) { lvl += o.levelSum / o.spendYears; n++; } }); return { ok, surv: 100 * ok.reduce((p, q) => p + q, 0) / NP, level: n ? lvl / n : 0 }; };
  const a = sim(top[0]), b = sim(top[1]);
  // paired on the same paths: the noise in the difference comes only from paths where the two disagree
  let disc = 0; for (let i = 0; i < NP; i++) if (a.ok[i] !== b.ok[i]) disc++;
  const se = 100 * Math.sqrt(disc) / NP;
  out.push({ t: v.t, margin, first: r.actions[top[0]].label, second: r.actions[top[1]].label, survFirst: a.surv, survSecond: b.surv, se, levelFirst: a.level, levelSecond: b.level });
}

/* 3. the report, bucketed by the table's margin (score units: one survival point is 0.01) */
const buckets = [['near-tie, margin < 0.0005', 0, 0.0005], ['small, 0.0005 - 0.005', 0.0005, 0.005], ['clear, > 0.005', 0.005, Infinity]];
console.log(`${sc.id} ${sc.name.slice(0, 40)} - ${out.length} positions, ${NP} paths each, lambda ${LAMBDA}`);
for (const [name, lo, hi] of buckets) {
  const xs = out.filter(o => o.margin >= lo && o.margin < hi);
  if (!xs.length) { console.log(`  ${name.padEnd(28)} none`); continue; }
  const losses = xs.map(o => o.survSecond - o.survFirst);
  const wrong = losses.filter(x => x > 0);
  const wrongSig = xs.filter(o => o.survSecond - o.survFirst > 2 * Math.max(o.se, 1e-9));
  // the solver trades survival against spending, so a clear error is worse on survival beyond noise AND not better on spending
  const dominated = wrongSig.filter(o => o.levelFirst <= o.levelSecond + 1e-9);
  const mean = (a) => a.reduce((p, q) => p + q, 0) / a.length;
  console.log(`  ${name.padEnd(28)} ${String(xs.length).padStart(3)} positions | first choice survives at least as well in ${(100 * (xs.length - wrong.length) / xs.length).toFixed(0)}% | when not: mean loss ${wrong.length ? mean(wrong).toFixed(2) : '-'} pts, worst ${wrong.length ? Math.max(...wrong).toFixed(2) : '-'} | beyond noise (2 se): ${wrongSig.length}, of which also no better on spending: ${dominated.length} | spending, first minus second ${(mean(xs.map(o => o.levelFirst - o.levelSecond)) * 100).toFixed(2)}%`);
}
mkdirSync('/home/user/vitejs-vite-kdvuf9qw/research/solver/results/ranking', { recursive: true });
writeFileSync(`/home/user/vitejs-vite-kdvuf9qw/research/solver/results/ranking/${sc.id}.json`, JSON.stringify({ id: sc.id, lambda: LAMBDA, paths: NP, positions: out }, null, 1));
