/*
 * THE CHOOSER'S SHORTLIST (`chooserShortlist: 'order'`, with the slice; the review of 9 Nov, item 7, stage B, read again on
 * 12 Nov, results-tie-a.txt; D81 (C), D86; research, off unless set, not in the candidate). The chooser scores only the moves the tables
 * stored around the position, widened along their draw order (src/solver/solve.js shortMask), each exactly as the whole menu
 * scores it; where the tie-break above the estate cap is on and the household is above it, every move at the chosen move's
 * level and tier pair joins the list (the slice). An approximation, so what is tested is everything around it that must be
 * exact. The app's solve at 4 points on the light lattice (solveForApp), run by the engine (solverStrategy runPath) on paths
 * of seed 99004; S328F as Phase 4 landed it:
 *   1. the option unset: the paths bit for bit those of the code before it (the digest chooser-tie.test.mjs pins too); set,
 *      every table the same, the run record names it, and any other width ('structure', which failed its read) is refused;
 *   2. the list is a real shortlist and is never what stops a decision: fewer moves listed than the menu holds; where no
 *      listed move can be afforded the whole menu is scored (counted), and at every such decision the choice is the whole
 *      menu's own;
 *   3. planted, the list emptied ('empty'): every decision falls back, and every path is the whole menu's, bit for bit;
 *   4. the replay: at each decision of the whole menu's own path, the shortlist's choice and the score it gives up; planted,
 *      the cells' stored moves left out of the list ('nobest'), the decisions giving up over 0.01 points of score rise above
 *      the unplanted run's;
 *   5. the slice: with the tie-break above the cap on, at each decision of the whole menu's own path the shortlist with the
 *      slice differs from it at no decision above the cap, and the slice acts; planted, the slice left out ('noslice'), it
 *      differs above the cap;
 *   7. the forward run (runPolicy) and the engine in step with the shortlist and the tie-break on;
 *   6. --full only, the known answer: S116 at 45 points, 1,000 paths of seed 99001, survival within 0.5 points of the whole
 *      menu's.
 *   node research/tests/chooser-shortlist.test.mjs [--full]
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { SHORTLIST, runPolicy } from '../../src/solver/solve.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext, runPath } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readPanel } from '../solver/phase4-panel.mjs';

const FULL = process.argv.includes('--full');
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, SEED = 99004, NP = 200, NREP = 60, MARGIN = 1e-4;
const lib = buildScenarios(), planOf = id => { const h = readPanel().find(x => x.id === id); return h ? h.plan : E.normalizePlan(lib.find(s => s.id === id).plan); };
const solve = (id, research = {}, points = 4) => solveForApp(E, M, planOf(id), { points, research: points <= 6 ? { ...LIGHT, ...research } : research });
// the chooser's switches on a solved plan, as the solve's options would set them
const set = (r, width, tie) => { if (width) r.chooserShortlist = width; else delete r.chooserShortlist; for (const x of [r, ...(r.worlds || [])]) { if (tie) x.tieAboveCap = tie; else delete x.tieAboveCap; } };
const resetStats = () => { for (const k of Object.keys(SHORTLIST.stats)) SHORTLIST.stats[k] = 0; };
const run = (r, paths) => { const sc = solvedContext(E, r); return paths.map(zs => { const o = runPath(E, sc, zs); return [o.survived, o.terminalPot, o.lifetimeTax, o.delivered, o.failT, ...o.level]; }); };
const hashOf = out => createHash('sha256').update(JSON.stringify(out)).digest('hex');
const differ = (A, B) => A.filter((a, k) => a.length !== B[k].length || a.some((v, i) => !Object.is(v, B[k][i]))).length;
const wealthOf = st => Object.values(st.pots).reduce((x, v) => x + (v || 0), 0);
/* the replay: along the path of the plan under `ref` ([width, tie]), the choice under `ask` at each decision: the decisions
   that differ, those giving up more than 0.01 points of the reference's score, and those differing with wealth above the cap */
function replay(r, paths, ref, ask) {
  const sc = solvedContext(E, r), base = sc.policyOverride, T = sc.totalYears, q = { decisions: 0, differ: 0, gaveUp: 0, above: 0, differAbove: 0, fellBackSame: 0, fellBack: 0 };
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) {
    set(r, ...ref); const f = base.choose(st, t, held);
    if (t >= T || !f || f.index === undefined) return f;
    const scF = Float64Array.from(r._sc), w = wealthOf(st), fb0 = SHORTLIST.stats.fallback;
    set(r, ...ask); const x = base.choose(st, t, held); const fell = SHORTLIST.stats.fallback > fb0; set(r, ...ref);
    q.decisions++; if (w > r.estateCap) q.above++;
    if (fell) { q.fellBack++; if (x.index === f.index) q.fellBackSame++; }
    if (x.index !== f.index) { q.differ++; if (scF[f.index] - scF[x.index] > 1e-4) q.gaveUp++; if (w > r.estateCap) q.differAbove++; }
    return f;
  } } };
  for (const zs of paths) runPath(E, ctx, zs);
  set(r, null, 0);
  return q;
}

console.log(`chooser-shortlist: the chooser's shortlist and its slice, seed ${SEED}${FULL ? ', --full' : ''}`);
const A = solve('S328F'), pathsA = E.pathsForSeed(SEED, NP, solvedContext(E, A).totalYears), nMoves = A.actions.length;
// ---- 1. the option unset, and set ----
// S328F at 4 points, 200 paths, on the code before the option (f822e999: 03f2dad1043f20fd...); re-taken 12 Nov on the ceiling on the
// year's whole taxable income (ANSWERS.md section 5; D91, D93's unlock): a draw's ceiling stops short by the year's interest and
// dividends; with the ceiling's one function switched off the paths are the figure before (results-harvest-ceiling.txt)
const BEFORE = 'f2fe4e1e6d872dc30d28c27d7e943b96d84282c65b27f75a3842be01336d4e44';
const whole = run(A, pathsA);
{
  const B = solve('S328F', { chooserShortlist: 'order' }), dA = await digestOf(tablesOf(A)), dB = await digestOf(tablesOf(B));
  let msg = ''; try { solve('S328F', { chooserShortlist: 'structure' }); } catch (e) { msg = e.message; }
  ok(1, 'the option unset: the paths the code before it\'s, bit for bit; set: every table the same, the record names it, another width refused',
    hashOf(whole) === BEFORE && A.chooserShortlist === undefined && A.meta.chooserShortlist === undefined && dA === dB && B.chooserShortlist === 'order' && B.meta.chooserShortlist === 'order' && /^chooserShortlist structure/.test(msg),
    `outcomes ${hashOf(whole).slice(0, 16)} against ${BEFORE.slice(0, 16)}; tables ${dB.slice(0, 16)} against ${dA.slice(0, 16)}; refused: ${msg.slice(0, 50) || 'NOT refused'}`);
}
// ---- 2. a real shortlist, never what stops a decision ----
{
  resetStats(); set(A, 'order', 0); run(A, pathsA.slice(0, NREP)); set(A, null, 0); const st = { ...SHORTLIST.stats }, per = st.listed / st.decisions;
  resetStats(); const q = replay(A, pathsA.slice(0, NREP), [null, 0], ['order', 0]);
  ok(2, 'the list is a shortlist (shorter than the menu); where no listed move can be afforded the whole menu is scored, and the choice there is the whole menu\'s own',
    per > 0 && per < nMoves / 2 && q.fellBack > 0 && q.fellBackSame === q.fellBack,
    `of ${nMoves} moves, ${per.toFixed(1)} listed a decision; fell back at ${st.fallback} of ${st.decisions} decisions; in the replay ${q.fellBackSame} of ${q.fellBack} fallbacks choose as the whole menu`);
}
// ---- 3. planted: the list emptied ----
{
  SHORTLIST.plant = 'empty'; resetStats(); set(A, 'order', 0); const out = run(A, pathsA); set(A, null, 0); const st = { ...SHORTLIST.stats }; SHORTLIST.plant = '';
  ok(3, 'planted, the list emptied: every decision falls back, and every path is the whole menu\'s, bit for bit', st.decisions > 0 && st.fallback === st.decisions && st.listed === 0 && differ(out, whole) === 0, `${st.fallback} of ${st.decisions} decisions fell back; ${differ(out, whole)} of ${NP} paths differ`);
}
// ---- 4. the replay, and the stored moves left out ----
{
  const q = replay(A, pathsA.slice(0, NREP), [null, 0], ['order', 0]);
  SHORTLIST.plant = 'nobest'; const p = replay(A, pathsA.slice(0, NREP), [null, 0], ['order', 0]); SHORTLIST.plant = '';
  ok(4, 'the replay along the whole menu\'s path: planted, the cells\' stored moves left out of the list, more decisions give up over 0.01 points of score than unplanted', p.gaveUp > q.gaveUp && q.decisions > 0,
    `${q.decisions} decisions: the shortlist differs at ${q.differ}, giving up over 0.01 points at ${q.gaveUp}; planted, at ${p.differ} and ${p.gaveUp}`);
}
// ---- 5. the slice ----
{
  resetStats(); const q = replay(A, pathsA.slice(0, NREP), [null, MARGIN], ['order', MARGIN]), sliced = SHORTLIST.stats.sliced;
  SHORTLIST.plant = 'noslice'; const p = replay(A, pathsA.slice(0, NREP), [null, MARGIN], ['order', MARGIN]); SHORTLIST.plant = '';
  ok(5, 'the slice, with the tie-break above the cap on: the shortlist differs from the whole menu at no decision above the cap, and the slice acts; planted, the slice left out, it differs above the cap', q.above > 0 && sliced > 0 && q.differAbove === 0 && p.differAbove > 0,
    `${q.decisions} decisions, ${q.above} above the cap, the slice at ${sliced}; differing above the cap ${q.differAbove} (in all ${q.differ}); planted, ${p.differAbove} (in all ${p.differ})`);
}
// ---- 7. the forward run beside the engine, the shortlist and the tie-break on (the reviewer at stage A's read, MINOR 2) ----
{
  set(A, 'order', MARGIN);
  const sc = solvedContext(E, A), sub = pathsA.slice(0, 60); let differ7 = 0, worst = 0, alive = 0;
  for (const zs of sub) { const f = runPolicy(A, zs), e = runPath(E, sc, zs); if (f.survived !== e.survived) differ7++; else if (f.survived) { alive++; worst = Math.max(worst, Math.abs(f.terminal - e.terminalPot)); } }
  set(A, null, 0);
  ok(7, 'the forward run (runPolicy) and the engine in step with the shortlist and the tie-break on: the same paths survive, and each ends within a pound', differ7 === 0 && alive > 0 && worst <= 1, `${differ7} of ${sub.length} paths differ in survival; of ${alive} surviving in both, the largest gap at the end £${worst.toExponential(1)}`);
}
// ---- 6. --full: the known answer ----
if (FULL) {
  const t0 = Date.now(), r = solve('S116', {}, 45), sc = solvedContext(E, r), paths = E.pathsForSeed(99001, 1000, sc.totalYears);
  const surv = () => 100 * paths.filter(zs => runPath(E, sc, zs).survived).length / paths.length;
  const c0 = process.hrtime.bigint(), sWhole = surv(), c1 = process.hrtime.bigint(); set(r, 'order', 0); const sShort = surv(), c2 = process.hrtime.bigint(); set(r, null, 0);
  ok(6, 'the known answer, S116 at 45 points, 1,000 paths of seed 99001: survival under the shortlist within 0.5 points of the whole menu\'s', Math.abs(sShort - sWhole) <= 0.5 + 1e-9,
    `${sShort.toFixed(1)}% against ${sWhole.toFixed(1)}%; a path ${(Number(c2 - c1) / 1e9).toFixed(1)} ms against ${(Number(c1 - c0) / 1e9).toFixed(1)} ms (solved in ${((Number(c0) / 1e6 - t0) / 1000).toFixed(0)} s)`);
}
console.log(`\nchooser-shortlist: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
