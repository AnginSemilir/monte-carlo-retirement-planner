/*
 * THE BEQUEST SHAPE (plan Phase 6c). `min(net, cap)` prices an extra pound of estate at exactly zero
 * above the cap, so the solver is indifferent up there and trades the pot away for any gain at all.
 * Gate 6b measured that: the cap binds on 9 of the 41 and £12.8M of the pot the tiers gave up sat above
 * it, costing nothing. `soft` keeps the cap's job - an unbounded mean is set by the lucky tail - and
 * loses the cliff.
 *
 * What must hold: the default shape is the old one to the bit; `soft` is identical at and below the cap;
 * above it, it is continuous, strictly increasing, concave, and slope 1 at the cap from both sides.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const at = (id) => singles.find(s => s.id === id);
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const POINTS = 20;

console.log('=========== A. THE TRANSFORM ===========');
{
  const cap = 3.8e6;
  const soft = (n) => (n <= cap ? n : cap * (1 + Math.log(1 + (n - cap) / cap)));
  const hard = (n) => Math.min(n, cap);
  ok('A1  at and below the cap, soft is the old shape to the pound',
    [0, 1, 1e5, 1e6, cap * 0.999, cap].every(n => soft(n) === hard(n)));
  const h = 1e-3;
  const slopeBelow = (soft(cap) - soft(cap - h)) / h, slopeAbove = (soft(cap + h) - soft(cap)) / h;
  ok('A2  continuous and slope 1 at the cap from both sides',
    Math.abs(slopeBelow - 1) < 1e-6 && Math.abs(slopeAbove - 1) < 1e-6, `below ${slopeBelow.toFixed(6)}, above ${slopeAbove.toFixed(6)}`);
  let inc = true, conc = true, prevSlope = Infinity;
  for (let k = 1; k <= 200; k++) {
    const n = cap * (1 + k / 10);
    if (!(soft(n) > soft(n - cap / 10))) inc = false;
    const s = (soft(n + h) - soft(n - h)) / (2 * h);
    if (!(s > 0) || s > prevSlope + 1e-12) conc = false;
    prevSlope = s;
  }
  ok('A3  above the cap it is strictly increasing: no pound is ever worth nothing', inc);
  ok('A4  ...and concave: each extra pound is worth less than the one before', conc);
  ok('A5  the lottery ticket still loses: a hundred times the cap scores about 5.6 cap, not 100',
    soft(100 * cap) / cap > 5 && soft(100 * cap) / cap < 6, `${(soft(100 * cap) / cap).toFixed(2)}x`);
}

console.log('=========== B. THE DEFAULT IS THE OLD SOLVER, TO THE BIT ===========');
{
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  for (const id of ['S004', 'S178']) {
    const plan = prep(at(id).plan);
    const m = M.prepare(E, plan);
    const base = { points: POINTS, lump: m.ctx.fullLumpSum };
    const a = solve(E, M, plan, base);
    const b = solve(E, M, plan, { ...base, bequestShape: 'cap' });
    const eq = a.pol.every((p, t) => same(Array.from(p), Array.from(b.pol[t])))
      && a.surv.every((v, t) => same(Array.from(v), Array.from(b.surv[t])))
      && a.beq.every((v, t) => same(Array.from(v), Array.from(b.beq[t])))
      && a.resil.every((v, t) => same(Array.from(v), Array.from(b.resil[t])))
      && a.short.every((v, t) => same(Array.from(v), Array.from(b.short[t])));
    ok(`B  ${id}: unset and 'cap' give the same tables to the bit`, eq, `shape ${a.meta.bequestShape}`);
  }
}

console.log('=========== C. SOFT CHANGES SOMETHING, AND ONLY UPWARDS ===========');
{
  const plan = prep(at('S004').plan);
  const m = M.prepare(E, plan);
  const base = { points: POINTS, lump: m.ctx.fullLumpSum };
  const hard = solve(E, M, plan, base);
  const soft = solve(E, M, plan, { ...base, bequestShape: 'soft' });
  ok("C1  'soft' is recorded in the meta", soft.meta.bequestShape === 'soft' && hard.meta.bequestShape === 'cap');
  /*
   * The transform is pointwise >= the cap (A1 to A4), but `beq` is not the transform applied to a fixed
   * policy: it is the expected bequest under whichever policy THAT objective chooses, and the policy
   * moves. An action picked for the whole score can sit a shade lower on the bequest component alone, so
   * the right assertion is that the table rises almost everywhere and that the rare falls are negligible.
   * Measured on S004 at 20 points, 22 Sep: higher at 102,423 cells by a mean of £140k, lower at 12 of
   * 181,440 (0.007%), worst £6.4k or 0.36% of the cap. An earlier version of this test asserted "never
   * lower" and failed on those 12 cells; the assertion was wrong, not the transform.
   */
  const cap = hard.meta.bequestCap;
  let cells = 0, lower = 0, higher = 0, worst = 0, polDiff = 0;
  for (let t = 0; t < hard.beq.length; t++) for (let i = 0; i < hard.beq[t].length; i++) {
    cells++;
    if (hard.pol[t][i] !== soft.pol[t][i]) polDiff++;
    const d = soft.beq[t][i] - hard.beq[t][i];
    if (d > 1e-9) higher++; else if (d < -1e-9) { lower++; if (d < worst) worst = d; }
  }
  ok('C2  the solved bequest rises almost everywhere: fewer than 0.1% of cells fall, and none by 1% of the cap',
    lower / cells < 0.001 && Math.abs(worst) < 0.01 * cap && higher > lower * 100,
    `higher at ${higher}, lower at ${lower} of ${cells} (${(100 * lower / cells).toFixed(3)}%), worst ${(100 * worst / cap).toFixed(3)}% of the cap`);
  ok("C3  'soft' is not a no-op: it moves the policy", polDiff > 0, `policy differs at ${polDiff} of ${cells} cells (${(100 * polDiff / cells).toFixed(2)}%)`);
}

console.log(`\n=========== ${passed} passed, ${failed} failed ===========`);
process.exit(failed ? 1 : 0);
