/*
 * THE SPENDING CURVE ON THE CANDIDATE (STATE.md D43, D44; the external review of 29 Oct, SPENDING-CURVE.md on
 * review/external-2026-10-21 at 37fdbf7: its curve/curve-audit2.mjs, without the spending-utility arms, in this project's
 * harness, audit-tiers.mjs). The review's eight households of Phase 4's panel, chosen by it before its runs: S030, S050,
 * S090 and S368 retired at the start; S188 working; S304F, S328F and S340F retiring at 52. Every solver arm solves the plan
 * arm A's policy routes (solverPlanOf, D37), at the estate weight 0.02, and each unit is executed by the engine on the same
 * paths:
 *   CAND    Phase 4's candidate (fcd8096217b7: candidate.json less failDelivered, PHASE4_OPTS) at 45 points;
 *   CANDD   the candidate (failDelivered on, D43) at 45 points;
 *   DIAL3   CANDD with three times the dislike of cuts (lambda x 3), nothing else changed (D44: the dial on the candidate's
 *           own lambda; the switch charge stays in survival points, as the currency does);
 *   DIAL10  the same at ten times.
 * Each unit records, per path, the survival, the spending delivered, the unmet spending, the estate, the end wealth, the year
 * it failed and each year's level (Phase 4's runPath, held to E.runTrial on the first CHECK paths); and runPolicy beside the
 * engine on the first BESIDE paths, which also records the pension and ISA's equity share the policy holds each year, the
 * tiers of the year's move weighted by the two pots entering it, over the paths not yet failed (the review's tier-read.mjs,
 * at full scale; its year n is the move of year index n - 1). Units go to results/curve-<seed>, stamped with the
 * code and this test's files.
 *   node research/solver/audit-curve.mjs <paths> part k/n [seed]     (seed 7002 unless given)
 *   node research/solver/audit-curve.mjs --units
 *   CURVE_ARMS=<arm>,<arm> the arms (all four unless set); CURVE_ONLY=<id>,<id> the households; CURVE_PTS the points (smoke only)
 * Seed REG_SEED runs only under its registration (registrations/fail-delivered.md, CAND and CANDD), launched through
 * run-from-snapshot.sh; the held-out seeds of the others are refused.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, CANDIDATE_HASH, CANDIDATE_OPTS, PHASE4_OPTS, PHASE4_HASH } from './candidate.mjs';
import { readPanel, appPlan, PANEL_FILE } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
// e3pcls guard: every arm solves through solveCandidate (the pin checked there)

const HERE = dirname(fileURLToPath(import.meta.url));
export const HOUSEHOLDS = ['S030', 'S050', 'S090', 'S368', 'S188', 'S304F', 'S328F', 'S340F'];
export const SEED = 7002, REG_SEED = 7019, REGISTRATION = 'fail-delivered.md', W = 0.02, CHECK = 200, BESIDE = 1000;
export const ARMS = ['CAND', 'CANDD', 'DIAL3', 'DIAL10'], DIAL = { DIAL3: 3, DIAL10: 10 };
export const HELD_OUT = [7003, 7011, 7012, 7013, 7014, 7018];
/* the files the stamp hashes, in this order */
export const STAMP_FILES = ['audit-curve.mjs', 'reduce-curve.mjs', 'audit-phase4.mjs', 'phase4-panel.mjs', 'select-phase4.mjs', 'candidate.mjs', 'candidate.json', 'phase4-panel.json'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'phase4-panel.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const unitsOf = (ids, arms = ARMS) => arms.flatMap(arm => ids.map(id => [id, arm]));
export const fileOf = (id, arm) => `${id}-${arm.toLowerCase()}.json.gz`;
/* each arm's settings: the base settings object and the caller's own on top */
export const armOf = arm => ({ base: arm === 'CAND' ? PHASE4_OPTS : CANDIDATE_OPTS, lambda: LAMBDA * (DIAL[arm] || 1) });
/* what each arm must have run */
export function armProblems(arm, r) {
  const P = [], fd = r.meta.failDelivered === true, lam = LAMBDA * (DIAL[arm] || 1);
  if ((arm === 'CAND') === fd) P.push(`failDelivered ${r.meta.failDelivered} on ${arm}`);
  if (Math.abs(r.lambda - lam) > 1e-15) P.push(`lambda ${r.lambda}, not ${lam}`);
  if (!r.meta.tierState || !(r.switchCharge > 0)) P.push(`no tier state (${r.meta.tierState}) or switch charge (${r.switchCharge})`);
  if (Math.abs(r.switchCharge - CANDIDATE_OPTS.switchCharge) > 1e-15) P.push(`switch charge ${r.switchCharge}, not the candidate's`);
  if (!r.levelOf.some(l => l > 1)) P.push('no raise on the menu');
  return P;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const byId = Object.fromEntries(readPanel().map(h => [h.id, h]));
  const ONLY = process.env.CURVE_ONLY ? new Set(process.env.CURVE_ONLY.split(',')) : null;
  const ARMS_RUN = process.env.CURVE_ARMS ? process.env.CURVE_ARMS.split(',') : ARMS;
  if (ARMS_RUN.some(a => !ARMS.includes(a))) { console.error(`audit-curve: no arm ${ARMS_RUN.filter(a => !ARMS.includes(a))}`); process.exit(2); }
  const UNITS = unitsOf(HOUSEHOLDS.filter(id => !ONLY || ONLY.has(id)), ARMS_RUN);
  if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
  const N = Number(process.argv[2]), part = process.argv[3] === 'part' ? process.argv[4] : '0/1', [pk, pn] = part.split('/').map(Number), SEED_RUN = Number(process.argv[5] || SEED);
  if (HELD_OUT.includes(SEED_RUN)) { console.error(`audit-curve: seed ${SEED_RUN} is held out for another test`); process.exit(2); }
  const REGISTERED = SEED_RUN === REG_SEED;
  if (REGISTERED && (basename(process.env.PREDICTION_FILE || '') !== REGISTRATION || ONLY || process.env.CURVE_PTS || ARMS_RUN.join() !== 'CAND,CANDD')) {
    console.error(`audit-curve: seed ${REG_SEED} runs only as registrations/${REGISTRATION} registers it (CAND and CANDD, every household, through run-from-snapshot.sh)`); process.exit(2);
  }
  if (PHASE4_HASH !== 'fcd8096217b7') { console.error(`audit-curve: Phase 4's candidate is ${PHASE4_HASH}, not fcd8096217b7`); process.exit(2); }
  if (!(N >= 1 && pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-curve: bad paths or part (${process.argv.slice(2, 5).join(' ')})`); process.exit(2); }
  const OUT = process.env.CURVE_OUT || join(HERE, 'results', `curve-${SEED_RUN}`);
  mkdirSync(OUT, { recursive: true });
  const STAMP = (() => { const cid = codeId(); return { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), candidate: CANDIDATE_HASH, prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version }; })();
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  console.log(`THE SPENDING CURVE ON THE CANDIDATE${REGISTERED ? ` (registered: ${REGISTRATION})` : ' (EXPLORATORY)'}: ${ARMS_RUN.join(', ')} at W${W}; seed ${SEED_RUN}, ${N} paths; ${UNITS.length} units; part ${part}`);

  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  UNITS.forEach(([id, arm], i) => {
    if (i % pn !== pk) return;
    const h = byId[id], t0 = Date.now();
    if (!h) { console.error(`audit-curve: ${id} is not in Phase 4's panel`); process.exit(2); }
    console.log(`${id.padEnd(8)} case | unit ${arm} | cohort ${h.cohort} target ${h.target} paths ${N}`);
    const a = armA(appPlan(h.plan), { tournament: false });
    if (a.label !== h.label) { console.error(`audit-curve: ${id}: arm A's pick ${a.label} differs from the landing's ${h.label}`); process.exit(3); }
    const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy })), A = armOf(arm);
    const r = solveCandidate(E, M, plan, { lambda: A.lambda, points: Number(process.env.CURVE_PTS) || CAND_PTS, bequestWeight: W }, A.base);
    const solveSecs = (Date.now() - t0) / 1000, bad = armProblems(arm, r);
    if (bad.length) { console.error(`audit-curve: ${id} ${arm}: ${bad.join('; ')}`); process.exit(3); }
    const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, Y = T + 1, inputs = inputsHash(ctx), self = ctx.owners.find(o => o.key === 'self');
    const retireT = Math.max(0, Math.min(Y, self.retireAge - ctx.ageSelf0)), accessT = Math.max(0, ctx.nmpa - ctx.ageSelf0);
    const levels = [...new Set(r.levelOf)].sort((x, y) => x - y);
    const ran = { arm, pts: r.g.np, actions: r.actions.length, levels, lambda: r.lambda, raiseWeight: r.meta.raiseWeight, failureShortfall: r.failureShortfall, failDelivered: r.meta.failDelivered === true,
      switchCharge: r.switchCharge, tierState: r.meta.tierState, bequestWeight: +Number(r.meta.bequestWeight).toPrecision(10), minPot: E.num(r.m.ctx.solvencyFloor, 0) };
    console.log(`${''.padEnd(8)} ran ${arm}: lambda ${ran.lambda} failDelivered ${ran.failDelivered} levels ${levels.join(',')} pts ${ran.pts} actions ${ran.actions} switchCharge ${ran.switchCharge} inputs ${inputs} retires at year ${retireT} | solve secs ${Math.round(solveSecs)}`);
    const paths = E.pathsForSeed(SEED_RUN, N, T), n = paths.length, e0 = Date.now();
    const main = { survived: new Uint8Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), estate: new Float32Array(n), wealth: new Float32Array(n), failYear: new Int16Array(n), level: new Uint8Array(n * Y) };
    let badCheck = 0;
    paths.forEach((zs0, k) => {
      const zs = Float64Array.from(zs0), o = runPath(ctx, zs);
      main.survived[k] = o.survived ? 1 : 0; main.delivered[k] = o.delivered; main.unmet[k] = o.unmet; main.estate[k] = o.estate; main.wealth[k] = o.wealth; main.failYear[k] = o.failYear; main.level.set(o.level, k * Y);
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet) badCheck++; }
    });
    if (badCheck) { console.error(`audit-curve: ${id} ${arm}: runPath differs from E.runTrial on ${badCheck} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const eSecs = (Date.now() - e0) / 1000, surv = 100 * main.survived.reduce((x, v) => x + v, 0) / n;
    console.log(`${''.padEnd(8)} run ${arm}: engine ${surv.toFixed(4)} on ${n}; engine secs ${Math.round(eSecs)} (${(1000 * eSecs / n).toFixed(1)} ms a path)`);
    // runPolicy beside the engine, and the pension and ISA's equity share the policy holds, by year, over the paths not yet failed
    const NB = Math.min(n, BESIDE), eq = new Float64Array(Y), eqN = new Float64Array(Y);
    let engineOnly = 0, policyOnly = 0;
    for (let k = 0; k < NB; k++) {
      // the tiers of the year's move (visit's `held` is what entered the year, before the move switches it)
      const o = runPolicy(r, Float64Array.from(paths[k]), { visit: (t, s, held, ai) => { const w = s[0] + s[1], mv = r.c.acts[ai]; if (w > 0) { eq[t] += (r.c.tiers.pen[mv.tierPen].equity * s[0] + r.c.tiers.isa[mv.tierIsa].equity * s[1]) / w; eqN[t]++; } } });
      const p = o.survived ? 1 : 0;
      if (main.survived[k] && !p) engineOnly++; if (p && !main.survived[k]) policyOnly++;
    }
    const equity = Array.from(eq, (x, t) => (eqN[t] ? +(x / eqN[t]).toFixed(6) : null));
    console.log(`${''.padEnd(8)} beside ${arm}: the engine alone ${engineOnly}, runPolicy alone ${policyOnly} of ${NB}; equity held at years 1, 5, 10, 20: ${[0, 4, 9, 19].map(t => (equity[t] === null ? '-' : `${Math.round(100 * equity[t])}%`)).join(', ')}`);
    writeFileSync(join(OUT, fileOf(id, arm)), gzipSync(JSON.stringify({ id, arm, cohort: h.cohort, target: ctx.targetSpend, inputs, retireT, accessT, ageSelf0: ctx.ageSelf0, stamp: STAMP, ran, seed: SEED_RUN, N: n, Y,
      solveSecs, engineSecs: eSecs, secs: (Date.now() - t0) / 1000, cpu: cpus()[0].model, beside: { N: NB, engineOnly, policyOnly }, equity, equityN: Array.from(eqN),
      main: Object.fromEntries(Object.entries(main).map(([k, v]) => [k, b64(v)])) })));
    console.log(`${''.padEnd(8)} done ${arm} secs ${Math.round((Date.now() - t0) / 1000)}`);
  });
}
