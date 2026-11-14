/*
 * THE SOLVER CHOOSING A COUPLE'S SHARE, STAGE A (SHARE-CHOOSE.md; D102, the maintainer's option 2; EXPLORATORY, seed 7002,
 * deciding nothing but by the rule SHARE-CHOOSE.md commits). On the working branch's own code. One unit one of stage C's
 * (couples-share-panel.json, at its landed target), or S211-75pdb as the share ensemble built it; its arms at estate weight
 * 0.02, each run by the engine on the same 4,000 paths of seed 7002:
 *   APP      the app's rules: arm A's pick on the unit's plan, as stage C's APP;
 *   s<x>     the couples' candidate as stage C solved it (audit-couples-share.mjs COUPLES_CANDIDATE: the app's candidate less
 *            the tie-break, 45 points, each person's table with the partner's age), the couple solved on the first person's
 *            share x (solveCouple's own `share`), for every x on the grid (0.5 to 0.9 and the pots' share); each with the
 *            solver's own forecast at the start (couple.js chooseJoint's score at year 0 from the household's opening
 *            state), and the same forecast from two light solves at that share (15 points; 6 points on the light lattice);
 *   means    the share by each person's means (their pots, contributions to come, state pension and other incomes at 2.5%
 *            real), rounded to two places; the grid's arm where it falls on the grid.
 * Stored for each path: survival, the year it failed, the pot left, the estate, lifetime tax, the spending delivered, and
 * whether it failed in the last year with the pot below the minimum.
 * Units go to results/share-choose-<seed>/ (SCHO_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>.json.gz. reduce-share-choose.mjs reads them.
 *   node research/solver/audit-share-choose.mjs part k/n      node research/solver/audit-share-choose.mjs --units
 *   SCHO_PTS the points (smoke only); SCHO_N the paths (smoke only); SCHO_OUT the folder; SCHO_GRID a grid (smoke only)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { readSharePanel, SHARE_PANEL } from './couples-share-panel.mjs';
import { appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath } from './audit-phase4.mjs';
import { solverPlan } from './audit-couples.mjs';
import { COUPLES_CANDIDATE, settingsOf } from './audit-couples-share.mjs';
import { planOfUnit, PDB, PDB_FROM } from './audit-share-ensemble.mjs';
import { hashOf } from './candidate.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const { solveCouple, withCouple, shareFor, chooseJoint } = CPL;
export const SEED = 7002, N = 4000, PTS = 45, W = 0.02, CHECK = 200, DISC = 0.025;
export const GRID = [0.5, 0.6, 0.7, 0.8, 0.9];
export const LIGHT = { light15: { points: 15 }, light6: { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } };
/* the fourteen, longest first by the share ensemble's own times (the batch runs them in this order): the share ensemble's ten
   and four plain 60/40 couples */
export const UNITS = [
  { id: PDB, group: 'partnerdb', from: PDB_FROM }, { id: 'S129-75', group: 'anchor' }, { id: 'S291-db', group: 'db' }, { id: 'S265-spa67', group: 'plain' },
  { id: 'S389-gain', group: 'plain' }, { id: 'S211-db', group: 'db' }, { id: 'S237-90', group: 'ninety' }, { id: 'S129-90', group: 'ninety' },
  { id: 'S129-db', group: 'db' }, { id: 'S183-spa67', group: 'plain' }, { id: 'S265-90', group: 'ninety' }, { id: 'S015-db', group: 'db' },
  { id: 'S019-90', group: 'ninety' }, { id: 'S043-gain', group: 'plain' }
];
export const armOf = x => `s${x}`;
export const STAMP_FILES = ['audit-share-choose.mjs', 'reduce-share-choose.mjs', 'SHARE-CHOOSE.md', 'batch-share-choose.sh', 'audit-share-ensemble.mjs', 'audit-couples-share.mjs', 'audit-couples.mjs', 'audit-phase4.mjs', 'couple-panel.mjs', 'couples-share-panel.mjs', 'select-phase4.mjs', 'couples-share-panel.json', 'stats.mjs', 'candidate.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(f === 'couples-share-panel.json' ? SHARE_PANEL : join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}.json.gz`;
/* each person's means at the real rate `disc` over the plan's years, as the reviewers counted them (the share ensemble's read,
   finding 2): the pots, the contributions paid until each retires, the state pension from the state pension age, and other
   incomes in their ages; the first person's share of the two */
export function meansOf(plan, disc = DISC) {
  const c = E.buildContext(E.resolveMpaa(plan)), T = c.totalYears, df = t => Math.pow(1 + disc, -t);
  const out = { self: 0, part: 0 };
  for (const a of c.accounts) { const o = c.owners.find(x => x.key === a.owner); out[a.owner] += a.balance; for (let t = 0; t <= T; t++) if (o.age0 + t < o.retireAge) out[a.owner] += (a.contrib || 0) * df(t); }
  for (const o of c.owners) for (let t = 0; t <= T; t++) if (o.age0 + t >= c.spa) out[o.key] += (o.statePension || 0) * df(t);
  for (const i of c.otherIncomes || []) for (let t = 0; t <= T; t++) { const age = (i.owner === 'self' ? c.ageSelf0 : c.agePart0) + t; if (age >= i.startAge && age <= i.endAge) out[i.owner] += i.amount * df(t); }
  return { self: out.self, part: out.part, share: out.self / (out.self + out.part) };
}
export const sharesOf = (plan, grid = GRID) => [...new Set([...grid, shareFor(plan)])].sort((a, b) => a - b);
/* the solver's own forecast of a couple at the start: the score of the joint move chooseJoint picks at year 0 */
export const forecastOf = cp => { const j = chooseJoint(cp, cp.M.initialState(cp.m), 0); return Number.isFinite(j.score) ? j.score : NaN; };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-share-choose: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.SCHO_OUT || join(HERE, 'results', `share-choose-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.SCHO_PTS) || PTS, n = Number(process.env.SCHO_N) || N;
  const grid = process.env.SCHO_GRID ? process.env.SCHO_GRID.split(',').map(Number) : GRID;
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], t0 = Date.now(), { plan, label } = planOfUnit(u);
  const pots = shareFor(plan), shares = sharesOf(plan, grid), means = meansOf(plan), meansX = Math.round(100 * means.share) / 100;
  const meansArm = shares.some(x => Math.abs(x - meansX) < 1e-9) ? armOf(shares.find(x => Math.abs(x - meansX) < 1e-9)) : 'means';
  const candidate = hashOf(COUPLES_CANDIDATE);
  console.log(`SHARE CHOOSE (EXPLORATORY): unit ${pk}/${pn}: ${u.id} (${u.group}), the grid ${shares.join(', ')} (the pots' ${pots}), the means' ${means.share.toFixed(4)} (rounded ${meansX}, arm ${meansArm}), seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}; node ${STAMP.node}`);
  const a = armA(appPlan(plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  if (label !== null && a.label !== label) { console.error(`audit-share-choose: ${u.id}: arm A's pick ${a.label} differs from the landing's ${label}`); process.exit(3); }
  const hp = solverPlan('CANDC', plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const solveAt = (x, o) => solveCouple(E, M, hp, { share: x, solveOne: (p, q) => solveForApp(E, M, p, { points: o.points, ageWith: q.partnerAge0, research: { tieAboveCap: undefined, ...(o.research || {}) } }) });
  const forecasts = { full: {}, light15: {}, light6: {} }, times = { full: {}, light15: {}, light6: {} };
  // the light passes first: each grid share's forecast at 15 points and at 6 on the light lattice, no engine run
  for (const [k, o] of Object.entries(LIGHT)) for (const x of shares) {
    const s0 = Date.now(), cp = solveAt(x, o);
    forecasts[k][x] = forecastOf(cp); times[k][x] = (Date.now() - s0) / 1000;
    console.log(`${''.padEnd(8)} light ${k} ${x}: forecast ${forecasts[k][x]} in ${times[k][x].toFixed(0)} s`);
  }
  const arms = {}; let paths = null;
  const run = (arm, ctx, cp, solveSecs, ran) => {
    const T = ctx.totalYears;
    if (!paths) paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
    const A = { survived: new Uint8Array(n), failYear: new Int16Array(n), pot: new Float64Array(n), estate: new Float64Array(n), tax: new Float64Array(n), delivered: new Float64Array(n), minPot: new Uint8Array(n) };
    const e0 = Date.now(); let bad = 0;
    paths.forEach((zs, k) => {
      const o = runPath(ctx, zs, false);
      A.survived[k] = o.survived ? 1 : 0; A.failYear[k] = o.failYear; A.pot[k] = o.wealth; A.estate[k] = o.estate; A.tax[k] = o.tax; A.delivered[k] = o.delivered;
      A.minPot[k] = !o.survived && o.failYear === T && ctx.solvencyFloor > 0 && o.wealth < ctx.solvencyFloor ? 1 : 0;
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.lifetimeTax !== o.tax) bad++; }
    });
    if (bad) { console.error(`audit-share-choose: ${u.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const surv = 100 * A.survived.reduce((s, v) => s + v, 0) / n;
    arms[arm] = { ran, share: cp ? cp.share : null, forecast: cp ? forecastOf(cp) : null, solveSecs, engineSecs: (Date.now() - e0) / 1000, T, minPotFloor: ctx.solvencyFloor, ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} ran ${arm}: ${ran}`);
    console.log(`${''.padEnd(8)} done ${arm}: solve ${solveSecs.toFixed(0)} s; engine ${surv.toFixed(2)}% on ${n}; runPath the same as E.runTrial on the first ${Math.min(CHECK, n)} paths`);
  };
  { const ctx = E.buildContext(E.resolveMpaa(a.planState)); run('APP', ctx, null, 0, `armA ${a.label.replace(/ /g, '_')} guardrails ${!!ctx.guardrails} lookahead ${ctx.lookaheadYears}`); }
  const fullOf = x => {
    const s0 = Date.now(), cp = solveAt(x, { points: pts, research: pts <= 6 ? LIGHT.light6.research : undefined }), secs = (Date.now() - s0) / 1000;
    if (Math.abs(cp.share - x) > 1e-12) { console.error(`audit-share-choose: ${u.id}: solved on the share ${cp.share}, not ${x}`); process.exit(3); }
    const ctx = E.buildContext(withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
    return { cp, secs, ctx };
  };
  for (const x of shares) {
    const { cp, secs, ctx } = fullOf(x);
    forecasts.full[x] = forecastOf(cp); times.full[x] = secs;
    run(armOf(x), ctx, cp, secs, `share ${cp.share} forecast ${forecasts.full[x]} | self: ${settingsOf(cp.tables.self)} | part: ${settingsOf(cp.tables.part)}`);
  }
  if (meansArm === 'means') {
    const { cp, secs, ctx } = fullOf(meansX);
    run('means', ctx, cp, secs, `share ${cp.share} forecast ${forecastOf(cp)} (the means' share) | self: ${settingsOf(cp.tables.self)} | part: ${settingsOf(cp.tables.part)}`);
  }
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id: u.id, group: u.group, from: u.from || null, shares, pots, means: { self: means.self, part: means.part, share: means.share, rounded: meansX, arm: meansArm }, forecasts, times,
    seed: SEED, N: n, pts, W, candidate, stamp: STAMP, cpu: cpus()[0].model, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
