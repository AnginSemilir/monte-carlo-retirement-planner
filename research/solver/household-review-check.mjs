/*
 * STEP 1'S CHECK AGAINST THE REVIEW'S ARRAYS (PRESCRIPTIVE-PLAN.md step 1, review/external-2026-10-21 at f1f44727; D117;
 * EXPLORATORY, the review's seed 99003, deciding nothing). On S327F, S227-90 and S147-db, each solved as audit-household.mjs
 * solves it (its unitPlans; the household table once, at the candidate as it stands, its tie-break above the estate cap left
 * on: householdSolveOne) and run by runPath at arm A's MPAA ages, as the review's scripts/pilot-extra.mjs runs its arms, on
 * the same 1,500 paths at 45 points:
 *   HT0    chooseHouseholdSingle at split 'even', against the review's arms.HT0 (units/pilot-extra-99003-45/<unit>.json.gz);
 *   HOUSE  design A as built (chooseHousehold, its top three, the tie rule and the hold) on the one table, against the
 *          review's arms.HOUSE (units/pilot-99003-45/<unit>.json.gz), whose table was solved with the tie-break off;
 * each must equal the review's survival path for path, and its end wealth, lifetime tax and spending delivered to the pound.
 * Beside them, deciding nothing: chooseHouseholdSingle at split 'best5' against the review's HT5, which kept the first best
 * split in the order 0 to 1 and took the even split in the plan's last year, so is another arm: the paths that differ; and
 * step 1's two counts on the household-single arms (the decisions past twice the table's wealth top, and of those the ones
 * whose move takes a wrapper to a less risky tier than it holds).
 *   node research/solver/household-review-check.mjs <the review's research/reviews/2026-11-17 folder> <unit id>
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveHousehold, withHousehold, withHouseholdSingle } from './household.mjs';
import { runPath } from './audit-phase4.mjs';
import { UNITS, JOINT, unitPlans, householdSolveOne } from './audit-household.mjs';
import { codeId } from './code-id.mjs';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

const [dir, id] = process.argv.slice(2), SEED = 99003, N = 1500, PTS = 45, CHECK_UNITS = ['S327F', 'S227-90', 'S147-db'];
if (!dir || !CHECK_UNITS.includes(id)) { console.error(`household-review-check: <the review's folder> <one of ${CHECK_UNITS.join(', ')}>`); process.exit(2); }
const readUnit = f => { const U = JSON.parse(gunzipSync(readFileSync(f)).toString()); if (U.seed !== SEED || U.n !== N || U.pts !== PTS) throw new Error(`${f}: seed ${U.seed}, ${U.n} paths, ${U.pts} points (want ${SEED}, ${N}, ${PTS})`); return U; };
const extra = readUnit(join(dir, 'units', `pilot-extra-${SEED}-${PTS}`, `${id}.json.gz`)), pilot = readUnit(join(dir, 'units', `pilot-${SEED}-${PTS}`, `${id}.json.gz`));
const u = UNITS.find(x => x.id === id), { hp, aDemo } = unitPlans(u);
const t0 = Date.now();
const cp = solveHousehold(E, M, hp, { solveOne: householdSolveOne(PTS), topK: 3, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
const solveSecs = (Date.now() - t0) / 1000, T = cp.m.ctx.totalYears;
const withAges = plan => ({ ...plan, demographics: { ...plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
const cps = { HT0: { ...cp, split: 'even', counts: { decisions: 0, far: 0, down: 0 } }, HS5: { ...cp, split: 'best5', counts: { decisions: 0, far: 0, down: 0 } } };
const ctxOf = arm => E.buildContext(arm === 'HOUSE' ? withHousehold(withAges(cp.plan), cp) : withHouseholdSingle(withAges(cp.plan), cps[arm]));
const paths = E.pathsForSeed(SEED, N, T).map(zs => Float64Array.from(zs));
console.log(`${id}: the household table solved in ${solveSecs.toFixed(0)} s at ${PTS} points, its tie-break above the cap ${cp.H.tieAboveCap}, its cap ${cp.H.estateCap}; code ${codeId().hash}; seed ${SEED}, ${N} paths, at arm A's MPAA ages`);
const run = arm => {
  const ctx = ctxOf(arm);
  if (ctx.totalYears !== T) throw new Error(`${id} ${arm}: another horizon`);
  for (let k = 0; k < Math.min(3, N); k++) runPath(ctx, paths[k], false);
  if (cps[arm]) cps[arm].counts = { decisions: 0, far: 0, down: 0 };
  const A = { survived: [], wealth: [], tax: [], delivered: [] };
  for (let k = 0; k < N; k++) { const r = runPath(ctx, paths[k], false); A.survived.push(r.survived ? 1 : 0); A.wealth.push(Math.round(r.wealth)); A.tax.push(Math.round(r.tax)); A.delivered.push(Math.round(r.delivered)); }
  return A;
};
const compare = (A, R) => {
  const d = { survived: 0, wealth: 0, tax: 0, delivered: 0, any: 0 }, first = [];
  for (let k = 0; k < N; k++) {
    let any = false;
    for (const key of ['survived', 'wealth', 'tax', 'delivered']) if (A[key][k] !== R[key][k]) { d[key]++; any = true; }
    if (any) { d.any++; if (first.length < 3) first.push(`path ${k}: survived ${A.survived[k]}/${R.survived[k]}, wealth ${A.wealth[k]}/${R.wealth[k]}, tax ${A.tax[k]}/${R.tax[k]}, delivered ${A.delivered[k]}/${R.delivered[k]}`); }
  }
  return { d, first };
};
const surv = A => `${(100 * A.survived.reduce((x, y) => x + y, 0) / N).toFixed(2)}%`;
let held = true;
for (const [arm, R, name] of [['HT0', extra.arms.HT0, 'HT0'], ['HOUSE', pilot.arms.HOUSE, 'HOUSE'], ['HS5', extra.arms.HT5, 'HT5']]) {
  const A = run(arm), { d, first } = compare(A, R), must = arm !== 'HS5';
  if (must && d.any) held = false;
  const c = cps[arm] ? cps[arm].counts : null;
  console.log(`  ${arm.padEnd(5)} against the review's ${name.padEnd(5)}: survival ${surv(A)} and ${surv(R)}; paths that differ ${d.any} of ${N} (survived ${d.survived}, wealth ${d.wealth}, tax ${d.tax}, delivered ${d.delivered})${must ? (d.any ? ': DIFFERS' : ': THE SAME') : ' (beside: another arm)'}${first.length ? `; first: ${first.join('; ')}` : ''}${c ? `; step 1's counts: ${c.decisions} decisions, past twice the table's wealth top ${c.far}, of those to a less risky tier ${c.down}` : ''}`);
}
console.log(`  ${id}: ${held ? 'HT0 and HOUSE REPRODUCED path for path, to the pound' : 'A PATH DIFFERS: a STOP unless explained'}`);
process.exit(held ? 0 : 1);
