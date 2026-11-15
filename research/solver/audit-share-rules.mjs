/*
 * THE SHARE RULES' TEST, THE AUDIT (registrations/share-rules.md, DRAFT; D104 (5)): each unit of share-rules-panel.json run
 * in up to three arms at estate weight 0.02, each by the engine on the same paths of the unit's seed:
 *   TODAY  the couples' candidate as the app solves a couple (audit-couples-share.mjs COUPLES_CANDIDATE, 45 points, each
 *          person's table with the partner's age), each person's table on the share couple.js shareBy gives under 'pots',
 *          the couples' default since D99 (half inside 40% to 60%, the pots' share outside it, held to 5% to 95%);
 *   FLAT   the same under 'potsflat' (the pots' share for every couple, the band dropped), run only where its share differs
 *          from TODAY's (on the 90/10 units the two are one share, and the read takes TODAY's runs for both);
 *   MEANS  the same under 'means' (the share of the two people's means).
 * Each arm's solve is checked as it runs: each person's settings against the couples' registered run's (audit-couples.mjs
 * wantProblems), the share and rule against shareBy on the unit's plan, the household's minimum pot, the couples' path
 * (COUPLE.flat and .fast on) and D80 (no shortlist, item 12 option or tie-break). Each arm's first CHECK paths are held to
 * E.runTrial; its first BESIDE paths are run by the couples' rollout in the exact model beside the engine (a fidelity gap
 * reported, not deciding). The solver arms take arm A's MPAA ages, as stage C's did.
 * Units go to results/share-rules-run/ (registered) or results/share-rules-pilot/ (the pilot), SHARE_RULES_OUT overriding:
 * case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and <unit>-<arm>.json.gz. reduce-share-rules.mjs reads them.
 *   node research/solver/audit-share-rules.mjs --units [pilot]       the units (and their numbers)
 *   node research/solver/audit-share-rules.mjs registered part k/n    the registered run (through the launcher only)
 *   node research/solver/audit-share-rules.mjs pilot part k/n         the pilot: seed 7002, PILOT_N paths, the pilot's units
 *   node research/solver/audit-share-rules.mjs --planted              the checks on planted inputs
 *   SR_PTS the points (smoke only); SR_N the paths (pilot or smoke); SR_ONLY a comma list of unit ids (pilot or smoke)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { hashOf } from './candidate.mjs';
import { appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, inputsHash } from './audit-phase4.mjs';
import { solverPlan, wantProblems, coupleProblems, d80Of, d80Problems } from './audit-couples.mjs';
import { COUPLES_CANDIDATE, settingsOf } from './audit-couples-share.mjs';
import { readSharePanel, PANEL } from './share-rules-panel.mjs';
import { codeId, codeFiles } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
const { solveCouple, withCouple, runCouplePolicy, COUPLE, shareBy } = CPL;
export const SEED = 7023, PILOT_SEED = 7002, PTS = 45, W = 0.02, CHECK = 200, BESIDE = 500, PILOT_N = 1000;
export const ARMS = ['TODAY', 'FLAT', 'MEANS'];
export const RULE_OF = { TODAY: 'pots', FLAT: 'potsflat', MEANS: 'means' };
export const REGISTRATION = 'research/solver/registrations/share-rules.md';
export const PATHS_FILE = join(HERE, 'share-rules-paths.json');
export const configOf = arm => hashOf({ ...COUPLES_CANDIDATE, shareRule: RULE_OF[arm] });
/* the pilot: three couples of the panel, an older, a middle and a younger one, each unit of theirs (places 0, 4 and 6) */
export const PILOT_PLACES = [0, 4, 6];
/* the share each arm solves a unit on (couple.js shareBy on the unit's plan), and whether FLAT runs it at all */
export const shareOfArm = (arm, plan) => shareBy(E, plan, RULE_OF[arm]);
export const flatRuns = plan => Math.abs(shareOfArm('FLAT', plan) - shareOfArm('TODAY', plan)) > 1e-12;
/*
 * THE STAMP (as stage C's, audit-couples-share.mjs stampFiles): every file the run and its read take beyond the code
 * (code-id.mjs codeFiles), found by following the imports of the audit, the read, the sizing, the panel's script and the batch
 * to the end, and the data files they read: the panel, its frozen order and the paths. `read` and `exists` are the planted
 * checks' way in.
 */
export const STAMP_ROOTS = ['research/solver/audit-share-rules.mjs', 'research/solver/reduce-share-rules.mjs', 'research/solver/size-share-rules.mjs', 'research/solver/share-rules-panel.mjs', 'research/solver/batch-share-rules.sh'];
export const STAMP_DATA = ['research/solver/share-rules-panel.json', 'research/solver/share-rules-orders.json', 'research/solver/share-rules-paths.json'];
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
/* the units: every unit's TODAY first, then MEANS, then FLAT where its share differs from TODAY's */
export const unitsOf = units => [...units.map(u => [u.id, 'TODAY']), ...units.map(u => [u.id, 'MEANS']), ...units.filter(u => flatRuns(u.plan)).map(u => [u.id, 'FLAT'])];
export const fileOf = (id, arm) => `${id}-${arm.toLowerCase()}.json.gz`;
export const pilotUnits = panel => panel.filter(u => PILOT_PLACES.includes(u.place));
/* an arm's couple, each person's table solved as the app solves it, on the couples' candidate at the arm's rule */
export function solveArm(arm, hp, pts) {
  const one = (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined } });
  return solveCouple(E, M, hp, { shareRule: RULE_OF[arm], solveOne: one });
}

async function planted() {
  const cases = [], panel = readSharePanel();
  cases.push(['the configurations: one each, the couples\' candidate at each rule', ARMS.map(configOf).every((c, i, a) => a.indexOf(c) === i) ? 'three' : 'NOT three', 'three']);
  cases.push(['the couples\' candidate carries no tie-break', `${'tieAboveCap' in COUPLES_CANDIDATE}`, 'false']);
  { const ids = unitsOf(panel), n90 = panel.filter(u => u.variant === '90').length;
    cases.push(['the units: TODAY and MEANS on every unit, FLAT on every unit but the 90/10 ones', `${ids.filter(x => x[1] === 'TODAY').length} ${ids.filter(x => x[1] === 'MEANS').length} ${ids.filter(x => x[1] === 'FLAT').length}`, `${panel.length} ${panel.length} ${panel.length - n90}`]); }
  { const u45 = panel.find(u => u.variant === '45'), u90 = panel.find(u => u.variant === '90');
    cases.push(['the shares: on a 45 unit TODAY 0.5 and FLAT 0.45; on a 90 unit TODAY and FLAT 0.9, FLAT not run', `${shareOfArm('TODAY', u45.plan)} ${shareOfArm('FLAT', u45.plan).toFixed(4)} ${shareOfArm('FLAT', u90.plan).toFixed(4)} ${flatRuns(u90.plan)}`, '0.5 0.4500 0.9000 false']); }
  cases.push(['the pilot\'s units: every unit of places 0, 4 and 6', pilotUnits([{ id: 'a', place: 0 }, { id: 'b', place: 1 }, { id: 'c', place: 4 }, { id: 'd', place: 6 }, { id: 'e', place: 6 }]).map(u => u.id).join(','), 'a,c,d,e']);
  { const tab = (meta = {}) => ({ meta: { ...meta }, worlds: [], mix: null });
    cases.push(['D80: a person\'s table with the tie-break is refused; one without it is not', `${d80Problems(d80Of(undefined, [tab({ tieAboveCap: 1e-4 })])).length > 0} ${d80Problems(d80Of(undefined, [tab()])).length}`, 'true 0']); }
  { const f = stampFiles(), need = ['research/solver/reduce-phase4.mjs', 'research/solver/fair-gate.mjs', 'research/solver/stats.mjs', 'research/solver/paired-exact.mjs', 'research/solver/reduce-couples.mjs', 'src/solverApp.js', 'src/solverSettings.js', ...STAMP_DATA];
    cases.push(['the stamp holds every file the read decides with and the data files, and none of the code\'s own (code-id.mjs)', `${need.every(x => f.includes(x))} ${f.some(x => x === 'research/engine.mjs' || x.startsWith('src/solver/'))}`, 'true false']);
    const text = rel => readFileSync(join(REPO, rel), 'utf8');
    const q = name => ['\'', './', name, '\''].join(''), lines = ['\n', 'import', ' ', q('planted-dep.mjs'), ';\nconst x = await ', 'import', '(', q('planted-dyn.mjs'), ');\n'].join('');
    const isPlanted = rel => /planted-(dep|dyn)\.mjs$/.test(rel), read = rel => (isPlanted(rel) ? '' : rel === 'research/solver/reduce-share-rules.mjs' ? text(rel) + lines : text(rel)), exists = rel => isPlanted(rel) || existsSync(join(REPO, rel));
    const g = stampFiles(REPO, read, exists);
    cases.push(['a planted import in the read, static or dynamic, joins the stamp', `${g.includes('research/solver/planted-dep.mjs')} ${g.includes('research/solver/planted-dyn.mjs')}`, 'true true']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit((await planted()) ? 1 : 0);
  const panel = readSharePanel(), byId = Object.fromEntries(panel.map(u => [u.id, u]));
  if (args[0] === '--units') { const us = args[1] === 'pilot' ? pilotUnits(panel) : panel; unitsOf(us).forEach(([id, arm], k) => console.log(`${k} ${id} ${arm}`)); console.log(unitsOf(us).length); process.exit(0); }
  const REGISTERED = args[0] === 'registered', PILOT = args[0] === 'pilot';
  if (!REGISTERED && !PILOT) { console.error('audit-share-rules: registered part k/n, or pilot part k/n'); process.exit(2); }
  if (REGISTERED && (process.env.SR_PTS || process.env.SR_N || process.env.SR_ONLY || process.env.SHARE_RULES_OUT)) { console.error('audit-share-rules: the registered run takes no limits'); process.exit(2); }
  if (REGISTERED && process.env.PREDICTION_FILE !== REGISTRATION) { console.error(`audit-share-rules: the registered run runs only under ${REGISTRATION}, through the launcher (PREDICTION_FILE ${process.env.PREDICTION_FILE || 'unset'})`); process.exit(2); }
  // the registered run only on the code the panel was landed on: a change of code means landing again, a new pilot and review
  if (REGISTERED) { const pc = JSON.parse(readFileSync(PANEL, 'utf8')).code, cc = codeId(); if (!cc || cc.hash !== pc) { console.error(`audit-share-rules: the code ${cc ? cc.hash : 'unknown'} is not the code the panel was landed on (${pc}): land it again`); process.exit(2); } }
  const seed = REGISTERED ? SEED : PILOT_SEED, reg = REGISTERED ? JSON.parse(readFileSync(PATHS_FILE, 'utf8')) : null;
  const only = process.env.SR_ONLY ? new Set(process.env.SR_ONLY.split(',')) : null;
  const units = (PILOT ? pilotUnits(panel) : panel).filter(u => !only || only.has(u.id));
  if (REGISTERED && units.some(u => !(reg.paths[u.id] > 0))) { console.error(`audit-share-rules: ${PATHS_FILE} gives no paths for ${units.filter(u => !(reg.paths[u.id] > 0)).map(u => u.id).join(', ')}`); process.exit(2); }
  const NOf = id => (REGISTERED ? reg.paths[id] : Number(process.env.SR_N) || PILOT_N), pts = Number(process.env.SR_PTS) || PTS;
  const UNITS = unitsOf(units), [pk, pn] = (args[2] || '0/1').split('/').map(Number);
  const OUT = process.env.SHARE_RULES_OUT || join(HERE, 'results', REGISTERED ? 'share-rules-run' : 'share-rules-pilot');
  mkdirSync(OUT, { recursive: true });
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
  console.log(`THE SHARE RULES' TEST${REGISTERED ? '' : ' (THE PILOT)'}: TODAY, FLAT (where its share differs) and MEANS at estate weight ${W}, ${pts} points; seed ${seed}; ${UNITS.length} units; part ${pk}/${pn}; node ${STAMP.node}`);
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const surv = A => (100 * A.survived.reduce((a, x) => a + x, 0) / A.survived.length);

  UNITS.forEach(([id, arm], i) => {
    if (i % pn !== pk) return;
    const u = byId[id], base = u.plan, n = NOf(id), t0 = Date.now();
    console.log(`${id.padEnd(12)} case | unit ${arm} | ${u.kind} ${u.kind === 'feature' ? u.feature : u.variant} | target ${u.target} paths ${n}`);
    const a = armA(appPlan(base), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
    if (a.label !== u.label) { console.error(`audit-share-rules: ${id}: arm A's pick ${a.label} differs from the landing's ${u.label}`); process.exit(3); }
    const cp = solveArm(arm, solverPlan('CANDC', base, aPol, W), pts), solveSecs = (Date.now() - t0) / 1000;
    const lines = ['self', 'part'].map(who => settingsOf(cp.tables[who]));
    for (const [k, line] of lines.entries()) { const bad = wantProblems('CANDC', line, W, !!process.env.SR_PTS); if (bad.length) { console.error(`audit-share-rules: ${id} ${arm} ${k ? 'part' : 'self'}: ${bad.join('; ')}`); process.exit(3); } }
    const want = shareOfArm(arm, base);
    if (Math.abs(cp.share - want) > 1e-12 || cp.meta.shareRule !== RULE_OF[arm]) { console.error(`audit-share-rules: ${id} ${arm}: share ${cp.share} rule ${cp.meta.shareRule}, not ${want} ${RULE_OF[arm]}`); process.exit(3); }
    if (cp.m.ctx.solvencyFloor !== E.num(base.config.solvencyFloor, 0)) { console.error(`audit-share-rules: ${id} ${arm}: the household's minimum pot ${cp.m.ctx.solvencyFloor}, not the panel's ${base.config.solvencyFloor}`); process.exit(3); }
    const d80 = d80Of(undefined, [cp.tables.self, cp.tables.part]), off = [...coupleProblems(), ...d80Problems(d80)];
    if (off.length) { console.error(`audit-share-rules: ${id} ${arm}: ${off.join('; ')}`); process.exit(3); }
    // the solver arms take arm A's MPAA ages, as stage C's did; each arm's own recorded beside
    const aDemo = E.resolveMpaa(a.planState).demographics, own = [cp.plan.demographics.mpaaAgeSelf, cp.plan.demographics.mpaaAgePart];
    const ctx = E.buildContext(withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
    const mpaaOwn = own.map(x => (x === '' || x === undefined || x === null ? null : Number(x)));
    const ran = `config ${configOf(arm)} hhMinPot ${cp.m.ctx.solvencyFloor} share ${cp.share} shareRule ${cp.meta.shareRule} flat ${COUPLE.flat} fast ${COUPLE.fast} shortlist ${d80.shortlist} item12 ${d80.item12} tieBreak ${d80.tieBreak} | self: ${lines[0]} | part: ${lines[1]}`;
    const T = ctx.totalYears, inputs = inputsHash(ctx), inputsNoMpaa = inputsHash({ ...ctx, owners: ctx.owners.map(o => ({ ...o, mpaaAge: null })) }), mpaa = ctx.owners.map(o => (Number.isFinite(o.mpaaAge) ? o.mpaaAge : null));
    console.log(`${''.padEnd(12)} ran ${arm}: ${ran} inputs ${inputs} inputsNoMpaa ${inputsNoMpaa} mpaa ${mpaa.join('/')} | solve secs ${Math.round(solveSecs)}`);
    const e0 = Date.now(), paths = E.pathsForSeed(seed, n, T);
    const A = { survived: new Uint8Array(n), wealth: new Float32Array(n), estate: new Float32Array(n), delivered: new Float32Array(n), unmet: new Float32Array(n), tax: new Float32Array(n), failYear: new Int16Array(n) };
    let bad = 0;
    paths.forEach((zs0, k) => {
      const zs = Float64Array.from(zs0), o = runPath(ctx, zs, false);
      A.survived[k] = o.survived ? 1 : 0; A.wealth[k] = o.wealth; A.estate[k] = o.estate; A.delivered[k] = o.delivered; A.unmet[k] = o.unmet; A.tax[k] = o.tax; A.failYear[k] = o.failYear;
      if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.terminalPotNet !== o.estate || q.unmetTotal !== o.unmet || q.lifetimeTax !== o.tax) bad++; }
    });
    if (bad) { console.error(`audit-share-rules: ${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`); process.exit(3); }
    const eSecs = (Date.now() - e0) / 1000;
    // under the registration a log carries no outcome: its stamp, its record of the settings, its timings and its done line
    console.log(`${''.padEnd(12)} run ${arm}: ${REGISTERED ? '' : `engine ${surv(A).toFixed(4)} on ${n}; `}engine secs ${Math.round(eSecs)} (${(1000 * eSecs / n).toFixed(1)} ms a path)`);
    const NB = Math.min(n, BESIDE), pb = new Uint8Array(NB); let engineOnly = 0, modelOnly = 0;
    const b0 = Date.now();
    paths.slice(0, NB).forEach((zs, k) => { pb[k] = runCouplePolicy(cp, Float64Array.from(zs)).survived ? 1 : 0; if (A.survived[k] && !pb[k]) engineOnly++; if (pb[k] && !A.survived[k]) modelOnly++; });
    const beside = { N: NB, survived: b64(pb), engineOnly, modelOnly, secs: (Date.now() - b0) / 1000 };
    console.log(`${''.padEnd(12)} beside ${arm}: the rollout in the model on ${NB} paths, ${Math.round(beside.secs)} s${REGISTERED ? '' : `: ${(100 * pb.reduce((x, y) => x + y, 0) / NB).toFixed(4)}; the engine alone ${engineOnly}, the model alone ${modelOnly}`}`);
    writeFileSync(join(OUT, fileOf(id, arm)), gzipSync(JSON.stringify({ id, arm, base: u.base, place: u.place, kind: u.kind, variant: u.variant, feature: u.feature, target: ctx.targetSpend, inputs, inputsNoMpaa, mpaa, mpaaOwn, stamp: STAMP, ran, seed, W, N: n,
      share: cp.share, shareRule: cp.meta.shareRule, config: configOf(arm), solveSecs, engineSecs: eSecs, secs: (Date.now() - t0) / 1000, label: a.label, cpu: cpus()[0].model, beside,
      main: Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) })));
    console.log(`${''.padEnd(12)} done ${arm} secs ${Math.round((Date.now() - t0) / 1000)}`);
  });
}
