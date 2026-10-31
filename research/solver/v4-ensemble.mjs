/*
 * V4, THE POLICY ENSEMBLE (the external review of 21 Oct, Part B Step 5, with the follow-up review's answer 8; STATE.md
 * D4: with the purpose test, the stopping rule for the grid and cliff work until a ceiling exists; D20, D23 and D24: run
 * once on the ported code; EXPLORATORY, the tuning seed). V3's seven households (v3-convergence.mjs), each solved several
 * ways, every policy simulated on the same 8,000 paths of seed 7002 (runPolicy and its trace: survival and the whole
 * score), at both estate weights 7u used. The variants still in contention (PROGRESS.md question 8, answer 8):
 *   CAND          the assembled candidate (log-odds interpolation, the solver's own); its paths are also checked against
 *                 V3's unit at the shipped settings, the same configuration, bit for bit
 *   CAND-lin      the same with survival interpolated in probability (SOLVER_INTERP=linear; a process of its own)
 *   DECOMP        the candidate on the plan reference (D5's decomposing arm; on S362 it carries O191 and O179)
 *   CAND-noRS     the candidate without the RS split (answer 7: it isolates the split)
 *   SHIP          the shipping default, and SHIP-lin in probability
 *   CAND-fine     V3's finest setting, the candidate at 90 wealth points (answer 8: counted as a variant; read from V3)
 * Probit is dropped (answer 8: it never moved a policy by more than 0.05 points). The best variant per household (by the
 * whole score, the solver's own objective; survival reported beside it) and each policy's gap to it, paired on the
 * paths: a lower bound on that policy's distance from the best. D4's measure for the candidate: its gap under 0.2 points
 * on the panel mean and 0.5 on every household, at both weights.
 *   node research/solver/v4-ensemble.mjs <household> <variant> <weight>   one unit, to results/v4 (V4_OUT)
 *   node research/solver/v4-ensemble.mjs --units                          the units, one a line (with the env each needs)
 *   node research/solver/v4-ensemble.mjs --read [dir] [v3 dir]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUSEHOLDS } from './v3-convergence.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// the variants this script solves; CAND-fine is V3's p90 unit, read beside them
export const VARIANTS = { CAND: { interp: 'logodds' }, 'CAND-lin': { interp: 'linear' }, DECOMP: { interp: 'logodds' }, 'CAND-noRS': { interp: 'logodds' }, SHIP: { interp: 'logodds' }, 'SHIP-lin': { interp: 'linear' } };
export const WEIGHTS = ['0.02', '0.01'], SEED = 7002, NPATHS = 8000, PTS = 30, LAMBDA = 0.0223606797749979, MEAN_TOL = 0.2, HH_TOL = 0.5;
const OUT = process.env.V4_OUT || join(HERE, 'results', 'v4'), V3_DIR = process.env.V3_OUT || join(HERE, 'results', 'v3');
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const envOf = v => (VARIANTS[v].interp === 'logodds' ? '' : `SOLVER_INTERP=${VARIANTS[v].interp}`);
export const UNITS = HOUSEHOLDS.flatMap(id => Object.keys(VARIANTS).flatMap(v => WEIGHTS.map(w => `${envOf(v)}${envOf(v) ? ' ' : ''}${id} ${v} ${w}`)));
export const unitFile = u => { const a = u.split(' ').filter(x => !x.includes('=')); return join(OUT, `${a[0]}-${a[1]}-w${a[2]}.json.gz`); };

async function unit(id, v, w) {
  const want = VARIANTS[v] && VARIANTS[v].interp, got = process.env.SOLVER_INTERP || 'logodds';
  if (!want || !WEIGHTS.includes(w)) { console.error(`v4: no variant ${v} or weight ${w}`); process.exit(2); }
  if (got !== want) { console.error(`v4: ${v} runs with SOLVER_INTERP=${want === 'logodds' ? '(unset)' : want}, this process has ${got}`); process.exit(2); }
  const E = await import('../engine.mjs'), M = await import('../../src/solver/model.js'), S = await import('../../src/solver/solve.js');
  const C = await import('./candidate.mjs'), { buildScenarios } = await import('../policy-study/scenarios.mjs'), { makeTrace } = await import('./record.mjs'), { wholeScore } = await import('./reduce-7uf.mjs');
  const h = buildScenarios().find(s => s.id === id), code = execFileSync(process.execPath, [join(HERE, 'code-id.mjs')], { encoding: 'utf8' }).trim();
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const base = { lambda: LAMBDA, points: PTS, bequestWeight: Number(w) };
  const t0 = Date.now();
  // e3pcls guard: SHIP's solve is solvePlan with the product's settings; every candidate variant goes through solveCandidate
  const r = v.startsWith('SHIP') ? S.solvePlan(E, M, C.candidatePlan(E, plan), base)
    : C.solveCandidate(E, M, plan, v === 'DECOMP' ? { ...base, readerRef: undefined, adaptiveLattice: undefined } : v === 'CAND-noRS' ? { ...base, readerSplit: undefined } : base);
  const secs = (Date.now() - t0) / 1000, T = r.m.ctx.totalYears;
  const paths = E.pathsForSeed(SEED, NPATHS, T), tr = makeTrace(NPATHS, T + 1), surv = new Uint8Array(NPATHS);
  paths.forEach((zs, k) => { tr.row = k; if (S.runPolicy(r, Float64Array.from(zs), { trace: tr }).survived) surv[k] = 1; });
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: tr.Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  const ws = Float32Array.from(wholeScore(bs, Number(w), tr.Y)), sim = 100 * surv.reduce((a, x) => a + x, 0) / NPATHS;
  console.log(`v4 ${id} ${v} W${w}: readerRef ${r.meta.readerRef} readerSplit ${r.meta.readerSplit} interp ${want}; code ${code}; survival ${sim.toFixed(4)}, whole score ${(ws.reduce((a, x) => a + x, 0) / NPATHS).toFixed(4)} on ${NPATHS} (seed ${SEED}); solve ${Math.round(secs)} s`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${id}-${v}-w${w}.json.gz`), gzipSync(JSON.stringify({ id, v, w, interp: want, candidate: C.CANDIDATE_HASH, code, seed: SEED, N: NPATHS, sim, secs, readerRef: r.meta.readerRef, readerSplit: r.meta.readerSplit, survived: b64(surv), whole: b64(ws) })));
}

function read(dir, v3dir) {
  const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), x = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)) }; };
  const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
  const sameBits = (a, b) => a.bits.length === b.bits.length && a.bits.every((x, i) => x === b.bits[i]) && a.ws.every((x, i) => Object.is(x, b.ws[i]));
  console.log(`V4 ENSEMBLE READ (EXPLORATORY, the tuning seed): ${dir}, V3's units from ${v3dir}`);
  const loaded = [];
  let allOk = true;
  for (const w of WEIGHTS) {
    const gaps = [];
    for (const id of HOUSEHOLDS) {
      const U = Object.fromEntries(Object.keys(VARIANTS).map(v => [v, join(dir, `${id}-${v}-w${w}.json.gz`)]).filter(([, f]) => existsSync(f)).map(([v, f]) => [v, load(f)]));
      const fine = join(v3dir, `${id}-p90-w${w}.json.gz`), shipV3 = join(v3dir, `${id}-ship-w${w}.json.gz`);
      if (existsSync(fine)) U['CAND-fine'] = load(fine);
      Object.values(U).forEach(x => loaded.push(x));
      if (!U.CAND) { console.log(`  ${id} W${w}: no CAND unit`); allOk = false; continue; }
      if (Object.keys(U).length < Object.keys(VARIANTS).length + 1) { console.log(`  ${id} W${w}: missing ${[...Object.keys(VARIANTS), 'CAND-fine'].filter(v => !U[v]).join(', ')}`); allOk = false; }
      // CAND and V3's shipped setting are one configuration: the same paths, bit for bit
      if (existsSync(shipV3)) { const s3 = load(shipV3); if (!sameBits(U.CAND, s3)) { console.log(`  ${id} W${w}: CAND and V3's shipped setting DIFFER`); allOk = false; } }
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
  const codes = new Set(loaded.map(x => x.code)), seeds = new Set(loaded.map(x => `${x.seed}/${x.N}`));
  if (codes.size !== 1 || seeds.size !== 1) { console.log(`NOT FAIR: the units differ in code (${[...codes].join(' ')}) or seed and paths (${[...seeds].join(' ')})`); allOk = false; }
  else console.log(`the gate: one code (${[...codes][0]}), seed and paths ${[...seeds][0]}, V3's units included`);
  console.log(`V4 ensemble: ${allOk ? 'the candidate within the targets at both weights' : 'NOT within the targets (or units missing)'} (a lower bound: it can show the policy improvable, never that it is near the best)`);
  process.exit(allOk ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--units') UNITS.forEach(u => console.log(u));
  else if (process.argv[2] === '--read') read(process.argv[3] || OUT, process.argv[4] || V3_DIR);
  else await unit(process.argv[2], process.argv[3], process.argv[4]);
}
