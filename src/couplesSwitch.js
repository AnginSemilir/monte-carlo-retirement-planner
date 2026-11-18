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
 *               of such couples reads (gapIncomeOf). `share` the first person's share of the pots; `why` 'off' (the
 *               switch), 'uneven' (outside the guard), 'ages' (a partner who would pass 120 before the plan ends, which a
 *               person's table cannot run to: horizonFits) or 'gapincome' (inside the guard by its holdings, but more than
 *               DB_GAP_UP_TO years apart with other taxable income, whether or not the partner would also pass 120, so the
 *               'ages' card's advice to end the plan earlier holds wherever it shows), null when on.
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
// research/tests/couple-default.test.mjs only: 'firstnotelder' takes the first person for the elder, whatever the ages;
// 'eldereither' lifts the guard for an elder entered second without the swap, solving the couple in the order entered, as the
// first draft of D99 did; 'noagecap' runs a couple whose partner would pass 120 before the plan ends, as before the age cap;
// 'nogapguard' runs a couple more than DB_GAP_UP_TO years apart with other taxable income, as before D128 (also the page's,
// set by App.jsx from a harness build's PLANNER_PLANT: research/ui-harnesses/solver-planner-ui.cjs check 19).
// research/tests/couple-swap.test.mjs only: 'swapon' takes the swap on and 'swapoff' takes it off, whatever SWAP_ELDER says
// (the rollback's identity); 'capafter' reads the age cap on the mirror, after the swap
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
export const swapOf = plan => swapOn() && elderOf(plan) === 'part' && PLANT.rule !== 'eldereither';
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
export function coupleSolverOn(plan, on = COUPLES) {
  const of = w => ((plan && plan.accounts) || []).filter(a => String(a.id).endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
  const a = of('self'), b = of('part'), share = a + b > 0 ? a / (a + b) : 0.5;
  if (!on) return { on: false, share, why: 'off' };
  const swap = swapOf(plan), capPlan = swap && PLANT.rule.split(',').includes('capafter') ? mirrorAges(plan) : plan;
  const inside = share >= COUPLE_BAND[0] - 1e-9 && share <= COUPLE_BAND[1] + 1e-9;
  const elder = PLANT.rule === 'firstnotelder' ? 'self' : elderOf(plan);
  const held = elder === 'self' ? share : elder === 'part' && (swap || !ELDER_FIRST || PLANT.rule === 'eldereither') ? 1 - share : null;
  const elderMore = held !== null && held > COUPLE_BAND[1] + 1e-9 && held <= ELDER_UP_TO + 1e-9;
  // D128: inside the guard by its holdings, but more than DB_GAP_UP_TO years apart with other taxable income
  const holds = inside || elderMore, gapIncome = holds && gapIncomeOf(plan);
  // a couple whose partner would pass 120 before the plan ends keeps the app's rules, whatever its holdings: read on the plan
  // as entered, before any swap (plant 'capafter': on the mirror, whose end age the swap moves past 120). Its reason is 'ages',
  // whose card says that ending the plan earlier brings it within reach; where the gap with other taxable income would keep it
  // on the app's rules all the same, the reason is that (the reviewer on D128, MINOR 2), and outside the holdings 'ages' as before
  if (PLANT.rule !== 'noagecap' && !horizonFits(capPlan)) return { on: false, share, why: gapIncome ? 'gapincome' : 'ages' };
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
