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

const HERE = dirname(fileURLToPath(import.meta.url));
export const FORM = 'pensionsPA';
/* every shape the household plan takes: the app's three (step 4's), A's, B's and C's */
export const TAKES = Object.freeze([...TAKE_SHAPES, ...RISK_SHAPES, ...SALARY_SHAPES]);
/* R's kinds, the pension and the ISA one, two and three profiles apart, each way (COUPLES-ANY.md, the test's class R) */
export const R_KINDS = Object.freeze(Object.fromEntries(['p', 'i'].flatMap(w => [1, 2, 3].flatMap(n => ['s', 't'].map(who =>
  [`R${w}${n}${who}`, { cls: 'R', shape: 'risks', wrap: w === 'p' ? 'pen' : 'isa', apart: n, safer: who === 's' ? 'self' : 'part' }])))));
export const KINDS = Object.freeze({
  Wg: { cls: 'W', shape: 'growth', work: 3 }, Wc: { cls: 'W', shape: 'cashisa', work: 3 }, W0: { cls: 'W', shape: 'year0' },
  ...R_KINDS, L: { cls: 'L', shape: 'limits' },
  P: { cls: 'P', shape: 'salaries', work: 5 }, N: { cls: 'N', shape: 'noretire', work: true }
});
export const HOLDS = Object.freeze(['own', 'Y75']);
export const CLASSES = Object.freeze(['W', 'R', 'L', 'P', 'N']);
/* the classes the rule reads (N is reported, amendment 2) */
export const READ_CLASSES = Object.freeze(['W', 'R', 'L', 'P']);
export const COUPLES_FIXED = Object.freeze([['S025', 'lib'], ['S273', 'lib'], ['S351F', 'young'], ['S357F', 'young']]);
export const COUPLES_WORK = Object.freeze([['S227', 'lib'], ['S273', 'lib'], ['S351F', 'young'], ['S357F', 'young']]);
export const ALL_COUPLES = Object.freeze([['S025', 'lib'], ['S227', 'lib'], ['S273', 'lib'], ['S351F', 'young'], ['S357F', 'young']]);
export const kindsOf = cid => Object.keys(KINDS).filter(k => (KINDS[k].work ? COUPLES_WORK : COUPLES_FIXED).some(([c]) => c === cid));
export const VARIANTS = Object.freeze(Object.fromEntries(Object.keys(KINDS).flatMap(k => HOLDS.map(h => [`${k}-${h}`, { kind: k, hold: h, ...KINDS[k] }]))));
export const variantsOf = cid => kindsOf(cid).flatMap(k => HOLDS.map(h => `${k}-${h}`));
export const PANEL = process.env.COUPLES_ANY_PANEL || join(HERE, 'couples-any-panel.json');
const OUT = process.env.COUPLES_ANY_LAND_OUT || join(HERE, 'results', 'couples-any-land');
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
    const other = acct(p, `${V.wrap}_${V.safer === 'self' ? 'part' : 'self'}`), i = PROFILES.indexOf(other.risk) + V.apart;
    if (!(PROFILES.indexOf(other.risk) >= 0 && i < PROFILES.length)) throw new Error(`couples-any-panel: ${v}: no profile ${V.apart} safer than ${other.risk}`);
    acct(p, `${V.wrap}_${V.safer}`).risk = PROFILES[i];
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
  if (V.cls === 'W' ? !g.on : (g.on ? g.route === 'household' : g.why !== 'shape')) out.push(`the guard ${g.on ? `on${g.route ? ` (${g.route})` : ''}` : `off (${g.why})`}`);
  return out;
}
/* the panel's units, each with its plan at its target */
export function readAnyPanel(file = PANEL) {
  const j = JSON.parse(readFileSync(file, 'utf8')), byId = Object.fromEntries(couplesOf().map(h => [h.id, h]));
  return j.couples.flatMap(c => c.units.map(u => ({ ...u, couple: c.couple, cohort: c.cohort, plan: unitPlan(byId[baseOf(c.couple)], c.cohort, u.variant, u.target) })));
}

function planted() {
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
    const cid = process.argv[3], c = ALL_COUPLES.find(x => x[0] === cid);
    if (!c) { console.error(`couples-any-panel: land <one of ${ALL_COUPLES.map(x => x[0]).join(', ')}>`); process.exit(2); }
    const cohort = c[1], h = byId[baseOf(cid)], t0 = Date.now(), variants = {};
    for (const v of variantsOf(cid)) {
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
    writeFileSync(join(OUT, `${cid}.json`), JSON.stringify({ couple: cid, base: h.id, cohort, libraryTarget: E.num(h.plan.spending.targetSpend, 0), variants, code: id ? id.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }, null, 1) + '\n');
    console.log(`${cid} landed in ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'combine') {
    const codes = new Set(), couples = [], bad = [];
    for (const [cid, cohort] of ALL_COUPLES) {
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
    console.log(`EVERY COUPLE ON THE SOLVER, THE DRESS REHEARSAL'S PANEL (EXPLORATORY; COUPLES-ANY.md amendment 2): couples-any-panel.json, built ${j.built}, code ${j.code}`);
    for (const c of j.couples) {
      console.log(`${c.couple} (${c.cohort}):`);
      for (const u of units.filter(x => x.couple === c.couple)) console.log(`    ${u.id.padEnd(14)} class ${u.cls}; target ${u.target}, arm A ${u.survival.toFixed(1)}% (${u.label}); the first person holds ${(100 * firstShare(u.plan)).toFixed(0)}%; the guard ${u.why ? `off (${u.why})` : 'on'}`);
    }
    console.log(`${units.length} units: ${CLASSES.map(k => `${k} ${units.filter(u => u.cls === k).length}`).join(', ')}`);
  }
}
