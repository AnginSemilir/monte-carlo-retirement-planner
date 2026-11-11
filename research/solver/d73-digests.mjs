/*
 * D73'S PORT, THE WORKING FOR THE THREE PINNED TABLE DIGESTS IT MOVES (D66: a FAST test's pinned figure that moves comes to the
 * maintainer naming the test, the old figure, the new and the working). couple-quick check 5, windfall-relief check 6 and
 * couple-share check 2 each pin the digest of the app's solve (solveForApp, the candidate's settings) at 4 points on the
 * light reference lattice. D73 put two keys into the candidate that reach those solves: `sweepCashIsaTo: 'isa'` (item 5) and
 * `coarse` (item 10's solve on anchors and shortlists); its third change, the reference's lattice, does not (each test sets
 * its own light lattice). Here each pinned solve is made four ways on the ported code: both keys out (which must give the old
 * pinned figure: nothing else in the port reaches these tables), each alone, and both (the new figure the test would pin).
 *   node research/solver/d73-digests.mjs > research/solver/results-d73-digests.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { APP_CANDIDATE, prepareForSolve } from '../../src/solverSettings.js';
import { solveCouple } from '../../src/solver/couple.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { CANDIDATE_HASH, BEFORE_D73_HASH } from './candidate.mjs';
import { codeId } from './code-id.mjs';

const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const WAYS = [['both keys out', { sweepCashIsaTo: undefined, coarse: undefined }], ['the sweep to the ISA alone', { coarse: undefined }], ['the anchors and shortlists alone', { sweepCashIsaTo: undefined }], ['both, the candidate', {}]];
const lib = buildScenarios(), planOf = id => lib.find(s => s.id === id).plan, s210 = planOf('S210');
const single = plan => async extra => digestOf(tablesOf(solveForApp(E, M, E.normalizePlan(plan), { points: 4, research: { ...LIGHT, ...extra } })));
const couple = plan => async extra => {
  const cp = solveCouple(E, M, prepareForSolve(E, E.normalizePlan(plan)), { solveOne: (p, o) => solveForApp(E, M, p, { points: 4, research: { ...LIGHT, ...extra }, ageWith: o.partnerAge0 }) });
  return digestOf([...tablesOf(cp.tables.self), ...tablesOf(cp.tables.part)]);
};
// each pinned figure: the test and check, what is solved, the figure pinned today
const PINS = [
  ['couple-quick.test.mjs check 5 (BEFORE); windfall-relief.test.mjs check 6 (ITEM3.S116)', 'S116', single(planOf('S116')), 'b954f145878ff4604101cff2c8513547430df0e9a0835547f3b5471982b65eb4'],
  ['windfall-relief.test.mjs check 6 (ITEM3, S210 its deposit removed)', 'S210, its deposit removed', single({ ...s210, oneOffContributions: [] }), 'f9a4e63e00f6958e4145dd577416bb9e6930ea8a46d391a19fbe5e0f83661653'],
  ['windfall-relief.test.mjs check 6 (ITEM3, S210 its deposit typed into the taxable account)', 'S210, its deposit typed into the taxable account', single({ ...s210, oneOffContributions: s210.oneOffContributions.map(x => ({ ...x, category: E.CATEGORY_LABEL.other })) }), 'c7785c6fc3ecdcb402f3dbf8a1cf9109a4fa6600e755776e785b998b907085e7'],
  ['couple-share.test.mjs check 2 (BEFORE)', 'S007, each person\'s tables', couple(planOf('S007')), 'ee4875424b94acb82da47dff0f30a7fddf17613dad59e49b5dd329f91af58609']
];
const id = codeId();
console.log(`D73's port: the three pinned table digests it moves, and the working (d73-digests.mjs; code ${id.hash})`);
console.log(`the candidate ${CANDIDATE_HASH} (before D73 ${BEFORE_D73_HASH}); its keys since D73: sweepCashIsaTo ${JSON.stringify(APP_CANDIDATE.sweepCashIsaTo)}, coarse ${JSON.stringify(APP_CANDIDATE.coarse)}`);
console.log('each solve the app\'s (solveForApp) at 4 points on the light reference lattice 48 x 9 x 32, as the tests make it\n');
let bad = 0;
for (const [test, what, run, old] of PINS) {
  console.log(`${test}\n  ${what}; pinned today: ${old}`);
  for (const [name, extra] of WAYS) {
    const d = await run(extra), isOld = d === old;
    if (name === 'both keys out' && !isOld) bad++;
    if (name === 'both, the candidate' && isOld) bad++;
    console.log(`    ${name.padEnd(34)} ${d}${isOld ? '   = the pinned figure' : ''}${name === 'both, the candidate' ? '   <- the new figure' : ''}`);
  }
  console.log('');
}
console.log(bad === 0 ? 'VERDICT: with both keys out every solve gives the figure pinned today, so the port moves these tables by the two keys alone; with both in, each gives its new figure.' : `VERDICT: ${bad} solve(s) do not behave so: STOP, the port reaches these tables some other way.`);
process.exit(bad === 0 ? 0 : 1);
