/*
 * D143'S CHANGE OF DEFAULT, THE IDENTITY (EXPLORATORY, the tuning seed): the app's route for a couple the household route's
 * classes open, on the registered test's pilot (registrations/couples-open.md; results/couples-open-pilot: the registered
 * panel's 44 household-route units, 1,000 paths of seed 7002, 45 points, its ROUTE the app's own route with the guard alone
 * bypassed), against the pilot's ROUTE arrays path for path, as household-port-identity.mjs held D136's port to step 8's arm:
 *   - the guard (src/couplesSwitch.js coupleSolverOn, D143), on the plan as the panel landed it and on the plan the audit handed
 *     its solvers (shapes-panel.mjs solverPlanOf, 'own'): on, on the household route, its lifted reasons the unit's class's,
 *     not swapped; with no class open (its plant 'noopen', the guard before D143) off for the reason the panel recorded;
 *   - the client's route (src/solverClient.js): the couples' default form (APP_COUPLE.household), the couple solved on the
 *     household route alone (its `lifted`), the plan or its mirror where swapped handed to the cut;
 *   - the cut, the table and the assembly as the page's worker makes them (src/solverWorker.js: householdCut at the form, the
 *     table by solveForApp at the app's points inside the cut's bands, src/solver/household.js bandsAt, and householdSolved
 *     with the top three and the couples' joint move's tie-break and hold), the table's digest against the pilot's;
 *   - the paths: the engine's run (audit-phase4.mjs runPath) of the solved couple on the page's own context
 *     (src/solverStrategy.js solvedContext, the pilot's ROUTE context), every key against the pilot's ROUTE arrays, bit for bit.
 * A unit IDENTICAL where the guard and the route are as above, the digest the pilot's and every array the same.
 *   node research/solver/couples-open-port-identity.mjs [unit ...] > research/solver/results-couples-open-port-identity.txt
 * CPI_SMOKE=1 runs it at 6 points on a small lattice, the code path alone (its tables cannot be the pilot's); CPI_DIR the pilot's
 * folder where it is not this tree's (a worktree's results are the main tree's); CPI_PART=k/n every n-th unit from the k-th
 * (a part's lines, the parts' lines then put in the panel's order).
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { APP_COUPLE, appJoint, APP_POINTS } from '../../src/solverSettings.js';
import { coupleSolverOn, swapOf, PLANT as SWITCH_PLANT } from '../../src/couplesSwitch.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readOpenPanel } from './couples-open-panel.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { runPath } from './audit-phase4.mjs';
import { KEYS } from './audit-couples-open.mjs';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.env.CPI_DIR || join(HERE, 'results', 'couples-open-pilot'), only = process.argv.slice(2);
if (!existsSync(DIR)) { console.error(`couples-open-port-identity: the registered test's pilot is not here (${DIR})`); process.exit(2); }
const SMOKE = process.env.CPI_SMOKE === '1', joint = appJoint(), FORM = APP_COUPLE.household;
const SOLVE = SMOKE ? { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: APP_POINTS };
const LIFTED = { Y75: 'Y', Y90: 'Y', Y100: 'Y', E95: 'E', E100: 'E', S75: 'S', G8: 'G', G12: 'G', G8Y75: 'Y,G', G12P: 'G', G12R: 'G' };
const js = x => JSON.stringify(x);
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
const guardOk = g => g.on === true && g.why === null && g.route === 'household' && !g.swap;
const [partK, partN] = (process.env.CPI_PART || '0/1').split('/').map(Number);
const units = readOpenPanel(join(HERE, 'couples-open-registered-panel.json')).filter(u => u.route === 'household' && existsSync(join(DIR, `${u.id}.json.gz`)) && (!only.length || only.includes(u.id))).filter((u, i) => i % partN === partK);
console.log(`D143'S CHANGE OF DEFAULT, THE IDENTITY (EXPLORATORY${SMOKE ? ', A SMOKE: 6 points, its tables not the pilot\'s' : ''}): the app's route for a couple the household route's classes open, on the registered test's pilot's ${units.length} household-route units (seed 7002), against its ROUTE arrays; this code ${(codeId() || {}).hash || 'unknown'}; the couples' form ${FORM}`);
let identical = 0;
for (const U of units) {
  const P = JSON.parse(gunzipSync(readFileSync(join(DIR, `${U.id}.json.gz`))).toString());
  const want = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arms.ROUTE[k], Ty)]));
  const { hp } = solverPlanOf(U.plan, 'own');
  // the guard, on the plan as landed and as handed to the solvers; and before D143 (the plant 'noopen')
  const gLanded = coupleSolverOn(U.plan), gHanded = coupleSolverOn(hp);
  const was = SWITCH_PLANT.rule; SWITCH_PLANT.rule = 'noopen'; const gBefore = coupleSolverOn(U.plan); SWITCH_PLANT.rule = was;
  const liftedOk = (gLanded.lifted || []).join(',') === LIFTED[U.variant] && js(gLanded.lifted) === js(gHanded.lifted);
  const beforeOk = !gBefore.on && gBefore.why === U.why;
  // the client's route: the household route alone, the plan or its mirror handed to the cut
  const handed = swapOf(hp) ? otherOrder(E, hp) : hp;
  const t0 = Date.now(), cut = householdCut(E, M, handed, FORM), b = cut.bands;
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...SOLVE, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
  const digest = await digestOf(tablesOf(H)), sameTable = digest === P.digests.household;
  const ctx = solvedContext(E, cp), paths = E.pathsForSeed(P.seed, P.N, ctx.totalYears).map(zs => Float64Array.from(zs)), diff = Object.fromEntries(Object.keys(KEYS).map(k => [k, 0]));
  for (let i = 0; i < P.N; i++) {
    const r = runPath(ctx, paths[i], false), got = { survived: r.survived ? 1 : 0, failYear: r.failYear, pot: r.wealth, estate: r.estate, tax: r.tax, delivered: r.delivered, unmet: r.unmet };
    for (const k of Object.keys(KEYS)) if (!Object.is(want[k][i], got[k])) diff[k]++;
  }
  const clean = Object.values(diff).every(x => x === 0), ok = guardOk(gLanded) && guardOk(gHanded) && liftedOk && beforeOk && sameTable && clean;
  if (ok) identical++;
  console.log(`${U.id.padEnd(10)} ${ok ? 'IDENTICAL' : 'DIFFERS'}; the guard on, ${gLanded.route || 'no'} route, lifting ${(gLanded.lifted || []).join('+') || 'none'} (${guardOk(gLanded) && guardOk(gHanded) && liftedOk ? 'as the class says' : `NOT: landed ${js(gLanded)}, handed ${js(gHanded)}`}), before D143 ${gBefore.on ? 'ON' : `'${gBefore.why}'`} (${beforeOk ? 'the panel\'s' : `NOT the panel's '${U.why}'`}); the table ${digest.slice(0, 12)} against the pilot's ${String(P.digests.household).slice(0, 12)} (${sameTable ? 'the same' : 'DIFFERENT'}); paths differing of ${P.N}: ${Object.entries(diff).map(([k, v]) => `${k} ${v}`).join(', ')}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
console.log(`${identical} of ${units.length} units IDENTICAL`);
process.exit(identical === units.length && units.length > 0 ? 0 : 1);
