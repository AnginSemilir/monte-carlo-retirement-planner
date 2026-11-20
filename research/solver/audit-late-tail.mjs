/*
 * THE LATE TAIL, THE AUDIT (LATE-TAIL.md; D134 (1); the deep review of step 8, section 3; EXPLORATORY): ten of step 8's
 * units on seed 7002, 4,000 paths, at 45 points and the estate weight 0.02, each built as step 8's audit built it
 * (audit-household-hsp.mjs: arm A's plan, K2 by CPL.solveCouple with JOINT, HSPA by solveHousehold at HSPA's form, the even
 * split, arm A's MPAA ages), each arm run by the engine on the same paths, in one process a unit:
 *   APP   arm A, the app's rules; it ranks the markets for the read
 *   K2    today's couples' default, as step 8's
 *   HSPA  the household plan, as step 8's
 *   L     HSPA's move with K2's spending level: each year K2's joint move is asked at L's own engine state and its level
 *         taken, everything else HSPA's
 *   R     HSPA's move with each person's tiers as K2's move holds them at that state
 *   CEIL  the household table on its own plan (bridge.js withTable on the household plan, built inside HSPA's priced bands,
 *         household.mjs householdBands), as the decomposition's CEIL
 * Each arm records per path its survival, year of failure, end pot, estate, lifetime tax, spending delivered and unmet
 * spending; each table arm also each year's level taken and risk held at the decision (audit-household.mjs whyRecord's
 * measure: the held tiers' expected real return, in basis points) and each year's tax.
 * Checked, a failure ending the unit (exit 3): step 8's solve checks (audit-household-hsp.mjs solveProblems); on the units
 * step 8's pilot ran, K2 and HSPA equal to the pilot's arrays on its first 1,000 paths; on each unit's first CHECK paths a
 * variant taking none of K2's move equal to HSPA bit for bit and one taking all of it equal to K2, L's level K2's and R's
 * tiers K2's at every decision, and each arm held to E.runTrial. Each arm is saved in chunks of 1,000 and resumes from them.
 *   node research/solver/audit-late-tail.mjs --units
 *   node research/solver/audit-late-tail.mjs run part k/n           (through the launcher, PREDICTION none:...)
 *   node research/solver/audit-late-tail.mjs --planted
 *   LT_PTS the points and LT_N the paths (a smoke only); LT_ONLY a comma list of units; LT_OUT the folder;
 *   LT_PLANT=wronglevel (a planted fault: L takes HSPA's own level)
 * AMENDMENT 1 (20 Nov; LATE-TAIL.md, its amendment 1; the reviewer at the first read, finding 1): `recorded` passes the
 * engine's every argument to the policy it records (it dropped the third, the tiers held, which a single's table reads:
 * bridge.js tablePolicy, so CEIL charged nothing for a switch). Check 5, a check of that class: each recorded arm run equal
 * bit for bit to the same arm without the recorder on its first CHECK paths. LT_ARMS a comma list of the arms to run (all
 * by default; the wiring and pilot checks need the arms they compare, so run only with every arm); LT_FIRST the first
 * run's folder, against whose K2, HSPA, L and R (each run again without the recorder on its first CHECK paths) the unit is
 * held where those arms are not run. LT_PLANT=recorderdrop (a planted fault: the recorder dropping the tiers held again).
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { solveHousehold, householdSinglePolicy, householdBands, pensionsSplit } from './household.mjs';
import { inputsHash } from './audit-phase4.mjs';
import { JOINT, householdSolveOne } from './audit-household.mjs';
import { solveProblems, configOf as hspConfigOf, KEYS, TOPK } from './audit-household-hsp.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { readHspPanel, guardOf, HOUSE_OPTS, PANEL } from './household-hsp-panel.mjs';
import { codeId, codeFiles } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg, hostname } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const UNITS = Object.freeze(['S025-45', 'S273-own', 'S273-sppart', 'S357F-45', 'S357F-db', 'S357F-gap8', 'S357F-own', 'S273-90', 'S349F-own', 'S355F-own']);
export const BELOW = Object.freeze(UNITS.slice(0, 7)), M1_UNIT = 'S273-90', CONTROLS = Object.freeze(['S349F-own', 'S355F-own']);
export const SEED = 7002, N = 4000, PTS = 45, W = 0.02, CHECK = 200, PILOT_CHECK = 1000, CHUNK = 1000, WARM = 3;
export const ARMS = Object.freeze(['APP', 'K2', 'HSPA', 'L', 'R', 'CEIL']);
export const TABLE_ARMS = Object.freeze(['K2', 'HSPA', 'L', 'R', 'CEIL']);
export const TAKES = Object.freeze({ L: 'level', R: 'tiers' });
export const PILOT_DIR = join(HERE, 'results', 'household-hsp-pilot');
export const orderOf = k => [...ARMS.slice(k % ARMS.length), ...ARMS.slice(0, k % ARMS.length)];
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const fileOf = id => `${id}.json.gz`;
export const YEAR_KEYS = Object.freeze({ level: Uint8Array, risk: Int16Array, taxYear: Float32Array });
const js = x => JSON.stringify(x);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
export const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };

/*
 * THE STAMP: every file the run and its read take beyond the code (code-id.mjs codeFiles), found by following the imports
 * of the audit and the read to the end (a shell script read only for the solver scripts it names), and the data they read.
 */
export const STAMP_ROOTS = ['research/solver/audit-late-tail.mjs', 'research/solver/reduce-late-tail.mjs', 'research/solver/batch-late-tail.sh'];
export const STAMP_DATA = ['research/solver/household-hsp-panel.json', 'research/solver/LATE-TAIL.md'];
export function stampFiles(root = REPO, read = f => readFileSync(join(root, f), 'utf8'), exists = f => existsSync(join(root, f))) {
  const code = new Set(codeFiles(root)), seen = new Set(STAMP_ROOTS), queue = [...STAMP_ROOTS], out = [...STAMP_ROOTS];
  while (queue.length) {
    const f = queue.shift();
    if (!exists(f)) continue;
    if (/\.m?js$/.test(f)) for (const m of read(f).matchAll(/(?:from\s+|import\s*\(\s*|import\s+|require\s*\(\s*|new\s+URL\s*\(\s*)['"]([^'"]+)['"]/g)) {
      if (!m[1].startsWith('.')) continue;
      const rel = relative(root, join(root, dirname(f), m[1])).split('\\').join('/');
      if (/^new\s/.test(m[0]) && !/\.m?js$/.test(m[1]) && !exists(rel)) continue;
      if (rel.startsWith('..') || seen.has(rel)) continue;
      seen.add(rel);
      if (!code.has(rel)) out.push(rel);
      if (/\.m?js$/.test(rel)) queue.push(rel);
    }
    if (/\.sh$/.test(f)) for (const m of read(f).matchAll(/research\/solver\/([\w.-]+\.mjs)/g)) { const rel = `research/solver/${m[1]}`; if (!seen.has(rel)) { seen.add(rel); out.push(rel); queue.push(rel); } }
  }
  return [...new Set([...out.sort(), ...STAMP_DATA])];
}
export function stampFilesHash(root = REPO) {
  const h = createHash('sha256');
  for (const f of stampFiles(root)) h.update(f).update(existsSync(join(root, f)) ? readFileSync(join(root, f)) : 'missing');
  return h.digest('hex').slice(0, 12);
}

/* the variants: HSPA's move with one part of K2's, both choosers asked at the same engine state every year whatever is kept
   ('none' keeps HSPA's whole move, 'all' K2's whole move); `watch(t, out, h, k)` sees each decision */
const tiersPart = po => ({ tierPen: (po && po.tierPen) || 0, tierIsa: (po && po.tierIsa) || 0, tierPenName: po ? po.tierPenName : undefined, tierIsaName: po ? po.tierIsaName : undefined });
export function variantPolicy(hPol, kPol, take, watch = null) {
  if (!['none', 'all', 'level', 'tiers'].includes(take)) throw new Error(`variantPolicy: take '${take}'`);
  return {
    kind: 'table',
    choose(es, t) {
      const h = hPol.choose(es, t), k = kPol.choose(es, t);
      let out;
      if (take === 'none') out = h;
      else if (take === 'all') out = k;
      else if (take === 'level') out = { ...h, spendLevel: process.env.LT_PLANT === 'wronglevel' ? h.spendLevel : k.spendLevel };
      else out = { ...h, perOwner: { self: { ...h.perOwner.self, ...tiersPart(k.perOwner.self) }, part: { ...h.perOwner.part, ...tiersPart(k.perOwner.part) } } };
      if (watch) watch(t, out, h, k);
      return out;
    },
    switchCost: take === 'all' ? kPol.switchCost : hPol.switchCost,
    tiersBelow: take === 'all' ? kPol.tiersBelow : hPol.tiersBelow
  };
}
/* does a decision take what its variant says from K2's move? (the check of LATE-TAIL.md, 3) */
export const levelOf = j => (j.spendLevel !== undefined ? j.spendLevel : 1);
export const tiersKey = j => ['self', 'part'].map(w => `${(j.perOwner[w] && j.perOwner[w].tierPen) || 0}/${(j.perOwner[w] && j.perOwner[w].tierIsa) || 0}`).join(' ');
export function takesRight(take, out, k) {
  if (take === 'level') return levelOf(out) === levelOf(k);
  if (take === 'tiers') return tiersKey(out) === tiersKey(k);
  return true;
}
/* a policy recording, at each decision of path sink.k, the level it takes and the risk the held tiers carry (whyRecord's
   measure, in basis points of expected real return) */
export function recorded(pol, m, sink) {
  return { ...pol, choose(es, t, ...rest) {
    // amendment 1: every argument the engine passes (a single's table reads the third, the tiers held); the plant drops it
    const j = process.env.LT_PLANT === 'recorderdrop' ? pol.choose(es, t) : pol.choose(es, t, ...rest), tierHeld = {};
    for (const o of m.ctx.owners) { const h = es.tierHeld && es.tierHeld[o.key]; tierHeld[o.key] = { pen: h ? h.pen || 0 : 0, isa: h ? h.isa || 0 : 0 }; }
    const ms = { pots: es.pots, tierHeld };
    let w = 0, r = 0;
    for (const acc of m.ctx.accounts) { const v = es.pots[acc.id] || 0; if (v > 0) { w += v; r += v * M.profileOf(m, ms, acc).real; } }
    if (sink && sink.k >= 0) { const i = sink.k * sink.Y + t; sink.level[i] = Math.min(255, Math.round(100 * levelOf(j))); sink.risk[i] = w > 0 ? Math.round(10000 * r / w) : 0; }
    return j;
  } };
}
/* one path by the engine (audit-phase4.mjs runPath's rule, line for line), each year's tax into sink.taxYear */
export function runRec(ctx, zs, sink = null) {
  const state = E.freshState(ctx), T = ctx.totalYears, Y = T + 1, zPath = zs.length > Y ? zs[Y] : 0;
  let failed = false, failYear = -1, unmet = 0, tax = 0, delivered = 0, last = null;
  for (let t = 0; t <= T; t++) {
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    const tx = row.taxPaid + (row.cgtPaid || 0);
    tax += tx; if (sink && sink.k >= 0) sink.taxYear[sink.k * Y + t] = tx;
    const u = Math.max(0, row.unmetDemand || 0); unmet += u;
    if (row.targetSpend > 0) delivered += Math.max(0, row.targetSpend - u);
    if (!failed && (row.unmetDemand > E.FAIL_TOLERANCE || row.preNmpaInsolvent)) { failed = true; failYear = t; }
    last = row;
  }
  const wealth = Math.max(0, last.totalCombined);
  if (!failed && ctx.solvencyFloor > 0 && wealth < ctx.solvencyFloor) { failed = true; failYear = T; }
  const estate = Math.max(0, wealth - Math.max(0, last.pensions) * ctx.pensionDeathTaxRate);
  return { survived: !failed, failYear, wealth, estate, unmet, tax, delivered };
}
const same = (A, B, n) => { for (const k of Object.keys(KEYS)) for (let i = 0; i < n; i++) if (!Object.is(A[k][i], B[k][i])) return `${k} at path ${i}`; return null; };

function planted() {
  const cases = [];
  // stub choosers: HSPA's move at level 0.9 on tiers 1/1 and 2/2, K2's at level 1.0 on tiers 0/1 and 3/0
  const mv = (lv, s, p) => ({ spendLevel: lv, steps: ['x'], perOwner: { self: { steps: ['x'], tierPen: s[0], tierIsa: s[1], tierPenName: `n${s[0]}`, tierIsaName: `n${s[1]}` }, part: { steps: ['y'], tierPen: p[0], tierIsa: p[1], tierPenName: `n${p[0]}`, tierIsaName: `n${p[1]}` } } });
  const calls = { h: 0, k: 0 }, hPol = { kind: 'table', choose: () => (calls.h++, mv(0.9, [1, 1], [2, 2])), switchCost: 0.001, tiersBelow: 3 }, kPol = { kind: 'table', choose: () => (calls.k++, mv(1.0, [0, 1], [3, 0])), switchCost: 0.002, tiersBelow: 2 };
  const pick = take => variantPolicy(hPol, kPol, take).choose({}, 0);
  { const n = pick('none'), a = pick('all'), l = pick('level'), r = pick('tiers');
    cases.push(['the variants: none HSPA\'s move, all K2\'s, level HSPA\'s with K2\'s level, tiers HSPA\'s with K2\'s tiers', `${levelOf(n)} ${tiersKey(n)} | ${levelOf(a)} ${tiersKey(a)} | ${levelOf(l)} ${tiersKey(l)} ${l.steps[0]} | ${levelOf(r)} ${tiersKey(r)} ${r.perOwner.self.steps[0]}`, '0.9 1/1 2/2 | 1 0/1 3/0 | 1 1/1 2/2 x | 0.9 0/1 3/0 x']);
    cases.push(['every variant asks both choosers each year, whatever it keeps', `${calls.h} ${calls.k}`, '4 4']);
    cases.push(['the switch charge and the tier steps HSPA\'s but where all of K2\'s move is kept', `${variantPolicy(hPol, kPol, 'level').switchCost} ${variantPolicy(hPol, kPol, 'all').switchCost} ${variantPolicy(hPol, kPol, 'tiers').tiersBelow}`, '0.001 0.002 3']); }
  { let bad = 0; const watch = take => (t, out, h, k) => { if (!takesRight(take, out, k)) bad++; };
    variantPolicy(hPol, kPol, 'level', watch('level')).choose({}, 0); variantPolicy(hPol, kPol, 'tiers', watch('tiers')).choose({}, 0);
    const plant = process.env.LT_PLANT; process.env.LT_PLANT = 'wronglevel'; let caught = 0;
    variantPolicy(hPol, kPol, 'level', (t, out, h, k) => { if (!takesRight('level', out, k)) caught++; }).choose({}, 0);
    if (plant === undefined) delete process.env.LT_PLANT; else process.env.LT_PLANT = plant;
    cases.push(['the check of what each variant takes: none wrong as built; the planted wrong level caught', `${bad} ${caught}`, '0 1']); }
  { let threw = false; try { variantPolicy(hPol, kPol, 'split'); } catch { threw = true; }
    cases.push(['a variant taking an unknown part refused', `${threw}`, 'true']); }
  { const files = stampFiles(), missing = files.filter(f => !existsSync(join(REPO, f)) && !/^research\/solver\/(reduce-late-tail\.mjs|batch-late-tail\.sh)$/.test(f));
    cases.push(['the stamp: no file in it missing (the read and the batch aside while they are built)', missing.join(', ') || 'none', 'none']); }
  { const a = Float64Array.from([1, 2]), b = Float64Array.from([1, 2]), u = { survived: Uint8Array.from([1, 0]), failYear: Int16Array.from([-1, 3]), pot: a, estate: a, tax: a, delivered: a, unmet: a }, v = { ...u, tax: Float64Array.from([1, 2.0000001]) };
    cases.push(['the identity check: equal arrays the same; one value apart named', `${same(u, { ...u, pot: b }, 2)} ${same(u, v, 2)}`, 'null tax at path 1']); }
  // amendment 1: the recorder hands its policy every argument the engine passes; the plant drops the third again
  { const seen = [], stub = { kind: 'table', choose: (...a) => (seen.push(a.length), { spendLevel: 1 }) }, m = { ctx: { owners: [], accounts: [] } };
    recorded(stub, m, null).choose({ pots: {} }, 0, { pen: 1, isa: 0 });
    const plant = process.env.LT_PLANT; process.env.LT_PLANT = 'recorderdrop';
    recorded(stub, m, null).choose({ pots: {} }, 0, { pen: 1, isa: 0 });
    if (plant === undefined) delete process.env.LT_PLANT; else process.env.LT_PLANT = plant;
    cases.push(['the recorder hands the policy the engine\'s three arguments; the planted recorder two', seen.join(' '), '3 2']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit(planted() ? 1 : 0);
  const panel = readHspPanel(), byId = Object.fromEntries(panel.map(u => [u.id, u]));
  if (UNITS.some(id => !byId[id])) { console.error(`audit-late-tail: not in step 8's panel: ${UNITS.filter(id => !byId[id]).join(', ')}`); process.exit(2); }
  const only = process.env.LT_ONLY ? new Set(process.env.LT_ONLY.split(',')) : null, units = UNITS.filter(id => !only || only.has(id)).map(id => byId[id]);
  if (args[0] === '--units') { units.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(units.length); process.exit(0); }
  if (args[0] !== 'run') { console.error('audit-late-tail: run part k/n, --units or --planted'); process.exit(2); }
  // on the code step 8's panel was landed on (the launch's): another code would need the pilot's check to mean otherwise
  { const pc = JSON.parse(readFileSync(PANEL, 'utf8')).code, cc = codeId(); if (!cc || cc.hash !== pc) { console.error(`audit-late-tail: the code ${cc ? cc.hash : 'unknown'} is not step 8's (${pc})`); process.exit(2); } }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-late-tail: part k/${units.length}`); process.exit(2); }
  const pts = Number(process.env.LT_PTS) || PTS, n = Number(process.env.LT_N) || N, smoke = pts !== PTS || n !== N, U = units[pk];
  const OUT = process.env.LT_OUT || join(HERE, 'results', 'late-tail-7002');
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  // amendment 1: LT_ARMS the arms to run (every arm by default), in the unit's order; LT_FIRST the first run's folder
  const RUN = process.env.LT_ARMS ? process.env.LT_ARMS.split(',') : [...ARMS];
  if (!RUN.length || RUN.some(a => !ARMS.includes(a)) || new Set(RUN).size !== RUN.length) { console.error(`audit-late-tail: LT_ARMS ${process.env.LT_ARMS}`); process.exit(2); }
  const whole = RUN.length === ARMS.length, FIRST = process.env.LT_FIRST || null;
  if (!whole && !FIRST) { console.error('audit-late-tail: a run of some arms alone names the first run\'s folder (LT_FIRST)'); process.exit(2); }
  const PROC = `${hostname()}:${process.pid}:${Date.now()}`, t0 = Date.now(), order = orderOf(pk).filter(a => RUN.includes(a));
  console.log(`THE LATE TAIL (EXPLORATORY): unit ${pk}/${pn}: ${U.id} (${U.cohort}, ${U.variant}), seed ${SEED}, ${n} paths, ${pts} points, estate weight ${W}; K2 ${hspConfigOf('K2')}, HSPA ${hspConfigOf('HSPA')}; the order ${order.join(', ')}${whole ? '' : ` (the arms run: ${RUN.join(', ')}; the rest the first run's, ${relative(REPO, FIRST)})`}${smoke ? '; a smoke' : ''}; node ${process.version}`);
  // the unit as step 8's audit built it
  const { a, hp } = solverPlanOf(U.plan, 'own'), sp = pensionsSplit(E, hp), guard = guardOf(U.plan);
  const light = smoke && pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const k = js([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  const s0 = Date.now(), k2 = CPL.solveCouple(E, M, hp, { solveOne, ...JOINT }), s1 = Date.now();
  const house = solveHousehold(E, M, hp, { solveOne: householdSolveOne(pts, light), topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast, ...HOUSE_OPTS }), s2 = Date.now();
  const off = solveProblems({ U, a, hp, k2, house, sp, guard, smoke });
  if (off.length) { console.error(`audit-late-tail: ${U.id}: ${off.join('; ')}`); process.exit(3); }
  const solveSecs = { K2: (s1 - s0) / 1000, HSPA: (s2 - s1) / 1000 };
  const digests = { self: await digestOf(tablesOf(k2.tables.self)), part: await digestOf(tablesOf(k2.tables.part)), household: await digestOf(tablesOf(house.H)) };
  console.log(`${''.padEnd(8)} solved: K2 ${solveSecs.K2.toFixed(0)} s, HSPA ${solveSecs.HSPA.toFixed(0)} s; the pensions' split s ${sp.s.toFixed(4)}, k ${sp.k.toFixed(4)}`);
  const aDemo = E.resolveMpaa(a.planState).demographics, withAges = plan => ({ ...plan, demographics: { ...plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
  const cpHouse = { ...house, split: 'even', counts: { decisions: 0, far: 0, down: 0 } }, hPol = householdSinglePolicy(cpHouse), kPol = CPL.couplePolicy(k2);
  const planWith = (plan, pol) => ({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...plan.spending, policyOverride: pol } });
  // each arm's engine context, its table arms' policies recording into `sink`, the variants' decisions into `seenTake`
  const seenTake = { L: 0, R: 0 }, cur = { k: -1 };
  // `bare` (amendment 1, check 5): the same arm without the recorder (and a variant without its watch)
  const ctxOf = (arm, sink = null, bare = false) => {
    const rec = (pol, m) => (bare ? pol : recorded(pol, m, sink));
    if (arm === 'APP') {
      const ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || ctx.lookaheadYears !== 5 || ctx.raiseCapFrac !== 1.1 || !ctx.isCouple) { console.error(`audit-late-tail: ${U.id} APP: guardrails ${ctx.guardrails}, lookahead ${ctx.lookaheadYears}, raise cap ${ctx.raiseCapFrac}`); process.exit(3); }
      return ctx;
    }
    if (arm === 'K2') return E.buildContext(planWith(withAges(k2.plan), rec(kPol, k2.m)));
    if (arm === 'HSPA') return E.buildContext(planWith(withAges(house.plan), rec(hPol, house.m)));
    if (arm === 'L' || arm === 'R') {
      const take = TAKES[arm], watch = (t, out, h, k) => { if (cur.k >= 0 && cur.k < CHECK && !takesRight(take, out, k)) seenTake[arm]++; };
      return E.buildContext(planWith(withAges(house.plan), rec(variantPolicy(hPol, kPol, take, bare ? null : watch), house.m)));
    }
    if (arm === 'NONE') return E.buildContext(planWith(withAges(house.plan), variantPolicy(hPol, kPol, 'none')));
    if (arm === 'ALL') return E.buildContext(planWith(withAges(k2.plan), variantPolicy(hPol, kPol, 'all')));
    if (arm === 'CEIL') return householdBands(E, house.hopts, () => { const pc = withTable(house.hplan, house.H); return E.buildContext({ ...pc, spending: { ...pc.spending, policyOverride: rec(pc.spending.policyOverride, house.hm) } }); });
    throw new Error(`audit-late-tail: arm ${arm}`);
  };
  const T = ctxOf('K2').totalYears, Y = T + 1, paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs));
  const inputs = { K2: inputsHash(ctxOf('K2')), HSPA: inputsHash(ctxOf('HSPA')) };
  // the household's first year of spending (its first retirement), on APP's first path: the plan's, the same on every path
  const firstSpend = (() => { const ctx = ctxOf('APP'), st = E.freshState(ctx), zs = paths[0], zPath = zs.length > Y ? zs[Y] : 0; for (let t = 0; t <= T; t++) { if (E.stepYear(ctx, st, t, { z: zs[t], zPath }).targetSpend > 0) return t; } return T + 1; })();
  // the first m paths of an arm without its recorder, as KEYS arrays (check 5, amendment 1)
  const runBare = (arm, m) => {
    const ctx = ctxOf(arm, null, true), A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(m)]));
    for (let k = 0; k < m; k++) { const r = runRec(ctx, paths[k], null); A.survived[k] = r.survived ? 1 : 0; A.failYear[k] = r.failYear; A.pot[k] = r.wealth; A.estate[k] = r.estate; A.tax[k] = r.tax; A.delivered[k] = r.delivered; A.unmet[k] = r.unmet; }
    return A;
  };
  const bareChecks = {};
  const arms = {};
  for (const arm of order) {
    const table = TABLE_ARMS.includes(arm), sink = table ? { k: -1, Y, level: new Uint8Array(n * Y), risk: new Int16Array(n * Y), taxYear: new Float32Array(n * Y) } : null;
    const ctx = ctxOf(arm, sink), pf = partOf(OUT, U.id, arm);
    if (ctx.totalYears !== T) { console.error(`audit-late-tail: ${U.id} ${arm}: another horizon (${ctx.totalYears}, ${T})`); process.exit(3); }
    let A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)])), done = 0, chunks = [];
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (P.stamp.code === STAMP.code && P.stamp.audit === STAMP.audit && P.stamp.node === STAMP.node && P.N === n && P.pts === pts && js(P.digests) === js(digests)) {
        A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arrays[k], Ty)])); done = P.done; chunks = P.chunks;
        if (table) for (const [k, Ty] of Object.entries(YEAR_KEYS)) sink[k] = dec(P.years[k], Ty);
        if (arm === 'L' || arm === 'R') seenTake[arm] = P.seenTakeArm || 0;
        console.log(`${''.padEnd(8)} resumed ${arm} at path ${done} of ${n}`);
      } else console.log(`${''.padEnd(8)} a saved part of ${arm} is not this unit's as solved now: ${arm} starts again`);
    }
    if (done < n) for (let k = 0; k < Math.min(WARM, n); k++) runRec(ctx, paths[k], null);
    while (done < n) {
      const to = Math.min(n, done + CHUNK), load0 = loadavg()[0], c0 = process.cpuUsage(), w0 = performance.now();
      for (let k = done; k < to; k++) {
        cur.k = k; if (sink) sink.k = k;
        const r = runRec(ctx, paths[k], sink);
        A.survived[k] = r.survived ? 1 : 0; A.failYear[k] = r.failYear; A.pot[k] = r.wealth; A.estate[k] = r.estate; A.tax[k] = r.tax; A.delivered[k] = r.delivered; A.unmet[k] = r.unmet;
      }
      cur.k = -1; if (sink) sink.k = -1;
      const c = process.cpuUsage(c0);
      chunks.push({ from: done, to, cpuUs: c.user + c.system, wallMs: performance.now() - w0, load: [load0, loadavg()[0]], cpu: cpus()[0].model, proc: PROC });
      done = to;
      const tmp = `${pf}.tmp`;
      writeFileSync(tmp, gzipSync(js({ stamp: STAMP, N: n, pts, digests, done, chunks, seenTakeArm: seenTake[arm] || 0, arrays: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])), years: table ? Object.fromEntries(Object.keys(YEAR_KEYS).map(k => [k, b64(sink[k])])) : null })));
      renameSync(tmp, pf);
    }
    // the engine: the first CHECK paths held to E.runTrial
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-late-tail: ${U.id} ${arm}: the run differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    if ((arm === 'L' || arm === 'R') && seenTake[arm]) { console.error(`audit-late-tail: ${U.id} ${arm}: ${seenTake[arm]} decisions of the first ${CHECK} paths not taking K2's ${TAKES[arm]}`); process.exit(3); }
    // check 5 (amendment 1): a recorded arm the same arm without its recorder, bit for bit on its first CHECK paths
    if (table) {
      const d = same(A, runBare(arm, Math.min(CHECK, n)), Math.min(CHECK, n));
      if (d) { console.error(`audit-late-tail: ${U.id} ${arm}: the recorded arm differs from the same arm without the recorder (${d})`); process.exit(3); }
      bareChecks[arm] = `equal without the recorder on ${Math.min(CHECK, n)} paths`;
    }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0);
    arms[arm] = { n, cpuUs, wallMs: chunks.reduce((t, x) => t + x.wallMs, 0), chunks, place: order.indexOf(arm), solveSecs: solveSecs[arm] || 0, ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])), ...(table ? { Y, years: Object.fromEntries(Object.keys(YEAR_KEYS).map(k => [k, b64(sink[k])])) } : {}) };
    console.log(`${''.padEnd(8)} done ${arm}: CPU ${(cpuUs / 1e3 / n).toFixed(1)} ms a path`);
  }
  // the variants' wiring: none of K2's move is HSPA, all of it K2, bit for bit on the first CHECK paths
  const decode = A => Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(A[k], Ty)]));
  const wire = {};
  // amendment 1: where some arms alone are run, the first run's K2, HSPA, L and R (not run now) each run again without the
  // recorder on its first CHECK paths and held to the first run's arrays bit for bit, its household table the first run's
  let first = null;
  if (!whole) {
    const F = JSON.parse(gunzipSync(readFileSync(join(FIRST, fileOf(U.id)))).toString()), m = Math.min(CHECK, n, F.N);
    if (F.stamp.code !== STAMP.code || F.seed !== SEED || F.N !== n || F.pts !== pts || F.digests.household !== digests.household || F.T !== T || F.firstSpend !== firstSpend) { console.error(`audit-late-tail: ${U.id}: the first run's unit is not this one as solved now (code, seed, paths, points, household table, horizon or first year)`); process.exit(3); }
    for (const arm of ['K2', 'HSPA', 'L', 'R'].filter(a => !RUN.includes(a))) {
      const d = same(runBare(arm, m), decode(F.arms[arm]), m);
      if (d) { console.error(`audit-late-tail: ${U.id} ${arm}: the first run's arm differs from the same arm without the recorder (${d})`); process.exit(3); }
      bareChecks[`first ${arm}`] = `the first run's equal without the recorder on ${m} paths`;
    }
    first = { audit: F.stamp.audit, household: F.digests.household };
  }
  if (whole) for (const [w, like] of [['NONE', 'HSPA'], ['ALL', 'K2']]) {
    const ctx = ctxOf(w), m = Math.min(CHECK, n), A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(m)]));
    for (let k = 0; k < m; k++) { const r = runRec(ctx, paths[k], null); A.survived[k] = r.survived ? 1 : 0; A.failYear[k] = r.failYear; A.pot[k] = r.wealth; A.estate[k] = r.estate; A.tax[k] = r.tax; A.delivered[k] = r.delivered; A.unmet[k] = r.unmet; }
    const d = same(A, decode(arms[like]), m);
    if (d) { console.error(`audit-late-tail: ${U.id}: the variant taking ${w === 'NONE' ? 'none' : 'all'} of K2's move is not ${like} (${d})`); process.exit(3); }
    wire[w] = `${like} on ${m} paths`;
  }
  // step 8's pilot: K2 and HSPA equal to its arrays on its first 1,000 paths, where it ran this unit (a STOP otherwise)
  let pilot = whole ? 'not in the pilot' : 'not run: some arms alone';
  if (whole && !smoke && existsSync(join(PILOT_DIR, fileOf(U.id)))) {
    const P = JSON.parse(gunzipSync(readFileSync(join(PILOT_DIR, fileOf(U.id)))).toString()), m = Math.min(PILOT_CHECK, n, P.N);
    if (P.stamp.code !== STAMP.code || P.seed !== SEED || P.pts !== pts) { console.error(`audit-late-tail: ${U.id}: step 8's pilot is not on this code, seed and points`); process.exit(3); }
    for (const arm of ['K2', 'HSPA']) {
      const d = same(decode(arms[arm]), decode(P.arms[arm]), m);
      if (d) { console.error(`audit-late-tail: STOP: ${U.id} ${arm} differs from step 8's pilot (${d})`); process.exit(3); }
    }
    pilot = `K2 and HSPA equal to step 8's pilot on ${m} paths`;
  }
  console.log(`${''.padEnd(8)} checks: ${whole ? `${wire.NONE}; ${wire.ALL}; L and R take K2's part at every decision of the first ${Math.min(CHECK, n)} paths; ${pilot}` : `the arms run ${RUN.join(', ')}`}; check 5: ${Object.entries(bareChecks).map(([a, x]) => `${a} ${x}`).join('; ')}`);
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, variant: U.variant, cohort: U.cohort, seed: SEED, N: n, pts, W, stamp: STAMP, digests, configs: { K2: hspConfigOf('K2'), HSPA: hspConfigOf('HSPA') }, inputs, split: { s: sp.s, k: sp.k }, floor: k2.m.ctx.solvencyFloor, caps: [k2.tables.self.estateCap || 0, k2.tables.part.estateCap || 0], T, Y, firstSpend, order, armsRun: RUN, checks: { wire, pilot, takes: seenTake, bare: bareChecks, first }, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, U.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
