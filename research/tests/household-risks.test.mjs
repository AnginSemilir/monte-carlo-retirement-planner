/*
 * COUPLES-ANY.md A, ITS AMENDMENT 1: A COUPLE WHOSE TWO PEOPLE HOLD ONE WRAPPER AT DIFFERENT RISKS, ON THE HOUSEHOLD ROUTE.
 * The household plan holds such a pension or ISA at the more cautious of the two risks (src/solver/household.js
 * householdPlanFor, the shape 'risks'). Each person's ladder in the engine gains the household's tiers it lacks, at its end
 * (src/App.jsx buildContext). The household's move names its tier and each person takes that name's index in their own
 * ladder (tierMapOf, perOwnerOf); the tier the table reads as held is the cautious person's (heldOf). With the partner's own
 * limits (the shape 'limits') the household plan takes the stricter of the two people's ceilings. Off in code: nothing in
 * the app names either shape yet (src/solverSettings.js APP_COUPLE.takeShapes). On the library's couples with the
 * pension's and the ISA's risks planted apart, one to three steps, either person the riskier:
 *   1. the moves: each year a random household move (a draw order from the candidate's menu, a spending level, a split and a
 *      random tier of the household's in each wrapper), each person at their own index. Every person's tier is the
 *      household's by name and one of their own ladder's, and the engine and the exact model's year are in step to a penny
 *      (every pot, the tiers held, the switch charged, the year's flows);
 *   2. the first year's switch: with the household holding its own tiers in plan year 0, the riskier person's wrapper moves
 *      onto the household's tier and is charged the switch, the cautious person's holds, and where the two risks are alike
 *      (each couple as entered) no switch is charged;
 *   3. the app's route: the page's cut taking the shapes (src/solverCouple.js householdCut), the household's table solved
 *      (light settings), the household assembled with its tier map (householdSolved), and the engine's run under its own
 *      policy on 20 paths, every move accepted and each person's tier the household's by name, the engine and the model in
 *      step on the first 3; the household plan's pension and ISA at the more cautious risk and its other accounts at the
 *      larger holding's. With the partner's own ceilings planted apart, the household plan's ceiling is the stricter,
 *      wrapper by wrapper, and no person's tier is ever riskier than their own ceiling or their own locked risk;
 *   4. identity: with the risks alike, every couple's ladders, as entered and on its mirror (src/coupleOrder.js otherOrder),
 *      at two and three steps below, are the code before's (the plant 'noladderadd'), and every household plan taking A's
 *      shapes is the one built without them, byte for byte; with the risks apart, every person's ladder begins with the code
 *      before's, so each of its own indices means what it meant, and the app's own rules (no table) and today's two-table
 *      route (src/solver/couple.js solveCouple, its tables and its engine runs) are the code before's on every path.
 * Plants (HOUSEHOLD_RISKS_PLANT; --planted runs each and reports the checks that fail): 'noladderadd' (App.jsx, none of the
 * household's tiers added) fails checks 1 to 3; 'tierindex' (both people given the household's index) fails 1 to 3;
 * 'nofirstswitch' (the riskier person left at their own tier in plan year 0) fails 1 to 3; 'ceilfirst' (the household's
 * ceiling the first person's) fails 3; 'riskfirst' (the first person's risk kept) fails 1 to 3; 'ladderinsert' (App.jsx, the
 * household's tiers put among a person's own, before their riskier tiers, not at the end) fails 4.
 *   node research/tests/household-risks.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildActions, productLevels } from '../../src/solver/solve.js';
import { SPLITS, ratesAt, solveCouple } from '../../src/solver/couple.js';
import { tiersFor, TIER_ORDER } from '../../src/solver/fast.js';
import { householdForm, householdPlanFor, tierMapOf, perOwnerOf, bandsAt, HOUSE, RISK_SHAPES, TAKE_SHAPES } from '../../src/solver/household.js';
import { householdPlan, householdCut, householdSolved } from '../../src/solverCouple.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PLANTS = { noladderadd: ['1', '2', '3'], tierindex: ['1', '2', '3'], nofirstswitch: ['1', '2', '3'], ceilfirst: ['3'], riskfirst: ['1', '2', '3'], ladderinsert: ['4'] };
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of Object.entries(PLANTS)) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, HOUSEHOLD_RISKS_PLANT: plant }, encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  console.log(bad ? `PLANTED: ${bad} plant(s) not failing exactly their checks` : 'PLANTED: EACH PLANT FAILS EXACTLY ITS OWN CHECKS');
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.HOUSEHOLD_RISKS_PLANT || '';
if (PLANT && !PLANTS[PLANT]) { console.error(`household-risks: no plant '${PLANT}'`); process.exit(2); }
if (PLANT === 'noladderadd' || PLANT === 'ladderinsert') E.LADDER_PLANT.rule = PLANT; else HOUSE.plant = PLANT;

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const js = x => JSON.stringify(x);
const TAKES = [...TAKE_SHAPES, ...RISK_SHAPES], FORM = 'pensionsPA', SC = 0.004, PENNY = 0.01;
const PTS = 6, LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple');
const PICK = couples.filter((_, i) => i % Math.floor(couples.length / 8) === 0).slice(0, 8);
const MENU = buildActions({ menuPlus: ['hr'], spendLevels: productLevels(0.8) });
const ix = r => TIER_ORDER.indexOf(r);
const short = r => String(r).replace(' Risk', '').replace('Cash Equivalents', 'Cash');
/* the couple's plan with its pension's and ISA's risks set, each [first person's, partner's] */
const planted = (plan, pen, isa) => {
  const p = structuredClone(plan);
  for (const [w, [rs, rp]] of [['pen', pen], ['isa', isa]]) for (const a of p.accounts) {
    if (a.id === `${w}_self`) a.risk = rs; else if (a.id === `${w}_part`) a.risk = rp;
  }
  return p;
};
/* one to three steps apart, either person the riskier, the pension and the ISA each its own way (the couple's index varies
   where on the ladder the pair sits) */
const pairs = (ci) => {
  const out = [];
  for (const d of [1, 2, 3]) {
    const a = (ci + d) % (6 - d), riskier = TIER_ORDER[a], cautious = TIER_ORDER[a + d];
    const b = (ci + 2 * d) % (6 - d), r2 = TIER_ORDER[b], c2 = TIER_ORDER[b + d];
    out.push({ pen: d % 2 ? [riskier, cautious] : [cautious, riskier], isa: d === 2 ? [c2, c2] : d % 2 ? [c2, r2] : [r2, c2], d });
  }
  return out;
};
/* the household plan as the page cuts it (the minimum pot it is given, its bands), taking A's shapes */
const cutOf = (plan) => householdCut(E, M, plan, FORM, { takeShapes: TAKES });
/* the household's ladder, as its table's tiers are listed (fast.js tiersFor on the household plan, three steps below as the
   candidate's), and the household and its tier map for a couple's model (no table solved: checks 1 and 2) */
const ladderOf = (hplan) => { const mh = M.prepare(E, hplan, { tiersBelow: 3 }); mh.tiersBelow = 3; return tiersFor(mh, 3); };
const fakeH = (tiers) => ({ c: { tiers, acts: [{ tierPen: 1, tierIsa: 1 }] } });

// ---- 1 and 2. random household moves, and the first year's switch ----
const c1 = { years: 0, worst: 0, worstAt: '', units: 0, notName: 0, notOwn: 0, threw: [] }, c2 = { units: 0, moved: 0, held: 0, charged: 0, wanted: 0, bad: [], alike: 0, alikeCharged: 0 };
for (const [ci, sc] of PICK.entries()) {
  for (const pr of pairs(ci)) {
    let cut;
    try { cut = cutOf(planted(sc.plan, pr.pen, pr.isa)); } catch (e) { c1.threw.push(`${sc.id} ${short(pr.pen[0])}/${short(pr.pen[1])}: ${e.message.split('\n')[0]}`); continue; }
    const hp = cut.household, H = fakeH(ladderOf(cut.hplan)), m = M.prepare(E, hp, { tiersBelow: 3 }), T = m.ctx.totalYears;
    let tm = null;
    try { tm = tierMapOf(m, H); } catch (e) { c1.threw.push(`${sc.id}: ${e.message.split('\n')[0]}`); c2.bad.push(`${sc.id}: ${e.message.split('\n')[0]}`); continue; }
    const cp = { tierMap: tm }, owners = m.ctx.owners, listOf = (o, cat) => m.ctx.tierProfiles[o.ids[cat]];
    const hold = (t) => ({ steps: MENU[0].steps, costSteps: MENU[0].steps, harvest: false, harvestCeil: 'pa', sweepCash: true, lump: false, contrib: null, spendLevel: 1, split: 0.5, switchCost: SC,
      perOwner: perOwnerOf(cp, { steps: MENU[0].steps, harvest: false, harvestCeil: 'pa', tierPen: 0, tierIsa: 0, tierPenName: H.c.tiers.pen[0].name, tierIsaName: H.c.tiers.isa[0].name }, undefined, t) });
    // check 2: plan year 0 under the household's own tiers held
    { c2.units++;
      const ctx = E.buildContext({ ...hp, spending: { ...hp.spending, policyOverride: { kind: 'table', choose: (st, t) => hold(t), switchCost: SC, tiersBelow: 3 } } }), st = E.freshState(ctx);
      const zs = E.pathsForSeed(99001, 1, T)[0];
      let row = null;
      try { row = E.stepYear(ctx, st, 0, { z: zs[0], zPath: zs.length > T + 1 ? zs[T + 1] : 0 }); } catch (e) { c2.bad.push(`${sc.id}: threw ${e.message.split('\n')[0]}`); }
      if (row) {
        let want = false, good = true;
        for (const cat of ['pen', 'isa']) {
          const [x, y] = ['self', 'part'].map(k => owners.find(o => o.key === k));
          const rx = listOf(x, cat)[0].name, ry = listOf(y, cat)[0].name;
          if (rx === ry) { if ((st.tierHeld.self[cat] || 0) !== 0 || (st.tierHeld.part[cat] || 0) !== 0) good = false; continue; }
          const riskier = ix(rx) < ix(ry) ? x : y, cautious = riskier === x ? y : x, hName = H.c.tiers[cat][0].name;
          const nowR = listOf(riskier, cat)[st.tierHeld[riskier.key][cat] || 0].name, nowC = listOf(cautious, cat)[st.tierHeld[cautious.key][cat] || 0].name;
          if (nowR === hName) c2.moved++; else good = false;
          if (nowC === listOf(cautious, cat)[0].name) c2.held++; else good = false;
          if ((E.num(hp.accounts.find(a => a.id === riskier.ids[cat] || a.id === `${cat}_${riskier.key}`)?.balance, 0)) > 1000) want = true;
        }
        if (want) c2.wanted++;
        if (want && row.switchPaid > 0) c2.charged++;
        if (!good || (want && !(row.switchPaid > 0))) c2.bad.push(`${sc.id} ${short(pr.pen[0])}/${short(pr.pen[1])} ${short(pr.isa[0])}/${short(pr.isa[1])}: switch £${(row.switchPaid || 0).toFixed(2)}`);
      } }
    // check 1: random household moves, the engine and the model in step
    for (let i = 0; i < 3; i++) {
      c1.units++;
      const rnd = E.mulberry32(1000 * Number(sc.id.slice(1, 4)) + 10 * pr.d + i), pick = xs => xs[Math.floor(rnd() * xs.length)];
      const moves = [];
      for (let t = 0; t <= T; t++) {
        const a = pick(MENU), kp = Math.floor(rnd() * H.c.tiers.pen.length), ki = Math.floor(rnd() * H.c.tiers.isa.length), ha = rnd() < 0.5, ceil = pick(['pa', 'basic', 'hr']);
        const po = { steps: a.steps, harvest: ha, harvestCeil: ceil, tierPen: kp, tierIsa: ki, tierPenName: H.c.tiers.pen[kp].name, tierIsaName: H.c.tiers.isa[ki].name };
        moves.push({ steps: a.steps, costSteps: a.costSteps || a.steps, harvest: ha, harvestCeil: ceil, sweepCash: true, lump: rnd() < 0.1, contrib: null, spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, split: pick(SPLITS), switchCost: SC, perOwner: perOwnerOf(cp, po, po, t), hName: { pen: po.tierPenName, isa: po.tierIsaName } });
      }
      const ctx = E.buildContext({ ...hp, spending: { ...hp.spending, policyOverride: { kind: 'table', choose: (st, t) => moves[t], switchCost: SC, tiersBelow: 3 } } });
      const eng = E.freshState(ctx), mod = M.initialState(m), zs = E.pathsForSeed(99002, i + 1, T)[i];
      try { for (let t = 0; t <= T; t++) {
        const j = moves[t], gaps = [];
        for (const o of owners) for (const [cat, key, name] of [['pen', 'tierPen', 'tierPenName'], ['isa', 'tierIsa', 'tierIsaName']]) {
          const L = listOf(o, cat), k = j.perOwner[o.key][key];
          if (!(k >= 0 && k < L.length)) c1.notOwn++;
          else if (L[k].name !== j.hName[cat] || j.perOwner[o.key][name] !== j.hName[cat]) c1.notName++;
        }
        for (const id of Object.keys(eng.pots)) gaps.push([`pot ${id}`, Math.abs((eng.pots[id] || 0) - (mod.pots[id] || 0))]);
        for (const o of owners) for (const cat of ['pen', 'isa']) gaps.push([`tier held ${o.key} ${cat}`, (eng.tierHeld[o.key][cat] || 0) === (mod.tierHeld[o.key][cat] || 0) ? 0 : Infinity]);
        const re = E.stepYear(ctx, eng, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 }), rm = M.step(m, mod, j, t, ratesAt(m, zs, t));
        for (const k of ['totalCombined', 'taxPaid', 'cgtPaid', 'drawdownPensions', 'harvested', 'netDrawdown', 'unmetDemand', 'switchPaid']) gaps.push([k, Math.abs(E.num(re[k], 0) - E.num(rm[k], 0))]);
        for (const [k, g] of gaps) if (!(g <= c1.worst)) { c1.worst = g; c1.worstAt = `${sc.id} path ${i} year ${t}: ${k}`; }
        c1.years++;
      } } catch (e) { c1.worst = Infinity; c1.worstAt = `${sc.id} path ${i}: threw ${e.message.split('\n')[0]}`; }
    }
  }
}
ok('1. the moves: random household moves on the library\'s couples with their risks planted apart, each person at their own index: every person\'s tier the household\'s by name and one of their own ladder\'s, the engine and the exact model\'s year in step to a penny',
  c1.units > 0 && !c1.threw.length && c1.notName === 0 && c1.notOwn === 0 && c1.worst <= PENNY,
  `${c1.units} runs, ${c1.years} household-years; tiers not the household's by name ${c1.notName}, outside the person's ladder ${c1.notOwn}; the largest gap £${c1.worst.toExponential(2)}${c1.worst > PENNY ? ` at ${c1.worstAt}` : ''}${c1.threw.length ? `; refused: ${c1.threw.slice(0, 2).join('; ')}` : ''}`);
// the couples as entered: their risks alike, no switch under the household's own tiers held
for (const sc of PICK) {
  const cut = cutOf(sc.plan), hp = cut.household, H = fakeH(ladderOf(cut.hplan)), m = M.prepare(E, hp, { tiersBelow: 3 }), T = m.ctx.totalYears;
  const tm = tierMapOf(m, H), cp = { tierMap: tm };
  const mv = () => ({ steps: MENU[0].steps, costSteps: MENU[0].steps, harvest: false, harvestCeil: 'pa', sweepCash: true, lump: false, contrib: null, spendLevel: 1, split: 0.5, switchCost: SC, perOwner: perOwnerOf(cp, { steps: MENU[0].steps, harvest: false, harvestCeil: 'pa', tierPen: 0, tierIsa: 0, tierPenName: H.c.tiers.pen[0].name, tierIsaName: H.c.tiers.isa[0].name }, undefined, 0) });
  const ctx = E.buildContext({ ...hp, spending: { ...hp.spending, policyOverride: { kind: 'table', choose: mv, switchCost: SC, tiersBelow: 3 } } }), st = E.freshState(ctx), zs = E.pathsForSeed(99001, 1, T)[0];
  const row = E.stepYear(ctx, st, 0, { z: zs[0], zPath: zs.length > T + 1 ? zs[T + 1] : 0 });
  c2.alike++; if (tm !== null || row.switchPaid > 0) c2.alikeCharged++;
}
ok('2. the first year\'s switch: the household holding its own tiers in plan year 0, the riskier person\'s wrapper moves onto the household\'s tier and is charged, the cautious person\'s holds; the risks alike (each couple as entered), no map and nothing charged',
  c2.units > 0 && !c2.bad.length && c2.moved > 0 && c2.charged === c2.wanted && c2.wanted > 0 && c2.alike > 0 && c2.alikeCharged === 0,
  `${c2.units} couples with their risks apart: the riskier moved ${c2.moved}, the cautious held ${c2.held}, charged where their pot was above £1,000 ${c2.charged} of ${c2.wanted}${c2.bad.length ? `; not so: ${c2.bad.slice(0, 3).join('; ')}` : ''}; as entered ${c2.alike}, a map or a charge on ${c2.alikeCharged}`);

// ---- 3. the app's route ----
const c3 = { units: 0, paths: 0, decisions: 0, notName: 0, apart: 0, worst: 0, worstAt: '', risks: [], ceil: [], riskier: 0, threw: [] };
const routeOf = (plan, label, n = 20, lock = 3) => {
  let cut, cp;
  try {
    cut = cutOf(plan);
    const sc = cut.bands, H = bandsAt(E, sc.k, sc.paOne, () => solveForApp(E, M, cut.hplan, { points: PTS, ageWith: cut.ageWith, research: { ...LIGHT } }), sc.paK);
    cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, takeShapes: TAKES }, { plan: cut.hplan, r: H });
  } catch (e) { c3.threw.push(`${label}: ${e.message.split('\n')[0]}`); return null; }
  c3.units++;
  if (!cp.tierMap) c3.threw.push(`${label}: no tier map`);
  const ctx = solvedContext(E, cp), base = ctx.policyOverride, m = cp.m, T = ctx.totalYears, owners = m.ctx.owners, listOf = (o, cat) => m.ctx.tierProfiles[o.ids[cat]];
  const tiersSeen = [];
  for (let i = 0; i < n; i++) {
    const moves = [], rec = { ...ctx, policyOverride: { ...base, choose(st, t) { const j = base.choose(st, t); moves[t] = j; return j; } } };
    const zs = Float64Array.from(E.pathsForSeed(99003, i + 1, T)[i]);
    try { E.runTrial(rec, zs); } catch (e) { c3.threw.push(`${label} path ${i}: ${e.message.split('\n')[0]}`); continue; }
    c3.paths++;
    for (const [t, j] of moves.entries()) {
      if (!j) continue;
      c3.decisions++;
      for (const o of owners) for (const [cat, key, name] of [['pen', 'tierPen', 'tierPenName'], ['isa', 'tierIsa', 'tierIsaName']]) {
        const k = j.perOwner[o.key][key], L = listOf(o, cat);
        if (k === undefined) continue;
        if (!(k >= 0 && k < L.length) || L[k].name !== j.perOwner[o.key][name] || j.perOwner[o.key][name] !== cp.H.c.tiers[cat][j.ia === undefined ? 0 : cp.H.actions[j.ia][key] || 0].name) c3.notName++;
        else tiersSeen.push([o, cat, L[k].name, t]);
      }
    }
    if (i < lock) {   // the engine and the model in step under the policy's own moves
      const eng = E.freshState(ctx), mod = M.initialState(m), fixed = { ...ctx, policyOverride: { ...base, choose: (st, t) => moves[t] } };
      try { for (let t = 0; t <= T; t++) {
        const gaps = [];
        for (const id of Object.keys(eng.pots)) gaps.push([`pot ${id}`, Math.abs((eng.pots[id] || 0) - (mod.pots[id] || 0))]);
        const re = E.stepYear(fixed, eng, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 }), rm = M.step(m, mod, moves[t], t, ratesAt(m, zs, t));
        for (const k of ['totalCombined', 'taxPaid', 'switchPaid', 'unmetDemand']) gaps.push([k, Math.abs(E.num(re[k], 0) - E.num(rm[k], 0))]);
        for (const [k, g] of gaps) if (!(g <= c3.worst)) { c3.worst = g; c3.worstAt = `${label} path ${i} year ${t}: ${k}`; }
      } } catch (e) { c3.worst = Infinity; c3.worstAt = `${label} path ${i}: threw ${e.message.split('\n')[0]}`; }
    }
  }
  // the household plan's risks: the pension and the ISA at the more cautious, the others at the larger holding's
  const hp = cut.household, acc = (id) => hp.accounts.find(a => a.id === id), hpl = (cat) => cut.hplan.accounts.find(a => a.id === `${cat}_self`);
  for (const cat of ['pen', 'isa', 'other', 'cash']) {
    const x = acc(`${cat}_self`), y = acc(`${cat}_part`), h = hpl(cat);
    if (!x || !y || !h || x.risk === y.risk) continue;
    c3.apart++;
    const want = cat === 'pen' || cat === 'isa' ? (ix(x.risk) >= ix(y.risk) ? x.risk : y.risk) : (E.num(x.balance, 0) > E.num(y.balance, 0) || (E.num(x.balance, 0) === E.num(y.balance, 0) && ix(x.risk) >= ix(y.risk)) ? x.risk : y.risk);
    if (h.risk !== want) c3.risks.push(`${label} ${cat}: ${h.risk}, not ${want}`);
  }
  return { cut, cp, tiersSeen };
};
for (const [ci, sc] of PICK.slice(0, 3).entries()) { const pr = pairs(ci + 1)[ci % 3]; routeOf(planted(sc.plan, pr.pen, pr.isa), `${sc.id} pen ${short(pr.pen[0])}/${short(pr.pen[1])} isa ${short(pr.isa[0])}/${short(pr.isa[1])}`); }
// the partner's own ceilings planted apart (on a couple held at High Risk throughout): each person's wrapper locked to their own
{ const sc = PICK[3], p = planted(sc.plan, ['High Risk', 'High Risk'], ['High Risk', 'High Risk']);
  const ceil = { tierCeiling: { pen: 'Medium Risk', isa: null }, tierCeilingPart: { pen: 'Low Risk', isa: 'Medium/High Risk' } };
  p.solver = { ...(p.solver || {}), locks: { ...((p.solver && p.solver.locks) || {}), ...ceil } };
  const r = routeOf(p, `${sc.id} with the partner's own ceilings`);
  if (r) {
    const got = (r.cut.hplan.solver && r.cut.hplan.solver.locks && r.cut.hplan.solver.locks.tierCeiling) || {};
    if (got.pen !== 'Low Risk' || got.isa !== 'Medium/High Risk') c3.ceil.push(`the household's ceiling pen ${got.pen}, isa ${got.isa} (want Low Risk, Medium/High Risk)`);
    const own = { self: { pen: 'Medium Risk', isa: null }, part: { pen: 'Low Risk', isa: 'Medium/High Risk' } };
    for (const [o, cat, name] of r.tiersSeen) {
      const c = own[o.key][cat], locked = r.cut.household.accounts.find(a => a.id === o.ids[cat]).risk;
      if ((c && ix(name) < ix(c)) || ix(name) < ix(locked)) c3.riskier++;
    }
  } }
ok('3. the app\'s route: the page\'s cut taking the shapes, the household\'s table solved, the household assembled with its tier map, the engine under its own policy accepting every move, each person\'s tier the household\'s by name, the engine and the model in step; the household plan\'s risks the cautious and the larger holding\'s; with the partner\'s own ceilings, the household\'s the stricter and no person ever riskier than their own ceiling or locked risk',
  c3.units === 4 && !c3.threw.length && c3.paths === 80 && c3.notName === 0 && c3.worst <= PENNY && c3.apart > 0 && !c3.risks.length && !c3.ceil.length && c3.riskier === 0,
  `${c3.units} households, ${c3.paths} paths, ${c3.decisions} decisions; tiers not the household's by name ${c3.notName}; the largest gap in step £${c3.worst.toExponential(2)}${c3.worst > PENNY ? ` at ${c3.worstAt}` : ''}; wrappers apart ${c3.apart}${c3.risks.length ? `, held otherwise: ${c3.risks.join('; ')}` : ''}${c3.ceil.length ? `; ${c3.ceil.join('; ')}` : ''}; tiers riskier than a person's ceiling or locked risk ${c3.riskier}${c3.threw.length ? `; refused: ${c3.threw.slice(0, 2).join('; ')}` : ''}`);

// ---- 4. identity ----
{ const plantWas = E.LADDER_PLANT.rule;
  const laddersOf = (plan, tb, rule) => { E.LADDER_PLANT.rule = rule; try { return js(M.prepare(E, plan, tb === 3 ? { tiersBelow: 3 } : {}).ctx.tierProfiles); } finally { E.LADDER_PLANT.rule = plantWas; } };
  let n = 0, ladDiff = 0, hpN = 0, hpDiff = 0; const first = [];
  for (const c of couples) for (const [order, p0] of [['as entered', c.plan], ['its mirror', otherOrder(E, c.plan)]]) {
    const hp = householdPlan(E, p0);
    for (const tb of [2, 3]) { n++; if (laddersOf(hp, tb, plantWas) !== laddersOf(hp, tb, 'noladderadd')) { ladDiff++; if (first.length < 3) first.push(`${c.id} (${order}) ladders at ${tb}`); } }
    let a = null, b = null;
    try { a = js(householdPlanFor(E, hp, { scale: FORM, takeShapes: TAKE_SHAPES })); } catch { a = null; }
    try { b = js(householdPlanFor(E, hp, { scale: FORM, takeShapes: TAKES })); } catch { b = null; }
    if (a !== null) { hpN++; if (a !== b) { hpDiff++; if (first.length < 3) first.push(`${c.id} (${order}) household plan`); } }
  }
  // the risks apart: each person's own ladder kept at the front of theirs (every index of it meaning what it meant), and the
  // app's own rules and today's two-table route as the code before runs them
  let prefixN = 0, prefixDiff = 0; const prefixFirst = [];
  for (const [ci, sc] of PICK.entries()) for (const pr of pairs(ci)) {
    const hp = householdPlan(E, planted(sc.plan, pr.pen, pr.isa));
    for (const tb of [2, 3]) {
      const now = JSON.parse(laddersOf(hp, tb, plantWas)), before = JSON.parse(laddersOf(hp, tb, 'noladderadd'));
      for (const id of Object.keys(before)) { prefixN++; if (js(now[id].slice(0, before[id].length)) !== js(before[id])) { prefixDiff++; if (prefixFirst.length < 2) prefixFirst.push(`${sc.id} ${id} at ${tb}: ${now[id].map(x => short(x.name)).join('/')} against ${before[id].map(x => short(x.name)).join('/')}`); } }
    }
  }
  let rulesPaths = 0, rulesDiff = 0, routeDiff = 0, routeN = 0;
  const run = (ctx, n2) => E.pathsForSeed(99004, n2, ctx.totalYears).map(zs => { const q = E.runTrial(ctx, Float64Array.from(zs)); return [q.survived, q.terminalPotNet, q.lifetimeTax]; });
  for (const [ci, sc] of PICK.slice(0, 4).entries()) {
    const pr = pairs(ci)[1], hp = householdPlan(E, planted(sc.plan, pr.pen, pr.isa));
    const at = (rule) => { E.LADDER_PLANT.rule = rule; try { return js(run(E.buildContext(E.resolveMpaa(E.normalizePlan(hp))), 20)); } finally { E.LADDER_PLANT.rule = plantWas; } };
    rulesPaths += 20; if (at(plantWas) !== at('noladderadd')) rulesDiff++;
  }
  for (const [ci, sc] of PICK.slice(4, 6).entries()) {
    const pr = pairs(ci)[0], hp = cutOf(planted(sc.plan, pr.pen, pr.isa)).household;
    const at = async (rule) => {
      E.LADDER_PLANT.rule = rule;
      try {
        const cp = solveCouple(E, M, hp, { solveOne: (p, o) => solveForApp(E, M, p, { points: 4, ageWith: o.partnerAge0, research: { ...LIGHT } }) });
        return js([await digestOf(tablesOf(cp.tables.self)), await digestOf(tablesOf(cp.tables.part)), run(solvedContext(E, cp), 20)]);
      } finally { E.LADDER_PLANT.rule = plantWas; }
    };
    routeN++; if ((await at(plantWas)) !== (await at('noladderadd'))) routeDiff++;
  }
  ok('4. identity: the risks alike, every couple\'s ladders (as entered and mirrored, two and three steps below) the code before\'s and every household plan taking A\'s shapes the one built without them, byte for byte; the risks apart, every person\'s ladder beginning with the code before\'s, and the app\'s own rules and today\'s two-table route the code before\'s on every path',
    n > 0 && ladDiff === 0 && hpN > 0 && hpDiff === 0 && prefixN > 0 && prefixDiff === 0 && rulesDiff === 0 && routeN === 2 && routeDiff === 0,
    `${n} ladder sets, ${ladDiff} differing; ${hpN} household plans, ${hpDiff} differing${first.length ? ` (${first.join('; ')})` : ''}; the risks apart, ${prefixN} ladders, ${prefixDiff} not beginning with the code before's${prefixFirst.length ? ` (${prefixFirst.join('; ')})` : ''}; the app's own rules on ${rulesPaths} paths of 4 couples apart, ${rulesDiff} couples differing; today's two-table route on ${routeN} couples apart (both tables and 20 paths), ${routeDiff} differing`); }

console.log(fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`);
process.exit(fail ? 1 : 0);
