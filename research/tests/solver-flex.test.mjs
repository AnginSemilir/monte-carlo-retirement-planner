/*
 * FLEXIBLE SPENDING IN THE REDUCED MODEL (plan Phase 2d, a first cut of Gate 13).
 *
 * The household names a target, a floor and a confidence; the solver trims within them. What must hold:
 * with no floor the solve is the phase 2 solve to the bit; with a floor the landed policy meets the
 * confidence on held-out paths; a heavier penalty on trimming trims less; the cash buffer never follows
 * the trim (the buffer trap); and the bisection is bounded.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, solveFlex, runPolicy, spendLevelsFor, buildActions } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const at = (id) => singles.find(s => s.id === id);
const variant = (p, floorFrac, conf) => { const raw = JSON.parse(JSON.stringify(p)); const target = E.num(raw.spending.targetSpend, 0); return E.resolveMpaa(E.normalizePlan({ ...raw, config: { ...raw.config, guardrails: false, lookaheadYears: 0 }, spending: { ...raw.spending, floorSpend: Math.round(target * floorFrac), floorConfidence: conf * 100 } })); };
const POINTS = 20;

console.log('=========== A. THE LEVELS ===========');
ok('A1  no floor, one level', spendLevelsFor(0).join() === '1' && spendLevelsFor(1).join() === '1');
ok('A2  a floor at 80%: the plan, two trims, the gentle step and the floor, never below it', spendLevelsFor(0.8).join() === '1,0.95,0.9,0.8', spendLevelsFor(0.8).join());
ok('A3  a floor at 92% drops the levels below it and keeps the floor itself', spendLevelsFor(0.92).join() === '1,0.95,0.92', spendLevelsFor(0.92).join());
ok('A4  the move list is the base moves times the levels', buildActions({ spendLevels: [1, 0.9] }).length === 48 && buildActions().length === 24);

console.log('=========== B. NO FLOOR IS THE PHASE 2 SOLVE, TO THE BIT ===========');
{
  const plan = variant(at('S004').plan, 1, 0.9);
  const m = M.prepare(E, plan);
  const a = solve(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum });
  const b = solveFlex(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum, searchPaths: 200 });
  let same = true; for (let t = 0; t <= m.ctx.totalYears && same; t++) for (let i = 0; i < a.surv[t].length; i++) if (a.surv[t][i] !== b.surv[t][i] || a.pol[t][i] !== b.pol[t][i]) { same = false; break; }
  ok('B1  the flexible solve with no floor reproduces the plain solve exactly', same && b.meta.landed === 'no floor');
}

console.log('=========== C. A FLOOR: THE LANDED POLICY MEETS THE CONFIDENCE ===========');
{
  const plan = variant(at('S004').plan, 0.8, 0.95);   // fixed-target survival about 91, so 95 needs trimming and is reachable
  const m = M.prepare(E, plan);
  const t0 = Date.now();
  const r = solveFlex(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum, searchPaths: 400, seed: 7001 });
  const held = E.pathsForSeed(7002, 800, m.ctx.totalYears);
  const rs = held.map(z => runPolicy(r, z));
  const floorRate = 100 * rs.filter(x => x.survived).length / rs.length;
  const full = 100 * rs.filter(x => x.fullyFunded).length / rs.length;
  ok('C1  the bisection lands', r.meta.landed === 'landed', `${r.meta.landed}, lambda ${r.lambda.toExponential(2)}, ${r.meta.solves} solves in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  ok('C2  ...within eight solves', r.meta.solves <= 8);
  ok('C3  held-out floor rate meets the confidence within a point', floorRate >= 95 - 1, `${floorRate.toFixed(1)} on held-out paths, ${(100 * r.floorRate).toFixed(1)} on search paths`);
  ok('C4  the fully-funded rate is below the floor rate: the plan trims, and says so', full < floorRate, `fully funded ${full.toFixed(1)}`);
  ok('C5  every path spends at or above the floor in every year it is solvent', rs.every(x => !x.survived || x.minLevel >= 0.8 - 1e-9));
  // the penalty is monotone: a heavier penalty on trimming trims less
  const heavy = solve(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum, spendLevels: spendLevelsFor(0.8), lambda: r.lambda * 4 });
  const light = solve(E, M, plan, { points: POINTS, lump: m.ctx.fullLumpSum, spendLevels: spendLevelsFor(0.8), lambda: r.lambda / 4 });
  const yat = (rr) => { const a = held.map(z => runPolicy(rr, z)).map(x => x.atTarget / Math.max(1, x.spendYears)).sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
  const yH = yat(heavy), yL = yat(light);
  ok('C6  a heavier penalty on trimming trims less', yH >= yL, `years at target: heavy ${yH.toFixed(2)}, light ${yL.toFixed(2)}`);
}

console.log('=========== D. THE BUFFER TRAP ===========');
{
  const a = F.compile(M.prepare(E, variant(at('S004').plan, 1, 0.9)), buildActions());
  const b = F.compile(M.prepare(E, variant(at('S004').plan, 0.8, 0.9)), buildActions({ spendLevels: spendLevelsFor(0.8) }));
  let same = true; for (let t = 0; t < a.yr.buffer.length; t++) if (a.yr.buffer[t] !== b.yr.buffer[t]) same = false;
  ok('D1  the cash buffer is sized on the plan\'s target whether or not there is a floor', same);
}

console.log('=========== E. RAISES ABOVE THE TARGET (plan 2d.4) ===========');
{
  // a comfortable household: with no credit the solver never spends above the plan even when the level is on
  // the menu; with the credit on it does, only after good years, and the floor rate still lands
  const sc = singles.find(x => x.id === 'S100') || singles[0];
  const base = JSON.parse(JSON.stringify(sc.plan));
  const target = E.num(base.spending.targetSpend, 0);
  const plan = E.resolveMpaa(E.normalizePlan({ ...base, config: { ...base.config, guardrails: false, lookaheadYears: 0 }, spending: { ...base.spending, floorSpend: Math.round(target * 0.8), floorConfidence: 90 } }));
  const m = M.prepare(E, plan);
  const held = E.pathsForSeed(9002, 400, m.ctx.totalYears);
  const stats = (r) => { const rs = held.map(z => runPolicy(r, z)); return { floor: 100 * rs.filter(x => x.survived).length / rs.length, above: rs.reduce((a, x) => a + x.aboveTarget, 0) / rs.length, changes: rs.reduce((a, x) => a + x.changes, 0) / rs.length }; };
  const common = { points: 16, lump: m.ctx.fullLumpSum, searchPaths: 300, seed: 9001, confidence: 0.9, bisectSteps: 4, spendLevels: [1.2, 1.1, 1, 0.9, 0.8] };
  const offR = solveFlex(E, M, plan, { ...common, raiseWeight: 0 });
  const off = stats(offR);
  ok('E1  with no credit, the raise levels leave the menu: the true objective never wants them', off.above === 0 && offR.meta.spendLevels.every(l => l <= 1), `above-target years ${off.above.toFixed(2)}, levels ${offR.meta.spendLevels.join('/')}`);
  const on = solveFlex(E, M, plan, { ...common, raiseWeight: 0.1 });
  const onS = stats(on);
  ok('E2  with the credit on, the solver spends above the target in some years', onS.above > 0, `above-target years ${onS.above.toFixed(2)} a run, ${on.meta.landed}`);
  ok('E3  ...and the floor rate still lands on the confidence within two points', onS.floor >= 90 - 2, `${onS.floor.toFixed(1)}`);
  ok('E4  the credit is bounded: a 30% raise earns the same as a 20% one', Math.abs(on.costOf(1.3) - on.costOf(1.2)) < 1e-12 && on.costOf(1.1) < 0 && on.costOf(1.2) < on.costOf(1.1));
  ok('E5  ...and concave: the second 10% earns less than the first', -on.costOf(1.1) > -(on.costOf(1.2) - on.costOf(1.1)));
}

console.log(`\n=========== ${passed} passed, ${failed} failed ===========`);
process.exit(failed ? 1 : 0);
