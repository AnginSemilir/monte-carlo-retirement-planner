/*
 * THE GUARD'S OWN UNITS, THE AUDIT (COUPLES-OPEN.md step 1, the dress rehearsal; EXPLORATORY, the tuning seed 7002): each unit
 * of couples-open-panel.json under two arms at estate weight 0.02 and the app's points, in one process, each by the engine on
 * the same paths, their order alternating with the unit's number:
 *   APP    arm A, the app's rules, on the plan as entered (guardrails, the five-year lookahead and the raise cap checked);
 *   ROUTE  the app's own route for the couple, the guard alone bypassed. Where the page's household cut takes the plan
 *          (src/solverCouple.js householdCut at 'pensionsPA'), the household's one table solved as the page solves it
 *          (src/solverApp.js solveForApp at the app's points, the partner's age the cut's, inside the cut's bands:
 *          src/solver/household.js bandsAt) and assembled as the page assembles it (householdSolved: the even split, the top
 *          three, the couples' joint move's tie-break and hold), as household-port-identity.mjs held it to step 8's arm.
 *          Where householdPlanFor refuses the plan's shape, today's route, as src/solverClient.js falls back: couplePlans at the
 *          couples' share rule, each person's table solved with the partner's age, assembleCouple with the couples' joint move
 *          (src/solverSettings.js APP_COUPLE, appJoint).
 * The plan handed to ROUTE is the one the household line's audits hand their solvers (shapes-panel.mjs solverPlanOf: arm A's
 * policy, the couples' solver plan), its MPAA ages arm A's in the engine's context, as step 8's arms ran (audit-household-hsp.mjs).
 * Checked before any path, a failure ending the unit (exit 3): arm A's pick the landing's; the app's guard off for the unit's
 * class's reason (so the unit is one today's guard keeps on the app's rules); the route the panel's; ROUTE's minimum pot the
 * unit's; APP's settings; the two arms on one horizon. Each arm's first CHECK paths are held to E.runTrial. Each arm is saved
 * in chunks of 1,000 and resumes from them.
 *   node research/solver/audit-couples-open.mjs --units
 *   node research/solver/audit-couples-open.mjs rehearsal part k/n     the dress rehearsal (seed 7002, CO_N paths, 4,000 unless set)
 *   node research/solver/audit-couples-open.mjs --planted              the checks on planted inputs
 *   CO_PTS the points (a smoke only); CO_N the paths; CO_ONLY a comma list of unit ids; CO_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved, couplePlans, assembleCouple } from '../../src/solverCouple.js';
import { bandsAt, withHouseholdSingle } from '../../src/solver/household.js';
import { withCouple } from '../../src/solver/couple.js';
import { appJoint, APP_COUPLE, APP_POINTS, APP_CANDIDATE } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { runPath, inputsHash } from './audit-phase4.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { readOpenPanel, routeOf, guardOf, WANT, FORM } from './couples-open-panel.mjs';
import { hashOf } from './candidate.mjs';
import { codeId, codeFiles } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg, hostname } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const SEED = 7002, W = 0.02, CHECK = 200, WARM = 3, CHUNK = 1000, N_DEFAULT = 4000;
export const ARMS = ['APP', 'ROUTE'];
export const orderOf = k => (k % 2 ? ['ROUTE', 'APP'] : ['APP', 'ROUTE']);
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const fileOf = id => `${id}.json.gz`;
/* each arm's configuration, hashed as candidate.mjs hashes the candidate's */
export const CONFIG = Object.freeze({
  APP: { app: 'armA', tournament: false },
  ROUTE: { ...APP_CANDIDATE, couple: APP_COUPLE, joint: appJoint(), form: FORM, route: 'app' }
});
export const configOf = arm => hashOf(CONFIG[arm]);
export const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
/* the stamp: every file the run and its read take beyond the code (code-id.mjs codeFiles), following the imports of the audit,
   the read, the panel's script and the batch, and the panel itself */
export const STAMP_ROOTS = ['research/solver/audit-couples-open.mjs', 'research/solver/reduce-couples-open.mjs', 'research/solver/couples-open-panel.mjs', 'research/solver/batch-couples-open.sh'];
export const STAMP_DATA = ['research/solver/couples-open-panel.json'];
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
/* the problems a unit shows before any solve: arm A's pick the landing's, the guard off for the class's reason, the route the
   panel's (the planted checks below) */
export function unitProblems(U, label, guard, route) {
  const w = WANT[U.variant], out = [];
  if (label !== U.label) out.push(`arm A's pick ${label} differs from the landing's ${U.label}`);
  if (guard.on) out.push('the app\'s guard is on: the unit is not one the guard keeps off');
  else if (guard.why !== w.why) out.push(`the app's guard keeps the unit off for '${guard.why}', not its class's '${w.why}'`);
  if (route.route !== U.route || route.route !== w.route) out.push(`the route '${route.route}', not the panel's '${U.route}'`);
  return out;
}
/* ROUTE, solved: the household (its cut, its banded table, its assembly) or today's two tables and their assembly */
export function solveRoute(hp, route, { pts, light }) {
  const opts = { points: pts, ...(light ? { research: light } : {}) };
  if (route === 'household') {
    const cut = householdCut(E, M, hp, FORM), b = cut.bands, joint = appJoint();
    const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...opts, ageWith: cut.ageWith }), b.paK);
    const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
    return { cp, k: b.k, caps: [H.estateCap || 0, 0], tables: { household: H } };
  }
  const cpl = couplePlans(E, hp, { shareRule: APP_COUPLE.shareRule }), tables = {}, solvedOn = {};
  for (const who of ['self', 'part']) { tables[who] = solveForApp(E, M, cpl.plans[who], { ...opts, ageWith: cpl.ageWith[who] }); solvedOn[who] = { plan: cpl.plans[who], ageWith: cpl.ageWith[who] }; }
  const cp = assembleCouple(E, M, cpl.household, tables, { shareRule: cpl.shareRule, joint: appJoint(), solvedOn });
  return { cp, k: null, share: cpl.share, caps: [tables.self.estateCap || 0, tables.part.estateCap || 0], tables };
}

function planted() {
  const cases = [], panel = readOpenPanel();
  cases.push(['the two configurations differ', configOf('APP') !== configOf('ROUTE') ? 'two' : 'ONE', 'two']);
  cases.push(['the arms\' order alternates with the unit', [0, 1, 2, 3].map(k => orderOf(k)[0]).join(','), 'APP,ROUTE,APP,ROUTE']);
  { const f = stampFiles(), need = ['research/solver/couples-open-panel.mjs', 'research/solver/couples-open-panel.json', 'research/solver/shapes-panel.mjs', 'src/solverApp.js', 'src/solverCouple.js', 'src/solverSettings.js', 'src/couplesSwitch.js'];
    cases.push(['the stamp holds the panel, its script, the app\'s route and the guard, and none of the code\'s own', `${need.every(x => f.includes(x))} ${f.some(x => x === 'research/engine.mjs' || x.startsWith('src/solver/'))}`, 'true false']); }
  { const U = { variant: 'Y75', label: 'ISA First', route: 'household' }, off = { on: false, why: 'uneven' }, hh = { route: 'household' };
    cases.push(['a clean unit: no problem', unitProblems(U, 'ISA First', off, hh).join(';'), '']);
    cases.push(['arm A\'s pick not the landing\'s', unitProblems(U, 'Bracket Fill', off, hh).join(';'), 'arm A\'s pick Bracket Fill differs from the landing\'s ISA First']);
    cases.push(['the guard on', unitProblems(U, 'ISA First', { on: true, why: null }, hh).join(';'), 'the app\'s guard is on: the unit is not one the guard keeps off']);
    cases.push(['the guard off for another reason', unitProblems({ ...U, variant: 'G8' }, 'ISA First', off, hh).join(';'), 'the app\'s guard keeps the unit off for \'uneven\', not its class\'s \'gapincome\'']);
    cases.push(['the route not the panel\'s', unitProblems(U, 'ISA First', off, { route: 'today' }).join(';'), 'the route \'today\', not the panel\'s \'household\'']); }
  cases.push(['the panel: 40 units, each with its class and route', `${panel.length} ${panel.filter(u => u.route === 'today').length} ${[...new Set(panel.map(u => u.cls))].join('')}`, '40 4 YESGR']);
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit(planted() ? 1 : 0);
  const panel = readOpenPanel();
  if (args[0] === '--units') { panel.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(panel.length); process.exit(0); }
  if (args[0] !== 'rehearsal') { console.error('audit-couples-open: rehearsal part k/n'); process.exit(2); }
  const only = process.env.CO_ONLY ? new Set(process.env.CO_ONLY.split(',')) : null, units = panel.filter(u => !only || only.has(u.id));
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-couples-open: part k/${units.length}`); process.exit(2); }
  const pts = Number(process.env.CO_PTS) || APP_POINTS, U = units[pk], n = Number(process.env.CO_N) || N_DEFAULT, seed = SEED;
  const smoke = pts !== APP_POINTS, light = smoke && pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : null;
  const OUT = process.env.CO_OUT || join(HERE, 'results', 'couples-open-7002');
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  const PROC = `${hostname()}:${process.pid}:${Date.now()}`, t0 = Date.now(), order = orderOf(pk);
  console.log(`THE GUARD'S OWN UNITS (THE DRESS REHEARSAL, EXPLORATORY): unit ${pk}/${pn}: ${U.id} (class ${U.cls}, ${U.cohort}), target ${U.target}, seed ${seed}, ${n} paths, ${pts} points, estate weight ${W}; configs ${ARMS.map(x => `${x} ${configOf(x)}`).join(', ')}`);
  const { a, hp } = solverPlanOf(U.plan, 'own'), guard = guardOf(U.plan), route = routeOf(hp);
  const before = unitProblems(U, a.label, guard, route);
  if (before.length) { console.error(`audit-couples-open: ${U.id}: ${before.join('; ')}`); process.exit(3); }
  const s0 = Date.now(), R = solveRoute(hp, route.route, { pts, light }), solveSecs = { APP: 0, ROUTE: (Date.now() - s0) / 1000 };
  const digest = async () => Object.fromEntries(await Promise.all(Object.entries(R.tables).map(async ([w, t]) => [w, await digestOf(tablesOf(t))])));
  const tablesBefore = await digest();
  console.log(`${''.padEnd(8)} solved: ROUTE (${route.route}${route.why ? `: ${route.why}` : ''}) ${solveSecs.ROUTE.toFixed(0)} s${R.k !== null ? `; k ${R.k.toFixed(4)}` : `; the share ${R.share}`}; the guard off (${guard.why}), the first person holding ${(100 * guard.share).toFixed(1)}%`);
  const aDemo = E.resolveMpaa(a.planState).demographics, withAges = plan => ({ ...plan, demographics: { ...plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
  const ctxOf = arm => {
    if (arm === 'APP') {
      const ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || ctx.lookaheadYears !== 5 || ctx.raiseCapFrac !== 1.1 || ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0) || !ctx.isCouple) { console.error(`audit-couples-open: ${U.id} APP: guardrails ${ctx.guardrails}, lookahead ${ctx.lookaheadYears}, raise cap ${ctx.raiseCapFrac}, minimum pot ${ctx.solvencyFloor}, a couple ${ctx.isCouple}`); process.exit(3); }
      return ctx;
    }
    const ctx = E.buildContext(route.route === 'household' ? withHouseholdSingle(withAges(R.cp.plan), R.cp) : withCouple(withAges(R.cp.plan), R.cp));
    if (ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0)) { console.error(`audit-couples-open: ${U.id} ROUTE: the minimum pot ${ctx.solvencyFloor}, not the unit's ${U.plan.config.solvencyFloor}`); process.exit(3); }
    return ctx;
  };
  const T = ctxOf('ROUTE').totalYears, paths = E.pathsForSeed(seed, n, T).map(zs => Float64Array.from(zs));
  const inputs = Object.fromEntries(ARMS.map(x => [x, inputsHash(ctxOf(x))])), arms = {};
  for (const arm of order) {
    const ctx = ctxOf(arm), pf = partOf(OUT, U.id, arm), o = { config: configOf(arm) };
    if (ctx.totalYears !== T) { console.error(`audit-couples-open: ${U.id} ${arm}: another horizon (${ctx.totalYears}, ${T})`); process.exit(3); }
    let A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)])), done = 0, chunks = [];
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (js(P.stamp) === js(STAMP) && P.seed === seed && P.N === n && P.pts === pts && js(P.digests) === js(tablesBefore) && js(P.options) === js(o)) {
        A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arrays[k], Ty)])); done = P.done; chunks = P.chunks;
        console.log(`${''.padEnd(8)} resumed ${arm} at path ${done} of ${n}`);
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
      writeFileSync(tmp, gzipSync(js({ stamp: STAMP, seed, N: n, pts, digests: tablesBefore, options: o, done, chunks, arrays: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) })));
      renameSync(tmp, pf);
    }
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-couples-open: ${U.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0);
    arms[arm] = { ...o, cpuUs, wallMs: chunks.reduce((t, x) => t + x.wallMs, 0), chunks, place: order.indexOf(arm), solveSecs: solveSecs[arm], inputs: inputs[arm], ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} done ${arm}: config ${o.config}; engine ${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}; CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path)`);
  }
  if (js(await digest()) !== js(tablesBefore)) { console.error(`audit-couples-open: ${U.id}: the tables changed while the paths ran`); process.exit(3); }
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, couple: U.couple, cohort: U.cohort, variant: U.variant, cls: U.cls, target: U.target, label: a.label, seed, N: n, warm: WARM, pts, W, stamp: STAMP,
    route: route.route, refusal: route.why, guard, split: { k: R.k }, share: R.share === undefined ? null : R.share, caps: R.caps, digests: tablesBefore, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, U.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
