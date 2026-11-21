/*
 * THE SAVINGS SPLIT'S v2, THE AUDIT (SAVE-V2.md; registrations/save-v2.md, DRAFT; D130 (7), D133): each household of
 * save-v2-panel.json solved and run under four arms at estate weight 0.02 and 45 points, one arm at a time in one process,
 * each by the engine on the same paths of the unit's seed, in the order ALL_ARMS rotated by the unit's number:
 *   CANDD   the candidate as it stands (candidate.json, 17ff82379838) on the whole menu: its `coarse` key taken out;
 *   CANDS   the same with the savings split (`saveSplit: true`, SAVINGS-SPLIT.md): each working year's move also chooses
 *           where the year's pension and ISA saving goes (0 the plan's own, 1 the pension first, 2 the ISA first);
 *   CANDDA, CANDSA  the same two on anchors, the menu the candidate ships with (candidate.mjs solveCandidate, solve.js
 *           coarseWhereFits: anchors where the solve can take them, the whole menu with its reason where it cannot), beside,
 *           deciding nothing in the rule, on each household's first ANCHORS_N paths (D133 (3)).
 * Every arm solves the plan arm A's policy names (audit-phase4.mjs solverPlanOf, D37), as the factorial's did. Checked before
 * any path, a failure ending the unit (exit 3): arm A's pick the landing's; each arm's settings line the candidate's
 * (audit-couples.mjs wantProblems 'CANDC'; its solve on anchors none on the whole menu, the candidate's where the solve can
 * take it on anchors), its saveSplit, its tie-break above the estate cap, failDelivered, lambda, the tier state and switch
 * charge; a split arm's menu carrying the save copies; every arm on one plan (its inputs hash), one horizon and the same
 * working years with a save to choose, at least one. Each arm's first CHECK paths are held to E.runTrial. On its first BESIDE
 * paths runPolicy runs beside the engine (a fidelity gap, reported, not deciding) and records, at each working year with a
 * save to choose, the save the move takes and its tier pair (D130 (7)), and the pension, ISA and taxable pots at the top of
 * the first retired year. Each arm is saved in chunks of CHUNK paths and resumes from them. Under the registration a log
 * carries no outcome.
 *   node research/solver/audit-save-v2.mjs --units [pilot|preflight]
 *   node research/solver/audit-save-v2.mjs registered part k/n     the registered run (through the launcher only)
 *   node research/solver/audit-save-v2.mjs pilot part k/n          the pilot: seed 7002, PILOT_N paths, its households
 *   node research/solver/audit-save-v2.mjs preflight part k/n      the households the pilot does not run: every check before
 *                                                                   any path, then PREFLIGHT_N paths (EXPLORATORY, no outcome)
 *   node research/solver/audit-save-v2.mjs --planted               the checks on planted inputs
 *   SV_PTS the points (smoke only); SV_N the paths (pilot or smoke); SV_ONLY a comma list of ids (pilot or smoke); SV_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { solveCandidate, CANDIDATE_HASH, CANDIDATE_OPTS, hashOf } from './candidate.mjs';
import { appPlan } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf, inputsHash, LAMBDA } from './audit-phase4.mjs';
import { choiceYears } from './audit-save.mjs';
import { wantProblems, COARSE_ON } from './audit-couples.mjs';
import { settingsOf } from './audit-couples-share.mjs';
import { readSaveV2Panel } from './save-v2-panel.mjs';
import { codeId, codeFiles } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus, loadavg, hostname } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const SEED = 7025, PILOT_SEED = 7002, PTS = 45, W = 0.02, CHECK = 200, BESIDE = 1000, PILOT_N = 1000, PREFLIGHT_N = 2, WARM = 3, CHUNK = 1000, ANCHORS_N = 4000;
export const ARMS = ['CANDD', 'CANDS'], BESIDE_ARMS = ['CANDDA', 'CANDSA'], ALL_ARMS = [...ARMS, ...BESIDE_ARMS];
export const REGISTRATION = 'research/solver/registrations/save-v2.md';
export const PATHS_FILE = join(HERE, 'save-v2-paths.json');
export const isSplit = arm => arm === 'CANDS' || arm === 'CANDSA', onAnchors = arm => BESIDE_ARMS.includes(arm);
export const nOf = (arm, N) => (onAnchors(arm) ? Math.min(ANCHORS_N, N) : N);
export const orderOf = k => [...ALL_ARMS.slice(k % ALL_ARMS.length), ...ALL_ARMS.slice(0, k % ALL_ARMS.length)];
export const partOf = (out, id, arm) => join(out, 'parts', `${id}-${arm}.json.gz`);
export const fileOf = id => `${id}.json.gz`;
/* each arm's options, hashed as candidate.mjs hashes the candidate's: the whole menu is the candidate less its `coarse` */
const { coarse: _coarse, ...WHOLE } = CANDIDATE_OPTS;
export const BASE = Object.freeze({ CANDD: WHOLE, CANDS: WHOLE, CANDDA: CANDIDATE_OPTS, CANDSA: CANDIDATE_OPTS });
export const CONFIG = Object.freeze(Object.fromEntries(ALL_ARMS.map(a => [a, { ...BASE[a], ...(isSplit(a) ? { saveSplit: true } : {}) }])));
export const configOf = arm => hashOf(CONFIG[arm]);
/* the pilot: the younger cohort's places 0 and 5, and the library's place 0 (five working years to choose) and place 23
   (fifteen: the design review's MINOR 5, the library's places 16 to 29 having fifteen), one household on each core */
export const PILOT_PLACES = [['fire', 0], ['fire', 5], ['lib', 0], ['lib', 23]];
export const pilotUnits = panel => panel.filter(u => PILOT_PLACES.some(([c, p]) => u.cohort === c && u.place === p));
export const notPilot = panel => { const ids = new Set(pilotUnits(panel).map(u => u.id)); return panel.filter(u => !ids.has(u.id)); };
/*
 * THE STAMP (as step 8's audit's): every file the run and its read take beyond the code (code-id.mjs codeFiles), found by
 * following the imports of the audit, the read, the sizing, the panel's script and the batch to the end, and the data files
 * they read: the panel, its frozen orders, the paths, and the candidate's settings and its tiers' returns (candidate.mjs reads
 * them from disk). `read` and `exists` are the planted checks' way in.
 */
export const STAMP_ROOTS = ['research/solver/audit-save-v2.mjs', 'research/solver/reduce-save-v2.mjs', 'research/solver/size-save-v2.mjs', 'research/solver/save-v2-panel.mjs', 'research/solver/batch-save-v2.sh'];
export const STAMP_DATA = ['research/solver/save-v2-panel.json', 'research/solver/save-v2-orders.json', 'research/solver/save-v2-paths.json', 'research/solver/candidate.json', 'research/solver/results-o60.txt'];
export function stampFiles(root = REPO, read = f => readFileSync(join(root, f), 'utf8'), exists = f => existsSync(join(root, f))) {
  const code = new Set(codeFiles(root)), seen = new Set(STAMP_ROOTS), queue = [...STAMP_ROOTS], out = [...STAMP_ROOTS];
  while (queue.length) {
    const f = queue.shift();
    if (!exists(f)) continue;
    // a shell script is read for the solver scripts it names alone (its inline `node -e` imports resolve from the repository's
    // root, not from the script's folder: step 8's stamp carries such an import as a missing file)
    if (!/\.sh$/.test(f)) for (const m of read(f).matchAll(/(?:from\s+|import\s*\(\s*|import\s+|require\s*\(\s*|new\s+URL\s*\(\s*)['"]([^'"]+)['"]/g)) {
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
/* an arm's settings line against the candidate's (audit-couples.mjs wantProblems 'CANDC', whose solve on anchors is the
   candidate's where the joint tier state is, off with its reason where not): on the whole menu, none */
export function settingsProblems(arm, line, smoke = false) {
  const whole = !onAnchors(arm), P = wantProblems('CANDC', line, W, smoke).filter(p => !(whole && p.startsWith('coarse ')));
  if (whole) { const got = (line.match(/ coarse (\S+)/) || [])[1]; if (got !== 'none') P.push(`coarse ${got} (want none: the whole menu)`); }
  return P;
}
/* what each arm must have run, from its solve */
export function armProblems(arm, r) {
  const P = [], split = isSplit(arm);
  if ((r.meta.saveSplit === 'on') !== split) P.push(`saveSplit ${r.meta.saveSplit || 'off'} on ${arm}`);
  if (split && !r.actions.some(a => a.save)) P.push('no save copies on the menu');
  if (r.meta.failDelivered !== true) P.push(`failDelivered ${r.meta.failDelivered}`);
  if (Math.abs(r.lambda - LAMBDA) > 1e-15) P.push(`lambda ${r.lambda}, not ${LAMBDA}`);
  if (!r.meta.tierState || Math.abs(r.switchCharge - CANDIDATE_OPTS.switchCharge) > 1e-15) P.push(`tier state ${r.meta.tierState}, switch charge ${r.switchCharge}`);
  if (r.meta.tieAboveCap !== CANDIDATE_OPTS.tieAboveCap) P.push(`tieAboveCap ${r.meta.tieAboveCap}, not the candidate's ${CANDIDATE_OPTS.tieAboveCap}`);
  return P;
}
/* the arms of one household against each other: one plan, one horizon, the same working years with a save to choose */
export function sameProblems(seen) {
  const P = [], arms = Object.keys(seen);
  for (const k of ['inputs', 'T', 'retireT']) if (new Set(arms.map(a => seen[a][k])).size > 1) P.push(`its arms differ in ${k} (${arms.map(a => `${a} ${seen[a][k]}`).join(', ')})`);
  if (new Set(arms.map(a => js(seen[a].workT))).size > 1) P.push('its arms differ in the working years with a save to choose');
  if (arms.some(a => !seen[a].workT.length)) P.push('no working year with a save to choose');
  return P;
}

async function planted() {
  const cases = [];
  cases.push(['the four configurations differ; the anchors arm without the split is the candidate itself', `${ALL_ARMS.map(configOf).every((c, i, x) => x.indexOf(c) === i)} ${configOf('CANDDA') === CANDIDATE_HASH}`, 'true true']);
  { const keys = Object.keys(CANDIDATE_OPTS).filter(k => k !== 'coarse'), same = Object.keys(CONFIG.CANDD).length === keys.length && keys.every(k => js(CONFIG.CANDD[k]) === js(CANDIDATE_OPTS[k]));
    cases.push(['the whole menu is the candidate less its solve on anchors and nothing else; the split arms add the split alone', `${'coarse' in CONFIG.CANDD} ${!!CANDIDATE_OPTS.coarse} ${same} ${CONFIG.CANDS.saveSplit} ${CONFIG.CANDSA.saveSplit} ${'saveSplit' in CONFIG.CANDD} ${Object.keys(CONFIG.CANDS).length - Object.keys(CONFIG.CANDD).length}`, 'false true true true true false 1']); }
  cases.push(['the arms\' order rotates with the unit', [0, 1, 2, 3, 4].map(k => orderOf(k)[0]).join(','), 'CANDD,CANDS,CANDDA,CANDSA,CANDD']);
  cases.push(['the anchors arms run the first 4,000 paths, the whole menu\'s all', `${nOf('CANDD', 16000)} ${nOf('CANDSA', 16000)} ${nOf('CANDDA', 1000)}`, '16000 4000 1000']);
  cases.push(['the pilot\'s households: the younger cohort\'s places 0 and 5 and the library\'s 0 and 15',
    pilotUnits([{ id: 'a', cohort: 'fire', place: 0 }, { id: 'b', cohort: 'fire', place: 1 }, { id: 'c', cohort: 'fire', place: 5 }, { id: 'd', cohort: 'lib', place: 0 }, { id: 'e', cohort: 'lib', place: 23 }, { id: 'f', cohort: 'lib', place: 5 }, { id: 'g', cohort: 'lib', place: 15 }]).map(u => u.id).join(','), 'a,c,d,e']);
  { const f = stampFiles(), need = ['research/solver/reduce-share-rules.mjs', 'research/solver/fair-gate.mjs', 'research/solver/stats.mjs', 'research/solver/candidate.mjs', 'research/solver/b7-verdict.mjs', 'research/solver/save-v2-panel.mjs', ...STAMP_DATA];
    cases.push(['the stamp holds the read\'s library, the candidate\'s settings and the data files, and none of the code\'s own', `${need.every(x => f.includes(x))} ${f.some(x => x === 'research/engine.mjs' || x.startsWith('src/solver/'))}`, 'true false']);
    const text = rel => readFileSync(join(REPO, rel), 'utf8'), q = name => ['\'', './', name, '\''].join('');
    const lines = ['\n', 'import', ' ', q('planted-dep.mjs'), ';\nconst x = await ', 'import', '(', q('planted-dyn.mjs'), ');\n'].join('');
    const isPlanted = rel => /planted-(dep|dyn)\.mjs$/.test(rel), read = rel => (isPlanted(rel) ? '' : rel === 'research/solver/reduce-save-v2.mjs' ? (existsSync(join(REPO, rel)) ? text(rel) : '') + lines : text(rel)), exists = rel => isPlanted(rel) || existsSync(join(REPO, rel));
    const g = stampFiles(REPO, read, exists);
    cases.push(['a planted import in the read, static or dynamic, joins the stamp', `${g.includes('research/solver/planted-dep.mjs')} ${g.includes('research/solver/planted-dyn.mjs')}`, 'true true']);
    cases.push(['every file the stamp names exists but the data the run writes (the batch\'s inline import not read as a file)', f.filter(x => !existsSync(join(REPO, x)) && !['research/solver/save-v2-panel.json', 'research/solver/save-v2-orders.json', 'research/solver/save-v2-paths.json'].includes(x)).join(',') || 'none', 'none']); }
  // the settings line: a real line of the candidate's (S025-own's household table, 19 Nov) as each menu records it
  { const real = 'pts 45 mix 3 lambda 0.0223606797749979 bequestWeight 0.02 levels 1,1.1,0.95,0.9,0.8 raiseW 0.003 finalIntegral true bridgeRead reader readerRef adaptive readerSplit rs tierState 0/0,1/1,2/2,3/3 tiersBelow 3 tableDealing false switchCharge 0.001 e3 true e3pcls true hr yes jointWorlds true bridgeStep exact switchMargin 0 pclsInterp true lattice unbuilt failDelivered true minPot 22500 readerYears 0 sweepCashIsaTo isa coarse ' + COARSE_ON;
    const whole = real.replace(/coarse \S+$/, 'coarse none');
    cases.push(['the settings: on anchors the candidate\'s line clean, on the whole menu its line without anchors clean', `${settingsProblems('CANDDA', real).length} ${settingsProblems('CANDD', whole).length}`, '0 0']);
    cases.push(['the settings: anchors on a whole-menu arm, none on an anchors arm, and two tier steps, each named', `${settingsProblems('CANDS', real).join(';')} | ${settingsProblems('CANDSA', whole).join(';')} | ${settingsProblems('CANDD', whole.replace('tiersBelow 3', 'tiersBelow 2')).join(';')}`, `coarse ${COARSE_ON} (want none: the whole menu) | coarse none (want ${COARSE_ON}: the joint tier state) | tiersBelow 2 (want 3)`]); }
  // what each arm ran, on planted solves: a clean one of each kind, then each fault named
  { const r = (o = {}) => ({ meta: { saveSplit: o.saveSplit, failDelivered: true, tierState: '0/0,1/1', tieAboveCap: CANDIDATE_OPTS.tieAboveCap, ...(o.meta || {}) }, actions: o.actions || [{ save: 0 }, { save: o.copies === false ? 0 : 1 }], lambda: LAMBDA, switchCharge: CANDIDATE_OPTS.switchCharge, ...(o.top || {}) });
    cases.push(['each arm\'s solve clean', `${armProblems('CANDD', r()).length} ${armProblems('CANDS', r({ saveSplit: 'on' })).length}`, '0 0']);
    const faults = [['the split off on CANDS', armProblems('CANDS', r()), /saveSplit off on CANDS/], ['the split on CANDD', armProblems('CANDD', r({ saveSplit: 'on' })), /saveSplit on on CANDD/],
      ['no save copies', armProblems('CANDSA', r({ saveSplit: 'on', copies: false })), /no save copies/], ['failDelivered off', armProblems('CANDD', r({ meta: { failDelivered: false } })), /failDelivered false/],
      ['another lambda', armProblems('CANDD', r({ top: { lambda: 0.03 } })), /lambda 0.03/], ['no tier state', armProblems('CANDD', r({ meta: { tierState: null } })), /tier state null/],
      ['no tie-break', armProblems('CANDD', r({ meta: { tieAboveCap: undefined } })), /tieAboveCap undefined/]];
    const missed = faults.filter(([, P, re]) => !P.some(x => re.test(x))).map(([n]) => n);
    cases.push([`each fault in an arm's solve named (${faults.length})`, missed.join(', ') || 'all named', 'all named']); }
  { const one = (o = {}) => ({ inputs: 'i', T: 40, retireT: 10, workT: [0, 1, 2], ...o });
    cases.push(['the arms of one household: clean; another plan, another horizon, other working years, none to choose', `${sameProblems({ CANDD: one(), CANDS: one() }).length} | ${sameProblems({ CANDD: one(), CANDS: one({ inputs: 'j' }) }).length} ${sameProblems({ CANDD: one(), CANDS: one({ T: 41 }) }).length} ${sameProblems({ CANDD: one(), CANDS: one({ workT: [0, 1] }) }).length} ${sameProblems({ CANDD: one({ workT: [] }), CANDS: one({ workT: [] }) }).length}`, '0 | 1 1 1 1']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit((await planted()) ? 1 : 0);
  const panel = readSaveV2Panel();
  if (args[0] === '--units') { const us = args[1] === 'pilot' ? pilotUnits(panel) : args[1] === 'preflight' ? notPilot(panel) : panel; us.forEach((u, k) => console.log(`${k} ${u.id}`)); console.log(us.length); process.exit(0); }
  const REGISTERED = args[0] === 'registered', PREFLIGHT = args[0] === 'preflight', PILOT = args[0] === 'pilot' || PREFLIGHT;
  if (!REGISTERED && !PILOT) { console.error('audit-save-v2: registered part k/n, pilot part k/n, or preflight part k/n'); process.exit(2); }
  if (REGISTERED && (process.env.SV_PTS || process.env.SV_N || process.env.SV_ONLY || process.env.SV_OUT)) { console.error('audit-save-v2: the registered run takes no limits'); process.exit(2); }
  if (REGISTERED && process.env.PREDICTION_FILE !== REGISTRATION) { console.error(`audit-save-v2: the registered run runs only under ${REGISTRATION}, through the launcher (PREDICTION_FILE ${process.env.PREDICTION_FILE || 'unset'})`); process.exit(2); }
  if (CANDIDATE_HASH !== '17ff82379838') { console.error(`audit-save-v2: the candidate is ${CANDIDATE_HASH}, not 17ff82379838 (SAVE-V2.md)`); process.exit(2); }
  // the registered run only on the code the panel was landed on: a change of code means landing again, a new pilot and review
  if (REGISTERED) { const pc = JSON.parse(readFileSync(join(HERE, 'save-v2-panel.json'), 'utf8')).code, cc = codeId(); if (!cc || cc.hash !== pc) { console.error(`audit-save-v2: the code ${cc ? cc.hash : 'unknown'} is not the code the panel was landed on (${pc})`); process.exit(2); } }
  const seed = REGISTERED ? SEED : PILOT_SEED, reg = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')) : null;
  const only = process.env.SV_ONLY ? new Set(process.env.SV_ONLY.split(',')) : null;
  const units = (PREFLIGHT ? notPilot(panel) : PILOT ? pilotUnits(panel) : panel).filter(u => !only || only.has(u.id));
  if (REGISTERED && units.some(u => !(reg.paths[u.id] > 0))) { console.error(`audit-save-v2: ${PATHS_FILE} gives no paths for ${units.filter(u => !(reg.paths[u.id] > 0)).map(u => u.id).join(', ')}`); process.exit(2); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === units.length && pk >= 0 && pk < pn)) { console.error(`audit-save-v2: part k/${units.length}`); process.exit(2); }
  const pts = Number(process.env.SV_PTS) || PTS, U = units[pk], N = REGISTERED ? reg.paths[U.id] : Number(process.env.SV_N) || (PREFLIGHT ? PREFLIGHT_N : PILOT_N);
  const smoke = pts !== PTS, OUT = process.env.SV_OUT || join(HERE, 'results', REGISTERED ? 'save-v2-run' : PREFLIGHT ? 'save-v2-preflight' : 'save-v2-pilot');
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  const PROC = `${hostname()}:${process.pid}:${Date.now()}`, t0 = Date.now(), order = orderOf(pk);
  console.log(`THE SAVINGS SPLIT'S v2${REGISTERED ? '' : PREFLIGHT ? ' (THE PREFLIGHT, EXPLORATORY)' : ' (THE PILOT, EXPLORATORY)'}: unit ${pk}/${pn}: ${U.id} (${U.cohort}, place ${U.place}, ${U.status}), target ${U.target}, seed ${seed}, ${N} paths (on anchors ${nOf('CANDDA', N)}), ${pts} points, estate weight ${W}; configs ${ALL_ARMS.map(x => `${x} ${configOf(x)}`).join(', ')}; the order ${order.join(', ')}; node ${STAMP.node}`);
  const a = armA(appPlan(U.plan), { tournament: false });
  if (a.label !== U.label) { console.error(`audit-save-v2: ${U.id}: arm A's pick ${a.label} differs from the landing's ${U.label}`); process.exit(3); }
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  const plan = prep(solverPlanOf(U.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy }));
  const light = smoke && pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const solveArm = arm => solveCandidate(E, M, plan, { lambda: LAMBDA, points: pts, bequestWeight: W, ...(isSplit(arm) ? { saveSplit: true } : {}), ...light }, BASE[arm]);
  let paths = null, T0 = null;
  const seen = {}, arms = {};
  for (const arm of order) {
    // one arm's solve held at a time: solved, checked, its paths run in chunks (resumed from a saved part), its record kept
    const s0 = Date.now(), r = solveArm(arm), solveSecs = (Date.now() - s0) / 1000, n = nOf(arm, N), o = { config: configOf(arm) };
    const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, self = ctx.owners.find(x => x.key === 'self');
    const retireT = Math.max(0, Math.min(T + 1, self.retireAge - ctx.ageSelf0)), workT = choiceYears(ctx), line = settingsOf(r);
    seen[arm] = { inputs: inputsHash(ctx), T, retireT, workT, baseYear: ctx.baseYear };
    const off = [...armProblems(arm, r), ...(smoke ? [] : settingsProblems(arm, line)), ...sameProblems(seen)];
    if (off.length) { console.error(`audit-save-v2: ${U.id} ${arm}: ${off.join('; ')}`); process.exit(3); }
    if (paths === null) { T0 = T; paths = E.pathsForSeed(seed, N, T).map(zs => Float64Array.from(zs)); }
    const before = await digestOf(tablesOf(r)), pf = partOf(OUT, U.id, arm), menu = r.meta.coarse ? (r.meta.coarse.off ? `whole (${r.meta.coarse.off})` : 'anchors') : 'whole';
    console.log(`${''.padEnd(8)} solved ${arm}: ${Math.round(solveSecs)} s; menu ${menu}, ${r.actions.length} moves; saveSplit ${r.meta.saveSplit || 'off'}; working years to choose ${workT.length ? `${workT[0]}-${workT[workT.length - 1]}` : 'none'}; the first retired year ${retireT}`);
    // each year's spending level on every path, in percent of the schedule's target (runPath's level, as the factorial kept
    // it: the design review's MINOR 7), path k's years at k * Y
    const Y = T + 1;
    let A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)])), L = new Uint8Array(n * Y), done = 0, chunks = [];
    if (existsSync(pf)) {
      const P = JSON.parse(gunzipSync(readFileSync(pf)).toString());
      if (P.stamp.code === STAMP.code && P.stamp.audit === STAMP.audit && P.stamp.prediction === STAMP.prediction && P.stamp.sha === STAMP.sha && P.stamp.node === STAMP.node && P.seed === seed && P.N === n && P.pts === pts && P.digest === before && js(P.options) === js(o)) {
        A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arrays[k], Ty)])); L = dec(P.arrays.level, Uint8Array); done = P.done; chunks = P.chunks;
        if (L.length !== n * Y) { console.error(`audit-save-v2: ${U.id} ${arm}: a saved part's levels are not ${n} paths of ${Y} years`); process.exit(3); }
        console.log(`${''.padEnd(8)} resumed ${arm} at path ${done} of ${n}, from a part saved by ${[...new Set(chunks.map(c => c.proc))].join(', ')}`);
      } else console.log(`${''.padEnd(8)} a saved part of ${arm} is not this unit's as solved now: ${arm} starts again`);
    }
    if (done < n) for (let k = 0; k < Math.min(WARM, n); k++) runPath(ctx, paths[k], false);
    while (done < n) {
      const to = Math.min(n, done + CHUNK), load0 = loadavg()[0], c0 = process.cpuUsage(), w0 = performance.now();
      for (let k = done; k < to; k++) {
        const q = runPath(ctx, paths[k], true);
        L.set(q.level, k * Y);
        A.survived[k] = q.survived ? 1 : 0; A.failYear[k] = q.failYear; A.pot[k] = q.wealth; A.estate[k] = q.estate; A.tax[k] = q.tax; A.delivered[k] = q.delivered; A.unmet[k] = q.unmet;
      }
      const c = process.cpuUsage(c0);
      chunks.push({ from: done, to, cpuUs: c.user + c.system, wallMs: performance.now() - w0, load: [load0, loadavg()[0]], cpu: cpus()[0].model, proc: PROC });
      done = to;
      const tmp = `${pf}.tmp`;
      writeFileSync(tmp, gzipSync(js({ stamp: STAMP, seed, N: n, pts, digest: before, options: o, done, chunks, arrays: { ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])), level: b64(L) } })));
      renameSync(tmp, pf);
    }
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, paths[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) { console.error(`audit-save-v2: ${U.id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    // runPolicy beside the engine on the first BESIDE paths: the save each working year's move takes and its tier pair
    // (D130 (7)), the pots at the top of the first retired year, and the paths on which the two differ in survival
    const NB = Math.min(n, BESIDE), nw = workT.length, save = new Uint8Array(NB * nw), tierPen = new Uint8Array(NB * nw), tierIsa = new Uint8Array(NB * nw);
    const pots = { pen: new Float64Array(NB), isa: new Float64Array(NB), gia: new Float64Array(NB) }, pb = new Uint8Array(NB), b0 = Date.now();
    let engineOnly = 0, policyOnly = 0;
    for (let k = 0; k < NB; k++) {
      const q = runPolicy(r, paths[k], { visit: (t, s, held, ai) => {
        const d = workT.indexOf(t), act = r.actions[ai];
        if (d >= 0) { save[k * nw + d] = act.save || 0; tierPen[k * nw + d] = act.tierPen || 0; tierIsa[k * nw + d] = act.tierIsa || 0; }
        if (t === retireT) { pots.pen[k] = s[0]; pots.isa[k] = s[1]; pots.gia[k] = s[2]; }
      } });
      pb[k] = q.survived ? 1 : 0; if (A.survived[k] && !pb[k]) engineOnly++; if (pb[k] && !A.survived[k]) policyOnly++;
    }
    const beside = { N: NB, years: nw, survived: b64(pb), engineOnly, policyOnly, save: b64(save), tierPen: b64(tierPen), tierIsa: b64(tierIsa), pots: Object.fromEntries(Object.entries(pots).map(([k, v]) => [k, b64(v)])), secs: (Date.now() - b0) / 1000 };
    const after = await digestOf(tablesOf(r));
    if (after !== before) { console.error(`audit-save-v2: ${U.id} ${arm}: the tables changed while the paths ran`); process.exit(3); }
    const cpuUs = chunks.reduce((t, x) => t + x.cpuUs, 0), procs = [...new Set(chunks.map(x => x.proc))];
    arms[arm] = { ...o, n, menu, coarse: r.meta.coarse ? (r.meta.coarse.off ? `off:${r.meta.coarse.off}` : 'on') : 'none', saveSplit: r.meta.saveSplit || 'off', tieAboveCap: r.meta.tieAboveCap, actions: r.actions.length, settings: line, digest: before, ...seen[arm],
      cpuUs, wallMs: chunks.reduce((t, x) => t + x.wallMs, 0), chunks, procs, cpus: [...new Set(chunks.map(x => x.cpu))], place: order.indexOf(arm), solveSecs, beside, estateCap: r.estateCap, Y, level: b64(L), ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    // under the registration a log carries no outcome: its stamp, its settings, its timings and its done line
    console.log(`${''.padEnd(8)} done ${arm}: config ${o.config}; ${REGISTERED || smoke ? '' : `engine ${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)}% on ${n}; the engine alone ${engineOnly}, runPolicy alone ${policyOnly} of ${NB}; `}CPU ${(cpuUs / 1e6).toFixed(0)} s (${(cpuUs / 1e3 / n).toFixed(1)} ms a path), in ${procs.length} process${procs.length > 1 ? 'es' : ''}; beside ${Math.round(beside.secs)} s`);
  }
  writeFileSync(join(OUT, fileOf(U.id)), gzipSync(js({ k: pk, id: U.id, base: U.base, cohort: U.cohort, place: U.place, status: U.status, target: U.target, label: a.label, selfEmployed: U.plan.demographics.employmentSelf === 'self-employed', baseYear: seen[order[0]].baseYear, seed, N, nAnchors: nOf('CANDDA', N), warm: WARM, pts, W, stamp: STAMP, configs: Object.fromEntries(ALL_ARMS.map(x => [x, configOf(x)])), order, T: T0, arms })));
  for (const arm of ALL_ARMS) rmSync(partOf(OUT, U.id, arm), { force: true });
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
