/*
 * THE LANDING FIX'S EFFECT ON STEP 8'S ARM (EXPLORATORY, the tuning seed; the reviewer's second look on step 4's change of
 * default, MINOR 1). Step 8's port was held to its registered arm, HSPA, path for path on step 8's pilot (D136;
 * results-household-port-identity.txt: 15 of 15 IDENTICAL, results/household-hsp-pilot, seed 7002, 1,000 paths a unit, 45
 * points). The fix (the later retiree's deposits marked `asContribution`, landing whole) moves the app's route off that arm
 * on the units it reaches. For each pilot unit it reaches (household-landing-scan.mjs's class: a listed deposit short under
 * the plant 'roomclaim', the code before), the app's route solved again on this code exactly as household-port-identity.mjs
 * solves it (the plan step 8's audit handed the solvers, the page's cut, the table at the app's 45 points inside its bands,
 * the assembly, the page's context), run on the pilot's own paths: survival after the fix against the pilot's HSPA (before)
 * with the paths saved and lost, K2 (today's two-table route) and APP beside, the spending delivered and the pot against
 * HSPA. Decides nothing. Step 8's other unit the scan names, S355F-gap8, is in its registered panel alone (held-out seed
 * 7024, read once by its rule), so its effect is not measured here.
 *   node research/solver/household-landing-effect-hsp.mjs [unit ...] > research/solver/results-household-landing-effect-hsp.txt
 * HLE_PLANT=roomclaim, the control: each unit solved and run under that plant (the household plan as before the fix), its
 * table's digest against the pilot's household table and its paths against the pilot's HSPA, bit for bit, so the before arm
 * is this code without the fix and nothing else. Both runs print to one file: the effect, then the control.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt, HOUSE } from '../../src/solver/household.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { APP_COUPLE, appJoint, APP_POINTS } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readHspPanel } from './household-hsp-panel.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { runPath } from './audit-phase4.mjs';
import { KEYS } from './audit-household-hsp.mjs';
import { dec } from './audit-late-tail.mjs';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = join(HERE, 'results', 'household-hsp-pilot'), only = process.argv.slice(2);
if (!existsSync(DIR)) { console.error(`household-landing-effect-hsp: step 8's pilot is not here (${DIR})`); process.exit(2); }
const FORM = APP_COUPLE.household, joint = appJoint(), CONTROL = process.env.HLE_PLANT || '';
if (CONTROL && CONTROL !== 'roomclaim') { console.error(`household-landing-effect-hsp: HLE_PLANT '${CONTROL}' (want 'roomclaim')`); process.exit(2); }
if (FORM !== 'pensionsPA') { console.error(`household-landing-effect-hsp: the couples' default form is '${FORM}', not step 8's 'pensionsPA'`); process.exit(2); }
/* whether the fix lands this plan's later-retiree saving otherwise: a listed deposit short under the code before */
const shortBefore = plan => {
  HOUSE.plant = 'roomclaim';
  try { const cut = householdCut(E, M, plan, FORM), ctx = E.buildContext(cut.hplan); return (cut.hplan.oneOffContributions || []).filter(x => /^dep_house_/.test(x.id)).some(d => { const s = ctx.oneOffStaging.get(d.id); return !s || !s.direct || Math.abs(s.amount - d.amount) > 0.005; }); }
  finally { HOUSE.plant = ''; }
};
const panel = readHspPanel();
const all = ['S025', 'S273', 'S351F'].flatMap(b => ['own', '45', '90', 'db', 'dbpart', 'gap8', 'sppart'].map(v => `${b}-${v}`)).filter(id => existsSync(join(DIR, `${id}.json.gz`)) && (!only.length || only.includes(id)));
const reached = all.filter(id => shortBefore(solverPlanOf(panel.find(u => u.id === id).plan, 'own').hp));
const cid = codeId();
console.log(`THE LANDING FIX'S EFFECT ON STEP 8'S ARM (EXPLORATORY, seed 7002, step 8's pilot): code ${cid ? cid.hash : 'unknown'}; ${reached.length} of the pilot's ${all.length} units reached by the fix: ${reached.join(', ') || 'none'}${CONTROL ? `; THE CONTROL, under the plant '${CONTROL}'` : ''}`);
let same = 0;
for (const id of reached) {
  const P = JSON.parse(gunzipSync(readFileSync(join(DIR, `${id}.json.gz`))).toString()), U = panel.find(u => u.id === id);
  const arm = name => Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arms[name][k], Ty)]));
  const before = arm('HSPA'), k2 = arm('K2'), app = arm('APP');
  if (CONTROL) HOUSE.plant = CONTROL;
  const t0 = Date.now(), { hp } = solverPlanOf(U.plan, 'own'), cut = householdCut(E, M, hp, FORM), b = cut.bands;
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { points: APP_POINTS, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
  const digest = await digestOf(tablesOf(H)), sameTable = digest === P.digests.household;
  const ctx = solvedContext(E, cp), paths = E.pathsForSeed(P.seed, P.N, ctx.totalYears).map(zs => Float64Array.from(zs));
  let sA = 0, sB = 0, sK = 0, sApp = 0, saved = 0, lost = 0, dA = 0, dB = 0, pA = 0, pB = 0; const apart = Object.fromEntries(Object.keys(KEYS).map(k => [k, 0]));
  for (let i = 0; i < P.N; i++) {
    const r = runPath(ctx, paths[i], false), got = { survived: r.survived ? 1 : 0, failYear: r.failYear, pot: r.wealth, estate: r.estate, tax: r.tax, delivered: r.delivered, unmet: r.unmet };
    for (const k of Object.keys(KEYS)) if (!Object.is(before[k][i], got[k])) apart[k]++;
    sA += got.survived; sB += before.survived[i]; sK += k2.survived[i]; sApp += app.survived[i];
    if (got.survived && !before.survived[i]) saved++; if (!got.survived && before.survived[i]) lost++;
    dA += got.delivered; dB += before.delivered[i]; pA += got.pot; pB += before.pot[i];
  }
  HOUSE.plant = '';
  const pc = x => (100 * x / P.N).toFixed(2), secs = ((Date.now() - t0) / 1000).toFixed(0);
  if (CONTROL) {
    const ok = sameTable && Object.values(apart).every(x => x === 0); if (ok) same++;
    console.log(`${id.padEnd(11)} under '${CONTROL}', against the pilot's HSPA: the table ${digest.slice(0, 12)} against ${String(P.digests.household).slice(0, 12)} (${sameTable ? 'the same' : 'APART'}); paths apart ${JSON.stringify(apart)} of ${P.N}: ${ok ? 'THE SAME' : 'APART'}; solved in ${secs} s`);
    continue;
  }
  console.log(`${id.padEnd(11)} survival: APP ${pc(sApp)}%, K2 ${pc(sK)}%, HSPA (the household route before the fix) ${pc(sB)}%, after it ${pc(sA)}% (${saved} saved, ${lost} lost of ${P.N}); spending delivered ${dB ? ((dA / dB - 1) * 100).toFixed(4) : '0.0000'}%, the mean pot ${pB ? ((pA / pB - 1) * 100).toFixed(3) : '0.000'}% against HSPA; the table ${sameTable ? 'the pilot\'s' : 'another'}; solved in ${secs} s`);
}
if (CONTROL) console.log(`THE CONTROL IN ALL: ${same} of ${reached.length} units HSPA's table and paths${same === reached.length ? ': the before arm is this code without the fix' : ''}`);
