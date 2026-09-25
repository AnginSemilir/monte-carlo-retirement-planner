/*
 * THE BRIDGE READER'S REFERENCE CHANCE (PLAN.md 7e; drafts/reader-design.md; the outside reviewer's second reply,
 * outside-review-reply-2.md). Built 25 Sep; the solver calls it with `bridgeRead: 'reader'` (see below).
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
 *
 * WIRED INTO THE SOLVER 25 Sep (`bridgeRead: 'reader'`, solve.js): `referenceChance` precomputes one year's chance as a
 * function of A alone, and `buildReaderTable` splits that year's solved survival S_i into p_i x c_i + R_i (below), which
 * grid.js `readValues` reassembles at an off-grid position with p taken from the position's own A.
 */
import { Phi, toVec } from './grid.js';

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
 * One year's reference chance as a function of the accessible money alone: the bills and the schedule are fixed for the
 * year (and the world), so the moments of every prefix that must be checked are worked out once here and each call
 * costs a log and a Phi per prefix. `tol` is the engine's shortfall tolerance: a year fails only when more than GBP 1 is
 * unmet. Prefixes checked: each run up to the bill before money arrives, and the whole run.
 */
export function referenceChance(bills, rho, vol, tol = 1) {
  const h = bills.length;
  if (h === 0) return () => 1;
  const d0 = bills[0];
  if (h === 1) return (acc) => (acc - d0 < -tol ? 0 : 1);   // nothing after today: no return stands between money and bill
  const pre = [];
  for (let k = 1; k < h; k++) if (k === h - 1 || bills[k + 1] < 0) pre.push(discountedMoments(bills, rho, vol, 1, k));
  return (acc) => {
    const x = acc - d0;
    if (x < -tol) return 0;                  // today's bill cannot be paid
    const left = Math.max(x, 0);
    let p = 1;
    for (let i = 0; i < pre.length; i++) { const c = chanceCovers(left, pre[i].m, pre[i].q); if (c < p) p = c; }
    return p;
  };
}

/* The chance accessible money `acc` pays every bill in `bills` (bills[0] due now); see referenceChance. */
export function bridgeChance(acc, bills, rho, vol, tol = 1) {
  return referenceChance(bills, rho, vol, tol)(acc);
}

/*
 * THE CONTINUATION AND THE RESIDUAL for one bridge year's solved table (drafts/reader-design.md steps 2 and 3).
 * `S` is the year's survival per node as a probability (the clamped value the table holds), `chance` the year's
 * reference. Total-wealth coordinates only: a SHARE ROW is the nodes that differ only in the pension share a, and
 * accessible money A = W (1 - a) falls along it, so the row's high-a end is its unfunded side.
 *   p_i = chance(A_i)
 *   c_i = clip(S_i / p_i, 0, 1) where p_i >= 0.5 (supported). Along each share row an unsupported node takes c from the
 *         nearest supported node in the row (a tie goes to the lower share, the funded side). A row with no support
 *         takes the nearest wealth row that has some, node for node (a tie goes to the richer row). A node with none
 *         anywhere keeps c = 0, so its whole value sits in the residual; they are counted in `unsupported`.
 *   R_i = S_i - p_i c_i                     (probability space; reassembled as p x I[c] + I[R])
 * At a node the read gives back p_i c_i + R_i = S_i to rounding (the node-reproduction check).
 */
export function buildReaderTable(g, S, chance) {
  if (g.mode !== 'total') throw new Error('the bridge reader needs total-wealth coordinates');
  const n = g.size, p = new Float64Array(n), c = new Float64Array(n), R = new Float64Array(n);
  const sup = new Uint8Array(n), v = new Float64Array(7);
  const { np, ni, nt } = g, NG = g.gain.length, NCL = g.pcls.length;
  const row = (ip, it, ig, ic) => ((ic * NG + ig) * nt + it) * np + ip;
  for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ii = 0; ii < ni; ii++) for (let ip = 0; ip < np; ip++) {
    const i = g.index(ip, ii, it, ig, ic);
    toVec(g, ip, ii, it, ig, ic, v);
    p[i] = chance(v[1] + v[2]);
    if (p[i] >= 0.5) { sup[i] = 1; c[i] = Math.min(1, Math.max(0, S[i] / p[i])); }
  }
  const rowHas = new Uint8Array(np * nt * NG * NCL);
  for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
    let any = false;
    for (let ii = 0; ii < ni; ii++) if (sup[g.index(ip, ii, it, ig, ic)]) { any = true; break; }
    if (!any) continue;
    rowHas[row(ip, it, ig, ic)] = 1;
    for (let ii = 0; ii < ni; ii++) {
      const i = g.index(ip, ii, it, ig, ic);
      if (sup[i]) continue;
      for (let d = 1; d < ni; d++) {
        const lo = ii - d, hi = ii + d;
        if (lo >= 0 && sup[g.index(ip, lo, it, ig, ic)]) { c[i] = c[g.index(ip, lo, it, ig, ic)]; break; }
        if (hi < ni && sup[g.index(ip, hi, it, ig, ic)]) { c[i] = c[g.index(ip, hi, it, ig, ic)]; break; }
      }
    }
  }
  let unsupported = 0;
  for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
    if (rowHas[row(ip, it, ig, ic)]) continue;
    let src = -1;
    for (let d = 1; d < np && src < 0; d++) {
      if (ip + d < np && rowHas[row(ip + d, it, ig, ic)]) src = ip + d;
      else if (ip - d >= 0 && rowHas[row(ip - d, it, ig, ic)]) src = ip - d;
    }
    for (let ii = 0; ii < ni; ii++) {
      const i = g.index(ip, ii, it, ig, ic);
      if (src >= 0) c[i] = c[g.index(src, ii, it, ig, ic)]; else unsupported++;
    }
  }
  for (let i = 0; i < n; i++) R[i] = S[i] - p[i] * c[i];
  return { p, c, R, unsupported };
}
