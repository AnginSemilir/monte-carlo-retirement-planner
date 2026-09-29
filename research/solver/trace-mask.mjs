/*
 * READING A TRACE ONLY WHERE IT HAS A RECORD (O59). A run's trace (record.mjs makeTrace) has no record in a path's run-out
 * year or after: solve.js runPolicy returns before tracing that year, so the tier byte stays 0 - the code of the plan's 0/0 -
 * and the wealth 0, and a reader that indexes the arrays directly reads a dead path as holding the plan's tiers with nothing
 * (look-o52.mjs did, the plan-auditor's FAIL of 29 Sep). A path that ends below the minimum pot has a full record (failYear
 * -1) and did not survive. Every reader of tiers, wealth or levels by year uses these instead of the arrays:
 *   recordedYears(T, i)    the number of years path i has a record for (its run-out year, or all T.Y)
 *   hasRecord(T, i, t)     whether path i has a record in year t
 *   tierAt(T, i, t)        the tier byte (pen * 4 + isa) in year t, or null where there is no record
 *   wealthAt(T, i, t)      the wealth at the end of year t, or null where there is no record
 *   levelAt(T, i, t)       the spend level (% of target; 0 in a year that is not a spending year) or null
 *   countTier(T, t, code)  { holding, recorded }: the paths holding a tier code in year t, among those with a record
 * Its test: research/tests/trace-mask.test.mjs (a planted run-out that a direct read counts as 0/0).
 */
export const recordedYears = (T, i) => (T.failYear[i] >= 0 ? T.failYear[i] : T.Y);
export const hasRecord = (T, i, t) => t >= 0 && t < recordedYears(T, i);
export const tierAt = (T, i, t) => (hasRecord(T, i, t) ? T.tier[i * T.Y + t] : null);
export const wealthAt = (T, i, t) => (hasRecord(T, i, t) ? T.wealth[i * T.Y + t] : null);
export const levelAt = (T, i, t) => (hasRecord(T, i, t) ? T.level[i * T.Y + t] : null);
export function countTier(T, t, code) {
  let holding = 0, recorded = 0;
  for (let i = 0; i < T.N; i++) { if (!hasRecord(T, i, t)) continue; recorded++; if (T.tier[i * T.Y + t] === code) holding++; }
  return { holding, recorded };
}
