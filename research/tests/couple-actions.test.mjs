/*
 * A COUPLE'S MOVES, PERSON BY PERSON (Part D, D5.3; research/solver/PART-D.md; src/solverCouple.js).
 *   1. the engine's state read as the joint move reads it (modelStateOfCouple): chooseJoint on it in the first year gives the
 *      joint move the engine took, field for field;
 *   2. a person's move put back as itself (withPersonMove) leaves that joint move as it was, for either person;
 *   3. each of this year's skips changes what it says and nothing else: a person's skip that person's part (their draw,
 *      harvest or a tier), the other person's move, the split and the household's level as they were; the household's level
 *      skip the level alone;
 *   4. each skip runs through the engine, and its cost (paths saved and lost against the plan's own runs, 200 paths of seed
 *      99001) is the same with the plan's runs handed in as run afresh;
 *   5. the next years (coupleAheadOf) and a market's rows (coupleRowsOf) take apart the joint moves the engine took on that
 *      path, year for year.
 * Plants (--planted): 'skipother' (the skip moves the other person: check 3), 'nosplit' (the split dropped from a forced move:
 * check 3).
 *   node research/tests/couple-actions.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCouple, chooseJoint } from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { householdPlan, coupleFirstMove, coupleSkipsOf, coupleActionsOf, coupleAheadOf, coupleRowsOf, modelStateOfCouple, withPersonMove, personParts, jointParts, PLANT } from '../../src/solverCouple.js';
import { solvedContext, strategyRuns, runPath } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['skipother', ['3']], ['nosplit', ['3']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_ACTIONS_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), ok = want.every(c => failed.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${ok ? 'yes' : 'NO'}`);
    if (!ok) bad++;
  }
  process.exit(bad ? 1 : 0);
}
PLANT.rule = process.env.COUPLE_ACTIONS_PLANT || '';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const light = { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple');
const strip = j => { const { score, ...rest } = j; return JSON.stringify(rest); };
const others = (j, who) => JSON.stringify({ split: j.split, level: j.spendLevel, other: personParts(j, who === 'self' ? 'part' : 'self') });

// two couples: one already retired, one with years before access, so draws, harvests and tiers all appear in the first year
const picks = [couples.find(s => Number(s.plan.demographics.currentAgeSelf) >= 66), couples.find(s => Number(s.plan.demographics.currentAgeSelf) < 58 && Number(s.plan.demographics.currentAgeSelf) >= 50)].filter(Boolean);
const results = [];
for (const c of picks) {
  const household = householdPlan(E, c.plan);
  const cp = solveCouple(E, M, household, { solveOne: (p, o) => solveForApp(E, M, p, { ...light, ageWith: o.partnerAge0 }) });
  const f = coupleFirstMove(E, cp), again = chooseJoint(cp, modelStateOfCouple(cp, E.freshState(f.sc)), 0);
  const sk = coupleSkipsOf(E, cp), runs = strategyRuns(E, cp, household, { seed: 99001, from: 0, to: 200 });
  const a1 = coupleActionsOf(E, cp, household, { seed: 99001, n: 200 }), a2 = coupleActionsOf(E, cp, household, { seed: 99001, n: 200, base: runs.solved });
  results.push({ c, cp, f, again, sk, a1, a2, runs });
}

// 1. the state read as the joint move reads it
ok('1. chooseJoint on the state read here gives the joint move the engine took in the first year', results.every(r => strip(r.again) === strip(r.f.joint)), results.map(r => `${r.c.id} split ${r.f.joint.split} level ${r.f.joint.spendLevel}`).join('; '));

// 2. a move put back as itself
ok('2. either person\'s move put back as itself leaves the joint move as it was', results.every(r => ['self', 'part'].every(w => strip(withPersonMove(r.cp, r.f.joint, w, w === 'self' ? r.f.joint.ia : r.f.joint.ib)) === strip(r.f.joint))));

// 3. each skip changes what it says and nothing else
{ let n = 0, bad = [];
  for (const r of results) for (const x of r.sk.list) {
    if (!x.joint) continue;
    n++;
    const j0 = r.f.joint, j = x.joint;
    if (x.part === 'level') { if (!(j.spendLevel !== j0.spendLevel && j.split === j0.split && JSON.stringify(personParts(j, 'self').draw) === JSON.stringify(personParts(j0, 'self').draw))) bad.push(`${r.c.id} level`); continue; }
    const mine = personParts(j, x.who)[x.part], was = personParts(j0, x.who)[x.part];
    if (mine === was || others(j, x.who) !== others(j0, x.who) || !('split' in j)) bad.push(`${r.c.id} ${x.who} ${x.part}`);
  }
  ok('3. each skip changes its own part and nothing else: the person\'s part moved, the other person, the split and the level as they were', n > 0 && bad.length === 0, `${n} skips${bad.length ? `; wrong: ${bad.join(', ')}` : ''}`); }

// 4. each skip runs, its cost the same with the plan's runs handed in
ok('4. every skip runs through the engine, its cost the same with the plan\'s runs handed in as run afresh', results.every(r => JSON.stringify(r.a1.actions) === JSON.stringify(r.a2.actions) && r.a1.actions.every(a => a.skip === null || Number.isFinite(a.cost))),
  results.map(r => `${r.c.id}: ${r.a1.actions.map(a => `${a.who} ${a.part} ${a.cost === null ? 'no skip' : a.cost.toFixed(2)}`).join(', ')}`).join('; '));

// 5. the next years and the rows take apart the joint moves the engine took
{ let bad = 0;
  for (const r of results) {
    const ahead = coupleAheadOf(E, r.cp, null, r.runs, { years: 10 }), sc = solvedContext(E, r.cp), seen = [];
    const ctx = { ...sc, policyOverride: { ...sc.policyOverride, choose(st, t) { const j = sc.policyOverride.choose(st, t); seen[t] = jointParts(j); return j; } } };
    const zs = E.pathsForSeed(99001, ahead.path + 1, sc.totalYears)[ahead.path], state = E.freshState(ctx), zPath = zs.length > sc.totalYears + 1 ? zs[sc.totalYears + 1] : 0;
    for (let t = 0; t < Math.min(10, sc.totalYears + 1); t++) E.stepYear(ctx, state, t, { z: zs[t], zPath });
    if (ahead.rows.some((row, t) => JSON.stringify(row.parts) !== JSON.stringify(seen[t]))) bad++;
    const rows = coupleRowsOf(E, r.cp, 'expected'), seen2 = [];
    const ctx2 = { ...sc, policyOverride: { ...sc.policyOverride, choose(st, t) { const j = sc.policyOverride.choose(st, t); seen2[t] = jointParts(j); return j; } } }, st2 = E.freshState(ctx2);
    for (let t = 0; t <= sc.totalYears; t++) E.stepYear(ctx2, st2, t, 'expected');
    if (rows.parts.some((p, t) => JSON.stringify(p) !== JSON.stringify(seen2[t] || null))) bad++;
  }
  ok('5. the next years and a market\'s rows take apart the joint moves the engine took, year for year', bad === 0, `${bad} differing`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
