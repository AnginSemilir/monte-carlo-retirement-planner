/*
 * WHERE THE SWEEP PUTS CASH ISA MONEY (the review of 9 Nov, item 5, part 2, step 2; D66; ISA-SWEEP.md; EXPLORATORY, seed 7002,
 * deciding nothing). One household a process: its plan solved at the app's 45 points (solveForApp, the candidate's settings)
 * with the sweep as now (GIA) and with the cash ISA money above the buffer moved to the stocks and shares ISA (ISA,
 * sweepCashIsaTo 'isa'), each solved plan run by the engine on the same 4,000 paths: survival, spending delivered, the pot
 * left, the lifetime tax a path, and the expected path's tax; the first year's sweep and the ISA's tier in year 1 under each.
 * The units go to results/isasweep-<seed>/ (ISASWEEP_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz. reduce-isasweep.mjs reads them.
 *   node research/solver/audit-isasweep.mjs part k/n          node research/solver/audit-isasweep.mjs --units
 *   ISASWEEP_PTS the points (smoke only); ISASWEEP_N the paths (smoke only); ISASWEEP_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext, runPath, firstSweep, firstMove } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readPanel } from './phase4-panel.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, N = 4000, PTS = 45;
// the review's eight as Phase 4 landed them; the four touched singles with the most cash ISA money (five tie at £540,000:
// the four by library order); S116, the review's own measurement (ISA-SWEEP.md)
export const PANEL8 = ['S030', 'S050', 'S090', 'S368', 'S188', 'S304F', 'S328F', 'S340F'];
export const CASHISA = ['S058', 'S118', 'S178', 'S238', 'S116'];
export const UNITS = [...PANEL8, ...CASHISA];
export const ARMS = { GIA: {}, ISA: { sweepCashIsaTo: 'isa' } };
export const STAMP_FILES = ['audit-isasweep.mjs', 'reduce-isasweep.mjs', 'ISA-SWEEP.md', 'stats.mjs', 'phase4-panel.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
const hashOf = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);
/* the plan a household is solved on: Phase 4's landed plan for the eight, the library's as entered for the rest */
export function planOf(id) {
  if (PANEL8.includes(id)) return readPanel().find(h => h.id === id).plan;
  return E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
}
const settingsOf = r => `pts ${r.g.np} mix ${r.meta.mixture} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} levels ${r.meta.spendLevels.join(',')} tierState ${r.meta.tierState} tiersBelow ${r.meta.tiersBelow} tableDealing ${r.meta.tableDealing} switchCharge ${r.switchCharge || 0} e3pcls ${!!r.meta.e3pcls} jointWorlds ${!!r.meta.jointWorlds} failDelivered ${!!r.meta.failDelivered} readerRef ${r.meta.readerRef} finalExact ${!!r.finalExact}`;
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-isasweep: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.ISASWEEP_OUT || join(HERE, 'results', `isasweep-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.ISASWEEP_PTS) || PTS, n = Number(process.env.ISASWEEP_N) || N;
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const id = UNITS[pk];
  console.log(`ISA-SWEEP (EXPLORATORY): unit ${pk}/${pn}: ${id}, seed ${SEED}, ${n} paths, ${pts} points, the arms GIA and ISA; node ${STAMP.node}`);
  const t0 = Date.now();
  const plan = planOf(id), inputs = hashOf(plan);
  const ctx0 = E.buildContext(E.resolveMpaa(E.normalizePlan(plan))), st0 = E.freshState(ctx0);
  console.log(`${id.padEnd(8)} case | unit ${pk} | target ${ctx0.targetSpend} | sheltered cash ${Math.round(st0.cashIsa.self)} | inputs ${inputs}`);
  const T = ctx0.totalYears, paths = E.pathsForSeed(SEED, n, T);
  const arms = {};
  for (const [arm, opts] of Object.entries(ARMS)) {
    const s0 = Date.now(), r = solveForApp(E, M, plan, { points: pts, research: { ...light, ...opts } }), solveSecs = (Date.now() - s0) / 1000;
    const sc = solvedContext(E, r), e0 = Date.now();
    const survived = new Uint8Array(n), delivered = new Float64Array(n), target = new Float64Array(n), pot = new Float64Array(n), tax = new Float64Array(n);
    paths.forEach((zs, k) => { const o = runPath(E, sc, zs); survived[k] = o.survived ? 1 : 0; delivered[k] = o.delivered; target[k] = o.target; pot[k] = o.terminalPot; tax[k] = o.lifetimeTax; });
    const expTax = E.simulateDeterministic(sc, 'expected').reduce((t, x) => t + x.taxPaid + (x.cgtPaid || 0), 0);
    const sweep = firstSweep(E, sc), f = firstMove(E, r);
    arms[arm] = { ran: `sweepCashIsaTo ${r.meta.sweepCashIsaTo || 'gia (unset)'} | ${settingsOf(r)}`, inputs, solveSecs, secs: (Date.now() - e0) / 1000, expTax, sweep, isaTier1: f.mv.tierIsaName, survived, delivered, target, pot, tax };
    console.log(`${''.padEnd(8)} ran ${arm}: ${arms[arm].ran} | solve secs ${Math.round(solveSecs)}`);
    console.log(`${''.padEnd(8)} done ${arm} secs ${Math.round(solveSecs + arms[arm].secs)} | the first year's sweep: to the taxable account ${Math.round(sweep.toGia)}, to the ISA ${Math.round(sweep.toIsa)}, back ${Math.round(sweep.fromGia)}`);
  }
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  writeFileSync(join(OUT, `${id}.json.gz`), gzipSync(JSON.stringify({ k: pk, id, seed: SEED, N: n, pts, inputs, cashIsa0: st0.cashIsa.self, stamp: STAMP, cpu: cpus()[0].model,
    arms: Object.fromEntries(Object.entries(arms).map(([a, x]) => [a, { ran: x.ran, inputs: x.inputs, solveSecs: x.solveSecs, secs: x.secs, expTax: x.expTax, sweep: x.sweep, isaTier1: x.isaTier1,
      survived: b64(x.survived), delivered: b64(x.delivered), target: b64(x.target), pot: b64(x.pot), tax: b64(x.tax) }])) })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
