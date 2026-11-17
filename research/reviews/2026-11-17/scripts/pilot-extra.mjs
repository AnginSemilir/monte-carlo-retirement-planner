/*
 * THE REVIEW'S PILOT, BESIDE (17 Nov; EXPLORATORY, deciding nothing; the review's seeds only). pilot.mjs with these more:
 *   - a unit named `<id>@<variant>` is the panel's unit changed in one way the household library has none of (every couple
 *     of the library is three years apart, retires at one age and has the first person holding more: results-coverage.txt):
 *       gap8    the partner eight years younger than the first person (so the years one pension is locked, and the years
 *               between the two state pensions, grow from three to eight);
 *       penB90  the two pensions' balances and contributions moved so that the partner holds 90% of them (the other
 *               wrappers as they are);
 *       even    the partner the first person's age (no locked year, the state pensions together).
 *     The target is the panel's, not landed again, so the app's rules need not sit near 85% on it.
 *   - the arm HOUSEC: design A with the household plan's basic-rate band for capital gains put right. The engine takes that
 *     band from its own default less the plan's allowance (App.jsx taxParams cgtBandWidth), so the household plan, its
 *     allowance doubled, is given 25,130 where two people have 75,400 (results-bias-table.txt). Here the default is doubled
 *     for the household table's solve alone and put back before anything of the couple's is built.
 *   - the arm H0: design A with no search in the year at all: the household table's one best move at the even split, both
 *     people drawing by it on their own pots and covering each other's shortfall (model.js's couple's year).
 *   - the arms HT0 and HT5: the household's move taken whole from the single solver's own chooser (solve.js chooseAction,
 *     as bridge.js tablePolicy asks it for a single), where the household stands, with the candidate's tie-break above the
 *     estate cap left on in that table (D95; the lead test's audit switches it off): HT0 at the even split, HT5 at whichever
 *     of the five splits the household table values best. No ranking of several moves, no tie rule of the couple's own, no
 *     hold.
 * As pilot.mjs otherwise:
 * One unit of the lead test's panel
 * (research/solver/audit-household.mjs UNITS), solved as that audit solves it, and run by the engine on the same paths under:
 *   K2     the couples' default (solveCouple on APP_COUPLE's share rule with appJoint: LOOKHOLD), as the lead test's K2;
 *   HOUSE  design A as the lead test runs it (research/solver/household.mjs: top three moves, five splits, the tie rule
 *          without the look, the hold);
 *   H1, H6 design A offering the household table's top one and top six moves;
 *   HS9    design A at nine funding splits (0, 0.125, ..., 1);
 *   CEIL   the household's synthetic single plan run as a single under its own table (bridge.js withTable): the world the
 *          household table was solved in, so what the table believes it can do.
 * Beside them: the household table's opening forecast, the two tables' product, each arm's solve seconds and CPU a path.
 * This is not the lead test (HOUSEHOLD.md section 5): other seeds, fewer paths, and no rule. Nothing of seed 7002 is run.
 *   node research/reviews/2026-11-17/scripts/pilot-extra.mjs <unit id>[@variant] [seed 99003] [paths 1500] [points 45] [arms K2,HOUSE,...]
 */
import * as E from '../../../engine.mjs';
import * as M from '../../../../src/solver/model.js';
import * as CPL from '../../../../src/solver/couple.js';
import { solveHousehold, withHousehold, mergedState, householdValue } from '../../../solver/household.mjs';
import { chooseAction } from '../../../../src/solver/solve.js';
import { withTable } from '../../../../src/solver/bridge.js';
import { vecOf } from '../../../../src/solver/grid.js';
import { solveForApp } from '../../../../src/solverApp.js';
import { APP_COUPLE, appJoint } from '../../../../src/solverSettings.js';
import { readPanel, appPlan } from '../../../solver/couple-panel.mjs';
import { readSharePanel } from '../../../solver/share-rules-panel.mjs';
import { armA } from '../../../solver/select-phase4.mjs';
import { runPath } from '../../../solver/audit-phase4.mjs';
import { PANEL_FILE, solverPlan } from '../../../solver/audit-couples.mjs';
import { UNITS, biasesOf } from '../../../solver/audit-household.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEEDS = [99001, 99002, 99003, 99004, 99005];
const [id, seedArg, nArg, ptsArg, armsArg] = process.argv.slice(2);
const seed = Number(seedArg) || 99003, n = Number(nArg) || 1500, pts = Number(ptsArg) || 45, W = 0.02;
if (!SEEDS.includes(seed)) { console.error(`pilot: seed ${seed} is not one of the review's (${SEEDS.join(', ')})`); process.exit(2); }
const [baseId, variant] = String(id).split('@');
const u = UNITS.find(x => x.id === baseId);
if (!u) { console.error(`pilot-extra: ${baseId} is not a unit of the lead test's panel`); process.exit(2); }
const ARMS = (armsArg || 'K2,HOUSE,HOUSEC,CEIL').split(',');
const OUT = process.env.PILOT_OUT || join(HERE, '..', 'units', `pilot-extra-${seed}-${pts}`);   // stored gzipped in the review's folder; the readers take either form
mkdirSync(OUT, { recursive: true });

const U0 = u.panel === 'd4b' ? readPanel(PANEL_FILE).find(x => x.id === baseId) : readSharePanel().find(x => x.id === baseId);
const U = { ...U0, plan: JSON.parse(JSON.stringify(U0.plan)) };
if (variant === 'gap8') U.plan.demographics.currentAgePart = Number(U.plan.demographics.currentAgeSelf) - 8;
else if (variant === 'even') U.plan.demographics.currentAgePart = Number(U.plan.demographics.currentAgeSelf);
else if (variant === 'penB90') {
  const pens = U.plan.accounts.filter(x => x.category === 'Pensions'), bal = pens.reduce((t, x) => t + Number(x.balance || 0), 0), con = pens.reduce((t, x) => t + Number(x.contrib || 0), 0);
  for (const x of pens) { const f = x.owner === 'Partner' ? 0.9 : 0.1; x.balance = bal * f; x.contrib = con * f; }
} else if (variant !== undefined) { console.error(`pilot-extra: the variant '${variant}' is none of gap8, penB90, even`); process.exit(2); }
const a = armA(appPlan(U.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
const hp = solverPlan('CANDC', U.plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
const memo = new Map();
const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
const JOINT = { shareRule: APP_COUPLE.shareRule, ...appJoint() };
const S9 = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

const t0 = Date.now();
const needK2 = ARMS.includes('K2');
const k2 = needK2 ? CPL.solveCouple(E, M, hp, { solveOne, ...JOINT }) : null;
const t1 = Date.now();
const house = solveHousehold(E, M, hp, { solveOne, topK: 3, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
const t2 = Date.now();
const solveSecs = { K2: (t1 - t0) / 1000, HOUSE: (t2 - t1) / 1000 };
// the variants share the household's table (the memo): only the rollout's width differs
const wider = (o) => solveHousehold(E, M, hp, { solveOne, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast, ...o });
// HOUSEC: the household table solved with the capital gains band of two people (the engine's default doubled for that solve alone)
const solveOneC = (p, o) => { const old = E.DEFAULT_CONFIG.basicBandLimit; E.DEFAULT_CONFIG.basicBandLimit = 2 * old; try { return solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } }); } finally { E.DEFAULT_CONFIG.basicBandLimit = old; } };
const tc0 = Date.now();
const houseC = ARMS.includes('HOUSEC') ? solveHousehold(E, M, hp, { solveOne: solveOneC, topK: 3, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast }) : null;
if (houseC) { solveSecs.HOUSEC = (Date.now() - tc0) / 1000; const w = houseC.hm.ctx.P.cgtBandWidth, w0 = house.hm.ctx.P.cgtBandWidth, wc = houseC.m.ctx.P.cgtBandWidth; console.log(`  the capital gains basic band: the household plan's ${w0}, HOUSEC's ${w}, a person's in the couple's model ${wc}`); if (!(Math.abs(w - 2 * wc) < 1e-6) || E.DEFAULT_CONFIG.basicBandLimit !== 50270) { console.error('pilot-extra: the band is not two people\'s, or the default was not put back'); process.exit(3); } }
const cps = { K2: k2, HOUSE: house, HOUSEC: houseC, H0: ARMS.includes('H0') ? wider({ topK: 1, splits: [0.5] }) : null, H1: ARMS.includes('H1') ? wider({ topK: 1 }) : null, H6: ARMS.includes('H6') ? wider({ topK: 6 }) : null, HS9: ARMS.includes('HS9') ? wider({ topK: 3, splits: S9 }) : null };

// HT0, HT5: the household table solved with the candidate's own tie-break above the cap left on, its move the single's chooser's
const solveOneT = (p, o) => solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { ...light } });
const houseT = ARMS.some(x => x === 'HT0' || x === 'HT5') ? solveHousehold(E, M, hp, { solveOne: solveOneT, topK: 1 }) : null;
if (houseT) console.log(`  the household table for HT0 and HT5: the tie-break above the cap ${houseT.H.tieAboveCap} (HOUSE's table ${house.H.tieAboveCap}), the cap ${houseT.H.estateCap}`);
function singlePolicy(cp, splits) {
  const { H, m } = cp, tH = !!(H.c && H.c.acts && H.c.acts.some(a => (a.tierPen || 0) > 0 || (a.tierIsa || 0) > 0));
  const tierName = (cat, k) => (H.c && H.c.tiers && H.c.tiers[cat] && H.c.tiers[cat][k] ? H.c.tiers[cat][k].name : null);
  return {
    kind: 'table',
    choose(engineState, t) {
      const tierHeld = {};
      for (const o of m.ctx.owners) { const h = engineState.tierHeld && engineState.tierHeld[o.key]; tierHeld[o.key] = { pen: h ? h.pen || 0 : 0, isa: h ? h.isa || 0 : 0 }; }
      const state = { pots: { ...engineState.pots }, basis: { ...engineState.giaBasis }, cgtCarry: { ...engineState.cgtCarry }, cumPcls: { ...engineState.cumPcls }, lumpTaken: { ...engineState.lumpSumTaken }, cashIsa: { ...(engineState.cashIsa || {}) }, guard: null, tierHeld };
      const ai = chooseAction(H, vecOf(H.m, mergedState(cp, state)), t, tH ? tierHeld.self : null), a = H.actions[ai];
      const level = H.levelOf ? H.levelOf[ai] : a.spendLevel !== undefined ? a.spendLevel : 1;
      const po = { steps: a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', ...(tH ? { tierPen: a.tierPen || 0, tierIsa: a.tierIsa || 0, tierPenName: tierName('pen', a.tierPen || 0), tierIsaName: tierName('isa', a.tierIsa || 0) } : {}) };
      const mk = split => ({ steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', sweepCash: true, ...(a.sweepIsa ? { sweepIsa: true } : {}), lump: !!a.lump, contrib: null, spendLevel: level, split, switchCost: cp.switchCost || 0, perOwner: { self: { ...po }, part: { ...po } }, ia: ai, ib: ai });
      if (splits.length === 1 || t >= m.ctx.totalYears) return mk(splits.length === 1 ? splits[0] : 0.5);
      let best = null, bs = -Infinity;
      for (const sp of splits) { const j = mk(sp), st = M.cloneState(state), row = M.step(m, st, j, t, null, true); if (row.unmetDemand > 1 || row.preNmpaInsolvent) continue; const v = householdValue(cp, st, t, null, ai); if (v > bs) { bs = v; best = j; } }
      return best || mk(0.5);
    },
    switchCost: cp.switchCost || 0, tiersBelow: cp.tiersBelow || 2
  };
}
const withSingle = (plan, cp, splits) => ({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...plan.spending, policyOverride: singlePolicy(cp, splits) } });
const withAges = (plan) => ({ ...plan, demographics: { ...plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
const ctxOf = (arm) => {
  if (arm === 'K2') return E.buildContext(CPL.withCouple(withAges(k2.plan), k2));
  if (arm === 'HT0') return E.buildContext(withSingle(withAges(houseT.plan), houseT, [0.5]));
  if (arm === 'HT5') return E.buildContext(withSingle(withAges(houseT.plan), houseT, [0, 0.25, 0.5, 0.75, 1]));
  if (arm === 'CEIL') return E.buildContext(withTable(house.hplan, house.H));
  if (arm === 'CEILC') { const old = E.DEFAULT_CONFIG.basicBandLimit; E.DEFAULT_CONFIG.basicBandLimit = 2 * old; try { return E.buildContext(withTable(houseC.hplan, houseC.H)); } finally { E.DEFAULT_CONFIG.basicBandLimit = old; } }
  return E.buildContext(withHousehold(withAges(cps[arm].plan), cps[arm]));
};
const survAt = (tab, s) => (tab.mix ? tab.mix.tables.reduce((x, tb, j) => x + tab.mix.weights[j] * tb.value(s, 0).survival, 0) : tab.value(s, 0).survival);
const st0 = M.initialState(house.m), forecast = { HOUSE: survAt(house.H, vecOf(house.hm, mergedState(house, st0))) };
if (houseC) forecast.HOUSEC = survAt(houseC.H, vecOf(houseC.hm, mergedState(houseC, M.initialState(houseC.m))));
if (k2) { const z0 = M.initialState(k2.m); forecast.K2 = survAt(k2.tables.self, vecOf(k2.tables.self.m, CPL.ownerState(z0, 'self'))) * survAt(k2.tables.part, vecOf(k2.tables.part.m, CPL.ownerState(z0, 'part'))); forecast.K2self = survAt(k2.tables.self, vecOf(k2.tables.self.m, CPL.ownerState(z0, 'self'))); forecast.K2part = survAt(k2.tables.part, vecOf(k2.tables.part.m, CPL.ownerState(z0, 'part'))); }
const bias = biasesOf(house.m), T = house.m.ctx.totalYears;
console.log(`PILOT (EXPLORATORY): ${id} (${u.group}), seed ${seed}, ${n} paths, ${pts} points; solved K2 ${solveSecs.K2.toFixed(0)} s, HOUSE ${solveSecs.HOUSE.toFixed(0)} s; share ${k2 ? k2.share : '-'}; T ${T}; biases: ${bias.lockedYears} locked years, pension share ${bias.penShareSelf.toFixed(2)}; forecasts: household ${forecast.HOUSE.toFixed(4)}, two tables ${k2 ? forecast.K2.toFixed(4) : '-'}`);

const paths = E.pathsForSeed(seed, n, T).map(zs => Float64Array.from(zs));
const arms = {};
for (const arm of ARMS) {
  const ctx = ctxOf(arm);
  if (ctx.totalYears !== T) { console.error(`pilot: ${id} ${arm}: another horizon (${ctx.totalYears}, ${T})`); process.exit(3); }
  const A = { survived: [], failYear: [], wealth: [], estate: [], tax: [], delivered: [], unmet: [] };
  for (let k = 0; k < Math.min(3, n); k++) runPath(ctx, paths[k], false);
  const c0 = process.cpuUsage();
  for (let k = 0; k < n; k++) { const r = runPath(ctx, paths[k], false); A.survived.push(r.survived ? 1 : 0); A.failYear.push(r.failYear); A.wealth.push(Math.round(r.wealth)); A.estate.push(Math.round(r.estate)); A.tax.push(Math.round(r.tax)); A.delivered.push(Math.round(r.delivered)); A.unmet.push(Math.round(r.unmet)); }
  const c = process.cpuUsage(c0), cpuMs = (c.user + c.system) / 1e3 / n;
  arms[arm] = { ...A, cpuMs };
  const s = A.survived.reduce((x, y) => x + y, 0);
  console.log(`  ${arm.padEnd(5)} survival ${(100 * s / n).toFixed(2)}% (${n - s} fail: ${A.failYear.filter((y, i) => !A.survived[i] && y === T).length} in the last year), CPU ${cpuMs.toFixed(1)} ms a path`);
}
writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ id, group: variant ? `${u.group}, ${variant}` : u.group, seed, n, pts, T, cap: k2 ? (k2.tables.self.estateCap || 0) + (k2.tables.part.estateCap || 0) : null, houseCap: house.H.estateCap || 0, floor: house.m.ctx.solvencyFloor, target: hp.spending.targetSpend, share: k2 ? k2.share : null, bias, forecast, solveSecs, arms }));
console.log(`  done ${id} in ${Math.round((Date.now() - t0) / 1000)} s`);
