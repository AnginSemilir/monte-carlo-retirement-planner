/*
 * REF-S, THE REFERENCE DRAWN AT THE STATE'S OWN POTS (research/solver/ref-state.mjs; PLAN.md REF-S). Stated before it
 * ran (13 Oct): with one bill it is referenceChance's step exactly; at pots in the opening proportions, simulated, it is
 * orderChance's table exactly (the same draws and grid: REF-S reduces to ORDER where the state holds the opening
 * weights); its simulated order sits within 4 se plus 0.01 (the table's interpolation) of an independent pot-by-pot
 * simulation at 1,000,000 draws on its own seed, and its closed cash-first form within 4 se plus 0.01 too, and, where
 * the independent chance is under 0.05 (the tail, printed), within a factor of 1.25 either way (amended after the first run: where
 * under 100 of the million paths pay, within 1e-4 instead, since a ratio of one or two paths says nothing); the better of the
 * orders is never below either alone; it never falls as the money rises and stays in [0, 1].
 * Planted, each caught inside the tail: the state's cash taken at the opening weights (ORDER's split), the cash prefix
 * part-pays left off the invested pot, and the ISA share read as its complement.
 *   node research/tests/ref-state.test.mjs
 */
import assert from 'node:assert/strict';
import { orderChance, referenceChance } from '../../src/solver/reader.js';
import { stateChance, closedChance, closedHolds, potsAt, simulatedCount, stateDraws } from '../solver/ref-state.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const CASH_FIRST = ['cash', 'gia', 'isa'], ISA_FIRST = ['isa', 'cash', 'gia'], BOTH = [CASH_FIRST, ISA_FIRST];
const flat = (r, v, rc = 0.005) => ({ isa: [r, v], gia: [r, v], cash: [rc, 0] });

// A. one bill: the step
{ const f = stateChance([30000], [], BOTH, () => 5000), g = referenceChance([30000], [], []);
  ok([28000, 29998.9, 29999.5, 30000, 60000].every(a => [0, 0.4, 1].every(s => f(a, s) === g(a))), 'A  one bill: exactly referenceChance\'s step at every share'); }

// B. the opening proportions: exactly ORDER's table (cash a quarter, the GIA a quarter, the ISA a half; the share level 0.5)
{ const bills = [20000, 21000, 22000, 23000], rate = [0, 1, 2].map(() => flat(0.04, 0.12)), w = { isa: 0.5, gia: 0.25, cash: 0.25 };
  const f = stateChance(bills, rate, BOTH, tax => 0.5 * tax, { draws: 2000, points: 60, closed: false }), g = orderChance(bills, w, rate, BOTH, { draws: 2000, points: 60 });
  const xs = [...g.table.grid, 65000, 80000, 123456.7, 300000];
  ok(xs.every(x => f(x, 0.5) === g(x)), `B  at the opening proportions REF-S reads ORDER's table exactly (${xs.length} levels of money)`); }

// C. against an independent pot-by-pot simulation at 1,000,000 draws (S364's shape: a long bridge, little cash at the state)
const BILLS = [24000, 24500, 25000, 25500, 26000], RATE = [0, 1, 2, 3].map(() => flat(0.035, 0.11)), BUFFER = 9000;
const cashOf = tax => Math.min(tax, BUFFER);
let st = 0x2545f491;
const u = () => { st ^= st << 13; st >>>= 0; st ^= st >>> 17; st ^= st << 5; st >>>= 0; return (st + 0.5) / 4294967296; };
const z = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
function independent(pots, order, rate = RATE, N = 1000000) {
  let paid = 0;
  for (let i = 0; i < N; i++) {
    const p = { ...pots }; let good = true;
    for (let j = 0; good && j < BILLS.length; j++) {
      if (j > 0) { const a = z(), r = rate[j - 1]; p.isa *= Math.exp(Math.log(1 + r.isa[0]) + r.isa[1] * a); p.gia *= Math.exp(Math.log(1 + r.gia[0]) + r.gia[1] * a); p.cash *= 1 + r.cash[0]; }
      let need = BILLS[j]; for (const k of order) { const t = Math.min(p[k], need); p[k] -= t; need -= t; }
      if (need > 1) good = false;
    }
    if (good) paid++;
  }
  return paid / N;
}
const POINTS = [[70000, 0.3], [85000, 0.6], [95000, 0.2], [100000, 0.45], [105000, 0.5], [120000, 0.8], [140000, 0.4]];
// the pots written out here, not from potsAt, so a fault in the module's split is not in the truth too
const truth = POINTS.map(([acc, a]) => { const tax = (1 - a) * acc, cash = Math.min(tax, BUFFER), pots = { isa: a * acc, gia: tax - cash, cash }; return { acc, a, pots, cf: independent(pots, CASH_FIRST), isa: independent(pots, ISA_FIRST) }; });
const within = (x, y, extra = 0.01) => Math.abs(x - y) <= 4 * Math.sqrt(Math.max(y * (1 - y), 1e-6) / 12000) + extra;
const tailOk = (x, y) => !(y < 0.05) || (y < 1e-4 ? Math.abs(x - y) < 1e-4 : x > 0 && Math.abs(Math.log(x / y)) <= Math.log(1.25));
{ const fs = stateChance(BILLS, RATE, [ISA_FIRST], cashOf, { closed: false }), fc = stateChance(BILLS, RATE, [CASH_FIRST], cashOf);
  ok(closedHolds(BILLS, RATE) && fc.table.how[0] === 'closed', 'C  the closed form holds for this schedule and the cash-first order takes it');
  for (const t of truth) console.log(`      acc ${t.acc} share ${t.a}: cash ${t.pots.cash.toFixed(0)}; independent cash-first ${t.cf.toFixed(5)} ISA-first ${t.isa.toFixed(5)}; REF-S closed ${fc(t.acc, t.a).toFixed(5)} simulated ${fs(t.acc, t.a).toFixed(5)}${t.cf < 0.05 || t.isa < 0.05 ? '  (tail)' : ''}`);
  ok(truth.every(t => within(fs(t.acc, t.a), t.isa)), 'C  the simulated ISA-first order within 4 se + 0.01 of the independent simulation at every point');
  ok(truth.every(t => within(closedChance(t.pots, BILLS, RATE), t.cf)), 'C  the closed cash-first form within 4 se + 0.01 of the independent simulation at the pots');
  ok(truth.every(t => tailOk(closedChance(t.pots, BILLS, RATE), t.cf)), 'C  the closed cash-first form within a factor of 1.25 where the chance is under 0.05');
  ok(truth.some(t => t.cf < 0.05 && t.cf > 0) , 'C  the points reach the tail (a cash-first chance under 0.05 above 0)'); }

// D. the plants, each caught inside the tail
{ // a plant is caught where the unplanted read passes the same check (a point the clean read already misses proves nothing)
  const fs = stateChance(BILLS, RATE, [ISA_FIRST], cashOf, { closed: false });
  const clean = { cf: t => closedChance(t.pots, BILLS, RATE), isa: t => fs(t.acc, t.a) };
  const caught = (name, fn, key = 'cf') => { const pass = (x, y) => tailOk(x, y) && within(x, y), pts = truth.filter(t => t[key] < 0.05 && t[key] >= 1e-4 && pass(clean[key](t), t[key]));
    ok(pts.length > 0 && pts.some(t => !pass(fn(t), t[key])), `D  planted: ${name} is caught inside the tail (${pts.length} tail point(s) the clean read passes)`); };
  caught('the state\'s cash at the opening weights (a third of the money)', t => closedChance({ isa: t.a * t.acc, gia: (1 - t.a) * t.acc - t.acc / 3, cash: t.acc / 3 }, BILLS, RATE));
  caught('the bill cash part-pays left off the invested pot', t => { const c = t.pots.cash, js = BILLS.findIndex((b, j) => BILLS.slice(0, j + 1).reduce((x, y) => x + y, 0) > c * 1.0000001);
    return js < 0 ? 1 : referenceChance(BILLS.map((b, j) => (j <= js ? 0 : b)), RATE.map(r => Math.log(1 + r.isa[0])), RATE.map(r => r.isa[1]))(t.pots.isa + t.pots.gia); });
  caught('the ISA share read as its complement (the ISA-first order, simulated: one invested rate makes the cash-first form blind to the split)', t => fs(t.acc, 1 - t.a), 'isa'); }

// D1. the state's pots: cash the year's cash capped by the taxable pot, the GIA the rest
{ const eq = (x, y) => ['isa', 'gia', 'cash'].every(k => Math.abs(x[k] - y[k]) < 1e-6);
  ok(eq(potsAt(100000, 0.95, cashOf), { isa: 95000, gia: 0, cash: 5000 }) && eq(potsAt(100000, 0.5, cashOf), { isa: 50000, gia: 41000, cash: 9000 }), 'D1 the pots: cash at the buffer capped by the taxable pot (5,000 of it at a 0.95 share), the GIA the rest');
  ok(eq(potsAt(100000, 0.95, () => 9000), { isa: 95000, gia: 0, cash: 5000 }), 'D1 the cap is the module\'s own: a cash function that does not cap still gives cash 5,000 of a 5,000 taxable pot'); }

// D4. money arriving goes into cash and pays later bills (simulated; the closed form refuses such a schedule)
{ const r = [0, 1].map(() => flat(0, 0, 0)), b3 = [20000, -15000, 25000], z0 = stateDraws(3, 50);
  ok(simulatedCount({ isa: 20000, gia: 10000, cash: 0 }, b3, r, ISA_FIRST, z0) === 50 && simulatedCount({ isa: 20000, gia: 9000, cash: 0 }, b3, r, ISA_FIRST, z0) === 0, 'D4 15,000 arriving into cash pays the last 25,000 with 10,000 of GIA, and not with 9,000');
  const f = stateChance(b3, r, [CASH_FIRST], tax => 0, { draws: 50, points: 40 });
  ok(!closedHolds(b3, r) && f.table.how[0] === 'simulated' && f(32000, 0.625) === 1 && f(27000, 0.74) === 0, 'D4 the closed form refuses money arriving; the cash-first table, simulated, reads 1 and 0 either side (32,000 and 27,000)'); }

// D2. the cash prefix's growth, by arithmetic: with no spread, 20,000 of cash at 3% pays 10,000 now and 10,290 next year
//     (10,000 grown to 10,300) and no invested money is needed; ungrown it is 290 short
{ const r = [{ isa: [0.03, 0], gia: [0.03, 0], cash: [0.03, 0] }], f = stateChance([10000, 10290], r, [CASH_FIRST], tax => Math.min(tax, 20000), { points: 40 });
  ok(closedChance({ isa: 0, gia: 0, cash: 20000 }, [10000, 10290], r) === 1 && closedChance({ isa: 0, gia: 0, cash: 19900 }, [10000, 10290], r) === 0, 'D2 the cash prefix grows at cash\'s rate: 20,000 pays both bills, 19,900 (10,197 grown) does not');
  ok(f(21000, 0) === 1 && f(19000, 0) === 0, 'D2 the table, all cash, reads 1 at 21,000 and 0 at 19,000 (the step smeared across the one cell about 20,000)'); }

// D3. the read between share levels is linear in the share
{ const f = stateChance(BILLS, RATE, [ISA_FIRST], cashOf, { draws: 2000, points: 60 });   // the ISA-first order: the cash-first form is blind to the split
  ok([90000, 100000, 110000].every(x => Math.abs(f(x, 0.25) - (f(x, 0.2) + f(x, 0.3)) / 2) < 1e-12) && f(100000, 0.2) !== f(100000, 0.3), 'D3 midway between two share levels the read is their mean (and the levels differ there)');
  const { grid, val } = f.table, gs = [10, 20, 30, 40];
  ok(gs.every(g => f(grid[g], 0.2) === val[2][g] && f(grid[g], 0.8) === val[8][g]) && gs.some(g => val[2][g] !== val[8][g]), 'D3 at a share level the read is that level\'s row (0.2 reads row 2, 0.8 row 8, and the rows differ)'); }

// E. the better order, monotone in the money, in [0, 1] (the table's running maximum is a guard: at a fixed share more
//    money pays every path no worse, so it binds on no schedule built here)
{ const f = stateChance(BILLS, RATE, BOTH, cashOf, { draws: 3000, points: 80 }), fs = stateChance(BILLS, RATE, [ISA_FIRST], cashOf, { draws: 3000, points: 80 }), fc = stateChance(BILLS, RATE, [CASH_FIRST], cashOf, { draws: 3000, points: 80 });
  const accs = Array.from({ length: 200 }, (_, i) => 20000 + i * 800), shares = [0, 0.05, 0.33, 0.5, 0.71, 1];
  ok(accs.every(x => shares.every(s => f(x, s) >= Math.max(fs(x, s), fc(x, s)) - 1e-12)), 'E  the better of the orders is never below either alone');
  ok(shares.every(s => accs.every((x, i) => i === 0 || f(x, s) >= f(accs[i - 1], s))), 'E  never falls as the money rises, at every share');
  ok(accs.every(x => shares.every(s => f(x, s) >= 0 && f(x, s) <= 1)), 'E  in [0, 1]'); }

console.log(`ref-state: ${n} checks passed`);
