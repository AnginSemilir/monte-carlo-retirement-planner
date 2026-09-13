/*
 * Candidate policies we do NOT ship, added to the tournament to see whether any of them deserves to.
 *
 * A policy is just an order in which wrappers are emptied to meet the year's net demand, drawn from six
 * tokens: penPA (pension income up to the personal allowance), penBasic (up to the higher-rate
 * threshold), penAny (at whatever rate), and cash / other / isa. Anything expressible as an order of
 * those six needs no engine change, which is the whole space searched here.
 *
 * Each challenger encodes one specific belief about what the shipped three get wrong:
 */
export const CHALLENGERS = {
  /*
   * "Empty the pension first." The pension is the only wrapper taxed on the way out AND counted in the
   * estate once the 2027 rules bite, so every pound left in it is taxed twice. Draining it early, while
   * the basic-rate band is doing the work, should beat preserving it - and pickBest's tie-break is on the
   * pot left AFTER death tax, so if this is right the tie-break is where it shows up.
   */
  'Pension First': { label: 'Pension First (drain the taxable wrapper early, keep ISA and cash intact)', steps: ['penPA', 'penBasic', 'penAny', 'cash', 'other', 'isa'], harvest: true },

  /*
   * "Keep the cash." Every shipped policy spends cash before anything else, which empties the one
   * holding that does not fall in a crash exactly when it would be most useful. This one spends the
   * volatile unwrapped money first and keeps cash as the buffer of last resort.
   */
  'Preserve Cash': { label: 'Preserve Cash (spend GIA and ISA first, keep the cash buffer for a bad year)', steps: ['penPA', 'penBasic', 'other', 'isa', 'cash', 'penAny'], harvest: true },

  /*
   * "Use the CGT exemption or lose it." The annual exempt amount does not carry forward, so a household
   * sitting on a large GIA and never selling wastes it every year. Drawing GIA ahead of cash realises
   * gains steadily instead of in one lump later.
   */
  'GIA First': { label: 'GIA First (realise gains against the annual CGT exemption before touching cash)', steps: ['penPA', 'other', 'cash', 'isa', 'penBasic', 'penAny'], harvest: true },

  /*
   * "Spend the ISA, protect the pension." The classic pre-2027 advice, and the exact opposite of
   * Pension First. Included so the two beliefs are tested against each other rather than assumed.
   */
  'ISA First': { label: 'ISA First (spend the tax-free wrapper early, leave the pension to grow)', steps: ['penPA', 'isa', 'cash', 'other', 'penBasic', 'penAny'], harvest: true },

  /*
   * "Keep the cash, but do not pay CGT to do it." Preserve Cash spends the unwrapped GIA first, which
   * books a gain every year. This one reaches for the ISA first instead - no tax on the way out, no
   * gain realised - and still keeps cash as the last liquid resort.
   */
  'Cash Last': { label: 'Cash Last (spend ISA then GIA, keep the cash buffer back)', steps: ['penPA', 'penBasic', 'isa', 'other', 'cash', 'penAny'], harvest: true },

  /*
   * What a lot of people actually do: take the pension, ignore the bands, ignore the wrappers. Not a
   * recommendation - a floor. If a shipped policy cannot beat this, it is not earning its complexity.
   */
  'Naive Pension': { label: 'Naive Pension (draw the pension at whatever rate, then everything else)', steps: ['penAny', 'cash', 'other', 'isa'], harvest: false }
};

// install into the engine's policy table so buildPolicyCandidates and buildContext both see them
export function installChallengers(E) {
  Object.entries(CHALLENGERS).forEach(([k, v]) => { E.DECUMULATION_POLICIES[k] = v; });
  return Object.keys(E.DECUMULATION_POLICIES);
}
