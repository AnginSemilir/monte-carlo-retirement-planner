/*
 * ITEM 6'S STAGE C, THE AUDIT (registrations/couples-share.md; the review of 9 Nov, item 6 stage C; D66, D91, D93): couples
 * who hold their money unevenly, and couples with a feature the library lacks, each unit of couples-share-panel.json run in
 * three arms at estate weight 0.02, each by the engine on the same paths of the unit's seed:
 *   CANDS  the couples' candidate (af001697ce1b: the candidate the couples' registered read read, the app's candidate less
 *          D95's tie-break, which D80 keeps out of every registered couples' arm and which no couple's joint move takes),
 *          each person's table on the first person's share of the pots outside 0.40 to 0.60 (couple.js shareRule 'pots',
 *          held to 0.05 to 0.95; 0.5 inside the band). Its configuration 27d2a7c7ee9d;
 *   APP    the app's rules: arm A's pick on the unit's plan, as the couples' registered run's APP;
 *   CANDH  the couples' candidate at share 0.5 (af001697ce1b), as the registered run's CANDC: reported, not deciding, on
 *          the unit's first CANDH_N paths. On a unit with a feature (60/40, inside the band) CANDS and CANDH solve the same
 *          share, so there they must agree path for path: the read's identity check.
 * Each arm's solve is checked as it runs: each person's settings against the registered run's (audit-couples.mjs WANT,
 * wantProblems), the couple's share and rule, the household's minimum pot, the couples' path (COUPLE.flat and .fast on),
 * and D80 (no shortlist, item 12 option or tie-break, read from the modules and the solved tables). Each arm's first CHECK
 * paths are held to E.runTrial; CANDS's first BESIDE paths are run by the couples' rollout in the exact model beside the
 * engine (a fidelity gap reported, not deciding).
 * Units go to results/share-c-run/ (registered) or results/share-c-pilot/ (the pilot), SHARE_C_OUT overriding: case<k>.txt,
 * the log, stamped (fair-gate.mjs LOG_STAMP), and <unit>-<arm>.json.gz. reduce-couples-share.mjs reads them.
 *   node research/solver/audit-couples-share.mjs --units [pilot]       the units (and their numbers)
 *   node research/solver/audit-couples-share.mjs registered part k/n    the registered run (through the launcher only)
 *   node research/solver/audit-couples-share.mjs pilot part k/n         the pilot: seed 7002, PILOT_N paths, the pilot's units
 *   node research/solver/audit-couples-share.mjs --planted              the checks on planted inputs
 *   SC_PTS the points (smoke only); SC_N the paths (pilot or smoke); SC_ONLY a comma list of unit ids (pilot or smoke)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as SOLVE from '../../src/solver/solve.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp, APP_CANDIDATE } from '../../src/solverApp.js';
import { hashOf } from './candidate.mjs';
import { appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, inputsHash, solverPlanOf } from './audit-phase4.mjs';
import { solverPlan, wantProblems, coarseName, coupleProblems, d80Of, d80Problems } from './audit-couples.mjs';
import { readSharePanel, SHARE_PANEL } from './couples-share-panel.mjs';
import { codeId, codeFiles } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
const { solveCouple, withCouple, runCouplePolicy, COUPLE, shareFor } = CPL;
export const SEED = 7022, PILOT_SEED = 7002, PTS = 45, W = 0.02, CHECK = 200, BESIDE = 500, CANDH_N = 1000, PILOT_N = 1000;
export const ARMS = ['CANDS', 'CANDH', 'APP'];
export const REGISTRATION = 'research/solver/registrations/couples-share.md';
export const PATHS_FILE = join(HERE, 'couples-share-paths.json');
/* the couples' candidate: the app's, less D95's tie-break (D80) */
export const COUPLES_CANDIDATE = (({ tieAboveCap: _t, ...c }) => c)(APP_CANDIDATE);
export const CONFIG = { CANDS: '27d2a7c7ee9d', CANDH: 'af001697ce1b' };
export const configOf = arm => (arm === 'CANDS' ? hashOf({ ...COUPLES_CANDIDATE, shareRule: 'pots' }) : hashOf(COUPLES_CANDIDATE));
/* the pilot: three couples of the panel, an older, a middle and a younger one, each unit of theirs (places 0, 6 and 10) */
export const PILOT_PLACES = [0, 6, 10];
/*
 * THE STAMP: every file the run and its read take beyond the code (code-id.mjs codeFiles: research/engine.mjs, src/solver), found
 * by following the imports of the audit, the read, the sizing, the panel's script and the batch to the end, as code-id.mjs
 * smokeFiles follows them (from, a dynamic import(), a side-effect import, require, a worker's new URL), and the data files
 * they read: the panel, its frozen order and the paths. So a change to anything the read decides with (reduce-phase4.mjs's
 * survivalItem, lossOf and harmFlag; fair-gate.mjs; size-phase4.mjs's thresholds; the paths file) changes the stamp, and the
 * gate refuses a unit run before it (the design review of 13 Nov, BLOCKING 1). `read` and `exists` are the planted checks' way in.
 */
export const STAMP_ROOTS = ['research/solver/audit-couples-share.mjs', 'research/solver/reduce-couples-share.mjs', 'research/solver/size-couples-share.mjs', 'research/solver/couples-share-panel.mjs', 'research/solver/batch-couples-share.sh'];
export const STAMP_DATA = ['research/solver/couples-share-panel.json', 'research/solver/couples-share-orders.json', 'research/solver/couples-share-paths.json'];
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
    // a batch names the scripts it runs by their path from the repository's root
    if (/\.sh$/.test(f)) for (const m of read(f).matchAll(/research\/solver\/([\w.-]+\.mjs)/g)) { const rel = `research/solver/${m[1]}`; if (!seen.has(rel)) { seen.add(rel); out.push(rel); queue.push(rel); } }
  }
  return [...new Set([...out.sort(), ...STAMP_DATA])];
}
export function stampFilesHash(root = REPO) {
  const h = createHash('sha256');
  for (const f of stampFiles(root)) h.update(f).update(existsSync(join(root, f)) ? readFileSync(join(root, f)) : 'missing');
  return h.digest('hex').slice(0, 12);
}
/* the units: every unit's CANDS first (the longest), then CANDH, then APP */
export const unitsOf = ids => ARMS.flatMap(arm => ids.map(id => [id, arm]));
export const fileOf = (id, arm) => `${id}-${arm.toLowerCase()}.json.gz`;
export const pilotIds = panel => panel.filter(u => PILOT_PLACES.includes(u.place)).map(u => u.id);
/* the paths an arm runs on a unit of N: CANDH its first CANDH_N, the others all N */
export const pathsFor = (arm, N) => (arm === 'CANDH' ? Math.min(CANDH_N, N) : N);
/* each person's settings line, as audit-couples.mjs writes it (wantProblems reads it) */
const latticeName = L => `${L.na}x${L.nb}x${L.nz}${L.foot ? '+foot' : ''}${L.stepAll ? '+stepAll' : ''}`;
const readerYearsOf = r => { const rd = (r.mix ? r.mix.tables[0].g : r.g).reader; return rd ? Array.from(rd.years).reduce((s, x) => s + x, 0) : 0; };
const latticeOf = r => { const rd = (r.mix ? r.mix.tables[0].g : r.g).reader, L = rd && rd.adaptive ? rd.adaptive.lattice : null; return L ? latticeName(L) : 'unbuilt'; };
export const settingsOf = r => `pts ${r.g.np} mix ${r.meta.mixture} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} levels ${r.meta.spendLevels.join(',')} raiseW ${r.meta.raiseWeight} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead} readerRef ${r.meta.readerRef} readerSplit ${r.meta.readerSplit} tierState ${r.meta.tierState} tiersBelow ${r.meta.tiersBelow} tableDealing ${r.meta.tableDealing} switchCharge ${r.switchCharge || 0} e3 ${!!r.meta.e3} e3pcls ${!!r.meta.e3pcls} hr ${r.actions.some(a => a.steps.includes('penHR') || a.harvestCeil === 'hr') ? 'yes' : 'no'} jointWorlds ${!!r.meta.jointWorlds} bridgeStep ${r.meta.bridgeStep} switchMargin ${r.meta.switchMargin || 0} pclsInterp ${!!r.g.pclsInterp} lattice ${latticeOf(r)} failDelivered ${!!r.meta.failDelivered} minPot ${E.num(r.m.ctx.solvencyFloor, 0)} readerYears ${readerYearsOf(r)} sweepCashIsaTo ${r.meta.sweepCashIsaTo || 'unset'} coarse ${coarseName(r.meta.coarse)}`;
/* the share each solver arm must have solved on: CANDS the rule's (0.5 inside the band, the pots' share outside it), CANDH 0.5 */
export const shareWant = (arm, plan) => (arm === 'CANDS' ? { share: shareFor(plan), rule: 'pots' } : { share: 0.5, rule: 'half' });
/* a solver arm's couple, each person's table solved as the app solves it, on the couples' candidate */
export function solveArm(arm, hp, pts) {
  const one = (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined } });
  return solveCouple(E, M, hp, arm === 'CANDS' ? { shareRule: 'pots', solveOne: one } : { solveOne: one });
}

async function planted() {
  const cases = [];
  cases.push(['the configurations: CANDS the couples\' candidate with the pots\' share, CANDH the couples\' candidate (the registered read\'s), the app\'s candidate less its tie-break', `${configOf('CANDS')} ${configOf('CANDH')} ${hashOf(APP_CANDIDATE) !== configOf('CANDH')}`, `${CONFIG.CANDS} ${CONFIG.CANDH} true`]);
  cases.push(['the couples\' candidate carries no tie-break; the app\'s does', `${'tieAboveCap' in COUPLES_CANDIDATE} ${APP_CANDIDATE.tieAboveCap > 0}`, 'false true']);
  const U = unitsOf(['A', 'B']);
  cases.push(['the units: CANDS for every unit, then CANDH, then APP', U.map(([id, arm]) => `${id}:${arm}`).join(','), 'A:CANDS,B:CANDS,A:CANDH,B:CANDH,A:APP,B:APP']);
  cases.push(['CANDH runs the unit\'s first 1,000 paths (all of a smaller unit), the others all of it', `${pathsFor('CANDH', 19000)} ${pathsFor('CANDH', 600)} ${pathsFor('CANDS', 19000)} ${pathsFor('APP', 19000)}`, '1000 600 19000 19000']);
  // the share wanted: on a 90/10 plan the rule's 0.9, on a 60/40 plan 0.5; CANDH 0.5 on either
  { const mk = f => ({ accounts: [{ id: 'pen_self', balance: 100 * f }, { id: 'pen_part', balance: 100 * (1 - f) }] });
    cases.push(['the share each solver arm must solve on: CANDS 0.9 on 90/10 and 0.5 on 60/40, CANDH 0.5 on both', `${shareWant('CANDS', mk(0.9)).share} ${shareWant('CANDS', mk(0.6)).share} ${shareWant('CANDH', mk(0.9)).share} ${shareWant('CANDS', mk(0.9)).rule}`, '0.9 0.5 0.5 pots']); }
  cases.push(['the pilot\'s units: every unit of places 0, 6 and 10', pilotIds([{ id: 'a', place: 0 }, { id: 'b', place: 1 }, { id: 'c', place: 6 }, { id: 'd', place: 10 }, { id: 'e', place: 10 }]).join(','), 'a,c,d,e']);
  // D80 on the couples' candidate's solved tables: a table carrying the tie-break is refused, one without it is not
  { const tab = (meta = {}) => ({ meta: { ...meta }, worlds: [], mix: null });
    cases.push(['D80: a person\'s table with the tie-break is refused; one without it is not', `${d80Problems(d80Of(undefined, [tab({ tieAboveCap: 1e-4 })])).length > 0} ${d80Problems(d80Of(undefined, [tab()])).length}`, 'true 0']); }
  // the stamp (the design review of 13 Nov, BLOCKING 1): what the read decides with is in it; the code's own files are not
  { const f = stampFiles(), need = ['research/solver/reduce-phase4.mjs', 'research/solver/fair-gate.mjs', 'research/solver/size-phase4.mjs', 'research/solver/stats.mjs', 'research/solver/reduce-couples.mjs', 'src/solverApp.js', 'src/solverSettings.js', ...STAMP_DATA];
    cases.push(['the stamp holds every file the read decides with and the data files, and none of the code\'s own (code-id.mjs)', `${need.every(x => f.includes(x))} ${f.some(x => x === 'research/engine.mjs' || x.startsWith('src/solver/'))}`, 'true false']);
    // a planted import in the read, static and dynamic, is followed
    const text = rel => readFileSync(join(REPO, rel), 'utf8');
    // the planted lines are built here, not written out, so this file's own text names no planted module to the scan
    const q = name => ['\'', './', name, '\''].join(''), lines = ['\n', 'import', ' ', q('planted-dep.mjs'), ';\nconst x = await ', 'import', '(', q('planted-dyn.mjs'), ');\n'].join('');
    const plantRead = rel => (rel === 'research/solver/reduce-couples-share.mjs' ? text(rel) + lines : rel.startsWith('research/solver/planted-') ? '' : text(rel));
    const plantExists = rel => rel.startsWith('research/solver/planted-') || existsSync(join(REPO, rel));
    const g = stampFiles(REPO, plantRead, plantExists);
    cases.push(['a module the read imports, statically or by a dynamic import, joins the stamp', `${g.includes('research/solver/planted-dep.mjs')} ${g.includes('research/solver/planted-dyn.mjs')} ${f.includes('research/solver/planted-dep.mjs')}`, 'true true false']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit((await planted()) ? 1 : 0);
  const panel = readSharePanel(), byId = Object.fromEntries(panel.map(u => [u.id, u]));
  if (args[0] === '--units') { const ids = args[1] === 'pilot' ? pilotIds(panel) : panel.map(u => u.id); unitsOf(ids).forEach(([id, arm], k) => console.log(`${k} ${id} ${arm}`)); console.log(unitsOf(ids).length); process.exit(0); }
  const MODE = args[0], REGISTERED = MODE === 'registered', PILOT = MODE === 'pilot';
  if (!REGISTERED && !PILOT) { console.error('audit-couples-share: registered part k/n, or pilot part k/n'); process.exit(2); }
  { const bad = [...coupleProblems(), ...d80Problems(d80Of())]; if (bad.length) { console.error(`audit-couples-share: ${bad.join('; ')}`); process.exit(2); } }
  for (const arm of ['CANDS', 'CANDH']) if (configOf(arm) !== CONFIG[arm]) { console.error(`audit-couples-share: ${arm}'s configuration hashes ${configOf(arm)}, not the registration's ${CONFIG[arm]}`); process.exit(2); }
  if (REGISTERED && (process.env.SC_PTS || process.env.SC_N || process.env.SC_ONLY || process.env.SHARE_C_OUT)) { console.error('audit-couples-share: the registered run takes no limits'); process.exit(2); }
  if (REGISTERED && process.env.PREDICTION_FILE !== REGISTRATION) { console.error(`audit-couples-share: the registered run runs only under ${REGISTRATION}, through the launcher (PREDICTION_FILE ${process.env.PREDICTION_FILE || 'unset'})`); process.exit(2); }
  // the registered run only on the code the panel was landed on: a change of code means landing again, a new pilot and review
  if (REGISTERED) { const pc = JSON.parse(readFileSync(SHARE_PANEL, 'utf8')).code, cc = codeId(); if (!cc || cc.hash !== pc) { console.error(`audit-couples-share: the code ${cc ? cc.hash : 'unknown'} is not the code the panel was landed on (${pc}): land again, pilot and review again`); process.exit(2); } }
  const seed = REGISTERED ? SEED : PILOT_SEED, reg = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')) : null;
  const only = process.env.SC_ONLY ? new Set(process.env.SC_ONLY.split(',')) : null;
  const ids = (PILOT ? pilotIds(panel) : panel.map(u => u.id)).filter(id => !only || only.has(id));
  if (REGISTERED && ids.some(id => !(reg.paths[id] > 0))) { console.error(`audit-couples-share: ${PATHS_FILE} gives no paths for ${ids.filter(id => !(reg.paths[id] > 0)).join(', ')}`); process.exit(2); }
  const NOf = id => (REGISTERED ? reg.paths[id] : Number(process.env.SC_N) || PILOT_N), pts = Number(process.env.SC_PTS) || PTS;
  const UNITS = unitsOf(ids), [pk, pn] = (args[2] || '0/1').split('/').map(Number);
  const OUT = process.env.SHARE_C_OUT || join(HERE, 'results', REGISTERED ? 'share-c-run' : 'share-c-pilot');
  mkdirSync(OUT, { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  console.log(`ITEM 6 STAGE C${REGISTERED ? '' : ' (THE PILOT)'}: CANDS, CANDH (the first ${CANDH_N} paths) and APP at estate weight ${W}, ${pts} points; seed ${seed}; ${UNITS.length} units; part ${pk}/${pn}; node ${STAMP.node}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const surv = A => (100 * A.survived.reduce((a, x) => a + x, 0) / A.survived.length);

  UNITS.forEach(([id, arm], i) => {
    if (i % pn !== pk) return;
    const u = byId[id], base = u.plan, N = NOf(id), n = pathsFor(arm, N), t0 = Date.now();
    console.log(`${id.padEnd(11)} case | unit ${arm} | ${u.kind} ${u.kind === 'feature' ? u.feature : u.variant} | target ${u.target} paths ${N}, this arm ${n}`);
    const a = armA(appPlan(base), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
    if (a.label !== u.label) { console.error(`audit-couples-share: ${id}: arm A's pick ${a.label} differs from the landing's ${u.label}`); process.exit(3); }
    let ctx, cp = null, solveSecs = 0, ran, mpaaOwn = null;
    if (arm === 'APP') {
      ctx = E.buildContext(E.resolveMpaa(a.planState));
      if (!ctx.guardrails || ctx.lookaheadYears !== 5 || ctx.raiseCapFrac !== 1.1 || ctx.solvencyFloor !== E.num(base.config.solvencyFloor, 0) || !ctx.isCouple) { console.error(`audit-couples-share: ${id} APP: guardrails ${ctx.guardrails}, lookahead ${ctx.lookaheadYears}, raise cap ${ctx.raiseCapFrac}, minimum pot ${ctx.solvencyFloor}, couple ${ctx.isCouple}`); process.exit(3); }
      ran = `armA ${a.label.replace(/ /g, '_')} guardrails ${!!ctx.guardrails} lookahead ${ctx.lookaheadYears} raiseCap ${ctx.raiseCapFrac} minPot ${ctx.solvencyFloor} target ${ctx.targetSpend}`;
    } else {
      cp = solveArm(arm, solverPlan('CANDC', base, aPol, W), pts);
      solveSecs = (Date.now() - t0) / 1000;
      const lines = ['self', 'part'].map(who => settingsOf(cp.tables[who]));
      for (const [k, line] of lines.entries()) { const bad = wantProblems('CANDC', line, W, !!process.env.SC_PTS); if (bad.length) { console.error(`audit-couples-share: ${id} ${arm} ${k ? 'part' : 'self'}: ${bad.join('; ')}`); process.exit(3); } }
      const want = shareWant(arm, base);
      if (Math.abs(cp.share - want.share) > 1e-12 || cp.meta.shareRule !== want.rule) { console.error(`audit-couples-share: ${id} ${arm}: share ${cp.share} rule ${cp.meta.shareRule}, not ${want.share} ${want.rule}`); process.exit(3); }
      if (cp.m.ctx.solvencyFloor !== E.num(base.config.solvencyFloor, 0)) { console.error(`audit-couples-share: ${id} ${arm}: the household's minimum pot ${cp.m.ctx.solvencyFloor}, not the panel's ${base.config.solvencyFloor}`); process.exit(3); }
      const d80 = d80Of(undefined, [cp.tables.self, cp.tables.part]), off = [...coupleProblems(), ...d80Problems(d80)];
      if (off.length) { console.error(`audit-couples-share: ${id} ${arm}: ${off.join('; ')}`); process.exit(3); }
      // the solver arms take arm A's MPAA ages (the report D94 adopted, reports/2026-11-13-d4b-stage-gate.md: "the audit's solver
      // arms will take arm A's MPAA ages from item 6's stage C on"): the age follows each arm's own drawing (E.resolveMpaa: the
      // first year with taxable pension income on the plan's own expected run), and the engine reads it only for a pension's room
      // for dated deposits and staging, which the inputs hash still holds alike; each arm's own ages recorded beside
      const aDemo = E.resolveMpaa(a.planState).demographics, own = [cp.plan.demographics.mpaaAgeSelf, cp.plan.demographics.mpaaAgePart];
      ctx = E.buildContext(withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
      mpaaOwn = own.map(x => (x === '' || x === undefined || x === null ? null : Number(x)));
      ran = `config ${configOf(arm)} hhMinPot ${cp.m.ctx.solvencyFloor} share ${cp.share} shareRule ${cp.meta.shareRule} flat ${COUPLE.flat} fast ${COUPLE.fast} shortlist ${d80.shortlist} item12 ${d80.item12} tieBreak ${d80.tieBreak} | self: ${lines[0]} | part: ${lines[1]}`;
    }
    // the inputs every arm must share (audit-phase4.mjs inputsHash), and the same with each person's MPAA age left out: that age
    // follows the arm's own drawing policy (resolveMpaa; arm A's lump sum against the candidate's draws, as S293's in the couples'
    // re-run, D94), so it may differ between a unit's arms; the read compares the second and names each unit where the ages differ
    const T = ctx.totalYears, inputs = inputsHash(ctx), inputsNoMpaa = inputsHash({ ...ctx, owners: ctx.owners.map(o => ({ ...o, mpaaAge: null })) }), mpaa = ctx.owners.map(o => (Number.isFinite(o.mpaaAge) ? o.mpaaAge : null));
    console.log(`${''.padEnd(11)} ran ${arm}: ${ran} inputs ${inputs} inputsNoMpaa ${inputsNoMpaa} mpaa ${mpaa.join('/')}${solveSecs ? ` | solve secs ${Math.round(solveSecs)}` : ''}`);
    const e0 = Date.now(), paths = E.pathsForSeed(seed, n, T);
    const A = { survived: new Uint8Array(n), wealth: new Float32Array(n), estate: new Float32Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), tax: new Float32Array(n), failYear: new Int16Array(n) };
    let bad = 0;
    paths.forEach((zs0, k) => {
      const zs = Float64Array.from(zs0), o = runPath(ctx, zs, false);
      A.survived[k] = o.survived ? 1 : 0; A.wealth[k] = o.wealth; A.estate[k] = o.estate; A.delivered[k] = o.delivered; A.unmet[k] = o.unmet; A.tax[k] = o.tax; A.failYear[k] = o.failYear;
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet || q.lifetimeTax !== o.tax) bad++; }
    });
    if (bad) { console.error(`audit-couples-share: ${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const eSecs = (Date.now() - e0) / 1000;
    // under the registration a log carries no outcome: its stamp, its record of the settings, its timings and its done line
    // (the design review of 13 Nov, MINOR 5); the pilot's and a smoke's say the survival too
    console.log(`${''.padEnd(11)} run ${arm}: ${REGISTERED ? '' : `engine ${surv(A).toFixed(4)} on ${n}; `}engine secs ${Math.round(eSecs)} (${(1000 * eSecs / n).toFixed(1)} ms a path)`);
    let beside = null;
    if (arm === 'CANDS') {
      const NB = Math.min(n, BESIDE), pb = new Uint8Array(NB); let engineOnly = 0, modelOnly = 0;
      const b0 = Date.now();
      paths.slice(0, NB).forEach((zs, k) => { pb[k] = runCouplePolicy(cp, Float64Array.from(zs)).survived ? 1 : 0; if (A.survived[k] && !pb[k]) engineOnly++; if (pb[k] && !A.survived[k]) modelOnly++; });
      beside = { N: NB, survived: b64(pb), engineOnly, modelOnly, secs: (Date.now() - b0) / 1000 };
      console.log(`${''.padEnd(11)} beside ${arm}: the rollout in the model on ${NB} paths, ${Math.round(beside.secs)} s${REGISTERED ? '' : `: ${(100 * pb.reduce((x, y) => x + y, 0) / NB).toFixed(4)}; the engine alone ${engineOnly}, the model alone ${modelOnly}`}`);
    }
    writeFileSync(join(OUT, fileOf(id, arm)), gzipSync(JSON.stringify({ id, arm, base: u.base, place: u.place, kind: u.kind, variant: u.variant, feature: u.feature, target: ctx.targetSpend, inputs, inputsNoMpaa, mpaa, mpaaOwn, stamp: STAMP, ran, seed, N, n, W, pts,
      share: cp ? cp.share : null, shareRule: cp ? cp.meta.shareRule : null, config: cp ? configOf(arm) : null, solveSecs, engineSecs: eSecs, secs: (Date.now() - t0) / 1000, label: a.label, cpu: cpus()[0].model, beside,
      main: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) })));
    console.log(`${''.padEnd(11)} done ${arm} secs ${Math.round((Date.now() - t0) / 1000)}`);
  });
}
