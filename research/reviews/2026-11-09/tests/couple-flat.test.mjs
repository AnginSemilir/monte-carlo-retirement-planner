/*
 * THE REVIEW OF 9 NOV, ITEM 11 (research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md on review/external-2026-10-21): A
 * COUPLE'S JOINT MOVE ON FLAT ARRAYS, EXACTLY. With each person's moves ranked from their chooser's shared scores (item 2),
 * what was left of a couple's solved path was the rollout's own valuing of each candidate (src/solver/couple.js
 * expectedValue): for every node of the market a rates object, a copy of the couple's state, each person's state and vector
 * built as objects, and each person's table read twice at one position; in a bridge year about twenty times over
 * (shareBridge). COUPLE.flat does the same sums on flat arrays, keeps each account's growth factors in a table, reads each
 * person's table once for survival and the cut ahead, and does not value again a position already valued this decision.
 * An exact port (D24's rule for it: one differing bit stops it). Two library couples, neither anybody's own plan: S007 (no
 * bridge year) and S127 (bridge years), each person's table at the candidate's settings (solveForApp) at 6 wealth points
 * on the light lattice; 40 paths of seed 7002 in the exact model (runCouplePolicy):
 *   1. every value the same: COUPLE.flatCheck on, every position the rollout values is valued both ways; none differs in its
 *      value, its chance both last or its cut ahead;
 *   2. every path the same: each path's joint move every year (both persons' moves, the split, the level, the score), its
 *      survival, its pot left and its tax, bit for bit with COUPLE.flat on and off;
 *   3. not vacuous: positions were valued, some were taken from one already valued, and S127's tables read bridge years
 *      (so the bridge's search ran on the flat position);
 *   4. every ranking the same: COUPLE.check on with COUPLE.flat on, each person's first moves picked without sorting
 *      (topOf) against the ranking by scoring every move again and sorting; none differs;
 *   5. the guard: with another plant set ('nocut') no position takes the flat path, and a household holding an account that
 *      is not one of the two people's four is refused it; both are then valued by the path as it was;
 * and with --full, checks 1 to 4 at the app's 45 points, 100 paths, on both couples, each couple's path timed with
 * COUPLE.flat off and on (the acceptance: S007 at least 1.5 times as fast, S127 at least three times; the review's run
 * gave 1.77 and 4.16 with one other job on the machine).
 * The plants (COUPLE_PLANT, couple.js COUPLE.plant): 'flatrate' (a growth factor taken from the first node's for every
 * node), 'flatmemo' (a position taken as already valued on the first person's money alone) and 'flatmove' (the bridge's
 * moved money leaving the taxable account's basis behind). --plants runs each and reads which checks fail.
 *   REPO_ROOT=<a tree with prototype/couple-flat.diff applied> node couple-flat.test.mjs [--full] [--plants]
 *   COUPLE_PLANT=flatrate node couple-flat.test.mjs
 * Ported: this file to research/tests/, its imports made the static ones of couple-rank.test.mjs.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { repoRoot } from '../scripts/root.mjs';

const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs'), M = await import(R + '/src/solver/model.js');
const { solveCouple, runCouplePolicy, expectedValue, COUPLE, COUPLE_CHECKED, COUPLE_FLAT } = await import(R + '/src/solver/couple.js');
const { solveForApp, appPlan, prepareForSolve } = await import(R + '/src/solverApp.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');

const SELF = fileURLToPath(import.meta.url);
const PLANTS = { flatrate: [1, 2], flatmemo: [1, 2], flatmove: [1, 2] };
if (process.argv.includes('--plants')) {
  let bad = 0;
  for (const [p, want] of Object.entries(PLANTS)) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_PLANT: p }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^ {2}FAIL (\d+)\./gm)].map(m => Number(m[1])))];
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
function solveOf(id, opts) {
  const plan = appPlan(E, prepareForSolve(E, couples.find(s => s.id === id).plan));
  return solveCouple(E, M, plan, { solveOne: (p, o) => solveForApp(E, M, p, { ...opts, ageWith: o.partnerAge0 }) });
}
const bridgeYears = (cp) => ['self', 'part'].map(w => { const g = cp.tables[w].g; return g && g.reader ? g.reader.years.reduce((a, b) => a + (b ? 1 : 0), 0) : 0; });
const resetFlat = () => { for (const k of Object.keys(COUPLE_FLAT)) COUPLE_FLAT[k] = k === 'first' ? null : 0; };
const resetRank = () => { COUPLE_CHECKED.decisions = 0; COUPLE_CHECKED.fast = 0; COUPLE_CHECKED.differ = 0; COUPLE_CHECKED.first = null; };
/* every path's joint moves, survival, pot left and tax, under the switches given; the milliseconds a path */
function runAll(cp, zsAll, { flat, flatCheck = false, check = false }) {
  const was = { flat: COUPLE.flat, flatCheck: COUPLE.flatCheck, check: COUPLE.check };
  COUPLE.flat = flat; COUPLE.flatCheck = flatCheck; COUPLE.check = check;
  cp._flat = undefined;   // the flat path's tables start empty each run
  const t0 = process.hrtime.bigint();
  const out = zsAll.map(zs => { const trace = []; const o = runCouplePolicy(cp, Float64Array.from(zs), trace); return { o, moves: trace.map(j => [j.ia, j.ib, j.split, j.spendLevel, j.score]) }; });
  const secs = Number(process.hrtime.bigint() - t0) / 1e9;
  Object.assign(COUPLE, was);
  return { out, msPath: (1000 * secs) / zsAll.length };
}
/* the paths that differ in any bit: a joint move or its score, survival, pot left, tax */
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
/* checks 1 to 4 on one couple */
function identity(id, cp, NP, label) {
  const T = cp.m.ctx.totalYears, zsAll = E.pathsForSeed(SEED, NP, T), by = bridgeYears(cp);
  resetFlat();
  const checked = runAll(cp, zsAll, { flat: true, flatCheck: true });
  const C = { ...COUPLE_FLAT };
  const off = runAll(cp, zsAll, { flat: false });
  const d = differing(checked, off);
  const report = C.first ? ` first: year ${C.first.t}, moves ${C.first.pick ? `${C.first.pick.ia} and ${C.first.pick.ib}` : '-'}; flat ${C.first.flat.join(', ')} | as it was ${C.first.slow.join(', ')}` : '';
  ok(1, `${label}: every position the rollout values the same on flat arrays as by the path as it was: its value, both lasting, the cut ahead (COUPLE.flatCheck)`, C.differ === 0 && C.checked > 0, `${C.differ} of ${C.checked} values differ${report}`);
  ok(2, `${label}: every path the same with COUPLE.flat on and off (each year's joint move and its score, survival, pot left, tax)`, d.n === 0, `${d.n} of ${NP} paths differ${d.first !== null ? ` (the first, path ${d.first})` : ''}`);
  ok(3, `${label}: not vacuous: positions valued, some taken from one already valued this decision${id === 'S127' ? ', and bridge years read' : ''}`, C.values > 0 && C.memo > 0 && (id !== 'S127' || by[0] + by[1] > 0),
    `${C.values} valued, ${C.memo} taken from one already valued (${(100 * C.memo / (C.values + C.memo)).toFixed(1)}%), ${C.reads} table reads; bridge years ${by[0]} and ${by[1]}`);
  resetRank();
  runAll(cp, zsAll, { flat: true, check: true });
  const K = { ...COUPLE_CHECKED };
  ok(4, `${label}: every ranking the same picked without sorting as by scoring every move again and sorting (COUPLE.check)`, K.differ === 0 && K.fast > 0, `${K.differ} of ${K.fast} rankings differ`);
  return { zsAll, off };
}

console.log(`couple-flat: a couple's joint move on flat arrays (COUPLE.flat), seed ${SEED}${FULL ? ', --full' : ''}${PLANT ? `; planted: ${PLANT}` : ''}`);
const light = {};
for (const id of ['S007', 'S127']) {
  const t0 = Date.now();
  const cp = light[id] = solveOf(id, { points: 6, research: LIGHT });
  console.log(`${id}: two tables at 6 points on the light lattice (mixture ${!!cp.tables.self.mix}, tier state ${!!cp.tables.self.meta.tierState}, bridge reader ${!!cp.tables.self.g.reader}), solved in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  identity(id, cp, 40, `${id} at 6 points, 40 paths`);
}

// 5. the guard: another plant, or an account that is not one of the two people's four, keeps the path as it was
{
  const cp = light.S127, st = M.initialState(cp.m), o1 = new Float64Array(2), o2 = new Float64Array(2), o3 = new Float64Array(2), o4 = new Float64Array(2);
  const pick = { ia: 0, ib: 0 }, was = { plant: COUPLE.plant, flat: COUPLE.flat };
  // (a) 'nocut' set: the flat path stands aside, and the value is the path's as it was under that plant
  COUPLE.plant = 'nocut'; cp._flat = undefined; resetFlat();
  COUPLE.flat = true; const a1 = expectedValue(cp, st, 0, o1, pick), tookA = COUPLE_FLAT.values + COUPLE_FLAT.memo;
  COUPLE.flat = false; const a2 = expectedValue(cp, st, 0, o2, pick);
  // (b) an account more than the two people's four (holding nothing): refused, and valued as it was
  COUPLE.plant = ''; resetFlat();
  const odd = { ...cp, _flat: undefined, m: { ...cp.m, ctx: { ...cp.m.ctx, accounts: [...cp.m.ctx.accounts, { ...cp.m.ctx.accounts[0], id: 'pen2_self' }] } } };
  COUPLE.flat = true; const b1 = expectedValue(odd, st, 0, o3, pick), tookB = COUPLE_FLAT.values + COUPLE_FLAT.memo;
  COUPLE.flat = false; const b2 = expectedValue(cp, st, 0, o4, pick);
  // and the household itself does take it (the guard is not what always answers)
  COUPLE.flat = true; cp._flat = undefined; resetFlat(); expectedValue(cp, st, 0, o4, pick); const tookC = COUPLE_FLAT.values;
  Object.assign(COUPLE, was); cp._flat = undefined;
  ok(5, `the guard: with 'nocut' planted, and with an account that is not one of the two people's four, no position takes the flat path and each is valued by the path as it was`,
    tookA === 0 && Object.is(a1, a2) && Object.is(o1[0], o2[0]) && tookB === 0 && Object.is(b1, b2) && Object.is(o3[0], o4[0]) && tookC === 1,
    `'nocut': ${tookA} flat, the same value ${Object.is(a1, a2)}; the odd account: ${tookB} flat, the same value ${Object.is(b1, b2)}; the household itself: ${tookC} flat`);
}

if (FULL) {
  for (const [id, need] of [['S007', 1.5], ['S127', 3]]) {
    const t0 = Date.now();
    const cp = solveOf(id, {});
    console.log(`${id}: two tables at the app's 45 points, solved in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    const { zsAll, off } = identity(id, cp, 100, `${id} at 45 points, 100 paths`);
    const on = runAll(cp, zsAll, { flat: true });
    const speed = off.msPath / on.msPath;
    console.log(`  ${id} at 45 points: a path ${off.msPath.toFixed(1)} ms as it was, ${on.msPath.toFixed(1)} ms on flat arrays (${speed.toFixed(2)} times), ${differing(on, off).n} of 100 paths differ`);
    ok(6, `${id}: a path at 45 points at least ${need} times as fast on flat arrays`, speed >= need, `${speed.toFixed(2)} times`);
  }
}

console.log(`\ncouple-flat: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
