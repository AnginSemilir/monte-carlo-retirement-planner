/*
 * THE PAIRED SURVIVAL INTERVAL IS NEWCOMBE'S METHOD 10 (research/solver/stats.mjs survivalChangeU; D112: "Stats helper -
 * fix"; the reviewer's MINOR 4 at the couples' sweep check's read, research/solver/reviews/2026-11-12-read-couple-sweep.md).
 * Method 10 combines each arm's Wilson interval through the paired correlation phi, corrected: where ad - bc exceeds N/2,
 * phi* = (ad - bc - N/2) / sqrt(efgh); from 0 to N/2, phi* = 0; below 0, phi unchanged. Without the correction (method 8)
 * the interval is too narrow where nearly every path survives. Four checks:
 *   1. the reviewer's two worked cases, each worked by hand from Newcombe's formulae in that review: S017 (4,000 paths,
 *      3,995 both survive, 1 lost, 1 saved, 3 both fail) -0.128 to +0.128 points, and S029 (3,978 / 1 / 0 / 21) -0.146 to
 *      +0.088, each to three places;
 *   2. where the paired correlation is negative the correction leaves it alone: the interval equals method 8's;
 *   3. where ad - bc is above 0 and at most N/2, phi* is 0: the interval equals the two Wilson intervals combined as if
 *      independent;
 *   4. its plant (STATS.plant 'nocorrect', method 8 as the code before the fix had it) fails check 1.
 *   node research/tests/stats-newcombe.test.mjs
 */
import { survivalChangeU, wilson, zFor, STATS } from '../solver/stats.mjs';

const results = [];
const check = (label, ok, detail = '') => { results.push(ok); console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `: ${detail}` : ''}`); };
const r3 = x => Math.round(x * 1000) / 1000;
// method 8 and the independent combination, worked here from the formulae for checks 2 and 3
const combine = (a, b, c, d, phi) => {
  const N = a + b + c + d, z = zFor(0.05), pB = (a + c) / N, pA = (a + b) / N, dl = pB - pA;
  const [lB, uB] = wilson(a + c, N, z), [lA, uA] = wilson(a + b, N, z);
  return [100 * (dl - Math.sqrt(Math.max(0, (pB - lB) ** 2 - 2 * phi * (pB - lB) * (uA - pA) + (uA - pA) ** 2))), 100 * (dl + Math.sqrt(Math.max(0, (uB - pB) ** 2 - 2 * phi * (uB - pB) * (pA - lA) + (pA - lA) ** 2)))];
};
const phi8 = (a, b, c, d) => (a * d - b * c) / Math.sqrt((a + c) * (b + d) * (a + b) * (c + d));
console.log('THE PAIRED SURVIVAL INTERVAL IS NEWCOMBE\'S METHOD 10: stats-newcombe.test.mjs');
const known = () => {
  const s017 = survivalChangeU(3995, 1, 1, 3), s029 = survivalChangeU(3978, 1, 0, 21);
  return { ok: r3(s017.lo) === -0.128 && r3(s017.hi) === 0.128 && r3(s029.lo) === -0.146 && r3(s029.hi) === 0.088, detail: `S017 ${r3(s017.lo)} to ${r3(s017.hi)}, S029 ${r3(s029.lo)} to ${r3(s029.hi)}` };
};
{ const k = known(); check('the reviewer\'s worked cases: S017 -0.128 to +0.128, S029 -0.146 to +0.088', k.ok, k.detail); }
{
  const [a, b, c, d] = [10, 40, 45, 5], u = survivalChangeU(a, b, c, d), w = combine(a, b, c, d, phi8(a, b, c, d));
  check('a negative correlation is left as it is (method 8\'s interval)', a * d - b * c < 0 && Math.abs(u.lo - w[0]) < 1e-12 && Math.abs(u.hi - w[1]) < 1e-12, `${u.lo.toFixed(4)} to ${u.hi.toFixed(4)}`);
}
{
  const [a, b, c, d] = [30, 10, 10, 4], N = a + b + c + d, num = a * d - b * c, u = survivalChangeU(a, b, c, d), w = combine(a, b, c, d, 0);
  check('ad - bc above 0 and at most N/2 reads phi* = 0', num > 0 && num <= N / 2 && Math.abs(u.lo - w[0]) < 1e-12 && Math.abs(u.hi - w[1]) < 1e-12, `ad - bc ${num}, N/2 ${N / 2}`);
}
{ STATS.plant = 'nocorrect'; const k = known(); STATS.plant = ''; check('the plant (method 8, uncorrected) fails the worked cases', !k.ok, k.detail); }
const bad = results.filter(ok => !ok).length;
console.log(bad ? `FAILED: ${bad} of ${results.length} checks` : `ALL PASS: ${results.length} checks`);
process.exit(bad ? 1 : 0);
