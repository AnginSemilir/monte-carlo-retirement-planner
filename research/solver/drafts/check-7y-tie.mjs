// KEPT (the plan-auditor's read-only check in its review of 7y's registration, 28 Sep; RULES.md section 2 item 2): run once by the reviewer, not re-run; its figures are cited in predictions/diag-7y.md and PLAN.md O41 at grade C.
import * as E from '/home/user/vitejs-vite-kdvuf9qw/research/engine.mjs';
import * as M from '/home/user/vitejs-vite-kdvuf9qw/src/solver/model.js';
import { solve, scoreMoves } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/solve.js';
import { toVec } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/grid.js';
import { buildScenarios } from '/home/user/vitejs-vite-kdvuf9qw/research/policy-study/scenarios.mjs';
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const plan = prep(singles.find(x => x.id === 'S126').plan), m = M.prepare(E, plan);
const o = { points: 8, lump: m.ctx.fullLumpSum, tiers: true, spendLevels: [1, 0.9, 0.8], lambda: 0.05, finalIntegral: true, finalExact: true };
const T = m.ctx.totalYears;
const tsInf = solve(E, M, plan, { ...o, switchMargin: Infinity, tierState: true });
const pairs = tsInf.meta.tierState.split(',').map(x => x.split('/').map(Number));
const g = tsInf.g;
for (const [j, [pen, isa]] of pairs.entries()) {
  const held = solve(E, M, plan, { ...o, switchMargin: Infinity, holdTier: [pen, isa] });
  // latest year with any difference
  let tl = -1;
  for (let t = T; t >= 0 && tl < 0; t--) for (const kk of ['surv', 'beq', 'resil', 'short', 'pol']) { const a = tsInf.tsLayers[j][kk][t], b = held[kk][t]; if (kk === 'pol') { for (let i = 0; i < a.length; i++) if (tsInf.actions[a[i]].label !== held.actions[b[i]].label) { tl = t; break; } } else for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) { tl = t; break; } if (tl >= 0) break; }
  if (tl < 0) { console.log(`pair ${pen}/${isa}: identical`); continue; }
  // cells at tl where the stored move differs by label
  let nMove = 0, nVal = 0, shown = 0, maxScoreGap = 0;
  const a = tsInf.tsLayers[j].pol[tl], b = held.pol[tl];
  for (let idx = 0; idx < g.size; idx++) {
    const la = tsInf.actions[a[idx]].label, lb = held.actions[b[idx]].label;
    const vd = Math.abs(tsInf.tsLayers[j].surv[tl][idx] - held.surv[tl][idx]);
    if (vd > 0) nVal++;
    if (la === lb) continue;
    nMove++;
    // score both moves at this node with the tier-state result, holding pair j
    let ip, ii, it, ig, ic; // brute force find coords
    outer: for (ic = 0; ic < g.pcls.length; ic++) for (ig = 0; ig < g.gain.length; ig++) for (it = 0; it < g.nt; it++) for (ii = 0; ii < g.ni; ii++) for (ip = 0; ip < g.np; ip++) if (g.index(ip, ii, it, ig, ic) === idx) break outer;
    const v = new Float64Array(7); toVec(g, ip, ii, it, ig, ic, v);
    const n = tsInf.actions.length, SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n);
    scoreMoves(tsInf, Float64Array.from(v), tl, SC, TX, BQ, { pen, isa, gia: 0 });
    const ia = a[idx], ib = tsInf.actions.findIndex(x => x.label === lb);
    const gap = Math.abs(SC[ia] - SC[ib]); if (gap > maxScoreGap) maxScoreGap = gap;
    if (shown < 3) { shown++; console.log(`pair ${pen}/${isa} year ${tl} cell ${idx}: TS keeps "${la}" score ${SC[ia]} beq ${BQ[ia]}; holdTier keeps "${lb}" score ${SC[ib]} beq ${BQ[ib]}; |score gap| ${gap.toExponential(2)}; surv diff ${vd.toExponential(2)}`); }
  }
  console.log(`pair ${pen}/${isa}: latest differing year ${tl}; cells with a different move ${nMove}, with a different survival ${nVal}; largest score gap between the two kept moves (scoreMoves) ${maxScoreGap.toExponential(2)}`);
}
