/*
 * THE AUDIT'S SETTINGS CHECK, AS PRESCRIPTIVE-PLAN.md STEP 1 WORDS IT, AGAINST THE LEAD TEST'S UNITS (EXPLORATORY, deciding
 * nothing; plan arithmetic, and two solves at a smoke's settings). The plan: "audit-household.mjs's settings check holds the
 * household table's line to the first person's line with the tie-break the one difference" (audit-household.mjs
 * houseLineProblems, built as worded). A person's table is solved on that person's share of the household's minimum pot
 * (couple.js singlePlanFor), the household table on the whole of it, and the line prints the minimum pot a table was
 * solved on (minPot). Printed: each unit's minimum pot and the first person's share of it, the share as the couples'
 * default takes it (couple.js shareBy, the pots' rule); then, on the units named, the two lines solved at 6 points with the
 * light lattice, field by field, and what the check says as worded and as D124 rules it (the minimum pot left out of the
 * comparison, the household table's held to the household's own).
 *   node research/solver/household-line-check.mjs [unit id ...]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveHousehold } from './household.mjs';
import { solveForApp } from '../../src/solverApp.js';
import { UNITS, JOINT, unitPlans, householdSolveOne, lineOf, houseLineProblems } from './audit-household.mjs';

console.log('THE AUDIT\'S SETTINGS CHECK AS STEP 1 WORDS IT, AGAINST THE LEAD TEST\'S UNITS (EXPLORATORY, deciding nothing)');
let withFloor = 0;
for (const u of UNITS) {
  const { hp } = unitPlans(u), floor = Number(hp.config.solvencyFloor) || 0, share = CPL.shareBy(E, hp, JOINT.shareRule);
  if (floor > 0) withFloor++;
  console.log(`  ${u.id.padEnd(12)} the household's minimum pot ${floor}; the first person's share ${+Number(share).toFixed(4)}, so their table's ${Math.round(floor * share)}`);
}
console.log(`  units with a minimum pot: ${withFloor} of ${UNITS.length}`);
const light = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
for (const id of process.argv.slice(2)) {
  const { hp } = unitPlans(UNITS.find(x => x.id === id));
  const one = (p, o) => solveForApp(E, M, p, { points: 6, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } });
  const k2 = CPL.solveCouple(E, M, hp, { solveOne: one, ...JOINT }), house = solveHousehold(E, M, hp, { solveOne: householdSolveOne(6, light), topK: 3, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
  const kv = l => Object.fromEntries(l.match(/(\S+) (\S+)/g).map(x => x.split(' ')));
  const a = kv(lineOf(k2.tables.self)), b = kv(lineOf(house.H));
  console.log(`${id} at 6 points: the share ${k2.share}; the fields of the two lines that differ: ${Object.keys({ ...a, ...b }).filter(k => a[k] !== b[k]).map(k => `${k} (the first person's ${a[k]}, the household's ${b[k]})`).join('; ')}`);
  const worded = Object.keys({ ...a, ...b }).filter(k => a[k] !== b[k] && k !== 'tieAboveCap').map(k => `household: ${k} ${b[k]}, the first person's ${a[k]}`);
  console.log(`  the check as worded: ${worded.join('; ') || 'no problem'}; as D124 rules it: ${houseLineProblems(k2.tables.self, house.H, k2.m.ctx.solvencyFloor || 0).join('; ') || 'no problem'}`);
}
