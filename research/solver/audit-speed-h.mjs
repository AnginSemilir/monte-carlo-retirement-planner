/*
 * THE SPEED MODE ON THE HOUSEHOLD PLAN (SPEED-H.md; the reviewer on D135's change of default, finding 5; EXPLORATORY, seed
 * 7002, deciding nothing). One unit, one of SPEED-B's twelve couples at its landed target. It is solved as the page solves a
 * couple at the default, twice: as it stands (WHOLE) and with the speed mode on (SPEED, src/solverSettings.js withSpeed). The
 * page's route: src/solverCouple.js householdCut at 'pensionsPA', solveForApp on the household plan inside the cut's bands,
 * householdSolved. Both arms are run by the engine on the same 4,000 paths of seed 7002 (the page's context, stepped by
 * audit-phase4.mjs runPath, as the port's identity ran it).
 * Stored for each path: survival, the spending delivered, the pot left and lifetime tax. Also stored: each arm's milliseconds
 * a path, its table's digest and shortlist, and the unit's cap.
 * Units go to results/speed-h-<seed>/ (SPH_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and <id>.json.gz.
 * reduce-speed-h.mjs reads them.
 *   node research/solver/audit-speed-h.mjs part k/n      node research/solver/audit-speed-h.mjs --units
 *   SPH_PTS the points (smoke only); SPH_N the paths (smoke only); SPH_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { withSpeed, speedOf, appJoint } from '../../src/solverSettings.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readPanel as readCouples } from './couple-panel.mjs';
import { PANEL_FILE as COUPLES_FILE } from './audit-couples.mjs';
import { runPath } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, N = 4000, PTS = 45, WARM = 3, FORM = 'pensionsPA';
export const COUPLES = ['S031', 'S047', 'S063', 'S097', 'S115', 'S133', 'S301F', 'S305F', 'S307F', 'S319F', 'S321F', 'S325F'];
export const UNITS = COUPLES.map(id => ({ id, kind: 'household' }));
export const ARMS = ['WHOLE', 'SPEED'];
export const STAMP_FILES = ['audit-speed-h.mjs', 'reduce-speed-h.mjs', 'reduce-speed-b.mjs', 'SPEED-H.md', 'batch-speed-h.sh', 'couple-panel.mjs', 'audit-couples.mjs', 'audit-phase4.mjs', 'couples-panel-d4b.json', 'stats.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-panel-d4b.json' ? COUPLES_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id} ${u.kind}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-speed-h: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.SPH_OUT || join(HERE, 'results', `speed-h-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.SPH_PTS) || PTS, n = Number(process.env.SPH_N) || N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now();
  const h = readCouples(COUPLES_FILE).find(x => x.id === u.id);
  if (!h) { console.error(`audit-speed-h: ${u.id} is not in its panel`); process.exit(2); }
  console.log(`SPEED-H (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (${h.cohort}), seed ${SEED}, ${n} paths, ${pts} points; node ${STAMP.node}`);
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : null;
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const j = appJoint(), arms = {}; let paths = null, cap = null;
  for (const arm of ARMS) {
    const plan = withSpeed(h.plan, arm === 'SPEED'), s0 = Date.now();
    // the page's route at the couples' default (src/solverClient.js startSolve's household route, as the worker answers it)
    const cut = householdCut(E, M, plan, FORM), b = cut.bands;
    const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { points: pts, ageWith: cut.ageWith, ...(light ? { research: light } : {}) }), b.paK);
    const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: j.tieJoint, holdPast: j.holdPast }, { plan: cut.hplan, r: H });
    const digests = [await digestOf(tablesOf(H))], shortlist = [H.meta.chooserShortlist || null];
    if (cap === null) cap = H.estateCap || 0;
    const ctx = solvedContext(E, cp), T = ctx.totalYears;
    const run = zs => { const o = runPath(ctx, zs, false); return { survived: o.survived, delivered: o.delivered, pot: o.wealth, tax: o.tax }; };
    const solveSecs = (Date.now() - s0) / 1000;
    if (!paths) { paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs)); paths.T = T; }
    if (T !== paths.T) { console.error(`audit-speed-h: ${u.id} ${arm}: another horizon`); process.exit(3); }
    for (const zs of paths.slice(0, WARM)) run(zs);   // warm the code paths before timing
    const A = { survived: new Uint8Array(n), delivered: new Float64Array(n), pot: new Float64Array(n), tax: new Float64Array(n) };
    const e0 = process.hrtime.bigint();
    paths.forEach((zs, k) => { const o = run(zs); A.survived[k] = o.survived ? 1 : 0; A.delivered[k] = o.delivered; A.pot[k] = o.pot; A.tax[k] = o.tax; });
    const ms = Number(process.hrtime.bigint() - e0) / 1e6 / n, surv = 100 * A.survived.reduce((s, v) => s + v, 0) / n;
    arms[arm] = { speed: speedOf(plan), household: cp.meta && cp.meta.scale ? cp.meta.scale.rule : null, split: cp.split, k: b.k, shortlist, digests, solveSecs, ms, T, ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} done ${arm}: the speed mode ${speedOf(plan) ? 'on' : 'off'} (the table's shortlist ${shortlist.join('/')}); the household at ${arms[arm].household}, k ${b.k.toFixed(4)}, ${cp.split}; solve ${solveSecs.toFixed(0)} s; engine ${surv.toFixed(2)}% on ${n}, a path ${ms.toFixed(2)} ms; digest ${digests[0].slice(0, 12)}`);
  }
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id: u.id, kind: u.kind, cohort: h.cohort, seed: SEED, N: n, pts, cap, stamp: STAMP, cpu: cpus()[0].model, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
