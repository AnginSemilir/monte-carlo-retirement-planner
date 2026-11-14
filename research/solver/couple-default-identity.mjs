/*
 * A COUPLE'S SOLVE AT THE NEW DEFAULTS AGAINST THE CODE STAGE C TESTED (D99). EXPLORATORY: an identity check, deciding nothing.
 * The reviewer at item 6's stage C's read (reviews/2026-11-14-read-couples-share.md, finding 6) and the deep review
 * (reviews/2026-11-14-deep-couples-share.md): the PASS was measured on code 7002a1fec94c, and the working branch has moved
 * since (the limits per person and a stored solve restored split, in src/solver; the speed mode in the app's settings), so the
 * change of default shows a couple's solve and path at the new defaults the same as the tested code's, or says what moved.
 * For a few of stage C's units (couples-share-panel.json), on the tree it is pointed at:
 *   audit  the registered CANDS arm as stage C's audit solves it (audit-couples-share.mjs solveArm on audit-couples.mjs
 *          solverPlan('CANDC', ...): the couples' candidate without the tie-break, at 45 points, with shareRule 'pots');
 *   app    the page's own route (src/solverCouple.js couplePlans on the couples' default share rule, src/solverSettings.js
 *          APP_COUPLE; each person solved by src/solverApp.js solveForApp at the app's candidate, the tie-break in it, with their
 *          partner's age; then assembleCouple), on the same plan, as the page would hold it;
 * and prints each person's table digest (src/solverDigest.js, the harnesses' bit-for-bit fingerprint), the share and its
 * rule, and the engine's run of the couple, as the audit runs it, on the first 500 paths of seed 7002 (audit-phase4.mjs
 * runPath): the paths survived and a hash of every path's survival, pot, estate, spending delivered and lifetime tax.
 *   node research/solver/couple-default-identity.mjs <tree> <audit|app> <unit>
 */
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const [treeArg, mode, id] = process.argv.slice(2);
if (!treeArg || !['audit', 'app'].includes(mode) || !id) { console.error('usage: couple-default-identity.mjs <tree> <audit|app> <unit>'); process.exit(2); }
const root = resolve(treeArg), imp = p => import(pathToFileURL(join(root, p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), CPL = await imp('src/solver/couple.js');
const DIG = await imp('src/solverDigest.js'), AC = await imp('research/solver/audit-couples.mjs'), P4 = await imp('research/solver/audit-phase4.mjs');
const SEL = await imp('research/solver/select-phase4.mjs'), CP = await imp('research/solver/couple-panel.mjs'), PANEL = await imp('research/solver/couples-share-panel.mjs');
const PTS = 45, W = 0.02, SEED = 7002, N = 500;

const u = PANEL.readSharePanel().find(x => x.id === id);
if (!u) { console.error(`no unit ${id} in the panel`); process.exit(2); }
const base = u.plan, a = SEL.armA(CP.appPlan(base), { tournament: false });
const aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
const t0 = Date.now();
let cp;
if (mode === 'audit') {
  const AUD = await imp('research/solver/audit-couples-share.mjs');
  cp = AUD.solveArm('CANDS', AC.solverPlan('CANDC', base, aPol, W), PTS);
} else {
  const SC = await imp('src/solverCouple.js'), APP = await imp('src/solverApp.js'), SET = await imp('src/solverSettings.js');
  const routed = P4.solverPlanOf(base, aPol);
  // the plan as the page holds it: routed as the audit routes it, its aims the audit's (the standard estate aim, raises capped,
  // consent to change risk given, the dial at 1); couplePlans then prepares it as the page does (householdPlan)
  const plan = { ...routed, solver: { aims: { cuts: 1, estate: 'standard', raises: 'capped', riskConsent: true } } };
  const cut = SC.couplePlans(E, plan, { shareRule: SET.APP_COUPLE.shareRule });
  const tables = {}, solvedOn = {};
  for (const who of ['self', 'part']) { tables[who] = APP.solveForApp(E, M, cut.plans[who], { points: PTS, ageWith: cut.ageWith[who] }); solvedOn[who] = { plan: cut.plans[who], ageWith: cut.ageWith[who] }; }
  cp = SC.assembleCouple(E, M, cut.household, tables, { shareRule: cut.shareRule, solvedOn });
}
const solveSecs = (Date.now() - t0) / 1000;
const digests = {};
for (const who of ['self', 'part']) digests[who] = (await DIG.digestOf(DIG.tablesOf(cp.tables[who]))).slice(0, 16);
// the engine's run as the audit makes it: the couple through the joint move, each person's MPAA age arm A's
const aDemo = E.resolveMpaa(a.planState).demographics;
const ctx = E.buildContext(CPL.withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
const h = createHash('sha256'), f = new Float64Array(5);
let survived = 0;
E.pathsForSeed(SEED, N, ctx.totalYears).forEach(zs => {
  const o = P4.runPath(ctx, Float64Array.from(zs), false);
  survived += o.survived ? 1 : 0;
  f[0] = o.survived ? 1 : 0; f[1] = o.wealth; f[2] = o.estate; f[3] = o.delivered; f[4] = o.tax;
  h.update(Buffer.from(f.buffer));
});
console.log(`${id} ${mode} share ${cp.share} rule ${cp.meta.shareRule} self ${digests.self} part ${digests.part} survived ${survived} of ${N} outcomes ${h.digest('hex').slice(0, 16)} | solve ${Math.round(solveSecs)} s`);
