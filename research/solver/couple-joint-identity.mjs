/*
 * A COUPLE'S SOLVE AT THE NEW JOINT MOVE AGAINST THE ARM TIE-C2 TOOK (D105; TIE-C2.md read once, PASS, the rule taking
 * LOOKHOLD; results-tie-c2.txt). EXPLORATORY: an identity check, deciding nothing. The change of default makes LOOKHOLD's
 * options the couples' default (src/solverSettings.js APP_COUPLE), carried by the page's solve of a couple into its joint move;
 * this shows the page's route giving the couple the read measured, or says what moved. For one of TIE-C2's couples
 * (couples-panel-d4b.json), on the tree it is pointed at:
 *   audit  the LOOKHOLD arm as TIE-C2's audit solves it (audit-tie-c2.mjs: audit-couples.mjs solverPlan('CANDC', ...), each
 *          person by solveForApp at 45 points without the single's tie-break, solveCouple on the pots' share with OPTS.LOOKHOLD);
 *   app    the page's own route (src/solverCouple.js couplePlans on APP_COUPLE's share rule; each person by src/solverApp.js
 *          solveForApp at the app's candidate, the single's tie-break in it, with their partner's age; then assembleCouple with
 *          APP_COUPLE's joint move, src/solverSettings.js appJoint), on the same plan, as the page would hold it;
 * and prints the joint move's options read back from the couple (tieJoint, tieLook, holdPast), each person's table digest
 * (src/solverDigest.js), the share and its rule, and the engine's run of the couple as TIE-C2's audit runs it (audit-phase4.mjs
 * runPath, arm A's MPAA ages) on the first 500 paths of seed 7001: the paths survived, a hash of every path's survival, pot,
 * estate, spending delivered and lifetime tax, and the paths whose survival, failure year, pot, lifetime tax or spending
 * delivered differ, byte for byte, from what TIE-C2 stored for its LOOKHOLD arm (results/tie-c2-7001).
 *   node research/solver/couple-joint-identity.mjs <tree> <audit|app> <couple>
 */
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const [treeArg, mode, id] = process.argv.slice(2);
if (!treeArg || !['audit', 'app'].includes(mode) || !id) { console.error('usage: couple-joint-identity.mjs <tree> <audit|app> <couple>'); process.exit(2); }
const root = resolve(treeArg), imp = p => import(pathToFileURL(join(root, p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), CPL = await imp('src/solver/couple.js');
const DIG = await imp('src/solverDigest.js'), AC = await imp('research/solver/audit-couples.mjs'), P4 = await imp('research/solver/audit-phase4.mjs');
const SEL = await imp('research/solver/select-phase4.mjs'), CP = await imp('research/solver/couple-panel.mjs'), APP = await imp('src/solverApp.js');
const PTS = 45, W = 0.02, SEED = 7001, N = 500;

const h = CP.readPanel(AC.PANEL_FILE).find(x => x.id === id);
if (!h) { console.error(`no couple ${id} in the panel`); process.exit(2); }
const a = SEL.armA(CP.appPlan(h.plan), { tournament: false });
const aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
const t0 = Date.now();
let cp;
if (mode === 'audit') {
  const TC2 = await imp('research/solver/audit-tie-c2.mjs');
  const hp = AC.solverPlan('CANDC', h.plan, aPol, W);
  const solveOne = (p, o) => APP.solveForApp(E, M, p, { points: PTS, ageWith: o.partnerAge0, research: { tieAboveCap: undefined } });
  cp = CPL.solveCouple(E, M, hp, { shareRule: 'pots', solveOne, ...TC2.OPTS.LOOKHOLD });
} else {
  const SC = await imp('src/solverCouple.js'), SET = await imp('src/solverSettings.js');
  const routed = P4.solverPlanOf(h.plan, aPol);
  // the plan as the page holds it: routed as the audit routes it, its aims the audit's (the standard estate aim, raises capped,
  // consent to change risk given, the dial at 1); couplePlans then prepares it as the page does (householdPlan)
  const plan = { ...routed, solver: { aims: { cuts: 1, estate: 'standard', raises: 'capped', riskConsent: true } } };
  const cut = SC.couplePlans(E, plan, { shareRule: SET.APP_COUPLE.shareRule });
  const tables = {}, solvedOn = {};
  for (const who of ['self', 'part']) { tables[who] = APP.solveForApp(E, M, cut.plans[who], { points: PTS, ageWith: cut.ageWith[who] }); solvedOn[who] = { plan: cut.plans[who], ageWith: cut.ageWith[who] }; }
  cp = SC.assembleCouple(E, M, cut.household, tables, { shareRule: cut.shareRule, joint: SET.appJoint(), solvedOn });
}
const solveSecs = (Date.now() - t0) / 1000;
const digests = {};
for (const who of ['self', 'part']) digests[who] = (await DIG.digestOf(DIG.tablesOf(cp.tables[who]))).slice(0, 16);
const opts = `tieJoint ${cp.tieJoint ?? '-'} tieLook ${cp.tieLook ?? '-'} holdPast ${cp.holdPast ?? '-'}`;
// the engine's run as TIE-C2's audit makes it: the couple through the joint move, each person's MPAA age arm A's
const aDemo = E.resolveMpaa(a.planState).demographics;
const ctx = E.buildContext(CPL.withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
// TIE-C2's LOOKHOLD arm as it stored it: its paths drawn as TIE-C2 drew them (all its paths), so the first N are its own
const ref = JSON.parse(gunzipSync(readFileSync(join(root, 'research/solver/results/tie-c2-7001', `${id}.json.gz`))).toString());
const dec = (b64, T) => { const b = Buffer.from(b64, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const R = { survived: dec(ref.arms.LOOKHOLD.survived, Uint8Array), failYear: dec(ref.arms.LOOKHOLD.failYear, Int16Array), pot: dec(ref.arms.LOOKHOLD.pot, Float64Array), tax: dec(ref.arms.LOOKHOLD.tax, Float64Array), delivered: dec(ref.arms.LOOKHOLD.delivered, Float64Array) };
const hash = createHash('sha256'), f = new Float64Array(5);
let survived = 0, differ = 0;
E.pathsForSeed(SEED, ref.N, ctx.totalYears).slice(0, N).forEach((zs, i) => {
  const o = P4.runPath(ctx, Float64Array.from(zs), false);
  survived += o.survived ? 1 : 0;
  f[0] = o.survived ? 1 : 0; f[1] = o.wealth; f[2] = o.estate; f[3] = o.delivered; f[4] = o.tax;
  hash.update(Buffer.from(f.buffer));
  if ((o.survived ? 1 : 0) !== R.survived[i] || o.failYear !== R.failYear[i] || !Object.is(o.wealth, R.pot[i]) || !Object.is(o.tax, R.tax[i]) || !Object.is(o.delivered, R.delivered[i])) differ++;
});
console.log(`${id} ${mode} ${opts} share ${cp.share} rule ${cp.meta.shareRule} self ${digests.self} part ${digests.part} survived ${survived} of ${N} outcomes ${hash.digest('hex').slice(0, 16)}; against TIE-C2's LOOKHOLD ${differ} of ${N} paths differ | solve ${Math.round(solveSecs)} s`);
