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
  // THE METER (the process review, deep-review-log.md 4 Oct 13:52 UK: `unsupported` below counts only rows with no support
  // anywhere, so 7e printed 0 while every bridge year's top share node was copied): `copied` counts the nodes that take c
  // from a supported neighbour along their share row, `copiedTop` those at the top share node (a = 1, no accessible money,
  // so unsupported in every year with a bill), and `nodes` the nodes in rows that have support. Counted only; no value changes.
  let copied = 0, copiedTop = 0, nodes = 0;
  for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
    let any = false;
    for (let ii = 0; ii < ni; ii++) if (sup[g.index(ip, ii, it, ig, ic)]) { any = true; break; }
    if (!any) continue;
    rowHas[row(ip, it, ig, ic)] = 1; nodes += ni;
    for (let ii = 0; ii < ni; ii++) {
      const i = g.index(ip, ii, it, ig, ic);
      if (sup[i]) continue;
      copied++; if (ii === ni - 1) copiedTop++;
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
  return { p, c, R, unsupported, copied, copiedTop, nodes };
}

/*
 * THE REFERENCE DRAWN IN THE MENU'S ORDER (`readerRef: 'order'`, research only; PLAN.md O36). `referenceChance` pays the
 * bridge from one lognormal mix of the accessible pots at their opening weights - in proportion. The solver does not
 * draw that way: a move takes its bill from the pots in a draw order (solve.js buildActions: cash, taxable, ISA; or ISA,
 * cash, taxable), and on share 0.95 the proportional draw leaves 18.1% of bridges unpaid where ISA-first leaves 4.6% and
 * the engine's own run 6.5% (research/solver/results-o36-order.txt). This is the chance the accessible money `acc`,
 * split at the opening weights, pays every bill drawn pot by pot in the better of the menu's orders:
 *   - one bill: exactly referenceChance's step (paid when acc covers it, in any order);
 *   - more: simulated on `draws` seeded draws, the ISA and the taxable account on one return draw a year and cash on its
 *     own (the solver's nodeRealOf: gross exp(ln(1 + R) + V z), R the median), money arriving (a negative bill) into cash;
 *     tabulated over `points` levels of acc on common draws (so it is smooth in acc), made non-decreasing in acc (the
 *     true chance is), and read by linear interpolation - a step (no spread) is smeared across one table cell, about 2% of
 *     the later bills' total; above the table's top it is the top's value.
 * `w` the opening weights { isa, gia, cash }; `rate[j]` for the year between bill j and bill j + 1:
 * { isa: [R, V], gia: [R, V], cash: [R, V] }; `orders` lists of 'isa', 'gia', 'cash'.
 */
export function orderChance(bills, w, rate, orders, { draws = 12000, points = 160, seed = 7002, tol = 1 } = {}) {
  const h = bills.length;
  if (h === 0) return () => 1;
  const d0 = bills[0];
  if (h === 1) return (acc) => (acc - d0 < -tol ? 0 : 1);
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const zr = new Float64Array(draws * (h - 1)), zc = new Float64Array(draws * (h - 1));
  for (let i = 0; i < zr.length; i++) { zr[i] = gauss(); zc[i] = gauss(); }
  const later = bills.slice(1).reduce((t, b) => t + Math.max(0, b), 0);
  const top = d0 + 3 * later + 1, grid = new Float64Array(points), val = new Float64Array(points);
  // the first point at the first bill's edge and the second just above it (the chance can jump there, when money arrives
  // later), the rest evenly to the top
  grid[0] = d0 - tol; for (let g = 1; g < points; g++) grid[g] = d0 + tol + (top - d0 - tol) * (g - 1) / (points - 2);
  const pot = { isa: 0, gia: 0, cash: 0 };
  const paysAll = (acc, order, d) => {
    pot.isa = acc * w.isa; pot.gia = acc * w.gia; pot.cash = acc * w.cash;
    for (let j = 0; j < h; j++) {
      if (j > 0) {
        const r = rate[j - 1], a = zr[d * (h - 1) + j - 1], c = zc[d * (h - 1) + j - 1];
        pot.isa *= Math.exp(Math.log(1 + r.isa[0]) + r.isa[1] * a);
        pot.gia *= Math.exp(Math.log(1 + r.gia[0]) + r.gia[1] * a);
        pot.cash *= r.cash[1] ? Math.exp(Math.log(1 + r.cash[0]) + r.cash[1] * c) : 1 + r.cash[0];
      }
      let need = bills[j];
      if (need < 0) { pot.cash -= need; continue; }
      for (const k of order) { const take = Math.min(pot[k], need); pot[k] -= take; need -= take; if (need <= 0) break; }
      if (need > tol) return false;
    }
    return true;
  };
  for (let g = 0; g < points; g++) {
    let best = 0;
    for (const order of orders) { let ok = 0; for (let d = 0; d < draws; d++) if (paysAll(grid[g], order, d)) ok++; if (ok > best) best = ok; }
    val[g] = Math.max(best / draws, g > 0 ? val[g - 1] : 0);
  }
  const f = (acc) => {
    if (acc - d0 < -tol) return 0;
    if (acc >= top) return val[points - 1];
    let i = 0;
    if (acc >= grid[1]) i = Math.min(points - 2, 1 + Math.floor((acc - grid[1]) / (grid[2] - grid[1])));
    const u = (acc - grid[i]) / (grid[i + 1] - grid[i]);
    return val[i] + (val[i + 1] - val[i]) * Math.max(0, Math.min(1, u));
  };
  f.table = { grid, val };
  return f;
}
