/*
 * COUPLES IN THE NEW PLANNER (Part D, D5 and D6; research/solver/PART-D.md): the switch and the guard, in a module with no imports,
 * so the page's first load can ask them without loading the solver.
 *   COUPLES     whether a couple's plan runs the solver in the new planner: on since D99 (14 Nov; the maintainer's D97 (1), by
 *               item 6's stage C's PASS, research/solver/results-couples-share.txt). Off, a couple's plan keeps the app's rules
 *               and the couples card, exactly as before D5: the rollback, one deploy turning it off for everyone (a harness's
 *               build with COUPLES_OFF=1 reads it false, vite.config.js solverHarness).
 *   coupleSolverOn(plan, on)   { on, share, why }: on only with the switch on and the household inside the guard: its first
 *               person holding 40% to 60% of the pots (couple.js's SHARE_BAND, where each person's table is solved on half the
 *               household's spending), or its first person the elder by age and holding more than 60% and at most 90%
 *               (ELDER_UP_TO, ELDER_FIRST), the holdings stage C tested, the elder entered first holding 75% and 90%
 *               (registrations/couples-share.md: what a PASS reaches is by inference from 60% to 75%, and a couple uneven in
 *               some wrappers only). Since D104 (1) a couple whose elder is entered second is read the same way, the elder's
 *               holding whichever partner is entered first, and handed to the solver on its mirror (SWAP_ELDER, swapOf). A
 *               couple whose younger partner holds more, whose elder holds over 90%, or whose two people are the same age and
 *               hold their money outside the band keeps the app's rules until a test of those reads. Since D128 a couple
 *               whose two people are more than DB_GAP_UP_TO (three) years apart in age and who have other taxable income, the
 *               kind a DB pension or an annuity is entered as, keeps the app's rules too, whatever its holdings, until a test
 *               of such couples reads (gapIncomeOf). Since D143 (the registered test of those couples on the household
 *               route, registrations/couples-open.md: Y, E, S and G each OPEN), a couple kept off for any of those reasons is
 *               handed to the solver on the household route alone (`route: 'household'`, `lifted` its reasons, each opened by
 *               HOUSEHOLD_OPEN) where the household plan takes its plan's shape (householdShapeOf), solved elder first as the
 *               test ran it (entered so, the same age, or on its mirror with the swap on); where the household plan refuses its
 *               shape it keeps the app's rules ('shape'). `share` the first person's share of the pots; `why` 'off' (the
 *               switch), 'uneven' (outside the guard), 'ages' (a partner who would pass 120 before the plan ends, which a
 *               person's table cannot run to: horizonFits), 'gapincome' (inside the guard by its holdings, but more than
 *               DB_GAP_UP_TO years apart with other taxable income, whether or not the partner would also pass 120, so the
 *               'ages' card's advice to end the plan earlier holds wherever it shows) or 'shape' (D143: a couple only the
 *               household route's classes would open, whose plan's shape the household plan refuses, `shape` which, before
 *               the age cap's 'ages', ending the plan earlier not bringing it in); with all of HOUSEHOLD_OPEN on and the swap
 *               on, 'uneven' and 'gapincome' are given to no couple; null when on.
 *   elderOf(plan)  'self', 'part' or null (the same age): each person's age today read as the engine reads it (App.jsx
 *               buildContext: a blank age the default, 40 for the first person and the first person's for the partner;
 *               clamped to 0 to 120), held to the engine's own context by research/tests/couple-default.test.mjs.
 * The band is couple.js's SHARE_BAND and the share its shareFor's (each account of each person's, its id ending _self or
 * _part), held equal by research/tests/couple-solve-client.test.mjs; the guard and the switch are pinned to STATE.md's
 * decided-defaults block by research/tests/couple-default.test.mjs.
 */
// a harness's build with COUPLES_OFF=1 reads it false (vite.config.js solverHarness: this line moved stops that build)
export const COUPLES = true;
export const COUPLE_BAND = [0.4, 0.6];
export const ELDER_UP_TO = 0.9;
// the elder entered first, the first person ('Myself'), as every couple stage C tested (D99; the deep review of 14 Nov: the
// joint move weighs both people's estates at the first person's table's weight, 0.02 of that person's own opening wealth, so a
// couple whose elder is entered second and holds most would be solved at an estate weight several times any tested)
export const ELDER_FIRST = true;
// D104 (1): a couple whose elder is entered second handed to the solver elder first, on its mirror (src/coupleOrder.js), and
// its figures shown back as entered (src/solverClient.js); the guard then reads the elder's holding whichever partner is
// entered first, and the age cap still on the plan as entered. On since its change of default (15 Nov), the reviewer on it;
// pinned by research/tests/couple-default.test.mjs and couple-swap.test.mjs. Off (the rollback), a couple whose elder is
// entered second keeps the app's rules, as before
export const SWAP_ELDER = true;
// D128 (18 Nov): a couple more than this many years apart in age (each age today as the engine reads it) who have other taxable
// income keeps the app's rules until a test of such couples reads. Other taxable income is any income the engine taxes and does
// not count as earnings (App.jsx INCOME_TYPES.otherTaxable, "Other taxable income (e.g. DB pensions, annuities)": the kind a DB
// pension is entered as, the app having no kind of its own for one), with an amount above nought. Every couple tested before step
// 5 of the household line was three years apart; on step 5's shapes (research/solver/results-shapes.txt and
// results-shapes-beside.txt, EXPLORATORY, seed 7002) the couples' default ran below the app's rules on three couples held 60/40
// that the guard handed to it, each 8 or 12 years apart with a £15,000 a year DB pension (one person's, entered as other taxable
// income), and above them on the four couples as far apart without one. Infinity lifts it (the rollback)
export const DB_GAP_UP_TO = 3;
// D143 (the registered couples test, registrations/couples-open.md, read once on the household route, Y, E, S and G each
// OPEN; D141): the classes the read opened, each lifting its reason for a couple the household plan takes (householdShapeOf
// not refused): Y the younger partner holding more than 60%, E the elder holding more than ELDER_UP_TO, S the two the same age
// outside COUPLE_BAND, G more than DB_GAP_UP_TO years apart with other taxable income. A couple opens only where every reason it
// has is lifted, on the household route alone (`route: 'household'`, `lifted`: src/solverClient.js fails such a solve where
// the household plan refuses after all, never falling back to today's route, which no test read for these classes); a couple
// whose shape the household plan refuses keeps today's guard (inside it, today's route; outside it, the app's rules, its
// reason 'shape' and `shape` the refusal, so the card says what it is about the plan). All false is the guard before D143 (the
// rollback), as is the plant 'noopen'.
export const HOUSEHOLD_OPEN = Object.freeze({ Y: true, E: true, S: true, G: true });
// step 4's change of default (D145, 23 Nov; research/solver/STEP4-SHAPES.md): the shapes the household plan takes since then,
// so the guard no longer reads them as refused: 'growth' (the two people's contributions to one wrapper growing at different
// rates), 'cashisa' (a cash ISA subscription), 'year0' (one person retired and the other paid or saving in the plan's first
// year). The same three as src/solverSettings.js APP_COUPLE.takeShapes, which the page's cut and assembly pass the household
// plan (this module having no imports; research/tests/couple-shape.test.mjs holds the two alike). All false is the guard before
// step 4 (the rollback), as is the plant 'notake'.
export const HOUSEHOLD_TAKES = Object.freeze({ growth: true, cashisa: true, year0: true, risks: true, limits: true, salaries: true });
// D148 (COUPLES-ANY.md; its registered test, registrations/couples-any.md, read once on seed 7027, every class passing; the
// maintainer's go, under its unlock): the shapes the household plan takes since COUPLES-ANY's change of default, each opened by
// its class's read: 'risks' and 'limits' by R's (L opening only with R: its units carry R's way, so 'limits' counts as taken only
// where 'risks' is), 'salaries' by P's. 'noretire' (C) is the maintainer's: whether it opens by inference from its exactness or
// not at all (COUPLES-ANY.md amendment 2). The plant 'beforeany' reads them as refused, step 4's three alone taken: the guard
// before COUPLES-ANY's change of default (the rollback)
const STEP4_TAKES = Object.freeze(['growth', 'cashisa', 'year0']);
/* whether the guard reads a shape as taken (HOUSEHOLD_TAKES, under the plants 'notake' and 'beforeany'), and whether it takes the
   partner's own limits, which it does only with 'risks' (src/limitsCard.js reads it: a per-person edit then switches no couple
   off) */
const takenShape = w => !!HOUSEHOLD_TAKES[w] && !planted('notake') && (!planted('beforeany') || STEP4_TAKES.includes(w));
export const limitsTaken = () => takenShape('limits') && takenShape('risks');
// research/tests/couple-default.test.mjs only: 'firstnotelder' takes the first person for the elder, whatever the ages;
// 'eldereither' lifts the guard for an elder entered second without the swap, solving the couple in the order entered, as the
// first draft of D99 did; 'noagecap' runs a couple whose partner would pass 120 before the plan ends, as before the age cap;
// 'nogapguard' runs a couple more than DB_GAP_UP_TO years apart with other taxable income, as before D128 (also the page's,
// set by App.jsx from a harness build's PLANNER_PLANT: research/ui-harnesses/solver-planner-ui.cjs check 19); D143's 'noopen'
// lifts no class, the guard before D143 (the rollback's identity; also the page's, as 'nogapguard' is), and 'noshape' opens a
// couple whatever its shape, the household plan's refusals not read.
// research/tests/couple-swap.test.mjs only: 'swapon' takes the swap on and 'swapoff' takes it off, whatever SWAP_ELDER says
// (the rollback's identity); 'capafter' reads the age cap on the mirror, after the swap. research/tests/couple-shape.test.mjs
// only: 'skip<why>' leaves out that refusal's check; couple-shape.test.mjs and couple-default.test.mjs: 'notake' reads the
// shapes step 4 takes as refused, the guard before its change of default (HOUSEHOLD_TAKES all false); 'beforeany' reads the
// shapes COUPLES-ANY's change of default takes as refused, step 4's three alone taken (also the page's, set by App.jsx from a
// harness build's PLANNER_PLANT, as 'noopen' is). Plants combine, comma-separated
export const PLANT = { rule: '' };
const planted = k => PLANT.rule.split(',').includes(k);
const swapOn = () => (SWAP_ELDER || planted('swapon')) && !planted('swapoff');
const ageOf = (v, fallback) => {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean' || (typeof v === 'number' && !Number.isFinite(v))) return fallback;
  const n = Number(v);
  return Math.min(120, Math.max(0, Number.isFinite(n) ? n : fallback));
};
export function elderOf(plan) {
  const d = (plan && plan.demographics) || {}, self = ageOf(d.currentAgeSelf, 40), part = ageOf(d.currentAgePart, self);
  return self > part ? 'self' : part > self ? 'part' : null;
}
/* whether the cut can give both people the couple's whole horizon (the reviewer on D99, second round, MINOR 1): couple.js
   singlePlanFor gives each person the couple's years from their own age, and a single plan's end age stops at 120 (App.jsx
   buildContext), so a partner who would pass 120 before the plan ends would get a shorter table, and the solve's figures fail.
   The ages and end age are read as the engine reads them: a blank age 40 for the first person and the first person's for the
   partner, a blank end age 100, clamped to 1 to 120, an end age at or below the first person's age a year past it. */
export function horizonFits(plan) {
  const d = (plan && plan.demographics) || {}, self = ageOf(d.currentAgeSelf, 40), part = ageOf(d.currentAgePart, self);
  const t0 = d.terminalAge === '' || d.terminalAge === null || d.terminalAge === undefined || typeof d.terminalAge === 'boolean' || !Number.isFinite(Number(d.terminalAge)) ? 100 : Number(d.terminalAge);
  let terminal = Math.min(120, Math.max(1, t0));
  if (terminal <= self) terminal = self + 1;
  return part + (terminal - self) <= 120 + 1e-9;
}
/* whether a couple is handed to the solver on its mirror (D104 (1)): its elder entered second, SWAP_ELDER on */
export const swapOf = plan => swapOn() && elderOf(plan) === 'part' && !planted('eldereither');
/* D128: how many years apart the two people's ages today are, each read as elderOf reads it (the engine's ageSelf0 and agePart0) */
export function ageGapOf(plan) {
  const d = (plan && plan.demographics) || {}, self = ageOf(d.currentAgeSelf, 40), part = ageOf(d.currentAgePart, self);
  return Math.abs(self - part);
}
/* D128: whether the plan has other taxable income, its incomes read as the engine reads them (App.jsx normalizePlan and
   buildContext: an income whose kind the engine does not know is tax-free where its old taxTreatment says so and other taxable
   otherwise; its amount a number above nought, a blank or non-numeric amount nought), whichever person's it is. Its ages are
   not read: an income the plan never pays (one ending before it starts, or starting after the plan ends) counts too, and so
   does any amount above nought, the guard erring towards the app's rules (the reviewer on D128, MINOR 1). Every kind of other
   taxable income counts, not a DB pension alone: rent, an annuity, interest or dividends entered as an income, the engine
   taxing them all alike and the app having no kind of its own for a DB pension */
const INCOME_KINDS = ['earnings', 'otherTaxable', 'taxFree'];
const amountOf = v => { if (v === '' || v === null || v === undefined || typeof v === 'boolean') return 0; const n = Number(v); return Number.isFinite(n) ? n : 0; };
export function otherTaxableOf(plan) {
  const list = plan && Array.isArray(plan.otherIncomes) ? plan.otherIncomes : [];
  return list.some(i => {
    if (!i || typeof i !== 'object' || Array.isArray(i)) return false;
    const kind = INCOME_KINDS.includes(i.incomeType) ? i.incomeType : i.taxTreatment === 'Tax-free' ? 'taxFree' : 'otherTaxable';
    return kind === 'otherTaxable' && amountOf(i.amount) > 0;
  });
}
/* D128: more than DB_GAP_UP_TO years apart and with other taxable income (plant 'nogapguard': never) */
export const gapIncomeOf = plan => !planted('nogapguard') && ageGapOf(plan) > DB_GAP_UP_TO + 1e-9 && otherTaxableOf(plan);
/* D141 (22 Nov): whether the household plan refuses a couple's plan for its shape (src/solver/household.js householdPlanFor,
   on the plan src/solverCouple.js householdPlan makes: the locks applied by src/solverSettings.js lockedPlan), read from the
   plan as entered and erring towards the app's rules: wherever the household plan refuses a couple for its shape this says so,
   and it may say so where the household plan would take the plan (a risk left blank beside one set, or an old name beside its
   new, which the engine reads alike; an end of the plan read a year short). A couple whose shape it refuses keeps today's
   guard (D141). { refused, why }, the why in householdPlanFor's order:
     'risks'     the two people's accounts of one wrapper at different risks, each read as the engine reads it (App.jsx
                 normalizePlan: the ten wrappers always there, a wrapper missing at its default risk, a risk not a tier
                 'High Risk') and then held to the first person's limits as lockedPlan holds both people's where the partner
                 has none of their own that differ ('limits' otherwise; taken as 'salaries' is);
     'growth'    the two people's contributions to one wrapper both above nought and growing at different rates (taken
                 since step 4's change of default, HOUSEHOLD_TAKES: so refused only under the plant 'notake');
     'cashisa'   a cash ISA subscription (taken since step 4, as 'growth');
     'salaries'  both paid, the two salaries growing at different rates (taken since COUPLES-ANY's change of default, D148:
                 HOUSEHOLD_TAKES; refused under the plant 'beforeany');
     'limits'    the partner's own limits differing from the first person's (lockedPlan reads them wrapper by wrapper:
                 src/solverSettings.js partCeilingsDiffer, written again here, this module having no imports; taken with
                 'risks' alone, as 'salaries' is);
     'year0'     one person retired and the other paid or saving in the plan's first year (taken since step 4, as 'growth');
     'noretire'  nobody retiring within the plan (taken where HOUSEHOLD_TAKES names it: C, the maintainer's).
   Each read as the engine reads it (App.jsx buildContext's req, num and the ids' owners). Held by research/tests/couple-shape.
   test.mjs over the library's couples and planted shapes: no refusal of the household plan's missed, the over-reach counted.
   Plants (that test only): 'skip<why>' leaves that check out. */
const LOCK_RISKS = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
// App.jsx defaultAccounts: each wrapper's id, kind and default risk
const WRAPPERS = [['pen', 'Pensions', 'High Risk'], ['isa', 'S&S ISAs', 'High Risk'], ['other', 'Other Investments (e.g. GIA)', 'Low Risk'], ['cash', 'Cash Savings', 'Low Risk'], ['cashIsa', 'Cash ISA', 'Low Risk']];
const numOf = (v, fallback) => { if (v === '' || v === null || v === undefined || typeof v === 'boolean') return fallback; const n = Number(v); return Number.isFinite(n) ? n : fallback; };
export function partLimitsDiffer(plan) {
  const L = plan && plan.solver && plan.solver.locks;
  if (!L || !L.tierCeilingPart) return false;
  const real = c => (!!c && LOCK_RISKS.includes(c) ? c : null), tc = L.tierCeiling || {}, tp = L.tierCeilingPart;
  return ['pen', 'isa'].some(w => real(tp[w]) !== real(tc[w]));
}
export function householdShapeOf(plan) {
  const skip = w => planted(`skip${w}`), refused = why => ({ refused: true, why }), taken = takenShape;
  const raw = (plan && Array.isArray(plan.accounts) ? plan.accounts : []).filter(a => a && typeof a === 'object' && !Array.isArray(a));
  const d = (plan && plan.demographics) || {}, L = (plan && plan.solver && plan.solver.locks) || {};
  // the ten wrappers as the engine normalises them: each id's own account (its first), else the wrapper's default
  const acct = (w, k) => raw.find(a => a.id === `${w}_${k}`) || null;
  const riskOf = (w, def, k) => { const a = acct(w, k), r = a && typeof a.risk === 'string' ? a.risk : def; return LOCK_RISKS.includes(r) ? r : 'High Risk'; };
  const ceil = w => (L.tierCeiling && LOCK_RISKS.includes(L.tierCeiling[w]) ? L.tierCeiling[w] : null);
  const locked = (w, r) => { const c = (w === 'pen' || w === 'isa') ? ceil(w) : null; return c && LOCK_RISKS.indexOf(r) < LOCK_RISKS.indexOf(c) ? c : r; };
  if (!skip('risks') && !taken('risks') && !partLimitsDiffer(plan) && WRAPPERS.some(([w, , def]) => locked(w, riskOf(w, def, 'self')) !== locked(w, riskOf(w, def, 'part')))) return refused('risks');
  const contribOf = (w, k) => { const a = acct(w, k); return a ? Math.max(0, numOf(a.contrib, 0)) : 0; };
  const growthOf = (w, k) => { const a = acct(w, k); return a ? numOf(a.growth, 0) : 0; };
  // a shape the household plan takes since step 4 (HOUSEHOLD_TAKES) is not refused: a wrapper's contributions growing at
  // different rates are taken with 'growth', the cash ISA's with 'cashisa', as householdPlanFor takes them
  const growthTaken = w => (w === 'cashIsa' ? taken('cashisa') : taken('growth'));
  if (!skip('growth') && WRAPPERS.some(([w]) => !growthTaken(w) && contribOf(w, 'self') > 0 && contribOf(w, 'part') > 0 && growthOf(w, 'self') !== growthOf(w, 'part'))) return refused('growth');
  if (!skip('cashisa') && !taken('cashisa') && (contribOf('cashIsa', 'self') > 0 || contribOf('cashIsa', 'part') > 0)) return refused('cashisa');
  const pay = k => Math.max(0, numOf(k === 'self' ? d.salarySelf : d.salaryPart, 0));
  if (!skip('salaries') && !taken('salaries') && pay('self') > 0 && pay('part') > 0 && numOf(d.salaryGrowthSelf, 0) !== numOf(d.salaryGrowthPart, 0)) return refused('salaries');
  // the partner's own limits taken only with 'risks': lockedPlan holds each person's wrapper at their own limit, so the household
  // plan takes such a couple only where it takes the two people's accounts at different risks (COUPLES-ANY's registration, L)
  if (!skip('limits') && !limitsTaken() && partLimitsDiffer(plan)) return refused('limits');
  // the first plan year: the engine's ages today and retirement ages (req: a blank the default, then clamped to 0 to 120)
  const reqAge = (v, fallback) => (v === '' || v === null || v === undefined ? fallback : Math.min(120, Math.max(0, numOf(v, fallback))));
  const age = { self: reqAge(d.currentAgeSelf, 40) }; age.part = reqAge(d.currentAgePart, age.self);
  const retire = { self: reqAge(d.retireAgeSelf, 60), part: reqAge(d.retireAgePart, 60) };
  const working = (k, t) => age[k] + t < retire[k];
  if (!skip('year0') && !taken('year0') && (!working('self', 0) || !working('part', 0))) {
    const saving = k => WRAPPERS.some(([w]) => { const a = acct(w, k); return !!a && (Array.isArray(a.contribByYear) ? numOf(a.contribByYear[0], 0) > 0 : numOf(a.contrib, 0) > 0); });
    if (['self', 'part'].some(k => working(k, 0) && (pay(k) > 0 || saving(k)))) return refused('year0');
  }
  // nobody retiring within the plan, its years read a year short of the engine's (erring towards the app's rules)
  let terminal = Math.min(120, Math.max(1, numOf(d.terminalAge, 100)));
  if (terminal <= age.self) terminal = age.self + 1;
  const T = Math.max(1, Math.round(terminal - age.self)) - 1;
  if (!skip('noretire') && !taken('noretire') && working('self', T) && working('part', T)) return refused('noretire');
  return { refused: false, why: null };
}
export function coupleSolverOn(plan, on = COUPLES) {
  const of = w => ((plan && plan.accounts) || []).filter(a => String(a.id).endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
  const a = of('self'), b = of('part'), share = a + b > 0 ? a / (a + b) : 0.5;
  if (!on) return { on: false, share, why: 'off' };
  const swap = swapOf(plan), capPlan = swap && planted('capafter') ? mirrorAges(plan) : plan;
  const inside = share >= COUPLE_BAND[0] - 1e-9 && share <= COUPLE_BAND[1] + 1e-9;
  const elder = planted('firstnotelder') ? 'self' : elderOf(plan);
  const held = elder === 'self' ? share : elder === 'part' && (swap || !ELDER_FIRST || planted('eldereither')) ? 1 - share : null;
  const elderMore = held !== null && held > COUPLE_BAND[1] + 1e-9 && held <= ELDER_UP_TO + 1e-9;
  // D128: inside the guard by its holdings, but more than DB_GAP_UP_TO years apart with other taxable income
  const holds = inside || elderMore, gapIncome = holds && gapIncomeOf(plan);
  // D143: the reasons the guard before it kept a couple off for, each a class the household route's registered test read (plant
  // 'noopen': none lifted, the guard before D143; 'noshape': the household plan's refusal not read, a refused couple opened as
  // if taken)
  const reasons = [];
  if (!holds) reasons.push(elder === null ? 'S' : held !== null && held > ELDER_UP_TO + 1e-9 ? 'E' : 'Y');
  if (gapIncomeOf(plan)) reasons.push('G');
  // opened only where the household is solved elder first, as the registered test ran it: entered so, the same age, or
  // mirrored with the swap on (with the swap off, an elder entered second outside the band keeps the app's rules)
  const open = reasons.length > 0 && (elder !== 'part' || swap) && !planted('noopen') && reasons.every(c => HOUSEHOLD_OPEN[c]);
  const sh = open ? (planted('noshape') ? { refused: false, why: null } : householdShapeOf(plan)) : null;
  // a couple whose partner would pass 120 before the plan ends keeps the app's rules, whatever its holdings: read on the plan
  // as entered, before any swap (plant 'capafter': on the mirror, whose end age the swap moves past 120). Its reason is 'ages',
  // whose card says that ending the plan earlier brings it within reach, wherever that holds: an opened couple whose shape the
  // household plan refuses is told 'shape' (ending earlier would not bring it in), and under the guard before D143 the gap with
  // other taxable income keeps its own reason (the reviewer on D128, MINOR 2)
  if (!planted('noagecap') && !horizonFits(capPlan)) {
    if (open) return sh.refused ? { on: false, share, why: 'shape', shape: sh.why } : { on: false, share, why: 'ages' };
    return { on: false, share, why: gapIncome ? 'gapincome' : 'ages' };
  }
  if (open) return sh.refused ? { on: false, share, why: 'shape', shape: sh.why, swap: false } : { on: true, share, why: null, swap, route: 'household', lifted: reasons };
  if (!holds) return { on: false, share, why: 'uneven', swap: false };
  // read after the holdings, so a couple the guard kept off before keeps its reason
  if (gapIncome) return { on: false, share, why: 'gapincome', swap: false };
  return { on: true, share, why: null, swap };
}
/* the plant 'capafter' alone: the plan's ages and end age as the mirror has them (src/coupleOrder.js otherOrder moves the end
   age so the plan ends in the same year), the module having no imports */
function mirrorAges(plan) {
  const d = (plan && plan.demographics) || {}, self = ageOf(d.currentAgeSelf, 40), part = ageOf(d.currentAgePart, self);
  const t0 = d.terminalAge === '' || d.terminalAge === null || d.terminalAge === undefined || !Number.isFinite(Number(d.terminalAge)) ? 100 : Number(d.terminalAge);
  return { ...plan, demographics: { ...d, currentAgeSelf: part, currentAgePart: self, terminalAge: Math.min(120, Math.max(1, t0)) - self + part } };
}
