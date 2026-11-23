/*
 * ONE PLAN FOR THE WHOLE HOUSEHOLD, DESIGN A (research/solver/HOUSEHOLD.md; D113, stopped by D114 and handed to the external
 * review, QUESTIONS-2026-11-17.md; restarted on its plan, D115: research/reviews/2026-11-17/PRESCRIPTIVE-PLAN.md on
 * review/external-2026-10-21 at f1f44727). A research prototype kept outside src/solver: nothing in the app imports it, it
 * moves no solver code stamp, and no couple is solved this way unless a caller asks for it.
 *
 * Today a couple is two single people (couple.js): each person's table is solved on a share of the household's spending,
 * from their own pots and incomes, and each year's joint move is judged by the product of the two tables, each reading its
 * own person's pots. Here the household is one person:
 *   householdPlanFor(E, plan)  a single plan of the whole household: both people's pots added by wrapper; the household's
 *                spending, costs, bands and minimum pot, spending from its first retirement; the later retiree's take-home
 *                (pay less tax, NIC and their contributions' cost, the engine's own sum) as tax-free income and their
 *                contributions as yearly deposits, until they retire; the partner's state pension and incomes in the first
 *                person's ages; every per-person allowance doubled (the personal allowance, the bands and the taper
 *                threshold, the ISA, savings, dividend and capital gains allowances, the tax-free cash cap, the annual
 *                allowance and its floors).
 *   solveHousehold(E, M, plan, opts)  that plan solved as a single's plan is (opts.solveOne: solveForApp at the candidate's
 *                settings), with the couple's exact model to step each year.
 *   chooseHousehold(cp, state, t)  the year's joint move: the household table's top moves where the household stands
 *                (mergedState), each tried at every funding split with both people taking it, stepped one year by the exact
 *                couple model (each person's own tax and access), and valued by the household table where it lands.
 *   householdPolicy(cp), withHousehold(plan, cp), runHouseholdPolicy(cp, zs)  the engine's policy and the exact model's path.
 *   chooseHouseholdSingle(cp, state, t)  the plan's step 1: the household table's one move from the single solver's own
 *                chooser where the household stands (its tie-break above the estate cap on), both people taking it, at the
 *                even split or the best of five (cp.split); householdSinglePolicy, withHouseholdSingle and
 *                runHouseholdSinglePolicy as above.
 * What it approximates (HOUSEHOLD.md section 2): the doubled allowances take the household's taxable income as always
 * splittable evenly; the merged pension reads as open from the first person's access age. This year's tax and access are
 * exact (the rollout's step); only the table's view of later years carries either.
 * HOUSE.plant (research/tests/household.test.mjs), comma-joined: 'singleband' leaves every allowance single; 'nopartsp' drops
 * the partner's state pension; 'notakehome' drops the later retiree's take-home; 'nopartpots' leaves the partner's pots out
 * of the merged position; the single chooser's (below): 'partnersecond', 'tiezero', 'notiebreak'; the decomposition's
 * (SINGLE_GROUPS, below): 'singlenone', 'singlecgt'; the remedy's (SCALED, below): 'scaleall', 'scalecgt', 'splitstart'.
 */
import { rankFor, tiePick, layerOf, ratesAt, SPLITS } from './couple.js';
import { NODES, WEIGHTS, chooseAction } from './solve.js';
import { foldedVol, TIER_ORDER } from './fast.js';
import { vecOf, readValues } from './grid.js';
import { profileOf as M_profileOf } from './model.js';

export const HOUSE = { plant: '' };
const planted = (k) => HOUSE.plant !== '' && HOUSE.plant.split(',').includes(k);

/* The allowances a person has, doubled for the household (taxParams' config names; App.jsx DEFAULT_CONFIG's values where the
   plan sets none). The bands are income levels (the higher rate from basicBandLimit with the full allowance), so doubling
   each doubles every band's width; the taper's threshold and its floor go with them. */
export const DOUBLED = ['personalAllowance', 'paTaperThreshold', 'basicBandLimit', 'higherBandLimit', 'scotStarterLimit', 'scotBasicLimit',
  'scotIntermediateLimit', 'scotHigherLimit', 'scotAdvancedLimit', 'nicPrimaryThreshold', 'nicUpperEarningsLimit', 'pclsMaxCap', 'isaAnnualAllowance',
  'cashIsaAllowance', 'cashIsaAllowanceUnder65', 'pensionAnnualAllowance', 'pensionNoEarningsLimit', 'mpaaLimit', 'pensionTaperThreshold',
  'pensionTaperFloor', 'cgtAnnualExempt', 'savingsAllowanceBasic', 'savingsAllowanceHigher', 'startingRateSavingsBand', 'dividendAllowance'];
/* THE DECOMPOSITION'S GROUPS (D129 (1); HOUSEHOLD-DECOMP.md; EXPLORATORY): what householdPlanFor's opts.single leaves at one
   person's, the rest of DOUBLED doubled as before. 'bands': the income tax's rate bands and the thresholds that move them,
   UK and Scottish (and with them the capital gains band, which the engine reads off the default basic band and the plan's
   allowance: solveHousehold then solves outside twoBands, so the household's band for gains is one person's too); 'cap': the
   tax-free cash cap. Unset, or empty, the household plan is design A's byte for byte. Plants: 'singlenone' (the option
   read as empty: every allowance doubled), 'singlecgt' (the bands single, the solve still inside twoBands). */
export const SINGLE_GROUPS = Object.freeze({
  bands: Object.freeze(['personalAllowance', 'paTaperThreshold', 'basicBandLimit', 'higherBandLimit', 'scotStarterLimit', 'scotBasicLimit',
    'scotIntermediateLimit', 'scotHigherLimit', 'scotAdvancedLimit']),
  cap: Object.freeze(['pclsMaxCap'])
});
/* the DOUBLED entries a list of groups leaves single; an unknown group, or a list that is not one, refused */
export function singleKeys(single = []) {
  if (!Array.isArray(single)) throw new Error(`householdPlanFor: opts.single must be a list of groups (${Object.keys(SINGLE_GROUPS).join(', ')})`);
  const keys = new Set();
  if (planted('singlenone')) return keys;
  for (const g of single) {
    const ks = SINGLE_GROUPS[g];
    if (!ks) throw new Error(`householdPlanFor: no group '${g}' to leave single (want ${Object.keys(SINGLE_GROUPS).join(', ')})`);
    for (const k of ks) keys.add(k);
  }
  return keys;
}
/* whether a list of groups leaves the bands single: fn is then run as it is, else inside twoBands */
export const bandsSingle = (single = []) => singleKeys(single).has('basicBandLimit');
export const inBands = (E, single, fn) => (bandsSingle(single) && !planted('singlecgt') ? fn() : twoBands(E, fn));

/* THE REMEDY'S PART 1 (HOUSEHOLD-REMEDY.md; D129 (1), (3); EXPLORATORY): the allowances priced at the pensions' split,
   householdPlanFor's opts.scale 'pensions' ('bands', its amendment 1: the bands alone, the cap doubled). s the larger person's share of the two pensions at the plan's start (0.5 where
   neither holds one), k = 1 / s: the personal allowance doubled; each band limit L in SCALED (an income level: the taper's
   threshold, the UK and Scottish limits) 2 x PA + k x (L - PA), so each band's width above the allowance is k times one
   person's; the tax-free cash cap k times one person's; every other allowance doubled. With the bands scaled the table is
   solved inside a band for gains of k times one person's (bandsAt). k = 1 / s is exact when the two draw their pensions in
   proportion; k = 2, doubling, is its even case. Plants: 'scaleall' (the allowance scaled too, k x PA), 'scalecgt' (the
   bands scaled, the solve inside twoBands). */
/* the remedy's forms: 'pensions' (HSP), 'bands' (HSPB, its amendment 1) and 'pensionsPA' (HSPA, D130 (2): the personal
   allowance k times one person's as well, each SCALED limit then k x PA + k x (L - PA) = k x L); 'pensionsPAown'
   (research/solver/PRICING-FIX.md, candidate A; D143: each person's state pension and other income against their own
   allowance): 'pensionsPA' with the partner's fixed taxable income taxed alone at one person's rules and handed to the
   household person net, tax-free (householdPlanFor), off unless named */
export const SCALES = Object.freeze(['pensions', 'bands', 'pensionsPA', 'pensionsPAown']);
const PA_K = Object.freeze(['pensionsPA', 'pensionsPAown']);
export const SCALED = Object.freeze(['paTaperThreshold', 'basicBandLimit', 'higherBandLimit', 'scotStarterLimit', 'scotBasicLimit', 'scotIntermediateLimit',
  'scotHigherLimit', 'scotAdvancedLimit']);
export function pensionsSplit(E, plan) {
  const pen = part => (plan.accounts || []).filter(a => a.category === 'Pensions' && (a.owner === 'Partner') === part).reduce((t, a) => t + Math.max(0, E.num(a.balance, 0)), 0);
  const self = pen(false), partner = pen(true), s = self + partner > 0 ? Math.max(self, partner) / (self + partner) : 0.5;
  return { self, partner, s, k: 1 / s };
}
/* fn run with the engine's default basic band limit at 2 x PA + k x (limit - PA), so a household plan whose allowance is
   2 x PA has a band for gains of k times one person's; put back whatever fn does. k = 2 is twoBands. */
export function bandsAt(E, k, paOne, fn, paK = false) {
  if (TWO_BANDS) throw new Error('bandsAt: called while twoBands or bandsAt is running');
  const old = E.DEFAULT_CONFIG.basicBandLimit;
  TWO_BANDS = true;
  // the household's allowance two people's, or k times one person's (paK, 'pensionsPA'): the band for gains k times one
  // person's either way
  E.DEFAULT_CONFIG.basicBandLimit = (paK ? k * paOne : 2 * paOne) + k * (old - paOne);
  try { return fn(); } finally { E.DEFAULT_CONFIG.basicBandLimit = old; TWO_BANDS = false; }
}
/* the household plan's options as a solve or a context needs them: the band for gains each asks for */
export const householdBands = (E, hopts, fn) => (hopts && hopts.scale && !planted('scalecgt') ? bandsAt(E, hopts.scale.k, hopts.scale.paOne, fn, !!hopts.scale.paK) : inBands(E, (hopts && hopts.single) || [], fn));
const LABEL_KEYS = { Pensions: 'pen', 'S&S ISAs': 'isa', 'Other Investments (e.g. GIA)': 'other', 'Cash Savings': 'cash', 'Cash ISA': 'cashIsa' };

/*
 * THE HOUSEHOLD'S PLAN as one person's. The first person's ages throughout: the partner's age a is the first person's a +
 * gap. The synthetic person works while nobody in the household has retired (the engine spends from the first retirement,
 * App.jsx stepYear's anyRetired), on both people's pay and contributions; from then on the later retiree's pay reaches the
 * household as the engine's own take-home (pay less tax and NIC, less the net cost of their pension contribution, less their
 * other contributions: App.jsx stepYear's workingTakeHome), as tax-free income, and their contributions land as External
 * deposits (a deposit typed into a pension lands as typed, M3) until they retire. Refused, not guessed: a couple whose two
 * people's accounts of one wrapper carry different risks or contribution growth, whose two salaries grow at different
 * rates, a cash ISA subscription, a salaried later retiree in plan year 0 (the engine pro-rates that year), a person whose
 * limits differ from the household's (tierCeilingPart).
 */
export function householdPlanFor(E, plan, opts = {}) {
  const d = plan.demographics;
  if (d.planningMode !== 'couple') throw new Error('householdPlanFor: a couple\'s plan');
  const ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(plan)));
  const own = { self: ctx.owners.find(o => o.key === 'self'), part: ctx.owners.find(o => o.key === 'part') };
  const ageA = ctx.ageSelf0, ageB = ctx.agePart0, gap = ageA - ageB, T = ctx.totalYears;
  const ageOf = (k, t) => (k === 'self' ? ageA : ageB) + t, working = (k, t) => ageOf(k, t) < own[k].retireAge;
  // the first plan year in which anyone has retired: the synthetic person retires then
  let tR = 0;
  while (tR <= T && working('self', tR) && working('part', tR)) tR++;
  if (tR > T) throw new Error('householdPlanFor: nobody retires within the plan');
  // the accounts, added by wrapper; each wrapper's risk and contribution growth must be the two people's same
  const byKey = {};
  for (const a of plan.accounts) {
    const key = LABEL_KEYS[a.category];
    if (!key) throw new Error(`householdPlanFor: an account of category '${a.category}'`);
    if (a.owner === 'Partner' && planted('nopartpots')) continue;
    const g = byKey[key] || (byKey[key] = { ...a, id: `${key}_self`, owner: 'Myself', balance: 0, contrib: 0 });
    if ((g.risk || '') !== (a.risk || '')) throw new Error(`householdPlanFor: the two people's ${a.category} hold different risks (${g.risk}, ${a.risk})`);
    if (E.num(g.growth, 0) !== E.num(a.growth, 0) && E.num(a.contrib, 0) > 0 && E.num(g.contrib, 0) > 0) throw new Error(`householdPlanFor: the two people's ${a.category} contributions grow at different rates`);
    g.balance += E.num(a.balance, 0);
    // contributions while both work: both people's (each stops at their own retirement in the engine; after the first
    // retirement the later retiree's are the deposits below)
    if (E.num(a.contrib, 0) > 0) { g.contrib = E.num(g.contrib, 0) + E.num(a.contrib, 0); g.growth = a.growth; }
  }
  if (own.self.cashIsaContrib > 0 || own.part.cashIsaContrib > 0) throw new Error('householdPlanFor: a cash ISA subscription');
  if (E.num(d.salaryGrowthSelf, 0) !== E.num(d.salaryGrowthPart, 0) && E.num(d.salarySelf, 0) > 0 && E.num(d.salaryPart, 0) > 0) throw new Error('householdPlanFor: the two salaries grow at different rates');
  const L = plan.solver && plan.solver.locks;
  if (L && L.tierCeilingPart && Object.keys(L.tierCeilingPart).length) throw new Error('householdPlanFor: the partner\'s own limits (tierCeilingPart)');
  // the later retiree's take-home and contributions, plan year by plan year, from the first retirement until they retire
  const P = ctx.P, incomes = [], deposits = [];
  for (let t = tR; t <= T; t++) for (const k of ['self', 'part']) {
    if (!working(k, t)) continue;
    const o = own[k], pay = E.salaryAtYear(o, t), accts = ctx.accounts.filter(a => a.owner === k);
    const pen = accts.find(a => a.cat === 'pen'), penContrib = pen ? E.contribAtYear(pen, t) : 0;
    const others = accts.filter(a => a !== pen).reduce((s, a) => s + E.contribAtYear(a, t), 0);
    if (t === 0 && (pay > 0 || penContrib > 0 || others > 0)) throw new Error('householdPlanFor: a later retiree paid or saving in plan year 0');
    if (pay > 0 && !planted('notakehome')) {
      const takeHome = pay - E.calculateUKTaxAndNIC(pay, P, o.selfEmployed) - E.netCostOfPensionContrib(penContrib, pay, P, o.selfEmployed);
      const net = Math.max(0, takeHome - others);
      if (net > 0) incomes.push({ id: `inc_house_takehome_${k}_${t}`, name: 'The later retiree\'s take-home (the household plan)', owner: 'Myself', startAge: ageA + t, endAge: ageA + t, amount: net, incomeType: 'taxFree', notes: '' });
    }
    const year = ctx.baseYear + t;
    for (const a of accts) {
      const amt = E.contribAtYear(a, t);
      if (amt > 0) deposits.push({ id: `dep_house_${a.id}_${t}`, date: `${year}-07-01`, year, owner: 'Myself', category: E.CATEGORY_LABEL[a.cat], amount: amt, transferredFrom: 'External', desc: 'The later retiree\'s contribution (the household plan)' });
    }
  }
  // the partner's state pension and other incomes, in the first person's ages
  const sp = E.num(d.statePensionPart, 0);
  // the form 'pensionsPAown' (PRICING-FIX.md, candidate A; D143: each person's state pension and other income against their
  // own allowance): the partner's fixed taxable income each plan year as the engine reads it (their state pension from the
  // state pension age, each other taxable income of theirs between its ages), taxed alone at one person's rules on top of
  // the partner's taxable pay that year (the engine's, after a sacrifice into their pension) and their earnings, and handed
  // to the household person tax-free, one dated income a year, as the later retiree's take-home is; in plan year 0 on the
  // year's fraction, as the engine scales the year's flows (its allowance whole). The partner's pay itself stays where it
  // was (the household's salary while both work, the later retiree's take-home after) and an income of theirs typed as
  // earnings stays on the household person as before (its relevant earnings and its move with the retirement age kept).
  // Plant 'partsp' (research/tests/household-pricing.test.mjs): the form read as 'pensionsPA' here, the partner's income on
  // the household person as before
  const ownIncome = opts.scale === 'pensionsPAown' && !planted('partsp');
  const isOwnFixed = i => { const ty = E.incomeTypeOf(i.incomeType); return ty.taxable && !ty.relevantEarnings; };
  if (ownIncome) {
    const penPart = ctx.accounts.find(a => a.owner === 'part' && a.cat === 'pen');
    for (let t = 0; t <= T; t++) {
      const age = ageOf('part', t);
      let F = age >= ctx.spa ? own.part.statePension : 0, earn = 0;
      for (const inc of ctx.otherIncomes) if (inc.owner === 'part' && !inc.taxFree && age >= inc.startAge && age <= inc.endAge) { if (inc.isEarnings) earn += inc.amount; else F += inc.amount; }
      if (!(F > 0)) continue;
      const frac = t === 0 ? ctx.yf : 1;
      const pay = ((working('part', t) ? E.taxablePayOf(E.salaryAtYear(own.part, t), penPart ? E.contribAtYear(penPart, t) : 0, P, own.part.selfEmployed) : 0) + earn) * frac;
      const tax = E.incomeTax(pay + F * frac, P) - E.incomeTax(pay, P), net = frac > 0 ? (F * frac - tax) / frac : 0;
      incomes.push({ id: `inc_house_partown_${t}`, name: 'The partner\'s own income net of their own tax (the household plan)', owner: 'Myself', startAge: ageA + t, endAge: ageA + t, amount: net, incomeType: 'taxFree', notes: '' });
    }
  } else if (sp > 0 && !planted('nopartsp')) incomes.push({ id: 'inc_house_sp_part', name: 'The partner\'s state pension (the household plan)', owner: 'Myself', startAge: ctx.spa + gap, endAge: '', amount: sp, incomeType: 'otherTaxable', notes: '' });
  const blank = v => v === '' || v === null || v === undefined;
  // each income moved from the plan year the engine counts it in: from its owner's retirement at the earliest (the engine's
  // incomeFloor), which the household person's own floor, its first retirement, would bring forward where the other person
  // retires first (research/tests/household-pricing.test.mjs check 4, found by its class, 23 Nov; reaching none of the
  // registered panel's units and no library couple). Plant 'incfloor': the move without it, as before
  const startOf = i => (planted('incfloor') ? (blank(i.startAge) ? i.startAge : Number(i.startAge)) : Math.max(own[i.owner === 'Partner' ? 'part' : 'self'].retireAge, E.num(i.startAge, 0)));
  const moved = (plan.otherIncomes || []).filter(i => !(ownIncome && i.owner === 'Partner' && isOwnFixed(i))).map(i => (i.owner === 'Partner'
    ? { ...i, owner: 'Myself', startAge: blank(startOf(i)) ? startOf(i) : startOf(i) + gap, endAge: blank(i.endAge) ? i.endAge : Number(i.endAge) + gap }
    : { ...i, owner: 'Myself', startAge: startOf(i) }));
  // every per-person allowance doubled; a contribution deposit of the later retiree's, or the plan's own deposit, finds room
  // in a pension as the household's two no-earnings limits; where a later retiree pays more into their pension than that,
  // the limit is raised to the most they pay in a year (the household's own routing then sees that much room too)
  const cfg = { ...E.DEFAULT_CONFIG, ...(plan.config || {}) }, config = { ...(plan.config || {}) };
  // opts.single (the decomposition's, D129 (1)): the groups of SINGLE_GROUPS left at one person's; opts.scale 'pensions' (the
  // remedy's part 1, HOUSEHOLD-REMEDY.md): each band's width above the allowance, and the cap, k times one person's; opts.scale
  // 'bands' (its amendment 1): the bands alone, the cap doubled; opts.scale 'pensionsPA' (D130 (2)): as 'pensions', the
  // personal allowance k times one person's too, so each band limit is k times one person's (its width above the allowance k
  // times, as 'pensions')
  const single = singleKeys(opts.single || []);
  if (opts.scale !== undefined && !SCALES.includes(opts.scale)) throw new Error(`householdPlanFor: opts.scale '${opts.scale}' (want ${SCALES.map(x => `'${x}'`).join(', ')})`);
  if (opts.scale && single.size) throw new Error('householdPlanFor: opts.scale and opts.single together');
  const sc = opts.scale ? pensionsSplit(E, plan) : null, paOne = E.num(cfg.personalAllowance, E.DEFAULT_CONFIG.personalAllowance);
  // the plant 'pakdouble' (D130 (2)'s test): 'pensionsPA' read with the allowance left doubled, as 'pensions' has it
  const paK = PA_K.includes(opts.scale) && !planted('pakdouble'), paH = paK ? sc && sc.k * paOne : 2 * paOne;
  const scaled = (k, one) => (k === 'personalAllowance' ? (paK || planted('scaleall') ? sc.k * one : 2 * one) : SCALED.includes(k) ? paH + sc.k * (one - paOne) : k === 'pclsMaxCap' && (opts.scale === 'pensions' || paK) ? sc.k * one : 2 * one);
  if (!planted('singleband')) for (const k of DOUBLED) config[k] = single.has(k) ? E.num(cfg[k], E.DEFAULT_CONFIG[k]) : sc ? scaled(k, E.num(cfg[k], E.DEFAULT_CONFIG[k])) : 2 * E.num(cfg[k], E.DEFAULT_CONFIG[k]);
  const maxPen = deposits.filter(x => x.category === E.CATEGORY_LABEL.pen).reduce((s, x) => Math.max(s, x.amount), 0);
  config.pensionNoEarningsLimit = Math.max(E.num(config.pensionNoEarningsLimit, E.DEFAULT_CONFIG.pensionNoEarningsLimit), maxPen);
  const demographics = {
    ...d, planningMode: 'single', currentAgeSelf: ageA, retireAgeSelf: ageA + tR,
    salarySelf: tR > 0 ? E.num(d.salarySelf, 0) + E.num(d.salaryPart, 0) : 0,
    salaryGrowthSelf: E.num(d.salarySelf, 0) > 0 ? d.salaryGrowthSelf : d.salaryGrowthPart,
    employmentSelf: d.employmentSelf, statePensionSelf: E.num(d.statePensionSelf, 0),
    cgtGainsUsedSelf: E.num(d.cgtGainsUsedSelf, 0) + E.num(d.cgtGainsUsedPart, 0), cfBroughtForwardSelf: E.num(d.cfBroughtForwardSelf, 0) + E.num(d.cfBroughtForwardPart, 0),
    mpaaAgeSelf: d.mpaaAgeSelf
  };
  const locks = L ? (({ tierCeilingPart, ...rest }) => rest)(L) : null;
  return {
    ...plan, demographics, config, accounts: Object.values(byKey), otherIncomes: [...moved, ...incomes],
    oneOffContributions: [...(plan.oneOffContributions || []).map(c => ({ ...c, owner: 'Myself' })), ...deposits],
    ...(plan.solver ? { solver: { ...plan.solver, ...(locks ? { locks } : {}) } } : {})
  };
}

/* The couple's model state as the household person's: each wrapper's pots added, each person's basis, gains carried, tax-free
   cash and cash ISA added, the lump sum taken only where both have taken theirs. */
export function mergedState(cp, state) {
  const pots = {};
  for (const a of cp.hm.ctx.accounts) pots[a.id] = 0;
  for (const a of cp.m.ctx.accounts) {
    if (a.owner === 'part' && planted('nopartpots')) continue;
    const id = cp.idOf[a.cat];
    if (id === undefined) throw new Error(`household: the household plan has no ${a.cat} account for ${a.id}`);
    pots[id] += state.pots[a.id] || 0;
  }
  const sum = (o) => (o ? (o.self || 0) + (planted('nopartpots') ? 0 : o.part || 0) : 0);
  return {
    pots, basis: { self: sum(state.basis) }, cgtCarry: { self: sum(state.cgtCarry) }, cumPcls: { self: sum(state.cumPcls) },
    lumpTaken: { self: !!(state.lumpTaken && state.lumpTaken.self && state.lumpTaken.part) }, cashIsa: { self: sum(state.cashIsa) }, guard: null
  };
}

const tiered = (tab) => !!(tab.c && tab.c.acts && tab.c.acts.some(a => (a.tierPen || 0) > 0 || (a.tierIsa || 0) > 0));
const tierName = (tab, cat, k) => (tab.c && tab.c.tiers && tab.c.tiers[cat] && tab.c.tiers[cat][k] ? tab.c.tiers[cat][k].name : null);
const CUT_RD = new Float64Array(4);
function cutAhead(tab, s, t, layer) {
  const k = Math.min(t, tab.m.ctx.totalYears), L = layer !== null ? tab.tsLayers[layer] : tab;
  readValues(tab.g, L.lsurv[k], L.beq[k], s, CUT_RD, L.lresil[k], L.short[k], k);
  return CUT_RD[3];
}

/*
 * THE CAPITAL GAINS BAND (PRESCRIPTIVE-PLAN.md step 2; ANSWERS.md section 5). The engine gives a plan the basic-rate band
 * for capital gains as its own default less the plan's personal allowance (App.jsx taxParams' cgtBandWidth, so a Scottish
 * taxpayer gets the UK band), so the household plan, its allowance doubled, would be given 25,130 where two people have
 * 75,400, and no entry of DOUBLED can reach it. twoBands(E, fn) runs fn with the engine's default basic band limit doubled
 * and puts it back whatever fn does; it throws if called while another call of it is running. householdContext(E, hp) is a
 * household plan's context built inside it, and solveHousehold solves the household table inside it, each checked: the
 * household's band two people's, and the couple's model, prepared after, a person's. Research code only: an engine edit
 * would move the solver's code stamp (code-id.mjs hashes research/engine.mjs). Plants: 'cgtband' runs fn without changing
 * the default; 'nofinally' puts the default back only if fn returns (a twoBands without its finally).
 */
let TWO_BANDS = false;
export function twoBands(E, fn) {
  if (TWO_BANDS) throw new Error('twoBands: called while another call of it is running');
  const old = E.DEFAULT_CONFIG.basicBandLimit;
  // the plant 'nofinally' leaves the guard alone, so a test can put the default back and go on
  if (planted('nofinally')) { E.DEFAULT_CONFIG.basicBandLimit = 2 * old; const r = fn(); E.DEFAULT_CONFIG.basicBandLimit = old; return r; }
  TWO_BANDS = true;
  if (!planted('cgtband')) E.DEFAULT_CONFIG.basicBandLimit = 2 * old;
  try { return fn(); } finally { E.DEFAULT_CONFIG.basicBandLimit = old; TWO_BANDS = false; }
}
export const householdContext = (E, hp, single = []) => inBands(E, single, () => E.buildContext(hp));

/* The household's plan solved, and what the rollout needs. opts: solveOne (required: solveForApp at the candidate's
   settings), splits, topK (the household table's moves tried a decision, 3 unless set), tieJoint and holdPast (as the
   couples' default takes them: the tie rule above the household's estate cap, and the hold past twice the table's top). */
/* the household's plan at its options, as solveHousehold cuts it: the plan, its band options (hopts) and how many people's
   band for gains its table is solved on. The app cuts it here and solves its table elsewhere (src/solverWorker.js). */
export function householdForm(E, plan, opts = {}) {
  const single = opts.single || [], sc = opts.scale ? pensionsSplit(E, plan) : null;
  const paOne = E.num({ ...E.DEFAULT_CONFIG, ...(plan.config || {}) }.personalAllowance, E.DEFAULT_CONFIG.personalAllowance);
  const people = sc ? sc.k : bandsSingle(single) ? 1 : 2, hopts = { single, ...(sc ? { scale: { k: sc.k, paOne, paK: PA_K.includes(opts.scale) } } : {}) };
  const hp = E.resolveMpaa(E.normalizePlan(householdPlanFor(E, plan, { single, ...(opts.scale ? { scale: opts.scale } : {}) })));
  return { single, sc, people, hopts, hp };
}
export function solveHousehold(E, M, plan, opts = {}) {
  if (typeof opts.solveOne !== 'function') throw new Error('solveHousehold: opts.solveOne (solveForApp at the candidate\'s settings)');
  const m0 = M.prepare(E, plan);
  if (!m0.ctx.isCouple) throw new Error('solveHousehold takes a couple');
  const form = householdForm(E, plan, opts);
  const t0 = Date.now();
  const H = householdBands(E, form.hopts, () => opts.solveOne(form.hp, { who: 'household', partnerAge0: m0.ctx.agePart0 }));
  return assembleHousehold(E, M, plan, H, { ...opts, m0, form, solveMs: Date.now() - t0 });
}
/* the household from its table, solved here (solveHousehold) or elsewhere (the app's parts): the couple's exact model to
   step each year, checked against the table: its band for gains, its horizon and its minimum pot. opts as solveHousehold's,
   with `form` (householdForm's, cut once) and, where the caller has them, `m0` (the couple's model) and `solveMs` */
/* the household from a table solved elsewhere (the app's parts: src/solverWorker.js), refused where the table was solved on
   another plan than the one householdForm cuts at these options */
export function householdFromTable(E, M, plan, solvedOn, H, opts = {}) {
  const form = householdForm(E, plan, opts);
  if (JSON.stringify(solvedOn) !== JSON.stringify(form.hp)) throw new Error('householdFromTable: the household\'s table was solved on another plan than the one cut for it');
  return assembleHousehold(E, M, plan, H, { ...opts, form });
}
export function assembleHousehold(E, M, plan, H, opts = {}) {
  const m0 = opts.m0 || M.prepare(E, plan);
  if (!m0.ctx.isCouple) throw new Error('assembleHousehold takes a couple');
  const form = opts.form || householdForm(E, plan, opts), { single, sc, people, hopts, hp } = form, solveMs = opts.solveMs || 0;
  if (!(Math.abs(H.m.ctx.P.cgtBandWidth - people * m0.ctx.P.cgtBandWidth) < 1e-6)) throw new Error(`solveHousehold: the household table's capital gains band ${H.m.ctx.P.cgtBandWidth}, not ${people === 1 ? 'one person\'s' : people === 2 ? 'two people\'s' : `${people.toFixed(4)} people's`} ${people * m0.ctx.P.cgtBandWidth}`);
  const tiersBelow = H.meta && H.meta.tiersBelow === 3 ? 3 : 2;
  const m = tiersBelow === 3 ? M.prepare(E, plan, { tiersBelow: 3 }) : m0;
  if (m.ctx.P.cgtBandWidth !== m0.ctx.P.cgtBandWidth) throw new Error(`solveHousehold: the couple's model carries a capital gains band of ${m.ctx.P.cgtBandWidth}, not a person's ${m0.ctx.P.cgtBandWidth}`);
  if (m.ctx.totalYears !== H.m.ctx.totalYears) throw new Error(`solveHousehold: the household plan runs ${H.m.ctx.totalYears} years and the couple's ${m.ctx.totalYears}`);
  if ((m.ctx.solvencyFloor || 0) !== (H.m.ctx.solvencyFloor || 0)) throw new Error(`solveHousehold: the minimum pots differ (${m.ctx.solvencyFloor}, ${H.m.ctx.solvencyFloor}); the plan must set the household's`);
  const idOf = {};
  for (const a of H.m.ctx.accounts) { if (idOf[a.cat] !== undefined) throw new Error(`solveHousehold: two ${a.cat} accounts in the household plan`); idOf[a.cat] = a.id; }
  return {
    E, M, m, plan, hplan: hp, hopts, H, hm: H.m, idOf, household: true, splits: opts.splits || SPLITS, topK: opts.topK || 3, wB: H.wB, switchCost: H.c.switchCost || 0, tiersBelow,
    ...(opts.tieJoint > 0 ? { tieJoint: opts.tieJoint } : {}), ...(opts.holdPast > 0 ? { holdPast: opts.holdPast } : {}),
    meta: { household: 'A', topK: opts.topK || 3, solveMs, tieJoint: opts.tieJoint || 0, holdPast: opts.holdPast || 0, ...(single.length ? { single: [...single] } : {}), ...(sc ? { scale: { rule: opts.scale, s: sc.s, k: sc.k } } : {}) }
  };
}

/* The value of a post-decision couple state: the household table read after one year's growth (each wrapper of each person
   at the tier they hold, the household table's worlds and nodes), merged, averaged over the market, less its expected
   future cut cost. out[0] the chance it lasts, out[1] that cut cost. */
const EV = new Float64Array(2);
export function householdValue(cp, post, t, out = null, ai = null) {
  const { m, M, H } = cp, T = m.ctx.totalYears;
  const mix = H.mix ? H.mix.tables : [H], shifts = H.mix ? H.mix.nodes : [0], wJ = H.mix ? H.mix.weights : [1];
  const QZ = H.quadNodes || NODES, QW = H.quadWeights || WEIGHTS;
  let total = 0, both = 0, ahead = 0;
  for (let j = 0; j < shifts.length; j++) for (let k = 0; k < QW.length; k++) {
    const rates = {};
    m.ctx.accounts.forEach(a0 => {
      const a = M_profileOf(m, post, a0);
      const vol = H.c.shiftMode ? a.vol : foldedVol(a.vol, a.sigmaParam, T - t + 1);
      rates[a0.id] = Math.exp(Math.log(1 + a.real) + (H.c.shiftMode ? a.sigmaParam * shifts[j] : 0) + vol * QZ[k]) - 1;
    });
    const g = M.cloneState(post);
    M.grow(m, g, t, rates);
    const s = vecOf(mix[j].m, mergedState(cp, g)), L = layerOf(mix[j], ai);
    const v = mix[j].value(s, t + 1, L), h = cutAhead(mix[j], s, t + 1, L);
    const w = wJ[j] * QW[k];
    total += w * (v.survival + H.wR * v.resilience + cp.wB * v.bequest - h);
    both += w * v.survival; ahead += w * h;
  }
  if (out) { out[0] = both; out[1] = ahead; }
  return total;
}

/* The household's move this year, both people taking it, at the funding split the rollout picks. */
export function chooseHousehold(cp, state, t, out = null) {
  const { m, M, H, splits, topK } = cp, T = m.ctx.totalYears;
  const s0 = vecOf(H.m, mergedState(cp, state)), tH = tiered(H);
  const held = state.tierHeld && state.tierHeld.self ? { pen: state.tierHeld.self.pen || 0, isa: state.tierHeld.self.isa || 0 } : { pen: 0, isa: 0 };
  const heldB = state.tierHeld && state.tierHeld.part ? { pen: state.tierHeld.part.pen || 0, isa: state.tierHeld.part.isa || 0 } : { pen: 0, isa: 0 };
  const ranked = rankFor(H, s0, t, tH ? held : null, topK);
  const lvl = (i) => (H.levelOf ? H.levelOf[i] : H.actions[i].spendLevel !== undefined ? H.actions[i].spendLevel : 1);
  const tiersOf = (a) => (tH ? { tierPen: a.tierPen || 0, tierIsa: a.tierIsa || 0, tierPenName: tierName(H, 'pen', a.tierPen || 0), tierIsaName: tierName(H, 'isa', a.tierIsa || 0) } : {});
  const leaves = (a, h) => (a.tierPen || 0) !== h.pen || (a.tierIsa || 0) !== h.isa;
  const deathTax = (H.terminal && H.terminal.deathTax) || 0;
  const above = cp.tieJoint > 0 && t < T && H.estateCap > 0 && Math.max(0, s0[0] + s0[1] + s0[2] - s0[0] * deathTax) > H.estateCap;
  const tj = above ? [] : null;
  let best = null, bestScore = -Infinity, bestTax = 0, bestWealth = 0;
  for (const split of splits) for (const ai of ranked) {
    const a = H.actions[ai], level = lvl(ai), po = { steps: a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', ...tiersOf(a) };
    const joint = {
      steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', sweepCash: true, ...(a.sweepIsa ? { sweepIsa: true } : {}),
      lump: !!a.lump, contrib: null, spendLevel: level, split, switchCost: cp.switchCost || 0, perOwner: { self: { ...po }, part: { ...po } }, ia: ai, ib: ai
    };
    const st = M.cloneState(state);
    const row = M.step(m, st, joint, t, null, true);
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) continue;
    const cst = H.c.yr.spend[t] > 0 ? H.costOf(level, t) : 0, rz = !!H.raiseSurvival && cst < 0;
    const swc = tH && (leaves(a, held) || leaves(a, heldB)) ? H.switchCharge || 0 : 0;
    let score;
    if (t >= T) {
      const total = Object.values(st.pots).reduce((x, y) => x + y, 0), alive = total >= (m.ctx.solvencyFloor || 0) ? 1 : 0;
      score = alive + 1e-9 * total - (rz ? cst * alive : cst) - swc;
    } else {
      const v = householdValue(cp, st, t, EV, ai);
      score = v - (rz ? cst * EV[0] : cst) - swc;
    }
    if (!Number.isFinite(score)) throw new Error(`household: non-finite score, year ${t}, split ${split}, move ${ai}: ${score}`);
    const tax = tj ? row.taxPaid + row.cgtPaid : 0, wealth = tj ? Object.values(st.pots).reduce((x, y) => x + y, 0) : 0;
    if (tj) tj.push({ joint, score, tax, wealth });
    if (score > bestScore) { bestScore = score; best = joint; best.score = score; bestTax = tax; bestWealth = wealth; }
  }
  if (out) { out.tie = tj; out.best = best ? { joint: best, score: bestScore, tax: bestTax, wealth: bestWealth } : null; out.ranked = ranked; }
  // the tie rule above the household's estate cap (couple.js tiePick's: the best's level and tiers, within the margin, the
  // least tax this year, then the larger wealth after the move)
  if (tj && best) { const p = tiePick(tj, { joint: best, score: bestScore, tax: bestTax, wealth: bestWealth }, cp.tieJoint); if (p.joint !== best) { best = p.joint; best.score = p.score; } }
  // the hold (couple.js holdMove's, on the household table): past holdPast times its wealth axis's top, no step down in risk
  if (best && cp.holdPast > 0 && t < T && tH && H.g && H.g.axes && H.g.axes.W && s0[0] + s0[1] + s0[2] > cp.holdPast * H.g.axes.W.hi) {
    const keep = {};
    for (const [cat, key] of [['pen', 'tierPen'], ['isa', 'tierIsa']]) {
      const from = held[cat] || 0, to = best.perOwner.self[key] || 0;
      const rf = TIER_ORDER.indexOf(tierName(H, cat, from)), rt = TIER_ORDER.indexOf(tierName(H, cat, to));
      if (to !== from && rf >= 0 && rt >= 0 && rt > rf) keep[key] = from;
    }
    if (Object.keys(keep).length) {
      const po = { ...best.perOwner.self, ...keep, tierPenName: tierName(H, 'pen', keep.tierPen !== undefined ? keep.tierPen : best.perOwner.self.tierPen || 0), tierIsaName: tierName(H, 'isa', keep.tierIsa !== undefined ? keep.tierIsa : best.perOwner.self.tierIsa || 0) };
      const sc = best.score; best = { ...best, perOwner: { self: po, part: { ...po } } }; best.score = sc;
      if (cp.holdActs !== undefined) cp.holdActs++;
    }
  }
  if (!best) {
    // nothing funds the year: the even split with the household's first-ranked move, and the year fails on its own terms
    const a = H.actions[ranked[0] || 0], po = { steps: a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', ...tiersOf(a) };
    best = { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', sweepCash: true, ...(a.sweepIsa ? { sweepIsa: true } : {}), lump: !!a.lump, contrib: null, spendLevel: lvl(ranked[0] || 0), split: 0.5, switchCost: cp.switchCost || 0, perOwner: { self: po, part: { ...po } } };
  }
  return best;
}

/* One path under the household's rollout, in the exact reduced model. */
export function runHouseholdPolicy(cp, zs) {
  const { m, M } = cp, T = m.ctx.totalYears, state = M.initialState(m);
  for (let t = 0; t <= T; t++) {
    const joint = chooseHousehold(cp, state, t);
    const row = M.step(m, state, joint, t, ratesAt(m, zs, t));
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) return { survived: false, failYear: t };
  }
  const total = Object.values(state.pots).reduce((a, b) => a + b, 0);
  return { survived: !(m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor), failYear: m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor ? T : -1 };
}

/* The engine under the household plan (couple.js couplePolicy's form, the household's rollout in place of the joint move). */
export function householdPolicy(cp) {
  return {
    kind: 'table',
    choose(engineState, t) {
      const tierHeld = {};
      for (const o of cp.m.ctx.owners) { const h = engineState.tierHeld && engineState.tierHeld[o.key]; tierHeld[o.key] = { pen: h ? h.pen || 0 : 0, isa: h ? h.isa || 0 : 0 }; }
      const state = {
        pots: { ...engineState.pots }, basis: { ...engineState.giaBasis }, cgtCarry: { ...engineState.cgtCarry }, cumPcls: { ...engineState.cumPcls },
        lumpTaken: { ...engineState.lumpSumTaken }, cashIsa: { ...(engineState.cashIsa || {}) }, guard: null, tierHeld
      };
      return chooseHousehold(cp, state, t);
    },
    switchCost: cp.switchCost || 0,
    tiersBelow: cp.tiersBelow || 2
  };
}
export function withHousehold(plan, cp) {
  return { ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...plan.spending, policyOverride: householdPolicy(cp) } };
}

/*
 * THE HOUSEHOLD'S MOVE FROM THE SINGLE SOLVER'S OWN CHOOSER (PRESCRIPTIVE-PLAN.md step 1, review/external-2026-10-21 at
 * f1f44727; ANSWERS.md section 4; D117). The household table's one move where the household stands, asked as bridge.js
 * tablePolicy asks a single's table (solve.js chooseAction, the candidate's tie-break above the estate cap left on in the
 * table), both people taking it; the split by cp.split: 'even' (0.5, no step and no table read) or 'best5' (0.5, then 0,
 * 0.25, 0.75 and 1, each stepped one year by the exact couple model and valued by the household table, or in the plan's
 * last year by the pots' sum; 0.5 kept unless another scores more than 1e-9 above the best so far; 0.5 where none funds the
 * year). No ranking of several moves, no tie rule of the couple's own, no look, no hold. cp.counts, where the caller sets
 * it ({ decisions, far, down }): the decisions, those with the household's wealth past twice the table's wealth top (where
 * the hold of chooseHousehold acts), and of those the ones whose move takes a wrapper to a less risky tier than it holds.
 * HOUSE.plant: 'partnersecond' (the partner takes the table's second-ranked move), 'tiezero' (the splits tried in the order
 * 0, 0.25, 0.5, 0.75, 1, the first best kept), 'notiebreak' (chooseAction asked on a copy of the table with tieAboveCap 0).
 */
const SPLITS_BEST5 = [0.5, 0, 0.25, 0.75, 1], SPLITS_TIEZERO = [0, 0.25, 0.5, 0.75, 1];
/* THE REMEDY'S PART 2 (HOUSEHOLD-REMEDY.md; cp.split 'pensions'): the first person funds the share of the year's need that their
   pension is of the two pensions as they stand that year; where both are empty, their part of all the household's pots, and
   the even split where those are empty too. Plant 'splitstart': the share read from the plan's start, not the year's. */
export function pensionsShare(cp, state) {
  const pots = planted('splitstart') ? M_initialPots(cp) : state.pots, accts = cp.m.ctx.accounts;
  const sum = (who, pen) => accts.filter(a => a.owner === who && (!pen || a.cat === 'pen')).reduce((t, a) => t + Math.max(0, pots[a.id] || 0), 0);
  const pa = sum('self', true), pb = sum('part', true);
  if (pa + pb > 0) return pa / (pa + pb);
  const wa = sum('self', false), wb = sum('part', false);
  return wa + wb > 0 ? wa / (wa + wb) : 0.5;
}
const M_initialPots = cp => cp.M.initialState(cp.m).pots;
export function chooseHouseholdSingle(cp, state, t) {
  const { m, M, H } = cp, T = m.ctx.totalYears, tH = tiered(H);
  const hs = state.tierHeld && state.tierHeld.self;
  const held = tH ? { pen: (hs && hs.pen) || 0, isa: (hs && hs.isa) || 0 } : null;
  const s = vecOf(H.m, mergedState(cp, state));
  const ai = chooseAction(planted('notiebreak') ? { ...H, tieAboveCap: 0 } : H, s, t, held), a = H.actions[ai];
  const level = H.levelOf ? H.levelOf[ai] : a.spendLevel !== undefined ? a.spendLevel : 1;
  const poOf = x => ({ steps: x.steps, harvest: !!x.harvest, harvestCeil: x.harvestCeil || 'pa', ...(tH ? { tierPen: x.tierPen || 0, tierIsa: x.tierIsa || 0, tierPenName: tierName(H, 'pen', x.tierPen || 0), tierIsaName: tierName(H, 'isa', x.tierIsa || 0) } : {}) });
  let bi = ai;
  if (planted('partnersecond')) { const r2 = rankFor(H, s, t, held, 2), o = r2.find(x => x !== ai); if (o !== undefined) bi = o; }
  const po = poOf(a), pb = bi === ai ? po : poOf(H.actions[bi]);
  const mk = split => ({ steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', sweepCash: true, ...(a.sweepIsa ? { sweepIsa: true } : {}), lump: !!a.lump, contrib: null, spendLevel: level, split, switchCost: cp.switchCost || 0, perOwner: { self: { ...po }, part: { ...pb } }, ia: ai, ib: bi });
  if (cp.counts) {
    cp.counts.decisions++;
    if (H.g && H.g.axes && H.g.axes.W && s[0] + s[1] + s[2] > 2 * H.g.axes.W.hi) {
      cp.counts.far++;
      if (tH && [['pen', 'tierPen'], ['isa', 'tierIsa']].some(([cat, key]) => { const from = held[cat] || 0, to = a[key] || 0, rf = TIER_ORDER.indexOf(tierName(H, cat, from)), rt = TIER_ORDER.indexOf(tierName(H, cat, to)); return to !== from && rf >= 0 && rt >= 0 && rt > rf; })) cp.counts.down++;
    }
  }
  if (cp.split === 'even') return mk(0.5);
  if (cp.split === 'pensions') return mk(pensionsShare(cp, state));
  if (cp.split !== 'best5') throw new Error(`chooseHouseholdSingle: cp.split '${cp.split}' (want 'even', 'best5' or 'pensions')`);
  const tiezero = planted('tiezero');
  let best = null, bs = -Infinity;
  for (const sp of tiezero ? SPLITS_TIEZERO : SPLITS_BEST5) {
    const j = mk(sp), st = M.cloneState(state), row = M.step(m, st, j, t, null, true);
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) continue;
    const v = t >= T ? Object.values(st.pots).reduce((x, y) => x + y, 0) : householdValue(cp, st, t, null, ai);
    if (!Number.isFinite(v)) throw new Error(`household: non-finite value, year ${t}, split ${sp}, move ${ai}: ${v}`);
    if (best === null || (tiezero ? v > bs : v > bs + 1e-9)) { best = j; bs = v; }
  }
  return best || mk(0.5);
}

/* the household's move built from the household table's move `ai`, both people taking it, at `split` (chooseHouseholdSingle's
   own construction where it takes one move for both: its mk at the even split, `ia` and `ib` both `ai`); the page's views
   force a skip this way (step 8's port, HSP-PORT.md step 3) */
export function householdMoveOf(cp, ai, split = 0.5) {
  const { H } = cp, tH = tiered(H), a = H.actions[ai];
  if (!a) throw new Error(`householdMoveOf: no move ${ai} in the household's table`);
  const level = H.levelOf ? H.levelOf[ai] : a.spendLevel !== undefined ? a.spendLevel : 1;
  const po = { steps: a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', ...(tH ? { tierPen: a.tierPen || 0, tierIsa: a.tierIsa || 0, tierPenName: tierName(H, 'pen', a.tierPen || 0), tierIsaName: tierName(H, 'isa', a.tierIsa || 0) } : {}) };
  return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', sweepCash: true, ...(a.sweepIsa ? { sweepIsa: true } : {}), lump: !!a.lump, contrib: null, spendLevel: level, split, switchCost: cp.switchCost || 0, perOwner: { self: { ...po }, part: { ...po } }, ia: ai, ib: ai };
}

/* One path under the single's chooser, in the exact reduced model (runHouseholdPolicy's form). */
export function runHouseholdSinglePolicy(cp, zs) {
  const { m, M } = cp, T = m.ctx.totalYears, state = M.initialState(m);
  for (let t = 0; t <= T; t++) {
    const joint = chooseHouseholdSingle(cp, state, t);
    const row = M.step(m, state, joint, t, ratesAt(m, zs, t));
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) return { survived: false, failYear: t };
  }
  const total = Object.values(state.pots).reduce((a, b) => a + b, 0);
  return { survived: !(m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor), failYear: m.ctx.solvencyFloor > 0 && total < m.ctx.solvencyFloor ? T : -1 };
}

/* The engine under the single's chooser (householdPolicy's form). */
export function householdSinglePolicy(cp) {
  return {
    kind: 'table',
    choose(engineState, t) {
      const tierHeld = {};
      for (const o of cp.m.ctx.owners) { const h = engineState.tierHeld && engineState.tierHeld[o.key]; tierHeld[o.key] = { pen: h ? h.pen || 0 : 0, isa: h ? h.isa || 0 : 0 }; }
      const state = {
        pots: { ...engineState.pots }, basis: { ...engineState.giaBasis }, cgtCarry: { ...engineState.cgtCarry }, cumPcls: { ...engineState.cumPcls },
        lumpTaken: { ...engineState.lumpSumTaken }, cashIsa: { ...(engineState.cashIsa || {}) }, guard: null, tierHeld
      };
      return chooseHouseholdSingle(cp, state, t);
    },
    switchCost: cp.switchCost || 0,
    tiersBelow: cp.tiersBelow || 2
  };
}
export function withHouseholdSingle(plan, cp) {
  return { ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...plan.spending, policyOverride: householdSinglePolicy(cp) } };
}
