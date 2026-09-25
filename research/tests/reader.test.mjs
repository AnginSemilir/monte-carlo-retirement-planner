/*
 * THE BRIDGE READER'S REFERENCE CHANCE AGAINST SIMULATION (src/solver/reader.js; drafts/reader-design.md check 1).
 *
 * For a frozen reference path the chance is checked against the share of 100,000 simulated paths that pay every bill.
 * The tolerance, stated before this ran (25 Sep 07:35 UK): with one or two bills the formula is exact, so it must sit
 * within 4 simulation se of the simulated share; with three or more it is a lognormal fit, and must sit within 0.02 plus
 * 4 se. Planted: the same check run on a copy that drops the v^2/2 drift term must fail somewhere, or the check proves
 * nothing. Added 25 Sep 07:56 UK before it ran (the fortieth review: the only money-arriving case read 0.9999 whichever way
 * the prefix rule went): a case where money arrives after the bridge's shortfall, bills [30k, 30k, 30k, -100k, 30k] with
 * 88k of money, held to the same 0.02 + 4 se, and a planted copy that reads only the whole run (no prefix rule) must fail it.
 *   node research/tests/reader.test.mjs
 */
import assert from 'node:assert/strict';
import { bridgeChance, discountedMoments } from '../../src/solver/reader.js';
import { Phi } from '../../src/solver/grid.js';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
// a seeded normal generator (xorshift + Box-Muller), so the check is the same every run
let st = 0x9e3779b9;
const u = () => { st ^= st << 13; st >>>= 0; st ^= st >>> 17; st ^= st << 5; st >>>= 0; return (st + 0.5) / 4294967296; };
let spare = null;
const z = () => { if (spare !== null) { const s = spare; spare = null; return s; } const a = Math.sqrt(-2 * Math.log(u())), b = 2 * Math.PI * u(); spare = a * Math.sin(b); return a * Math.cos(b); };

const N = 100000;
function simulate(acc, bills, rho, vol, tol = 1) {
  let paid = 0;
  for (let i = 0; i < N; i++) {
    let w = acc - bills[0];
    if (w < -tol) continue;
    let alive = true;
    for (let j = 1; j < bills.length && alive; j++) { w *= Math.exp(rho[j - 1] + vol[j - 1] * z()); w -= bills[j]; if (w < -tol) alive = false; }
    if (alive) paid++;
  }
  return paid / N;
}
// the planted fault: the drift term v^2/2 (and 2v^2) left out of the moments
function chanceNoDrift(acc, bills, rho, vol) {
  const x = acc - bills[0]; if (bills.length === 1) return x >= -1 ? 1 : 0;
  let m = 0, q = 0;
  for (let j = bills.length - 1; j >= 1; j--) { const r = rho[j - 1], d = bills[j]; const q2 = Math.exp(-2 * r) * (d * d + 2 * d * m + q); m = Math.exp(-r) * (d + m); q = q2; }
  const s2 = Math.log(q / (m * m)); if (!(s2 > 1e-14)) return x >= m ? 1 : 0;
  return Phi((Math.log(x) - (Math.log(m) - s2 / 2)) / Math.sqrt(s2));
}

// the cases: bills of 30,000 a year, 1 to 6 bills, the accessible mix at 3% real and 12% spread (a Medium-like tier),
// then the same with 20% spread, a cash-heavy 4% spread, uneven bills and money arriving in year 2
const cases = [];
for (const h of [1, 2, 3, 4, 5, 6]) for (const cover of [0.9, 1.0, 1.1]) cases.push({ name: `${h} bills, 12% spread, money ${cover} x the bills`, bills: Array(h).fill(30000), rho: Array(h).fill(Math.log(1.03) - 0.0072), vol: Array(h).fill(0.12), cover });
for (const h of [3, 6]) cases.push({ name: `${h} bills, 20% spread`, bills: Array(h).fill(30000), rho: Array(h).fill(Math.log(1.04) - 0.02), vol: Array(h).fill(0.2), cover: 1.0 });
cases.push({ name: '4 bills, cash-heavy (4% spread)', bills: Array(4).fill(30000), rho: Array(4).fill(0.005), vol: Array(4).fill(0.04), cover: 1.0 });
cases.push({ name: '5 uneven bills (a one-off cost in year 2)', bills: [30000, 30000, 60000, 30000, 30000], rho: Array(5).fill(0.02), vol: Array(5).fill(0.12), cover: 1.0 });
cases.push({ name: '5 bills, money arriving in year 2', bills: [30000, 30000, -50000, 30000, 30000], rho: Array(5).fill(0.02), vol: Array(5).fill(0.12), cover: 1.0 });
cases.push({ name: '5 bills, money arriving in year 3 after the shortfall', bills: [30000, 30000, 30000, -100000, 30000], rho: Array(5).fill(0.02), vol: Array(5).fill(0.12), acc: 88000, prefix: true });

let plantedCaught = 0;
for (const c of cases) {
  const total = c.bills.reduce((a, b) => a + Math.max(0, b), 0);
  const acc = c.acc !== undefined ? c.acc : c.cover * total;
  const sim = simulate(acc, c.bills, c.rho, c.vol), p = bridgeChance(acc, c.bills, c.rho, c.vol);
  const se = Math.sqrt(Math.max(sim * (1 - sim), 1 / N) / N);
  const exact = c.bills.length <= 2 && c.bills.every(b => b >= 0);
  const lim = (exact ? 0 : 0.02) + 4 * se;
  ok(Math.abs(p - sim) <= lim, `${c.name}: formula ${p.toFixed(4)}, simulated ${sim.toFixed(4)} (limit ${lim.toFixed(4)}${exact ? ', exact' : ''})`);
  if (c.bills.every(b => b >= 0) && Math.abs(chanceNoDrift(acc, c.bills, c.rho, c.vol) - sim) > lim) plantedCaught++;
}
ok(plantedCaught > 0, `planted: the copy without the drift term fails the check on ${plantedCaught} case(s)`);
// the planted fault for the prefix rule: a copy that reads only the whole run must fail the money-arriving case above
{ const c = cases.find(x => x.prefix); const sim = simulate(c.acc, c.bills, c.rho, c.vol), se = Math.sqrt(Math.max(sim * (1 - sim), 1 / N) / N);
  const { m, q } = discountedMoments(c.bills, c.rho, c.vol), x = c.acc - c.bills[0], s2 = Math.log(q / (m * m));
  const whole = m > 0 ? Phi((Math.log(x) - (Math.log(m) - s2 / 2)) / Math.sqrt(s2)) : 1;
  ok(Math.abs(whole - sim) > 0.02 + 4 * se, `planted: the whole-run-only copy reads ${whole.toFixed(4)} against simulated ${sim.toFixed(4)} and fails the money-arriving case`); }
// the reviewer's width table: equal bills, zero drift, small spread v -> width in ln A of 0, 0.500v, 0.745v, 0.935v
const v = 0.01, widths = [1, 2, 3, 4].map(h => { if (h === 1) return 0; const { m, q } = discountedMoments(Array(h).fill(1), Array(h).fill(0), Array(h).fill(v)); const s2 = Math.log(q / (m * m)), mu = Math.log(m) - s2 / 2; return (Math.exp(mu) / (1 + Math.exp(mu))) * Math.sqrt(s2) / v; });
ok([0, 0.5, 0.745, 0.935].every((w, i) => Math.abs(widths[i] - w) < 0.001), `the reviewer's widths: ${widths.map(w => w.toFixed(3)).join(', ')} (x v)`);
// edges
ok(bridgeChance(29000, [30000], [], []) === 0 && bridgeChance(29999.5, [30000], [], []) === 1, 'one bill: unaffordable by more than GBP 1 fails, within GBP 1 pays');
ok(bridgeChance(1e6, [30000, 0, 0], [0, 0, 0], [0.1, 0.1, 0.1]) === 1, 'nothing left to pay after today: certain');
ok(bridgeChance(60000, [30000, 30000], [0.03, 0.03], [0, 0]) === 1 && bridgeChance(58000, [30000, 30000], [0, 0], [0, 0]) === 0, 'no spread: the reference is certain either way');
console.log(`\nreader: ${n} passed`);
