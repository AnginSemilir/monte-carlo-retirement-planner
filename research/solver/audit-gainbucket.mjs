/*
 * GAIN-BUCKET (the research queue's first, B7 in D51; D49; HARVEST-SIZING.md; EXPLORATORY, seed 7002, deciding nothing). Does
 * reading the taxable account's gain share at its nearest bucket (5, 25, 55%) cost the candidate survival or spending? On
 * Phase 4's households whose taxable account is 10% of wealth or more (`gainHouseholds`), at the estate weight 0.02, 45
 * points, the floor at 80% as the panel lands it, each solving the plan arm A's policy routes (solverPlanOf, D37), every arm
 * executed by the engine on the same paths:
 *   CANDD   the candidate (d71f65ae871e);
 *   CANDGI  the same with the gain axis interpolated (`gainInterp: true`), the one difference (the fair-test gate's row 17).
 * A unit is one household, both arms. Per path: survival, the spending delivered and unmet (Phase 4's rule: runGain is its
 * runPath with the taxable account read each year, held to runPath and E.runTrial on the first CHECK paths); on the taxable
 * account, the times its gain share crosses a bucket's edge (the nearest-node read of 0.05, 0.25, 0.55 changes at 0.15 and
 * 0.40), the years it re-wraps (the engine's `harvested`) and the years it realises a gain; runPolicy beside the engine on
 * the first BESIDE paths; each arm's solve time. Units go to results/gainbucket-<seed>, stamped with the code and this
 * test's files; reduce-gainbucket.mjs reads them.
 *   node research/solver/audit-gainbucket.mjs <paths> part k/n [seed]     (seed 7002 unless given)
 *   node research/solver/audit-gainbucket.mjs --units | --households
 *   GB_ONLY=<id>,<id> the households; GB_PTS the points (smoke only); GB_OUT the folder
 * It decides nothing (B7: a gain opens a v2 test after the launch; a harm to the launch candidate goes to the maintainer);
 * held-out seeds are refused.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, CANDIDATE_HASH } from './candidate.mjs';
import { readPanel, appPlan, PANEL_FILE } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } from './audit-phase4.mjs';
import { HELD_OUT } from './audit-curve.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// e3pcls guard: both arms solve through solveCandidate (the pin checked there)

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, W = 0.02, CHECK = 100, BESIDE = 1000, SHARE_MIN = 0.095;
export const ARMS = ['CANDD', 'CANDGI'];
export const EDGES = [0.15, 0.40];   // the nearest-node read of the gain axis [0.05, 0.25, 0.55] changes here
export const bucketOf = f => (f < EDGES[0] ? 0 : f < EDGES[1] ? 1 : 2);
export const STAMP_FILES = ['audit-gainbucket.mjs', 'reduce-gainbucket.mjs', 'audit-phase4.mjs', 'phase4-panel.mjs', 'select-phase4.mjs', 'candidate.mjs', 'candidate.json', 'phase4-panel.json'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'phase4-panel.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
/* the taxable account's share of the household's opening wealth (every account's balance) */
export function taxableShare(plan) {
  const ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(plan)));
  const all = ctx.accounts.reduce((s, a) => s + Math.max(0, a.balance), 0), gia = ctx.accounts.filter(a => a.cat === 'other').reduce((s, a) => s + Math.max(0, a.balance), 0);
  return all > 0 ? gia / all : 0;
}
/* Phase 4's households whose taxable account is 10% of wealth or more (B7), in the panel's order */
export const gainHouseholds = panel => panel.filter(h => taxableShare(h.plan) >= SHARE_MIN).map(h => h.id);
export const fileOf = id => `${id}.json.gz`;

/* Phase 4's runPath, with the taxable account read at the end of each year: its gain share's bucket, a re-wrap, a gain realised */
export function runGain(ctx, zs) {
  const state = E.freshState(ctx), T = ctx.totalYears, Y = T + 1, zPath = zs.length > Y ? zs[Y] : 0;
  let failed = false, failYear = -1, unmet = 0, delivered = 0, last = null, prev = -1, cross = 0, rewrap = 0, dispose = 0, giaYears = 0;
  for (let t = 0; t <= T; t++) {
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    const u = Math.max(0, row.unmetDemand || 0); unmet += u;
    if (row.targetSpend > 0) delivered += Math.max(0, row.targetSpend - u);
    if (!failed && (row.unmetDemand > E.FAIL_TOLERANCE || row.preNmpaInsolvent)) { failed = true; failYear = t; }
    if (row.harvested > 0) rewrap++;
    if (row.realisedGains > 0) dispose++;
    const gia = ctx.owners.reduce((s, o) => s + (state.pots[o.ids.other] || 0), 0), basis = ctx.owners.reduce((s, o) => s + (state.giaBasis[o.key] || 0), 0);
    if (gia > 1) { const b = bucketOf(Math.max(0, Math.min(1, (gia - basis) / gia))); if (prev >= 0 && b !== prev) cross++; prev = b; giaYears++; } else prev = -1;
    last = row;
  }
  const wealth = Math.max(0, last.totalCombined);
  if (!failed && ctx.solvencyFloor > 0 && wealth < ctx.solvencyFloor) { failed = true; failYear = T; }
  return { survived: !failed, failYear, unmet, delivered, cross, rewrap, dispose, giaYears };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const panel = readPanel(), byId = Object.fromEntries(panel.map(h => [h.id, h]));
  const ONLY = process.env.GB_ONLY ? new Set(process.env.GB_ONLY.split(',')) : null;
  const UNITS = gainHouseholds(panel).filter(id => !ONLY || ONLY.has(id));
  if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
  if (process.argv[2] === '--households') { panel.forEach(h => console.log(`${h.id} ${(100 * taxableShare(h.plan)).toFixed(1)}%${UNITS.includes(h.id) ? ' in' : ''}`)); process.exit(0); }
  const N = Number(process.argv[2]), part = process.argv[3] === 'part' ? process.argv[4] : '0/1', [pk, pn] = part.split('/').map(Number), SEED_RUN = Number(process.argv[5] || SEED);
  if (HELD_OUT.includes(SEED_RUN) || SEED_RUN === 7019) { console.error(`audit-gainbucket: seed ${SEED_RUN} is held out for another test`); process.exit(2); }
  if (!(N >= 1 && pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-gainbucket: bad paths or part (${process.argv.slice(2, 5).join(' ')})`); process.exit(2); }
  const OUT = process.env.GB_OUT || join(HERE, 'results', `gainbucket-${SEED_RUN}`), PTS = Number(process.env.GB_PTS) || CAND_PTS;
  mkdirSync(OUT, { recursive: true });
  const STAMP = (() => { const cid = codeId(); return { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), candidate: CANDIDATE_HASH, prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version }; })();
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  console.log(`GAIN-BUCKET (EXPLORATORY): ${ARMS.join(', ')} at W${W}; seed ${SEED_RUN}, ${N} paths, ${PTS} points; ${UNITS.length} units; part ${part}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  UNITS.forEach((id, i) => {
    if (i % pn !== pk) return;
    const h = byId[id], t00 = Date.now();
    const a = armA(appPlan(h.plan), { tournament: false });
    if (a.label !== h.label) { console.error(`audit-gainbucket: ${id}: arm A's pick ${a.label} differs from the landing's ${h.label}`); process.exit(3); }
    const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy })), arms = {};
    for (const arm of ARMS) {
      const t0 = Date.now(), gi = arm === 'CANDGI';
      console.log(`${id.padEnd(8)} case | unit ${arm} | cohort ${h.cohort} target ${h.target} taxable ${(100 * taxableShare(h.plan)).toFixed(1)}% paths ${N}`);
      const r = solveCandidate(E, M, structuredClone(plan), { lambda: LAMBDA, points: PTS, bequestWeight: W, ...(gi ? { gainInterp: true } : {}) });
      const solveSecs = (Date.now() - t0) / 1000;
      if (!!r.g.gainInterp !== gi || r.meta.failDelivered !== true || !r.meta.tierState) { console.error(`audit-gainbucket: ${id} ${arm}: gainInterp ${r.g.gainInterp}, failDelivered ${r.meta.failDelivered}, tierState ${r.meta.tierState}`); process.exit(3); }
      const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, inputs = inputsHash(ctx);
      const ran = { arm, gainInterp: !!r.g.gainInterp, pts: r.g.np, actions: r.actions.length, levels: [...new Set(r.levelOf)].sort((x, y) => x - y), lambda: r.lambda, raiseWeight: r.meta.raiseWeight,
        failDelivered: true, tierState: r.meta.tierState, switchCharge: r.switchCharge, bequestWeight: +Number(r.meta.bequestWeight).toPrecision(10), minPot: E.num(r.m.ctx.solvencyFloor, 0) };
      const paths = E.pathsForSeed(SEED_RUN, N, T), n = paths.length, e0 = Date.now();
      const main = { survived: new Uint8Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), failYear: new Int16Array(n), cross: new Uint8Array(n), rewrap: new Uint8Array(n), dispose: new Uint8Array(n), giaYears: new Uint8Array(n) };
      let badCheck = 0;
      paths.forEach((zs0, k) => {
        const zs = Float64Array.from(zs0), o = runGain(ctx, zs);
        main.survived[k] = o.survived ? 1 : 0; main.delivered[k] = o.delivered; main.unmet[k] = o.unmet; main.failYear[k] = o.failYear;
        main.cross[k] = Math.min(255, o.cross); main.rewrap[k] = Math.min(255, o.rewrap); main.dispose[k] = Math.min(255, o.dispose); main.giaYears[k] = Math.min(255, o.giaYears);
        if (k < CHECK) { const p = runPath(ctx, zs, false), q = E.runTrial(ctx, zs); if (p.survived !== o.survived || p.delivered !== o.delivered || p.unmet !== o.unmet || q.survived !== o.survived || q.unmetTotal !== o.unmet) badCheck++; }
      });
      if (badCheck) { console.error(`audit-gainbucket: ${id} ${arm}: runGain differs from runPath or E.runTrial on ${badCheck} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
      const engineSecs = (Date.now() - e0) / 1000, surv = 100 * main.survived.reduce((x, v) => x + v, 0) / n;
      let engineOnly = 0, policyOnly = 0;
      const NB = Math.min(n, BESIDE);
      for (let k = 0; k < NB; k++) { const p = runPolicy(r, Float64Array.from(paths[k])).survived ? 1 : 0; if (main.survived[k] && !p) engineOnly++; if (p && !main.survived[k]) policyOnly++; }
      const crossPaths = main.cross.reduce((x, v) => x + (v > 0 ? 1 : 0), 0);
      console.log(`${''.padEnd(8)} run ${arm}: engine ${surv.toFixed(4)} on ${n}; solve ${Math.round(solveSecs)} s, engine ${Math.round(engineSecs)} s; a bucket's edge crossed on ${crossPaths} paths; beside: the engine alone ${engineOnly}, runPolicy alone ${policyOnly} of ${NB}`);
      arms[arm] = { inputs, ran, solveSecs, engineSecs, beside: { N: NB, engineOnly, policyOnly }, main: Object.fromEntries(Object.entries(main).map(([k, v]) => [k, b64(v)])) };
      console.log(`${''.padEnd(8)} done ${arm} secs ${Math.round((Date.now() - t0) / 1000)}`);
    }
    writeFileSync(join(OUT, fileOf(id)), gzipSync(JSON.stringify({ id, cohort: h.cohort, target: h.target, taxable: taxableShare(h.plan), stamp: STAMP, seed: SEED_RUN, N: Number(process.argv[2]), secs: (Date.now() - t00) / 1000, cpu: cpus()[0].model, arms })));
  });
}
