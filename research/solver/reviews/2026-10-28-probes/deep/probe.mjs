// Deep review of Phase 4: a probe (EXPLORATORY, tuning seed 7002 and 99002; nothing written to results/). One panel household,
// the candidate solved as audit-phase4.mjs solves it; (1) the year-0 moves as the chooser scores them; (2) at the 110% year
// before a failure, the chooser's expected survival for its pick and for its best floor move; (3) a small paired check of the
// floor against the pick there, and of 100% against the pick at year 0, each then following the candidate.
import * as E from '../../../../../research/engine.mjs';
import * as M from '../../../../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves } from '../../../../../src/solver/solve.js';
import { vecOf } from '../../../../../src/solver/grid.js';
import { solveCandidate } from '../../../../../research/solver/candidate.mjs';
import { readPanel, appPlan } from '../../../../../research/solver/phase4-panel.mjs';
import { armA } from '../../../../../research/solver/select-phase4.mjs';
import { solverPlanOf, LAMBDA } from '../../../../../research/solver/audit-phase4.mjs';
const ID = process.argv[2] || 'S090', W = Number(process.argv[3] || 0.02), NP = Number(process.argv[4] || 2000), PTS = Number(process.argv[5] || 45);
const h = readPanel().find(x => x.id === ID);
const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const t0 = Date.now();
const r = solveCandidate(E, M, prep(solverPlanOf(h.plan, aPol)), { lambda: LAMBDA, points: PTS, bequestWeight: W });
const T = r.m.ctx.totalYears, n = r.actions.length, lv = r.levelOf;
console.log(`${ID} W${W} ${PTS} points: solved in ${Math.round((Date.now() - t0) / 1000)} s; T ${T}; ${n} moves; levels ${[...new Set(lv)].join(',')}; target ${r.m.ctx.targetSpend}; lambda ${LAMBDA}`);
const SC1 = new Float64Array(n), TX1 = new Float64Array(n), BQ1 = new Float64Array(n), SV1 = new Float64Array(n);
const survOf = (s, t, held, ai) => r.mix.tables.reduce((acc, tab, k) => { scoreMoves(tab, s, t, SC1, TX1, BQ1, held, { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[Math.min(t, tab.nodeRealOfAt.length - 1)][ai] }, SV1); return acc + r.mix.weights[k] * SV1[ai]; }, 0);
const bestAt = (level) => { let b = -1; for (let ai = 0; ai < n; ai++) if (Math.abs(lv[ai] - level) < 1e-9 && r._sc[ai] > -Infinity && (b < 0 || r._sc[ai] > r._sc[b])) b = ai; return b; };
// (1) year 0
const s0 = vecOf(r.m, r.M.initialState(r.m)), held0 = { pen: 0, isa: 0, gia: 0 };
const pick0 = chooseAction(r, s0, 0, held0), sc0 = Float64Array.from(r._sc);
console.log(`year 0: the pick ${pick0} at ${lv[pick0]} (${r.actions[pick0].label}); score ${sc0[pick0].toFixed(6)}`);
const best0 = {};
for (const L of [...new Set(lv)].sort((x, y) => y - x)) { r._sc.set(sc0); const b = bestAt(L); best0[L] = b; if (b >= 0) console.log(`  best at ${L}: move ${b}, score ${sc0[b].toFixed(6)} (pick - it ${(sc0[pick0] - sc0[b]).toFixed(6)}), the chooser's expected survival ${(100 * survOf(s0, 0, held0, b)).toFixed(3)}%`); }
console.log(`  the cut's charge a year at the floor: lambda x 0.2^2 = ${(LAMBDA * 0.04).toFixed(6)} score units`);
// (2) paths of 7002 with every decision kept
const paths = E.pathsForSeed(7002, NP, T);
const own = [], visitsOf = [];
for (const zs of paths) { const v = []; const o = runPolicy(r, Float64Array.from(zs), { visit: (t, s, held, ai) => v.push({ t, s: Float64Array.from(s), held: { ...held }, ai }) }); own.push(o); visitsOf.push(v); }
const surv = own.filter(o => o.survived).length;
console.log(`runPolicy on ${NP} paths of 7002: survival ${(100 * surv / NP).toFixed(2)}%`);
const pre = [];
own.forEach((o, i) => { if (o.survived || o.failYear == null) return; const tf = o.failYear - r.m.ctx.baseYear; if (tf >= T || tf < 1) return; const v = visitsOf[i].find(x => x.t === tf - 1); if (v && lv[v.ai] > 1.05) pre.push({ i, ...v, tf }); });
const fails = own.filter(o => !o.survived && o.failYear != null && o.failYear - r.m.ctx.baseYear < T).length;
console.log(`failures before the last year ${fails}; with 110% the year before ${pre.length}`);
const rows = [];
for (const p of pre) { chooseAction(r, p.s, p.t, p.held); const f = bestAt(Math.min(...lv)), c = bestAt(1); rows.push({ p, f, c, sPick: survOf(p.s, p.t, p.held, p.ai), sFloor: f >= 0 ? survOf(p.s, p.t, p.held, f) : NaN, sTarget: c >= 0 ? survOf(p.s, p.t, p.held, c) : NaN, d: r._sc[p.ai] - (f >= 0 ? r._sc[f] : NaN), W: p.s[0] + p.s[1] + p.s[2] }); }
const q = (arr, x) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(x * s.length))]; };
if (rows.length) {
  const sp = rows.map(x => 100 * x.sPick), sf = rows.map(x => 100 * x.sFloor), dd = rows.map(x => x.d), ww = rows.map(x => x.W / r.m.ctx.targetSpend);
  console.log(`at those 110% years: the chooser's expected survival for its pick median ${q(sp, 0.5).toFixed(4)}% (90th ${q(sp, 0.9).toFixed(4)}%), for its best floor move median ${q(sf, 0.5).toFixed(4)}% (90th ${q(sf, 0.9).toFixed(4)}%, max ${Math.max(...sf).toFixed(4)}%); the pick's score above the floor move's median ${q(dd, 0.5).toExponential(3)}; wealth in years of target median ${q(ww, 0.5).toFixed(2)} (10th ${q(ww, 0.1).toFixed(2)}, 90th ${q(ww, 0.9).toFixed(2)}); ages ${q(rows.map(x => r.m.ctx.ageSelf0 + x.p.t), 0.1)} to ${q(rows.map(x => r.m.ctx.ageSelf0 + x.p.t), 0.9)}`);
}
// (3a) at up to 40 of those positions: the floor move against the pick, 200 paths of 99002 each from the position, the candidate after
const NS = 200, K = Math.min(40, rows.length), fp = E.pathsForSeed(99002, NS, T);
let saved = 0, lost = 0, yrsPick = 0, yrsFloor = 0, delPick = 0, delFloor = 0;
const runFrom = (p, ai, zs) => runPolicy(r, Float64Array.from(zs), { start: { s: p.s, t: p.t, held: p.held, firstAi: ai } });
for (let k = 0; k < K; k++) {
  const { p, f } = rows[Math.floor(k * rows.length / K)];
  for (const zs of fp) {
    const A = runFrom(p, p.ai, zs), B = runFrom(p, f, zs);
    if (B.survived && !A.survived) saved++; if (A.survived && !B.survived) lost++;
    const yr = o => (o.survived ? T + 1 : o.failYear - r.m.ctx.baseYear) - p.t; yrsPick += yr(A); yrsFloor += yr(B);
    delPick += A.levelSum; delFloor += B.levelSum;
  }
}
if (K) console.log(`floor in place of the pick at ${K} such positions, ${NS} paths of 99002 each (${K * NS} pairs): saved ${saved}, lost ${lost}; years from the position to the failure (or the end) ${(yrsPick / K / NS).toFixed(2)} under the pick, ${(yrsFloor / K / NS).toFixed(2)} under the floor; the levels summed over the years with money ${(delPick / K / NS).toFixed(3)} against ${(delFloor / K / NS).toFixed(3)} years of target`);
// (3b) year 0: 100% (the best move at the target) in place of the pick, then the candidate, on the same NP paths of 7002
if (lv[pick0] < 1 && best0[1] >= 0) {
  let sv = 0, lo = 0, ls0 = 0, ls1 = 0, sh0 = 0, sh1 = 0;
  paths.forEach((zs, i) => { const B = runPolicy(r, Float64Array.from(zs), { start: { s: s0, t: 0, held: held0, firstAi: best0[1] } }), A = own[i]; if (B.survived && !A.survived) sv++; if (A.survived && !B.survived) lo++; ls0 += A.levelSum; ls1 += B.levelSum; sh0 += A.shortfall; sh1 += B.shortfall; });
  console.log(`year 0 at 100% in place of the pick (${lv[pick0]}), the candidate after, ${NP} paths of 7002: saved ${sv}, lost ${lo} (survival change ${(100 * (sv - lo) / NP).toFixed(3)} points); levels summed over the years with money ${(ls0 / NP).toFixed(3)} under the pick, ${(ls1 / NP).toFixed(3)} at 100%; the cut charge's sum of (1-level)^2 ${(sh0 / NP).toFixed(4)} against ${(sh1 / NP).toFixed(4)}`);
}
