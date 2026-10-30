/*
 * EZ'S DIAGNOSTIC ON S090 (EXPLORATORY): the stored value along the wealth axis at a few years (the plan's own tiers, the
 * middle world, middle shares, no gain, no lump sum taken), and every move's mixture continuation and value at the opening.
 * Run from the root of the patched code: node ez-diag.mjs [points=4]. Its output at 4 points, on the first build (the value
 * stored powered, V^(1 - gamma), and read linearly), is results-ez-diag-4pts.txt; on the build that stores V and powers each
 * read (g.ezPow), the same lines are printed from V.
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs'), S = await imp('src/solver/solve.js'), G = await imp('src/solver/grid.js');
const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA } = await imp('research/solver/audit-phase4.mjs');
const h = readPanel().find(x => x.id === 'S090');
const pk = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy;
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: pk }));
const light = { lambda: LAMBDA, points: Number(process.argv[2] || 4), bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true }, e3pcls: false };
const r = C.solveCandidate(E, M, structuredClone(plan), { ...light, tsOnce: false, ez: { gamma: 4, rho: 2 } });
const g = r.g, T = r.m.ctx.totalYears, z = r.ez, LW = r.tablesW.layW, J0 = r.worlds[0].tsLayers.findIndex(L => L.lsurv === r.worlds[0].lsurv);
console.log('grid', g.mode, 'np', g.np, 'ni', g.ni, 'nt', g.nt, 'gain', g.gain.length, 'pcls', g.pcls.length, 'W pts', Array.from(g.axes.W.pts).map(x => Math.round(x)).join(' '), 'hi', Math.round(g.axes.W.hi));
const s0 = G.vecOf(r.m, M.initialState(r.m));
console.log('opening wealth', Math.round(s0[0] + s0[1] + s0[2]), 'pen', Math.round(s0[0]), 'isa', Math.round(s0[1]), 'tax', Math.round(s0[2]), 'spend0', Math.round(r.c.yr.spend[0]));
const ic0 = 0, mid = Math.floor(g.ni / 2), midt = Math.floor(g.nt / 2);
for (const t of [1, 5, 15, 25, T - 1, T]) {
  const row = []; for (let ip = 0; ip < g.np; ip++) { const idx = g.index(ip, mid, midt, 0, ic0); const st = LW[1][J0].resil[t][idx], V = r.g.ezPow ? st : Math.pow(st, 1 / z.e2); row.push(`${Math.round(g.axes.W.pts[ip] / 1000)}k: U ${Math.pow(V, z.e2).toExponential(3)} V ${V.toFixed(4)} surv ${LW[1][J0].surv[t][idx].toFixed(3)} lv ${r.levelOf[LW[1][J0].pol[t][idx]]}`); }
  console.log(`t ${t}: ` + row.join(' | '));
}
// the opening decision
const n = r.actions.length, K = r.worlds.length, JW = r.mix.weights;
const fresh = { _post: null, _grown: null, _rd: null, _sx: null, _sxR: null, _fx: null, _fxR: null, _sc: null, _tx: null, _bq: null };
const SC = r.worlds.map(() => new Float64Array(n)), TX = new Float64Array(n), BQ = new Float64Array(n);
r.worlds.forEach((w, k) => S.scoreMoves({ ...w, ...fresh }, Float64Array.from(s0), 0, SC[k], TX, BQ, null));
const rows = [];
for (let ai = 0; ai < n; ai++) { if (SC[0][ai] === -Infinity) continue; let q = 0; for (let k = 0; k < K; k++) q += JW[k] * SC[k][ai]; rows.push({ ai, lv: r.levelOf[ai], lab: r.actions[ai].label || '', tier: `${r.actions[ai].tierPen || 0}/${r.actions[ai].tierIsa || 0}`, q, V: z.valueOf(0, r.levelOf[ai], q) }); }
rows.sort((a, b) => b.V - a.V);
console.log('opening, the best 8 moves by V:'); for (const x of rows.slice(0, 8)) console.log(`  ${x.lab.padEnd(30)} level ${x.lv} tier ${x.tier} q ${x.q.toExponential(4)} V ${x.V.toFixed(6)}`);
const byLevel = {}; for (const x of rows) if (!byLevel[x.lv] || x.V > byLevel[x.lv].V) byLevel[x.lv] = x;
console.log('best by level:', Object.values(byLevel).sort((a, b) => a.lv - b.lv).map(x => `${x.lv}: q ${x.q.toExponential(4)} V ${x.V.toFixed(6)}`).join(' | '));
console.log('chooser picks', r.actions[S.chooseAction(r, Float64Array.from(s0), 0, { pen: 0, isa: 0, gia: 0 })].label, 'stored', r.actions[r.pol[0][G.nearestIndex ? 0 : 0]] ? '' : '');
