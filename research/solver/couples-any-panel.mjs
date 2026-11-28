/*
 * EVERY COUPLE ON THE SOLVER, THE DRESS REHEARSAL'S PANEL (COUPLES-ANY.md amendment 2; EXPLORATORY). Each unit a library couple
 * with one of the shapes the household plan now takes, at two holdings: 'own', the library's (the elder holding 60%, inside
 * the guard before D143), and 'Y75', the younger holding 75% (share-rules-panel.mjs reheldAt, before the cohort's ages and
 * target are set). The kinds, each set after the cohort's ages (couple-panel.mjs planOf):
 *   Wg  both working at least three more years, each paying £3,000 a year into their ISA, the first person's growing at 3% a
 *       year and the partner's flat (step 4's 'growth');
 *   Wc  both working at least three more years, each paying £2,000 a year into a cash ISA (step 4's 'cashisa');
 *   W0  the first person retired today, the partner paid and saving in the plan's first year (step 4's 'year0';
 *       couples-open-panel.mjs laterWorking);
 *   R{w}{n}{who}  A's 'risks', COUPLES-ANY.md's class R whole: the pension (w 'p') or the ISA (w 'i') n = 1, 2 or 3 profiles
 *       apart, each way: the first person's the safer (who 's') or the partner's (who 't'), the other's left at the library's;
 *   L   the first person's pension ceiling Medium/High Risk, the partner's own Medium Risk (A's 'limits');
 *   P   both paid and working at least five more years, their salaries growing at 2% and -1% a year (B's 'salaries');
 *   N   both working past the plan's end (C's 'noretire').
 * The couples: COUPLES-OPEN's four for W0, R and L (S025, S273, S351F, S357F); for the kinds where both work, S227 in
 * S025's place (S025 is retired). Each unit landed so arm A, searched anew at each target, survives 85 +/- 1% on 1,000 paths
 * of seed 7005 (phase4-panel.mjs landTarget, D4's procedure), but N: nothing is spent from the pots before the first
 * retirement, so N's units sit at the library's own target, not landed, reported and not read (amendment 2).
 * Checked for every unit before it joins (unitProblems): its class's shape is the household plan's to take (built with its
 * shape named, and refused without it for that shape's reason, but W's, which the app's own shapes take), and the app's guard
 * (src/couplesSwitch.js) keeps R, L, P and N off the household route for their shape and puts W's on it.
 *   node research/solver/couples-any-panel.mjs land <couple>     the couple's units (results/couples-any-land/)
 *   node research/solver/couples-any-panel.mjs combine           couples-any-panel.json from the five landings
 *   node research/solver/couples-any-panel.mjs summary > research/solver/results-couples-any-panel.txt
 *   node research/solver/couples-any-panel.mjs --planted         the checks on planted inputs
 * THE REGISTERED TEST'S PANEL (COUPLES-ANY.md, the test; registrations/couples-any.md), with REG=1: the kinds the rule reads
 * (N left out: both arms survive every path there, so no rule reads it, amendment 2) on couples no run has used:
 *   node research/solver/couples-any-panel.mjs freeze               the scan and the order, taken once (couples-any-orders.json):
 *                                                                    held-out.mjs touchedAll on the day, with the couples the tests
 *                                                                    take by place, the household line's bases and step 8's couples;
 *                                                                    the library's order (couples-orders.json, D4's) with the touched
 *                                                                    left out, four taken evenly then the rest in order as reserves
 *                                                                    (the younger cohort has none left untouched)
 *   REG=1 node research/solver/couples-any-panel.mjs land <couple> [main|work|all]
 *                                                                    its MAIN_KINDS (W0, R's twelve, L), its WORK_KINDS (Wg, Wc, P)
 *                                                                    or both (all, the default where both still work), each at both
 *                                                                    holdings, into results/couples-any-land-reg/
 *   REG=1 node research/solver/couples-any-panel.mjs combine        couples-any-registered-panel.json by walkAny: the order walked
 *                                                                    for four couples whose every MAIN_KINDS unit is taken; then for
 *                                                                    each in turn the WORK_KINDS on itself where both still work
 *                                                                    (bothWorkOf) and every unit is taken, else on the next couple in
 *                                                                    the order, in neither list, where both work and every unit is
 *                                                                    taken (the rehearsal's S227 in S025's place, made a rule); a
 *                                                                    couple passed over reported with why; the walk stopping at the
 *                                                                    first couple it needs that is not yet landed
 *   REG=1 node research/solver/couples-any-panel.mjs summary > research/solver/results-couples-any-registered-panel.txt
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { couplesOf, planOf } from './couple-panel.mjs';
import { reheldAt } from './share-rules-panel.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { solverPlanOf as routedOf } from './audit-phase4.mjs';
import { appPlan as appSolverPlan, prepareForSolve } from '../../src/solverApp.js';
import { armA } from './select-phase4.mjs';
import { appPlan, landTarget, LAND_SEED, LAND_PATHS } from './phase4-panel.mjs';
import { laterWorking, firstShare, PROFILES } from './couples-open-panel.mjs';
import { coupleSolverOn, householdShapeOf } from '../../src/couplesSwitch.js';
import { householdPlan } from '../../src/solverCouple.js';
import { householdPlanFor, TAKE_SHAPES, RISK_SHAPES, SALARY_SHAPES } from '../../src/solver/household.js';
import { codeId } from './code-id.mjs';
import { touchedAll } from './held-out.mjs';
import { byIndex, ORDERS_FILE } from './couple-panel.mjs';
import { householdLineBases, evenly } from './household-hsp-panel.mjs';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FORM = 'pensionsPA';
/* every shape the household plan takes: the app's three (step 4's), A's, B's and C's */
export const TAKES = Object.freeze([...TAKE_SHAPES, ...RISK_SHAPES, ...SALARY_SHAPES]);
/* R's kinds, the pension and the ISA one, two and three profiles apart, each way (COUPLES-ANY.md, the test's class R) */
const R_BASE = Object.freeze(Object.fromEntries(['p', 'i'].flatMap(w => [1, 2, 3].flatMap(n => ['s', 't'].map(who =>
  [`R${w}${n}${who}`, { cls: 'R', shape: 'risks', wrap: w === 'p' ? 'pen' : 'isa', apart: n, safer: who === 's' ? 'self' : 'part' }])))));
/* COUPLES-APART.md (D154 (5), EXPLORATORY), with APART=1: R two profiles further than the registered test's, four and five apart
   on the app's six risk levels (PROFILES and Cash Equivalents), on the dress rehearsal's four couples, each way; the other's
   account the library's, but for the ISA five apart, which the library's ISAs (Medium/High Risk) cannot reach: its other raised
   to High Risk. Its own panel (couples-apart-panel.json) and landing (results/couples-apart-land); unset, every export as before */
export const APART = process.env.APART === '1';
export const LADDER6 = Object.freeze([...PROFILES, 'Cash Equivalents']);
export const APART_KINDS = Object.freeze(Object.fromEntries(['p', 'i'].flatMap(w => [4, 5].flatMap(n => ['s', 't'].map(who =>
  [`R${w}${n}${who}`, { cls: 'R', shape: 'risks', wrap: w === 'p' ? 'pen' : 'isa', apart: n, safer: who === 's' ? 'self' : 'part', ladder: 6, ...(w === 'i' && n === 5 ? { raiseOther: 'High Risk' } : {}) }])))));
export const R_KINDS = APART ? APART_KINDS : R_BASE;
export const KINDS = Object.freeze(APART ? { ...APART_KINDS } : {
  Wg: { cls: 'W', shape: 'growth', work: 3 }, Wc: { cls: 'W', shape: 'cashisa', work: 3 }, W0: { cls: 'W', shape: 'year0' },
  ...R_BASE, L: { cls: 'L', shape: 'limits' },
  P: { cls: 'P', shape: 'salaries', work: 5 }, N: { cls: 'N', shape: 'noretire', work: true }
});
export const HOLDS = Object.freeze(['own', 'Y75']);
export const CLASSES = Object.freeze(APART ? ['R'] : ['W', 'R', 'L', 'P', 'N']);
/* the classes the rule reads (N is reported, amendment 2) */
export const READ_CLASSES = Object.freeze(APART ? ['R'] : ['W', 'R', 'L', 'P']);
export const COUPLES_FIXED = Object.freeze([['S025', 'lib'], ['S273', 'lib'], ['S351F', 'young'], ['S357F', 'young']]);
export const COUPLES_WORK = Object.freeze([['S227', 'lib'], ['S273', 'lib'], ['S351F', 'young'], ['S357F', 'young']]);
export const ALL_COUPLES = Object.freeze([['S025', 'lib'], ['S227', 'lib'], ['S273', 'lib'], ['S351F', 'young'], ['S357F', 'young']]);
export const kindsOf = cid => Object.keys(KINDS).filter(k => (KINDS[k].work ? COUPLES_WORK : COUPLES_FIXED).some(([c]) => c === cid));
export const VARIANTS = Object.freeze(Object.fromEntries(Object.keys(KINDS).flatMap(k => HOLDS.map(h => [`${k}-${h}`, { kind: k, hold: h, ...KINDS[k] }]))));
export const variantsOf = cid => kindsOf(cid).flatMap(k => HOLDS.map(h => `${k}-${h}`));
export const REG = process.env.REG === '1', N_REG = 4;
if (APART && REG) throw new Error('couples-any-panel: APART=1 is the four-and-five test on the rehearsal\'s couples, not the registered panel (REG=1)');
export const ORDERS = join(HERE, 'couples-any-orders.json');
export const PANEL = process.env.COUPLES_ANY_PANEL || join(HERE, APART ? 'couples-apart-panel.json' : REG ? 'couples-any-registered-panel.json' : 'couples-any-panel.json');
const OUT = process.env.COUPLES_ANY_LAND_OUT || join(HERE, 'results', APART ? 'couples-apart-land' : REG ? 'couples-any-land-reg' : 'couples-any-land');
/* the registered test's kinds: those on any couple, and those where both work (N left out: no rule reads it) */
export const MAIN_KINDS = Object.freeze(['W0', ...Object.keys(R_KINDS), 'L']);
export const WORK_KINDS = Object.freeze(['Wg', 'Wc', 'P']);
export const variantsOfKinds = kinds => kinds.flatMap(k => HOLDS.map(h => `${k}-${h}`));
/* both people still working in the library's plan: each before their own retirement age */
export function bothWorkOf(h) {
  const d = h.plan.demographics, a = E.num(d.currentAgeSelf, 40), b = E.num(d.currentAgePart, a);
  return E.num(d.retireAgeSelf, a) > a && E.num(d.retireAgePart, b) > b;
}
/* the registered walk (lands: couple id -> landing record; works: couple id -> both still working): four couples in the order
   whose every MAIN_KINDS unit is taken; then for each in turn the WORK_KINDS on itself where both work and every unit is taken,
   else on the next couple in the order, in neither list, where both work and every unit is taken; those passed over with why
   (for which list), and the first couple it needs that is not yet landed (gap), where it stops */
export function walkAny(order, lands, works, n = N_REG) {
  const probs = (L, kinds) => variantsOfKinds(kinds).flatMap(v => unitProblems(v, L.variants[v]).map(p => `${v}: ${p}`));
  const main = [], work = [], passed = []; let gap = null;
  for (const id of order) {
    if (main.length === n) break;
    if (!lands[id]) { gap = id; break; }
    const bad = probs(lands[id], MAIN_KINDS);
    if (bad.length) passed.push({ id, for: 'main', not: bad }); else main.push(id);
  }
  if (main.length < n) return { main, work, passed, gap };
  const tried = new Set();
  for (const id of main) {
    let got = null;
    for (const c of [id, ...order.filter(x => !main.includes(x))]) {
      if (work.some(x => x.id === c) || tried.has(c) || !works(c)) continue;
      if (!lands[c]) { gap = c; break; }
      tried.add(c);
      const bad = probs(lands[c], WORK_KINDS);
      if (bad.length) { passed.push({ id: c, for: 'work', not: bad }); continue; }
      got = c; break;
    }
    if (!got) break;
    work.push({ for: id, id: got });
  }
  return { main, work, passed, gap };
}
export const unitIdOf = (cid, v) => `${cid}-${v}`;
const baseOf = cid => cid.replace(/F$/, '');
const acct = (p, id) => p.accounts.find(a => a.id === id);
/* both still working at least n more years (their own retirement kept where later), each paid (their own salary, or
   WORK_SALARY where they have none) */
export const WORK_SALARY = 30000;
function working(p, n) {
  const d = p.demographics, a = E.num(d.currentAgeSelf, 40), b = E.num(d.currentAgePart, a);
  if (n === true) {   // past the plan's end: the first person's terminal age, the partner's at the same plan year
    const term = E.num(d.terminalAge, 100);
    d.retireAgeSelf = term + 1; d.retireAgePart = b + (term - a) + 1;
  } else {
    d.retireAgeSelf = Math.max(E.num(d.retireAgeSelf, a), a + n); d.retireAgePart = Math.max(E.num(d.retireAgePart, b), b + n);
  }
  if (!(E.num(d.salarySelf, 0) > 0)) d.salarySelf = WORK_SALARY;
  if (!(E.num(d.salaryPart, 0) > 0)) d.salaryPart = WORK_SALARY;
  return p;
}
/* the unit's plan at a target, as every arm runs it */
export function unitPlan(h, cohort, v, target) {
  const V = VARIANTS[v];
  if (!V) throw new Error(`couples-any-panel: no variant '${v}'`);
  const held = V.hold === 'Y75' ? { ...h, plan: reheldAt(h.plan, 0.25) } : h;
  let p = JSON.parse(JSON.stringify(planOf(held, cohort, target)));
  if (V.kind === 'Wg') { working(p, V.work); for (const [id, g] of [['isa_self', 3], ['isa_part', 0]]) Object.assign(acct(p, id), { contrib: 3000, growth: g }); }
  if (V.kind === 'Wc') { working(p, V.work); for (const id of ['cashIsa_self', 'cashIsa_part']) Object.assign(acct(p, id), { contrib: 2000 }); }
  if (V.kind === 'W0') p = JSON.parse(JSON.stringify(laterWorking(p)));
  if (V.cls === 'R') {   // the safer person's account V.apart profiles safer than the other's, which keeps the library's
    // (APART's kinds on the six levels, the ISA five apart's other raised to High Risk first: COUPLES-APART.md)
    const L = V.ladder === 6 ? LADDER6 : PROFILES, other = acct(p, `${V.wrap}_${V.safer === 'self' ? 'part' : 'self'}`);
    if (V.raiseOther) other.risk = V.raiseOther;
    const i = L.indexOf(other.risk) + V.apart;
    if (!(L.indexOf(other.risk) >= 0 && i < L.length)) throw new Error(`couples-any-panel: ${v}: no profile ${V.apart} safer than ${other.risk}`);
    acct(p, `${V.wrap}_${V.safer}`).risk = L[i];
  }
  if (V.kind === 'L') p.solver = { ...(p.solver || {}), locks: { ...((p.solver && p.solver.locks) || {}), tierCeiling: { pen: 'Medium/High Risk', isa: null }, tierCeilingPart: { pen: 'Medium Risk', isa: null } } };
  if (V.kind === 'P') { working(p, V.work); p.demographics.salaryGrowthSelf = 2; p.demographics.salaryGrowthPart = -1; }
  if (V.kind === 'N') working(p, true);
  return E.normalizePlan(p);
}
/* the plan the solvers are handed: as the household line's audits hand theirs (shapes-panel.mjs solverPlanOf: arm A's policy on
   the plan prepared for the solver, the app's aims), with the plan's own locks kept, as the page hands its solve the plan's own.
   audit-couples.mjs solverPlan hands the solver no locks, which no unit of an earlier household audit set; L's units set the two
   people's limits. On a plan with no locks the same plan as solverPlanOf's, byte for byte (the planted checks) */
export const AIMS = Object.freeze({ cuts: 1, estate: 'standard', raises: 'capped', riskConsent: true });
export function anySolverPlanOf(plan) {
  const a = armA(appPlan(plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  const locks = plan.solver && plan.solver.locks;
  return { a, hp: appSolverPlan(E, prepareForSolve(E, { ...routedOf(plan, aPol), solver: { aims: { ...AIMS }, ...(locks ? { locks } : {}) } })) };
}
/* the household plan's reading of the unit's plan as the solvers are handed it: built with every shape named, and without
   its own (the app's shapes for W, which they take), its refusal's words or null */
const refusalOf = (hp, opts) => { try { householdPlanFor(E, hp, { scale: FORM, ...opts }); return null; } catch (e) { if (/^householdPlanFor: /.test(e.message)) return e.message; throw e; } };
// a partner's own limits that bind leave the two people's risks apart, which the household plan reads first
const SHAPE_WORDS = { growth: /grow at different rates/, cashisa: /cash ISA/, year0: /plan year 0/, risks: /different risks/, limits: /own limits|different risks/, salaries: /salaries grow/, noretire: /nobody retires/ };
export function shapeOfUnit(plan, v) {
  const V = VARIANTS[v], hp = householdPlan(E, anySolverPlanOf(plan).hp);
  const withAll = refusalOf(hp, { takeShapes: TAKES });
  const without = refusalOf(hp, { takeShapes: V.cls === 'W' ? TAKES.filter(s => s !== V.shape) : [...TAKE_SHAPES] });
  return { withAll, without, guard: (g => ({ on: g.on, why: g.why, route: g.route || null }))(coupleSolverOn(plan)), shape: householdShapeOf(plan) };
}
/* what a unit must show to join: landed (but N), taken with every shape, refused without its own for its shape, and the app
   keeping it off the household route for its shape (R, L, P, N: off for 'shape' outside the guard before D143, on inside
   it, where the page's client falls back to today's route for the refused shape) or putting it on it (W, on) */
export function unitProblems(v, x) {
  const V = VARIANTS[v], out = [];
  if (!x) return ['not landed'];
  if (V.cls !== 'N' && !x.landed) out.push('not landed');
  if (x.shape.withAll) out.push(`refused with every shape: ${x.shape.withAll}`);
  if (!x.shape.without) out.push('taken without its own shape');
  else if (!SHAPE_WORDS[V.shape].test(x.shape.without)) out.push(`refused without its shape for another reason: ${x.shape.without}`);
  const g = x.shape.guard;
  // APART's R (COUPLES-APART.md) read on the app as it is since D148: on, on the household route alone outside the guard before
  // D143 ('household') or, inside it, by the page's own cut, which takes 'risks' since D148 (no route named; taken with every
  // shape, above)
  if (V.ladder === 6 ? !(g.on && (g.route === 'household' || !g.route)) : V.cls === 'W' ? !g.on : (g.on ? g.route === 'household' : g.why !== 'shape')) out.push(`the guard ${g.on ? `on${g.route ? ` (${g.route})` : ''}` : `off (${g.why})`}`);
  return out;
}
/* the panel's units, each with its plan at its target */
export function readAnyPanel(file = PANEL) {
  const j = JSON.parse(readFileSync(file, 'utf8')), byId = Object.fromEntries(couplesOf().map(h => [h.id, h]));
  return j.couples.flatMap(c => c.units.map(u => ({ ...u, couple: c.couple, cohort: c.cohort, plan: unitPlan(byId[baseOf(c.couple)], c.cohort, u.variant, u.target) })));
}

/* APART's checks (COUPLES-APART.md): its kinds on the six levels as it says, each joining on S273, and the checks it adds failing on
   planted inputs */
function plantedApart() {
  const byId = Object.fromEntries(couplesOf().map(h => [h.id, h])), cases = [];
  for (const v of Object.keys(VARIANTS).filter(x => x.endsWith('-own'))) {
    const x = { landed: true, shape: shapeOfUnit(unitPlan(byId.S273, 'lib', v, 40000), v) };
    cases.push([`${v} on S273 joins, on the household route`, unitProblems(v, x).length === 0, unitProblems(v, x).join('; ')]);
  }
  { const lib = planOf(byId.S273, 'lib', 40000), other = V => `${V.wrap}_${V.safer === 'self' ? 'part' : 'self'}`;
    const bad = Object.keys(APART_KINDS).filter(k => { const V = KINDS[k], p = unitPlan(byId.S273, 'lib', `${k}-own`, 40000), own = acct(p, `${V.wrap}_${V.safer}`).risk, oth = acct(p, other(V)).risk;
      return LADDER6.indexOf(own) - LADDER6.indexOf(oth) !== V.apart || oth !== (V.raiseOther || acct(lib, other(V)).risk); });
    const ends = ['Rp4s', 'Rp5s', 'Ri4s', 'Ri5s'].map(k => { const V = KINDS[k], p = unitPlan(byId.S273, 'lib', `${k}-own`, 40000); return `${acct(p, `${V.wrap}_self`).risk}/${acct(p, `${V.wrap}_part`).risk}`; }).join(', ');
    cases.push([`each of the ${Object.keys(APART_KINDS).length} kinds its wrapper's two accounts apart by its levels on six, the safer its person's, the other the library's but the ISA five apart's (${ends})`,
      bad.length === 0 && Object.keys(APART_KINDS).length === 8 && ends === 'Low Risk/High Risk, Cash Equivalents/High Risk, Cash Equivalents/Medium/High Risk, Cash Equivalents/High Risk', bad.join(', ')]); }
  { const same = [];
    for (const [cid, co] of [['S273', 'lib'], ['S025', 'lib']]) for (const v of variantsOf(cid)) { const p = unitPlan(byId[cid], co, v, 40000); if (JSON.stringify(anySolverPlanOf(p).hp) !== JSON.stringify(solverPlanOf(p, 'own').hp)) same.push(`${cid} ${v}`); }
    cases.push(['the solvers\' plan on every unit of S273 and S025 solverPlanOf\'s byte for byte', same.length === 0, same.join(', ')]); }
  const base = shapeOfUnit(unitPlan(byId.S273, 'lib', 'Rp4t-own', 40000), 'Rp4t-own'), plain = { landed: true, shape: shapeOfUnit(planOf(byId.S273, 'lib', 40000), 'Rp4t-own') };
  cases.push(['planted: a unit without its shape is refused', unitProblems('Rp4t-own', plain).length > 0, unitProblems('Rp4t-own', plain).join('; ')]);
  const offRoute = [{ on: false, why: 'shape', route: null }, { on: true, why: null, route: 'today' }].map(g => unitProblems('Rp4t-own', { landed: true, shape: { ...base, guard: g } }));
  cases.push(['planted: a unit the guard keeps off, or names another route for, is refused', offRoute.every(p => p.length > 0), offRoute.map(p => p.join('; ')).join(' | ')]);
  cases.push(['planted: an unlanded unit is refused', unitProblems('Rp4t-own', { landed: false, shape: base }).includes('not landed'), '']);
  let bad = 0;
  for (const [name, c, why] of cases) { console.log(`${c ? 'ok  ' : 'FAIL'} ${name}${why ? `  -- ${why}` : ''}`); if (!c) bad++; }
  console.log(bad ? `PLANTED: ${bad} failed` : `PLANTED: ALL ${cases.length} PASS`);
  return bad;
}

function planted() {
  if (APART) return plantedApart();
  const byId = Object.fromEntries(couplesOf().map(h => [h.id, h])), cases = [];
  // each kind's shape on S273 at a target: taken with every shape, refused without its own
  for (const v of Object.keys(VARIANTS).filter(x => x.endsWith('-own'))) {
    const x = { landed: true, shape: shapeOfUnit(unitPlan(byId.S273, 'lib', v, 40000), v) };
    cases.push([`${v} on S273 joins`, unitProblems(v, x).length === 0, unitProblems(v, x).join('; ')]);
  }
  // the solvers' plan: on a plan without locks solverPlanOf's byte for byte (every kind but L, both holdings, on S273 and S025);
  // L's two people's limits kept, each person's pension held at their own ceiling
  { const same = [], plans = [];
    for (const [cid, co] of [['S273', 'lib'], ['S025', 'lib']]) for (const v of variantsOf(cid).filter(x => VARIANTS[x].cls !== 'L')) plans.push([`${cid} ${v}`, unitPlan(byId[cid], co, v, 40000)]);
    for (const [nm, p] of plans) if (JSON.stringify(anySolverPlanOf(p).hp) !== JSON.stringify(solverPlanOf(p, 'own').hp)) same.push(nm);
    cases.push([`the solvers' plan on ${plans.length} plans without locks solverPlanOf's byte for byte`, same.length === 0, same.join(', ')]);
    const hp = anySolverPlanOf(unitPlan(byId.S273, 'lib', 'L-own', 40000)).hp, L = hp.solver.locks, pen = w => hp.accounts.find(a => a.id === `pen_${w}`).risk;
    cases.push(['L\'s limits kept in the solvers\' plan, each pension at its person\'s ceiling', L.tierCeiling.pen === 'Medium/High Risk' && L.tierCeilingPart.pen === 'Medium Risk' && pen('self') === 'Medium/High Risk' && pen('part') === 'Medium Risk', `${JSON.stringify(L)} ${pen('self')} ${pen('part')}`]); }
  // each R kind's two accounts apart as it says, the other the library's
  { const lib = planOf(byId.S273, 'lib', 40000), bad = Object.keys(R_KINDS).filter(k => { const V = KINDS[k], p = unitPlan(byId.S273, 'lib', `${k}-own`, 40000), own = acct(p, `${V.wrap}_${V.safer}`).risk, oth = acct(p, `${V.wrap}_${V.safer === 'self' ? 'part' : 'self'}`).risk;
      return PROFILES.indexOf(own) - PROFILES.indexOf(oth) !== V.apart || oth !== acct(lib, `${V.wrap}_${V.safer === 'self' ? 'part' : 'self'}`).risk; });
    cases.push([`each of R's ${Object.keys(R_KINDS).length} kinds its wrapper's two accounts apart by its profiles, the safer its person's`, bad.length === 0 && Object.keys(R_KINDS).length === 12, bad.join(', ')]); }
  // planted: the kind left out (the library's plan as it is) is refused, and a W unit off the guard
  const plain = { landed: true, shape: shapeOfUnit(planOf(byId.S273, 'lib', 40000), 'Rp2t-own') };
  cases.push(['planted: an R unit without its shape is refused', unitProblems('Rp2t-own', plain).length > 0, unitProblems('Rp2t-own', plain).join('; ')]);
  const off = { landed: true, shape: { ...shapeOfUnit(unitPlan(byId.S273, 'lib', 'Wg-own', 40000), 'Wg-own'), guard: { on: false, why: 'shape' } } };
  cases.push(['planted: a W unit the guard keeps off is refused', unitProblems('Wg-own', off).length > 0, unitProblems('Wg-own', off).join('; ')]);
  cases.push(['planted: an unlanded unit is refused, an unlanded N is not', unitProblems('Rp2t-own', { ...plain, landed: false }).includes('not landed') && !unitProblems('N-own', { landed: false, shape: shapeOfUnit(unitPlan(byId.S273, 'lib', 'N-own', 40000), 'N-own') }).includes('not landed'), '']);
  // the registered walk (walkAny) on planted landings: every unit taken unless broken
  { const WITHOUT = { growth: 'p grow at different rates', cashisa: 'p a cash ISA', year0: 'p plan year 0', risks: 'p different risks', limits: 'p own limits', salaries: 'p salaries grow', noretire: 'p nobody retires' };
    const ok = v => ({ landed: true, shape: { withAll: null, without: WITHOUT[VARIANTS[v].shape], guard: VARIANTS[v].cls === 'W' ? { on: true, why: null, route: 'household' } : { on: false, why: 'shape', route: null } } });
    const land = (kinds, broken) => ({ variants: Object.fromEntries(variantsOfKinds(kinds).map(v => [v, v === broken ? { ...ok(v), landed: false } : ok(v)])) });
    const all = [...MAIN_KINDS, ...WORK_KINDS], show = w => `main ${w.main.join(',')} work ${w.work.map(x => `${x.for}:${x.id}`).join(',')} passed ${w.passed.map(x => `${x.id}/${x.for}`).join(',')} gap ${w.gap}`;
    const W1 = walkAny(['A', 'B', 'C', 'D', 'E', 'F', 'G'], { A: land(MAIN_KINDS), B: land(MAIN_KINDS, 'Rp2s-Y75'), C: land(all), D: land(MAIN_KINDS), E: land(all), F: land(WORK_KINDS), G: land(WORK_KINDS) }, id => 'CEFG'.includes(id));
    cases.push(['the registered walk: B passed over, the work kinds on C and E themselves and on F and G in the retired A\'s and D\'s places', show(W1) === 'main A,C,D,E work A:F,C:C,D:G,E:E passed B/main gap null', show(W1)]);
    const W2 = walkAny(['A', 'B', 'C', 'D', 'E'], { A: land(all, 'P-own'), B: land(all), C: land(all), D: land(all), E: land(WORK_KINDS) }, () => true);
    cases.push(['the registered walk: a working couple whose work unit is not taken gives its place to the next', show(W2) === 'main A,B,C,D work A:E,B:B,C:C,D:D passed A/work gap null', show(W2)]);
    const W3 = walkAny(['A', 'X'], { A: land(MAIN_KINDS) }, () => false), W4 = walkAny(['A', 'B', 'C', 'D', 'Y'], { A: land(MAIN_KINDS), B: land(MAIN_KINDS), C: land(MAIN_KINDS), D: land(MAIN_KINDS) }, id => id === 'Y');
    cases.push(['the registered walk stops at the first couple it needs not yet landed, for the four and for a place', `${show(W3)} | ${show(W4)}` === 'main A work  passed  gap X | main A,B,C,D work  passed  gap Y', `${show(W3)} | ${show(W4)}`]);
    const kinds = `${variantsOfKinds(MAIN_KINDS).length} ${variantsOfKinds(WORK_KINDS).length} ${[...MAIN_KINDS, ...WORK_KINDS].includes('N')}`;
    cases.push(['the registered kinds: N left out, each at both holdings', kinds === '28 6 false', kinds]); }
  let bad = 0;
  for (const [name, c, why] of cases) { console.log(`${c ? 'ok  ' : 'FAIL'} ${name}${why ? `  -- ${why}` : ''}`); if (!c) bad++; }
  console.log(bad ? `PLANTED: ${bad} failed` : `PLANTED: ALL ${cases.length} PASS`);
  return bad;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] || 'summary';
  if (mode === '--planted') process.exit(planted() ? 1 : 0);
  const byId = Object.fromEntries(couplesOf().map(h => [h.id, h]));
  if (mode === 'land') {
    const cid = process.argv[3], c = REG ? (existsSync(ORDERS) && JSON.parse(readFileSync(ORDERS, 'utf8')).order.includes(cid) ? [cid, 'lib'] : null) : ALL_COUPLES.find(x => x[0] === cid);
    if (!c) { console.error(REG ? 'couples-any-panel: REG=1 land <a couple of couples-any-orders.json> [main|work|all]' : `couples-any-panel: land <one of ${ALL_COUPLES.map(x => x[0]).join(', ')}>`); process.exit(2); }
    const cohort = c[1], h = byId[baseOf(cid)], t0 = Date.now(), variants = {};
    const which = REG ? (process.argv[4] || (bothWorkOf(h) ? 'all' : 'main')) : null;
    if (REG && (!['main', 'work', 'all'].includes(which) || (which !== 'main' && !bothWorkOf(h)))) { console.error(`couples-any-panel: ${cid}: ${which} (the work kinds only where both still work)`); process.exit(2); }
    const vs = REG ? variantsOfKinds(which === 'main' ? MAIN_KINDS : which === 'work' ? WORK_KINDS : [...MAIN_KINDS, ...WORK_KINDS]) : variantsOf(cid);
    for (const v of vs) {
      let label = null, r;
      const survivalAt = T => { const a = armA(appPlan(unitPlan(h, cohort, v, T)), { tournament: false }); label = a.label; return E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate; };
      if (VARIANTS[v].cls === 'N') { const T = E.num(h.plan.spending.targetSpend, 0); r = { target: T, survival: survivalAt(T), landed: false, steps: [{ target: T }], reported: true }; }
      else { r = landTarget(survivalAt, E.num(h.plan.spending.targetSpend, 0)); const last = r.steps[r.steps.length - 1]; if (last.target !== r.target) survivalAt(r.target); }
      const plan = unitPlan(h, cohort, v, r.target), shape = shapeOfUnit(plan, v);
      variants[v] = { ...r, label, firstShare: firstShare(plan), shape };
      const bad = unitProblems(v, variants[v]);
      console.log(`  ${unitIdOf(cid, v).padEnd(14)} target ${r.target} arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : r.reported ? 'REPORTED (N)' : 'NOT LANDED'}; ${label}; the guard ${shape.guard.on ? 'on' : `off (${shape.guard.why})`}${bad.length ? `; NOT TAKEN: ${bad.join('; ')}` : ''}`);
    }
    mkdirSync(OUT, { recursive: true });
    const id = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
    writeFileSync(join(OUT, `${cid}.json`), JSON.stringify({ couple: cid, base: h.id, cohort, libraryTarget: E.num(h.plan.spending.targetSpend, 0), ...(REG ? { kinds: which, bothWork: bothWorkOf(h) } : {}), variants, code: id ? id.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }, null, 1) + '\n');
    console.log(`${cid} landed in ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'freeze') {
    if (existsSync(ORDERS)) { console.error('couples-any-panel: couples-any-orders.json exists; the order is taken once'); process.exit(2); }
    const o = JSON.parse(readFileSync(ORDERS_FILE, 'utf8')), used = touchedAll();
    for (const id of byIndex()) used.add(id);
    for (const id of householdLineBases()) used.add(id);
    for (const c of JSON.parse(readFileSync(join(HERE, 'household-hsp-panel.json'), 'utf8')).cohorts) for (const q of c.panel) used.add(q.base);
    const ids = [...used].sort(), hash = createHash('sha256').update(ids.join(',')).digest('hex').slice(0, 12);
    const pool = o.lib.filter(id => !used.has(id) && byId[id]), order = evenly(pool, N_REG);
    writeFileSync(ORDERS, JSON.stringify({ built: new Date().toISOString(), from: 'couples-orders.json lib (D4\'s order); the younger cohort has no couple left untouched', touched: { count: ids.length, hash, ids }, untouched: pool.length, untouchedYoung: o.young.filter(id => !used.has(id) && byId[id]).length, order, bothWork: order.filter(id => bothWorkOf(byId[id])) }, null, 1) + '\n');
    console.log(`frozen: the four ${order.slice(0, N_REG).join(', ')}, then ${order.length - N_REG} reserves (${pool.length} untouched; both still working in ${order.filter(id => bothWorkOf(byId[id])).length}); touched ${ids.length} ids (hash ${hash})`);
  }
  if (mode === 'combine' && REG) {
    const order = JSON.parse(readFileSync(ORDERS, 'utf8')).order, lands = Object.fromEntries(order.filter(id => existsSync(join(OUT, `${id}.json`))).map(id => [id, JSON.parse(readFileSync(join(OUT, `${id}.json`), 'utf8'))]));
    const w = walkAny(order, lands, id => bothWorkOf(byId[id]));
    console.log(`the registered panel: main ${w.main.join(', ')}; work ${w.work.map(x => x.id === x.for ? x.id : `${x.id} in ${x.for}'s place`).join(', ')}${w.passed.length ? `; passed over ${w.passed.map(x => `${x.id} for ${x.for} (${x.not.join('; ')})`).join('; ')}` : ''}${w.gap ? `; stopped at the first not yet landed, ${w.gap}` : ''}`);
    if (w.main.length < N_REG || w.work.length < N_REG) { console.log('panel: INCOMPLETE, land more of the order'); process.exit(1); }
    const ids = [...new Set([...w.main, ...w.work.map(x => x.id)])], codes = new Set(ids.map(id => lands[id].code));
    if (codes.size !== 1) { console.log(`panel: the landings are on ${codes.size} codes (${[...codes].join(', ')}): land them again on one`); process.exit(1); }
    const couples = ids.map(cid => {
      const L = lands[cid], kinds = [...(w.main.includes(cid) ? MAIN_KINDS : []), ...(w.work.some(x => x.id === cid) ? WORK_KINDS : [])];
      return { couple: cid, base: L.base, cohort: 'lib', role: w.main.includes(cid) ? (w.work.some(x => x.id === cid) ? 'both' : 'main') : 'work', units: variantsOfKinds(kinds).map(v => ({ id: unitIdOf(cid, v), variant: v, cls: VARIANTS[v].cls, kind: VARIANTS[v].kind, hold: VARIANTS[v].hold, target: L.variants[v].target, survival: L.variants[v].survival, label: L.variants[v].label, why: L.variants[v].shape.guard.why, route: L.variants[v].shape.guard.route })) };
    });
    writeFileSync(PANEL, JSON.stringify({ built: new Date().toISOString(), code: [...codes][0], main: w.main, work: w.work, passed: w.passed, couples }, null, 1) + '\n');
    const S = couples.flatMap(c => c.units.map(u => u.survival));
    console.log(`panel: ${couples.length} couples, ${couples.reduce((t, c) => t + c.units.length, 0)} units, to ${PANEL} on code ${[...codes][0]}; arm A from ${Math.min(...S).toFixed(1)}% to ${Math.max(...S).toFixed(1)}%`);
  }
  if (mode === 'combine' && !REG) {
    const codes = new Set(), couples = [], bad = [];
    for (const [cid, cohort] of ALL_COUPLES.filter(([c]) => variantsOf(c).length)) {   // every couple has kinds, but under APART S227
      const f = join(OUT, `${cid}.json`);
      if (!existsSync(f)) { bad.push(`${cid}: not landed`); continue; }
      const L = JSON.parse(readFileSync(f, 'utf8'));
      codes.add(L.code);
      for (const v of variantsOf(cid)) { const p = unitProblems(v, L.variants[v]); if (p.length) bad.push(`${unitIdOf(cid, v)}: ${p.join('; ')}`); }
      couples.push({ couple: cid, base: L.base, cohort, units: variantsOf(cid).map(v => ({ id: unitIdOf(cid, v), variant: v, cls: VARIANTS[v].cls, kind: VARIANTS[v].kind, hold: VARIANTS[v].hold, target: L.variants[v].target, survival: L.variants[v].survival, label: L.variants[v].label, why: L.variants[v].shape.guard.why })) });
    }
    if (bad.length) { console.log(`panel: NOT COMPLETE: ${bad.join('; ')}`); process.exit(1); }
    if (codes.size !== 1) { console.log(`panel: the landings are on ${codes.size} codes (${[...codes].join(', ')}): land them again on one`); process.exit(1); }
    writeFileSync(PANEL, JSON.stringify({ built: new Date().toISOString(), code: [...codes][0], couples }, null, 1) + '\n');
    const S = couples.flatMap(c => c.units.filter(u => u.cls !== 'N').map(u => u.survival));
    console.log(`panel: ${couples.length} couples, ${couples.reduce((t, c) => t + c.units.length, 0)} units, to ${PANEL} on code ${[...codes][0]}; arm A on the landed from ${Math.min(...S).toFixed(1)}% to ${Math.max(...S).toFixed(1)}%`);
  }
  if (mode === 'summary') {
    const j = JSON.parse(readFileSync(PANEL, 'utf8')), units = readAnyPanel();
    console.log(REG ? `EVERY COUPLE ON THE SOLVER, THE REGISTERED TEST'S PANEL (COUPLES-ANY.md, the test): couples-any-registered-panel.json, built ${j.built}, code ${j.code}; the four ${j.main.join(', ')}; the kinds where both work on ${j.work.map(x => x.id === x.for ? x.id : `${x.id} (in ${x.for}'s place, ${x.for} retired)`).join(', ')}; passed over: ${j.passed.length ? j.passed.map(x => `${x.id} for ${x.for} (${x.not.join('; ')})`).join('; ') : 'none'}`
      : APART ? `COUPLES FOUR AND FIVE RISK LEVELS APART, THE PANEL (EXPLORATORY; COUPLES-APART.md, D154 (5)): couples-apart-panel.json, built ${j.built}, code ${j.code}`
      : `EVERY COUPLE ON THE SOLVER, THE DRESS REHEARSAL'S PANEL (EXPLORATORY; COUPLES-ANY.md amendment 2): couples-any-panel.json, built ${j.built}, code ${j.code}`);
    for (const c of j.couples) {
      console.log(`${c.couple} (${c.cohort}${c.role ? `, ${c.role}` : ''}):`);
      for (const u of units.filter(x => x.couple === c.couple)) console.log(`    ${u.id.padEnd(14)} class ${u.cls}; target ${u.target}, arm A ${u.survival.toFixed(1)}% (${u.label}); the first person holds ${(100 * firstShare(u.plan)).toFixed(0)}%; the guard ${u.why ? `off (${u.why})` : 'on'}`);
    }
    console.log(`${units.length} units: ${CLASSES.map(k => `${k} ${units.filter(u => u.cls === k).length}`).join(', ')}`);
  }
}
