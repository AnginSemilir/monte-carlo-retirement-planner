/*
 * RAISES COUNT ONLY IN FUTURES THAT SURVIVE (PLAN.md finding M17, `raiseSurvival`).
 *
 * The step-2 records showed the solver raising spending to 1.2 in the last years of futures that fail: with
 * the survival chance near zero, the raise credit is the only reward left. With the option on, a raise's
 * credit is weighted by the survival chance it leads to. This checks that (1) off, nothing changes; (2) on, a
 * hopeless position no longer raises, in the stored table and at the exact state; (3) on, a comfortable
 * position still raises as it did.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, chooseAction } from '../../src/solver/solve.js';
import { toVec } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const sc = buildScenarios().find(s => s.id === 'S070');
const target = E.num(sc.plan.spending.targetSpend, 0);
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * target) } }));
const m = M.prepare(E, plan);
const base = { points: 8, lambda: 1.14, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum, resilienceWeight: 0, finalExact: true };
const off = solve(E, M, plan, base);
const offF = solve(E, M, plan, { ...base, raiseSurvival: false });
const onR = solve(E, M, plan, { ...base, raiseSurvival: true });
const on = solve(E, M, plan, { ...base, raiseSurvival: true, failureShortfall: true });
const onZ = solve(E, M, plan, { ...base, raiseSurvival: true, failureShortfall: 'zero' });
const offS = solve(E, M, plan, { ...base, failureShortfall: false });

// (1) off is untouched
let same = true;
for (let t = 0; t < off.lsurv.length; t++) for (let i = 0; i < off.g.size; i++) if (off.lsurv[t][i] !== offF.lsurv[t][i] || off.short[t][i] !== offF.short[t][i] || off.pol[t][i] !== offF.pol[t][i]) same = false;
for (let t = 0; t < off.lsurv.length; t++) for (let i = 0; i < off.g.size; i++) if (off.lsurv[t][i] !== offS.lsurv[t][i] || off.short[t][i] !== offS.short[t][i] || off.pol[t][i] !== offS.pol[t][i]) same = false;
ok(same && !off.raiseSurvival && !off.failureShortfall && on.raiseSurvival && on.failureShortfall === 'floor' && on.meta.failureShortfall === 'floor' && onZ.failureShortfall === 'zero', 'both options off leave every table bit for bit, and the result records the settings');

// (2) and (3): stored moves in spending years, by how hopeless the cell is
const level = (r, ai) => r.levelOf[ai];
let hopeless = 0, raiseOff = 0, raiseOn = 0, raiseR = 0, raiseZ = 0, comfy = 0, comfyRaiseOff = 0, comfyRaiseOn = 0, comfyRaiseZ = 0;
for (let t = 0; t < off.lsurv.length - 1; t++) {
  if (!(off.c.yr.spend[t] > 0)) continue;
  for (let i = 0; i < off.g.size; i++) {
    const sv = off.surv[t][i];
    if (sv > 0 && sv < 0.02) { hopeless++; if (level(off, off.pol[t][i]) > 1) raiseOff++; if (level(on, on.pol[t][i]) > 1) raiseOn++; if (level(onR, onR.pol[t][i]) > 1) raiseR++; if (level(onZ, onZ.pol[t][i]) > 1) raiseZ++; }
    if (sv > 0.999) { comfy++; if (level(off, off.pol[t][i]) > 1) comfyRaiseOff++; if (level(on, on.pol[t][i]) > 1) comfyRaiseOn++; if (level(onZ, onZ.pol[t][i]) > 1) comfyRaiseZ++; }
  }
}
console.log(`      hopeless cells ${hopeless}: raising off ${raiseOff}, raise credit weighted only ${raiseR}, both on (floor) ${raiseOn}, both on (zero) ${raiseZ};  comfortable cells ${comfy}: raising off ${comfyRaiseOff}, floor ${comfyRaiseOn}, zero ${comfyRaiseZ}`);
ok(hopeless > 50 && raiseOff > hopeless / 2, 'the defect is there with it off: most hopeless cells store a raise');
// weighting the raise credit alone does NOT cure it: failing sooner still skips the future trim charges (M17's root cause)
ok(raiseR > hopeless / 2, 'the raise credit weighted by survival alone leaves the defect: hopeless cells still raise, to fail sooner');
// The bar set before the first run was "under 5% of hopeless cells raise". Recorded 23 Sep 22:10, not moved: the
// cut-to-nothing charge ('zero') meets it (39 of 19,089) but makes comfortable cells raise a fifth less; the floor
// charge (the default) leaves 2,400 (13%) - cells where every future costs the same, so the choice is a tie - and
// keeps comfortable cells as they were. Which one the product uses is decided by simulation (probe M17), not here.
ok(raiseZ < hopeless * 0.05, "charged as a cut to nothing ('zero'), under 5% of hopeless cells store a raise");
ok(raiseOn < raiseOff * 0.2, 'charged as a year at the floor (the default), hopeless cells raise at least 80% less often than with it off');
ok(comfy > 50 && comfyRaiseOn >= comfyRaiseOff * 0.9, 'charged as a year at the floor, comfortable cells raise at least 90% as often as before');

// the exact-state choice agrees: at hopeless cells' own states the runtime chooser does not raise
const exact = (r) => {
  let checked = 0, raised = 0; const s = new Float64Array(8), G = r.g;
  outer: for (let t = 1; t < r.lsurv.length - 1; t++) {
    if (!(r.c.yr.spend[t] > 0)) continue;
    for (let ic = 0; ic < G.pcls.length; ic++) for (let ig = 0; ig < G.gain.length; ig++) for (let it = 0; it < G.nt; it++) for (let ii = 0; ii < G.ni; ii++) for (let ip = 0; ip < G.np; ip++) {
      const sv = off.surv[t][G.index(ip, ii, it, ig, ic)];
      if (!(sv > 0 && sv < 0.02)) continue;
      toVec(G, ip, ii, it, ig, ic, s);
      const ai = chooseAction(r, s, t, { pen: 0, isa: 0 });
      checked++; if (r.levelOf[ai] > 1) raised++;
      if (checked >= 200) break outer;
    }
  }
  return { checked, raised };
};
const eOff = exact(off), eOn = exact(on), eZ = exact(onZ);
console.log(`      at the exact state of 200 hopeless cells: raising off ${eOff.raised}, floor ${eOn.raised}, zero ${eZ.raised}`);
ok(eOff.raised > 100 && eOn.raised < eOff.raised * 0.5 && eZ.raised <= 10, 'at the exact state: most hopeless positions raise with it off (154 of 200 when written), far fewer with the floor charge (34), almost none with zero (3)');
console.log(`solver-raisesurv: ${n} passed`);
