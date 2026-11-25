/*
 * THE HOUSEHOLD ROUTE AT UNEVEN HOLDINGS, THE AUDIT (COUPLES-UNEVEN.md; the deep review of the registered read,
 * reviews/2026-11-25-deep-couples-any.md section 3; EXPLORATORY, seed 7002): S041's 28 units of the registered panel (REG=1,
 * couples-any-registered-panel.json: its 14 kinds at 'own' and 'Y75'), each on N paths of seed 7002 (4,000 unless CU_N) at the
 * app's points and estate weight 0.02, every arm in one process and run by the engine on the same paths:
 *   APP    arm A, the app's rules, as audit-couples-any.mjs runs it
 *   ROUTE  the household route as registered (the form 'pensionsPA', every shape the household plan takes named, the even
 *          split; audit-couples-any.mjs solveRoute), its paths on the page's own context (solvedContext)
 *   PA2    the household plan solved and assembled at the form 'pensions' (its allowance two people's, its bands at k),
 *          everything else ROUTE's
 *   SPLIT  ROUTE's own table, its moves carried out at the pensions' split (cp.split 'pensions': chooseHouseholdSingle,
 *          the remedy's part 2)
 *   FIX    the household plan at the form 'pensionsPAown' (PRICING-FIX.md's candidate A), beside, deciding nothing
 * Checked, a failure ending the unit (exit 3); at the app's points all five, at a smoke's points 3, 4 and 5:
 *   1. ROUTE's household table, solved again, carries the registered run's digest and the pilot's, and its k the run's;
 *   2. APP and ROUTE on the first PILOT_N paths equal the pilot's arrays (results/couples-any-pilot), every key;
 *   3. SPLIT's construction with its split read as 'even' gives ROUTE's arrays bit for bit on the first CHECK paths; and SPLIT
 *      as run parts from ROUTE on some path on every 25/75 unit;
 *   4. PA2's household plan ROUTE's but for its allowance (two people's against k times one person's, its k ROUTE's) and its
 *      tax thresholds, each moved by the allowance's difference (pa2PlanProblems); FIX's ROUTE's but for its incomes, its k and
 *      allowance ROUTE's;
 *   5. each arm's first CHECK paths held to E.runTrial.
 * Before any solve, the unit's own premise as the registered audit checks it (audit-couples-any.mjs unitProblems).
 *   REG=1 node research/solver/audit-couples-uneven.mjs --units
 *   REG=1 node research/solver/audit-couples-uneven.mjs run part k/n     (through the launcher: PREDICTION none:...)
 *   CU_PTS the points and CU_N the paths (a smoke only); CU_ONLY a comma list of unit ids; CU_OUT the folder;
 *   CU_PLANT=splitnoop (a planted fault, run once on a smoke): SPLIT built at the even split, which check 3 must catch
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { appJoint, APP_POINTS } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { runPath, inputsHash } from './audit-phase4.mjs';
import { readAnyPanel, shapeOfUnit, anySolverPlanOf, FORM, TAKES } from './couples-any-panel.mjs';
import { unitProblems, mpaaOf, KEYS, CONFIG as ANY_CONFIG, PILOT_N } from './audit-couples-any.mjs';
import { hashOf } from './candidate.mjs';
import { codeId, codeFiles } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const SEED = 7002, W = 0.02, CHECK = 200, N_DEFAULT = 4000, COUPLE = 'S041';
export const PA2_FORM = 'pensions', FIX_FORM = 'pensionsPAown', SPLIT_RULE = 'pensions';
export const ARMS = Object.freeze(['APP', 'ROUTE', 'PA2', 'SPLIT', 'FIX']);
export const CONFIG = Object.freeze({
  APP: ANY_CONFIG.APP, ROUTE: ANY_CONFIG.ROUTE,
  PA2: { ...ANY_CONFIG.ROUTE, form: PA2_FORM },
  SPLIT: { ...ANY_CONFIG.ROUTE, split: SPLIT_RULE },
  FIX: { ...ANY_CONFIG.ROUTE, form: FIX_FORM }
});
export const configOf = arm => hashOf(CONFIG[arm]);
export const PILOT_DIR = join(HERE, 'results', 'couples-any-pilot'), READ_DIR = join(HERE, 'results', 'couples-any-run');
export const OUT_DEFAULT = join(HERE, 'results', 'couples-uneven-7002');
export const fileOf = id => `${id}.json.gz`;
/* S041's units of the registered panel, in the panel's order */
export const unitsOf = panel => panel.filter(u => u.couple === COUPLE);
/* the stamp: the audit, the read and the batch, the files they import beyond the code, and the panel */
export const STAMP_ROOTS = ['research/solver/audit-couples-uneven.mjs', 'research/solver/reduce-couples-uneven.mjs', 'research/solver/batch-couples-uneven.sh'];
export const STAMP_DATA = ['research/solver/couples-any-registered-panel.json'];
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

/* the household route solved at a form, every shape the household plan takes named, as audit-couples-any.mjs solveRoute solves
   it at FORM (check 1 holds ROUTE's to the registered run's) */
export function solveAt(hp, form, { pts, light }) {
  const opts = { points: pts, ...(light ? { research: light } : {}) };
  const cut = householdCut(E, M, hp, form, { takeShapes: TAKES }), b = cut.bands, joint = appJoint();
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...opts, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast, takeShapes: TAKES }, { plan: cut.hplan, r: H });
  return { cp, cut, k: b.k, caps: [H.estateCap || 0, 0], tables: { household: H } };
}
/* a solved household's context with its moves carried out at `split` ('even' or 'pensions'), the table and all else its own */
export const splitContext = (cp, split) => solvedContext(E, { ...cp, split });
/* the arrays of two arms that differ on a path, on any key, on the first `upTo` paths */
export const sameArm = (P, Q, upTo = Infinity) => {
  let bad = 0;
  const n = Math.min(P.survived.length, Q.survived.length, upTo);
  for (let i = 0; i < n; i++) if (Object.keys(KEYS).some(k => P[k][i] !== Q[k][i] && !(Number.isNaN(P[k][i]) && Number.isNaN(Q[k][i])))) bad++;
  return bad;
};
/* check 4's comparison of PA2's household plan with ROUTE's: the form 'pensions' gives two people's allowance where 'pensionsPA'
   gives k times one person's, and keeps the bands above the allowance at k, so each tax threshold moves by the allowance's
   difference (found on the smoke, 25 Nov, and on all 28 units' plans before any unit ran). The problems: a key outside the
   thresholds that differs, or a threshold moved by another amount */
export const TAX_LIMITS = Object.freeze(['personalAllowance', 'paTaperThreshold', 'basicBandLimit', 'higherBandLimit', 'scotStarterLimit', 'scotBasicLimit', 'scotIntermediateLimit', 'scotHigherLimit', 'scotAdvancedLimit']);
export function pa2PlanProblems(r, q) {
  const out = [], da = E.num(q.config.personalAllowance, NaN) - E.num(r.config.personalAllowance, NaN);
  for (const k of new Set([...Object.keys(r), ...Object.keys(q)])) if (k !== 'config' && js(r[k]) !== js(q[k])) out.push(`${k} differs`);
  for (const k of new Set([...Object.keys(r.config), ...Object.keys(q.config)])) {
    if (js(r.config[k]) === js(q.config[k])) continue;
    if (!TAX_LIMITS.includes(k)) out.push(`config.${k} differs`);
    else if (!(Math.abs((q.config[k] - r.config[k]) - da) <= 1e-6)) out.push(`config.${k} moved by ${q.config[k] - r.config[k]}, the allowance by ${da}`);
  }
  return out;
}
export const withoutIncomes = p => js({ ...p, otherIncomes: null });

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (process.env.REG !== '1') { console.error('audit-couples-uneven: runs on the registered panel, REG=1'); process.exit(2); }
  const only = process.env.CU_ONLY ? new Set(process.env.CU_ONLY.split(',')) : null;
  const units = unitsOf(readAnyPanel()).filter(u => !only || only.has(u.id));
  if (args[0] === '--units') { console.log(units.map(u => u.id).join(' ')); console.log(units.length); process.exit(0); }
  if (args[0] === '--planted') {
    // check 4's comparison on each unit's own two household plans (no solve), then on planted faults in one of them
    const cases = [], pair = U => { const { hp } = anySolverPlanOf(U.plan); return [householdCut(E, M, hp, FORM, { takeShapes: TAKES }).hplan, householdCut(E, M, hp, PA2_FORM, { takeShapes: TAKES }).hplan]; };
    const clean = units.filter(U => pa2PlanProblems(...pair(U)).length === 0).length;
    cases.push([`each unit's PA2 plan ROUTE's but for the allowance and the thresholds it moves`, `${clean} of ${units.length}`, `${units.length} of ${units.length}`]);
    const [r, q] = pair(units.find(u => u.hold === 'Y75'));
    cases.push(['planted: another key of the config changed', pa2PlanProblems(r, { ...q, config: { ...q.config, cgtAnnualExempt: 1 + E.num(q.config.cgtAnnualExempt, 0) } }).join('; '), 'config.cgtAnnualExempt differs']);
    cases.push(['planted: a threshold moved by another amount', String(pa2PlanProblems(r, { ...q, config: { ...q.config, basicBandLimit: q.config.basicBandLimit + 1 } }).length), '1']);
    cases.push(['planted: a key outside the config changed', pa2PlanProblems(r, { ...q, spending: { ...q.spending, targetSpend: 1 + E.num(q.spending.targetSpend, 0) } }).join('; '), 'spending differs']);
    let fails = 0;
    for (const [name, got, want] of cases) { const ok = got === want; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? `: ${got}` : `: got ${got}, want ${want}`}`); }
    console.log(fails ? `FAILED: ${fails} of ${cases.length}` : `ALL PASS: ${cases.length} planted checks`);
    process.exit(fails ? 1 : 0);
  }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (args[0] !== 'run' || !(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-couples-uneven: run part k/${units.length}`); process.exit(2); }
  const pts = Number(process.env.CU_PTS) || APP_POINTS, n = Number(process.env.CU_N) || N_DEFAULT, U = units[pk], full = pts === APP_POINTS;
  const light = !full && pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : null;
  const PLANT = process.env.CU_PLANT || '';
  if (PLANT && PLANT !== 'splitnoop') { console.error(`audit-couples-uneven: CU_PLANT '${PLANT}' (want splitnoop)`); process.exit(2); }
  const OUT = process.env.CU_OUT || OUT_DEFAULT;
  mkdirSync(OUT, { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  console.log(`THE HOUSEHOLD ROUTE AT UNEVEN HOLDINGS, EXPLORATORY (COUPLES-UNEVEN.md): unit ${pk}/${pn}: ${U.id} (${U.kind}, ${U.hold}), target ${U.target}, seed ${SEED}, ${n} paths, ${pts} points${PLANT ? `, PLANTED ${PLANT}` : ''}; configs ${ARMS.map(x => `${x} ${configOf(x)}`).join(', ')}`);
  const t0 = Date.now(), fail = msg => { console.error(`audit-couples-uneven: ${U.id}: ${msg}`); process.exit(3); };
  const { a, hp } = anySolverPlanOf(U.plan), shape = shapeOfUnit(U.plan, U.variant);
  const before = unitProblems(U, a.label, shape);
  if (before.length) fail(before.join('; '));
  const s0 = Date.now(), R = solveAt(hp, FORM, { pts, light }), s1 = Date.now(), Q = solveAt(hp, PA2_FORM, { pts, light }), s2 = Date.now(), F = solveAt(hp, FIX_FORM, { pts, light }), s3 = Date.now();
  const solveSecs = { APP: 0, ROUTE: (s1 - s0) / 1000, PA2: (s2 - s1) / 1000, SPLIT: 0, FIX: (s3 - s2) / 1000 };
  const digests = { ROUTE: await digestOf(tablesOf(R.tables.household)), PA2: await digestOf(tablesOf(Q.tables.household)), FIX: await digestOf(tablesOf(F.tables.household)) };
  console.log(`${''.padEnd(8)} solved: ROUTE ${solveSecs.ROUTE.toFixed(0)} s, PA2 ${solveSecs.PA2.toFixed(0)} s, FIX ${solveSecs.FIX.toFixed(0)} s; k ${R.k.toFixed(4)}; tables ROUTE ${digests.ROUTE.slice(0, 12)}, PA2 ${digests.PA2.slice(0, 12)}, FIX ${digests.FIX.slice(0, 12)}`);
  const checks = [];
  // check 1: ROUTE's table the registered run's and the pilot's, its k the run's
  const read = full ? readUnit(READ_DIR, U.id) : null, pilot = full ? readUnit(PILOT_DIR, U.id) : null;
  if (full) {
    if (!read || !pilot) fail('the registered run\'s or the pilot\'s unit file is missing');
    if (read.digests.household !== digests.ROUTE || pilot.digests.household !== digests.ROUTE) fail(`check 1: ROUTE's table ${digests.ROUTE}, the registered run's ${read.digests.household}, the pilot's ${pilot.digests.household}: a STOP`);
    if (read.split.k !== R.k) fail(`check 1: ROUTE's k ${R.k}, the registered run's ${read.split.k}: a STOP`);
    checks.push(`1 ROUTE's table the registered run's and the pilot's (${digests.ROUTE.slice(0, 12)}), its k the run's`);
  } else checks.push('1 not checked at a smoke\'s points');
  // check 4: PA2's plan ROUTE's but for its allowance; FIX's ROUTE's but for its incomes
  {
    const one = R.cut.bands.paOne, paR = E.num(R.cut.hplan.config.personalAllowance, NaN), paQ = E.num(Q.cut.hplan.config.personalAllowance, NaN), paF = E.num(F.cut.hplan.config.personalAllowance, NaN);
    if (Q.k !== R.k || Q.cut.bands.paK || !R.cut.bands.paK || Math.abs(paQ - 2 * one) > 1e-9 || Math.abs(paR - R.k * one) > 1e-6 * one) fail(`check 4: PA2's k ${Q.k} (ROUTE's ${R.k}), its allowance ${paQ} (two people's ${2 * one}), ROUTE's ${paR} (k times one person's ${R.k * one})`);
    const pp = pa2PlanProblems(R.cut.hplan, Q.cut.hplan);
    if (pp.length) fail(`check 4: PA2's household plan differs from ROUTE's beyond its allowance and the thresholds it moves: ${pp.join('; ')}`);
    if (F.k !== R.k || !F.cut.bands.paK || Math.abs(paF - paR) > 1e-9) fail(`check 4: FIX's k ${F.k} (ROUTE's ${R.k}), its allowance ${paF} (ROUTE's ${paR})`);
    if (withoutIncomes(F.cut.hplan) !== withoutIncomes(R.cut.hplan)) fail('check 4: FIX\'s household plan differs from ROUTE\'s beyond its incomes');
    const own = (F.cut.hplan.otherIncomes || []).filter(i => /^inc_house_partown_/.test(i.id)).length;
    checks.push(`4 PA2's k ${Q.k.toFixed(4)} ROUTE's, its allowance ${paQ} two people's, ROUTE's ${paR.toFixed(2)} k times one person's, its plan ROUTE's but for that and its tax thresholds, each moved by the same ${(paQ - paR).toFixed(2)}; FIX's k and allowance ROUTE's, its plan ROUTE's but for its incomes (${own} years of the partner's own income net)`);
  }
  const ctxA = E.buildContext(E.resolveMpaa(a.planState));
  if (!ctxA.guardrails || ctxA.lookaheadYears !== 5 || ctxA.raiseCapFrac !== 1.1 || ctxA.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0) || !ctxA.isCouple) fail('APP\'s settings are not arm A\'s');
  if (!R.cp.household || !Q.cp.household || !F.cp.household) fail('a solved couple is not a household');
  const ctxR = solvedContext(E, R.cp), ctxQ = solvedContext(E, Q.cp), ctxF = solvedContext(E, F.cp);
  const ctxS = splitContext(R.cp, PLANT === 'splitnoop' ? 'even' : SPLIT_RULE), ctxSeven = splitContext(R.cp, 'even');
  if (ctxR.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0)) fail(`ROUTE's minimum pot ${ctxR.solvencyFloor}, not the unit's ${U.plan.config.solvencyFloor}`);
  const ctxOf = { APP: ctxA, ROUTE: ctxR, PA2: ctxQ, SPLIT: ctxS, FIX: ctxF };
  const T = ctxR.totalYears;
  for (const arm of ARMS) if (ctxOf[arm].totalYears !== T) fail(`${arm} on another horizon (${ctxOf[arm].totalYears}, ${T})`);
  const paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const inputs = Object.fromEntries(ARMS.map(x => [x, inputsHash(ctxOf[x])])), mpaa = Object.fromEntries(ARMS.map(x => [x, mpaaOf(ctxOf[x])]));
  const Arr = () => Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)]));
  const put = (X, k, r) => { X.survived[k] = r.survived ? 1 : 0; X.failYear[k] = r.failYear; X.pot[k] = r.wealth; X.estate[k] = r.estate; X.tax[k] = r.tax; X.delivered[k] = r.delivered; X.unmet[k] = r.unmet; };
  const run = (ctx, upTo = n) => { const X = Arr(), c0 = process.cpuUsage(), w0 = performance.now(), l0 = loadavg()[0]; for (let k = 0; k < upTo; k++) put(X, k, runPath(ctx, paths[k], false)); const c = process.cpuUsage(c0); return { X, tm: { cpuUs: c.user + c.system, wallMs: performance.now() - w0, load: [l0, loadavg()[0]], cpu: cpus()[0].model } }; };
  const res = {};
  for (const arm of ARMS) res[arm] = run(ctxOf[arm]);
  // check 3: SPLIT's construction at the even split is ROUTE; SPLIT as run parts from ROUTE on every 25/75 unit
  {
    const m = Math.min(CHECK, n), even = run(ctxSeven, m).X, evenBad = sameArm(even, res.ROUTE.X, m), parts = sameArm(res.SPLIT.X, res.ROUTE.X);
    if (evenBad) fail(`check 3: SPLIT's construction at the even split parts from ROUTE on ${evenBad} of the first ${m} paths`);
    if (U.hold === 'Y75' && parts === 0) fail(`check 3: SPLIT as run is ROUTE on every one of ${n} paths at 25/75: its split did not reach the moves`);
    checks.push(`3 SPLIT's construction at the even split ROUTE's on the first ${m} paths; SPLIT as run parts from ROUTE on ${parts} of ${n} paths`);
  }
  if (PLANT) { console.log(`PLANTED ${PLANT}: check 3 passed, which it should not`); process.exit(4); }
  // check 2: APP and ROUTE the pilot's on its first PILOT_N paths
  if (full) {
    const m = Math.min(PILOT_N, n, pilot.N), P = arm => Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(pilot.arms[arm][k], Ty)]));
    const dA = sameArm(res.APP.X, P('APP'), m), dR = sameArm(res.ROUTE.X, P('ROUTE'), m);
    if (dA || dR) fail(`check 2: APP parts from the pilot on ${dA}, ROUTE on ${dR} of the first ${m} paths: a STOP`);
    checks.push(`2 APP and ROUTE the pilot's on its first ${m} paths`);
  } else checks.push('2 not checked at a smoke\'s points');
  // check 5: each arm held to E.runTrial on its first CHECK paths
  for (const arm of ARMS) {
    let bad = 0;
    const X = res[arm].X;
    for (let k = 0; k < Math.min(CHECK, n); k++) {
      const q = E.runTrial(ctxOf[arm], paths[k]);
      if (q.survived !== !!X.survived[k] || q.terminalPotNet !== X.estate[k] || q.unmetTotal !== X.unmet[k] || q.lifetimeTax !== X.tax[k]) bad++;
    }
    if (bad) fail(`check 5: ${arm} differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`);
  }
  checks.push(`5 each arm E.runTrial's on the first ${Math.min(CHECK, n)} paths`);
  for (const [w, t] of [['ROUTE', R], ['PA2', Q], ['FIX', F]]) if (await digestOf(tablesOf(t.tables.household)) !== digests[w]) fail(`${w}'s table changed while the paths ran`);
  const arms = {};
  for (const arm of ARMS) {
    const { X, tm } = res[arm];
    arms[arm] = { config: configOf(arm), ...tm, solveSecs: solveSecs[arm], inputs: inputs[arm], ...Object.fromEntries(Object.entries(X).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} done ${arm}: config ${arms[arm].config}; engine ${(100 * X.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}; CPU ${(tm.cpuUs / 1e6).toFixed(0)} s (${(tm.cpuUs / 1e3 / n).toFixed(1)} ms a path)`);
  }
  console.log(`${''.padEnd(8)} MPAA ages: ${ARMS.map(x => `${x} ${mpaa[x].join('/')}`).join(', ')}`);
  for (const c of checks) console.log(`${''.padEnd(8)} check ${c}`);
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, couple: U.couple, variant: U.variant, cls: U.cls, kind: U.kind, hold: U.hold, target: U.target, label: a.label, seed: SEED, N: n, pts, W, stamp: STAMP,
    split: { k: R.k }, ks: { ROUTE: R.k, PA2: Q.k, FIX: F.k }, caps: { ROUTE: R.caps, PA2: Q.caps, FIX: F.caps }, digests, mpaa, checks, arms })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
