/*
 * REF-S: THE REFERENCE DRAWN AT THE STATE'S OWN POTS (PLAN.md REF-S; the deep review after NE-REF, deep-review-log.md
 * 13 Oct 18:36 UK). Research only, and outside src/solver until REF-2 reads (no solver test before then; the code id
 * stays REF-2's while its jobs run).
 *
 * ORDER (reader.js orderChance) splits the accessible money at the OPENING weights. The engine holds, at a year-t
 * state, the ISA it has and the taxable pot split by the sweep: cash at the buffer (model.cashAt, capped by the pot) and
 * the rest in the GIA. On S364 the year-1 states hold far less cash than the opening weights (NE-REF's ledger, MIXS).
 * This is the chance the state's own pots pay every bill, drawn pot by pot in the better of the menu's orders, as a
 * function of the accessible money `acc` and the ISA share `a` of it:
 *   isa = a acc;  taxable = (1 - a) acc;  cash = cashOf(taxable);  gia = taxable - cash.
 * Per order:
 *   - CLOSED (`closed`, on by default): a cash-first order, when cash has no spread, the ISA and the GIA carry one rate
 *     every year and no money arrives after today. Cash pays a deterministic prefix, grown at its own rate; the invested
 *     pot (the ISA and the GIA together, one lognormal a year) pays the rest, its chance referenceChance's on the bills
 *     cash leaves (exact when one bill is left to the invested pot, the moment match of the discounted bills beyond);
 *   - otherwise SIMULATED on `draws` common draws in orderChance's draw model (the ISA and the GIA on one return draw a
 *     year, cash on its own, money arriving into cash).
 * Tabulated over `shares` ISA-share levels from 0 to 1 and orderChance's `points` levels of acc (the first at today's
 * bill's edge), made non-decreasing in acc along each share level, and read bilinearly; above the table's top, the top's
 * value. `bills`, `rate` and `orders` as orderChance's; `cashOf(taxable)` the year's cash (model.cashAt at the year).
 */
import { referenceChance } from '../../src/solver/reader.js';

export const isCashFirst = order => order[0] === 'cash';

/* whether the closed form holds for this schedule (cash with no spread, one invested rate, nothing arriving) */
export function closedHolds(bills, rate) {
  return bills.every(b => b >= 0) && rate.every(r => !r.cash[1] && r.isa[0] === r.gia[0] && r.isa[1] === r.gia[1]);
}

/* the cash-first chance in closed form at the pots { isa, gia, cash } (closedHolds must hold) */
export function closedChance(pots, bills, rate, tol = 1) {
  const h = bills.length;
  let c = pots.cash, js = -1, rem = 0;
  for (let j = 0; j < h; j++) {
    if (j > 0) c *= 1 + rate[j - 1].cash[0];
    if (c >= bills[j]) { c -= bills[j]; continue; }
    js = j; rem = bills[j] - c; break;
  }
  if (js < 0) return 1;                                   // cash pays every bill
  const left = bills.map((b, j) => (j < js ? 0 : j === js ? rem : b));
  const rho = rate.map(r => Math.log(1 + r.isa[0])), vol = rate.map(r => r.isa[1]);
  return referenceChance(left, rho, vol, tol)(pots.isa + pots.gia);
}

/* the shared draws: per draw and year, one return normal (the ISA and the GIA) and one for cash, orderChance's layout */
export function stateDraws(h, draws, seed = 7002) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const n = draws * Math.max(h - 1, 0), zr = new Float64Array(n), zc = new Float64Array(n);
  for (let i = 0; i < n; i++) { zr[i] = gauss(); zc[i] = gauss(); }
  return { zr, zc, draws };
}

/* paths that pay every bill from the pots in one order, on the shared draws (orderChance's paysAll at given pots) */
export function simulatedCount(pots, bills, rate, order, z, tol = 1) {
  const h = bills.length, p = { isa: 0, gia: 0, cash: 0 };
  let ok = 0;
  for (let d = 0; d < z.draws; d++) {
    p.isa = pots.isa; p.gia = pots.gia; p.cash = pots.cash;
    let paid = true;
    for (let j = 0; j < h; j++) {
      if (j > 0) {
        const r = rate[j - 1], a = z.zr[d * (h - 1) + j - 1], c = z.zc[d * (h - 1) + j - 1];
        p.isa *= Math.exp(Math.log(1 + r.isa[0]) + r.isa[1] * a);
        p.gia *= Math.exp(Math.log(1 + r.gia[0]) + r.gia[1] * a);
        p.cash *= r.cash[1] ? Math.exp(Math.log(1 + r.cash[0]) + r.cash[1] * c) : 1 + r.cash[0];
      }
      let need = bills[j];
      if (need < 0) { p.cash -= need; continue; }
      for (const k of order) { const take = Math.min(p[k], need); p[k] -= take; need -= take; if (need <= 0) break; }
      if (need > tol) { paid = false; break; }
    }
    if (paid) ok++;
  }
  return ok;
}

export const potsAt = (acc, a, cashOf) => {
  const tax = Math.max(0, (1 - a) * acc), cash = Math.min(tax, Math.max(0, cashOf(tax)));
  return { isa: a * acc, gia: tax - cash, cash };
};

export function stateChance(bills, rate, orders, cashOf, { draws = 12000, points = 160, shares = 11, seed = 7002, tol = 1, closed = true } = {}) {
  const h = bills.length;
  if (h === 0) { const f = () => 1; f.table = null; return f; }
  const d0 = bills[0];
  if (h === 1) { const f = (acc) => (acc - d0 < -tol ? 0 : 1); f.table = null; return f; }
  const useClosed = closed && closedHolds(bills, rate), z = stateDraws(h, draws, seed);
  const later = bills.slice(1).reduce((t, b) => t + Math.max(0, b), 0);
  const top = d0 + 3 * later + 1, grid = new Float64Array(points), lv = new Float64Array(shares);
  grid[0] = d0 - tol; for (let g = 1; g < points; g++) grid[g] = d0 + tol + (top - d0 - tol) * (g - 1) / (points - 2);
  for (let i = 0; i < shares; i++) lv[i] = i / (shares - 1);
  const val = Array.from({ length: shares }, () => new Float64Array(points)), how = orders.map(o => (useClosed && isCashFirst(o) ? 'closed' : 'simulated'));
  for (let i = 0; i < shares; i++) {
    for (let g = 0; g < points; g++) {
      const pots = potsAt(grid[g], lv[i], cashOf);
      let best = 0;
      orders.forEach((o, oi) => { const c = how[oi] === 'closed' ? closedChance(pots, bills, rate, tol) : simulatedCount(pots, bills, rate, o, z, tol) / draws; if (c > best) best = c; });
      val[i][g] = Math.max(best, g > 0 ? val[i][g - 1] : 0);
    }
  }
  const row = (i, acc) => {
    if (acc >= top) return val[i][points - 1];
    let k = 0;
    if (acc >= grid[1]) k = Math.min(points - 2, 1 + Math.floor((acc - grid[1]) / (grid[2] - grid[1])));
    const u = (acc - grid[k]) / (grid[k + 1] - grid[k]);
    return val[i][k] + (val[i][k + 1] - val[i][k]) * Math.max(0, Math.min(1, u));
  };
  const f = (acc, a) => {
    if (acc - d0 < -tol) return 0;
    const x = Math.max(0, Math.min(1, a)) * (shares - 1), i = Math.min(shares - 2, Math.floor(x)), u = x - i;
    return row(i, acc) * (1 - u) + row(i + 1, acc) * u;
  };
  f.table = { grid, levels: lv, val, how, useClosed };
  return f;
}
