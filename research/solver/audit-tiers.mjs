/*
 * THE TIER TEST (STATE.md D39; the deep review after Phase 4, section 6; EXPLORATORY, seed 7002). How much of the solvers'
 * gain over the app's rules comes from moving the pension and ISA down in risk, and what a user who declines that gets.
 * Phase 4's 40 households (phase4-panel.json: the plans, the landed targets, the minimum pot, arm A's pick), at the estate
 * weight 0.02, five arms per household, each executed by the engine on the same paths:
 *   APP      arm A, the app's rules, as Phase 4 ran it (no tournament);
 *   SHIP     the product's settings at 30 points, consent to change risk given (Phase 4's SHIP);
 *   SHIPNC   the same with consent withdrawn (`riskConsent: false`: the plan's own tiers, no tier move);
 *   CAND     the candidate (fcd8096217b7) at 45 points, consent given (Phase 4's CAND);
 *   CANDNC   the same with consent withdrawn (D39: one tier pair, so no tier state and no switch charge).
 * Every solver arm solves the plan arm A's policy routes (solverPlanOf, D37). Each unit runs N paths of the seed with
 * Phase 4's runPath (every path's survival, spending delivered, unmet spending, estate, the year it failed and each year's
 * spend as a share of target), held to E.runTrial on the first CHECK paths, and runPolicy beside the engine on the first
 * BESIDE paths of each solver arm. Each unit records its engine context's inputs hash (a household's five units on one), its
 * settings and the year the household retires. Units go to results/tiers, stamped with the code and this test's files.
 *   node research/solver/audit-tiers.mjs <paths> part k/n [seed]     (seed 7002 unless given; 7003, 7014 and 7018 refused)
 *   node research/solver/audit-tiers.mjs --units
 *   TT_ONLY=<id>,<id> and TT_ARMS=<arm>,<arm> limit the households and arms; TT_PTS the solves' points (smoke tests only)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, candidatePlan, CANDIDATE_HASH } from './candidate.mjs';
import { readPanel, appPlan, PANEL_FILE } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS, SHIP_PTS, CANDIDATE } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// e3pcls guard: CAND and CANDNC solve through solveCandidate (the pin checked there); solvePlan here is SHIP's and SHIPNC's

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, W = 0.02, CHECK = 200, BESIDE = 1000, ARMS = ['CAND', 'CANDNC', 'SHIP', 'SHIPNC', 'APP'];
export const HELD_OUT = [7003, 7014, 7018];
/* the files the stamp hashes, in this order (batch-tiers.sh's AUDIT hashes the same list) */
export const STAMP_FILES = ['audit-tiers.mjs', 'reduce-tiers.mjs', 'audit-phase4.mjs', 'phase4-panel.mjs', 'select-phase4.mjs', 'candidate.mjs', 'phase4-panel.json'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'phase4-panel.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
/* the units, the longest first */
export const unitsOf = ids => ARMS.flatMap(arm => ids.map(id => [id, arm]));
export const fileOf = (id, arm) => `${id}-${arm.toLowerCase()}.json.gz`;
/* what each arm must have run: the tier menu and the tier state as the arm asks */
export function armProblems(arm, r) {
  const tierMoves = r.actions.some(a => (a.tierPen || 0) || (a.tierIsa || 0)), P = [];
  if (arm === 'CAND' && (!r.meta.tierState || !tierMoves || !(r.switchCharge > 0))) P.push(`CAND without its tier state (${r.meta.tierState}), tier moves (${tierMoves}) or switch charge (${r.switchCharge})`);
  if (arm === 'CANDNC' && (tierMoves || r.meta.tierState || !r.meta.tierStateOff)) P.push(`CANDNC with tier moves (${tierMoves}) or a tier state (${r.meta.tierState}; off: ${r.meta.tierStateOff})`);
  if (arm === 'SHIP' && (!tierMoves || r.meta.tierState)) P.push(`SHIP without tier moves (${tierMoves}) or with a tier state (${r.meta.tierState})`);
  if (arm === 'SHIPNC' && tierMoves) P.push('SHIPNC with tier moves');
  return P;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const PANEL = readPanel(), byId = Object.fromEntries(PANEL.map(h => [h.id, h]));
  const ONLY = process.env.TT_ONLY ? new Set(process.env.TT_ONLY.split(',')) : null, ONLY_ARMS = process.env.TT_ARMS ? new Set(process.env.TT_ARMS.split(',')) : null;
  const UNITS = unitsOf(PANEL.map(h => h.id)).filter(([id, arm]) => (!ONLY || ONLY.has(id)) && (!ONLY_ARMS || ONLY_ARMS.has(arm)));
  if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
  const N = Number(process.argv[2]), part = process.argv[3] === 'part' ? process.argv[4] : '0/1', [pk, pn] = part.split('/').map(Number), SEED_RUN = Number(process.argv[5] || SEED);
  if (HELD_OUT.includes(SEED_RUN)) { console.error(`audit-tiers: seed ${SEED_RUN} is held out (7003 and 7018 Phase 4's, 7014 7u-F's)`); process.exit(2); }
  if (!(N >= 1 && pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-tiers: bad paths or part (${process.argv.slice(2, 5).join(' ')})`); process.exit(2); }
  if (CANDIDATE_HASH !== CANDIDATE) { console.error(`audit-tiers: the candidate is ${CANDIDATE_HASH}, not ${CANDIDATE}`); process.exit(2); }
  const OUT = process.env.TT_OUT || join(HERE, 'results', 'tiers');
  mkdirSync(OUT, { recursive: true });
  const STAMP = (() => { const cid = codeId(); return { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), candidate: CANDIDATE_HASH, prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version }; })();
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  console.log(`THE TIER TEST (EXPLORATORY): ${ARMS.join(', ')} at W${W}; seed ${SEED_RUN}, ${N} paths; ${UNITS.length} units; part ${part}`);

  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  function runAll(ctx, paths, Y, label) {
    const n = paths.length, A = { survived: new Uint8Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), estate: new Float32Array(n), failYear: new Int16Array(n), level: new Uint8Array(n * Y) };
    let bad = 0;
    paths.forEach((zs0, k) => {
      const zs = Float64Array.from(zs0), o = runPath(ctx, zs);
      A.survived[k] = o.survived ? 1 : 0; A.delivered[k] = o.delivered; A.unmet[k] = o.unmet; A.estate[k] = o.estate; A.failYear[k] = o.failYear; A.level.set(o.level, k * Y);
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet) bad++; }
    });
    if (bad) { console.error(`audit-tiers: ${label}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    return A;
  }
  const surv = A => 100 * A.survived.reduce((a, x) => a + x, 0) / A.survived.length;

  UNITS.forEach(([id, arm], i) => {
    if (i % pn !== pk) return;
    const h = byId[id], base = h.plan, t0 = Date.now();
    console.log(`${id.padEnd(8)} case | unit ${arm} | cohort ${h.cohort} target ${h.target} paths ${N}`);
    const a = armA(appPlan(base), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy };
    if (a.label !== h.label) { console.error(`audit-tiers: ${id}: arm A's pick ${a.label} differs from the landing's ${h.label}`); process.exit(3); }
    let ctx, r = null, solveSecs = 0, ran;
    if (arm === 'APP') {
      ctx = E.buildContext(E.resolveMpaa(a.planState));
      ran = `arm A ${a.label.replace(/ /g, '_')} guardrails ${!!ctx.guardrails} minPot ${ctx.solvencyFloor}`;
    } else {
      const plan = prep(solverPlanOf(base, aPol)), cand = arm.startsWith('CAND');
      const opts = { lambda: LAMBDA, points: Number(process.env.TT_PTS) || (cand ? CAND_PTS : SHIP_PTS), bequestWeight: W, ...(arm.endsWith('NC') ? { riskConsent: false } : {}) };
      r = cand ? solveCandidate(E, M, plan, opts) : solvePlan(E, M, candidatePlan(E, plan), opts);
      solveSecs = (Date.now() - t0) / 1000;
      const bad = armProblems(arm, r);
      if (bad.length) { console.error(`audit-tiers: ${id} ${arm}: ${bad.join('; ')}`); process.exit(3); }
      ctx = E.buildContext(withTable(r.m.ctx.plan, r));
      ran = `pts ${r.g.np} actions ${r.actions.length} tierState ${r.meta.tierState} tierStateOff ${r.meta.tierStateOff ? 'yes' : 'no'} switchCharge ${r.switchCharge || 0} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} minPot ${E.num(r.m.ctx.solvencyFloor, 0)}`;
    }
    const T = ctx.totalYears, Y = T + 1, inputs = inputsHash(ctx), self = ctx.owners.find(o => o.key === 'self');
    const retireT = Math.max(0, Math.min(Y, self.retireAge - ctx.ageSelf0));
    console.log(`${''.padEnd(8)} ran ${arm}: ${ran} inputs ${inputs} retires at year ${retireT}${solveSecs ? ` | solve secs ${Math.round(solveSecs)}` : ''}`);
    const e0 = Date.now(), main = runAll(ctx, E.pathsForSeed(SEED_RUN, N, T), Y, `${id} ${arm}`), eSecs = (Date.now() - e0) / 1000;
    console.log(`${''.padEnd(8)} run ${arm}: engine ${surv(main).toFixed(4)} on ${N}; engine secs ${Math.round(eSecs)} (${(1000 * eSecs / N).toFixed(1)} ms a path)`);
    let beside = null;
    if (r) {
      const NB = Math.min(N, BESIDE), bp = E.pathsForSeed(SEED_RUN, NB, T);
      let engineOnly = 0, policyOnly = 0;
      bp.forEach((zs, k) => { const p = runPolicy(r, Float64Array.from(zs)).survived ? 1 : 0; if (main.survived[k] && !p) engineOnly++; if (p && !main.survived[k]) policyOnly++; });
      beside = { N: NB, engineOnly, policyOnly };
      console.log(`${''.padEnd(8)} beside ${arm}: the engine alone ${engineOnly}, runPolicy alone ${policyOnly} of ${NB}`);
    }
    writeFileSync(join(OUT, fileOf(id, arm)), gzipSync(JSON.stringify({ id, arm, cohort: h.cohort, target: ctx.targetSpend, inputs, retireT, stamp: STAMP, ran, seed: SEED_RUN, N, Y,
      solveSecs, engineSecs: eSecs, secs: (Date.now() - t0) / 1000, cpu: cpus()[0].model, beside, main: Object.fromEntries(Object.entries(main).map(([k, v]) => [k, b64(v)])) })));
    console.log(`${''.padEnd(8)} done ${arm} secs ${Math.round((Date.now() - t0) / 1000)}`);
  });
}
