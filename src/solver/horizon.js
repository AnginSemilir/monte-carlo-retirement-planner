/*
 * A PLAN'S END AGE THAT RUNS A GIVEN NUMBER OF YEARS (the reviewer's second round on D104 (1)'s change of default, finding 1).
 * The engine counts a plan's years from its first person's age to its end age, rounded (App.jsx buildContext:
 * Math.max(1, Math.round(end - age))), and reads the end age itself, unrounded, where a band or an income has no end age
 * (App.jsx spendBands, planEndAge). A couple's cut (couple.js singlePlanFor) and its mirror (coupleOrder.js otherOrder) give
 * a plan another first person; each takes the household's end age moved by the age gap, so an open band or income ends in
 * the plan year it does in the plan as entered. With ages in tenths that sum can round to a year fewer or more than the
 * household's (60.5 and 62.1 to 95: 34 years where the household runs 35). sameYears moves it by the fewest steps of
 * floating point that give the household's count: the count is off only where the end age is half a year from the ages the
 * plan reads in its years, so no comparison of an age with the end age moves. research/tests/couple-horizon.test.mjs.
 */
export function sameYears(end, age, years) {
  const count = x => Math.max(1, Math.round(x - age));
  if (count(end) === years || !(end > 0) || !Number.isFinite(end)) return end;
  // a positive double's bits, read as an integer, step to the next double up by one
  const f = new Float64Array([end]), bits = new BigInt64Array(f.buffer), up = count(end) < years;
  for (let k = 0; k < 64 && count(f[0]) !== years; k++) bits[0] += up ? 1n : -1n;
  if (count(f[0]) !== years) throw new Error(`sameYears: no end age near ${end} runs ${years} years from age ${age}`);
  return f[0];
}
