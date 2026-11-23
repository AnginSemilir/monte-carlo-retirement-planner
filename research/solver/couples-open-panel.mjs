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
 *                   it and the app solves it on today's two-table route, the younger holding 75%: 'uneven';
 *   RWY75           the first person retired today and the partner still paid in the plan's first year (laterWorking), which
 *                   the household plan refuses too, so today's route, the younger holding 75%: 'uneven'.
 * THE CLASSES BY ROUTE (22 Nov, after the rehearsal's read: its reviewer's BLOCKING 1, reviews/2026-11-22-read-couples-open-
 * rehearsal.md; COUPLES-OPEN.md amendment 1). A class opens its reason on its own route alone: Y, E, S and G on the household
 * route; on today's route, which the app takes where the household plan refuses the plan's shape, RY (RY75, RWY75, the
 * rehearsal's R), RE, RS and RG. Five units added to every couple, each landed as the others:
 *   G12P            12 years apart with the partner's (the younger's) £15,000 DB pension from the state pension age
 *                   (withFeature 'dbpart'), the elder holding 60%: 'gapincome', the household route;
 *   RE100           E100 with the partner's pension one profile safer: 'uneven', today's route;
 *   RS75            S75 with the partner's pension one profile safer: 'uneven', today's route;
 *   RG8             G8 with the partner's pension one profile safer: 'gapincome', today's route;
 *   RG12P           G12P with the partner's pension one profile safer: 'gapincome', today's route.
 * The dress rehearsal read its 44 units before these were added; the five are its addendum (ADDENDUM: land --only, the audit's
 * addendum mode), read on their own by the same rule.
 * One more unit, after the registration's design review (reviews/2026-11-22-couples-open-design.md, BLOCKING 1: G's units
 * carried only a DB pension from the state pension age, and the one measurement of an income before it, rent from now, was
 * today's route's, results-guard.txt):
 *   G12R            12 years apart with £15,000 a year of the first person's rent from plan year 0 (their age now) to the
 *                   plan's end, other taxable income, as the guard test typed it (guard-panel.mjs withIncome 'rent'), the
 *                   library's own holding: 'gapincome', the household route; its rent set after the cohort's ages (unitPlan).
 * The first person is the elder in every library couple, so no unit is handed to the solver on its mirror.
 * Each unit's plan (unitPlan): the variant, then couple-panel.mjs planOf at the couple's cohort and target. Landed so arm A,
 * searched anew at each target, survives 85 +/- 1% on 1,000 paths of seed 7005 (phase4-panel.mjs landTarget, D4's procedure);
 * at its target read by the app's guard (off, for its class's reason) and by the app's route (routeOf: the page's household cut,
 * src/solverCouple.js householdCut at 'pensionsPA', on the plan as the solvers are handed it, shapes-panel.mjs solverPlanOf;
 * 'household' where it takes the plan, 'today' where householdPlanFor refuses the plan's shape, as src/solverClient.js falls
 * back).
 *   node research/solver/couples-open-panel.mjs land <couple>        one couple's eleven units (results/couples-open-land/)
 *   node research/solver/couples-open-panel.mjs combine              couples-open-panel.json from the four landings
 *   node research/solver/couples-open-panel.mjs summary > research/solver/results-couples-open-panel.txt
 *   node research/solver/couples-open-panel.mjs --planted            the checks on planted inputs
 * THE REGISTERED TEST'S PANEL (COUPLES-OPEN.md step 2), the same eleven units on couples no run has used, with REG=1:
 *   node research/solver/couples-open-panel.mjs freeze               the scan and the order, taken once (couples-open-orders.json):
 *                                                                    held-out.mjs touchedAll on the day, with the couples the tests
 *                                                                    take by place, the household line's bases and step 8's couples;
 *                                                                    the library's order (couples-orders.json, D4's) with the touched
 *                                                                    left out, four taken evenly then the rest in order as reserves
 *                                                                    (the younger cohort has none left untouched)
 *   REG=1 node research/solver/couples-open-panel.mjs land <couple>  as above, into results/couples-open-land-reg/
 *   REG=1 node research/solver/couples-open-panel.mjs combine        couples-open-registered-panel.json: the order walked, a couple
 *                                                                    joining if all eleven units landed, off by the guard for their
 *                                                                    reasons and on their routes, passed over (reported) if not, the
 *                                                                    walk stopping at the first couple not yet landed
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { couplesOf, planOf, byIndex, ORDERS_FILE } from './couple-panel.mjs';
import { touchedAll } from './held-out.mjs';
import { householdLineBases, evenly } from './household-hsp-panel.mjs';
import { createHash } from 'node:crypto';
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
  G12P: { cls: 'G', shape: 'gap12', feature: 'dbpart' }, G12R: { cls: 'G', shape: 'gap12', rentNow: true },
  RY75: { cls: 'RY', hold: 0.25, risks: true }, RWY75: { cls: 'RY', hold: 0.25, working: true },
  RE100: { cls: 'RE', hold: 1, risks: true }, RS75: { cls: 'RS', shape: 'even', hold: 0.75, risks: true },
  RG8: { cls: 'RG', shape: 'gap8', feature: 'db', risks: true }, RG12P: { cls: 'RG', shape: 'gap12', feature: 'dbpart', risks: true }
});
/* the classes, each on its own route: the household route's, then today's */
export const CLASSES = Object.freeze(['Y', 'E', 'S', 'G', 'RY', 'RE', 'RS', 'RG']);
export const ROUTE_OF_CLASS = Object.freeze({ Y: 'household', E: 'household', S: 'household', G: 'household', RY: 'today', RE: 'today', RS: 'today', RG: 'today' });
/* the dress rehearsal's addendum: the units added after its read (COUPLES-OPEN.md amendment 1) */
export const ADDENDUM = Object.freeze(['G12P', 'RE100', 'RS75', 'RG8', 'RG12P']);
/* the guard's reason each variant is kept off for (an age gap with other taxable income where the holding is inside the
   band and the elder's ceiling, the holding first otherwise), and the route the app takes for it */
const GAP_REASON = ['G8', 'G12', 'G12P', 'G12R', 'RG8', 'RG12P'];
export const WANT = Object.freeze(Object.fromEntries(Object.entries(VARIANTS).map(([v, V]) => [v, { why: GAP_REASON.includes(v) ? 'gapincome' : 'uneven', route: V.risks || V.working ? 'today' : 'household' }])));
export const REG = process.env.REG === '1', N_REG = 4;
export const ORDERS = join(HERE, 'couples-open-orders.json');
export const PANEL = process.env.COUPLES_OPEN_PANEL || join(HERE, REG ? 'couples-open-registered-panel.json' : 'couples-open-panel.json');
const OUT = process.env.COUPLES_OPEN_LAND_OUT || join(HERE, 'results', REG ? 'couples-open-land-reg' : 'couples-open-land');
/* the couples a run takes: the dress rehearsal's four, or the registered test's frozen order (the library's cohort) */
export const couplesFor = () => (REG ? JSON.parse(readFileSync(ORDERS, 'utf8')).order.map(id => [id, 'lib']) : COUPLES);
/* the walk over the registered order's landings (lands: couple id -> landing record): the first N_REG couples whose every
   unit is taken, those passed over with why, and where it stopped */
export function walkReg(order, lands, n = N_REG) {
  const panel = [], passed = []; let gap = null;
  for (const id of order) {
    if (panel.length === n) break;
    const L = lands[id];
    if (!L) { gap = id; break; }
    const bad = Object.keys(VARIANTS).flatMap(v => unitProblems(v, L.variants[v]).map(p => `${v}: ${p}`));
    if (bad.length) passed.push({ id, not: bad }); else panel.push(id);
  }
  return { panel, passed, gap };
}
export const unitIdOf = (cid, v) => `${cid}-${v}`;
const baseOf = cid => cid.replace(/F$/, '');

/* the risk profiles a wrapper can take, riskiest first (the app's own names) */
export const PROFILES = Object.freeze(['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk']);
/* the partner's pension one profile from the first person's: the next safer, or the next riskier from the safest */
export function otherRisk(plan) {
  const p = JSON.parse(JSON.stringify(plan)), self = p.accounts.find(a => a.id === 'pen_self'), part = p.accounts.find(a => a.id === 'pen_part');
  if (!self || !part) throw new Error('couples-open-panel: a refused shape by risk wants a pension each');
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
/* RWY75's shape, after the cohort's retirement ages are set (couple-panel.mjs planOf sets the younger cohort's at 52): the
   first person retired today and the partner still paid in the plan's first year, working two more years at least, at
   their own salary or WORKING_SALARY where they have none; the household plan refuses such a plan ('a later retiree paid
   or saving in plan year 0'), so the app solves it on today's route */
export const WORKING_SALARY = 30000;
export function laterWorking(plan) {
  const d = { ...plan.demographics }, a = E.num(d.currentAgeSelf, 40), b = E.num(d.currentAgePart, a);
  d.retireAgeSelf = Math.min(E.num(d.retireAgeSelf, a), a);
  d.retireAgePart = Math.max(E.num(d.retireAgePart, b), b + 2);
  if (!(E.num(d.salaryPart, 0) > 0)) d.salaryPart = WORKING_SALARY;
  return E.normalizePlan({ ...plan, demographics: d });
}
/* G12R's rent: £15,000 a year of the first person's, other taxable income, from their age now to the plan's end (as the guard
   test's guard-panel.mjs withIncome 'rent'), set after the cohort's ages so that it starts in plan year 0 */
export const RENT = 15000;
export function withRentNow(plan) {
  const p = JSON.parse(JSON.stringify(plan)), age = E.num(p.demographics.currentAgeSelf, 40);
  p.otherIncomes = [...(p.otherIncomes || []), { id: 'inc_rent_couples_open', name: 'Rent (the guard\'s own units)', owner: 'Myself', startAge: age, endAge: '', amount: RENT, incomeType: 'otherTaxable', notes: '' }];
  return E.normalizePlan(p);
}
/* the unit's plan at a target, as every arm runs it */
export const unitPlan = (h, cohort, v, target) => { const p = planOf({ ...h, plan: variantPlan(h, v) }, cohort, target), V = VARIANTS[v] || {}; return V.working ? laterWorking(p) : V.rentNow ? withRentNow(p) : p; };
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
  for (const v of ['RY75', 'RE100', 'RS75', 'RG8', 'RG12P']) { const p = variantPlan(h, v), r = id => p.accounts.find(a => a.id === id).risk; cases.push([`${v}: the partner's pension one profile safer than the first person's`, `${r('pen_self')} | ${r('pen_part')}`, 'High Risk | Medium/High Risk']); }
  for (const [v, gap] of [['G12P', 12], ['RG12P', 12]]) {
    const p = variantPlan(h, v), d = p.demographics, db = (p.otherIncomes || []).filter(i => i.incomeType === 'otherTaxable' && i.owner === 'Partner');
    cases.push([`${v}: ${gap} years apart, the partner's (the younger's) DB pension of £15,000 a year`, `${E.num(d.currentAgeSelf, 0) - E.num(d.currentAgePart, 0)} ${db.length} ${db.map(i => i.amount).join(',')}`, `${gap} 1 15000`]);
  }
  cases.push(['RE100: the elder holds every pound', firstShare(variantPlan(h, 'RE100')).toFixed(4), '1.0000']);
  for (const cohort of ['lib', 'young']) {
    const g = cohort === 'lib' ? h : byId.S351, p = unitPlan(g, cohort, 'G12R', 30000), d = p.demographics, inc = (p.otherIncomes || []).filter(i => i.incomeType === 'otherTaxable');
    cases.push([`G12R (${cohort}): 12 years apart, one income, the first person's £15,000 a year of rent, other taxable, from their age now to the end`, `${E.num(d.currentAgeSelf, 0) - E.num(d.currentAgePart, 0)} ${inc.length} ${inc.map(i => `${i.owner} ${i.amount} ${i.startAge === E.num(d.currentAgeSelf, 0)} ${i.endAge === '' ? 'end' : i.endAge}`).join(',')}`, '12 1 Myself 15000 true end']);
  }
  { const d = variantPlan(h, 'RS75').demographics; cases.push(['RS75: the two the same age, the first person holding 75%', `${E.num(d.currentAgeSelf, 0) - E.num(d.currentAgePart, 0)} ${firstShare(variantPlan(h, 'RS75')).toFixed(4)}`, '0 0.7500']); }
  { const d = variantPlan(h, 'RG8'); cases.push(['RG8: 8 years apart with the elder\'s DB pension', `${E.num(d.demographics.currentAgeSelf, 0) - E.num(d.demographics.currentAgePart, 0)} ${(d.otherIncomes || []).filter(i => i.incomeType === 'otherTaxable' && i.owner === 'Myself').length}`, '8 1']); }
  cases.push(['each class on one route, the variants\' routes their class\'s', Object.entries(VARIANTS).filter(([v, V]) => WANT[v].route !== ROUTE_OF_CLASS[V.cls]).map(([v]) => v).join(',') || 'all', 'all']);
  for (const cohort of ['lib', 'young']) {
    const g = cohort === 'lib' ? h : byId.S351, d = unitPlan(g, cohort, 'RWY75', 30000).demographics, a = E.num(d.currentAgeSelf, 0), b = E.num(d.currentAgePart, 0);
    cases.push([`RWY75 (${cohort}): the first person retired today, the partner paid and working two more years at least`, `${E.num(d.retireAgeSelf, 0) <= a} ${E.num(d.retireAgePart, 0) >= b + 2} ${E.num(d.salaryPart, 0) > 0}`, 'true true true']);
    cases.push([`RWY75 (${cohort}): refused by the household plan for its later retiree in plan year 0`, routeOf(solverPlanOf(unitPlan(g, cohort, 'RWY75', 30000), 'own').hp).why, 'householdPlanFor: a later retiree paid or saving in plan year 0']);
  }
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
  // the registered order's walk: a couple joins when every unit is taken, is passed over when one is not, and the walk stops at
  // the first couple not yet landed
  { const good = Object.fromEntries(Object.keys(VARIANTS).map(v => [v, { landed: true, guard: { on: false, why: WANT[v].why }, route: { route: WANT[v].route, why: null } }]));
    const land = (bad = {}) => ({ variants: { ...good, ...bad } });
    const lands = { A: land(), B: land({ Y90: { ...good.Y90, landed: false } }), C: land({ G8: { ...good.G8, guard: { on: false, why: 'uneven' } } }), D: land(), E2: land(), F: land() };
    const w = walkReg(['A', 'B', 'C', 'D', 'E2', 'F'], lands, 4);
    cases.push(['the registered walk: B not landed and C off for another reason passed over, A, D, E2, F taken', `${w.panel.join(',')} passed ${w.passed.map(x => x.id).join(',')} gap ${w.gap}`, 'A,D,E2,F passed B,C gap null']);
    const w2 = walkReg(['A', 'G'], { A: land() }, 4);
    cases.push(['the registered walk stops at the first couple not yet landed', `${w2.panel.length} ${w2.gap}`, '1 G']); }
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
    const cid = process.argv[3], CS = couplesFor(), c = CS.find(x => x[0] === cid);
    if (!c) { console.error(`couples-open-panel: land <one of ${CS.map(x => x[0]).join(', ')}> [--only V1,V2]`); process.exit(2); }
    // --only: land those variants alone into the couple's landing, the rest kept as landed, on the same code (the addendum)
    const oi = process.argv.indexOf('--only'), only = oi > 0 ? process.argv[oi + 1].split(',') : null, f0 = join(OUT, `${cid}.json`);
    if (only && only.some(v => !VARIANTS[v])) { console.error(`couples-open-panel: --only ${only.join(',')}: not every one a variant`); process.exit(2); }
    const prev = only ? JSON.parse(readFileSync(f0, 'utf8')) : null;
    if (prev && prev.code !== (codeId() || {}).hash) { console.error(`couples-open-panel: ${cid} was landed on ${prev.code}, not this code: land it whole`); process.exit(2); }
    const cohort = c[1], h = byId[baseOf(cid)], t0 = Date.now(), variants = prev ? { ...prev.variants } : {};
    for (const v of only || Object.keys(VARIANTS)) {
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
    writeFileSync(join(OUT, `${cid}.json`), JSON.stringify({ couple: cid, base: h.id, cohort, name: h.name, libraryTarget: E.num(h.plan.spending.targetSpend, 0), variants, code: id ? id.hash : 'unknown', head, secs: (prev ? prev.secs : 0) + (Date.now() - t0) / 1000, ...(only ? { added: [...((prev && prev.added) || []), { variants: only, head, at: new Date().toISOString() }] } : {}) }, null, 1) + '\n');
    console.log(`${cid} landed in ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'freeze') {
    if (existsSync(ORDERS)) { console.error('couples-open-panel: couples-open-orders.json exists; the order is taken once'); process.exit(2); }
    const o = JSON.parse(readFileSync(ORDERS_FILE, 'utf8')), used = touchedAll();
    for (const id of byIndex()) used.add(id);
    for (const id of householdLineBases()) used.add(id);
    for (const c of JSON.parse(readFileSync(join(HERE, 'household-hsp-panel.json'), 'utf8')).cohorts) for (const q of c.panel) used.add(q.base);
    const ids = [...used].sort(), hash = createHash('sha256').update(ids.join(',')).digest('hex').slice(0, 12);
    const pool = o.lib.filter(id => !used.has(id) && byId[id]), order = evenly(pool, N_REG);
    writeFileSync(ORDERS, JSON.stringify({ built: new Date().toISOString(), from: 'couples-orders.json lib (D4\'s order); the younger cohort has no couple left untouched', touched: { count: ids.length, hash, ids }, untouchedYoung: o.young.filter(id => !used.has(id) && byId[id]).length, order }, null, 1) + '\n');
    console.log(`frozen: the four ${order.slice(0, N_REG).join(', ')}, then ${order.length - N_REG} reserves; touched ${ids.length} ids (hash ${hash})`);
  }
  if (mode === 'combine' && REG) {
    const order = couplesFor().map(x => x[0]), lands = Object.fromEntries(order.filter(id => existsSync(join(OUT, `${id}.json`))).map(id => [id, JSON.parse(readFileSync(join(OUT, `${id}.json`), 'utf8'))]));
    const w = walkReg(order, lands);
    console.log(`the registered panel: ${w.panel.length} couples${w.passed.length ? `; passed over ${w.passed.map(x => `${x.id} (${x.not.join('; ')})`).join('; ')}` : ''}${w.gap ? `; stopped at the first not yet landed, ${w.gap}` : ''}`);
    if (w.panel.length < N_REG) { console.log('panel: INCOMPLETE, land more of the order'); process.exit(1); }
    const codes = new Set(w.panel.map(id => lands[id].code));
    if (codes.size !== 1) { console.log(`panel: the landings are on ${codes.size} codes (${[...codes].join(', ')}): land them again on one`); process.exit(1); }
    const couples = w.panel.map(cid => { const L = lands[cid]; return { couple: cid, base: L.base, cohort: 'lib', units: Object.keys(VARIANTS).map(v => ({ id: unitIdOf(cid, v), variant: v, cls: VARIANTS[v].cls, target: L.variants[v].target, survival: L.variants[v].survival, label: L.variants[v].label, why: L.variants[v].guard.why, share: L.variants[v].guard.share, route: L.variants[v].route.route })) }; });
    writeFileSync(PANEL, JSON.stringify({ built: new Date().toISOString(), code: [...codes][0], passed: w.passed, couples }, null, 1) + '\n');
    const S = couples.flatMap(c => c.units.map(u => u.survival));
    console.log(`panel: ${couples.length} couples, ${S.length} units, to ${PANEL} on code ${[...codes][0]}; arm A from ${Math.min(...S).toFixed(1)}% to ${Math.max(...S).toFixed(1)}%`);
  }
  if (mode === 'combine' && !REG) {
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
    console.log(REG ? `THE GUARD'S OWN UNITS, THE REGISTERED TEST'S PANEL (COUPLES-OPEN.md step 2): couples-open-registered-panel.json, built ${j.built}, code ${j.code}; passed over: ${(j.passed || []).length ? j.passed.map(x => `${x.id} (${x.not.join('; ')})`).join('; ') : 'none'}` : `THE GUARD'S OWN UNITS, THE DRESS REHEARSAL'S PANEL (EXPLORATORY; COUPLES-OPEN.md step 1): couples-open-panel.json, built ${j.built}, code ${j.code}`);
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
