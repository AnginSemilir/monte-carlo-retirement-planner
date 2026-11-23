/*
 * THE COUPLES TRADE, THE AUDIT (COUPLES-TRADE.md; the deep review of the guard's own units, reviews/2026-11-22-deep-couples-open.md,
 * section 3; EXPLORATORY, seed 7002): thirteen units of the registered panel (REG=1, couples-open-registered-panel.json), S037's
 * ten distinct household-route units and three controls, each on N paths of seed 7002 (4,000 unless CT_N) at the app's points
 * and estate weight 0.02, every arm in one process and run by the engine on the same paths:
 *   APP    arm A, the app's rules, as audit-couples-open.mjs runs it; each year's spending demand recorded, unrounded
 *   ROUTE  the household plan as audit-couples-open.mjs solves and runs it (solveRoute at FORM; the page's own context)
 *   L      ROUTE's own move each year, its spending level set so that the year's spending demand is APP's that year on the same
 *          path: APP's demand over the year's scheduled target on ROUTE's context, and over the year's fraction in plan year 0
 *          (the engine: annualLivingTarget = scheduled x spendLevel, then x the year's fraction); everything else ROUTE's (the
 *          order of drawing, the tiers, the lump sum, the sweep); in a year APP has no demand, ROUTE's own level
 *   PA2    the household plan solved and assembled at the 'pensions' form (HSP: the allowance two people's, the bands at k),
 *          everything else ROUTE's
 * Checked, a failure ending the unit (exit 3); at the app's points all six, at a smoke's points 3, 4 and 6:
 *   1. ROUTE's household table, solved again, carries the registered read's digest and the pilot's;
 *   2. APP and ROUTE on the first PILOT_N paths equal the pilot's arrays (results/couples-open-pilot), every key;
 *   3. ROUTE run through the level recorder equal to ROUTE without it, and L given ROUTE's own levels (each decision's level as
 *      ROUTE's move took it on the same path) equal to ROUTE, bit for bit on every key, on the first CHECK paths;
 *   4. L's spending demand equal to APP's in every year of every path, to a part in 1e9;
 *   5. PA2's k the unit's own (ROUTE's), its allowance two people's, ROUTE's k times one person's;
 *   6. each arm's first CHECK paths held to E.runTrial.
 * CT_PLANT=nextpath (a planted fault, run once on a smoke): each path's donor levels taken from the next path's, which checks 3
 * and 4 must both catch.
 *   REG=1 node research/solver/audit-couples-trade.mjs --units
 *   REG=1 node research/solver/audit-couples-trade.mjs run part k/n     (through the launcher: PREDICTION none:...)
 *   CT_PTS the points and CT_N the paths (a smoke only); CT_ONLY a comma list of unit ids; CT_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { appJoint, APP_POINTS } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { runPath, inputsHash } from './audit-phase4.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { readOpenPanel, routeOf, guardOf, FORM } from './couples-open-panel.mjs';
import { solveRoute, routeContext, unitProblems, mpaaOf, KEYS, CONFIG as OPEN_CONFIG, PILOT_N } from './audit-couples-open.mjs';
import { hashOf } from './candidate.mjs';
import { codeId, codeFiles } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const SEED = 7002, W = 0.02, CHECK = 200, WARM = 3, N_DEFAULT = 4000, PA2_FORM = 'pensions';
// S037's ten distinct household-route units (G12R is G12's own plan, COUPLES-OPEN.md amendment 3) and the three controls
export const S037_UNITS = Object.freeze(['S037-Y75', 'S037-Y90', 'S037-Y100', 'S037-E95', 'S037-E100', 'S037-S75', 'S037-G8', 'S037-G12', 'S037-G8Y75', 'S037-G12P']);
export const CONTROLS = Object.freeze(['S119-E100', 'S199-E100', 'S279-E100']);
export const UNITS = Object.freeze([...S037_UNITS, ...CONTROLS]);
export const ARMS = Object.freeze(['APP', 'ROUTE', 'L', 'PA2']);
export const CONFIG = Object.freeze({
  APP: OPEN_CONFIG.APP, ROUTE: OPEN_CONFIG.ROUTE,
  L: { ...OPEN_CONFIG.ROUTE, level: 'APP' },
  PA2: { ...OPEN_CONFIG.ROUTE, form: PA2_FORM }
});
export const configOf = arm => hashOf(CONFIG[arm]);
export const PILOT_DIR = join(HERE, 'results', 'couples-open-pilot'), READ_DIR = join(HERE, 'results', 'couples-open-run');
export const OUT_DEFAULT = join(HERE, 'results', 'couples-trade-7002');
export const fileOf = id => `${id}.json.gz`;
/* the stamp: the audit, the read and the batch, the files they import beyond the code, and the panel */
export const STAMP_ROOTS = ['research/solver/audit-couples-trade.mjs', 'research/solver/reduce-couples-trade.mjs', 'research/solver/batch-couples-trade.sh'];
export const STAMP_DATA = ['research/solver/couples-open-registered-panel.json'];
export function stampFiles(root = REPO) {
  const code = new Set(codeFiles(root)), seen = new Set(STAMP_ROOTS), queue = [...STAMP_ROOTS], out = [...STAMP_ROOTS];
  while (queue.length) {
    const f = queue.shift();
    if (!existsSync(join(root, f))) continue;
    const text = readFileSync(join(root, f), 'utf8');
    for (const m of text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)) {
      if (!m[1].startsWith('.')) continue;
      const rel = relative(root, join(root, dirname(f), m[1])).split('\\').join('/');
      if (rel.startsWith('..') || seen.has(rel)) continue;
      seen.add(rel);
      if (!code.has(rel)) out.push(rel);
      if (/\.m?js$/.test(rel)) queue.push(rel);
    }
    if (/\.sh$/.test(f)) for (const m of text.matchAll(/research\/solver\/([\w.-]+\.mjs)/g)) { const rel = `research/solver/${m[1]}`; if (!seen.has(rel)) { seen.add(rel); out.push(rel); queue.push(rel); } }
  }
  return [...new Set([...out.sort(), ...STAMP_DATA])];
}
export function stampFilesHash(root = REPO) {
  const h = createHash('sha256');
  for (const f of stampFiles(root)) h.update(f).update(existsSync(join(root, f)) ? readFileSync(join(root, f)) : 'missing');
  return h.digest('hex').slice(0, 12);
}
const js = x => JSON.stringify(x);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
const readUnit = (dir, id) => { const f = join(dir, fileOf(id)); return existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; };

/* the household route solved at a form, as audit-couples-open.mjs solveRoute's household branch (FORM there) */
export function solveHouseholdAt(hp, form, { pts, light }) {
  const opts = { points: pts, ...(light ? { research: light } : {}) };
  const cut = householdCut(E, M, hp, form), b = cut.bands, joint = appJoint();
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...opts, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
  return { cp, cut, k: b.k, caps: [H.estateCap || 0, 0], tables: { household: H } };
}
/* runPath's path, every outcome the same (check 6 holds it to E.runTrial, check 3 to runPath), each year's demand kept: the
   year's spending demand (row.targetSpend) and the first person's age (row.ageSelf) */
export function runRec(ctx, zs, rec = null) {
  const state = E.freshState(ctx), T = ctx.totalYears, zPath = zs.length > T + 1 ? zs[T + 1] : 0;
  let failed = false, failYear = -1, unmet = 0, tax = 0, delivered = 0, last = null;
  for (let t = 0; t <= T; t++) {
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    tax += row.taxPaid + (row.cgtPaid || 0);
    const u = Math.max(0, row.unmetDemand || 0); unmet += u;
    if (row.targetSpend > 0) delivered += Math.max(0, row.targetSpend - u);
    if (rec) { rec.demand[t] = row.targetSpend || 0; rec.age[t] = row.ageSelf; }
    if (!failed && (row.unmetDemand > E.FAIL_TOLERANCE || row.preNmpaInsolvent)) { failed = true; failYear = t; }
    last = row;
  }
  const wealth = Math.max(0, last.totalCombined);
  if (!failed && ctx.solvencyFloor > 0 && wealth < ctx.solvencyFloor) { failed = true; failYear = T; }
  const estate = Math.max(0, wealth - Math.max(0, last.pensions) * ctx.pensionDeathTaxRate);
  return { survived: !failed, failYear, wealth, estate, unmet, tax, delivered };
}
/* a policy whose every decision is the base's, its spending level replaced where src.lv(t) gives one; `watch(t, move)` sees the
   base's move (the recorder). Every argument the engine passes reaches the base (the late tail's amendment 1). */
export function levelPolicy(base, src, watch = null) {
  return {
    ...base,
    choose(es, t, ...rest) {
      const m = base.choose(es, t, ...rest);
      if (watch) watch(t, m);
      const lv = src ? src.lv(t) : undefined;
      return lv === undefined ? m : { ...m, spendLevel: lv };
    }
  };
}
/* the donor's level for path k (the next path's under the plant) */
export const donorOf = k => (process.env.CT_PLANT === 'nextpath' ? k + 1 : k);
/* the levels that give L APP's demand: APP's demand over the scheduled target on ROUTE's context (its fraction in year 0) */
export function levelsFromDemand(demand, sched, frac) {
  const lv = new Float64Array(demand.length).fill(NaN);
  for (let t = 0; t < demand.length; t++) if (demand[t] > 0 && sched[t] > 0) lv[t] = demand[t] / (frac[t] * sched[t]);
  return lv;
}
const sameArm = (P, Q, keys = Object.keys(KEYS), upTo = Infinity) => {
  let bad = 0;
  const n = Math.min(P.survived.length, Q.survived.length, upTo);
  for (let i = 0; i < n; i++) if (keys.some(k => P[k][i] !== Q[k][i] && !(Number.isNaN(P[k][i]) && Number.isNaN(Q[k][i])))) bad++;
  return bad;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (process.env.REG !== '1') { console.error('audit-couples-trade: runs on the registered panel, REG=1'); process.exit(2); }
  const panel = readOpenPanel(), only = process.env.CT_ONLY ? new Set(process.env.CT_ONLY.split(',')) : null;
  const units = UNITS.filter(id => !only || only.has(id)).map(id => panel.find(u => u.id === id));
  if (units.some(u => !u)) { console.error('audit-couples-trade: a unit is not in the registered panel'); process.exit(2); }
  if (args[0] === '--units') { console.log(units.map(u => u.id).join(' ')); console.log(units.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (args[0] !== 'run' || !(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-couples-trade: run part k/${units.length}`); process.exit(2); }
  const pts = Number(process.env.CT_PTS) || APP_POINTS, n = Number(process.env.CT_N) || N_DEFAULT, U = units[pk], full = pts === APP_POINTS;
  const light = !full && pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : null;
  const OUT = process.env.CT_OUT || OUT_DEFAULT;
  mkdirSync(OUT, { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  console.log(`THE COUPLES TRADE, EXPLORATORY (COUPLES-TRADE.md): unit ${pk}/${pn}: ${U.id} (${U.variant}), seed ${SEED}, ${n} paths, ${pts} points${process.env.CT_PLANT ? `, PLANTED ${process.env.CT_PLANT}` : ''}`);
  const t0 = Date.now(), fail = msg => { console.error(`audit-couples-trade: ${U.id}: ${msg}`); process.exit(3); };
  const { a, hp } = solverPlanOf(U.plan, 'own'), guard = guardOf(U.plan), route = routeOf(hp);
  const before = unitProblems(U, a.label, guard, route);
  if (before.length) fail(before.join('; '));
  if (route.route !== 'household') fail(`the route '${route.route}', not the household's`);
  const s0 = Date.now(), R = solveRoute(hp, 'household', { pts, light }), s1 = Date.now(), Q = solveHouseholdAt(hp, PA2_FORM, { pts, light }), s2 = Date.now();
  const solveSecs = { APP: 0, ROUTE: (s1 - s0) / 1000, L: 0, PA2: (s2 - s1) / 1000 };
  const digests = { ROUTE: await digestOf(tablesOf(R.tables.household)), PA2: await digestOf(tablesOf(Q.tables.household)) };
  const checks = [];
  // check 1: ROUTE's table the registered read's and the pilot's
  const read = readUnit(READ_DIR, U.id), pilot = readUnit(PILOT_DIR, U.id);
  if (full) {
    if (!read || !pilot) fail('the registered read\'s or the pilot\'s unit file is missing');
    if (read.digests.household !== digests.ROUTE || pilot.digests.household !== digests.ROUTE) fail(`ROUTE's table ${digests.ROUTE}, the registered read's ${read.digests.household}, the pilot's ${pilot.digests.household}: a STOP`);
    if (read.split.k !== R.k) fail(`ROUTE's k ${R.k}, the registered read's ${read.split.k}: a STOP`);
    checks.push(`1 ROUTE's table the registered read's and the pilot's (${digests.ROUTE})`);
  } else checks.push('1 not checked at a smoke\'s points');
  // check 5: PA2's k and allowance
  {
    const pa = E.num(Q.cut.hplan.config.personalAllowance, NaN), one = Q.cut.bands.paOne;
    const cutR = householdCut(E, M, hp, FORM), paRoute = E.num(cutR.hplan.config.personalAllowance, NaN);
    if (Q.k !== R.k || Q.cut.bands.paK || !cutR.bands.paK || Math.abs(pa - 2 * one) > 1e-9 || Math.abs(paRoute - R.k * one) > 1e-6 * one) fail(`PA2's k ${Q.k} (ROUTE's ${R.k}), its allowance ${pa} (two people's ${2 * one}), ROUTE's ${paRoute} (k times one person's ${R.k * one})`);
    checks.push(`5 PA2's k ${Q.k.toFixed(4)} ROUTE's; its allowance ${pa} two people's; ROUTE's ${paRoute.toFixed(2)} k times one person's`);
  }
  const ctxA = E.buildContext(E.resolveMpaa(a.planState)), ctxR = routeContext(R.cp), ctxQ = routeContext(Q.cp);
  if (!ctxA.guardrails || ctxA.lookaheadYears !== 5 || ctxA.raiseCapFrac !== 1.1 || !ctxA.isCouple) fail('APP\'s settings are not arm A\'s');
  const T = ctxR.totalYears, Y = T + 1;
  if (ctxA.totalYears !== T || ctxQ.totalYears !== T) fail(`the arms on different horizons (${ctxA.totalYears}, ${T}, ${ctxQ.totalYears})`);
  const paths = E.pathsForSeed(SEED, n + 1, T).map(zs => Float64Array.from(zs));   // one more path: the plant's donor for the last
  // the recorders: APP's demand a path and year; ROUTE's own level a path and year
  const appDemand = new Float64Array((n + 1) * Y), routeLv = new Float64Array((n + 1) * Y).fill(NaN);
  let cur = -1;
  const recR = levelPolicy(ctxR.policyOverride, null, (t, m) => { if (cur >= 0) routeLv[cur * Y + t] = m.spendLevel !== undefined ? m.spendLevel : 1; });
  const ctxRrec = { ...ctxR, policyOverride: recR };
  // the scheduled target and the fraction on ROUTE's context, a year (the ages do not depend on the path)
  const sched = new Float64Array(Y), frac = new Float64Array(Y).fill(1);
  { const rec = { demand: new Float64Array(Y), age: new Float64Array(Y) }; runRec(ctxR, paths[0], rec); for (let t = 0; t < Y; t++) sched[t] = E.spendTargetAtAge(ctxR, rec.age[t]); frac[0] = ctxR.yf; }
  const appLv = k => { const d = donorOf(k), lv = levelsFromDemand(appDemand.subarray(d * Y, (d + 1) * Y), sched, frac); return t => (Number.isNaN(lv[t]) ? undefined : lv[t]); };
  let srcL = null;
  const ctxL = { ...ctxR, policyOverride: levelPolicy(ctxR.policyOverride, { lv: t => (srcL ? srcL(t) : undefined) }) };
  const ctxOf = { APP: ctxA, ROUTE: ctxR, L: ctxL, PA2: ctxQ };
  const inputs = Object.fromEntries(['APP', 'ROUTE', 'PA2'].map(x => [x, inputsHash(ctxOf[x])]));
  const mpaa = Object.fromEntries(ARMS.map(x => [x, mpaaOf(ctxOf[x])]));
  const arms = {}, Arr = () => Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)]));
  const put = (A, k, r) => { A.survived[k] = r.survived ? 1 : 0; A.failYear[k] = r.failYear; A.pot[k] = r.wealth; A.estate[k] = r.estate; A.tax[k] = r.tax; A.delivered[k] = r.delivered; A.unmet[k] = r.unmet; };
  const timed = (arm, body) => { const c0 = process.cpuUsage(), w0 = performance.now(), l0 = loadavg()[0]; body(); const c = process.cpuUsage(c0); return { cpuUs: c.user + c.system, wallMs: performance.now() - w0, load: [l0, loadavg()[0]], cpu: cpus()[0].model }; };
  // APP first (its demand is L's donor), each path and the one beyond (the plant's donor)
  const A0 = Arr(), tA = timed('APP', () => { for (let k = 0; k <= n; k++) { const rec = { demand: appDemand.subarray(k * Y, (k + 1) * Y), age: new Float64Array(Y) }, r = runRec(ctxA, paths[k], rec); if (k < n) put(A0, k, r); } });
  // ROUTE through the recorder (its own levels, a path and year), and without it on the first CHECK paths
  const R0 = Arr(), tR = timed('ROUTE', () => { for (let k = 0; k <= n; k++) { cur = k; const r = runRec(ctxRrec, paths[k]); if (k < n) put(R0, k, r); } cur = -1; });
  const Rplain = Arr(); for (let k = 0; k < Math.min(CHECK, n); k++) put(Rplain, k, runRec(ctxR, paths[k]));
  const recBad = sameArm(R0, Rplain, Object.keys(KEYS), Math.min(CHECK, n));
  // check 3: L given ROUTE's own levels is ROUTE
  const Lown = Arr();
  for (let k = 0; k < Math.min(CHECK, n); k++) { const d = donorOf(k); srcL = t => { const v = routeLv[d * Y + t]; return Number.isNaN(v) ? undefined : v; }; put(Lown, k, runRec(ctxL, paths[k])); }
  srcL = null;
  const ownBad = sameArm(Lown, R0, Object.keys(KEYS), Math.min(CHECK, n));
  // L on APP's levels, its demand recorded; check 4: L's demand APP's in every year of every path
  const L0 = Arr(), lDemand = new Float64Array(Y);
  let demandBad = 0, demandYears = 0, worst = 0;
  const tL = timed('L', () => { for (let k = 0; k < n; k++) { srcL = appLv(k); const rec = { demand: lDemand, age: new Float64Array(Y) }; put(L0, k, runRec(ctxL, paths[k], rec)); let off = false; for (let t = 0; t < Y; t++) { const x = appDemand[k * Y + t], y = lDemand[t], g = Math.abs(x - y) / Math.max(1, Math.abs(x)); if (x > 0) demandYears++; if (g > worst) worst = g; if (g > 1e-9) off = true; } if (off) demandBad++; } srcL = null; });
  if (process.env.CT_PLANT) {
    // the planted run: report what checks 3 and 4 found and stop, writing nothing (exit 0 when both catch it, 4 when either misses)
    console.log(`PLANTED ${process.env.CT_PLANT}: check 3 ${recBad === 0 && ownBad === 0 ? 'passes' : `fails (${recBad} recorder, ${ownBad} L-own of ${Math.min(CHECK, n)} paths)`}; check 4 ${demandBad === 0 ? 'passes' : `fails (${demandBad} of ${n} paths)`}`);
    process.exit(ownBad > 0 && demandBad > 0 ? 0 : 4);
  }
  const Q0 = Arr(), tQ = timed('PA2', () => { for (let k = 0; k < n; k++) put(Q0, k, runRec(ctxQ, paths[k])); });
  if (recBad || ownBad) fail(`check 3: the recorder parts ROUTE on ${recBad}, L on ROUTE's own levels parts from ROUTE on ${ownBad} of the first ${Math.min(CHECK, n)} paths`);
  checks.push(`3 ROUTE through the recorder ROUTE's, L on ROUTE's own levels ROUTE's, on the first ${Math.min(CHECK, n)} paths`);
  if (demandBad) fail(`check 4: L's demand parts from APP's on ${demandBad} of ${n} paths (the largest gap ${worst.toExponential(2)})`);
  checks.push(`4 L's demand APP's in ${demandYears} years with a demand over ${n} paths, the largest gap ${worst.toExponential(2)}`);
  // check 2: APP and ROUTE the pilot's on its first PILOT_N paths
  if (full) {
    const m = Math.min(PILOT_N, n, pilot.N), dA = sameArm(A0, Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(pilot.arms.APP[k], Ty)])), Object.keys(KEYS), m);
    const dR = sameArm(R0, Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(pilot.arms.ROUTE[k], Ty)])), Object.keys(KEYS), m);
    if (dA || dR) fail(`check 2: APP parts from the pilot on ${dA}, ROUTE on ${dR} of the first ${m} paths: a STOP`);
    checks.push(`2 APP and ROUTE the pilot's on its first ${m} paths`);
  } else checks.push('2 not checked at a smoke\'s points');
  // check 6: each arm held to E.runTrial on its first CHECK paths
  for (const [arm, X] of [['APP', A0], ['ROUTE', R0], ['L', L0], ['PA2', Q0]]) {
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) {
      if (arm === 'L') srcL = appLv(k);
      const q = E.runTrial(ctxOf[arm], paths[k]);
      if (q.survived !== !!X.survived[k] || q.terminalPotNet !== X.estate[k] || q.unmetTotal !== X.unmet[k] || q.lifetimeTax !== X.tax[k]) bad++;
    }
    srcL = null;
    if (bad) fail(`check 6: ${arm} differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`);
  }
  checks.push(`6 each arm E.runTrial's on the first ${Math.min(CHECK, n)} paths`);
  if (js(await digestOf(tablesOf(R.tables.household))) !== js(digests.ROUTE)) fail('ROUTE\'s table changed while the paths ran');
  const yearsWith = Array.from(appDemand.subarray(0, Y)).filter(x => x > 0).length;
  for (const [arm, X, tm] of [['APP', A0, tA], ['ROUTE', R0, tR], ['L', L0, tL], ['PA2', Q0, tQ]]) {
    arms[arm] = { config: configOf(arm), ...tm, solveSecs: solveSecs[arm], inputs: inputs[arm] || null, ...Object.fromEntries(Object.entries(X).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} done ${arm}: config ${arms[arm].config}; engine ${(100 * X.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}; CPU ${(tm.cpuUs / 1e6).toFixed(0)} s (${(tm.cpuUs / 1e3 / n).toFixed(1)} ms a path)`);
  }
  for (const c of checks) console.log(`${''.padEnd(8)} check ${c}`);
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, couple: U.couple, variant: U.variant, cls: U.cls, target: U.target, label: a.label, seed: SEED, N: n, pts, W, stamp: STAMP,
    split: { k: R.k }, caps: R.caps, capsPA2: Q.caps, digests, mpaa, yearsWith, checks, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
