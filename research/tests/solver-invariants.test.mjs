/*
 * SOLVER INVARIANTS (the external review of 21 Oct, Part B Step 1, item 3; research/reviews/2026-10-21/EXTERNAL-REVIEW.md).
 * Numbers that cannot be right, checked on every run, with no judgement needed:
 *   1. S070 and S224 under the product baseline with the withdrawal moves only (the settings of the review's
 *      table-census.mjs), at 30 and 60 wealth points: every cell of every table in every world finite, survival and
 *      resilience in [0, 1], a move chosen in every cell (O200 left survival -1, estate -Infinity where none was);
 *   2. S224 at 30 points: the central world's opening survival above 30% (0.00% before O200's fix);
 *   3. PhiInv(0) and PhiInv(1) finite, and the final-year integral finite at floors that clear only at z of 6, 7.8, 8.5 and
 *      8.9 (the NaN band started near 7.7; finalYearExact searches up to 9), its survival Phi(-z*) within 2% of itself;
 *   4. planted faults: one move's final-year estate made NaN (in a patched copy of the solver) must make the solve throw,
 *      and a NaN in a solved table must make the chooser throw, each naming the year and the move.
 * SOLVER_DIR=<folder> points the test at another copy of src/solver (to show it failing on the code before the fix).
 *   node research/tests/solver-invariants.test.mjs
 */
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const dir = resolve(process.env.SOLVER_DIR || join(here, '../../src/solver'));
const M = await import(pathToFileURL(join(dir, 'model.js')).href);
const S = await import(pathToFileURL(join(dir, 'solve.js')).href);
const G = await import(pathToFileURL(join(dir, 'grid.js')).href);

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

const scen = buildScenarios();
const planOf = (id) => {
  const sc = scen.find(s => s.id === id);
  let plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
  const own = Math.max(0, E.num(plan.config && plan.config.solvencyFloor, 0)), target = E.num(plan.spending && plan.spending.targetSpend, 0);
  if (!(own > 0)) plan = { ...plan, config: { ...plan.config, solvencyFloor: Math.round(target) } };
  return plan;
};
const OPTS = { ...S.PRODUCT_BASELINE, spendLevels: [1], raiseWeight: 0, lambda: 0 };

// 3. the inverse normal and the final year in its tails (a one-asset mock year, as research/solver/finalyear-nan.mjs)
if (typeof S.PhiInv === 'function') {
  ok(Number.isFinite(S.PhiInv(0)) && Number.isFinite(S.PhiInv(1)), `PhiInv(0) ${S.PhiInv(0).toFixed(3)} and PhiInv(1) ${S.PhiInv(1).toFixed(3)} are finite`);
} else ok(false, 'PhiInv is exported from solve.js');
{
  const c = { real: [0.03, 0.04, 0.04, 0.0], sigma: [0, 0, 0, 0], volEffAt: [[0.15, 0.15, 0.15, 0.0], [0.15, 0.15, 0.15, 0.0]], yr: { frac: [1, 1], buffer: [0, 0] } };
  const terminal = { floor: 100000, deathTax: 0, resilK: 50000, shortfall: true, beqOf: v => Math.min(v, 1e6) };
  // the upper tail Phi(-z) by its continued fraction, phi(z) / (z + 1/(z + 2/(z + ...))), exact to double precision here
  const tail = z => { let f = z; for (let k = 120; k >= 1; k--) f = z + k / f; return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) / f; };
  for (const z of [6, 7.8, 8.5, 8.9]) {
    const post = new Float64Array(7); post[1] = 100000 / Math.exp(Math.log(1.04) + 0.15 * z);   // the taxable pot reaches the floor at z
    const out = S.finalYearExact(c, 1, post, null, terminal, new Float64Array(7), new Float64Array(4), new Float64Array(3));
    const want = tail(z), fin = Array.from(out).every(Number.isFinite), close = Math.abs(out[0] / want - 1) < 0.02;
    ok(fin && close, `the final year clearing at z ${z}: survival ${out[0].toExponential(3)} (Phi(-z) ${want.toExponential(3)}), estate ${out[1].toExponential(3)}, resilience ${out[2].toExponential(3)}: all finite, survival within 2%`);
  }
}

// 1 and 2. every cell of every table in every world, on product-baseline solves
const census = (r) => {
  const T = r.m.ctx.totalYears, A = r.actions.length, bad = { nonFinite: 0, survOut: 0, resilOut: 0, unchosen: 0, cells: 0 };
  let first = '';
  r.mix.tables.forEach((tab, k) => {
    for (let t = 0; t <= T; t++) for (let i = 0; i < tab.surv[t].length; i++) {
      bad.cells++;
      const sv = tab.surv[t][i], b = tab.beq[t][i], rs = tab.resil[t][i], h = tab.short[t][i], ls = tab.lsurv[t][i], p = tab.pol[t][i];
      const nf = ![sv, b, rs, h, ls].every(Number.isFinite), so = !(sv >= 0 && sv <= 1), ro = !(rs >= 0 && rs <= 1), un = !(sv >= 0) || !(p >= 0 && p < A);
      if (nf) bad.nonFinite++; if (so) bad.survOut++; if (ro) bad.resilOut++; if (un) bad.unchosen++;
      if ((nf || so || ro || un) && !first) first = `world ${k}, year ${t}, cell ${i}: survival ${sv}, estate ${b}, resilience ${rs}, cost ${h}, move ${p}`;
    }
  });
  return { ...bad, first };
};
for (const [id, points] of [['S070', 30], ['S224', 30], ['S070', 60], ['S224', 60]]) {
  let r = null, err = null;
  try { r = S.solveMixture(E, M, planOf(id), { ...OPTS, points }); } catch (e) { err = e; }
  if (err) { ok(false, `${id} at ${points} points solves (it threw: ${err.message.split('\n')[0]})`); continue; }
  const cz = census(r);
  // V1's report, not a failure (a tax kink can make it legitimate; the count is information): survival falling as wealth
  // rises, at fixed shares, gain and allowance nodes, by more than a millionth
  { const g = r.g, ax = g.axes.W ? [g.axes.W, g.axes.a, g.axes.b] : [g.axes.pen, g.axes.isa, g.axes.tax], [n1, n2, n3] = ax.map(x => x.pts.length), ng = g.gain.length, nc = g.pcls.length;
    let falls = 0, pairs = 0;
    r.mix.tables.forEach(tab => { for (let t = 0; t <= r.m.ctx.totalYears; t++) for (let i2 = 0; i2 < n2; i2++) for (let i3 = 0; i3 < n3; i3++) for (let ig = 0; ig < ng; ig++) for (let ic = 0; ic < nc; ic++) for (let i1 = 1; i1 < n1; i1++) { pairs++; if (tab.surv[t][g.index(i1, i2, i3, ig, ic)] < tab.surv[t][g.index(i1 - 1, i2, i3, ig, ic)] - 1e-6) falls++; } });
    console.log(`REPORTED  ${id} at ${points} points: survival falls as wealth rises (beyond a millionth) at ${falls} of ${pairs} neighbouring wealth nodes (${(100 * falls / pairs).toFixed(3)}%)`); }
  ok(cz.nonFinite === 0 && cz.survOut === 0 && cz.resilOut === 0 && cz.unchosen === 0,
    `${id} at ${points} points, ${r.mix.tables.length} worlds, ${cz.cells} cells: non-finite ${cz.nonFinite}, survival outside [0, 1] ${cz.survOut}, resilience outside [0, 1] ${cz.resilOut}, no move chosen ${cz.unchosen}${cz.first ? ` (first: ${cz.first})` : ''}`);
  if (id === 'S224' && points === 30) {
    const s0 = M.initialState(r.m), v = r.mix.tables[1].value(s0, 0).survival;
    ok(v > 0.3, `S224 at 30 points: the central world's opening survival ${(100 * v).toFixed(2)}% is above 30% (0.00% before O200's fix)`);
    // 4b. a NaN planted in the solved central table's year-1 survival: the chooser must throw at year 0, naming it
    const tab = r.mix.tables[1], keep = Float64Array.from(tab.lsurv[1]);
    tab.lsurv[1].fill(NaN);
    let msg = '';
    try { S.chooseAction(r, G.vecOf(r.m, M.initialState(r.m)), 0); } catch (e) { msg = e.message; }
    tab.lsurv[1].set(keep);
    ok(/non-finite score in the chooser, year 0/.test(msg) && /move \d+/.test(msg), `planted: NaN in a solved table's year-1 survival makes the chooser throw (${msg || 'it did not throw'})`);
  }
}

// 4a. one move's final-year estate made NaN, in a patched copy of the solver: the solve must throw, naming year and move
{
  const tmp = mkdtempSync(join(tmpdir(), 'solver-plant-'));
  try {
    cpSync(dir, tmp, { recursive: true });
    const f = join(tmp, 'solve.js'), src = readFileSync(f, 'utf8'), anchor = '  out[0] = sv; out[1] = bq; out[2] = rs;\n  return out;';
    const at = src.indexOf(anchor);
    ok(at > 0 && src.indexOf(anchor, at + 1) < 0, 'the plant\'s anchor (the end of finalYearExact) is found once in solve.js');
    writeFileSync(f, src.replace(anchor, '  out[0] = sv; out[1] = globalThis.__plantFinalNaN && !globalThis.__planted ? (globalThis.__planted = true, NaN) : bq; out[2] = rs;\n  return out;'));
    const SP = await import(pathToFileURL(f).href + '?plant');
    globalThis.__plantFinalNaN = true; globalThis.__planted = false;
    let msg = '';
    try { SP.solveMixture(E, M, planOf('S224'), { ...OPTS, points: 12 }); } catch (e) { msg = e.message; }
    ok(globalThis.__planted === true, 'the plant fired (one move\'s final-year estate set to NaN)');
    ok(/non-finite score in the backward pass.*year \d+, cell \d+, world \d+, move \d+: estate NaN/.test(msg), `planted: the solve throws, naming the year, cell, world, move and part (${msg || 'it did not throw'})`);
  } finally { delete globalThis.__plantFinalNaN; delete globalThis.__planted; rmSync(tmp, { recursive: true, force: true }); }
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} invariant checks failed`);
