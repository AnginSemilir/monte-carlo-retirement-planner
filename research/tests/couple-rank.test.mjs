/*
 * THE REVIEW OF 9 NOV, ITEM 2 (D66; research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md on review/external-2026-10-21): A
 * COUPLE'S PATH BY THE SHARED SCORING, EXACTLY. 78% of a couple's solved path was rankFor (src/solver/couple.js) scoring each
 * person's moves again with scoreMoves; the person's own chooser (solve.js chooseAction) already leaves every move's score,
 * the switch charged, in tab._sc and its estate in tab._bq, by the shared scoring the speed review verified. COUPLE.fast ranks
 * from those wherever that is the same sum (a mixture, the exact final year, no lock, no Richardson table). An exact port
 * (D24's rule for it: one differing bit stops it). One library couple, S007 (never anybody's own plan), its two tables at the
 * candidate's settings (solveForApp) at 6 wealth points on the light lattice; 60 paths of seed 7002:
 *   1. every ranking the same: COUPLE.check on, rankFor ranks each decision both ways; none differs, at any decision, for
 *      either person;
 *   2. every path the same: each path's joint move every year (both persons' moves, the split, the level), its survival, its
 *      pot left and its tax, bit for bit with COUPLE.fast on and off;
 *   3. not vacuous: the decisions ranked from the shared scores are counted, and there are some (a check that ran on
 *      nothing is an error, not a pass);
 *   4. the guard: on a dial position solved on its base's tiers (dial 3, its lock, at 4 points) and with a Richardson table
 *      attached by hand, no decision takes the shared scores, and the paths are the same with COUPLE.fast on and off;
 * and with --full, checks 1 to 3 at the app's 45 points, 100 paths, on S007 and on S127 (bridge years), with each couple's
 * path timed with COUPLE.fast off and on (the acceptance: at least twice as fast).
 * The plant (COUPLE_PLANT, couple.js COUPLE.plant): 'faststale', the shared ranking given the scores of the decision before,
 * fails checks 1 and 2. --plants runs it and reads which checks fail. The couple-tables, couple-quick and couple-lockstep tests
 * pass unchanged with COUPLE.fast on (check 4 of couple-tables: rankFor's first move is chooseAction's).
 *   node research/tests/couple-rank.test.mjs [--full] [--plants]
 *   COUPLE_PLANT=faststale node research/tests/couple-rank.test.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCouple, runCouplePolicy, COUPLE, COUPLE_CHECKED } from '../../src/solver/couple.js';
import { solveForApp, appPlan, prepareForSolve } from '../../src/solverApp.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const SELF = fileURLToPath(import.meta.url);
const PLANTS = { faststale: [1, 2] };
if (process.argv.includes('--plants')) {
  let bad = 0;
  for (const [p, want] of Object.entries(PLANTS)) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_PLANT: p }, encoding: 'utf8' });
    const failed = [...r.stdout.matchAll(/^ {2}FAIL (\d+)\./gm)].map(m => Number(m[1]));
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    if (!exact) bad++;
    console.log(`  plant ${p.padEnd(10)} fails ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) console.log(r.stdout + r.stderr);
  }
  console.log(bad ? `\n${bad} plant(s) not exact` : '\nall plants exact');
  process.exit(bad ? 1 : 0);
}
const FULL = process.argv.includes('--full');
const PLANT = process.env.COUPLE_PLANT || '';
COUPLE.plant = PLANT;

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode !== 'single');
const SEED = 7002;

/* a couple's plan as the solver takes it, its two tables by solveForApp (the candidate's settings), told the other's age */
function solveOf(id, opts, aims = null) {
  const raw = couples.find(s => s.id === id).plan;
  const plan = appPlan(E, prepareForSolve(E, aims ? { ...raw, solver: { aims } } : raw));
  return solveCouple(E, M, plan, { solveOne: (p, o) => solveForApp(E, M, p, { ...opts, ageWith: o.partnerAge0 }) });
}
const reset = () => { COUPLE_CHECKED.decisions = 0; COUPLE_CHECKED.fast = 0; COUPLE_CHECKED.differ = 0; COUPLE_CHECKED.first = null; };
/* every path's joint moves, survival, pot left and tax, under the switches given; the seconds a path */
function runAll(cp, zsAll, { fast, check }) {
  const was = { fast: COUPLE.fast, check: COUPLE.check };
  COUPLE.fast = fast; COUPLE.check = check;
  // the scores of the decision before (the plant, and the first decision of any run) start empty each run
  for (const who of ['self', 'part']) cp.tables[who]._sc = null;
  const t0 = process.hrtime.bigint();
  const out = zsAll.map(zs => { const trace = []; const o = runCouplePolicy(cp, Float64Array.from(zs), trace); return { o, moves: trace.map(j => [j.ia, j.ib, j.split, j.spendLevel]) }; });
  const secs = Number(process.hrtime.bigint() - t0) / 1e9;
  Object.assign(COUPLE, was);
  return { out, msPath: (1000 * secs) / zsAll.length };
}
/* the paths that differ in any bit: a joint move, survival, pot left, tax */
function differing(A, B) {
  let n = 0, first = null;
  A.out.forEach((a, k) => {
    const b = B.out[k];
    const same = Object.is(a.o.survived, b.o.survived) && Object.is(a.o.terminal, b.o.terminal) && Object.is(a.o.terminalNet, b.o.terminalNet) && Object.is(a.o.lifetimeTax, b.o.lifetimeTax)
      && a.moves.length === b.moves.length && a.moves.every((m, t) => m.every((v, i) => Object.is(v, b.moves[t][i])));
    if (!same) { n++; if (first === null) first = k; }
  });
  return { n, first };
}
/* checks 1 to 3 on one couple; `n0` numbers the checks */
function identity(id, cp, NP, label) {
  const T = cp.m.ctx.totalYears, zsAll = E.pathsForSeed(SEED, NP, T);
  reset();
  const checked = runAll(cp, zsAll, { fast: true, check: true });
  const C = { ...COUPLE_CHECKED };
  const off = runAll(cp, zsAll, { fast: false, check: false });
  const d = differing(checked, off);
  let report = '';
  if (C.first) {
    const f = C.first, who = f.tab === cp.tables.self ? 'self' : 'part';
    report = ` first: year ${f.t}, ${who}, held ${JSON.stringify(f.held)}, state [${f.s.map(x => +x.toPrecision(6)).join(', ')}]; shared ranking ${f.fast.join(',')} | scored ${f.scored.join(',')}; shared scores ${f.fast.map(a => f.fastScores[a]).join(',')} | scored ${f.scored.map(a => f.scoredScores[a]).join(',')}`;
  }
  ok(1, `${label}: every ranking the same as scoring every move again, either person, at every decision (COUPLE.check)`, C.differ === 0 && C.decisions > 0, `${C.differ} of ${C.decisions} rankings differ${report}`);
  ok(2, `${label}: every path the same with COUPLE.fast on and off (each year's joint move, survival, pot left, tax)`, d.n === 0, `${d.n} of ${NP} paths differ${d.first !== null ? ` (the first, path ${d.first})` : ''}`);
  ok(3, `${label}: not vacuous: decisions ranked from the shared scores`, C.fast > 0, `${C.fast} of ${C.decisions} rankings past rankFor's first return (${NP} paths, ${T + 1} years, two people)`);
  return { zsAll, off };
}

console.log(`couple-rank: a couple's path ranked from the shared scores (COUPLE.fast), seed ${SEED}${FULL ? ', --full' : ''}${PLANT ? `; planted: ${PLANT}` : ''}`);
let t0 = Date.now();
const cp6 = solveOf('S007', { points: 6, research: LIGHT });
const meta6 = cp6.tables.self.meta;
console.log(`S007: two tables at 6 points on the light lattice (tier state ${!!meta6.tierState}, mixture ${!!cp6.tables.self.mix}, exact final year ${!!cp6.tables.self.finalExact}, switch charge ${cp6.tables.self.switchCharge}), solved in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
identity('S007', cp6, 60, 'S007 at 6 points, 60 paths');

// 4. the guard: a dial position on its base's tiers (the lock), and a Richardson table: the scoring every move again, always
t0 = Date.now();
const cpLock = solveOf('S007', { points: 4, research: LIGHT, variant: 'B3a' }, { cuts: 3 });
const locked = ['self', 'part'].every(w => !!cpLock.tables[w].lockTiers);
const NG = 10, zsG = E.pathsForSeed(SEED, NG, cpLock.m.ctx.totalYears);
reset(); const lkOn = runAll(cpLock, zsG, { fast: true, check: true }); const lkC = { ...COUPLE_CHECKED };
const lkOff = runAll(cpLock, zsG, { fast: false, check: false }), lkD = differing(lkOn, lkOff);
// Richardson's second table, attached by hand as the research scripts attach one (solve.js chooseAction's r.rich): a
// table the guard must send to the scoring every move again
// (on check 1's couple, its first world's table standing in, taken off again after)
for (const w of ['self', 'part']) cp6.tables[w].rich = cp6.tables[w].mix.tables[0];
const zsR = E.pathsForSeed(SEED, NG, cp6.m.ctx.totalYears);
reset(); const rcOn = runAll(cp6, zsR, { fast: true, check: true }); const rcC = { ...COUPLE_CHECKED };
const rcOff = runAll(cp6, zsR, { fast: false, check: false }), rcD = differing(rcOn, rcOff);
for (const w of ['self', 'part']) cp6.tables[w].rich = null;
ok(4, `the guard: with a lock (dial 3 on its base's tiers) and with a Richardson table, no decision takes the shared scores, and the paths are the same`,
  locked && lkC.decisions > 0 && lkC.fast === 0 && lkD.n === 0 && rcC.decisions > 0 && rcC.fast === 0 && rcD.n === 0,
  `lock on both tables ${locked}: ${lkC.fast} of ${lkC.decisions} rankings shared, ${lkD.n} of ${NG} paths differ; Richardson: ${rcC.fast} of ${rcC.decisions} shared, ${rcD.n} of ${NG} differ (${((Date.now() - t0) / 1000).toFixed(0)}s)`);

if (FULL) {
  for (const id of ['S007', 'S127']) {
    t0 = Date.now();
    const cp = solveOf(id, {});
    const solveSecs = (Date.now() - t0) / 1000;
    console.log(`${id}: two tables at the app's 45 points, solved in ${solveSecs.toFixed(0)}s`);
    const { zsAll, off } = identity(id, cp, 100, `${id} at 45 points, 100 paths`);
    const on = runAll(cp, zsAll, { fast: true, check: false });
    const speed = off.msPath / on.msPath;
    console.log(`  ${id} at 45 points: a path ${off.msPath.toFixed(1)} ms as scored every move again, ${on.msPath.toFixed(1)} ms from the shared scores (${speed.toFixed(2)} times), ${differing(on, off).n} of 100 paths differ`);
    ok(5, `${id}: a path at 45 points at least twice as fast from the shared scores`, speed >= 2, `${speed.toFixed(2)} times`);
  }
}

console.log(`\ncouple-rank: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
