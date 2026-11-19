/*
 * STEP 8, THE AUDIT (STEP8.md; registrations/household-hsp.md, DRAFT; D129 (3)): each unit of household-hsp-panel.json run
 * under three arms at estate weight 0.02 and 45 points, in one process, each by the engine on the same paths of the unit's
 * seed, in the order ARMS rotated by the unit's number:
 *   APP  arm A, the app's rules, on the plan as entered (guardrails, the five-year lookahead and the raise cap checked);
 *   K2   today's couples' default as the app solves a couple: each person's table at the couples' candidate
 *        (audit-couples-share.mjs COUPLES_CANDIDATE), the joint move JOINT (the pots' share and LOOKHOLD), arm A's MPAA ages,
 *        as the lead test's K2 (audit-household.mjs);
 *   HSP  the household plan priced at the pensions' split: one household table at the candidate with its tie-break
 *        (audit-household.mjs householdSolveOne), its plan householdPlanFor's with scale 'pensions' (each band above two
 *        personal allowances and the tax-free cash cap at k = 1 / s, its band for gains k times one person's), the year's
 *        move household.mjs chooseHouseholdSingle at the even split, as the remedy's read ran it (audit-household-remedy.mjs).
 * Checked before any path, a failure ending the unit (exit 3): arm A's pick the landing's; the app's guard on
 * (src/couplesSwitch.js coupleSolverOn); each person's settings and the household table's (audit-couples.mjs wantProblems
 * 'CANDC'); the household table's line against the first person's (audit-shapes.mjs unitLineProblems, as amended); the
 * household's minimum pot; the couples' path and D80; HSP's plan part 1's with the cap (audit-household-remedy.mjs
 * scaleProblems) and its band for gains k times one person's. Each arm's first CHECK paths are held to E.runTrial. K2's first
 * BESIDE paths are run by the couples' rollout in the exact model beside the engine (a fidelity gap reported, not deciding).
 * Each arm is saved in chunks of 1,000 and resumes from them. Under the registration a log carries no outcome.
 *   node research/solver/audit-household-hsp.mjs --units [pilot]
 *   node research/solver/audit-household-hsp.mjs registered part k/n     the registered run (through the launcher only)
 *   node research/solver/audit-household-hsp.mjs pilot part k/n          the pilot: seed 7002, PILOT_N paths, its units
 *   node research/solver/audit-household-hsp.mjs --planted               the checks on planted inputs
 *   HH_PTS the points (smoke only); HH_N the paths (pilot or smoke); HH_ONLY a comma list of unit ids (pilot or smoke);
 *   HH_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveHousehold, withHouseholdSingle, mergedState, pensionsSplit, householdPlanFor } from './household.mjs';
import { vecOf } from '../../src/solver/grid.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { runPath, inputsHash } from './audit-phase4.mjs';
import { JOINT, householdSolveOne, lineOf } from './audit-household.mjs';
import { scaleProblems } from './audit-household-remedy.mjs';
import { unitLineProblems } from './audit-shapes.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { wantProblems, coupleProblems, d80Of, d80Problems } from './audit-couples.mjs';
import { COUPLES_CANDIDATE, settingsOf } from './audit-couples-share.mjs';
import { readHspPanel, guardOf, HSP_OPTS, PANEL } from './household-hsp-panel.mjs';
import { APP_CANDIDATE } from '../../src/solverSettings.js';
import { hashOf } from './candidate.mjs';
import { codeId, codeFiles } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg, hostname } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const SEED = 7024, PILOT_SEED = 7002, PTS = 45, W = 0.02, CHECK = 200, BESIDE = 500, PILOT_N = 1000, WARM = 3, CHUNK = 1000, TOPK = 3;
export const ARMS = ['APP', 'K2', 'HSP'];
export const REGISTRATION = 'research/solver/registrations/household-hsp.md';
export const PATHS_FILE = join(HERE, 'household-hsp-paths.json');
export const orderOf = k => [...ARMS.slice(k % ARMS.length), ...ARMS.slice(0, k % ARMS.length)];
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const fileOf = id => `${id}.json.gz`;
/* each arm's configuration, hashed as candidate.mjs hashes the candidate's */
export const CONFIG = Object.freeze({
  APP: { app: 'armA', tournament: false },
  K2: { ...COUPLES_CANDIDATE, ...JOINT },
  HSP: { ...APP_CANDIDATE, household: 'A', move: 'single', split: 'even', scale: HSP_OPTS.scale, topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast }
});
export const configOf = arm => hashOf(CONFIG[arm]);
/* the pilot: every unit of three couples, the library's places 0 and 2 and the younger cohort's place 1 */
export const PILOT_PLACES = [['lib', 0], ['lib', 2], ['young', 1]];
export const pilotUnits = panel => panel.filter(u => PILOT_PLACES.some(([c, p]) => u.cohort === c && u.place === p));
/*
 * THE STAMP (as the share rules' audit's): every file the run and its read take beyond the code (code-id.mjs codeFiles),
 * found by following the imports of the audit, the read, the sizing, the panel's script and the batch to the end, and the
 * data files they read: the panel, its frozen orders and the paths. `read` and `exists` are the planted checks' way in.
 */
export const STAMP_ROOTS = ['research/solver/audit-household-hsp.mjs', 'research/solver/reduce-household-hsp.mjs', 'research/solver/size-household-hsp.mjs', 'research/solver/household-hsp-panel.mjs', 'research/solver/batch-household-hsp.sh'];
export const STAMP_DATA = ['research/solver/household-hsp-panel.json', 'research/solver/household-hsp-orders.json', 'research/solver/household-hsp-paths.json'];
export function stampFiles(root = REPO, read = f => readFileSync(join(root, f), 'utf8'), exists = f => existsSync(join(root, f))) {
  const code = new Set(codeFiles(root)), seen = new Set(STAMP_ROOTS), queue = [...STAMP_ROOTS], out = [...STAMP_ROOTS];
  while (queue.length) {
    const f = queue.shift();
    if (!exists(f)) continue;
    for (const m of read(f).matchAll(/(?:from\s+|import\s*\(\s*|import\s+|require\s*\(\s*|new\s+URL\s*\(\s*)['"]([^'"]+)['"]/g)) {
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
const js = x => JSON.stringify(x);
export const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
/* arm A's pick against the landing's, and the app's guard (on: K2 is what the app runs for the unit) */
export const pickGuardProblems = (U, a, guard) => [...(a.label !== U.label ? [`arm A's pick ${a.label} differs from the landing's ${U.label}`] : []), ...(!guard.on ? [`the app's guard keeps the unit on the app's rules (${guard.why})`] : [])];
/* the problems the unit's solves show before any path (the header's list); smoke at a smoke's settings. The settings, the
   household line and HSP's plan checks have their planted cases in their own files (audit-couples.mjs, audit-shapes.mjs
   --planted, reduce-household-remedy.mjs --planted, household.test.mjs group 10) */
export function solveProblems({ U, a, hp, k2, house, sp, guard, smoke }) {
  const off = [...pickGuardProblems(U, a, guard)];
  if (!smoke) {
    for (const w of ['self', 'part']) off.push(...wantProblems('CANDC', settingsOf(k2.tables[w]), W).map(p => `${w}: ${p}`));
    off.push(...wantProblems('CANDC', settingsOf(house.H), W).map(p => `household: ${p}`));
  }
  off.push(...unitLineProblems(k2, house, hp));
  if (k2.m.ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0)) off.push(`the household's minimum pot ${k2.m.ctx.solvencyFloor}, not the unit's ${U.plan.config.solvencyFloor}`);
  if (house.m.ctx.solvencyFloor !== k2.m.ctx.solvencyFloor) off.push(`the household table's minimum pot ${house.m.ctx.solvencyFloor}, not K2's ${k2.m.ctx.solvencyFloor}`);
  const cfg = { ...E.DEFAULT_CONFIG, ...(hp.config || {}) };
  off.push(...scaleProblems(house.hplan, householdPlanFor(E, hp), cfg, sp.k, true).map(p => `HSP's plan: ${p}`));
  if (!(house.meta.scale && house.meta.scale.rule === HSP_OPTS.scale && Math.abs(house.meta.scale.k - sp.k) < 1e-12)) off.push(`HSP's table solved with ${js(house.meta.scale)}, not k ${sp.k}`);
  if (!(Math.abs(house.H.m.ctx.P.cgtBandWidth - sp.k * k2.m.ctx.P.cgtBandWidth) < 1e-6)) off.push(`HSP's band for gains ${house.H.m.ctx.P.cgtBandWidth}, not k x ${k2.m.ctx.P.cgtBandWidth}`);
  off.push(...coupleProblems(), ...d80Problems(d80Of(undefined, [k2.tables.self, k2.tables.part])));
  return off;
}

async function planted() {
  const cases = [], panel = readHspPanel();
  cases.push(['the three configurations differ', ARMS.map(configOf).every((c, i, x) => x.indexOf(c) === i) ? 'three' : 'NOT three', 'three']);
  cases.push(['K2\'s carries no tie-break; HSP\'s the candidate\'s', `${'tieAboveCap' in CONFIG.K2} ${CONFIG.HSP.tieAboveCap === APP_CANDIDATE.tieAboveCap}`, 'false true']);
  cases.push(['the arms\' order rotates with the unit', [0, 1, 2, 3].map(k => orderOf(k)[0]).join(','), 'APP,K2,HSP,APP']);
  cases.push(['the pilot\'s units: every unit of the library\'s places 0 and 2 and the younger cohort\'s place 1',
    pilotUnits([{ id: 'a', cohort: 'lib', place: 0 }, { id: 'b', cohort: 'lib', place: 1 }, { id: 'c', cohort: 'lib', place: 2 }, { id: 'd', cohort: 'young', place: 1 }, { id: 'e', cohort: 'young', place: 0 }]).map(u => u.id).join(','), 'a,c,d']);
  { const f = stampFiles(), need = ['research/solver/reduce-share-rules.mjs', 'research/solver/fair-gate.mjs', 'research/solver/stats.mjs', 'research/solver/household.mjs', 'src/solverApp.js', 'src/solverSettings.js', 'src/couplesSwitch.js', ...STAMP_DATA];
    cases.push(['the stamp holds the read\'s library, the household plan, the guard and the data files, and none of the code\'s own', `${need.every(x => f.includes(x))} ${f.some(x => x === 'research/engine.mjs' || x.startsWith('src/solver/'))}`, 'true false']);
    const text = rel => readFileSync(join(REPO, rel), 'utf8'), q = name => ['\'', './', name, '\''].join('');
    const lines = ['\n', 'import', ' ', q('planted-dep.mjs'), ';\nconst x = await ', 'import', '(', q('planted-dyn.mjs'), ');\n'].join('');
    const isPlanted = rel => /planted-(dep|dyn)\.mjs$/.test(rel), read = rel => (isPlanted(rel) ? '' : rel === 'research/solver/reduce-household-hsp.mjs' ? (existsSync(join(REPO, rel)) ? text(rel) : '') + lines : text(rel)), exists = rel => isPlanted(rel) || existsSync(join(REPO, rel));
    const g = stampFiles(REPO, read, exists);
    cases.push(['a planted import in the read, static or dynamic, joins the stamp', `${g.includes('research/solver/planted-dep.mjs')} ${g.includes('research/solver/planted-dyn.mjs')}`, 'true true']); }
  // arm A's pick and the guard, on planted inputs: each fault caught by its own problem, a clean unit by none
  { const U = { label: 'ISA First' }, ok = { label: 'ISA First' }, on = { on: true };
    cases.push(['a clean unit: no problem', `${pickGuardProblems(U, ok, on).length}`, '0']);
    cases.push(['arm A\'s pick not the landing\'s is caught', pickGuardProblems(U, { label: 'Bracket Fill' }, on).join(';'), 'arm A\'s pick Bracket Fill differs from the landing\'s ISA First']);
    cases.push(['the guard off is caught', pickGuardProblems(U, ok, { on: false, why: 'gapincome' }).join(';'), 'the app\'s guard keeps the unit on the app\'s rules (gapincome)']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit((await planted()) ? 1 : 0);
  const panel = readHspPanel();
  if (args[0] === '--units') { const us = args[1] === 'pilot' ? pilotUnits(panel) : panel; us.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(us.length); process.exit(0); }
  const REGISTERED = args[0] === 'registered', PILOT = args[0] === 'pilot';
  if (!REGISTERED && !PILOT) { console.error('audit-household-hsp: registered part k/n, or pilot part k/n'); process.exit(2); }
  if (REGISTERED && (process.env.HH_PTS || process.env.HH_N || process.env.HH_ONLY || process.env.HH_OUT)) { console.error('audit-household-hsp: the registered run takes no limits'); process.exit(2); }
  if (REGISTERED && process.env.PREDICTION_FILE !== REGISTRATION) { console.error(`audit-household-hsp: the registered run runs only under ${REGISTRATION}, through the launcher (PREDICTION_FILE ${process.env.PREDICTION_FILE || 'unset'})`); process.exit(2); }
  // the registered run only on the code the panel was landed on: a change of code means landing again, a new pilot and review
  if (REGISTERED) { const pc = JSON.parse(readFileSync(PANEL, 'utf8')).code, cc = codeId(); if (!cc || cc.hash !== pc) { console.error(`audit-household-hsp: the code ${cc ? cc.hash : 'unknown'} is not the code the panel was landed on (${pc})`); process.exit(2); } }
  const seed = REGISTERED ? SEED : PILOT_SEED, reg = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')) : null;
  const only = process.env.HH_ONLY ? new Set(process.env.HH_ONLY.split(',')) : null;
  const units = (PILOT ? pilotUnits(panel) : panel).filter(u => !only || only.has(u.id));
  if (REGISTERED && units.some(u => !(reg.paths[u.id] > 0))) { console.error(`audit-household-hsp: ${PATHS_FILE} gives no paths for ${units.filter(u => !(reg.paths[u.id] > 0)).map(u => u.id).join(', ')}`); process.exit(2); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-household-hsp: part k/${units.length}`); process.exit(2); }
  const pts = Number(process.env.HH_PTS) || PTS, U = units[pk], n = REGISTERED ? reg.paths[U.id] : Number(process.env.HH_N) || PILOT_N;
  const smoke = pts !== PTS, OUT = process.env.HH_OUT || join(HERE, 'results', REGISTERED ? 'household-hsp-run' : 'household-hsp-pilot');
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  const PROC = `${hostname()}:${process.pid}:${Date.now()}`, t0 = Date.now(), order = orderOf(pk);
  console.log(`STEP 8${REGISTERED ? '' : ' (THE PILOT, EXPLORATORY)'}: unit ${pk}/${pn}: ${U.id} (${U.cohort}, ${U.variant}), target ${U.target}, seed ${seed}, ${n} paths, ${pts} points, estate weight ${W}; configs ${ARMS.map(x => `${x} ${configOf(x)}`).join(', ')}; the order ${order.join(', ')}; node ${STAMP.node}`);
  const { a, hp } = solverPlanOf(U.plan, 'own'), sp = pensionsSplit(E, hp), guard = guardOf(U.plan);
  const light = smoke && pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const memo = new Map();
  const solveOne = (p, o) => { const k = js([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
  const s0 = Date.now(), k2 = CPL.solveCouple(E, M, hp, { solveOne, ...JOINT }), s1 = Date.now();
  const house = solveHousehold(E, M, hp, { solveOne: householdSolveOne(pts, light), topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast, ...HSP_OPTS }), s2 = Date.now();
  const solveSecs = { APP: 0, K2: (s1 - s0) / 1000, HSP: (s2 - s1) / 1000 };
  const off = solveProblems({ U, a, hp, k2, house, sp, guard, smoke });
  if (off.length) { console.error(`audit-household-hsp: ${U.id}: ${off.join('; ')}`); process.exit(3); }
  const digest = async () => ({ self: await digestOf(tablesOf(k2.tables.self)), part: await digestOf(tablesOf(k2.tables.part)), household: await digestOf(tablesOf(house.H)) });
  const before = await digest();
  const survAt = (tab, s) => (tab.mix ? tab.mix.tables.reduce((x, tb, j) => x + tab.mix.weights[j] * tb.value(s, 0).survival, 0) : tab.value(s, 0).survival);
  const st0 = M.initialState(k2.m), forecast = { APP: null, HSP: survAt(house.H, vecOf(house.hm, mergedState(house, st0))) };
  { const sA = vecOf(k2.tables.self.m, CPL.ownerState(st0, 'self')), sB = vecOf(k2.tables.part.m, CPL.ownerState(st0, 'part')); forecast.K2 = survAt(k2.tables.self, sA) * survAt(k2.tables.part, sB); }
  console.log(`${''.padEnd(8)} solved: K2 ${solveSecs.K2.toFixed(0)} s, HSP ${solveSecs.HSP.toFixed(0)} s; K2's share ${k2.share}; the pensions' split s ${sp.s.toFixed(4)}, k ${sp.k.toFixed(4)}; the guard ${guard.on ? 'on' : 'off'}`);
  const aDemo = E.resolveMpaa(a.planState).demographics, withAges = plan => ({ ...plan, demographics: { ...plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
  const cpHSP = { ...house, split: 'even', counts: { decisions: 0, far: 0, down: 0 } };
  const ctxOf = arm => {
    if (arm === 'APP') {
      const ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || ctx.lookaheadYears !== 5 || ctx.raiseCapFrac !== 1.1 || ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0) || !ctx.isCouple) { console.error(`audit-household-hsp: ${U.id} APP: guardrails ${ctx.guardrails}, lookahead ${ctx.lookaheadYears}, raise cap ${ctx.raiseCapFrac}, minimum pot ${ctx.solvencyFloor}, couple ${ctx.isCouple}`); process.exit(3); }
      return ctx;
    }
    if (arm === 'K2') return E.buildContext(CPL.withCouple(withAges(k2.plan), k2));
    return E.buildContext(withHouseholdSingle(withAges(house.plan), cpHSP));
  };
  const T = ctxOf('K2').totalYears, paths = E.pathsForSeed(seed, n, T).map(zs => Float64Array.from(zs));
  const inputs = Object.fromEntries(ARMS.map(x => [x, inputsHash(ctxOf(x))])), arms = {};
  for (const arm of order) {
    const ctx = ctxOf(arm), pf = partOf(OUT, U.id, arm), o = { config: configOf(arm) };
    if (ctx.totalYears !== T) { console.error(`audit-household-hsp: ${U.id} ${arm}: another horizon (${ctx.totalYears}, ${T})`); process.exit(3); }
    let A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)])), done = 0, chunks = [];
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (P.stamp.code === STAMP.code && P.stamp.audit === STAMP.audit && P.stamp.prediction === STAMP.prediction && P.seed === seed && P.N === n && P.pts === pts && js(P.digests) === js(before) && js(P.options) === js(o)) {
        A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arrays[k], Ty)])); done = P.done; chunks = P.chunks;
        console.log(`${''.padEnd(8)} resumed ${arm} at path ${done} of ${n}, from a part saved by ${[...new Set(chunks.map(c => c.proc))].join(', ')}`);
      } else console.log(`${''.padEnd(8)} a saved part of ${arm} is not this unit's as solved now: ${arm} starts again`);
    }
    if (done < n) for (let k = 0; k < Math.min(WARM, n); k++) runPath(ctx, paths[k], false);
    while (done < n) {
      const to = Math.min(n, done + CHUNK), load0 = loadavg()[0], c0 = process.cpuUsage(), w0 = performance.now();
      for (let k = done; k < to; k++) {
        const r = runPath(ctx, paths[k], false);
        A.survived[k] = r.survived ? 1 : 0; A.failYear[k] = r.failYear; A.pot[k] = r.wealth; A.estate[k] = r.estate; A.tax[k] = r.tax; A.delivered[k] = r.delivered; A.unmet[k] = r.unmet;
      }
      const c = process.cpuUsage(c0);
      chunks.push({ from: done, to, cpuUs: c.user + c.system, wallMs: performance.now() - w0, load: [load0, loadavg()[0]], cpu: cpus()[0].model, proc: PROC });
      done = to;
      const tmp = `${pf}.tmp`;
      writeFileSync(tmp, gzipSync(js({ stamp: STAMP, seed, N: n, pts, digests: before, options: o, done, chunks, arrays: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) })));
      renameSync(tmp, pf);
    }
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-household-hsp: ${U.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0), procs = [...new Set(chunks.map(x => x.proc))];
    arms[arm] = { ...o, cpuUs, wallMs: chunks.reduce((t, x) => t + x.wallMs, 0), chunks, procs, cpus: [...new Set(chunks.map(x => x.cpu))], place: order.indexOf(arm), solveSecs: solveSecs[arm], forecast: forecast[arm], inputs: inputs[arm], ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    // under the registration a log carries no outcome: its stamp, its settings, its timings and its done line
    console.log(`${''.padEnd(8)} done ${arm}: config ${o.config}; ${REGISTERED || smoke ? '' : `engine ${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}; `}CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path), in ${procs.length} process${procs.length > 1 ? 'es' : ''}`);
  }
  // the couples' rollout in the exact model beside the engine on K2's first BESIDE paths (a fidelity gap, reported)
  const NB = Math.min(n, BESIDE), pb = new Uint8Array(NB), K2s = dec(arms.K2.survived, Uint8Array);
  let engineOnly = 0, modelOnly = 0;
  const b0 = Date.now();
  for (let k = 0; k < NB; k++) { pb[k] = CPL.runCouplePolicy(k2, paths[k]).survived ? 1 : 0; if (K2s[k] && !pb[k]) engineOnly++; if (pb[k] && !K2s[k]) modelOnly++; }
  const beside = { N: NB, survived: b64(pb), engineOnly, modelOnly, secs: (Date.now() - b0) / 1000 };
  console.log(`${''.padEnd(8)} beside K2: the rollout in the model on ${NB} paths, ${Math.round(beside.secs)} s${REGISTERED || smoke ? '' : `; the engine alone ${engineOnly}, the model alone ${modelOnly}`}`);
  const after = await digest();
  if (js(after) !== js(before)) { console.error(`audit-household-hsp: ${U.id}: the tables changed while the paths ran`); process.exit(3); }
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, couple: U.couple, base: U.base, cohort: U.cohort, place: U.place, variant: U.variant, feature: U.feature, target: U.target, label: a.label, seed, N: n, warm: WARM, pts, W, stamp: STAMP, configs: Object.fromEntries(ARMS.map(x => [x, configOf(x)])), joint: JOINT, order, digests: before, share: k2.share, split: { s: sp.s, k: sp.k }, guard, caps: [k2.tables.self.estateCap || 0, k2.tables.part.estateCap || 0], houseCap: house.H.estateCap, solvencyFloor: k2.m.ctx.solvencyFloor, T, beside, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, U.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
