/*
 * THE SHARE ENSEMBLE (SHARE-ENSEMBLE.md; the deep review of item 6's stage C, 14 Nov, section 4; EXPLORATORY, seed 7002,
 * deciding nothing but by the rule SHARE-ENSEMBLE.md commits). On the working branch's own code. One unit one of stage C's
 * (couples-share-panel.json, at its landed target), or S211-75pdb (S211-75's plan with the panel's DB pension the second
 * person's, built here); its arms at estate weight 0.02, each run by the engine on the same 4,000 paths of seed 7002:
 *   APP      the app's rules: arm A's pick on the unit's plan, as stage C's APP;
 *   s<x>     the couples' candidate as stage C solved it (audit-couples-share.mjs COUPLES_CANDIDATE: the app's candidate less
 *            the tie-break, 45 points, each person's table with the partner's age), the couple solved on the first person's
 *            share x of the household's spending (solveCouple's own `share`); the first share of each unit the pots' (shareFor).
 * Stored for each path: survival, the year it failed, the pot left, the estate, lifetime tax, the spending delivered, and
 * whether it failed in the last year with the pot below the minimum.
 * Units go to results/share-ensemble-<seed>/ (SENS_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz. reduce-share-ensemble.mjs reads them.
 *   node research/solver/audit-share-ensemble.mjs part k/n      node research/solver/audit-share-ensemble.mjs --units
 *   SENS_PTS the points (smoke only); SENS_N the paths (smoke only); SENS_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { readSharePanel, SHARE_PANEL } from './couples-share-panel.mjs';
import { appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath } from './audit-phase4.mjs';
import { solverPlan } from './audit-couples.mjs';
import { COUPLES_CANDIDATE, settingsOf } from './audit-couples-share.mjs';
import { hashOf } from './candidate.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const { solveCouple, withCouple, shareFor } = CPL;
export const SEED = 7002, N = 4000, PTS = 45, W = 0.02, CHECK = 200;
export const PDB = 'S211-75pdb', PDB_FROM = 'S211-75', DB_AMOUNT = 15000;
/* the deep review's ten, longest first (the batch runs them in this order); the pots' share first in each */
export const UNITS = [
  { id: 'S265-90', group: 'ninety', shares: [0.9, 0.8, 0.75] },
  { id: 'S291-db', group: 'db', shares: [0.5, 0.6, 0.7] },
  { id: 'S129-90', group: 'ninety', shares: [0.9, 0.8, 0.75] },
  { id: 'S129-db', group: 'db', shares: [0.5, 0.6, 0.7] },
  { id: 'S211-db', group: 'db', shares: [0.5, 0.6, 0.7] },
  { id: PDB, group: 'partnerdb', shares: [0.75, 0.65, 0.55], from: PDB_FROM },
  { id: 'S237-90', group: 'ninety', shares: [0.9, 0.8, 0.75] },
  { id: 'S015-db', group: 'db', shares: [0.5, 0.6, 0.7] },
  { id: 'S019-90', group: 'ninety', shares: [0.9, 0.8, 0.75] },
  { id: 'S129-75', group: 'anchor', shares: [0.75] }
];
export const armOf = x => `s${x}`;
export const armsOf = u => ['APP', ...u.shares.map(armOf)];
export const STAMP_FILES = ['audit-share-ensemble.mjs', 'reduce-share-ensemble.mjs', 'SHARE-ENSEMBLE.md', 'batch-share-ensemble.sh', 'audit-couples-share.mjs', 'audit-couples.mjs', 'audit-phase4.mjs', 'couple-panel.mjs', 'couples-share-panel.mjs', 'select-phase4.mjs', 'couples-share-panel.json', 'stats.mjs', 'candidate.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-share-panel.json' ? SHARE_PANEL : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;
/* a unit's plan: stage C's at its landed target; S211-75pdb, S211-75's with the panel's DB pension the second person's */
export function planOfUnit(u, panel = readSharePanel()) {
  const src = panel.find(x => x.id === (u.from || u.id));
  if (!src) throw new Error(`audit-share-ensemble: ${u.from || u.id} is not in stage C's panel`);
  if (!u.from) return { plan: src.plan, label: src.label };
  const p = JSON.parse(JSON.stringify(src.plan)), spa = E.num(p.demographics.statePensionAge, 68);
  p.otherIncomes = [...(p.otherIncomes || []), { id: 'inc_db_share_ensemble', name: 'DB pension (the share ensemble)', owner: 'Partner', startAge: spa, endAge: '', amount: DB_AMOUNT, incomeType: 'otherTaxable', notes: '' }];
  return { plan: E.normalizePlan(p), label: null };
}
const light = pts => (pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-share-ensemble: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.SENS_OUT || join(HERE, 'results', `share-ensemble-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.SENS_PTS) || PTS, n = Number(process.env.SENS_N) || N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now(), { plan, label } = planOfUnit(u);
  const rule = shareFor(plan);
  if (Math.abs(rule - u.shares[0]) > 1e-12) { console.error(`audit-share-ensemble: ${u.id}: the pots' share is ${rule}, not the first share ${u.shares[0]}`); process.exit(3); }
  // the couples' candidate stage C's CANDH ran (af001697ce1b), each share then solveCouple's own
  const candidate = hashOf(COUPLES_CANDIDATE);
  console.log(`SHARE ENSEMBLE (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (${u.group}), shares ${u.shares.join(', ')} (the pots' ${rule}), seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}; node ${STAMP.node}`);
  const a = armA(appPlan(plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  if (label !== null && a.label !== label) { console.error(`audit-share-ensemble: ${u.id}: arm A's pick ${a.label} differs from the landing's ${label}`); process.exit(3); }
  const hp = solverPlan('CANDC', plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const arms = {}; let paths = null;
  for (const arm of armsOf(u)) {
    const s0 = Date.now();
    let ctx, cp = null, ran;
    if (arm === 'APP') { ctx = E.buildContext(E.resolveMpaa(a.planState)); ran = `armA ${a.label.replace(/ /g, '_')} guardrails ${!!ctx.guardrails} lookahead ${ctx.lookaheadYears}`; }
    else {
      const x = Number(arm.slice(1));
      cp = solveCouple(E, M, hp, { share: x, solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light(pts) } }) });
      if (Math.abs(cp.share - x) > 1e-12) { console.error(`audit-share-ensemble: ${u.id} ${arm}: solved on the share ${cp.share}`); process.exit(3); }
      ctx = E.buildContext(withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
      ran = `share ${cp.share} | self: ${settingsOf(cp.tables.self)} | part: ${settingsOf(cp.tables.part)}`;
    }
    const solveSecs = (Date.now() - s0) / 1000, T = ctx.totalYears;
    if (!paths) paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
    const A = { survived: new Uint8Array(n), failYear: new Int16Array(n), pot: new Float64Array(n), estate: new Float64Array(n), tax: new Float64Array(n), delivered: new Float64Array(n), minPot: new Uint8Array(n) };
    const e0 = Date.now();
    let bad = 0;
    paths.forEach((zs, k) => {
      const o = runPath(ctx, zs, false);
      A.survived[k] = o.survived ? 1 : 0; A.failYear[k] = o.failYear; A.pot[k] = o.wealth; A.estate[k] = o.estate; A.tax[k] = o.tax; A.delivered[k] = o.delivered;
      A.minPot[k] = !o.survived && o.failYear === T && ctx.solvencyFloor > 0 && o.wealth < ctx.solvencyFloor ? 1 : 0;
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.lifetimeTax !== o.tax) bad++; }
    });
    if (bad) { console.error(`audit-share-ensemble: ${u.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const surv = 100 * A.survived.reduce((s, x) => s + x, 0) / n;
    arms[arm] = { ran, share: cp ? cp.share : null, solveSecs, engineSecs: (Date.now() - e0) / 1000, T, minPotFloor: ctx.solvencyFloor,
      ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} ran ${arm}: ${ran}`);
    console.log(`${''.padEnd(8)} done ${arm}: solve ${solveSecs.toFixed(0)} s; engine ${surv.toFixed(2)}% on ${n}; runPath the same as E.runTrial on the first ${Math.min(CHECK, n)} paths`);
  }
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id: u.id, group: u.group, from: u.from || null, shares: u.shares, rule, seed: SEED, N: n, pts, W, candidate, stamp: STAMP, cpu: cpus()[0].model, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
