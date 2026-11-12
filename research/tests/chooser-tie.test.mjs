/*
 * THE CHOOSER'S TIE-BREAK ABOVE THE ESTATE CAP (`tieAboveCap`; the review of 11 Nov, item 13, stage B; D76, D81 (B); research,
 * off unless set, not in the candidate). Above the cap (four times the opening wealth under the estate shape 'cap') the
 * tables put no value on a pound, so the whole menu broke near-ties by nothing and paid tax the objective could not see.
 * With the option, where the household's wealth is already above the cap, the chooser takes, among the moves at the best
 * move's spending level and tier pair scoring within the margin of it, the one that pays the least tax this year
 * (src/solver/solve.js chooseAction). Forward only: no table changes. The app's solve at 4 points on the light lattice
 * (solveForApp), each run by the engine (solverStrategy runPath) on paths of seed 99004 (the review's, outside the held-out set):
 *   1. the option unset: S328F's paths bit for bit those of the code before the option (a pinned digest), and the solve
 *      carries the cap (four times the opening wealth) and no margin;
 *   2. the option set: every table the same as without it (the tables' digest); the run record names the margin; a margin
 *      out of range is refused; under the estate shape 'soft' the solve carries no cap and its paths are the same with the
 *      option as without (the rule has nowhere to act);
 *   3. the paths that never reach the cap (S328F's own, wealth at or below it at every decision): each bit for bit the same
 *      with the option as without (every library household tried reaches its cap on some path, so the check is by path);
 *   4. S328F, at each decision of its own path without the option, the option's choice at the same position: wherever the
 *      two differ, the option's move is at the best move's spending level and tier pair, pays no more tax that year, and the
 *      household's wealth is above the cap; and they do differ (not vacuous);
 *   5. a couple (S007): every path of the couples' rollout the same with the option on each person's table as without (the
 *      rollout ranks from the chooser's scores, which the rule does not touch).
 *   6. the forward run (runPolicy) and the engine in step with the option on: the same paths survive, each ending within a pound.
 * The plants (CHOOSER_TIE_PLANT, solve.js CHOOSER.tiePlant): 'anylevel' (any move within the margin above the cap, whatever
 * its level or tier pair) fails check 4; 'anywhere' (the cap test dropped) fails checks 3 and 4. --plants runs each and
 * reads which checks fail.
 *   node research/tests/chooser-tie.test.mjs [--plants] [--record]
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { CHOOSER, runPolicy } from '../../src/solver/solve.js';
import { solveCouple, runCouplePolicy } from '../../src/solver/couple.js';
import { solveForApp, appPlan, prepareForSolve } from '../../src/solverApp.js';
import { solvedContext, runPath, partsOf } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readPanel } from '../solver/phase4-panel.mjs';

const SELF = fileURLToPath(import.meta.url);
const PLANTS = { anylevel: [4], anywhere: [3, 4] };
if (process.argv.includes('--plants')) {
  let bad = 0;
  for (const [p, want] of Object.entries(PLANTS)) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, CHOOSER_TIE_PLANT: p }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^ {2}FAIL (\d+)\./gm)].map(m => Number(m[1])))].sort((a, b) => a - b);
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    if (!exact) bad++;
    console.log(`  plant ${p.padEnd(9)} fails ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) console.log(r.stdout + r.stderr);
  }
  console.log(bad ? `\n${bad} plant(s) not exact` : '\nall plants exact');
  process.exit(bad ? 1 : 0);
}
const RECORD = process.argv.includes('--record');
CHOOSER.tiePlant = process.env.CHOOSER_TIE_PLANT || '';
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, SEED = 99004, NP = 200, MARGIN = 1e-4;
const lib = buildScenarios(), planOf = id => { const h = readPanel().find(x => x.id === id); return h ? h.plan : E.normalizePlan(lib.find(s => s.id === id).plan); };
const solve = (id, research = {}) => solveForApp(E, M, planOf(id), { points: 4, research: { ...LIGHT, ...research } });
const setTie = (r, m) => { for (const x of [r, ...(r.worlds || [])]) { if (m === undefined) delete x.tieAboveCap; else x.tieAboveCap = m; } };
// every path's outcome under the solved plan as it stands: survival, the pot left, lifetime tax, spending delivered, each year's level
const run = (r, paths) => { const sc = solvedContext(E, r); return paths.map(zs => { const o = runPath(E, sc, zs); return [o.survived, o.terminalPot, o.lifetimeTax, o.delivered, o.failT, ...o.level]; }); };
const hashOf = out => createHash('sha256').update(JSON.stringify(out)).digest('hex');
const differ = (A, B) => A.filter((a, k) => a.length !== B[k].length || a.some((v, i) => !Object.is(v, B[k][i]))).length;
const wealthOf = st => Object.values(st.pots).reduce((x, v) => x + (v || 0), 0);
// the replay: along the plan's own path without the option, the option's choice at each decision
function replay(r, paths) {
  const sc = solvedContext(E, r), base = sc.policyOverride, T = sc.totalYears, cap = r.estateCap;
  const q = { decisions: 0, above: 0, differ: 0, level: 0, pair: 0, atOrBelow: 0, moreTax: 0 };
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) {
    setTie(r, undefined); const f = base.choose(st, t, held);
    if (t >= T || !f || f.index === undefined) return f;
    const txF = r._tx[f.index], w = wealthOf(st);
    setTie(r, MARGIN); const x = base.choose(st, t, held); setTie(r, undefined);
    q.decisions++; if (w > cap) q.above++;
    if (x.index !== f.index) {
      q.differ++;
      const pf = partsOf(r.actions[f.index], r.c.acts[f.index]), px = partsOf(r.actions[x.index], r.c.acts[x.index]);
      if (r.levelOf[f.index] !== r.levelOf[x.index]) q.level++;
      if ((pf.tierPen || 0) !== (px.tierPen || 0) || (pf.tierIsa || 0) !== (px.tierIsa || 0)) q.pair++;
      if (!(w > cap)) q.atOrBelow++;
      if (r._tx[x.index] > txF + 1e-6) q.moreTax++;
    }
    return f;
  } } };
  for (const zs of paths) runPath(E, ctx, zs);
  return q;
}

console.log(`chooser-tie: the chooser's tie-break above the estate cap (tieAboveCap ${MARGIN}), seed ${SEED}${CHOOSER.tiePlant ? `; planted: ${CHOOSER.tiePlant}` : ''}`);
// ---- 1. the option unset ----
const BEFORE = '03f2dad1043f20fd99b7c61e0636f1186d076d72ad67f769b760348bc4caee0b';   // S328F at 4 points, 200 paths: its outcomes' digest, taken on the code before the option (f822e999)
const A = solve('S328F'), TA = solvedContext(E, A).totalYears, pathsA = E.pathsForSeed(SEED, NP, TA);
const opening = A.m.ctx.accounts.reduce((x, a) => x + a.balance, 0);
const offA = run(A, pathsA), dOff = hashOf(offA);
if (RECORD) { console.log(`RECORD S328F ${dOff}`); process.exit(0); }
ok(1, 'the option unset: S328F\'s paths the code before the option\'s, bit for bit; the solve carries the cap and no margin', dOff === BEFORE && A.tieAboveCap === undefined && A.meta.tieAboveCap === undefined && Math.abs(A.estateCap - 4 * opening) < 1e-6,
  `outcomes ${dOff.slice(0, 16)} against ${BEFORE.slice(0, 16)}; the cap £${Math.round(A.estateCap)}, four times the opening £${Math.round(opening)}`);
// ---- 2. the option set: the tables, the record, the refusal, the shape 'soft' ----
{
  const B = solve('S328F', { tieAboveCap: MARGIN }), dA = await digestOf(tablesOf(A)), dB = await digestOf(tablesOf(B));
  let msg = ''; try { solve('S328F', { tieAboveCap: 0.5 }); } catch (e) { msg = e.message; }
  const soft = solve('S328F', { bequestShape: 'soft', tieAboveCap: MARGIN }), sOn = run(soft, pathsA.slice(0, 60)); setTie(soft, undefined); const sOff = run(soft, pathsA.slice(0, 60));
  ok(2, 'the option set: every table the same; the record names the margin; a margin out of range refused; under the shape \'soft\' no cap, and the paths the same with it as without',
    dA === dB && B.tieAboveCap === MARGIN && B.meta.tieAboveCap === MARGIN && B.worlds.every(w => w.tieAboveCap === MARGIN) && /^tieAboveCap 0\.5/.test(msg) && soft.estateCap === null && differ(sOn, sOff) === 0,
    `tables ${dB.slice(0, 16)} against ${dA.slice(0, 16)}; refused: ${msg.slice(0, 60) || 'NOT refused'}; under 'soft' the cap ${soft.estateCap}, ${differ(sOn, sOff)} of 60 paths differ`);
}
// ---- 3. the paths that never reach the cap ----
{
  // which of S328F's paths, run without the option, have no decision with wealth above the cap
  const sc = solvedContext(E, A), base = sc.policyOverride; let hit = false;
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) { if (wealthOf(st) > A.estateCap) hit = true; return base.choose(st, t, held); } } };
  const never = pathsA.map(zs => { hit = false; runPath(E, ctx, zs); return !hit; });
  setTie(A, MARGIN); const on = run(A, pathsA); setTie(A, undefined);
  const below = never.filter(Boolean).length, moved = on.filter((x, k) => never[k] && (x.length !== offA[k].length || x.some((v, i) => !Object.is(v, offA[k][i])))).length;
  ok(3, 'the paths that never reach the cap (S328F\'s, wealth at or below it at every decision): each the same with the option as without, bit for bit', below >= 20 && moved === 0,
    `${below} of ${NP} paths never reach the cap (£${Math.round(A.estateCap)}); ${moved} of them differ with the option; of the other ${NP - below}, ${on.filter((x, k) => !never[k] && x.some((v, i) => !Object.is(v, offA[k][i]))).length} differ`);
}
// ---- 4. S328F: where the option's choice differs ----
{
  const q = replay(A, pathsA.slice(0, 100)); setTie(A, MARGIN); const on = run(A, pathsA); setTie(A, undefined);
  const mean = (o, i) => o.reduce((s, x) => s + x[i], 0) / o.length;
  ok(4, 'S328F, the option\'s choice at each decision of its own path: wherever it differs, at the best move\'s level and tier pair, with no more tax that year, and above the cap', q.differ > 0 && q.level === 0 && q.pair === 0 && q.atOrBelow === 0 && q.moreTax === 0,
    `${q.decisions} decisions (${q.above} above the cap), a different move at ${q.differ}: at another level ${q.level}, at another tier pair ${q.pair}, at or below the cap ${q.atOrBelow}, with more tax that year ${q.moreTax}; over ${NP} paths the mean pot ${(100 * (mean(on, 1) / mean(offA, 1) - 1)).toFixed(1)}%, lifetime tax ${(100 * (mean(on, 2) / mean(offA, 2) - 1)).toFixed(1)}%, ${on.filter((x, k) => x[0] !== offA[k][0]).length} paths' survival changed`);
}
// ---- 5. a couple ----
{
  const plan = appPlan(E, prepareForSolve(E, lib.find(s => s.id === 'S007').plan));
  const cpOf = research => solveCouple(E, M, plan, { solveOne: (p, o) => solveForApp(E, M, p, { points: 4, research: { ...LIGHT, ...research }, ageWith: o.partnerAge0 }) });
  const off = cpOf({}), on = cpOf({ tieAboveCap: MARGIN }), zsAll = E.pathsForSeed(SEED, 40, off.m.ctx.totalYears);
  const paths = cp => zsAll.map(zs => { const trace = []; const o = runCouplePolicy(cp, Float64Array.from(zs), trace); return [o.survived, o.terminal, o.lifetimeTax, ...trace.flatMap(j => [j.ia, j.ib, j.split, j.spendLevel, j.score])]; });
  const pOff = paths(off), pOn = paths(on);
  ok(5, 'a couple (S007): every path of the rollout the same with the option on each person\'s table as without', differ(pOn, pOff) === 0 && on.tables.self.tieAboveCap === MARGIN && on.tables.part.tieAboveCap === MARGIN,
    `${differ(pOn, pOff)} of 40 paths differ; each person's table carries the margin`);
}
// ---- 6. the forward run beside the engine, the option on (the reviewer at stage A's read, MINOR 2) ----
{
  setTie(A, MARGIN);
  const sc = solvedContext(E, A), sub = pathsA.slice(0, 60); let differ6 = 0, worst = 0, alive = 0;
  for (const zs of sub) { const f = runPolicy(A, zs), e = runPath(E, sc, zs); if (f.survived !== e.survived) differ6++; else if (f.survived) { alive++; worst = Math.max(worst, Math.abs(f.terminal - e.terminalPot)); } }
  setTie(A, undefined);
  ok(6, 'the forward run (runPolicy) and the engine in step with the option on: the same paths survive, and each ends within a pound', differ6 === 0 && alive > 0 && worst <= 1, `${differ6} of ${sub.length} paths differ in survival; of ${alive} surviving in both, the largest gap at the end £${worst.toExponential(1)}`);
}
console.log(`\nchooser-tie: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
