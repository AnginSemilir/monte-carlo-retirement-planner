/*
 * EVERY COUPLE ON THE SOLVER, THE DRESS REHEARSAL'S AUDIT (COUPLES-ANY.md amendment 2; EXPLORATORY, the tuning seed 7002): each
 * unit of couples-any-panel.json under two arms at estate weight 0.02 and the app's points, in one process, each by the engine on
 * the same paths, their order alternating with the unit's number:
 *   APP    arm A, the app's rules, on the plan as entered (guardrails, the five-year lookahead and the raise cap checked);
 *   ROUTE  the household route taking every shape the household plan takes (couples-any-panel.mjs TAKES: step 4's three, A's
 *          'risks' and 'limits', B's 'salaries', C's 'noretire'): the page's own cut (src/solverCouple.js householdCut at
 *          'pensionsPA', its shapes named), the household's one table solved as the page solves it (src/solverApp.js solveForApp
 *          at the app's points, the partner's age the cut's, inside the cut's bands, src/solver/household.js bandsAt), and the
 *          household assembled as the page assembles it (householdSolved: the even split, its shapes named), its paths on the
 *          page's own context for the solved couple (src/solverStrategy.js solvedContext).
 * The plan handed to ROUTE is the one the household line's audits hand their solvers (shapes-panel.mjs solverPlanOf), with the
 * plan's own locks kept, as the page hands its solve (couples-any-panel.mjs anySolverPlanOf; L's units alone set any). Checked
 * before any path, a failure ending the unit (exit 3): arm A's pick the landing's; the unit's shape as the panel requires
 * (couples-any-panel.mjs unitProblems); ROUTE's minimum pot the unit's; APP's settings; the two arms on one horizon. Each arm's
 * first CHECK paths are held to E.runTrial. Each arm is saved in chunks of 1,000 and resumes from them.
 *   node research/solver/audit-couples-any.mjs --units
 *   node research/solver/audit-couples-any.mjs rehearsal part k/n    the dress rehearsal (seed 7002, CA_N paths, 4,000 unless set)
 *   node research/solver/audit-couples-any.mjs --planted             the checks on planted inputs
 *   CA_PTS the points (a smoke only); CA_N the paths; CA_ONLY a comma list of unit ids; CA_OUT the folder
 * THE REGISTERED TEST (COUPLES-ANY.md, the test; registrations/couples-any.md), on the registered panel (REG=1,
 * couples-any-registered-panel.json: W, R, L and P on four couples no run has used, N left out):
 *   REG=1 node research/solver/audit-couples-any.mjs pilot part k/n       the pilot: every unit, seed 7002, PILOT_N paths
 *                                                                         (EXPLORATORY: the preflight, each unit's discordance
 *                                                                         for the paths, the budget)
 *   REG=1 node research/solver/audit-couples-any.mjs registered part k/n  the registered run: seed HELD, couples-any-paths.json's
 *                                                                         paths, only under the registration through the
 *                                                                         launcher, on the code the panel was landed on, none of
 *                                                                         the smoke's limits and no other panel or landing
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { appJoint, APP_COUPLE, APP_POINTS, APP_CANDIDATE } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { runPath, inputsHash } from './audit-phase4.mjs';
import { readAnyPanel, shapeOfUnit, anySolverPlanOf, unitProblems as panelProblems, FORM, TAKES } from './couples-any-panel.mjs';
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
export const HELD = 7027, PILOT_N = 1000, REG = process.env.REG === '1';
export const REGISTRATION = 'research/solver/registrations/couples-any.md';
export const PATHS_FILE = join(HERE, 'couples-any-paths.json');
/* the settings a registered run refuses: a panel or landing other than the registered one, which would change the units while
   the stamp stayed, and any of the smoke's limits (as audit-couples-open.mjs's, its design review's MINOR 7) */
export const REGISTERED_REFUSES = ['COUPLES_ANY_PANEL', 'COUPLES_ANY_LAND_OUT', 'CA_PTS', 'CA_N', 'CA_ONLY', 'CA_OUT'];
export const registeredEnvProblems = env => REGISTERED_REFUSES.filter(k => env[k] !== undefined && env[k] !== '');
export const ARMS = ['APP', 'ROUTE'];
export const ROUTE_CTX = 'solvedContext';
/* a context's MPAA ages, the first person's then the partner's (the engine's owners) */
export const mpaaOf = ctx => ['self', 'part'].map(k => { const o = ctx.owners.find(x => x.key === k); return o ? o.mpaaAge : NaN; });
export const orderOf = k => (k % 2 ? ['ROUTE', 'APP'] : ['APP', 'ROUTE']);
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const fileOf = id => `${id}.json.gz`;
export const CONFIG = Object.freeze({
  APP: { app: 'armA', tournament: false },
  ROUTE: { ...APP_CANDIDATE, couple: APP_COUPLE, joint: appJoint(), form: FORM, route: 'household', takeShapes: TAKES, ctx: ROUTE_CTX }
});
export const configOf = arm => hashOf(CONFIG[arm]);
/* an arm's done line. Under the registration a log carries no outcome: its stamp, its settings, its timings and its done line,
   as audit-couples-open.mjs's (the design review's finding 1); the pilot's and the rehearsal's carry the engine's survival */
export const doneLine = (arm, config, survived, n, cpuUs, registered) =>
  `${''.padEnd(8)} done ${arm}: config ${config}; ${registered ? '' : `engine ${(100 * survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}; `}CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path)`;
export const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
/* the stamp's roots: the audit, the reducer, the panel, the batch, and W's identity, which the read takes W on (the design
   review's finding 4) */
export const STAMP_ROOTS = ['research/solver/audit-couples-any.mjs', 'research/solver/reduce-couples-any.mjs', 'research/solver/couples-any-panel.mjs', 'research/solver/batch-couples-any.sh', 'research/solver/couples-any-port-identity.mjs'];
export const STAMP_DATA = REG
  ? ['research/solver/couples-any-registered-panel.json', 'research/solver/couples-any-orders.json', 'research/solver/couples-any-paths.json']
  : ['research/solver/couples-any-panel.json'];
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
/* the problems a unit shows before any solve: arm A's pick the landing's, and its shape as the panel requires */
export function unitProblems(U, label, shape) {
  const out = [];
  if (label !== U.label) out.push(`arm A's pick ${label} differs from the landing's ${U.label}`);
  out.push(...panelProblems(U.variant, { landed: U.cls === 'N' ? false : true, shape }));
  return out;
}
/* ROUTE, solved: the household's cut, its banded table and its assembly, every shape named */
export function solveRoute(hp, { pts, light }) {
  const opts = { points: pts, ...(light ? { research: light } : {}) };
  const cut = householdCut(E, M, hp, FORM, { takeShapes: TAKES }), b = cut.bands, joint = appJoint();
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...opts, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast, takeShapes: TAKES }, { plan: cut.hplan, r: H });
  return { cp, k: b.k, caps: [H.estateCap || 0, 0], tables: { household: H }, tierMap: !!cp.tierMap };
}

function planted() {
  const cases = [], panel = readAnyPanel();
  cases.push(['the two configurations differ', configOf('APP') !== configOf('ROUTE') ? 'two' : 'ONE', 'two']);
  cases.push(['the arms\' order alternates with the unit', [0, 1, 2, 3].map(k => orderOf(k)[0]).join(','), 'APP,ROUTE,APP,ROUTE']);
  cases.push(['ROUTE takes every shape the household plan takes', `${CONFIG.ROUTE.takeShapes.join(',')}`, 'growth,cashisa,year0,risks,limits,salaries,noretire']);
  { const f = stampFiles(), need = ['research/solver/couples-any-panel.mjs', 'research/solver/couples-any-port-identity.mjs', 'src/solverDigest.js', ...STAMP_DATA, 'research/solver/shapes-panel.mjs', 'research/solver/couples-open-panel.mjs', 'src/solverApp.js', 'src/solverCouple.js', 'src/solverSettings.js', 'src/couplesSwitch.js', 'src/solverStrategy.js'];
    cases.push(['the stamp holds the panel, its scripts, the app\'s route and the guard, and none of the code\'s own', `${need.every(x => f.includes(x))} ${f.some(x => x === 'research/engine.mjs' || x.startsWith('src/solver/'))}`, 'true false']); }
  { const sv = Uint8Array.from([1, 0, 1, 1]), reg = doneLine('ROUTE', 'cfg', sv, 4, 2e6, true), open = doneLine('ROUTE', 'cfg', sv, 4, 2e6, false);
    cases.push(['a registered done line carries no outcome; the pilot\'s and the rehearsal\'s carry the engine\'s survival', `${/engine|%|survi/.test(reg)} ${/done ROUTE: config cfg; CPU 2 s/.test(reg)} ${/; engine 75\.00% on 4; CPU/.test(open)}`, 'false true true']); }
  // the panel: 144 units, each class's count, each unit once, N's not landed and every other landed
  { const by = k => panel.filter(u => u.cls === k).length;
    cases.push([REG ? 'the registered panel: 136 units, W 24, R 96, L 8, P 8, no N, each once' : 'the panel: 144 units, W 24, R 96, L 8, P 8, N 8, each once', `${panel.length} ${['W', 'R', 'L', 'P', 'N'].map(by).join(' ')} ${new Set(panel.map(u => u.id)).size}`, REG ? '136 24 96 8 8 0 136' : '144 24 96 8 8 8 144']); }
  cases.push(['the registered run refuses another panel, another landing and every limit, and takes a clean setting', `${registeredEnvProblems({ COUPLES_ANY_PANEL: 'x', CA_N: '5' }).join(',')} | ${registeredEnvProblems({ COUPLES_ANY_LAND_OUT: 'y', CA_PTS: '4', CA_ONLY: 'a', CA_OUT: 'z' }).join(',')} | ${registeredEnvProblems({ REG: '1', CA_N: '' }).join(',')}`, 'COUPLES_ANY_PANEL,CA_N | COUPLES_ANY_LAND_OUT,CA_PTS,CA_ONLY,CA_OUT | ']);
  cases.push([`the stamp's data files${REG ? ': the registered panel, its order and its paths' : ': the rehearsal\'s panel'}`, STAMP_DATA.map(f => f.replace('research/solver/', '')).join(','), REG ? 'couples-any-registered-panel.json,couples-any-orders.json,couples-any-paths.json' : 'couples-any-panel.json']);
  // a unit's checks before any solve: a clean unit, then each planted fault
  { const U = panel.find(u => u.cls === 'R') || panel[0], sh = shapeOfUnit(U.plan, U.variant);
    cases.push([`${U.id}: a clean unit, no problem`, unitProblems(U, U.label, sh).join('; '), '']);
    cases.push(['arm A\'s pick not the landing\'s', unitProblems(U, `${U.label}-other`, sh).join('; '), `arm A's pick ${U.label}-other differs from the landing's ${U.label}`]);
    cases.push(['a shape the household plan refuses with every shape', unitProblems(U, U.label, { ...sh, withAll: 'householdPlanFor: planted' }).join('; '), 'refused with every shape: householdPlanFor: planted']);
    cases.push(['a unit the household plan takes without its own shape', unitProblems(U, U.label, { ...sh, without: null }).join('; '), 'taken without its own shape']);
    cases.push(['a refused shape the guard puts on the household route', unitProblems(U, U.label, { ...sh, guard: { on: true, why: null, route: 'household' } }).join('; '), 'the guard on (household)']); }
  { const U = panel.find(u => u.cls === 'W'), sh = shapeOfUnit(U.plan, U.variant);
    cases.push([`${U.id}: a W unit the guard keeps off`, unitProblems(U, U.label, { ...sh, guard: { on: false, why: 'shape', route: null } }).join('; '), 'the guard off (shape)']); }
  // ROUTE solved at light settings on one unit of each of R, P and N: every shape named, the household on its route, the tier
  // map where R's two ladders differ and none where they are alike
  for (const cls of REG ? ['R', 'P'] : ['R', 'P', 'N']) {
    const U = panel.find(u => u.cls === cls), { hp } = anySolverPlanOf(U.plan), R = solveRoute(hp, { pts: 4, light: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } });
    cases.push([`${U.id}: ROUTE solves a household, the tier map ${cls === 'R' ? 'in use' : 'none'}`, `${!!R.cp.household} ${R.tierMap}`, `true ${cls === 'R'}`]);
  }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit(planted() ? 1 : 0);
  const panel = readAnyPanel();
  if (args[0] === '--units') { panel.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(panel.length); process.exit(0); }
  const MODE = args[0], REGISTERED = MODE === 'registered', PILOT = MODE === 'pilot';
  if (!['rehearsal', 'pilot', 'registered'].includes(MODE)) { console.error('audit-couples-any: rehearsal, pilot or registered part k/n'); process.exit(2); }
  // the pilot and the registered run read the registered panel; the dress rehearsal its own
  if ((REGISTERED || PILOT) !== REG) { console.error(`audit-couples-any: ${MODE} runs ${REGISTERED || PILOT ? 'with' : 'without'} REG=1`); process.exit(2); }
  if (REGISTERED && registeredEnvProblems(process.env).length) { console.error(`audit-couples-any: the registered run takes no other panel, landing or limit (${registeredEnvProblems(process.env).join(', ')} set)`); process.exit(2); }
  if (REGISTERED && process.env.PREDICTION_FILE !== REGISTRATION) { console.error(`audit-couples-any: the registered run runs only under ${REGISTRATION}, through the launcher (PREDICTION_FILE ${process.env.PREDICTION_FILE || 'unset'})`); process.exit(2); }
  // the registered run only on the code the panel was landed on: a change of code means landing again, a new pilot and review
  if (REGISTERED) { const pc = JSON.parse(readFileSync(join(HERE, 'couples-any-registered-panel.json'), 'utf8')).code, cc = codeId(); if (!cc || cc.hash !== pc) { console.error(`audit-couples-any: the code ${cc ? cc.hash : 'unknown'} is not the code the panel was landed on (${pc})`); process.exit(2); } }
  const reg = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')) : null;
  const only = process.env.CA_ONLY ? new Set(process.env.CA_ONLY.split(',')) : null, units = panel.filter(u => !only || only.has(u.id));
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-couples-any: part k/${units.length}`); process.exit(2); }
  const pts = Number(process.env.CA_PTS) || APP_POINTS, U = units[pk], seed = REGISTERED ? HELD : SEED;
  const n = REGISTERED ? reg.N : Number(process.env.CA_N) || (PILOT ? PILOT_N : N_DEFAULT);
  if (REGISTERED && !(Number.isInteger(n) && n > 0)) { console.error(`audit-couples-any: ${PATHS_FILE} gives no paths`); process.exit(2); }
  const smoke = pts !== APP_POINTS, light = smoke && pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : null;
  const OUT = process.env.CA_OUT || join(HERE, 'results', REGISTERED ? 'couples-any-run' : PILOT ? 'couples-any-pilot' : 'couples-any-7002');
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  const PROC = `${hostname()}:${process.pid}:${Date.now()}`, t0 = Date.now(), order = orderOf(pk);
  console.log(`EVERY COUPLE ON THE SOLVER (${REGISTERED ? 'THE REGISTERED TEST' : PILOT ? 'THE REGISTERED TEST\'S PILOT, EXPLORATORY' : 'THE DRESS REHEARSAL, EXPLORATORY'}): unit ${pk}/${pn}: ${U.id} (class ${U.cls}, ${U.cohort}), target ${U.target}, seed ${seed}, ${n} paths, ${pts} points, estate weight ${W}; configs ${ARMS.map(x => `${x} ${configOf(x)}`).join(', ')}`);
  const { a, hp } = anySolverPlanOf(U.plan), shape = shapeOfUnit(U.plan, U.variant);
  const before = unitProblems(U, a.label, shape);
  if (before.length) { console.error(`audit-couples-any: ${U.id}: ${before.join('; ')}`); process.exit(3); }
  const s0 = Date.now(), R = solveRoute(hp, { pts, light }), solveSecs = { APP: 0, ROUTE: (Date.now() - s0) / 1000 };
  const digest = async () => Object.fromEntries(await Promise.all(Object.entries(R.tables).map(async ([w, t]) => [w, await digestOf(tablesOf(t))])));
  const tablesBefore = await digest();
  console.log(`${''.padEnd(8)} solved: ROUTE (household, every shape named) ${solveSecs.ROUTE.toFixed(0)} s; k ${R.k.toFixed(4)}; the tier map ${R.tierMap ? 'in use (the two ladders differ)' : 'none'}; the guard ${shape.guard.on ? `on${shape.guard.route ? ` (${shape.guard.route})` : ''}` : `off (${shape.guard.why})`}`);
  const ctxOf = arm => {
    if (arm === 'APP') {
      const ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || ctx.lookaheadYears !== 5 || ctx.raiseCapFrac !== 1.1 || ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0) || !ctx.isCouple) { console.error(`audit-couples-any: ${U.id} APP: guardrails ${ctx.guardrails}, lookahead ${ctx.lookaheadYears}, raise cap ${ctx.raiseCapFrac}, minimum pot ${ctx.solvencyFloor}, a couple ${ctx.isCouple}`); process.exit(3); }
      return ctx;
    }
    if (!R.cp.household) { console.error(`audit-couples-any: ${U.id} ROUTE: the solved couple is not a household`); process.exit(3); }
    const ctx = solvedContext(E, R.cp);
    if (ctx.solvencyFloor !== E.num(U.plan.config.solvencyFloor, 0)) { console.error(`audit-couples-any: ${U.id} ROUTE: the minimum pot ${ctx.solvencyFloor}, not the unit's ${U.plan.config.solvencyFloor}`); process.exit(3); }
    return ctx;
  };
  const T = ctxOf('ROUTE').totalYears, paths = E.pathsForSeed(seed, n, T).map(zs => Float64Array.from(zs));
  const inputs = Object.fromEntries(ARMS.map(x => [x, inputsHash(ctxOf(x))])), arms = {};
  const mpaa = Object.fromEntries(ARMS.map(x => [x, mpaaOf(ctxOf(x))]));
  console.log(`${''.padEnd(8)} MPAA ages: APP ${mpaa.APP.join('/')}, ROUTE ${mpaa.ROUTE.join('/')} (the page's own context)`);
  for (const arm of order) {
    const ctx = ctxOf(arm), pf = partOf(OUT, U.id, arm), o = { config: configOf(arm) };
    if (ctx.totalYears !== T) { console.error(`audit-couples-any: ${U.id} ${arm}: another horizon (${ctx.totalYears}, ${T})`); process.exit(3); }
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
    if (bad) { console.error(`audit-couples-any: ${U.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0);
    arms[arm] = { ...o, cpuUs, wallMs: chunks.reduce((t, x) => t + x.wallMs, 0), chunks, place: order.indexOf(arm), solveSecs: solveSecs[arm], inputs: inputs[arm], ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    console.log(doneLine(arm, o.config, A.survived, n, cpuUs, REGISTERED));
  }
  if (js(await digest()) !== js(tablesBefore)) { console.error(`audit-couples-any: ${U.id}: the tables changed while the paths ran`); process.exit(3); }
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, couple: U.couple, cohort: U.cohort, variant: U.variant, cls: U.cls, kind: U.kind, hold: U.hold, target: U.target, label: a.label, seed, N: n, warm: WARM, pts, W, stamp: STAMP,
    shape, split: { k: R.k }, tierMap: R.tierMap, caps: R.caps, digests: tablesBefore, routeCtx: ROUTE_CTX, mpaa, mode: MODE, arms })));
  for (const arm of ARMS) rmSync(partOf(OUT, U.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
