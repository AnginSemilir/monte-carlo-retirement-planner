/*
 * THE COUPLES' DEFAULT AND THE GUARD (D99, 14 Nov: item 6's stage C read once, PASS, research/solver/results-couples-share.txt;
 * the maintainer's D97 (1)). By the registration (research/solver/registrations/couples-share.md, Outcomes) a PASS makes
 * `shareRule: 'pots'` the couples' default and lifts M4's guard for couples whose elder holds more than 60% and at most 90% of
 * the pots, and D97 (1) runs couples under the opt-in; "for what the panel tested", every couple of which had its elder
 * entered first (the deep review of 14 Nov: the joint move weighs both estates at the first person's table's weight). This holds
 * the code to that and to STATE.md's decided-defaults block:
 *   1. the decided-defaults block's `couples` entry is the code's: the switch on (src/couplesSwitch.js COUPLES), the couples'
 *      share rule (src/solverSettings.js APP_COUPLE), the band (COUPLE_BAND), the elder's limit (ELDER_UP_TO), the elder
 *      entered first (ELDER_FIRST), the swap of a couple whose elder is entered second (SWAP_ELDER, D104 (1)), the couples'
 *      joint move (APP_COUPLE's tieJoint, tieLook and holdPast, D108: TIE-C2's LOOKHOLD), the age gap past which a couple
 *      with other taxable income keeps the app's rules (DB_GAP_UP_TO, D128) and the household plan's form (APP_COUPLE's
 *      household, D134 (1) and D135: step 8's HSPA, 'pensionsPA'); a block without the entry, with another rule, without the
 *      joint move, without the gap or without the household, fails it;
 *   2. the guard (coupleSolverOn): over the library's 210 couples, each re-held at twelve shares of its first person's from 5%
 *      to 95% (every wrapper alike), with their ages as entered, swapped (the first person the younger), the same, and the
 *      partner's age left blank, on exactly where the first person holds 40% to 60% of the pots, or the first person is the
 *      elder by the engine's own reading of their ages (App.jsx buildContext's ageSelf0 and agePart0) and holds more than 60%
 *      and at most 90%, or, with the swap on (SWAP_ELDER, D104 (1)), the partner is the elder and holds that much; swapped
 *      (`swap`) exactly where it is on and its elder is entered second; its `why` 'uneven' everywhere else, and 'off' with the
 *      switch off;
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
 *      list (src/solverApproximations.js, the coverage card and the documentation) says which couples it plans for and that any
 *      other keeps the app's rules, with couples on: the older partner holding up to 90% with the swap on, the older partner
 *      entered first with it off, and either way not a couple more than three years apart with other taxable income (D128,
 *      the words held to DB_GAP_UP_TO); with the household default (APP_COUPLE's household, D135), how it plans a couple,
 *      one plan for the money the two hold and each of them planned apart where one plan cannot hold their plan
 *      (src/solverApproximations.js HOUSEHOLD_SENTENCE), in both lines with couples on; with couples off (the rollback), the
 *      line before D99; eight lines each way;
 *   5. a couple's cut gives each person what the couple's own run reads (the reviewer on D99, finding 4): over 30 of the
 *      library's couples, with each person's age, each retirement age or the plan's end age left blank, the ages as text, or
 *      the end age at the first person's age, each person's plan (src/solverCouple.js couplePlans) has the age today, the
 *      retirement age, the salary, the state pension and the horizon the household's context gives that person;
 *   6. a couple whose partner would pass 120 before the plan ends keeps the app's rules (the reviewer on D99, second round,
 *      MINOR 1: a person's table cannot run past 120, so the cut would give that partner a shorter horizon and the figures
 *      fail): over 30 of the library's couples, each end age from 95 to 120 and the partner from their own age to 35 years
 *      older, the guard 'ages' exactly where the engine's own ages put the partner past 120 by the plan's end, and every
 *      couple the guard runs cut to the couple's horizon for both people; the reviewer's two cases among them;
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
 *      and the four without it still solved.
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
 * D135: check 4). Check 1's planted blocks run in every run.
 *   node research/tests/couple-default.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { COUPLES, COUPLE_BAND, ELDER_UP_TO, ELDER_FIRST, SWAP_ELDER, DB_GAP_UP_TO, coupleSolverOn, elderOf, horizonFits, PLANT as SWITCH_PLANT } from '../../src/couplesSwitch.js';
import { APP_COUPLE, appJoint, jointKey } from '../../src/solverSettings.js';
import { couplePlans, householdCut, PLANT as COUPLE_PLANT } from '../../src/solverCouple.js';
import { solverApproximations, COUPLES_LINE, HOUSEHOLD_SENTENCE, PLANT as WORDS_PLANT } from '../../src/solverApproximations.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['firstnotelder', ['2', '8']], ['eldereither', ['2']], ['halfdefault', ['3']], ['notie', ['3', '7']], ['oldcouples', ['4']], ['rawages', ['5']], ['noagecap', ['6', '8']], ['nojointcheck', ['7']], ['nogapguard', ['8']], ['nogapline', ['4']], ['nohousehold', ['3']], ['nohouseline', ['4']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_DEFAULT_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
const PLANTED = process.env.COUPLE_DEFAULT_PLANT || '';
if (PLANTED === 'firstnotelder' || PLANTED === 'eldereither' || PLANTED === 'noagecap' || PLANTED === 'nogapguard') SWITCH_PLANT.rule = PLANTED;
if (PLANTED === 'oldcouples' || PLANTED === 'nogapline' || PLANTED === 'nohouseline') WORDS_PLANT.rule = PLANTED;
if (PLANTED === 'rawages') COUPLE_PLANT.rule = PLANTED;

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

// 1. the decided-defaults block's couples entry against the code
{ const blockOf = text => { const m = /<!-- decided-defaults([\s\S]*?)-->/.exec(text); return m ? JSON.parse(m[1]) : null; };
  const code = { on: COUPLES, shareRule: APP_COUPLE.shareRule, band: [...COUPLE_BAND], elderUpTo: ELDER_UP_TO, elderFirst: ELDER_FIRST, swapElder: SWAP_ELDER, tieJoint: APP_COUPLE.tieJoint, tieLook: APP_COUPLE.tieLook, holdPast: APP_COUPLE.holdPast, dbGapUpTo: DB_GAP_UP_TO, household: APP_COUPLE.household };
  const agrees = D => !!(D && D.couples) && JSON.stringify(D.couples) === JSON.stringify(code);
  const D = blockOf(readFileSync(join(HERE, '../solver/STATE.md'), 'utf8'));
  const without = D ? { ...D } : null; if (without) delete without.couples;
  const half = D ? { ...D, couples: { ...D.couples, shareRule: 'half' } } : null;
  const noTie = D && D.couples ? { ...D, couples: Object.fromEntries(Object.entries(D.couples).filter(([k]) => !['tieJoint', 'tieLook', 'holdPast'].includes(k))) } : null;
  const noGap = D && D.couples ? { ...D, couples: Object.fromEntries(Object.entries(D.couples).filter(([k]) => k !== 'dbGapUpTo')) } : null;
  const noHouse = D && D.couples ? { ...D, couples: Object.fromEntries(Object.entries(D.couples).filter(([k]) => k !== 'household')) } : null;
  ok('1. the decided-defaults block\'s couples entry is the code\'s (the switch, the share rule, the band, the elder\'s limit, the elder entered first, the swap, the joint move, the age gap with other taxable income, the household plan\'s form); planted, a block without it, with the half share, without the joint move, without the gap or without the household fails',
    agrees(D) && !agrees(without) && !agrees(half) && !agrees(noTie) && !agrees(noGap) && !agrees(noHouse) && APP_COUPLE.tieJoint === 1e-4 && APP_COUPLE.tieLook === true && APP_COUPLE.holdPast === 2 && DB_GAP_UP_TO === 3 && APP_COUPLE.household === 'pensionsPA',
    `the block ${JSON.stringify(D && D.couples)}; the code ${JSON.stringify(code)}`); }

// 2. the guard over the library's couples, re-held, under four arrangements of their ages
const lib = buildScenarios(), couples = lib.filter(s => s.plan.demographics.planningMode === 'couple');
const reheld = (plan, f) => { const re = JSON.parse(JSON.stringify(plan)), tot = {};
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); tot[k] = (tot[k] || 0) + (Number(a.balance) || 0); }
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); if (/_self$/.test(a.id)) a.balance = tot[k] * f; else if (/_part$/.test(a.id)) a.balance = tot[k] * (1 - f); }
  return re; };
const withAges = (plan, how) => { const re = JSON.parse(JSON.stringify(plan)), d = re.demographics;
  if (how === 'swapped') [d.currentAgeSelf, d.currentAgePart] = [d.currentAgePart, d.currentAgeSelf];
  else if (how === 'same') d.currentAgePart = d.currentAgeSelf;
  else if (how === 'blank') d.currentAgePart = '';
  return re; };
{ const SHARES = [0.05, 0.1, 0.25, 0.39, 0.4, 0.5, 0.6, 0.61, 0.75, 0.9, 0.91, 0.95];
  let n = 0, differ = 0, on = 0, elderSeen = { self: 0, part: 0, none: 0 }, mismatchAge = 0, offWhy = 0, elderSecond = 0;
  const first = [];
  for (const c of couples) for (const how of ['entered', 'swapped', 'same', 'blank']) {
    const aged = withAges(c.plan, how), ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(aged)));
    const engineElder = ctx.ageSelf0 > ctx.agePart0 ? 'self' : ctx.agePart0 > ctx.ageSelf0 ? 'part' : null;
    if (elderOf(aged) !== engineElder) mismatchAge++;
    elderSeen[engineElder || 'none']++;
    for (const f of SHARES) {
      const p = reheld(aged, f), of = w => p.accounts.filter(a => a.id.endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
      const share = of('self') / (of('self') + of('part'));
      // only the elder holding more lifts the guard: the first person as the elder, or with the swap on (D104 (1)) the partner,
      // the couple then handed to the solver on its mirror wherever it runs
      const held = engineElder === 'self' ? share : engineElder === 'part' && SWAP_ELDER ? 1 - share : null, inBand = share >= 0.4 - 1e-9 && share <= 0.6 + 1e-9;
      const want = inBand || (held !== null && held > 0.6 + 1e-9 && held <= 0.9 + 1e-9), wantSwap = want && SWAP_ELDER && engineElder === 'part';
      if (engineElder === 'part' && !inBand && 1 - share > 0.6 + 1e-9 && 1 - share <= 0.9 + 1e-9) elderSecond++;
      const got = coupleSolverOn(p, true);
      n++; if (got.on) on++;
      if (got.on !== want || got.why !== (want ? null : 'uneven') || !!got.swap !== wantSwap) { differ++; if (first.length < 3) first.push(`${c.id} ${how} ${f}: ${got.on} (swap ${!!got.swap}) against ${want} (swap ${wantSwap})`); }
      if (coupleSolverOn(p, false).why !== 'off') offWhy++;
    }
  }
  ok(`2. the guard: on exactly where the first person holds 40% to 60%, or the elder by the engine's ages holds more than 60% and at most 90% (${SWAP_ELDER ? 'entered either way, swapped exactly where on and entered second' : 'entered first'}); 'uneven' elsewhere; 'off' with the switch off`,
    couples.length === 210 && n === 210 * 4 * 12 && differ === 0 && mismatchAge === 0 && offWhy === 0 && elderSeen.part > 0 && elderSeen.self > 0 && elderSeen.none > 0 && elderSecond > 0,
    `${n} plans, ${on} on, ${differ} differing${first.length ? ` (${first.join('; ')})` : ''}; the switch's elder against the engine's ages ${mismatchAge} differing; the elder the first person ${elderSeen.self}, the partner ${elderSeen.part}, neither ${elderSeen.none} (couple-arrangements); an elder entered second holding more than 60% and at most 90%, kept off: ${elderSecond} plans; 'off' wrong ${offWhy}`); }

// 3. the page's solve of a couple: what the client asks its workers, by in-process stand-ins that record it
let refused = null;   // check 7, below: the client's read-back of each assembly's joint move
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
  if (PLANTED === 'halfdefault' || PLANTED === 'notie' || PLANTED === 'nojointcheck' || PLANTED === 'nohousehold') C.PLANT.rule = PLANTED;
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
  refused = { why, kept }; }

// 4. the words the page shows about couples follow the switch
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
  ok(`4. the coverage list says which couples the solver plans for and that any other keeps the app's rules (couples on: the older partner ${SWAP_ELDER ? 'either way, the swap on' : 'entered first'}, not a couple more than ${gapWords} years apart with other taxable income${APP_COUPLE.household ? ', and how it plans a couple, one plan for the money the two hold (D135)' : ''}); the elder entered first with the swap off; the line before D99 with couples off; eight lines each way`,
    COUPLES && on.length === 8 && off.length === 8 && first.length === 8 && says(lineOn, !SWAP_ELDER) && says(lineFirst, true) && lineOn === (SWAP_ELDER ? COUPLES_LINE.on : COUPLES_LINE.onFirst) && lineFirst === COUPLES_LINE.onFirst && lineOff === COUPLES_LINE.off && !on.includes(COUPLES_LINE.off)
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
  for (const c of couples.slice(0, 30)) for (const end of [95, 100, 110, 120]) for (const older of [0, 15, 25, 35]) {
    const p = JSON.parse(JSON.stringify(c.plan)), d = p.demographics;
    d.terminalAge = end; d.currentAgePart = Math.min(120, Number(d.currentAgePart) + older);
    cases.push([`${c.id} ending at ${end}, the partner ${older} years older`, p]);
  }
  // the reviewer's two: S001 held 60/40 at 49 and 70 ending at 100; a blank first age beside a partner of 66 ending at 95
  { const s1 = couples.find(x => x.id === 'S001') || couples[0];
    const a = JSON.parse(JSON.stringify(s1.plan)); Object.assign(a.demographics, { currentAgeSelf: 49, currentAgePart: 70, terminalAge: 100 }); cases.push(['the reviewer\'s 49 and 70 ending at 100', a]);
    const b = JSON.parse(JSON.stringify(s1.plan)); Object.assign(b.demographics, { currentAgeSelf: '', currentAgePart: 66, terminalAge: 95 }); cases.push(['the reviewer\'s blank and 66 ending at 95', b]); }
  for (const [name, p] of cases) {
    const h = E.buildContext(E.resolveMpaa(E.normalizePlan(p))), fits = h.agePart0 + (h.terminalAge - h.ageSelf0) <= 120 + 1e-9;
    const g = coupleSolverOn(p, true);
    n++; if (!fits) capped++;
    if ((g.why === 'ages') !== !fits) { wrongWhy++; if (first.length < 3) first.push(`${name}: the guard '${g.why}', the engine's partner ${h.agePart0 + (h.terminalAge - h.ageSelf0)} at the end`); }
    if (g.on) {
      ran++;
      const cut = couplePlans(E, p), short = ['self', 'part'].some(w => E.buildContext(cut.plans[w]).totalYears !== h.totalYears);
      if (short) { shortOn++; if (first.length < 3) first.push(`${name}: run, its cut short of the couple's ${h.totalYears} years`); }
    }
  }
  const named = cases.slice(-2).every(([, p]) => coupleSolverOn(p, true).why === 'ages');
  ok('6. a couple whose partner would pass 120 before the plan ends keeps the app\'s rules (\'ages\'), exactly where the engine\'s ages put them past it; every couple run cut to its whole horizon; the reviewer\'s two cases kept off',
    wrongWhy === 0 && shortOn === 0 && capped > 0 && ran > 0 && named && cases.every(([, p]) => horizonFits(p) === (coupleSolverOn(p, true).why !== 'ages')),
    `${n} plans, ${capped} past 120 by the end, ${ran} run; the reason wrong on ${wrongWhy}, a run couple cut short on ${shortOn}${first.length ? `: ${first.join('; ')}` : ''}`); }

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
  let n = 0, differ = 0, moved = 0, onFar = 0, offFar = 0, otherSeen = 0, capGap = 0, capAges = 0; const first = [];
  for (const c of couples.slice(0, 30)) for (const g of GAPS) for (const dir of g === 0 ? [1] : [1, -1]) for (const [iname, income] of INCOMES) {
    const base = JSON.parse(JSON.stringify(c.plan));
    base.demographics.currentAgePart = Number(base.demographics.currentAgeSelf) - dir * g;   // dir 1: the partner the younger
    if (g === 22) base.demographics.terminalAge = 100;   // 22 years older, the partner past 120 by the plan's end (the reviewer on D128, MINOR 2)
    if (income) base.otherIncomes = [...(base.otherIncomes || []), income];
    const ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(base)));
    const fits = ctx.agePart0 + (ctx.terminalAge - ctx.ageSelf0) <= 120 + 1e-9, engineElder = ctx.ageSelf0 > ctx.agePart0 ? 'self' : ctx.agePart0 > ctx.ageSelf0 ? 'part' : null;
    const far = Math.abs(ctx.ageSelf0 - ctx.agePart0) > DB_GAP_UP_TO + 1e-9, other = ctx.otherIncomes.some(i => !i.taxFree && !i.isEarnings && i.amount > 0);
    if (other) otherSeen++;
    for (const f of SHARES8) {
      const p = reheld(base, f), of = w => p.accounts.filter(a => a.id.endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
      const share = of('self') / (of('self') + of('part')), inBand = share >= 0.4 - 1e-9 && share <= 0.6 + 1e-9;
      const held = engineElder === 'self' ? share : engineElder === 'part' && SWAP_ELDER ? 1 - share : null, holds = inBand || (held !== null && held > 0.6 + 1e-9 && held <= 0.9 + 1e-9);
      // past the age cap the reason is the gap with such an income where that would keep it off all the same, else 'ages'
      const want = !fits ? (holds && far && other ? 'gapincome' : 'ages') : !holds ? 'uneven' : far && other ? 'gapincome' : null, got = coupleSolverOn(p, true);
      if (!fits && want === 'gapincome') capGap++;
      if (!fits && want === 'ages') capAges++;
      n++;
      if (want === 'gapincome') moved++;
      if (far && want === null) onFar++;
      if (far && want === 'uneven') offFar++;
      if (got.why !== want || got.on !== (want === null)) { differ++; if (first.length < 3) first.push(`${c.id}, ${dir * g} years, ${iname}, held ${f}: '${got.why}' against '${want}'`); }
    }
  }
  const { unitOf, PANEL: SHAPES_PANEL } = await import('../solver/shapes-panel.mjs');
  const targets = Object.fromEntries(JSON.parse(readFileSync(SHAPES_PANEL, 'utf8')).units.map(u => [u.id, u.target]));
  const step5 = ['S149', 'S337F', 'S147-db', 'S061-dbpart'].flatMap(b => ['gap8', 'gap12'].map(s => `${b}@${s}`)).map(id => { const g = coupleSolverOn(unitOf(id).planAt(targets[id]), true); return [id, g.on ? 'on' : g.why]; });
  const step5ok = step5.length === 8 && step5.every(([id, w]) => w === (/^S(147-db|061-dbpart)@/.test(id) ? 'gapincome' : 'on'));
  ok(`8. a couple more than ${DB_GAP_UP_TO} years apart with other taxable income keeps the app's rules ('gapincome'), exactly where the engine's own reading of the plan puts the two ages more than ${DB_GAP_UP_TO} apart and an income taxable, not earnings and above nought, past the age cap too where its holdings are inside the guard ('ages' else); a couple kept off before stays off; step 5's four gap couples with a DB pension kept off, the four without it solved`,
    differ === 0 && moved > 0 && onFar > 0 && offFar > 0 && otherSeen > 0 && capGap > 0 && capAges > 0 && step5ok,
    `${n} plans (30 couples, ${GAPS.length} gaps either side, ${INCOMES.length} incomes, ${SHARES8.length} shares), ${differ} differing${first.length ? ` (${first.join('; ')})` : ''}; kept off for the gap with such an income ${moved}, solved though more than ${DB_GAP_UP_TO} apart ${onFar}, 'uneven' though more than ${DB_GAP_UP_TO} apart ${offFar}; past the age cap, 'gapincome' ${capGap} and 'ages' ${capAges}; step 5: ${step5.map(([id, w]) => `${id} ${w}`).join(', ')}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
