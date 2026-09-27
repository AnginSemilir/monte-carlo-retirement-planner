// KEPT (the plan-auditor's read-only check in its review of 7y's registration, 28 Sep; RULES.md section 2 item 2): run once by the reviewer, not re-run; its figures are cited in predictions/diag-7y.md and PLAN.md O41 at grade C.
import * as E from '/home/user/vitejs-vite-kdvuf9qw/research/engine.mjs';
import * as M from '/home/user/vitejs-vite-kdvuf9qw/src/solver/model.js';
import { solveMixture, chooseAction } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/solve.js';
import { toVec } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/grid.js';
import { buildScenarios } from '/home/user/vitejs-vite-kdvuf9qw/research/policy-study/scenarios.mjs';
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const id = process.argv[2] || 'S194', pts = Number(process.argv[3] || 8);
const plan = prep(singles.find(x => x.id === id).plan), m = M.prepare(E, plan);
const o = { points: pts, lump: m.ctx.fullLumpSum, tiers: true, spendLevels: [1, 1.1, 0.95, 0.9, 0.8], lambda: 0.0223606797749979, finalIntegral: true, finalExact: true, mix: 3, tierState: true };
const r = solveMixture(E, M, plan, o);
const T = m.ctx.totalYears, g = r.g, K = r.worlds.length, L = r.worlds[0].tsLayerOf;
const pairs = r.meta.tierState ? r.meta.tierState.split(',').map(x => x.split('/').map(Number)) : null;
console.log(id, pts, 'points; pairs', r.meta.tierState, 'weights', r.mix.weights.map(x => x.toFixed(3)).join(','));
const v = new Float64Array(7);
for (const t of [1, 3, 10]) {
  const cnt = { n: 0, mixSw: 0, w: Array.from({ length: K }, () => ({ sw: 0, swNotMix: 0, mixNotSw: 0 })) };
  for (let idx = 0; idx < g.size; idx += 3) {
    let ip, ii, it, ig, ic, found = false;
    for (ic = 0; ic < g.pcls.length && !found; ic++) for (ig = 0; ig < g.gain.length && !found; ig++) for (it = 0; it < g.nt && !found; it++) for (ii = 0; ii < g.ni && !found; ii++) for (ip = 0; ip < g.np && !found; ip++) if (g.index(ip, ii, it, ig, ic) === idx) { found = true; break; }
    if (!found) continue;
    ip = idx % g.np; // recompute via toVec from found loops is messy; use index search again
    let c = null;
    for (let a5 = 0; a5 < g.pcls.length && !c; a5++) for (let a4 = 0; a4 < g.gain.length && !c; a4++) for (let a3 = 0; a3 < g.nt && !c; a3++) for (let a2 = 0; a2 < g.ni && !c; a2++) for (let a1 = 0; a1 < g.np && !c; a1++) if (g.index(a1, a2, a3, a4, a5) === idx) c = [a1, a2, a3, a4, a5];
    toVec(g, ...c, v);
    const j = pairs.findIndex(([p, i]) => p === 0 && i === 0);
    const held = { pen: 0, isa: 0, gia: 0 };
    let a; try { a = chooseAction(r, Float64Array.from(v), t, held); } catch (e) { continue; }
    const mixSw = L[a] !== j;
    cnt.n++; if (mixSw) cnt.mixSw++;
    for (let k = 0; k < K; k++) { const sw = L[r.worlds[k].tsLayers[j].pol[t][idx]] !== j; const w = cnt.w[k]; if (sw) w.sw++; if (sw && !mixSw) w.swNotMix++; if (!sw && mixSw) w.mixNotSw++; }
  }
  console.log(`year ${t}, holding 0/0, ${cnt.n} nodes: the mixture chooser switches at ${cnt.mixSw}; ` + cnt.w.map((w, k) => `world ${k}'s table switches at ${w.sw} (${w.swNotMix} where the chooser stays, ${w.mixNotSw} where the chooser switches and it stays)`).join('; '));
}
