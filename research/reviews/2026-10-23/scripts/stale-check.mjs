// SPEED REVIEW (EXPLORATORY), finding 1: does a table's chooser give the same scores to the same seven-slot position before
// and after the table has run forward paths? scoreMoves keeps its scratch `post` and `grown` at the length of the first
// state it scores; once forward paths have run (14 slots from 63fde6e, 13 before), a seven-slot position is run as a
// forward state: the flow reads the last flow's slots 11 to 13, skips a grid cell's late-gain charge and its zero clamp
// on the gain share, and growth takes its cash from slot 12. Scores one table (the centre world) of the solve, fresh and
// used; FAILS (a positive count) until scoreMoves sizes its scratch to the state it is given.
// usage (from the repository root): node stale-check.mjs <household> [points]
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd(), imp = p => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs');
const M = await imp('src/solver/model.js');
const S = await imp('src/solver/solve.js');
const B = await imp('src/solver/bridge.js');
const G = await imp('src/solver/grid.js');
const C = await imp('research/solver/candidate.mjs');
const P = await imp('research/solver/panel-7uf.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, ptsArg = '6'] = process.argv.slice(2);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const r = S.solvePlan(E, M, C.candidatePlan(E, plan), { lambda: P.LAMBDA, points: Number(ptsArg), bequestWeight: 0.02 });
const g = r.g, T = r.m.ctx.totalYears, n = r.actions.length;
// positions: grid cells of year 1 with money in the taxable pot (where the cash split matters), as seven-slot vectors
const cells = [];
for (let ip = 2; ip < g.np; ip += 2) for (let ii = 0; ii < g.ni; ii += 3) for (let it = 0; it < g.nt; it += 3) { const v = new Float64Array(7); G.toVec(g, ip, ii, it, 0, 0, v, 1); if (v[2] > 0) cells.push(v); }
const scoreOn = tab => cells.map(v => { const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n); S.scoreMoves(tab, v, 1, SC, TX, BQ, null); return SC; });
// forward paths through the engine (on today's code they leave the centre table's scratch at the forward state's length),
// then the scratch primed directly too, with the first position given as a forward state (vecOf's own length and tail
// slots), so the check sees the bug whether or not the engine's chooser still goes through scoreMoves (S2 does not)
const ctx = E.buildContext(B.withTable(r.m.ctx.plan, r));
for (const zs of E.pathsForSeed(99001, 5, T)) E.runTrial(ctx, Float64Array.from(zs));
const tab = r.mix.tables[1];
const tail = G.vecOf(r.m, { pots: {}, basis: {}, cumPcls: {}, lumpTaken: {}, cashIsa: {}, cgtCarry: {}, guard: null }).slice(7);
{ const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n); S.scoreMoves(tab, Float64Array.from([...cells[0], ...tail]), 1, SC, TX, BQ, null); }
const after = scoreOn(tab);
// the same table with fresh scratch (a shallow copy without the cached buffers): what a first call would score
const fresh = Object.assign(Object.create(Object.getPrototypeOf(tab)), tab); for (const k of Object.keys(fresh)) if (k.startsWith('_')) delete fresh[k];
const before = scoreOn(fresh);
let diff = 0, worst = 0, cellsDiff = 0, argmaxDiff = 0;
before.forEach((b, i) => { let d = false; for (let ai = 0; ai < n; ai++) { const a = after[i][ai]; if (!Object.is(a, b[ai])) { diff++; d = true; if (Number.isFinite(a) && Number.isFinite(b[ai])) worst = Math.max(worst, Math.abs(a - b[ai])); } }
  if (d) cellsDiff++; const am = x => { let k = 0; for (let ai = 1; ai < n; ai++) if (x[ai] > x[k]) k = ai; return k; }; if (am(b) !== am(after[i])) argmaxDiff++; });
console.log(JSON.stringify({ id, points: g.np, forwardSlots: 7 + tail.length, positions: cells.length, moves: n, scoresDiffering: diff, positionsDiffering: cellsDiff, bestMoveDiffering: argmaxDiff, worstAbsDiff: worst }));
