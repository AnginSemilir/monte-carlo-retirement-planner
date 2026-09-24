/*
 * THE TAXABLE ACCOUNT TAKES THE TIER STEP (PLAN.md finding M15, `giaTiers`) - research only.
 *
 * Phase 6 left the GIA at the plan's tier for good. With the option on, the GIA takes the joint step with the
 * pension and the ISA (no new moves: the same menu, the same tables in size), a switch there pays its dealing cost
 * and the capital gains tax on the slice sold, and each decision also scores the chosen move with the GIA kept
 * where it is. This checks that (1) off, nothing changes; (2) on, the menu is the same size and the GIA's tier
 * follows the step; (3) the charge is the arithmetic written in fast.js; (4) a large unrealised gain makes the
 * solver switch the GIA less, not more.
 *
 * Bit-identity against the code before the change was checked by hashing the tables (S070 and S330, 8 points,
 * the M17 hash script): d12c6e177e97cb6a and d9ad3e66a9b6d52c, the same before and after.
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, runPolicy } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const sc = buildScenarios().find(s => s.id === 'S330');   // 45% of its wealth in the GIA
const target = E.num(sc.plan.spending.targetSpend, 0);
const planOf = (gain) => E.resolveMpaa(E.normalizePlan({ ...sc.plan,
  accounts: sc.plan.accounts.map(a => (/^Other Investments/.test(a.category) && E.num(a.balance, 0) > 0 ? { ...a, unrealisedGain: Math.round(gain * E.num(a.balance, 0)) } : a)),
  config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * target) } }));
const plan = planOf(0);
const m = M.prepare(E, plan);
const base = { points: 8, lambda: 1.14, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.95, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum, resilienceWeight: 0, finalExact: true };
const off = solve(E, M, plan, base);
const offF = solve(E, M, plan, { ...base, giaTiers: false });
const on = solve(E, M, plan, { ...base, giaTiers: true });

// (1) off is untouched
let same = true;
for (let t = 0; t < off.lsurv.length; t++) for (let i = 0; i < off.g.size; i++) if (off.lsurv[t][i] !== offF.lsurv[t][i] || off.beq[t][i] !== offF.beq[t][i] || off.pol[t][i] !== offF.pol[t][i]) same = false;
ok(same && !off.c.tiers.gia && off.c.acts.every(a => a.tierGia === 0) && off.meta.giaTiers === false && on.meta.giaTiers === true,
  'off: every table bit for bit, no GIA tier list, every move holds the GIA at the plan tier; the result records the setting');

// (2) on: the same menu, and the GIA follows the joint step
const gl = on.c.tiers.gia;
ok(on.actions.length === off.actions.length, `on: the menu is the same size (${on.actions.length} moves)`);
ok(gl && gl[0].name === 'Medium Risk' && gl.length === 3 && gl[1].name === 'Medium/Low Risk' && gl[2].name === 'Low Risk', "on: the GIA's list is its plan tier and the two below");
ok(on.c.acts.every(a => a.tierGia === Math.max(a.tierPen, a.tierIsa)), "on: every move's GIA tier is the joint step");
ok(on.c.acts.some(a => a.tierGia > 0 && a.real[2] < on.c.acts[0].real[2]), 'on: a move a step down runs the GIA at the lower tier\'s return');

// (3) the charge, by hand: the pension and ISA slices as before, the GIA slice with its dealing cost and CGT
{
  const c = on.c, t = 5;
  const ai = c.acts.findIndex(a => a.tierPen === 1 && a.tierIsa === 1 && a.tierGia === 1);
  const act = c.acts[ai];
  const s = new Float64Array(8); s[0] = 300000; s[1] = 150000; s[2] = 500000; s[3] = 0.4;
  c.last = { cgtExemptLeft: 3000, cgtBasicLeft: 10000 };
  const held = { pen: 0, isa: 0, gia: 0 };
  const dP = Math.abs(c.tiers.pen[1].equity - c.tiers.pen[0].equity), dI = Math.abs(c.tiers.isa[1].equity - c.tiers.isa[0].equity), dG = Math.abs(gl[1].equity - gl[0].equity);
  const gia = 500000 - Math.min(500000, c.yr.buffer[t]), slice = gia * dG, gain = slice * 0.4 - 3000;
  const want = 300000 * c.switchCost * dP + 150000 * c.switchCost * dI + slice * c.switchCost + 10000 * c.P.cgtBasicRate + (gain - 10000) * c.P.cgtHigherRate;
  const paid = F.chargeSwitch(c, s, held, act, t);
  ok(dG > 0 && Math.abs(paid - want) < 1e-6 && Math.abs(s[3] - 0.4 * (1 - dG)) < 1e-12,
    `the charge: GBP${Math.round(paid)} on a GBP${Math.round(gia / 1000)}k GIA with 40% gain (slice ${Math.round(100 * dG)}%), and the gain fraction falls by the share sold`);
  const s2 = new Float64Array(8); s2[2] = 500000; s2[3] = 0;
  const paid2 = F.chargeSwitch(c, s2, { pen: 1, isa: 1, gia: 0 }, act, t);
  ok(Math.abs(paid2 - slice * c.switchCost) < 1e-6, 'with no gain, a GIA-only switch costs its dealing charge alone');
  ok(F.chargeSwitch(c, s2, { pen: 1, isa: 1, gia: 1 }, act, t) === 0 && F.chargeSwitch(off.c, s2, { pen: 1, isa: 1 }, off.c.acts[ai], t) === 0, 'no switch, no charge; and off, the GIA is never charged');
}

// (4) a large unrealised gain: fewer GIA switches, run on the same paths
const onG = solve(E, M, planOf(0.4), { ...base, giaTiers: true });
const paths = E.pathsForSeed(7001, 60, m.ctx.totalYears);
const tally = (r) => { let ch = 0, yrs = 0, surv = 0; for (const zs of paths) { const o = runPolicy(r, zs); ch += o.giaChanges; yrs += o.giaYears; surv += o.survived ? 1 : 0; } return { ch: ch / paths.length, yrs: yrs / paths.length, surv }; };
const t0 = tally(on), t4 = tally(onG);
console.log(`      no gain: ${t0.ch.toFixed(2)} GIA switches and ${t0.yrs.toFixed(1)} years below its plan tier per path, ${t0.surv}/${paths.length} survive;  40% gain: ${t4.ch.toFixed(2)} switches, ${t4.yrs.toFixed(1)} years, ${t4.surv}/${paths.length}`);
ok(t0.ch > 0 && t0.yrs > 0, 'with no gain the GIA does move (the option is live on the forward run)');
ok(t4.ch <= t0.ch, 'with a 40% unrealised gain the GIA switches no more often than with none');

console.log(`\n${n} passed`);
