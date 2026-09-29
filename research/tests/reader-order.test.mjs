/*
 * THE REFERENCE DRAWN IN THE MENU'S ORDER (src/solver/reader.js orderChance; solve.js readerRef 'order'; PLAN.md O36).
 * Stated before it ran (29 Sep): with one bill it is referenceChance's step exactly (the order cannot matter); with no spread
 * it is certain or impossible as arithmetic says; with two bills it sits within 4 simulation se plus 0.01 (the table's
 * interpolation) of an independent pot-by-pot simulation of the better order, on its own seed; the better of two orders is
 * never below either alone; it never falls as the money rises and stays in [0, 1]. Planted: a copy that allows only the
 * cash-first order must fail the two-bill check where the ISA-first order is the better one, or the check proves nothing.
 *   node research/tests/reader-order.test.mjs
 */
import assert from 'node:assert/strict';
import { orderChance, referenceChance } from '../../src/solver/reader.js';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const CASH_FIRST = ['cash', 'gia', 'isa'], ISA_FIRST = ['isa', 'cash', 'gia'], BOTH = [CASH_FIRST, ISA_FIRST];

// A. one bill: the step, in any order
{ const f = orderChance([30000], { isa: 0.5, gia: 0.2, cash: 0.3 }, [], BOTH), g = referenceChance([30000], [], []);
  ok([28000, 29998.9, 29999.5, 30000, 60000].every(a => f(a) === g(a)), 'A  one bill: exactly referenceChance\'s step, in any order'); }

// B. no spread: certain or impossible, but for the one table cell at the edge (the step is interpolated across it)
{ const flat = r => ({ isa: [r, 0], gia: [r, 0], cash: [r, 0] }), w3 = { isa: 0.5, gia: 0.2, cash: 0.3 };
  const f = orderChance([30000, 30000], w3, [flat(0.03)], BOTH, { draws: 200 }), g = orderChance([30000, 30000], w3, [flat(0)], BOTH, { draws: 200 });
  const cell = g.table.grid[2] - g.table.grid[1];
  ok(f(60000) === 1 && g(60000 - 1 - cell) === 0 && g(60000 + cell) === 1, `B  no spread: 60,000 pays two 30,000 bills at +3%; at 0% it pays from one table cell (${Math.round(cell)}) above 59,999 and not below`);
  ok(cell < 0.02 * 30000, `B  the table's cell ${Math.round(cell)} is under 2% of the later bills (600)`); }

// C. two bills against an independent pot-by-pot simulation (share 0.95's shape: bills 23,200 twice, 47,499 accessible)
const W = { isa: 0.5334, gia: 0.1333, cash: 0.3333 }, R = [{ isa: [0.045, 0.13], gia: [0.045, 0.13], cash: [0.005, 0] }], B2 = [23200, 23200];
let st = 0x9e3779b9;
const u = () => { st ^= st << 13; st >>>= 0; st ^= st >>> 17; st ^= st << 5; st >>>= 0; return (st + 0.5) / 4294967296; };
const z = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
function simulate(acc, order, N = 200000) {
  let paid = 0;
  for (let i = 0; i < N; i++) {
    const pot = { isa: acc * W.isa, gia: acc * W.gia, cash: acc * W.cash }; let ok = true;
    for (let j = 0; ok && j < B2.length; j++) {
      if (j > 0) { const a = z(), r = R[j - 1]; pot.isa *= Math.exp(Math.log(1 + r.isa[0]) + r.isa[1] * a); pot.gia *= Math.exp(Math.log(1 + r.gia[0]) + r.gia[1] * a); pot.cash *= 1 + r.cash[0]; }
      let need = B2[j]; for (const k of order) { const t = Math.min(pot[k], need); pot[k] -= t; need -= t; }
      if (need > 1) ok = false;
    }
    if (ok) paid++;
  }
  return paid / N;
}
const f2 = orderChance(B2, W, R, BOTH), fCash = orderChance(B2, W, R, [CASH_FIRST]), fIsa = orderChance(B2, W, R, [ISA_FIRST]);
const within = (p, sim, N = 200000) => Math.abs(p - sim) <= 0.01 + 4 * Math.sqrt(Math.max(sim * (1 - sim), 1e-9) / N);
for (const acc of [40000, 47499, 55000]) {
  const sIsa = simulate(acc, ISA_FIRST), sCash = simulate(acc, CASH_FIRST), best = Math.max(sIsa, sCash);
  ok(within(f2(acc), best), `C  two bills at ${acc}: the better order ${f2(acc).toFixed(4)} against simulated ${best.toFixed(4)} (ISA first ${sIsa.toFixed(4)}, cash first ${sCash.toFixed(4)})`);
  // D. the better of two is never below either alone
  ok(f2(acc) >= fCash(acc) - 1e-12 && f2(acc) >= fIsa(acc) - 1e-12, `D  at ${acc}: both orders ${f2(acc).toFixed(4)} >= cash first ${fCash(acc).toFixed(4)} and ISA first ${fIsa(acc).toFixed(4)}`);
  // planted: cash first alone must fail C where ISA first is better
  if (sIsa > sCash + 0.05) ok(!within(fCash(acc), best), `planted: cash first alone (${fCash(acc).toFixed(4)}) fails the check at ${acc}`);
}

// E. non-decreasing in the money, in [0, 1]
{ const xs = Array.from({ length: 400 }, (_, i) => 20000 + i * 250); let mono = true, inb = true;
  for (let i = 0; i < xs.length; i++) { const v = f2(xs[i]); if (v < 0 || v > 1) inb = false; if (i && v < f2(xs[i - 1]) - 1e-12) mono = false; }
  ok(mono && inb, 'E  non-decreasing in the accessible money and within [0, 1] over 20,000 to 120,000'); }

// money arriving: a negative bill goes into cash and is never a bill
{ const f = orderChance([30000, -40000, 30000], W, [R[0], R[0]], BOTH, { draws: 5000 });
  ok(f(30000) > 0.99, 'money arriving: 30,000 pays today, 40,000 arrives, and the last 30,000 is paid'); }

console.log(`\nreader-order: ${n} passed`);
