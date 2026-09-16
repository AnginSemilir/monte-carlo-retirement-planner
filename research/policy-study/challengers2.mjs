/*
 * Wave two: policies that use the two levers no shipped policy touches.
 *
 * Every policy in wave one differed only in the order wrappers are emptied to meet ORDINARY spending.
 * Two other decisions are just as consequential and were, until now, hardcoded:
 *
 *   costSteps     which wrapper funds a one-off capital cost. A £40k roof is not a £40k year of
 *                 groceries: it lands in a single tax year, so it can push pension income through a
 *                 band, or realise a year's gains at once. The model always took cash, then GIA, then
 *                 ISA - which is the worst possible order for a GIA-heavy household, because it books
 *                 a large gain in one year and stacks it on top of that year's income for the CGT
 *                 band split. Reaching for the ISA instead costs nothing in tax.
 *
 *   depositOrder  where a windfall with no natural home lands. An inheritance into the pension buys
 *                 relief but is capped by the annual allowance, locked until 58, and inside the estate
 *                 from 2027; into the ISA it is free forever but capped at £20k a year; into the GIA
 *                 it is uncapped and taxable. No shipped policy has an opinion.
 *
 * Each entry below changes ONE lever against a fixed 'Bracket Fill Basic' draw order, so that anything
 * it wins is attributable to the lever and not to a different spending order smuggled in alongside.
 */
const BFB = ['penPA', 'penBasic', 'cash', 'other', 'isa', 'penAny'];

export const CHALLENGERS2 = {
  // --- the cost lever ---------------------------------------------------------------------------
  'Costs from ISA': {
    label: 'Costs from ISA (fund lump-sum costs tax-free, never realising a gain to pay for them)',
    steps: BFB, harvest: true, costSteps: ['isa', 'cash', 'other', 'penAny']
  },
  'Costs from Pension': {
    label: 'Costs from Pension (fund lump-sum costs from pension income up to the basic-rate limit first)',
    steps: BFB, harvest: true, costSteps: ['penPA', 'penBasic', 'cash', 'other', 'isa', 'penAny']
  },
  'Costs Spare Cash Last': {
    label: 'Costs Spare Cash Last (fund lump-sum costs from GIA and ISA, keeping the cash buffer whole)',
    steps: BFB, harvest: true, costSteps: ['other', 'isa', 'cash', 'penAny']
  },

  // --- the deposit lever ------------------------------------------------------------------------
  'Windfall to ISA': {
    label: 'Windfall to ISA (route an unassigned deposit to the ISA first, then GIA)',
    steps: BFB, harvest: true, depositOrder: ['isa', 'other', 'cash', 'pen']
  },
  'Windfall to Pension': {
    label: 'Windfall to Pension (route an unassigned deposit to the pension for relief, then ISA)',
    steps: BFB, harvest: true, depositOrder: ['pen', 'isa', 'other', 'cash']
  },

  // --- both levers together ---------------------------------------------------------------------
  'Wrapper Aware': {
    label: 'Wrapper Aware (ISA funds lump-sum costs, windfalls fill the ISA then the GIA)',
    steps: BFB, harvest: true, costSteps: ['isa', 'cash', 'other', 'penAny'], depositOrder: ['isa', 'other', 'cash', 'pen']
  }
};

export function installChallengers2(E) {
  Object.entries(CHALLENGERS2).forEach(([k, v]) => { E.DECUMULATION_POLICIES[k] = v; });
  return Object.keys(E.DECUMULATION_POLICIES);
}
