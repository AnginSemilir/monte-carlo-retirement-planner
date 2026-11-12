/*
 * A DECISION THE PAGES SHOW IS MADE ON THE WHOLE MENU (D90; src/solver/solve.js wholeMenu, src/solverStrategy.js
 * shownPolicy). The chooser's shortlist (`chooserShortlist: 'order'`, off unless set, not in the candidate) is an
 * approximation for the paths that only count. Its own note said "never for a decision the pages show" and nothing kept it:
 * this year's actions, the next years' rows, the ledger, the history check and the rule of thumb all took their moves from
 * the same chooser. Now each of them asks through shownPolicy, and a decision made inside wholeMenu scores every move. The
 * app's solve at 4 points on the light lattice (solveForApp), seed 99004; S328F as Phase 4 landed it, as
 * chooser-shortlist.test.mjs takes it:
 * and for the skips' runs S116 (a bridge year: its first move has parts to skip). The whole menu it is held to is the whole
 * menu with the same tie-break above the cap (the shortlist was read with it, and it changes moves above the cap by itself):
 *   1. no shortlist on the solve: the guard changes nothing. The ledger's moves are those of the solve's own policy stepped
 *      by the engine with no guard, year for year, and nothing is counted as held to the whole menu;
 *   2. the shortlist on (with the tie-break above the cap, as it was read): what each page shows is what it shows with the
 *      shortlist off: this year's move, its position and its skips (firstMove, skipsOf), the next ten years' rows and the
 *      typical run on one path (aheadOf), the ledger at expected returns and on historical start years (rowsOf), and the
 *      decisions the rule of thumb is learnt from (decisionsOf); none of those decisions took a shortlist (counted);
 *   3. the paths that are counted still take it: the strategy's runs and the skips' runs make their decisions on the
 *      shortlist, none held to the whole menu;
 *   4. the typical run where the counted paths took the shortlist: the levels of the whole menu's own run of the path the
 *      rows are shown on, whichever path the counted runs pick;
 *   5. planted ('shown': a decision inside wholeMenu takes the shortlist all the same): what the pages show differs from
 *      the whole menu's, and their decisions are counted as shortlisted;
 *   6. planted in the page's own policy (the history check read from a policy that does not ask through wholeMenu): its
 *      moves differ from the whole menu's; read through shownPolicy they are the whole menu's.
 * Beside the checks, not deciding: whether the first year's move the counted paths take is the move the page shows.
 *   node research/tests/shortlist-shown.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { SHORTLIST, wholeMenu } from '../../src/solver/solve.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext, runPath, firstMove, skipsOf, skipRuns, aheadOf, rowsOf, strategyRuns, partsOf, shownPolicy } from '../../src/solverStrategy.js';
import { decisionsOf } from '../../src/solverDistil.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readPanel } from '../solver/phase4-panel.mjs';

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, SEED = 99004, NRUN = 60, NFIT = 30, MARGIN = 1e-4;
const STARTS = [1929, 1937, 1946, 1955, 1962, 1966, 1969, 1973, 1982, 1990];
const ID = 'S328F', plan = readPanel().find(x => x.id === ID).plan;
// the chooser's switches on a solved plan, as the solve's options would set them (chooser-shortlist.test.mjs's own)
const set = (r, width, tie) => { if (width) r.chooserShortlist = width; else delete r.chooserShortlist; for (const x of [r, ...(r.worlds || [])]) { if (tie) x.tieAboveCap = tie; else delete x.tieAboveCap; } };
const resetStats = () => { for (const k of Object.keys(SHORTLIST.stats)) SHORTLIST.stats[k] = 0; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log(`shortlist-shown: a decision the pages show is made on the whole menu, ${ID}, seed ${SEED}`);
const A = solveForApp(E, M, plan, { points: 4, research: { ...LIGHT } });
/* what the pages show, on the solve as its switches stand: `runs` the counted runs the next years' path is picked from */
function shownOf(r, runs) {
  const f = firstMove(E, r), sk = skipsOf(E, r);
  return {
    first: { index: f.mv.index, s: Array.from(f.s), held: f.held },
    skips: { ai0: sk.ai0, p0: sk.p0, list: sk.list },
    ahead: (a => ({ path: a.path, rows: a.rows, typical: Array.from(a.typical) }))(aheadOf(E, r, plan, runs, { years: 10 })),
    ledger: rowsOf(E, r, 'expected').parts,
    history: STARTS.map(y => rowsOf(E, r, { historical: true, startYear: y }).parts),
    fit: decisionsOf(E, r, { seed: SEED + 1, n: NFIT })
  };
}
const PARTS = ['first', 'skips', 'ahead', 'ledger', 'history', 'fit'];
const differing = (X, W) => PARTS.filter(k => !same(X[k], W[k]));
const count = v => (Array.isArray(v) ? v.reduce((n, x) => n + count(x), 0) : v ? 1 : 0);

// ---- 1. no shortlist: the guard changes nothing ----
set(A, null, MARGIN);
const runsW = strategyRuns(E, A, plan, { seed: SEED, to: NRUN });
resetStats();
const W = shownOf(A, runsW), st1 = { ...SHORTLIST.stats };
{
  // the ledger's moves by the solve's own policy, no guard anywhere: the engine stepped as rowsOf steps it
  const sc = solvedContext(E, A), base = sc.policyOverride, moves = [];
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) { const mv = base.choose(st, t, held); moves[t] = mv ? partsOf(A.actions[mv.index], A.c.acts[mv.index]) : null; return mv; } } };
  const state = E.freshState(ctx); for (let t = 0; t <= ctx.totalYears; t++) E.stepYear(ctx, state, t, 'expected');
  const plain = W.ledger.map((_, t) => moves[t] || null);
  ok(1, 'no shortlist on the solve: the ledger\'s moves are the solve\'s own policy\'s, year for year, and no decision is counted as held to the whole menu',
    same(plain, W.ledger) && count(W.ledger) > 0 && st1.shown === 0 && st1.decisions === 0, `${count(W.ledger)} years with a move, ${W.ledger.filter((p, t) => !same(p, plain[t])).length} differ; counted as held ${st1.shown}`);
}

// ---- 2. the shortlist on: the pages show what they show with it off ----
set(A, 'order', MARGIN);
resetStats();
const S = shownOf(A, runsW), st2 = { ...SHORTLIST.stats };
ok(2, 'the shortlist on: this year\'s move and its skips, the next ten years and the typical run, the ledger, the history check and the rule of thumb\'s decisions are the whole menu\'s; none of their decisions took a shortlist',
  differing(S, W).length === 0 && st2.decisions === 0 && st2.shown > 0 && W.fit.length > 0 && count(W.history) > 0,
  `differing: ${differing(S, W).join(', ') || 'none'}; ${st2.shown} decisions held to the whole menu, ${st2.decisions} on a shortlist; ${W.fit.length} decisions learnt from, ${count(W.history)} years of history`);

// ---- 3. the counted paths still take it ----
resetStats();
const runsS = strategyRuns(E, A, plan, { seed: SEED, to: NRUN }), st3a = { ...SHORTLIST.stats };
// the skips' runs, on a household whose first move has a part to skip: the first year forced, the years after counted
const B = solveForApp(E, M, E.normalizePlan(buildScenarios().find(x => x.id === 'S116').plan), { points: 4, research: { ...LIGHT } });
set(B, null, MARGIN); const skW = skipsOf(E, B), firstW = firstMove(E, B).mv.index;
set(B, 'order', MARGIN); const skS = skipsOf(E, B), nSkips = skS.list.filter(x => x.skip !== null).length;
resetStats(); const firstS = firstMove(E, B).mv.index, stF = { ...SHORTLIST.stats };
resetStats(); skipRuns(E, B, { seed: SEED, from: 0, to: 20 }, skS); const st3b = { ...SHORTLIST.stats }; set(B, null, 0);
{
  const moved = runsS.solved.filter((r, k) => r.terminalPot !== runsW.solved[k].terminalPot || r.survived !== runsW.solved[k].survived).length;
  ok(3, 'the paths that are counted take the shortlist: the strategy\'s runs and the skips\' runs decide on it, none held to the whole menu',
    st3a.decisions > 0 && st3a.shown === 0 && nSkips > 0 && st3b.decisions > 0 && st3b.shown === 0 && firstS === firstW && same(skS.list, skW.list) && stF.decisions === 0,
    `the strategy's runs ${st3a.decisions} decisions on a shortlist (${st3a.shown} held), ${moved} of ${NRUN} paths end otherwise than on the whole menu; S116's ${nSkips} skips (the whole menu's own, from the whole menu's first move ${firstS}) run ${st3b.decisions} decisions on a shortlist (${st3b.shown} held)`);
}

// ---- 4. the typical run where the counted paths took the shortlist ----
{
  const a = aheadOf(E, A, plan, runsS, { years: 10 }), sc = solvedContext(E, A), zs = E.pathsForSeed(SEED, a.path + 1, sc.totalYears)[a.path];
  set(A, null, MARGIN); const whole = runPath(E, solvedContext(E, A), zs), b = aheadOf(E, A, plan, { ...runsW, solved: runsS.solved }, { years: 10 }); set(A, 'order', MARGIN);
  ok(4, 'the typical run where the counted paths took the shortlist: the levels of the whole menu\'s own run of the path the rows are shown on, and the rows the whole menu\'s',
    same(Array.from(a.typical), Array.from(whole.level)) && same(a.rows, b.rows) && a.path === b.path, `path ${a.path}: ${Array.from(a.typical).filter((v, t) => v !== whole.level[t]).length} of ${whole.level.length} years' levels differ; the counted run's own levels differ from them in ${Array.from(runsS.solved[a.path].level).filter((v, t) => v !== whole.level[t]).length}`);
}

// ---- 5. planted ----
{
  SHORTLIST.plant = 'shown'; resetStats();
  const P = shownOf(A, runsW), st = { ...SHORTLIST.stats }; SHORTLIST.plant = '';
  ok(5, 'planted, a decision inside wholeMenu takes the shortlist all the same: what the pages show differs from the whole menu\'s, its decisions counted as shortlisted',
    differing(P, W).length > 0 && st.decisions > 0 && st.shown === 0, `differing: ${differing(P, W).join(', ') || 'NONE'}; ${st.decisions} decisions on a shortlist`);
  // the same fault in the page's own policy: the ledger read from a policy that does not ask through wholeMenu
  const sc = solvedContext(E, A), read = pol => { const moves = [], ctx = { ...sc, policyOverride: { ...pol, choose(st0, t, held) { const mv = pol.choose(st0, t, held); moves[t] = mv ? partsOf(A.actions[mv.index], A.c.acts[mv.index]) : null; return mv; } } }; return STARTS.map(y => { moves.length = 0; const state = E.freshState(ctx); for (let t = 0; t <= ctx.totalYears; t++) E.stepYear(ctx, state, t, { historical: true, startYear: y }); return Array.from({ length: ctx.totalYears + 1 }, (_, t) => moves[t] || null); }); };
  const plain = read(sc.policyOverride), guarded = read(shownPolicy(sc.policyOverride));
  ok(6, 'planted in the page\'s own policy, the ledger read without the guard: its moves differ from the whole menu\'s; read through shownPolicy they are the whole menu\'s',
    !same(plain, W.history) && same(guarded, W.history), `${plain.reduce((n, p, i) => n + p.filter((x, t) => !same(x, W.history[i][t])).length, 0)} of ${count(W.history)} years' moves differ without the guard, ${guarded.reduce((n, p, i) => n + p.filter((x, t) => !same(x, W.history[i][t])).length, 0)} with it`);
}

// ---- beside the checks: the first year's move the counted paths take ----
{
  const sc = solvedContext(E, A), base = sc.policyOverride; let counted = null;
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) { const mv = base.choose(st, t, held); if (t === 0 && counted === null) counted = mv.index; return mv; } } };
  E.runTrial(ctx, E.pathsForSeed(1, 1, sc.totalYears)[0]);
  const nested = wholeMenu(() => wholeMenu(() => SHORTLIST.whole)), after = SHORTLIST.whole;
  console.log(`  beside: the first year's move the counted paths take is move ${counted}, the page's move ${W.first.index}: ${counted === W.first.index ? 'the same' : 'ANOTHER (the survival counted is of a first year the page does not show)'}; wholeMenu nests (${nested}) and leaves nothing set (${after})`);
  if (after !== 0 || nested !== 2) { console.log('  FAIL wholeMenu left its count set'); failed++; }
}
set(A, null, 0);
console.log(`\nshortlist-shown: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
