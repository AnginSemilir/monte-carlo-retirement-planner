/*
 * THE COUPLES' TIER TEST (COUPLE-TIERS.md; the deep review of the couples' read, 13 Nov, section 3; D39's test for singles,
 * on couples; EXPLORATORY, seed 7002, deciding nothing but by the rule COUPLE-TIERS.md commits). On the working branch's
 * own code. One unit a couple of the panel (now read), its plan as landed; three arms at estate weight 0.02, each run by
 * the engine on the same 4,000 paths of seed 7002:
 *   APP      the app's rules: arm A's pick on the couple's plan, as the registered run's APP;
 *   CANDC    the candidate for couples as registered (audit-couples.mjs solverPlan and solveArm);
 *   CANDCNC  the same with consent to change risk withdrawn in each person's aims (riskConsent false: each table one tier
 *            pair, the plan's own; the solve then on the whole menu, D74).
 * Stored for each path: survival, the year it failed, the pot left, lifetime tax and the tax paid in years the household
 * stood above the estate cap (four times its opening wealth), the spending delivered. Stored for each arm by plan year,
 * over the paths not yet failed: each person's tier steps held below the plan's own, pension and ISA (the engine's
 * state.tierHeld). And the capital gains bill's replay (open item CGT-BILL): where CTIERS_BEFORE names a tree at the commit
 * before that fix, its engine built, CANDC's solved couple is run on that engine too, and the paths that fail while the
 * household holds more than it opened with are counted by year under each engine.
 * Units go to results/couple-tiers-<seed>/ (CTIERS_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz. reduce-couple-tiers.mjs reads them.
 *   node research/solver/audit-couple-tiers.mjs part k/n      node research/solver/audit-couple-tiers.mjs --units
 *   CTIERS_PTS the points (smoke only); CTIERS_N the paths (smoke only); CTIERS_OUT the folder; CTIERS_BEFORE the tree before the bill's fix
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp, prepareForSolve, appPlan as appSolverPlan } from '../../src/solverApp.js';
import { readPanel, appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf } from './audit-phase4.mjs';
import { PANEL_FILE, solverPlan, solveArm } from './audit-couples.mjs';
import { settingsOf } from './audit-speed.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const { solveCouple, withCouple } = CPL;
export const SEED = 7002, N = 4000, PTS = 45, W = 0.02, CHECK = 200, CAP_TIMES = 4;
/* the eight (the deep review's choice, by their pot shapes): four of the younger cohort, then four of the library's */
export const YOUNGER = ['S309F', 'S311F', 'S317F', 'S323F'], LIBRARY = ['S189', 'S293', 'S011', 'S083'];
export const COUPLES = [...YOUNGER, ...LIBRARY];
export const UNITS = COUPLES.map(id => ({ id }));
export const ARMS = ['APP', 'CANDC', 'CANDCNC'];
export const STAMP_FILES = ['audit-couple-tiers.mjs', 'reduce-couple-tiers.mjs', 'COUPLE-TIERS.md', 'audit-couples.mjs', 'audit-phase4.mjs', 'audit-speed.mjs', 'couple-panel.mjs', 'select-phase4.mjs', 'couples-panel-d4b.json', 'reduce-phase4.mjs', 'stats.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;
/* how many tier pairs a person's solved table holds (one: consent withdrawn, the plan's own pair) */
export const pairsOf = tab => { const ts = tab.meta && tab.meta.tierState; return !ts ? 1 : Array.isArray(ts) ? ts.length : String(ts).split(',').length; };
const light = pts => (pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {});

/* one arm's paths on an engine: each path's outcome, the tax in years above the cap, the tiers held by year, and the paths
   failing while the household holds more than it opened with, by the year they fail */
export function runArm(Eng, ctx, paths, opening, keepTiers = true) {
  const n = paths.length, T = ctx.totalYears, Y = T + 1, cap = CAP_TIMES * opening;
  const A = { survived: new Uint8Array(n), failYear: new Int16Array(n).fill(-1), pot: new Float64Array(n), tax: new Float64Array(n), taxAbove: new Float64Array(n), delivered: new Float64Array(n) };
  const tiers = { alive: new Float64Array(Y), selfPen: new Float64Array(Y), selfIsa: new Float64Array(Y), partPen: new Float64Array(Y), partIsa: new Float64Array(Y) };
  const richFail = {};
  for (let k = 0; k < n; k++) {
    const zs = paths[k], st = Eng.freshState(ctx), zPath = zs.length > Y ? zs[Y] : 0;
    let failed = false, failYear = -1, tax = 0, above = 0, delivered = 0, last = null, wealthBefore = opening;
    for (let t = 0; t <= T; t++) {
      const row = Eng.stepYear(ctx, st, t, { z: zs[t], zPath }), yt = row.taxPaid + (row.cgtPaid || 0);
      tax += yt; if (wealthBefore > cap) above += yt;
      const u = Math.max(0, row.unmetDemand || 0);
      if (row.targetSpend > 0) delivered += Math.max(0, row.targetSpend - u);
      if (!failed && (row.unmetDemand > Eng.FAIL_TOLERANCE || row.preNmpaInsolvent)) { failed = true; failYear = t; }
      if (!failed && keepTiers && st.tierHeld) { tiers.alive[t]++; tiers.selfPen[t] += st.tierHeld.self.pen; tiers.selfIsa[t] += st.tierHeld.self.isa; tiers.partPen[t] += st.tierHeld.part.pen; tiers.partIsa[t] += st.tierHeld.part.isa; }
      wealthBefore = Math.max(0, row.totalCombined); last = row;
    }
    const wealth = Math.max(0, last.totalCombined);
    if (!failed && ctx.solvencyFloor > 0 && wealth < ctx.solvencyFloor) { failed = true; failYear = T; }
    A.survived[k] = failed ? 0 : 1; A.failYear[k] = failYear; A.pot[k] = wealth; A.tax[k] = tax; A.taxAbove[k] = above; A.delivered[k] = delivered;
    if (failed && wealth > opening) richFail[failYear] = (richFail[failYear] || 0) + 1;
  }
  return { A, tiers, richFail };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-couple-tiers: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.CTIERS_OUT || join(HERE, 'results', `couple-tiers-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.CTIERS_PTS) || PTS, n = Number(process.env.CTIERS_N) || N;
  const BEFORE = process.env.CTIERS_BEFORE || null;
  if (BEFORE && !existsSync(join(BEFORE, 'research/engine.mjs'))) { console.error('audit-couple-tiers: CTIERS_BEFORE=<a tree at the commit before the bill\'s fix, its engine built>'); process.exit(2); }
  const E0 = BEFORE ? await import(pathToFileURL(join(BEFORE, 'research/engine.mjs')).href) : null;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], id = u.id, t0 = Date.now(), h = readPanel(PANEL_FILE).find(x => x.id === id);
  if (!h) { console.error(`audit-couple-tiers: ${id} is not in the panel`); process.exit(2); }
  console.log(`COUPLE-TIERS (EXPLORATORY): unit ${pk}/${pn}: ${id} (${h.cohort}), seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}; the engine before the bill's fix ${BEFORE ? 'beside CANDC' : 'not run'}; node ${STAMP.node}`);
  const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  // CANDCNC's plan: CANDC's as audit-couples.mjs builds it, consent to change risk withdrawn
  const ncPlan = appSolverPlan(E, prepareForSolve(E, { ...solverPlanOf(h.plan, aPol), solver: { aims: { cuts: 1, estate: 'standard', raises: 'capped', riskConsent: false } } }));
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const arms = {}; let paths = null, opening = 0;
  for (const arm of ARMS) {
    const s0 = Date.now();
    let ctx, cp = null, ran;
    if (arm === 'APP') { ctx = E.buildContext(E.resolveMpaa(a.planState)); ran = `armA ${a.label.replace(/ /g, '_')} guardrails ${!!ctx.guardrails} lookahead ${ctx.lookaheadYears}`; }
    else {
      cp = arm === 'CANDC' ? solveArm('CANDC', solverPlan('CANDC', h.plan, aPol, W), W, pts) : solveCouple(E, M, ncPlan, { solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: light(pts) }) });
      ctx = E.buildContext(withCouple(cp.plan, cp));
      ran = `pairs ${pairsOf(cp.tables.self)}/${pairsOf(cp.tables.part)} | self: ${settingsOf(cp.tables.self)} | part: ${settingsOf(cp.tables.part)}`;
    }
    const solveSecs = (Date.now() - s0) / 1000, T = ctx.totalYears;
    if (!paths) { paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs)); opening = ctx.accounts.reduce((s, x) => s + x.balance, 0); }
    const e0 = Date.now(), R = runArm(E, ctx, paths, opening);
    // held to the shared path runner on the first paths: survival, the pot, the tax
    let bad = 0; for (let k = 0; k < Math.min(CHECK, n); k++) { const o = runPath(ctx, paths[k], false); if (!!o.survived !== !!R.A.survived[k] || o.wealth !== R.A.pot[k] || o.tax !== R.A.tax[k]) bad++; }
    if (bad) { console.error(`audit-couple-tiers: ${id} ${arm}: this run differs from audit-phase4.mjs runPath on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    let before = null;
    if (arm === 'CANDC' && E0) { const c0 = E0.buildContext(withCouple(cp.plan, cp)), R0 = runArm(E0, c0, paths, opening, false); before = { richFail: R0.richFail, survived: b64(R0.A.survived), failYear: b64(R0.A.failYear) }; }
    const surv = 100 * R.A.survived.reduce((s, x) => s + x, 0) / n;
    arms[arm] = { ran, solveSecs, engineSecs: (Date.now() - e0) / 1000, pairs: cp ? [pairsOf(cp.tables.self), pairsOf(cp.tables.part)] : null, richFail: R.richFail, before,
      survived: b64(R.A.survived), failYear: b64(R.A.failYear), pot: b64(R.A.pot), tax: b64(R.A.tax), taxAbove: b64(R.A.taxAbove), delivered: b64(R.A.delivered),
      tiers: Object.fromEntries(Object.entries(R.tiers).map(([k, v]) => [k, Array.from(v)])) };
    console.log(`${''.padEnd(8)} ran ${arm}: ${ran}`);
    console.log(`${''.padEnd(8)} done ${arm}: solve ${solveSecs.toFixed(0)} s; engine ${surv.toFixed(2)}% on ${n}; the shared runner on the first ${Math.min(CHECK, n)} paths the same${before ? `; failing with more than it opened with, the engine before the bill's fix ${Object.values(before.richFail).reduce((s, x) => s + x, 0)}, this engine ${Object.values(R.richFail).reduce((s, x) => s + x, 0)}` : ''}`);
  }
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id, cohort: h.cohort, seed: SEED, N: n, pts, W, opening, cap: CAP_TIMES * opening, stamp: STAMP, cpu: cpus()[0].model, before: BEFORE ? 'run' : 'not run', arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
