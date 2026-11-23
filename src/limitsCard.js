/*
 * THE LIMITS CARD'S ROWS AND WRITES (src/SolverConfig.jsx SolverLocks; the reviewer on D143's change of default, finding 1). A
 * couple's limits on the riskiest tier: the first person's (`tierCeiling`) and the partner's own (`tierCeilingPart`, from the
 * first edit of a per-person row; until then the first person's, as src/solverSettings.js lockedPlan reads them). The
 * household plan refuses a couple whose two people's limits differ (src/couplesSwitch.js householdShapeOf, 'limits'), so a couple
 * the household route alone opens (D143) is switched off by a per-person edit, and keeps the app's rules, where a couple inside
 * the guard before D143 goes to today's route.
 *   limitsMode(plan)   'single', one person's plan; 'perPerson', a row for each person's wrappers: a couple the solver runs with
 *                      today's route open to it (on, inside the guard before D143, whose limits that differ send it to today's
 *                      route, which takes each person's limits), or a couple whose two people's limits already differ, so the
 *                      difference can be seen and undone; 'household', one row a wrapper for the two of them: a couple the
 *                      household route alone opens (src/couplesSwitch.js coupleSolverOn's `lifted`), whose limits must stay
 *                      alike, and any other couple the solver does not run, as the card was before D5.
 *   limitsRows(plan, mode)   the rows the card shows: [who, w] for each wrapper ('pen', 'isa') the person (who 'self' or
 *                      'part') or the household (who null) holds at a tier.
 *   limitsPatch(plan, mode, who, w, v)   what an edit of a row writes into plan.solver.locks (the card's patchSolver): a
 *                      per-person row its person's (both people's written the first time either moves, the partner's the first
 *                      person's until then); a household's row `tierCeiling`, and `tierCeilingPart` set alike wherever the plan
 *                      carries it, so a couple's two people's limits never part from the household's row.
 *   withLocks(plan, patch)   the plan with the patch merged as the card merges it (LOCKS_FREE beneath the plan's own locks).
 * research/tests/couple-limits-card.test.mjs reads each write back through the guard. Plants (that test only): 'perperson' the card
 * before this fix (per-person rows for every couple the guard runs, one row writing the first person's limit alone for any
 * other); 'partleft' the household's row leaving the partner's own limits as they were; 'inguardhh' a couple the solver runs
 * per person given the household's one row; 'singlepart' a single's row writing a partner's limits it carries (the reviewer's
 * second look, MINOR 2).
 */
import { coupleSolverOn, partLimitsDiffer } from './couplesSwitch.js';

export const PLANT = { rule: '' };
export const LOCKS_FREE = Object.freeze({ pensionBefore: null, tierCeiling: Object.freeze({ pen: null, isa: null }), lumpSum: 'free' });
const RISK = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
const locksOf = plan => (plan && plan.solver && plan.solver.locks) || {};
/* the plan's own riskiest tier in a wrapper (ids pen_ and isa_, as lockedPlan reads them), or null; `who` one person's */
export const ownTier = (plan, prefix, who = null) => {
  const tiers = ((plan && plan.accounts) || []).filter(a => a.id && a.id.startsWith(prefix) && (!who || a.id.endsWith('_' + who)) && RISK.includes(a.risk)).map(a => RISK.indexOf(a.risk));
  return tiers.length ? RISK[Math.min(...tiers)] : null;
};
export function limitsMode(plan) {
  if (!plan || !plan.demographics || plan.demographics.planningMode !== 'couple') return 'single';
  const g = coupleSolverOn(plan);
  if (PLANT.rule === 'perperson') return g.on ? 'perPerson' : 'oneRow';
  if (g.on && !g.lifted) return PLANT.rule === 'inguardhh' ? 'household' : 'perPerson';
  return partLimitsDiffer(plan) ? 'perPerson' : 'household';
}
export const limitsRows = (plan, mode) => (mode === 'perPerson' ? ['self', 'part'] : [null])
  .flatMap(who => [['pen', 'pen_'], ['isa', 'isa_']].filter(([, prefix]) => ownTier(plan, prefix, who)).map(([w]) => [who, w]));
export function limitsPatch(plan, mode, who, w, v) {
  const L = locksOf(plan), tc = { ...LOCKS_FREE.tierCeiling, ...(L.tierCeiling || {}) }, hasPart = !!L.tierCeilingPart && typeof L.tierCeilingPart === 'object';
  if (mode === 'perPerson') {
    const tp = { ...LOCKS_FREE.tierCeiling, ...(hasPart ? L.tierCeilingPart : tc) };
    return who === 'part' ? { tierCeilingPart: { ...tp, [w]: v } } : { tierCeiling: { ...tc, [w]: v }, tierCeilingPart: { ...tp } };
  }
  const alike = (mode === 'household' || (mode === 'single' && PLANT.rule === 'singlepart')) && hasPart && PLANT.rule !== 'partleft';
  return { tierCeiling: { ...tc, [w]: v }, ...(alike ? { tierCeilingPart: { ...LOCKS_FREE.tierCeiling, ...L.tierCeilingPart, [w]: v } } : {}) };
}
export const withLocks = (plan, patch) => ({ ...plan, solver: { ...((plan && plan.solver) || {}), locks: { ...LOCKS_FREE, ...locksOf(plan), ...patch } } });
