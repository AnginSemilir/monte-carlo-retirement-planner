/*
 * STEP 8'S PORT, THE IDENTITY (research/solver/HSP-PORT.md step 6; D134 (1); EXPLORATORY, the tuning seed). The app's route
 * for a couple at the household default, on step 8's pilot's 15 units (seed 7002, 1,000 paths, 45 points), against the
 * pilot's HSPA arrays path for path, as D109's identity held the couples' route to its arm:
 *   - the plan: the one step 8's audit handed the solvers (shapes-panel.mjs solverPlanOf, 'own'), handed to the page's cut as
 *     the page's plan (src/solverCouple.js householdCut, which first takes it through householdPlan; the line says whether
 *     that left it as it was);
 *   - the table: solved as the page solves it (src/solverApp.js solveForApp at the app's 45 points, the partner's age the
 *     cut's, inside the cut's bands, src/solver/household.js bandsAt), its digest against the pilot's recorded household
 *     table's;
 *   - the household: assembled as the page assembles it (householdSolved: the form 'pensionsPA', the top three, the couples'
 *     joint move's tie-break and hold, the even split);
 *   - the paths: the engine's run (audit-phase4.mjs runPath, as the audit ran it) of the household as the page builds its
 *     context (src/solverStrategy.js solvedContext), and of the same household with the plan's MPAA ages arm A's (the
 *     audit's own context: withHouseholdSingle on the plan with arm A's MPAA ages, audit-household-hsp.mjs ctxOf), each
 *     against the pilot's HSPA survived, failYear, pot, estate, tax, delivered and unmet on all 1,000 paths, bit for bit.
 * A unit IDENTICAL where the table's digest and every array match on either context; where only the context with arm A's MPAA
 * ages matches, the line names the MPAA ages (the page's plan carries its own policy's, the audit's arm A's).
 *   node research/solver/household-port-identity.mjs <the pilot's folder> [unit ...] > research/solver/results-household-port-identity.txt
 * HPI_SMOKE=1 runs it at 6 points on a small lattice, the code path alone (its tables cannot be the pilot's).
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt, withHouseholdSingle } from '../../src/solver/household.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { appJoint, APP_POINTS } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readHspPanel } from './household-hsp-panel.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { runPath } from './audit-phase4.mjs';
import { KEYS } from './audit-household-hsp.mjs';
import { dec } from './audit-late-tail.mjs';
import { codeId } from './code-id.mjs';

const dir = process.argv[2], only = process.argv.slice(3);
if (!dir || !existsSync(dir)) { console.error('household-port-identity: name the pilot\'s folder (results/household-hsp-pilot)'); process.exit(2); }
const js = x => JSON.stringify(x), FORM = 'pensionsPA', joint = appJoint(), SMOKE = process.env.HPI_SMOKE === '1';
const SOLVE = SMOKE ? { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: APP_POINTS };
const panel = readHspPanel(), files = ['S025', 'S273', 'S351F'].flatMap(b => ['own', '45', '90', 'db', 'dbpart', 'gap8', 'sppart'].map(v => `${b}-${v}`)).filter(id => existsSync(join(dir, `${id}.json.gz`)) && (!only.length || only.includes(id)));
console.log(`STEP 8'S PORT, THE IDENTITY (EXPLORATORY${SMOKE ? ', A SMOKE: 6 points, its tables not the pilot\'s' : ''}): the app's route on step 8's pilot's ${files.length} units against its HSPA arrays; this code ${(codeId() || {}).hash || "unknown"}`);
let identical = 0;
for (const id of files) {
  const P = JSON.parse(gunzipSync(readFileSync(join(dir, `${id}.json.gz`))).toString()), U = panel.find(u => u.id === id);
  const want = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arms.HSPA[k], Ty)]));
  const t0 = Date.now(), { a, hp } = solverPlanOf(U.plan, 'own'), cut = householdCut(E, M, hp, FORM), b = cut.bands;
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...SOLVE, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
  const digest = await digestOf(tablesOf(H)), sameTable = digest === P.digests.household, samePlan = js(cut.household) === js(hp);
  const aDemo = E.resolveMpaa(a.planState).demographics, pDemo = E.resolveMpaa(E.normalizePlan(cp.plan)).demographics;
  const ctxs = { page: solvedContext(E, cp), armA: E.buildContext(withHouseholdSingle({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp)) };
  const T = ctxs.page.totalYears, paths = E.pathsForSeed(P.seed, P.N, T).map(zs => Float64Array.from(zs)), diff = {};
  for (const [name, ctx] of Object.entries(ctxs)) {
    const d = Object.fromEntries(Object.keys(KEYS).map(k => [k, 0]));
    for (let i = 0; i < P.N; i++) {
      const r = runPath(ctx, paths[i], false), got = { survived: r.survived ? 1 : 0, failYear: r.failYear, pot: r.wealth, estate: r.estate, tax: r.tax, delivered: r.delivered, unmet: r.unmet };
      for (const k of Object.keys(KEYS)) if (!Object.is(want[k][i], got[k])) d[k]++;
    }
    diff[name] = d;
  }
  const clean = d => Object.values(d).every(x => x === 0), ok = sameTable && (clean(diff.page) || clean(diff.armA));
  if (ok) identical++;
  const ages = `the MPAA ages, the page's plan ${pDemo.mpaaAgeSelf}/${pDemo.mpaaAgePart}, arm A's ${aDemo.mpaaAgeSelf}/${aDemo.mpaaAgePart}`;
  console.log(`${id}: ${ok ? 'IDENTICAL' : 'DIFFERS'}; the plan through householdPlan ${samePlan ? 'as handed' : 'CHANGED'}; the table ${digest.slice(0, 12)} against the pilot's ${String(P.digests.household).slice(0, 12)} (${sameTable ? 'the same' : 'DIFFERENT'}); paths differing of ${P.N}, the page's context ${js(diff.page)}, with arm A's MPAA ages ${js(diff.armA)}; ${ages}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
console.log(`${identical} of ${files.length} units IDENTICAL`);
process.exit(identical === files.length ? 0 : 1);
