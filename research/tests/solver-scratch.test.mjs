/*
 * THE CHOOSER'S SCRATCH IS SIZED TO THE STATE IT SCORES (the speed review of 23 Oct, finding 1; STATE.md D24, the review's
 * instruction 1). scoreMoves kept its scratch (post, grown) at the length of the first state it scored. Once a table had
 * run forward paths (14 slots since 63fde6e), a seven-slot grid position was run as a forward state: its flow read the
 * last flow's slots 11 to 13, skipped a grid cell's late-gain charge and its zero clamp on the gain share, and its growth
 * took its cash from slot 12. The same seven-slot positions (every grid cell of year 1 with money in the taxable pot) scored on
 * a solve that has run forward paths through the engine and then had its scratch primed with a forward-length state (as
 * the review's stale-check.mjs does, so the test sees the fault whichever path the engine's chooser takes), and on a
 * fresh copy of it, must agree bit for bit:
 *   1. scoreMoves on each world's table: every move's score, tax and estate;
 *   2. chooseAction on the solve: the move chosen and every move's mixture score;
 *   3. rankActions: the ranking;
 * on S224 under SHIP (6 points) and under the light candidate (4 points, a small lattice: its tiers and switch charge).
 * With the old sizing put back (Math.max(7, s.length), kept at the first call's length) these fail (results-solver-scratch.txt).
 *   node research/tests/solver-scratch.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as G from '../../src/solver/grid.js';
import { solvePlan, scoreMoves, chooseAction, rankActions } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, candidatePlan } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const LAMBDA = 0.0223606797749979;
const h = buildScenarios().find(s => s.id === 'S224');
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const ARMS = [
  ['SHIP', () => solvePlan(E, M, candidatePlan(E, plan), { lambda: LAMBDA, points: 6, bequestWeight: 0.02 })],
  ['CAND', () => solveCandidate(E, M, plan, { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } })]
];
// a copy of a table or solve with none of its cached scratch (the keys starting '_'): what a first call would see
const freshOf = x => { const f = Object.assign(Object.create(Object.getPrototypeOf(x)), x); for (const k of Object.keys(f)) if (k.startsWith('_')) delete f[k]; return f; };
const freshSolve = r => { const f = freshOf(r); if (r.mix) f.mix = { ...r.mix, tables: r.mix.tables.map(freshOf) }; if (r.rich) f.rich = freshOf(r.rich); return f; };
const same = (a, b) => a.length === b.length && a.every((x, i) => Object.is(x, b[i]));

for (const [arm, solve] of ARMS) {
  const r = solve(), g = r.g, T = r.m.ctx.totalYears, nA = r.actions.length, tables = r.mix ? r.mix.tables : [r];
  const fresh = freshSolve(r);
  // the positions: every grid cell of year 1 with money in the taxable pot, as seven-slot vectors
  const cells = [];
  for (let ip = 0; ip < g.np; ip++) for (let ii = 0; ii < g.ni; ii++) for (let it = 0; it < g.nt; it++) { const v = new Float64Array(7); G.toVec(g, ip, ii, it, 0, 0, v, 1); if (v[2] > 0) cells.push(v); }
  // forward paths through the engine, then the scratch of every table primed with a forward-length state
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r));
  for (const zs of E.pathsForSeed(99001, 5, T)) E.runTrial(ctx, Float64Array.from(zs));
  const tail = G.vecOf(r.m, { pots: {}, basis: {}, cumPcls: {}, lumpTaken: {}, cashIsa: {}, cgtCarry: {}, guard: null }).slice(7);
  const long = Float64Array.from([...cells[0], ...tail]);
  const buf = () => [new Float64Array(nA), new Float64Array(nA), new Float64Array(nA)];
  for (const tab of tables) { const [a, b, c] = buf(); scoreMoves(tab, long, 1, a, b, c, null); }
  const held = r.tsLayers || (r.mix && r.mix.tables[0].tsLayers) ? { pen: 0, isa: 0 } : null;

  // 1. scoreMoves on each world's table
  let diff1 = 0, of1 = 0, worst = 0;
  tables.forEach((tab, k) => {
    const ft = fresh.mix ? fresh.mix.tables[k] : fresh;
    for (const v of cells) {
      const [s1, t1, b1] = buf(), [s2, t2, b2] = buf();
      scoreMoves(tab, v, 1, s1, t1, b1, held); scoreMoves(ft, v, 1, s2, t2, b2, held);
      of1++;
      if (!(same(s1, s2) && same(t1, t2) && same(b1, b2))) { diff1++; for (let ai = 0; ai < nA; ai++) if (Number.isFinite(s1[ai]) && Number.isFinite(s2[ai])) worst = Math.max(worst, Math.abs(s1[ai] - s2[ai])); }
    }
  });
  ok(diff1 === 0, `${arm} (S224, ${g.np} points, ${tables.length} worlds, ${nA} moves): scoreMoves on a table that ran forward paths and on a fresh one, ${of1} position-tables, ${cells.length} positions: the same bit for bit in all but ${diff1} (the largest score gap ${worst.toExponential(1)})`);

  // 2. chooseAction on the solve, and 3. rankActions
  let diff2 = 0, diff3 = 0;
  for (const v of cells) {
    const a1 = chooseAction(r, v, 1, held), sc1 = Float64Array.from(r._sc), a2 = chooseAction(fresh, v, 1, held), sc2 = Float64Array.from(fresh._sc);
    if (a1 !== a2 || !same(sc1, sc2)) diff2++;
    const k1 = rankActions(r, v, 1, held, 5), k2 = rankActions(fresh, v, 1, held, 5);
    if (k1.join() !== k2.join()) diff3++;
  }
  ok(diff2 === 0, `${arm}: chooseAction, the move and every mixture score the same bit for bit at ${cells.length - diff2} of ${cells.length} positions`);
  ok(diff3 === 0, `${arm}: rankActions, the top five the same at ${cells.length - diff3} of ${cells.length} positions`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
