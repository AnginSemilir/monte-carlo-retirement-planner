/*
 * THE GUARD'S READING OF THE HOUSEHOLD PLAN'S REFUSALS (D141, 22 Nov: the registered couples test reads the household route
 * alone, so a couple whose plan's shape the household plan refuses keeps today's guard; src/couplesSwitch.js householdShapeOf
 * reads that refusal from the plan as entered, the module having no imports, erring towards the app's rules).
 *
 * For each of the library's 210 couples, and each of the shapes below made on it, the page's own refusal (src/solverCouple.js
 * householdCut at 'pensionsPA' on the plan the page hands it: the plan as entered, or its mirror where the elder is entered
 * second, src/coupleOrder.js; a refusal the message src/solverClient.js reads as the plan's shape) against the guard's reading
 * (householdShapeOf on the plan as entered):
 *   1. no refusal missed: wherever householdCut refuses the plan's shape, householdShapeOf says refused, on the couples as
 *      entered and on each entered the other way (its two ages swapped, so the page cuts its mirror, the limits swapped with it:
 *      the reviewer on D143's change of default, finding 3);
 *   2. the over-reach counted, by its reason (a refusal said where householdCut takes the plan: the guard errs towards the
 *      app's rules there), and none on the library's couples as entered;
 *   3. each check shown failing on its plant: with one reason's check skipped ('skip<reason>'), a refusal of that kind is
 *      missed on some shape (CHECKLIST 5).
 * The shapes: as entered; the two ages swapped (the partner the elder, handed to the solver on its mirror); each wrapper's
 * partner's risk one tier from the first person's; two risks a limit holds alike (both above the first person's pension
 * limit, the partner with none of their own) and a limit that does not; the partner's own limits differing, and the same as
 * the first person's; both paying into a wrapper with their contributions growing at different rates, and one paying alone;
 * a cash ISA subscription each way; both paid with salaries growing at different rates; the first person retired today with
 * the partner still working and paid, or saving, or neither, or saving from the second year alone (dated contributions);
 * retirement ages left blank; nobody retiring within the plan.
 *   node research/tests/couple-shape.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { householdCut } from '../../src/solverCouple.js';
import { householdShapeOf, swapOf, PLANT } from '../../src/couplesSwitch.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const RISKS = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple');
const clone = p => structuredClone(p);
const setAcct = (p, id, patch) => { const q = clone(p), a = q.accounts.find(x => x.id === id); if (a) Object.assign(a, patch); else q.accounts.push({ id, owner: id.endsWith('_part') ? 'Partner' : 'Myself', category: '', balance: 0, contrib: 0, growth: 0, risk: '', ...patch }); return q; };
const riskOf = (p, id) => { const a = p.accounts.find(x => x.id === id); return a ? a.risk : null; };
const next = r => RISKS[Math.min(RISKS.length - 1, Math.max(0, RISKS.indexOf(r) + 1))] === r ? RISKS[RISKS.indexOf(r) - 1] : RISKS[RISKS.indexOf(r) + 1];
const demo = (p, patch) => ({ ...clone(p), demographics: { ...p.demographics, ...patch } });
const locks = (p, l) => ({ ...clone(p), solver: { ...(p.solver || {}), locks: { ...((p.solver && p.solver.locks) || {}), ...l } } });
/* the shapes made on one couple's plan: [name, plan] */
function shapesOf(p) {
  const d = p.demographics, a = E.num(d.currentAgeSelf, 40), b = E.num(d.currentAgePart, a), out = [['as entered', p]];
  out.push(['ages swapped', demo(p, { currentAgeSelf: d.currentAgePart, currentAgePart: d.currentAgeSelf })]);
  for (const w of ['pen', 'isa', 'other', 'cash', 'cashIsa']) { const r = riskOf(p, `${w}_self`) || 'High Risk'; out.push([`${w}: the partner's risk one tier off`, setAcct(p, `${w}_part`, { risk: next(RISKS.includes(r) ? r : 'High Risk') })]); }
  { const q = setAcct(setAcct(p, 'pen_self', { risk: 'High Risk' }), 'pen_part', { risk: 'Medium/High Risk' });
    out.push(['two pension risks both above the first person\'s limit, held alike', locks(q, { tierCeiling: { pen: 'Medium Risk' } })]);
    out.push(['two pension risks, a limit below one of them alone', locks(q, { tierCeiling: { pen: 'Medium/High Risk' } })]); }
  out.push(['the partner\'s own limits differing', locks(p, { tierCeiling: { pen: '', isa: '' }, tierCeilingPart: { pen: 'Low Risk', isa: '' } })]);
  out.push(['the partner\'s own limits the same as the first person\'s', locks(p, { tierCeiling: { pen: 'Medium Risk', isa: '' }, tierCeilingPart: { pen: 'Medium Risk', isa: '' } })]);
  out.push(['both paying into ISAs, growing at different rates', setAcct(setAcct(p, 'isa_self', { contrib: 3000, growth: 3 }), 'isa_part', { contrib: 2000, growth: 0 })]);
  out.push(['one paying into an ISA, the other not', setAcct(setAcct(p, 'isa_self', { contrib: 3000, growth: 3 }), 'isa_part', { contrib: 0, growth: 0 })]);
  out.push(['a cash ISA subscription, the first person\'s', setAcct(p, 'cashIsa_self', { contrib: 2000 })]);
  out.push(['a cash ISA subscription, the partner\'s', setAcct(p, 'cashIsa_part', { contrib: 2000 })]);
  out.push(['both paid, salaries growing at different rates', demo(p, { salarySelf: 40000, salaryPart: 30000, salaryGrowthSelf: 2, salaryGrowthPart: 0, retireAgeSelf: a + 3, retireAgePart: b + 3 })]);
  const retiredSelf = q => demo(q, { retireAgeSelf: a, retireAgePart: b + 3 });
  out.push(['the first person retired, the partner working and paid', demo(retiredSelf(p), { salaryPart: 30000 })]);
  out.push(['the first person retired, the partner working and saving', retiredSelf(setAcct(demo(p, { salaryPart: 0 }), 'pen_part', { contrib: 2000 }))]);
  out.push(['the first person retired, the partner working, paid nothing and saving nothing', retiredSelf(demo(setAcct(setAcct(setAcct(setAcct(setAcct(p, 'pen_part', { contrib: 0 }), 'isa_part', { contrib: 0 }), 'other_part', { contrib: 0 }), 'cash_part', { contrib: 0 }), 'cashIsa_part', { contrib: 0 }), { salaryPart: 0 }))]);
  out.push(['the first person retired, the partner saving from the second year alone', retiredSelf(setAcct(demo(p, { salaryPart: 0 }), 'pen_part', { contrib: 0, contribByYear: [0, 2000, 2000] }))]);
  out.push(['the first person retired, the partner saving in the first year by its dated contributions', retiredSelf(setAcct(demo(p, { salaryPart: 0 }), 'pen_part', { contrib: 0, contribByYear: [2000, 2000] }))]);
  out.push(['retirement ages left blank', demo(p, { retireAgeSelf: '', retireAgePart: '' })]);
  out.push(['nobody retiring within the plan', demo(p, { retireAgeSelf: 120, retireAgePart: 120, terminalAge: 100 })]);
  return out;
}
/* the page's refusal: householdCut on the plan it hands the solver; its message, or null where it takes the plan */
function pageRefusal(plan) {
  const handed = swapOf(plan) ? otherOrder(E, plan) : plan;
  try { householdCut(E, M, handed, 'pensionsPA'); return null; } catch (e) {
    if (/^householdPlanFor: (?!opts\.|no group)/.test(e.message)) return e.message;
    throw e;
  }
}
/* the battery: each shape on each couple, the page's refusal against the guard's reading */
function battery(cs) {
  const misses = [], over = {}, refusedBy = {}; let n = 0, real = 0, asEntered = 0, mirrored = 0;
  for (const c of cs) for (const [name, plan] of shapesOf(c.plan)) {
    n++; if (swapOf(plan)) mirrored++;
    const why = pageRefusal(plan), g = householdShapeOf(plan);
    if (why) { real++; refusedBy[why.replace(/ \(.*$/, '')] = (refusedBy[why.replace(/ \(.*$/, '')] || 0) + 1; }
    if (why && !g.refused) misses.push(`${c.id} '${name}': ${why}`);
    if (!why && g.refused) { over[g.why] = (over[g.why] || 0) + 1; if (name === 'as entered') asEntered++; }
  }
  return { n, real, misses, over, refusedBy, asEntered, mirrored };
}

const B = battery(couples);
console.log(`${couples.length} couples, ${B.n} plans: the page refuses ${B.real} for their shape (${Object.entries(B.refusedBy).map(([k, v]) => `${k.replace('householdPlanFor: ', '')} ${v}`).join('; ')}); ${B.mirrored} handed to the solver on their mirror`);
// the same on each couple entered the other way, its two ages swapped, so its every shape reaches the page's cut on the mirror
// (src/coupleOrder.js otherOrder, which swaps each person's fields and limits) where the two differ in age (the reviewer on
// D143's change of default, finding 3: no library couple is entered younger first)
const swapped = couples.map(c => ({ ...c, id: `${c.id} (ages swapped)`, plan: demo(c.plan, { currentAgeSelf: c.plan.demographics.currentAgePart, currentAgePart: c.plan.demographics.currentAgeSelf }) }));
const BM = battery(swapped);
console.log(`the same ${swapped.length} couples entered the other way, ${BM.n} plans: the page refuses ${BM.real} for their shape (${Object.entries(BM.refusedBy).map(([k, v]) => `${k.replace('householdPlanFor: ', '')} ${v}`).join('; ')}); ${BM.mirrored} handed to the solver on their mirror`);
ok('1. no refusal missed: wherever the page\'s household cut refuses a plan\'s shape, the guard reads it refused, on the couples as entered and entered the other way (their mirror)', B.misses.length === 0 && B.real > 0 && BM.misses.length === 0 && BM.real > 0 && BM.mirrored > 0, [...B.misses, ...BM.misses].length ? `${[...B.misses, ...BM.misses].length} missed: ${[...B.misses, ...BM.misses].slice(0, 5).join('; ')}` : `${B.real} refusals as entered and ${BM.real} entered the other way (${BM.mirrored} on the mirror), none missed`);
ok('2. the over-reach counted by its reason, none on the library\'s couples as entered, either way round', B.asEntered === 0 && BM.asEntered === 0, `the guard reads refused where the page takes the plan: ${Object.entries(B.over).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}; entered the other way ${Object.entries(BM.over).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}; of them as entered ${B.asEntered} and ${BM.asEntered}`);
// 3. each check's plant: with it skipped, a refusal of its kind is missed on some shape (40 couples, every fifth)
{ const few = couples.filter((_, i) => i % 5 === 0), res = [];
  for (const r of ['risks', 'growth', 'cashisa', 'salaries', 'limits', 'year0', 'noretire']) {
    PLANT.rule = `skip${r}`;
    const b = battery(few);
    res.push(`${r} ${b.misses.length}`);
    if (!b.misses.length) res.push(`(NONE MISSED under skip${r})`);
  }
  PLANT.rule = '';
  ok('3. each check shown failing on its plant: skipped, a refusal of its kind goes missed', !res.some(x => /NONE/.test(x)), res.join(', ')); }
console.log(fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`);
process.exit(fail ? 1 : 0);
