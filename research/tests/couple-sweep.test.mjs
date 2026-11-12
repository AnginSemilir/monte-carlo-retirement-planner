/*
 * A COUPLE'S MOVE CARRIES THE SWEEP ITS TABLES WERE SOLVED WITH (D73's port for couples; the reviewer of 11 Nov, BLOCKING 1 of
 * reviews/2026-11-11-default-d73.md). Since D73 the candidate sends the year's sweep of cash ISA money above the buffer to the
 * stocks and shares ISA: every move of a person's table carries `sweepIsa`, and a single's table hands it to the engine
 * with the move. The household's joint move (src/solver/couple.js chooseJoint) left it out, so under tables solved for the
 * ISA the couples' rollout and the engine both swept to the taxable account, and no test could see it: the singles' tests
 * solve no couple, and the couples' tests compare two sides that both lacked the field. S059 (a library couple that starts
 * with cash ISAs, nobody's own plan), each person's table by the app's solve at 4 points on the light lattice, 3 paths of
 * seed 99001:
 *   1. every move of each person's table carries the sweep to the ISA, and so does every joint move of the rollout's paths;
 *   2. the engine under the couple's policy sweeps cash ISA money to the ISA, and the engine and the exact model end each
 *      path within a pound of each other;
 *   3. with the key taken out of each person's solve no move carries it, the engine sweeps nothing to the ISA, and the two
 *      still end within a pound: the sweep follows the tables, either way;
 *   4. tables that disagree (one person's solved for the ISA, the other's not) are refused.
 * The plant (COUPLE_PLANT=nosweepisa, couple.js COUPLE.plant): the joint move drops the sweep; checks 1 and 2 fail.
 *   node research/tests/couple-sweep.test.mjs [--plants]
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCouple, withCouple, runCouplePolicy, COUPLE } from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { prepareForSolve } from '../../src/solverSettings.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--plants')) {
  const want = [1, 2], r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_PLANT: 'nosweepisa' }, encoding: 'utf8' });
  const failed = [...new Set([...r.stdout.matchAll(/^ {2}FAIL (\d+)\./gm)].map(m => Number(m[1])))].sort((a, b) => a - b), exact = failed.join() === want.join();
  console.log(`  plant nosweepisa fails ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
  if (!exact) console.log(r.stdout + r.stderr);
  process.exit(exact ? 0 : 1);
}
COUPLE.plant = process.env.COUPLE_PLANT || '';
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, SEED = 99001, NP = 3, ID = 'S059';
const plan = prepareForSolve(E, E.normalizePlan(buildScenarios().find(s => s.id === ID).plan));
const solveOf = research => solveCouple(E, M, plan, { solveOne: (p, o) => solveForApp(E, M, p, { points: 4, research: { ...LIGHT, ...research }, ageWith: o.partnerAge0 }) });
// a solved couple's paths: the joint moves of the rollout in the exact model, and the engine under the couple's policy
function runs(cp) {
  const T = cp.m.ctx.totalYears, paths = E.pathsForSeed(SEED, NP, T), ctx = E.buildContext(withCouple(cp.plan, cp));
  let moves = 0, carrying = 0, toIsa = 0, toGia = 0, worst = 0;
  for (const zs of paths) {
    const trace = [], o = runCouplePolicy(cp, Float64Array.from(zs), trace);
    moves += trace.length; carrying += trace.filter(j => j.sweepIsa === true).length;
    const st = E.freshState(ctx); let row = null, ok = true;
    for (let t = 0; t <= T; t++) { row = E.stepYear(ctx, st, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 }); toIsa += row.sweptToIsa || 0; toGia += row.sweptToGia || 0; if (row.unmetDemand > 1) ok = false; }
    if (o.survived && ok) worst = Math.max(worst, Math.abs(o.terminal - row.totalCombined));
    else if (o.survived !== ok) worst = Infinity;
  }
  return { moves, carrying, toIsa: toIsa / NP, toGia: toGia / NP, worst };
}
const carry = cp => ['self', 'part'].map(w => `${cp.tables[w].actions.filter(a => a.sweepIsa === true).length} of ${cp.tables[w].actions.length}`);
console.log(`couple-sweep: ${ID}, each person's table at 4 points, ${NP} paths of seed ${SEED}${COUPLE.plant ? `; planted: ${COUPLE.plant}` : ''}`);
const cashIsa0 = Object.values(E.freshState(E.buildContext(plan)).cashIsa || {}).reduce((a, b) => a + b, 0);
const on = solveOf({}), rOn = runs(on);
ok(1, 'every move of each person\'s table carries the sweep to the ISA, and every joint move of the rollout\'s paths does', ['self', 'part'].every(w => on.tables[w].meta.sweepCashIsaTo === 'isa' && on.tables[w].actions.every(a => a.sweepIsa === true)) && rOn.moves > 0 && rOn.carrying === rOn.moves,
  `the tables' moves carrying it: ${carry(on).join(' and ')}; the joint moves: ${rOn.carrying} of ${rOn.moves}`);
ok(2, 'the engine under the couple\'s policy sweeps cash ISA money to the ISA; the engine and the exact model end each path within a pound', cashIsa0 > 0 && rOn.toIsa > 0 && rOn.worst <= 1,
  `the couple starts with £${Math.round(cashIsa0)} in cash ISAs; a path sweeps £${Math.round(rOn.toIsa)} to the ISA and £${Math.round(rOn.toGia)} to the taxable account; the two end within £${rOn.worst.toExponential(1)}`);
const off = solveOf({ sweepCashIsaTo: undefined }), rOff = runs(off);
ok(3, 'with the key taken out of each person\'s solve: no move carries it, the engine sweeps nothing to the ISA, and the two still end within a pound', ['self', 'part'].every(w => off.tables[w].actions.every(a => !a.sweepIsa)) && rOff.carrying === 0 && rOff.toIsa === 0 && rOff.toGia > 0 && rOff.worst <= 1,
  `the joint moves carrying it: ${rOff.carrying} of ${rOff.moves}; a path sweeps £${Math.round(rOff.toIsa)} to the ISA and £${Math.round(rOff.toGia)} to the taxable account; within £${rOff.worst.toExponential(1)}`);
{
  const mixed = { ...on, _flat: undefined, tables: { self: on.tables.self, part: off.tables.part } };
  let msg = ''; try { runCouplePolicy(mixed, Float64Array.from(E.pathsForSeed(SEED, 1, on.m.ctx.totalYears)[0])); } catch (e) { msg = e.message; }
  ok(4, 'tables that disagree on the sweep are refused', /^couple: one person's table sweeps cash ISA money to the ISA and the other's to the taxable account/.test(msg), msg.slice(0, 90) || 'NOT refused');
}
console.log(`\ncouple-sweep: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
