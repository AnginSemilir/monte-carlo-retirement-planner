/*
 * THE THIRD TIER STEP (STATE.md D28; THIRD-STEP.md step 2): `tiersBelow: 3`, a research option, off at 2. The joint step
 * takes the pension and the ISA a third tier down where both can (never into Cash Equivalents past the second step); a
 * household where either cannot keeps today's ladder exactly, tiers above included (the maintainer, 25 Oct).
 *   1. identity, the option unset: the tier lists of every single household, the solver's (tiersFor, with and without a tier
 *      above) and the engine's (tierProfiles under a table), the same as on the code before the edit (hashed there, 72b6ca8).
 *      The solves' own identity (tables, layers, the reference and the runs on S224 and S370 under SHIP and CAND) is
 *      results-tier-steps-identity.txt, by speed-timing.mjs on both codes;
 *   2. the ladder, with tiersBelow 3: a High Risk pension reads High, Medium/High, Medium, Medium/Low; a Medium/High ISA reads
 *      Medium/High, Medium, Medium/Low, Low; a household whose ISA sits at Medium Risk keeps today's ladder (no third step, no
 *      Cash Equivalents), and under a tier above keeps its tiers above at today's index; the engine's tierProfiles names are
 *      the table's at every index; tiersBelow 4 is refused;
 *   3. the engine and a forward run in step (V2's state check) on S370 with tiersBelow 3, every year a seeded random move over
 *      the whole menu so the new rung is taken: every slot within a pound; the years at the new rung counted, above zero;
 *   4. planted: the engine's list built with two below while the table has three (F2a's name check throws, or the state
 *      parts); the new rung grown at the second's rates in fast.js only (TIER_STEPS.plant 'rung3'): the state check parts; the
 *      Cash Equivalents stop removed (TIER_STEPS.plant 'nocashstop'), on a Medium Risk ISA: the ladder check fails.
 * By default the quick form (S370 at 4 paths); --full S370 and S248 at 20 paths.
 *   node research/tests/tier-steps.test.mjs [--full]
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solvePlan, runPolicy } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { modelStateOf, withTable } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const FULL = process.argv.includes('--full'), NP = FULL ? 20 : 4, SEED = 99004;
const H = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const norm = p => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const tableCtx = (plan, tiersBelow) => E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: () => null, switchCost: 0, ...(tiersBelow ? { tiersBelow } : {}) } } });

// 1. identity: the lists on the code before the edit (72b6ca8), hashed over the 210 single households
{
  const solver = [], above = [], engine = [];
  for (const h of all) {
    const plan = norm(h.plan);
    solver.push([h.id, F.tiersFor(M.prepare(E, plan))]);
    const mu = M.prepare(E, plan); mu.tiersAbove = 1; above.push([h.id, F.tiersFor(mu)]);
    engine.push([h.id, Object.fromEntries(Object.entries(tableCtx(plan).tierProfiles).map(([k, v]) => [k, v.map(x => [x.name, x.real, x.vol, x.sigmaParam, x.equityWeight])]))]);
  }
  const got = { solver: H(solver), above: H(above), engine: H(engine) }, want = { solver: 'f52eec9e5946c409', above: 'f258657a49f1a07d', engine: '51c8c846d3853e0b' };
  ok(all.length === 210 && got.solver === want.solver && got.above === want.above && got.engine === want.engine,
    `1  the option unset, every single household's tier lists the same as before (${all.length} households; the solver's ${got.solver}, with a tier above ${got.above}, the engine's ${got.engine})`);
}

// 2. the ladder, with tiersBelow 3
const acc = (id, owner, category, balance, risk, extra = {}) => ({ id, owner, category, balance, contrib: 0, growth: 0, risk, ...extra });
const BASE = {
  demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 66, terminalAge: 95, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976 },
  spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [acc('pen_self', 'Myself', 'Pensions', 300000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 100000, 'Medium/High Risk'), acc('cash_self', 'Myself', 'Cash Savings', 15000, 'Cash Equivalents')],
  config: { valuationDate: '2026-01-01' }
};
const withRisk = (pen, isa) => norm({ ...BASE, accounts: BASE.accounts.map(a => (a.id === 'pen_self' ? { ...a, risk: pen } : a.id === 'isa_self' ? { ...a, risk: isa } : a)) });
const names = l => l.map(x => x.name).join(' > ');
const ladder = (plan, below, above = 0) => { const m = M.prepare(E, plan); m.tiersBelow = below; if (above) m.tiersAbove = above; return F.tiersFor(m); };
const engineNames = (plan, below, ids = ['pen_self', 'isa_self']) => { const c = tableCtx(plan, below); return Object.fromEntries(ids.map(id => [id, c.tierProfiles[id].map(x => x.name)])); };
// the engine's names at each index the table's list has (the engine also lists every tier above after them, as today, where
// the solver lists them only under tiersAbove: a table never names those indices)
const sameAt = (eng, tab) => tab.every((x, i) => eng[i] === x.name);
const LADDER = () => {
  const out = [];
  const t = ladder(withRisk('High Risk', 'Medium/High Risk'), 3), e = engineNames(withRisk('High Risk', 'Medium/High Risk'), 3);
  out.push(['a High Risk pension reads High, Medium/High, Medium, Medium/Low', names(t.pen) === 'High Risk > Medium/High Risk > Medium Risk > Medium/Low Risk']);
  out.push(['a Medium/High ISA reads Medium/High, Medium, Medium/Low, Low', names(t.isa) === 'Medium/High Risk > Medium Risk > Medium/Low Risk > Low Risk']);
  out.push(["the engine's names the table's at every index the table has", sameAt(e.pen_self, t.pen) && sameAt(e.isa_self, t.isa)]);
  // an ISA at Medium Risk: the third step would be Cash Equivalents, so the household keeps today's ladder
  const t2 = ladder(withRisk('High Risk', 'Medium Risk'), 3), t0 = ladder(withRisk('High Risk', 'Medium Risk'), 2), e2 = engineNames(withRisk('High Risk', 'Medium Risk'), 3);
  out.push(["an ISA at Medium Risk: no third step, today's ladder (no Cash Equivalents)", names(t2.pen) === names(t0.pen) && names(t2.isa) === names(t0.isa) && !t2.isa.some(x => x.name === 'Cash Equivalents') && t2.pen.length === 3]);
  out.push(["and the engine's names the table's at every index the table has", sameAt(e2.pen_self, t2.pen) && sameAt(e2.isa_self, t2.isa)]);
  // under a tier above: a Medium/High pension and a Medium ISA keep their tiers above at today's index
  const t3 = ladder(withRisk('Medium/High Risk', 'Medium Risk'), 3, 1), t30 = ladder(withRisk('Medium/High Risk', 'Medium Risk'), 2, 1);
  out.push(['under a tier above, a household that cannot take the third step keeps its tiers above at today\'s index', names(t3.pen) === names(t30.pen) && names(t3.isa) === names(t30.isa) && t3.pen[3] && t3.pen[3].above === 1 && t3.isa[3] && t3.isa[3].above === 1]);
  return out;
};
for (const [what, good] of LADDER()) ok(good, `2  ${what}`);
{ let threw = ''; try { solvePlan(E, M, withRisk('High Risk', 'Medium/High Risk'), { lambda: 0.0223606797749979, points: 4, tiersBelow: 4, riskAbove: false }); } catch (e) { threw = e.message; }
  ok(/tiersBelow 4: only 2 or 3/.test(threw), `2  tiersBelow 4 is refused (${threw || 'no error'})`); }

// 3 and 4. the engine and a forward run in step with tiersBelow 3; the plants
const MONEY = [0, 1, 2, 4, 6, 11, 12, 13];
const gainOf = v => v[3] * (v[2] - v[12]);
const moveOf = (r, ai, code) => {
  const a = r.actions[ai], ca = r.c.acts[ai];
  return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump, sweepCash: a.sweepCash !== false,
    spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, ...(a.cgtSale ? { cgtSale: true } : {}), tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code,
    tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name };
};
const rng = seed => { let x = seed >>> 0; return () => { x = (x + 0x6D2B79F5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const lockstep = (id, plant = '', engineBelow = null) => {
  F.TIER_STEPS.plant = plant;
  try {
    const h = all.find(s => s.id === id), plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
    const r = solvePlan(E, M, plan, { lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, tiersBelow: 3, riskAbove: false });
    const T = r.m.ctx.totalYears, paths = E.pathsForSeed(SEED, NP, T).map(z => Float64Array.from(z));
    const base = withTable(r.m.ctx.plan, r), real = base.spending.policyOverride;
    let recs = null, worst = 0, worstAt = '', years = 0, atNew = 0;
    const pol = { ...real, ...(engineBelow ? { tiersBelow: engineBelow } : {}), choose(st, t, held) {
      const want = real.choose(st, t, held), rec = recs[t];
      if (!rec) return want;
      const e = vecOf(r.m, modelStateOf(st));
      for (const k of MONEY) { const gap = Math.abs((e[k] || 0) - (rec.s[k] || 0)); if (!(gap <= worst)) { worst = gap; worstAt = `${id} year ${t} slot ${k}`; } }
      const gg = Math.abs(gainOf(e) - gainOf(rec.s)); if (!(gg <= worst)) { worst = gg; worstAt = `${id} year ${t} gain held`; }
      const tp = held ? held.pen : 0; if (tp !== rec.held.pen) { worst = Infinity; worstAt = `${id} year ${t} tier held`; }
      years++;
      return moveOf(r, rec.ai, 'forced');
    } };
    const ctx = E.buildContext({ ...base, spending: { ...base.spending, policyOverride: pol } });
    const zPathOf = zs => (zs.length > T + 1 ? zs[T + 1] : 0);
    for (let i = 0; i < paths.length; i++) {
      const R = rng(SEED + 7919 * i), seq = [];
      for (let t = 0; t <= T; t++) seq[t] = Math.floor(R() * r.actions.length);
      recs = [];
      runPolicy(r, paths[i], { choose: t => seq[t], visit: (t, s, held, ai) => { recs[t] = { s: Float64Array.from(s), held: { pen: held.pen, isa: held.isa }, ai }; if (r.c.acts[ai].tierPen === 3) atNew++; } });
      const st = E.freshState(ctx);
      for (let t = 0; t <= T; t++) E.stepYear(ctx, st, t, { z: paths[i][t], zPath: zPathOf(paths[i]) });
    }
    return { worst, worstAt, years, atNew, tiers: r.c.tiers.pen.map(x => x.name).join(' > '), threw: '' };
  } catch (e) { return { worst: Infinity, worstAt: '', years: 0, atNew: 0, tiers: '', threw: e.message }; } finally { F.TIER_STEPS.plant = ''; }
};
for (const id of FULL ? ['S370', 'S248'] : ['S370']) {
  const o = lockstep(id);
  ok(!o.threw && o.worst <= 1 && o.atNew > 0, `3  ${id} with tiersBelow 3 (pension ${o.tiers}): the engine and a forward run in step over ${o.years} years of ${NP} paths, the largest gap £${o.worst.toExponential(2)} (${o.worstAt || 'none'}); years at the new rung ${o.atNew}${o.threw ? `; THREW ${o.threw}` : ''}`);
}
{
  const a = lockstep('S370', '', 2);
  ok(a.threw || a.worst > 1, `4  planted: the engine's list built with two below while the table has three: ${a.threw ? `it throws (${a.threw.slice(0, 120)})` : `the state parts by £${a.worst.toFixed(2)}`}`);
  const b = lockstep('S370', 'rung3');
  ok(!b.threw && b.worst > 1, `4  planted: the new rung grown at the second's rates in fast.js only: the state parts by £${b.worst.toFixed(2)} (${b.worstAt})`);
  F.TIER_STEPS.plant = 'nocashstop';
  let caught = false;
  try { caught = LADDER().some(([, good]) => !good); } finally { F.TIER_STEPS.plant = ''; }
  ok(caught, `4  planted: the Cash Equivalents stop removed, the ladder check fails on the Medium Risk ISA`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
