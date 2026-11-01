/*
 * THE DIAL'S FOUR POSITIONS IN BOTH VARIANTS (the launch plan's step L4, B3, D54; EXPLORATORY, seed 7002, 45 points, the
 * floor at 80% as Phase 4's panel lands it). On the review's eight households (audit-curve.mjs HOUSEHOLDS), at the estate
 * weight 0.02, each solver arm solving the plan arm A's policy routes (solverPlanOf, D37), every unit executed by the engine
 * on the same paths:
 *   CANDD          the candidate (position 1), its solve the base of every position;
 *   A3, A6, A10    B3a: lambda times the position, the age weights { mode 90, disp 9 }, the base's tiers locked (lockTiers on
 *                  CANDD's solve, the layer loop, CANDD's decision on the tier above);
 *   B3, B6, B10    B3b: the same without the age weights.
 * A unit is one household and one variant: 'A' solves CANDD, then A3, A6 and A10 on it; 'B' solves CANDD, then B3, B6 and
 * B10 (CANDD written by 'A' only). Each arm's file is audit-curve.mjs's (runPath held to E.runTrial on the first CHECK
 * paths; runPolicy beside the engine on the first BESIDE, with the equity the policy holds), so reduce-levers.mjs reads it
 * with reduce-curve.mjs's measures. Units go to results/levers-<seed>, stamped with the code and this test's files.
 *   node research/solver/audit-levers.mjs <paths> part k/n [seed]     (seed 7002 unless given)
 *   node research/solver/audit-levers.mjs --units
 *   LEVERS_ONLY=<id>,<id> the households; LEVERS_PTS the points (smoke only); LEVERS_OUT the folder
 * It decides nothing but what rules R1 and R2 (D52) read from it; held-out seeds are refused.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, CANDIDATE_HASH, CANDIDATE_OPTS } from './candidate.mjs';
import { readPanel, appPlan, PANEL_FILE } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } from './audit-phase4.mjs';
import { HOUSEHOLDS, HELD_OUT, fileOf } from './audit-curve.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// e3pcls guard: every arm solves through solveCandidate (the pin checked there)

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, W = 0.02, CHECK = 200, BESIDE = 1000, AW = Object.freeze({ mode: 90, disp: 9 });
export const POSITIONS = [3, 6, 10], GROUPS = { A: ['CANDD', 'A3', 'A6', 'A10'], B: ['B3', 'B6', 'B10'] };
export const ARMS = ['CANDD', 'A3', 'A6', 'A10', 'B3', 'B6', 'B10'];
/* an arm's position and variant */
export const armSpec = arm => (arm === 'CANDD' ? { pos: 1, variant: null } : { pos: Number(arm.slice(1)), variant: arm[0] === 'A' ? 'B3a' : 'B3b' });
export const STAMP_FILES = ['audit-levers.mjs', 'reduce-levers.mjs', 'audit-curve.mjs', 'reduce-curve.mjs', 'audit-phase4.mjs', 'phase4-panel.mjs', 'select-phase4.mjs', 'candidate.mjs', 'candidate.json', 'phase4-panel.json'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'phase4-panel.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const unitsOf = ids => ['A', 'B'].flatMap(g => ids.map(id => [id, g]));
const aboveOf = r => { const d = r.meta.riskAbove && r.meta.riskAbove.decision; if (typeof d !== 'string') throw new Error('the base records no decision on the tier above'); return d.startsWith('on'); };
/* what each arm must have run */
export function armProblems(arm, r, base) {
  const P = [], { pos, variant } = armSpec(arm);
  if (r.meta.failDelivered !== true) P.push(`failDelivered ${r.meta.failDelivered}`);
  if (Math.abs(r.lambda - LAMBDA * pos) > 1e-15) P.push(`lambda ${r.lambda}, not ${LAMBDA * pos}`);
  if (!r.meta.tierState) P.push('no tier state');
  if (pos === 1) { if (r.meta.lockTiers || r.meta.ageWeight) P.push('a lock or age weights on the base'); return P; }
  if (!r.meta.lockTiers || !r.lockTiers || r.lockTiers.rc !== base) P.push('not locked to the base');
  if (r.meta.tsOnce !== false) P.push(`tsOnce ${r.meta.tsOnce}`);
  if ((variant === 'B3a') !== (JSON.stringify(r.meta.ageWeight) === JSON.stringify(AW))) P.push(`ageWeight ${JSON.stringify(r.meta.ageWeight)} on ${variant}`);
  return P;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const byId = Object.fromEntries(readPanel().map(h => [h.id, h]));
  const ONLY = process.env.LEVERS_ONLY ? new Set(process.env.LEVERS_ONLY.split(',')) : null;
  const UNITS = unitsOf(HOUSEHOLDS.filter(id => !ONLY || ONLY.has(id)));
  if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
  const N = Number(process.argv[2]), part = process.argv[3] === 'part' ? process.argv[4] : '0/1', [pk, pn] = part.split('/').map(Number), SEED_RUN = Number(process.argv[5] || SEED);
  if (HELD_OUT.includes(SEED_RUN) || SEED_RUN === 7019) { console.error(`audit-levers: seed ${SEED_RUN} is held out for another test`); process.exit(2); }
  if (!(N >= 1 && pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-levers: bad paths or part (${process.argv.slice(2, 5).join(' ')})`); process.exit(2); }
  const OUT = process.env.LEVERS_OUT || join(HERE, 'results', `levers-${SEED_RUN}`), PTS = Number(process.env.LEVERS_PTS) || CAND_PTS;
  mkdirSync(OUT, { recursive: true });
  const STAMP = (() => { const cid = codeId(); return { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), candidate: CANDIDATE_HASH, prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version }; })();
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  console.log(`THE DIAL'S POSITIONS, BOTH VARIANTS (EXPLORATORY, L4): ${ARMS.join(', ')} at W${W}; seed ${SEED_RUN}, ${N} paths, ${PTS} points; ${UNITS.length} units; part ${part}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  UNITS.forEach(([id, group], i) => {
    if (i % pn !== pk) return;
    const h = byId[id];
    if (!h) { console.error(`audit-levers: ${id} is not in Phase 4's panel`); process.exit(2); }
    const a = armA(appPlan(h.plan), { tournament: false });
    if (a.label !== h.label) { console.error(`audit-levers: ${id}: arm A's pick ${a.label} differs from the landing's ${h.label}`); process.exit(3); }
    const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy }));
    const tb = Date.now(), base = solveCandidate(E, M, structuredClone(plan), { lambda: LAMBDA, points: PTS, bequestWeight: W }), baseSecs = (Date.now() - tb) / 1000;
    for (const arm of GROUPS[group]) {
      const t0 = Date.now(), { pos, variant } = armSpec(arm);
      console.log(`${id.padEnd(8)} case | unit ${arm} | cohort ${h.cohort} target ${h.target} paths ${N}`);
      const r = pos === 1 ? base : solveCandidate(E, M, structuredClone(plan), { lambda: LAMBDA * pos, points: PTS, bequestWeight: W, tsOnce: false, lockTiers: base, riskAbove: aboveOf(base), ...(variant === 'B3a' ? { ageWeight: AW } : {}) });
      const solveSecs = pos === 1 ? baseSecs : (Date.now() - t0) / 1000, bad = armProblems(arm, r, base);
      if (bad.length) { console.error(`audit-levers: ${id} ${arm}: ${bad.join('; ')}`); process.exit(3); }
      const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, Y = T + 1, inputs = inputsHash(ctx), self = ctx.owners.find(o => o.key === 'self');
      const retireT = Math.max(0, Math.min(Y, self.retireAge - ctx.ageSelf0)), accessT = Math.max(0, ctx.nmpa - ctx.ageSelf0);
      const levels = [...new Set(r.levelOf)].sort((x, y) => x - y);
      const ran = { arm, pos, variant, pts: r.g.np, actions: r.actions.length, levels, lambda: r.lambda, raiseWeight: r.meta.raiseWeight, failureShortfall: r.failureShortfall, failDelivered: r.meta.failDelivered === true,
        lockTiers: r.meta.lockTiers || null, ageWeight: r.meta.ageWeight || null, tsOnce: r.meta.tsOnce, switchCharge: r.switchCharge, tierState: r.meta.tierState, bequestWeight: +Number(r.meta.bequestWeight).toPrecision(10), minPot: E.num(r.m.ctx.solvencyFloor, 0) };
      console.log(`${''.padEnd(8)} ran ${arm}: lambda ${ran.lambda} variant ${variant || '-'} lock ${JSON.stringify(ran.lockTiers)} ageWeight ${JSON.stringify(ran.ageWeight)} levels ${levels.join(',')} pts ${ran.pts} actions ${ran.actions}`);
      const paths = E.pathsForSeed(SEED_RUN, N, T), n = paths.length, e0 = Date.now();
      const main = { survived: new Uint8Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), estate: new Float32Array(n), wealth: new Float32Array(n), failYear: new Int16Array(n), level: new Uint8Array(n * Y) };
      let badCheck = 0;
      paths.forEach((zs0, k) => {
        const zs = Float64Array.from(zs0), o = runPath(ctx, zs);
        main.survived[k] = o.survived ? 1 : 0; main.delivered[k] = o.delivered; main.unmet[k] = o.unmet; main.estate[k] = o.estate; main.wealth[k] = o.wealth; main.failYear[k] = o.failYear; main.level.set(o.level, k * Y);
        if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet) badCheck++; }
      });
      if (badCheck) { console.error(`audit-levers: ${id} ${arm}: runPath differs from E.runTrial on ${badCheck} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
      const eSecs = (Date.now() - e0) / 1000, surv = 100 * main.survived.reduce((x, v) => x + v, 0) / n;
      console.log(`${''.padEnd(8)} run ${arm}: engine ${surv.toFixed(4)} on ${n}; engine secs ${Math.round(eSecs)} (${(1000 * eSecs / n).toFixed(1)} ms a path)`);
      const NB = Math.min(n, BESIDE), eq = new Float64Array(Y), eqN = new Float64Array(Y);
      let engineOnly = 0, policyOnly = 0, offPair = 0;
      for (let k = 0; k < NB; k++) {
        const o = runPolicy(r, Float64Array.from(paths[k]), { visit: (t, s, held, ai) => { const w = s[0] + s[1], mv = r.c.acts[ai]; if (w > 0) { eq[t] += (r.c.tiers.pen[mv.tierPen].equity * s[0] + r.c.tiers.isa[mv.tierIsa].equity * s[1]) / w; eqN[t]++; } } });
        const p = o.survived ? 1 : 0;
        if (main.survived[k] && !p) engineOnly++; if (p && !main.survived[k]) policyOnly++;
      }
      const equity = Array.from(eq, (x, t) => (eqN[t] ? +(x / eqN[t]).toFixed(6) : null));
      console.log(`${''.padEnd(8)} beside ${arm}: the engine alone ${engineOnly}, runPolicy alone ${policyOnly} of ${NB}; equity held at years 1, 5, 10, 20: ${[0, 4, 9, 19].map(t => (equity[t] === null ? '-' : `${Math.round(100 * equity[t])}%`)).join(' / ')}${offPair ? `; ${offPair} off the base's pair` : ''}`);
      writeFileSync(join(OUT, fileOf(id, arm)), gzipSync(JSON.stringify({ id, arm, cohort: h.cohort, target: ctx.targetSpend, inputs, retireT, accessT, ageSelf0: ctx.ageSelf0, stamp: STAMP, ran, seed: SEED_RUN, N: n, Y,
        solveSecs, engineSecs: eSecs, secs: (Date.now() - t0) / 1000, cpu: cpus()[0].model, beside: { N: NB, engineOnly, policyOnly }, equity, equityN: Array.from(eqN),
        main: Object.fromEntries(Object.entries(main).map(([k, v]) => [k, b64(v)])) })));
      console.log(`${''.padEnd(8)} done ${arm} secs ${Math.round((Date.now() - t0) / 1000)}`);
    }
  });
}
