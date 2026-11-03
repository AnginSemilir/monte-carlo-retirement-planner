/*
 * THE SOLVED PLAN'S FIGURES AT OTHER SETTINGS: THE DIAL'S LIVE LINE AND THE AGE DIAL (Part C Phase 10, items 3 and 4;
 * PART-C-WORDING.md section 3; B11). The full tier.
 *
 * Under the dial on the Config tab: the headline's figures at the plan's own setting, from the solve in hand; on request the
 * other settings solved in the background, nearest first, each keeping only its figures (src/SolverConfig.jsx DialLive,
 * src/solverClient.js startFigures).
 *
 * 1. The order: dialOrder gives the other settings by their distance along the dial from the plan's own, the lower first
 *    where two are as near (Low 1: 3, 6, 10; Medium 3: 1, 6, 10; High 6: 3, 10, 1; Very high 10: 6, 3, 1). Planted, the
 *    higher first on a tie is caught.
 * 2. atDial changes the dislike of cuts and nothing else: every setting's plan at the Low setting is the same plan (the key
 *    the line's figures are kept under), and the plan's own setting gives the plan back.
 * 3. The exact read: the first 2,000 paths of runs gathered to 5,000 give the figures of a run of 2,000 alone, field for
 *    field (headRuns), so the line at the plan's own setting reads the paths the other settings run, whatever the Strategy
 *    tab has run since; runs not from path 0 are refused.
 * 4. A setting's figures as its job gets them (its base restored from the store's record, cacheOf, then the setting solved on
 *    it) are the figures of the same setting solved in hand, on S126 at light settings, at Medium and at Low.
 * 5. The words, by case.
 * 6. The age dial (src/solverSettings.js ageOptions, atAge): the ages three either side of the plan's own, none at or before
 *    today's age, the nearest first and the earlier first where two are as near; none for a household already retired;
 *    atAge moves the retirement age alone, and every age's plan at age 0 is one plan (the key its figures are kept under).
 *    Planted, the later first on a tie is caught. On S188 (working) at light settings, an age's figures as its job gets them
 *    are the solve's of the plan at that age.
 *   node research/tests/solver-figures.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { solveForApp } from '../../src/solverApp.js';
import { APP_DIAL, dialOrder, atDial, dialBase, ageOptions, atAge, AGE_SPAN } from '../../src/solverSettings.js';
import { strategyRuns, joinRuns, strategySummary, strategyOf, headRuns } from '../../src/solverStrategy.js';
import { cacheOf } from '../../src/solverCache.js';
import { dialLineWords } from '../../src/solverWords.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ok  ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const plan0 = buildScenarios().find(s => s.id === 'S126').plan;
const LIGHT = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } }, SEED = 12345, N = 400;

console.log('=========== 1. THE ORDER ===========');
const WANT = { 1: [3, 6, 10], 3: [1, 6, 10], 6: [3, 10, 1], 10: [6, 3, 1] };
const orderCheck = f => APP_DIAL.filter(c => !same(f(c), WANT[c]));
{
  const bad = orderCheck(dialOrder);
  ok(bad.length === 0, `1. dialOrder: ${APP_DIAL.map(c => `${c}: ${dialOrder(c).join(', ')}`).join('; ')} (nearest along the dial, the lower first on a tie)`);
  // the plant: the higher first where two are as near (Medium and High each have two neighbours one step away)
  const tieHigh = c => { const i = APP_DIAL.indexOf(c); return APP_DIAL.map((x, j) => [x, Math.abs(j - i), j]).filter(([, d]) => d > 0).sort((a, b) => a[1] - b[1] || b[2] - a[2]).map(([x]) => x); };
  const caught = orderCheck(tieHigh);
  ok(caught.length > 0, `1. planted, the higher first on a tie is caught at ${caught.join(', ')} (${caught.map(c => `${c}: ${tieHigh(c).join(', ')}`).join('; ')})`);
}

console.log('=========== 2. THE PLAN AT EACH SETTING ===========');
{
  const p = { ...plan0, solver: { aims: { cuts: 3, estate: 'lower', raises: 'capped', riskConsent: true } } };
  const lows = APP_DIAL.map(x => JSON.stringify(atDial(atDial(p, x), 1)));
  ok(new Set(lows).size === 1 && atDial(p, 6).solver.aims.estate === 'lower' && atDial(p, 6).solver.aims.cuts === 6, '2. atDial moves the dislike of cuts alone; every setting\'s plan at Low is one plan (the line\'s figures are kept under it)');
  ok(same(atDial(p, 3), p) && same(atDial(p, 1), dialBase(p)), '2. the plan\'s own setting gives the plan back, and Low gives the base a setting is solved on');
}

console.log('=========== 3. THE EXACT READ ===========');
const t0 = Date.now();
const r1 = solveForApp(E, M, atDial(plan0, 1), LIGHT);
console.log(`      S126 at Low solved in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
{
  const whole = strategyRuns(E, r1, plan0, { seed: SEED, from: 0, to: N });
  const more = joinRuns([whole, strategyRuns(E, r1, plan0, { seed: SEED, from: N, to: 2 * N })]);
  ok(same(strategySummary(E, r1, headRuns(more, N)), strategySummary(E, r1, whole)), `3. the first ${N} paths of ${2 * N} give a run of ${N} alone, field for field`);
  ok(same(headRuns(whole, 2 * N), whole), '3. asked for more paths than were run, the runs are given whole');
  let refused = false; try { headRuns(strategyRuns(E, r1, plan0, { seed: SEED, from: 10, to: 20 }), 5); } catch (e) { refused = /path 0/.test(e.message); }
  ok(refused, '3. runs that do not start at path 0 are refused');
}

console.log('=========== 4. A SETTING\'S FIGURES AS ITS JOB GETS THEM ===========');
{
  const t1 = Date.now();
  const p3 = atDial(plan0, 3);
  const inHand = solveForApp(E, M, p3, LIGHT);                           // the setting chosen: the solve in hand (its base solved inside)
  const restored = solveForApp(E, M, atDial(plan0, 1), { ...LIGHT, restore: cacheOf(r1) });   // the job: the base from the store's record
  const job = solveForApp(E, M, p3, { ...LIGHT, base: restored });       // then the setting solved on it
  const a = strategyOf(E, inHand, p3, { trials: N, seed: SEED }), b = strategyOf(E, job, p3, { trials: N, seed: SEED });
  ok(same(a.headline, b.headline) && same(a.compare, b.compare), `4. Medium: the job's figures are the solve in hand's (survival ${a.headline.survival.toFixed(2)}%, start ${a.headline.startLevel}% of target; ${((Date.now() - t1) / 1000).toFixed(0)} s)`);
  const low = strategyOf(E, restored, atDial(plan0, 1), { trials: N, seed: SEED }), lowHand = strategyOf(E, r1, atDial(plan0, 1), { trials: N, seed: SEED });
  ok(same(low.headline, lowHand.headline), `4. Low: restored by its key, the figures are the solve's (survival ${low.headline.survival.toFixed(2)}%)`);
  ok(a.headline.startLevel >= low.headline.startLevel, `4. Medium starts at or above Low (${a.headline.startLevel}% against ${low.headline.startLevel}%): the dial's direction`);
}

console.log('=========== 5. THE WORDS ===========');
{
  const fmt = v => `£${Math.round(v).toLocaleString('en-GB')}`;
  const base = { startSpend: 24000, startLevel: 80, target: 30000, backYear: 2032, survival: 97.04 };
  ok(dialLineWords({ ...base, case: 'short' }, fmt) === 'start at £24,000 (80% of target), back at target by 2032; chance your money lasts 97%', `5. a dip: "${dialLineWords({ ...base, case: 'short' }, fmt)}"`);
  ok(dialLineWords({ ...base, case: 'never' }, fmt) === 'start at £24,000 (80% of target), below target on a typical run; chance your money lasts 97%', '5. never back: below target on a typical run');
  ok(dialLineWords({ ...base, startSpend: 30000, startLevel: 100, case: 'atTarget' }, fmt) === 'start at your full target, £30,000; chance your money lasts 97%', '5. at the target: no dip to speak of');
}

console.log('=========== 6. THE AGE DIAL ===========');
{
  const p = { demographics: { retireAgeSelf: 60 } };
  const ao = ageOptions(p, 55.4);
  ok(ao && ao.ages.join(',') === '57,58,59,60,61,62,63' && ao.order.join(',') === '59,61,58,62,57,63', `6. retiring at 60, aged 55: the ages ${ao && ao.ages.join(', ')}, solved in the order ${ao && ao.order.join(', ')} (${AGE_SPAN} either side, the nearest first, the earlier first)`);
  const near = ageOptions(p, 58.2);
  ok(near && near.ages[0] === 59 && near.order.join(',') === '59,61,62,63', `6. aged 58: none at or before today's age (${near && near.ages.join(', ')})`);
  ok(ageOptions({ demographics: { retireAgeSelf: 60 } }, 61) === null && ageOptions({ demographics: {} }, 50) === null, '6. already retired, or no retirement age: no age dial');
  const lateFirst = (q, now) => { const o = ageOptions(q, now); return o.order.slice().sort((a, b) => Math.abs(a - 60) - Math.abs(b - 60) || b - a); };
  ok(lateFirst(p, 55.4).join(',') !== ao.order.join(','), `6. planted, the later first on a tie is caught (${lateFirst(p, 55.4).join(', ')})`);
  const q = { ...p, solver: { aims: { cuts: 3 } }, demographics: { retireAgeSelf: 60, ageSelf: 55 } };
  ok(atAge(q, 62).demographics.retireAgeSelf === 62 && atAge(q, 62).demographics.ageSelf === 55 && atAge(q, 62).solver.aims.cuts === 3 && JSON.stringify(atAge(atAge(q, 62), 0)) === JSON.stringify(atAge(q, 0)), '6. atAge moves the retirement age alone; every age\'s plan at age 0 is one plan');
  const p188 = buildScenarios().find(x => x.id === 'S188').plan, own = Number(p188.demographics.retireAgeSelf), a = own + 1, t2 = Date.now();
  const r = solveForApp(E, M, atAge(p188, a), LIGHT), job = solveForApp(E, M, atAge(p188, a), { ...LIGHT });
  const f1 = strategyOf(E, r, atAge(p188, a), { trials: N, seed: SEED }).headline, f2 = strategyOf(E, job, atAge(p188, a), { trials: N, seed: SEED }).headline;
  ok(JSON.stringify(f1) === JSON.stringify(f2), `6. S188 retiring at ${a} (its plan ${own}): the job's figures are the solve's (survival ${f1.survival.toFixed(2)}%, start ${f1.startLevel}%; ${((Date.now() - t2) / 1000).toFixed(0)} s)`);
}

console.log(fail ? `\nFAILED: ${fail} of ${pass + fail}` : `\nALL PASS: ${pass}`);
process.exit(fail ? 1 : 0);
