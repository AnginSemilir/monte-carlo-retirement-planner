/*
 * PART D, D4'S PANEL (the launch plan's section 6, D4: "40 couples, none used before, chosen by the held-out scan: 20 of the
 * library's couples and 20 of a younger cohort. Each is landed so the app's rules survive about 85%. The floor is at 80%. The
 * one-off costs are kept"), built as Phase 4's was (phase4-panel.mjs, whose landing, arm A plan and constants it takes):
 *   - touched: held-out.mjs touchedAll (phase4-panel.mjs touched(), widened to the review branch's research/reviews/: STATE.md
 *     D38 (1)), and the households the tests take by their place in the library rather than by name, which no text names
 *     (couple-lockstep.test.mjs's eight couples and twelve households: engine-side checks only, left out all the same,
 *     byIndex), taken once and frozen in couples-orders.json (freeze), which every later step reads; a couple Part D's own
 *     tests name (couple-quick, couple-tables, couple-levers) is touched by the scan;
 *   - the library cohort: untouched couples whose first person is older than 44, 20 taken evenly in library order
 *     (select-7u-broad.mjs pick), the rest of the pool after them in library order as reserves;
 *   - the younger cohort: untouched couples whose first person is 44 or under, each person retiring at 52 instead (the id
 *     with an F), in library order;
 *   - every arm's plan (planOf): the library couple (younger: both retiring at 52) at its landed target, the floor at 80% of it,
 *     the minimum pot written in (the couple's own, or one year's target where it has none: solvePlan's rule for each person,
 *     so every arm's engine counts survival alike), the one-off costs as the library has them, and the candidate's return
 *     assumptions (candidatePlan: O60's blend medians), on which every arm runs;
 *   - arm A: phase4-panel.mjs appPlan and select-phase4.mjs armA with { tournament: false } (D36), as in Phase 4;
 *   - landing: the target set by bisection (whole hundreds of pounds) until arm A, searched anew at each target, survives
 *     85 +/- 1% on 1,000 paths of seed 7005 (the selection seed); a couple that does not land within 16 steps is passed over;
 *   - the panel: the first 20 landed in each cohort's order, written to couples-panel.json with the scan's count and hash.
 *   node research/solver/couple-panel.mjs freeze                 the scan and the two orders, taken once, to couples-orders.json
 *   node research/solver/couple-panel.mjs list                   the two cohorts' orders
 *   node research/solver/couple-panel.mjs land <lib|young> <k>   land candidate k of that order (results/d4-land/<id>.json)
 *   node research/solver/couple-panel.mjs combine                couples-panel.json from the landings so far
 *   node research/solver/couple-panel.mjs summary > results-couples-panel.txt   the panel as built: each couple's landing,
 *                                                                horizon, ages and cost years, the lump-sum count, and the
 *                                                                panel's couples named outside the scan (PRIOR_FILES)
 *   node research/solver/couple-panel.mjs --planted              the checks on planted inputs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { candidatePlan } from './candidate.mjs';
import { armA } from './select-phase4.mjs';
import { appPlan, landTarget, PER_COHORT, MAX_FIRE_AGE, FIRE_RETIRE, LAND_SEED, LAND_PATHS } from './phase4-panel.mjs';
import { touchedAll } from './held-out.mjs';
import { pick } from './select-7u-broad.mjs';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.D4_LAND_OUT || join(HERE, 'results', 'd4-land');
/* files that name library households the held-out scan does not read (the app's side; the design review of 7 Nov, MINOR 7) */
export const PRIOR_FILES = ['../policy-study/confirmed-results.json'];
export const PANEL_FILE = process.env.D4_PANEL || join(HERE, 'couples-panel.json'), ORDERS_FILE = join(HERE, 'couples-orders.json');
export { appPlan };

export const couplesOf = () => buildScenarios().filter(s => s.plan.demographics.planningMode !== 'single')
  .map(s => ({ id: s.id, age: Number(s.plan.demographics.currentAgeSelf), name: s.name, plan: s.plan }));
export const idOf = (h, cohort) => (cohort === 'young' ? `${h.id}F` : h.id);

/* the households the tests take by place, not by name (couple-lockstep.test.mjs: PICK, eight couples evenly; spread, twelve
   households evenly over the whole library) */
export function byIndex(library = buildScenarios()) {
  const cs = library.filter(s => s.plan.demographics.planningMode !== 'single');
  const pickC = cs.filter((_, i) => i % Math.floor(cs.length / 8) === 0).slice(0, 8), spread = library.filter((_, i) => i % Math.floor(library.length / 12) === 0).slice(0, 12);
  return new Set([...pickC, ...spread].map(s => s.id));
}

/* the two cohorts' orders: the library's even 20 then its reserves; the younger cohort in library order */
export function cohorts(couples, used, n = PER_COHORT) {
  const lib = pick(couples, used, n), chosen = new Set(lib.panel.map(s => s.id));
  return { lib: [...lib.panel, ...lib.pool.filter(s => !chosen.has(s.id))], young: couples.filter(s => s.age <= MAX_FIRE_AGE && !used.has(s.id)), libPool: lib.pool.length };
}

/* the couple as every arm runs it, at a target: see the header */
export function planOf(h, cohort, target) {
  const p = JSON.parse(JSON.stringify(h.plan));
  if (cohort === 'young') { p.demographics.retireAgeSelf = FIRE_RETIRE; p.demographics.retireAgePart = FIRE_RETIRE; }
  const own = Math.max(0, E.num(p.config && p.config.solvencyFloor, 0));
  p.spending = { ...p.spending, targetSpend: target, floorSpend: Math.round(0.8 * target) };
  p.config = { ...p.config, solvencyFloor: own > 0 ? own : target };
  return candidatePlan(E, E.normalizePlan(p));
}

/* arm A's survival at a target, on the landing's paths, and its policy's label */
export function armAAt(h, cohort, target) {
  const a = armA(appPlan(planOf(h, cohort, target)), { tournament: false });
  return { survival: E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate, label: a.label };
}

export function readPanel() {
  const j = JSON.parse(readFileSync(PANEL_FILE, 'utf8')), all = couplesOf();
  return j.panel.map(r => ({ ...r, plan: planOf(all.find(s => s.id === r.base), r.cohort, r.target) }));
}

function planted() {
  const cases = [];
  const L = Array.from({ length: 12 }, (_, i) => ({ id: `S${String(2 * i + 1).padStart(3, '0')}`, age: i < 3 ? 40 : 60 }));
  { const c = cohorts(L, new Set(['S007', 'S003']), 3);
    cases.push(['the touched left out, the young to their cohort, the library\'s three taken evenly then its reserves', `${c.lib.map(x => x.id).join(',')} | ${c.young.map(x => x.id).join(',')}`, 'S009,S013,S019,S011,S015,S017,S021,S023 | S001,S005']); }
  { const all = couplesOf(), h = all.find(s => s.age <= MAX_FIRE_AGE && !(E.num(s.plan.config.solvencyFloor, 0) > 0)), g = all.find(s => E.num(s.plan.config.solvencyFloor, 0) > 0 && s.age > MAX_FIRE_AGE);
    const p = planOf(h, 'young', 30000), q = planOf(g, 'lib', 50000);
    cases.push(['the younger cohort: each person retires at 52, the floor at 80%, the minimum pot one year\'s target where the couple has none', `${p.demographics.retireAgeSelf} ${p.demographics.retireAgePart} ${p.spending.floorSpend} ${p.config.solvencyFloor}`, '52 52 24000 30000']);
    cases.push(['a couple\'s own minimum pot kept', `${q.config.solvencyFloor}`, String(E.num(g.plan.config.solvencyFloor, 0))]);
    cases.push(['the one-off costs kept as the library has them', JSON.stringify((q.oneOffCosts || []).map(c => [c.year, c.amount])), JSON.stringify((g.plan.oneOffCosts || []).map(c => [c.year, c.amount]))]);
    cases.push(['the candidate\'s returns on every arm (High Risk at the blend median)', `${p.riskProfiles['High Risk'].real}`, '4.97']);
    cases.push(['a couple, both people kept', `${p.demographics.planningMode} ${p.accounts.some(a => a.owner === 'Partner')}`, 'couple true']); }
  cases.push(['an id with an F is the younger cohort\'s', `${idOf({ id: 'S301' }, 'young')} ${idOf({ id: 'S301' }, 'lib')}`, 'S301F S301']);
  { const b = byIndex(); cases.push(['the tests\' households by place: couple-lockstep\'s eight couples and twelve households, S001 in both', `${b.size} ${['S001', 'S157', 'S313', 'S035', 'S385'].every(id => b.has(id))}`, '19 true']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const mode = process.argv[2] || 'list';
  if (mode === '--planted') process.exit(planted() ? 1 : 0);
  const all = couplesOf(), byId = Object.fromEntries(all.map(h => [h.id, h]));
  const orders = () => {
    if (!existsSync(ORDERS_FILE)) { console.error('couple-panel: no couples-orders.json; run freeze first'); process.exit(2); }
    const o = JSON.parse(readFileSync(ORDERS_FILE, 'utf8'));
    return { used: new Set(o.touched.ids), touchedHash: o.touched.hash, lib: o.lib.map(id => byId[id]), young: o.young.map(id => byId[id]), libPool: o.libPool };
  };
  if (mode === 'freeze') {
    if (existsSync(ORDERS_FILE)) { console.error('couple-panel: couples-orders.json exists; the orders are taken once'); process.exit(2); }
    const used = touchedAll(); for (const id of byIndex()) used.add(id);
    const c = cohorts(all, used), ids = [...used].sort(), hash = createHash('sha256').update(ids.join(',')).digest('hex').slice(0, 12);
    writeFileSync(ORDERS_FILE, JSON.stringify({ built: new Date().toISOString(), touched: { count: ids.length, hash, ids }, libPool: c.libPool, lib: c.lib.map(h => h.id), young: c.young.map(h => h.id) }, null, 1) + '\n');
    console.log(`frozen: touched ${ids.length} ids (hash ${hash}); the library order ${c.lib.length} (pool ${c.libPool}), the younger order ${c.young.length}`);
  }
  if (mode === 'list') {
    const { used, lib, young, libPool } = orders();
    console.log(`touched (frozen in couples-orders.json): ${[...used].filter(id => all.some(s => s.id === id)).length} of the library's ${all.length} couples; library pool ${libPool} (first person older than ${MAX_FIRE_AGE}), younger pool ${young.length}`);
    lib.forEach((h, k) => console.log(`  lib   ${String(k).padStart(3)}  ${h.id} ${h.name}${k < PER_COHORT ? '' : '  (reserve)'}`));
    young.forEach((h, k) => console.log(`  young ${String(k).padStart(3)}  ${h.id}F ${h.name}${k < PER_COHORT ? '' : '  (reserve)'}`));
  }
  if (mode === 'land') {
    const which = process.argv[3], k = Number(process.argv[4]), { lib, young } = orders(), list = which === 'young' ? young : lib;
    if (!(k >= 0 && k < list.length)) { console.error(`couple-panel: k must be 0..${list.length - 1}`); process.exit(2); }
    const h = list[k], cohort = which === 'young' ? 'young' : 'lib', id = idOf(h, cohort), t0 = Date.now();
    let label = null;
    const survivalAt = T => { const a = armAAt(h, cohort, T); label = a.label; return a.survival; };
    const r = landTarget(survivalAt, E.num(h.plan.spending.targetSpend, 0));
    const last = r.steps[r.steps.length - 1];
    if (last.target !== r.target) survivalAt(r.target);   // arm A's label at the target taken
    mkdirSync(OUT, { recursive: true });
    const cid = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ id, base: h.id, cohort, k, name: h.name, libraryTarget: E.num(h.plan.spending.targetSpend, 0), ...r, label, code: cid ? cid.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }));
    console.log(`${cohort.padEnd(5)} ${String(k).padStart(3)} ${id.padEnd(6)} target ${r.target} (library ${E.num(h.plan.spending.targetSpend, 0)}) arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : 'NOT LANDED'} in ${r.steps.length} steps, ${label}; ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'summary') {
    const j = JSON.parse(readFileSync(PANEL_FILE, 'utf8')), { lib, young } = orders(), panel = readPanel();
    const lands = Object.fromEntries([...lib.map(h => idOf(h, 'lib')), ...young.map(h => idOf(h, 'young'))].filter(id => existsSync(join(OUT, `${id}.json`))).map(id => [id, JSON.parse(readFileSync(join(OUT, `${id}.json`), 'utf8'))]));
    const prior = Object.fromEntries(PRIOR_FILES.map(f => [f, new Set(readFileSync(join(HERE, f), 'utf8').match(/S\d{3}/g) || [])]));
    console.log(`D4's panel (couples-panel.json, built ${j.built}; the scan ${j.touched.count} ids, hash ${j.touched.hash})`);
    for (const [co, list] of [['lib', lib], ['young', young]]) {
      const ids = list.map(h => idOf(h, co)), firstOut = ids.findIndex(id => !lands[id]), tried = ids.slice(0, firstOut < 0 ? ids.length : firstOut), inPanel = panel.filter(h => h.cohort === co);
      const before = tried.slice(0, tried.indexOf(inPanel[inPanel.length - 1].id) + 1);
      console.log(`${co === 'lib' ? 'library' : 'younger'}: ${inPanel.length} in the panel; ${tried.length} candidates landed in order (${tried.filter(id => lands[id].landed).length} landed, ${tried.filter(id => !lands[id].landed).length} not), ${before.filter(id => !lands[id].landed).length} passed over before the panel's last; arm A from ${Math.min(...inPanel.map(h => h.survival)).toFixed(1)}% to ${Math.max(...inPanel.map(h => h.survival)).toFixed(1)}%`);
    }
    const lump = panel.filter(h => /lump sum/.test(h.label));
    console.log(`arm A's pick takes the full lump sum on ${lump.length} of ${panel.length} (by its label)`);
    let retired = 0;
    for (const h of panel) {
      const ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(h.plan))), cy = [...(ctx.oneOffCosts instanceof Map ? ctx.oneOffCosts.keys() : [])].map(y => Number(y) - ctx.baseYear).filter(t => t >= 0 && t <= ctx.totalYears).sort((a, b) => a - b);
      const ret = cy.map(t => ctx.owners.some(o => o.age0 + t >= o.retireAge)); if (ret.some(Boolean)) retired++;
      const named = Object.entries(prior).filter(([, s]) => s.has(h.base)).map(([f]) => f.replace(/.*\//, ''));
      console.log(`  ${h.cohort.padEnd(5)} ${h.id.padEnd(6)} target ${h.target} arm A ${h.survival.toFixed(1)}% (${h.label}); ${ctx.totalYears + 1} years, ages ${ctx.owners.map(o => `${o.age0} retiring at ${o.retireAge}`).join(' and ')}; cost years ${cy.map((t, q) => `${t}${ret[q] ? '' : ' (no one retired)'}`).join(', ') || 'none'}${named.length ? `; named in ${named.join(', ')} (as ${h.base})` : ''}`);
    }
    const named = panel.filter(h => Object.values(prior).some(s => s.has(h.base)));
    console.log(`someone retired in a cost year: ${retired} of ${panel.length}`);
    console.log(`named outside the scan (${PRIOR_FILES.join(', ')}): ${named.length} of ${panel.length}, ${named.map(h => (h.id === h.base ? h.id : `${h.id} (as ${h.base})`)).join(', ')}`);
  }
  if (mode === 'combine') {
    const { used, touchedHash, lib, young } = orders();
    const walk = (list, cohort, want = PER_COHORT) => { const picked = []; let gap = null, passed = 0; for (const h of list) { if (picked.length === want) break; const f = join(OUT, `${idOf(h, cohort)}.json`); if (!existsSync(f)) { gap = idOf(h, cohort); break; } const r = JSON.parse(readFileSync(f, 'utf8')); if (r.landed) picked.push(r); else passed++; } return { picked, gap, passed }; };
    // the younger cohort first; if it runs out with every candidate tried, the library fills the panel to 40 (Phase 4's rule)
    const Y = walk(young, 'young'), short = Y.gap ? 0 : PER_COHORT - Y.picked.length, L = walk(lib, 'lib', PER_COHORT + short);
    for (const [n, w] of [['library', L], ['younger', Y]]) console.log(`${n}: ${w.picked.length} landed${w.passed ? `, ${w.passed} passed over (not landed)` : ''}${w.gap ? `; stopped at the first not yet landed, ${w.gap}` : ''}`);
    if (L.picked.length + Y.picked.length < 2 * PER_COHORT) { console.log('panel: INCOMPLETE, land more candidates'); process.exit(1); }
    const panel = [...L.picked, ...Y.picked].map(r => ({ id: r.id, base: r.base, cohort: r.cohort, target: r.target, survival: r.survival, label: r.label }));
    writeFileSync(PANEL_FILE, JSON.stringify({ built: new Date().toISOString(), touched: { count: used.size, hash: touchedHash }, panel }, null, 1) + '\n');
    console.log(`panel: ${panel.length} couples to ${PANEL_FILE}; arm A from ${Math.min(...panel.map(p => p.survival)).toFixed(1)}% to ${Math.max(...panel.map(p => p.survival)).toFixed(1)}%`);
  }
  /*
   * THE RE-RUN'S TARGETS (the review of 9 Nov, item 1, part 2; D66, D67): D4's 40 couples, in its panel's order, each landed
   * again by the same procedure (landTarget from the library's target, arm A searched anew at each step, 85 +/- 1% on 1,000
   * paths of seed 7005) on the code after items 2 to 5. The couples and their order do not change: a couple that does not
   * land is reported, not passed over (a STOP). Each landing to results/d4b-land/<id>.json; `reland combine` writes
   * couples-panel-d4b.json (couples-panel.json stays D4's).
   *   node research/solver/couple-panel.mjs reland <k>         land again the panel's couple k (0..39)
   *   node research/solver/couple-panel.mjs reland combine     couples-panel-d4b.json, once all 40 are in
   */
  if (mode === 'reland') {
    const D4 = JSON.parse(readFileSync(join(HERE, 'couples-panel.json'), 'utf8')).panel, OUTB = process.env.D4B_LAND_OUT || join(HERE, 'results', 'd4b-land');
    if (process.argv[3] === 'combine') {
      const got = D4.map(r => { const f = join(OUTB, `${r.id}.json`); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; });
      const missing = D4.filter((r, i) => !got[i]).map(r => r.id), unlanded = got.filter(x => x && !x.landed).map(x => x.id), codes = [...new Set(got.filter(Boolean).map(x => x.code))];
      if (missing.length || unlanded.length || codes.length !== 1) { console.log(`reland: NOT COMPLETE: missing ${missing.join(', ') || 'none'}; not landed ${unlanded.join(', ') || 'none'}; codes ${codes.join(', ')}`); process.exit(1); }
      const { used, touchedHash } = orders();
      const panel = got.map(x => ({ id: x.id, base: x.base, cohort: x.cohort, target: x.target, survival: x.survival, label: x.label, d4Target: x.d4Target }));
      const file = join(HERE, 'couples-panel-d4b.json');
      writeFileSync(file, JSON.stringify({ built: new Date().toISOString(), code: codes[0], from: 'couples-panel.json (D4), each couple landed again', touched: { count: used.size, hash: touchedHash }, panel }, null, 1) + '\n');
      console.log(`reland: ${panel.length} couples to ${file} on code ${codes[0]}; arm A from ${Math.min(...panel.map(p => p.survival)).toFixed(1)}% to ${Math.max(...panel.map(p => p.survival)).toFixed(1)}%; the targets against D4's: ${panel.map(p => `${p.id} ${p.d4Target} to ${p.target}`).join(', ')}`);
    } else {
      const k = Number(process.argv[3]);
      if (!(k >= 0 && k < D4.length)) { console.error(`couple-panel: reland k must be 0..${D4.length - 1}`); process.exit(2); }
      const r0 = D4[k], h = byId[r0.base], t0 = Date.now();
      let label = null;
      const survivalAt = T => { const a = armAAt(h, r0.cohort, T); label = a.label; return a.survival; };
      const r = landTarget(survivalAt, E.num(h.plan.spending.targetSpend, 0));
      const last = r.steps[r.steps.length - 1];
      if (last.target !== r.target) survivalAt(r.target);
      mkdirSync(OUTB, { recursive: true });
      const cid = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
      writeFileSync(join(OUTB, `${r0.id}.json`), JSON.stringify({ id: r0.id, base: r0.base, cohort: r0.cohort, k, d4Target: r0.target, libraryTarget: E.num(h.plan.spending.targetSpend, 0), ...r, label, code: cid ? cid.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }));
      console.log(`reland ${String(k).padStart(2)} ${r0.id.padEnd(6)} target ${r.target} (D4's ${r0.target}) arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : 'NOT LANDED (a STOP)'} in ${r.steps.length} steps, ${label}; ${Math.round((Date.now() - t0) / 1000)} s`);
    }
  }
}
