/*
 * THE COUPLES' DEFAULT AND THE GUARD (D99, 14 Nov: item 6's stage C read once, PASS, research/solver/results-couples-share.txt;
 * the maintainer's D97 (1)). By the registration (research/solver/registrations/couples-share.md, Outcomes) a PASS makes
 * `shareRule: 'pots'` the couples' default and lifts M4's guard for couples whose elder holds more than 60% and at most 90% of
 * the pots, and D97 (1) runs couples under the opt-in; "for what the panel tested", every couple of which had its elder
 * entered first (the deep review of 14 Nov: the joint move weighs both estates at the first person's table's weight). Since D143
 * (23 Nov: the registered test of the guard's own units, registrations/couples-open.md, read once, Y, E, S and G each OPEN on
 * the household route; the maintainer's go, under its unlock) a couple the guard kept off for its holdings or for the age gap
 * with other taxable income is handed to the solver on the household route alone where the household plan takes its plan's
 * shape. This holds the code to that and to STATE.md's decided-defaults block:
 *   1. the decided-defaults block's `couples` entry is the code's: the switch on (src/couplesSwitch.js COUPLES), the couples'
 *      share rule (src/solverSettings.js APP_COUPLE), the band (COUPLE_BAND), the elder's limit (ELDER_UP_TO), the elder
 *      entered first (ELDER_FIRST), the swap of a couple whose elder is entered second (SWAP_ELDER, D104 (1)), the couples'
 *      joint move (APP_COUPLE's tieJoint, tieLook and holdPast, D108: TIE-C2's LOOKHOLD), the age gap past which a couple
 *      with other taxable income keeps the app's rules (DB_GAP_UP_TO, D128) and the household plan's form (APP_COUPLE's
 *      household, D134 (1) and D135: step 8's HSPA, 'pensionsPA'), a couple's solves keeping the savings split off (D138:
 *      src/solverApp.js solveForApp drops it from a solve with a partner's age; the unlock of 22 Nov, D140), read from two
 *      light solves of S188, a single who works and saves: without a partner's age the split on, with one off, the
 *      household route's classes opened (src/couplesSwitch.js HOUSEHOLD_OPEN, D143: Y, E, S and G, each on), and the shapes
 *      the household plan takes since step 4's change of default (APP_COUPLE.takeShapes, D145: 'growth', 'cashisa' and
 *      'year0'), the guard's HOUSEHOLD_TAKES the same three; a block without the entry, with another rule, without the joint
 *      move, without the gap, without the household, without the split's line, without the opened classes or with one of them
 *      shut, or without the taken shapes or with one of them left out, fails it;
 *   2. the guard (coupleSolverOn): over the library's 210 couples, each re-held at twelve shares of its first person's from 5%
 *      to 95% (every wrapper alike), with their ages as entered, swapped (the first person the younger), the same, and the
 *      partner's age left blank, and as entered with the partner's pension at another risk from the first person's (a shape
 *      the household plan refuses): the guard before D143 (the plant 'noopen', the rollback) on exactly where the first
 *      person holds 40% to 60% of the pots, or the first person is the elder by the engine's own reading of their ages
 *      (App.jsx buildContext's ageSelf0 and agePart0) and holds more than 60% and at most 90%, or, with the swap on
 *      (SWAP_ELDER, D104 (1)), the partner is the elder and holds that much, its `why` 'uneven' everywhere else; and since
 *      D143 a couple it kept off opened for its reason (S the same age, E the elder holding more than 90%, Y the younger
 *      holding more: each of HOUSEHOLD_OPEN's classes) where the household is solved elder first (entered so, the same age,
 *      or mirrored with the swap on): on the household route alone (`route` 'household', `lifted` its reasons) where the
 *      household plan takes its plan's shape (householdShapeOf, held to householdPlanFor by couple-shape.test.mjs, and here
 *      by the household cut the page makes, src/solverCouple.js householdCut on the plan or its mirror: every couple the
 *      guard opens taken), and 'shape' with the refusal where it does not; each couple the guard before D143 ran run as
 *      before, a refused shape inside it on today's route, with no route named; swapped (`swap`) exactly where it is on and
 *      its elder is entered second; and 'off' with the switch off;
 *   3. the page's solve of a couple (src/solverClient.js startSolve, its workers in-process stand-ins that record what each is
 *      asked): by default (D134 (1), D135) a couple is solved as one household: its plan cut at the couples' default form
 *      ('household-plan', 'pensionsPA'), its one table solved in the slot 'household' inside the cut's bands, and the
 *      household assembled with the setting the default names (the form and the even split, which move its move, and the
 *      top three, the tie-break and the hold, passed as step 8's arm passed them), the job's record naming the form, the
 *      cut's k and the even split, no person's table solved and no couple assembled (the household's route itself, its
 *      parts, its store and its read-back: household-client.test.mjs); today's
 *      route under the option that names it, `household: null`: a couple held 90/10 is cut and assembled on the pots' share,
 *      each person's plan cut on 90% and 10% of the household's spending, the job's record naming 'pots' and 0.9; a rule the
 *      caller names ('half') is kept; and the solver's own default stays the half share (src/solverCouple.js couplePlans
 *      unasked), the app's default living in the app's settings as the candidate's do; and the couple is assembled with the
 *      couples' joint move (D108: appJoint, the job's record naming it), a named share rule keeping it and a joint move the
 *      caller names (none) kept (the parts that assemble the couple too, in a split solve: couple-split.test.mjs check 1);
 *   4. what the page tells a user about couples follows the switches (the reviewer on D99, finding 1): the solver's coverage
 *      list (src/solverApproximations.js, the coverage card and the documentation) says which couples it plans for and which
 *      keep the app's rules, with couples on and the household route's classes open (D143): every couple but one whose plan
 *      the household plan cannot take, each of householdShapeOf's refusals it still makes named in its order and none of the
 *      shapes it takes since step 4's change of default (D145; the plant 'beforetake', the line before it naming all seven),
 *      kept off where the guard before D143
 *      kept it off (outside 40% to 60% and the older partner's 90%, or more than three years apart with other taxable income:
 *      the words held to ELDER_UP_TO and DB_GAP_UP_TO), and with the swap off a couple whose older partner is entered second
 *      held to that guard; with the classes shut (the plant 'beforeopen'), the line before D143: the older partner holding up
 *      to 90% with the swap on, the older partner entered first with it off, and either way not a couple more than three years
 *      apart with other taxable income (D128); HOUSEHOLD_OPEN all on or all off, the words saying one or the other; with the
 *      household default (APP_COUPLE's household, D135), how it plans a couple, one plan for the money the two hold and each
 *      of them planned apart where one plan cannot hold their plan (src/solverApproximations.js HOUSEHOLD_SENTENCE), in every
 *      line with couples on; with couples off (the rollback), the line before D99; eight lines each way;
 *   5. a couple's cut gives each person what the couple's own run reads (the reviewer on D99, finding 4): over 30 of the
 *      library's couples, with each person's age, each retirement age or the plan's end age left blank, the ages as text, or
 *      the end age at the first person's age, each person's plan (src/solverCouple.js couplePlans) has the age today, the
 *      retirement age, the salary, the state pension and the horizon the household's context gives that person;
 *   6. a couple whose partner would pass 120 before the plan ends keeps the app's rules (the reviewer on D99, second round,
 *      MINOR 1: a person's table cannot run past 120, so the cut would give that partner a shorter horizon and the figures
 *      fail): over 30 of the library's couples, each end age from 95 to 120 and the partner from their own age to 35 years
 *      older, the guard 'ages' exactly where the engine's own ages put the partner past 120 by the plan's end, but for a
 *      couple only the household route's classes open whose shape the household plan refuses, 'shape' (D143: ending the plan
 *      earlier would not bring it in), the answer whole as check 2 derives it; and every couple the guard runs cut to the
 *      couple's horizon, for both people on today's route and for the household on the household route (the plan the page
 *      cuts, its mirror where swapped); the reviewer's two cases among them;
 *   7. the client reads back the joint move each assembly of the couple carries (the reviewer on D109's change of default,
 *      MINOR 1: a worker dropping it was caught nowhere): on today's route (`household: null`, check 3's option), a stand-in
 *      worker that assembles the couple without the joint move asked for, replying its record as coupleMeta would, has the
 *      job refused with the client's reason; one that keeps it solves (the page's own worker under the plant 'workernotie':
 *      solver-planner-ui.cjs check 19; the household's setting read back the same way: household-client.test.mjs check 4);
 *   8. a couple more than three years apart with other taxable income keeps the app's rules (D128; step 5's shapes, research/
 *      solver/results-shapes-beside.txt, EXPLORATORY: the couples' default below the app's rules on three couples 8 or 12
 *      years apart with a DB pension, entered as other taxable income): over 30 of the library's couples, the partner's age
 *      moved to 0, 2, 3, 3.5, 4, 8, 12 and 22 years either side of the first person's (22 older with the plan ending at 100,
 *      past the age cap), each with one of eleven incomes (none; other taxable income, the first person's or the partner's,
 *      as the share rules' DB pension, £1, or its amount as text; the
 *      same of nought or blank; earnings; tax-free income; a kind the engine does not know, read as other taxable, and one
 *      whose old taxTreatment says tax-free), and re-held at five shares, the guard's answer is the one the engine's own
 *      reading of the plan gives (App.jsx buildContext: each age today, each income's amount, whether it is taxable and
 *      whether it is earnings): past the age cap 'gapincome' where the holdings are inside the guard and the gap with such an
 *      income would keep it off all the same (the reviewer on D128, MINOR 2: the 'ages' card's advice to end the plan earlier
 *      then holds wherever it shows), else 'ages'; 'uneven' outside the holdings; and else 'gapincome' exactly where the
 *      two ages are more than DB_GAP_UP_TO apart and an income is taxable, not earnings and above nought; so a couple kept
 *      off before stays off, with its reason but for the age cap's just named, and no couple three years apart or nearer,
 *      or without such an income, is moved; and on
 *      step 5's own gap couples (shapes-panel.mjs, each at its landed target) the four with a DB pension kept off for it
 *      and the four without it still solved: all of this the guard before D143 (the plant 'noopen', the rollback); and since
 *      D143 the same couples' answers as check 2 derives them, a couple kept off for the gap (G) or its holdings opened on the
 *      household route where the household plan takes its shape and 'shape' where it does not, so with the swap on and every
 *      class open no couple is kept off for its holdings or its gap ('uneven' and 'gapincome' given to none), and step 5's
 *      four gap couples with a DB pension solved on the household route, the four without one as before;
 *   9. the registered test's own units (registrations/couples-open.md: its panel, couples-open-registered-panel.json, the
 *      plans alone, no outcome read): each household-route unit (Y75, Y90, Y100, E95, E100, S75, G8, G12, G8Y75, G12P and
 *      G12R, on four couples) on, on the household route, its lifted reasons its class's (G8Y75's Y and G), not swapped, the
 *      page's household cut taking it; each today's-route unit (RY75, RE100, RS75, RG8 and RG12P) kept off for its shape
 *      ('shape': 'risks'), but RWY75, its later retiree paid in plan year 0, a shape the household plan takes since step 4's
 *      change of default (D145), on the household route lifting Y, the page's cut taking it (the plants 'notake', the guard
 *      before the change, keeping it off for 'year0', and 'cutnotake', the cut before it, refusing it, each fail this check);
 *      under the plant 'noopen' every unit off for the reason the panel recorded
 *      ('uneven' or 'gapincome', the guard before D143), and under 'noshape' every today's-route unit on as if taken; and the
 *      client (check 3's stand-ins) failing closed: a household-route unit (Y90) solved on the household route, today's
 *      route never asked; the same unit asked for no household form, refused; a today's-route unit (RY75) as the panel holds it,
 *      the guard keeping it off for its shape (as a variant of an opened couple reaches the client: the reviewer on D143's
 *      change of default, finding 2), refused when the household plan refuses it, and the same opened as if taken (under
 *      'noshape'), refused, today's route never asked.
 * Plants (--planted runs each and wants its checks to fail): 'firstnotelder' (src/couplesSwitch.js: the first person taken for
 * the elder whatever the ages: checks 2 and 8, check 8 deriving the guard's whole answer from the engine's reading), 'eldereither' (src/couplesSwitch.js: the guard lifted for an elder entered second
 * without the swap, the couple solved in the order entered, as D99's first draft: check 2), 'halfdefault' (src/solverClient.js: a couple solved on the half share unless asked otherwise,
 * as before D99: check 3), 'notie' (src/solverClient.js: a couple assembled without the joint move, as before D108: checks 3
 * and 7, the client then asking for none, so a worker returning none is not refused),
 * 'oldcouples' (src/solverApproximations.js: the line before D99 with couples on: check 4), 'rawages'
 * (src/solverCouple.js householdPlan: a blank age or end age left as the plan has it: check 5), 'noagecap'
 * (src/couplesSwitch.js: a couple run whose partner would pass 120 before the plan ends: checks 6 and 8, check 8 reaching the
 * age cap since the reviewer on D128, MINOR 2), 'nojointcheck'
 * (src/solverClient.js: each assembly's joint move not read back, as before: check 7), 'nogapguard' (src/couplesSwitch.js:
 * a couple more than three years apart with other taxable income run, as before D128: check 8), 'nogapline'
 * (src/solverApproximations.js: the coverage line without those couples, as before D128: check 4), 'nohousehold'
 * (src/solverClient.js: a couple solved on today's route though the couples' default names the household plan, as before
 * D135: check 3), 'nohouseline' (src/solverApproximations.js: the coverage line without how a couple is planned, as before
 * D135: check 4), 'couplesplit' (src/solverApp.js: a couple's solve keeps the savings split, as no default names: check 1),
 * 'noopen' (src/couplesSwitch.js: no class of the household route's lifted, the guard before D143: checks 2, 6, 8 and 9),
 * 'noshape' (src/couplesSwitch.js: a couple opened whatever its shape, the household plan's refusals not read: checks 2, 6 and
 * 9, check 6's household cut refused), 'openfallback' (src/solverClient.js: a couple only the household route opens, or one the
 * guard keeps off for its shape, solved on today's route where the household plan refuses it or no household form is asked:
 * check 9), 'beforeopen'
 * (src/solverApproximations.js: the coverage line before D143: check 4), and since step 4's change of default (D145) 'notake'
 * (src/couplesSwitch.js: the guard reading the shapes it takes as refused, before the change: check 9), 'cutnotake'
 * (src/solverCouple.js: the page's cut and assembly without them: check 9) and 'beforetake' (src/solverApproximations.js:
 * the coverage line before it: check 4). Since D143 checks 6 and 8 compare the guard's whole
 * answer (its route, its lifted reasons, its swap) and check 9 reads the registered units, so 'firstnotelder' fails checks 2,
 * 6, 8 and 9, 'eldereither' checks 2, 6 and 8 (an elder entered second solved without the swap), 'nogapguard' checks 8 and 9
 * (G not lifted, the gap's couples on the guard before D143), 'nohousehold' checks 3 and 9 (a couple the household route
 * alone opens asking for no household form, refused); 'nogapline' and 'nohouseline' leave their clauses out of D143's line.
 * Check 1's planted blocks run in every run.
 *   node research/tests/couple-default.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { COUPLES, COUPLE_BAND, ELDER_UP_TO, ELDER_FIRST, SWAP_ELDER, DB_GAP_UP_TO, HOUSEHOLD_OPEN, HOUSEHOLD_TAKES, coupleSolverOn, elderOf, horizonFits, householdShapeOf, swapOf, PLANT as SWITCH_PLANT } from '../../src/couplesSwitch.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { APP_COUPLE, appJoint, jointKey } from '../../src/solverSettings.js';
import { couplePlans, householdCut, PLANT as COUPLE_PLANT } from '../../src/solverCouple.js';
import { solverApproximations, COUPLES_LINE, HOUSEHOLD_SENTENCE, PLANT as WORDS_PLANT } from '../../src/solverApproximations.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { solveForApp, PLANT as APP_PLANT } from '../../src/solverApp.js';

const HERE = dirname(fileURLToPath(import.meta.url));
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['firstnotelder', ['2', '6', '8', '9']], ['eldereither', ['2', '6', '8']], ['halfdefault', ['3']], ['notie', ['3', '7']], ['oldcouples', ['4']], ['rawages', ['5']], ['noagecap', ['6', '8']], ['nojointcheck', ['7']], ['nogapguard', ['8', '9']], ['nogapline', ['4']], ['nohousehold', ['3', '9']], ['nohouseline', ['4']], ['couplesplit', ['1']], ['noopen', ['2', '6', '8', '9']], ['noshape', ['2', '6', '9']], ['openfallback', ['9']], ['beforeopen', ['4']], ['notake', ['9']], ['cutnotake', ['9']], ['beforetake', ['4']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_DEFAULT_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
const PLANTED = process.env.COUPLE_DEFAULT_PLANT || '';
if (PLANTED === 'firstnotelder' || PLANTED === 'eldereither' || PLANTED === 'noagecap' || PLANTED === 'nogapguard' || PLANTED === 'noopen' || PLANTED === 'noshape' || PLANTED === 'notake') SWITCH_PLANT.rule = PLANTED;
if (PLANTED === 'oldcouples' || PLANTED === 'nogapline' || PLANTED === 'nohouseline' || PLANTED === 'beforeopen' || PLANTED === 'beforetake') WORDS_PLANT.rule = PLANTED;
if (PLANTED === 'rawages' || PLANTED === 'cutnotake') COUPLE_PLANT.rule = PLANTED;
if (PLANTED === 'couplesplit') APP_PLANT.rule = PLANTED;

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

// 1. the decided-defaults block's couples entry against the code
{ const blockOf = text => { const m = /<!-- decided-defaults([\s\S]*?)-->/.exec(text); return m ? JSON.parse(m[1]) : null; };
  // D138, pinned here under D140's unlock: a couple's solves keep the savings split off (a solve with a partner's age), read
  // from two light solves of S188, a single who works and saves: the split on without a partner's age, off with one
  const s188 = buildScenarios().find(s => s.id === 'S188').plan, light = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
  const splitOn = r => !!r.meta.saveSplit || r.actions.some(a => a.save);
  const single = splitOn(solveForApp(E, M, s188, light)), couple = splitOn(solveForApp(E, M, s188, { ...light, ageWith: 60 }));
  const code = { on: COUPLES, shareRule: APP_COUPLE.shareRule, band: [...COUPLE_BAND], elderUpTo: ELDER_UP_TO, elderFirst: ELDER_FIRST, swapElder: SWAP_ELDER, tieJoint: APP_COUPLE.tieJoint, tieLook: APP_COUPLE.tieLook, holdPast: APP_COUPLE.holdPast, dbGapUpTo: DB_GAP_UP_TO, household: APP_COUPLE.household, saveSplit: couple, householdOpen: { ...HOUSEHOLD_OPEN }, takeShapes: [...(APP_COUPLE.takeShapes || [])] };
  const agrees = D => !!(D && D.couples) && JSON.stringify(D.couples) === JSON.stringify(code);
  const D = blockOf(readFileSync(join(HERE, '../solver/STATE.md'), 'utf8'));
  const without = D ? { ...D } : null; if (without) delete without.couples;
  const half = D ? { ...D, couples: { ...D.couples, shareRule: 'half' } } : null;
  const noTie = D && D.couples ? { ...D, couples: Object.fromEntries(Object.entries(D.couples).filter(([k]) => !['tieJoint', 'tieLook', 'holdPast'].includes(k))) } : null;
  const noGap = D && D.couples ? { ...D, couples: Object.fromEntries(Object.entries(D.couples).filter(([k]) => k !== 'dbGapUpTo')) } : null;
  const noHouse = D && D.couples ? { ...D, couples: Object.fromEntries(Object.entries(D.couples).filter(([k]) => k !== 'household')) } : null;
  const noSplit = D && D.couples ? { ...D, couples: Object.fromEntries(Object.entries(D.couples).filter(([k]) => k !== 'saveSplit')) } : null;
  // D143: the household route's classes opened, each named; a block without them, or with one shut, fails
  const noOpen = D && D.couples ? { ...D, couples: Object.fromEntries(Object.entries(D.couples).filter(([k]) => k !== 'householdOpen')) } : null;
  const oneShut = D && D.couples ? { ...D, couples: { ...D.couples, householdOpen: { ...(D.couples.householdOpen || {}), G: false } } } : null;
  // D145: the shapes the household plan takes since step 4's change of default, each named; a block without them, or with one
  // left out, fails; and the guard reads the same three as taken (HOUSEHOLD_TAKES)
  const noTake = D && D.couples ? { ...D, couples: Object.fromEntries(Object.entries(D.couples).filter(([k]) => k !== 'takeShapes')) } : null;
  const oneLess = D && D.couples ? { ...D, couples: { ...D.couples, takeShapes: (D.couples.takeShapes || []).filter(w => w !== 'cashisa') } } : null;
  const guardTakes = JSON.stringify(Object.keys(HOUSEHOLD_TAKES).filter(k => HOUSEHOLD_TAKES[k])) === JSON.stringify(APP_COUPLE.takeShapes || []);
  ok('1. the decided-defaults block\'s couples entry is the code\'s (the switch, the share rule, the band, the elder\'s limit, the elder entered first, the swap, the joint move, the age gap with other taxable income, the household plan\'s form, the savings split off for a couple, the household route\'s classes opened, the shapes the household plan takes, the guard\'s the same); planted, a block without it, with the half share, without the joint move, without the gap, without the household, without the split\'s line, without the opened classes or with one of them shut, without the taken shapes or with one left out fails',
    agrees(D) && !agrees(without) && !agrees(half) && !agrees(noTie) && !agrees(noGap) && !agrees(noHouse) && !agrees(noSplit) && !agrees(noOpen) && !agrees(oneShut) && !agrees(noTake) && !agrees(oneLess) && guardTakes && JSON.stringify(APP_COUPLE.takeShapes) === JSON.stringify(['growth', 'cashisa', 'year0']) && single && couple === false
      && JSON.stringify(Object.keys(HOUSEHOLD_OPEN)) === JSON.stringify(['Y', 'E', 'S', 'G']) && Object.values(HOUSEHOLD_OPEN).every(v => v === true) && APP_COUPLE.tieJoint === 1e-4 && APP_COUPLE.tieLook === true && APP_COUPLE.holdPast === 2 && DB_GAP_UP_TO === 3 && APP_COUPLE.household === 'pensionsPA',
    `the block ${JSON.stringify(D && D.couples)}; the code ${JSON.stringify(code)}; S188's split without a partner's age ${single ? 'on' : 'OFF'}`); }

// 2. the guard over the library's couples, re-held, under four arrangements of their ages and one of a refused shape
const lib = buildScenarios(), couples = lib.filter(s => s.plan.demographics.planningMode === 'couple');
const reheld = (plan, f) => { const re = JSON.parse(JSON.stringify(plan)), tot = {};
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); tot[k] = (tot[k] || 0) + (Number(a.balance) || 0); }
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); if (/_self$/.test(a.id)) a.balance = tot[k] * f; else if (/_part$/.test(a.id)) a.balance = tot[k] * (1 - f); }
  return re; };
const withAges = (plan, how) => { const re = JSON.parse(JSON.stringify(plan)), d = re.demographics;
  if (how === 'swapped') [d.currentAgeSelf, d.currentAgePart] = [d.currentAgePart, d.currentAgeSelf];
  else if (how === 'same') d.currentAgePart = d.currentAgeSelf;
  else if (how === 'blank') d.currentAgePart = '';
  else if (how === 'risks') { const mine = re.accounts.find(a => a.id === 'pen_self'), theirs = re.accounts.find(a => a.id === 'pen_part'); if (mine && theirs) theirs.risk = mine.risk === 'Low Risk' ? 'High Risk' : 'Low Risk'; }
  return re; };
const shareOf = p => { const of = w => p.accounts.filter(a => a.id.endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0); return of('self') / (of('self') + of('part')); };
// f run with a plant of the guard's added to any the run has (the guard's plants combine)
const withSwitch = (extra, f) => { const was = SWITCH_PLANT.rule; SWITCH_PLANT.rule = [was, extra].filter(Boolean).join(','); try { return f(); } finally { SWITCH_PLANT.rule = was; } };
// the guard's answer from the engine's own reading of the plan (App.jsx buildContext: each age today, the plan's end, each
// income) and, since D143, the household plan's shape refusals (householdShapeOf, held to householdPlanFor by couple-shape.
// test.mjs and below by the household cut): `old` the guard before D143 (the rollback); else a couple the guard before it kept
// off, for its holdings (S the same age, E the elder holding more than 90%, Y the younger holding more) or for the age gap with
// other taxable income (G), opened where every reason is one of HOUSEHOLD_OPEN's and the household is solved elder first
// (entered so, the same age, or mirrored with the swap on): on the household route where its shape is taken, else 'shape'; past
// the age cap 'shape' or 'ages' for an opened couple, and for the guard before D143 the gap's reason where its holdings are
// inside the guard (the reviewer on D128, MINOR 2), else 'ages'
const wantOf = (ctx, plan, share, old = false) => {
  const elder = ctx.ageSelf0 > ctx.agePart0 ? 'self' : ctx.agePart0 > ctx.ageSelf0 ? 'part' : null;
  const held = elder === 'self' ? share : elder === 'part' && SWAP_ELDER ? 1 - share : null, inBand = share >= 0.4 - 1e-9 && share <= 0.6 + 1e-9;
  const holds = inBand || (held !== null && held > 0.6 + 1e-9 && held <= 0.9 + 1e-9);
  const far = Math.abs(ctx.ageSelf0 - ctx.agePart0) > DB_GAP_UP_TO + 1e-9, other = ctx.otherIncomes.some(i => !i.taxFree && !i.isEarnings && i.amount > 0);
  const fits = ctx.agePart0 + (ctx.terminalAge - ctx.ageSelf0) <= 120 + 1e-9;
  const reasons = [...(holds ? [] : [elder === null ? 'S' : held !== null && held > 0.9 + 1e-9 ? 'E' : 'Y']), ...(far && other ? ['G'] : [])];
  const open = !old && reasons.length > 0 && (elder !== 'part' || SWAP_ELDER) && reasons.every(r => HOUSEHOLD_OPEN[r]);
  const sh = open ? householdShapeOf(plan) : { refused: false, why: null };
  const why = !fits ? (open ? (sh.refused ? 'shape' : 'ages') : holds && far && other ? 'gapincome' : 'ages')
    : open ? (sh.refused ? 'shape' : null) : !holds ? 'uneven' : far && other ? 'gapincome' : null;
  const on = why === null, house = open && on;
  return { on, why, shape: why === 'shape' ? sh.why : null, swap: on && SWAP_ELDER && elder === 'part', route: house ? 'household' : null, lifted: house ? reasons : null, elder, inBand, holds, far, other, fits };
};
const answers = (g, w) => g.on === w.on && g.why === w.why && (g.shape || null) === w.shape && !!g.swap === w.swap && (g.route || null) === w.route && JSON.stringify(g.lifted || null) === JSON.stringify(w.lifted);
const shown = g => JSON.stringify({ on: g.on, why: g.why, shape: g.shape || null, swap: !!g.swap, route: g.route || null, lifted: g.lifted || null });
// the household cut the page makes for an opened couple (src/solverClient.js: the plan, or its mirror where swapped): false where
// the household plan refuses its shape, any other error standing
const cutTakes = p => { try { householdCut(E, M, swapOf(p) ? otherOrder(E, p) : p, APP_COUPLE.household); return true; } catch (e) { if (/^householdPlanFor: (?!opts\.|no group)/.test(e.message)) return false; throw e; } };
const allOpen = ['Y', 'E', 'S', 'G'].every(r => HOUSEHOLD_OPEN[r]);
{ const SHARES = [0.05, 0.1, 0.25, 0.39, 0.4, 0.5, 0.6, 0.61, 0.75, 0.9, 0.91, 0.95], HOWS = ['entered', 'swapped', 'same', 'blank', 'risks'];
  let n = 0, differ = 0, oldDiffer = 0, on = 0, elderSeen = { self: 0, part: 0, none: 0 }, mismatchAge = 0, offWhy = 0, elderSecond = 0;
  let openedSwapped = 0, keptToday = 0, cuts = 0, cutMissed = 0, cutOver = 0;
  const opened = { S: 0, E: 0, Y: 0, G: 0 }, shaped = {}, first = [];
  for (const c of couples) for (const how of HOWS) {
    const aged = withAges(c.plan, how), ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(aged)));
    const engineElder = ctx.ageSelf0 > ctx.agePart0 ? 'self' : ctx.agePart0 > ctx.ageSelf0 ? 'part' : null;
    if (elderOf(aged) !== engineElder) mismatchAge++;
    if (how !== 'risks') elderSeen[engineElder || 'none']++;
    let openAt = null, shapeAt = null;
    for (const f of SHARES) {
      const p = reheld(aged, f), share = shareOf(p), w = wantOf(ctx, p, share), o = wantOf(ctx, p, share, true);
      if (engineElder === 'part' && !w.inBand && 1 - share > 0.6 + 1e-9 && 1 - share <= 0.9 + 1e-9) elderSecond++;
      const got = coupleSolverOn(p, true), gotOld = withSwitch('noopen', () => coupleSolverOn(p, true));
      n++; if (got.on) on++;
      if (!answers(got, w)) { differ++; if (first.length < 3) first.push(`${c.id} ${how} ${f}: ${shown(got)} against ${shown(w)}`); }
      if (!answers(gotOld, o)) { oldDiffer++; if (first.length < 3) first.push(`${c.id} ${how} ${f}, the guard before D143: ${shown(gotOld)} against ${shown(o)}`); }
      if (w.route === 'household') { for (const r of w.lifted) opened[r]++; if (w.swap) openedSwapped++; if (!openAt) openAt = p; }
      if (w.why === 'shape') { shaped[w.shape] = (shaped[w.shape] || 0) + 1; if (!shapeAt) shapeAt = p; }
      if (w.on && !w.route && how === 'risks') keptToday++;
      if (coupleSolverOn(p, false).why !== 'off') offWhy++;
    }
    // the shape refusals read from the plan as entered, no holding moving them: one cut for each couple and arrangement
    if (openAt) { cuts++; if (!cutTakes(openAt)) { cutMissed++; if (first.length < 3) first.push(`${c.id} ${how}: opened, and the household cut refuses it`); } }
    if (shapeAt && cutTakes(shapeAt)) cutOver++;
  }
  ok(`2. the guard: before D143 (the rollback) on exactly where the first person holds 40% to 60%, or the elder by the engine's ages holds more than 60% and at most 90% (${SWAP_ELDER ? 'entered either way, swapped exactly where on and entered second' : 'entered first'}), 'uneven' elsewhere; since D143 a couple it kept off opened, solved elder first, on the household route where the household plan takes its shape (every opened couple's cut taken) and 'shape' where it refuses it; 'off' with the switch off`,
    couples.length === 210 && n === 210 * HOWS.length * 12 && differ === 0 && oldDiffer === 0 && mismatchAge === 0 && offWhy === 0 && elderSeen.part > 0 && elderSeen.self > 0 && elderSeen.none > 0 && elderSecond > 0
      && cutMissed === 0 && (!allOpen || (opened.S > 0 && opened.E > 0 && opened.Y > 0 && openedSwapped > 0 && (shaped.risks || 0) > 0 && keptToday > 0 && cuts > 0)),
    `${n} plans, ${on} on, ${differ} differing from D143's answer and ${oldDiffer} from the guard before it${first.length ? ` (${first.join('; ')})` : ''}; the switch's elder against the engine's ages ${mismatchAge} differing; the elder the first person ${elderSeen.self}, the partner ${elderSeen.part}, neither ${elderSeen.none} (couple-arrangements); an elder entered second holding more than 60% and at most 90% ${elderSecond}; opened on the household route by class ${JSON.stringify(opened)}, ${openedSwapped} of them mirrored; 'shape' ${JSON.stringify(shaped)}; a refused shape inside the guard before D143 on today's route ${keptToday}; the household cut on ${cuts} opened couple-arrangements, refusing ${cutMissed}; refused by the guard and taken by the cut ${cutOver} (erring towards the app's rules)`);
}

// 3. the page's solve of a couple: what the client asks its workers, by in-process stand-ins that record it
let refused = null;   // check 7, below: the client's read-back of each assembly's joint move
let closedRuns = null;   // check 9, below: the client on a couple the household route alone opens (D143)
{ const asked = []; let dropJoint = false;
  class StandIn {
    constructor() { this.onmessage = null; this.onerror = null; this.dead = false; }
    postMessage(data) { setImmediate(() => this.handle(data)); }
    terminate() { this.dead = true; }
    reply(m) { setImmediate(() => { if (!this.dead && this.onmessage) this.onmessage({ data: m }); }); }
    handle(data) {
      if (this.dead) return;
      const { id, kind } = data;
      try {
        if (kind === 'couple-plans') { const cut = couplePlans(E, data.plan, { shareRule: data.shareRule }); asked.push({ kind, shareRule: data.shareRule, share: cut.share, spend: [cut.plans.self.spending.targetSpend, cut.plans.part.spending.targetSpend] }); this.reply({ id, ...cut }); return; }
        if (kind === 'solve') { asked.push({ kind, slot: data.slot || null, bands: data.bands ? JSON.stringify(data.bands) : null }); this.reply({ id: 0, done: true, meta: {}, secs: 0, restored: false }); return; }
        // the household's route (D135): the cut as the worker makes it (householdCut), and the household's record as the worker's
        // (householdMeta: the setting the assembly was made with, here the one asked, and the cut's k)
        if (kind === 'household-plan') { const hc = householdCut(E, M, data.plan, data.form); this.k = hc.bands.k; asked.push({ kind, form: data.form }); this.reply({ id, ...hc }); return; }
        if (kind === 'household') { asked.push({ kind, setting: JSON.stringify({ form: data.form, split: data.split, topK: data.topK, tieJoint: data.tieJoint, holdPast: data.holdPast }) }); this.reply({ id, done: true, meta: { household: true, setting: { form: data.form, split: 'even', topK: data.topK, tieJoint: data.tieJoint, holdPast: data.holdPast }, k: this.k, split: 'even' } }); return; }
        // the couple's record as the worker's (coupleMeta: the joint move it was assembled with); one that drops it (check 7)
        if (kind === 'couple') { asked.push({ kind, shareRule: data.shareRule, joint: JSON.stringify(data.joint === undefined ? 'unset' : data.joint) }); this.reply({ id, done: true, meta: { joint: dropJoint ? {} : JSON.parse(jointKey(data.joint)) } }); return; }
        throw new Error(`no '${kind}' here`);
      } catch (e) { this.reply({ id, error: e.message }); }
    }
  }
  globalThis.Worker = StandIn;
  const C = await import('../../src/solverClient.js');
  if (PLANTED === 'halfdefault' || PLANTED === 'notie' || PLANTED === 'nojointcheck' || PLANTED === 'nohousehold' || PLANTED === 'openfallback') C.PLANT.rule = PLANTED;
  const c = couples.find(x => x.id === 'S069') || couples[0], p90 = reheld(c.plan, 0.9);
  const run = async couple => { asked.length = 0; const job = C.startSolve(p90, { parts: 1, couple }); const d = await job.done; job.close(); return { d, asked: asked.slice() }; };
  // by default the household (D135); today's route under `household: null`, the option that names it
  const byDefault = await run({ engine: E }), today = await run({ engine: E, household: null }), named = await run({ engine: E, shareRule: 'half', household: null }), noJoint = await run({ engine: E, joint: null, household: null });
  const wantCut = householdCut(E, M, p90, 'pensionsPA'), hp = byDefault.asked.find(a => a.kind === 'household-plan'), hSolves = byDefault.asked.filter(a => a.kind === 'solve'), hAsm = byDefault.asked.find(a => a.kind === 'household');
  const wantSetting = JSON.stringify({ form: 'pensionsPA', split: 'even', topK: 3, tieJoint: 1e-4, holdPast: 2 }), hRec = byDefault.d.couple || {};
  const houseOk = !!hp && hp.form === 'pensionsPA' && hSolves.length === 1 && hSolves[0].slot === 'household' && hSolves[0].bands === JSON.stringify(wantCut.bands) && !!hAsm && hAsm.setting === wantSetting
    && !byDefault.asked.some(a => a.kind === 'couple-plans' || a.kind === 'couple') && hRec.household === 'pensionsPA' && hRec.k === wantCut.bands.k && hRec.split === 'even'
    && ![today, named, noJoint].some(r => r.asked.some(a => a.kind === 'household-plan' || a.kind === 'household'));
  const cut = today.asked.find(a => a.kind === 'couple-plans'), joined = today.asked.find(a => a.kind === 'couple');
  const target = Number(E.normalizePlan(p90).spending.targetSpend);
  const spendOk = !!cut && Math.abs(cut.spend[0] - 0.9 * target) < 1 && Math.abs(cut.spend[1] - 0.1 * target) < 1;
  const cutH = named.asked.find(a => a.kind === 'couple-plans'), joinedH = named.asked.find(a => a.kind === 'couple');
  const research = couplePlans(E, p90), want = JSON.stringify(appJoint()), jN = noJoint.asked.find(a => a.kind === 'couple');
  const jointOk = !!joined && joined.joint === want && JSON.stringify(today.d.couple.joint) === want && !!joinedH && joinedH.joint === want
    && !!jN && jN.joint === 'null' && noJoint.d.couple.joint === null && want === JSON.stringify({ tieJoint: 1e-4, tieLook: true, holdPast: 2 });
  ok('3. the page solves a couple as one household by default (D135): the plan cut at \'pensionsPA\', its one table solved in the slot \'household\' inside the cut\'s bands, the household assembled with the default\'s setting (its form and the even split), the record naming the form, the cut\'s k and the even split, no person\'s table and no couple; today\'s route under `household: null`: held 90/10, cut and assembled on \'pots\', each person on 90% and 10% of the spending, the record naming it; a named \'half\' kept; the solver\'s own default the half share; the couple assembled with the couples\' joint move (D108), the record naming it, a caller\'s own (none) kept',
    houseOk && !!cut && cut.shareRule === 'pots' && !!joined && joined.shareRule === 'pots' && spendOk && today.d.couple.shareRule === 'pots' && Math.abs(today.d.couple.share - 0.9) < 1e-9
      && !!cutH && cutH.shareRule === 'half' && !!joinedH && joinedH.shareRule === 'half' && named.d.couple.shareRule === 'half' && named.d.couple.share === 0.5
      && research.shareRule === 'half' && research.share === 0.5 && jointOk,
    `${c.id} held 90/10, target ${target}: by default asked to cut the household at ${hp ? hp.form : '-'}, ${hSolves.length} table${hSolves.length === 1 ? '' : 's'} solved (slot ${hSolves.map(a => a.slot).join(', ') || '-'}; inside the cut's bands ${hSolves.length === 1 && hSolves[0].bands === JSON.stringify(wantCut.bands)}), assembled with ${hAsm ? hAsm.setting : '-'}, the record ${hRec.household || '-'} at k ${hRec.k}, split ${hRec.split || '-'}; today's route asked to cut on ${cut && cut.shareRule} (each person's spending ${cut ? cut.spend.map(x => Math.round(x)).join(' and ') : '-'}), to assemble on ${joined && joined.shareRule}, the record ${today.d.couple.shareRule} at ${today.d.couple.share}; named 'half': ${cutH && cutH.shareRule}, ${joinedH && joinedH.shareRule}, ${named.d.couple.shareRule} at ${named.d.couple.share}; couplePlans unasked: ${research.shareRule} at ${research.share}; the joint move asked ${joined && joined.joint}, recorded ${JSON.stringify(byDefault.d.couple.joint)}, with 'half' ${joinedH && joinedH.joint}, none named ${jN && jN.joint}`);
  // 7's runs, on today's route (`household: null`): a stand-in worker that assembles the couple without the joint move asked
  // for, and one that keeps it
  dropJoint = true; let why = '';
  try { await run({ engine: E, household: null }); } catch (e) { why = e.message; }
  dropJoint = false;
  let kept = true; try { await run({ engine: E, household: null }); } catch (e) { kept = false; }
  refused = { why, kept };
  // 9's runs (D143): the registered test's own units, solved by the client: Y90 (a unit the household route alone opens) by
  // default and asked for no household form; RY75 (a shape the household plan refuses) opened as if taken (the guard's plant
  // 'noshape'), so the household plan refuses it at the cut
  { const { readOpenPanel } = await import('../solver/couples-open-panel.mjs');
    const units = readOpenPanel(join(HERE, '../solver/couples-open-registered-panel.json'));
    const y90 = units.find(u => u.variant === 'Y90').plan, ry75 = units.find(u => u.variant === 'RY75').plan;
    const runPlan = async (plan, couple) => {
      asked.length = 0; const job = C.startSolve(plan, { parts: 1, couple }); let d = null, why = null;
      try { d = await job.done; } catch (e) { why = e.message; }
      try { job.close(); } catch { /* a failed job may hold nothing to close */ }
      return { d, why, asked: asked.slice() };
    };
    const opened = await runPlan(y90, { engine: E }), noForm = await runPlan(y90, { engine: E, household: null });
    // RY75 as the panel holds it: the guard keeps it off for its shape, so a variant of an opened couple the household plan
    // refuses reaches the client this way (the reviewer on D143's change of default, finding 2)
    const heldOff = await runPlan(ry75, { engine: E });
    const was = SWITCH_PLANT.rule; SWITCH_PLANT.rule = [was, 'noshape'].filter(Boolean).join(',');
    let anyShape; try { anyShape = await runPlan(ry75, { engine: E }); } finally { SWITCH_PLANT.rule = was; }
    closedRuns = { opened, noForm, heldOff, anyShape }; } }

// 4. the words the page shows about couples follow the switches
{ const on = solverApproximations(), off = solverApproximations({ couples: false });
  const lineOn = on.find(l => /couple/i.test(l)), lineOff = off.find(l => /couple/i.test(l));
  const first = solverApproximations({ swap: false }), lineFirst = first.find(l => /couple/i.test(l));
  // D128: the couples more than DB_GAP_UP_TO years apart with other taxable income named, in words held to the code's gap
  const gapWords = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' }[DB_GAP_UP_TO];
  const gapSaid = l => !!gapWords && new RegExp(`except a couple more than ${gapWords} years apart in age who have other taxable income, such as a DB \\(final salary\\) pension or an annuity\\. Any other`).test(l);
  // D135: with the household default, how the solver plans a couple, at the line's end; without it, not said
  const houseSaid = l => (APP_COUPLE.household ? l.endsWith(HOUSEHOLD_SENTENCE) : !l.includes(HOUSEHOLD_SENTENCE));
  const sentenceOk = [/^ For a couple, /, /one plan for the money you hold between you/, /how your pensions are split/, /simulating each of you with your own tax/, /plans each of you separately/].every(r => r.test(HOUSEHOLD_SENTENCE));
  const says = (l, entered) => !!l && /40% to 60%/.test(l) && /older partner/.test(l) && entered === /entered first/.test(l) && new RegExp(`${Math.round(100 * ELDER_UP_TO)}%`).test(l) && /Any other couple's plan keeps the app's own rules/.test(l) && gapSaid(l) && houseSaid(l);
  // D143: every couple but a shape the household plan refuses, each of householdShapeOf's seven refusals named in its order, kept
  // off where the guard before D143 kept it off (its holdings, the gap with other taxable income), and with the swap off an
  // elder entered second held to that guard
  const SHAPE_SAID = { risks: /holding the same kind of account at different risk levels/, growth: /both paying into one kind of account with your payments growing at different rates/, cashisa: /a cash ISA being paid into/, salaries: /both being paid with your pay growing at different rates/, limits: /your partner's own risk limits differing from yours/, year0: /one of you retired while the other is still paid or saving this year/, noretire: /neither of you retiring within the plan/ };
  // D145: since step 4's change of default the line names the refusals the household plan still makes, in order, and none of the
  // shapes it takes (HOUSEHOLD_TAKES); the line before it (the plant 'beforetake', the rollback's words) all seven
  const named = (l, ws) => ws.every(w => SHAPE_SAID[w].test(l)) && ws.map(w => l.search(SHAPE_SAID[w])).every((at, i, all) => i === 0 || at > all[i - 1]);
  const STILL = Object.keys(SHAPE_SAID).filter(w => !HOUSEHOLD_TAKES[w]), TAKEN = Object.keys(SHAPE_SAID).filter(w => HOUSEHOLD_TAKES[w]);
  const shapesSaid = l => STILL.length > 0 && TAKEN.length > 0 && named(l, STILL) && TAKEN.every(w => !SHAPE_SAID[w].test(l));
  const beforeTakeSaid = l => !!l && named(l, Object.keys(SHAPE_SAID));
  const openGapSaid = l => !!gapWords && l.includes(`and you are not a couple more than ${gapWords} years apart in age who have other taxable income, such as a DB (final salary) pension or an annuity`);
  const saysOpen = (l, entered) => !!l && (entered ? /^It plans for one person or for a couple whose older partner is entered first, or who are the same age\. /.test(l) && /A couple whose older partner is entered second is planned only if the two of you hold your money about evenly \(40% to 60% each\)/.test(l) : /^It plans for one person or for a couple\. /.test(l) && !/entered/.test(l))
    && /The one exception is a couple whose plan it cannot yet plan as one household/.test(l) && shapesSaid(l) && /unless the two of you hold your money about evenly \(40% to 60% each\)/.test(l)
    && new RegExp(`or the older of you holds up to ${Math.round(100 * ELDER_UP_TO)}% of it`).test(l) && openGapSaid(l) && houseSaid(l);
  const opened = ['Y', 'E', 'S', 'G'].map(r => !!HOUSEHOLD_OPEN[r]), allOn = opened.every(Boolean), noneOn = !opened.some(Boolean);
  const wantOn = allOn ? (SWAP_ELDER ? COUPLES_LINE.open : COUPLES_LINE.openFirst) : (SWAP_ELDER ? COUPLES_LINE.on : COUPLES_LINE.onFirst), wantFirst = allOn ? COUPLES_LINE.openFirst : COUPLES_LINE.onFirst;
  ok(`4. the coverage list says which couples the solver plans for and which keep the app's rules (couples on and the household route's classes ${allOn ? `open (D143): every couple but a shape the household plan refuses (since D145 the ${STILL.length} it still refuses, not the ${TAKEN.length} it takes), kept off where the guard before D143 kept it off` : 'shut'}${SWAP_ELDER ? '' : ', an elder entered second held to the guard before D143'}; the lines before D143 as they stood: the older partner either way with the swap on, entered first with it off, not a couple more than ${gapWords} years apart with other taxable income${APP_COUPLE.household ? '; and how it plans a couple, one plan for the money they hold' : ''}), and with couples off that a couple's plan keeps the app's rules`,
    COUPLES && (allOn || noneOn) && on.length === 8 && off.length === 8 && first.length === 8 && saysOpen(COUPLES_LINE.open, false) && saysOpen(COUPLES_LINE.openFirst, true)
      && beforeTakeSaid(COUPLES_LINE.openBeforeTake) && beforeTakeSaid(COUPLES_LINE.openFirstBeforeTake)
      && says(COUPLES_LINE.on, false) && says(COUPLES_LINE.onFirst, true) && lineOn === wantOn && lineFirst === wantFirst && lineOff === COUPLES_LINE.off && !on.includes(COUPLES_LINE.off)
      && !!lineOff && !lineOff.includes(HOUSEHOLD_SENTENCE.trim()) && sentenceOk && APP_COUPLE.household === 'pensionsPA',
    `on: "${lineOn}"; the swap off: "${lineFirst}"; off: "${lineOff}"`); }

// 5. a couple's cut against the couple's own context, whatever is left blank
{ const FIELDS = ['currentAgeSelf', 'currentAgePart', 'retireAgeSelf', 'retireAgePart', 'terminalAge'];
  const variants = [...FIELDS.map(f => [`${f} blank`, d => { d[f] = ''; }]),
    ['the ages as text', d => { d.currentAgeSelf = String(d.currentAgeSelf); d.currentAgePart = String(d.currentAgePart); }],
    ['the end age at the first person\'s age', d => { d.terminalAge = d.currentAgeSelf; }]];
  let n = 0, differ = 0; const first = [];
  for (const c of couples.slice(0, 30)) for (const [name, f] of variants) {
    const p = JSON.parse(JSON.stringify(c.plan)); f(p.demographics);
    const hctx = E.buildContext(E.resolveMpaa(E.normalizePlan(p))), cut = couplePlans(E, p);
    for (const [i, who] of [[0, 'self'], [1, 'part']]) {
      const pctx = E.buildContext(cut.plans[who]), o = hctx.owners[i], q = pctx.owners[0];
      const same = q.age0 === o.age0 && q.retireAge === o.retireAge && q.salary === o.salary && q.statePension === o.statePension && pctx.totalYears === hctx.totalYears;
      n++; if (!same) { differ++; if (first.length < 3) first.push(`${c.id}, ${name}, ${who}: age ${q.age0} (the couple's ${o.age0}), retiring ${q.retireAge} (${o.retireAge}), ${pctx.totalYears} years (${hctx.totalYears})`); }
    }
  }
  ok('5. a couple\'s cut gives each person the age, retirement age, salary, state pension and horizon the couple\'s own run reads, whatever is left blank',
    n === 30 * variants.length * 2 && differ === 0, `${n} people (30 couples, ${variants.length} variants), ${differ} differing${first.length ? `: ${first.join('; ')}` : ''}`); }

// 6. the age cap: a couple whose partner would pass 120 before the plan ends keeps the app's rules
{ let n = 0, wrongWhy = 0, shortOn = 0, capped = 0, ran = 0; const first = [];
  const cases = [];
  // D143: each also with the first person holding 80% (the partner the elder or the same age: a couple the household route alone
  // opens), and that with the partner's pension at another risk (a shape the household plan refuses)
  const HELD = ['as held', 'the first person holding 80%', 'the first person holding 80% and the partner\'s pension at another risk'];
  for (const c of couples.slice(0, 30)) for (const end of [95, 100, 110, 120]) for (const older of [0, 15, 25, 35]) for (const held of HELD) {
    let p = JSON.parse(JSON.stringify(c.plan)); const d = p.demographics;
    d.terminalAge = end; d.currentAgePart = Math.min(120, Number(d.currentAgePart) + older);
    if (held !== HELD[0]) p = reheld(p, 0.8);
    if (held === HELD[2]) p = withAges(p, 'risks');
    cases.push([`${c.id} ending at ${end}, the partner ${older} years older, ${held}`, p]);
  }
  // the reviewer's two: S001 held 60/40 at 49 and 70 ending at 100; a blank first age beside a partner of 66 ending at 95
  { const s1 = couples.find(x => x.id === 'S001') || couples[0];
    const a = JSON.parse(JSON.stringify(s1.plan)); Object.assign(a.demographics, { currentAgeSelf: 49, currentAgePart: 70, terminalAge: 100 }); cases.push(['the reviewer\'s 49 and 70 ending at 100', a]);
    const b = JSON.parse(JSON.stringify(s1.plan)); Object.assign(b.demographics, { currentAgeSelf: '', currentAgePart: 66, terminalAge: 95 }); cases.push(['the reviewer\'s blank and 66 ending at 95', b]); }
  let capShape = 0, ranHouse = 0, fitDiffer = 0, cutRefused = 0;
  for (const [name, p] of cases) {
    const h = E.buildContext(E.resolveMpaa(E.normalizePlan(p))), fits = h.agePart0 + (h.terminalAge - h.ageSelf0) <= 120 + 1e-9;
    const g = coupleSolverOn(p, true), w = wantOf(h, p, shareOf(p));
    n++; if (!fits) capped++;
    if (horizonFits(p) !== fits) fitDiffer++;
    // 'ages' exactly past the cap, but 'shape' for an opened couple whose shape is refused (D143), the answer whole as check 2's
    if ((g.why === 'ages') !== (!fits && w.why !== 'shape') || !answers(g, w)) { wrongWhy++; if (first.length < 3) first.push(`${name}: the guard ${shown(g)}, ${shown(w)} wanted, the engine's partner ${h.agePart0 + (h.terminalAge - h.ageSelf0)} at the end`); }
    if (!fits && g.why === 'shape') capShape++;
    if (g.on) {
      ran++;
      // the cut the page makes: the household's on the household route (the plan, or its mirror where swapped), each person's on
      // today's
      let short;
      if (g.route === 'household') {
        ranHouse++; let hc = null;
        try { hc = householdCut(E, M, g.swap ? otherOrder(E, p) : p, APP_COUPLE.household); } catch (e) { if (!/^householdPlanFor: (?!opts\.|no group)/.test(e.message)) throw e; cutRefused++; if (first.length < 3) first.push(`${name}: run on the household route, which the household plan refuses (${e.message.slice(0, 80)})`); }
        short = !hc || E.buildContext(hc.hplan).totalYears !== h.totalYears;
      }
      else { const cut = couplePlans(E, p); short = ['self', 'part'].some(k => E.buildContext(cut.plans[k]).totalYears !== h.totalYears); }
      if (short) { shortOn++; if (first.length < 3) first.push(`${name}: run${g.route ? ` on the ${g.route} route` : ''}, its cut short of the couple's ${h.totalYears} years`); }
    }
  }
  const named = cases.slice(-2).every(([, p]) => coupleSolverOn(p, true).why === 'ages');
  ok('6. a couple whose partner would pass 120 before the plan ends keeps the app\'s rules (\'ages\', or \'shape\' for a couple only the household route opens whose shape the household plan refuses), exactly where the engine\'s ages put them past it; every couple run cut to its whole horizon, the household\'s on the household route; the reviewer\'s two cases kept off',
    wrongWhy === 0 && fitDiffer === 0 && shortOn === 0 && cutRefused === 0 && capped > 0 && ran > 0 && named && (!allOpen || (ranHouse > 0 && capShape > 0)),
    `${n} plans, ${capped} past 120 by the end (${capShape} of them 'shape'), ${ran} run (${ranHouse} on the household route, its cut refused on ${cutRefused}); the reason wrong on ${wrongWhy}, the age cap against the engine's ages wrong on ${fitDiffer}, a run couple cut short on ${shortOn}${first.length ? `: ${first.join('; ')}` : ''}`); }

// 7. the client reads back each assembly's joint move (the reviewer on D109's change, MINOR 1): a couple assembled without the
// joint move asked for is refused with the client's reason; the same couple assembled with it solves
ok('7. on today\'s route (`household: null`), a couple whose worker assembled it without the joint move asked for is refused by the client; assembled with it, it solves',
  !!refused && /the couple was assembled by the owner with the joint move \{\}, not the \{"tieJoint":0\.0001,"tieLook":true,"holdPast":2\} asked for/.test(refused.why) && refused.kept,
  `dropped: ${refused && refused.why ? refused.why : 'not refused'}; kept: ${refused && refused.kept ? 'solved' : 'refused'}`);

// 8. a couple more than DB_GAP_UP_TO years apart with other taxable income keeps the app's rules (D128): over the library's
// couples moved apart and given incomes, the guard's answer the one the engine's own reading of the plan gives; and step 5's gap
// couples, each at its landed target
{ const GAPS = [0, 2, 3, 3.5, 4, 8, 12, 22], SHARES8 = [0.25, 0.5, 0.6, 0.75, 0.9];
  const inc = (k, extra = {}) => ({ id: `inc_d128_${k}`, name: 'D128 check', owner: 'Myself', startAge: 67, endAge: '', amount: 15000, incomeType: 'otherTaxable', notes: '', ...extra });
  const INCOMES = [['none', null], ['other taxable, the first person\'s', inc('self')], ['other taxable, the partner\'s', inc('part', { owner: 'Partner' })],
    ['other taxable of £1', inc('one', { amount: 1 })], ['other taxable, its amount as text', inc('text', { amount: '15000' })],
    ['other taxable of nought', inc('zero', { amount: 0 })], ['other taxable, its amount blank', inc('blank', { amount: '' })],
    ['earnings', inc('earn', { incomeType: 'earnings' })], ['tax-free income', inc('free', { incomeType: 'taxFree' })],
    ['a kind the engine does not know', inc('odd', { incomeType: 'pensionDB' })], ['a kind the engine does not know, its taxTreatment tax-free', inc('oddfree', { incomeType: 'pensionDB', taxTreatment: 'Tax-free' })]];
  let n = 0, differ = 0, oldDiffer = 0, moved = 0, onFar = 0, offFar = 0, otherSeen = 0, capGap = 0, capAges = 0, openG = 0, shapeG = 0, capShape = 0, keptOld = 0; const first = [];
  for (const c of couples.slice(0, 30)) for (const g of GAPS) for (const dir of g === 0 ? [1] : [1, -1]) for (const [iname, income] of INCOMES) {
    const base = JSON.parse(JSON.stringify(c.plan));
    base.demographics.currentAgePart = Number(base.demographics.currentAgeSelf) - dir * g;   // dir 1: the partner the younger
    if (g === 22) base.demographics.terminalAge = 100;   // 22 years older, the partner past 120 by the plan's end (the reviewer on D128, MINOR 2)
    if (income) base.otherIncomes = [...(base.otherIncomes || []), income];
    const ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(base)));
    if (ctx.otherIncomes.some(i => !i.taxFree && !i.isEarnings && i.amount > 0)) otherSeen++;
    for (const f of SHARES8) {
      // the guard before D143 (the rollback, D128's check as it stood): past the age cap the reason is the gap with such an
      // income where that would keep it off all the same, else 'ages'; and since D143 the answer as check 2 derives it
      const p = reheld(base, f), share = shareOf(p), o = wantOf(ctx, p, share, true), w = wantOf(ctx, p, share);
      const got = coupleSolverOn(p, true), gotOld = withSwitch('noopen', () => coupleSolverOn(p, true));
      if (!o.fits && o.why === 'gapincome') capGap++;
      if (!o.fits && o.why === 'ages') capAges++;
      n++;
      if (o.why === 'gapincome') moved++;
      if (o.far && o.why === null) onFar++;
      if (o.far && o.why === 'uneven') offFar++;
      if (w.route === 'household' && w.lifted.includes('G')) openG++;
      if (w.why === 'shape' && w.far && w.other) shapeG++;
      if (!w.fits && w.why === 'shape') capShape++;
      if (w.why === 'uneven' || w.why === 'gapincome') keptOld++;
      if (!answers(gotOld, o)) { oldDiffer++; if (first.length < 3) first.push(`${c.id}, ${dir * g} years, ${iname}, held ${f}, the guard before D143: ${shown(gotOld)} against ${shown(o)}`); }
      if (!answers(got, w)) { differ++; if (first.length < 3) first.push(`${c.id}, ${dir * g} years, ${iname}, held ${f}: ${shown(got)} against ${shown(w)}`); }
    }
  }
  const { unitOf, PANEL: SHAPES_PANEL } = await import('../solver/shapes-panel.mjs');
  const targets = Object.fromEntries(JSON.parse(readFileSync(SHAPES_PANEL, 'utf8')).units.map(u => [u.id, u.target]));
  // step 5's gap couples: before D143 the four with a DB pension kept off for it and the four without one solved; since D143 the
  // four with one solved on the household route (G lifted), the four without one as before, on no route named
  const step5 = ['S149', 'S337F', 'S147-db', 'S061-dbpart'].flatMap(b => ['gap8', 'gap12'].map(s => `${b}@${s}`)).map(id => {
    const plan = unitOf(id).planAt(targets[id]), g = coupleSolverOn(plan, true), gOld = withSwitch('noopen', () => coupleSolverOn(plan, true));
    return [id, g.on ? (g.route ? `on, ${g.route}, ${g.lifted.join('+')}` : 'on') : g.why, gOld.on ? (gOld.route ? 'on, a route' : 'on') : gOld.why]; });
  const db = id => /^S(147-db|061-dbpart)@/.test(id);
  const step5ok = step5.length === 8 && step5.every(([id, w, wOld]) => wOld === (db(id) ? 'gapincome' : 'on') && w === (db(id) && allOpen ? 'on, household, G' : db(id) ? 'gapincome' : 'on'));
  ok(`8. a couple more than ${DB_GAP_UP_TO} years apart with other taxable income: before D143 (the rollback) it keeps the app's rules ('gapincome'), exactly where the engine's own reading of the plan puts the two ages more than ${DB_GAP_UP_TO} apart and an income taxable, not earnings and above nought, past the age cap too where its holdings are inside the guard, no other couple moved; since D143 each answer as check 2 derives it, such a couple opened on the household route where the household plan takes its shape${allOpen && SWAP_ELDER ? ', none kept off for its holdings or its gap' : ''}; step 5's gap couples`,
    differ === 0 && oldDiffer === 0 && moved > 0 && onFar > 0 && offFar > 0 && otherSeen > 0 && capGap > 0 && capAges > 0 && step5ok && (!allOpen || !SWAP_ELDER || (openG > 0 && keptOld === 0)),
    `${n} plans (30 couples, ${GAPS.length} gaps either side, ${INCOMES.length} incomes, ${SHARES8.length} shares), ${differ} differing from D143's answer and ${oldDiffer} from the guard before it${first.length ? ` (${first.join('; ')})` : ''}; before D143 kept off for the gap with such an income ${moved}, solved though more than ${DB_GAP_UP_TO} apart ${onFar}, 'uneven' though more than ${DB_GAP_UP_TO} apart ${offFar}, plans with such an income ${otherSeen}, past the age cap 'gapincome' ${capGap} and 'ages' ${capAges}; since D143 opened for the gap on the household route ${openG}, 'shape' with the gap ${shapeG}, past the age cap 'shape' ${capShape}, kept off for its holdings or its gap ${keptOld}; step 5's gap couples (since D143 | before it): ${step5.map(([id, w, wOld]) => `${id} ${w} | ${wOld}`).join('; ')}`); }

// 9. the registered test's own units (D143): the guard on its panel's plans, and the client failing closed (check 3's runs)
{ const { readOpenPanel } = await import('../solver/couples-open-panel.mjs');
  const units = readOpenPanel(join(HERE, '../solver/couples-open-registered-panel.json'));
  // each household-route variant's lifted reasons, and each today's-route variant's refusal
  const LIFTED = { Y75: 'Y', Y90: 'Y', Y100: 'Y', E95: 'E', E100: 'E', S75: 'S', G8: 'G', G12: 'G', G8Y75: 'Y,G', G12P: 'G', G12R: 'G' };
  const SHAPE = { RY75: 'risks', RE100: 'risks', RS75: 'risks', RG8: 'risks', RG12P: 'risks' };
  // D145: the today's-route units whose shape the household plan takes since step 4's change of default, on the household route
  // lifting their class's reasons (RWY75: its later retiree paid in plan year 0, the younger holding 75%)
  const TAKEN = { RWY75: 'Y' };
  const house = units.filter(u => u.route === 'household'), today = units.filter(u => u.route === 'today');
  let wrong = 0, wrongOld = 0, wrongAny = 0, takenOn = 0; const first = [];
  for (const u of units) {
    const g = coupleSolverOn(u.plan, true), gOld = withSwitch('noopen', () => coupleSolverOn(u.plan, true)), gAny = withSwitch('noshape', () => coupleSolverOn(u.plan, true));
    const lifts = LIFTED[u.variant] || TAKEN[u.variant];
    const okNow = u.route === 'household' || TAKEN[u.variant] ? g.on && g.why === null && g.route === 'household' && (g.lifted || []).join(',') === lifts && !g.swap && cutTakes(u.plan)
      : u.route === 'today' && !g.on && g.why === 'shape' && g.shape === SHAPE[u.variant] && !g.route;
    if (okNow && TAKEN[u.variant]) takenOn++;
    if (!okNow) { wrong++; if (first.length < 3) first.push(`${u.id}: ${shown(g)}`); }
    // the guard before D143: the reason the panel recorded when it was landed
    if (gOld.on || gOld.why !== u.why || gOld.route) { wrongOld++; if (first.length < 3) first.push(`${u.id}, the guard before D143: ${shown(gOld)} against '${u.why}'`); }
    if (u.route === 'today' && !(gAny.on && gAny.route === 'household')) wrongAny++;
  }
  const R = closedRuns || {}, kinds = r => (r && r.asked ? r.asked.map(a => a.kind) : []);
  const openedOk = !!R.opened && !R.opened.why && kinds(R.opened).includes('household-plan') && kinds(R.opened).includes('household') && !kinds(R.opened).some(k => k === 'couple-plans' || k === 'couple')
    && R.opened.asked.some(a => a.kind === 'solve' && a.slot === 'household') && !!R.opened.d && !!R.opened.d.couple && R.opened.d.couple.household === APP_COUPLE.household;
  const noFormOk = !!R.noForm && /^a couple the household route alone opens \(Y\) asked for no household form$/.test(R.noForm.why || '') && !kinds(R.noForm).length;
  // (the stand-in records a household cut it made: one the household plan refuses is not recorded, its refusal the reply)
  const anyShapeOk = !!R.anyShape && /^the household plan refused a couple the household route alone opens \(Y\): householdPlanFor: /.test(R.anyShape.why || '') && !kinds(R.anyShape).length;
  const heldOffOk = !!R.heldOff && /^the household plan refused a couple the guard keeps off for its shape \(risks\): householdPlanFor: /.test(R.heldOff.why || '') && !kinds(R.heldOff).length;
  const takenN = units.filter(u => TAKEN[u.variant]).length;
  ok(`9. the registered test's own units: the ${house.length} household-route units on, on the household route, each lifting its class's reasons, the page's cut taking each; of the ${today.length} today's-route units the ${takenN} whose shape the household plan takes since step 4 (D145, RWY75) on the household route the same way, and the other ${today.length - takenN} kept off for their shape; before D143 (the rollback) each off for the reason the panel recorded; with the shape not read the today's-route units opened; and the client failing closed, never today's route for a couple the household route alone opens or the guard keeps off for its shape`,
    house.length === 44 && today.length === 24 && units.length === 68 && takenN === 4 && takenOn === 4 && wrong === 0 && wrongOld === 0 && wrongAny === 0 && openedOk && noFormOk && heldOffOk && anyShapeOk,
    `${units.length} units, ${takenOn} of the ${takenN} taken since D145 on the household route, ${wrong} wrong since D143, ${wrongOld} wrong before it, ${wrongAny} of the today's-route units not opened with the shape not read${first.length ? ` (${first.join('; ')})` : ''}; the client: Y90 by default ${R.opened ? (R.opened.why ? `failed (${R.opened.why})` : `asked ${kinds(R.opened).join(', ')}, its record's form ${R.opened.d && R.opened.d.couple ? R.opened.d.couple.household : '-'}`) : 'not run'}; Y90 with no household form ${R.noForm ? (R.noForm.why ? `refused (${R.noForm.why})` : `solved, asked ${kinds(R.noForm).join(', ')}`) : 'not run'}; RY75 as held (the guard 'shape') ${R.heldOff ? (R.heldOff.why ? `refused (${R.heldOff.why.slice(0, 120)}), asked ${kinds(R.heldOff).join(', ') || 'nothing recorded'}` : `solved, asked ${kinds(R.heldOff).join(', ')}`) : 'not run'}; RY75 opened as if taken ${R.anyShape ? (R.anyShape.why ? `refused (${R.anyShape.why.slice(0, 160)}), asked ${kinds(R.anyShape).join(', ') || 'nothing recorded'}` : `solved, asked ${kinds(R.anyShape).join(', ')}`) : 'not run'}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
