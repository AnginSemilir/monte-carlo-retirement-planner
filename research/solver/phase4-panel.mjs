/*
 * PHASE 4'S PANEL (STATE.md D35, on the maintainer's design of 24 Sep: the archived plan's Phase 4 and its P4-LAND row).
 * 40 single households no earlier run touched, 20 from the library and 20 retiring at 52, each landed so the app's rules
 * (arm A) survive about 85%, where the two arms can differ.
 *   - touched: scan-touched.mjs's MEANT rule (O129), taken when the panel is built: an id in the name or the plain text of
 *     any file under results/ (the band selection's p4-select and this panel's own p4-land left out), a gzipped file's own
 *     id field, and every results-*.txt file in the tree but results-p4-select.txt (the band selection's candidate list).
 *     An id with an F is its library id: a household retiring at 52 counts as touched when its library household is;
 *   - the library cohort: untouched single households older than 44, 20 taken evenly in library order (select-7u-broad.mjs
 *     pick), the rest of the pool after them in library order as reserves;
 *   - the FIRE cohort: untouched single households aged 44 or under, retiring at 52 instead (the id with an F), in
 *     library order;
 *   - every arm's plan (planOf): the library household (FIRE: retiring at 52) at its landed target, the floor at 80% of
 *     it, the minimum pot written in (the household's own, or one year's target where it has none: solvePlan's rule, so
 *     every arm's engine counts survival alike), and the candidate's return assumptions (candidatePlan: O60's blend
 *     medians), on which every arm runs;
 *   - arm A (appPlan, select-phase4.mjs armA): the app's policy search then its tournament, searched on seed 7001, with
 *     guardrails on, the lookahead at 5 years and raises capped at 110% (the solver's own cap);
 *   - landing: the target set by bisection (whole hundreds of pounds) until arm A, searched anew at each target,
 *     survives 85 +/- 1% on 1,000 paths of seed 7005 (the selection seed, used for nothing else in Phase 4); a household
 *     that does not land within 16 steps is passed over for the next in its cohort's order;
 *   - the panel: the first 20 landed in each cohort's order; written to phase4-panel.json (committed) with the scan's
 *     count and hash, so the audit never scans again.
 *   node research/solver/phase4-panel.mjs list               the two cohorts' orders and the scan
 *   node research/solver/phase4-panel.mjs land <lib|fire> <k>  land candidate k of that order (results/p4-land/<id>.json)
 *   node research/solver/phase4-panel.mjs combine            phase4-panel.json from the landings so far
 *   node research/solver/phase4-panel.mjs --planted          the checks on planted inputs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { candidatePlan } from './candidate.mjs';
import { armA } from './select-phase4.mjs';
import { idsIn } from './scan-touched.mjs';
import { pick } from './select-7u-broad.mjs';
import { codeId } from './code-id.mjs';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS = join(HERE, 'results'), OUT = process.env.P4_LAND_OUT || join(RESULTS, 'p4-land');
// P4_PANEL and P4_LAND_OUT point a smoke test elsewhere; the registered audit refuses P4_PANEL
export const PANEL_FILE = process.env.P4_PANEL || join(HERE, 'phase4-panel.json');
export const PER_COHORT = 20, MAX_FIRE_AGE = 44, FIRE_RETIRE = 52, AIM = 85, TOL = 1, LAND_SEED = 7005, LAND_PATHS = 1000, MAX_STEPS = 16;

/* every library id an earlier run touched (MEANT), from the tree as it stands */
export function touched(root = HERE) {
  const S = new Set();
  const add = t => idsIn(t).forEach(id => S.add(id));
  const walk = d => {
    for (const f of readdirSync(d)) {
      const p = join(d, f), st = statSync(p);
      if (st.isDirectory()) { if (f !== 'p4-select' && f !== 'p4-land') walk(p); continue; }
      add(f);
      const buf = readFileSync(p);
      if (f.endsWith('.gz')) { let j = null; try { j = JSON.parse(gunzipSync(buf).toString('latin1')); } catch { j = null; } if (j && !Array.isArray(j) && j.id != null) add(j.id); }
      else add(buf.toString('latin1'));
    }
  };
  if (existsSync(join(root, 'results'))) walk(join(root, 'results'));
  for (const f of readdirSync(root).filter(f => /^results-.*\.txt$/.test(f) && f !== 'results-p4-select.txt')) add(f + '\n' + readFileSync(join(root, f), 'latin1'));
  return S;
}

/* the two cohorts' orders: the library's even 20 then its reserves; the FIRE cohort in library order */
export function cohorts(singles, used, n = PER_COHORT) {
  const lib = pick(singles, used, n), chosen = new Set(lib.panel.map(s => s.id));
  const libOrder = [...lib.panel, ...lib.pool.filter(s => !chosen.has(s.id))];
  const fireOrder = singles.filter(s => s.age <= MAX_FIRE_AGE && !used.has(s.id));
  return { lib: libOrder, fire: fireOrder, libPool: lib.pool.length };
}

const singlesOf = () => buildScenarios().filter(s => s.plan.demographics.planningMode === 'single').map(s => ({ id: s.id, age: Number(s.plan.demographics.currentAgeSelf), name: s.name, plan: s.plan, floor: s.solvencyFloor }));

/* the household as every arm runs it, at a target: see the header */
export function planOf(h, cohort, target) {
  const p = JSON.parse(JSON.stringify(h.plan));
  if (cohort === 'fire') p.demographics.retireAgeSelf = FIRE_RETIRE;
  const own = Math.max(0, E.num(p.config && p.config.solvencyFloor, 0));
  p.spending = { ...p.spending, targetSpend: target, floorSpend: Math.round(0.8 * target) };
  p.config = { ...p.config, solvencyFloor: own > 0 ? own : target };
  return candidatePlan(E, E.normalizePlan(p));
}
/* arm A's plan: the app's rules as they ship, guardrails on, the lookahead at 5 years, raises capped at 110% */
export function appPlan(plan) {
  return E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: true, lookaheadYears: 5, raiseCap: 1.1 } });
}
export const idOf = (h, cohort) => (cohort === 'fire' ? `${h.id}F` : h.id);

/* the landing's bisection on any survival function of the target (planted below), in whole hundreds of pounds */
export function landTarget(survivalAt, t0, { aim = AIM, tol = TOL, maxSteps = MAX_STEPS } = {}) {
  const steps = [], at = T => { const s = survivalAt(T); steps.push({ target: T, survival: s }); return s; };
  const r100 = x => Math.max(100, Math.round(x / 100) * 100);
  let T = r100(t0), s = at(T), lo = null, hi = null;   // lo: a target that survives at least the aim; hi: one below it
  if (s >= aim) lo = T; else hi = T;
  while ((lo === null || hi === null) && steps.length < maxSteps) {
    if (Math.abs(s - aim) <= tol) break;
    T = lo === null ? r100(T / 2) : r100(T * 2); s = at(T);
    if (s >= aim) lo = lo === null ? T : Math.max(lo, T); else hi = hi === null ? T : Math.min(hi, T);
  }
  while (lo !== null && hi !== null && steps.length < maxSteps && hi - lo > 100 && !steps.some(x => Math.abs(x.survival - aim) <= tol)) {
    T = r100((lo + hi) / 2); if (T === lo || T === hi) break;
    s = at(T); if (s >= aim) lo = T; else hi = T;
  }
  const best = steps.reduce((b, x) => (Math.abs(x.survival - aim) < Math.abs(b.survival - aim) ? x : b));
  return { target: best.target, survival: best.survival, landed: Math.abs(best.survival - aim) <= tol, steps };
}

function planted() {
  const cases = [];
  const L = Array.from({ length: 12 }, (_, i) => ({ id: `S${String(2 * i).padStart(3, '0')}`, age: i < 3 ? 40 : 60 }));
  { const c = cohorts(L, new Set(['S006', 'S002']), 3);
    cases.push(['the touched left out, the young to the FIRE cohort, the library\'s three taken evenly then its reserves', `${c.lib.map(x => x.id).join(',')} | ${c.fire.map(x => x.id).join(',')}`, 'S008,S012,S018,S010,S014,S016,S020,S022 | S000,S004']); }
  { const f = T => 100 - T / 400;   // falls 1 point for every 400 pounds: 85 at 6,000
    const r = landTarget(f, 20000); cases.push(['a falling survival lands within 1 of 85', `${r.landed} ${Math.abs(r.survival - 85) <= 1}`, 'true true']); }
  { const r = landTarget(() => 40, 20000); cases.push(['a household that never reaches 85 is not landed', `${r.landed}`, 'false']); }
  { const r = landTarget(T => (T < 9000 ? 99 : 70), 20000); cases.push(['a cliff with no target near 85 is not landed', `${r.landed} ${r.steps.length <= MAX_STEPS}`, 'false true']); }
  { const r = landTarget(() => 85.4, 31234); cases.push(['the first target already in the band, rounded to hundreds', `${r.landed} ${r.target} ${r.steps.length}`, 'true 31200 1']); }
  { const all = singlesOf(), h = all.find(s => s.age <= MAX_FIRE_AGE && !(s.floor > 0)), g = all.find(s => s.id === 'S044');
    const p = planOf(h, 'fire', 20000), q = planOf(g, 'lib', 50000);
    cases.push(['FIRE retires at 52, the floor at 80%, the minimum pot one year\'s target where the household has none', `${p.demographics.retireAgeSelf} ${p.spending.floorSpend} ${p.config.solvencyFloor}`, '52 16000 20000']);
    cases.push(['a household\'s own minimum pot kept', `${q.config.solvencyFloor}`, String(g.floor)]);
    cases.push(['the candidate\'s returns on every arm (High Risk at the blend median)', `${p.riskProfiles['High Risk'].real}`, '4.97']);
    const a = appPlan(p); cases.push(['arm A: guardrails on, lookahead 5, raises capped at 110%', `${a.config.guardrails} ${a.config.lookaheadYears} ${a.config.raiseCap}`, 'true 5 1.1']); }
  { cases.push(['an id with an F is its library id', idsIn('S302F-land.json').join(','), 'S302']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

export function readPanel() {
  const j = JSON.parse(readFileSync(PANEL_FILE, 'utf8')), all = singlesOf();
  return j.panel.map(r => ({ ...r, plan: planOf(all.find(s => s.id === r.base), r.cohort, r.target) }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const mode = process.argv[2] || 'list';
  if (mode === '--planted') process.exit(planted() ? 1 : 0);
  const all = singlesOf();
  const orders = () => { const used = touched(); return { used, ...cohorts(all, used) }; };
  if (mode === 'list') {
    const { used, lib, fire, libPool } = orders();
    console.log(`touched (MEANT, now): ${[...used].filter(id => all.some(s => s.id === id)).length} of the library's ${all.length} single households; library pool ${libPool} (older than ${MAX_FIRE_AGE}), FIRE pool ${fire.length}`);
    lib.forEach((h, k) => console.log(`  lib  ${String(k).padStart(3)}  ${h.id} ${h.name}${k < PER_COHORT ? '' : '  (reserve)'}`));
    fire.forEach((h, k) => console.log(`  fire ${String(k).padStart(3)}  ${h.id}F ${h.name.replace(/^[a-z-]+\//, 'fire/')}${k < PER_COHORT ? '' : '  (reserve)'}`));
  }
  if (mode === 'land') {
    const which = process.argv[3], k = Number(process.argv[4]), { lib, fire } = orders(), list = which === 'fire' ? fire : lib;
    if (!(k >= 0 && k < list.length)) { console.error(`phase4-panel: k must be 0..${list.length - 1}`); process.exit(2); }
    const h = list[k], cohort = which === 'fire' ? 'fire' : 'lib', id = idOf(h, cohort), t0 = Date.now();
    let label = null;
    const survivalAt = T => { const a = armA(appPlan(planOf(h, cohort, T))); label = a.label; return E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate; };
    const r = landTarget(survivalAt, E.num(h.plan.spending.targetSpend, 0));
    const last = r.steps[r.steps.length - 1];
    if (last.target !== r.target) survivalAt(r.target);   // arm A's label at the target taken
    mkdirSync(OUT, { recursive: true });
    const cid = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ id, base: h.id, cohort, k, name: h.name, libraryTarget: E.num(h.plan.spending.targetSpend, 0), ...r, label, code: cid ? cid.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }));
    console.log(`${cohort.padEnd(4)} ${String(k).padStart(3)} ${id.padEnd(6)} target ${r.target} (library ${E.num(h.plan.spending.targetSpend, 0)}) arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : 'NOT LANDED'} in ${r.steps.length} steps, ${label}; ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'combine') {
    const { used, lib, fire } = orders();
    const walk = (list, cohort, want = PER_COHORT) => { const picked = []; let gap = null, passed = 0; for (const h of list) { if (picked.length === want) break; const f = join(OUT, `${idOf(h, cohort)}.json`); if (!existsSync(f)) { gap = idOf(h, cohort); break; } const r = JSON.parse(readFileSync(f, 'utf8')); if (r.landed) picked.push(r); else passed++; } return { picked, gap, passed }; };
    // the FIRE cohort first; if it runs out with every candidate tried, the library fills the panel to 40 (the archived rule)
    const F = walk(fire, 'fire'), short = F.gap ? 0 : PER_COHORT - F.picked.length, L = walk(lib, 'lib', PER_COHORT + short);
    for (const [n, w] of [['library', L], ['FIRE', F]]) console.log(`${n}: ${w.picked.length} landed${w.passed ? `, ${w.passed} passed over (not landed)` : ''}${w.gap ? `; stopped at the first not yet landed, ${w.gap}` : ''}`);
    if (L.picked.length + F.picked.length < 2 * PER_COHORT) { console.log('panel: INCOMPLETE, land more candidates'); process.exit(1); }
    if (short) console.log(`the FIRE cohort ran out: ${short} more from the library`);
    const ids = [...used].sort(), hash = createHash('sha256').update(ids.join(',')).digest('hex').slice(0, 12);
    const panel = [...L.picked, ...F.picked].map(r => ({ id: r.id, base: r.base, cohort: r.cohort, target: r.target, libraryTarget: r.libraryTarget, armA: r.survival, label: r.label, steps: r.steps.length, code: r.code, head: r.head }));
    if (new Set(panel.map(r => r.code)).size !== 1) { console.log(`panel: the landings ran on more than one code (${[...new Set(panel.map(r => r.code))].join(', ')})`); process.exit(1); }
    writeFileSync(PANEL_FILE, JSON.stringify({ built: new Date().toISOString(), touched: { count: ids.length, hash }, aim: AIM, tol: TOL, seed: LAND_SEED, paths: LAND_PATHS, panel }, null, 1) + '\n');
    console.log(`panel: ${panel.length} households written to phase4-panel.json; touched ${ids.length} (hash ${hash})`);
  }
}
