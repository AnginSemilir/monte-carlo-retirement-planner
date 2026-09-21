/*
 * PHASE 6: THE RISK TIER AS AN ACTION.
 *
 * Each move may also say which tier the pension and the ISA hold this year: the tier on Plan Inputs or
 * up to two below it, never above. Switching inside those wrappers is free and leaves no memory, so the
 * grid gains no dimension and a move's tier variants share its flow, differing only in growth. These
 * tests hold the plumbing to that description and put the cost of the extra moves on the record.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, runPolicy, buildActions, tierCombos } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));

console.log('=========== A. THE TIERS A WRAPPER MAY HOLD ===========');
{
  const sc = singles.find(s => s.plan.accounts.some(a => a.id === 'pen_self' && a.risk === 'High Risk')) || singles[0];
  const m = M.prepare(E, prep(sc.plan));
  const t = F.tiersFor(m);
  const pen = m.acc[m.ctx.owners[0].ids.pen];
  ok('A1  the plan\'s tier comes first, then two below it, never above', t.pen.length === 3 && t.pen[0].name === pen.risk && F.TIER_ORDER.indexOf(t.pen[1].name) === F.TIER_ORDER.indexOf(pen.risk) + 1 && F.TIER_ORDER.indexOf(t.pen[2].name) === F.TIER_ORDER.indexOf(pen.risk) + 2, t.pen.map(x => x.name).join(' > '));
  ok('A2  each tier below expects less and moves less', t.pen[0].real > t.pen[1].real && t.pen[1].real > t.pen[2].real && t.pen[0].vol > t.pen[1].vol && t.pen[1].vol > t.pen[2].vol, t.pen.map(x => `${(100 * x.real).toFixed(2)}%/${(100 * x.vol).toFixed(1)}%`).join(', '));
  const cashy = JSON.parse(JSON.stringify(sc.plan)); cashy.accounts.forEach(a => { if (a.id === 'isa_self') a.risk = 'Cash Equivalents'; });
  const m2 = M.prepare(E, prep(cashy));
  ok('A3  a wrapper already in cash has nothing below it', F.tiersFor(m2).isa.length === 1);
  ok('A4  the joint steps by default, every pair on request; a wrapper with nothing below it does not block the other', tierCombos(m).length === 3 && tierCombos(m, 'pairs').length === 9 && tierCombos(m2).length === 3 && tierCombos(m2, 'pairs').length === 3, `${tierCombos(m).map(x => x.join('')).join(' ')} | ${tierCombos(m2).map(x => x.join('')).join(' ')}`);
}

console.log('=========== B. TIER VARIANTS SHARE THE FLOW AND DIFFER ONLY IN GROWTH ===========');
{
  const sc = singles[Math.floor(singles.length / 2)];
  const m = M.prepare(E, prep(sc.plan));
  const combos = tierCombos(m, 'pairs');
  const acts = buildActions({ tiers: combos });
  ok('B1  the move list is the base moves times the tier combinations', acts.length === 24 * combos.length && buildActions().length === 24, `${acts.length}`);
  ok('B2  every variant names its base move, and the base holds the plan\'s tiers', acts.every(a => acts[a.tierBase].tierPen === 0 && acts[a.tierBase].tierIsa === 0 && acts[a.tierBase].steps.join() === a.steps.join() && acts[a.tierBase].harvest === a.harvest));
  const c = F.compile(m, acts);
  let rng = 777; const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };
  const spend = E.spendTargetAtAge(m.ctx, m.ctx.ageSelf0);
  let sameFlow = true, growsDiffer = 0, n = 0;
  for (let k = 0; k < 200; k++) {
    const t = Math.floor(rand() * (m.ctx.totalYears + 1));
    const ai = Math.floor(rand() * acts.length);
    const b = acts[ai].tierBase;
    const s0 = Float64Array.from([spend * Math.exp(rand() * 4 - 1), spend * Math.exp(rand() * 4 - 1), spend * Math.exp(rand() * 4 - 1), 0.2, 0, 0, -1]);
    const sA = Float64Array.from(s0), sB = Float64Array.from(s0);
    const uA = F.flow(c, t, ai, sA), uB = F.flow(c, t, b, sB);
    n++;
    if (Math.abs(uA - uB) > 1e-9 || sA.some((x, i) => Math.abs(x - sB[i]) > 1e-9)) sameFlow = false;
    if (ai !== b) { const gA = Float64Array.from(sA), gB = Float64Array.from(sB); const z = 1; const rA = new Float64Array(4), rB = new Float64Array(4);
      for (let i = 0; i < 4; i++) { rA[i] = Math.exp(Math.log(1 + c.acts[ai].real[i]) + c.acts[ai].volEff[i] * z) - 1; rB[i] = Math.exp(Math.log(1 + c.acts[b].real[i]) + c.acts[b].volEff[i] * z) - 1; }
      F.grow(c, t, gA, rA); F.grow(c, t, gB, rB); if (Math.abs(gA[0] - gB[0]) + Math.abs(gA[1] - gB[1]) > 1e-6) growsDiffer++; }
  }
  ok('B3  a variant\'s flow is its base move\'s flow, to the bit', sameFlow, `${n} positions`);
  ok('B4  ...and its growth is not', growsDiffer > 0, `${growsDiffer} of the variants tried grew differently`);
  ok('B5  the GIA and the cash keep the plan\'s rates in every variant', c.acts.every(a => a.real[2] === c.real[2] && a.real[3] === c.real[3] && a.volEff[2] === c.volEff[2]));
}

console.log('=========== C. THE SOLVE WITH TIERS ON: NO WORSE, AND ITS COST ===========');
{
  const picks = [singles[3], singles[Math.floor(singles.length * 0.6)]];
  let worse = 0, ratioMax = 0, used = 0;
  for (const sc of picks) {
    const plan = prep(sc.plan);
    const t0 = Date.now(); const a = solve(E, M, plan, { points: 16, skipLump: true }); const tA = Date.now() - t0;
    const t1 = Date.now(); const b = solve(E, M, plan, { points: 16, skipLump: true, tiers: true }); const tB = Date.now() - t1;
    const va = a.value(M.initialState(a.m), 0).score, vb = b.value(M.initialState(b.m), 0).score;
    if (vb < va - 1e-9) worse++;
    ratioMax = Math.max(ratioMax, tB / tA);
    const rs = E.pathsForSeed(31, 200, b.m.ctx.totalYears).map(z => runPolicy(b, z));
    used += rs.reduce((x, r) => x + r.tierPenYears + r.tierIsaYears, 0) / rs.length;
    console.log(`      ${sc.id} ${sc.name.slice(0, 30)}: value ${va.toFixed(4)} -> ${vb.toFixed(4)}, ${tA}ms -> ${tB}ms (${b.actions.length} moves), tier-down years ${ (rs.reduce((x, r) => x + r.tierPenYears, 0) / rs.length).toFixed(1)} pension / ${(rs.reduce((x, r) => x + r.tierIsaYears, 0) / rs.length).toFixed(1)} ISA a run`);
  }
  ok('C1  on the same grid, more moves never lower the opening value', worse === 0);
  ok('C2  the joint tier moves cost less than two and a half times the phase 2 solve (the flow is shared)', ratioMax < 2.5, `worst ${ratioMax.toFixed(2)}x; the gate\'s 1.5x is judged in the plan`);
  ok('C3  the forward run reports the years spent below the plan\'s tier', Number.isFinite(used));
}

console.log('=========== D. WHAT A TIER CHANGE COSTS ===========');
{
  const sc = singles[Math.floor(singles.length / 2)];
  const plan = prep(sc.plan);
  const m = M.prepare(E, plan);
  const c = F.compile(m, buildActions({ tiers: tierCombos(m, 'pairs') }));
  c.switchCost = F.SWITCH_COST;
  const s = Float64Array.from([400000, 200000, 50000, 0.2, 0, 0, -1]);
  const twoDown = c.acts.findIndex(a => a.tierPen === 2 && a.tierIsa === 0);
  const paid = F.chargeSwitch(c, s, { pen: 0, isa: 0 }, c.acts[twoDown]);
  const dEq = Math.abs(c.tiers.pen[2].equity - c.tiers.pen[0].equity);
  ok('D1  a two-tier step in the pension costs the round trip on the slice traded, and nothing on the ISA', Math.abs(paid - 400000 * F.SWITCH_COST * dEq) < 1e-6 && Math.abs(s[0] - (400000 - paid)) < 1e-6 && s[1] === 200000, `£${paid.toFixed(0)} on a £400k pension, ${(100 * dEq).toFixed(0)} points of equity traded`);
  ok('D2  staying put costs nothing', F.chargeSwitch(c, s, { pen: 2, isa: 0 }, c.acts[twoDown]) === 0);
  ok('D3  the cost is a quarter of a percent of the slice: at most a tenth of a percent of the pot for a two-tier step', F.SWITCH_COST === 0.0025 && paid / 400000 <= 0.001 + 1e-12, `${(100 * paid / 400000).toFixed(3)}% of the pot`);
  // with the cost on, the solved policy flips tiers less on the same paths and pays for the flips it makes
  const free = solve(E, M, plan, { points: 16, tiers: true, switchCost: 0 });
  const costed = solve(E, M, plan, { points: 16, tiers: true });
  const zs = E.pathsForSeed(41, 200, m.ctx.totalYears);
  const rf = zs.map(z => runPolicy(free, z)), rc = zs.map(z => runPolicy(costed, z));
  const mean = (rs, k) => rs.reduce((a, x) => a + x[k], 0) / rs.length;
  ok('D4  the default switching cost is on whenever tiers are, and off otherwise', costed.meta.switchCost === F.SWITCH_COST && free.meta.switchCost === 0 && solve(E, M, plan, { points: 16 }).meta.switchCost === 0);
  ok('D5  with the cost charged the policy pays for its flips and does not flip more', mean(rc, 'switchPaid') > 0 && mean(rc, 'tierChanges') <= mean(rf, 'tierChanges') + 0.5, `${mean(rf, 'tierChanges').toFixed(1)} -> ${mean(rc, 'tierChanges').toFixed(1)} changes a run; £${mean(rc, 'switchPaid').toFixed(0)} paid a run`);
  ok('D6  ...and keeps the survival the freedom bought', 100 * rc.filter(x => x.survived).length / rc.length >= 100 * rf.filter(x => x.survived).length / rf.length - 1, `${(100 * rf.filter(x => x.survived).length / rf.length).toFixed(1)} -> ${(100 * rc.filter(x => x.survived).length / rc.length).toFixed(1)}`);
  // the worth-it margin: a change is made only when the table's gain from it beats a tenth of a survival point
  ok('D7  the worth-it margin is on with tiers, a tenth of a survival point', costed.meta.switchMargin === 0.001 && free.meta.switchMargin === 0.001 && solve(E, M, plan, { points: 16 }).meta.switchMargin === 0);
  costed.switchMargin = 0;
  const rn = zs.map(z => runPolicy(costed, z));
  costed.switchMargin = 0.001;
  const sv = (rs) => 100 * rs.filter(x => x.survived).length / rs.length;
  ok('D8  with the margin the policy changes tier far less often on the same paths', mean(rc, 'tierChanges') < 0.75 * mean(rn, 'tierChanges'), `${mean(rn, 'tierChanges').toFixed(1)} -> ${mean(rc, 'tierChanges').toFixed(1)} changes a run`);
  ok('D9  ...and gives up no survival for it', sv(rc) >= sv(rn) - 0.5, `${sv(rn).toFixed(1)} -> ${sv(rc).toFixed(1)}`);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
