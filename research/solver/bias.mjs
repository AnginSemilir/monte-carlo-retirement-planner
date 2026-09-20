/*
 * TABLE BIAS AND RESOLUTION on one household (plan Phase 2c.4).
 *   node research/solver/bias.mjs <bandIndex> <points> [held]
 * Prints: the table's survival at the opening position, the simulated survival of the solver's own
 * policy on held-out paths (the gap is the table's bias), the best move at the opening position and
 * the score of the fixed-arm move, and the same-menu fixed winner's simulated survival.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, chooseAction, buildActions } from '../../src/solver/solve.js';
import { vecOf, readValues } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const k = Number(process.argv[2]), HELD = Number(process.argv[4] || 1500);
const PARG = process.argv[3] || '20';
const POINTS = PARG.includes('/') ? (([a, b, c]) => ({ pen: +a, isa: +b, tax: +c }))(PARG.split('/')) : Number(PARG);
const HEADROOM = process.env.HEADROOM ? Number(process.env.HEADROOM) : undefined;
const WEIGHTS = [0.011257, 0.222076, 0.533333, 0.222076, 0.011257];
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync(join(HERE, 'results', 'band-70-98-7001.json'), 'utf8'));
const sc = singles[band[k].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(sc.plan)), config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan); const T = m.ctx.totalYears;
const menu = buildActions(); const c = F.compile(m, menu);
const res = JSON.parse(readFileSync(join(HERE, 'results', 'p2-7001', `${sc.id}.json`), 'utf8'));
const fixedAi = menu.findIndex(a => a.label === res.same.label);
const held = E.pathsForSeed(7002, HELD, T);
function run(zs, pick) {
  const s = vecOf(m, M.initialState(m)); const real = new Float64Array(4);
  for (let t = 0; t <= T; t++) {
    const ai = pick(s, t); const unmet = F.flow(c, t, ai, s);
    if (unmet > 1 || c.last.preNmpaInsolvent) return false;
    for (let i = 0; i < 4; i++) real[i] = Math.exp(Math.log(1 + c.real[i]) + c.volEff[i] * zs[t]) - 1;
    F.grow(c, t, s, real);
  }
  return !(m.ctx.solvencyFloor > 0 && s[0] + s[1] + s[2] < m.ctx.solvencyFloor);
}
const t0 = Date.now();
const r = solve(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum, headroom: HEADROOM });
const s0 = vecOf(m, M.initialState(m));
const v0 = r.value(M.initialState(m), 0);
const post = new Float64Array(6), grown = new Float64Array(6), rd = new Float64Array(3);
const score = (ai) => { post.set(s0); const unmet = F.flow(c, 0, ai, post); let sv = 0, bq = 0, rs = 0; if (!(unmet > 1 || c.last.preNmpaInsolvent)) for (let zi = 0; zi < 5; zi++) { grown.set(post); F.grow(c, 0, grown, r.nodeReal[zi]); readValues(r.g, r.lsurv[1], r.beq[1], grown, rd, r.lresil[1]); sv += WEIGHTS[zi] * rd[0]; bq += WEIGHTS[zi] * rd[1]; rs += WEIGHTS[zi] * rd[2]; } return { sv, rs, bq, score: sv + r.wR * rs + r.wB * bq }; };
const best = chooseAction(r, s0, 0);
const sB = score(best), sF = score(fixedAi);
const simS = 100 * held.filter(zs => run(zs, (s, t) => chooseAction(r, s, t))).length / HELD;
const simF = 100 * held.filter(zs => run(zs, () => fixedAi)).length / HELD;
console.log(`${sc.id} ${sc.name.slice(0, 36).padEnd(37)} pts ${PARG.padStart(8)}${HEADROOM ? ' hr ' + HEADROOM : ''}  table@0 ${(100 * v0.survival).toFixed(1)}  sim solver ${simS.toFixed(1)}  bias ${(100 * v0.survival - simS >= 0 ? '+' : '')}${(100 * v0.survival - simS).toFixed(1)}  | best [${best}] sv ${(100 * sB.sv).toFixed(2)} score ${sB.score.toFixed(4)} | fixed [${fixedAi}] sv ${(100 * sF.sv).toFixed(2)} score ${sF.score.toFixed(4)} sim ${simF.toFixed(1)}  | ${((Date.now() - t0) / 1000).toFixed(0)}s`);
