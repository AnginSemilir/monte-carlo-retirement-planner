/*
 * A HOUSEHOLD'S MOVES, PERSON BY PERSON, IN THE PAGE'S VIEWS (step 8's port, research/solver/HSP-PORT.md step 3; D134 (1)).
 * The page's couple views (src/solverCouple.js: this year's actions and their skips, the next years, a market's rows) take a
 * household's solve too: its one move each year (src/solver/household.js chooseHouseholdSingle: the household table's move,
 * both people taking it, at the even split) taken apart for each person as a couple's joint move is. Each household is
 * assembled as the page assembles it (householdCut, its table solved inside the cut's bands, householdSolved), at light
 * settings, on two of step 8's units (S025-own, retired; S351F-90, with years before pension access):
 *   1. the engine's state read as the household's move reads it (modelStateOfCouple): chooseHouseholdSingle on it in the first
 *      year gives the move the engine took, field for field, both people's parts the same and the split even;
 *   2. a person's move put back as itself (withPersonMove) leaves the household's move as it was, for either person;
 *   3. each of this year's skips changes what it says and nothing else (a person's skip that person's part, the other person's
 *      move, the split and the household's level as they were; the household's level skip the level alone), and each
 *      alternative is the household table's best-ranked move that differs in that part, ranked at the household's merged
 *      state (recomputed here from the table);
 *   4. each skip runs through the engine, its cost (paths saved and lost against the plan's own runs, 200 paths of seed 99001)
 *      the same with the plan's runs handed in as run afresh, and the same with its runs split across two parts and joined;
 *   5. the next years (coupleAheadOf) and a market's rows (coupleRowsOf) take apart the household moves the engine took on
 *      that path, year for year;
 *   6. since COUPLES-ANY's change of default (D148; the reviewer on it, finding 4), a couple whose two people hold one wrapper
 *      at different risks (the library's S001 held 60/40, the partner's ISA one profile safer than the first person's, as the
 *      page assembles it): the household's ladder for the ISA starts at the partner's, so the first person's ISA tier move
 *      this year is offered no skip (no household move keeps it where it is: `noStay`), its words saying why
 *      (src/solverWords.js NO_STAY_WORDS); and no move of the two units above, whose people hold their wrappers alike, is.
 * Plants (--planted; each wants exactly the checks named): 'hhpersonrank' (the moves ranked at the first person's own state:
 * check 3), 'nosplit' (the split dropped from a forced move, a move put back as itself among them: checks 2 and 3),
 * 'skipstay' (src/solverCouple.js householdSkipsOf: the skip offered as before D148's fix round, the household's best other
 * tier, which can never mean staying put: check 6).
 *   node research/tests/household-views.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { bandsAt, chooseHouseholdSingle, mergedState } from '../../src/solver/household.js';
import { rankFor } from '../../src/solver/couple.js';
import { vecOf } from '../../src/solver/grid.js';
import { householdCut, householdSolved, coupleFirstMove, coupleSkipsOf, coupleSkipRuns, coupleActionsOf, coupleAheadOf, coupleRowsOf, modelStateOfCouple, withPersonMove, personParts, jointParts, isHousehold, isPair, PLANT } from '../../src/solverCouple.js';
import { solvedContext, strategyRuns, partsOf } from '../../src/solverStrategy.js';
import { coupleActionWords, NO_STAY_WORDS } from '../../src/solverWords.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { appJoint } from '../../src/solverSettings.js';
import { readHspPanel } from '../solver/household-hsp-panel.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['hhpersonrank', ['3']], ['nosplit', ['2', '3']], ['skipstay', ['6']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, HOUSEHOLD_VIEWS_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted exactly ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
PLANT.rule = process.env.HOUSEHOLD_VIEWS_PLANT || '';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const light = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const FORM = 'pensionsPA', SEED = 99001, N = 200;
const strip = j => { const { score, ...rest } = j; return JSON.stringify(rest); };
const others = (j, who) => JSON.stringify({ split: j.split, level: j.spendLevel, other: personParts(j, who === 'self' ? 'part' : 'self') });
const tiered = H => !!(H.c && H.c.acts && H.c.acts.some(a => (a.tierPen || 0) > 0 || (a.tierIsa || 0) > 0));

// the household as the page assembles it: the cut, its table solved inside the cut's bands, the household on it
const joint = appJoint(), panel = readHspPanel(), results = [];
for (const id of ['S025-own', 'S351F-90']) {
  const U = panel.find(u => u.id === id), cut = householdCut(E, M, U.plan, FORM), b = cut.bands;
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...light, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
  const f = coupleFirstMove(E, cp), again = chooseHouseholdSingle(cp, modelStateOfCouple(cp, E.freshState(f.sc)), 0);
  const sk = coupleSkipsOf(E, cp), runs = strategyRuns(E, cp, cut.household, { seed: SEED, from: 0, to: N });
  const a1 = coupleActionsOf(E, cp, cut.household, { seed: SEED, n: N }), a2 = coupleActionsOf(E, cp, cut.household, { seed: SEED, n: N, base: runs.solved });
  const halves = [coupleSkipRuns(E, cp, { seed: SEED, from: 0, to: N / 2 }), coupleSkipRuns(E, cp, { seed: SEED, from: N / 2, to: N })];
  const a3 = coupleActionsOf(E, cp, cut.household, { seed: SEED, n: N, base: runs.solved, parts: halves });
  results.push({ id, cp, f, again, sk, a1, a2, a3, runs, household: cut.household });
}
ok('0. the households assembled as the page assembles them are households, and the page\'s couple views take them', results.every(r => isHousehold(r.cp) && isPair(r.cp)));

// 1. the state read as the household's move reads it
ok('1. chooseHouseholdSingle on the state read here gives the move the engine took in the first year, both people\'s parts the same, the split even',
  results.every(r => strip(r.again) === strip(r.f.joint) && JSON.stringify(personParts(r.f.joint, 'self')) === JSON.stringify(personParts(r.f.joint, 'part')) && r.f.joint.split === 0.5),
  results.map(r => `${r.id}: level ${r.f.joint.spendLevel}, ${JSON.stringify(personParts(r.f.joint, 'self'))}`).join('; '));

// 2. a move put back as itself
ok('2. either person\'s move put back as itself leaves the household\'s move as it was', results.every(r => ['self', 'part'].every(w => strip(withPersonMove(r.cp, r.f.joint, w, w === 'self' ? r.f.joint.ia : r.f.joint.ib)) === strip(r.f.joint))));

// 3. each skip changes what it says and nothing else, its alternative the household table's own, ranked at the merged state
{ let n = 0; const bad = [];
  for (const r of results) {
    const { H } = r.cp, held = r.f.state.tierHeld.self;
    const ranked = rankFor(H, vecOf(H.m, mergedState(r.cp, r.f.state)), 0, tiered(H) ? { pen: held.pen, isa: held.isa } : null, H.actions.length);
    for (const x of r.sk.list) {
      if (!x.joint) continue;
      n++;
      const j0 = r.f.joint, j = x.joint;
      if (x.part === 'level') {
        const lvl = ai => (H.levelOf ? H.levelOf[ai] : H.actions[ai].spendLevel !== undefined ? H.actions[ai].spendLevel : 1);
        const want = lvl(ranked.find(ai => lvl(ai) !== j0.spendLevel));
        if (!(j.spendLevel === want && j.split === j0.split && strip({ ...j, spendLevel: j0.spendLevel }) === strip(j0))) bad.push(`${r.id} level`);
        continue;
      }
      const alt = ranked.find(ai => { const p = partsOf(H.actions[ai], { tierPen: H.actions[ai].tierPen || 0, tierIsa: H.actions[ai].tierIsa || 0 }); return x.part === 'draw' ? p.draw !== personParts(j0, x.who).draw : p[x.part] !== personParts(j0, x.who)[x.part]; });
      const mine = personParts(j, x.who)[x.part], was = personParts(j0, x.who)[x.part];
      const altOk = (x.who === 'self' ? j.ia : j.ib) === alt;
      if (mine === was || others(j, x.who) !== others(j0, x.who) || !('split' in j) || !altOk) bad.push(`${r.id} ${x.who} ${x.part}${altOk ? '' : ' (another alternative)'}`);
    }
  }
  ok('3. each skip changes its own part and nothing else (the person\'s part moved, the other person, the split and the level as they were), its alternative the household table\'s best-ranked move at the merged state',
    n > 0 && bad.length === 0, `${n} skips${bad.length ? `; wrong: ${bad.join(', ')}` : ''}`); }

// 4. each skip runs, its cost the same with the plan's runs handed in, and with its runs split in two and joined
ok('4. every skip runs through the engine, its cost the same with the plan\'s runs handed in as run afresh, and with its runs split across two parts and joined',
  results.every(r => JSON.stringify(r.a1.actions) === JSON.stringify(r.a2.actions) && JSON.stringify(r.a3.actions) === JSON.stringify(r.a1.actions) && r.a1.actions.every(a => a.skip === null || Number.isFinite(a.cost)) && r.a1.couple === true),
  results.map(r => `${r.id}: ${r.a1.actions.map(a => `${a.who} ${a.part} ${a.cost === null ? 'no skip' : a.cost.toFixed(2)}`).join(', ')}`).join('; '));

// 5. the next years and the rows take apart the household moves the engine took
{ let bad = 0;
  for (const r of results) {
    const ahead = coupleAheadOf(E, r.cp, null, r.runs, { years: 10 }), sc = solvedContext(E, r.cp), seen = [];
    const ctx = { ...sc, policyOverride: { ...sc.policyOverride, choose(st, t) { const j = sc.policyOverride.choose(st, t); seen[t] = jointParts(j); return j; } } };
    const zs = E.pathsForSeed(SEED, ahead.path + 1, sc.totalYears)[ahead.path], state = E.freshState(ctx), zPath = zs.length > sc.totalYears + 1 ? zs[sc.totalYears + 1] : 0;
    for (let t = 0; t < Math.min(10, sc.totalYears + 1); t++) E.stepYear(ctx, state, t, { z: zs[t], zPath });
    if (ahead.rows.some((row, t) => JSON.stringify(row.parts) !== JSON.stringify(seen[t]))) bad++;
    const rows = coupleRowsOf(E, r.cp, 'expected'), seen2 = [];
    const ctx2 = { ...sc, policyOverride: { ...sc.policyOverride, choose(st, t) { const j = sc.policyOverride.choose(st, t); seen2[t] = jointParts(j); return j; } } }, st2 = E.freshState(ctx2);
    for (let t = 0; t <= sc.totalYears; t++) E.stepYear(ctx2, st2, t, 'expected');
    if (rows.parts.some((p, t) => JSON.stringify(p) !== JSON.stringify(seen2[t] || null))) bad++;
  }
  ok('5. the next years and a market\'s rows take apart the household moves the engine took, year for year', bad === 0, `${bad} differing`); }

// 6. one wrapper held at two risks: the person holding it at more risk offered no skip that could never mean staying put
{ const c = buildScenarios().find(x => x.id === 'S001'), re = structuredClone(c.plan), tot = {};
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); tot[k] = (tot[k] || 0) + (Number(a.balance) || 0); }
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); if (/_self$/.test(a.id)) a.balance = tot[k] * 0.6; else if (/_part$/.test(a.id)) a.balance = tot[k] * 0.4; }
  const mine = re.accounts.find(a => a.id === 'isa_self'), theirs = re.accounts.find(a => a.id === 'isa_part'), RISK = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
  if (!mine || !theirs) throw new Error('check 6: S001 has no ISA for each person');
  theirs.risk = RISK[RISK.indexOf(mine.risk) + 1];
  const cut = householdCut(E, M, re, FORM), b = cut.bands;
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...light, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
  const acts = coupleActionsOf(E, cp, cut.household, { seed: SEED, n: N }).actions, ctx = { target: 30000, fmt: x => `£${Math.round(x)}` };
  const stay = acts.filter(a => a.noStay), isa = acts.find(a => a.who === 'self' && a.part === 'tierIsa');
  const elsewhere = results.flatMap(r => r.a1.actions).filter(a => a.noStay).length;
  ok('6. since D148, a couple holding one wrapper at two risks (S001 held 60/40, the partner\'s ISA one profile safer): the first person\'s ISA tier move this year offered no skip, no household move keeping it where it is, its words saying why; no move so marked where the two hold their wrappers alike',
    !!cp.tierMap && !!isa && isa.noStay === true && isa.skip === null && isa.cost === null && stay.every(a => a.who === 'self' && a.part === 'tierIsa') && coupleActionWords(isa, ctx).cost === NO_STAY_WORDS && elsewhere === 0,
    `the tier map ${cp.tierMap ? 'on' : 'off'}; this year's actions ${acts.map(a => `${a.who} ${a.part} ${a.value}${a.noStay ? ' (no skip: noStay)' : a.cost === null ? ' (no skip)' : ` (skip ${a.cost.toFixed(2)})`}`).join(', ')}; marked on the units held alike ${elsewhere}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
