/*
 * THE GUARD'S OWN UNITS, THE DRESS REHEARSAL'S PANEL (COUPLES-OPEN.md step 1; EXPLORATORY). Four couples step 8 used (touched,
 * so not held out: the library's S025 and S273, the younger cohort's S351F and S357F, each retiring at 52), ten units each,
 * every unit kept off the solver by today's guard (src/couplesSwitch.js coupleSolverOn) for its class's reason:
 *   Y75, Y90, Y100  the younger partner holding 75%, 90%, 100% of every wrapper (share-rules-panel.mjs reheldAt: the first
 *                   person, the elder, holding the rest): 'uneven';
 *   E95, E100       the elder holding 95%, 100%: 'uneven';
 *   S75             the two the same age (shapes-panel.mjs 'even'), the first person holding 75%: 'uneven';
 *   G8, G12         8 and 12 years apart (shapes-panel.mjs gap8, gap12) with a £15,000 a year DB pension of the elder's from
 *                   the state pension age (share-rules-panel.mjs withFeature 'db'), the library's own holding (the elder 60%):
 *                   'gapincome';
 *   G8Y75           the same 8 years apart with the DB pension, the younger holding 75%: 'uneven' (the guard reads the
 *                   holdings first);
 *   RY75            the partner's pension one risk profile from the first person's (otherRisk), so the household plan refuses
 *                   it and the app solves it on today's two-table route, the younger holding 75%: 'uneven'.
 * The first person is the elder in every library couple, so no unit is handed to the solver on its mirror.
 * Each unit's plan (unitPlan): the variant, then couple-panel.mjs planOf at the couple's cohort and target. Landed so arm A,
 * searched anew at each target, survives 85 +/- 1% on 1,000 paths of seed 7005 (phase4-panel.mjs landTarget, D4's procedure);
 * at its target read by the app's guard (off, for its class's reason) and by the app's route (routeOf: the page's household cut,
 * src/solverCouple.js householdCut at 'pensionsPA', on the plan as the solvers are handed it, shapes-panel.mjs solverPlanOf;
 * 'household' where it takes the plan, 'today' where householdPlanFor refuses the plan's shape, as src/solverClient.js falls
 * back).
 *   node research/solver/couples-open-panel.mjs land <couple>        one couple's ten units (results/couples-open-land/)
 *   node research/solver/couples-open-panel.mjs combine              couples-open-panel.json from the four landings
 *   node research/solver/couples-open-panel.mjs summary > research/solver/results-couples-open-panel.txt
 *   node research/solver/couples-open-panel.mjs --planted            the checks on planted inputs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { couplesOf, planOf } from './couple-panel.mjs';
import { reheldAt, withFeature } from './share-rules-panel.mjs';
import { shapeOf, solverPlanOf } from './shapes-panel.mjs';
import { armA } from './select-phase4.mjs';
import { appPlan, landTarget, LAND_SEED, LAND_PATHS } from './phase4-panel.mjs';
import { coupleSolverOn } from '../../src/couplesSwitch.js';
import { householdCut } from '../../src/solverCouple.js';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FORM = 'pensionsPA';
/* the dress rehearsal's couples: step 8's, two of each cohort (household-hsp-panel.json's places 0 and 2 of the library, 1 and
   3 of the younger cohort) */
export const COUPLES = Object.freeze([['S025', 'lib'], ['S273', 'lib'], ['S351F', 'young'], ['S357F', 'young']]);
/* each unit's variant: its class, the first person's (the elder's) holding, its shape, its feature, its risks */
export const VARIANTS = Object.freeze({
  Y75: { cls: 'Y', hold: 0.25 }, Y90: { cls: 'Y', hold: 0.1 }, Y100: { cls: 'Y', hold: 0 },
  E95: { cls: 'E', hold: 0.95 }, E100: { cls: 'E', hold: 1 },
  S75: { cls: 'S', shape: 'even', hold: 0.75 },
  G8: { cls: 'G', shape: 'gap8', feature: 'db' }, G12: { cls: 'G', shape: 'gap12', feature: 'db' }, G8Y75: { cls: 'G', shape: 'gap8', feature: 'db', hold: 0.25 },
  RY75: { cls: 'R', hold: 0.25, risks: true }
});
export const CLASSES = Object.freeze(['Y', 'E', 'S', 'G', 'R']);
/* the guard's reason each variant is kept off for, and the route the app takes for it */
export const WANT = Object.freeze(Object.fromEntries(Object.entries(VARIANTS).map(([v, V]) => [v, { why: v === 'G8' || v === 'G12' ? 'gapincome' : 'uneven', route: V.risks ? 'today' : 'household' }])));
export const PANEL = process.env.COUPLES_OPEN_PANEL || join(HERE, 'couples-open-panel.json');
const OUT = process.env.COUPLES_OPEN_LAND_OUT || join(HERE, 'results', 'couples-open-land');
export const unitIdOf = (cid, v) => `${cid}-${v}`;
const baseOf = cid => cid.replace(/F$/, '');

/* the risk profiles a wrapper can take, riskiest first (the app's own names) */
export const PROFILES = Object.freeze(['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk']);
/* the partner's pension one profile from the first person's: the next safer, or the next riskier from the safest */
export function otherRisk(plan) {
  const p = JSON.parse(JSON.stringify(plan)), self = p.accounts.find(a => a.id === 'pen_self'), part = p.accounts.find(a => a.id === 'pen_part');
  if (!self || !part) throw new Error('couples-open-panel: RY75 wants a pension each');
  const i = PROFILES.indexOf(self.risk);
  if (i < 0) throw new Error(`couples-open-panel: the first person's pension at '${self.risk}', not a profile`);
  part.risk = PROFILES[i + 1 < PROFILES.length ? i + 1 : i - 1];
  return E.normalizePlan(p);
}
/* the library couple as the variant holds it, before its cohort and target are set */
export function variantPlan(h, v) {
  const V = VARIANTS[v];
  if (!V) throw new Error(`couples-open-panel: no variant '${v}'`);
  let p = h.plan;
  if (V.shape) p = shapeOf(p, V.shape);
  if (V.feature) p = withFeature(p, V.feature);
  if (V.hold !== undefined) p = reheldAt(p, V.hold);
  if (V.risks) p = otherRisk(p);
  return p;
}
/* the unit's plan at a target, as every arm runs it */
export const unitPlan = (h, cohort, v, target) => planOf({ ...h, plan: variantPlan(h, v) }, cohort, target);
/* the app's guard on the unit's plan */
export function guardOf(plan) { const g = coupleSolverOn(plan); return { on: g.on, why: g.why, share: g.share }; }
/* the app's route for a couple's plan as the solvers are handed it (src/solverClient.js): the household where its cut takes
   the plan, today's two-table route where householdPlanFor refuses the plan's own shape; any other error stands */
export function routeOf(hp) {
  try { householdCut(E, M, hp, FORM); return { route: 'household', why: null }; } catch (e) {
    if (/^householdPlanFor: (?!opts\.|no group)/.test(e.message)) return { route: 'today', why: e.message };
    throw e;
  }
}
/* the first person's share of the pots */
export const firstShare = p => { const s = p.accounts.filter(a => a.id.endsWith('_self')).reduce((t, a) => t + (Number(a.balance) || 0), 0), all = p.accounts.reduce((t, a) => t + (Number(a.balance) || 0), 0); return all > 0 ? s / all : 0.5; };
/* what a landed unit must show to join the panel: landed, its guard off for its class's reason, its route the class's */
export function unitProblems(v, x) {
  const w = WANT[v], out = [];
  if (!x || !x.landed) out.push('not landed');
  else {
    if (x.guard.on) out.push('the guard on');
    else if (x.guard.why !== w.why) out.push(`the guard off for '${x.guard.why}', not '${w.why}'`);
    if (x.route.route !== w.route) out.push(`the route '${x.route.route}', not '${w.route}'${x.route.why ? ` (${x.route.why})` : ''}`);
  }
  return out;
}
/* the panel's units, each with its plan at its landed target */
export function readOpenPanel(file = PANEL) {
  const j = JSON.parse(readFileSync(file, 'utf8')), byId = Object.fromEntries(couplesOf().map(h => [h.id, h]));
  return j.couples.flatMap(c => c.units.map(u => ({ ...u, couple: c.couple, cohort: c.cohort, plan: unitPlan(byId[baseOf(c.couple)], c.cohort, u.variant, u.target) })));
}

function planted() {
  const cases = [], byId = Object.fromEntries(couplesOf().map(h => [h.id, h])), h = byId.S025;
  // each variant's holding, ages, income and risks
  for (const [v, V] of Object.entries(VARIANTS)) if (V.hold !== undefined) cases.push([`${v}: the first person (the elder) holds ${V.hold}`, firstShare(variantPlan(h, v)).toFixed(4), V.hold.toFixed(4)]);
  { const d = variantPlan(h, 'S75').demographics; cases.push(['S75: the two the same age', `${E.num(d.currentAgeSelf, 0) - E.num(d.currentAgePart, 0)}`, '0']); }
  for (const [v, gap] of [['G8', 8], ['G12', 12], ['G8Y75', 8]]) {
    const p = variantPlan(h, v), d = p.demographics, db = (p.otherIncomes || []).filter(i => i.incomeType === 'otherTaxable' && i.owner === 'Myself');
    cases.push([`${v}: ${gap} years apart, the elder's DB pension of £15,000 a year`, `${E.num(d.currentAgeSelf, 0) - E.num(d.currentAgePart, 0)} ${db.length} ${db.map(i => i.amount).join(',')}`, `${gap} 1 15000`]);
  }
  { const p = variantPlan(h, 'RY75'), r = id => p.accounts.find(a => a.id === id).risk; cases.push(['RY75: the partner\'s pension one profile safer than the first person\'s', `${r('pen_self')} | ${r('pen_part')}`, 'High Risk | Medium/High Risk']); }
  { let got;
    try { got = otherRisk({ ...h.plan, accounts: h.plan.accounts.map(a => (a.id.startsWith('pen_') ? { ...a, risk: 'Low Risk' } : a)) }).accounts.find(a => a.id === 'pen_part').risk; } catch (e) { got = e.message; }
    cases.push(['otherRisk from the safest profile takes the next riskier', got, 'Medium/Low Risk']); }
  cases.push(['a variant the panel does not know is refused', (() => { try { variantPlan(h, 'Y60'); return 'no'; } catch { return 'threw'; } })(), 'threw']);
  // the guard's reason and the app's route, on S025 at its library target: each variant as WANT has it
  for (const v of Object.keys(VARIANTS)) {
    const plan = unitPlan(h, 'lib', v, E.num(h.plan.spending.targetSpend, 0)), g = guardOf(plan), r = routeOf(solverPlanOf(plan, 'own').hp);
    cases.push([`${v}: the guard off ('${WANT[v].why}') and the route '${WANT[v].route}'`, `${g.on} ${g.why} ${r.route}`, `false ${WANT[v].why} ${WANT[v].route}`]);
  }
  // the problems a landing must not show, on planted records
  { const ok = { landed: true, guard: { on: false, why: 'uneven' }, route: { route: 'household', why: null } };
    cases.push(['a clean unit: no problem', unitProblems('Y75', ok).join(';'), '']);
    cases.push(['not landed', unitProblems('Y75', { ...ok, landed: false }).join(';'), 'not landed']);
    cases.push(['the guard on', unitProblems('Y75', { ...ok, guard: { on: true, why: null } }).join(';'), 'the guard on']);
    cases.push(['the guard off for another reason', unitProblems('G8', ok).join(';'), 'the guard off for \'uneven\', not \'gapincome\'']);
    cases.push(['the route not the class\'s', unitProblems('RY75', ok).join(';'), 'the route \'household\', not \'today\'']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const okc = got === want; if (!okc) bad++; console.log(`${okc ? 'ok  ' : 'FAIL'} ${n}: ${got}${okc ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const mode = process.argv[2] || 'summary';
  if (mode === '--planted') process.exit(planted() ? 1 : 0);
  const byId = Object.fromEntries(couplesOf().map(h => [h.id, h]));
  if (mode === 'land') {
    const cid = process.argv[3], c = COUPLES.find(x => x[0] === cid);
    if (!c) { console.error(`couples-open-panel: land <${COUPLES.map(x => x[0]).join('|')}>`); process.exit(2); }
    const cohort = c[1], h = byId[baseOf(cid)], t0 = Date.now(), variants = {};
    for (const v of Object.keys(VARIANTS)) {
      let label = null;
      const survivalAt = T => { const a = armA(appPlan(unitPlan(h, cohort, v, T)), { tournament: false }); label = a.label; return E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate; };
      const r = landTarget(survivalAt, E.num(h.plan.spending.targetSpend, 0)), last = r.steps[r.steps.length - 1];
      if (last.target !== r.target) survivalAt(r.target);   // arm A's label at the target taken
      const plan = unitPlan(h, cohort, v, r.target), guard = guardOf(plan), route = routeOf(solverPlanOf(plan, 'own').hp);
      variants[v] = { ...r, label, firstShare: firstShare(variantPlan(h, v)), guard, route };
      const bad = unitProblems(v, variants[v]);
      console.log(`  ${unitIdOf(cid, v).padEnd(12)} target ${r.target} (library ${E.num(h.plan.spending.targetSpend, 0)}) arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : 'NOT LANDED'} in ${r.steps.length} steps; ${label}; the guard ${guard.on ? 'on' : `off (${guard.why})`}; the route ${route.route}${bad.length ? `; NOT TAKEN: ${bad.join('; ')}` : ''}`);
    }
    mkdirSync(OUT, { recursive: true });
    const id = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
    writeFileSync(join(OUT, `${cid}.json`), JSON.stringify({ couple: cid, base: h.id, cohort, name: h.name, libraryTarget: E.num(h.plan.spending.targetSpend, 0), variants, code: id ? id.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }, null, 1) + '\n');
    console.log(`${cid} landed in ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'combine') {
    const codes = new Set(), couples = [], bad = [];
    for (const [cid, cohort] of COUPLES) {
      const f = join(OUT, `${cid}.json`);
      if (!existsSync(f)) { bad.push(`${cid}: not landed`); continue; }
      const L = JSON.parse(readFileSync(f, 'utf8'));
      codes.add(L.code);
      for (const v of Object.keys(VARIANTS)) { const p = unitProblems(v, L.variants[v]); if (p.length) bad.push(`${unitIdOf(cid, v)}: ${p.join('; ')}`); }
      couples.push({ couple: cid, base: L.base, cohort, units: Object.keys(VARIANTS).map(v => ({ id: unitIdOf(cid, v), variant: v, cls: VARIANTS[v].cls, target: L.variants[v].target, survival: L.variants[v].survival, label: L.variants[v].label, why: L.variants[v].guard.why, share: L.variants[v].guard.share, route: L.variants[v].route.route })) });
    }
    if (bad.length) { console.log(`panel: NOT COMPLETE: ${bad.join('; ')}`); process.exit(1); }
    if (codes.size !== 1) { console.log(`panel: the landings are on ${codes.size} codes (${[...codes].join(', ')}): land them again on one`); process.exit(1); }
    writeFileSync(PANEL, JSON.stringify({ built: new Date().toISOString(), code: [...codes][0], couples }, null, 1) + '\n');
    const S = couples.flatMap(c => c.units.map(u => u.survival));
    console.log(`panel: ${couples.length} couples, ${S.length} units, to ${PANEL} on code ${[...codes][0]}; arm A from ${Math.min(...S).toFixed(1)}% to ${Math.max(...S).toFixed(1)}%`);
  }
  if (mode === 'summary') {
    const j = JSON.parse(readFileSync(PANEL, 'utf8')), units = readOpenPanel();
    console.log(`THE GUARD'S OWN UNITS, THE DRESS REHEARSAL'S PANEL (EXPLORATORY; COUPLES-OPEN.md step 1): couples-open-panel.json, built ${j.built}, code ${j.code}`);
    for (const c of j.couples) {
      const d = byId[baseOf(c.couple)].plan.demographics;
      console.log(`${c.couple} (${c.cohort}; as the library holds it, ages ${d.currentAgeSelf}/${d.currentAgePart}):`);
      for (const u of units.filter(x => x.couple === c.couple)) {
        const dd = u.plan.demographics;
        console.log(`    ${u.id.padEnd(12)} class ${u.cls}; target ${u.target}, arm A ${u.survival.toFixed(1)}% (${u.label}); ages ${dd.currentAgeSelf}/${dd.currentAgePart}; the first person holds ${(100 * firstShare(u.plan)).toFixed(0)}%; the guard off (${u.why}); the route ${u.route}`);
      }
    }
    console.log(`${units.length} units: ${CLASSES.map(k => `${k} ${units.filter(u => u.cls === k).length}`).join(', ')}; on the household route ${units.filter(u => u.route === 'household').length}, on today's ${units.filter(u => u.route === 'today').length}`);
  }
}
