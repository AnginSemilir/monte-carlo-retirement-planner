/*
 * PART D, D4: THE CANDIDATE FOR COUPLES AGAINST THE APP'S RULES AND THE PRODUCT'S SETTINGS, SCORED BY THE ENGINE (the launch
 * plan's section 6, D4; built as Phase 4's audit was, audit-phase4.mjs, whose path runner, inputs hash and solver plan it takes).
 * Per couple of couples-panel.json, its plan (couple-panel.mjs planOf: the landed target, the floor at 80%, the minimum pot
 * written in, the one-off costs kept, the candidate's return assumptions on every arm), and per unit:
 *   APP      arm A, the app's rules: its withdrawal-policy search on the couple's own plan (searched on seed 7001; no
 *            tournament, D36), guardrails on, the lookahead at 5 years, raises capped at 110% (couple-panel.mjs appPlan,
 *            select-phase4.mjs armA);
 *   CANDC/W  the candidate for couples: each person's table solved as the app solves a single's (src/solverApp.js
 *            solveForApp: the candidate's settings at the app's 45 points, the floor, the aims at the dial's 1, the estate
 *            'standard' at W 0.02 and 'lower' at 0.01), the two run by the couples' rollout (src/solver/couple.js, Part D's D1
 *            to D3), executed by the engine (couple.js withCouple);
 *   SHIPC/W  the couples' solver at the product's settings: each person's table at PRODUCT_BASELINE's settings (solvePlan, 30
 *            points, lambda as 7u-F's, the estate weight W), the same rollout, executed by the engine.
 * The solver arms solve the couple's plan with guardrails and the lookahead off, its windfalls routed as arm A routes them
 * (audit-phase4.mjs solverPlanOf, D37). Each unit is run on N paths of the seed: every path's survival, estate, wealth at the
 * end, spending delivered over every year, unmet spending, lifetime tax, the year it failed, each year's spend as a share of
 * its target, and the spending delivered in the one-off costs' years (the cost years, reported apart); the engine's own year
 * path by path (audit-phase4.mjs runPath), held to E.runTrial on the first CHECK paths; on the solver arms the couples'
 * rollout in the exact model (runCouplePolicy) beside the engine on the first BESIDE paths (the fidelity check). Every unit
 * records its engine context's inputs hash (a couple's five units held to one plan), the target the engine ran, each
 * person's run record and the solve's seconds. Each unit's arrays go to results/d4-run (D4_OUT), stamped with the code, the
 * files in STAMP_FILES and the Node version.
 *   node research/solver/audit-couples.mjs registered part k/n         the registered run (seed SEED, each couple's paths)
 *   node research/solver/audit-couples.mjs <paths> part k/n <seed>     the pilot (D4_PILOT=1) or a preflight
 *   node research/solver/audit-couples.mjs --units                     the unit count
 *   D4_ONLY=<id>,<id> limits the couples, D4_W the estate weight, D4_ARMS the arms, D4_PTS the solves' wealth points (the pilot
 *   and smoke tests only: the registered run refuses them)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { solveCouple, withCouple, runCouplePolicy } from '../../src/solver/couple.js';
import { solveForApp, appPlan as appSolverPlan, prepareForSolve } from '../../src/solverApp.js';
import { readPanel, appPlan, PANEL_FILE } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, inputsHash, solverPlanOf } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// e3pcls guard: CANDC solves through solveForApp (the app's path; the pin is the candidate's research path's); SHIPC's solvePlan is the product's settings

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7021, PILOT_SEED = 7002, CAND_PTS = 45, SHIP_PTS = 30, LAMBDA = 0.0223606797749979;
export const WEIGHTS = ['0.02', '0.01'], CHECK = 200, BESIDE = 500;
export const PATHS_FILE = join(HERE, 'couples-paths.json'), REGISTRATION = 'research/solver/registrations/couples-d4.md';
export const STAMP_FILES = ['audit-couples.mjs', 'couple-panel.mjs', 'select-phase4.mjs', 'audit-phase4.mjs', 'couples-orders.json', 'couples-panel.json', 'couples-paths.json', 'reduce-couples.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) { const p = f === 'couples-panel.json' ? PANEL_FILE : join(HERE, f); if (existsSync(p)) h.update(readFileSync(p)); }
  return h.digest('hex').slice(0, 12);
}
/* the units, the longest first: CANDC at both weights, then SHIPC, then APP */
export const unitsOf = ids => [...ids.flatMap(id => WEIGHTS.map(w => [id, 'CANDC', w])), ...ids.flatMap(id => WEIGHTS.map(w => [id, 'SHIPC', w])), ...ids.map(id => [id, 'APP', '-'])];
export const fileOf = (id, arm, w) => `${id}-${arm.toLowerCase()}-w${w}.json.gz`;
/* the cost years: each one-off cost's year as the engine's year index */
export const costYearsOf = ctx => [...new Set([...(ctx.oneOffCosts instanceof Map ? ctx.oneOffCosts.keys() : [])].map(y => Number(y) - ctx.baseYear).filter(t => t >= 0 && t <= ctx.totalYears))].sort((a, b) => a - b);   // the engine keeps a Map of year to amount

/* each person's table as the arm solves it */
export function solveArm(arm, hp, W, pts) {
  if (arm === 'CANDC') return solveCouple(E, M, hp, { solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0 }) });
  return solveCouple(E, M, hp, { solveOne: (p) => solvePlan(E, M, p, { lambda: LAMBDA, points: pts, bequestWeight: W }) });
}
/* the plan each solver arm solves: the couple's with arm A's routing, guardrails and the lookahead off; CANDC's prepared as the
   app prepares a plan (prepareForSolve, appPlan: the candidate's tier returns, the same as candidatePlan's), its estate aim W */
export function solverPlan(arm, base, aPol, W) {
  const routed = solverPlanOf(base, aPol);
  if (arm === 'CANDC') return appSolverPlan(E, prepareForSolve(E, { ...routed, solver: { aims: { cuts: 1, estate: W === 0.01 ? 'lower' : 'standard', raises: 'capped', riskConsent: true } } }));
  return E.resolveMpaa(E.normalizePlan({ ...routed, config: { ...routed.config, guardrails: false, lookaheadYears: 0 } }));
}
const settingsOf = r => `pts ${r.g.np} mix ${r.meta.mixture} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} levels ${r.meta.spendLevels.join(',')} bridgeRead ${r.meta.bridgeRead} readerRef ${r.meta.readerRef} tierState ${r.meta.tierState} tiersBelow ${r.meta.tiersBelow} tableDealing ${r.meta.tableDealing} switchCharge ${r.switchCharge || 0} e3 ${!!r.meta.e3} failDelivered ${!!r.meta.failDelivered} minPot ${E.num(r.m.ctx.solvencyFloor, 0)}`;
export const WANT = {
  CANDC: { pts: String(CAND_PTS), bridgeRead: 'reader', readerRef: 'adaptive', tiersBelow: '3', tableDealing: 'false', switchCharge: '0.001', e3: 'true', failDelivered: 'true', lambda: String(LAMBDA) },
  SHIPC: { pts: String(SHIP_PTS), bridgeRead: 'false', tierState: 'null', tiersBelow: '2', tableDealing: 'true', e3: 'false', lambda: String(LAMBDA) }
};
export const wantProblems = (arm, line, W, ptsFree = false) => {
  const got = Object.fromEntries(line.match(/(\S+) (\S+)/g).map(x => x.split(' ')));
  const bad = Object.entries(WANT[arm]).filter(([k, v]) => !(ptsFree && k === 'pts') && got[k] !== v).map(([k, v]) => `${k} ${got[k]} (want ${v})`);
  if (Number(got.bequestWeight) !== W) bad.push(`bequestWeight ${got.bequestWeight} (want ${W})`);
  return bad;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const panel = readPanel(), byId = Object.fromEntries(panel.map(h => [h.id, h]));
  if (args[0] === '--units') { console.log(`over ${panel.length} couples:`); console.log(unitsOf(panel.map(h => h.id)).length); process.exit(0); }
  const REGISTERED = args[0] === 'registered', PILOT = process.env.D4_PILOT === '1';
  if (REGISTERED && (process.env.D4_ONLY || process.env.D4_W || process.env.D4_ARMS || process.env.D4_PTS || process.env.D4_PANEL || process.env.D4_PILOT)) { console.error('audit-couples: the registered run takes no limits'); process.exit(2); }
  if (REGISTERED && process.env.PREDICTION_FILE !== REGISTRATION) { console.error(`audit-couples: the registered run runs only under ${REGISTRATION}, through the launcher (PREDICTION_FILE ${process.env.PREDICTION_FILE || 'unset'})`); process.exit(2); }
  const SEED_RUN = REGISTERED ? SEED : Number(args[3]);
  if (!REGISTERED && (!(SEED_RUN > 0) || SEED_RUN === SEED)) { console.error(`audit-couples: a run other than the registered one needs a seed, and not ${SEED}`); process.exit(2); }
  const [pk, pn] = (args[2] || '0/1').split('/').map(Number);
  const pathsOf = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')).paths : null;
  const nOf = id => (REGISTERED ? pathsOf[id] : Number(args[0]));
  const only = process.env.D4_ONLY ? new Set(process.env.D4_ONLY.split(',')) : null, arms = process.env.D4_ARMS ? new Set(process.env.D4_ARMS.split(',')) : null;
  const UNITS = unitsOf(panel.map(h => h.id).filter(id => !only || only.has(id))).filter(([, arm, w]) => (!arms || arms.has(arm)) && (!process.env.D4_W || w === '-' || w === process.env.D4_W));
  const OUT = process.env.D4_OUT || join(HERE, 'results', REGISTERED ? 'd4-run' : PILOT ? 'd4-pilot' : 'd4-preflight');
  mkdirSync(OUT, { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  console.log(`D4${REGISTERED ? '' : PILOT ? ' (THE PILOT)' : ' (A PREFLIGHT)'}: APP, CANDC (${CAND_PTS} points) and SHIPC (${SHIP_PTS} points) at the estate weights ${WEIGHTS.join(' and ')}; seed ${SEED_RUN}; ${UNITS.length} units; part ${pk}/${pn}; node ${STAMP.node}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const surv = A => (100 * A.survived.reduce((a, x) => a + x, 0) / A.survived.length);

  UNITS.forEach(([id, arm, w], i) => {
    if (i % pn !== pk) return;
    const h = byId[id], N = nOf(id), L = `${arm}${w === '-' ? '' : `/W${w}`}`, base = h.plan, t0 = Date.now();
    console.log(`${id.padEnd(8)} case | unit ${L} | cohort ${h.cohort} target ${h.target} paths ${N}`);
    const a = armA(appPlan(base), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
    if (a.label !== h.label) { console.error(`audit-couples: ${id}: arm A's pick ${a.label} differs from the landing's ${h.label}`); process.exit(3); }
    let ctx, cp = null, solveSecs = 0, ran;
    if (arm === 'APP') {
      ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || ctx.raiseCapFrac !== 1.1 || ctx.solvencyFloor !== E.num(base.config.solvencyFloor, 0) || !ctx.isCouple) { console.error(`audit-couples: ${id} APP: guardrails ${ctx.guardrails}, raise cap ${ctx.raiseCapFrac}, minimum pot ${ctx.solvencyFloor}, couple ${ctx.isCouple}`); process.exit(3); }
      ran = `arm A ${a.label.replace(/ /g, '_')} guardrails ${!!ctx.guardrails} lookahead ${ctx.lookaheadYears} raiseCap ${ctx.raiseCapFrac} minPot ${ctx.solvencyFloor} target ${ctx.targetSpend}`;
    } else {
      const W = Number(w), pts = Number(process.env.D4_PTS) || (arm === 'CANDC' ? CAND_PTS : SHIP_PTS);
      cp = solveArm(arm, solverPlan(arm, base, aPol, W), W, pts);
      solveSecs = (Date.now() - t0) / 1000;
      const lines = ['self', 'part'].map(who => settingsOf(cp.tables[who]));
      for (const [k, line] of lines.entries()) { const bad = wantProblems(arm, line, W, !!process.env.D4_PTS); if (bad.length) { console.error(`audit-couples: ${id} ${L} ${k ? 'part' : 'self'}: ${bad.join('; ')}`); process.exit(3); } }
      if (cp.m.ctx.solvencyFloor !== E.num(base.config.solvencyFloor, 0)) { console.error(`audit-couples: ${id} ${L}: the household's minimum pot ${cp.m.ctx.solvencyFloor}, not the panel's ${base.config.solvencyFloor}`); process.exit(3); }
      ctx = E.buildContext(withCouple(cp.plan, cp));
      ran = `self: ${lines[0]} | part: ${lines[1]}`;
    }
    const T = ctx.totalYears, Y = T + 1, inputs = inputsHash(ctx), costYears = costYearsOf(ctx);
    console.log(`${''.padEnd(8)} ran ${L}: ${ran} inputs ${inputs} costYears ${costYears.join(',') || 'none'}${solveSecs ? ` | solve secs ${Math.round(solveSecs)}` : ''}`);
    const e0 = Date.now(), paths = E.pathsForSeed(SEED_RUN, N, T), n = paths.length;
    const A = { survived: new Uint8Array(n), estate: new Float32Array(n), wealth: new Float32Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), tax: new Float32Array(n), failYear: new Int16Array(n), level: new Uint8Array(n * Y), costDelivered: new Float32Array(n) };
    let bad = 0;
    paths.forEach((zs0, k) => {
      const zs = Float64Array.from(zs0), o = runPath(ctx, zs);
      A.survived[k] = o.survived ? 1 : 0; A.estate[k] = o.estate; A.wealth[k] = o.wealth; A.delivered[k] = o.delivered; A.unmet[k] = o.unmet; A.tax[k] = o.tax; A.failYear[k] = o.failYear; A.level.set(o.level, k * Y);
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet || q.lifetimeTax !== o.tax) bad++; }
    });
    if (bad) { console.error(`audit-couples: ${id} ${L}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    // the cost years' spending delivered (each cost year's target less its unmet spending), path by path
    if (costYears.length) paths.forEach((zs0, k) => {
      const st = E.freshState(ctx), zs = Float64Array.from(zs0), zPath = zs.length > Y ? zs[Y] : 0; let d = 0;
      for (let t = 0; t <= Math.max(...costYears); t++) { const row = E.stepYear(ctx, st, t, { z: zs[t], zPath }); if (costYears.includes(t) && row.targetSpend > 0) d += Math.max(0, row.targetSpend - Math.max(0, row.unmetDemand || 0)); }
      A.costDelivered[k] = d;
    });
    const eSecs = (Date.now() - e0) / 1000;
    console.log(`${''.padEnd(8)} run ${L}: engine ${surv(A).toFixed(4)} on ${n}; engine secs ${Math.round(eSecs)} (${(1000 * eSecs / n).toFixed(1)} ms a path)`);
    // the couples' rollout in the exact model beside the engine on the first BESIDE paths: a path one survives and the other does
    // not is a fidelity gap, reported
    let beside = null;
    if (cp) {
      const NB = Math.min(n, BESIDE), pb = new Uint8Array(NB); let engineOnly = 0, modelOnly = 0;
      const b0 = Date.now();
      paths.slice(0, NB).forEach((zs, k) => { pb[k] = runCouplePolicy(cp, Float64Array.from(zs)).survived ? 1 : 0; if (A.survived[k] && !pb[k]) engineOnly++; if (pb[k] && !A.survived[k]) modelOnly++; });
      beside = { N: NB, survived: b64(pb), engineOnly, modelOnly, secs: (Date.now() - b0) / 1000 };
      console.log(`${''.padEnd(8)} beside ${L}: the rollout in the model ${(100 * pb.reduce((x, y) => x + y, 0) / NB).toFixed(4)} on ${NB}; the engine alone ${engineOnly}, the model alone ${modelOnly}`);
    }
    writeFileSync(join(OUT, fileOf(id, arm, w)), gzipSync(JSON.stringify({ id, arm, w, cohort: h.cohort, target: ctx.targetSpend, inputs, stamp: STAMP, ran, seed: SEED_RUN, N: n, Y, costYears,
      solveSecs, engineSecs: eSecs, secs: (Date.now() - t0) / 1000, label: a.label, cpu: cpus()[0].model, beside,
      main: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) })));
    console.log(`${''.padEnd(8)} done ${L} secs ${Math.round((Date.now() - t0) / 1000)}`);
  });
}
