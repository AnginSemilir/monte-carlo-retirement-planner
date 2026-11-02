/*
 * L5: ONE-OFF COSTS ON SINGLE HOUSEHOLDS (the launch plan's step L5, F3; the archive's M12 probe; EXPLORATORY, seed 7002).
 * No single household has ever been tested with a one-off cost (Phase 4's 40 and the library's 210 have none), and a large
 * cost can push a year's pension draw through a band. On the review's eight households (audit-curve.mjs HOUSEHOLDS), each
 * given one cost of 10% or of 30% of its opening wealth (every account's balance) in its third or its tenth retired year
 * (t = the retirement year + 2 or + 9; 32 cells), two arms on the same paths, scored by the engine:
 *   APP    arm A as D36 set it: the app's withdrawal-policy search on the plan with its cost (no tournament), guardrails on,
 *          the lookahead at 5 years as the app ships it, raises capped at 110% (phase4-panel.mjs appPlan);
 *   CANDD  the candidate at position 1 (candidate.json, 45 points, the estate weight 0.02, the floor at 80%), solving the plan
 *          arm A's policy routes (solverPlanOf, D37), the cost in it and the lookahead off (a table is the spending rule).
 * A unit is one household and one cell (both arms): per path, survival (Phase 4's rule: runPath, held to E.runTrial on the
 * first CHECK paths), the spending delivered and the tax paid in the cost year. Units go to results/costs-<seed>, stamped
 * with the code and this test's files; reduce-costs.mjs reads them by D52's R3.
 *   node research/solver/audit-costs.mjs <paths> part k/n [seed]     (seed 7002 unless given)
 *   node research/solver/audit-costs.mjs --units
 *   COSTS_ONLY=<id>,<id> the households; COSTS_PTS the points (smoke only); COSTS_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, CANDIDATE_HASH } from './candidate.mjs';
import { readPanel, appPlan, PANEL_FILE } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } from './audit-phase4.mjs';
import { HOUSEHOLDS, HELD_OUT } from './audit-curve.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// e3pcls guard: CANDD solves through solveCandidate (the pin checked there)

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, W = 0.02, CHECK = 100;
export const CELLS = [[0.10, 3], [0.10, 10], [0.30, 3], [0.30, 10]];
export const cellName = ([share, yr]) => `c${Math.round(100 * share)}y${yr}`;
export const STAMP_FILES = ['audit-costs.mjs', 'reduce-costs.mjs', 'audit-curve.mjs', 'audit-phase4.mjs', 'phase4-panel.mjs', 'select-phase4.mjs', 'candidate.mjs', 'candidate.json', 'phase4-panel.json'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'phase4-panel.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const unitsOf = ids => ids.flatMap(id => CELLS.map(c => [id, c]));
export const fileOf = (id, cell) => `${id}-${cellName(cell)}.json.gz`;
/* the household's plan with its one cost: share of the opening wealth, in the retired year given (1 = the first) */
export function withCost(plan, [share, yr]) {
  const np = E.normalizePlan(plan), ctx = E.buildContext(E.resolveMpaa(np)), self = ctx.owners.find(o => o.key === 'self');
  const retireT = Math.max(0, self.retireAge - ctx.ageSelf0), t = retireT + yr - 1;
  const wealth = (np.accounts || []).reduce((s, a) => s + Math.max(0, E.num(a.balance, 0)), 0), amount = Math.round(share * wealth);
  if (t > ctx.totalYears) throw new Error(`the cost's year ${t} is past the plan's horizon ${ctx.totalYears}`);
  return { plan: { ...plan, oneOffCosts: [...(plan.oneOffCosts || []), { id: `l5_${cellName([share, yr])}`, year: ctx.baseYear + t, owner: 'Myself', amount, desc: `L5: ${Math.round(100 * share)}% of the opening wealth in retired year ${yr}` }] }, t, amount, wealth };
}
/* Phase 4's runPath, with the tax paid in year tc beside it */
function runWithTax(ctx, zs, tc) {
  const state = E.freshState(ctx), T = ctx.totalYears, zPath = zs.length > T + 1 ? zs[T + 1] : 0;
  let taxAt = 0;
  for (let t = 0; t <= T; t++) { const row = E.stepYear(ctx, state, t, { z: zs[t], zPath }); if (t === tc) taxAt = row.taxPaid + (row.cgtPaid || 0); }
  return { taxAt, ...runPath(ctx, zs, false) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const byId = Object.fromEntries(readPanel().map(h => [h.id, h]));
  const ONLY = process.env.COSTS_ONLY ? new Set(process.env.COSTS_ONLY.split(',')) : null;
  const UNITS = unitsOf(HOUSEHOLDS.filter(id => !ONLY || ONLY.has(id)));
  if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
  const N = Number(process.argv[2]), part = process.argv[3] === 'part' ? process.argv[4] : '0/1', [pk, pn] = part.split('/').map(Number), SEED_RUN = Number(process.argv[5] || SEED);
  if (HELD_OUT.includes(SEED_RUN) || SEED_RUN === 7019) { console.error(`audit-costs: seed ${SEED_RUN} is held out for another test`); process.exit(2); }
  if (!(N >= 1 && pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-costs: bad paths or part (${process.argv.slice(2, 5).join(' ')})`); process.exit(2); }
  const OUT = process.env.COSTS_OUT || join(HERE, 'results', `costs-${SEED_RUN}`), PTS = Number(process.env.COSTS_PTS) || CAND_PTS;
  mkdirSync(OUT, { recursive: true });
  const STAMP = (() => { const cid = codeId(); return { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), candidate: CANDIDATE_HASH, prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version }; })();
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  console.log(`L5, ONE-OFF COSTS ON SINGLES (EXPLORATORY): APP and CANDD; seed ${SEED_RUN}, ${N} paths, ${PTS} points; ${UNITS.length} units; part ${part}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  UNITS.forEach(([id, cell], i) => {
    if (i % pn !== pk) return;
    const h = byId[id], t0 = Date.now();
    if (!h) { console.error(`audit-costs: ${id} is not in Phase 4's panel`); process.exit(2); }
    const { plan: costed, t: tc, amount, wealth } = withCost(h.plan, cell);
    console.log(`${id.padEnd(8)} case | unit ${cellName(cell)} | cost £${amount} (of £${wealth}) in year ${tc} | paths ${N}`);
    const a = armA(appPlan(costed), { tournament: false });
    const ctxA = E.buildContext(E.resolveMpaa(a.planState));
    if (!ctxA.guardrails || ctxA.lookaheadYears !== 5 || (ctxA.oneOffCosts.get(ctxA.baseYear + tc) || 0) < amount) { console.error(`audit-costs: ${id} APP: guardrails ${ctxA.guardrails}, lookahead ${ctxA.lookaheadYears}, the cost not in year ${tc}`); process.exit(3); }
    const r = solveCandidate(E, M, structuredClone(prep(solverPlanOf(costed, { decumulationPolicy: a.planState.spending.decumulationPolicy }))), { lambda: LAMBDA, points: PTS, bequestWeight: W });
    const ctxC = E.buildContext(withTable(r.m.ctx.plan, r));
    if (r.meta.failDelivered !== true || !r.meta.tierState || (ctxC.oneOffCosts.get(ctxC.baseYear + tc) || 0) < amount || ctxC.lookaheadYears !== 0) { console.error(`audit-costs: ${id} CANDD: not the candidate, or the cost not in year ${tc}`); process.exit(3); }
    const solveSecs = (Date.now() - t0) / 1000, T = ctxC.totalYears, paths = E.pathsForSeed(SEED_RUN, N, T), n = paths.length;
    const arms = {};
    for (const [arm, ctx] of [['APP', ctxA], ['CANDD', ctxC]]) {
      const main = { survived: new Uint8Array(n), delivered: new Float32Array(n), taxAt: new Float32Array(n), unmet: new Float32Array(n) };
      let bad = 0;
      paths.forEach((zs0, k) => {
        const zs = Float64Array.from(zs0), o = runWithTax(ctx, zs, tc);
        main.survived[k] = o.survived ? 1 : 0; main.delivered[k] = o.delivered; main.taxAt[k] = o.taxAt; main.unmet[k] = o.unmet;
        if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.unmetTotal !== o.unmet) bad++; }
      });
      if (bad) { console.error(`audit-costs: ${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${CHECK} paths`); process.exit(3); }
      const surv = 100 * main.survived.reduce((x, v) => x + v, 0) / n, tax = main.taxAt.reduce((x, v) => x + v, 0) / n;
      console.log(`${''.padEnd(8)} run ${arm}: engine ${surv.toFixed(4)} on ${n}; the cost year's tax £${Math.round(tax)} a path`);
      arms[arm] = { inputs: inputsHash(ctx), main: Object.fromEntries(Object.entries(main).map(([k, v]) => [k, b64(v)])) };
    }
    writeFileSync(join(OUT, fileOf(id, cell)), gzipSync(JSON.stringify({ id, cell: cellName(cell), share: cell[0], retiredYear: cell[1], t: tc, amount, wealth, label: a.label, stamp: STAMP, seed: SEED_RUN, N: n,
      ran: { pts: r.g.np, lambda: r.lambda, failDelivered: true, levels: [...new Set(r.levelOf)].sort((x, y) => x - y), bequestWeight: +Number(r.meta.bequestWeight).toPrecision(10) }, solveSecs, secs: (Date.now() - t0) / 1000, cpu: cpus()[0].model, arms })));
    console.log(`${''.padEnd(8)} done ${cellName(cell)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  });
}
