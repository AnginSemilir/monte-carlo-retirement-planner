/*
 * STEP 8, THE PANEL (STEP8.md; registrations/household-hsp.md, DRAFT; D129 (3)): held-out couples for the registered test of
 * the household plan priced at the pensions' split (HSP) against today's couples' default (K2) and the app's rules (APP).
 *   - touched: held-out.mjs touchedAll run on the day, with the households the tests take by place (couple-panel.mjs
 *     byIndex) and the base of every unit the household line has read (audit-household.mjs UNITS, shapes-panel.mjs BASES,
 *     guard-panel.mjs UNIT_IDS: the unit's id without its variant, shape or cohort's F), taken once and frozen with the
 *     orders in household-hsp-orders.json, which every later step reads;
 *   - the two orders of couples-orders.json (D4's): the library's (first person older than 44) and the younger cohort's
 *     (first person 44 or under, each retiring at 52: couple-panel.mjs planOf 'young'), the touched left out of each; four
 *     taken evenly in each (evenly: places 0, n/4, n/2, 3n/4 of the pool, as select-7u-broad.mjs pick takes them), then
 *     the rest in order as reserves. Two of the three couples the remedy placed (S333F, S335F) are of the younger cohort;
 *   - each couple five times (units), the unit's id <the couple's id as its cohort names it>-<variant>:
 *       own   the plan as the library holds it (60/40, the first person the elder);
 *       45    every wrapper re-held so the first person holds 45% of its total (share-rules-panel.mjs reheldAt);
 *       90    the same at 90%;
 *       a feature at the library's own holding, set by the couple's place in its cohort (share-rules-panel.mjs
 *             withFeature, FEATURES[place % 3]): 'db' a £15,000 a year taxable DB pension of the first person's from the
 *             state pension age, 'dbpart' the same of the partner's, 'sppart' the partner's state pension at 60%;
 *       gap8  the partner eight years younger than the first person (shapes-panel.mjs shapeOf), no other income;
 *   - every unit's plan (unitPlan): the variant, then couple-panel.mjs planOf at the couple's cohort and target;
 *   - landing: each candidate's seven variants (the three features among them, so a couple can take any place) landed so
 *     arm A, searched anew at each target, survives 85 +/- 1% on 1,000 paths of seed 7005 (phase4-panel.mjs landTarget,
 *     D4's procedure); at its target each landed variant read by the app's own guard (src/couplesSwitch.js coupleSolverOn:
 *     on, so K2 is what the app runs for it) and by householdPlanFor at HSP's settings (scale 'pensions') on the plan as the
 *     solvers are handed it (shapes-panel.mjs solverPlanOf: arm A's policy, the couples' solver plan);
 *   - the panel (combine): each cohort's order walked; a couple joins at its cohort's next place if its own, 45, 90 and gap8
 *     variants and the feature of that place all landed, are on by the guard and are taken by householdPlanFor, is passed
 *     over (reported) if one is not, and the walk stops at the first candidate not yet landed.
 *   node research/solver/household-hsp-panel.mjs freeze                  the scan and the orders, taken once
 *   node research/solver/household-hsp-panel.mjs list                    the orders
 *   node research/solver/household-hsp-panel.mjs land <lib|young> <k>    land candidate k (results/household-hsp-land/)
 *   node research/solver/household-hsp-panel.mjs combine                 household-hsp-panel.json from the landings
 *   node research/solver/household-hsp-panel.mjs summary > results-household-hsp-panel.txt
 *   node research/solver/household-hsp-panel.mjs --planted               the checks on planted inputs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import { couplesOf, planOf, byIndex, idOf, ORDERS_FILE } from './couple-panel.mjs';
import { reheldAt, withFeature, FEATURES, DB_AMOUNT } from './share-rules-panel.mjs';
import { shapeOf, solverPlanOf, BASES as SHAPE_BASES } from './shapes-panel.mjs';
import { UNIT_IDS as GUARD_IDS } from './guard-panel.mjs';
import { UNITS as LEAD_UNITS } from './audit-household.mjs';
import { armA } from './select-phase4.mjs';
import { appPlan, landTarget, LAND_SEED, LAND_PATHS } from './phase4-panel.mjs';
import { touchedAll } from './held-out.mjs';
import { householdPlanFor } from './household.mjs';
import { coupleSolverOn } from '../../src/couplesSwitch.js';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const COHORTS = ['lib', 'young'], N_PER = 4;
export const HOLDS = { 45: 0.45, 90: 0.9 };
export const VARIANTS = ['own', ...Object.keys(HOLDS), ...FEATURES, 'gap8'];
export const HSP_OPTS = Object.freeze({ scale: 'pensions' });
export const ORDERS = join(HERE, 'household-hsp-orders.json'), PANEL = process.env.HOUSEHOLD_HSP_PANEL || join(HERE, 'household-hsp-panel.json');
const OUT = process.env.HOUSEHOLD_HSP_LAND_OUT || join(HERE, 'results', 'household-hsp-land');
export const unitIdOf = (cid, v) => `${cid}-${v}`;
export const featureAt = place => FEATURES[place % FEATURES.length];
export const needAt = place => ['own', ...Object.keys(HOLDS), featureAt(place), 'gap8'];

/* a unit id of the household line's reads, down to its library couple: S023-90 -> S023, S337F@gap8+db -> S337 */
export const baseIdOf = id => String(id).split(/[@+]/)[0].replace(/-[\w]+$/, '').replace(/F$/, '');
/* the library couple as the variant holds it, before its cohort and target are set */
export function variantPlan(h, v) {
  if (v === 'own') return h.plan;
  if (HOLDS[v] !== undefined) return reheldAt(h.plan, HOLDS[v]);
  if (FEATURES.includes(v)) return withFeature(h.plan, v);
  if (v === 'gap8') return shapeOf(h.plan, 'gap8');
  throw new Error(`household-hsp-panel: no variant '${v}'`);
}
/* the unit's plan at a target, as every arm runs it */
export const unitPlan = (h, cohort, v, target) => planOf({ ...h, plan: variantPlan(h, v) }, cohort, target);
/* the app's guard on the unit's plan (on: the app runs K2 for it), and householdPlanFor at HSP's settings on the plan as the
   solvers are handed it (null: it takes the plan) */
export function guardOf(plan) { const g = coupleSolverOn(plan); return { on: g.on, why: g.why, share: g.share }; }
export function refusalOf(plan) {
  const { hp } = solverPlanOf(plan, 'own');
  try { householdPlanFor(E, hp, HSP_OPTS); return null; } catch (e) { return e.message; }
}
/* n taken evenly in a pool (select-7u-broad.mjs pick's places, without its age filter), then the rest in order */
export function evenly(pool, n) {
  if (pool.length < n) throw new Error(`household-hsp-panel: ${pool.length} couples left for ${n} places`);
  const chosen = Array.from({ length: n }, (_, i) => pool[Math.floor(i * pool.length / n)]), set = new Set(chosen);
  return [...chosen, ...pool.filter(x => !set.has(x))];
}
/* every id the household line has read, down to its library couple */
export const householdLineBases = () => new Set([...LEAD_UNITS.map(u => u.id), ...SHAPE_BASES, ...GUARD_IDS].map(baseIdOf));
/* one cohort's walk over its landings (lands: couple id -> landing record): the panel, those passed over, where it stopped */
export function walk(order, lands, n = N_PER) {
  const panel = [], passed = []; let gap = null;
  for (const id of order) {
    if (panel.length === n) break;
    const L = lands[id];
    if (!L) { gap = id; break; }
    const need = needAt(panel.length), bad = need.filter(v => { const x = L.variants[v]; return !(x && x.landed && x.guard && x.guard.on && x.refusal === null); });
    if (bad.length) { passed.push({ id, place: panel.length, not: bad.map(v => { const x = L.variants[v]; return `${v}: ${!x || !x.landed ? 'not landed' : !x.guard.on ? `the guard ${x.guard.why}` : `refused (${x.refusal})`}`; }) }); continue; }
    panel.push({ couple: id, base: L.base, cohort: L.cohort, place: panel.length, feature: featureAt(panel.length), units: need.map(v => ({ id: unitIdOf(id, v), variant: v, target: L.variants[v].target, survival: L.variants[v].survival, label: L.variants[v].label })) });
  }
  return { panel, passed, gap };
}
/* the panel's units, each with its plan at its landed target */
export function readHspPanel(file = PANEL) {
  const j = JSON.parse(readFileSync(file, 'utf8')), byId = Object.fromEntries(couplesOf().map(h => [h.id, h]));
  return j.cohorts.flatMap(c => c.panel.flatMap(p => p.units.map(u => ({ ...u, couple: p.couple, base: p.base, cohort: p.cohort, place: p.place, feature: p.feature, plan: unitPlan(byId[p.base], p.cohort, u.variant, u.target) }))));
}
const firstShare = p => { const s = p.accounts.filter(a => a.id.endsWith('_self')).reduce((t, a) => t + (Number(a.balance) || 0), 0), all = p.accounts.reduce((t, a) => t + (Number(a.balance) || 0), 0); return all > 0 ? s / all : NaN; };

function planted() {
  const cases = [], all = couplesOf();
  const h = all.find(x => x.plan.accounts.some(a => a.id.startsWith('other_') && Number(a.balance) > 0) && x.age > 44 && x.age < 60);
  // the bases of the household line's ids
  cases.push(['the household line\'s ids down to their library couple', ['S023-90', 'S061-dbpart', 'S337F@gap8+db', 'S149@gap12+rent', 'S327F', 'S205'].map(baseIdOf).join(','), 'S023,S061,S337,S149,S327,S205']);
  // the variants: own the library plan; 45 and 90 every wrapper's total kept; the features and gap8 one change each
  { const p = unitPlan(h, 'lib', 'own', 30000), q = planOf(h, 'lib', 30000);
    cases.push(['own: the library couple at its cohort and target, unchanged', JSON.stringify(p) === JSON.stringify(q) ? 'same' : 'DIFFERENT', 'same']); }
  for (const v of Object.keys(HOLDS)) cases.push([`${v}: the first person holds ${HOLDS[v]} of the pots`, firstShare(variantPlan(h, v)).toFixed(4), HOLDS[v].toFixed(4)]);
  { const p = unitPlan(h, 'lib', 'gap8', 30000), d = p.demographics;
    cases.push(['gap8: the partner eight years younger, no other income added', `${E.num(d.currentAgeSelf, 0) - E.num(d.currentAgePart, 0)} ${(p.otherIncomes || []).length === (h.plan.otherIncomes || []).length}`, '8 true']); }
  { const p = unitPlan(h, 'young', 'own', 30000).demographics;
    cases.push(['the younger cohort retires both at 52', `${p.retireAgeSelf} ${p.retireAgePart}`, '52 52']); }
  cases.push(['a variant the panel does not know is refused', (() => { try { variantPlan(h, 'rent'); return 'no'; } catch { return 'threw'; } })(), 'threw']);
  // the guard: on for the library's own couple; off for the same couple more than three years apart with a DB pension
  { const g0 = guardOf(unitPlan(h, 'lib', 'own', 30000)), g1 = guardOf(withFeature(unitPlan(h, 'lib', 'gap8', 30000), 'db'));
    cases.push(['the guard: on for own; off (gapincome) with the gap and a £15,000 DB pension', `${g0.on} ${g1.on} ${g1.why}`, 'true false gapincome']); }
  // evenly and the walk
  { const ids = Array.from({ length: 30 }, (_, i) => `T${String(2 * i + 1).padStart(3, '0')}`);
    cases.push(['evenly: four of 30 at places 0, 7, 15, 22, then the rest in order', evenly(ids, 4).slice(0, 6).join(','), 'T001,T015,T031,T045,T003,T005']);
    const ok = { landed: true, guard: { on: true }, refusal: null, target: 1000, survival: 85, label: 'x' };
    const land = (bad = {}) => ({ base: 'B', cohort: 'lib', variants: Object.fromEntries(VARIANTS.map(v => [v, bad[v] || ok])) });
    const lands = { T001: land(), T003: land({ dbpart: { ...ok, landed: false } }), T005: land({ gap8: { ...ok, guard: { on: false, why: 'gapincome' } } }), T007: land({ db: { ...ok, refusal: 'two risks' } }), T009: land() };
    const w = walk(['T001', 'T003', 'T005', 'T007', 'T009'], lands, 4);
    cases.push(['the walk: T003\'s partner DB pension not landed (place 1 takes it), T005\'s gap8 off by the guard, T007 takes place 1 though its own DB pension is refused, T009 place 2',
      `${w.panel.map(c => `${c.couple}:${c.feature}`).join(',')} passed ${w.passed.map(x => x.id).join(',')} gap ${w.gap}`, 'T001:db,T007:dbpart,T009:sppart passed T003,T005 gap null']);
    const w2 = walk(['T001', 'T003'], { T001: land() }, 4);
    cases.push(['the walk stops at the first candidate not yet landed', `${w2.panel.length} ${w2.gap}`, '1 T003']); }
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
    if (!existsSync(ORDERS)) { console.error('household-hsp-panel: no household-hsp-orders.json; run freeze first'); process.exit(2); }
    return JSON.parse(readFileSync(ORDERS, 'utf8'));
  };
  const landsOf = ids => Object.fromEntries(ids.filter(id => existsSync(join(OUT, `${id}.json`))).map(id => [id, JSON.parse(readFileSync(join(OUT, `${id}.json`), 'utf8'))]));
  if (mode === 'freeze') {
    if (existsSync(ORDERS)) { console.error('household-hsp-panel: household-hsp-orders.json exists; the orders are taken once'); process.exit(2); }
    const o = JSON.parse(readFileSync(ORDERS_FILE, 'utf8')), used = touchedAll();
    for (const id of byIndex()) used.add(id);
    for (const id of householdLineBases()) used.add(id);
    const ids = [...used].sort(), hash = createHash('sha256').update(ids.join(',')).digest('hex').slice(0, 12);
    const order = Object.fromEntries(COHORTS.map(c => [c, evenly(o[c].filter(id => !used.has(id) && byId[id]), N_PER).map(id => idOf(byId[id], c))]));
    writeFileSync(ORDERS, JSON.stringify({ built: new Date().toISOString(), from: 'couples-orders.json lib and young (D4\'s orders)', touched: { count: ids.length, hash, ids }, order }, null, 1) + '\n');
    for (const c of COHORTS) console.log(`frozen ${c}: the four ${order[c].slice(0, N_PER).join(', ')}, then ${order[c].length - N_PER} reserves`);
    console.log(`touched ${ids.length} ids (hash ${hash})`);
  }
  const baseOfCid = cid => byId[cid.replace(/F$/, '')] ? cid.replace(/F$/, '') : cid;
  if (mode === 'list') {
    const { order } = orders();
    for (const c of COHORTS) order[c].forEach((cid, k) => { const d = byId[baseOfCid(cid)].plan.demographics; console.log(`  ${c.padEnd(5)} ${String(k).padStart(3)}  ${cid} ages ${d.currentAgeSelf}/${d.currentAgePart}${k < N_PER ? '' : ' (reserve)'}`); });
  }
  if (mode === 'land') {
    const cohort = process.argv[3], k = Number(process.argv[4]), { order } = orders();
    if (!COHORTS.includes(cohort) || !(k >= 0 && k < order[cohort].length)) { console.error(`household-hsp-panel: land <lib|young> <k>, k 0..${order[cohort] ? order[cohort].length - 1 : '?'}`); process.exit(2); }
    const cid = order[cohort][k], h = byId[baseOfCid(cid)], t0 = Date.now(), variants = {};
    for (const v of VARIANTS) {
      let label = null;
      const survivalAt = T => { const a = armA(appPlan(unitPlan(h, cohort, v, T)), { tournament: false }); label = a.label; return E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate; };
      const r = landTarget(survivalAt, E.num(h.plan.spending.targetSpend, 0)), last = r.steps[r.steps.length - 1];
      if (last.target !== r.target) survivalAt(r.target);   // arm A's label at the target taken
      const plan = unitPlan(h, cohort, v, r.target), guard = guardOf(plan), refusal = r.landed ? refusalOf(plan) : null;
      variants[v] = { ...r, label, firstShare: firstShare(variantPlan(h, v)), guard, refusal };
      console.log(`  ${unitIdOf(cid, v).padEnd(13)} target ${r.target} (library ${E.num(h.plan.spending.targetSpend, 0)}) arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : 'NOT LANDED'} in ${r.steps.length} steps, ${label}; the guard ${guard.on ? 'on' : `off (${guard.why})`}; householdPlanFor ${refusal === null ? 'takes it' : `refuses: ${refusal}`}`);
    }
    mkdirSync(OUT, { recursive: true });
    const id = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
    writeFileSync(join(OUT, `${cid}.json`), JSON.stringify({ couple: cid, base: h.id, cohort, k, name: h.name, libraryTarget: E.num(h.plan.spending.targetSpend, 0), variants, code: id ? id.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }));
    console.log(`${cohort} ${String(k).padStart(3)} ${cid} landed in ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'combine') {
    const o = orders(), cohorts = [], codes = new Set();
    for (const c of COHORTS) {
      const lands = landsOf(o.order[c]), w = walk(o.order[c], lands);
      console.log(`${c}: ${w.panel.length} couples${w.passed.length ? `; passed over ${w.passed.map(x => `${x.id} (${x.not.join('; ')})`).join('; ')}` : ''}${w.gap ? `; stopped at the first not yet landed, ${w.gap}` : ''}`);
      for (const p of w.panel) codes.add(lands[p.couple].code);
      cohorts.push({ cohort: c, passed: w.passed, panel: w.panel, complete: w.panel.length === N_PER });
    }
    if (cohorts.some(c => !c.complete)) { console.log('panel: INCOMPLETE, land more candidates'); process.exit(1); }
    if (codes.size !== 1) { console.log(`panel: the landings are on ${codes.size} codes (${[...codes].join(', ')}): land them again on one`); process.exit(1); }
    writeFileSync(PANEL, JSON.stringify({ built: new Date().toISOString(), code: [...codes][0], touched: { count: o.touched.count, hash: o.touched.hash }, cohorts }, null, 1) + '\n');
    const S = cohorts.flatMap(c => c.panel.flatMap(p => p.units.map(u => u.survival)));
    console.log(`panel: ${cohorts.reduce((t, c) => t + c.panel.length, 0)} couples, ${S.length} units, to ${PANEL} on code ${[...codes][0]}; arm A from ${Math.min(...S).toFixed(1)}% to ${Math.max(...S).toFixed(1)}%`);
  }
  if (mode === 'summary') {
    const j = JSON.parse(readFileSync(PANEL, 'utf8')), units = readHspPanel(), o = orders();
    console.log(`STEP 8, THE PANEL (household-hsp-panel.json, built ${j.built}, code ${j.code}; the scan ${j.touched.count} ids, hash ${j.touched.hash}; the orders frozen ${o.built})`);
    for (const c of j.cohorts) {
      console.log(`${c.cohort}: ${c.panel.length} couples taken evenly over the untouched order (${o.order[c.cohort].length} couples); passed over: ${c.passed.length ? c.passed.map(x => `${x.id} (${x.not.join('; ')})`).join(', ') : 'none'}`);
      for (const p of c.panel) {
        const d = byId[p.base].plan.demographics;
        console.log(`  place ${p.place} ${p.couple} ages ${d.currentAgeSelf}/${d.currentAgePart}; its feature: ${p.feature}`);
        for (const u of units.filter(x => x.couple === p.couple)) console.log(`      ${u.id.padEnd(13)} target ${u.target}, arm A ${u.survival.toFixed(1)}% (${u.label}); the first person holds ${(100 * firstShare(u.plan)).toFixed(1)}% of the pots`);
      }
    }
    console.log(`${units.length} units; arm A's pick takes the full lump sum on ${units.filter(u => /lump sum/.test(u.label)).length} of them (by its label)`);
  }
}
