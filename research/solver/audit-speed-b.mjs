/*
 * THE SPEED MODE ON MORE SINGLES AND COUPLES (SPEED-B.md; D97 (3); EXPLORATORY, seed 7002, deciding nothing). On the working
 * branch's own code. One unit one plan: a single of Phase 4's panel or a couple of the couples' re-run panel, at its landed
 * target, solved by the app's own route twice, as it stands (WHOLE) and with the speed mode on (SPEED: src/solverSettings.js
 * withSpeed, the chooser's shortlist as the page hands it); both run by the engine on the same 4,000 paths of seed 7002, a
 * single by solverStrategy.js runPath on its solved plan, a couple by the engine with its joint move.
 * Stored for each path: survival, the spending delivered, the pot left and lifetime tax; each arm's milliseconds a path and
 * its tables' digests; the unit's cap.
 * Units go to results/speed-b-<seed>/ (SPB_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and <id>.json.gz.
 * reduce-speed-b.mjs reads them.
 *   node research/solver/audit-speed-b.mjs part k/n      node research/solver/audit-speed-b.mjs --units
 *   SPB_PTS the points (smoke only); SPB_N the paths (smoke only); SPB_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { withSpeed, speedOf } from '../../src/solverSettings.js';
import { householdPlan } from '../../src/solverCouple.js';
import { solvedContext, runPath as runSingle } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readPanel as readSingles, PANEL_FILE as SINGLES_FILE } from './phase4-panel.mjs';
import { readPanel as readCouples } from './couple-panel.mjs';
import { PANEL_FILE as COUPLES_FILE } from './audit-couples.mjs';
import { runPath as runCouple } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, N = 4000, PTS = 45, WARM = 3;
export const SINGLES = ['S026', 'S040', 'S062', 'S074', 'S096', 'S108', 'S132', 'S164', 'S204', 'S228', 'S306F', 'S308F', 'S310F', 'S314F', 'S316F', 'S320F', 'S322F', 'S326F', 'S332F', 'S334F'];
export const COUPLES = ['S031', 'S047', 'S063', 'S097', 'S115', 'S133', 'S301F', 'S305F', 'S307F', 'S319F', 'S321F', 'S325F'];
/* the couples first (each the longer), then the singles */
export const UNITS = [...COUPLES.map(id => ({ id, kind: 'couple' })), ...SINGLES.map(id => ({ id, kind: 'single' }))];
export const ARMS = ['WHOLE', 'SPEED'];
export const STAMP_FILES = ['audit-speed-b.mjs', 'reduce-speed-b.mjs', 'SPEED-B.md', 'batch-speed-b.sh', 'phase4-panel.mjs', 'couple-panel.mjs', 'audit-couples.mjs', 'audit-phase4.mjs', 'phase4-panel.json', 'couples-panel-d4b.json', 'stats.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'phase4-panel.json' ? SINGLES_FILE : f === 'couples-panel-d4b.json' ? COUPLES_FILE : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id} ${u.kind}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-speed-b: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.SPB_OUT || join(HERE, 'results', `speed-b-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.SPB_PTS) || PTS, n = Number(process.env.SPB_N) || N;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now();
  const h = u.kind === 'single' ? readSingles().find(x => x.id === u.id) : readCouples(COUPLES_FILE).find(x => x.id === u.id);
  if (!h) { console.error(`audit-speed-b: ${u.id} is not in its panel`); process.exit(2); }
  console.log(`SPEED-B (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (a ${u.kind}, ${h.cohort}), seed ${SEED}, ${n} paths, ${pts} points; node ${STAMP.node}`);
  const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : null;
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const arms = {}; let paths = null, cap = null;
  for (const arm of ARMS) {
    const plan = withSpeed(h.plan, arm === 'SPEED'), s0 = Date.now();
    let run, digests, shortlist, T;
    if (u.kind === 'single') {
      const r = solveForApp(E, M, plan, { points: pts, ...(light ? { research: light } : {}) });
      digests = [await digestOf(tablesOf(r))]; shortlist = [r.meta.chooserShortlist || null]; cap = r.estateCap;
      const sc = solvedContext(E, r); T = sc.totalYears;
      run = zs => { const o = runSingle(E, sc, zs); return { survived: o.survived, delivered: o.delivered, pot: o.terminalPot, tax: o.lifetimeTax }; };
    } else {
      const hp = householdPlan(E, plan);
      const cp = CPL.solveCouple(E, M, hp, { shareRule: 'pots', solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, ...(light ? { research: light } : {}) }) });
      digests = [await digestOf(tablesOf(cp.tables.self)), await digestOf(tablesOf(cp.tables.part))]; shortlist = [cp.tables.self.meta.chooserShortlist || null, cp.tables.part.meta.chooserShortlist || null];
      cap = (cp.tables.self.estateCap || 0) + (cp.tables.part.estateCap || 0);
      const ctx = E.buildContext(CPL.withCouple(cp.plan, cp)); T = ctx.totalYears;
      run = zs => { const o = runCouple(ctx, zs, false); return { survived: o.survived, delivered: o.delivered, pot: o.wealth, tax: o.tax }; };
    }
    const solveSecs = (Date.now() - s0) / 1000;
    if (!paths) { paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs)); paths.T = T; }
    if (T !== paths.T) { console.error(`audit-speed-b: ${u.id} ${arm}: another horizon`); process.exit(3); }
    for (const zs of paths.slice(0, WARM)) run(zs);   // warm the code paths before timing
    const A = { survived: new Uint8Array(n), delivered: new Float64Array(n), pot: new Float64Array(n), tax: new Float64Array(n) };
    const e0 = process.hrtime.bigint();
    paths.forEach((zs, k) => { const o = run(zs); A.survived[k] = o.survived ? 1 : 0; A.delivered[k] = o.delivered; A.pot[k] = o.pot; A.tax[k] = o.tax; });
    const ms = Number(process.hrtime.bigint() - e0) / 1e6 / n, surv = 100 * A.survived.reduce((s, v) => s + v, 0) / n;
    arms[arm] = { speed: speedOf(plan), shortlist, digests, solveSecs, ms, T, ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} done ${arm}: the speed mode ${speedOf(plan) ? 'on' : 'off'} (the tables' shortlist ${shortlist.join('/')}); solve ${solveSecs.toFixed(0)} s; engine ${surv.toFixed(2)}% on ${n}, a path ${ms.toFixed(2)} ms; digests ${digests.map(d => d.slice(0, 12)).join('/')}`);
  }
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id: u.id, kind: u.kind, cohort: h.cohort, seed: SEED, N: n, pts, cap, stamp: STAMP, cpu: cpus()[0].model, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
