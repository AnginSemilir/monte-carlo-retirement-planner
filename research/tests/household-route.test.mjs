/*
 * THE HOUSEHOLD'S SOLVE IN THE APP (step 8's port, research/solver/HSP-PORT.md, steps 1 and 2; D134 (1)).
 *
 * The page solves a couple at the household default as one single's solve of the household plan: the worker cuts the plan
 * (src/solver/household.js householdForm at 'pensionsPA'), solves its table as a single's table is solved, every part inside
 * the band scaling (bandsAt), and the owner assembles the household from the table (householdFromTable). This holds that to
 * the research module's solveHousehold run whole, as step 8's audit ran HSPA (research/solver/household.mjs):
 *   1. the cut: householdForm's plan and bands are those solveHousehold solves on (the plan by JSON; k, the allowance and the
 *      allowance scaled);
 *   2. the household assembled from a table solved apart (solveForApp on the cut plan inside bandsAt, as each worker solves
 *      it) is solveHousehold's whole: the table's digest, and the engine's run of the household (src/solverStrategy.js
 *      solvedContext, at the even split) on 200 paths of seed 99001, survival, the pot and the tax on every path, bit for bit;
 *   3. refused by the assembly: a table solved outside the band scaling (its band for gains one person's... twice, not k times)
 *      and a table solved for another plan.
 * Light settings (6 points, a small lattice): the route, not the table's quality, is under test.
 * Plants (--planted runs each and wants its checks to fail): 'nobands' (the table solved apart outside the bands: check 2,
 * refused), 'oddsplit' (the household run at the pensions' split, not the even: check 2).
 *   node research/tests/household-route.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as HR from '../solver/household.mjs';
import { householdForm, householdFromTable, bandsAt } from '../../src/solver/household.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readHspPanel } from '../solver/household-hsp-panel.mjs';
import { solverPlanOf } from '../solver/shapes-panel.mjs';
import { JOINT } from '../solver/audit-household.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const plant of ['nobands', 'oddsplit']) {
    let failed = false;
    try { execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, HR_PLANT: plant }, stdio: 'pipe' }); } catch { failed = true; }
    console.log(`${failed ? 'ok  ' : 'FAIL'} plant '${plant}': the test ${failed ? 'fails' : 'passes (it should fail)'}`);
    if (!failed) bad++;
  }
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.HR_PLANT || '', PTS = 6, LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } }, FORM = 'pensionsPA', TOPK = 3, N = 200, SEED = 99001;
let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); if (!cond) fails++; };
const js = x => JSON.stringify(x);
const run = (cp, n) => {
  const ctx = solvedContext(E, cp), out = { survived: [], pot: [], tax: [] };
  for (const zs of E.pathsForSeed(SEED, n, ctx.totalYears)) { const q = E.runTrial(ctx, Float64Array.from(zs)); out.survived.push(q.survived ? 1 : 0); out.pot.push(q.terminalPotNet); out.tax.push(q.lifetimeTax); }
  return out;
};
const panel = readHspPanel(), units = ['S025-own', 'S351F-90'].map(id => panel.find(u => u.id === id));
for (const U of units) {
  const { hp } = solverPlanOf(U.plan, 'own'), opts = { scale: FORM, topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast };
  const solveOne = (p, o) => solveForApp(E, M, p, { points: PTS, ageWith: o.partnerAge0, research: { ...LIGHT } });
  // the research module's whole solve (step 8's HSPA)
  const whole = HR.solveHousehold(E, M, hp, { solveOne, ...opts }), wholeCp = { ...whole, split: 'even', counts: null };
  // the app's: the cut, the table solved apart inside the bands, the household assembled from it
  const f = householdForm(E, hp, { scale: FORM }), sc = f.hopts.scale, m0 = M.prepare(E, hp);
  ok(js(f.hp) === js(whole.hplan) && sc && sc.k === whole.hopts.scale.k && sc.paOne === whole.hopts.scale.paOne && sc.paK === true, `${U.id} check 1: the cut is solveHousehold's (k ${sc ? sc.k.toFixed(4) : '-'})`);
  const solveApart = () => solveForApp(E, M, f.hp, { points: PTS, ageWith: m0.ctx.agePart0, research: { ...LIGHT } });
  const H = PLANT === 'nobands' ? solveApart() : bandsAt(E, sc.k, sc.paOne, solveApart, sc.paK);
  let cp = null, why = '';
  try { cp = householdFromTable(E, M, hp, f.hp, H, opts); } catch (e) { why = e.message; }
  const dA = await digestOf(tablesOf(whole.H)), dB = H ? await digestOf(tablesOf(H)) : null;
  ok(cp !== null && dA === dB, `${U.id} check 2a: the table solved apart is the whole solve's (${dA.slice(0, 12)} / ${dB ? dB.slice(0, 12) : '-'})${why ? `; refused: ${why}` : ''}`);
  if (cp) {
    const a = run(wholeCp, N), b = run({ ...cp, split: PLANT === 'oddsplit' ? 'pensions' : 'even', counts: null }, N);
    const diff = ['survived', 'pot', 'tax'].map(k => a[k].filter((v, i) => !Object.is(v, b[k][i])).length);
    ok(diff.every(d => d === 0), `${U.id} check 2b: the engine's run of the household assembled apart is the whole solve's on ${N} paths (paths that differ: survival ${diff[0]}, pot ${diff[1]}, tax ${diff[2]})`);
  }
  // check 3: refused, a table solved outside the bands; and a table solved for another plan
  if (PLANT === '') {
    let r1 = '', r2 = '';
    try { householdFromTable(E, M, hp, f.hp, solveApart(), opts); } catch (e) { r1 = e.message; }
    const other = { ...f.hp, spending: { ...f.hp.spending, targetSpend: (f.hp.spending.targetSpend || 0) + 100 } };
    try { householdFromTable(E, M, hp, other, H, opts); } catch (e) { r2 = e.message; }
    ok(/capital gains band/.test(r1) && /solved on another plan/.test(r2), `${U.id} check 3: refused, the table solved outside the bands (${r1.slice(0, 60)}...) and the table solved for another plan`);
  }
}
console.log(fails ? `household-route: ${fails} FAILED` : 'household-route: ALL PASS');
process.exit(fails ? 1 : 0);
