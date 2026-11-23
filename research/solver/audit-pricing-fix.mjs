/*
 * THE HOUSEHOLD PLAN'S PRICE OF A PARTNER'S INCOME, THE AUDIT (PRICING-FIX.md; D143; EXPLORATORY, seed 7002): fourteen units,
 * the couples trade's thirteen (the registered panel's, REG=1: S037's ten distinct household-route units and three controls)
 * and S191-90 (the share rules' panel's S191 held 90/10, on which step 8's arm read flagged the allowance doubled, HSP,
 * results-household-arm.txt), each on N paths of seed 7002 (4,000 unless PF_N) at the app's points and estate weight 0.02,
 * every arm in one process and run by the engine on the same paths:
 *   APP    arm A, the app's rules, as audit-couples-open.mjs runs it
 *   ROUTE  the household plan as the app solves and runs it (audit-couples-open.mjs solveRoute; the form 'pensionsPA', the
 *          couples' default)
 *   FIX    the household plan solved and assembled at the form 'pensionsPAown' (PRICING-FIX.md, candidate A: the partner's
 *          fixed taxable income taxed alone at one person's rules and handed to the household person net), everything else
 *          ROUTE's (audit-couples-trade.mjs solveHouseholdAt)
 * Checked, a failure ending the unit (exit 3); at the app's points all four, at a smoke's points 3 and 4:
 *   1. on the thirteen, ROUTE's household table solved again carries the registered read's digest and the pilot's, and its k
 *      the read's; on S191-90, its route the household's, its k below 1.2 and a partner's state pension (the class);
 *   2. on the thirteen, APP and ROUTE equal the couples trade's arrays (results/couples-trade-7002) on every path, every key,
 *      so that ROUTE's shortfall is the trade's; on S191-90, APP and ROUTE against the household arm read's APP and HSPA
 *      (results/household-arm-7002), printed beside, deciding nothing;
 *   3. FIX's k ROUTE's, its allowance k times one person's as ROUTE's, and FIX's household plan ROUTE's but for its incomes;
 *   4. each arm's first CHECK paths held to E.runTrial.
 *   REG=1 node research/solver/audit-pricing-fix.mjs --units
 *   REG=1 node research/solver/audit-pricing-fix.mjs run part k/n     (through the launcher: PREDICTION none:...)
 *   PF_PTS the points and PF_N the paths (a smoke only); PF_ONLY a comma list of unit ids; PF_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { householdCut } from '../../src/solverCouple.js';
import { pensionsSplit } from '../../src/solver/household.js';
import { APP_POINTS } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { inputsHash } from './audit-phase4.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { readOpenPanel, routeOf, guardOf, FORM } from './couples-open-panel.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { solveRoute, routeContext, unitProblems, mpaaOf, KEYS, CONFIG as OPEN_CONFIG } from './audit-couples-open.mjs';
import { UNITS as TRADE_UNITS, solveHouseholdAt, runRec } from './audit-couples-trade.mjs';
import { hashOf } from './candidate.mjs';
import { codeId, codeFiles } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const SEED = 7002, W = 0.02, CHECK = 200, N_DEFAULT = 4000, FIX_FORM = 'pensionsPAown';
export const S191 = 'S191-90';
export const UNITS = Object.freeze([...TRADE_UNITS, S191]);
export const ARMS = Object.freeze(['APP', 'ROUTE', 'FIX']);
export const CONFIG = Object.freeze({ APP: OPEN_CONFIG.APP, ROUTE: OPEN_CONFIG.ROUTE, FIX: { ...OPEN_CONFIG.ROUTE, form: FIX_FORM } });
export const configOf = arm => hashOf(CONFIG[arm]);
export const PILOT_DIR = join(HERE, 'results', 'couples-open-pilot'), READ_DIR = join(HERE, 'results', 'couples-open-run');
export const TRADE_DIR = join(HERE, 'results', 'couples-trade-7002'), ARM_DIR = join(HERE, 'results', 'household-arm-7002');
export const OUT_DEFAULT = join(HERE, 'results', 'pricing-fix-7002');
export const fileOf = id => `${id}.json.gz`;
/* the stamp: the audit, the read and the batch, the files they import beyond the code, and the panels */
export const STAMP_ROOTS = ['research/solver/audit-pricing-fix.mjs', 'research/solver/reduce-pricing-fix.mjs', 'research/solver/batch-pricing-fix.sh'];
export const STAMP_DATA = ['research/solver/couples-open-registered-panel.json', 'research/solver/share-rules-panel.json'];
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
const readUnit = (dir, id) => { const f = join(dir, fileOf(id).replace(/@/g, '_')); return existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; };
const armArrays = x => Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)]));
/* the paths on which two arms differ in any key, over the first upTo */
const pathsApart = (P, Q, upTo = Infinity) => {
  let bad = 0;
  const n = Math.min(P.survived.length, Q.survived.length, upTo);
  for (let i = 0; i < n; i++) if (Object.keys(KEYS).some(k => P[k][i] !== Q[k][i] && !(Number.isNaN(P[k][i]) && Number.isNaN(Q[k][i])))) bad++;
  return bad;
};
/* a unit's plan and the arm A it was landed on: the registered panel's thirteen as the couples trade takes them, S191-90 from
   the share rules' panel */
export function unitsOf(only = null) {
  const panel = readOpenPanel(), share = readSharePanel();
  return UNITS.filter(id => !only || only.has(id)).map(id => {
    if (id === S191) { const s = share.find(x => x.id === id); return s ? { id, couple: 'S191', variant: s.variant, cls: null, target: s.target, plan: s.plan, registered: false } : null; }
    const u = panel.find(x => x.id === id);
    return u ? { ...u, registered: true } : null;
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (process.env.REG !== '1') { console.error('audit-pricing-fix: runs on the registered panel, REG=1'); process.exit(2); }
  const only = process.env.PF_ONLY ? new Set(process.env.PF_ONLY.split(',')) : null, units = unitsOf(only);
  if (units.some(u => !u)) { console.error('audit-pricing-fix: a unit is not in its panel'); process.exit(2); }
  if (args[0] === '--units') { console.log(units.map(u => u.id).join(' ')); console.log(units.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (args[0] !== 'run' || !(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-pricing-fix: run part k/${units.length}`); process.exit(2); }
  const pts = Number(process.env.PF_PTS) || APP_POINTS, n = Number(process.env.PF_N) || N_DEFAULT, U = units[pk], full = pts === APP_POINTS;
  const light = !full && pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : null;
  const OUT = process.env.PF_OUT || OUT_DEFAULT;
  mkdirSync(OUT, { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  console.log(`THE PRICING FIX, EXPLORATORY (PRICING-FIX.md): unit ${pk}/${pn}: ${U.id} (${U.variant}), seed ${SEED}, ${n} paths, ${pts} points`);
  const t0 = Date.now(), fail = msg => { console.error(`audit-pricing-fix: ${U.id}: ${msg}`); process.exit(3); };
  const { a, hp } = solverPlanOf(U.plan, 'own'), guard = guardOf(U.plan), route = routeOf(hp);
  if (U.registered) { const before = unitProblems(U, a.label, guard, route); if (before.length) fail(before.join('; ')); }
  if (route.route !== 'household') fail(`the route '${route.route}', not the household's`);
  const s0 = Date.now(), R = solveRoute(hp, 'household', { pts, light }), s1 = Date.now(), Q = solveHouseholdAt(hp, FIX_FORM, { pts, light }), s2 = Date.now();
  const solveSecs = { APP: 0, ROUTE: (s1 - s0) / 1000, FIX: (s2 - s1) / 1000 };
  const digests = { ROUTE: await digestOf(tablesOf(R.tables.household)), FIX: await digestOf(tablesOf(Q.tables.household)) };
  const checks = [];
  // check 1: on the thirteen, ROUTE's table the registered read's and the pilot's; on S191-90, the class
  if (U.registered) {
    if (full) {
      const read = readUnit(READ_DIR, U.id), pilot = readUnit(PILOT_DIR, U.id);
      if (!read || !pilot) fail('the registered read\'s or the pilot\'s unit file is missing');
      if (read.digests.household !== digests.ROUTE || pilot.digests.household !== digests.ROUTE) fail(`ROUTE's table ${digests.ROUTE}, the registered read's ${read.digests.household}, the pilot's ${pilot.digests.household}: a STOP`);
      if (read.split.k !== R.k) fail(`ROUTE's k ${R.k}, the registered read's ${read.split.k}: a STOP`);
      checks.push(`1 ROUTE's table the registered read's and the pilot's (${digests.ROUTE}), its k the read's`);
    } else checks.push('1 not checked at a smoke\'s points');
  } else {
    const k = pensionsSplit(E, hp).k, sp = E.num(hp.demographics.statePensionPart, 0);
    if (!(k < 1.2) || !(sp > 0)) fail(`S191-90 out of the class: k ${k}, the partner's state pension ${sp}`);
    checks.push(`1 ${U.id} on the household route, k ${k.toFixed(4)} below 1.2, the partner's state pension ${sp} (the class)`);
  }
  // check 3: FIX's k and allowance ROUTE's, its plan ROUTE's but for its incomes
  {
    const cutR = householdCut(E, M, hp, FORM), one = cutR.bands.paOne, paR = E.num(cutR.hplan.config.personalAllowance, NaN), paQ = E.num(Q.cut.hplan.config.personalAllowance, NaN);
    const strip = p => js({ ...p, otherIncomes: null });
    if (Q.k !== R.k || !Q.cut.bands.paK || !cutR.bands.paK || Math.abs(paQ - paR) > 1e-9 || Math.abs(paR - R.k * one) > 1e-6 * one) fail(`FIX's k ${Q.k} (ROUTE's ${R.k}), its allowance ${paQ} (ROUTE's ${paR}, k times one person's ${R.k * one})`);
    if (strip(Q.cut.hplan) !== strip(cutR.hplan)) fail('FIX\'s household plan differs from ROUTE\'s beyond its incomes');
    const own = (Q.cut.hplan.otherIncomes || []).filter(i => /^inc_house_partown_/.test(i.id)).length;
    checks.push(`3 FIX's k ${Q.k.toFixed(4)} and allowance ${paQ.toFixed(2)} ROUTE's; its plan ROUTE's but for its incomes (${own} years of the partner's own income net)`);
  }
  const ctxA = E.buildContext(E.resolveMpaa(a.planState)), ctxR = routeContext(R.cp), ctxQ = routeContext(Q.cp);
  if (!ctxA.guardrails || ctxA.lookaheadYears !== 5 || ctxA.raiseCapFrac !== 1.1 || !ctxA.isCouple) fail('APP\'s settings are not arm A\'s');
  const T = ctxR.totalYears, Y = T + 1;
  if (ctxA.totalYears !== T || ctxQ.totalYears !== T) fail(`the arms on different horizons (${ctxA.totalYears}, ${T}, ${ctxQ.totalYears})`);
  const paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const ctxOf = { APP: ctxA, ROUTE: ctxR, FIX: ctxQ };
  const inputs = Object.fromEntries(ARMS.map(x => [x, inputsHash(ctxOf[x])]));
  const mpaa = Object.fromEntries(ARMS.map(x => [x, mpaaOf(ctxOf[x])]));
  const Arr = () => Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)]));
  const put = (A, k, r) => { A.survived[k] = r.survived ? 1 : 0; A.failYear[k] = r.failYear; A.pot[k] = r.wealth; A.estate[k] = r.estate; A.tax[k] = r.tax; A.delivered[k] = r.delivered; A.unmet[k] = r.unmet; };
  const timed = body => { const c0 = process.cpuUsage(), w0 = performance.now(), l0 = loadavg()[0]; body(); const c = process.cpuUsage(c0); return { cpuUs: c.user + c.system, wallMs: performance.now() - w0, load: [l0, loadavg()[0]], cpu: cpus()[0].model }; };
  const X = Object.fromEntries(ARMS.map(x => [x, Arr()])), tm = {};
  const recA = { demand: new Float64Array(Y), age: new Float64Array(Y) };
  for (const arm of ARMS) tm[arm] = timed(() => { for (let k = 0; k < n; k++) put(X[arm], k, runRec(ctxOf[arm], paths[k], arm === 'APP' && k === 0 ? recA : null)); });
  const yearsWith = Array.from(recA.demand).filter(x => x > 0).length;
  // check 2: on the thirteen, APP and ROUTE the couples trade's on every path; on S191-90, against the household arm read's (beside)
  if (U.registered) {
    if (full) {
      const tr = readUnit(TRADE_DIR, U.id);
      if (!tr) fail('the couples trade\'s unit file is missing');
      if (tr.N !== n || tr.seed !== SEED || tr.pts !== pts) fail(`the couples trade's unit ran ${tr.N} paths of ${tr.seed} at ${tr.pts} points`);
      const dA = pathsApart(X.APP, armArrays(tr.arms.APP)), dR = pathsApart(X.ROUTE, armArrays(tr.arms.ROUTE));
      if (dA || dR) fail(`check 2: APP parts from the couples trade's on ${dA}, ROUTE on ${dR} of ${n} paths: a STOP`);
      if (tr.yearsWith !== yearsWith) fail(`check 2: APP's years with a demand ${yearsWith}, the couples trade's ${tr.yearsWith}: a STOP`);
      checks.push(`2 APP and ROUTE the couples trade's on all ${n} paths, every key`);
    } else checks.push('2 not checked at a smoke\'s points');
  } else {
    const ar = full ? readUnit(ARM_DIR, U.id) : null;
    const beside = ar && ar.N === n ? `APP ${pathsApart(X.APP, armArrays(ar.arms.APP))}, ROUTE against HSPA ${pathsApart(X.ROUTE, armArrays(ar.arms.HSPA))} of ${n} paths apart (beside, deciding nothing)` : 'the household arm read\'s unit not compared';
    checks.push(`2 ${U.id} against the household arm read's (code ${ar ? ar.stamp.code : '-'}): ${beside}`);
  }
  // check 4: each arm held to E.runTrial on its first CHECK paths
  for (const arm of ARMS) {
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) {
      const q = E.runTrial(ctxOf[arm], paths[k]), A = X[arm];
      if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++;
    }
    if (bad) fail(`check 4: ${arm} differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`);
  }
  checks.push(`4 each arm E.runTrial's on the first ${Math.min(CHECK, n)} paths`);
  if (js(await digestOf(tablesOf(R.tables.household))) !== js(digests.ROUTE)) fail('ROUTE\'s table changed while the paths ran');
  const arms = {};
  for (const arm of ARMS) {
    arms[arm] = { config: configOf(arm), ...tm[arm], solveSecs: solveSecs[arm], inputs: inputs[arm], ...Object.fromEntries(Object.entries(X[arm]).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} done ${arm}: config ${arms[arm].config}; engine ${(100 * X[arm].survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}; CPU ${(tm[arm].cpuUs / 1e6).toFixed(0)} s (${(tm[arm].cpuUs / 1e3 / n).toFixed(1)} ms a path)`);
  }
  for (const c of checks) console.log(`${''.padEnd(8)} check ${c}`);
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, couple: U.couple, variant: U.variant, cls: U.cls, registered: U.registered, target: U.target, label: a.label, seed: SEED, N: n, pts, W, stamp: STAMP,
    split: { k: R.k }, caps: R.caps, capsFIX: Q.caps, digests, mpaa, yearsWith, checks, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
