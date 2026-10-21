/*
 * V4, THE POLICY ENSEMBLE (the external review of 21 Oct, Part B Step 5; STATE.md D4: with the purpose test, the stopping rule
 * for the grid and cliff work until a ceiling exists; run after 7u-F reads; exploratory, the tuning seed). V3's six
 * households (v3-convergence.mjs), each solved several ways, every policy simulated on the same 8,000 paths of seed 7002
 * (runPolicy and its trace: survival and the whole score), at both estate weights 7u used:
 *   CAND          the assembled candidate (log-odds interpolation, the solver's own)
 *   CAND-lin      the same with survival interpolated in probability (SOLVER_INTERP=linear; a process of its own)
 *   CAND-probit   the same in probit (SOLVER_INTERP=probit, the review's probit-option.diff applied to a copy of src/solver
 *                 named by V4_PROBIT_DIR; e3pcls off there, exact either way, since the copy's code is not the pin's)
 *   DECOMP        the candidate on the plan reference (the reader's variant still in contention: D5's decomposing arm)
 *   SHIP          the shipping default, and SHIP-lin in probability
 * The best variant per household (by the whole score, the solver's own objective; survival reported beside it) and each
 * policy's gap to it, paired on the paths: a lower bound on that policy's distance from the best. D4's measure for the
 * candidate: its gap under 0.2 points on the panel mean and 0.5 on every household, at both weights.
 *   node research/solver/v4-ensemble.mjs <household> <variant> <weight>   one unit, to results/v4 (V4_OUT)
 *   node research/solver/v4-ensemble.mjs --units                          the units, one a line (with the env each needs)
 *   node research/solver/v4-ensemble.mjs --read [dir]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HOUSEHOLDS } from './v3-convergence.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const VARIANTS = { CAND: { interp: 'logodds' }, 'CAND-lin': { interp: 'linear' }, 'CAND-probit': { interp: 'probit' }, DECOMP: { interp: 'logodds' }, SHIP: { interp: 'logodds' }, 'SHIP-lin': { interp: 'linear' } };
export const WEIGHTS = ['0.02', '0.01'], SEED = 7002, NPATHS = 8000, PTS = 30, LAMBDA = 0.0223606797749979, MEAN_TOL = 0.2, HH_TOL = 0.5;
const OUT = process.env.V4_OUT || join(HERE, 'results', 'v4');
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const envOf = v => (VARIANTS[v].interp === 'logodds' ? '' : `SOLVER_INTERP=${VARIANTS[v].interp}${VARIANTS[v].interp === 'probit' ? ' V4_PROBIT_DIR=<the patched copy>' : ''}`);

async function unit(id, v, w) {
  const want = VARIANTS[v] && VARIANTS[v].interp, got = process.env.SOLVER_INTERP || 'logodds';
  if (!want || !WEIGHTS.includes(w)) { console.error(`v4: no variant ${v} or weight ${w}`); process.exit(2); }
  if (got !== want) { console.error(`v4: ${v} runs with SOLVER_INTERP=${want === 'logodds' ? '(unset)' : want}, this process has ${got}`); process.exit(2); }
  const SOL = want === 'probit' ? resolve(process.env.V4_PROBIT_DIR || '') : join(HERE, '../../src/solver');
  if (want === 'probit' && !existsSync(join(SOL, 'solve.js'))) { console.error('v4: CAND-probit needs V4_PROBIT_DIR, a copy of src/solver with the review\'s probit-option.diff'); process.exit(2); }
  const E = await import('../engine.mjs'), M = await import(pathToFileURL(join(SOL, 'model.js')).href), S = await import(pathToFileURL(join(SOL, 'solve.js')).href);
  const C = await import('./candidate.mjs'), { buildScenarios } = await import('../policy-study/scenarios.mjs'), { makeTrace } = await import('./record.mjs'), { wholeScore } = await import('./reduce-7uf.mjs');
  const h = buildScenarios().find(s => s.id === id);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const base = { lambda: LAMBDA, points: PTS, bequestWeight: Number(w) };
  const t0 = Date.now();
  const r = v.startsWith('SHIP') ? S.solvePlan(E, M, C.candidatePlan(E, plan), base)
    : v === 'CAND-probit' ? S.solvePlan(E, M, C.candidatePlan(E, plan), { ...C.CANDIDATE_OPTS, e3pcls: false, ...base })
    : C.solveCandidate(E, M, plan, v === 'DECOMP' ? { ...base, readerRef: undefined, adaptiveLattice: undefined } : base);
  const secs = (Date.now() - t0) / 1000, T = r.m.ctx.totalYears;
  const paths = E.pathsForSeed(SEED, NPATHS, T), tr = makeTrace(NPATHS, T + 1), surv = new Uint8Array(NPATHS);
  paths.forEach((zs, k) => { tr.row = k; if (S.runPolicy(r, Float64Array.from(zs), { trace: tr }).survived) surv[k] = 1; });
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: tr.Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  const ws = Float32Array.from(wholeScore(bs, Number(w), tr.Y)), sim = 100 * surv.reduce((a, x) => a + x, 0) / NPATHS;
  console.log(`v4 ${id} ${v} W${w}: readerRef ${r.meta.readerRef} interp ${want}; survival ${sim.toFixed(4)}, whole score ${(ws.reduce((a, x) => a + x, 0) / NPATHS).toFixed(4)} on ${NPATHS} (seed ${SEED}); solve ${Math.round(secs)} s`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${id}-${v}-w${w}.json.gz`), gzipSync(JSON.stringify({ id, v, w, interp: want, candidate: C.CANDIDATE_HASH, seed: SEED, N: NPATHS, sim, secs, survived: b64(surv), whole: b64(ws) })));
}

function read(dir) {
  const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), x = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)) }; };
  const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
  console.log(`V4 ENSEMBLE READ: ${dir}`);
  let allOk = true;
  for (const w of WEIGHTS) {
    const gaps = [];
    for (const id of HOUSEHOLDS) {
      const U = Object.fromEntries(Object.keys(VARIANTS).map(v => [v, join(dir, `${id}-${v}-w${w}.json.gz`)]).filter(([, f]) => existsSync(f)).map(([v, f]) => [v, load(f)]));
      if (!U.CAND) { console.log(`  ${id} W${w}: no CAND unit`); allOk = false; continue; }
      const best = Object.entries(U).reduce((a, b) => (mean(b[1].ws) > mean(a[1].ws) ? b : a));
      const gapOf = x => { const n = x.ws.length; let d = 0, ds = 0; for (let i = 0; i < n; i++) { d += best[1].ws[i] - x.ws[i]; ds += best[1].bits[i] - x.bits[i]; } return { w: d / n, s: 100 * ds / n }; };
      const g = gapOf(U.CAND); gaps.push({ id, ...g });
      console.log(`  ${id} W${w}: best ${best[0]}; ${Object.entries(U).map(([v, x]) => { const q = gapOf(x); return `${v} ${x.sim.toFixed(2)}% (gap ${q.w.toFixed(3)} score, ${q.s.toFixed(2)} survival)`; }).join(' | ')}`);
    }
    if (gaps.length < HOUSEHOLDS.length) { allOk = false; continue; }
    const mW = mean(gaps.map(x => x.w)), mS = mean(gaps.map(x => x.s)), ok = mW < MEAN_TOL && mS < MEAN_TOL && gaps.every(x => x.w < HH_TOL && x.s < HH_TOL);
    if (!ok) allOk = false;
    console.log(`V4 at W${w}: the candidate's gap to the best variant, panel mean ${mW.toFixed(3)} score and ${mS.toFixed(3)} survival points; largest ${Math.max(...gaps.map(x => x.w)).toFixed(3)} and ${Math.max(...gaps.map(x => x.s)).toFixed(3)}: ${ok ? 'within D4\'s targets' : 'BEYOND D4\'s targets'}`);
  }
  console.log(`V4 ensemble: ${allOk ? 'the candidate within the targets at both weights' : 'NOT within the targets'} (a lower bound: it can show the policy improvable, never that it is near the best)`);
  process.exit(allOk ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--units') { for (const id of HOUSEHOLDS) for (const v of Object.keys(VARIANTS)) for (const w of WEIGHTS) console.log(`${envOf(v)}${envOf(v) ? ' ' : ''}${id} ${v} ${w}`); }
  else if (process.argv[2] === '--read') read(process.argv[3] || OUT);
  else await unit(process.argv[2], process.argv[3], process.argv[4]);
}
