/*
 * THE SAVINGS SPLIT'S v2, THE PANEL (SAVE-V2.md; registrations/save-v2.md, DRAFT; D130 (7), D133): 40 single households who
 * work and save into a pension or an ISA, drawn from those no run has taken the split on.
 *   - the pool (D133 (1)): the library's single households with a working year whose save the split could choose (the
 *     engine's saveSplitAt: audit-save.mjs choiceYears) on Phase 4's plan at the library target (phase4-panel.mjs planOf),
 *     less every household a run has taken the split on: the savings factorial's panel (audit-save.mjs saveIds on
 *     phase4-panel.json) and the households of save-split.test.mjs (the split's own test). The library holds no pool held out
 *     from every run (results-save-v2-pool.txt), so the scan of the day (held-out.mjs touchedAll) decides nothing here: it is
 *     recorded, so the panel says which households are untouched and which another run touched. It is taken with this
 *     study's own records left out (scanWithout: results-save-v2-*.txt, the pool's count, which ran nothing but names the
 *     pool's untouched households), as Phase 4 left out its own (phase4-panel.mjs OWN and results-p4-select.txt), the
 *     whole scan's count and hash recorded beside it. Taken once with the orders and frozen in save-v2-orders.json
 *     (freeze), which every later step reads;
 *   - the two cohorts' orders: the younger (44 or under, retiring at 52 instead: the id with an F, phase4-panel.mjs idOf) in
 *     library order; the library's (older than 44, retiring at their plan's age) PER_LIB taken evenly in library order
 *     (select-7u-broad.mjs pick), the rest of its pool after them in library order as reserves;
 *   - every arm's plan: phase4-panel.mjs planOf at the landed target (the floor at 80% of it, the minimum pot as Phase 4's,
 *     the candidate's return assumptions), as the factorial's;
 *   - landing (land): phase4-panel.mjs landTarget, arm A searched anew at each target (select-phase4.mjs armA, no tournament),
 *     so arm A survives 85 +/- 1% on 1,000 paths of seed 7005 (Phase 4's procedure, D35); at the landed target the
 *     household must still have a working year with a save to choose, or it is not landed;
 *   - the panel (combine, D133 (2)): the younger cohort's order walked first, every one that lands; then the library's, to
 *     PANEL_N in all, so an older household fills any younger place that does not land; a walk stops at the first candidate
 *     not yet landed, and the panel is written only when it is whole and every landing ran on one code.
 *   node research/solver/save-v2-panel.mjs freeze                 the pool, the scan and the orders, taken once
 *   node research/solver/save-v2-panel.mjs list                   the orders
 *   node research/solver/save-v2-panel.mjs land <lib|fire> <k>    land candidate k (results/save-v2-land/)
 *   node research/solver/save-v2-panel.mjs combine                save-v2-panel.json from the landings
 *   node research/solver/save-v2-panel.mjs summary > research/solver/results-save-v2-panel.txt
 *   node research/solver/save-v2-panel.mjs --planted              the checks on planted inputs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, symlinkSync, unlinkSync, rmdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { planOf, appPlan, readPanel as readPhase4Panel, landTarget, idOf, touched, MAX_FIRE_AGE, LAND_SEED, LAND_PATHS, AIM, TOL } from './phase4-panel.mjs';
import { choiceYears, saveIds } from './audit-save.mjs';
import { armA } from './select-phase4.mjs';
import { pick } from './select-7u-broad.mjs';
import { touchedAll, reviewFiles, reviewIds } from './held-out.mjs';
import { idsIn } from './scan-touched.mjs';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const PANEL_N = 40, PER_LIB = 30;
export const SPLIT_TEST = 'research/tests/save-split.test.mjs';
export const ORDERS = join(HERE, 'save-v2-orders.json'), PANEL = process.env.SAVE_V2_PANEL || join(HERE, 'save-v2-panel.json');
const OUT = process.env.SAVE_V2_LAND_OUT || join(HERE, 'results', 'save-v2-land');
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const cohortOf = h => (h.age <= MAX_FIRE_AGE ? 'fire' : 'lib');
/* the working years with a save to choose, on the plan as every arm runs it at a target */
export const yearsAt = (h, cohort, target) => choiceYears(E.buildContext(prep(appPlan(planOf(h, cohort, target)))));
export const singlesOf = () => buildScenarios().filter(s => s.plan.demographics.planningMode === 'single').map(s => ({ id: s.id, age: Number(s.plan.demographics.currentAgeSelf), name: s.name, plan: s.plan }));

/* the pool and the two orders from the library's singles, the savers (`saves(h)`) and the households a run has taken the
   split on (`splitRun`): the younger in library order; the library's PER_LIB taken evenly, then its reserves */
export function ordersOf(singles, saves, splitRun, perLib = PER_LIB) {
  const pool = singles.filter(h => saves(h) && !splitRun.has(h.id));
  const lib = pick(pool, new Set(), perLib), chosen = new Set(lib.panel.map(h => h.id));
  return { lib: [...lib.panel, ...lib.pool.filter(h => !chosen.has(h.id))], fire: pool.filter(h => h.age <= MAX_FIRE_AGE), pool };
}
/* the panel's walk over the landings (`landed(id)`: the landing's record, or null when not yet landed): the younger first,
   every one that lands; then the library's to `want` in all; each walk stops at the first not yet landed */
export function walkPanel(orders, landed, want = PANEL_N) {
  const walk = (list, cohort, n) => { const picked = []; let gap = null, passed = []; for (const h of list) { if (picked.length === n) break; const r = landed(idOf(h, cohort)); if (!r) { gap = idOf(h, cohort); break; } if (r.landed && r.years > 0) picked.push(r); else passed.push(r.id); } return { picked, gap, passed }; };
  const F = walk(orders.fire, 'fire', orders.fire.length), L = F.gap ? { picked: [], gap: null, passed: [] } : walk(orders.lib, 'lib', want - F.picked.length);
  return { F, L, whole: !F.gap && !L.gap && F.picked.length + L.picked.length === want, panel: [...F.picked, ...L.picked] };
}

export function readSaveV2Panel(file = PANEL) {
  const j = JSON.parse(readFileSync(file, 'utf8')), byId = Object.fromEntries(singlesOf().map(h => [h.id, h]));
  return j.panel.map((r, k) => ({ ...r, k, plan: planOf(byId[r.base], r.cohort, r.target) }));
}

/* the scan of the day with this study's own records left out: phase4-panel.mjs touched() itself, unchanged (Phase 4's read
   takes its hash), run on a view of the folder (`root`) made of symbolic links to all it reads (results/, the top-level
   results files but those `skip` names, the archived manifest's folder, the archive, the tests beside the folder), and the
   review branch's ids added as held-out.mjs touchedAll adds them (`files`, the branch's files, read through git when not
   given). The view's links are removed one by one and its two folders after them (rmdir, which refuses a folder not
   empty), so nothing is deleted through a link. SAVE_V2_PLANT=scanall (a planted fault) links every results file. */
export const OWN_TOP = /^results-save-v2-/;
export function scanWithout(skip = OWN_TOP, { root = HERE, files = null } = {}) {
  if (process.env.SAVE_V2_PLANT === 'scanall') skip = null;
  const tmp = mkdtempSync(join(tmpdir(), 'save-v2-scan-')), view = join(tmp, 'solver'), made = [];
  const link = (to, at) => { symlinkSync(to, at); made.push(at); };
  try {
    mkdirSync(view);
    for (const d of ['results', 'results-archive', 'archive']) if (existsSync(join(root, d))) link(join(root, d), join(view, d));
    if (existsSync(join(root, '..', 'tests'))) link(join(root, '..', 'tests'), join(tmp, 'tests'));
    for (const f of readdirSync(root)) if (/^results-.*\.txt$/.test(f) && !(skip && skip.test(f))) link(join(root, f), join(view, f));
    const S = touched(view);
    for (const id of reviewIds(files || reviewFiles())) S.add(id);
    return S;
  } finally {
    for (const at of made.reverse()) unlinkSync(at);
    rmdirSync(view); rmdirSync(tmp);
  }
}

function planted() {
  const cases = [];
  // a planted library: twelve singles, ages 40 (the younger) and 60, the savers the even ids, S004 the factorial's and S010
  // the test's
  const L = Array.from({ length: 12 }, (_, i) => ({ id: `S${String(i).padStart(3, '0')}`, age: i < 4 ? 40 : 60 }));
  const saves = h => Number(h.id.slice(1)) % 2 === 0, run = new Set(['S002', 'S008']);
  { const o = ordersOf(L, saves, run, 2);
    cases.push(['the pool: the savers a run has not taken the split on, the younger in library order, the library\'s two taken evenly then its reserves', `${o.pool.map(h => h.id).join(',')} | ${o.fire.map(h => h.id).join(',')} | ${o.lib.map(h => h.id).join(',')}`, 'S000,S004,S006,S010 | S000 | S004,S006,S010']); }
  { const o = { fire: [{ id: 'S000' }, { id: 'S002' }], lib: [{ id: 'S004' }, { id: 'S006' }, { id: 'S008' }, { id: 'S010' }] };
    const rec = (id, landed = true, years = 5) => ({ id, landed, years });
    const all = { S000F: rec('S000F'), S002F: rec('S002F'), S004: rec('S004'), S006: rec('S006'), S008: rec('S008'), S010: rec('S010') };
    { const w = walkPanel(o, id => all[id] || null, 4); cases.push(['the walk: every younger that lands, then the library to four', `${w.whole} ${w.panel.map(r => r.id).join(',')}`, 'true S000F,S002F,S004,S006']); }
    { const w = walkPanel(o, id => ({ ...all, S002F: rec('S002F', false) })[id] || null, 4); cases.push(['a younger not landed is passed over and the library fills its place', `${w.whole} ${w.panel.map(r => r.id).join(',')} ${w.F.passed.join(',')}`, 'true S000F,S004,S006,S008 S002F']); }
    { const w = walkPanel(o, id => ({ ...all, S006: rec('S006', true, 0) })[id] || null, 4); cases.push(['a household landed with no working year to choose is passed over', `${w.whole} ${w.panel.map(r => r.id).join(',')} ${w.L.passed.join(',')}`, 'true S000F,S002F,S004,S008 S006']); }
    { const w = walkPanel(o, id => ({ ...all, S002F: undefined })[id] || null, 4); cases.push(['a younger not yet landed stops the walk before the library', `${w.whole} ${w.F.gap} ${w.L.picked.length}`, 'false S002F 0']); }
    { const w = walkPanel(o, id => ({ ...all, S006: undefined })[id] || null, 4); cases.push(['a library household not yet landed stops its walk: the panel not whole', `${w.whole} ${w.L.gap} ${w.panel.length}`, 'false S006 3']); } }
  // on the library itself: the pool is the 63 of results-save-v2-pool.txt when the factorial's and the test's are left out
  { const singles = singlesOf(), run = splitRunOf(), o = ordersOf(singles, h => yearsAt(h, cohortOf(h), E.num(h.plan.spending.targetSpend, 0)).length > 0, run.all);
    cases.push(['on the library: the pool 63, the younger 10, the library\'s 53; none of the factorial\'s or the test\'s', `${o.pool.length} ${o.fire.length} ${o.lib.length} ${o.pool.some(h => run.all.has(h.id))}`, '63 10 53 false']);
    cases.push(['the households a run has taken the split on: the factorial\'s 27 and the test\'s six', `${run.factorial.length} ${run.test.join(',')}`, '27 S026,S090,S188,S204,S244,S260']); }
  // the scan's view (scanWithout), on a planted folder: the study's own record (results-save-v2-x.txt) names S901 alone, and
  // S900 beside another results file; results/, the archive, the tests beside the folder and the review branch each name one
  { const tmp = mkdtempSync(join(tmpdir(), 'save-v2-planted-')), root = join(tmp, 'solver'), put = (rel, text) => { mkdirSync(dirname(join(tmp, rel)), { recursive: true }); writeFileSync(join(tmp, rel), text); };
    try {
      put('solver/results-a.txt', 'S900\n'); put('solver/results-save-v2-x.txt', 'S901 S900\n'); put('solver/results/sub/f.txt', 'S902\n');
      put('solver/archive/g.md', 'S903\n'); put('tests/h.mjs', 'S904\n'); put('solver/results-p4-select.txt', 'S905\n');
      put('solver/results-archive/MANIFEST-solver-results.sha256', 'x  S906.json\n'); put('solver/other.md', 'S907\n');
      const files = [['research/reviews/r.md', 'S908']];
      const got = S => [...S].sort().join(',');
      cases.push(['the view leaves out only the study\'s own record: an id it alone names is untouched, all else the scan reads is read', got(scanWithout(OWN_TOP, { root, files })), 'S900,S902,S903,S904,S906,S908']);
      cases.push(['the view with nothing left out reads what touched() and the review branch read (the own record\'s S901 too)', got(scanWithout(null, { root, files })), got(new Set([...touched(root), ...reviewIds(files)]))]);
      cases.push(['the view\'s links are gone and the planted folder whole after it', `${readdirSync(tmpdir()).filter(f => f.startsWith('save-v2-scan-')).length} ${readdirSync(root).sort().join(',')}`, '0 archive,other.md,results,results-a.txt,results-archive,results-p4-select.txt,results-save-v2-x.txt']);
    } finally { const rm = d => { for (const f of readdirSync(d, { withFileTypes: true })) { const p = join(d, f.name); if (f.isDirectory()) rm(p); else unlinkSync(p); } rmdirSync(d); }; rm(tmp); } }
  // on this folder itself: with nothing left out the view's scan is touchedAll's exactly
  { const a = [...touchedAll()].sort().join(','), b = [...scanWithout(null)].sort().join(',');
    cases.push(['on this folder, with nothing left out the view\'s scan is held-out.mjs touchedAll\'s, id for id', `${a === b} ${b.split(',').length}`, `true ${a.split(',').length}`]); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}
/* every household a run has taken the split on: the factorial's panel and the split's own test */
export function splitRunOf() {
  const factorial = [...new Set(saveIds(readPhase4Panel()).map(id => id.replace(/F$/, '')))].sort();
  const test = [...new Set(idsIn(readFileSync(join(REPO, SPLIT_TEST), 'utf8')))].sort();
  return { factorial, test, all: new Set([...factorial, ...test]) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const mode = process.argv[2] || 'list';
  if (mode === '--planted') process.exit(planted() ? 1 : 0);
  const all = singlesOf(), byId = Object.fromEntries(all.map(h => [h.id, h]));
  const orders = () => {
    if (!existsSync(ORDERS)) { console.error('save-v2-panel: no save-v2-orders.json; run freeze first'); process.exit(2); }
    const o = JSON.parse(readFileSync(ORDERS, 'utf8'));
    return { ...o, lib: o.lib.map(id => byId[id]), fire: o.fire.map(id => byId[id]), touched: new Set(o.scan.ids) };
  };
  if (mode === 'freeze') {
    if (existsSync(ORDERS)) { console.error('save-v2-panel: save-v2-orders.json exists; the orders are taken once'); process.exit(2); }
    const hashOf = xs => createHash('sha256').update(xs.join(',')).digest('hex').slice(0, 12);
    const run = splitRunOf(), whole = [...touchedAll()].sort(), used = scanWithout(OWN_TOP), ids = [...used].sort(), hash = hashOf(ids);
    const o = ordersOf(all, h => yearsAt(h, cohortOf(h), E.num(h.plan.spending.targetSpend, 0)).length > 0, run.all);
    writeFileSync(ORDERS, JSON.stringify({ built: new Date().toISOString(), splitRun: { factorial: run.factorial, test: run.test }, scan: { count: ids.length, hash, without: 'results-save-v2-*.txt (this study\'s own records)', whole: { count: whole.length, hash: hashOf(whole) }, ids }, pool: o.pool.map(h => h.id), lib: o.lib.map(h => h.id), fire: o.fire.map(h => h.id) }, null, 1) + '\n');
    console.log(`frozen: the pool ${o.pool.length} (the younger ${o.fire.length}, the library's ${o.lib.length}); a run took the split on ${run.all.size} (the factorial's ${run.factorial.length}, the test's ${run.test.length}); the scan of the day ${whole.length} ids (hash ${hashOf(whole)}), this study's own records left out ${ids.length} (hash ${hash}), of the pool untouched ${o.pool.filter(h => !used.has(h.id)).length}`);
  }
  if (mode === 'list') {
    const o = orders();
    console.log(`the pool ${o.pool.length}: the younger ${o.fire.length}, the library's ${o.lib.length}; the scan of the day ${o.scan.count} ids (hash ${o.scan.hash})`);
    o.fire.forEach((h, k) => console.log(`  fire ${String(k).padStart(3)}  ${idOf(h, 'fire')} ${h.name}${o.touched.has(h.id) ? '' : '  (untouched)'}`));
    o.lib.forEach((h, k) => console.log(`  lib  ${String(k).padStart(3)}  ${h.id} ${h.name}${k < PER_LIB ? '' : '  (reserve)'}${o.touched.has(h.id) ? '' : '  (untouched)'}`));
  }
  if (mode === 'land') {
    const which = process.argv[3], k = Number(process.argv[4]), o = orders(), list = which === 'fire' ? o.fire : o.lib;
    if (!['lib', 'fire'].includes(which) || !(k >= 0 && k < list.length)) { console.error(`save-v2-panel: land <lib|fire> <k>, k in 0..${list.length - 1}`); process.exit(2); }
    const h = list[k], cohort = which, id = idOf(h, cohort), t0 = Date.now();
    let label = null;
    const survivalAt = T => { const a = armA(appPlan(planOf(h, cohort, T)), { tournament: false }); label = a.label; return E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate; };
    const r = landTarget(survivalAt, E.num(h.plan.spending.targetSpend, 0));
    if (r.steps[r.steps.length - 1].target !== r.target) survivalAt(r.target);   // arm A's label at the target taken
    const years = yearsAt(h, cohort, r.target).length;
    mkdirSync(OUT, { recursive: true });
    const cid = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ id, base: h.id, cohort, k, name: h.name, libraryTarget: E.num(h.plan.spending.targetSpend, 0), ...r, label, years, status: o.touched.has(h.id) ? 'touched' : 'untouched', code: cid ? cid.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }));
    console.log(`${cohort.padEnd(4)} ${String(k).padStart(3)} ${id.padEnd(6)} target ${r.target} (library ${E.num(h.plan.spending.targetSpend, 0)}) arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : 'NOT LANDED'} in ${r.steps.length} steps, ${label}; ${years} working years to choose; ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'combine') {
    const o = orders(), landed = id => (existsSync(join(OUT, `${id}.json`)) ? JSON.parse(readFileSync(join(OUT, `${id}.json`), 'utf8')) : null);
    const w = walkPanel(o, landed);
    for (const [n, x] of [['the younger', w.F], ['the library\'s', w.L]]) console.log(`${n}: ${x.picked.length} landed${x.passed.length ? `, ${x.passed.length} passed over (${x.passed.join(', ')})` : ''}${x.gap ? `; stopped at the first not yet landed, ${x.gap}` : ''}`);
    if (!w.whole) { console.log('panel: INCOMPLETE, land more candidates'); process.exit(1); }
    const codes = [...new Set(w.panel.map(r => r.code))];
    if (codes.length !== 1) { console.log(`panel: the landings ran on more than one code (${codes.join(', ')})`); process.exit(1); }
    const panel = w.panel.map(r => ({ id: r.id, base: r.base, cohort: r.cohort, place: r.k, target: r.target, libraryTarget: r.libraryTarget, armA: r.survival, label: r.label, steps: r.steps.length, years: r.years, status: r.status, head: r.head }));
    writeFileSync(PANEL, JSON.stringify({ built: new Date().toISOString(), code: codes[0], scan: { count: o.scan.count, hash: o.scan.hash }, aim: AIM, tol: TOL, seed: LAND_SEED, paths: LAND_PATHS, panel }, null, 1) + '\n');
    console.log(`panel: ${panel.length} households written to save-v2-panel.json (the younger ${w.F.picked.length}, the library's ${w.L.picked.length}); code ${codes[0]}`);
  }
  if (mode === 'summary') {
    const j = JSON.parse(readFileSync(PANEL, 'utf8')), o = orders();
    console.log(`THE SAVINGS SPLIT'S v2, THE PANEL (SAVE-V2.md; D133): ${j.panel.length} single households who work and save, from the ${o.pool.length} no run has taken the split on; landed on code ${j.code}, arm A at ${j.aim} +/- ${j.tol}% on ${j.paths} paths of seed ${j.seed}; the scan of the day ${j.scan.count} ids (hash ${j.scan.hash})`);
    for (const c of ['fire', 'lib']) {
      const xs = j.panel.filter(r => r.cohort === c);
      console.log(`\n${c === 'fire' ? 'THE YOUNGER COHORT (retiring at 52)' : 'THE LIBRARY COHORT'}: ${xs.length}; untouched ${xs.filter(r => r.status === 'untouched').length}`);
      for (const r of xs) console.log(`  ${r.id.padEnd(6)} place ${String(r.place).padStart(2)}  target ${r.target} (library ${r.libraryTarget})  arm A ${r.armA.toFixed(1)}%  ${r.label}  ${r.years} working years to choose  ${r.status}`);
    }
  }
}
