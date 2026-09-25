/*
 * THE BRIDGE READER'S REFERENCE CHANCE (PLAN.md 7e; drafts/reader-design.md; the outside reviewer's second reply,
 * outside-review-reply-2.md). Built 25 Sep; nothing in the solver calls it yet.
 *
 * In a retired year before pension access only the accessible money A (ISA, taxable account, cash) can pay. The reader
 * rebuilds survival there as p x c + residual, and p is this function: the chance that A pays every remaining
 * pre-access floor bill. Today's bill d_0 is due now, with no return before it; each later bill d_j is paid from
 * money that has grown j years through the accessible mix. Paying their total discounted value pays every prefix when
 * the bills are all non-negative, so
 *     p = P( A - d_0 >= D ),   D = sum_{j>=1} d_j exp( -sum_{r<j} (rho_r + v_r Z_r) ),
 * with ln D taken as normal with D's exact first two moments (worked backward from the last bill:
 * m' = e^{-rho + v^2/2} (d + m),  q' = e^{-2 rho + 2 v^2} (d^2 + 2 d m + q)). Exact for one and two bills; an
 * approximation for longer bridges, checked against simulation in research/tests/reader.test.mjs.
 * A bill due inside the bridge that is negative (money arriving) breaks the prefix argument: the chance is then the
 * least over the prefixes that end before each inflow and the whole run (an upper bound on paying every prefix).
 * `rho` and `vol` are per-year log real return and its spread of the reference accessible mix, one per year between
 * bills (rho[j] applies between bill j and bill j + 1); cash is zero spread within a world.
 */
import { Phi } from './grid.js';

/* E[D] and E[D^2] for bills[from..to] (inclusive), discounted to just after bill `from - 1` is paid */
export function discountedMoments(bills, rho, vol, from = 1, to = bills.length - 1) {
  let m = 0, q = 0;
  for (let j = to; j >= from; j--) {
    const r = rho[j - 1], v = vol[j - 1], d = bills[j];
    const q2 = Math.exp(-2 * r + 2 * v * v) * (d * d + 2 * d * m + q);
    m = Math.exp(-r + v * v / 2) * (d + m); q = q2;
  }
  return { m, q };
}

/* P(x >= D) for D lognormal with mean m and second moment q; x the money left once today's bill is paid */
function chanceCovers(x, m, q) {
  if (!(m > 0)) return 1;                    // nothing (net) left to pay
  if (!(x > 0)) return 0;
  const s2 = Math.log(q / (m * m));
  if (!(s2 > 1e-14)) return x >= m ? 1 : 0;  // no spread: the reference is certain
  const mu = Math.log(m) - s2 / 2;
  return Phi((Math.log(x) - mu) / Math.sqrt(s2));
}

/*
 * The chance accessible money `acc` pays every bill in `bills` (bills[0] due now). `tol` is the engine's shortfall
 * tolerance: a year fails only when more than GBP 1 is unmet.
 */
export function bridgeChance(acc, bills, rho, vol, tol = 1) {
  const h = bills.length;
  if (h === 0) return 1;
  const x = acc - bills[0];
  if (x < -tol) return 0;                    // today's bill cannot be paid
  if (h === 1) return 1;                     // nothing after today: no return stands between the money and the bill
  const left = Math.max(x, 0);
  // prefixes to check: each run up to the bill before money arrives, and the whole run
  let p = 1;
  for (let k = 1; k < h; k++) {
    if (k === h - 1 || bills[k + 1] < 0) {
      const { m, q } = discountedMoments(bills, rho, vol, 1, k);
      p = Math.min(p, chanceCovers(left, m, q));
    }
  }
  return p;
}
