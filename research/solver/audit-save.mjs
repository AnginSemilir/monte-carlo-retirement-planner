/*
 * THE SAVINGS SPLIT ON THE CANDIDATE (STATE.md D38 (4); research/solver/SAVINGS-SPLIT.md; AFTER-PHASE4.md section 3), EXPLORATORY.
 * Phase 4's households still working with pension or ISA contributions (each working year with a choice), each solving the
 * plan arm A's policy routes (solverPlanOf, D37), at the estate weight 0.02 and 45 points, each unit executed by the engine on
 * the same paths:
 *   CANDD   the candidate (candidate.json, d71f65ae871e);
 *   CANDS   the same with the savings split (`saveSplit: true`): each working year's move also chooses where the plan's
 *           pension and ISA saving goes at its net cost (the plan's own; the pension first; the ISA first).
 * Each unit records, per path, the survival, the spending delivered, the unmet spending, the estate, the end wealth, the year
 * it failed and each year's level (Phase 4's runPath, held to E.runTrial on the first CHECK paths); and runPolicy beside the
 * engine on the first BESIDE paths, which also records the save the policy chose in each working year and the pension, ISA
 * and taxable pots at the top of the first retired year. Units go to results/save-<seed>, stamped with the code and this
 * test's files.
 *   node research/solver/audit-save.mjs <paths> part k/n [seed]     (seed 7002 unless given)
 *   node research/solver/audit-save.mjs --units
 *   SAVE_ARMS=<arm>,<arm> the arms (both unless set); SAVE_ONLY=<id>,<id> the households; SAVE_PTS the points (smoke)
 * The held-out seeds are refused: this test is exploratory.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, CANDIDATE_HASH, CANDIDATE_OPTS } from './candidate.mjs';
import { readPanel, appPlan, PANEL_FILE } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// e3pcls guard: every arm solves through solveCandidate (the pin checked there)

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, W = 0.02, CHECK = 200, BESIDE = 1000;
export const ARMS = ['CANDD', 'CANDS'];
export const HELD_OUT = [7003, 7011, 7012, 7013, 7014, 7018, 7019];
/* the panel's households with a working year to choose (the engine's saveSplitAt), in the panel's order */
const prepPlan = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
export const choiceYears = ctx => { const T = ctx.totalYears, out = []; for (let t = 0; t <= T; t++) if (ctx.saveSplitAt && ctx.saveSplitAt(t)) out.push(t); return out; };
export const saveIds = panel => panel.filter(h => choiceYears(E.buildContext(prepPlan(appPlan(h.plan)))).length).map(h => h.id);
/* the files the stamp hashes, in this order */
export const STAMP_FILES = ['audit-save.mjs', 'reduce-save.mjs', 'audit-phase4.mjs', 'phase4-panel.mjs', 'select-phase4.mjs', 'candidate.mjs', 'candidate.json', 'phase4-panel.json'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'phase4-panel.json' ? PANEL_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const unitsOf = (ids, arms = ARMS) => arms.flatMap(arm => ids.map(id => [id, arm]));
export const fileOf = (id, arm) => `${id}-${arm.toLowerCase()}.json.gz`;
/* what each arm must have run */
export function armProblems(arm, r) {
  const P = [], want = arm === 'CANDS';
  if ((r.meta.saveSplit === 'on') !== want) P.push(`saveSplit ${r.meta.saveSplit} on ${arm}`);
  if (want && !r.actions.some(a => a.save)) P.push('no save copies on the menu');
  if (r.meta.failDelivered !== true) P.push(`failDelivered ${r.meta.failDelivered}`);
  if (Math.abs(r.lambda - LAMBDA) > 1e-15) P.push(`lambda ${r.lambda}, not ${LAMBDA}`);
  if (!r.meta.tierState || Math.abs(r.switchCharge - CANDIDATE_OPTS.switchCharge) > 1e-15) P.push(`tier state ${r.meta.tierState}, switch charge ${r.switchCharge}`);
  return P;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const panel = readPanel(), byId = Object.fromEntries(panel.map(h => [h.id, h]));
  const ONLY = process.env.SAVE_ONLY ? new Set(process.env.SAVE_ONLY.split(',')) : null;
  const ARMS_RUN = process.env.SAVE_ARMS ? process.env.SAVE_ARMS.split(',') : ARMS;
  if (ARMS_RUN.some(a => !ARMS.includes(a))) { console.error(`audit-save: no arm ${ARMS_RUN.filter(a => !ARMS.includes(a))}`); process.exit(2); }
  const UNITS = unitsOf(saveIds(panel).filter(id => !ONLY || ONLY.has(id)), ARMS_RUN);
  if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
  const N = Number(process.argv[2]), part = process.argv[3] === 'part' ? process.argv[4] : '0/1', [pk, pn] = part.split('/').map(Number), SEED_RUN = Number(process.argv[5] || SEED);
  if (HELD_OUT.includes(SEED_RUN)) { console.error(`audit-save: seed ${SEED_RUN} is held out for another test`); process.exit(2); }
  if (CANDIDATE_HASH !== 'd71f65ae871e') { console.error(`audit-save: the candidate is ${CANDIDATE_HASH}, not d71f65ae871e`); process.exit(2); }
  if (!(N >= 1 && pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-save: bad paths or part (${process.argv.slice(2, 5).join(' ')})`); process.exit(2); }
  const OUT = process.env.SAVE_OUT || join(HERE, 'results', `save-${SEED_RUN}`);
  mkdirSync(OUT, { recursive: true });
  const STAMP = (() => { const cid = codeId(); return { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), candidate: CANDIDATE_HASH, prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version }; })();
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  console.log(`THE SAVINGS SPLIT ON THE CANDIDATE (EXPLORATORY): ${ARMS_RUN.join(', ')} at W${W}; seed ${SEED_RUN}, ${N} paths; ${UNITS.length} units; part ${part}`);

  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  UNITS.forEach(([id, arm], i) => {
    if (i % pn !== pk) return;
    const h = byId[id], t0 = Date.now();
    console.log(`${id.padEnd(8)} case | unit ${arm} | cohort ${h.cohort} target ${h.target} paths ${N}`);
    const a = armA(appPlan(h.plan), { tournament: false });
    if (a.label !== h.label) { console.error(`audit-save: ${id}: arm A's pick ${a.label} differs from the landing's ${h.label}`); process.exit(3); }
    const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy }));
    const r = solveCandidate(E, M, plan, { lambda: LAMBDA, points: Number(process.env.SAVE_PTS) || CAND_PTS, bequestWeight: W, ...(arm === 'CANDS' ? { saveSplit: true } : {}) });
    const solveSecs = (Date.now() - t0) / 1000, bad = armProblems(arm, r);
    if (bad.length) { console.error(`audit-save: ${id} ${arm}: ${bad.join('; ')}`); process.exit(3); }
    const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, Y = T + 1, inputs = inputsHash(ctx), self = ctx.owners.find(o => o.key === 'self');
    const retireT = Math.max(0, Math.min(Y, self.retireAge - ctx.ageSelf0));
    const workT = choiceYears(ctx), rooms = workT.length ? ctx.saveSplitAt(workT[0]).owners : [];   // the working years with a choice; the first one's budget and rooms
    const levels = [...new Set(r.levelOf)].sort((x, y) => x - y);
    const ran = { arm, pts: r.g.np, actions: r.actions.length, levels, lambda: r.lambda, saveSplit: r.meta.saveSplit || 'off', failDelivered: r.meta.failDelivered === true,
      raiseWeight: r.meta.raiseWeight, failureShortfall: r.failureShortfall, switchCharge: r.switchCharge, tierState: r.meta.tierState, bequestWeight: +Number(r.meta.bequestWeight).toPrecision(10) };
    console.log(`${''.padEnd(8)} ran ${arm}: saveSplit ${ran.saveSplit} levels ${levels.join(',')} pts ${ran.pts} actions ${ran.actions} inputs ${inputs} years to choose ${workT.length ? `${workT[0]}-${workT[workT.length - 1]}` : 'none'} rooms ${JSON.stringify(rooms)} | solve secs ${Math.round(solveSecs)}`);
    const paths = E.pathsForSeed(SEED_RUN, N, T), n = paths.length, e0 = Date.now();
    const main = { survived: new Uint8Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), estate: new Float32Array(n), wealth: new Float32Array(n), failYear: new Int16Array(n), level: new Uint8Array(n * Y) };
    let badCheck = 0;
    paths.forEach((zs0, k) => {
      const zs = Float64Array.from(zs0), o = runPath(ctx, zs);
      main.survived[k] = o.survived ? 1 : 0; main.delivered[k] = o.delivered; main.unmet[k] = o.unmet; main.estate[k] = o.estate; main.wealth[k] = o.wealth; main.failYear[k] = o.failYear; main.level.set(o.level, k * Y);
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet) badCheck++; }
    });
    if (badCheck) { console.error(`audit-save: ${id} ${arm}: runPath differs from E.runTrial on ${badCheck} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const eSecs = (Date.now() - e0) / 1000, surv = 100 * main.survived.reduce((x, v) => x + v, 0) / n;
    console.log(`${''.padEnd(8)} run ${arm}: engine ${surv.toFixed(4)} on ${n}; engine secs ${Math.round(eSecs)} (${(1000 * eSecs / n).toFixed(1)} ms a path)`);
    // runPolicy beside the engine: the save chosen in each working year with a choice, and the pots at the top of the first
    // retired year
    const NB = Math.min(n, BESIDE), chosen = workT.map(() => [0, 0, 0]), after = [{ n: 0, pen: 0, isa: 0, tax: 0 }];
    let engineOnly = 0, policyOnly = 0;
    for (let k = 0; k < NB; k++) {
      const o = runPolicy(r, Float64Array.from(paths[k]), { visit: (t, s, held, ai) => {
        const d = workT.indexOf(t); if (d >= 0) chosen[d][r.actions[ai].save || 0]++;
        if (t === retireT) { after[0].n++; after[0].pen += s[0]; after[0].isa += s[1]; after[0].tax += s[2]; }
      } });
      const p = o.survived ? 1 : 0;
      if (main.survived[k] && !p) engineOnly++; if (p && !main.survived[k]) policyOnly++;
    }
    const afterMean = after.map(x => (x.n ? { n: x.n, pen: x.pen / x.n, isa: x.isa / x.n, tax: x.tax / x.n } : { n: 0 }));
    console.log(`${''.padEnd(8)} beside ${arm}: the engine alone ${engineOnly}, runPolicy alone ${policyOnly} of ${NB}; saves chosen ${JSON.stringify(chosen.reduce((x, c) => x.map((v, i) => v + c[i]), [0, 0, 0]))}`);
    writeFileSync(join(OUT, fileOf(id, arm)), gzipSync(JSON.stringify({ id, arm, cohort: h.cohort, target: ctx.targetSpend, inputs, retireT, workT, rooms, ageSelf0: ctx.ageSelf0, stamp: STAMP, ran, seed: SEED_RUN, N: n, Y,
      solveSecs, engineSecs: eSecs, secs: (Date.now() - t0) / 1000, cpu: cpus()[0].model, beside: { N: NB, engineOnly, policyOnly }, chosen, after: afterMean,
      main: Object.fromEntries(Object.entries(main).map(([k, v]) => [k, b64(v)])) })));
    console.log(`${''.padEnd(8)} done ${arm} secs ${Math.round((Date.now() - t0) / 1000)}`);
  });
}
