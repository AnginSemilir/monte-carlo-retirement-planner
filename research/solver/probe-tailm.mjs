/*
 * THE TIE MARGIN'S SIZE FOR TAIL (predictions/diag-tail.md, the derivation): ADOPT-PI's unit (no reader, the product's settings,
 * lambda held, the estate weight 0.02, 30 points) on share 0.90 and S130 under PCLSI, 500 paths at seed 7002 (tuning: the
 * margin is chosen here, so not on seed 7005, whose 6,000 paths TAIL reports from - the plan-auditor's BLOCKING 1 of 5 Oct), run forward with the tie margin at 0 and at 1e-10, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4 and 1e-3 set after the solve: per
 * margin the paths whose lifetime tax changes against margin 0, the paths lost and saved, and the mean tax and net change.
 * A plateau - the same paths changing over a range of margins - says the margin acts on the flat region (moves the table
 * cannot tell apart) and not on real trade-offs, inside it. Beside it the bound by algebra: a move within m of the best costs
 * at most m of the model's own score in its year, so a path of T decisions at most T m (survival in points: 100 T m).
 *   node research/solver/probe-tailm.mjs [points=30] [paths=500]
 */
// e3 off: TAIL's arms run with e3 off (ADOPT-PI's identity), and the margin is read on the same tables
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
console.log(`stamp: code ${cid ? cid.hash : 'unknown'} audit ${own} prediction ${process.env.PREDICTION_FILE || 'NOT-LAUNCHED'} sha ${process.env.PREDICTION_SHA || '-'}`);
const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 500), SEED = 7002, LAMBDA = 0.0223606797749979, W = 0.02;
const MARGINS = [1e-10, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3];
// audit-tail.mjs's variant() for share 0.90, copied (its module runs its jobs on import)
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126'), LIQ = /^S&S ISA|^Other Investments|^Cash/;
function share(a0) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) }; return a; });
  const nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - 2;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return p;
}
const CASES = [['share 0.90', share(0.9)], ['S130', all.find(s => s.id === 'S130').plan]];
const f2 = x => x.toFixed(2);
for (const [id, p0] of CASES) {
  const plan = E.resolveMpaa(E.normalizePlan({ ...p0, config: { ...p0.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p0.spending, floorSpend: Math.round(0.8 * E.num(p0.spending.targetSpend, 0)) } }));
  const t0 = Date.now(), r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, bridgeRead: false, bequestWeight: W, pclsInterp: true });
  const T = r.m.ctx.totalYears, paths = E.pathsForSeed(SEED, NP, T);
  const run = () => paths.map(zs => { const o = runPolicy(r, zs, {}); return [o.survived ? 1 : 0, o.lifetimeTax, o.terminalNet]; });
  r.tieMargin = 0; const base = run();
  console.log(`${id}: PCLSI, ${POINTS} points, ${NP} paths (seed ${SEED}), solve ${Math.round((Date.now() - t0) / 1000)} s; years ${T}; margin 0: survived ${base.reduce((t, x) => t + x[0], 0)}, mean tax ${f2(base.reduce((t, x) => t + x[1], 0) / NP)}, mean net ${f2(base.reduce((t, x) => t + x[2], 0) / NP)}`);
  for (const m of MARGINS) {
    r.tieMargin = m; const o = run(); r.tieMargin = 0;
    let ch = 0, lost = 0, saved = 0, dt = 0, dn = 0;
    for (let j = 0; j < NP; j++) { if (o[j][1] !== base[j][1]) ch++; if (base[j][0] && !o[j][0]) lost++; if (!base[j][0] && o[j][0]) saved++; dt += o[j][1] - base[j][1]; dn += o[j][2] - base[j][2]; }
    console.log(`  margin ${m.toExponential(0).padEnd(6)} tax changed on ${String(ch).padStart(4)} of ${NP} | lost ${lost} saved ${saved} | mean tax ${f2(dt / NP).padStart(10)} net ${f2(dn / NP).padStart(11)} | the bound by algebra: ${f2(100 * T * m)} points of survival a path at most (${T} decisions x ${m})`);
  }
}
