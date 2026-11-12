/*
 * WHERE THE SWEEP PUTS A COUPLE'S CASH ISA MONEY: THE CHECK BEFORE THE COUPLES' RE-RUN (COUPLE-SWEEP.md; D87, D88; item
 * 5's experiment, ISA-SWEEP.md, on couples; EXPLORATORY, seed 7002, deciding nothing but by the rule COUPLE-SWEEP.md
 * commits). On the working branch's own code. One unit a couple: each person solved at 45 points as the app solves them
 * (solveCouple over solveForApp) under each arm, each solved couple run by the engine on the same 4,000 paths of seed 7002
 * (audit-phase4.mjs runPath, held to E.runTrial on each arm's first paths):
 *   ISA   the candidate as ported: each person's table solved with the sweep's cash ISA money to the ISA, the couple's
 *         joint move carrying it (the first reading; what the registered re-run's CANDC is landed on);
 *   GIA   the same with `sweepCashIsaTo: 'gia'` handed to each person's solve: the sweep to the taxable account, as it
 *         was before D73 (the other reading).
 * Each arm records what it ran, read back from the solved tables (the option in each person's meta, how many of each
 * person's moves carry the sweep), and what the engine swept over its first paths (to the ISA, to the taxable account).
 * Units go to results/couple-sweep-<seed>/ (CSWEEP_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz. reduce-couple-sweep.mjs reads them.
 *   node research/solver/audit-couple-sweep.mjs part k/n      node research/solver/audit-couple-sweep.mjs --units
 *   node research/solver/audit-couple-sweep.mjs --choice      (the couples against the touched list and the panel)
 *   CSWEEP_PTS the points (smoke only); CSWEEP_N the paths (smoke only); CSWEEP_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp, prepareForSolve } from '../../src/solverApp.js';
import { runPath } from './audit-phase4.mjs';
import { settingsOf } from './audit-speed.mjs';
import { planOf, choiceProblems } from './audit-item12.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const { solveCouple, withCouple, COUPLE } = CPL;
export const SEED = 7002, N = 4000, PTS = 45, CHECK = 200, SWEPT = 500;
/* The twelve (COUPLE-SWEEP.md's rule of choice): the touched couples outside the panel with the most cash ISA money at
   the start, ties in the library's order */
export const COUPLES = ['S059', 'S035', 'S175', 'S235', 'S415', 'S053', 'S173', 'S079', 'S091', 'S391', 'S017', 'S029'];
export const UNITS = COUPLES.map(id => ({ id }));
export const ARMS = { GIA: { sweepCashIsaTo: 'gia' }, ISA: {} };
export const STAMP_FILES = ['audit-couple-sweep.mjs', 'reduce-couple-sweep.mjs', 'reduce-isasweep.mjs', 'COUPLE-SWEEP.md', 'audit-item12.mjs', 'audit-phase4.mjs', 'audit-speed.mjs', 'stats.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;
const hashOf = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);
/* what an arm ran, read back from each person's solved table: the option as the solve recorded it, and how many of the
   person's moves carry the sweep to the ISA */
export const sweepOfTab = tab => { const n = tab.actions.length, k = tab.actions.filter(a => a.sweepIsa).length; return `${tab.meta.sweepCashIsaTo || 'gia'} (${k === n ? 'every move' : k === 0 ? 'no move' : `${k} of ${n} moves`})`; };
/* what each arm should record (reduce-couple-sweep.mjs's gate) */
export const WANT = { GIA: 'gia (no move)', ISA: 'isa (every move)' };
const light = pts => (pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {});
/* the couples' cash ISA money at the start, both people (the engine's fresh state) */
export function cashIsaOf(plan) { const st = E.freshState(E.buildContext(plan)), c = st.cashIsa || {}; return (c.self || 0) + (c.part || 0); }

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  if (args[0] === '--choice') {
    const bad = choiceProblems(COUPLES).filter(x => !/the review's eight/.test(x));   // the review's couples may be taken here: none is a panel couple
    console.log(bad.length ? `the choice: ${bad.join('; ')}` : `the choice: ${COUPLES.map(id => `${id} £${Math.round(cashIsaOf(planOf(id))).toLocaleString('en-GB')}`).join(', ')}: each touched, none in the panel (ids only)`);
    process.exit(bad.length ? 1 : 0);
  }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-couple-sweep: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.CSWEEP_OUT || join(HERE, 'results', `couple-sweep-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.CSWEEP_PTS) || PTS, n = Number(process.env.CSWEEP_N) || N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], id = u.id;
  console.log(`COUPLE-SWEEP (EXPLORATORY): unit ${pk}/${pn}: ${id}, seed ${SEED}, ${n} paths, ${pts} points; node ${STAMP.node}`);
  const t0 = Date.now(), plan = planOf(id), inputs = hashOf(plan), cashIsa = cashIsaOf(plan);
  if (!COUPLE.flat || !COUPLE.fast) { console.error('audit-couple-sweep: COUPLE.flat and COUPLE.fast are on in the registered run: not here'); process.exit(2); }
  const arms = {}; let paths = null, lifeTarget = 0, years = 0;
  for (const [arm, research] of Object.entries(ARMS)) {
    const s0 = Date.now();
    const cp = solveCouple(E, M, prepareForSolve(E, plan), { solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { ...light(pts), ...research } }) });
    const solveSecs = (Date.now() - s0) / 1000, ctx = E.buildContext(withCouple(cp.plan, cp)), T = ctx.totalYears;
    if (!paths) {
      paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs)); years = T + 1;
      const st = E.freshState(ctx), zs = paths[0], zPath = zs.length > T + 1 ? zs[T + 1] : 0;
      for (let t = 0; t <= T; t++) { const row = E.stepYear(ctx, st, t, { z: zs[t], zPath }); if (row.targetSpend > 0) lifeTarget += E.spendTargetAtAge(ctx, row.ageSelf); }
    }
    const sweep = ['self', 'part'].map(who => sweepOfTab(cp.tables[who])), settings = ['self', 'part'].map(who => settingsOf(cp.tables[who]));
    const coarse = ['self', 'part'].map(who => { const c = cp.tables[who].meta.coarse; return c ? (c.off ? `off (${c.off})` : 'on') : 'none'; });
    const survived = new Uint8Array(n), delivered = new Float64Array(n), target = new Float64Array(n).fill(lifeTarget), pot = new Float64Array(n), tax = new Float64Array(n);
    const e0 = process.hrtime.bigint(); let bad = 0;
    for (let k = 0; k < n; k++) {
      const o = runPath(ctx, paths[k], false); survived[k] = o.survived ? 1 : 0; delivered[k] = o.delivered; pot[k] = o.wealth; tax[k] = o.tax;
      if (k < CHECK) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet || q.lifetimeTax !== o.tax) bad++; }
    }
    const ms = Number(process.hrtime.bigint() - e0) / 1e6 / n;
    if (bad) { console.error(`audit-couple-sweep: ${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    // what the engine swept, a path's lifetime mean over the first paths: to the ISA, to the taxable account
    let toIsa = 0, toGia = 0; const m = Math.min(SWEPT, n);
    for (let k = 0; k < m; k++) { const st = E.freshState(ctx), zs = paths[k], zPath = zs.length > T + 1 ? zs[T + 1] : 0; for (let t = 0; t <= T; t++) { const row = E.stepYear(ctx, st, t, { z: zs[t], zPath }); toIsa += row.sweptToIsa || 0; toGia += row.sweptToGia || 0; } }
    arms[arm] = { ran: `sweep self ${sweep[0]} part ${sweep[1]}`, sweep, rest: `coarse ${coarse.join(' and ')} | flat ${COUPLE.flat} fast ${COUPLE.fast} | share ${cp.share} | self: ${settings[0]} | part: ${settings[1]}`, inputs, solveSecs, ms, sweptToIsa: toIsa / m, sweptToGia: toGia / m, survived, delivered, target, pot, tax };
    console.log(`${''.padEnd(8)} ran ${arm}: ${arms[arm].ran} | ${arms[arm].rest}`);
    console.log(`${''.padEnd(8)} done ${arm}: solve ${solveSecs.toFixed(0)} s, a path ${ms.toFixed(1)} ms; the engine against E.runTrial on the first ${Math.min(CHECK, n)} paths the same; swept a path, the first ${m}: to the ISA £${Math.round(toIsa / m)}, to the taxable account £${Math.round(toGia / m)}`);
  }
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id, seed: SEED, N: n, pts, inputs, stamp: STAMP, cpu: cpus()[0].model, years, cashIsa, lifeTarget,
    arms: Object.fromEntries(Object.entries(arms).map(([a, x]) => [a, { ...x, survived: b64(x.survived), delivered: b64(x.delivered), target: b64(x.target), pot: b64(x.pot), tax: b64(x.tax) }])) })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
