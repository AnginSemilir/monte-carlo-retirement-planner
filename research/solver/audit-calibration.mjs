/*
 * THE CALIBRATION CHECK (PLAN.md finding M16): when the table says "from here you survive with chance p",
 * how often does a simulated future from that position actually survive?
 *
 *   node research/solver/audit-calibration.mjs <bandIndex> <lambda> [paths=3000] [seed=7002]
 *
 * No extra simulation is needed. Each of the 3,000 held-out paths visits one position a year; at each
 * visit the table's own forecast for the move the plan takes there is recorded (the expected survival
 * over the five quadrature markets, read from next year's table - exactly what the solver maximises), and
 * once the path ends every visit on it is labelled with whether that path survived. Binning the ~100,000
 * (forecast, outcome) pairs by forecast gives the calibration curve: on the diagonal, the table's numbers
 * could be shown to users; off it, they could not, whatever the choices are worth.
 *
 * Same baseline as the ranking check: resilience off, six levels, the full scan, tiers, raises, single
 * table, the exact final year with FINALEXACT=1. POINTS overrides the 30 wealth points (a smoke test only).
 *
 * PREDICTION (written in the predictions register before this ran): monotone in every bin with 1,000 or
 * more visits; close to the diagonal below 10% and above 99%; optimistic by 2-6 points between 20% and
 * 90%, where the survival cliff is; the visit-weighted mean forecast above the realised rate by 1-3
 * points. FALSIFIED IF a well-filled bin realises more than a lower one beyond noise, or the table is
 * pessimistic on average.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { readValues } from '../../src/solver/grid.js';
import { solve, runPolicy, WEIGHTS } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const K = Number(process.argv[2]), LAMBDA = Number(process.argv[3]);
const NP = Number(process.argv[4] || 3000), SEED = Number(process.argv[5] || 7002);
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync(join(HERE, 'results/band-70-98-7001.json'), 'utf8'));
const sc = singles[band[K].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const T = m.ctx.totalYears;
const t0 = Date.now();
const r = solve(E, M, plan, { points: Number(process.env.POINTS || 30), lambda: LAMBDA, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum, resilienceWeight: 0, finalExact: process.env.FINALEXACT === '1' || undefined });
const solveMs = Date.now() - t0;

/* The table's forecast for one move at one position: the same arithmetic as scoreMoves, for that move only. */
const post = new Float64Array(8), grown = new Float64Array(8), rd = new Float64Array(4);
function forecast(s, t, ai, held) {
  post.set(s);
  const unmet = F.flow(r.c, t, ai, post);
  if (unmet > 1 || r.c.last.preNmpaInsolvent) return { sv: 0, score: -Infinity };
  F.chargeSwitch(r.c, post, held, r.c.acts[ai], t);
  const nr = r.nodeRealOfAt[t][ai], QW = r.quadWeights || WEIGHTS;
  let sv = 0, bq = 0, h = (r.c.yr.spend[t] > 0 ? r.costOf(r.levelOf[ai]) : 0) + (r.driftCostOf ? r.driftCostOf[ai] : 0);
  for (let zi = 0; zi < QW.length; zi++) {
    grown.set(post); F.grow(r.c, t, grown, nr[zi]);
    if (t >= T) {
      const { floor, deathTax, beqOf } = r.terminal, total = grown[0] + grown[1] + grown[2];
      const alive = !(floor > 0 && total < floor);
      sv += QW[zi] * (alive ? 1 : 0); bq += QW[zi] * (alive ? beqOf(Math.max(0, total - grown[0] * deathTax)) : 0);
    } else {
      readValues(r.g, r.lsurv[t + 1], r.beq[t + 1], grown, rd, r.lresil[t + 1], r.short[t + 1], t + 1);
      sv += QW[zi] * rd[0]; bq += QW[zi] * rd[1]; h += QW[zi] * rd[3];
    }
  }
  return { sv, score: sv + r.wB * bq - h };
}

/* Walk every held-out path; one visit a year while the path is alive. */
const cap = NP * (T + 1);
const vt = new Uint8Array(cap), vf = new Float32Array(cap), vs = new Float32Array(cap), vok = new Uint8Array(cap);
let nv = 0, survived = 0;
const t1 = Date.now();
E.pathsForSeed(SEED, NP, T).forEach(zs => {
  const from = nv;
  const out = runPolicy(r, zs, { visit: (t, s, held, ai) => { if (t > T) return; const f = forecast(s, t, ai, held); vt[nv] = t; vf[nv] = f.sv; vs[nv] = f.score; nv++; } });
  if (out.survived) survived++;
  for (let k = from; k < nv; k++) vok[k] = out.survived ? 1 : 0;
});
const runMs = Date.now() - t1;

/* The curve: bins of forecast, finer at the top where most visits sit. */
const edges = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99, 0.995, 0.999, 1.0000001];
const bins = edges.slice(0, -1).map((lo, i) => ({ lo, hi: edges[i + 1], n: 0, f: 0, ok: 0 }));
let sumF = 0, sumOk = 0, brier = 0;
for (let k = 0; k < nv; k++) {
  const f = Math.min(1, Math.max(0, vf[k]));
  const b = bins.find(x => f >= x.lo && f < x.hi); b.n++; b.f += f; b.ok += vok[k];
  sumF += f; sumOk += vok[k]; brier += (f - vok[k]) ** 2;
}
const pct = x => (100 * x).toFixed(2).padStart(7);
console.log(`${sc.id} ${sc.name.slice(0, 40)} - lambda ${LAMBDA}, ${NP} paths, ${nv} visits, survival ${(100 * survived / NP).toFixed(2)}%, solve ${(solveMs / 1000).toFixed(0)} s, walk ${(runMs / 1000).toFixed(0)} s`);
console.log('  forecast bin        visits   mean forecast   realised   realised - forecast');
for (const b of bins) if (b.n) console.log(`  ${pct(b.lo)}-${pct(Math.min(1, b.hi))}  ${String(b.n).padStart(7)}   ${pct(b.f / b.n)}      ${pct(b.ok / b.n)}   ${(100 * (b.ok / b.n - b.f / b.n)).toFixed(2).padStart(7)}`);
console.log(`  all visits: mean forecast ${pct(sumF / nv)}  realised ${pct(sumOk / nv)}  Brier ${(brier / nv).toFixed(4)}`);
const y0 = []; for (let k = 0; k < nv; k++) if (vt[k] === 0) y0.push(vf[k]);
console.log(`  year 0 (the headline number): table ${pct(y0.reduce((a, b) => a + b, 0) / y0.length)}  simulated ${pct(survived / NP)}`);

mkdirSync(join(HERE, 'results/calibration'), { recursive: true });
writeFileSync(join(HERE, `results/calibration/${sc.id}.json.gz`), gzipSync(JSON.stringify({
  id: sc.id, lambda: LAMBDA, paths: NP, seed: SEED, T, survived: survived / NP, bins,
  visits: { t: Array.from(vt.subarray(0, nv)), forecast: Array.from(vf.subarray(0, nv), x => Math.round(x * 1e5) / 1e5), score: Array.from(vs.subarray(0, nv), x => Math.round(x * 1e5) / 1e5), ok: Array.from(vok.subarray(0, nv)) }
})));
