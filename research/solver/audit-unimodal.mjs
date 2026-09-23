/*
 * IS THE SCORE SINGLE-PEAKED IN SPENDING LEVEL?
 *
 *   node research/solver/audit-unimodal.mjs [bandIndex=32]
 *
 * The solver evaluates all five spending levels for every draw order, harvest setting and tier: 360
 * actions a cell, of which 120 distinct flows. If the score were SINGLE-PEAKED in level - rising to a
 * best then falling - a ternary search would find the best of five in about three evaluations instead
 * of five, cutting the dominant expectation-over-returns step by two fifths on that dimension.
 *
 * WHETHER IT IS SINGLE-PEAKED IS AN EMPIRICAL QUESTION, NOT AN ASSUMPTION. The trim penalty is convex
 * in level and the continuation value plausibly has diminishing returns, which argues for it. Against
 * it: the tax function has a kink at every band edge, and trimming to a particular level can drop the
 * gross withdrawal under one - so the score can rise again after falling. If that happens even
 * occasionally, a ternary search silently returns a WORSE action and nobody finds out.
 *
 * So this counts, over real cells: how often the five scores are single-peaked, and when they are not,
 * HOW MUCH a ternary search would have lost. The second number matters as much as the first - a
 * shortcut that is wrong 2% of the time by a millionth of a point is still safe.
 *
 * NOTE ON ORDERING, which would have been a silent bug: buildActions puts level 1 FIRST so that a tie
 * goes to the plan as written, so the menu order is [1, 1.2, 1.1, 0.9, 0.8]. The levels must be sorted
 * by VALUE before any single-peakedness test, or the test is meaningless.
 */
import * as E from '/home/user/vitejs-vite-kdvuf9qw/research/engine.mjs';
import * as M from '/home/user/vitejs-vite-kdvuf9qw/src/solver/model.js';
import { solve, scoreMoves, buildActions } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/solve.js';
import { tiersFor } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/fast.js';
import { vecOf, toVec } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/grid.js';
import { buildScenarios } from '/home/user/vitejs-vite-kdvuf9qw/research/policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';

const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync('/home/user/vitejs-vite-kdvuf9qw/research/solver/results/band-70-98-7001.json', 'utf8'));
const sc = singles[band[Number(process.argv[2] || 32)].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const LEVELS = [1.2, 1.1, 1, 0.9, 0.8];
/* the household's OWN flex-tiers configuration: its landed lambda, raises on (without a raise weight the
 * solver drops the levels above 1, which silently left three levels and 216 actions on the first run),
 * joint tiers, 30 points. Single table, not the three-world mixture: these probes read r.pol directly. */
const FT = (() => { try { return JSON.parse(readFileSync('/home/user/vitejs-vite-kdvuf9qw/research/solver/results/flex-tiers/' + sc.id + '.json', 'utf8')); } catch { return null; } })();
const LAMBDA = FT ? FT.solver.lambda : 0.5;
const r = solve(E, M, plan, { points: 30, lambda: LAMBDA, raiseWeight: 0.003, spendLevels: LEVELS, tiers: true, lump: m.ctx.fullLumpSum });
if (r.actions.length !== 360) { console.log(`REFUSED: ${r.actions.length} actions, expected 360 (5 levels x 24 cores x 3 tiers) - the probe would not measure the real menu`); process.exit(2); }
const acts = r.actions, T = r.m.ctx.totalYears;
const nA = acts.length;
const SC = new Float64Array(nA), TX = new Float64Array(nA), BQ = new Float64Array(nA);

/* group the action indices by everything EXCEPT the spending level, then sort each group by level */
const groups = new Map();
acts.forEach((a, i) => {
  const key = `${a.label.replace(/, spend \d+%/, '')}`;   // same order, harvest and tier, any level
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ i, level: a.spendLevel });
});
for (const g of groups.values()) g.sort((x, y) => x.level - y.level);
const full = [...groups.values()].filter(g => g.length === LEVELS.length);
console.log(`${sc.id}: ${nA} actions, ${groups.size} groups, ${full.length} with all five levels\n`);

/* walk a real path so the states are ones the household actually reaches */
const zs = E.pathsForSeed(7001, 1, m.ctx.totalYears)[0];
const st = M.initialState(m);
let tested = 0, unimodal = 0, worstLoss = 0, lossCount = 0, worstAt = '';
/* GRID=1: every grid cell at every fourth year, not ten positions on one path. The first full-menu run
 * tested 720 combinations from ten states; with zero exceptions that bounds the exception rate only
 * below ~0.4% (three over n), and ten states cannot find a tax band edge they never visit. */
const GRID = process.env.GRID === '1';
const states = [];
if (GRID) {
  const g = r.g; const buf = new Float64Array(7);
  for (let t = 0; t < T; t += 4) for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++)
    for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) states.push([t, Float64Array.from(toVec(g, ip, ii, it, ig, ic, buf))]);
} else {
  for (let t = 0; t < T; t++) { M.step(m, st, M.actionFromContext(m.ctx), t, null); if (t % 4 === 0) states.push([t, vecOf(m, st)]); }
}
for (const [t, v] of states) {
  scoreMoves(r, v, t, SC, TX, BQ, null);
  for (const g of full) {
    const ys = g.map(x => SC[x.i]);
    if (ys.some(y => !Number.isFinite(y))) continue;
    tested++;
    const best = ys.indexOf(Math.max(...ys));
    // single-peaked: non-decreasing up to the peak, non-increasing after it
    let ok = true;
    for (let k = 1; k <= best; k++) if (ys[k] < ys[k - 1] - 1e-12) ok = false;
    for (let k = best + 1; k < ys.length; k++) if (ys[k] > ys[k - 1] + 1e-12) ok = false;
    if (ok) { unimodal++; continue; }
    /* what would a ternary search have returned, and what did that cost? */
    let lo = 0, hi = ys.length - 1;
    while (hi - lo > 2) { const m1 = lo + Math.floor((hi - lo) / 3), m2 = hi - Math.floor((hi - lo) / 3); if (ys[m1] < ys[m2]) lo = m1 + 1; else hi = m2 - 1; }
    let pick = lo; for (let k = lo; k <= hi; k++) if (ys[k] > ys[pick]) pick = k;
    const loss = ys[best] - ys[pick];
    if (loss > 1e-12) { lossCount++; if (loss > worstLoss) { worstLoss = loss; worstAt = `y${t} ${g[0] ? acts[g[0].i].label.slice(0, 44) : ''}`; } }
  }
}
if (tested === 0) { console.log("VACUOUS: zero combinations tested - no verdict. A probe that tests nothing must not print safe."); process.exit(3); }
const pc = (x) => (100 * x / Math.max(1, tested)).toFixed(2);
console.log(`tested            ${tested.toLocaleString()} (cell-year, action-group) combinations`);
console.log(`single-peaked     ${unimodal.toLocaleString()}  (${pc(unimodal)}%)`);
console.log(`NOT single-peaked ${(tested - unimodal).toLocaleString()}  (${pc(tested - unimodal)}%)`);
console.log(`of those, a ternary search would have picked a WORSE action ${lossCount.toLocaleString()} times (${pc(lossCount)}% of all)`);
console.log(`worst loss        ${worstLoss.toExponential(3)} of score   ${worstLoss > 0 ? '(' + worstAt + ')' : ''}`);
console.log(`\n  one survival point is 0.01 of score, so the worst loss is ${(worstLoss / 0.01).toExponential(2)} survival points`);
console.log(worstLoss < 1e-6
  ? '  VERDICT: safe. A ternary search on the spending level costs nothing measurable.'
  : worstLoss < 1e-4
    ? '  VERDICT: probably safe, but it is a real loss and wants a paired field check before it ships.'
    : '  VERDICT: NOT safe. The tax kinks break single-peakedness by enough to matter; keep the exhaustive scan.');
