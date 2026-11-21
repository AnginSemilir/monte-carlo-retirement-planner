/*
 * A COUPLE'S DECISIONS THE PAGES SHOW ARE MADE ON THE WHOLE MENU (D90, for a couple; found 20 Nov while porting step 8,
 * research/solver/DECISIONS-PENDING.md: shortlist-shown.test.mjs holds a single's views to it, and nothing held a couple's).
 * Under the speed mode (`chooserShortlist: 'order'`, src/solverSettings.js speedOptions) each table of a couple carries the
 * chooser's shortlist, an approximation for the paths that only count: its two people's tables on today's route, and the
 * household's one table since D135. The pages show this year's move and its skips (src/solverCouple.js coupleFirstMove,
 * coupleSkipsOf and householdSkipsOf), the next ten years (coupleAheadOf) and the ledger and the history check
 * (coupleRowsOf), so those are decisions the pages show.
 * The setup, at light settings (4 points on the light lattice, as shortlist-shown.test.mjs solves), each assembled as the
 * page assembles it:
 *   - S069 held 90/10 on today's route (couplePlans on the pots' share, each person's table with their partner's age,
 *     assembleCouple with the couples' joint move);
 *   - S025-own from step 8's panel as one household (householdCut at 'pensionsPA', its table inside the cut's bands,
 *     householdSolved).
 * The shortlist is switched on the solved tables as the solve's option would set it (shortlist-shown.test.mjs's way).
 * The checks:
 *   1. no shortlist on the tables: the views as they stand, no decision counted as held to the whole menu or as taken on a
 *      shortlist;
 *   2. the shortlist on: what each page shows is what it shows with it off, and none of those decisions took a shortlist:
 *      this year's move and its skips, the next ten years, the ledger at expected returns, and the history check on ten
 *      start years;
 *   3. the paths that are counted still take the shortlist: the strategy's runs and the skips' runs decide on it, none held
 *      to the whole menu;
 *   4. the typical run where the counted paths took a shortlist: the levels of the whole menu's own run of the path the
 *      rows are shown on. The counted runs here take a shortlist that leaves out the cells' own moves (SHORTLIST.plant
 *      'nobest'), so on each unit the counted run of that path parts from the whole menu's own and the check can see a
 *      typical run taken from it. On the 'order' shortlist a household's agreed with the whole menu's on every unit
 *      scanned, so the check could not fail on the household (the reviewer on D135's change of default, second round,
 *      MINOR 1).
 * Plants (--planted; each wants exactly the checks named):
 *   - 'noshown' (src/solverCouple.js: the views read the couple's policy as it is, not through wholeMenu, as before the fix):
 *     checks 2 and 4;
 *   - 'shown' (src/solver/solve.js SHORTLIST.plant: a decision inside wholeMenu takes the shortlist all the same): checks 2
 *     and 4.
 *   node research/tests/couple-shown.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { SHORTLIST } from '../../src/solver/solve.js';
import { solveForApp } from '../../src/solverApp.js';
import { bandsAt } from '../../src/solver/household.js';
import { couplePlans, assembleCouple, householdCut, householdSolved, coupleFirstMove, coupleSkipsOf, coupleSkipRuns, coupleAheadOf, coupleRowsOf, jointParts, isHousehold, PLANT as COUPLE_PLANT } from '../../src/solverCouple.js';
import { solvedContext, runPath, strategyRuns } from '../../src/solverStrategy.js';
import { APP_COUPLE, appJoint } from '../../src/solverSettings.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readHspPanel } from '../solver/household-hsp-panel.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['noshown', ['2', '4']], ['shown', ['2', '4']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_SHOWN_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...new Set([...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]))], okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted exactly ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
const PLANTED = process.env.COUPLE_SHOWN_PLANT || '';
if (PLANTED === 'noshown') COUPLE_PLANT.rule = PLANTED;

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const SEED = 99004, NRUN = 60, NSKIP = 20;
const STARTS = [1929, 1937, 1946, 1955, 1962, 1966, 1969, 1973, 1982, 1990];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const count = v => (Array.isArray(v) ? v.reduce((n, x) => n + count(x), 0) : v ? 1 : 0);
const resetStats = () => { for (const k of Object.keys(SHORTLIST.stats)) SHORTLIST.stats[k] = 0; };
const stats = () => ({ ...SHORTLIST.stats });

// the two couples, each assembled as the page assembles it
const lib = buildScenarios();
const reheld = (plan, f) => { const re = JSON.parse(JSON.stringify(plan)), tot = {};
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); tot[k] = (tot[k] || 0) + (Number(a.balance) || 0); }
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); if (/_self$/.test(a.id)) a.balance = tot[k] * f; else if (/_part$/.test(a.id)) a.balance = tot[k] * (1 - f); }
  return re; };
const pairs = [];
{ const plan = reheld(lib.find(s => s.id === 'S069').plan, 0.9), cut = couplePlans(E, plan, { shareRule: APP_COUPLE.shareRule });
  const one = w => solveForApp(E, M, cut.plans[w], { ...LIGHT, ageWith: cut.ageWith[w] });
  const cp = assembleCouple(E, M, cut.household, { self: one('self'), part: one('part') }, { shareRule: cut.shareRule, joint: appJoint(), solvedOn: { self: { plan: cut.plans.self, ageWith: cut.ageWith.self }, part: { plan: cut.plans.part, ageWith: cut.ageWith.part } } });
  pairs.push({ id: 'S069 held 90/10, today\'s route', plan, cp, tables: [cp.tables.self, cp.tables.part] }); }
{ const plan = readHspPanel().find(u => u.id === 'S025-own').plan, cut = householdCut(E, M, plan, 'pensionsPA'), b = cut.bands, j = appJoint();
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...LIGHT, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: 'pensionsPA', topK: 3, tieJoint: j.tieJoint, holdPast: j.holdPast }, { plan: cut.hplan, r: H });
  pairs.push({ id: 'S025-own as one household', plan, cp, tables: [cp.H] }); }
// the chooser's shortlist on a couple's tables, as the solve's option would set it on each (shortlist-shown.test.mjs's set)
const setShort = (P, width) => { for (const r of P.tables) { if (width) r.chooserShortlist = width; else delete r.chooserShortlist; } };

/* what the pages show for a couple, on its tables as their switches stand; `runs` the counted runs the next years' path is
   picked from */
function shownOf(P, runs) {
  const f = coupleFirstMove(E, P.cp), sk = coupleSkipsOf(E, P.cp);
  return {
    first: { parts: jointParts(f.joint), ia: f.joint.ia, ib: f.joint.ib },
    skips: sk.list.map(x => ({ who: x.who, part: x.part, value: x.value, joint: x.joint ? jointParts(x.joint) : null })),
    ahead: (a => ({ path: a.path, rows: a.rows, typical: Array.from(a.typical) }))(coupleAheadOf(E, P.cp, P.plan, runs, { years: 10 })),
    ledger: coupleRowsOf(E, P.cp, 'expected').parts,
    history: STARTS.map(y => coupleRowsOf(E, P.cp, { historical: true, startYear: y }).parts)
  };
}
const PARTS = ['first', 'skips', 'ahead', 'ledger', 'history'];
const differing = (X, W) => PARTS.filter(k => !same(X[k], W[k]));
if (PLANTED === 'shown') SHORTLIST.plant = 'shown';

const R = [];
for (const P of pairs) {
  // 1. no shortlist
  setShort(P, null);
  const runsW = strategyRuns(E, P.cp, P.plan, { seed: SEED, to: NRUN });
  resetStats(); const W = shownOf(P, runsW), st1 = stats();
  // 2. the shortlist on, the same counted runs
  setShort(P, 'order');
  resetStats(); const S = shownOf(P, runsW), st2 = stats();
  // 3. the counted paths: the strategy's runs and the skips' runs
  resetStats(); const runsS = strategyRuns(E, P.cp, P.plan, { seed: SEED, to: NRUN }), st3a = stats();
  const sk = coupleSkipsOf(E, P.cp); resetStats(); coupleSkipRuns(E, P.cp, { seed: SEED, from: 0, to: NSKIP }, sk); const st3b = stats();
  const nSkips = sk.list.filter(x => x.joint).length, moved = runsS.solved.filter((r, k) => r.terminalPot !== runsW.solved[k].terminalPot || r.survived !== runsW.solved[k].survived).length;
  // 4. the typical run where the counted paths took a shortlist, here one without the cells' own moves ('nobest'), so the
  // counted run of the path the rows are shown on parts from the whole menu's own: the typical shown is the whole menu's
  const was = SHORTLIST.plant; SHORTLIST.plant = 'nobest'; const runsN = strategyRuns(E, P.cp, P.plan, { seed: SEED, to: NRUN }); SHORTLIST.plant = was;
  const a = coupleAheadOf(E, P.cp, P.plan, runsN, { years: 10 }), sc = solvedContext(E, P.cp), zs = E.pathsForSeed(SEED, a.path + 1, sc.totalYears)[a.path];
  setShort(P, null); const whole = runPath(E, solvedContext(E, P.cp), Float64Array.from(zs)); setShort(P, 'order');
  const countedDiff = Array.from(runsN.solved[a.path].level).filter((v, t) => v !== whole.level[t]).length;
  R.push({ P, W, S, st1, st2, st3a, st3b, nSkips, moved, a, whole, countedDiff });
  setShort(P, null);
}
SHORTLIST.plant = '';

ok('1. no shortlist on a couple\'s tables (today\'s route and a household): no decision the views make counted as held to the whole menu or as taken on a shortlist',
  R.every(r => r.st1.shown === 0 && r.st1.decisions === 0 && count(r.W.ledger) > 0 && count(r.W.history) > 0),
  R.map(r => `${r.P.id}: ${count(r.W.ledger)} years in the ledger, ${count(r.W.history)} in the history check; held ${r.st1.shown}, on a shortlist ${r.st1.decisions}`).join('; '));
ok('2. the shortlist on: this year\'s move and its skips, the next ten years, the ledger and the history check are the whole menu\'s, none of their decisions on a shortlist',
  R.every(r => differing(r.S, r.W).length === 0 && r.st2.decisions === 0 && r.st2.shown > 0),
  R.map(r => `${r.P.id}: differing ${differing(r.S, r.W).join(', ') || 'none'}; ${r.st2.shown} decisions held to the whole menu, ${r.st2.decisions} on a shortlist`).join('; '));
ok('3. the paths that are counted take the shortlist: the strategy\'s runs and the skips\' runs decide on it, none held to the whole menu',
  R.every(r => r.st3a.decisions > 0 && r.st3a.shown === 0 && (r.nSkips === 0 || (r.st3b.decisions > 0 && r.st3b.shown === 0))) && R.some(r => r.nSkips > 0),
  R.map(r => `${r.P.id}: the strategy's runs ${r.st3a.decisions} decisions on a shortlist (${r.st3a.shown} held), ${r.moved} of ${NRUN} paths end otherwise; ${r.nSkips} skips run ${r.st3b.decisions} decisions on a shortlist (${r.st3b.shown} held)`).join('; '));
ok('4. the typical run where the counted paths took a shortlist (one without the cells\' own moves, so the counted run parts from the whole menu\'s on every unit): the levels of the whole menu\'s own run of the path the rows are shown on',
  R.every(r => same(r.a.typical, Array.from(r.whole.level)) && r.countedDiff > 0),
  R.map(r => `${r.P.id}: path ${r.a.path}, the typical shown differs from the whole menu's own in ${r.a.typical.filter((v, t) => v !== r.whole.level[t]).length} of ${r.whole.level.length} years, the counted run in ${r.countedDiff}`).join('; '));
console.log(`${R.map(r => `${r.P.id}: ${isHousehold(r.P.cp) ? 'a household' : 'a couple'}`).join('; ')}`);
console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
