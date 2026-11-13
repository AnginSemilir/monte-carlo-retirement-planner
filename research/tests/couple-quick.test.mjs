/*
 * PART D, D1: THE COUPLES' ROLLOUT'S THREE GAPS (the launch plan's section 6; the archive's M4), its quick form. FAST_JOINING
 * (run-all.mjs) names it, so it runs in the fast tier as it exists (B8, D53), and moves into FAST at the next unlock.
 * One library couple (S007; never anybody's own plan), its two tables at light settings with the menu's spending levels, a
 * dial setting and seven quadrature nodes; three paths of seed 31.
 *   1. the year at the move's level: the exact model (model.js, the couples' year) spends the scheduled target times the
 *      move's level, as the engine's year does; before D1 it spent the target whatever the level, so a couple's rollout
 *      chose a level its own year ignored (plant 'nolevel');
 *   2. the quadrature: the rollout's expectation takes the tables' own nodes (seven here), not five fixed ones (plant
 *      'fivenodes');
 *   3. the cut term: this year's cut is the two tables' own cost of the household's level, averaged (lambda x (1 - level)^2
 *      below the target, a raise's credit above it), and the years ahead are the two tables' expected future cut cost,
 *      averaged, in the value and in the joint move's score (plant 'nocut');
 *   4. the household's level: each joint candidate tries the level of either person's ranked move, and the rollout picks
 *      the best of them all; on these paths some years take a level only the second person's moves proposed (plant
 *      'firstlevel');
 *   5. the singles' tables are the code before D1's, bit for bit: S116 at the library sweep's light settings, its tables'
 *      digest the one taken on b4ea006 (Part D's rule: no single's number moves mid-beta);
 *   6. the dial reaches couples: with the cut term the household spends higher than without it (it needs checks 3's term
 *      and 4's levels both: plants 'nocut' and 'firstlevel').
 * The oracles below re-derive each figure from the tables' own reads (value(), readValues' cut table, costOf's curve), not
 * through couple.js; those of checks 3 and 4 take the tables' own nodes, as D1's rule does, so 'fivenodes' fails them too.
 *   node research/tests/couple-quick.test.mjs [--plants]
 *   COUPLE_PLANT=nocut|firstlevel|fivenodes|nolevel node research/tests/couple-quick.test.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { productLevels, rankActions, PRODUCT_BASELINE, NODES, WEIGHTS } from '../../src/solver/solve.js';
import { solveCouple, chooseJoint, expectedValue, cutCostOf, ratesFor, ownerState, COUPLE } from '../../src/solver/couple.js';
import { vecOf, readValues } from '../../src/solver/grid.js';
import { foldedVol } from '../../src/solver/fast.js';
import { solveForApp } from '../../src/solverApp.js';
import { tablesOf, digestOf, sizeOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const SELF = fileURLToPath(import.meta.url);
// each plant puts one gap back as the code before D1 had it; the checks each must fail (the rest pass)
const PLANTS = { nolevel: [1], fivenodes: [2, 3, 4], nocut: [3, 4, 6], firstlevel: [4, 6] };
if (process.argv.includes('--plants')) {
  let bad = 0;
  for (const [p, want] of Object.entries(PLANTS)) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_PLANT: p }, encoding: 'utf8' });
    const failed = [...r.stdout.matchAll(/^ {2}FAIL (\d+)\./gm)].map(m => Number(m[1]));
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    if (!exact) bad++;
    console.log(`  plant ${p.padEnd(10)} fails ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
  }
  console.log(bad ? `\n${bad} plant(s) not exact` : '\nall plants exact');
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.COUPLE_PLANT || '';
if (PLANT === 'nolevel') M.MODEL.plant = 'nolevel'; else COUPLE.plant = PLANT;

let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}. ${label}${detail ? '   ' + detail : ''}`); if (c) passed++; else failed++; };
let CHECK6 = null;
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-12, Math.abs(a), Math.abs(b));

// the fixture: S007, its tables at light settings with the menu's levels (the floor at 80%), a dial setting, seven nodes
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode !== 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(couples.find(s => s.id === 'S007').plan);
const LAMBDA = 0.05, MU = PRODUCT_BASELINE.raiseWeight;
const t0 = Date.now();
const cp = solveCouple(E, M, plan, { ...PRODUCT_BASELINE, mix: 0, points: 6, spendLevels: productLevels(0.8), lambda: LAMBDA, quadNodes: 7 });
const A = cp.tables.self, B = cp.tables.part, m = cp.m, T = m.ctx.totalYears;
console.log(`S007: two tables at 6 points, levels ${A.meta.spendLevels.join('/')}, lambda ${LAMBDA}, ${A.quadNodes.length} nodes, solved in ${((Date.now() - t0) / 1000).toFixed(1)}s${PLANT ? `; planted: ${PLANT}` : ''}`);

// ---- the oracles: each figure from the tables' own reads ----
const RD = new Float64Array(4);
const cutRead = (tab, s, k) => { readValues(tab.g, tab.lsurv[k], tab.beq[k], s, RD, tab.lresil[k], tab.short[k], k); return RD[3]; };
function oracleValue(post, t, nodes, weights, withCut) {
  let total = 0, both = 0;
  for (let k = 0; k < weights.length; k++) {
    const rates = {};
    m.ctx.accounts.forEach(a => { const vol = A.c.shiftMode ? a.vol : foldedVol(a.vol, a.sigmaParam, T - t + 1); rates[a.id] = Math.exp(Math.log(1 + a.real) + vol * nodes[k]) - 1; });
    const g = M.cloneState(post); M.grow(m, g, t, rates);
    const sA = vecOf(A.m, ownerState(g, 'self')), sB = vecOf(B.m, ownerState(g, 'part'));
    const vA = A.value(sA, t + 1), vB = B.value(sB, t + 1);
    const h = withCut ? (cutRead(A, sA, Math.min(t + 1, T)) + cutRead(B, sB, Math.min(t + 1, T))) / 2 : 0;
    total += weights[k] * (vA.survival * vB.survival + A.wR * vA.resilience * vB.resilience + A.wB * (vA.bequest + vB.bequest) - h);
    both += weights[k] * vA.survival * vB.survival;
  }
  return { total, both };
}
// the household's cut this year by hand: lambda x (1 - level)^2 below the target, the raise credit mu x sqrt(min(0.2, level - 1)) above
const cutHand = (level, t) => {
  const one = (tab) => (tab.c.yr.spend[t] > 0 ? (level < 1 ? LAMBDA * (1 - level) ** 2 : level > 1 ? -MU * Math.sqrt(Math.min(0.2, level - 1)) : 0) : 0);
  return (one(A) + one(B)) / 2;
};
const lvlOf = (tab, i) => tab.levelOf[i];
function jointOf(ia, ib, split, level) {
  const aA = A.actions[ia], aB = B.actions[ib];
  return { steps: aA.steps, costSteps: aA.costSteps || aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa', sweepCash: true, ...(aA.sweepIsa ? { sweepIsa: true } : {}), lump: !!aA.lump, contrib: null, spendLevel: level, split,
    perOwner: { self: { steps: aA.steps, harvest: !!aA.harvest, harvestCeil: aA.harvestCeil || 'pa' }, part: { steps: aB.steps, harvest: !!aB.harvest, harvestCeil: aB.harvestCeil || 'pa' } }, ia, ib };
}
// the D1 rule's score of one joint candidate (null where it does not fund the year)
function oracleScore(state, t, j) {
  const st = M.cloneState(state), row = M.step(m, st, j, t, null, true);
  if (row.unmetDemand > 1 || row.preNmpaInsolvent) return null;
  const cst = cutHand(j.spendLevel, t), rz = A.raiseSurvival && cst < 0;
  if (t >= T) { const tot = Object.values(st.pots).reduce((a, b) => a + b, 0), alive = tot >= (m.ctx.solvencyFloor || 0) ? 1 : 0; return alive + 1e-9 * tot - (rz ? cst * alive : cst); }
  const v = oracleValue(st, t, A.quadNodes, A.quadWeights, true);
  return v.total - (rz ? cst * v.both : cst);
}

// ---- 1. the year at the move's level ----
{
  const tR = Math.max(1, ...m.ctx.owners.map(o => o.retireAge - (o.key === 'self' ? m.ctx.ageSelf0 : m.ctx.agePart0) + 1));
  const base = M.initialState(m); const own = M.actionFromContext(m.ctx);
  for (let k = 0; k < tR; k++) M.step(m, base, own, k);
  const at = (level) => { const st = M.cloneState(base); return M.step(m, st, { ...own, spendLevel: level }, tR, null, true).targetSpend; };
  const s1 = at(1), s9 = at(0.9), s11 = at(1.1), sched = E.spendTargetAtAge(m.ctx, m.ctx.ageSelf0 + tR) * (tR === 0 ? m.ctx.yf : 1);
  ok(1, 'the exact model spends the scheduled target times the move\'s level, as the engine\'s year does',
    rel(s1, sched) < 1e-12 && rel(s9, 0.9 * sched) < 1e-12 && rel(s11, 1.1 * sched) < 1e-12,
    `year ${tR}: target £${Math.round(sched)}; at 1 £${Math.round(s1)}, at 0.9 £${Math.round(s9)}, at 1.1 £${Math.round(s11)}`);
}

// the decisions along three paths: each year's position, the rollout's pick and the oracle's
const zs = E.pathsForSeed(31, 3, T);
const decisions = [];
for (const z of zs) {
  const st = M.initialState(m);
  for (let t = 0; t <= T; t++) {
    decisions.push({ t, state: M.cloneState(st) });
    const j = chooseJoint(cp, st, t);
    const row = M.step(m, st, j, t, ratesFor(m, z, t));
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
  }
}

// ---- 2. the quadrature ----
{
  let worst = 0, apart5 = 0, n = 0;
  for (const d of decisions.filter(x => x.t < T).slice(0, 40)) {
    const j = chooseJoint(cp, d.state, d.t), st = M.cloneState(d.state);
    M.step(m, st, j, d.t, null, true);
    // the cut held out on both sides, so this reads the nodes alone (check 3 reads the cut)
    const was = COUPLE.plant; COUPLE.plant = [was, 'nocut'].filter(Boolean).join(',');
    const v = expectedValue(cp, st, d.t); COUPLE.plant = was;
    const o7 = oracleValue(st, d.t, A.quadNodes, A.quadWeights, false).total, o5 = oracleValue(st, d.t, NODES, WEIGHTS, false).total;
    worst = Math.max(worst, rel(v, o7)); apart5 = Math.max(apart5, Math.abs(o7 - o5)); n++;
  }
  ok(2, `the expectation takes the tables' own ${A.quadNodes.length} nodes, not five fixed ones`, worst < 1e-12 && apart5 > 1e-9,
    `${n} positions: against the ${A.quadNodes.length}-node oracle, the largest relative gap ${worst.toExponential(2)}; the five-node oracle apart by up to ${apart5.toExponential(2)}`);
}

// ---- 3. the cut term ----
{
  const tS = decisions.find(d => A.c.yr.spend[d.t] > 0 && B.c.yr.spend[d.t] > 0 && d.t < T).t;
  const curve = [0.8, 0.9, 0.95, 1, 1.1, 1.2].map(L => rel(cutCostOf(cp, L, tS), cutHand(L, tS)) < 1e-12 || (cutCostOf(cp, L, tS) === 0 && cutHand(L, tS) === 0));
  let worst = 0, live = 0, scoreGap = 0, cutLv = 0, noLv = 0, n = 0;
  for (const d of decisions) {
    const j = chooseJoint(cp, d.state, d.t);
    const os = oracleScore(d.state, d.t, jointOf(j.ia, j.ib, j.split, j.spendLevel));
    scoreGap = Math.max(scoreGap, os === null ? Infinity : rel(j.score, os));
    if (d.t < T) {
      const st = M.cloneState(d.state); M.step(m, st, j, d.t, null, true);
      const o = oracleValue(st, d.t, A.quadNodes, A.quadWeights, true).total, oNo = oracleValue(st, d.t, A.quadNodes, A.quadWeights, false).total;
      // the cut table is signed (a cut a cost, a raise a credit), so the term is live where it is apart from nothing either way
      worst = Math.max(worst, rel(expectedValue(cp, st, d.t), o)); live = Math.max(live, Math.abs(oNo - o));
    }
    const was = COUPLE.plant; COUPLE.plant = [was, 'nocut'].filter(Boolean).join(',');
    const j0 = chooseJoint(cp, d.state, d.t); COUPLE.plant = was;
    cutLv += j.spendLevel; noLv += j0.spendLevel; n++;
  }
  ok(3, 'the cut term: this year\'s cut at the tables\' own curve, the years ahead from their cut tables, in the value and the score',
    curve.every(Boolean) && worst < 1e-12 && live > 1e-6 && scoreGap < 1e-12,
    `year ${tS}: the curve by hand at 6 levels ${curve.filter(Boolean).length}/6; the value against the oracle ${worst.toExponential(2)}, its cut ahead up to ${live.toExponential(2)}; the score against the oracle ${scoreGap.toExponential(2)} (${n} decisions)`);
  CHECK6 = { cutLv: cutLv / n, noLv: noLv / n, n };
}

// ---- 4. the household's level ----
{
  let same = 0, fromB = 0, n = 0;
  for (const d of decisions) {
    const sA = vecOf(A.m, ownerState(d.state, 'self')), sB = vecOf(B.m, ownerState(d.state, 'part'));
    const kA = rankActions(A, sA, d.t, null, cp.topK), kB = rankActions(B, sB, d.t, null, cp.topK);
    let best = null, bestScore = -Infinity;
    for (const split of cp.splits) for (const ia of kA) for (const ib of kB) for (const L of [...new Set([lvlOf(A, ia), lvlOf(B, ib)])]) {
      const j = jointOf(ia, ib, split, L), sc = oracleScore(d.state, d.t, j);
      if (sc !== null && sc > bestScore) { bestScore = sc; best = j; }
    }
    const j = chooseJoint(cp, d.state, d.t);
    if (best && j.ia === best.ia && j.ib === best.ib && j.split === best.split && j.spendLevel === best.spendLevel) same++;
    if (best && !kA.map(i => lvlOf(A, i)).includes(best.spendLevel)) fromB++;
    n++;
  }
  ok(4, 'the household\'s level from either person\'s ranked move: the rollout\'s pick is the best of every candidate, both levels tried',
    same === n && fromB > 0, `${same} of ${n} decisions the oracle's pick; ${fromB} take a level only the second person's moves proposed`);
}

// ---- 5. the singles' tables ----
{
  // S116, the code before D1 (b4ea006), re-taken on item 3's (D69: b954f145878ff460...), and on D73's candidate (11 Nov, D81 (A), D83: the
  // sweep to the ISA and the solve on anchors move a single's tables; with both keys out the solve gives item 3's figure, results-d73-digests.txt)
  // re-taken again (81e774a399c6b29e...): 12 Nov, the ceiling on the year's whole taxable income (ANSWERS.md section 5; D91, D93's unlock): S116's dividends count
  // towards its allowance's ceiling; with the ceiling's one function switched off the solve gives the figure before, results-harvest-ceiling.txt
  const BEFORE = 'e6548bee07f4aec4cf18b15a0ce567368789fe361307e68fc152ec6aab0ffed3';
  const t1 = Date.now();
  const r = solveForApp(E, M, E.normalizePlan(buildScenarios().find(s => s.id === 'S116').plan), { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } });
  const tabs = tablesOf(r), dg = await digestOf(tabs);
  ok(5, 'a single\'s tables are the code before D1\'s, bit for bit', dg === BEFORE, `S116 at the sweep's light settings: ${dg.slice(0, 16)} (${sizeOf(tabs).values} values, ${((Date.now() - t1) / 1000).toFixed(1)}s) against ${BEFORE.slice(0, 16)}`);
}

// ---- 6. the dial reaches couples (from check 3's decisions) ----
ok(6, 'the dial reaches couples: with the cut term the household spends higher than without it', CHECK6.cutLv > CHECK6.noLv,
  `the mean level ${CHECK6.cutLv.toFixed(3)} with the term, ${CHECK6.noLv.toFixed(3)} without (${CHECK6.n} decisions)`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
