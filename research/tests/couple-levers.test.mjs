/*
 * PART D, D3: THE LEVERS FOR COUPLES (the launch plan's section 6, D3: "the dial, through D1's cut term; B3's variant, with the
 * age weights, if chosen, on the chance that at least one partner is alive; the candidate's tiers locked per person; consent;
 * the locks per person; the lever matrix (L3) for couples"). The design is the singles' (research/tests/lever-matrix.mjs
 * allPairs: every pair of settings across the levers and locks, the dial's four positions in both variants among them) on two
 * library couples (S007: the first person retired, the second a year from it; S127: both retiring before their pensions open;
 * never anybody's own plan), each person's table solved as a single's is (src/solverApp.js solveForApp on their own plan, the
 * library sweep's light settings), the household run by the couples' rollout (src/solver/couple.js). Checks:
 *   1. the design covers every pair;
 *   2. each combination solves without a throw, and holds:
 *      - each person's run record: lambda the dial's; ageWeight as the variant and position set it, with the other person's
 *        age (the chance either lives), absent at position 1; spendLevels with the floor's 0.8; above position 1, the base the
 *        person's plan at the dial at 1 (its lambda the dial's at 1) with the position's estate weight, and the lock on it
 *        where the base has a tier state;
 *      - the dial above 1 with a tier state: at every decision of the first 20 paths, each person's tier pair the one their
 *        base's chooser picks where they stand, with the tiers they hold;
 *      - on 100 engine paths of the solved couple (withCouple): consent withdrawn, each person's own tiers every year; raises
 *        blocked, no year above target; and each lock, for each person: no pension drawn before its age, no pension or ISA
 *        tier riskier than the ceiling, never a full lump, or each person's full lump from their first open year;
 *   3. the age weights on the chance either lives: on a B3a position, each person's weights 1 - (1 - w_self)(1 - w_other) by
 *      hand from the two ages, the two tables' the same;
 *   4. planted, each must fail: the lock dropped in the rollout (COUPLE.plant 'nolock'); the age weights each person's own
 *      (no partner's age); the base solved with the other estate weight; the floor at 0.
 *   node research/tests/couple-levers.test.mjs [--paths N] [--rows i,j,...]
 */
// e3pcls guard: the solves below go through solveForApp on this code (the app's path); e3pcls's own exactness is solver-e3pcls.test.mjs's
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { chooseAction, solvePlan, coarseWhereFits } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { solveCouple, singlePlanFor, ownerState, chooseJoint, ratesAt, withCouple, COUPLE } from '../../src/solver/couple.js';
import { solveForApp, appPlan, prepareForSolve, lockedPlan, aimsOptions, APP_CANDIDATE, APP_AGE_WEIGHT, APP_LAMBDA, dialOf } from '../../src/solverApp.js';
import { allPairs, coversAllPairs, FACTORS } from './lever-matrix.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const args = process.argv.slice(2);
const at = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const NP = /^\d+$/.test(at('--paths') || '') ? Number(at('--paths')) : 100;
const ONLY = at('--rows') ? at('--rows').split(',').map(Number) : null;
const OPTS = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const RISK = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
const WHO = ['self', 'part'];

let passed = 0, failed = 0;
const ok = (c, msg) => { if (c) { passed++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const t00 = Date.now();

// ---- 1. the design: the singles' factors, the households two couples, the minimum pot at a couple's scale ----
const CFACTORS = FACTORS.map(([k, lv]) => (k === 'household' ? [k, ['S007', 'S127']] : k === 'minpot' ? [k, [0, 80000]] : [k, lv]));
const rows = allPairs(CFACTORS), gap = coversAllPairs(rows, CFACTORS);
ok(!gap, `1. the design: ${rows.length} combinations, every pair of settings covered${gap ? ` (missing ${gap})` : ''}`);

const library = buildScenarios();
/* the household's plan a combination asks for, as the solver takes it (prepareForSolve: the locks applied, the floor) */
function planOf(c) {
  const raw = library.find(s => s.id === c.household).plan, d = E.normalizePlan(raw).demographics;
  const later = Math.max(E.num(d.privatePensionAge, 58), E.num(d.currentAgeSelf, 0), E.num(d.currentAgePart, 0)) + 2;
  return {
    ...raw, config: { ...raw.config, solvencyFloor: c.minpot },
    solver: {
      aims: { cuts: c.dial, estate: c.estate, raises: c.raises, riskConsent: c.consent },
      locks: { pensionBefore: c.pensionBefore === 'later' ? later : null, tierCeiling: { pen: c.ceiling, isa: null }, lumpSum: c.lumpSum }
    }
  };
}
const label = c => `${c.household} dial ${c.dial}${c.dial > 1 ? ` ${c.variant}` : ''}, estate ${c.estate}, raises ${c.raises}, consent ${c.consent ? 'yes' : 'no'}, min pot ${c.minpot}, pension ${c.pensionBefore || 'free'}, ceiling ${c.ceiling || 'none'}, lump ${c.lumpSum}`;
/* the couple's solve: each person's table by solveForApp, told the other's age; `one` overrides a person's solve (the plants) */
function solveOf(c, one = null) {
  const plan = planOf(c), hp = appPlan(E, prepareForSolve(E, plan));
  const solveOne = one || ((p, o) => solveForApp(E, M, p, { ...OPTS, variant: c.variant, ageWith: o.partnerAge0 }));
  return { plan, hp, cp: solveCouple(E, M, hp, { solveOne }) };
}
const compsOf = (tab) => (tab.mix ? tab.mix.tables : [tab]);
const tiered = (tab) => !!(tab.meta && tab.meta.tierState);

/* every check of a combination on its solve; returns the failures (empty: all hold) */
function checkCombo(c, { hp, cp }, { expectWith = true } = {}) {
  const bad = [], dial = dialOf(E.normalizePlan(planOf(c)));
  const ages = { self: cp.m.ctx.ageSelf0, part: cp.m.ctx.agePart0 }, other = { self: 'part', part: 'self' };
  // each person's run record
  for (const who of WHO) {
    const r = cp.tables[who], mt = r.meta;
    if (Math.abs(mt.lambda - APP_LAMBDA * dial) > 1e-12) bad.push(`${who}: lambda ${mt.lambda} where the dial asks ${APP_LAMBDA * dial}`);
    const wantAW = dial > 1 && c.variant === 'B3a' ? JSON.stringify({ ...APP_AGE_WEIGHT, ...(expectWith ? { with: ages[other[who]] } : {}) }) : undefined;
    if (JSON.stringify(mt.ageWeight) !== wantAW) bad.push(`${who}: ageWeight ${JSON.stringify(mt.ageWeight)} where ${wantAW || 'none'}`);
    if (!(mt.spendLevels || []).some(x => Math.abs(x - 0.8) < 1e-6)) bad.push(`${who}: spendLevels ${JSON.stringify(mt.spendLevels)} without the floor`);
    if (dial > 1) {
      const b = r.lockTiers ? r.lockTiers.rc : null;
      if (tiered(r) || (b && tiered(b))) {
        if (!b) bad.push(`${who}: no lock on the base`);
        else {
          if (Math.abs(b.meta.lambda - APP_LAMBDA) > 1e-12) bad.push(`${who}: the base's lambda ${b.meta.lambda}, not the dial's at 1`);
          if (Math.abs(b.meta.bequestWeight - mt.bequestWeight) > 1e-12) bad.push(`${who}: the base's estate weight ${b.meta.bequestWeight}, the position's ${mt.bequestWeight}`);
        }
      } else if (r.lockTiers) bad.push(`${who}: a lock where the base has no tier state`);
    }
  }
  const T = cp.m.ctx.totalYears, zsAll = E.pathsForSeed(99008, NP, T);
  // the lock at every decision of the first 20 paths: each person's pair the one their base's chooser picks where they stand
  if (dial > 1) {
    let off = 0, decisions = 0;
    for (const zs of zsAll.slice(0, 20)) {
      const st = M.initialState(cp.m);
      for (let t = 0; t <= T; t++) {
        const j = chooseJoint(cp, st, t);
        for (const who of WHO) {
          const r = cp.tables[who]; if (!r.lockTiers || !tiered(r)) continue;
          const s = vecOf(r.m, ownerState(st, who)), held = { pen: st.tierHeld[who].pen || 0, isa: st.tierHeld[who].isa || 0 };
          const pick = chooseAction(r.lockTiers.rc, s, t, held), mine = who === 'self' ? j.ia : j.ib;
          decisions++; if (r.tsLayerOf[mine] !== r.tsLayerOf[pick]) off++;
        }
        const row = M.step(cp.m, st, j, t, ratesAt(cp.m, zs, t));
        if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
      }
    }
    if (off) bad.push(`${off} of ${decisions} decisions off the base's tier pair`);
  }
  // the engine's paths
  const ctx = E.buildContext(withCouple(cp.plan, cp)), L = E.normalizePlan(hp).solver.locks, aims = E.normalizePlan(hp).solver.aims;
  const owners = Object.fromEntries(ctx.owners.map(o => [o.key, o]));
  const nameOf = (who, cat, k) => { const id = owners[who].ids[cat], list = id && ctx.tierProfiles ? ctx.tierProfiles[id] : null; return list ? list[Math.min(k, list.length - 1)].name : null; };
  const seen = { tierMove: 0, years: 0 };
  for (const zs of zsAll) {
    const st = E.freshState(ctx), zPath = zs.length > T + 1 ? zs[T + 1] : 0;
    let failedHere = null;
    const opened = { self: -1, part: -1 };
    for (let t = 0; t <= T && !failedHere; t++) {
      const before = { self: st.cumPcls.self || 0, part: st.cumPcls.part || 0 };
      const row = E.stepYear(ctx, st, t, { z: zs[t], zPath });
      seen.years++;
      const age = { self: row.ageSelf, part: row.agePart }, working = { self: !!row.workingSelf, part: !!row.workingPart };
      if (aims.raises === 'blocked' && row.spendLevel > 1 + 1e-9) failedHere = `a year above target with raises blocked (year ${t})`;
      for (const who of WHO) {
        const h = st.tierHeld && st.tierHeld[who] ? st.tierHeld[who] : { pen: 0, isa: 0 };
        if ((h.pen || 0) || (h.isa || 0)) seen.tierMove++;
        if (aims.riskConsent === false && ((h.pen || 0) || (h.isa || 0))) failedHere = `${who}'s tier moved with consent withdrawn (year ${t})`;
        const drew = (who === 'self' ? row.taxablePensionSelf : row.taxablePensionPart) > 0.5 || (st.cumPcls[who] || 0) > before[who] + 0.5;
        if (L.pensionBefore && age[who] < L.pensionBefore && drew) failedHere = `${who}'s pension drawn at ${age[who]}, before ${L.pensionBefore}`;
        for (const cat of ['pen', 'isa']) {
          const ceil = L.tierCeiling[cat], nm = nameOf(who, cat, h[cat] || 0);
          if (ceil && nm && RISK.indexOf(nm) < RISK.indexOf(ceil)) failedHere = `${who}'s ${cat} at ${nm}, riskier than ${ceil} (year ${t})`;
        }
        const open = age[who] >= ctx.nmpa && !working[who];
        if (open && opened[who] < 0) opened[who] = t;
        const lump = !!(st.lumpSumTaken && st.lumpSumTaken[who]);
        if (L.lumpSum === 'never' && lump) failedHere = `${who}'s full lump taken with the lump sum never (year ${t})`;
        if (L.lumpSum === 'now' && opened[who] >= 0 && !lump) failedHere = `${who}'s full lump not taken from their first open year (year ${t}, open from ${opened[who]})`;
        if (L.lumpSum === 'now' && opened[who] < 0 && lump) failedHere = `${who}'s full lump taken before their pension opened (year ${t})`;
      }
      if (row.unmetDemand > 1 || row.preNmpaInsolvent) break;
    }
    if (failedHere) { bad.push(failedHere); break; }
  }
  return { bad, seen };
}

// ---- 2. each combination ----
const solved = {};
for (const [i, c] of rows.entries()) {
  if (ONLY && !ONLY.includes(i)) continue;
  const t0 = Date.now();
  let s = null, out;
  try { s = solveOf(c); out = checkCombo(c, s); } catch (e) { out = { bad: [`threw: ${e.message.split('\n')[0]}`], seen: {} }; }
  solved[i] = s;
  ok(out.bad.length === 0, `2. [${i}] ${label(c)}: ${out.bad.length ? out.bad.join('; ') : 'every check holds'} (${out.seen.years || 0} engine years, ${out.seen.tierMove || 0} person-years off the plan's own tiers; ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

// ---- 3. the age weights on the chance either lives ----
{
  const i = rows.findIndex((c, k) => c.dial > 1 && c.variant === 'B3a' && solved[k]);
  if (i < 0) ok(false, '3. no B3a position among the combinations run');
  else {
    const { cp } = solved[i], A = cp.tables.self, B = cp.tables.part, { mode, disp } = APP_AGE_WEIGHT;
    const w = (a, t) => Math.exp(-Math.exp((a - mode) / disp) * (Math.exp(t / disp) - 1));
    let worst = 0, apart = 0;
    for (let t = 0; t <= cp.m.ctx.totalYears; t++) {
      const hand = 1 - (1 - w(cp.m.ctx.ageSelf0, t)) * (1 - w(cp.m.ctx.agePart0, t));
      worst = Math.max(worst, Math.abs(A.costOf.w[t] - hand), Math.abs(B.costOf.w[t] - hand)); apart = Math.max(apart, Math.abs(A.costOf.w[t] - B.costOf.w[t]));
    }
    const T = cp.m.ctx.totalYears, own = w(cp.m.ctx.ageSelf0, T);
    ok(worst <= 1e-15 && apart <= 1e-15, `3. [${i}] the age weights the chance either lives: against the hand formula ${worst.toExponential(2)}, the two tables apart ${apart.toExponential(2)}; at the last year ${A.costOf.w[T].toFixed(4)} where the first person's own would be ${own.toFixed(4)}`);
  }
}

// ---- 4. the plants ----
{
  // the lock dropped in the rollout: on a combination above position 1 whose bases have a tier state
  const i = rows.findIndex((c, k) => c.dial > 1 && c.consent && solved[k] && WHO.some(w => solved[k].cp.tables[w].lockTiers));
  if (i < 0) ok(false, '4. no locked combination among those run, for the lock plant');
  else {
    COUPLE.plant = 'nolock';
    const out = checkCombo(rows[i], solved[i]);
    COUPLE.plant = '';
    ok(out.bad.length > 0, `4. [${i}] planted, the lock dropped in the rollout: ${out.bad.join('; ') || 'NOT CAUGHT'}`);
  }
}
{
  // the age weights each person's own, and the base solved with the other estate weight, on a B3a position with consent given
  // (with it withdrawn the base has no tier state, so the position is not locked to it and its estate weight is not read)
  const i = rows.findIndex((c, k) => c.dial > 1 && c.variant === 'B3a' && c.consent && solved[k]);
  if (i < 0) ok(false, '4. no B3a position among those run, for the age-weight and base plants');
  else {
    const c = rows[i];
    const noWith = solveOf(c, (p) => solveForApp(E, M, p, { ...OPTS, variant: c.variant }));
    const b1 = checkCombo(c, noWith).bad;
    ok(b1.some(x => x.includes('ageWeight')), `4. [${i}] planted, the age weights each person's own: ${b1.join('; ') || 'NOT CAUGHT'}`);
    const flip = { ...c, estate: c.estate === 'lower' ? 'standard' : 'lower', dial: 1 };
    const wrong = solveOf(c, (p, o) => {
      const other = singleOf(flip, o.who);
      return solveForApp(E, M, p, { ...OPTS, variant: c.variant, ageWith: o.partnerAge0, base: solveForApp(E, M, other, { ...OPTS, variant: c.variant }) });
    });
    const b2 = checkCombo(c, wrong).bad;
    ok(b2.some(x => x.includes('estate weight')), `4. [${i}] planted, the base solved with the other estate weight: ${b2.join('; ') || 'NOT CAUGHT'}`);
  }
}
{
  // the floor at 0: each person's plan prepared as before L1 (no floor), on the first combination run
  const i = rows.findIndex((c, k) => solved[k]), c = rows[i];
  const before = (p) => { const q = lockedPlan(E, E.normalizePlan(p)).plan; return E.resolveMpaa(E.normalizePlan({ ...q, config: { ...q.config, guardrails: false, lookaheadYears: 0 } })); };
  const plan = planOf(c), raw = before(plan), hp = appPlan(E, raw);
  const cp = solveCouple(E, M, hp, { solveOne: (p, o) => {
    const pr = before(p), aims = aimsOptions(pr, c.variant);
    const aw = aims.ageWeight ? { ageWeight: { ...aims.ageWeight, with: o.partnerAge0 } } : {};
    // the candidate's `coarse` only where the solve can take it, as solveForApp hands it (solve.js coarseWhereFits; D73's port): a dial
    // position above 1 is on the layer loop, off the path the anchors run on, and solvePlan refuses `coarse` there
    const sp = appPlan(E, pr);
    return solvePlan(E, M, sp, coarseWhereFits(E, M, sp, { ...APP_CANDIDATE, ...aims, ...aw, ...OPTS.research, lambda: aims.lambda, points: OPTS.points, ...(lockedPlan(E, E.normalizePlan(p)).riskAbove === false ? { riskAbove: false } : {}) }));
  } });
  const b = checkCombo(c, { hp, cp }).bad;
  ok(b.some(x => x.includes('without the floor')), `4. [${i}] planted, the floor at 0: ${b.join('; ') || 'NOT CAUGHT'}`);
}

/* one person's plan of a combination's household (for the base plant), as solveCouple cuts it */
function singleOf(c, who) {
  const hp = appPlan(E, prepareForSolve(E, planOf(c)));
  return E.resolveMpaa(E.normalizePlan(singlePlanFor(hp, who, 0.5)));
}

console.log(`${failed ? 'FAILED' : 'ALL PASS'}: ${passed} passed, ${failed} failed (${((Date.now() - t00) / 1000).toFixed(0)}s)`);
process.exit(failed ? 1 : 0);
