/*
 * D105: A BETTER TIE RULE FOR A COUPLE ABOVE THEIR ESTATE CAPS, ITS TWO OPTIONS (couple.js holdMove and lookPick, solveCouple's
 * opts.holdPast and opts.tieLook; off in code; research/solver/TIE-C2.md reads them). The hold: a person whose wealth, as their
 * table reads it, is more than holdPast times the top of their table's wealth axis never steps down in risk there (the table
 * reads every pot past its top as the top). The forward look: the first rule's tie set (tieJoint) ranked by the household's
 * pot at the plan's end on the median path, the best move's choices in each later year.
 *   1. both options unset: S007's joint value at the start and its engine runs on 20 paths the code before the options', bit
 *      for bit (couple-tie.test.mjs check 1's digest); cp carries neither and its record neither; set, each carried
 *   2. the hold acts only past the limit and only on a step down: S007's own states along a path of seed 7002 with each
 *      person's estate cap at £300,000, where its chooser changes tiers (years 1 to the year before the last), the hold at limits of 0.05 to 0.2 of each table's top (about where each person's wealth sits
 *      against it, so some persons are past and some below): each decision is the unset move with each wrapper a person past
 *      the limit steps down put back to the tier they hold, nothing else changed; the hold acts, and a step down below the
 *      limit is left; with the limit at 1e12 every decision is the unset move's
 *   3. the look by hand: S007's states with every pot eight times over (both above their caps, years 1 to 20), each person's
 *      six best moves on offer, tieJoint 1e-4: the look's pick is the tie set's member whose end pot on the median path, run
 *      here year by year in the exact model (the move, then the best move's each later year), is largest by more than a penny
 *      (within a penny the least tax this year, then the larger wealth after the move); and the look acts, picking other than
 *      the best at some decision and other than the first rule (tiePick) at some decision
 *   4. the engine and the rollout in step under each option: S007 with each person's estate cap at £300,000 (both above it from
 *      the start), 10 paths, under the look (tieJoint 1e-4) and under the hold (at 0.05, so it acts on the household's own
 *      states), the engine's run and runCouplePolicy alike in survival and within a pound at the end, each option acting on
 *      the first path
 *   5. the refusals, before any solve: holdPast 0, -1, NaN, Infinity or a string; tieLook 'yes'; tieLook without tieJoint
 *   6. the hold by hand (couple.js holdMove on built moves): past the limit a step down keeps the tier held and the other
 *      wrapper's step up stands; below the limit, in the last year and with the option unset nothing changes; the other
 *      person's move untouched
 *   7. the hold over the dial's lock (the reviewer on D109's change of default, MINOR 2): S007 at the dial's position 3, each
 *      person's table locked to its base's tiers (lockTiers), its estate caps at £300,000; along its own path at limits of 0.05
 *      to 0.2 of each table's top, each decision the lock's move with each step down of a person past the limit put back to
 *      the tier held and nothing else changed (a person below the limit on the lock's pair); the hold acting over a step down
 *      the lock takes; the engine and the rollout in step under the hold at 0.05 on 10 paths
 * Plants (COUPLE.plant): 'holdany' (the wealth test dropped) fails checks 2, 6 and 7; 'holdup' (a step up held too) fails check
 * 6; 'lookyear' (the look's pot after this year alone) fails check 3; 'holdlock' (a locked table's move left to its lock)
 * fails check 7. --planted runs each and reads which fail.
 *   node research/tests/couple-tie-look.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { TIER_ORDER } from '../../src/solver/fast.js';
import { solveForApp } from '../../src/solverApp.js';
import { prepareForSolve } from '../../src/solverSettings.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const PLANTS = [['holdany', ['2', '6', '7']], ['holdup', ['6']], ['lookyear', ['3']], ['holdlock', ['7']]];
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of PLANTS) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_TIE_LOOK_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { bad++; console.log(r.stdout + r.stderr); }
  }
  process.exit(bad ? 1 : 0);
}
const { solveCouple, withCouple, chooseJoint, runCouplePolicy, ratesFor, ratesAt, COUPLE } = CPL;
const PLANT = process.env.COUPLE_TIE_LOOK_PLANT || '';
COUPLE.plant = PLANT;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-tie-look: a couple's hold and forward look above the estate caps (D105)${PLANT ? `; planted: ${PLANT}` : ''}`);
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const S007 = prepareForSolve(E, E.normalizePlan(buildScenarios().find(s => s.id === 'S007').plan));
const memo = new Map();
const one = research => (p, o) => { const k = JSON.stringify([p, o.partnerAge0, research]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: 4, research: { ...LIGHT, ...research }, ageWith: o.partnerAge0 })); return memo.get(k); };
const MARGIN = 1e-4, js = x => JSON.stringify(x);
const same = (a, b) => a.spendLevel === b.spendLevel && a.split === b.split && js(a.perOwner) === js(b.perOwner) && js(a.steps) === js(b.steps);
const tiersOf = j => ['self', 'part'].map(w => `${j.perOwner[w].tierPen || 0}/${j.perOwner[w].tierIsa || 0}`).join(' ');

// ---- 1. both options unset ----
const off = solveCouple(E, M, S007, { solveOne: one({}) });
{
  const BEFORE = '4410b47199e2b9207f1ef57b1ef294b97e736c877e950c3309ea860fb9b56954', N = 20;   // couple-tie.test.mjs check 1's
  const ctx = E.buildContext(withCouple(off.plan, off)), paths = E.pathsForSeed(7002, N, ctx.totalYears);
  const v = new Float64Array(1 + 3 * N);
  v[0] = chooseJoint(off, off.M.initialState(off.m), 0).score;
  paths.forEach((zs, k) => { const o = E.runTrial(ctx, zs); v[1 + 3 * k] = o.survived ? 1 : 0; v[2 + 3 * k] = o.terminalPotNet; v[3 + 3 * k] = o.lifetimeTax; });
  const dig = createHash('sha256').update(Buffer.from(v.buffer)).digest('hex');
  const on = solveCouple(E, M, S007, { solveOne: one({}), holdPast: 2, tieJoint: MARGIN, tieLook: true });
  const none = off.holdPast === undefined && off.tieLook === undefined && off.meta.holdPast === undefined && off.meta.tieLook === undefined;
  const carried = on.holdPast === 2 && on.tieLook === true && on.meta.holdPast === 2 && on.meta.tieLook === true;
  ok(1, 'both options unset: S007\'s joint value at the start and its engine runs on 20 paths the code before the options\', bit for bit; neither carried nor recorded, and each carried and recorded when set',
    dig === BEFORE && none && carried, `${dig.slice(0, 16)} against ${BEFORE.slice(0, 16)}; unset ${none ? 'neither carried' : 'CARRIED'}; set ${carried ? 'both carried' : 'NOT carried'}`);
}

// a path of S007's states with both options unset, each year's state kept (the exact model's market, the path's own draws)
const T = off.m.ctx.totalYears, zs = E.pathsForSeed(7002, 1, T)[0];
const states = [];
{ const st = M.initialState(off.m); for (let t = 0; t <= T; t++) { states.push(M.cloneState(st)); const j = chooseJoint(off, st, t); M.step(off.m, st, j, t, ratesFor(off.m, zs, t, st)); } }
const scaled = (st, f) => { const s = M.cloneState(st); for (const k of Object.keys(s.pots)) s.pots[k] *= f; for (const w of Object.keys(s.basis || {})) s.basis[w] *= f; for (const w of Object.keys(s.cashIsa || {})) s.cashIsa[w] *= f; return s; };
const wealthOf = (cp, st, w) => { const s = vecOf(cp.tables[w].m, CPL.ownerState(st, w)); return s[0] + s[1] + s[2]; };
const topOf = (cp, w) => cp.tables[w].g.axes.W.hi;
// a tier's place in TIER_ORDER (riskiest first), as the test reads each person's table's own tier list
const placeOf = (cp, w, cat, k) => TIER_ORDER.indexOf(cp.tables[w].c.tiers[cat][k].name);

// ---- 2. the hold: only past the limit, only on a step down ----
{
  // along the path's own states (years 1 to the year before the last), at limits from 0.05 to 0.2 of each table's top, about
  // where each person's wealth sits against it (their opening wealth a sixth of it or less), so at each some persons are past
  // the limit and some below it; and at 1e12, past which no one is
  // with each person's estate cap at £300,000 (as check 4), where the chooser changes tiers along the path: without it S007's
  // path holds the plan's own tiers throughout, and the hold would have nothing to act on
  const LIMITS = [0.05, 0.1, 0.15, 0.2], CAP = { bequestCap: 300000 };
  let decisions = 0, acted = 0, putBack = 0, spared = 0, stoodUp = 0; const bad = [], farBad = [];
  const base = solveCouple(E, M, S007, { solveOne: one(CAP) }), far = solveCouple(E, M, S007, { solveOne: one(CAP), holdPast: 1e12 });
  const path = [];
  { const st = M.initialState(base.m); for (let t = 0; t <= T; t++) { path.push(M.cloneState(st)); const j = chooseJoint(base, st, t); M.step(base.m, st, j, t, ratesFor(base.m, zs, t, st)); } }
  for (const L of LIMITS) {
    const hold = solveCouple(E, M, S007, { solveOne: one(CAP), holdPast: L });
    for (let t = 1; t < T; t++) {
      const st = path[t], a = chooseJoint(base, st, t), b = chooseJoint(hold, st, t);
      decisions++;
      if (L === LIMITS[0] && !same(a, chooseJoint(far, st, t))) farBad.push(t);
      // the expected move: the unset move with each wrapper it steps down put back to the tier held, for each person past
      // the limit; a person below it, and every step up, as the unset move has them
      const want = JSON.parse(js(a));
      for (const w of ['self', 'part']) {
        const past = wealthOf(base, st, w) > L * topOf(base, w), held = st.tierHeld && st.tierHeld[w] ? st.tierHeld[w] : { pen: 0, isa: 0 };
        for (const [cat, key] of [['pen', 'tierPen'], ['isa', 'tierIsa']]) {
          const from = held[cat] || 0, to = a.perOwner[w][key] || 0;
          if (to === from) continue;
          const down = placeOf(base, w, cat, to) > placeOf(base, w, cat, from);
          if (!down) { if (past) stoodUp++; continue; }
          if (!past) { spared++; continue; }
          want.perOwner[w][key] = from; putBack++;
        }
        if ('tierPenName' in want.perOwner[w]) { want.perOwner[w].tierPenName = base.tables[w].c.tiers.pen[want.perOwner[w].tierPen || 0].name; want.perOwner[w].tierIsaName = base.tables[w].c.tiers.isa[want.perOwner[w].tierIsa || 0].name; }
      }
      if (!same(b, want)) bad.push(`limit ${L}, year ${t}: the hold gave ${tiersOf(b)}, the unset move with the steps down of those past the limit put back ${tiersOf(want)}`);
      if (!same(a, b)) acted++;
    }
  }
  ok(2, `the hold: along S007's own path with its estate caps at £300,000 (years 1 to ${T - 1}) at limits of ${LIMITS.join(', ')} of each table's top, each decision the unset move with each step down of a person past the limit put back to the tier held, a person below it and a step up untouched; at 1e12, the unset move`,
    decisions > 0 && !bad.length && acted > 0 && putBack > 0 && spared > 0 && !farBad.length,
    `${decisions} decisions: wrappers put back ${putBack}, a step down below the limit left ${spared}, a step up past it left ${stoodUp}; the hold changed ${acted}${bad.length ? `; ${bad.slice(0, 2).join('; ')}` : ''}${farBad.length ? `; at 1e12 differing in years ${farBad.slice(0, 5).join(', ')}` : ''}`);
}

// ---- 3. the look by hand ----
{
  const K = 6, look = solveCouple(E, M, S007, { solveOne: one({}), topK: K, tieJoint: MARGIN, tieLook: true }), first = solveCouple(E, M, S007, { solveOne: one({}), topK: K, tieJoint: MARGIN });
  const Z0 = new Float64Array(T + 2);
  // the end pot on the median path, written out here: the move this year, the best move's each later year
  const endPot = (cp, st0, t, j, bestJ) => {
    const st = M.cloneState(st0);
    let row = M.step(cp.m, st, j, t, ratesAt(cp.m, Z0, t));
    if (row.unmetDemand > 1 || row.preNmpaInsolvent) return -Infinity;
    for (let u = t + 1; u <= T; u++) { row = M.step(cp.m, st, bestJ, u, ratesAt(cp.m, Z0, u)); if (row.unmetDemand > 1 || row.preNmpaInsolvent) return -Infinity; }
    let s = 0; for (const v of Object.values(st.pots)) s += v; return s;
  };
  let decisions = 0, sets = 0, notBest = 0, notFirst = 0; const bad = [];
  for (let t = 1; t <= Math.min(20, T - 1); t++) {
    const st = scaled(states[t], 8), out = {};
    const got = chooseJoint(look, st, t, out), byFirst = chooseJoint(first, st, t);
    if (!out.tie) { bad.push(`year ${t}: no tie set (not above both caps)`); continue; }
    decisions++;
    const b = out.best, set = [b, ...out.tie.filter(c => c.joint !== b.joint && c.score >= b.score - MARGIN && c.joint.spendLevel === b.joint.spendLevel && tiersOf(c.joint) === tiersOf(b.joint))];
    if (set.length > 1) sets++;
    let pick = null, pickEnd = -Infinity;
    for (const c of set) {
      const e = endPot(look, st, t, c.joint, b.joint), even = e === pickEnd || Math.abs(e - pickEnd) <= 0.01;
      if (!pick || (!even && e > pickEnd) || (even && (c.tax < pick.tax - 1e-9 || (Math.abs(c.tax - pick.tax) <= 1e-9 && c.wealth > pick.wealth)))) { pick = c; pickEnd = e; }
    }
    if (got !== pick.joint) bad.push(`year ${t}: the look took a move whose end pot is £${Math.round(endPot(look, st, t, got, b.joint))}, the hand-run look one of £${Math.round(pickEnd)}`);
    if (got !== b.joint) notBest++;
    if (!same(got, byFirst)) notFirst++;
  }
  ok(3, 'the look by hand: S007\'s pots eight times over (years 1 to 20), each person\'s six best moves on offer, tieJoint 1e-4: the look takes the tie set\'s largest end pot on the median path, run here year by year; and it acts, apart from the best and from the first rule',
    decisions > 0 && !bad.length && notBest > 0 && notFirst > 0, `${decisions} decisions, ${sets} with a tie set of more than the best; the look took other than the best at ${notBest} and other than the first rule at ${notFirst}${bad.length ? `; ${bad.slice(0, 2).join('; ')}` : ''}`);
}

// ---- 4. the engine and the rollout in step under each option ----
{
  const CAP = { bequestCap: 300000 }, rows = [];
  for (const [name, o] of [['the look', { tieJoint: MARGIN, tieLook: true }], ['the hold', { holdPast: 0.05 }]]) {
    const cp = solveCouple(E, M, S007, { solveOne: one(CAP), ...o }), cpOff = solveCouple(E, M, S007, { solveOne: one(CAP) });
    const ctx = E.buildContext(withCouple(cp.plan, cp)), N = 10, paths = E.pathsForSeed(7002, N, ctx.totalYears);
    let gap = 0, diff = 0;
    paths.forEach(z => { const e = E.runTrial(ctx, z), r = runCouplePolicy(cp, z); if (e.survived !== r.survived) diff++; else if (e.survived) gap = Math.max(gap, Math.abs(e.terminalPotNet - r.terminalNet)); });
    let acted = 0;
    { const st = M.initialState(cp.m); for (let t = 0; t < ctx.totalYears; t++) { const b = chooseJoint(cp, st, t), a = chooseJoint(cpOff, st, t); if (!same(a, b)) acted++; M.step(cp.m, st, b, t, ratesFor(cp.m, paths[0], t, st)); } }
    rows.push({ name, diff, gap, acted });
  }
  ok(4, 'the engine and the rollout in step under each option: S007 with each person\'s estate cap at £300,000, 10 paths alike in survival and within a pound at the end, under the look and under the hold at 0.05, each acting',
    rows.every(r => r.diff === 0 && r.gap < 1 && r.acted > 0), rows.map(r => `${r.name}: differing in survival ${r.diff}, the largest gap at the end £${r.gap.toFixed(6)}, acting at ${r.acted} of the first path's decisions`).join('; '));
}

// ---- 5. the refusals ----
{
  const threw = o => { try { solveCouple(E, M, S007, { ...o, solveOne: () => { throw new Error('solved'); } }); return 'no'; } catch (e) { return e.message; } };
  const cases = [[{ holdPast: 0 }, /holdPast 0/], [{ holdPast: -1 }, /holdPast -1/], [{ holdPast: NaN }, /holdPast NaN/], [{ holdPast: Infinity }, /holdPast Infinity/], [{ holdPast: '2' }, /holdPast 2/], [{ tieLook: 'yes' }, /tieLook yes/], [{ tieLook: true }, /tieLook ranks/]];
  const bad = cases.filter(([o, re]) => !re.test(threw(o))).map(([o]) => js(o));
  ok(5, 'the refusals, before any solve: holdPast 0, -1, NaN, Infinity or a string; tieLook not true or false; tieLook without tieJoint', !bad.length, bad.length ? `not refused: ${bad.join(', ')}` : `${cases.length} refused`);
}

// ---- 6. the hold by hand ----
{
  const tiers = { pen: [{ name: 'Medium Risk' }, { name: 'Medium/Low Risk' }, { name: 'Low Risk' }, { name: 'Medium/High Risk' }], isa: [{ name: 'Medium Risk' }, { name: 'Medium/Low Risk' }, { name: 'Low Risk' }, { name: 'Medium/High Risk' }] };
  const tab = { g: { axes: { W: { hi: 1e6 } } }, c: { tiers, acts: [{ tierPen: 0, tierIsa: 0 }, { tierPen: 1, tierIsa: 1 }] } };
  const cp = (holdPast, T0 = 40) => ({ holdPast, m: { ctx: { totalYears: T0 } }, tables: { self: tab, part: tab } });
  const mv = (sp, si, pp, pi) => ({ spendLevel: 1, split: 0.5, steps: ['isa'], perOwner: { self: { tierPen: sp, tierIsa: si }, part: { tierPen: pp, tierIsa: pi } } });
  const state = (sp, si, pp, pi) => ({ tierHeld: { self: { pen: sp, isa: si }, part: { pen: pp, isa: pi } } });
  const rich = [2.5e6, 0, 0], poor = [1.5e6, 0, 0];   // past twice the top of 1e6, and below it
  const cases = [
    // past the limit, the self steps the pension down (0 to 2) and the ISA up (1 to 3, Medium/High above Medium/Low): the
    // pension keeps 0, the ISA's step up stands; the partner below the limit steps down and stands
    ['a step down past the limit kept, a step up beside it standing, the other person below it untouched', cp(2), state(0, 1, 0, 0), mv(2, 3, 2, 2), rich, poor, mv(0, 3, 2, 2)],
    ['a step up alone past the limit standing', cp(2), state(1, 1, 0, 0), mv(0, 0, 0, 0), rich, rich, mv(0, 0, 0, 0)],
    ['below the limit nothing', cp(2), state(0, 0, 0, 0), mv(2, 2, 1, 1), poor, poor, mv(2, 2, 1, 1)],
    ['the last year nothing', cp(2, 40), state(0, 0, 0, 0), mv(2, 2, 2, 2), rich, rich, mv(2, 2, 2, 2), 40],
    ['the option unset nothing', cp(undefined), state(0, 0, 0, 0), mv(2, 2, 2, 2), rich, rich, mv(2, 2, 2, 2)]
  ];
  const bad = [];
  for (const [name, c, st, j, sA, sB, want, t = 5] of cases) { const got = CPL.holdMove(c, st, t, j, sA, sB); if (js(got.perOwner) !== js(want.perOwner)) bad.push(`${name}: ${tiersOf(got)}, wanted ${tiersOf(want)}`); }
  ok(6, 'the hold by hand: past the limit a step down keeps the tier held while a step up stands; below the limit, in the last year and with the option unset, nothing; the other person untouched', !bad.length, bad.join('; ') || `${cases.length} cases`);
}

// ---- 7. the hold over the dial's lock (the reviewer on D109's change of default, MINOR 2) ----
{
  // S007 at the dial's position 3 (its aims' cuts at 3: each person's table solved on the tiers of its base, the same plan at
  // position 1, lockTiers, D3), each person's estate cap at £300,000 as in check 2. Along the locked couple's own path (years 1
  // to the year before the last), at limits of 0.05 to 0.2 of each table's top: each decision is the lock's move (the hold
  // unset) with each step down of a person past the limit put back to the tier held, nothing else changed, so a person below
  // the limit keeps the lock's pair; the hold puts back some step down the lock takes. And the engine and the rollout stay in
  // step under the hold at 0.05, as in check 4.
  const CAP = { bequestCap: 300000 }, LIMITS = [0.05, 0.1, 0.15, 0.2];
  const RAW = buildScenarios().find(x => x.id === 'S007').plan;
  const P3 = prepareForSolve(E, E.normalizePlan({ ...RAW, solver: { aims: { cuts: 3, estate: 'standard', raises: 'capped', riskConsent: true } } }));
  const lock = solveCouple(E, M, P3, { solveOne: one(CAP) });
  const locked = ['self', 'part'].every(w => !!lock.tables[w].lockTiers);
  const T3 = lock.m.ctx.totalYears, z3 = E.pathsForSeed(7002, 1, T3)[0], path = [];
  { const st = M.initialState(lock.m); for (let t = 0; t <= T3; t++) { path.push(M.cloneState(st)); const j = chooseJoint(lock, st, t); M.step(lock.m, st, j, t, ratesFor(lock.m, z3, t, st)); } }
  let decisions = 0, acted = 0, putBack = 0, spared = 0; const bad = [];
  for (const L of LIMITS) {
    const hold = solveCouple(E, M, P3, { solveOne: one(CAP), holdPast: L });
    for (let t = 1; t < T3; t++) {
      const st = path[t], a = chooseJoint(lock, st, t), b = chooseJoint(hold, st, t), want = JSON.parse(js(a));
      decisions++;
      for (const w of ['self', 'part']) {
        const past = wealthOf(lock, st, w) > L * topOf(lock, w), held = st.tierHeld && st.tierHeld[w] ? st.tierHeld[w] : { pen: 0, isa: 0 };
        for (const [cat, key] of [['pen', 'tierPen'], ['isa', 'tierIsa']]) {
          const from = held[cat] || 0, to = a.perOwner[w][key] || 0;
          if (to === from || !(placeOf(lock, w, cat, to) > placeOf(lock, w, cat, from))) continue;
          if (!past) { spared++; continue; }
          want.perOwner[w][key] = from; putBack++;
        }
        if ('tierPenName' in want.perOwner[w]) { want.perOwner[w].tierPenName = lock.tables[w].c.tiers.pen[want.perOwner[w].tierPen || 0].name; want.perOwner[w].tierIsaName = lock.tables[w].c.tiers.isa[want.perOwner[w].tierIsa || 0].name; }
      }
      if (!same(b, want)) bad.push(`limit ${L}, year ${t}: the hold gave ${tiersOf(b)}, the lock's move with the steps down of those past the limit put back ${tiersOf(want)}`);
      if (!same(a, b)) acted++;
    }
  }
  // the engine and the rollout in step at the locked position under the hold at 0.05
  const cp = solveCouple(E, M, P3, { solveOne: one(CAP), holdPast: 0.05 }), ctx = E.buildContext(withCouple(cp.plan, cp)), N = 10, paths = E.pathsForSeed(7002, N, ctx.totalYears);
  let diff = 0, gap = 0;
  paths.forEach(z => { const e = E.runTrial(ctx, z), r = runCouplePolicy(cp, z); if (e.survived !== r.survived) diff++; else if (e.survived) gap = Math.max(gap, Math.abs(e.terminalPotNet - r.terminalNet)); });
  ok(7, `the hold over the dial's lock: S007 at position 3, each table locked to its base's tiers, its estate caps at £300,000; along its own path at limits of ${LIMITS.join(', ')} of each table's top, each decision the lock's move with each step down of a person past the limit put back, a person below it on the lock's pair; the hold acting over the lock; the engine and the rollout in step under the hold at 0.05 on 10 paths`,
    locked && decisions > 0 && !bad.length && acted > 0 && putBack > 0 && diff === 0 && gap < 1,
    `both tables locked ${locked}; ${decisions} decisions: steps down put back ${putBack}, below the limit left on the lock's pair ${spared}; the hold changed ${acted}${bad.length ? `; ${bad.slice(0, 2).join('; ')}` : ''}; the engine against the rollout: differing in survival ${diff}, the largest gap at the end £${gap.toFixed(6)}`);
}

console.log(`\ncouple-tie-look: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
