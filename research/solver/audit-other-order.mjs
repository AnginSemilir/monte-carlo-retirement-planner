/*
 * COUPLES IN THE OTHER ORDER, STAGE A (OTHER-ORDER.md; D100, Part D's D7; EXPLORATORY, seed 7002, deciding nothing but by
 * the rule OTHER-ORDER.md commits). On the working branch's own code. One unit one of stage C's 24 re-held units
 * (couples-share-panel.json: the elder entered first, holding 75% or 90% of the pots, at its landed target); its arms at
 * estate weight 0.02, each run by the engine on the same 4,000 paths of seed 7002 (the horizon the same in both orders):
 *   APP      the app's rules on the plan as tested: arm A's pick, as stage C's APP;
 *   ELDER    the couples' candidate as stage C's CANDS ran it (audit-couples-share.mjs COUPLES_CANDIDATE, shareRule 'pots',
 *            45 points, each person's table with the partner's age, arm A's MPAA ages) on the plan as tested;
 *   APPY     the app's rules on the plan entered the other way round (couple-order.mjs otherOrder: the younger first, the plan
 *            ending in the same year);
 *   YOUNG    ELDER's solve on the other order, the option unset;
 *   YOUNGE   YOUNG with couple.js's estateWeight 'elder' (each person's tables YOUNG's; only the joint estate weight differs).
 * Stored for each path: survival, the year it failed, the pot left, the estate, lifetime tax, the spending delivered, and
 * whether it failed in the last year with the pot below the minimum; each person's table's digest in each order.
 * Units go to results/other-order-<seed>/ (OORD_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz. reduce-other-order.mjs reads them.
 *   node research/solver/audit-other-order.mjs part k/n      node research/solver/audit-other-order.mjs --units
 *   OORD_PTS the points (smoke only); OORD_N the paths (smoke only); OORD_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readSharePanel, SHARE_PANEL } from './couples-share-panel.mjs';
import { appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath } from './audit-phase4.mjs';
import { solverPlan } from './audit-couples.mjs';
import { COUPLES_CANDIDATE, settingsOf } from './audit-couples-share.mjs';
import { otherOrder } from './couple-order.mjs';
import { hashOf } from './candidate.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const { solveCouple, withCouple } = CPL;
export const SEED = 7002, N = 4000, PTS = 45, W = 0.02, CHECK = 200;
export const ARMS = ['APP', 'ELDER', 'APPY', 'YOUNG', 'YOUNGE'];
export const STAMP_FILES = ['audit-other-order.mjs', 'reduce-other-order.mjs', 'OTHER-ORDER.md', 'batch-other-order.sh', 'couple-order.mjs', 'audit-couples-share.mjs', 'audit-couples.mjs', 'audit-phase4.mjs', 'couple-panel.mjs', 'couples-share-panel.mjs', 'select-phase4.mjs', 'couples-share-panel.json', 'stats.mjs', 'candidate.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-share-panel.json' ? SHARE_PANEL : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
/* the 24 re-held units, the 90s first (their solves the longest), then the 75s, each in the panel's order */
export const unitsOf = (panel = readSharePanel()) => [...panel.filter(u => u.kind === 'reheld' && u.variant === '90'), ...panel.filter(u => u.kind === 'reheld' && u.variant === '75')];
export const fileOf = u => `${u.id}.json.gz`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2), UNITS = unitsOf();
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-other-order: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.OORD_OUT || join(HERE, 'results', `other-order-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.OORD_PTS) || PTS, n = Number(process.env.OORD_N) || N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now(), plans = { ELDER: u.plan, YOUNG: otherOrder(E, u.plan) };
  const candidate = hashOf(COUPLES_CANDIDATE);
  console.log(`OTHER ORDER (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (the elder first holding ${u.variant}%), seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}; node ${STAMP.node}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  // each person's table solved once for its plan and partner's age; YOUNGE takes YOUNG's
  const memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  const arms = {}, digests = {}, order = {};
  let paths = null;
  for (const which of ['ELDER', 'YOUNG']) {
    const plan = plans[which], a = armA(appPlan(plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
    if (which === 'ELDER' && a.label !== u.label) { console.error(`audit-other-order: ${u.id}: arm A's pick ${a.label} differs from the landing's ${u.label}`); process.exit(3); }
    const c0 = E.buildContext(E.resolveMpaa(E.normalizePlan(plan)));
    order[which] = { ageSelf0: c0.ageSelf0, agePart0: c0.agePart0, terminalAge: c0.terminalAge, years: c0.totalYears, label: a.label };
    const hp = solverPlan('CANDC', plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
    const run = (arm, ctx, cp, solveSecs, ran) => {
      const T = ctx.totalYears;
      if (!paths) { paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs)); paths.T = T; }
      if (T !== paths.T) { console.error(`audit-other-order: ${u.id} ${arm}: a horizon of ${T} years, not the unit's ${paths.T}: the paths would not be the same`); process.exit(3); }
      const A = { survived: new Uint8Array(n), failYear: new Int16Array(n), pot: new Float64Array(n), estate: new Float64Array(n), tax: new Float64Array(n), delivered: new Float64Array(n), minPot: new Uint8Array(n) };
      const e0 = Date.now(); let bad = 0;
      paths.forEach((zs, k) => {
        const o = runPath(ctx, zs, false);
        A.survived[k] = o.survived ? 1 : 0; A.failYear[k] = o.failYear; A.pot[k] = o.wealth; A.estate[k] = o.estate; A.tax[k] = o.tax; A.delivered[k] = o.delivered;
        A.minPot[k] = !o.survived && o.failYear === T && ctx.solvencyFloor > 0 && o.wealth < ctx.solvencyFloor ? 1 : 0;
        if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.lifetimeTax !== o.tax) bad++; }
      });
      if (bad) { console.error(`audit-other-order: ${u.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
      const surv = 100 * A.survived.reduce((s, v) => s + v, 0) / n;
      arms[arm] = { ran, order: which, share: cp ? cp.share : null, shareRule: cp ? cp.meta.shareRule : null, wB: cp ? cp.wB : null, wSelf: cp ? cp.tables.self.wB : null, wPart: cp ? cp.tables.part.wB : null,
        estateWeight: cp ? cp.meta.estateWeight || null : null, estateFrom: cp ? cp.meta.estateFrom || null : null, solveSecs, engineSecs: (Date.now() - e0) / 1000, T, minPotFloor: ctx.solvencyFloor,
        ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
      console.log(`${''.padEnd(8)} ran ${arm}: ${ran}`);
      console.log(`${''.padEnd(8)} done ${arm}: solve ${solveSecs.toFixed(0)} s; engine ${surv.toFixed(2)}% on ${n}; runPath the same as E.runTrial on the first ${Math.min(CHECK, n)} paths`);
    };
    // the app's rules on this order's plan
    { const ctx = E.buildContext(E.resolveMpaa(a.planState)); run(which === 'ELDER' ? 'APP' : 'APPY', ctx, null, 0, `armA ${a.label.replace(/ /g, '_')} guardrails ${!!ctx.guardrails} lookahead ${ctx.lookaheadYears}`); }
    // the candidate on this order's plan; in the other order with the option too
    for (const arm of which === 'ELDER' ? ['ELDER'] : ['YOUNG', 'YOUNGE']) {
      const s0 = Date.now(), cp = solveCouple(E, M, hp, { shareRule: 'pots', solveOne, ...(arm === 'YOUNGE' ? { estateWeight: 'elder' } : {}) }), secs = (Date.now() - s0) / 1000;
      const ctx = E.buildContext(withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
      if (arm !== 'YOUNGE') digests[which] = { self: await digestOf(tablesOf(cp.tables.self)), part: await digestOf(tablesOf(cp.tables.part)) };
      run(arm, ctx, cp, secs, `share ${cp.share} shareRule ${cp.meta.shareRule} estate weight ${cp.wB} (from ${cp.meta.estateFrom || 'self, unset'}) | self: ${settingsOf(cp.tables.self)} | part: ${settingsOf(cp.tables.part)}`);
    }
  }
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id: u.id, variant: u.variant, base: u.base, target: u.target, order, digests, seed: SEED, N: n, pts, W, candidate, stamp: STAMP, cpu: cpus()[0].model, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
