/*
 * A COUPLE ENTERED THE OTHER WAY ROUND (Part D, D7; D100). The app calls the first partner entered "you"; a couple's plan
 * entered the other way is the same household with the two people's places swapped: every field of each person's (the
 * demographics' Self and Part pairs, each account's owner and id, each income's, deposit's and cost's owner, the limits per
 * person) moved to the other, and the plan's end age moved so it ends in the same year, since a plan's horizon is counted
 * from the first person's age (couple.js singlePlanFor). Ages are taken as the engine reads them (a blank age 40 for the
 * first person, the first person's for the partner; a blank end age 100), so a plan with blanks mirrors as the engine sees
 * it. otherOrder twice is the plan itself (research/tests/couple-estate.test.mjs check 6).
 *   import { otherOrder } from './couple-order.mjs'; const q = otherOrder(E, plan);
 */
export const PAIRED = ['currentAge', 'retireAge', 'salary', 'salaryGrowth', 'employment', 'cgtGainsUsed', 'cfBroughtForward', 'mpaaAge', 'statePension'];
const swapOwner = o => (o === 'Myself' ? 'Partner' : o === 'Partner' ? 'Myself' : o);
const swapId = id => (typeof id === 'string' && /_(self|part)$/.test(id) ? id.replace(/_(self|part)$/, (_, w) => (w === 'self' ? '_part' : '_self')) : id);

export function otherOrder(E, plan) {
  const p = JSON.parse(JSON.stringify(plan)), d = p.demographics;
  if (!d || d.planningMode === 'single') throw new Error('otherOrder takes a couple');
  const ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(plan)));
  for (const k of PAIRED) { const a = d[`${k}Self`], b = d[`${k}Part`]; d[`${k}Self`] = b; d[`${k}Part`] = a; }
  // the ages as the engine reads them, swapped; the end age moved so the plan ends in the same year
  d.currentAgeSelf = ctx.agePart0; d.currentAgePart = ctx.ageSelf0;
  d.terminalAge = ctx.terminalAge - ctx.ageSelf0 + ctx.agePart0;
  // each account to the other person, its id's ending with it (the pots stay in their order on the list)
  p.accounts = (p.accounts || []).map(a => ({ ...a, owner: swapOwner(a.owner), id: swapId(a.id) }));
  p.otherIncomes = (p.otherIncomes || []).map(i => ({ ...i, owner: swapOwner(i.owner) }));
  // a deposit without an owner is the first person's (singlePlanFor's reading), so it moves to the partner
  p.oneOffContributions = (p.oneOffContributions || []).map(c => ({ ...c, owner: swapOwner(c.owner || 'Myself') }));
  p.oneOffCosts = (p.oneOffCosts || []).map(c => (c.owner ? { ...c, owner: swapOwner(c.owner) } : c));
  // the limits per person (couple.js personLocks): the first person's ceiling and the partner's swap places
  const L = p.solver && p.solver.locks;
  if (L && 'tierCeilingPart' in L) { const a = L.tierCeiling, b = L.tierCeilingPart; L.tierCeiling = b; L.tierCeilingPart = a; }
  return E.normalizePlan(p);
}
