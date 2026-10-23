// SPEED REVIEW (exploratory): how often do different moves leave a cell in exactly the same post-decision state?
// Solves SHIP's settings at a small resolution to get the moves, the compiled context and the grid, then for every cell of
// every year runs each base move's flow (as the backward pass's first pass does) and counts the distinct post states among
// the moves that do not fail. The share of duplicates is the share of the expectation work an exact memo would save.
// usage (from the repository root): node dupes.mjs <household> [points]
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd(), imp = p => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs');
const M = await imp('src/solver/model.js');
const S = await imp('src/solver/solve.js');
const F = await imp('src/solver/fast.js');
const G = await imp('src/solver/grid.js');
const C = await imp('research/solver/candidate.mjs');
const P = await imp('research/solver/panel-7uf.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, ptsArg = '10'] = process.argv.slice(2);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const r = S.solvePlan(E, M, C.candidatePlan(E, plan), { lambda: P.LAMBDA, points: Number(ptsArg), bequestWeight: 0.02 });
const { g, c, actions } = r, T = r.m.ctx.totalYears, A = actions.length;
const base = new Float64Array(7), post = new Float64Array(7);
const isBase = actions.map((a, ai) => (a.tierBase === undefined ? true : a.tierBase === ai));
const variants = new Map(); actions.forEach((a, ai) => { const b = a.tierBase === undefined ? ai : a.tierBase; variants.set(b, (variants.get(b) || 0) + 1); });
let cells = 0, nonFail = 0, distinct = 0;
for (let t = 0; t <= T; t++) {
  for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
    G.toVec(g, ip, ii, it, ig, ic, base, t);
    const seen = new Map(); cells++;
    for (let ai = 0; ai < A; ai++) {
      if (!isBase[ai]) continue;
      post.set(base);
      const unmet = F.flow(c, t, ai, post);
      if (unmet > 1 || c.last.preNmpaInsolvent) continue;
      const k = Buffer.from(post.buffer).toString('base64');
      const v = variants.get(ai) || 1;
      nonFail += v;
      if (!seen.has(k)) { seen.set(k, 1); distinct += v; }
    }
  }
}
console.log(JSON.stringify({ id, points: g.np, years: T + 1, moves: A, baseMoves: isBase.filter(Boolean).length, cells, expectationsNow: nonFail, expectationsDistinct: distinct, saved: +(1 - distinct / nonFail).toFixed(3) }));
