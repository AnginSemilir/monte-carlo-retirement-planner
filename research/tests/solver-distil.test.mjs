/*
 * THE RULE OF THUMB (Part C Phase 9, item 7; src/solverDistil.js). The full tier.
 *
 * 1. On hand-made decisions that follow a known rule of two questions (under 20 years of spending held: 80%; at least 20
 *    and under 70: the target; at least 20 and 70 or over: 110%), the tree finds it: every decision given, three leaves,
 *    the thresholds where the rule puts them. Planted, a tree of one question: fewer given.
 * 2. Its rules read one range per question (a question asked twice on the way is one range), and the leaves' levels.
 * 3. On S126 at light settings: the decisions are the retired years of the paths it learns on (apart from the paths it is
 *    judged on); its fidelity is the share of them it gives; its cost is the paired count on the judged paths (lost less
 *    saved, over n); it is shown exactly when that cost is under half a point (SHOW_BELOW).
 *   node research/tests/solver-distil.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { solveForApp } from '../../src/solverApp.js';
import { grow, levelOf, rulesOf, distilOf, decisionsOf, SHOW_BELOW, PLANT } from '../../src/solverDistil.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ok  ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } };

console.log('=========== 1-2. THE TREE ON A KNOWN RULE ===========');
{
  let rng = 7;
  const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };
  const rule = x => (x.years < 20 ? 0.8 : x.age < 70 ? 1 : 1.1);
  const ds = Array.from({ length: 3000 }, () => { const x = { years: 40 * rand(), age: 60 + 30 * rand(), penShare: rand() }; return { x, y: rule(x) }; });
  const t = grow(ds), given = ds.filter(d => levelOf(t, d.x) === d.y).length;
  const leaves = rulesOf(t);
  ok(given === ds.length && leaves.length === 3 && t.f === 'years' && Math.abs(t.c - 20) < 1 && t.hi.f === 'age' && Math.abs(t.hi.c - 70) < 1,
    `1. the known rule found: ${given} of ${ds.length} given, ${leaves.length} leaves, years at ${t.c.toFixed(2)}, then age at ${t.hi && t.hi.c && t.hi.c.toFixed(2)}`);
  const one = grow(ds, 1), givenOne = ds.filter(d => levelOf(one, d.x) === d.y).length;
  ok(givenOne < given, `planted: a tree of one question gives ${givenOne} of ${ds.length}`);
  ok(leaves.every(r => r.when.length === new Set(r.when.map(w => w.split(' ')[0] + w.split(' ')[1])).size) && JSON.stringify(leaves.map(r => r.level)) === JSON.stringify([0.8, 1, 1.1]),
    `2. its rules: ${leaves.map(r => `${r.when.join(' and ')} -> ${r.level}`).join('; ')}`);
  const twice = rulesOf({ f: 'years', c: 10, lo: { leaf: 0.8 }, hi: { f: 'years', c: 30, lo: { leaf: 1 }, hi: { leaf: 1.1 } } });
  ok(twice[1].when.length === 1 && /between 10 and 30/.test(twice[1].when[0]), `2. a question asked twice on the way is one range: "${twice[1].when[0]}"`);
}

console.log('=========== 3. ON S126 ===========');
{
  const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S126').plan);
  const r = solveForApp(E, M, plan, { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } });
  const n = 200, d = distilOf(E, r, plan, { seed: 4242, n, fit: 150 });
  const ds = decisionsOf(E, r, { seed: 4243, n: 150 });
  ok(d.decisions === ds.length && ds.length > 0 && d.fidelity === ds.filter(x => levelOf(d.tree, x.x) === x.y).length / ds.length,
    `3. learnt on ${d.decisions} retired years of paths apart from those it is judged on; it gives the table's level on ${(100 * d.fidelity).toFixed(1)}% of them`);
  ok(d.cost === (100 * (d.lost - d.saved)) / n && d.lost + d.saved <= n && d.show === (d.cost < SHOW_BELOW),
    `3. following it costs ${d.cost.toFixed(2)} points on ${n} paired paths (${d.lost} lost, ${d.saved} saved): ${d.show ? 'shown' : 'hidden'} (under ${SHOW_BELOW} shows it); its rules: ${d.rules.map(x => `${x.when.join(' and ') || 'always'} -> ${x.level}`).join('; ')}`);
  PLANT.rule = 'depth1'; const d1 = distilOf(E, r, plan, { seed: 4242, n: 40, fit: 150 }); PLANT.rule = '';
  ok(d1.fidelity <= d.fidelity && d1.rules.length <= 2, `planted: a tree of one question gives ${(100 * d1.fidelity).toFixed(1)}% (${d1.rules.length} rules)`);
}

console.log(`\n=========== ${fail ? `FAILED: ${fail} of ${pass + fail}` : `ALL PASS: ${pass}`} ===========`);
process.exit(fail ? 1 : 0);
